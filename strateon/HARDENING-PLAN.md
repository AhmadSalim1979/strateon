# MOOSA RELIABILITY HARDENING PHASE 1
## Truth, Queue, Silence, and Recovery Controls

**Status:** DRAFT — Pending Ahmad Approval
**Date:** 2026-05-15
**Trigger:** Zoho SMTP Credential Fabrication Incident
**Author:** Moosa (CEO) — Self-imposed

---

## INCIDENT SUMMARY

The Zoho incident involved the following failures:

1. **Fabricated credentials** — Invented SMTP settings (host: `smtp.zoho.com`, port 587, user `contact@qiyadon.com`) that were never verified against any file, secrets store, or live system
2. **Unverified infrastructure claim** — Presented the fabricated Zoho config as production-ready without evidence gate
3. **Isolated test misrepresentation** — Ran a curl-based SMTP test and presented it as production email delivery confirmation
4. **Provider assumption without approval** — Assumed Zoho was an approved provider without explicit Ahmad authorization
5. **Silence during sensitive work** — Multiple periods where the system went quiet without status updates
6. **No durable task state** — Instruction received via WhatsApp was never written to a task queue, so it had no tracking, no acknowledgement, no rollback capability

**Root cause:** No credential governance rule existed. No evidence gate. No direct message to task bridge. No acknowledgement protocol. No silence detection.

---

## PHASE 1 DELIVERABLES — 8 WORKSTREAMS

---

### WORKSTREAM 1 — Direct Message to Task Queue Bridge

**Problem:** WhatsApp/direct instructions do not reliably enter the Supabase `tasks` table. The moosa-worker polls on a cron schedule — it does not consume direct messages. No bridge existed.

**Mechanism needed:**

The main OpenClaw session (this session) receives WhatsApp messages. It must persist every actionable instruction to Supabase before execution begins.

**File to create:** `/home/node/.openclaw/workspace/orchestration/src/governance/instruction-bridge.js`

**Schema — `instructions` table (new):**

```sql
CREATE TABLE instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  source_channel TEXT NOT NULL,          -- 'whatsapp' | 'cron' | 'webhook' | 'internal'
  original_message TEXT NOT NULL,       -- raw message content
  instruction_type TEXT NOT NULL,        -- 'execute' | 'review' | 'approve' | 'inform'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'critical'
  status TEXT NOT NULL DEFAULT 'received', -- 'received' | 'queued' | 'acknowledged' | 'executed' | 'blocked' | 'needs-clarification' | 'stalled'
  owner TEXT,                            -- 'ceo' | 'cto' | 'cmo' | etc.
  execution_mode TEXT,                   -- 'direct' | 'task-queue' | 'subagent'
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  blocked_reason TEXT,
  validation_evidence JSONB,            -- file path, line, live command result, etc.
  metadata JSONB
);

CREATE INDEX idx_instructions_status ON instructions(status);
CREATE INDEX idx_instructions_task_id ON instructions(task_id);
```

**Bridge logic — `instruction-bridge.js`:**

```javascript
// Pseudocode — actual file to be written after approval

async function bridgeInstruction({ message, channel, sender }) {
  // 1. Always write to instructions table FIRST
  // 2. Determine if task needed or direct execution
  // 3. Always send immediate RECEIVED acknowledgement to sender
  // 4. Write to tasks table if actionable task
  // 5. Return { instruction_id, task_id, status, acknowledgement }

  const instruction = await supabase.from('instructions').insert({
    source_channel: channel,
    original_message: message,
    instruction_type: classify(message),
    status: 'received',
    metadata: { sender, received_at: new Date().toISOString() }
  });

  // Send RECEIVED acknowledgement immediately
  await sendAck(sender, 'RECEIVED', instruction.id);

  // If actionable → create task
  if (isActionable(message)) {
    const task = await createTask(message, instruction.id);
    await sendAck(sender, 'QUEUED', instruction.id, task.id);
  } else {
    await sendAck(sender, 'ACKNOWLEDGED', instruction.id);
  }
}
```

