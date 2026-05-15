# SHADOW-SIDECAR VALIDATION CLOSEOUT REPORT
## instruction-sidecar-shadow — Validation Cycle 1

**Date:** 2026-05-15
**Validation scope:** SHADOW-MALFORMED-FIX-PLAN + AGENTS.md pruning
**Sidecar status:** STOPPED

---

## 1. WHAT PASSED

| Test | Evidence | Result |
|------|----------|--------|
| Syntax check | `node --check` — clean exit | ✅ |
| Sidecar startup | PID 914849, Supabase client initialized OK, polling started | ✅ |
| No infinite retry on malformed EOF | Quarantine: 1 entry only (not repeated); cursor advanced past byte 3,145,731 | ✅ |
| Quarantine entry created | 1 entry: `{byte_offset: 3145731, reason: "incomplete_json_at_eof", session: "77dee770-..."}` | ✅ |
| Deterministic capture | `[TEST-A-RETRY]` → 1 `shadow_received` row created | ✅ |
| No task creation | 0 new tasks created during entire validation cycle | ✅ |
| Shadow mode isolation | No execution authority, no acknowledgements, no queue mutation beyond instructions table | ✅ |
| No gateway degradation | Gateway remained online (PID 899919) throughout validation | ✅ |
| Session rotation survival | Sidecar used fallback mode (no .lock) when session rotated; continued capture | ✅ |
| Cursor persistence | `eofPosition: 4183612, lastMessageId: 3EB0FA208F0F62BFDC3AD4` — survives restart | ✅ |
| AGENTS.md pruning | 22,266 → 9,452 bytes; 17/17 governance invariants preserved | ✅ |

**Total instruction rows captured during validation:** 5 rows (`shadow_received` status)
- All from `+923215139934` (Ahmad)
- All with correct `message_id` and `sender_id` extracted
- No duplicates
- No task creation

---

## 2. WHAT FAILED

| Issue | Evidence | Classification | Action |
|-------|----------|---------------|--------|
| **No instruction row for TEST-A (first attempt)** | 0 rows after first `[TEST-A]` send | DUPLICATION-RISK → FIXED | `extractMetadata` regex extraction implemented; `instruction_type` field added to INSERT |
| **Malformed line infinite retry** | Same position logged repeatedly | CORRUPTION-RISK → FIXED | EOF retry protocol + quarantine implemented |
| **No quarantine logging (initial version)** | Quarantine file never created | SILENT-RISK → FIXED | Quarantine append added as Fix 4 |

**All failures were identified, fixed, and re-validated within the same session.**

---

## 3. WHAT REMAINS BLOCKED

| Blocker | Severity | Dependency |
|---------|----------|-----------|
| MEMORY.md still exceeds 20KB bootstrap limit (31KB) | **CRITICAL** | Must prune before session stability is fully restored |
| `moosa-worker` still has initialization errors (`final_decision_mode`, `issueContext`) | HIGH | Worker rebuild needed — separate scope |
| Session JSONL contains binary/truncated JSON entries at positions 195627, 989, 11219 | MEDIUM | Requires gateway downtime to clean |
| `hub-oauth-v2`, `strateon-followup-engine`, `moosa-watchdog` all stopped | MEDIUM | Separate operational decisions |
| Bootstrap truncation still occurring for MEMORY.md (AGENTS.md now fixed) | HIGH | MEMORY.md pruning is P0 next |

---

## 4. WHETHER SHADOW CAPTURE IS SAFE TO CONTINUE LATER

**YES — with conditions.**

Shadow capture proved reliable after fixes:
- Capture rate: 100% of valid user messages (5/5)
- No infinite retry on malformed lines
- Quarantine provides audit trail for drops
- Cursor persistence enables restart recovery
- Session rotation handled correctly

**Conditions for safe continuation:**
1. AGENTS.md pruning is live ✅
2. MEMORY.md pruning must happen before next session (continues to cause truncation)
3. Sidecar should NOT be left running unattended until MEMORY.md is resolved
4. Session rotation during unattended runs may cause fallback mode — acceptable for shadow but means some messages might be processed from wrong session temporarily

---

## 5. WHETHER SIDECAR SHOULD REMAIN STOPPED FOR NOW

**YES — sidecar should remain stopped.**

Reasons:
1. **MEMORY.md truncation unresolved** — agent may still stall with truncated context, making sidecar capture unreliable
2. **Validation objectives met** — shadow capture reliability proven (TEST-A passed after fixes)
3. **No active need** — no production workflow requiring instruction capture right now
4. **Malformed JSONL in session** — the 1 quarantine entry shows stale-task-detector.js is writing broken content to the session file; this could cause the sidecar to quarantine many lines if left running

**To resume later:**
```bash
pm2 start /home/node/.openclaw/workspace/ecosystem.shadow-sidecar.config.js
# Resume from persisted cursor — capture will continue
```

---

## 6. NEXT RECOMMENDED HARDENING STEP

### Immediate Next Step: MEMORY.md Pruning (P0)

**Why:** MEMORY.md is 31KB — still exceeds the 20KB bootstrap limit. Session stall issue is not fully resolved until MEMORY.md is pruned.

**What:** Apply same pruning logic as AGENTS.md — remove narrative/process overhead, preserve governance doctrine and institutional memory, condense daily carry-forward summaries.

**Scope:** `/home/node/.openclaw/workspace/MEMORY.md` only — no other files.

**Blast radius if skipped:** Sessions will continue to start with truncated MEMORY.md, causing:
- Inconsistent agent behavior (missing recent decisions)
- Stalled sessions (lane wait exceeded)
- Possible session instability

### Second Step: Worker Initialization Fix (P1)

**Why:** `final_decision_mode` / `issueContext` errors cause worker tasks to fail immediately.

**What:** Fix initialization order in `moosa-worker/dist/handlers/decision-model.js` — move variable declarations before first access.

**Note:** Out of scope for current session (requires worker scope).

---

## CURSOR + STATE AT CLOSEOUT

```json
{
  "cursor": "/ops/sidecar-cursor.json",
  "session": "77dee770-dbfd-429f-90de-2dac19933a8d",
  "eofPosition": 4183612,
  "lastMessageId": "3EB0FA208F0F62BFDC3AD4",
  "quarantineEntries": 1,
  "instructionRowsCreated": 5,
  "sidecarStatus": "stopped"
}
```

---

*Validation closed 2026-05-15 — Shadow mode: SAFE TO RESUME with conditions*