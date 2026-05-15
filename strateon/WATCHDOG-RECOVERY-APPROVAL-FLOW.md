# WATCHDOG RECOVERY APPROVAL FLOW — REVISED DESIGN
## Watchdog-Independent Alert Architecture

**Date:** 2026-05-15
**Revision:** Watchdog must alert Ahmad DIRECTLY — must not route through moosa-worker/Moosa
**Status:** Evidence and design only — no implementation

---

## CORE PRINCIPLE

**Watchdog is the primary alert authority. It works independently of the worker and Moosa.**

If `moosa-worker` is down → Moosa is likely ALSO down → Moosa cannot route alerts → Ahmad never gets warned.

**Fix:** Watchdog sends alerts directly to Ahmad. Moosa is only in the approval execution path, not the alert delivery path.

---

## 1. INDEPENDENT ALERT ARCHITECTURE

### Alert Delivery Paths

```
PATH A (Normal — Moosa healthy):
  moosa-watchdog [PM2] 
    → reads heartbeats
    → detects 2+ consecutive failures
    → writes watchdog-state.json
    → sends alert DIRECTLY to Ahmad via Neo SMTP/WhatsApp bridge
    → ALSO notifies Moosa of pending alert (optional, via queue file)
    → Ahmad replies to WhatsApp
    → Moosa picks up approval → executes → validates

PATH B (Fallback — Moosa down):
  moosa-watchdog [PM2]
    → reads heartbeats
    → detects 2+ consecutive failures
    → sends alert DIRECTLY to Ahmad (same mechanism, no Moosa dependency)
    → Ahmad replies to WhatsApp
    → Message goes to OpenClaw session (not specific to Moosa)
    → IF Moosa is up: Moosa intercepts, processes approval
    → IF Moosa is down: Ahmad's approval waits in session until Moosa recovers
    → Moosa recovers → picks up pending approval → executes

PATH C (Watchdog itself is failing):
  External monitor (OpenClaw gateway health check) detects watchdog staleness
  → Sends alert to Ahmad independently
  → Moosa recovery is a SEPARATE problem from watchdog alert delivery
```

### How Watchdog Sends Direct Alerts

The watchdog already imports `send_whatsapp.js`:

```javascript
import { sendWhatsApp } from './handlers/send_whatsapp.js';
```

`sendor_whatsapp.js` uses **Neo email/SMTP** to send WhatsApp messages. This is COMPLETELY INDEPENDENT of moosa-worker.

**The same WhatsApp channel that Moosa uses for replies is the same channel watchdog uses for alerts.** Ahmad receives both in the same WhatsApp thread. Replies from Ahmad go to OpenClaw → Moosa (if healthy) or wait in session (if Moosa is down).

---

## 2. WHAT DEPENDS ON WHAT — INDEPENDENCE MAP

```
┌─────────────────────────────────────────────────────┐
│                 moosa-worker [PM2]                   │
│  (writes heartbeat files)                           │
│  Depends on: Supabase, decision-model logic         │
│  Does NOT depend on: watchdog, Moosa, gateway       │
└──────────────────────┬──────────────────────────────┘
                      │ writes heartbeat files
                      ▼
┌─────────────────────────────────────────────────────┐
│            state/heartbeats/worker.json              │
│  (file on disk)                                      │
│  No dependencies — just a file                      │
└──────────────────────┬──────────────────────────────┘
                      │ read by watchdog
                      ▼
┌─────────────────────────────────────────────────────┐
│              moosa-watchdog [PM2]                   │
│  Reads heartbeats, writes watchdog-state.json       │
│  Sends WhatsApp alerts DIRECTLY via Neo SMTP        │
│  Does NOT depend on: moosa-worker, Moosa, gateway   │
│  Depends on: Neo email/SMTP, WhatsApp bridge        │
└─────────────────────────────────────────────────────┘
                      │ WhatsApp direct to Ahmad
                      ▼
┌─────────────────────────────────────────────────────┐
│               Ahmad Salim (WhatsApp)                │
│  Receives watchdog alerts                           │
│  Replies with approval/denial                       │
└──────────────────────┬──────────────────────────────┘
                      │ reply goes to OpenClaw session
                      ▼
┌─────────────────────────────────────────────────────┐
│              openclaw-gateway [PM2]                  │
│  Routes WhatsApp messages to session               │
│  Depends on: OpenClaw core                          │
└──────────────────────┬──────────────────────────────┘
                      │ session delivery
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Moosa (main agent)                 │
│  Picks up approval from session                    │
│  ONLY needed for: approval execution + validation  │
│  NOT needed for: watchdog alert delivery           │
└─────────────────────────────────────────────────────┘
```

**Key property:** Every box depends only on things ABOVE it in the diagram. Watchdog does NOT depend on moosa-worker or Moosa.

---

## 3. MOOSA HEARTBEAT (Moosa Liveness Check)

Moosa writes its own heartbeat so the watchdog can detect if Moosa itself is failing:

