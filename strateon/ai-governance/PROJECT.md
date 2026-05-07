# AI GOVERNANCE PROJECT
## Pipeline Execution Native Feature — Qiyadon

**Status:** Phase 1 Complete
**Last Updated:** 2026-05-07

---

## Overview

AI Governance is a native feature of Qiyadon's Pipeline Execution Service. It provides:
- **Error Reports** — Structured capture of every outbound send failure, with attempted fixes and resolution
- **Audit Trail** — Every action logged with actor, timestamp, action type, result, chain hash
- **Session Logs** — Full AI decision chain per engine run (input → decision → output → result)

**Governance is built into all tiers.** It's not an add-on — it's always running, always recording.

---

## Phases

### Phase 1: Error Reports ✅
- **Status:** Complete
- **Table:** `error_reports` in Supabase (Project A)
- **Code:** `moosa-worker/src/governance/send-whatsapp-governance.js` + `send-email-governance.js`
- **Test:** `ERR-2026-05-07-TEST` → id `7c9b7414-8a09-4f26-bb66-c184e1684c72` ✅
- **Next:** Integrate governance wrapper into moosa-worker handler pipeline (CTO)

### Phase 2: Audit Trail ⏳ Pending
- **Table:** `audit_trail_events` — designed in `CTO/AI-GOVERNANCE-TECH-SPEC.md`
- **Code:** `emitAuditEvent()` — not yet built
- **Schedule:** After Phase 1 integration complete

### Phase 3: Session Logs ⏳ Pending
- **Table:** `session_logs` — designed in `CPO/AI-GOVERNANCE-REPORTING-SPEC.md`
- **Code:** Session context wrapper — not yet built
- **Schedule:** After Phase 2 complete

### Phase 4: Friday Report Integration ⏳ Pending
- **Friday report** gains "AI GOVERNANCE SUMMARY" section
- **On-demand export:** Reply `GOVERNANCE` → secure link (48h expiry)
- **Schedule:** After Phase 3 complete

---

## Files

| File | Phase | Description |
|---|---|---|
| `CTO/AI-GOVERNANCE-TECH-SPEC.md` | All | Full technical architecture |
| `CPO/AI-GOVERNANCE-REPORTING-SPEC.md` | All | Product specification |
| `moosa-worker/src/governance/send-whatsapp-governance.js` | 1 | WhatsApp send wrapper with error tracking |
| `moosa-worker/src/governance/send-email-governance.js` | 1 | Email fallback for WhatsApp failures |
| `moosa-worker/src/governance/README.md` | 1 | Integration guide |
| `strateon/ai-governance/SESSION-STATES/2026-05-07-001.md` | 1 | Phase 1 session state |

---

## Tier Differentiation

| Feature | Starter | Growth | Scale |
|---|---|---|---|
| Error reports | ✅ | ✅ | ✅ |
| Audit trail (7-day) | ✅ | ✅ | ✅ |
| Session logs (90-day) | ✅ | ✅ | ✅ |
| Friday report governance section | ✅ | ✅ | ✅ |
| Full audit export (on-demand) | ✅ | ✅ | ✅ |
| Monthly governance report | — | — | ✅ |
| Session logs retention | 90 days | 90 days | 24 months |
| Audit trail retention | 24 months | 24 months | 60 months |
| Live governance dashboard | — | — | ✅ |
| Real-time error alerting | — | — | ✅ |
| Audit chain hash verification | — | — | ✅ |

---

## Success Metrics

| Metric | Definition | Target |
|---|---|---|
| Error report completeness | % of failures with error report | 100% |
| Auto-resolution rate | % of errors resolved without client action | >80% |
| Audit trail coverage | % of pipeline actions with audit entry | 100% |
| Session log coverage | % of engine runs with session log | 100% |
| Audit chain integrity | % of weekly checks with intact chain | 100% |

---

*AI Governance Project — Qiyadon*
*Supersedes: N8N Reliance Removal Project (separate track)*