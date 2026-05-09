module.exports = {
  apps: [
    {
      name: 'strateon-followup-engine',
      script: './followup-engine.js',
      cwd: '/home/node/.openclaw/workspace/strateon/followup-engine',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,

      // ── CRON SCHEDULE ──────────────────────────────────────────────────────
      // Run every hour, top of the hour, Berlin time (Europe/Berlin TZ)
      // PM2 cron format: min hour day month weekday
      cron_restart: '0 * * * *', // top of every hour

      // ── SAFETY FLAGS — All default to BLOCKING ──────────────────────────────
      // These MUST be explicitly set to 'true' to enable email sending.
      // DO NOT set these in production without completing the GO/NO-GO gate checklist.
      //
      // Enable live sending (after all gates pass — sequential, one at a time):
      //   Step 1: pm2 set strateon-followup-engine:GLOBAL_ENABLED true
      //   Step 2: pm2 set strateon-followup-engine:DRY_RUN false
      //   Step 3: pm2 set strateon-followup-engine:SEND_EMAILS true
      //
      // After any PM2 restart, all flags revert to defaults (safe) unless explicitly set.
      // Confirmation after each step: check engine log at logs/stdout.log

      env: {
        NODE_ENV: 'production',
        TZ: 'Europe/Berlin',

        // DRY_RUN: defaults to 'true' (safe) — engine runs in dry-run, no emails sent
        // To disable dry-run: pm2 set strateon-followup-engine:DRY_RUN false
        // If unset or any non-'false' value → dry-run is ON
        DRY_RUN: process.env.DRY_RUN || 'true',

        // GLOBAL_ENABLED: defaults to 'false' (safe) — global kill switch is OFF
        // To enable: pm2 set strateon-followup-engine:GLOBAL_ENABLED true
        // If unset or any non-'true' value → kill switch is OFF
        GLOBAL_ENABLED: process.env.GLOBAL_ENABLED || 'false',

        // SEND_EMAILS: defaults to 'false' (safe) — nodemailer transmit is blocked
        // To enable: pm2 set strateon-followup-engine:SEND_EMAILS true
        // If unset or any non-'true' value → sending is blocked
        SEND_EMAILS: process.env.SEND_EMAILS || 'false',

        // Supabase
        SUPABASE_URL: 'https://btrbczqjwzuybgcxckvm.supabase.co',
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '', // loaded from shell env at pm2 start — not hardcoded
      },

      // ── LOGGING ─────────────────────────────────────────────────────────────
      out_file: '/home/node/.openclaw/workspace/strateon/followup-engine/logs/stdout.log',
      err_file: '/home/node/.openclaw/workspace/strateon/followup-engine/logs/stderr.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // ── RESTART POLICY ──────────────────────────────────────────────────────
      exp_backoff_restart_delay: 100, // Exponential backoff on crashes
      max_restarts: 10,
      min_uptime: '30s',
    },
  ],
};