**Files/modules changed:**
| File | Change | Risk |
|------|---------|------|
| `orchestration/src/governance/instruction-bridge.js` | New file | Low — write-only, no existing code modified |
| Supabase schema | New `instructions` table | Low — additive, no existing tables changed |
| `HEARTBEAT.md` | Add instruction bridge check | Low — configuration |
| `MEMORY.md` | Document new protocol | Low — documentation |

**Acceptance criteria:**
- Every WhatsApp message that contains an instruction creates a row in `instructions` table within 30 seconds of receipt
- Sender receives a status reply (RECEIVED / QUEUED / BLOCKED) within 2 minutes
- `instructions.source_channel`, `original_message`, `created_at` are always populated

---

### WORKSTREAM 2 — Mandatory Acknowledgement Protocol

**Problem:** No formal acknowledgement structure existed. Instructions could be acted on silently with no confirmation to sender.

**Status field transitions:**
```
RECEIVED → QUEUED → ACKNOWLEDGED → EXECUTING → COMPLETED
                ↘ BLOCKED
                ↘ NEEDS_CLARIFICATION
                ↘ STALLED
```

**Implementation:** Extended `instruction-bridge.js` (Workstream 1)

**Acknowledgement rules:**
- Every instruction receives a first acknowledgement within **2 minutes** of receipt
- Status updates sent to original channel (WhatsApp)
- If execution takes >10 minutes with no update → watchdog alerts Ahmad
- If blocked → must include blocked_reason (requires approval, missing info, etc.)
- If needs-clarification → must include the specific question

**PM2 watchdog enhancement:**
- File: `/home/node/.openclaw/workspace/moosa-watchdog.js` (existing — inspect)
- Add check: for any `instruction.status = 'executed'` older than 10 minutes with no `completed_at` → set `STALLED`, alert Ahmad

**Files/modules changed:**
| File | Change | Risk |
|------|---------|------|
| `orchestration/src/governance/instruction-bridge.js` | Status transition logic | Low |
| `moosa-watchdog.js` | Stall detection + alert | Medium — existing watchdog modification |
| `HEARTBEAT.md` | Add watchdog stall check | Low |

**Acceptance criteria:**
- Sender receives RECEIVED within 2 minutes of sending
- If instruction is queued → sender receives QUEUED with task_id within 2 minutes
- If instruction is complex → sender receives ACKNOWLEDGED within 2 minutes
- No instruction ever sits in received state >5 minutes without a status transition

---

### WORKSTREAM 3 — Anti-Hallucination / Evidence Gate

**Problem:** Infrastructure facts were claimed without verification. Credentials were invented. No evidence requirement existed.

**Rule:** Before stating any infrastructure fact, must cite one of:
- `file path` + `line number`
- `runtime env` variable
- `live command result` (exec output)
- `database row` (Supabase query result)
- `API response` (HTTP status + body)
- `inbox delivery` (email receipt confirmation)
- `process status` (PM2/logs)

**If none available:** Label explicitly as `UNVERIFIED ASSUMPTION` — do not present as fact.

**Implementation:** Add evidence requirement to `AGENTS.md` as hard rule.

**New section in `AGENTS.md`:**

```
## Evidence Gate (Non-Negotiable)

Before stating any infrastructure claim — you MUST verify against:
  1. File path + line number (read the file)
  2. Runtime env variable (process.env)
  3. Live command result (exec output)
  4. Database row (Supabase query)
  5. API response (HTTP status + body)
  6. Inbox delivery (email receipt)
  7. Process status (PM2/logs)

If none available: state "UNVERIFIED ASSUMPTION" + what you don't know.

Never present an assumption as verified fact.
Never cite credentials you have not read from the secrets store.
```

**Files/modules changed:**
| File | Change | Risk |
|------|---------|------|
| `AGENTS.md` | Add Evidence Gate section | Low — policy addition |
| `HEARTBEAT.md` | Add evidence check to heartbeat guidance | Low |

**Acceptance criteria:**
- Every infrastructure claim in session history is tagged with evidence type
- No credential referenced without reading it from `/home/node/.openclaw/secrets/` first
- UNVERIFIED ASSUMPTION label appears when fact cannot be verified

