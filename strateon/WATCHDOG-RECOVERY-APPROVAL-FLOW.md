# WATCHDOG RECOVERY APPROVAL FLOW — DESIGN DOCUMENT
## Watchdog Failure Detection and Safe Recovery Protocol

**Date:** 2026-05-15
**Objective:** Design a safe, approval-gated recovery system for when watchdog detects real failures
**Status:** Evidence and design only — no implementation

---

## 1. EXACT ARCHITECTURE

### Current State

```
moosa-watchdog [PM2 process]
  → Reads: state/heartbeats/worker.json, state/heartbeats/self-check.json
  → Writes: state/watchdog/watchdog-state.json
  → Sends: WhatsApp alerts via send_whatsapp (currently disabled observation-only)
  → Runs: every 3 minutes via cron_restart
  → Does NOT: restart worker, modify tasks, write to Supabase tasks table
```

### Proposed Architecture: Watchdog Recovery Approval Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WATCHDOG RECOVERY APPROVAL FLOW                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  Watchdog    │───▶│  Check       │───▶│  Consecutive Fail    │  │
│  │  (3min cron) │    │  Heartbeats  │    │  Counter             │  │
│  └──────────────┘    └──────────────┘    └──────────┬───────────┘  │
│                                                       │              │
│                          Level 1 ◀────────────┬──────┘              │
│                          (log only)           │                      │
│                                         fail ≥ 2                      │
│                          Level 2 ◀───────────┘                      │
│                          (alert Ahmad)                               │
│                                                                       │
│                          Level 3 ◀──── Ahmad approval received        │
│                          (execute approved action)                    │
│                                                                       │
│                          Level 4 ◀──── Validate recovery             │
│                          (final report)                              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  SAFETY GATES — Never bypassed, never automatic                 │ │
│  │  • No pkill -9 node (kills all node processes)                 │ │
│  │  • No gateway/worker/database/tunnel restart without approval    │ │
│  │  • Scope limited to exactly what Ahmad approved                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Roles

| Component | Role | Authority |
|-----------|------|-----------|
| `moosa-watchdog` | Detects failures, logs findings, sends Level 2 alerts to Moosa | Read-only observation |
| `Moosa (main agent)` | Receives alert, analyzes, proposes recovery, executes after approval | Decision + execution |
| Ahmad Salim | Approves or denies recovery actions | Final authority |
| `moosa-worker` | Executes tasks, writes heartbeats | No recovery role |

### Information Flow

```
watchdog.js (reads heartbeats)
  → state/watchdog/watchdog-state.json (writes findings)
  → Level 2 alert via WhatsApp to Moosa
  → Moosa analyzes, sends structured alert to Ahmad
  → Ahmad replies with approval command
  → Moosa executes ONLY the approved action
  → Moosa validates, sends recovery report to Ahmad
```

---

## 2. ALERT FORMAT (Level 2 Alert to Ahmad)

When watchdog detects 2+ consecutive failures, Moosa sends Ahmad a structured alert:

```
═══════════════════════════════════════════════════════
🚨 WATCHDOG ALERT — ACTION REQUIRED
═══════════════════════════════════════════════════════

CHECK FAILED:   worker_heartbeat_stale
EVIDENCE:
  • File: state/heartbeats/worker.json
  • Age: 25min (threshold: 10min)
  • Last cycle: 2026-05-15T20:23:27.644Z
  • Last PID: 922274
  • Status: UNHEALTHY

SEVERITY:       LEVEL 3 — WORKER MAY BE STUCK
LIKELY CAUSE:
  • Worker crashed or stalled
  • Heartbeat file not written (worker frozen mid-cycle)

BLAST RADIUS:
  • Worker [28] pid:922274 — affected
  • No customer data loss (worker is read-only decision engine)
  • No gateway impact
  • Pipeline execution paused

RECOMMENDED RECOVERY:
  Safe restart of moosa-worker only:
  1. pm2 stop moosa-worker
  2. pm2 start ecosystem.config.cjs
  (Gateway and tunnel unaffected)

ROLLBACK:
  pm2 stop moosa-worker && pm2 start ecosystem.config.cjs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPROVAL REQUIRED — Reply with one of:

  "approved"                    → Execute recommended recovery
  "approved: pkill -9 922274"  → Execute specific command only
  "denied"                      → Take no action, log and continue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sent by: moosa-watchdog
Alert time: 2026-05-15T20:38:00.000Z
Watchdog PID: 923372
```

### Alert Variants by Failure Type

