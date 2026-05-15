# PHASE 2 IMPLEMENTATION PLAN
## Permanent Instruction Bridge Wiring

**Status:** READY — Pending Ahmad Approval
**Date:** 2026-05-15
**Phase:** 2 of 5 (Foundation → Policy → Runtime Safety → BCDR → Go Live)
**Objective:** Wire `bridgeInstruction()` into the main session so every WhatsApp/direct instruction creates a durable row and acknowledgement

---

## UNDERSTANDING THE CURRENT SYSTEM

### How Messages Reach Moosa (Main Session)

```
WhatsApp → OpenClaw Gateway → Main AI Session (moosa) → Response
```

The main AI session (this session) is the recipient of all WhatsApp messages from Ahmad. Every instruction arrives here before any processing occurs.

**This is why Phase 1 validation worked via direct node execution — the bridge module was called from this same main session context.**

The moosa-worker (separate PM2 process) polls Supabase tasks table — it is not the WhatsApp recipient. Messages arrive via OpenClaw's session handling, not via the worker's polling loop.

---

## EXACT MESSAGE RECEIVE PATH

### Current Path (Before Phase 2)

```
1. WhatsApp message from Ahmad
   ↓
2. OpenClaw Gateway routes to main session
   ↓
3. Main session receives message text
   ↓
4. Session startup: AGENTS.md reads SOUL.md, USER.md, memory, MEMORY.md
   ↓
5. Message processing: I respond directly (no bridge call)
   ↓
6. WhatsApp reply sent to Ahmad
```

### After Phase 2 (With Bridge Wiring)

```
1. WhatsApp message from Ahmad
   ↓
2. OpenClaw Gateway routes to main session
   ↓
3. Session startup: AGENTS.md reads SOUL.md, USER.md, memory, MEMORY.md
   ↓
4. NEW: bridgeInstruction() called BEFORE message processing
   - Writes to `instructions` table
   - Creates task if actionable
   - Sends RECEIVED acknowledgement via WhatsApp
   ↓
5. Message processing continues normally
   ↓
6. Status updated to QUEUED/ACKNOWLEDGED via bridge
   ↓
7. WhatsApp reply sent (includes acknowledgement)
```

**Key insight:** The bridge is called in the main session, not in moosa-worker. The worker continues to poll tasks as before. This is additive — it does not change the worker's behavior.

---

## EXACT FILE/MODULE TO CHANGE

### File: `/home/node/.openclaw/workspace/AGENTS.md`

**Section: "## Session Startup"**

Add step 5 (after step 4 of the existing startup sequence):

```
5. Call bridgeInstruction() for every inbound message from Ahmad:
   - Intercept the incoming message text before processing
   - bridgeInstruction(message, 'whatsapp', sender_id)
   - This creates a durable `instructions` row
   - Acknowledgement is sent via WhatsApp automatically by the bridge
   - Do NOT process the instruction if bridge fails — emit BLOCKED alert
```

**Implementation approach:**
- The bridge call happens at the start of each main session turn where a message from Ahmad is received
- The AGENTS.md "Session Startup" section is the correct location because it governs what happens when a session starts or a message is received
- `bridgeInstruction()` is idempotent and can be called on every message without side effects
- Duplicate detection is handled by checking if a near-identical message was received within the last 60 seconds (see Section 4 below)

### File: `/ops/instruction-bridge.js` (already exists, no change needed)

The bridge module is complete and validated. No modifications required.

### File: `/home/node/.openclaw/workspace/HEARTBEAT.md` (update)

Add instruction bridge health check to the heartbeat rotation:

```
- **Instruction Bridge** — Check that bridge is functioning (last instruction row age < 5 min)
```

---

## DUPLICATE INSTRUCTION PREVENTION

### Strategy

Before creating a new instruction row, check for a near-identical message from the same sender within the last 60 seconds:

```javascript
async function isDuplicate(message, sender) {
  const supabase = getClient();
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('instructions')
    .select('id, original_message, sender_metadata->sender')
    .eq('source_channel', 'whatsapp')
    .gte('received_at', sixtySecondsAgo);
  
  // Normalize both messages for comparison
  const normalized = normalizeInstruction(message);
  
  return data.some(row => {
    const existingNormalized = normalizeInstruction(row.original_message);
    return existingNormalized === normalized && row.sender === sender;
  });
}
```

**Duplicate handling:**
- If duplicate detected → do NOT create new row
- Do NOT send second acknowledgement
- Update `last_update_at` on existing row to show continued engagement
- Log duplicate detection: `duplicate detected for instruction X — no new row created`

**This prevents:**
- Re-sending the same instruction creates duplicate rows
- Network retries/resends create duplicate instruction records
- User repeats the same message within 60 seconds

---

## ACKNOWLEDGEMENT EMISSION

### Flow