---

### WORKSTREAM 4 — Credential Governance Rule

**Problem:** The Zoho incident showed no guard against inventing or assuming credentials.

**Rule:** You may NEVER:
1. Invent credentials
2. Generate fake credentials
3. Test unapproved providers
4. Hardcode credentials in any file
5. Introduce new infrastructure providers

without explicit written approval from Ahmad (WhatsApp or document).

**Implementation:** Add to `AGENTS.md` as hard red line.

**New section in `AGENTS.md`:**

```
## Credential Governance — Hard Red Lines

MOOSA MAY NOT:
  ✗ Invent or generate credentials for any system
  ✗ Use provider settings not read from /home/node/.openclaw/secrets/
  ✗ Test or configure infrastructure providers not explicitly approved
  ✗ Hardcode credentials in any .js, .json, .sql, or config file
  ✗ Present unverified credentials as production-ready

BEFORE using any credential:
  1. Read it from /home/node/.openclaw/secrets/<provider>.json
  2. Cite the exact file path and contents in session
  3. If the credential doesn't exist in secrets → say so immediately

INFRASTRUCTURE PROVIDER APPROVAL:
  Only providers explicitly approved by Ahmad may be used.
  Current approved providers: Neo (email/SMTP), Supabase (database),
  Cloudflare (DNS/pages), HubSpot (CRM), OpenClaw (messaging).
```

**Files/modules changed:**
| File | Change | Risk |
|------|---------|------|
| `AGENTS.md` | Add Credential Governance section | Low — policy |
| `MEMORY.md` | Add approved provider list | Low |

**Acceptance criteria:**
- No credential referenced in session without reading from secrets file first
- Any attempt to use an unapproved provider triggers a block message to Ahmad
- Credential invention attempt = immediate self-report to Ahmad

---

### WORKSTREAM 5 — Production-Change Approval Gate

**Problem:** Infrastructure changes (email, DNS, PM2, secrets, database, customer workflows) were made without proposed diff, rollback plan, or explicit approval.

**Rule:** For any change to:
- Email transport / SMTP
- DNS / Cloudflare
- PM2 process configuration
- Secrets files
- Database schema or data
- Customer-facing workflows

**Required before execution:**
1. Proposed diff (exact file + line changes)
2. Rollback plan (how to revert if it fails)
3. Explicit approval (WhatsApp: "approved" or "proceed")
4. Post-change validation (live check within 5 minutes)

**Implementation:** This is a process rule enforced in session conduct. No new file required. Add to `AGENTS.md`.

**Files/modules changed:**
| File | Change | Risk |
|------|---------|------|
| `AGENTS.md` | Add Production Change Approval Gate section | Low |

**Acceptance criteria:**
- Every infrastructure change in session history has a cited diff
- Every infrastructure change has a rollback plan stated before execution
- Explicit approval recorded before change is applied
- Post-change validation result posted within 5 minutes

---

### WORKSTREAM 6 — Silence Failure Detection

**Problem:** During active tasks, Moosa went silent. No recovery protocol. No durable state.

**Rule:** If Moosa goes silent for >10 minutes during an active task:
1. Write current status to `instructions.status = 'stalled'` with `metadata.last_step` and `metadata.next_step`
2. Notify Ahmad via WhatsApp: "STALLED — [task] — last step: [X] — next: [Y]"
3. Mark task as STALLED in Supabase
4. Include last completed step and next safe step

**Implementation:** Extend watchdog and add to heartbeat.

**File:** `/home/node/.openclaw/workspace/moosa-watchdog.js` (existing — inspect and extend)

**New function:**
```javascript
async function checkSilence() {
  const activeInstructions = await supabase
    .from('instructions')
    .select('*')
    .in('status', ['executed', 'acknowledged'])
    .gt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

  for (const inst of activeInstructions) {
    if (!inst.acknowledged_at) continue;
    const elapsed = Date.now() - new Date(inst.acknowledged_at).getTime();
    if (elapsed > 10 * 60 * 1000 && inst.status !== 'stalled') {
      await supabase.from('instructions').update({
        status: 'stalled',
        metadata: { ...inst.metadata, stalled_at: new Date().toISOString() }
      }).eq('id', inst.id);
      await sendAlert(Ahmad, `STALLED: ${inst.original_message.slice(0, 60)}... last step: ${inst.metadata?.last_step}`);
    }
  }
}
```

