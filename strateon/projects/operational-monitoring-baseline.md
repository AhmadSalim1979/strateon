# Qiyadon Operational Monitoring Baseline
**Generated:** 2026-05-12
**Phase:** LIVE OPERATIONAL PILOT

---

## CADENCE BEHAVIOR — EXPECTED

### Hourly Cycle (PM2 cron, top of hour Berlin time)

```
Minute 0:  Engine wakes
Minute 1:  Check Supabase for active leads
Minute 2:  Apply cadence rules per lead (day, touch count, throttle)
Minute 3:  Send touches via correct channel (email/whatsapp/linkedin)
Minute 4:  Log activity to pipeline_activity
Minute 5:  Check for responses → update pipeline_leads.response_received
Minute 6:  Check stalled leads → escalate if 14+ days no response
Minute 7:  Sleep until next hour
```

### Cadence Touch Sequence

```
Day 1:    Touch 1 (intro)
Day 3:    Touch 2 (follow-up 1)
Day 7:    Touch 3 (value-add)
Day 14:   Touch 4 (check-in)
Day 21:   Touch 5 (pivot)
Day 30:   Touch 6 (final)
```

### Expected Behavior Per Week

| Week | Leads Touched | Replies | Meetings |
|---|---|---|---|
| Week 1 | ~15–25 | 1–3 | 0–1 |
| Week 2 | ~10–20 (follow-up) | 2–5 | 1–2 |
| Week 3 | ~5–10 (continued) | 2–4 | 1–2 |
| Week 4 | ~5 (final pushes) | 1–3 | 1–2 |

### Reply Rate Benchmarks

| Metric | Green | Yellow | Red |
|---|---|---|---|
| Overall reply rate | > 3% | 1–3% | < 1% |
| Email reply rate | > 2% | 1–2% | < 1% |
| WhatsApp reply rate | > 8% | 4–8% | < 4% |
| LinkedIn reply rate | > 5% | 2–5% | < 2% |

### Cadence Throttle Compliance

- Max 1 email per lead per day ✅ enforced
- Max 6 touches per lead total ✅ enforced
- Stalled lead (14+ days) → escalate and pause ✅ enforced
- LinkedIn max 20/day ✅ enforced
- WhatsApp max 3 per lead per day ✅ enforced

---

## TRUST THRESHOLDS

### Green — All Clear

- Reply rate > 3% sustained
- No escalations in 7 days
- Report engagement > 70%
- Zero complaints
- Deliverability > 95%

### Yellow — Monitor

- Reply rate 1–3%
- 1–2 escalations in 7 days
- Report engagement 40–70%
- 1 complaint (resolved within 24h)
- Deliverability 90–95%

### Red — Action Required

- Reply rate < 1% for 5+ days
- 3+ escalations in 7 days
- Report engagement < 40%
- Unresolved complaint
- Deliverability < 90%
- Any spam complaint

---

## ANOMALY INDICATORS

### Immediate Attention

| Indicator | Threshold | Action |
|---|---|---|
| Bounce spike | > 5% bounce rate | Pause all sends, investigate |
| Spam complaint | Even 1 | Emergency stop |
| Escalation spike | 3+ in one week | Review lead quality |
| Deliverability drop | < 90% | Investigate, fix, restart |
| Client silence | 7+ days no reply | Human check-in email |
| Reply rate collapse | < 1% for 5+ days | Review targeting |

### Warning Signs

| Indicator | What It Means | Response |
|---|---|---|
| Report not opened | Client disengaged | Check-in email |
| Client going dark | Hesitation or trust issue | Human touchpoint |
| Targeting mismatch | Wrong message for list | Adjust body |
| Channel imbalance | One channel underperforming | Shift focus |
| Over-engagement | Too many touches too fast | Reduce frequency |

---

## OPERATIONAL WARNING CONDITIONS

### Stop Conditions (Emergency)

```
🚨 STOP IMMEDIATELY:
- Spam complaint (even 1)
- Bounce rate > 5%
- Client requests stop
- Legal/compliance concern
- Reputation incident

Command: pm2 stop strateon-followup-engine
```

### Pause Conditions (Review)

```
⚠️ PAUSE AND REVIEW:
- Reply rate < 1% for 5+ days
- 3+ escalations in one week
- Report engagement < 40%
- 2+ complaints in one month

Action: Investigate, fix, then resume with Ahmad approval
```

### Monitor Conditions

```
👁️ MONITOR CLOSELY:
- Reply rate 1–3%
- 1–2 escalations
- Client silent 5–7 days
- Targeting uncertainty

Action: Human check-in, adjust if needed, continue
```

---

## BASELINE METRICS — Day 1 of Pilot

These will be updated as pilot runs.

| Metric | Baseline | Update After |
|---|---|---|
| Reply rate | 0% (no data yet) | Week 1 |
| Meeting rate | 0 (no data yet) | Week 2 |
| Escalation rate | 0 (no data yet) | Week 1 |
| Report engagement | N/A | Day 7 first report |
| Client trust | N/A | Day 14 assessment |
| Deliverability | N/A | Day 7 |

---

## MONITORING CADENCE

### Every Hour (Automated via PM2)

```bash
pm2 logs strateon-followup-engine --lines 20 --nostream
```

Look for: errors, escalations, failed sends

### Every Morning (Human Review)

```bash
# Check PM2 health
pm2 list

# Check errors
psql $DATABASE_URL -c "SELECT * FROM error_reports ORDER BY created_at DESC LIMIT 5;"

# Check client states
psql $DATABASE_URL -c "SELECT id, name, lifecycle_state, updated_at FROM clients ORDER BY updated_at DESC LIMIT 10;"
```

### Every Friday (Weekly Report)

Generate pilot health dashboard → send to Ahmad via WhatsApp

### Day 14 (Assessment)

Review 5 criteria → send Scale offer or closing email

---

## VALIDATED SYSTEM STATUS

| Component | Status | Last Validated |
|---|---|---|
| Lifecycle state machine | ✅ Pass | 2026-05-12 |
| Transition guard validation | ✅ Pass | 2026-05-12 |
| Reminder templates | ✅ Pass | 2026-05-12 |
| No urgency/dark patterns | ✅ Pass | 2026-05-12 |
| PM2 process (hub-oauth-v2) | ✅ Online, 17h | 2026-05-12 |
| PM2 process (strateon-followup-engine) | ⏸ Waiting restart | 2026-05-12 |
| Follow-up engine safety flags | ✅ DRY_RUN=true, GLOBAL_ENABLED=false, SEND_EMAILS=false | 2026-05-12 |

---

*Baseline established. Monitoring active. Operator mode engaged.*