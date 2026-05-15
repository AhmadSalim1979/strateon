module.exports = {
  "script": "server.js",
  "name": "qiyadon-audit-form",
  "cwd": "/home/node/.openclaw/workspace",
  "env": {
    "PORT": 3001,
    "NODE_ENV": "production"
  },
  "instances": 1,
  "exec_mode": "fork",
  "autorestart": true,
  "watch": false,
  "max_memory_restart": "256M"
};