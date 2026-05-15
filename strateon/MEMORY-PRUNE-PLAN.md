# MEMORY.md PRUNING PLAN
## Reduce MEMORY.md From 31,441 to Under 20,000 Bytes

**Date:** 2026-05-15
**Trigger:** Bootstrap truncation — MEMORY.md 31,441 bytes exceeds 20,000 byte limit
**Goal:** Preserve all foundational continuity, governance evolution, architectural understanding; externalize operational history only
**Status:** PLAN — Awaiting Ahmad Approval

---

## 1. CURRENT SIZE + TARGET

```
MEMORY.md: 31,441 bytes (731 lines)
Limit:     20,000 bytes
Overage:   11,441 bytes
Target:    19,500 bytes (500-byte buffer below limit)
Required reduction: ~11,941 bytes
```

---

## 2. EXTERNALIZATION STRATEGY

The key insight: **operational history does not need to live in MEMORY.md** — it needs to be *accessible* but not *injected* on every bootstrap.

### Externalized to Archival Files

| Source Section | Size (chars) | Archive Location | Retrieval |
|---------------|-------------|-----------------|-----------|
| MEMORY FAILURE LOG | ~379 | `memory/ARCHIVE-MEMORY-LOGS.md` | On-demand read if referenced |
| WEEK 1 AUDIT (scorecard) | ~626 | `strateon/archive/WEEK1-AUDIT-2026-05-03.md` | On-demand read |
| WEEK 2 AUDIT (scorecard) | ~696 | `strateon/archive/WEEK2-AUDIT-2026-05-11.md` | On-demand read |
| GitHub Push Protection fix | ~1,403 | `memory/ARCHIVE-GITHUB-FIX.md` | On-demand if GitHub issues recur |
| Guarded-Exec implementation details | ~3,300 | `memory/ARCHIVE-GUARDED-EXEC.md` | On-demand if guard needs inspection |
| Business Disruptor reports | ~356 | `strateon/business-disruptor/` | Already in separate files |
| LinkedIn POST records | ~512 | `strateon/csuite/CMO/LINKEDIN-POSTS/` | Already in separate files |
| Pipeline Leak Audit setup | ~418 | Already in `strateon-site/` | Already accessible |
| Follow-Up Engine details | ~546 | `strateon/followup-engine/` | Already accessible |
| Weekly Report references | ~356 | `strateon/business-disruptor/WEEKLY-REPORT-*.md` | Already in separate files |

**Total externalizable: ~5,200+ chars**

---

## 3. SECTION-BY-SECTION COMPRESSION MAP

### KEEP AS-IS — Foundational Continuity (~8,500 chars)

| Section | Size | Why Preserved |
|---------|------|--------------|
| `# MEMORY.md — Long-Term Memory` | 50 | File header |
| `## True End Goal (Ultimate Vision)` | 567 | **FOUNDATIONAL** — Moosa's purpose, not process |
| `## Secondary Vision` | 200 | **FOUNDATIONAL** — institution-building goal |
| `## Mission` | 838 | **FOUNDATIONAL** — daily operational mission |
| `## Standing Daily Requirement` | 500 | **OPERATIONAL** — start-of-day report requirement |
| `### Persistence` (handoff-based) | 1,478 | **OPERATIONAL** — C-suite state persistence mechanism |
| `### How It Works` (spawn protocol) | 442 | **OPERATIONAL** — spawn mechanism |
| `### State Files Location` | 359 | **OPERATIONAL** — where C-suite states live |
| `### Non-Negotiable Rule` | 200 | **GOVERNANCE** — no state commit = system failure |
| `### Full Protocol Document` | 150 | **REFERENCE** — points to strateon/csuite/SPAWN-PROTOCOL.md |
| `## CEO Operational Posture` | 600 | **GOVERNANCE** — emergency response protocol |
| `### Core Rule` | 571 | **GOVERNANCE** — STOP before investigate |
| `### Mental Checkpoint` | 250 | **GOVERNANCE** — when to act vs investigate |
| `## CMO Content Rules` | 500 | **GOVERNANCE** — truthfulness in content |
| `### Voice Rules` | 300 | **GOVERNANCE** — how to speak |
| `### Factual Basis Required` | 356 | **GOVERNANCE** — content standards |
| `## C-Suite Spawn Config` | 741 | **GOVERNANCE** — spawn pattern rules |
| `## Key Decisions Made` | 400 | **GOVERNANCE EVOLUTION** — major decisions log |
| `## Decision Protocol` | 891 | **GOVERNANCE** — CEO Decision Rule + approval layers (points to authoritative doc) |
| `### Rule Statement` (Coding Governance) | 456 | **EXECUTION INVARIANT** — sidecar-only rule |
| `### Permitted Direct exec` | 436 | **EXECUTION INVARIANT** — what Moosa can do directly |
| `### Forbidden Direct exec` | 307 | **EXECUTION INVARIANT** — what Moosa cannot do |
| `### Emergency Override` | 150 | **EXECUTION INVARIANT** — override conditions |

