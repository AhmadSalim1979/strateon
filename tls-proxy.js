/**
 * TLS Proxy for hub-oauth
 * Terminates Cloudflare Origin CA TLS on port 3003
 * Forwards plain HTTP to the OAuth server on port 3004
 */
const https = require('https');
const http = require('http');
const fs = require('fs');

const LISTEN_PORT = 3003;
const FORWARD_PORT = 3004;
const CERT_FILE = '/home/node/.openclaw/workspace/keys/oauth-origin-cert.pem';
const KEY_FILE = '/home/node/.openclaw/workspace/keys/oauth-origin-key.pem';

const server = https.createServer({
  cert: fs.readFileSync(CERT_FILE),
  key: fs.readFileSync(KEY_FILE),
}, (req, res) => {
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: FORWARD_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  req.pipe(proxyReq);
  proxyReq.on('error', (e) => {
    res.writeHead(502);
    res.end('Proxy error: ' + e.message);
  });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[TLS-Proxy] HTTPS listening on ${LISTEN_PORT}, forwarding HTTP to ${FORWARD_PORT}`);
});