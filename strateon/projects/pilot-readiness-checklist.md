# Qiyadon Pilot Readiness Checklist
**Generated:** 2026-05-12
**Status:** For Ahmad review and action

---

## PILOT READINESS STATUS

| Component | Status | Notes |
|---|---|---|
| sign-trial.html | ✅ READY | Trust-first 3-phase, dual checkbox |
| sign-scale.html | ✅ READY (static) | Needs real evaluation data from first trial client |
| server.js | ✅ READY | Handles evaluation-start and scale-opt-in types |
| lifecycle_state column | 🔴 PENDING | Migration SQL ready — needs Ahmad to run |
| lifecycle-manager.js | ✅ READY | State machine + audit logging |
| Reminder email templates | ✅ READY | 4 templates, calm operational tone |
| Migrate-v1.2 SQL | ✅ READY | Adds lifecycle tables + pilot telemetry columns |
| Supabase schema | 🔴 PENDING | Migration must be applied before engine activates |
| Delaware C-Corp | 🔴 BLOCKER | Cannot sign Scale clients without entity |
| Follow-up engine | ✅ READY | Not started (waiting for first client + entity) |
| HubSpot OAuth | ✅ RESOLVED | oauth.qiyadon.com live, SSL valid, 302 confirmed |
| WhatsApp | 🔴 DEAD | Needs physical QR re-auth (inbound dead) |

---

## PILOT CONSTRAINTS (Mandatory)

- Maximum **3–5 accounts** during pilot
- All governance active (audit logs, error reports, session tracking)
- Reputation monitoring active
- Escalation tracking active
- Outbound throttles enforced
- Behavioral observation active

---

## LIFECYCLE STATES — Approved Only

```
ACTIVATION_PENDING → ACTIVATION_ACTIVE → EVALUATION_ACTIVE → EVALUATION_COMPLETE
                                                                        ↓
                                                    SCALE_PENDING → SCALE_ACTIVE
                                                                        ↓
                                                                   CLOSED_NO_SCALE
```

**Terminal states:** `CLOSED_NO_SCALE` — no transitions out
**No hidden transitions** — explicit only

---

## REQUIRED ACTIONS — Ahmad

### 🔴 Action Required: Supabase Migration

**File:** `strateon/followup-engine/migrate-v1.2-lifecycle.sql`

Run this command:
```bash
psql $DATABASE_URL < /home/node/.openclaw/workspace/strateon/followup-engine/migrate-v1.2-lifecycle.sql
```

This adds:
- `lifecycle_state` column to `clients` table
- 5 lifecycle timestamp columns to `clients` table
- `client_lifecycle_events` audit table
- Pilot telemetry columns to `pipeline_leads` (first_reply_at, artifact_engaged, trust_signals, confusion_indicators, suspicion_indicators, async_engagement_score)
- `reminder_logs` table

### 🔴 Action Required: Delaware C-Corp Registration

**Why:** Cannot sign Scale clients, cannot activate Stripe, cannot execute paid agreements
**Impact:** Commercial execution frozen until resolved

### 🟡 Action Required: WhatsApp Re-auth (Optional)

- Inbound dead (session invalidated server-side ~April 29)
- Outbound still works
- Needs physical phone to scan QR via OpenClaw control panel
- Not required for pilot (outbound is functional)

---

## ROLLBACK PATH

If anything fails during pilot:

1. **Lifecycle transition fails** → engine logs error, does not proceed, alerts via error_reports table
2. **Client onboarding fails** → state stays at last valid state, human reviews
3. **Email send fails** → logged to reminder_logs with outcome=FAILED, retry next cycle
4. **Engine crashes** → PM2 restarts, resumes from last state (idempotent operations)

---

## TELEMETRY FIELDS — Pilot Observation Only

| Field | Purpose | Where |
|---|---|---|
| `first_reply_at` | Reply behavior tracking | pipeline_leads |
| `artifact_engaged` | Report engagement | pipeline_leads |
| `trust_signals[]` | Positive trust indicators | pipeline_leads |
| `confusion_indicators[]` | UX friction signals | pipeline_leads |
| `suspicion_indicators[]` | Dark-pattern backlash | pipeline_leads |
| `async_engagement_score` | Overall engagement quality | pipeline_leads |
| `lifecycle_state` | Current state | clients |
| `lifecycle events` | Full audit trail | client_lifecycle_events |
| `reminder_logs` | Email sequence tracking | reminder_logs |

**No large analytics platform** — minimal pilot observation only.

---

## CLOSURE CRITERIA

Pilot is ready when:
- [ ] Supabase migration applied
- [ ] First trial client onboarded (ACTIVATION_PENDING)
- [ ] Delaware C-Corp registered
- [ ] Follow-up engine started (`pm2 start ecosystem-followup.config.js`)

---

## IMPLEMENTATION SIMPLICITY NOTES

- No additional orchestration systems
- No new governance frameworks
- No recursive abstractions
- No new AI coordination layers
- No further strategic redesigns

From this point: **implementation simplicity over conceptual sophistication**.