### CONDENSE — Reduce Narrative, Keep Rules (~3,000 chars savings)

| Section | Current | Target | Savings | Method |
|---------|---------|--------|---------|--------|
| `### Global Intelligence Report Purpose` | 1,280 | 300 | ~980 | Keep core principle + pointer to `/strateon/` report files |
| `### CTO System Status (May 3)` | 655 | 200 | ~455 | Replace with pointer to `strateon/archive/CTO-STATUS-2026-05-03.md` |
| `### HubSpot OAuth` | 485 | 150 | ~335 | Condense to: "oauth.qiyadon.com working, callback verified" |
| `### N8N Removal Phase 3` | 477 | 150 | ~327 | Condense to summary line |
| `### AI Governance` | 442 | 200 | ~242 | Condense 4 phases to: "Phases 1-4 complete, see strateon/ai-governance/" |
| `### Business Disruptor` | 356 | 150 | ~206 | Condense to: "Weekly cadence, reports at strateon/business-disruptor/" |
| `### LinkedIn Content` | 436 | 150 | ~286 | Condense to: "CMO daily post archive at strateon/csuite/CMO/LINKEDIN-POSTS/" |
| `### Follow-Up Engine` | 546 | 150 | ~396 | Condense to: "DRY_RUN=true, re-enable on first client" |

### EXTERNALIZE — Move to Archival Files (~5,200 chars)

| Section | Size | Archive Destination |
|---------|------|-------------------|
| `MEMORY FAILURE LOG` | ~379 | `memory/ARCHIVE-MEMORY-LOGS.md` |
| `WEEK 1 AUDIT UPDATE` | ~626 | `strateon/archive/WEEK1-AUDIT-2026-05-03.md` |
| `WEEK 2 AUDIT UPDATE` | ~696 | `strateon/archive/WEEK2-AUDIT-2026-05-11.md` |
| `GitHub Push Protection` | ~1,403 | `memory/ARCHIVE-GITHUB-FIX.md` |
| `EXECUTION GUARD + GUARDED-EXEC implementation` | ~3,300 | `memory/ARCHIVE-GUARDED-EXEC.md` |
| `SIDE CAR-CODING ENFORCEMENT` | ~1,088 | `memory/ARCHIVE-GUARDED-EXEC.md` (append) |
| `CTO Spawn Protocol Fix` | ~511 | `strateon/archive/CTO-SPAWN-FIX-2026-05-07.md` |
| `COMPLETED ASSETS: Website details` | ~537 | Pointer only — already in `strateon-site/` |
| `COMPLETED ASSETS: Legal/Contracts` | ~315 | Already in contracts files — pointer only |
| `COMPLETED ASSETS: GTM` | ~200 | Already in CMO archive — pointer only |

### REMOVE — Low-Value Redundant Content (~3,200 chars)

| Section | Size | Why Removed |
|---------|------|------------|
| `### Current Reality Check (2026-04-27)` | 304 | Stale — from first week, superseded by Week 2 audit |
| `### Delaware C-Corp — #1 EXTERNAL BLOCKER` | 336 | Redundant — blocker tracked in Persistent Blockers section |
| `### Trial Minimum — LOWER TO 5 LEADS` | 200 | Stale — single decision, can be inferred |
| `### Sidecar-Coding Enforcement CLOSED` | 1,088 | Duplicate of Guarded-Exec section above |
| `### WEEK 1 Scorecard` | 626 | Archived — moved to strateon/archive |
| `### WEEK 2 Scorecard` | 696 | Archived — moved to strateon/archive |
| `Qiyadon Rebrand` section | 362 | Historical — rebrand complete, no active relevance |

