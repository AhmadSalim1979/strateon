#!/bin/bash
# uptime-monitor.sh
# Pings key endpoints and alerts if any are down

ALERT_THRESHOLD=1
WEBHOOK_SECRET="jACy9uSs7legs2A-CYYS9Xtvfz8hf5bEma6NqApoIGk"

ENDPOINTS=(
  "https://qiyadon.com/"
  "https://api.qiyadon.com/submit-signature"
  "https://qiyadon.com/pricing"
  "https://qiyadon.com/sign-trial"
)

FAILED=()

for endpoint in "${ENDPOINTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$endpoint" 2>/dev/null)
  if [ "$STATUS" -ne 200 ] && [ "$STATUS" -ne 301 ] && [ "$STATUS" -ne 302 ]; then
    FAILED+=("$endpoint (HTTP $STATUS)")
  fi
done

if [ ${#FAILED[@]} -ge $ALERT_THRESHOLD ]; then
  echo "ALERT: ${#FAILED[@]} endpoint(s) down: ${FAILED[*]}"
  # Notify via internal WhatsApp alert script if available, otherwise just log
  node -e "
const { sendWhatsAppMessage } = require('/home/node/.openclaw/workspace/strateon/csuite/CEO/whatsapp-client.js');
const msg = '🚨 UPTIME ALERT: ' + ['${FAILED[*]}'].join(', ') + ' — check immediately.';
sendWhatsAppMessage('+923215139934', msg).catch(e => console.error('Alert failed:', e.message));
" 2>/dev/null || echo "ALERT: ${FAILED[*]}"
  exit 1
else
  echo "OK: All endpoints up"
  exit 0
fi