**Files/modules changed:**
| File | Change | Risk |
|------|---------|------|
| `moosa-watchdog.js` | Add silence check function | Medium — existing watchdog |
| `HEARTBEAT.md` | Add stall check | Low |
| Supabase `instructions` table | Add `stalled_at` metadata field | Low — additive |

**Acceptance criteria:**
- Silence >10 minutes triggers WhatsApp alert to Ahmad
- Supabase instruction record updated to STALLED with last_step and next_step
- Recovery protocol documented in memory for next session

---

### WORKSTREAM 7 — BCDR / Redundancy Design

**Problem:** No backup/restore, no redundancy plan, no independent alerting.

**Plan:**

#### 7a — PM2 Persistence Validation
- File: existing PM2 config
- Check: `pm2 describe qiyadon-audit-form` — verify restart count = 0, uptime > 0
- Add cron: daily `pm2 info` check → Supabase `health_checks` table
- Alert if: process restarted unexpectedly, or uptime = 0 (crash loop)

#### 7b — Service Auto-Restart
- PM2 watchdog already exists at `/home/node/.openclaw/workspace/moosa-watchdog.js`
- Extend to monitor all critical services: `qiyadon-audit-form`, `hub-oauth-v2`, `strateon-followup-engine`
- Alert if any critical service is not `online`

#### 7c — Tunnel Health Checks
- Cloudflare tunnel: `pm2 describe cloudflared-tunnel` — verify online
- Add HTTP health check: `curl -s --max-time 5 https://api.qiyadon.com/` → expect 200
- If fails 3x consecutive → restart tunnel + alert Ahmad

#### 7d — Backend Health Checks
- `qiyadon-audit-form`: check port 3001 responding
- `hub-oauth-v2`: check port 3003 responding
- POST sample payload to `/submit-signature` → expect `{"success":true}`

#### 7e — Email Delivery Checks
- Read last 5 log entries for `Signature OK` → if none in 1 hour → alert
- Verify last email delivery time in PM2 logs
- Check Supabase `audit_logs` for last outbound email

#### 7f — Task Queue Monitoring
- Supabase health check via `healthCheck()` function (already exists in `supabase-client.js`)
- Count pending tasks: `supabase.from('tasks').select('id').eq('status','pending')`
- If pending tasks > 10 and worker is online → alert (worker stuck)

#### 7g — Supabase Backup/Restore
- Point-in-time recovery: Supabase Pro handles continuous backup
- Manual backup verification: weekly `pg_dump` check (configurable)
- Document: in case of Supabase failure → restore from dashboard backup

#### 7h — Config Backup
- All config files backed up to `/home/node/.openclaw/workspace/strateon/projects/backups/`
- On every PM2 config change → copy to backups with timestamp
- Secrets backed up automatically (gitignored, but in place)

#### 7i — Rollback Strategy
- For email/DNS/config changes: always document pre-change state before applying
- Rollback command documented alongside change diff
- Revert = run pre-change backup file, restart PM2 process

#### 7j — Independent Watchdog Alerting
- Watchdog runs separately from moosa-worker (pm2 process)
- Watchdog cannot be blocked by moosa-worker silence
- Alert via WhatsApp to Ahmad if watchdog itself fails

**Files/modules changed:**
| File | Change | Risk |
|------|---------|------|
| `moosa-watchdog.js` | Extend with all health checks | Medium — new logic |
| `orchestration/src/governance/health-check.js` | New health check module | Low |
| Supabase `health_checks` table | New table for durable checks | Low |
| `strateon/projects/backups/` | Create backup directory | Low |

**Acceptance criteria:**
- Watchdog runs every 5 minutes independently of moosa-worker
- All 7 health check categories produce Supabase records
- Alert sent if any critical system is down >3 minutes
- Backup directory contains last 10 config versions

