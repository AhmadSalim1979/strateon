# MOOSA RELIABILITY HARDENING PHASE 1
## Truth, Queue, Silence, and Recovery Controls

**Status:** APPROVED (with mandatory additions) — Implementation Pending
**Date:** 2026-05-15
**Approvals:** Ahmad Salim (2026-05-15)
**Author:** Moosa (CEO)

---

## OPERATIONAL PRINCIPLES (Non-Negotiable)

> Optimize for: **trustworthiness, recoverability, auditability, operational determinism**
> Not feature velocity.

### Truth Classification Layer (Addition 1)

Every operational statement must carry an explicit classification prefix:

```
[VERIFIED FACT]    — confirmed by file/line, command, API, DB, or process
[INFERRED]         — derived from available evidence, logical extension
[ASSUMPTION]       — stated as unverified, acknowledged as unknown
[UNKNOWN]          — explicitly flagged, no speculation
```

No blended narrative. No unclassified operational statements.

### Runtime Evidence Attachments (Addition 2)

Any infrastructure claim must include:
```
command: <exact command executed>
file:    <file path if applicable>
time:    <ISO 8601 timestamp>
pid:     <process ID if relevant>
result:  <actual output>
```

### Safe Failure Mode (Addition 4)

When uncertain:
- STOP execution immediately
- ASK for clarification
- NEVER invent a fix
- NEVER invent credentials
- NEVER invent providers
- NEVER "assume likely"

### Hallucination Prevention (Addition 8)

Prohibited:
- Creating plausible but unverified explanations
- Filling unknowns with assumptions
- Presenting guesses as operational truth

Acceptable: `[UNKNOWN]` — clearly labeled
Unacceptable: Fabricated certainty

---

## APPROVED PROVIDER REGISTRY (Addition 9)

**Current explicit approved providers — may not add to this list without Ahmad written approval:**

| Provider | Service | Config Source |
|----------|---------|---------------|
| Neo | Email/SMTP | `/home/node/.openclaw/secrets/qiyadon-email.json` |
| Supabase | Database | `/home/node/.openclaw/secrets/supabase.json` |
| Cloudflare | DNS/Pages | `/home/node/.openclaw/secrets/cloudflare.json` |
| HubSpot | CRM | `/home/node/.openclaw/secrets/hubspot.json` |
| OpenClaw | Messaging | OpenClaw built-in |
| Mailchannels | Transactional email (SPF) | DNS TXT records only |

**Providers NOT in registry:** Zoho, SendGrid, AWS SES, Mailgun, any other email/SMTP provider — cannot be used, tested, or assumed.

---

## CHANGE JOURNAL (Addition 3)

Every production modification appends to:

**`/ops/CHANGELOG.md`**

Required fields per entry:
```
### YYYY-MM-DD — HH:MM UTC
WHO:    <session or role>
WHAT:   <exact change>
WHY:    <business reason>
ROLLBACK: <how to revert>
VALIDATION: <post-change check + result>
DIFF:   <before/after file:line>
```

If `CHANGELOG.md` does not exist, create it at first write.

---

## QUEUE INTEGRITY (Addition 6)

Every instruction entering the queue must have:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, immutable |
| `correlation_id` | UUID | Links to parent instruction or task |
| `original_snapshot` | TEXT | Exact original message, never mutated |
| `source_channel` | TEXT | 'whatsapp' / 'cron' / 'webhook' / 'internal' |
| `state_transitions` | JSONB | Array of {from, to, at, by} |
| `retry_count` | INT | Number of retry attempts |
| `failure_reason` | TEXT | Last failure message if stalled |
| `created_at` | TIMESTAMPTZ | Immutable insert time |
| `acknowledged_at` | TIMESTAMPTZ | First response time |
| `completed_at` | TIMESTAMPTZ | Completion time |

Schema change — add to `instructions` table (from Workstream 1):
```sql
ALTER TABLE instructions ADD COLUMN correlation_id UUID REFERENCES instructions(id);
ALTER TABLE instructions ADD COLUMN original_snapshot TEXT NOT NULL;
ALTER TABLE instructions ADD COLUMN state_transitions JSONB DEFAULT '[]';
ALTER TABLE instructions ADD COLUMN retry_count INT DEFAULT 0;
ALTER TABLE instructions ADD COLUMN failure_reason TEXT;
```

---

## TASK SILENCE POLICY (Addition 7)

If active task exceeds SLA (>10 min with no update):
- EMIT interim status automatically — do not remain silent
- Must include:
  - `current_step` — what is happening now
  - `last_successful_step` — last confirmed good step
  - `blocker` — what's preventing progress
  - `estimated_next_update` — when next status will come

