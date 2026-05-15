# PHASE 1 IMPLEMENTATION PLAN
## Instruction Bridge + Acknowledgement Protocol

**Status:** READY — Pending Ahmad Approval
**Date:** 2026-05-15
**Phase:** 1 of 5
**Objective:** Create deterministic instruction intake, acknowledgement, and lifecycle tracking

---

## EXACT FILES/MODULES TO CHANGE

### New Files

| File | Purpose | Risk |
|------|---------|------|
| `/ops/instruction-bridge.js` | Core instruction bridge module — writes to `instructions` table, creates tasks, emits acks | Low |
| `/ops/instruction-bridge.sql` | Supabase schema migration for `instructions` table | Low |

### Modified Files

| File | Change | Risk |
|------|---------|------|
| `HEARTBEAT.md` | Add instruction bridge check to heartbeat loop | Low |
| `AGENTS.md` | Add instruction bridge call requirement to startup | Low |
| `/ops/CHANGELOG.md` | Append Phase 1 entry | Low |
| `/ops/OPERATIONAL-GOVERNANCE.md` | Update governance index | Low |

### No Other Files Modified

No PM2, no worker code, no runtime orchestration changes.

---

## SCHEMA CHANGES

### New Table: `instructions`

```sql
CREATE TABLE IF NOT EXISTS instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID REFERENCES instructions(id),     -- links child instructions to parent
  source_channel TEXT NOT NULL,                        -- 'whatsapp' | 'cron' | 'webhook' | 'internal'
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  original_message TEXT NOT NULL,                     -- immutable original snapshot
  normalized_instruction TEXT,                          -- parsed/normalized version
  instruction_type TEXT NOT NULL,                      -- 'execute' | 'review' | 'approve' | 'inform'
  priority TEXT NOT NULL DEFAULT 'medium',             -- 'low' | 'medium' | 'high' | 'critical'
  status TEXT NOT NULL DEFAULT 'received',             -- 'received' | 'queued' | 'acknowledged' | 'executed' | 'blocked' | 'needs-clarification' | 'stalled' | 'completed'
  execution_mode TEXT,                                 -- 'direct' | 'task-queue' | 'subagent'
  assigned_worker TEXT,                                -- 'moosa' | 'cto' | 'cmo' etc.
  acknowledgement_state TEXT,                          -- 'pending' | 'sent' | 'failed'
  last_update_at TIMESTAMPTZ DEFAULT now(),
  retry_count INT DEFAULT 0,
  failure_reason TEXT,
  state_transitions JSONB DEFAULT '[]',                -- [{from, to, at, by}]
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_instructions_status ON instructions(status);
CREATE INDEX idx_instructions_correlation_id ON instructions(correlation_id);
CREATE INDEX idx_instructions_source_channel ON instructions(source_channel);
CREATE INDEX idx_instructions_created_at ON instructions(created_at);
```

### Existing `tasks` Table — No Schema Change

The instruction bridge will create tasks in the existing `tasks` table. No changes to existing schema.

### Dispatches Table — No Schema Change

Dispatch lifecycle tracking remains unchanged. The instruction bridge does not touch `dispatches`.

---

## IMPLEMENTATION DETAIL

### instruction-bridge.js — Core API

```javascript
// File: /ops/instruction-bridge.js
// Core functions:
exports.bridgeInstruction(message, channel, sender) → { instruction_id, task_id, status, acknowledgement }
exports.createTask(instruction_id, normalized_instruction, priority) → { task_id }
exports.emitAcknowledgement(instruction_id, status, sender) → { success }
exports.updateInstructionStatus(instruction_id, new_status, metadata) → { success }
exports.getInstructionState(instruction_id) → { status, state_transitions, last_update_at }
```

### Bridge Flow

1. **Intercept** — Every instruction received in main session → call `bridgeInstruction()`
2. **Write** — `bridgeInstruction()` writes to `instructions` table with all required fields
3. **Acknowledge** — Immediately emit acknowledgement to sender (RECEIVED)
4. **Classify** — Determine if instruction is actionable (→ task) or informational (→ acknowledged only)
5. **If actionable** → create task in `tasks` table, emit QUEUED acknowledgement
6. **State tracking** — All state transitions recorded in `state_transitions` JSONB array

### Instruction Type Classification

```javascript
function classifyInstruction(message) {
  const text = message.toLowerCase();
  if (text.match(/^(execute|do|fix|build|create|implement|wire|restart|update)/)) return 'execute';
  if (text.match(/^(review|check|audit|verify|validate)/)) return 'review';
  if (text.match(/^(approve|confirm|yes|proceed|go)/)) return 'approve';
  return 'inform';
}
```

### Acknowledgement SLA

| Status | When emitted | Channel |
|--------|-------------|---------|
| RECEIVED | Within 1 minute of receipt | WhatsApp to sender |
| QUEUED | Within 2 minutes if task created | WhatsApp to sender |
| ACKNOWLEDGED | Within 2 minutes if informational | WhatsApp to sender |
| NEEDS_CLARIFICATION | If instruction is ambiguous | WhatsApp to sender |
| BLOCKED | If credential/provider not approved | WhatsApp to sender |
| EXECUTING | When worker picks up task | WhatsApp to sender |
| COMPLETED | When task finishes | WhatsApp to sender |

### Queue Write Failure Handling