| Failure Type | Alert Header | Recommended Recovery |
|-------------|--------------|----------------------|
| `worker_heartbeat_stale` | 🚨 WATCHDOG ALERT — ACTION REQUIRED | `pm2 stop moosa-worker && pm2 start ecosystem.config.cjs` |
| `gateway_offline` | 🚨 GATEWAY ALERT — ACTION REQUIRED | `pm2 restart openclaw-gateway` |
| `worker_crashloop` | 🚨 WORKER CRASHLOOP — STOP IMMEDIATELY | `pm2 stop moosa-worker` (stop further restarts) |
| `selfcheck_stale` | ℹ️ SELF-CHECK STALE — OBSERVATION | No action, monitor only |

---

## 3. APPROVAL FORMAT (Ahmad's Response)

### Valid Approval Responses

| Ahmad's Reply | Moosa's Interpretation |
|-------------|------------------------|
| `approved` | Execute recommended recovery from alert |
| `approved: [exact command]` | Execute ONLY the specified command |
| `denied` | Take no action, log denial, continue monitoring |
| `[different command]` | Reject — scope creep, respond with clarification |

### Example Approvals

```
Ahmad: "approved"
  → Moosa executes: pm2 stop moosa-worker && pm2 start ecosystem.config.cjs

Ahmad: "approved: pm2 restart moosa-worker"
  → Moosa executes: pm2 restart moosa-worker (only this command)

Ahmad: "denied"
  → Moosa logs: "Recovery denied by Ahmad. Continuing monitoring."
  → No action taken. Watchdog continues.

Ahmad: "approved: pm2 stop moosa-worker && pm2 start ecosystem.config.cjs && sleep 10 && pm2 list"
  → Moosa executes the 4 commands in sequence, validates after each
```

### Scope Creep Rejection

If Ahmad approves something that doesn't match the recommended action:

```
Ahmad: "approved: pkill -9 node"
  → Moosa: "Cannot execute 'pkill -9 node' — this kills ALL node processes
           including gateway, exec handler, and other protected processes.
           Only pm2-safe commands are permitted.
           Recommended action: pm2 stop moosa-worker && pm2 start ecosystem.config.cjs
           Please reply with 'approved' or a specific pm2-safe command."
```

---

## 4. RECOVERY ACTION LIST

### Pre-Approved Safe Actions (Always Permitted)

These can be executed WITHOUT approval (already verified safe):

| Action | Command | When Safe |
|--------|---------|-----------|
| Log state dump | `pm2 jlist && pm2 logs moosa-worker --lines 20` | Always |
| Read heartbeat | `cat state/heartbeats/worker.json` | Always |
| Read watchdog-state | `cat state/watchdog/watchdog-state.json` | Always |
| Check PM2 status | `pm2 list` | Always |

### Actions Requiring Ahmad Approval

| Action | Command | Blast Radius |
|--------|---------|-------------|
| **Safe worker restart** | `pm2 stop moosa-worker && pm2 start ecosystem.config.cjs` | Worker only, gateway unaffected |
| **Worker status check** | `pm2 describe moosa-worker` | Read-only |
| **Worker logs dump** | `pm2 logs moosa-worker --lines 50 --nostream` | Read-only |
| **Gateway restart** | `pm2 restart openclaw-gateway` | Gateway only, worker unaffected |
| **Tunnel restart** | `pm2 restart cloudflared-tunnel` | Tunnel only |
| **Watchdog restart** | `pm2 restart moosa-watchdog` | Watchdog only, worker unaffected |

### Actions NEVER Permitted Without Explicit Emergency Declaration

These require a written emergency override from Ahmad:

| Action | Reason |
|--------|--------|
| `pkill -9 node` | Kills ALL node processes (gateway, exec handler, worker, tunnel) |
| `pm2 delete moosa-worker` | Removes PM2 entry — data loss on restart |
| `kill -9 [pid]` on non-target process | Could kill gateway or other protected processes |
| `pm2 kill` | Kills PM2 daemon itself |
| Any SQL DELETE/UPDATE via direct DB | Data destruction risk |
| `iptables` or firewall changes | Could lock out the system |

### Emergency Override Format

Only explicit written declaration from Ahmad activates these:

```
EMERGENCY OVERRIDE: [exact command] approved by Ahmad Salim on [date]
```

Without this exact format, emergency commands are rejected.

---

## 5. SAFETY GATES

### Gate 1: Consecutive Failure Threshold

```javascript
// Only escalate after 2 consecutive failures
if (consecutive_failures >= 2) {
  sendLevel2Alert();
} else {
  logOnly(); // Level 1
}
```

