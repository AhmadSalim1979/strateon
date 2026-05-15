# AGENTS.md PRUNING PLAN
## Reduce AGENTS.md From 22,266 to Under 20,000 Bytes

**Date:** 2026-05-15
**Trigger:** Bootstrap truncation — AGENTS.md 22,266 bytes exceeds 20,000 byte limit
**Goal:** Preserve all governance invariants, reduce narrative/process overhead only
**Status:** PLAN — Awaiting Ahmad Approval

---

## CURRENT SIZE ANALYSIS

```
AGENTS.md: 22,266 bytes (550 lines)
Limit:     20,000 bytes
Overage:   2,266 bytes
Target:   19,500 bytes (500-byte buffer below limit)
Required reduction: ~2,766 bytes
```

---

## SECTION-BY-SECTION AUDIT

| Section | Size (chars) | % of Total | Governance-Critical | Redundancy | Action |
|---------|-------------|-----------|---------------------|-----------|--------|
| `# AGENTS.md - Your Workspace` | 28 | 0.1% | No | No | Keep as-is |
| `## First Run` | 71 | 0.3% | No | Yes — BOOTSTRAP.md exists | **Merge into Session Startup** |
| `## Session Startup` | 148 | 0.7% | No | Partially redundant | **Condense** |
| `### Startup Memory Check` | 321 | 1.4% | Yes — memory enforcement | No | Keep, **condense** |
| `## Memory` | 503 | 2.3% | Yes — memory discipline | Partially redundant | Keep, **condense** |
| `### MEMORY.md Long-Term` | 370 | 1.7% | No | Redundant with MEMORY.md itself | **Delete — redundant** |
| `### Write It Down` | 579 | 2.6% | No | Process reminder | **Condense** |
| `### End-of-Session Memory` | 438 | 2.0% | Yes — memory enforcement | No | Keep, **condense** |
| `### Daily Memory Carry-Forward` | 729 | 3.3% | Yes — carry-forward rules | No | Keep, **condense** |
| `## Red Lines` | 2,074 | 9.3% | Yes — hard constraints | No | Keep, **condense** |
| `## External vs Internal` | 175 | 0.8% | No | No | **Merge into Red Lines** |
| `## Group Chats` | 277 | 1.2% | No | No | **Merge into Red Lines** |
| `### Know When to Speak` | 191 | 0.9% | No | No | **Merge into Group Chats** |
| `### React Like a Human` | 961 | 4.3% | No | Style only | **Delete — nice-to-have, not doctrine** |
| `## Tools` | 648 | 2.9% | No | Redundant with TOOLS.md + skills | **Delete — redundant** |
| `## Heartbeats` | 613 | 2.8% | Partially | Yes | **Condense to 2 lines** |
| `### Heartbeat vs Cron` | 501 | 2.3% | No | No | **Condense into Heartbeats** |
| `### Memory Maintenance` | 1,780 | 8.0% | No | Detailed process | **Delete — process, not doctrine** |
| `### Control Plane Authority` | 604 | 2.7% | Yes — session mode rules | No | Keep as reference |
| `## Make It Yours` | 3,970 | 17.8% | No | **LARGEST — process narrative** | **DELETE ENTIRELY** |
| `## Sub-Agent Timeout Recovery` | 123 | 0.6% | Yes — timeout protocol | No | Keep |
| `## Pending Commitments` | 1,555 | 7.0% | Yes — commitment tracking | No | Keep, **condense** |
| `## Coding Governance` | 630 | 2.8% | Yes — hard execution invariant | No | Keep |
| `## Evidence Gate` | 169 | 0.8% | Yes — truth classification | No | Keep |
| `## Credential Governance` | 554 | 2.5% | Yes — credential rules | No | Keep |
| `## Provider Registry` | 235 | 1.1% | Yes — provider restrictions | No | Keep, **condense** |
| `## Safe Failure Mode` | 130 | 0.6% | Yes — uncertainty handling | No | Keep |
| `## Hallucination Prevention` | 167 | 0.8% | Yes — truthfulness | No | Keep |
| `## Truth Classification Prefixes` | 292 | 1.3% | Yes — classification discipline | No | Keep, **condense** |
| `## Runtime Evidence Attachments` | 254 | 1.1% | Yes — evidence discipline | No | Keep, **condense** |
| `## Production Change Gate` | 298 | 1.3% | Yes — change discipline | No | Keep |
| `## Task Silence Policy` | 221 | 1.0% | Yes — communication discipline | No | Keep |
| `## Governance File Index` | 123 | 0.6% | No | No | **Delete — reference, not doctrine** |

