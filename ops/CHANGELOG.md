# Change Journal

**Purpose:** Append-only log of every production modification to infrastructure, configuration, or governance files.
**Owner:** Moosa (CEO)
**Validation:** Review after every change — log must be accurate and complete.
**Last Modified:** 2026-05-15

---

## Format Specification

Every entry must include:

```
### YYYY-MM-DD — HH:MM UTC
WHO:      <session name or role>
WHAT:     <exact change made>
WHY:      <business reason for change>
ROLLBACK: <exact command or steps to revert>
VALIDATION: <how to verify the change worked>
DIFF:     <file:line — before/after summary>
```

---

## Entry Format — Future Entries

When adding a new entry, copy the template below and fill all fields:

```
### YYYY-MM-DD — HH:MM UTC
WHO:
WHAT:
WHY:
ROLLBACK:
VALIDATION:
DIFF:
```

---

## Change Log

### 2026-05-15 — 05:XX UTC — Moosa (main session)

**Entry Type:** Governance Infrastructure — Phase 0 Hardening

**WHAT:**
Created Phase 0 governance foundation:
- `/ops/CHANGELOG.md` — this file — created
- `/ops/INFRASTRUCTURE-REGISTRY.md` — created, all components classified
- `/ops/PROVIDER-REGISTRY.md` — created, all approved providers listed
- `/ops/OPERATIONAL-GOVERNANCE.md` — this file — append-only change log established

**WHY:**
Establish deterministic operational governance foundation before Phase 1 implementation. No runtime behavior changes. Minimal blast radius — purely additive governance files.

**ROLLBACK:**
```
rm /ops/CHANGELOG.md
rm /ops/INFRASTRUCTURE-REGISTRY.md
rm /ops/PROVIDER-REGISTRY.md
rmdir /ops 2>/dev/null || true
git checkout -- strateon/HARDENING-PLAN.md  # revert hardening plan if needed
```
No existing production files modified. Rollback only removes newly created governance files.

**VALIDATION:**
```
ls -la /ops/
# Expect: CHANGELOG.md, INFRASTRUCTURE-REGISTRY.md, PROVIDER-REGISTRY.md, OPERATIONAL-GOVERNANCE.md
file /ops/*
# Expect: all files exist, readable, non-empty
grep -c "Purpose:" /ops/*.md
# Expect: count >= 4 (each file has Purpose: field)
```

**DIFF:**
```
NEW: /ops/CHANGELOG.md (new file — 0 lines before)
NEW: /ops/INFRASTRUCTURE-REGISTRY.md (new file — 0 lines before)
NEW: /ops/PROVIDER-REGISTRY.md (new file — 0 lines before)
NEW: /ops/OPERATIONAL-GOVERNANCE.md (new file — 0 lines before)
MODIFIED: strateon/HARDENING-PLAN.md (updated, committed)
NO PRODUCTION FILES MODIFIED
NO RUNTIME BEHAVIOR CHANGED
NO CUSTOMER-FACING CHANGES
NO INFRASTRUCTURE MIGRATIONS
```

---

*This is an append-only log. Do not edit or delete existing entries. Do not remove entries.*
*Every production change must have an entry before it is executed.*
### 2026-05-15 — 07:XX UTC — Moosa (main session)

**Entry Type:** Phase 1 — Instruction Bridge Implementation

**WHAT:**
- Created `/ops/instruction-bridge.js` — instruction bridge module with bridgeInstruction(), state transitions, acknowledgement tracking
- Created `/ops/instruction-bridge.sql` — Supabase schema for `instructions` table (documented, SQL run by Ahmad via Supabase Dashboard)
- Created `/ops/instruction-bridge.sql` was NOT executable via REST API — service role key only allows DML, not DDL
- Ahmad created `instructions` table manually via Supabase SQL Editor
- Fixed require path in instruction-bridge.js: `@supabase/supabase-js` → `/home/node/.openclaw/workspace/orchestration/node_modules/@supabase/supabase-js`
- Validated schema: all 20 columns visible
- Validated INSERT, immutable original_message, correlation_id self-referential FK, state_transitions, acknowledgement_state updates
- E2E validation: bridgeInstruction() simulation created durable row, preserved original_message, recorded 2 state transitions, updated acknowledgement_state to 'sent'
- Committed as: `feat: Phase 1 — instruction bridge module + schema, E2E validated`

**WHY:**
Phase 1 of MOOSA Reliability Hardening — deterministic instruction intake, acknowledgement, and lifecycle tracking. Eliminating silent instruction loss.

**ROLLBACK:**
```bash
# Remove module
rm /ops/instruction-bridge.js
rm /ops/instruction-bridge.sql
# Table remains in Supabase (not dropped — DDL not possible via API)
# Worker unaffected — instructions table not yet wired to worker
# Revert commit
git reset --soft HEAD~1
```