```javascript
// In Moosa's regular heartbeat (heartbeat-state.json or a new moosa.json):
{
  "process_name": "moosa",
  "pid": 916468,  // gateway pid (proxy for Moosa availability)
  "last_heartbeat_at": "2026-05-15T20:38:00.000Z",
  "status": "healthy"  // or "unknown" if Moosa hasn't written in 5min
}
```

### Watchdog Checks Moosa Liveness

```javascript
// In watchdog's check cycle:
const moosaHb = readFileSync(MOOSA_HB, 'utf-8');
const moosaAge = Date.now() - moosaHb.last_heartbeat_at;

if (moosaAge > 5 * 60 * 1000) {  // 5 minutes
  // Moosa is potentially down — include fallback instructions in alert
  alert.includesFallbackInstructions = true;
}
```

---

## 4. LEVEL 2 ALERT — DIRECT WATCHDOG ALERT FORMAT

When watchdog detects 2+ consecutive failures and Moosa is potentially down, it sends this directly:

```
═══════════════════════════════════════════════════════
🚨 WATCHDOG ALERT — DIRECT (NOT via Moosa)

CHECK:     worker_heartbeat_stale
CONSECUTIVE FAILURES: 2
SEVERITY:  LEVEL 3 — WORKER MAY BE STUCK

EVIDENCE:
  • Worker heartbeat age: 25min (threshold: 10min)
  • Last cycle: 2026-05-15T20:23:27.644Z
  • Worker PID: 922274
  • Worker status: UNHEALTHY

MOOSA STATUS: ⚠️ May be down (last Moosa heartbeat: 12min ago)
              → Approval routing may be delayed until Moosa recovers

BLAST RADIUS:
  • moosa-worker [28] — AFFECTED
  • openclaw-gateway [26] — NOT affected
  • cloudflared-tunnel [5] — NOT affected
  • Customer pipeline — PAUSED

RECOMMENDED RECOVERY:
  pm2 stop moosa-worker && pm2 start ecosystem.config.cjs

TO APPROVE: Reply to this WhatsApp thread with "approved"
  → If Moosa is up: Moosa will execute and validate
  → If Moosa is down: Wait for Moosa to recover, then execution begins
  → Do NOT send other commands — wait for confirmation

ROLLBACK: pm2 stop moosa-worker && pm2 start ecosystem.config.cjs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This alert is from moosa-watchdog [PID 923372].
Moosa recovery will execute after your approval.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5. APPROVAL HANDLING — FALLBACK PATHS

### When Moosa Is Healthy (Normal Path)

```
Ahmad: "approved" → OpenClaw → Moosa session
  → Moosa intercepts
  → Validates command against whitelist
  → Executes: pm2 stop moosa-worker && pm2 start ecosystem.config.cjs
  → Validates: new worker PID, fresh heartbeat
  → Sends recovery report to Ahmad
```

### When Moosa Is Down (Fallback Path)

```
Ahmad: "approved" → OpenClaw → Moosa session (message queued)
  → Moosa is down, message waits in session
  
Watchdog detects Moosa is back (Moosa heartbeat fresh):
  → Watchdog sends confirmation to Ahmad:
    "Moosa is back online. Processing your pending approval..."

Moosa starts, picks up queued approval:
  → Validates command
  → Executes
  → Sends recovery report
```

### Ahmad Can Also Wait

```
Ahmad sees: "Moosa may be down" warning in alert
Ahmad can wait for Moosa to recover, then reply "approved"
  → When Moosa comes back up, it picks up the approval
  → Recovery executes
```

---

## 6. RECOVERY EXECUTION PATH

### Execution Always Goes Through Moosa

**Critical invariant:** Recovery actions (pm2 stop/start/restart) are ONLY executed by Moosa. The watchdog does NOT execute recovery — it only alerts.

```
Watchdog alert (direct to Ahmad)
  → Ahmad approves
  → Moosa executes (or queue if Moosa down)
  → Moosa validates
  → Moosa sends final report
```

This means:
- Watchdog cannot accidentally execute wrong commands
- Watchdog cannot make recovery worse
- All execution is gated through Moosa's command whitelist and scope matching

### If Moosa Never Comes Back

This is a higher-severity situation:

```
Watchdog detects: Moosa heartbeat missing for > 15 minutes
→ Watchdog sends URGENT alert:
  "Moosa has been down for 15+ minutes. 
   Moosa is required to execute recovery commands.
   Manual intervention may be required.
   
   To manually recover worker:
   ssh [host] && pm2 stop moosa-worker && pm2 start ecosystem.config.cjs
   
   DO NOT approve automated recovery until Moosa is restored."
```

---

## 7. NORMAL WATCHDOG CYCLES — UNCHANGED

```
Every 3 minutes (cron_restart):
  1. Read worker.json → check age
  2. Read self-check.json → check age
  3. Update watchdog-state.json
  4. If consecutive_failures >= 2 → send Level 2 alert
  5. Else → log only