No silent stretches >10 minutes during active execution.

---

## RECOVERY VALIDATION (Addition 10)

BCDR plan must include validated recovery for each:

| Scenario | Validation |
|----------|------------|
| Cold boot | Process restarts, binds port, accepts requests |
| PM2 dump loss | `pm2 dump` recreated from source files, no state loss |
| Tunnel disruption | `cloudflared-tunnel` restarts, api.qiyadon.com resolves |
| API crash | `qiyadon-audit-form` restarts, POST returns success |
| End-to-end onboarding | Trial submission → email delivered → signature recorded |

---

## IMPLEMENTATION PHASE SEQUENCE

**DO NOT implement all workstreams simultaneously.**

### Dependency Graph

```
Phase 0 (Prerequisite — no dependencies)
└── Infrastructure Registry + Change Journal
    └── Creates approved provider list + audit trail base
    └── Must complete before any code changes

Phase 1 (Foundation — enables all downstream)
├── Workstream 1: Instruction Bridge + Queue Schema
└── Workstream 2: Acknowledgement Protocol
    └── Phase 1 must complete before Workstreams 3-8

Phase 2 (Policy — no execution risk)
├── Workstream 3: Evidence Gate (AGENTS.md update)
├── Workstream 4: Credential Governance (AGENTS.md update)
├── Workstream 5: Production Change Gate (AGENTS.md update)
└── Workstream 9: Provider Registry (AGENTS.md update)
    └── Phase 2 can run parallel to Phase 1, does not block Phase 3

Phase 3 (Runtime safety — adds monitoring)
├── Workstream 6: Silence Detection + Watchdog Extension
└── Workstream 7: BCDR Health Checks
    └── Phase 3 requires Phase 1 complete (needs instructions table)

Phase 4 (Validation — close the loop)
└── Workstream 8: Post-incident Report (already written, confirm approval)

Phase 5 (Hardening complete — goes live)
└── Full watchdog deployment, CHANGELOG audit, cold boot test
```

### Phase Order with Rollback and Blast Radius

---

### PHASE 0 — Infrastructure Registry + Change Journal Setup

**Files touched:**
- `/ops/CHANGELOG.md` — create (new file)
- `/home/node/.openclaw/workspace/AGENTS.md` — add approved provider registry section

**Changes:**
1. Create `/ops/` directory
2. Create `/ops/CHANGELOG.md` with empty state + format documentation
3. Add to `AGENTS.md`: Approved Provider Registry section (Addition 9)
4. Add to `AGENTS.md`: Truth Classification Layer (Addition 1)
5. Add to `AGENTS.md`: Safe Failure Mode (Addition 4)
6. Add to `AGENTS.md`: Hallucination Prevention Rule (Addition 8)

**Rollback:** Delete files created, revert AGENTS.md additions. No blast radius — purely additive.

**Blast radius:** None. Policy-only change.

**Validation checkpoints:**
- [ ] `CHANGELOG.md` exists at `/ops/CHANGELOG.md`
- [ ] `CHANGELOG.md` has format documentation header
- [ ] AGENTS.md contains Provider Registry section
- [ ] AGENTS.md contains Truth Classification prefixes
- [ ] No credentials referenced without reading from secrets first (evidence gate active)

**Estimated time:** 1-2 hours

---

### PHASE 1 — Instruction Bridge + Acknowledgement Protocol

**Files touched:**
- `orchestration/src/governance/instruction-bridge.js` (new)
- Supabase: new `instructions` table + all columns from Workstream 1 + Queue Integrity additions
- `HEARTBEAT.md` — add instruction bridge check

**Schema — `instructions` table:**
```sql
CREATE TABLE instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID REFERENCES instructions(id),
  task_id UUID REFERENCES tasks(id),
  original_snapshot TEXT NOT NULL,
  source_channel TEXT NOT NULL,
  original_message TEXT NOT NULL,
  instruction_type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'received',
  owner TEXT,
  execution_mode TEXT,
  state_transitions JSONB DEFAULT '[]',
  retry_count INT DEFAULT 0,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  blocked_reason TEXT,
  validation_evidence JSONB,
  metadata JSONB
);

CREATE INDEX idx_instructions_status ON instructions(status);
CREATE INDEX idx_instructions_task_id ON instructions(task_id);
CREATE INDEX idx_instructions_correlation_id ON instructions(correlation_id);
```