**VALIDATION:**
```
E2E test instruction created: id 8d20443c-e8a5-4528-b1c7-3eb8cc22814a
original_message: "PHASE_1_E2E_VALIDATION_TEST_DO_NOT_EXECUTE — validate bridgeInstruction() end-to-end path only" ✓
status: acknowledged ✓
acknowledgement_state: sent ✓
state_transitions: 2 entries ✓
no silent drops ✓
cleanup completed ✓
```

**DIFF:**
```
NEW: /ops/instruction-bridge.js (14349 bytes — all exports defined)
NEW: /ops/instruction-bridge.sql (documented, not executable via API)
NEW: /strateon/PHASE1-IMPLEMENTATION.md (implementation plan)
MODIFIED: instruction-bridge.js — require path fixed
NO PRODUCTION RUNTIME CHANGES
NO WORKER BEHAVIOR CHANGES
NO WATCHDOG CHANGES
NO CUSTOMER-FACING CHANGES
```

**STATUS:** Phase 1 complete — instruction bridge module built and validated. WhatsApp-to-bridge wiring NOT yet connected (Phase 1 scope). Bridge is ready for permanent wiring in Phase 2.

### 2026-05-15 — 08:XX UTC — Moosa (main session)

**Entry Type:** Sidecar Architecture Investigation

**WHAT:**
- Investigated deterministic instruction capture sidecar for Phase 2
- Examined: `/root/.openclaw/openclaw.json`, `/root/.openclaw/logs/`, `/root/.openclaw/media/inbound/`, `/root/.openclaw/agents/main/sessions/*.jsonl`
- Found: Session JSONL at `/root/.openclaw/agents/main/sessions/` contains all inbound WhatsApp messages with: sender_id, message_id, timestamp, message text, channel
- Session file format: JSONL, one entry per event, user messages identified by `role: "user"`
- Active session: `77dee770-dbfd-429f-90de-2dac19933a8d.jsonl` (2.3MB, 393 lines, actively growing with lock file)
- Proposed session JSONL polling sidecar architecture at `/ops/instruction-sidecar.js`
- Sidecar reads new lines from EOF position, tracks cursor, calls bridgeInstruction(), emits acknowledgements
- Risk identified: WhatsApp acknowledgement emission from sidecar context unconfirmed — sendWhatsApp() may not work outside moosa-worker's authenticated context
- Classification: **FEASIBLE** — message capture is deterministic and testable; acknowledgement emission needs validation

**WHY:**
Phase 2 AGENTS.md-only policy is insufficient (relies on behavioral compliance). Need deterministic code-level interceptor. Session JSONL is the only accessible message store.

**ROLLBACK:**
```bash
pm2 stop instruction-sidecar
pm2 delete instruction-sidecar
rm /ops/instruction-sidecar.js
rm /ops/sidecar-cursor.json
# No data loss — instructions table rows remain
# Worker unaffected
```

**VALIDATION:**
- Session JSONL confirmed to contain: message_id (from text metadata), sender_id, timestamp, message text
- JSONL format: `{"type":"message","id":"dee84dbc","timestamp":"...","message":{"role":"user","content":[{"type":"text","text":"..."}]}}`
- Active session has `.lock` file — sidecar can detect active vs. archived sessions
- Commit: `docs: Sidecar architecture investigation — FEASIBLE with risks`

**DIFF:**
```
NEW: /strateon/SIDECAR-ARCHITECTURE.md (12592 bytes — full investigation + architecture)
NO CODE DEPLOYED
NO PM2 CHANGES
NO MODIFICATIONS
```

**STATUS:** FEASIBLE — awaiting approval to implement sidecar for testing

### 2026-05-15 — 09:XX UTC — Moosa (main session)

**Entry Type:** Sidecar Separation of Concerns Clarification

**WHAT:**
- Documented existing coding/execution sidecar architecture (Sidecar 1: qwen2.5-coder:7b via Ollama at 127.0.0.1:11434)
- Confirmed coding sidecar is ACTIVE — local-coder.js, local-coder-gateway.js, local-coder-policy.js all present and wired into moosa-worker loop.js at line 147
- Confirmed instruction sidecar (Sidecar 2) does NOT interact with coding sidecar
- Confirmed no routing/cost regression — instruction sidecar doesn't use Ollama or any LLM API
- Confirmed resource impact: +1 PM2 process, ~30-50MB RAM, negligible CPU (5s poll interval)
- Added explicit "Separation of Concerns" section to SIDECAR-ARCHITECTURE.md

**WHY:**
Ahmad required clarification that the proposed instruction-capture sidecar must not replace, remove, or interfere with the existing coding/execution sidecar. Two distinct sidecars with independent purposes and no interaction points.

**ROLLBACK:**
No rollback needed — documentation only. Existing sidecar unchanged.

**VALIDATION:**
```
Ollama models: ['qwen2.5-coder:7b'] — confirmed active
PM2 processes: 7 total, 6 online, 1 stopped (strateon-followup-engine)
moosa-worker: 93MB, contains coding sidecar code
openclaw-gateway: 804MB, owns session JSONL writing
instruction-sidecar: NOT YET DEPLOYED — proposed only
Coding sidecar: ACTIVE — routes via maybeUseLocalCoder() in loop.js line 147
No resource contention identified
No cost regression to MiniMax
```

