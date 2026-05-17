#!/bin/bash
# uptime-monitor.sh
# Pings key endpoints and alerts if any are genuinely down
# Only alerts on TRUE downtime — not expected HTTP behavior (POST endpoints, redirects, auth walls)

WEBHOOK_SECRET="jACy9uSs7legs2A-CYYS9Xtvfz8hf5bEma6NqApoIGk"

# Pages that should return 200 on GET
GET_ENDPOINTS=(
  "https://qiyadon.com/"
  "https://qiyadon.com/pricing"
  "https://qiyadon.com/sign-trial"
  "https://qiyadon.com/sign-scale"
  "https://qiyadon.com/sign-starter"
  "https://qiyadon.com/sign-growth"
)

# POST endpoints — send valid JSON body, accept 200 or 400 (400 = endpoint is alive, wrong body is fine)
POST_ENDPOINTS=(
  "https://api.qiyadon.com/submit-signature"
  "https://api.qiyadon.com/submit-audit"
)

FAILED=()

# Check GET endpoints
for endpoint in "${GET_ENDPOINTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "$endpoint" 2>/dev/null)
  if [[ "$STATUS" != "200" ]]; then
    FAILED+=("$endpoint (HTTP $STATUS)")
  fi
done

# Check POST endpoints — send minimal valid body, accept 200|400|401|403 (all mean endpoint alive)
for endpoint in "${POST_ENDPOINTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST \
    -H "Content-Type: application/json" \
    -d '{"type":"uptime-check"}' \
    "$endpoint" 2>/dev/null)
  # Accept 200 (ok), 400 (wrong body but alive), 401/403 (auth required but alive)
  # Only flag as down if: 404, 500, 502, 503, 504
  if [[ "$STATUS" == "404" || "$STATUS" == "500" || "$STATUS" == "502" || "$STATUS" == "503" || "$STATUS" == "504" ]]; then
    FAILED+=("$endpoint (HTTP $STATUS)")
  fi
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "ALERT: ${#FAILED[@]} endpoint(s) genuinely down: ${FAILED[*]}"
  /opt/node24/node-v24.13.1-linux-x64/bin/node /root/OpenClaw/openclaw.mjs message send \
    --channel whatsapp \
    --target "+923215139934" \
    --message "🚨 UPTIME ALERT: ${#FAILED[@]} endpoint(s) down — ${FAILED[*]} — check immediately." \
    --json >/dev/null 2>&1
  exit 1
else
  echo "OK: All endpoints verified"
  exit 0
fi