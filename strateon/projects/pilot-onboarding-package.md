# Qiyadon Pilot Onboarding Package
**Generated:** 2026-05-12
**Phase:** LIVE OPERATIONAL PILOT

---

## FOR QIYADON TEAM — Internal Use

### How to Onboard a Pilot Client

**Step 1 — Warm Introduction (Ahmad or trusted referrer)**
- Send introduction email or LinkedIn DM
- Keep it brief: "Would you be open to a 20-min call about pipeline execution?"
- Qualify on call: pipeline pain? founder-led? HubSpot?
- If qualified → schedule onboarding call

**Step 2 — Onboarding Call (20 min)**
Agenda:
1. Brief intro — what Qiyadon does (pipeline execution, not a tool)
2. How the 14-day evaluation works (activation → evaluation → decision)
3. What we need from them: CRM access, lead list (≤25), weekly feedback
4. Answer any questions
5. Schedule Day 1 kickoff

**Step 3 — Day 0: Client Signs sign-trial.html**
- Send link: https://qiyadon.com/sign-trial
- Client submits: name, email, company, dual checkbox acknowledgment
- server.js writes `lifecycle_state = ACTIVATION_PENDING` to Supabase
- Confirmation email sent automatically

**Step 4 — Day 1: CRM Connection**
- HubSpot OAuth: https://oauth.qiyadon.com/hubspot/auth
- Import lead list (max 25 during evaluation)
- Verify warmup status on sending domain

**Step 5 — Day 2: Activation Complete Email**
- Use buildActivationCompleteEmail() template
- Include: what was connected, what's next
- Log to reminder_logs (ACTIVATION_COMPLETE)
- lifecycle_state → ACTIVATION_ACTIVE

**Step 6 — Days 2–7: Cadence Runs**
- Engine processes hourly (PM2 cron)
- Monitor: reply rates, bounces, escalations
- If issues → intervene per playbook

**Step 7 — Day 7: Midpoint Review Email**
- Use buildDay7ReviewEmail() template
- Include actual metrics if available
- Log to reminder_logs (DAY_7_REVIEW)
- lifecycle_state → EVALUATION_ACTIVE

**Step 8 — Day 14: Assessment + Offer**
- Review 5 criteria
- If ≥3 met → buildDay14OfferEmail() → sign-scale link
- If <3 → closing email → CLOSED_NO_SCALE
- Log to client_lifecycle_events

---

## FOR CLIENT — Trust Framing

### What Is Qiyadon?

Qiyadon is pipeline execution infrastructure — we run your outbound campaigns so you don't have to manage tools or chase leads manually.

Not a dashboard. Not a widget. Not a list scrubber.

Operational continuity. We stay on it.

### How the 14-Day Evaluation Works

**Phase 1 — First 72 hours: We get set up**
- Connect your CRM
- Activate outbound cadence
- Make sure everything is working

This is not your trial. This is setup.

**Phase 2 — 14 days: Your system runs**
- We run campaigns across WhatsApp, Email, and LinkedIn
- You receive weekly operational reports
- We track and measure everything

This is the real evaluation. The system needs time to demonstrate value.

**Phase 3 — Day 14: We review together**
- We assess 5 criteria together
- If Qiyadon is working for you → Scale offer
- If not → you owe nothing, no pressure

**What happens if you want to continue:**
- Scale plan: $1,500/month, 3-month minimum ($4,500 total)
- You sign a new paid agreement — no auto-renewal
- Billing begins after signing

**What happens if you don't want to continue:**
- No charge, no obligation
- We send one final follow-up
- No contact for 60 days after

---

## CLIENT EXPECTATIONS SET AT ONBOARDING

### What We Deliver
- Consistent outbound across activated channels
- Weekly operational reports (Friday)
- Escalation when a lead goes dark
- Qualification assessment at Day 14
- Transparent communication throughout

### What We Don't Deliver
- Specific number of meetings (outcome varies)
- Instant results (pipeline takes time)
- Auto-conversion to paid (never)

### What We Need From You
- CRM access (HubSpot preferred)
- Lead list (clean, real emails, max 25 during evaluation)
- Feedback on targeting and messaging (help us help you)
- Reply to weekly reports (even a quick "looks good" is enough)

### How to Reach Us
- Email: contact@qiyadon.com
- Response time: within 24 hours during business days

---

## SUPPORT / ESCALATION GUIDANCE

### For Qiyadon Team

**Tier 1 — Routine (handled by system):**
- Lead stalled → system escalates → human reviews
- Bounce → removed from cadence → logged
- Unsubscribe → removed immediately

**Tier 2 — Human touchpoint needed:**
- Client silent for 7+ days → check-in email
- Client asks questions → respond within 24h
- Report engagement low → reach out
- Client wants to adjust targeting → make it happen

**Tier 3 — Stop immediately:**
- Client says stop → pm2 stop, no questions
- Spam complaint → pm2 stop, investigate
- Legal concern → pm2 stop, escalate to Ahmad

### Rollback Command

```bash
pm2 stop strateon-followup-engine
```

To resume:
```bash
pm2 start ecosystem-followup.config.js
```

---

## TRUST-FIRST COMMUNICATION RULES

### Always:
- Be honest about results (even when negative)
- Use calm, operational language
- Explain what we're doing before doing it
- Give clients time to respond
- Acknowledge when something goes wrong

### Never:
- Use urgency language (LIMITED TIME, TODAY ONLY, ACT NOW)
- Make promises about specific outcomes
- Dark-pattern mechanics (hidden conversions, surprise billing)
- Mass outreach without understanding the list
- Send outside business hours (9am–6pm client timezone)

---

*Qiyadon is operational infrastructure. We earn trust through reliable execution.*