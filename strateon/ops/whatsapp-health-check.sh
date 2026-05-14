#!/bin/bash
# whatsapp-health-check.sh
# Monitors WhatsApp connection stability on openclaw-gateway

LOG_FILE="/root/.pm2/logs/openclaw-gateway-out.log"
ALERT_THRESHOLD=10  # If we see >10 reconnect attempts in 5min window, alert
WINDOW_LINES=200     # How many tail lines to check

# Get last N lines containing reconnect/connection keywords
RECENT=$(tail -n $WINDOW_LINES "$LOG_FILE" 2>/dev/null | grep -iE "reconnect|connection.* whatsapp|whatsapp.* disconnect|whatsapp.* error|whatsapp.* closed|session.* invalid" | wc -l)

if [ "$RECENT" -gt "$ALERT_THRESHOLD" ]; then
  echo "FLAPPING ALERT: $RECENT WhatsApp reconnect events detected in last $WINDOW_LINES log lines"
  # Alert via WhatsApp via the internal messaging
  node -e "
const { sendWhatsAppMessage } = require('/home/node/.openclaw/workspace/strateon/csuite/CEO/whatsapp-client.js');
sendWhatsAppMessage('+923215139934', '🚨 WhatsApp FLAPPING AGAIN: $RECENT reconnect events detected. Action required.').catch(console.error);
" 2>/dev/null || echo "ALERT: WhatsApp flapping detected ($RECENT events)"
  exit 1
else
  echo "OK: WhatsApp stable ($RECENT reconnect events in window)"
  exit 0
fi