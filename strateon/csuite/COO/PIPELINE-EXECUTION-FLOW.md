# PIPELINE EXECUTION FLOW
## Qiyadon — COO Operational Manual

**Owner:** COO (Chief Operating Officer)  
**Reports to:** CEO (Moosa)  
**Document Version:** 1.0  
**Last Updated:** 2026-05-01

---

## DOCUMENT PURPOSE

This is the complete operational manual for executing the Qiyadon Pipeline Execution Service. It covers every stage from contract signing through ongoing execution through offboarding. A new COO should be able to read this document and execute a new client engagement from Day 1 with no ambiguity.

This document supersedes any informal or verbal agreements about process. When in doubt, follow this document.

---

## REFERENCE DOCUMENTS

Before executing any client work, COO must read and understand:
- `strateon/csuite/COO/IDENTITY.md` — COO role definition
- `strateon/csuite/COO/GOALS.md` — COO objectives and success metrics
- `strateon/clients/_TEMPLATE/pipeline.md` — Pipeline tracking file structure
- `strateon/clients/_TEMPLATE/ONBOARDING-CHECKLIST.md` — Onboarding checklist (template)
- `strateon/clients/_TEMPLATE/leads/_LEAD-NAME.md` — Lead file structure
- `strateon/clients/_TEMPLATE/reports/WEEKLY-REPORT-TEMPLATE.md` — Weekly report format

---

## THE 12-TOUCH FOLLOW-UP SEQUENCE

Every lead in the pipeline receives a minimum of 12 personalized touches over time. The sequence is designed to progressively warm up cold leads, re-engage dormant ones, and maintain contact with warm leads until they convert or are archived.

### Channel Rotation

The follow-up sequence uses a rotating multi-channel approach:
- **Touch 1–3:** Email (initial outreach + 2 follow-ups)
- **Touch 4–6:** WhatsApp / SMS (personal, direct)
- **Touch 7–9:** Email (value-add content or case study)
- **Touch 10–11:** LinkedIn (connection request + message)
- **Touch 12:** Email (final "breakup" message with offer to reconnect)

> **Cadence rule:** Minimum 2 business days between touches. Hot leads get touches 3–6 faster (every 1–2 days). Cold leads follow the full cadence.

### Touch Definitions

| Touch | Channel | Purpose | Timing |
|---|---|---|---|
| Touch 1 | Email | Introduction — who we are, why we're reaching out, value proposition | Day 1 |
| Touch 2 | Email | Follow-up — reference previous email, add new piece of information | Day 3 |
| Touch 3 | Email | Third email —勾起 curiosity, ask a question | Day 5 |
| Touch 4 | WhatsApp/SMS | Personal message — short, human, not a pitch | Day 7 |
| Touch 5 | WhatsApp/SMS | Value share — send relevant article, insight, or resource | Day 9 |
| Touch 6 | WhatsApp/SMS | Question — ask something relevant to their business | Day 11 |
| Touch 7 | Email | Case study — send relevant success story or testimonial | Day 14 |
| Touch 8 | Email | Industry insight — share relevant market trend or data | Day 18 |
| Touch 9 | Email | Resource — whitepaper, checklist, or useful tool | Day 22 |
| Touch 10 | LinkedIn | Connection request — personalized, referencing previous touches | Day 26 |
| Touch 11 | LinkedIn | Direct message — brief, adds value, asks for call | Day 28 |
| Touch 12 | Email | Breakup email — "I haven't heard from you, I want to make sure I'm not bothering you. Here's my direct line if you ever want to talk." | Day 32 |

### Escalation After Touch 12

If no response after Touch 12:
1. Move lead to DORMANT status
2. Do not delete — archive for potential future re-engagement (6 months)
3. Note in lead file: "Completed 12-touch sequence — no response. Archived [DATE]"
4. Client is informed in weekly report

---

## STAGE 1 — ONBOARDING (Days 1–14)

### Pre-Onboarding: Contract Signed

