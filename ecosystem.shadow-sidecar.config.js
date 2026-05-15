/**
 * Shadow Sidecar PM2 Ecosystem Config
 * File: /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js
 *
 * Start: pm2 start /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js
 * Stop:  pm2 stop instruction-sidecar-shadow
 * Delete: pm2 delete instruction-sidecar-shadow
 * Logs:  pm2 logs instruction-sidecar-shadow --lines 20 --nostream
 */

const { createClient } = require('/home/node/.openclaw/workspace/orchestration/node_modules/@supabase/supabase-js');
const fs = require('fs');

// Load SUPABASE_SERVICE_KEY from moosa-worker ecosystem config
let SUPABASE_SERVICE_KEY = '';
try {
  const mConfig = fs.readFileSync('/home/node/.openclaw/workspace/moosa-worker/ecosystem.config.js', 'utf8');
  const keyMatch = mConfig.match(/SUPABASE_SERVICE_KEY:\s*['\"]([^'\"]+)['\"]/);
  if (keyMatch) SUPABASE_SERVICE_KEY = keyMatch[1];
} catch (e) {
  console.warn('[shadow] Could not load SUPABASE_SERVICE_KEY from moosa-worker config:', e.message);
}

module.exports = {
  apps: [
    {
      name: 'instruction-sidecar-shadow',
      script: '/home/node/.openclaw/workspace/ops/instruction-sidecar-shadow.js',
      cwd: '/home/node/.openclaw/workspace',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        SUPABASE_URL: 'https://btrbczqjwzuybgcxckvm.supabase.co',
        SUPABASE_SERVICE_KEY: SUPABASE_SERVICE_KEY,
      },
      autorestart: true,
      max_restarts: 3,
      expire_max_restarts_timeout: 30000,
      kill_timeout: 5000,
      restart_delay: 1000,
      exit_graceful: false,
    },
  ],
};