---

## DETAILED REDUCTION PLAN

### DELETE ENTIRELY (savings: ~5,711 chars)

| Section | Chars Saved | Reason |
|---------|------------|--------|
| `## Make It Yours` | ~3,970 | **LARGEST section.** Process narrative, style preferences, conventions. Not governance. |
| `### React Like a Human` | ~961 | Emoji/style guidance. Nice-to-have, not operational doctrine. |
| `### Memory Maintenance` | ~1,780 | Detailed process for memory review. Not essential for bootstrap. |

**Total deletion savings: ~5,711 chars** (more than needed)

### CONDENSE (savings: ~1,500 chars)

| Section | Current | Target | Savings | Method |
|---------|---------|--------|---------|--------|
| `## Red Lines` | 2,074 | 1,200 | ~874 | Remove examples, keep constraint text only |
| `### Write It Down` | 579 | 300 | ~279 | Cut to 3 imperatives |
| `### Daily Carry-Forward` | 729 | 400 | ~329 | Cut to rules only, remove narrative |
| `## Pending Commitments` | 1,555 | 900 | ~655 | Cut to bullet rules only |
| `### Truth Classification` | 292 | 150 | ~142 | Keep table only |
| `## Provider Registry` | 235 | 100 | ~135 | Replace with reference to file |

**Total condensation savings: ~2,414 chars**

### MERGE (savings: ~300 chars)

| Sections Merged | Into | Savings |
|----------------|------|---------|
| `## First Run` + `## Session Startup` | `## Session Startup` | ~71 chars + eliminated header |
| `## External vs Internal` + `## Group Chats` + subsections | `## Operations` (new) | ~175 + ~277 + ~191 = ~643 chars, new header ~50 |

### KEEP AS-IS (~18,600 chars of original governance)

The following are **NOT targets for reduction** — they are operational doctrine:
- Startup Memory Check (memory enforcement)
- Memory section (discipline)
- End-of-Session Memory (memory enforcement)
- Coding Governance (hard execution invariant)
- Evidence Gate (truth discipline)
- Credential Governance (credential rules)
- Safe Failure Mode (uncertainty handling)
- Hallucination Prevention (truth discipline)
- Production Change Gate (change discipline)
- Task Silence Policy (communication discipline)
- Sub-Agent Timeout Recovery (recovery protocol)
- Control Plane Authority (session mode rules)

---

## PROOF: NO GOVERNANCE INVARIANT LOST

### Invariants That Must Survive

| Invariant | Preserved In | Location |
|-----------|-------------|----------|
| Memory enforcement (daily memory write) | `### 🚨 Startup Memory Check` + `### 🚨 End-of-Session Memory` | Condensed but intact |
| Sub-agent timeout protocol | `## Sub-Agent Timeout Recovery Protocol` | Kept as-is |
| Pending commitment tracking | `## Pending Commitments Tracking` | Condensed but rules intact |
| Coding governance (route to sidecar) | `## 🔒 CODING GOVERNANCE` | Kept as-is |
| Evidence gate (verify before stating) | `## Evidence Gate` | Kept as-is |
| Credential governance (no invented creds) | `## Credential Governance` | Kept as-is |
| Hallucination prevention | `## Hallucination Prevention` | Kept as-is |
| Truth classification prefixes | `## Truth Classification Prefixes` | Condensed, table kept |
| Production change gate | `## Production Change Gate` | Kept as-is |
| Task silence policy | `## Task Silence Policy` | Kept as-is |
| Approved providers | `## Provider Registry` | Replaced with file reference |
| Safe failure mode | `## Safe Failure Mode` | Kept as-is |
| Control plane authority (session modes) | `### 🔒 Control Plane Authority` | Kept as-is |

### What Is Removed (And Why It's Safe)