Before Day 1 begins, the following must be confirmed:
- [ ] Signed service agreement (via CLA — Client Service Agreement)
- [ ] Client has paid first month or confirmed billing setup
- [ ] Lead list received (spreadsheet, WhatsApp screenshots, email export, or CRM export)
- [ ] CRM access confirmed (or manual handoff process agreed)
- [ ] Preferred communication channel for client (WhatsApp primary)
- [ ] Preferred escalation channel (CEO direct line if COO needs backup)
- [ ] Client's operating hours and time zone confirmed
- [ ] Client's target market / ICP confirmed (via intake form)
- [ ] Follow-up cadence agreed (email frequency, channel preferences)

> **Minimum data required to start:** Client name, contact POC, lead list (哪怕是手写的名字列表), preferred channel for outreach.

If any of the above is missing, DO NOT begin onboarding. Notify CEO immediately.

---

### DAY 1 — Contract Signed + Lead List Received

**Morning (within 2 hours of signed contract):**

1. **Create client directory** at `strateon/clients/{CLIENT-SLUG}/`
   - CLIENT-SLUG = lowercase, no spaces, hyphens instead (e.g., `acme-corp`)
   
2. **Create client files:**
   - `pipeline.md` — from `_TEMPLATE/pipeline.md`, all placeholders filled
   - `leads/` directory
   - `reports/` directory
   
3. **Ingest all leads** from received list into individual lead files:
   - One file per lead from `_TEMPLATE/leads/_LEAD-NAME.md`
   - Assign initial score (1–10) based on available data
   - Assign initial status: NEW
   - Note source of lead (referral, inbound, outbound, etc.)
   
4. **Send client onboarding confirmation** via WhatsApp:
   ```
   Hi [NAME], this is [COO Name] from Qiyadon. Your pipeline is set up and ready. I've imported [X] leads and I'm configuring your follow-up sequences now. You'll receive your first report by [DATE]. Any questions — just message me here.
   ```
   
5. **Log in daily tracking:** `strateon/csuite/COO/DAILY/YYYY-MM-DD.md`
   - New client onboarded: [CLIENT NAME]
   - Total leads imported: [X]
   - Next action: configure follow-up sequences

**Afternoon:**

6. **Review lead list** — identify hot leads (score 8–10) and prioritize
7. **Confirm follow-up channel preference with client** if not already done
8. **Begin drafting follow-up messages** for top 10 leads (personalized, not template-spam)

---

### DAYS 2–3 — CRM Setup + Sequence Configuration

**Day 2 tasks:**

1. **Configure CRM fields** (if client uses a CRM — HubSpot, Pipedrive, etc.):
   - Lead status: NEW → CONTACTED → QUALIFIED → PROPOSAL → NEGOTIATION → WON / LOST / DORMANT
   - Lead score: 1–10
   - Last contact date
   - Next follow-up date
   - Assigned action
   - Client notes field

2. **Map pipeline stages** to Qiyadon status framework:
   - Map client's existing pipeline stages to our standard stages
   - If client has no CRM: use file-based pipeline tracking in `pipeline.md`
   
3. **Configure follow-up sequences:**
   - For each lead, set Touch 1 date (Day 3 or Day 4)
   - Hot leads: accelerate cadence (Touch 1 on Day 2)
   - Cold leads: full 12-touch sequence, standard cadence
   
4. **Create per-lead follow-up schedule:**
   - Each lead file gets a schedule with specific dates
   - Touch 1 = Day 3 (not Day 1 — give yourself setup time)
   - Touches are pre-scheduled, not done ad hoc
   
5. **Set stalled deal triggers:**
   - 7 days no response → automatic follow-up escalation
   - 14 days no response → alert to COO + notify client
   - 21 days no response → escalate to CEO

**Day 3 tasks:**

6. **Begin first outreach** (if ready):
   - Send Touch 1 emails to first batch of leads (top 10 by score)
   - Log each outreach in lead file: date, channel, content summary, outcome
   
7. **Daily brief to client** (optional, for first week only):
   - Send via WhatsApp: "Day 3 update: [X] leads contacted, [Y] opens, [Z] replies. No responses yet — normal for Day 1–3."
   
8. **Update pipeline.md** with all lead statuses

---

### DAYS 4–7 — First Outreach Live + Monitoring

