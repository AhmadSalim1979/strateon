# C-Suite Spawn Protocol
**Version:** 1.0
**Date:** 2026-04-28
**Author:** Moosa (CEO)

---

## Purpose

Every time a C-suite agent is spawned, it must be spawned with full context from the previous session. Work must never die because an agent session ended.

---

## Spawn Protocol — Step by Step

### Step 1: Read Previous State
Before spawning, CEO reads the role's most recent SESSION-STATE.md:
```
/strateon/csuite/{ROLE}/SESSION-STATES/{DATE}-{NUMBER}.md
```

### Step 2: Read Role Goals
Read the role's GOALS.md for current objectives:
```
/strateon/csuite/{ROLE}/GOALS.md
```

### Step 3: Read Role Identity
Read the role's IDENTITY.md for domain context:
```
/strateon/csuite/{ROLE}/IDENTITY.md
```

### Step 4: Build Spawn Message
Construct the spawn message including:
1. State file contents (last session summary, blockers, next actions)
2. Current task from SoD Report or as assigned by CEO
3. Explicit instruction: "Continue from SESSION-STATE. Execute task X."

### Step 5: Spawn with State Injection
Use sessions_spawn with:
- `task`: Full context + specific task
- `label`: `{ROLE}-{DATE}-{NUMBER}` for traceability
- `mode`: "run" for one-shot, "session" for persistent

### Step 6: Require State Commit
Every spawn message ends with:
> "Before ending your session, you MUST write a new state file to `/strateon/csuite/{ROLE}/SESSION-STATES/{TODAY-DATE}-{NEXT-NUMBER}.md` documenting: what you accomplished, what's pending, what the next action is, files created/modified."

---

## State File Naming Convention

```
{SHORTDATE}-{SESSIONNUMBER}.md
```

Examples:
- `2026-04-28-001.md`
- `2026-04-28-002.md`
- `2026-04-29-001.md`

---

## End-of-Session Commitment (Non-Negotiable)

Every C-suite agent MUST commit state before the session ends.

**If session times out without committing:**
- The state file is empty or missing
- CEO flags this as a system failure
- Work is reviewed and re-spawned with full context

**If agent crashes:**
- Previous state file is the source of truth
- Next agent picks up from last committed state

---

## Current Active State Files

| Role | Last State File | Last Updated |
|---|---|---|
| CTO | None yet | — |
| CMO | None yet | — |
| CFO | None yet | — |
| COO | None yet | — |
| CPO | None yet | — |
| CLA | None yet | — |
| AI Architect | None yet | — |

---

## Spawn Checklist

Before every spawn, CEO confirms:
- [ ] Read previous SESSION-STATE.md
- [ ] Read GOALS.md
- [ ] Read IDENTITY.md (if needed)
- [ ] Built spawn message with full context
- [ ] Included state commit instruction in spawn task
- [ ] Noted spawn in C-suite log

---

_Last updated: 2026-04-28_