```
bridgeInstruction() called
  ↓
instruction row created (status: received)
  ↓
bridge sends WhatsApp acknowledgement to sender:
  "RECEIVED — instruction logged at [time]"
  ↓
If actionable (execute/review type):
  task created → status: queued
  second acknowledgement: "QUEUED — task [ID] created"
If informational:
  status: acknowledged
  acknowledgement: "ACKNOWLEDGED — no action required"
```

### WhatsApp Acknowledgement Format

For `received`:
```
✅ RECEIVED — your instruction has been logged
Type: [instruction_type]
Priority: [priority]
Time: [received_at]
```

For `queued` (additional, if task created):
```
📋 QUEUED — action task created
Task ID: [task_id]
Status: pending
```

For `acknowledged` (informational only):
```
✅ ACKNOWLEDGED — no action required
Your message has been noted.
```

### Implementation

The `sendWhatsApp()` function from the moosa-worker's handlers is available via:
```javascript
import { sendWhatsApp } from '/root/.openclaw/workspace/moosa-worker/src/handlers/send_whatsapp.js';
```

The bridge module will call `sendWhatsApp()` directly to emit acknowledgements. This is already a working function used by the worker.

---

## HOW INSTRUCTIONS BECOME TASKS

### Decision Logic

```javascript
function shouldCreateTask(instructionType, message) {
  // Execute actions → task (worker picks up)
  if (instructionType === 'execute') return true;
  
  // Review actions → task (worker picks up)
  if (instructionType === 'review') return true;
  
  // Approve/Inform → no task, handled in-session
  return false;
}
```

### Task Creation (from bridgeInstruction)

```javascript
// If actionable → create task in tasks table
if (shouldCreateTask(instructionType, message)) {
  const { data: task } = await supabase
    .from('tasks')
    .insert({
      goal: normalizeInstruction(message).slice(0, 500),
      status: 'pending',
      action_type: 'instruction_bridge',
      input_json: {
        instruction_id: instruction.id,
        original_message: message,
        source_channel: channel,
        sender
      },
      max_retries: 3,
      retry_count: 0
    })
    .select()
    .single();
  
  // Update instruction status
  await supabase
    .from('instructions')
    .update({ status: 'queued', execution_mode: 'task-queue' })
    .eq('id', instruction.id);
  
  return { task_id: task.id, status: 'queued' };
}
```

### Worker Behavior (UNCHANGED)

The moosa-worker polls `tasks` table and processes tasks as before. Adding an instruction-bridge task does not change worker behavior — the worker sees a new `pending` task and processes it normally.

---

## INSTRUCTION-ONLY vs TASK-EXECUTABLE

### Instruction-Only (handled in-session, no task created)

| Instruction Type | Example | Handling |
|-------------------|---------|----------|
| `inform` | "Noted", "Thanks", "OK", casual | Acknowledged only, no task |
| `approve` | "Go ahead", "Approved", "Proceed" | Status update, no task |
| `ask` | "What's the status?", "Tell me X" | Response in-session, no task |

### Task-Executable (creates task, worker picks up)

| Instruction Type | Example | Handling |
|-------------------|---------|----------|
| `execute` | "Fix X", "Build Y", "Wire Z", "Update A" | Task created, worker picks up |
| `review` | "Audit", "Review", "Check", "Verify" | Task created, worker picks up |

**Rule:** If the instruction requires a change to production (email, DNS, PM2, database, etc.) → task. If it's a question, acknowledgement, or informational → in-session.

---

## ROLLBACK PLAN

### If Phase 2 causes issues

**Step 1: Disable bridge wiring**
```bash
# Remove the bridge call from AGENTS.md
git checkout -- AGENTS.md
# Restart session — bridge wiring removed
```

**Step 2: Existing instruction rows remain**
- `instructions` table data is preserved
- No data loss
- Worker unaffected — it doesn't read `instructions` table

**Step 3: Verify no disruption**
```bash
# Send test message — should work without instruction row
# Check PM2 logs — worker running normally
# Check no duplicate rows created
```

### Blast Radius if Rolled Back

- Existing `instructions` rows remain (no data loss)
- Worker continues processing tasks normally (no behavior change)
- WhatsApp messaging works normally (no disruption)
- Only change removed: the durable instruction logging

---

## BLAST RADIUS ASSESSMENT

| Component | Impact | Notes |
|-----------|--------|-------|
| WhatsApp message handling | None — acknowledgement added, not changed | Messages still processed and replied to as before |
| moosa-worker | None — polls tasks table unchanged | Worker behavior unmodified |
| PM2 processes | None — no config changes | All processes run as before |
| Supabase `tasks` table | None — only INSERT new rows | No schema change, no existing rows touched |
| `instructions` table | Additive — new rows only | No modification to existing rows |
| Email/SMTP | None | No changes |
| DNS/Cloudflare | None | No changes |
| Customer workflows | None | No changes |
| Secrets | None | Not touched |

**Blast radius verdict:** Minimal. Additive only. No existing behavior changed.

---

## VALIDATION SEQUENCE

### Before Enabling Bridge Wiring