**Day 4–6 tasks:**

1. **Continue sending Touch 1** to remaining leads (batch by score, highest first)
2. **Monitor responses** — check email/WhatsApp at least 3x per day
3. **Log all responses** in lead file
4. **Begin Touch 2** for leads that haven't responded to Touch 1 (Day 3 + 2 business days)
5. **Flag any leads with immediate response** — escalate to HOT status, notify client immediately via WhatsApp
6. **Add any new leads** received from client during this period (must be added within 24 hours)

**Day 7 task:**

7. **Generate and send FIRST WEEKLY PIPELINE REPORT:**
   - Use `strateon/clients/_TEMPLATE/reports/WEEKLY-REPORT-TEMPLATE.md`
   - Send to client via WhatsApp (PDF or well-formatted text)
   - Report covers: leads imported, touches sent, responses received, hot leads flagged, dormant leads identified
   - **Deadline: Friday 4PM local client time** (if onboarding started mid-week, send report on the Friday of Week 1 regardless)

**Onboarding checklist completion:**
- [x] All leads from Day 1 have at least Touch 1 sent
- [x] New leads added within 24 hours of receipt
- [x] First weekly report delivered
- [x] Any blockers escalated to CEO

---

### DAYS 8–14 — Sequences Running + Optimization

**Day 8–14 activities:**

1. **Execute follow-up sequences** for all active leads
   - Touch 1–3 emails going out per cadence
   - Monitor open rates and reply rates
   
2. **Respond to all incoming replies** within 4 hours during business hours
   - If reply is from a hot lead: notify client immediately
   - If reply requires client action: forward immediately with recommendation
   
3. **Add new leads** received from client within 24 hours
   - Create lead file, assign score, add to active sequence
   
4. **Escalate stalled leads:**
   - Any lead with no response by Day 10 (7 days after Touch 1): run recovery sequence
   - Day 14: any lead still silent → flag to client in report
   
5. **Day 14 checkpoint:**
   - All leads should have had at least 2 touches
   - Hot leads should have been directly messaged via WhatsApp
   - Pipeline health score calculated (see Stage 3)
   
6. **Send Day-14 update to CEO** (internal):
   - Number of leads active
   - Response rate
   - Any leads at risk
   - Recommendation for Month 1 (Day 30) review

---

## STAGE 2 — ONGOING EXECUTION (Day 15+)

### Daily Operations

**Every business day (Monday–Friday, unless client operates on different schedule):**

| Time | Action |
|---|---|
| Morning (start of day) | Check all channels (email, WhatsApp) for new responses from leads |
| Morning | Review pipeline.md — identify leads due for follow-up today |
| Morning | Send scheduled follow-ups (email/WhatsApp/LinkedIn per sequence) |
| Mid-morning | Respond to any new replies from leads (within 4 hours) |
| Midday | Process any new leads from client (add within 24 hours) |
| Afternoon | Update pipeline.md and lead files with all actions taken today |
| End of day | Review tomorrow's scheduled follow-ups — flag any that need early action |

**Response management rules:**
- Lead replies: respond within 4 hours, personalized response (never template)
- Client forwards new lead: acknowledge within 2 hours, add to pipeline within 24 hours
- Client asks for status: respond same day, include specific numbers
- Client asks for something outside scope: do not commit, escalate to CEO

**Daily logging:**
- Create or update `strateon/csuite/COO/DAILY/YYYY-MM-DD.md`
- Log: leads contacted, responses received, new leads added, issues flagged

---

### Weekly Operations

