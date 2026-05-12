# Qiyadon Controlled Pilot Operations Manual
**Generated:** 2026-05-12
**Phase:** CONTROLLED PILOT READINESS — OPERATOR MODE
**Status:** Active — No further architectural expansion

---

## PILOT OPERATING PHILOSOPHY

**We are not building anymore. We are operating.**

The machine works. Now we validate it in the real world with real humans.

Pilot is not a test — it is controlled commercial learning.

Goal: Trust durability, not maximum volume.
Metric: Operational usefulness, not outbound velocity.
Constraint: Calm execution, not aggressive scaling.

---

## FOCUS AREA 1 — PILOT ACCOUNT SELECTION

### Ideal Pilot Account Profile

| Attribute | Target | Why |
|---|---|---|
| Company stage | Series A–B | Founder-led, fast decisions, real pipeline pain |
| Team size | 10–50 employees | Enough data, not enough headcount |
| Pipeline problem | Clear outbound pain | Not theoretical — they feel the problem |
| Decision maker | Founder or VP Sales | Not a committee — one person decides |
| Geographic focus | EU / US time zones | Aligned with Qiyadon operational hours |
| Industry | B2B SaaS | ICP confirmed — already validated |
| Data readiness | Has a CRM (HubSpot preferred) | Faster activation, fewer setup gaps |
| Email setup | Domain verified, warm | Reduces deliverability risk |
| Trust sensitivity | High (enterprise tone preferred) | Aligns with Qiyadon positioning |

### Low-Risk Initial Users

**Priority 1 — Founder-led with pipeline pain:**
- Founders doing their own outbound
- Frustrated with silence, not getting replies
- Has a product that works and needs pipeline
- Willing to give feedback directly

**Priority 2 — Small sales teams (2–5 people):**
- VP Sales running outbound manually
- Needs help scaling, not replacing
- Understands cadence value
- Will engage with weekly reports

**Priority 3 — Agency/co-founder context:**
- Consultants managing multiple pipelines
- Need infrastructure, not just tools
- Willing to document feedback well

### Account Mix Target

- 2 founder-led companies (direct decision, fast feedback)
- 1–2 small sales teams (real operational context)
- 0 enterprise (de-risk first)

### Operational Complexity Balance

**Do NOT select:**
- Companies with complex multi-stakeholder buying processes
- Enterprises with compliance requirements beyond EU data residency
- Companies with no CRM data or empty HubSpot instances
- Accounts that need LinkedIn but have zero connections
- Anyone asking for custom integrations in week 1

### How to Source Pilot Accounts

1. **Ahmad's network** — warm introductions, fastest trust building
2. **LinkedIn outreach** — Ahmad's personal network, founder-level targets
3. **SaaStr / RevGenius community** — ICP-aligned, active in pipeline conversations
4. **Existing pipeline leak audit leads** — companies who filled the form and expressed interest

---

## FOCUS AREA 2 — PILOT SUCCESS METRICS

### Tier 1 — Trust Signals (Primary)

| Metric | What It Measures | How to Track |
|---|---|---|
| Reply rate | Did prospects respond? | HubSpot: strtn_response_received |
| Meeting booked rate | Did outreach lead to calendar? | HubSpot: meeting_booked property |
| Feedback quality | Does client engage with reports? | Weekly report open + reply rate |
| Hesitation signals | Any signs of trust erosion? | Unsubscribe rate, complaint emails, silence |
| Escalation frequency | How often does system surface issues? | client_lifecycle_events.escalation_triggers |

### Tier 2 — Operational Resonance (Secondary)

| Metric | What It Measures | How to Track |
|---|---|---|
| Cadence continuation rate | Did leads stay in cadence? | pipeline_leads: cadence_day progression |
| Artifact engagement | Did client read weekly reports? | Email open tracking + reply |
| Confusion indicators | Any UX friction? | Support requests, clarification questions |
| Engagement depth | Did client give data access quickly? | Onboarding speed: days to first data |
| Trust duration | Did trust persist through evaluation? | No churn during 14-day evaluation |

### Tier 3 — Commercial Validation (Tertiary)

| Metric | What It Measures | How to Track |
|---|---|---|
| Unsubscribe rate | Did people leave the list? | pipeline_leads.unsubscribed (if tracked) |
| Scale conversion intent | Did client want to continue? | sign-scale page visits, not form submits yet |
| Reference willingness | Would client refer us? | Direct ask at Day 14 |
| Operational value perception | Did client see value? | Day 14 conversation + qualitative feedback |

