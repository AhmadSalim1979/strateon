#!/bin/bash
#
# gateway-supervisor.sh
# RISI-P5.3 Phase 1 + RISI-P5.5 Phase 2+6 — External Gateway Supervisor
# Ensures openclaw-gateway is restored if it stops.
# One restart attempt per cron run. No loops.
#
# RISI-P5.5 additions: writes recovery-state.json after successful recovery.
# previousGatewayPid is recorded only if >0; 0 means "stopped before capture"
# and gets previousGatewayPidReason instead.
#

set -euo pipefail

LOGFILE="/root/.openclaw/workspace/ops/gateway-supervisor.log"
GATEWAY_NAME="openclaw-gateway"
STATE_FILE="/ops/recovery-state.json"
OUTAGE_TS_FILE="/ops/gateway-down-timestamp.txt"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%S%z')] $1" >> "$LOGFILE"
}

# ── Get status via PM2 JSON list (avoids terminal color / parsing issues) ────
STATUS=$(pm2 jlist 2>/dev/null | node -e "
    const list = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const g = list.find(x => x.name === '$GATEWAY_NAME');
    console.log(g ? g.pm2_env.status : 'missing');
" || echo "unknown")

if [[ "$STATUS" == "online" ]]; then
    log "STATUS: $GATEWAY_NAME is online — no action needed"
    exit 0
fi

# ── Not online — attempt recovery ────────────────────────────────────────────
log "EVENT: $GATEWAY_NAME is [$STATUS] — initiating recovery"

# Record outage start time (written before recovery begins)
date '+%Y-%m-%dT%H:%M:%S%z' > "$OUTAGE_TS_FILE"
OUTAGE_START=$(cat "$OUTAGE_TS_FILE" 2>/dev/null || echo "")

# Get previous gateway PID before we touch it
PREV_PID=$(pm2 jlist 2>/dev/null | node -e "
const list = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const g = list.find(x => x.name === '$GATEWAY_NAME');
console.log(g ? g.pid : '');
" 2>/dev/null || echo "")

# Canonical start command (known working)
CANONICAL_CMD='pm2 start /usr/bin/bash --name openclaw-gateway -- -c "bash -lc '\''PATH=/opt/node24/node-v24.13.1-linux-x64/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /opt/node24/node-v24.13.1-linux-x64/bin/node /root/OpenClaw/openclaw.mjs gateway run --bind loopback --port 18789'\''"'

# Delete stale PM2 entry if it exists but is stopped/errored/missing
if [[ "$STATUS" == "stopped" ]] || [[ "$STATUS" == "errored" ]] || [[ "$STATUS" == "missing" ]]; then
    DELETE_OUT=$(pm2 delete "$GATEWAY_NAME" 2>&1) || true
    log "DELETE: ${DELETE_OUT:0:200}"
fi

# Start using canonical command
START_OUTPUT=$(eval "$CANONICAL_CMD" 2>&1) || true
log "POST-START: ${START_OUTPUT:0:300}"

# Persist runtime config so restart survives a reboot
PM2_SAVE=$(pm2 save 2>&1) || true
log "PM2-SAVE: ${PM2_SAVE:0:200}"

# Report post-recovery status
RECOVERED_STATUS=$(pm2 jlist 2>/dev/null | node -e "
    const list = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const g = list.find(x => x.name === '$GATEWAY_NAME');
    console.log(g ? g.pm2_env.status : 'missing');
" || echo "unknown")

NEW_PID=$(pm2 jlist 2>/dev/null | node -e "
const list = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const g = list.find(x => x.name === '$GATEWAY_NAME');
console.log(g ? g.pid : '');
" 2>/dev/null || echo "")

RECOVERY_AT=$(date '+%Y-%m-%dT%H:%M:%S%z')

log "RECOVERY-SUMMARY: status=[$RECOVERED_STATUS] prev_pid=[$PREV_PID] new_pid=[$NEW_PID]"

# ── RISI-P5.5: Write recovery state (handoff to notifier) ──────────────────
# Only write if recovery succeeded (gateway is online)
if [[ "$RECOVERED_STATUS" == "online" ]]; then
    node -e "
const fs = require('fs');
const RECOVERY_AT = '$RECOVERY_AT';
const OUTAGE_START = '$OUTAGE_START';
const PREV_PID_RAW = '$PREV_PID';
const NEW_PID = '$NEW_PID';
try {
  let s = { recovery: { active: false } };
  try { s = JSON.parse(fs.readFileSync('$STATE_FILE', 'utf8')); } catch(e) {}
  // Only record previousGatewayPid if it's a positive integer.
  // Stopped PM2 entries report pid=0 — treat that as unavailable.
  const prevPid = PREV_PID_RAW && parseInt(PREV_PID_RAW) > 0 ? parseInt(PREV_PID_RAW) : null;
  const prevPidReason = prevPid === null ? (PREV_PID_RAW === '0' ? 'stopped_before_recovery' : 'unavailable_before_recovery') : null;
  s.recovery = {
    active: true,
    outageStartAt: OUTAGE_START || RECOVERY_AT,
    recoveryAt: RECOVERY_AT,
    listenerResumedAt: null,
    previousGatewayPid: prevPid,
    previousGatewayPidReason: prevPidReason,
    newGatewayPid: NEW_PID ? parseInt(NEW_PID) : null,
    recoveryReason: 'supervisor_emergency',
    notificationSent: false,
    resumeRequested: false,
    resumeDecisionPending: false,
    resumeApproved: false,
    lastKnownInboundTimestamp: null,
    notifiedAt: null
  };
  fs.writeFileSync('$STATE_FILE', JSON.stringify(s, null, 2));
} catch(e) { fs.writeFileSync('$LOGFILE', 'RECOVERY-STATE-WRITE-FAIL: ' + e.message + '\n'); }
" 2>/dev/null || log "RECOVERY-STATE: write failed"
fi

exit 0