ZERO MiniMax calls
ZERO Supabase calls (local file reads only)
ZERO cost per cycle
```

The watchdog cycle itself does NOT need Moosa. It runs independently every 3 minutes.

---

## 8. SAFETY GATES (Enhanced)

### Gate 1: Alert Source Verification
```javascript
// Every alert includes watchdog PID and timestamp
// Ahmad can verify the alert came from the real watchdog
alert = {
  source: 'moosa-watchdog',
  watchdog_pid: process.pid,
  watchdog_uptime: os.uptime(),
  alert_time: new Date().toISOString(),
  watchdog_version: '0.1.0'
};
```

### Gate 2: Two-Consecutive-Failures Before Alert
```javascript
if (consecutive_failures < 2) {
  logOnly();  // Level 1 — no alert
  return;
}
// Level 2 — send alert
```

### Gate 3: Command Whitelist (In Moosa's Approval Processor)
```javascript
const APPROVED_COMMANDS = {
  'pm2 stop moosa-worker': true,
  'pm2 start ecosystem.config.cjs': true,
  'pm2 restart moosa-worker': true,
  'pm2 restart openclaw-gateway': true,
  'pm2 restart cloudflared-tunnel': true,
  'pm2 restart moosa-watchdog': true,
};
```

### Gate 4: Protected Process Doctrine
```javascript
// pkill -9 node is ALWAYS rejected
if (command.includes('pkill -9') || command.includes('kill -9')) {
  return { approved: false, reason: 'PROTECTED_COMMAND' };
}
```

### Gate 5: Scope Matching
```javascript
// Only execute if requested command matches approved action
const approved = Ahmad's reply;
if (approved === 'approved') {
  execute(recommendedRecovery);
} else if (approved.startsWith('approved:')) {
  const cmd = approved.replace('approved: ', '').trim();
  if (!whitelist.includes(cmd)) {
    reject('Command not in whitelist');
  } else {
    execute(cmd);
  }
}
```

### Gate 6: Execution Validation Loop
```javascript
async function executeRecovery(command) {
  // Execute
  await exec(command);
  
  // Validate within 30s
  await sleep(10);
  const heartbeatAge = await readHeartbeatAge();
  
  if (heartbeatAge < 60) {
    return { success: true, message: 'Recovery successful' };
  } else {
    return { success: false, message: 'Heartbeat still stale — may need second attempt' };
  }
}
```

### Gate 7: No Auto-Restart
```javascript
// Watchdog will NEVER restart a process automatically
// Recovery ALWAYS requires Ahmad approval
// Watchdog only: logs, alerts, waits
```

---

## 9. ROLLBACK PLAN

| Recovery Action | Rollback Command |
|-----------------|-----------------|
| `pm2 stop moosa-worker && pm2 start ecosystem.config.cjs` | Same command re-run |
| `pm2 restart moosa-worker` | `pm2 stop moosa-worker && pm2 start ecosystem.config.cjs` |
| `pm2 restart openclaw-gateway` | `pm2 restart openclaw-gateway` |
| Watchdog alert (no action) | No rollback needed |

---

## 10. COMPARISON: ORIGINAL vs REVISED

| Aspect | Original Design | Revised Design |
|--------|----------------|-----------------|
| Alert delivery | Watchdog → Moosa → Ahmad | **Watchdog → Ahmad DIRECT** |
| Moosa dependency for alerts | Required | **Not required** |
| If worker is down, can alert | Maybe (if Moosa up) | **YES — watchdog is independent** |
| If Moosa is down, can alert | No | **YES — watchdog is independent** |
| Approval execution | Via Moosa | Via Moosa (or queued if down) |
| Moosa heartbeat check | Not designed | **Yes — watchdog checks Moosa liveness** |
| Fallback if Moosa never returns | Not designed | **Urgent manual-intervention alert** |

---

## 11. IMPLEMENTATION CHANGES NEEDED

### Watchdog Changes (Phase 1)
1. Enable `send_whatsapp` in watchdog — currently it's imported but alerts are disabled
2. Add `consecutive_failures >= 2` → send WhatsApp alert (Level 2)
3. Add `moosa.json` heartbeat read (Moosa liveness check)
4. Include fallback instructions if Moosa appears down

### Moosa Changes (Phase 2)
1. Write `moosa.json` heartbeat every 1 minute
2. Approval processor: receive from session, validate, execute, validate, report
3. If Moosa was down and recovers: pick up queued approvals, process in order

### No Changes Needed
- Worker logic unchanged
- Gateway unchanged
- Supabase schema unchanged
- Sidecar unchanged

---

## 12. SUMMARY

**The revised design ensures:**
1. ✅ Watchdog alerts work even if moosa-worker is down
2. ✅ Watchdog does NOT rely on moosa-worker for Level 2 alert delivery
3. ✅ Approval handling routes through Moosa when healthy, queues when down
4. ✅ Fallback path: watchdog sends direct alert, Moosa recovers and processes queued approval
5. ✅ Normal checks remain local-only, zero MiniMax, zero cost
6. ✅ Recovery execution still requires explicit Ahmad approval
7. ✅ No automatic restarts — approval always required
8. ✅ Direct-alert mechanism, Moosa liveness check, fallback approval queue, all safety gates

**The core fix:** Watchdog sends WhatsApp directly to Ahmad using the same `send_whatsapp.js` path it already has. Moosa is only in the execution path, not the alert delivery path.

---

*Revised design complete. Ready for Ahmad review.*