### Metrics We DO NOT Optimize For

- Maximum outbound volume
- Maximum emails sent per day
- Fastest trial-to-Scale conversion
- Highest open rates (hygiene metric, not trust metric)

---

## FOCUS AREA 3 — BEHAVIORAL OBSERVATION FRAMEWORK

### What Human Reactions We Monitor

**Positive trust signals:**
- Client replies to weekly report without prompting
- Client shares feedback proactively (not just when asked)
- Client updates CRM data without reminders
- Client responds to Slack/email within 24h consistently
- Client asks for more cadence (not less)
- Client references specific leads or outcomes by name

**Hesitation indicators:**
- Client goes silent for 5+ days mid-evaluation
- Client asks clarifying questions about what happens after trial
- Client delays providing data access (list, CRM)
- Client reschedules onboarding call multiple times
- Client expresses concern about commitment before seeing results

**Suspicion indicators:**
- Client asks "why do you need my HubSpot password?"
- Client questions pricing without engaging with value
- Client uses words like "catch" or "hidden" or "automatic"
- Client references a bad experience with another tool
- Client requests to see agreement in detail before onboarding
- Client declines weekly report emails

**How to detect:**
- tracker: first_reply_at (late replies = hesitation)
- tracker: confusion_indicators (support tickets, questions)
- tracker: suspicion_indicators (specific language patterns)
- tracker: async_engagement_score ( declining = warning)

### How Trust Is Measured

**Week 1–7:** Engagement velocity — how fast does client respond?
**Week 2:** Report open rate + reply quality
**Week 3–14:** Consistency of engagement, quality of feedback

**Trust is earned through:**
- Reliable cadence execution
- Accurate weekly reports
- Honest qualification assessment (not overselling)
- Transparent communication when things go wrong

### How Hesitation Is Detected

- Response time lengthening
- Meeting cancellations without rescheduling
- Questions about cancellation mid-trial
- Reluctance to share list data
- Asking about alternative tools

### How Suspicion Is Detected

- Direct questions about billing (catches, automatic)
- Requesting full contract review before trial start
- Questions about who has access to their CRM
- Asking why we need 72 hours before real evaluation

### How Operational Value Is Inferred

- Client references specific lead names in conversation
- Client shares meeting outcomes unprompted
- Client asks to increase cadence (growth signal)
- Client mentions Qiyadon in context of pipeline wins
- Client responds to Day 13 reminder with substantive reply

---

## FOCUS AREA 4 — PILOT GOVERNANCE OPERATIONS

### Outbound Limits (Hard Caps)

| Parameter | Limit | Why |
|---|---|---|
| Max emails per lead per day | 1 | Prevent spam perception |
| Max touches per lead | 6 | Cadence limit enforced |
| Stalled threshold | 14 days no response | Then escalate, stop cadence |
| Max leads per pilot account | 50 | Prevent overload during evaluation |
| LinkedIn requests per day | 20 | Platform limits + reputation |
| WhatsApp per day | 3 per lead | Deliverability + trust |

### Escalation Handling

**Escalation trigger:** Lead has no response for 14+ days, strtn_escalated not yet yes

**Escalation process:**
1. Engine sets strtn_escalated = yes
2. client_lifecycle_events logged with ESCALATION_TRIGGERED
3. Human (Qiyadon team or client) reviews manually
4. Decision: resume cadence OR close lead OR pivot message

**Human-in-loop requirement:** No automated response to escalated leads

### Daily Monitoring Procedures

**Every morning (automated via PM2 + cron):**
1. Check PM2 process health (pm2 list)
2. Review error_reports table for new entries
3. Review client_lifecycle_events for state transitions
4. Check reminder_logs for failed sends

**Weekly (human review):**
1. Review pipeline_leads health: cadence_day, last_touch, response_received
2. Review reminder delivery success rate
3. Assess escalation frequency (if >3 per client per week = concern)
4. Review sign-trial submissions — new activations

### Rollback Conditions

**Emergency stop (one command):**
```bash
pm2 stop strateon-followup-engine
```

