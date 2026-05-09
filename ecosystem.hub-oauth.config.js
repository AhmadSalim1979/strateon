// ecosystem.hub-oauth.config.js
// Safe deployment: non-secret env vars only. Secrets loaded from secrets files at runtime.
// SECRETS must NOT be committed to this file.
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
      // Non-secrets only — OK to commit
      SUPABASE_URL: 'https://btrbczqjwzuybgcxckvm.supabase.co',
      HUBSPOT_REDIRECT_URI: 'https://qiyadon.com/hubspot/callback',
      // Secrets loaded at runtime from:
      //   - /home/node/.openclaw/secrets/hubspot-oauth.json (HUBSPOT_CLIENT_ID, HUBSPOT_CLIENT_SECRET)
      //   - /home/node/.openclaw/.env (SUPABASE_SERVICE_KEY — already committed, key value redacted)
    }
  }]
};
