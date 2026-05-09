// ecosystem.hub-oauth.config.js
// PM2 ecosystem config for hub-oauth-v2.js
// Safe deployment: env vars only, no hardcoded secrets in code
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
      // Supabase
      SUPABASE_URL: 'https://btrbczqjwzuybgcxckvm.supabase.co',
      SUPABASE_SERVICE_KEY: 'sb_secret__T1GYuCAvox2_EQXrRwGLg_yXXI-GvS',
      // HubSpot OAuth credentials
      HUBSPOT_CLIENT_ID: '0406fdac-4344-43dd-8d4d-d89957d68e7d',
      HUBSPOT_CLIENT_SECRET: '5f58038a-7572-42eb-a31f-a7df50618148',
      HUBSPOT_REDIRECT_URI: 'https://qiyadon.com/hubspot/callback',
    }
  }]
};
