// ecosystem.hub-oauth.config.js
// PM2 ecosystem for hub-oauth-v2.js
//
// SAFE STARTUP (required order):
//   1. Set SUPABASE_SERVICE_KEY in shell:
//        export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY /home/node/.openclaw/.env | cut -d= -f2)
//   2. Start via:
//        pm2 start ecosystem.hub-oauth.config.js
//
// This file contains ONLY non-secret config.
// SUPABASE_SERVICE_KEY is loaded from /home/node/.openclaw/.env at PM2 start time.

module.exports = {
  apps: [{
    name: 'hub-oauth',
    script: './strateon/followup-engine/hub-oauth-v2.js',
    cwd: '/home/node/.openclaw/workspace',
    instances: 1,
    autorestart: true,
    watch: false,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3003,
      SUPABASE_URL: 'https://btrbczqjwzuybgcxckvm.supabase.co',
      HUBSPOT_REDIRECT_URI: 'https://oauth.qiyadon.com/hubspot/callback',
      // NOTE: SUPABASE_SERVICE_KEY must be set in shell env before `pm2 start`.
      // Run this first:
      //   export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY /home/node/.openclaw/.env | cut -d= -f2)
    }
  }]
};