**Changes:**
1. Write Supabase schema migration for `instructions` table
2. Write `instruction-bridge.js` with:
   - `bridgeInstruction(message, channel, sender)` → persists to instructions, creates task
   - Immediate RECEIVED acknowledgement to sender
   - Status transitions: RECEIVED → QUEUED → ACKNOWLEDGED → EXECUTING → COMPLETED
   - BLOCKED / NEEDS_CLARIFICATION as branch states
3. Add state transition recorder (append to `state_transitions` array on every change)
4. Update `HEARTBEAT.md` to check instruction bridge on each heartbeat

**Rollback:**
- Delete `instructions` table via migration rollback
- Remove `instruction-bridge.js`
- Revert `HEARTBEAT.md`

**Blast radius:** Low — write-only to new table, no existing code modified, no existing data touched.

**Validation checkpoints:**
- [ ] POST test instruction via WhatsApp → `instructions` row created with `status = received` within 30 seconds
- [ ] Sender receives WhatsApp acknowledgement within 2 minutes
- [ ] `state_transitions` array populated on first status change
- [ ] `original_snapshot` contains exact message text, never mutated
- [ ] `correlation_id` links child instructions to parent

**Estimated time:** 3-4 hours

---

### PHASE 2 — Policy Updates (AGENTS.md)

**Files touched:** `AGENTS.md` (no new files, no code changes)

**Changes (all policy — no execution risk):**
1. Evidence Gate section (Addition 3 + Workstream 3)
2. Credential Governance section (Workstream 4)
3. Production Change Gate section (Workstream 5)
4. Runtime Evidence Attachments requirement (Addition 2)
5. Task Silence Policy with interim status requirement (Addition 7)

**Rollback:** Revert AGENTS.md to pre-hardening commit. No blast radius.

**Blast radius:** None. Policy-only.

**Validation checkpoints:**
- [ ] AGENTS.md has all 5 new sections
- [ ] Every operational statement in next session carries classification prefix
- [ ] No infrastructure claim without evidence attachment (command/file/time/pid/result)
- [ ] No credential referenced without reading from secrets first

**Estimated time:** 1-2 hours (can run parallel to Phase 1)

---

### PHASE 3 — Silence Detection + Watchdog Extension

**Files touched:**
- `moosa-watchdog.js` (existing — extend)
- `orchestration/src/governance/health-check.js` (new)
- Supabase: `health_checks` table (new)
- `HEARTBEAT.md` (update)

**Changes:**

#### 3a — Health Check Module (`health-check.js`)
```javascript
// Independent health checks — watchdog runs these without moosa-worker
exports.checkPM2 = async () => {
  // Verify all critical processes online, restart count = 0
}
exports.checkTunnel = async () => {
  // curl https://api.qiyadon.com → expect 200, or restart cloudflared-tunnel
}
exports.checkAPI = async () => {
  // POST test payload to /submit-signature → expect {"success":true}
}
exports.checkQueue = async () => {
  // Supabase health + pending task count
}
exports.checkEmailDelivery = async () => {
  // Last 5 log entries for "Signature OK" → if none in 1 hour → alert
}
exports.checkHeartbeat = async () => {
  // Last heartbeat age > 10 min → alert
}
```

#### 3b — Independent Watchdog Requirements (Addition 5)
Watchdog must independently verify (no dependency on moosa-worker state):
- PM2 process existence + restart count
- Tunnel reachability (api.qiyadon.com resolves + responds)
- API health (POST /submit-signature → success)
- Queue movement (pending tasks processed within expected window)
- Heartbeat freshness (last heartbeat < 10 min ago)

#### 3c — Silence Detection
```javascript
async function checkSilence() {
  // For any instruction in 'executed'/'acknowledged' state > 10 min
  // → set status = 'stalled'
  // → emit interim status to sender
  // → alert Ahmad: "STALLED: [task] — last step: [X] — blocker: [Y]"
}
```

**Rollback:**
- Delete `health-checks` table
- Remove `health-check.js`
- Revert `moosa-watchdog.js` to pre-hardening state
- PM2 restart watchdog

**Blast radius:** Medium — modifies existing watchdog. Test thoroughly before deploying.

**Validation checkpoints:**
- [ ] Watchdog has independent health check loop (no moosa-worker dependency)
- [ ] `pm2 logs moosa-watchdog` shows health check runs every 5 minutes
- [ ] Kill `qiyadon-audit-form` → watchdog restarts it within 3 minutes, alert sent
- [ ] Silence >10 minutes on active instruction → STALLED status + WhatsApp alert
- [ ] All 5 health check categories produce Supabase records in `health_checks` table

