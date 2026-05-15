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
    → tries WhatsApp via OpenClaw CLI (openclaw-gateway [26])
    → IF WhatsApp succeeds → delivered to Ahmad via WhatsApp
    → IF WhatsApp fails (gateway down OR WhatsApp disconnected) → sends email via Neo SMTP
    → Ahmad receives WhatsApp OR email
    → Ahmad replies to WhatsApp
    → Moosa picks up approval → executes → validates

PATH B (Fallback — Moosa down):
  moosa-watchdog [PM2]
    → reads heartbeats
    → detects 2+ consecutive failures
    → sends email DIRECTLY via Neo SMTP (ahmad.salim@qiyadon.com)
    → Ahmad receives email alert
    → Ahmad replies to WhatsApp (message goes to OpenClaw session)
    → IF Moosa is up: Moosa intercepts, processes approval
    → IF Moosa is down: Ahmad's approval waits in session until Moosa recovers
    → Moosa recovers → picks up pending approval → executes

PATH C (Watchdog itself is failing):
  External monitor (OpenClaw gateway health check) detects watchdog staleness
  → Sends alert to Ahmad independently
  → Moosa recovery is a SEPARATE problem from watchdog alert delivery
```

**CRITICAL:** Alert transport uses TWO paths:
1. **WhatsApp** — OpenClaw CLI → gateway [26] → WhatsApp → Ahmad (+923215139934)
2. **Email** — Neo SMTP (smtp0001.neo.space:587) → ahmad.salim@qiyadon.com / contact@qiyadon.com

Both destinations are VERIFIED from workspace files. No invented destinations used.

### How Watchdog Sends Direct Alerts

The watchdog sends alerts using TWO independent paths:

**Path 1 — WhatsApp (Primary):**
```javascript
// Calls OpenClaw CLI directly — requires openclaw-gateway [26] online
execFile('/opt/node24/node-v24.13.1-linux-x64/bin/node', [
  '/root/OpenClaw/openclaw.mjs', 'message', 'send',
  '--target', '+923215139934',
  '--message', alertText
], { timeout: 30000 });
```
- Requires: openclaw-gateway [26] online + WhatsApp session connected
- Ahmad receives via WhatsApp thread same as Moosa conversations

**Path 2 — Neo SMTP Email (Fallback):**
```javascript
// Calls nodemailer directly — no gateway, no WhatsApp session required
transporter.sendMail({
  from: 'Qiyadon <contact@qiyadon.com>',
  to: 'ahmad.salim@qiyadon.com',        // PRIMARY (verified in EMAIL-SIGNATURES.md)
  // or: 'contact@qiyadon.com',          // BACKUP (verified in qiyadon-email.json)
  subject: '🚨 WATCHDOG ALERT: worker stale',
  text: alertText,
});
```
- Requires: network access to smtp0001.neo.space:587 only
- Works even if gateway [26] is down, WhatsApp is disconnected, moosa-worker is down
- Email destinations: `ahmad.salim@qiyadon.com` (primary), `contact@qiyadon.com` (backup)

**Design rule — Never invent alert destinations:**
> NEVER infer or invent an alert destination. If no verified destination exists in:
> 1. `ops/PROVIDER-REGISTRY.md` (approved providers)
> 2. `secrets/*.json` (credential files)
> 3. Explicit Ahmad approval in session
> Then STOP and ask Ahmad. Do not proceed with implementation.

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

When watchdog detects 2+ consecutive failures, it sends via WhatsApp (if available) or email:

```
═══════════════════════════════════════════════════════
🚨 WATCHDOG ALERT — DIRECT (not via Moosa)
DELIVERY: WhatsApp (if gateway up) OR email (Neo SMTP fallback)
ALERT TIME: 2026-05-15T20:38:00.000Z

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This alert is from moosa-watchdog [PID 923372].
Moosa recovery will execute after your approval.
Delivery: WhatsApp (primary) | Email: ahmad.salim@qiyadon.com (fallback)
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
1. Add OpenClaw CLI WhatsApp sender (calls `openclaw.mjs message send` directly)
2. Add Neo SMTP email fallback (nodemailer → smtp0001.neo.space → ahmad.salim@qiyadon.com)
3. Add `consecutive_failures >= 2` → send alert via primary path (Level 2)
4. If OpenClaw CLI fails → send via Neo SMTP email fallback
5. Add `moosa.json` heartbeat read (Moosa liveness check)

### Moosa Changes (Phase 2)
1. Write `moosa.json` heartbeat every 1 minute
2. Approval processor: receive from session, validate, execute, validate, report
3. If Moosa was down and recovers: pick up queued approvals, process in order

### No Changes Needed
- Worker logic unchanged
- Gateway unchanged (used only for WhatsApp primary path, not required for email fallback)
- Supabase schema unchanged
- Sidecar unchanged

---

## 12. SUMMARY

**The revised design ensures:**
1. ✅ Watchdog alerts work even if moosa-worker is down
2. ✅ Watchdog does NOT rely on moosa-worker for Level 2 alert delivery
3. ✅ Approval handling routes through Moosa when healthy, queues when down
4. ✅ Fallback path: watchdog sends direct alert (WhatsApp via OpenClaw CLI or email via Neo SMTP), Moosa recovers and processes queued approval
5. ✅ Normal checks remain local-only, zero MiniMax, zero cost
6. ✅ Recovery execution still requires explicit Ahmad approval
7. ✅ No automatic restarts — approval always required
8. ✅ Direct-alert mechanism (OpenClaw CLI + Neo SMTP fallback), Moosa liveness check, fallback approval queue, all safety gates

**The core fix:** Watchdog sends alerts via TWO independent paths — OpenClaw CLI for WhatsApp (requires gateway [26]) and Neo SMTP email (no gateway required). Moosa is only in the execution path, not the alert delivery path. Email destinations are VERIFIED from workspace files: ahmad.salim@qiyadon.com (primary), contact@qiyadon.com (backup).

---

*Revised design complete. Ready for Ahmad review.*