```javascript
async function bridgeInstruction(message, channel, sender) {
  try {
    const result = await writeToInstructionsTable(message, channel, sender);
  } catch (err) {
    // EMIT EXPLICIT FAILURE — never silently drop
    await sendAlert(Ahmad, `INSTRUCTION BRIDGE FAILURE: ${err.message}. Instruction not queued. Manual intervention required.`);
    return { success: false, error: err.message, instruction_id: null, task_id: null };
  }
}
```

### State Transition Recording

```javascript
function recordTransition(instructionId, fromState, toState, metadata = {}) {
  const transition = {
    from: fromState,
    to: toState,
    at: new Date().toISOString(),
    by: 'moosa',
    metadata
  };
  // Append to state_transitions JSONB array
  supabase.from('instructions').update({
    state_transitions: supabase.sql`state_transitions || ${JSON.stringify([transition])}`,
    last_update_at: new Date().toISOString()
  }).eq('id', instructionId);
}
```

---

## ROLLBACK PLAN

### Step 1 — Revert Schema

```sql
DROP TABLE IF EXISTS instructions;
-- Instructions table removed, no data loss (was empty at this point)
```

### Step 2 — Remove Module

```bash
rm /ops/instruction-bridge.js
rm /ops/instruction-bridge.sql
```

### Step 3 — Revert AGENTS.md and HEARTBEAT.md

```bash
git checkout -- AGENTS.md HEARTBEAT.md
```

### Step 4 — Restart PM2 (if needed)

```bash
pm2 restart moosa-worker  # worker unaffected since it doesn't read instructions table
```

### Blast Radius

- **If rolled back within first hour:** No data loss, no service disruption. `instructions` table was empty (fresh start).
- **If rolled back after tasks created:** `instructions` rows remain in Supabase (orphaned). `tasks` table unaffected. Worker continues processing tasks normally.
- **AGENTS.md revert:** New governance sections removed. Worker continues normally.
- **HEARTBEAT.md revert:** Heartbeat instruction check removed. No impact on worker.

**Overall blast radius:** Minimal. Additive only until first task creation.

---

## BLAST RADIUS ASSESSMENT

| Component | Impact | Notes |
|-----------|--------|-------|
| `instructions` table | Low — new table, empty at start | No existing data touched |
| `tasks` table | None — writes new rows only | No schema change, no existing rows modified |
| `dispatches` table | None | Not touched by instruction bridge |
| moosa-worker | None — polls tasks table unchanged | Worker doesn't read `instructions` table |
| PM2 processes | None | No config changes |
| Production email | None | No SMTP/config changes |
| Customer workflows | None | No customer-facing changes |
| Secrets | None | No secrets touched |
| DNS/Cloudflare | None | No infrastructure changes |

**Blast radius verdict:** Minimal to none. Additive changes only.

---

## VALIDATION PLAN

### Test Instruction Injection

**Step 1:** After deployment, send test instruction via WhatsApp:
```
Test Phase 1 instruction bridge — please ignore
```

**Step 2:** Verify in Supabase — `instructions` row created with:
- `source_channel = 'whatsapp'`
- `original_message` contains exact text sent
- `status = 'received'`
- `received_at` within 1 minute of send

**Step 3:** Verify acknowledgement received on WhatsApp within 2 minutes:
- Should see "RECEIVED" or "QUEUED" reply

### Queue Persistence Check

```bash
SUPABASE_KEY="sb_secret__T1GYuCAvox2_EQXrRwGLg_yXXI-GvS"
curl -s -H "Authorization: Bearer $SUPABASE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=*&order=created_at.desc&limit=1" 2>/dev/null
```

Expected: row exists with all required fields populated.

### Worker Pickup Check

After sending test instruction, verify:
1. `instructions.status = 'queued'` (bridge created task)
2. `instructions.acknowledgement_state = 'sent'`
3. Task appears in `tasks` table (worker will pick up on next poll cycle)

### State Recovery Check

**Step 1:** With an instruction in `executed` or `acknowledged` state, restart worker:
```bash
pm2 restart moosa-worker
```

**Step 2:** Verify after restart:
- `instructions` row still exists
- `status` unchanged (worker doesn't modify instructions table)
- `state_transitions` array intact
- `last_update_at` preserved

### Audit Trail Continuity Check

Query state transitions for any instruction:
```bash
curl -s -H "Authorization: Bearer $SUPABASE_KEY" \
  "https://btrbczqjwzuybgcxckvm.supabase.co/rest/v1/instructions?select=state_transitions&limit=1" 2>/dev/null
```

Expected: `state_transitions` is a JSONB array, not null, with at least one entry.

---

## IMPLEMENTATION SEQUENCE

**Do not run multiple steps simultaneously.**

### Step 1: Create Schema Migration

File: `/ops/instruction-bridge.sql`

Run via Supabase SQL editor or direct connection. No service interruption.

### Step 2: Deploy instruction-bridge.js

File: `/ops/instruction-bridge.js`

Deploy to workspace. No service interruption.

### Step 3: Update HEARTBEAT.md

Add instruction bridge check to heartbeat. No service interruption.

### Step 4: Update AGENTS.md

Add instruction bridge call requirement to session startup. No service interruption.

### Step 5: Append CHANGELOG.md

Document Phase 1 deployment. No service interruption.

### Step 6: Run Validation Tests

Execute validation sequence above. Manual step, no automation required.

---

## ACKNOWLEDGEMENT

Ahmad — this plan creates the instruction bridge without modifying any runtime behavior. The bridge is additive. The worker continues to process tasks exactly as before. The only new behavior is: every instruction now creates a durable record and sends acknowledgement.

Please approve to begin implementation.

---

*Moosa — CEO — Phase 1 Implementation Plan*