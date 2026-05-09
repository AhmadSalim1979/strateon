/**
 * Qiyadon — HubSpot OAuth Server
 * Handles: OAuth flow, token exchange, client connection
 * Routes:
 *   GET  /hubspot/auth          → redirect to HubSpot OAuth
 *   GET  /hubspot/callback      → exchange code for tokens, store in Supabase
 *   GET  /hubspot/status        → check connection status for logged-in client
 *   POST /hubspot/disconnect    → revoke tokens, remove connection
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const HUBSPOT_CONFIG = {
  clientId: '0406fdac-4344-43dd-8d4d-d89957d68e7d',
  clientSecret: '5f58038a-7572-42eb-a31f-a7df50618148',
  redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'https://qiyadon.com/hubspot/callback',
  authUrl: 'https://app.hubspot.com/oauth/authorize',
  tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
};

// Supabase (same as orchestration)
const SUPABASE_URL = 'https://btrbczqjwzuybgcxckvm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// In-memory session store (production: use Redis)
const tokenStore = {}; // { clientId: { accessToken, refreshToken, expiresAt } }

const PORT = process.env.PORT || 3002;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function supabaseRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function buildQueryString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// GET /hubspot/auth — redirect to HubSpot OAuth
function handleAuth(req, res) {
  const params = {
    client_id: HUBSPOT_CONFIG.clientId,
    redirect_uri: HUBSPOT_CONFIG.redirectUri,
    scope: 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.owners.read crm.schemas.contacts.read',
    response_type: 'code',
  };
  const url = HUBSPOT_CONFIG.authUrl + '?' + buildQueryString(params);
  console.log(`[HubSpot OAuth] Redirecting to: ${url}`);
  res.writeHead(302, { Location: url });
  res.end();
}

// GET /hubspot/callback — exchange code for tokens
async function handleCallback(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    console.error(`[HubSpot OAuth] Error from HubSpot: ${error}`);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<html><body><h2>HubSpot OAuth Error: ${error}</h2><p>Please try again or contact support@qiyadon.com</p></body></html>`);
    return;
  }

  if (!code) {
    res.writeHead(400);
    res.end('Missing authorization code');
    return;
  }

  console.log(`[HubSpot OAuth] Received code, exchanging for tokens...`);

  try {
    // Exchange code for tokens
    const postData = buildQueryString({
      grant_type: 'authorization_code',
      client_id: HUBSPOT_CONFIG.clientId,
      client_secret: HUBSPOT_CONFIG.clientSecret,
      redirect_uri: HUBSPOT_CONFIG.redirectUri,
      code,
    });

    const tokenResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.hubapi.com',
        port: 443,
        path: '/oauth/v1/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(data)); }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (tokenResponse.error) {
      throw new Error(tokenResponse.error_description || tokenResponse.error);
    }

    const { access_token, refresh_token, expires_in } = tokenResponse;
    const expiresAt = Date.now() + (expires_in * 1000);

    console.log(`[HubSpot OAuth] Token obtained. Expires in ${expires_in}s`);

    // Get user info to identify the account
    const userInfo = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.hubapi.com',
        port: 443,
        path: '/oauth/v1/userinfo',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${access_token}` }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(data)); }
        });
      });
      req.on('error', reject);
      req.end();
    });

    const hubId = userInfo.hub_id;
    console.log(`[HubSpot OAuth] Connected to Hub ID: ${hubId}`);

    // Store tokens in Supabase
    await supabaseRequest('POST', '/rest/v1/hubspot_connections', {
      hub_id: String(hubId),
      access_token,
      refresh_token,
      expires_at: new Date(expiresAt).toISOString(),
      connected_at: new Date().toISOString(),
      status: 'active',
    });

    // Show success page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<html>
      <body style="font-family:Arial;padding:40px;text-align:center;">
        <h2 style="color:#22c55e;">✅ HubSpot Connected!</h2>
        <p>Your HubSpot account has been successfully linked to Qiyadon.</p>
        <p>You can now close this window and return to your dashboard.</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body>
    </html>`);

  } catch (err) {
    console.error(`[HubSpot OAuth] Token exchange failed: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<html><body><h2>Connection Failed</h2><p>${err.message}</p></body></html>`);
  }
}

// GET /hubspot/status — check if HubSpot is connected for a client
async function handleStatus(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const clientId = url.searchParams.get('client_id');

  if (!clientId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'client_id required' }));
    return;
  }

  try {
    const result = await supabaseRequest('GET', `/rest/v1/hubspot_connections?hub_id=eq.${clientId}&status=eq.active&limit=1`);
    const connected = result && result.length > 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connected, client_id: clientId }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// GET /hub/auth — simple health check
function handleHealth(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'hub-oauth' }));
}

// ─── SERVER ───────────────────────────────────────────────────────────────────
const http = require('http');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);

  console.log(`[HubOAuth] ${req.method} ${url.pathname}`);

  if (url.pathname === '/hubspot/auth') return handleAuth(req, res);
  if (url.pathname === '/hubspot/callback') return handleCallback(req, res);
  if (url.pathname === '/hubspot/status') return handleStatus(req, res);
  if (url.pathname === '/health') return handleHealth(req, res);

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[HubOAuth] Server running on port ${PORT}`);
  console.log(`[HubOAuth] Auth URL: http://localhost:${PORT}/hubspot/auth`);
});

module.exports = { server };