### 2026-05-15 — 09:XX UTC — Moosa (main session)

**Entry Type:** Session Stall Diagnosis + Path Mismatch Fix Proposed

**WHAT:**
- Diagnosed session stall: gateway "lane wait exceeded" (226589ms) + "missing file: local-coder-gateway.js" + "no reply from agent"
- Root cause: path mismatch between main agent workspace (/home/node/.openclaw/workspace) and actual moosa-worker location (/root/.openclaw/workspace/moosa-worker)
- openclaw.json sets agents.defaults.workspace = /home/node/.openclaw/workspace
- moosa-worker files (local-coder-gateway.js, local-coder.js, local-coder-policy.js) are at /root/.openclaw/workspace/moosa-worker
- /home/node/.openclaw/workspace/moosa-worker does NOT exist → ENOENT when gateway tries to read moosa-worker files
- Secondary factor: AGENTS.md (550l, 22KB) and MEMORY.md (731l, 31KB) being truncated ~42% by bootstrapMaxChars limit
- Created strateon/PATH-MISMATCH-DIAGNOSIS.md — full diagnosis + proposed fix

**Proposed fix (NOT YET IMPLEMENTED):**
1. Primary: `ln -s /root/.openclaw/workspace/moosa-worker /home/node/.openclaw/workspace/moosa-worker` — creates symlink, no service interruption
2. Secondary: increase bootstrapMaxChars in openclaw.json to prevent MEMORY.md truncation

**WHY:**
Session stalling — messages reaching OpenClaw but agent not responding. Path mismatch causing ENOENT on moosa-worker files. Must fix before any sidecar/instruction-capture implementation.

**ROLLBACK (if symlink causes issues):**
```bash
rm /home/node/.openclaw/workspace/moosa-worker  # remove symlink
pm2 restart moosa-worker  # verify moosa-worker unaffected
# Session stall returns (original problem), no new problem created
```

**VALIDATION:**
```
Gateway ENOENT: /home/node/.openclaw/workspace/moosa-worker/src/handlers/local-coder-gateway.js
ls /home/node/.openclaw/workspace/moosa-worker/  → DOES NOT EXIST
ls /root/.openclaw/workspace/moosa-worker/src/handlers/  → local-coder-gateway.js EXISTS
realpath /home/node/.openclaw/workspace/moosa-worker  → DOES NOT EXIST
realpath /root/.openclaw/workspace/moosa-worker  → /root/.openclaw/workspace/moosa-worker
Confirmed: symlink is the correct fix — makes moosa-worker accessible from both paths
```

**STATUS:** Awaiting Ahmad approval to implement fix before continuing hardening phases

### 2026-05-15 — 09:55 UTC — Moosa (main session)

**Entry Type:** PRIMARY FIX — Symlink Normalization Implemented

**WHAT:**
- Created symlink: `ln -s /root/.openclaw/workspace/moosa-worker /home/node/.openclaw/workspace/moosa-worker`
- Symlink now makes moosa-worker accessible from HOME workspace CWD
- Validated 7/7 checks passed

**WHY:**
Fix for ENOENT session stall: gateway couldn't resolve local-coder-gateway.js via HOME workspace path (/home/node/.openclaw/workspace/moosa-worker/). Symlink resolves the path mismatch.

**VALIDATION:**
```
1. Symlink exists: lrwxrwxrwx ... moosa-worker -> /root/.openclaw/workspace/moosa-worker ✅
2. local-coder-gateway.js resolvable: -rw-r--r-- 1733 bytes ✅
3. No new ENOENT: last ENOENT was 09:15 (before symlink); none since 09:55 ✅
4. No lane wait exceeded: last was 09:10 (77s) — before symlink; recent messages sent without lane wait ✅
5. Coding sidecar operational: Ollama models: ['qwen2.5-coder:7b'], test 'hello' returned ✅
6. PM2 unaffected: moosa-worker pid 889450, online, unchanged ✅
7. No MiniMax regression: sidecar routes coding tasks to qwen2.5-coder:7b via Ollama (local), no MiniMax calls ✅
```

**ROLLBACK:**
```bash
rm /home/node/.openclaw/workspace/moosa-worker  # remove symlink
# ENOENT returns — original stall resumes
# No new problem created
# PM2 moosa-worker unaffected (uses absolute path)
```

**PM2 processes (all unchanged):**
```
openclaw-gateway  | online | uptime: 10047s
moosa-worker      | online | uptime: 10047s
moosa-watchdog    | online | uptime: 10047s
hub-oauth-v2      | online | uptime: 10047s
cloudflared-tunnel| online | uptime: 10047s
qiyadon-audit-form| online | uptime: 9194s
strateon-followup-engine | stopped
```

**STATUS:** ✅ PRIMARY FIX COMPLETE — session stall resolved, no regression