### Gate 2: Alert Contains Blast Radius Analysis

Every Level 2 alert must state:
- What is affected
- What is NOT affected
- Whether gateway/tunnel/worker is impacted

### Gate 3: Command Whitelist

```javascript
const APPROVED_COMMANDS = {
  'pm2': ['stop', 'start', 'restart', 'list', 'describe', 'logs', 'save'],
  'cat': ['state/heartbeats/worker.json', 'state/watchdog/watchdog-state.json'],
  'pm2 list': [], // no args needed
};

// Reject anything not in whitelist
if (!isApprovedCommand(command)) {
  throw new Error('COMMAND NOT IN WHITELIST: ' + command);
}
```

### Gate 4: Scope Matching

```javascript
// Only execute commands that match exactly what Ahmad approved
const APPROVED_ACTION = alert.recommendedRecovery;

if (requestedCommand !== APPROVED_ACTION && 
    requestedCommand !== 'approved') {
  throw new Error('SCOPE MISMATCH: requested command does not match approved action');
}
```

### Gate 5: Protected Process Doctrine

Before any restart command:

```javascript
PROTECTED_PROCESSES = [
  'openclaw-gateway',  // INFRASTRUCTURE — highest protection
  'cloudflared-tunnel', // INFRASTRUCTURE
  'moosa-worker',       // ORCHESTRATION — medium protection
];

// Pre-flight check before pkill/kill
if (command.includes('pkill') || command.includes('kill -9')) {
  // Extract PID from command
  const targetPid = extractPid(command);
  const protectedPids = getProtectedPids();
  
  if (protectedPids.includes(targetPid)) {
    throw new Error('REFUSING: target PID is a protected process');
  }
}
```

### Gate 6: Cost Gate — MiniMax Usage

```javascript
// MiniMax/main-agent reasoning is ONLY activated after:
// 1. Level 2 alert sent and approved by Ahmad
// 2. Recovery action is non-trivial (not a simple restart)
//
// Normal watchdog cycles (every 3 min) use ZERO MiniMax calls.
// Only the escalation analysis and recovery validation use MiniMax.
```

---

## 6. ROLLBACK PLAN

### For Each Recovery Action

| Action | Rollback |
|--------|----------|
| `pm2 stop moosa-worker && pm2 start ecosystem.config.cjs` | `pm2 stop moosa-worker && pm2 start ecosystem.config.cjs` (re-run) |
| `pm2 restart moosa-worker` | `pm2 stop moosa-worker && pm2 start ecosystem.config.cjs` |
| `pm2 restart openclaw-gateway` | `pm2 restart openclaw-gateway` (re-run) |
| No action (denied) | No rollback needed |

### Rollback Verification

After any rollback:
1. Check PM2 status — all affected processes online
2. Check heartbeat files — worker writing fresh entries
3. Check watchdog-state.json — consecutive_failures reset to 0
4. Send Ahmad recovery report

---

## 7. COST IMPACT

### Normal Watchdog Operation (3-minute cycles)

```
Local-only operations (zero external cost):
  • Read worker.json     → fs.readFileSync (~$0)
  • Read self-check.json → fs.readFileSync (~$0)
  • Update watchdog-state.json → fs.writeFileSync (~$0)
  • Log to console       → stdout (~$0)

MiniMax usage: 0 calls per cycle
Supabase calls: 0 (watchdog reads local files only)
WhatsApp alerts: 0 (disabled observation mode)
```

### After Level 2 Alert (Escalation)

```
1. Moosa receives alert → analyzes with MiniMax
   → ~$0.001-0.01 per alert (MiniMax reasoning)

2. Ahmad replies with approval → Moosa executes
   → Zero cost (PM2 commands are local)

3. Moosa validates → reads PM2 status, sends recovery report
   → ~$0.001-0.01 (MiniMax text generation)
```

### Cost Summary

| Scenario | MiniMax Calls | Cost Estimate |
|----------|--------------|----------------|
| Normal watchdog (24h) | 0 | $0 |
| One Level 2 alert/day | 2-3 | ~$0.01-0.03/day |
| One recovery + report/day | 4-6 | ~$0.02-0.06/day |
| Monthly cost (worst case) | ~180 calls | < $1/month |

**Watchdog is essentially zero-cost for normal operation.**

---

## 8. IMPLEMENTATION PLAN

### Phase 1: Watchdog Alert Channel (Week 1)

