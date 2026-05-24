module.exports = {
  apps: [
    {
      name: 'bridge-receiver',
      script: '/home/node/.openclaw/workspace/ops/bridge-receiver.js',
      cwd: '/home/node/.openclaw/workspace/ops',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      min_uptime: 10000,
      watch: false,
      kill_timeout: 5000,
      instance_var: 'BRIDGE_INSTANCE',
      env: {
        NODE_ENV: 'production',
        BRIDGE_PORT: '3099'
      }
    }
  ]
};