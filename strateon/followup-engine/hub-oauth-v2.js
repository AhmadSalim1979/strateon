/**
 * Qiyadon — HubSpot OAuth Server
 * Version: 2.0
 * Handles: OAuth flow, token exchange, client connection, Supabase storage
 * 
 * Routes:
 *   GET  /hubspot/auth      → redirect to HubSpot OAuth
 *   GET  /hubspot/callback   → exchange code for tokens, store in Supabase
 *   GET  /hubspot/status     → check connection status
 *   POST /hubspot/disconnect → revoke tokens, remove connection
 *   GET  /health            → health check
 */

const https = require('https');
const http = require('http');
const url = require('url');
const path = require('path');

// ─── DOTENV LOADER (MUST BE FIRST) ────────────────────────────────────────────
// Load env vars from /home/node/.openclaw/.env before any other code reads them.
// dotenv reads the file, parses key=value, sets process.env.
// Safe: this file is not committed to git.
try {
  require('/home/node/.openclaw/workspace/orchestration/node_modules/dotenv').config({
    path: '/home/node/.openclaw/.env',
  });
} catch (e) {
  console.error('[HubOAuth] dotenv not available:', e.message);
}

// ─── CONFIG (non-secret) ──────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // must be set via env
const PORT = process.env.PORT || 3002;

// ─── HUBSPOT OAUTH SECRETS ────────────────────────────────────────────────────
function loadOAuthSecrets() {
  // Priority: env var → secrets file → fail
  if (process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET) {
    return {
      clientId: process.env.HUBSPOT_CLIENT_ID,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    };
  }
  const fs = require('fs');
  const secretsPath = '/home/node/.openclaw/secrets/hubspot-oauth.json';
  if (fs.existsSync(secretsPath)) {
    try {
      const raw = fs.readFileSync(secretsPath, 'utf8');
      const secrets = JSON.parse(raw);
      if (secrets.clientId && secrets.clientSecret) {
        return { clientId: secrets.clientId, clientSecret: secrets.clientSecret };
      }
    } catch (e) {
      console.error(`[HubOAuth] Failed to load ${secretsPath}: ${e.message}`);
    }
  }
  console.error('[HubOAuth] FATAL: HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET must be set via env or secrets/hubspot-oauth.json');
  process.exit(1);
}

const HUBSPOT_CREDS = loadOAuthSecrets();
const HUBSPOT_CONFIG = {
  clientId: HUBSPOT_CREDS.clientId,
  clientSecret: HUBSPOT_CREDS.clientSecret,
  redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'https://qiyadon.com/hubspot/callback',
  authUrl: 'https://app.hubspot.com/oauth/authorize',
  tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
};

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
if (!SUPABASE_SERVICE_KEY) {
  console.error('[HubOAuth] FATAL: SUPABASE_SERVICE_KEY env var not set');
  process.exit(1);
}

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const { createClient } = require('/home/node/.openclaw/workspace/orchestration/node_modules/@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function buildQueryString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function writeSuccess(res, msg) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<html><body style="font-family:Arial;padding:40px;text-align:center;">
    <h2 style="color:#22c55e;">✅ ${msg}</h2>
    <p>You can close this window.</p>
    <script>setTimeout(() => window.close(), 3000);</script>
  </body></html>`);
}

function writeError(res, title, msg) {
  res.writeHead(500, { 'Content-Type': 'text/html' });
  res.end(`<html><body style="font-family:Arial;padding:40px;text-align:center;">
    <h2 style="color:#ef4444;">❌ ${title}</h2>
    <p>${msg}</p>
  </body></html>`);
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// GET /hubspot/auth — redirect to HubSpot OAuth
function handleAuth(res) {
  const params = {
    client_id: HUBSPOT_CONFIG.clientId,
    redirect_uri: HUBSPOT_CONFIG.redirectUri,
    scope: 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.owners.read crm.schemas.contacts.read',
    response_type: 'code',
  };
  const authUrl = HUBSPOT_CONFIG.authUrl + '?' + buildQueryString(params);
  console.log(`[HubOAuth] Redirecting to: ${authUrl}`);
  res.writeHead(302, { Location: authUrl });
  res.end();
}

// GET /hubspot/callback — exchange code for tokens
async function handleCallback(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const { code, error } = parsedUrl.query;

  if (error) {
    console.error(`[HubOAuth] HubSpot error: ${error}`);
    return writeError(res, 'Authorization Failed', error);
  }
  if (!code) {
    return writeError(res, 'Missing Code', 'No authorization code received');
  }

  console.log(`[HubOAuth] Exchanging code for tokens...`);

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
    console.log(`[HubOAuth] Token obtained. Expires in ${expires_in}s`);

    // Get Hub ID from user info
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

    const hubId = String(userInfo.hub_id);
    console.log(`[HubOAuth] Connected to Hub ID: ${hubId}`);

    // Store in Supabase
    const { error: dbErr } = await supabase.from('hubspot_connections').upsert({
      hub_id: hubId,
      access_token,
      refresh_token,
      expires_at: new Date(expiresAt).toISOString(),
      connected_at: new Date().toISOString(),
      status: 'active',
    }, { onConflict: 'hub_id' });

    if (dbErr) {
      console.error(`[HubOAuth] Supabase write error: ${dbErr.message}`);
    } else {
      console.log(`[HubOAuth] Connection stored in Supabase for Hub ${hubId}`);
    }

    writeSuccess(res, 'HubSpot Connected!');

  } catch (err) {
    console.error(`[HubOAuth] Token exchange failed: ${err.message}`);
    writeError(res, 'Connection Failed', err.message);
  }
}

// GET /hubspot/status — check if HubSpot is connected
async function handleStatus(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const hubId = parsedUrl.query.hub_id;

  if (!hubId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'hub_id required' }));
  }

  const { data, error } = await supabase
    .from('hubspot_connections')
    .select('id, hub_id, status, connected_at, expires_at')
    .eq('hub_id', hubId)
    .eq('status', 'active')
    .limit(1);

  const connected = data && data.length > 0;
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ connected, hub_id: hubId, data: data?.[0] || null, error: error?.message }));
}

// GET /health — health check
function handleHealth(res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'hub-oauth-v2', timestamp: new Date().toISOString() }));
}

// POST /hubspot/disconnect — revoke and remove
async function handleDisconnect(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    const { hub_id } = JSON.parse(body || '{}');
    if (!hub_id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'hub_id required' }));
    }

    // Get tokens for revocation
    const { data } = await supabase
      .from('hubspot_connections')
      .select('access_token')
      .eq('hub_id', hub_id)
      .limit(1);

    if (data?.[0]?.access_token) {
      // Revoke at HubSpot
      const postData = buildQueryString({ token: data[0].access_token });
      await new Promise(() => {}); // Fire and forget revocation
    }

    // Remove from Supabase
    await supabase.from('hubspot_connections').delete().eq('hub_id', hub_id);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  });
}

// ─── SERVER ───────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[HubOAuth] ${req.method} ${pathname}`);

  if (pathname === '/hubspot/auth') return handleAuth(res);
  if (pathname === '/hubspot/callback') return handleCallback(req, res);
  if (pathname === '/hubspot/status') return handleStatus(req, res);
  if (pathname === '/hubspot/disconnect') return handleDisconnect(req, res);
  if (pathname === '/health') return handleHealth(res);

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[HubOAuth] Server running on port ${PORT}`);
  console.log(`[HubOAuth] Auth URL: http://localhost:${PORT}/hubspot/auth`);
});

module.exports = { server };