**Trigger conditions:**
- Client reports spam complaints (even 1)
- HubSpot reports unusual bounce rate
- Client asks to stop immediately
- Deliverability drops below 90%
- Any legal or compliance concern raised

**Post-rollback:**
1. All cadence stops immediately
2. No further emails sent
3. Human reviews and corrects before restart

### Reputation Protection Procedures

**Do:**
- Honor unsubscribe immediately (no second send)
- Keep lead lists clean (remove bounces, complaints)
- Use warm, professional tone always
- Stay within outbound limits
- Monitor spam trap hits

**Never do:**
- Send to unverified emails
- Bcc without permission
- Use misleading subject lines
- Retarget unsubscribed leads
- Send outside business hours (9am–6pm client timezone)

### Intervention Thresholds

| Situation | Threshold | Action |
|---|---|---|
| Bounce rate > 5% | Immediate | Pause all sends, investigate |
| Reply rate < 1% for 7 days | Concern | Review targeting, message |
| Escalation > 3 per client | Concern | Review lead quality, expectation |
| Client silence > 7 days | Warning | Send human touchpoint email |
| Client complaint | Immediate | Pause, human address, resolve |
| Unsubscribe rate > 2% | Concern | Review message frequency |

---

## FOCUS AREA 5 — EXECUTIVE VISIBILITY LAYER

### Daily Operational Pilot Summary (Automated)

**Delivered:** Every morning at 07:00 Berlin via WhatsApp to Ahmad

**Format:**
```
📊 PILOT STATUS — [DATE]

ACTIVE CLIENTS: [N]
├── New this week: [N]
├── In activation: [N]
├── In evaluation: [N]
└── Scale pending: [N]

CADENCE HEALTH:
├── Active leads: [N]
├── Touches sent: [N]
├── Replies received: [N]
├── Meetings booked: [N]
└── Escalations: [N]

TRUST SIGNALS:
├── Report engagement: [N/N]
├── Client response rate: [X%]
└── Hesitation flags: [N]

OPERATIONAL QUALITY:
├── Deliverability: [X%]
├── Outbound throttle compliance: ✅
└── Error count: [N]

⚠️ ATTENTION NEEDED: [if any]
✅ ALL CLEAR: [if clean]
```

### Trust/Risk Indicators

**Green (all clear):**
- Reply rate > 3%
- No escalations this week
- Report engagement > 70%
- Zero complaints
- Deliverability > 95%

**Yellow (monitor):**
- Reply rate 1–3%
- 1–2 escalations this week
- Report engagement 40–70%
- 1 complaint (resolved)

**Red (action required):**
- Reply rate < 1% for 5+ days
- 3+ escalations this week
- Report engagement < 40%
- Unresolved complaint
- Deliverability < 90%

### Pilot Health Dashboard (Weekly)

Generated every Monday morning, sent to Ahmad via WhatsApp:

```
WEEKLY PILOT HEALTH — [Week of DATE]

[CLIENT 1] — [Company stage]
Status: [EVALUATION_ACTIVE]
Cadence: [N] leads, [X] touches, [Y] replies
Trust: [GREEN] — Client engaged, no flags
Action: [none / specific]

[CLIENT 2] — [Company stage]
Status: [ACTIVATION_PENDING]
Trust: [YELLOW] — No data provided after 48h, follow-up sent
Action: Human touchpoint at Day 3

BEHAVIORAL OBSERVATIONS:
- [Observation 1]
- [Observation 2]

PILOT-WIDE METRICS:
Total touches: [N] | Total replies: [N] | Reply rate: [X%]
Meetings booked: [N] | Escalations: [N]
Report engagement: [X/Y clients opened]

RISK FLAGS: [none / specific]
RECOMMENDATIONS: [none / specific]
```

### Cadence Performance Snapshots

Weekly report per client (delivered via email, logged in reports table):

```
WEEK [N] CADENCE REPORT — [CLIENT NAME]

PERFORMANCE:
Leads in cadence: [N]
Touches this week: [N]
Replies: [N] ([X%] rate)
Meetings: [N]

TOP PERFORMING:
[Lead name] — [reason]

NEEDS ATTENTION:
[Lead name] — [reason]

SYSTEM STATUS:
Escalations: [N]
Throttle compliance: ✅
Deliverability: [X%]

— Qiyadon Operations
```

---

## FOCUS AREA 6 — COMMERCIAL LEARNING PREPARATION