**Estimated time:** 3-4 hours

---

### PHASE 4 — BCDR Health Checks + Recovery Validation

**Files touched:**
- `orchestration/src/governance/health-check.js` (Phase 3 already created)
- `strateon/projects/backups/` (create)
- `ops/RECOVERY-PLAN.md` (new)

**Changes:**

#### 4a — Backup Directory
- Create `/strateon/projects/backups/`
- On every PM2/config change → copy to `backups/YYYY-MM-DD-HHMM-<filename)`
- Keep last 10 versions

#### 4b — Recovery Validation Plan (Addition 10)
Document cold boot validation for all scenarios:

| Scenario | Recovery Steps | Validation |
|----------|---------------|------------|
| Cold boot | `pm2 resurrect` + verify all processes online | `pm2 jlist` shows all online |
| PM2 dump loss | Re-run `pm2 save` from known good state | Restore from git + env vars |
| Tunnel disruption | `pm2 restart cloudflared-tunnel` | `curl https://api.qiyadon.com` returns 200 |
| API crash | `pm2 restart qiyadon-audit-form` | POST test payload returns success |
| End-to-end | Submit trial → email delivered → signature in DB | All 3 steps confirmed |

**Rollback:** Delete backups directory, remove `RECOVERY-PLAN.md`. No blast radius.

**Blast radius:** Low — monitoring and documentation only.

**Validation checkpoints:**
- [ ] `backups/` contains config backups for last 5 PM2 changes
- [ ] `RECOVERY-PLAN.md` exists with all 5 recovery scenarios documented
- [ ] Cold boot test performed (restart PM2, verify all services online)
- [ ] Tunnel recovery test performed (kill tunnel, verify restart + API resolves)

**Estimated time:** 2-3 hours

---

### PHASE 5 — Hardening Complete — Go Live

**Changes:**
- Full watchdog deployed and tested
- CHANGELOG audit: all past changes documented retroactively
- Hardening Phase 1 declared live

**Validation checkpoints:**
- [ ] All Phase 1-4 validation checkpoints passed
- [ ] Watchdog running independently (not dependent on moosa-worker)
- [ ] No active instructions in `stalled` state
- [ ] CHANGELOG has entries for all changes made during hardening
- [ ] Cold boot test passed
- [ ] Ahmad receives confirmation message: "Hardening Phase 1 live"

---

## WORKSTREAM TO PHASE MAPPING

| Workstream | Phase | Order |
|------------|-------|-------|
| 1. Instruction Bridge | Phase 1 | 2nd |
| 2. Acknowledgement Protocol | Phase 1 | 1st (foundation) |
| 3. Evidence Gate | Phase 2 | parallel |
| 4. Credential Governance | Phase 2 | parallel |
| 5. Production Change Gate | Phase 2 | parallel |
| 6. Silence Detection | Phase 3 | 2nd |
| 7. BCDR Health Checks | Phase 3 + 4 | 1st (Phase 3), 2nd (Phase 4) |
| 8. Incident Report | Phase 4 | complete |

---

## SUMMARY TIMELINE

| Phase | Duration | Risk | Parallel? |
|-------|----------|------|-----------|
| Phase 0 | 1-2 hrs | None | No |
| Phase 1 | 3-4 hrs | Low | No |
| Phase 2 | 1-2 hrs | None | Yes (with Phase 1) |
| Phase 3 | 3-4 hrs | Medium | No |
| Phase 4 | 2-3 hrs | Low | No |
| Phase 5 | 1 hr | Low | No |

**Total estimated:** 1.5-2 days

---

## ACCEPTANCE CRITERIA (All Phases)

- [ ] No infrastructure claim without evidence attachment (command/file/time/pid/result)
- [ ] No credential referenced without reading from `/home/node/.openclaw/secrets/` first
- [ ] Every instruction creates `instructions` row with full queue integrity fields
- [ ] Every instruction receives acknowledgement within 2 minutes
- [ ] No silence >10 minutes on active task without interim status
- [ ] Watchdog has independent health check loop (no moosa-worker dependency)
- [ ] All approved providers documented in AGENTS.md Provider Registry
- [ ] All production changes appended to `/ops/CHANGELOG.md`
- [ ] Cold boot test passed
- [ ] No active instructions in `stalled` state
- [ ] Ahmad receives confirmation: "Hardening Phase 1 live"

---

*Hardening Phase 1 — APPROVED — Implementation Pending Sequence*
*Moosa — CEO*