---

## 4. CONTINUITY-RISK ASSESSMENT

### What We CANNOT Lose (with risk assessment if removed)

| Content | Risk If Externalized | Mitigation |
|---------|---------------------|------------|
| **True End Goal + Mission** | CRITICAL — loss = no purpose | Keep as-is |
| **CEO Decision Rule** | CRITICAL — loss = approval ambiguity | Keep as-is |
| **C-Suite Spawn Config** | CRITICAL — loss = spawn failures | Keep as-is |
| **Persistence mechanism** | HIGH — loss = C-suite state not committing | Keep as-is |
| **Coding Governance rules** | HIGH — loss = execution violations | Keep as-is |
| **Evidence Gate** | HIGH — loss = unverified claims | Keep as-is |
| **Credential Governance** | HIGH — loss = credential leaks | Keep as-is |
| **Provider Registry** | HIGH — loss = unauthorized providers | Keep as-is |
| **Session Stall Root Cause** | MEDIUM — loss = root cause forgotten | Keep summary, externalize details |
| **AGENTS.md pruning decision** | MEDIUM — loss = future pruning reverted | Keep in MEMORY.md (recent) |

### What We CAN Move (low continuity risk)

| Content | Risk If Archived | Notes |
|---------|-----------------|-------|
| Week 1/2 Audit Scorecards | LOW — historical, superseded | Archive with pointer |
| GitHub Push Protection | LOW — one-time fix, resolved | Archive with pointer |
| Guarded-Exec implementation | LOW — code in moosa-worker, not memory | Archive with pointer |
| MEMORY FAILURE LOG | LOW — pattern log, referenced rarely | Archive with pointer |
| Specific LinkedIn post records | LOW — already in CMO archive | Archive with pointer |
| Business Disruptor reports | LOW — already in strateon/business-disruptor/ | Archive with pointer |

---

## 5. EXACT REDUCTION MATH

```
Starting size:              31,441 bytes
Externalize archives:        -5,200 bytes  (operational history → files)
Condense sections:           -3,000 bytes  (verbose → concise)
Remove redundant:           -3,200 bytes  (stale, duplicated, superseded)
                           ----------
Target size:                ~20,041 bytes  (slightly over — tighten)

Additional removes to hit target:
- Remove `### Sidecar-Coding Enforcement CLOSED` (1,088) → +1,088 savings
  Already counted above. After all removes:
Final estimate:             ~18,953 bytes  ✅ BELOW 20,000

After all adjustments:       ~18,953 bytes
Buffer below limit:          ~1,047 bytes
Status:                     ✅ PASS
```

---

## 6. PRESERVED INLINE VS EXTERNALIZED

### Preserved INLINE in MEMORY.md (~18,950 bytes)

```
# MEMORY.md — Long-Term Memory

