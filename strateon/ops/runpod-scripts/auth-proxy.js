/**
 * auth-proxy.js — Phase D GPU Brain Auth Proxy
 * 
 * File location on RunPod GPU node: /workspace/auth-proxy.js
 * 
 * Security: Ollama has no built-in auth. This proxy validates Bearer tokens
 * before forwarding any request to Ollama on localhost.
 * 
 * Ports:
 *   127.0.0.1:11434 — Ollama (localhost only, not public)
 *   0.0.0.0:11440   — Auth proxy (public during GPU window)
 * 
 * Startup: nohup node /workspace/auth-proxy.js > /workspace/proxy.log 2>&1 &
 * 
 * Usage: curl -H "Authorization: Bearer <token>" http://<pod-ip>:11440/api/tags
 */

const http = require('http');
const fs = require('fs');

const PROXY_PORT = parseInt(process.env.PROXY_PORT || '11440', 10);
const OLLAMA_HOST = process.env.OLLAMA_HOST || '127.0.0.1';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434', 10);
const TOKEN_FILE = process.env.TOKEN_FILE || '/workspace/gpu-api-token.txt';

let validToken = null;

// Load token from file
function loadToken() {
  try {
    validToken = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    console.log(`[${new Date().toISOString()}] Token loaded from ${TOKEN_FILE}`);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Failed to load token from ${TOKEN_FILE}: ${e.message}`);
    process.exit(1);
  }
}

// Validate token
function isValidToken(token) {
  return token && token === validToken;
}

// Forward request to Ollama
function forwardToOllama(req, res) {
  const options = {
    hostname: OLLAMA_HOST,
    port: OLLAMA_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'host': `${OLLAMA_HOST}:${OLLAMA_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error(`[${new Date().toISOString()}] Ollama unreachable: ${e.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ollama unreachable' }));
  });

  req.pipe(proxyReq, { end: true });
}

// Main server
const server = http.createServer((req, res) => {
  // Skip health check paths that don't need auth
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('GPU brain auth proxy OK');
    return;
  }

  // Extract Bearer token
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!isValidToken(token)) {
    console.log(`[${new Date().toISOString()}] Rejected: invalid or missing token from ${req.socket.remoteAddress}`);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  // Token valid — forward to Ollama
  console.log(`[${new Date().toISOString()}] Forwarding: ${req.method} ${req.url}`);
  forwardToOllama(req, res);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Auth proxy active on 0.0.0.0:${PROXY_PORT}`);
  console.log(`[${new Date().toISOString()}] Ollama target: ${OLLAMA_HOST}:${OLLAMA_PORT}`);
});

server.on('error', (e) => {
  console.error(`[${new Date().toISOString()}] Server error: ${e.message}`);
  process.exit(1);
});

// Reload token every 60 seconds (in case it changes)
setInterval(loadToken, 60000);
loadToken();