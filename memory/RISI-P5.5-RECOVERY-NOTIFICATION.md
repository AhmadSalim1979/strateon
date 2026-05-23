# RISI-P5.5 — Recovery Notification and Resume Protocol

**Date:** 2026-05-23
**Status:** PHASE 1 COMPLETE — Dry-run implemented
**Author:** Moosa (CEO)

---

## Architecture

```
[GATEWAY STOPS]
      ↓
gateway-supervisor.sh fires (every 1 min)
      ↓
canonical restart executes
      ↓
writes recovery-state.json
      ↓
[RECOVERY NOTIFIER] ← separate lightweight script
      ↓
waits for WhatsApp listener to come back online
      ↓
sends recovery notification to Ahmad
      ↓
sets resumeDecisionPending=true
      ↓
[MOOSA RECEIVES "resume" from Ahmad]
      ↓
evaluates: is task safely resumable?
      ↓
asks Ahmad to confirm before continuing
```

**Key principle:** Supervisor stays primitive. Notification is a separate layer. Moosa evaluates resumability only after Ahmad says "resume". Ahmad confirms before any continuation.

---

## State Schema

```json
{
  "recovery": {
    "active": true,
    "outageStartAt": "ISO timestamp",
    "recoveryAt": "ISO timestamp",
    "listenerResumedAt": "ISO timestamp",
    "previousGatewayPid": "integer | null — PID before restart; null if gateway was stopped before capture",
    "previousGatewayPidReason": "string | null — 'stopped_before_recovery' if PID=0; 'unavailable_before_recovery' if unknown",
    "newGatewayPid": "integer | null",
    "recoveryReason": "supervisor_emergency | manual_recovery",
    "notificationSent": "boolean",
    "resumeRequested": "boolean — Ahmad said 'resume'",
    "resumeDecisionPending": "boolean — awaiting Moosa evaluation or Ahmad decision",
    "resumeApproved": "boolean — explicitly approved to continue",
    "lastKnownInboundTimestamp": "ISO timestamp | null",
    "notifiedAt": "ISO timestamp | null"
  }
}
```

**State machine:**

```
active=true
  └── notifier runs → notificationSent=true, resumeDecisionPending=true
        └── Ahmad says "resume" → resumeRequested=true
              └── Moosa evaluates resumability
                    ├── safe → resumeDecisionPending=false, OFFER resume
                    ├── unsafe → resumeDecisionPending=false, REFUSE, ask to resend
              └── Ahmad says "yes" → resumeApproved=true, continue task
              └── Ahmad says "no" → clear state
        └── Ahmad says "skip" → clear all recovery state
  └── active=false → no active recovery
```

---

## State Transition Rules

| Field | Set By | Value After Notification | Purpose |
|---|---|---|---|
| `notificationSent` | Notifier | `true` | Recovery message delivered |
| `resumeRequested` | Moosa (on "resume" from Ahmad) | `false` | Ahmad invoked resume |
| `resumeDecisionPending` | Notifier | `true` | Waiting for resumability evaluation |
| `resumeApproved` | Moosa (after Ahmad "yes") | `false` | Explicit approval before continuation |
| `lastKnownInboundTimestamp` | Supervisor or notifier | — | Aids task reconstruction |
| `notifiedAt` | Notifier | timestamp | Delivery confirmation |

---

## Resume Evaluation Rules

When Ahmad replies `resume`:

| Condition | Action |
|---|---|
| Last task was TRANSPORT_AFFECTING or TRANSPORT_ADJACENT | "That task affected the gateway channel. Please resend the instruction explicitly." |
| Last task was destructive (delete, kill, stop) | "That operation was destructive. Please resend the instruction explicitly." |
| Last task was refresh/executor | "The refresh was interrupted. Please reply 'proceed' to restart, or resend the instruction." |
| Last task was safe/read-only | Offer: "I can continue: [task summary]. Say 'yes' to proceed or 'resend' to give a fresh instruction." |
| Cannot determine last task | "I couldn't determine your last instruction. Please resend it." |

**Core rule:** Never auto-continue. Ask Ahmad to confirm. Never fabricate the lost instruction.

---

## Supervisor Patch Plan (minimal — do not apply yet)

**File:** `/root/.openclaw/workspace/ops/gateway-supervisor.sh`

**Addition 1 — write outage timestamp on first detection:**
```bash
# At start of recovery detection (gateway found NOT online)
date '+%Y-%m-%dT%H:%M:%S%z' > /ops/gateway-down-timestamp.txt
```

**Addition 2 — after successful canonical restart:**
```bash
# Write recovery state
OUTAGE_START=$(cat /ops/gateway-down-timestamp.txt 2>/dev/null || echo "$(date '+%Y-%m-%dT%H:%M:%S%z')")
node -e "
const fs=require('fs');
const s=JSON.parse(fs.readFileSync('/ops/recovery-state.json','utf8'));
s.recovery={
  active:true,
  outageStartAt:'$OUTAGE_START',
  recoveryAt:'$(date '+%Y-%m-%dT%H:%M:%S%z')',
  listenerResumedAt:null,
  previousGatewayPid:'$PREV_PID',
  newGatewayPid:null,
  recoveryReason:'supervisor_emergency',
  notificationSent:false,
  resumeRequested:false,
  resumeDecisionPending:false,
  resumeApproved:false,
  lastKnownInboundTimestamp:null,
  notifiedAt:null
};
fs.writeFileSync('/ops/recovery-state.json',JSON.stringify(s,null,2));
" 2>/dev/null || true
```

**Phase 6 Audit Fidelity Fix (2026-05-23):**
`previousGatewayPid` is now recorded only when `parseInt(PREV_PID) > 0`. If the gateway was stopped before the supervisor could capture the PID (PM2 reports pid=0 for stopped processes), `previousGatewayPid` is set to `null` and `previousGatewayPidReason` is set to `"stopped_before_recovery"`.

```javascript
const prevPid = PREV_PID_RAW && parseInt(PREV_PID_RAW) > 0 ? parseInt(PREV_PID_RAW) : null;
const prevPidReason = prevPid === null
  ? (PREV_PID_RAW === '0' ? 'stopped_before_recovery' : 'unavailable_before_recovery')
  : null;
```

---

## Files

| File | Purpose |
|---|---|
| `/ops/recovery-state.json` | Persistent recovery state |
| `/ops/recovery-notifier.sh` | Wait for listener + send WhatsApp notification |
| `/ops/gateway-down-timestamp.txt` | Outage start time (written by supervisor) |
| `memory/RISI-P5.5-RECOVERY-NOTIFICATION.md` | This design document |

---

## Rollback

```bash
rm /ops/recovery-state.json /ops/recovery-notifier.sh /ops/gateway-down-timestamp.txt
# Restore supervisor (keep canonical command, remove state writes)
```

---

## Phase 1 Dry-Run Result

- `notificationSent`: false → true ✅
- `resumeDecisionPending`: false → true ✅
- `resumeApproved`: false (unchanged) ✅
- `notifiedAt`: null → timestamp ✅
- Recovery message generated exactly as specified ✅
- PM2 unchanged ✅
- No real WhatsApp sending ✅