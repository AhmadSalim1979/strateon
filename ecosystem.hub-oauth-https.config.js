const fs = require('fs');

module.exports = {
  apps: [{
    script: 'hub-oauth-v2.js',
    name: 'hub-oauth-https',
    cwd: '/home/node/.openclaw/workspace/strateon/followup-engine',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3443,
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://xyzxyzxyz.supabase.co',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
      HUBSPOT_CLIENT_ID: process.env.HUBSPOT_CLIENT_ID || '0406fdac-4344-43dd-8d4d-d89957d68e7d',
      HUBSPOT_CLIENT_SECRET: process.env.HUBSPOT_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
      HUBSPOT_REDIRECT_URI: 'https://oauth.qiyadon.com/hubspot/callback',
      DRY_RUN: 'true',
      GLOBAL_ENABLED: 'false',
      SEND_EMAILS: 'false'
    },
    https: {
      key: fs.readFileSync('/home/node/.openclaw/workspace/keys/oauth-key.pem'),
      cert: fs.readFileSync('/home/node/.openclaw/workspace/keys/oauth-cert.pem')
    },
    watch: false,
    autorestart: true
  }]
};