### Lightweight Learning Capture

**What we log (minimal):**
- Which message body resonates (reply rate by body_key)
- Which day in cadence gets most responses
- Which channel (email/whatsapp/linkedin) performs best
- Lead temperature patterns per client
- Qualification threshold patterns

**Where it goes:** `commercial_learning` table in Supabase (lightweight, no new architecture)

**How it's used:**
- Improve message bodies per client context
- Adjust cadence timing per engagement pattern
- Inform Scale plan optimization based on what works

### Resonance Logging

```javascript
// In followup-engine — lightweight, no new framework
await supabase.from('commercial_learning').insert({
  client_id: clientId,
  lead_id: leadId,
  event_type: 'resonance_observed',
  body_key: lead.bodyKey,
  channel: 'email', // or whatsapp, linkedin
  outcome: 'reply',
  cadence_day: lead.cadenceDay,
  logged_at: new Date().toISOString()
});
```

### Engagement Memory

**What we remember per client:**
- Preferred message tone (formal/casual)
- Best sending time (morning/afternoon)
- Channel preference (email vs whatsapp vs linkedin)
- Response patterns (fast/slow to reply)
- Report format preference (detailed/summary)

**Where it lives:** `clients` table — `engagement_preferences` JSONB column (already in schema via cadence_config, extend if needed)

**No new framework** — just write to existing columns. Keep it simple.

---

## FOCUS AREA 7 — PILOT OPERATING PROCEDURE

### Step-by-Step Operational Pilot Playbook

