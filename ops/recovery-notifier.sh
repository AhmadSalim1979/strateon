#!/bin/bash
#
# recovery-notifier.sh
# RISI-P5.5 Phase 2 — Recovery Notifier (live mode capable)
#
# Purpose: Detect active recovery in state file, wait for listener warm-up,
#          send WhatsApp recovery notification to Ahmad.
#
# Modes:
#   DRY_RUN=true   (default) — log generated message, don't send
#   DRY_RUN=false  — send via openclaw message send
#
# Usage:
#   DRY_RUN=true bash /ops/recovery-notifier.sh     # dry-run
#   DRY_RUN=false bash /ops/recovery-notifier.sh    # live (after approval)
#

set -euo pipefail

STATE_FILE="/ops/recovery-state.json"
LOG_FILE="/ops/recovery-notifier.log"
DRY_RUN="${DRY_RUN:-true}"
OPENCLAW="/root/OpenClaw/openclaw.mjs"
TARGET="+923215139934"

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%S%z')] $1" >> "$LOG_FILE"
}

# ── State helpers ─────────────────────────────────────────────────────────────
read_field() {
    local field="$1"
    node -e "
const fs=require('fs');
try {
  const s=JSON.parse(fs.readFileSync('$STATE_FILE','utf8'));
  console.log(JSON.stringify(s.recovery.$field));
} catch(e) { console.log('null'); }
" 2>/dev/null
}

write_field() {
    local field="$1"
    local value="$2"
    node -e "
const fs=require('fs');
const s=JSON.parse(fs.readFileSync('$STATE_FILE','utf8'));
s.recovery.$field=$value;
fs.writeFileSync('$STATE_FILE',JSON.stringify(s,null,2));
" 2>/dev/null
}

# ── Listener health check ────────────────────────────────────────────────────────
check_listener_ready() {
    local status
    status=$(pm2 jlist 2>/dev/null | node -e "
const p=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const g=p.find(x=>x.name==='openclaw-gateway');
console.log(g ? g.pm2_env.status : 'missing');
" 2>/dev/null || echo "unknown")

    if [[ "$status" == "online" ]]; then
        log "LISTENER-CHECK: gateway status=online — ready"
        echo "ready"
        return 0
    fi
    log "LISTENER-CHECK: gateway status=$status — not ready"
    echo "not_ready"
    return 1
}

# ── Generate recovery message ───────────────────────────────────────────────────
generate_message() {
    local outage="$1"
    local recovered="$2"
    local listener="$3"

    cat <<EOF
MOOSA recovered from a gateway interruption.
Gateway stopped at: $outage
Gateway restored at: $recovered
WhatsApp listener resumed at: $listener
Your last message may not have completed.
Please either resend the last instruction or reply 'resume' if you want me to continue from the last known task.
EOF
}

# ── Send WhatsApp via openclaw ──────────────────────────────────────────────────
send_whatsapp() {
    local message="$1"
    log "WHATSAPP-SEND: delivering via openclaw"

    local result
    result=$(node "$OPENCLAW" message send \
        --channel whatsapp \
        --target "$TARGET" \
        --message "$message" \
        2>&1)
    local exit_code=$?

    if [[ $exit_code -eq 0 ]] && echo "$result" | grep -q "Sent\|sent"; then
        log "WHATSAPP-SEND: success — $result"
        echo "SENT"
        return 0
    else
        log "WHATSAPP-SEND: failed — exit=$exit_code result=$result"
        echo "FAILED"
        return 1
    fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
    log "NOTIFIER-BEGIN: dry_run=$DRY_RUN"

    # Check for active recovery
    local active
    active=$(read_field "active")
    if [[ "$active" != "true" ]]; then
        log "NO-ACTIVE-RECOVERY: active=$active — exiting"
        echo "NO-ACTIVE-RECOVERY"
        exit 0
    fi

    # Check if already notified
    local already_sent
    already_sent=$(read_field "notificationSent")
    if [[ "$already_sent" == "true" ]]; then
        log "ALREADY-NOTIFIED: skipping"
        echo "ALREADY-NOTIFIED"
        exit 0
    fi

    # Wait for listener
    check_listener_ready
    if [[ $? -ne 0 ]]; then
        log "LISTENER-NOT-READY: will retry next cron"
        echo "LISTENER-NOT-READY"
        exit 1
    fi

    # Read recovery timestamps
    local outage_start recovered_at listener_resumed
    outage_start=$(read_field "outageStartAt")
    recovered_at=$(read_field "recoveryAt")
    listener_resumed=$(read_field "listenerResumedAt")

    # Set listenerResumedAt to now if not yet set
    if [[ -z "$listener_resumed" ]] || [[ "$listener_resumed" == "null" ]]; then
        listener_resumed=$(date '+%Y-%m-%dT%H:%M:%S%z')
        write_field "listenerResumedAt" "\"$listener_resumed\""
    fi

    # Strip quotes from timestamps for message (they come as JSON strings)
    outage_start=${outage_start//\"/}
    recovered_at=${recovered_at//\"/}
    listener_resumed=${listener_resumed//\"/}

    # Generate message
    local message
    message=$(generate_message "$outage_start" "$recovered_at" "$listener_resumed")
    log "MESSAGE-GENERATED"

    # Send or dry-run
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY-RUN: would have sent:"
        echo "$message" >> "$LOG_FILE"
        log "DRY-RUN: message end"
    else
        log "LIVE-MODE: attempting WhatsApp send"
        send_whatsapp "$message"
        local send_result=$?
        if [[ $send_result -ne 0 ]]; then
            log "SEND-FAILED: will retry next cron"
            echo "SEND-FAILED"
            exit 1
        fi
    fi

    # Update state
    local notified_at
    notified_at=$(date '+%Y-%m-%dT%H:%M:%S%z')
    write_field "notificationSent" "true"
    write_field "resumeDecisionPending" "true"
    write_field "notifiedAt" "\"$notified_at\""

    log "STATE-UPDATED: notificationSent=true resumeDecisionPending=true notifiedAt=$notified_at"
    log "NOTIFIER-COMPLETE"
    echo "NOTIFICATION-SENT"
}

main "$@"