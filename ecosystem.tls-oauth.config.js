const fs = require('fs');
const path = require('path');

// Load HubSpot OAuth secrets
const hubSecrets = JSON.parse(
  fs.readFileSync('/home/node/.openclaw/secrets/hubspot-oauth.json', 'utf8')
);

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  require('fs').readFileSync('/home/node/.openclaw/.env', 'utf8')
    .split('\n').find(l => l.startsWith('SUPABASE_SERVICE_KEY='))
    .split('=')[1].trim();

module.exports = {
  apps: [
    {
      script: '/home/node/.openclaw/workspace/tls-proxy.js',
      name: 'tls-proxy',
      cwd: '/home/node/.openclaw/workspace',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: 5000,
      restart_delay: 2000
    },
    {
      script: '/home/node/.openclaw/workspace/strateon/followup-engine/hub-oauth-v2.js',
      name: 'hub-oauth',
      cwd: '/home/node/.openclaw/workspace/strateon/followup-engine',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        SUPABASE_URL: 'https://xyzxyzxyz.supabase.co',
        SUPABASE_SERVICE_KEY: SUPABASE_SERVICE_KEY,
        HUBSPOT_CLIENT_ID: hubSecrets.clientId,
        HUBSPOT_CLIENT_SECRET: hubSecrets.clientSecret,
        HUBSPOT_REDIRECT_URI: 'https://oauth.qiyadon.com/hubspot/callback',
        DRY_RUN: 'true',
        GLOBAL_ENABLED: 'false',
        SEND_EMAILS: 'false'
      },
      watch: false,
      autorestart: true
    }
  ]
};