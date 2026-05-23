#!/bin/bash
#
# transport-guard.sh
# RISI-P5.3 Phase 4C — Guarded Real Execution Harness
#
# Purpose: Read pending transport jobs, classify, and execute safely.
#          DRY_RUN=true by default. DRY_RUN=false for real execution.
#
# Execution rules:
#   TRANSPORT_AFFECTING → always refused (real + dry-run)
#   TRANSPORT_ADJACENT  → always refused (real + dry-run)
#   BOUNDED             → real execution allowed (opt-in per job)
#   SAFE                → real execution allowed
#
# Timeout: 20 seconds max per command.
# No PM2 mutation commands (stop/delete/restart/kill) in real exec path.
#

set -euo pipefail

PENDING_FILE="/ops/pending-transport-jobs.json"
LOG_FILE="/ops/transport-guard.log"
LOCK_FILE="/ops/transport-guard.lock"

# Default: dry-run. Set DRY_RUN=false for real execution.
DRY_RUN="${DRY_RUN:-true}"

# ── Forbidden patterns (PM2 mutation — never executed even in real mode) ─────
FORBIDDEN_PATTERNS=(
    "pm2\s+stop"
    "pm2\s+delete"
    "pm2\s+kill"
    "pm2\s+restart\s+openclaw"
    "pm2\s+restart\s+gateway"
)

log() {
    echo "[$(date '+%Y-%m-%dT%H:%M:%S%z')] $1" >> "$LOG_FILE"
}

# ── Lock acquisition ──────────────────────────────────────────────────────────
acquire_lock() {
    if [[ -f "$LOCK_FILE" ]]; then
        LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        if [[ -n "$LOCK_PID" ]] && kill -0 "$LOCK_PID" 2>/dev/null; then
            log "LOCK-HELD: lock held by PID $LOCK_PID — exiting"
            echo "LOCKED by $LOCK_PID"
            exit 0
        fi
        log "LOCK-STALE: removing stale lock from $LOCK_PID"
    fi
    echo $$ > "$LOCK_FILE"
    log "LOCK-ACQUIRED: PID $$"
}

release_lock() {
    rm -f "$LOCK_FILE"
    log "LOCK-RELEASED"
}

# ── Classify by transport impact ───────────────────────────────────────────────
classify_transport() {
    local cmd="$1"

    # TRANSPORT_AFFECTING — must be checked first, most specific
    if echo "$cmd" | grep -Eq "^[[:space:]]*(pm2\s+(stop|delete)\s+openclaw-gateway|gateway\.stop|openclaw\s+gateway\s+(stop|kill))"; then
        echo "TRANSPORT_AFFECTING"

    # TRANSPORT_ADJACENT — gateway/whatsapp restart or OpenClaw restart
    elif echo "$cmd" | grep -Eq "^[[:space:]]*(pm2\s+restart\s+openclaw-gateway|pm2\s+(stop|restart|delete)\s+(whatsapp|.*whatsapp)|openclaw\s+(gateway\s+)?restart[[:space:]]*$|systemctl\s+restart\s+openclaw-gateway)"; then
        echo "TRANSPORT_ADJACENT"

    # BOUNDED — pm2 stop/delete/restart on named non-transport targets
    elif echo "$cmd" | grep -Eq "^[[:space:]]*pm2\s+(stop|delete|restart)\s+"; then
        echo "BOUNDED"

    # SAFE — read-only commands, status checks, logs
    else
        echo "SAFE"
    fi
}

# ── Check if command contains forbidden mutation patterns ───────────────────────
is_forbidden() {
    local cmd="$1"
    for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
        if echo "$cmd" | grep -Eq "$pattern"; then
            return 0
        fi
    done
    return 1
}

# ── Update job in queue ────────────────────────────────────────────────────────
update_job() {
    local jobId="$1"
    local status="$2"
    local executedAt="$3"
    local output="$4"
    local exitCode="$5"
    local mode="$6"

    # Base64-encode output to avoid escaping issues across shell/Node boundary
    local encodedOutput
    encodedOutput=$(printf '%s' "$output" | base64 2>/dev/null | tr -d '\n')

    node /ops/update-job.js "$jobId" "$status" "$executedAt" "$encodedOutput" "$exitCode" "$mode" \
        || log "UPDATE-WARN: node update-job.js failed for $jobId"
}