1. Verify `instructions` table is empty (clean state)
2. Verify `instruction-bridge.js` module is present and imports correctly

### After Enabling Bridge Wiring

1. Send test instruction via WhatsApp:
   ```
   Phase 2 bridge wiring test — please ignore
   ```

2. Within 2 minutes, verify:
   - ✅ Acknowledgement received on WhatsApp (RECEIVED)
   - ✅ `instructions` table has new row
   - ✅ `original_message` preserved exactly
   - ✅ `status` is `received` or `queued`
   - ✅ `state_transitions` has at least 1 entry
   - ✅ `acknowledgement_state` is `sent` or `pending`
   - ✅ No duplicate row for same message (within 60 seconds)

3. Send second test with slightly different text:
   ```
   Phase 2 bridge wiring test variant
   ```
   - Verify new row created (different message = not duplicate)
   - Verify correlation with first test (optional)

4. Send informational message (no task expected):
   ```
   Acknowledged — testing informational flow
   ```
   - Verify `status = acknowledged` (not `queued`)
   - Verify no task created in `tasks` table

5. Verify worker still functioning:
   ```bash
   pm2 logs moosa-worker --lines 10 --nostream
   ```
   - Worker should be running, processing tasks normally
   - No errors related to instruction bridge

6. Restart worker, verify state recovery:
   ```bash
   pm2 restart moosa-worker
   ```
   - Worker restarts and resumes polling
   - `instructions` rows remain intact

---

## PERMANENT WIRING DETAILS

### Location: AGENTS.md — Session Startup

```markdown
## Session Startup

Before doing anything else:

1. Read `SOUL.md` — this is who you are
2. Read `USER.md` — this is who you're helping
3. Read `memory/YYYY-MM-DD.md` (today + yesterday) for recent context
4. **If in MAIN SESSION** (direct chat with your human): Also read `MEMORY.md`

Don't ask permission. Just do it.

### 🚨 Startup Memory Check — RECOVER MISSING MEMORY IMMEDIATELY

**5. If today's memory/YYYY-MM-DD.md doesn't exist:**
  - This is a CRITICAL FAILURE from the previous session
  - Create it IMMEDIATELY before doing anything else

### 📥 Instruction Bridge — MANDATORY

For every inbound message from Ahmad (+923215139934):

**5a. Call bridgeInstruction() BEFORE processing the message:**
```javascript
const { bridgeInstruction } = require('/home/node/.openclaw/workspace/ops/instruction-bridge.js');
// At start of each inbound message handler:
const result = await bridgeInstruction(message_text, 'whatsapp', sender_id);
if (!result.success && result.status === 'blocked') {
  // Emit failure alert to Ahmad immediately
  await sendAlert(Ahmad, `BRIDGE FAILURE: ${result.error}`);
}
```

**5b. Send acknowledgement via WhatsApp (handled by bridge):**
- RECEIVED sent within 1 minute
- QUEUED sent within 2 minutes if task created
- ACKNOWLEDGED sent for informational messages

**5c. Duplicate detection:**
- Check for same normalized message from same sender within 60 seconds
- If duplicate → update last_update_at only, no new row, no second acknowledgement

### 🚨 End-of-Session Memory Write — NON-NEGOTIABLE
```

### Import Addition

Add at top of AGENTS.md (after existing imports if any):
```javascript
// Instruction Bridge — Phase 2 permanent wiring
const { bridgeInstruction } = require('/home/node/.openclaw/workspace/ops/instruction-bridge.js');
```

---

## WHAT PHASE 2 DOES NOT TOUCH

- moosa-worker (unchanged)
- watchdog (unchanged)
- PM2 (unchanged)
- Cloudflare (unchanged)
- email/SMTP (unchanged)
- customer workflows (unchanged)
- autonomous retries (not implemented in Phase 2)
- task queue polling interval (unchanged)

---

## SEQUENCE TO ENABLE

1. Update AGENTS.md with bridge wiring
2. Commit: `feat: Phase 2 — instruction bridge permanent wiring`
3. Send test instruction
4. Validate per validation sequence
5. If issues → `git checkout -- AGENTS.md` (rollback)
6. If clean → Phase 2 complete

---

## APPROVAL REQUIRED

Ahmad — this plan covers all 10 required items:
1. ✅ Exact message receive path — OpenClaw → main session → bridge
2. ✅ Exact file — AGENTS.md Session Startup section
3. ✅ Where bridgeInstruction() called — start of message processing
4. ✅ Duplicate prevention — 60-second window + normalized message comparison
5. ✅ Acknowledgement emission — sendWhatsApp via bridge
6. ✅ How instructions become tasks — actionable type → task creation
7. ✅ Instruction-only vs task-executable — clear classification
8. ✅ Rollback plan — git checkout AGENTS.md, no data loss
9. ✅ Blast radius — minimal, additive only
10. ✅ Validation sequence — 6-step end-to-end

Please approve to begin implementation.

---

*Moosa — CEO — Phase 2 Implementation Plan*