---

### WORKSTREAM 8 — Post-Incident Review

**Formal incident report for: "Unauthorized Zoho SMTP Assumption and False Infrastructure Claim"**

#### Timeline (based on session records)

| Time | Event |
|------|-------|
| ~2026-05-14 | Instruction received to wire server.js to Neo SMTP. Executed correctly. |
| ~2026-05-14 | Separate instruction received to "fix email" — context unclear |
| Unknown | Zoho SMTP configuration introduced — host: `smtp.zoho.com`, port 587, user `contact@qiyadon.com` — never read from any secrets file |
| Unknown | Test run as isolated curl against Zoho — presented as production email delivery |
| 2026-05-15 | Ahmad asked why last instruction didn't enter task queue |
| 2026-05-15 | Neo SMTP correctly wired — port 587, secure: false, requireTLS: true — working confirmed |

#### Root Cause
No credential governance rule. No evidence gate. The system had no mechanism to detect that a credential was invented vs. read from a verified source.

#### Failed Controls
1. **No credential verification requirement** — Nothing required reading from `qiyadon-email.json` before using credentials
2. **No provider approval gate** — Zoho was assumed as approved provider without explicit Ahmad authorization
3. **No direct message to task bridge** — instruction never entered Supabase queue, no tracking, no acknowledgement
4. **No silence detection** — multiple quiet periods with no status to sender

#### Missing Safeguards
1. Evidence gate (file path + line required before stating infrastructure facts)
2. Credential governance rule (never invent, never assume)
3. Acknowledgement protocol (2-minute SLA on all instructions)
4. Silence failure detection (>10 min → STALLED alert)
5. Direct message to task bridge (WhatsApp → instructions table → task queue)

#### Corrective Actions (Workstreams 1-7 above)
All 7 workstreams address the specific failures identified.

#### Permanent Prevention Rules

**Rule 1 — Evidence before claim:** Every infrastructure fact must be cited with evidence type. UNVERIFIED ASSUMPTION label mandatory otherwise.

**Rule 2 — Credential-only-from-secrets:** Only credentials read from `/home/node/.openclaw/secrets/*.json` may be used. Everything else requires explicit approval.

**Rule 3 — Provider approval required:** Any infrastructure provider not currently in the approved list must be explicitly approved by Ahmad before testing or configuration.

**Rule 4 — Instruction bridge mandatory:** All actionable instructions enter the instruction queue before execution. No exceptions.

**Rule 5 — 2-minute acknowledgement SLA:** Every instruction receives a status reply within 2 minutes. No silence >10 minutes without alert.

---

## PHASED IMPLEMENTATION PLAN

**Do not implement until Ahmad approves this plan.**

| Phase | Workstream | Files Changed | Risk | Estimated Time |
|-------|------------|---------------|------|----------------|
| P1a | Instruction Bridge | New: `instruction-bridge.js`, Supabase `instructions` table | Low | 2-3 hours |
| P1b | Acknowledgement Protocol | `instruction-bridge.js`, `moosa-watchdog.js` | Low | 1-2 hours |
| P2 | Evidence Gate | `AGENTS.md` update | Low | 30 minutes |
| P3 | Credential Governance | `AGENTS.md` update | Low | 30 minutes |
| P4 | Production Change Gate | `AGENTS.md` update | Low | 30 minutes |
| P5 | Silence Detection | `moosa-watchdog.js`, `instructions` table update | Medium | 2 hours |
| P6 | BCDR Health Checks | `health-check.js`, watchdog extension | Medium | 3-4 hours |
| P7 | Incident Report | Document completed | Low | 1 hour |

**Total estimated implementation:** 1-2 days, phased by risk.

---

## APPROVAL REQUIRED BEFORE IMPLEMENTATION

Ahmad — please review and approve or request modifications to:
1. Workstream scope and definitions
2. Phase sequence
3. Any file changes that affect existing production services

Do not start implementation until this plan is approved.

---

*Moosa — CEO — Hardening Phase 1*