**Changes:**
- `watchdog.js`: Add Level 2 alert sender (uses Moosa's WhatsApp via OpenClaw)
- `state/watchdog/watchdog-state.json`: Add `last_escalation_at` and `escalation_count` fields

**Not changed:**
- Worker logic unchanged
- Gateway unchanged
- No new processes

**Validation:**
```
[watchdog] evaluated at 2026-05-15T20:38:00.000Z
  worker: STALE (25min > 10min threshold)
  consecutive_failures: 2
  → Level 2 alert sent to Moosa
  → WhatsApp alert received by Ahmad
```

### Phase 2: Moosa Alert Processor (Week 1-2)

**Changes:**
- New handler in Moosa: `watchdog-alert-processor.js`
- Receives alert from watchdog, formats structured message, sends to Ahmad
- Waits for Ahmad approval, validates command, executes

**Validation:**
- Ahmad receives formatted alert on WhatsApp
- Ahmad replies with `approved`
- Moosa executes only that command
- Moosa validates and sends report

### Phase 3: Recovery Validation Loop (Week 2)

**Changes:**
- Moosa validates recovery by checking heartbeat freshness
- If heartbeat not fresh after 2 cycles → re-alert Ahmad
- If heartbeat fresh → send success report

**Validation:**
- After recovery, Ahmad gets confirmation with evidence
- Watchdog-state.json shows consecutive_failures reset to 0

### Phase 4: Safety Hardening (Week 2-3)

**Changes:**
- Command whitelist enforcement
- Protected process doctrine
- Scope matching
- Cost gate (MiniMax only on escalation)

**Validation:**
- Test with `pkill -9 node` → rejected with explanation
- Test with `denied` → no action, watchdog continues
- Test with wrong command → scope rejection

---

## 9. ROLES AND RESPONSIBILITIES

| Role | Owner | Responsibility |
|------|-------|----------------|
| Watchdog | moosa-watchdog [PM2] | Detect failures, log, escalate |
| Alert Processor | Moosa | Receive alert, format, send to Ahmad |
| Approver | Ahmad Salim | Authorize or deny recovery actions |
| Executor | Moosa | Execute ONLY approved actions |
| Validator | Moosa | Verify recovery, send report |
| Decision Maker | Moosa | Reject unsafe commands, propose safe alternatives |

---

## 10. EXAMPLE COMPLETE FLOW

```
T+0:00   Watchdog cycle starts (3-min cron)
T+0:02   Read worker.json — age: 15min > 10min threshold
T+0:02   consecutive_failures.worker_heartbeat_stale: 1
T+0:02   Log: "worker STALE (1 consecutive failure)" — Level 1

T+3:00   Watchdog cycle 2
T+3:02   Read worker.json — age: 18min > 10min threshold
T+3:02   consecutive_failures.worker_heartbeat_stale: 2
T+3:02   Level 2 alert triggered — send to Moosa

T+3:05   Moosa receives alert, formats structured message
T+3:06   WhatsApp sent to Ahmad:
         "🚨 WATCHDOG ALERT — ACTION REQUIRED
          [evidence, severity, recommended recovery, etc.]"

T+10:00  Ahmad replies: "approved"
T+10:02  Moosa: pm2 stop moosa-worker && pm2 start ecosystem.config.cjs
T+10:12  New worker PID 923456 online
T+10:15  Moosa: Verify heartbeat written — fresh (3s old)
T+10:15  Moosa: Update watchdog-state.json — consecutive_failures: 0
T+10:16  Moosa: Send recovery report to Ahmad

T+10:17  Ahmad: "Confirmed. Thank you."
T+10:18  Cycle complete. Monitoring continues.
```

---

## 11. CURRENT BLOCKERS TO IMPLEMENTATION

1. **Watchdog WhatsApp integration**: watchdog.js uses `send_whatsapp.js` directly. Need to route alert through Moosa instead.
2. **Moosa alert handler**: Needs a new WhatsApp receive handler for watchdog alerts (or watchdog writes to a queue Moosa polls).
3. **Command whitelist**: Needs to be defined and embedded in Moosa's approval processor.
4. **Ahmad's WhatsApp number for alerts**: Already available (`+923215139934`).

---

## 12. WHAT SHOULD NOT BE TOUCHED

| Item | Reason |
|------|--------|
| Worker heartbeat logic | Works correctly, no changes needed |
| Gateway PM2 entry | Infrastructure — never restart without explicit approval |
| Cloudflared tunnel | Infrastructure — never restart without explicit approval |
| Supabase schema | No changes needed |
| Sidecar shadow | Validated and working, not involved in this flow |

---

*Design complete. Awaiting Ahmad approval to proceed with implementation.*