# ── Main ──────────────────────────────────────────────────────────────────────
acquire_lock

if [[ ! -f "$PENDING_FILE" ]]; then
    log "NO-PENDING-FILE: $PENDING_FILE not found — exiting"
    release_lock
    exit 0
fi

# Select oldest pending job
JOB_INFO=$(node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$PENDING_FILE', 'utf8'));
const pending = data.jobs.filter(j => j.status === 'PENDING');
if (!pending.length) { console.log('NONE'); process.exit(0); }
const job = pending[0];
console.log(JSON.stringify(job));
" 2>/dev/null || echo "READ-ERROR")

if [[ "$JOB_INFO" == "NONE" ]] || [[ "$JOB_INFO" == "READ-ERROR" ]]; then
    log "NO-PENDING-JOBS"
    release_lock
    exit 0
fi

JOB_ID=$(echo "$JOB_INFO" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).jobId)")
COMMAND=$(echo "$JOB_INFO" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).command)")
QUEUED_AT=$(echo "$JOB_INFO" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).queuedAt)")

EXECUTED_AT=$(date '+%Y-%m-%dT%H:%M:%S%z')
TRANSPORT_CLASS=$(classify_transport "$COMMAND")

log "SELECTED: jobId=$JOB_ID class=$TRANSPORT_CLASS command=$COMMAND"

# ── Transport guard: refuse transport-affecting/adjacent in real mode ───────────
if [[ "$TRANSPORT_CLASS" == "TRANSPORT_AFFECTING" ]]; then
    log "REFUSED: TRANSPORT_AFFECTING — $COMMAND"
    update_job "$JOB_ID" "refused" "$EXECUTED_AT" \
        "TRANSPORT_AFFECTING commands are never executed in any mode" "0" "guard"
    release_lock
    exit 0
fi

if [[ "$TRANSPORT_CLASS" == "TRANSPORT_ADJACENT" ]]; then
    log "REFUSED: TRANSPORT_ADJACENT — $COMMAND"
    update_job "$JOB_ID" "refused" "$EXECUTED_AT" \
        "TRANSPORT_ADJACENT commands are never executed in any mode" "0" "guard"
    release_lock
    exit 0
fi

# ── Forbidden pattern check ────────────────────────────────────────────────────
if is_forbidden "$COMMAND"; then
    log "REFUSED: FORBIDDEN_PATTERN — $COMMAND"
    update_job "$JOB_ID" "refused" "$EXECUTED_AT" \
        "Command contains forbidden PM2 mutation pattern" "0" "guard"
    release_lock
    exit 0
fi

# ── Execute or dry-run ────────────────────────────────────────────────────────
if [[ "$DRY_RUN" == "true" ]]; then
    log "DRY-RUN: Would have executed — $COMMAND"
    update_job "$JOB_ID" "dry_run_executed" "$EXECUTED_AT" \
        "[DRY-RUN] Command NOT executed — simulated only" "null" "dry_run"
else
    log "EXEC-BEGIN: jobId=$JOB_ID"

    # Capture output with 20-second timeout
    OUTPUT=$(timeout 20 bash -c "$COMMAND" 2>&1) || true
    EXIT_CODE=$?

    log "EXEC: exitCode=$EXIT_CODE outputlen=${#OUTPUT}"

    if [[ $EXIT_CODE -eq 0 ]]; then
        update_job "$JOB_ID" "completed" "$EXECUTED_AT" "$OUTPUT" "$EXIT_CODE" "real"
        log "COMPLETED: jobId=$JOB_ID exitCode=$EXIT_CODE"
    else
        update_job "$JOB_ID" "failed" "$EXECUTED_AT" "$OUTPUT" "$EXIT_CODE" "real"
        log "FAILED: jobId=$JOB_ID exitCode=$EXIT_CODE"
    fi
fi

release_lock
exit 0