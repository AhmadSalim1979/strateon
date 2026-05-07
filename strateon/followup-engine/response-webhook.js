/**
 * Qiyadon — Follow-Up Engine: Response Webhook
 * Version: 1.0
 * Role: CPO — Chief Product Development Officer
 * 
 * This endpoint receives notifications when a lead replies to a follow-up email.
 * It looks up the contact in HubSpot and marks strtn_response_received=yes,
 * which stops the cadence loop for that lead (they're alive).
 * 
 * Usage: POST /
 * Body: { email: string, subject?: string, snippet?: string }
 * 
 * Run: node response-webhook.js
 * Port: 3002 (configurable via PORT env)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;
const HUBSPOT_API_KEY = process.env.HUBSPOT_KEY || 'HUBSPOT_KEY_PLACEHOLDER';
const LOG_DIR = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ─── HUBSPOT API WRAPPER ──────────────────────────────────────────────────────
function hubspotRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.hubapi.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function findContactByEmail(email) {
  // Search by email using HubSpot CRM API v3 search
  const result = await hubspotRequest('POST', '/crm/v3/objects/contacts/search', {
    filterGroups: [{
      filters: [{
        propertyName: 'email',
        operator: 'EQ',
        value: email,
      }],
    }],
    properties: ['email', 'firstname', 'lastname', 'company', 'strtn_response_received'],
    limit: 1,
  });
  return result.results && result.results.length > 0 ? result.results[0] : null;
}

async function markResponseReceived(contactId) {
  // Update strtn_response_received property
  // NOTE: HubSpot CRM API v3 uses PATCH (not POST) to update contact properties
  // POST to /contacts/{id} creates associated objects (notes, emails, etc.)
  const result = await hubspotRequest('PATCH', `/crm/v3/objects/contacts/${contactId}`, {
    properties: {
      strtn_response_received: 'yes',
    },
  });
  return result;
}

// ─── LOGGING ────────────────────────────────────────────────────────────────────
function log(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const line = JSON.stringify(entry) + '\n';
  const today = new Date().toISOString().slice(0, 10);
  const logFile = path.join(LOG_DIR, `${today}-webhook.log`);
  fs.appendFileSync(logFile, line);
  console.log(`[${level.toUpperCase()}] ${message}`, meta);
}

// ─── HTTP SERVER ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/followup-response') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json');
      try {
        const { email, subject, snippet } = JSON.parse(body);

        if (!email) {
          res.writeHead(400, JSON.stringify({ error: 'Missing required field: email' }));
          res.end();
          return;
        }

        log('INFO', 'Response webhook received', { email, subject: subject || '' });

        // 1. Find contact in HubSpot
        const contact = await findContactByEmail(email);
        if (!contact) {
          log('WARN', 'Contact not found in HubSpot', { email });
          res.writeHead(404, JSON.stringify({ error: 'Contact not found', email }));
          res.end();
          return;
        }

        // 2. Mark response received
        await markResponseReceived(contact.id);
        log('INFO', 'Contact marked as responded', {
          email,
          contactId: contact.id,
          subject: subject || '',
        });

        // 3. Return success
        res.writeHead(200, JSON.stringify({
          success: true,
          contact: email,
          message: 'Response marked received',
        }));
        res.end();

      } catch (err) {
        log('ERROR', 'Webhook error', { error: err.message });
        res.writeHead(500, JSON.stringify({ error: err.message }));
        res.end();
      }
    });
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, JSON.stringify({ status: 'ok', service: 'response-webhook' }));
    res.end();
    return;
  }

  res.writeHead(404, JSON.stringify({ error: 'Not found' }));
  res.end();
});

server.listen(PORT, () => {
  console.log(`Response Webhook listening on port ${PORT}`);
  log('INFO', `Response webhook started`, { port: PORT });
});

server.on('error', (err) => {
  console.error('Server error:', err);
  log('ERROR', 'Server failed to start', { error: err.message });
});
