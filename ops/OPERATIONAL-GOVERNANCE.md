# Operational Governance

**Purpose:** Master index of all governance files — purpose, owner, validation method, last modified.
**Owner:** Moosa (CEO)
**Validation:** Review this file after any governance change to ensure all entries are accurate.
**Last Modified:** 2026-05-15

---

## Governance Files Index

| File | Purpose | Owner | Validation | Last Modified |
|------|---------|-------|------------|---------------|
| `/ops/PROCESS-SAFETY.md` | Protected process registry, safe process operations, bounded kill scopes, runtime recovery | Moosa | Review after any new PM2 process added | 2026-05-15 |
| `/ops/state-machine.js` | State definitions, transition logic, staleness rules, alert formatting | Moosa | Phase 3 implementation | 2026-05-15 |
| `/ops/stale-task-detector.js` | Watchdog extension for stale task detection | Moosa | Phase 3 implementation | 2026-05-15 |
| `/ops/INFRASTRUCTURE-REGISTRY.md` | Classification of all infrastructure components by environment | Moosa | Review quarterly; update after any infrastructure change | 2026-05-15 |
| `/ops/PROVIDER-REGISTRY.md` | Approved and rejected infrastructure providers | Moosa | Review after any provider change or incident | 2026-05-15 |
| `/ops/OPERATIONAL-GOVERNANCE.md` | This file — master governance index | Moosa | Update this file when creating new governance files | 2026-05-15 |
| `/home/node/.openclaw/workspace/AGENTS.md` | Agent operational rules — evidence gate, credential governance, silence policy, safe failure mode | Moosa + Ahmad | Update after any governance hardening phase | 2026-05-15 |
| `/home/node/.openclaw/workspace/HEARTBEAT.md` | Heartbeat protocol — memory enforcement, stall detection | Moosa | Update when adding heartbeat checks | 2026-04-28 |
| `/home/node/.openclaw/workspace/strateon/HARDENING-PLAN.md` | Phase 1 hardening implementation plan — approved | Moosa | Only updated on phase approval or implementation | 2026-05-15 |

---

## Classification Definitions

| Classification | Definition |
|----------------|------------|
| `production` | Live, revenue-critical, customer-facing systems |
| `staging` | Pre-production, used for validation before going live |
| `local` | Development-only, not used in production |
| `deprecated` | Retired, replaced, or migrated away from |
| `unknown` | Cannot determine classification — must investigate within 48 hours |

---

## Truth Classification Prefixes

Every operational statement must carry one of these prefixes:

| Prefix | Meaning |
|--------|---------|
| `[VERIFIED FACT]` | Confirmed by file/line, command output, API response, DB row, process status, or inbox delivery |
| `[INFERRED]` | Derived from available evidence, logical extension — not direct confirmation |
| `[ASSUMPTION]` | Stated as unverified, acknowledged as unknown — must not be presented as fact |
| `[UNKNOWN]` | Cannot determine — explicitly flagged, no speculation |

**Rule:** No blended narrative. No unclassified operational statements in session.

---

## Safe Failure Mode

When uncertain:

1. **STOP** — Do not continue execution
2. **ASK** — Request clarification from Ahmad
3. **NEVER** — Invent a fix, credential, provider, or assumption
4. **NEVER** — Say "assume likely" or present speculation as operational truth

**Unknown is acceptable. Fabricated certainty is not.**

---

## Evidence Requirements

Any infrastructure claim must include:

```
command:  <exact command executed>
file:     <file path if applicable>
time:     <ISO 8601 timestamp>
pid:      <process ID if relevant>
result:   <actual output>
```

If none available: state `[UNKNOWN]` and do not speculate.

---

## Hallucination Prevention

Prohibited:
- Creating plausible but unverified explanations
- Filling unknowns with assumptions
- Presenting guesses as operational truth

Acceptable: `[UNKNOWN]` — clearly labeled
Unacceptable: Fabricated certainty, "assume likely", "probably"

---

## Governance File Creation Checklist

When creating a new governance file, ensure it includes:

- [ ] Purpose statement
- [ ] Owner (role or name)
- [ ] Validation method (how to verify accuracy)
- [ ] Last Modified timestamp
- [ ] No secrets, credentials, or sensitive data

New governance files must be added to this index (`OPERATIONAL-GOVERNANCE.md`) immediately upon creation.

---

## Change Log

| Date | Who | What Changed |
|------|----|--------------|
| 2026-05-15 | Moosa | Initial governance index created — Phase 0 hardening |

---

*Review this file after any governance change. Ensure all entries are accurate and up-to-date.*