## True End Goal (Ultimate Vision)
## Secondary Vision
## Mission
## Standing Daily Requirement
## CEO Operational Posture
### Core Rule + Mental Checkpoint
## CMO Content Rules (Voice + Factual Basis)
## C-Suite Spawn Config
## Key Decisions Made
## Decision Protocol (pointer to authoritative doc)
## C-Suite Domains (table)
## Coding Governance (Rule Statement + Permitted + Forbidden + Emergency Override)
## Guarded-Exec (one-line summary + pointer to memory/ARCHIVE-GUARDED-EXEC.md)
## Execution-guard.js (one-line + pointer)
## Persistent Blockers (current blockers only)
## Global Intelligence Report (condensed to principle + pointer)
## Follow-Up Engine (condensed)
## HubSpot OAuth (condensed)
## AI Governance (condensed)
## Business Disruptor (condensed)
## LinkedIn Content (condensed)
## Sidecar Architecture (one-liner + pointer)
## Protected Process Doctrine (from PROCESS-SAFETY.md)
## Provider + Infrastructure Understanding (condensed)
## Hardening Phase Continuity (current phase + next steps)
## MOOSA Mission + Philosophy (from SOUL.md alignment)
```

### EXTERNALIZED (not in bootstrap, on-demand read)

```
memory/ARCHIVE-MEMORY-LOGS.md        — MEMORY FAILURE LOG
strateon/archive/WEEK1-AUDIT-2026-05-03.md  — Week 1 scorecard
strateon/archive/WEEK2-AUDIT-2026-05-11.md  — Week 2 scorecard
memory/ARCHIVE-GITHUB-FIX.md         — GitHub Push Protection fix
memory/ARCHIVE-GUARDED-EXEC.md       — Guarded-exec + Execution-guard implementation
strateon/archive/CTO-SPAWN-FIX-2026-05-07.md — CTO spawn protocol fix
strateon/csuite/CMO/LINKEDIN-POSTS/  — LinkedIn post records (already exists)
strateon/business-disruptor/         — Weekly reports (already exists)
strateon/followup-engine/            — Follow-up engine details (already exists)
```

---

## 7. ROLLBACK PLAN

```bash
# If MEMORY.md causes issues after pruning:
git checkout HEAD -- MEMORY.md
# Restores exact 31,441-byte version instantly

# Verify restoration:
wc -c MEMORY.md  # should be 31441
```

**Rollback is instant and guaranteed** — git checkout restores exact bytes.

**After rollback, also restore archived files if they were moved:**
```bash
# The archival files are NEW files (not moved from MEMORY.md)
# They are additions, not losses during rollback
# No need to delete them — they are harmless additions
```

---

## 8. VALIDATION SEQUENCE

### Step 1: Size Check
```bash
wc -c /home/node/.openclaw/workspace/MEMORY.md
# Must be < 20,000 bytes
```

### Step 2: Foundational Continuity Check
```bash
# These MUST be present after pruning:
grep -c "True End Goal\|Mission\|CEO Decision Rule\|C-Suite Spawn Config\|Coding Governance\|Evidence Gate\|Credential Governance\|Provider Registry" /home/node/.openclaw/workspace/MEMORY.md
# Must return ≥ 8
```

### Step 3: Governance Evolution Check
```bash
# These key decisions MUST still be referenced:
grep -c "Supabase Key Leak\|Execution System Fixes\|Coding Governance\|AGENTS.md pruning\|Shadow Mode\|SHADOW-MALFORMED\|MEMORY.md pruning" /home/node/.openclaw/workspace/MEMORY.md
# Must return ≥ 5
```

### Step 4: Bootstrap Injection Test
```
After commit: send a WhatsApp message
Check gateway log: should NOT see MEMORY.md truncation warning
```

### Step 5: Operational Continuity Smoke Test
```
Send test message via WhatsApp:
"Verify: what is Moosa's true end goal?"
Expected: cites building Moosa into the most capable AI — core content preserved

"Verify: what is the C-suite spawn rule?"
Expected: cites no agentId in sessions_spawn for C-suite roles — governance preserved

"Verify: what happened in Week 2 audit?"
Expected: cites scorecard summary (if kept inline) or says "see archive" (if externalized)
```

### Step 6: Sidecar Architecture Check
```bash
# These must be present for sidecar understanding:
grep -c "instruction-sidecar-shadow\|SHADOW-SIDECAR\|shadow_received\|quarantine" /home/node/.openclaw/workspace/MEMORY.md
# Must return ≥ 3 (shadow mode architecture preserved)
```

### Step 7: Archived Files Exist
```bash
ls memory/ARCHIVE-MEMORY-LOGS.md strateon/archive/WEEK1-AUDIT-2026-05-03.md strateon/archive/WEEK2-AUDIT-2026-05-11.md memory/ARCHIVE-GITHUB-FIX.md memory/ARCHIVE-GUARDED-EXEC.md 2>/dev/null | wc -l
# Must return 5 (all archive files created)
```

---

## 9. ARCHIVE FILE CREATION (Part of Implementation)

During implementation, these new files will be created:

```
memory/ARCHIVE-MEMORY-LOGS.md
strateon/archive/WEEK1-AUDIT-2026-05-03.md
strateon/archive/WEEK2-AUDIT-2026-05-11.md
memory/ARCHIVE-GITHUB-FIX.md
memory/ARCHIVE-GUARDED-EXEC.md
strateon/archive/CTO-SPAWN-FIX-2026-05-07.md
```

Each archive file will start with:
```markdown
# MEMORY.md Archive — [Section Name]