| Removed | Why Safe to Remove |
|---------|-------------------|
| `## Make It Yours` | Style/conventions narrative, not operational doctrine |
| `### React Like a Human` | Emoji guidance, not operational doctrine |
| `### Memory Maintenance` | Process for periodic review, not session-start doctrine |
| `### MEMORY.md Long-Term Memory` | Redundant with MEMORY.md file itself |
| `## Tools` section | Redundant with TOOLS.md + SKILL.md files |
| `## Governance File Index` | Reference to another file, not doctrine |
| `### Know When to Speak` + `### React Like a Human` | Group chat style guidance, not operational doctrine |

**None of the removed sections contain governance constraints, operational rules, or behavioral invariants.**

---

## TARGET STRUCTURE (After Pruning)

```
AGENTS.md — Target: ~18,500 bytes

# AGENTS.md - Your Workspace

## Session Startup          (merged First Run + Session Startup)
  Startup Memory Check      (KEPT — critical memory enforcement)
  Memory section            (KEPT — discipline)
  End-of-Session Memory     (KEPT — critical memory enforcement)

## Daily Memory Carry-Forward Protocol  (CONDENSED)
## Red Lines               (CONDENSED — remove examples)
## Operations             (MERGED: External vs Internal + Group Chats)
## Heartbeats             (CONDENSED to 2 lines)
## Control Plane Authority (KEPT — session mode rules)
## Sub-Agent Timeout Recovery (KEPT)
## Pending Commitments    (CONDENSED)
## Coding Governance      (KEPT — hard invariant)
## Evidence Gate          (KEPT)
## Credential Governance  (KEPT)
## Provider Registry      (CONDENSED to reference)
## Safe Failure Mode      (KEPT)
## Hallucination Prevention (KEPT)
## Truth Classification   (CONDENSED — table only)
## Runtime Evidence       (CONDENSED)
## Production Change Gate (KEPT)
## Task Silence Policy    (KEPT)
```

---

## ROLLBACK PLAN

```bash
# If AGENTS.md causes issues after pruning:
git checkout HEAD -- AGENTS.md
# Restores exact previous state instantly

# Verify restoration:
wc -c AGENTS.md  # should be 22266
```

**Rollback is instant and guaranteed** — git checkout restores exact bytes.

---

## BLAST RADIUS

| Component | Impact | Notes |
|-----------|--------|-------|
| AGENTS.md | Modified — bootstrap content changed | Truncation eliminated |
| Session behavior | May change — fewer injected rules | Less verbose, same core rules |
| Worker, gateway, PM2 | None | No infrastructure changes |
| Governance enforcement | None — all invariants preserved | Only narrative removed |
| Sidecar shadow | None | No interaction |
| Other workspace files | None | No changes |

**Blast radius: MINIMAL** — only bootstrap content reduced.

---

## VALIDATION SEQUENCE

### Step 1: Size Check (Before Commit)
```bash
wc -c /home/node/.openclaw/workspace/AGENTS.md
# Must be < 20,000 bytes
```

### Step 2: Governance Invariant Audit
```bash
# Verify all critical sections still present:
grep -c "MEMORY ENFORCED\|Timeout Recovery\|CODING GOVERNANCE\|Evidence Gate\|Credential Governance\|Hallucination Prevention\|Truth Classification\|Production Change Gate" /home/node/.openclaw/workspace/AGENTS.md
# Must return ≥ 8 (one for each invariant category)
```

### Step 3: Bootstrap Injection Test
```
After commit: send a WhatsApp message
Check gateway log: should NOT see AGENTS.md truncation warning
```

### Step 4: Operational Behavior Smoke Test
```
Send test message via WhatsApp:
"Verify: do you remember the coding governance rule?"
Expected: agent cites routing to local_coder sidecar
This confirms critical rules survived pruning
```

### Step 5: No Regression in Heartbeat Behavior
```
Send heartbeat message
Expected: normal HEARTBEAT_OK or check response
Confirms memory enforcement section still functional
```

---

## IMPLEMENTATION ORDER

1. Make changes to AGENTS.md
2. `wc -c AGENTS.md` — verify < 20,000
3. Git commit with change
4. Send test WhatsApp message
5. Verify no truncation in gateway log
6. Report results

---

*Plan complete. Awaiting Ahmad go/no-go.*