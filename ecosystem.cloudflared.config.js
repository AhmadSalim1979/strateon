module.exports = {
  apps: [{
    name: 'cloudflared-tunnel',
    script: '/opt/node24/node-v24.13.1-linux-x64/lib/node_modules/cloudflared/bin/cloudflared',
    args: [
      'tunnel',
      '--config', '/tmp/tunnel.yml',
      'run',
      '--token', 'eyJhIjoiODVjMTg5ZDlkZjYwZTFhYjBkMjQyMzcyMjEwMTViNWMiLCJ0IjoiOGMzMWQ0ODYtYmUzMC00OTU0LTkzMmItZDZmMzc3N2I4MjQyIiwicyI6Ik1Ea3lZV0UwWkRjdE9XRXhPUzAwTlRVNUxXSXhOV010TXpjeE5XRXpORGszTW1aaiJ9'
    ],
    cwd: '/tmp',
    interpreter: 'none',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '30s',
    restart_delay: 5000,
    kill_timeout: 10000,
    watch: false
  }]
};