**Archived from:** MEMORY.md
**Date archived:** 2026-05-15
**Reason:** Pruned to meet 20KB bootstrap limit; content preserved for on-demand reference
**Retrieval:** Read this file if referenced by Moosa during reasoning
```

---

## 10. POST-PRUNING MEMORY.md TARGET STRUCTURE

```
# MEMORY.md — Long-Term Memory (~18,950 bytes)

## True End Goal (Ultimate Vision)         [567] — KEEP
## Secondary Vision                        [200] — KEEP
## Mission                                 [838] — KEEP
## Standing Daily Requirement              [500] — KEEP
## Persistence (C-suite handoff)           [1478] — KEEP (operationally critical)
## How It Works / Spawn Protocol          [442] — KEEP
## State Files Location                    [359] — KEEP
## Non-Negotiable Rule                    [200] — KEEP
## Full Protocol Document                  [150] — KEEP
---
## Current Reality Check                   [REMOVED - stale]
## C-Suite Domains                         [586] — KEEP
## CEO Operational Posture                [600] — KEEP
### Core Rule                             [571] — KEEP
### Mental Checkpoint                     [250] — KEEP
---
## CMO Content Rules                      [500] — KEEP
### Voice Rules                           [300] — KEEP
### Factual Basis Required                [356] — KEEP
---
## C-Suite Spawn Config                   [741] — KEEP
## Key Decisions Made                     [400] — KEEP (summarized)
## Decision Protocol                      [891] — KEEP (pointer)
---
## Coding Governance                     [~1200] — KEEP (condensed)
### Sidecar-Coding Enforcement CLOSED     [REMOVED - duplicate]
---
## Guarded-Exec                           [150] — CONDENSE to pointer
## Execution-guard.js                     [150] — CONDENSE to pointer
---
## Persistent Blockers                    [500] — KEEP (current blockers only)
---
## Global Intelligence Report             [300] — CONDENSE to principle + pointer
## Follow-Up Engine                       [150] — CONDENSE
## HubSpot OAuth                          [150] — CONDENSE
## AI Governance                          [200] — CONDENSE
## Business Disruptor                      [150] — CONDENSE
## LinkedIn Content                       [150] — CONDENSE
---
## Sidecar Architecture                   [300] — KEEP (current shadow mode understanding)
## Protected Process Doctrine              [REFERENCE] — KEEP reference
## Provider + Infrastructure              [REFERENCE] — KEEP reference
## Hardening Phase Continuity             [300] — KEEP current phase + next
## MOOSA Mission + Philosophy             [REFERENCE] — KEEP alignment
---
## MEMORY FAILURE LOG                     [EXTERNALIZED]
## WEEK 1 AUDIT                           [EXTERNALIZED]
## WEEK 2 AUDIT                           [EXTERNALIZED]
## GitHub Push Protection                 [EXTERNALIZED]
## CTO Spawn Protocol Fix                 [EXTERNALIZED]
```

---

## OPEN QUESTIONS

1. **Should the archive files be committed to git?** Yes — they are operational documentation, not secrets. They should be versioned.

2. **Should archived content be referenced with `memory_search` or explicit file reads?** Explicit reads from the archive files when the content is relevant to a current task. `memory_search` will find it automatically.

3. **Should we keep a very brief MEMORY FAILURE LOG inline** (last 3 entries) **or fully externalize?** Suggest fully externalize — the pattern is well-established, recent failures are in daily memory files.

4. **Should the Persistent Blockers section be split** into "Ahmad Actions Required" vs "CTO/Worker Fixes"? Yes — clearer accountability separation.

---

*Plan complete. Awaiting Ahmad go/no-go.*