**PHASE 0 — Before Pilot (Ahmad's Network)**

1. Identify 3–5 warm contacts who fit pilot account profile
2. Send introduction email: "Would you be open to a 20-min call about pipeline execution?"
3. Qualify on call: Do they have pipeline pain? Are they founder-led? Do they have HubSpot?
4. If qualified: Schedule onboarding

**PHASE 1 — Activation (Hours 0–72)**

Step 1.1: Client signs sign-trial.html
- Submits with: name, email, company, dual checkbox
- server.js writes `lifecycle_state = ACTIVATION_PENDING` to Supabase
- Confirmation email sent

Step 1.2: Within 24 hours — Qiyadon team connects HubSpot
- HubSpot OAuth flow completed (oauth.qiyadon.com/hubspot/callback)
- CRM credentials stored in hubspot_connections table
- Lead list imported: max 25 leads during evaluation

Step 1.3: At 48 hours — Activation complete email sent
- Use buildActivationCompleteEmail() from reminder-templates.js
- Log to reminder_logs (ACTIVATION_COMPLETE type)
- lifecycle_state transitions: ACTIVATION_PENDING → ACTIVATION_ACTIVE

Step 1.4: At 72 hours — Cadence begins
- First touch sent to lead #1
- Followup-engine processes leads on hourly cron
- PM2 process running, monitoring for errors

**PHASE 2 — Operational Evaluation (Days 1–14)**

Step 2.1: Daily — Engine runs cadence
- Hourly: check leads, send according to cadence_day schedule
- Log all touches to pipeline_activity
- Log all responses to pipeline_leads (response_received = true)
- Escalate stalled leads (14+ days no response)

Step 2.2: Day 7 — Midpoint review email sent
- buildDay7ReviewEmail() — operational tone, no urgency
- Log to reminder_logs (DAY_7_REVIEW)
- Include metrics: leads, open rate, reply rate, meetings
- lifecycle_state: ACTIVATION_ACTIVE → EVALUATION_ACTIVE

Step 2.3: Day 7–13 — Continue cadence, monitor trust signals
- Watch for: hesitation, confusion, suspicion indicators
- If trust signals erode: human touchpoint email (not automated)
- If escalation: pause cadence, human reviews

Step 2.4: Day 13 — Evaluation closing reminder sent
- buildDay13ReminderEmail() — calm, operational, no countdown
- Log to reminder_logs (DAY_13_REMINDER)

**PHASE 3 — Day 14 Assessment**

Step 3.1: Assessment
- Qiyadon team reviews 5 criteria:
  1. Lead quality score
  2. Engagement rate
  3. Client feedback/data access quality
  4. Meetings scheduled
  5. List/data sufficiency
- If ≥3 criteria met: buildDay14OfferEmail() → SCALE_PENDING
- If <3 criteria: closing email → CLOSED_NO_SCALE
- Log to client_lifecycle_events (QUALIFICATION_ASSESSED)

Step 3.2: Scale offer (if qualified)
- Email sent with sign-scale link
- 72-hour window starts
- If client accepts: sign-scale.html → lifecycle_state = SCALE_ACTIVE
- If no response: follow-up at 72h mark → SCALE_OFFER_EXPIRED → CLOSED_NO_SCALE

Step 3.3: Scale onboarding (post-signing)
- New Scale Service Agreement signed
- HubSpot OAuth continues
- Lead limit increases to 500/month
- LinkedIn activation begins
- Monthly invoicing begins

### Day-by-Day Pilot Execution Sequence

| Day | Action | Who |
|---|---|---|
| 0 | Client signs sign-trial | Client |
| 0 | Confirmation email sent | System |
| 1 | HubSpot connection initiated | Qiyadon team |
| 1–2 | Lead list imported (≤25) | Qiyadon team |
| 2 | Activation complete email | System |
| 2 | Cadence begins | System |
| 7 | Day 7 midpoint email | System |
| 7 | Human review of progress | Qiyadon team |
| 10 | Early notice (if qualified) | System |
| 13 | Day 13 closing reminder | System |
| 14 | Assessment + offer email | System + Qiyadon team |
| 17 | Offer expires (if 72h window closed) | System |

### Monitoring Cadence

**Automated checks (every hour via PM2):**
- PM2 process alive
- New leads imported
- Cadence on schedule
- No error_reports entries

**Daily human check (morning):**
- Review PM2 logs: `pm2 logs strateon-followup-engine --lines 50`
- Review error_reports: `SELECT * FROM error_reports ORDER BY created_at DESC LIMIT 10`
- Check client states: `SELECT id, name, lifecycle_state FROM clients`

**Weekly review:**
- Pilot health dashboard (see Focus Area 5)
- Behavioral observations logged
- Commercial learning captured

### Intervention Protocol

**Level 1 — System handles automatically:**
- Stalled lead escalation → system flags, human reviews
- Bounce handling → removed from cadence, logged
- Unsubscribe → removed immediately, no retry

**Level 2 — Human touchpoint:**
- Client silent for 7+ days → personal check-in email from Qiyadon team
- Reply rate dropping → adjust message body, not volume
- Client asks questions → human responds within 24h

**Level 3 — Emergency stop:**
- Client complaint → pm2 stop immediately
- Spam report → pm2 stop immediately, investigate
- Deliverability crisis → pm2 stop, resolve before restart

### Escalation Procedure

1. **Trigger:** strtn_escalated = yes on a lead
2. **Log:** client_lifecycle_events with ESCALATION_TRIGGERED
3. **Notify:** Qiyadon team via error_reports (already in place)
4. **Review:** Human reviews lead, decides: resume / pivot / close
5. **Execute:** Decision implemented, outcome logged
6. **Document:** Resolution noted in client_lifecycle_events

### Shutdown Conditions

**Graceful shutdown (end of evaluation, client declines):**
1. Day 14 email confirms no Scale interest
2. lifecycle_state → CLOSED_NO_SCALE
3. No further cadence touches sent
4. Final report delivered
5. No contact for 60 days (per agreement)

**Emergency shutdown (client requests stop):**
1. `pm2 stop strateon-followup-engine`
2. lifecycle_state → CLOSED_NO_SCALE
3. All pending touches cancelled
4. Confirm stoppage to client

**Reputation incident:**
1. `pm2 stop strateon-followup-engine`
2. Investigate, resolve, document
3. Restart only after Ahmad approves

---

## CLOSURE CONDITIONS

### Pilot is successful when:
- [ ] 3–5 clients complete 14-day evaluation
- [ ] Zero spam complaints
- [ ] Reply rate > 2% sustained
- [ ] Zero trust erosion incidents
- [ ] At least 1 Scale conversion (paid client)
- [ ] Behavioral observations documented
- [ ] Commercial learning captured

### Pilot is paused if:
- [ ] Any spam complaint received
- [ ] Reply rate drops below 1% for 10+ days
- [ ] 3+ escalations in one week
- [ ] Any legal or compliance concern
- [ ] Ahmad requests pause

---

*Qiyadon is operational infrastructure. Operate it accordingly.*
*No further architectural expansion. Pilot execution mode active.*