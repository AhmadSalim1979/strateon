module.exports = {
  apps: [{
    name: 'strateon-followup-engine',
    script: './followup-engine.js',
    cwd: '/home/node/.openclaw/workspace/strateon/followup-engine',
    instances: 1,
    autorestart: true,
    watch: false,
    cron_restart: '0 * * * *', // Run every hour on the hour
    env: {
      NODE_ENV: 'production',
      TZ: 'Europe/Berlin',
    },
    // PM2 cron format: min hour day month weekday
    // "0 * * * *" = top of every hour
    // To use system cron instead of PM2 cron, remove cron_restart and use: pm2 start ecosystem-followup.config.js --cron "0 * * * *"
  }]
};