**Every Friday — Weekly Pipeline Report:**
- **Deadline: Friday 4PM** (client's local time)
- Use `strateon/clients/_TEMPLATE/reports/WEEKLY-REPORT-TEMPLATE.md`
- Send via WhatsApp (preferred) or email
- Always include:
  - Pipeline at a glance (total leads, new, contacted, replies, dormant, won/lost)
  - Leads touched this week (list with action/outcome)
  - Hot leads requiring client action
  - Dormant leads with recommendation (re-engage or archive)
  - Recommended actions for next week
- **Never skip a Friday.** If COO is unavailable, CEO covers.

**Weekly cadence review:**
- Review which follow-up channel is performing best (email vs WhatsApp vs LinkedIn)
- Adjust sequence timing if needed (e.g., if WhatsApp gets 3x more responses, prioritize that)
- Identify leads that need acceleration (hot leads speed up, cold leads slow down)

---

### Monthly Operations (Day 30)

**Day 30 — Month-End Review:**
1. Generate comprehensive Month-End Report
2. Deliver to client via WhatsApp + email
3. Report includes:
   - Total leads processed
   - Total follow-ups sent
   - Response rate (% of leads who replied at least once)
   - Hot leads converted to qualified
   - Closings / WON
   - Dormant leads archived
   - Comparison to Month 1 goals
4. **Guarantee assessment:**
   - If service guarantee was offered (e.g., "50% response rate or money back"): evaluate
   - If guarantee threshold not met: flag to CEO for refund/credit discussion
5. **Discuss Month 2 plan** with client:
   - New leads to add
   - Leads to archive
   - Any adjustments to cadence or targeting

---

### Escalation Triggers

**When to escalate to CEO (Moosa):**

| Trigger | Threshold | Action |
|---|---|---|
| Client expresses dissatisfaction | Any sign of frustration or intent to cancel | Document issue, escalate to CEO immediately. Do not make promises. |
| Client asks for out-of-scope work | Any request beyond agreed service | Document request, escalate to CEO before responding |
| Lead not responding 21+ days | 21 days silent after Touch 1 | COO runs recovery sequence. After 21 days no response: escalate to CEO with recommendation |
| Client has not responded in 7+ days | 7 days no response from client on a question | Message client once more. If no response by Day 10: escalate to CEO |
| Pipeline health score drops below 50% | Health score (see Stage 3) <50% for 2 consecutive weeks | Escalate to CEO with recovery plan |
| New lead volume exceeds capacity | More than 50 new leads in a week | Flag to CEO immediately — may need capacity decision |
| Any data breach or privacy concern | Any unusual access or lead data issue | Escalate immediately — do not wait |

**Escalation format to CEO:**
When escalating, always include:
1. Client name
2. What happened (specific)
3. What action COO has already taken
4. What the client is asking for or what the risk is
5. COO's recommendation

---

## STAGE 3 — CLIENT OUTCOMES

### Definition of Success

Success is defined at the client level and measured against the goals agreed at onboarding. Default success metrics:

| Metric | Target | How It's Measured |
|---|---|---|
| Lead response rate | 30%+ of contacted leads reply at least once | Replies received ÷ touches sent |
| Hot lead identification | Client confirms 80%+ of hot leads are genuine | Client feedback on hot lead list |
| Follow-up completion | 100% of active leads receive scheduled follow-ups | Pipeline audit (no missed touches) |
| Weekly report delivery | Every Friday, on time | Report sent log |
| New lead processing | All new leads added within 24 hours | Lead intake timestamp review |
| Client satisfaction | Client stays and renews | Month 2+ renewal rate |

**"Success" in concrete terms:**
- Client gets a report every Friday showing leads touched, responses, and specific actions needed
- No lead goes dark without at least 12 attempts over 32+ days
- Client only acts when a lead is genuinely ready (qualified, proposal stage, or closing)
- Client's pipeline is always current — no stale data, no forgotten leads

---

### Pipeline Health Score

**Calculate every Friday before sending the weekly report.**

```
Pipeline Health Score = (Active Leads with Next Action Defined ÷ Total Active Leads) × 100
```

**Score thresholds:**

| Score | Status | Action |
|---|---|---|
| 90–100% | Excellent | Continue executing. Consider scaling touches. |
| 70–89% | Good | Address the gap — identify why X leads have no next action |
| 50–69% | At Risk | COO escalates to CEO. Review cadence. May need client input. |
| Below 50% | Critical | CEO intervention required. Pipeline is not being managed properly. |

**Health score must be included in every weekly report.**

---

### Cold Lead Escalation Protocol

**When a lead goes cold (no response for 14+ days):**

1. **Day 14 — Flag in weekly report:**
   - List dormant leads with last contact date and days silent
   - Recommend: re-engage or archive
   - Client decides (if client wants to try again, run Touch 4–6 on accelerated cadence)

2. **Day 21 — If still silent after 12-touch sequence:**
   - Mark lead DORMANT in pipeline
   - Note in lead file: "Completed full 12-touch sequence. No response. Archived [DATE]."
   - Continue to list in weekly reports as "archived" for transparency

3. **Client can request a revival:**
   - If client asks to re-engage a dormant lead, COO starts a new mini-sequence (Touches 1–6, faster cadence)
   - Log as new engagement with reference to previous attempts

---

## STAGE 4 — END OF ENGAGEMENT

### Minimum Commitment

- **Minimum term:** 1 month (30 days) from start date
- **Notice period:** 14 days written notice (WhatsApp or email) required to cancel
- **Early cancellation:** If client cancels before Day 30, no refund of current month (service was delivered)
- **Month-to-month after initial term:** Client can cancel with 14-day notice at end of any month

### What Happens If Client Wants to Leave

1. **COO receives cancellation request:**
   - Document the reason (if client shares it)
   - Do not argue, do not offer discounts, do not make promises
   - Acknowledge receipt: "Understood. I'll make sure the team knows. You'll receive your offboarding data within 48 hours."

2. **Escalate to CEO immediately:**
   - Inform CEO (Moosa) via direct message
   - Share reason if provided
   - CEO may choose to attempt recovery conversation

3. **Honor the 14-day notice period:**
   - Continue executing follow-ups for 14 days after notice
   - Deliver at least 2 more weekly reports during notice period
   - No new leads added during notice period (unless client specifically requests)

4. **Final report delivered on Day 14:**
   - Comprehensive offboarding report with all lead statuses
   - Recommendation for which leads to continue following up (if any)

---

### Offboarding Process

**On the last active day (Day 30 + 14-day notice complete):**

1. **Generate Final Offboarding Report:**
   - All active leads with current status
   - All dormant leads with last contact date
   - All won/lost leads with final status
   - Total touches sent for the engagement
   - Response rate achieved

2. **Export client data:**
   - All lead files (CSV or formatted list)
   - Pipeline.md (final version)
   - All weekly reports delivered
   - Offboarding report

3. **Deliver data to client:**
   - Send via email or WhatsApp (whatever client prefers)
   - Confirm receipt
   - Offer to answer questions for 48 hours post-offboarding

4. **Archive client directory:**
   - Move `strateon/clients/{CLIENT-SLUG}/` to `strateon/clients/_ARCHIVED/{CLIENT-SLUG}-{DATE}/`
   - Do not delete — keep for 6 months minimum (legal/compliance)

5. **Internal handoff complete:**
   - Notify CEO that offboarding is complete
   - Log final stats in COO daily notes
   - Remove any scheduled cron jobs for this client

---

## QUICK REFERENCE: COO DAILY CHECKLIST

**Every business day, verify:**

- [ ] Checked all channels for new lead responses
- [ ] All leads due for follow-up today have been contacted
- [ ] All new leads from client added to pipeline (within 24 hours)
- [ ] All lead files and pipeline.md updated with today's actions
- [ ] No lead has gone more than 14 days without a touch (unless DORMANT)
- [ ] Client message responded to within 4 hours

**Every Friday, verify:**

- [ ] Weekly pipeline report generated
- [ ] Report sent to client by 4PM
- [ ] Pipeline health score calculated
- [ ] All new leads added this week have at least Touch 1
- [ ] Next week's follow-ups are pre-scheduled
- [ ] CEO notified of any at-risk clients

---

## HANDOFF IF COO IS UNAVAILABLE

**If COO is unavailable for more than 24 hours:**

1. **CEO (Moosa) takes over daily pipeline operations** for active clients
2. **No new client onboarding** until COO is back (unless CEO approves exception)
3. **Weekly reports** must still go out — CEO sends if COO cannot
4. **New leads from existing clients** — CEO adds to pipeline, COO executes when available
5. **Urgent escalations** — client can reach CEO directly on WhatsApp

---

_Last updated: 2026-05-01 — COO, Qiyadon_