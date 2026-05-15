/**
 * Shadow Sidecar PM2 Ecosystem Config
 * File: /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js
 *
 * Start: pm2 start /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js
 * Stop:  pm2 stop instruction-sidecar-shadow
 * Delete: pm2 delete instruction-sidecar-shadow
 * Logs:  pm2 logs instruction-sidecar-shadow --lines 20 --nostream
 */

module.exports = {
  apps: [
    {
      name: 'instruction-sidecar-shadow',
      script: '/ops/instruction-sidecar-shadow.js',
      cwd: '/home/node/.openclaw/workspace',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        // SUPABASE_URL and SUPABASE_SERVICE_KEY loaded from moosa-worker env
        // or from /home/node/.openclaw/secrets/ environment injection
        SUPABASE_URL: process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co',
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
      },
      autorestart: true,
      max_restarts: 3,
      expire_max_restarts_timeout: 30000,
      kill_timeout: 5000,
      // Watch for crashes — restart_policy: 3 consecutive failures → alert
      restart_delay: 1000,
      // Don't restart if process exits cleanly (shouldn't happen — loop runs forever)
      exit_graceful: false,
    },
  ],
};