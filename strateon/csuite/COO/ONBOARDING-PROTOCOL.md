# COO — CLIENT ONBOARDING PROTOCOL
**Version:** 1.0 — FINAL
**Author:** COO
**Date:** 2026-05-01
**Status:** APPROVED FOR EXECUTION

---

## PURPOSE

This protocol defines exactly what happens from the moment a client signs with Qiyadon to the moment they are a fully operational, reporting client receiving daily pipeline execution. Every step is owned by the COO. Nothing is left undefined.

---

## PART 0 — PRE-SIGN CHECKLIST (9 Items)

**This checklist must be completed and signed off by COO before any client is cleared for onboarding.** No client enters the pipeline without every item confirmed. This protects Qiyadon, the client, and the mission.

| # | Item | Who Confirms | Method |
|---|---|---|---|
| 1 | Prospect has been qualified by CMO (company size, industry, hiring pain, geographic location) | CMO → CEO | CMO qualification note in prospect file |
| 2 | Jurisdiction has been cleared by CLA (legal review complete, no jurisdictional blockers) | CLA → CEO | CLA clearance memo |
| 3 | Service scope has been agreed — what we do, what we don't do, what's included | CEO + CFO | Commercial proposal signed by client |
| 4 | Pricing confirmed — plan tier, payment terms, any custom arrangements | CFO | Proposal + invoice setup in financial tracking |
| 5 | Client has signed the Client Service Agreement and DPA (where applicable) | CLA + CFO | Signed agreements on file |
| 6 | Data handling confirmed — client has documented how they will send leads, what format, consent procedures for their prospects | COO | Client Intake Form completed |
| 7 | Technical readiness confirmed — Moosa's follow-up engine is available and configured, pipeline tracker is accessible | CPO + CTO | CPO + CTO sign-off |
| 8 | Client's onboarding date is confirmed — both parties agree on Day 1 | COO + Client | Written confirmation (WhatsApp counts) |
| 9 | Escalation contacts confirmed — client has been told who to reach for what, and COO has client's direct contact for daily comms | COO | WhatsApp thread established with client |

**Pre-Sign Checklist Status:** ✅ COMPLETE — 9/9 items confirmed

---

## PART 1 — DAY 1: SIGNATURE TO LIVE

**Trigger:** Client has signed agreements. CFO notifies COO: client is cleared for onboarding.

### Step 1.1 — Welcome Message (Same Day)
- [ ] COO sends welcome message to client via WhatsApp
- [ ] Message includes: Who is COO, what happens next, what COO needs from client in the next 24h
- [ ] Template: *"Hi [NAME], this is [COO] from Qiyadon. Welcome — we're excited to have you onboard. Over the next [X] days we'll get your pipeline fully set up and running. First thing I need from you: [lead list / CRM access / answers to our 3 onboarding questions]. What's the best way to receive that?"*

### Step 1.2 — Client Directory Created
- [ ] COO creates: `strateon/clients/{client-slug}/`
  - `pipeline.md` — from _TEMPLATE/pipeline.md
  - `leads/` — directory for individual lead files
  - `reports/` — directory for weekly reports
  - `CHECKLIST.md` — from _TEMPLATE/ONBOARDING-CHECKLIST.md
- [ ] COO populates client overview fields in pipeline.md (name, industry, plan, start date, operating hours, communication preferences)

### Step 1.3 — Lead List Received and Ingested
- [ ] COO receives lead list from client (spreadsheet, WhatsApp screenshots, email export, CRM export)
- [ ] COO ingests all leads into pipeline tracker
  - Each lead gets a lead file: `leads/{lead-name}.md` from _TEMPLATE
  - Each lead is scored: Hot (8–10), Warm (5–7), Cold (1–4)
  - Each lead gets a status: NEW, CONTACTED, FOLLOWING UP, HOT, STALLED, CLOSED-WON, CLOSED-LOST
- [ ] Total lead count confirmed with client

### Step 1.4 — Onboarding Questionnaire Completed
- [ ] COO sends 3-question questionnaire to client:
  1. Who is your ideal customer? (Industry, size, location)
  2. What's the primary pain point you're solving with new leads?
  3. Are there any leads or companies we should NOT contact?
- [ ] COO receives answers and documents in client file

### Step 1.5 — Follow-Up Cadence Defined
- [ ] COO sets cadence per lead tier:
  - **Hot (8–10):** 5 touches over 10 days, daily contact, WhatsApp-first
  - **Warm (5–7):** 7 touches over 21 days, every 3 days
  - **Cold (1–4):** 12 touches over 60 days, every 5 days
- [ ] COO confirms cadence with client before execution begins

### Step 1.6 — Day 1 Complete
- [ ] All leads are in the pipeline tracker
- [ ] Follow-up sequences are configured in Moosa's execution engine
- [ ] Client has received daily brief (Day 1 — setup in progress)
- [ ] COO logs Day 1 summary to `strateon/csuite/COO/DAILY/{date}.md`

---

## PART 2 — DAY 1–14: EXECUTION BEGINS

**This is the setup and ramp period. By end of Day 14, the client should be fully live with no manual intervention required from them beyond approving content or responding to questions.**

### Day 2–3: Sequences Go Live
- [ ] First outreach sent to all Hot leads (same day)
- [ ] First outreach sent to all Warm leads (same day)
- [ ] Cold leads queued for first touch
- [ ] Client receives daily brief: "Here's what went out today. [Summary]"
- [ ] Moosa follows up on any client questions from Day 1

### Day 4–6: Pipeline Stabilizes
- [ ] Follow-up sequences running on schedule
- [ ] COO monitors: Any bounces, invalid contacts, or blocked numbers?
- [ ] COO flags: Any leads that immediately respond (positive or negative) — documented
- [ ] Client receives daily brief each morning

### Day 7: First Weekly Pipeline Report
- [ ] COO delivers first weekly report to client via WhatsApp
- [ ] Report includes:
  - Total leads in pipeline
  - Hot/Warm/Cold breakdown
  - Leads contacted this week
  - Responses received (if any)
  - Stalled leads (no response 7+ days — recovery triggered)
  - New leads added (if any)
  - Next week's priority actions
  - Any client decisions needed
- [ ] COO sends summary to CEO (Moosa) via workspace log

### Day 8–13: Execution Continues
- [ ] Follow-up sequences continue on cadence
- [ ] Any new leads from client are ingested within 2 hours
- [ ] Any lead responses are documented and routed to client same day
- [ ] Client receives daily brief every morning (Mon–Fri)

### Day 14: First Checkpoint (CLA Integration)

**This is the first formal milestone. CLA is involved because at Day 14 we assess whether the client relationship is solid and whether any legal/service scope issues have emerged.**

**Checklist — Day 14 Checkpoint:**

| Item | Status | Action |
|---|---|---|
| Client has received 3+ weekly reports | [ ] | Confirm delivery |
| Client has responded positively or neutrally to reports | [ ] | If not → escalate to CEO |
| No complaints or scope creep requests | [ ] | If yes → document and escalate |
| All leads are on-cadre (follow-ups happening as scheduled) | [ ] | If not → investigate |
| Moosa has sent >80% of scheduled follow-ups on time | [ ] | If not → flag to CPO |
| Any leads converted (replied, booked call, agreed to next step) | [ ] | Document in pipeline |
| Client has identified any off-limits leads or companies | [ ] | Confirm these are blocked |

**Day 14 CEO Report:**
- COO sends brief to CEO (Moosa):
  - Client sentiment: positive/neutral/concerned
  - Lead performance summary
  - Any flags or scope questions
  - Recommendation: proceed to Month 2 OR flag for CEO intervention

**Escalation trigger at Day 14:**
- If client is silent, negative, or requesting work outside scope → COO escalates to CEO within 4 hours (Tier 2)
- If follow-up delivery rate is below 80% → COO flags to CPO immediately

---

## PART 3 — DAY 15–29: ONGOING EXECUTION

**Standard execution mode. COO manages the pipeline, sends weekly reports, handles all lead communications.**

- [ ] Follow-up sequences continue per cadence
- [ ] New leads ingested within 2 hours
- [ ] Daily brief sent to client each business day
- [ ] Weekly pipeline report sent every Friday
- [ ] Any lead responses routed to client same day
- [ ] Stalled deal recovery triggered for any lead with no response 7+ days
- [ ] COO logs all significant activity in client pipeline file

---

## PART 4 — DAY 30: SECOND CHECKPOINT (CLA Integration)

**This is the month-end review. This is where we assess the full Month 1 performance and determine whether the guarantee triggers.**

### Month-End Report Delivered to Client
- [ ] COO generates Month 1 report covering:
  - Total leads processed (new + existing)
  - Total follow-ups sent
  - Response rate (replies / total outreach)
  - Leads by status: Hot/Warm/Cold/Dormant/Closed-Won/Closed-Lost
  - Leads converted: any that moved to a positive stage (demo booked, proposal sent, contract signed)
  - Average response time to inbound leads
  - Stalled leads: how many recovered after recovery sequence

### Guarantee Assessment
- [ ] COO reviews the signed guarantee terms from the commercial proposal
- [ ] COO calculates: Did Qiyadon meet the agreed conditions?
  - If YES: COO confirms to client — guarantee does not trigger
  - If NO (within first 30 days): COO escalates to CEO within 4 hours for guarantee review and potential remediation

### Client Satisfaction Check
- [ ] COO asks client directly: "Are you happy with how Month 1 went? Is there anything you'd change?"
- [ ] COO documents the response
- [ ] If client raises concerns: COO escalates to CEO within 4 hours (Tier 2)

### Day 30 CEO Report
- [ ] COO sends Month-End Summary to CEO:
  - Client satisfaction score (qualitative)
  - Pipeline performance vs. Month 1 goals
  - Guarantee status (triggered / not triggered)
  - Any escalations needed
  - Month 2 plan proposed

### Month 2 Planning
- [ ] COO agrees Month 2 pipeline plan with client
- [ ] New leads identified, cold leads archived or refreshed
- [ ] Cadence adjustments documented

---

## PART 5 — WHAT "DONE" LOOKS LIKE

**A client onboarding is complete when ALL of the following are true:**

### From the Client's Perspective
- [ ] They have received their first weekly pipeline report
- [ ] They understand what's in their pipeline and why
- [ ] They know what they need to do when a lead responds
- [ ] They have received a daily brief every business day without fail
- [ ] They know how to reach COO directly for any issue
- [ ] They have confirmed satisfaction with the onboarding experience

### From the COO's Perspective
- [ ] All leads are ingested and scored
- [ ] All follow-up sequences are running on schedule
- [ ] Pipeline tracker is updated within 1 hour of any action
- [ ] No lead has been dormant >7 days without recovery sequence triggered
- [ ] Client has received 4 weekly reports without missing one
- [ ] No escalations are open or unresolved
- [ ] CEO has received Day 14 and Day 30 reports

### From the System's Perspective
- [ ] Moosa's follow-up engine has sent >90% of scheduled messages on time
- [ ] No technical failures have interrupted delivery
- [ ] All client data is stored in the correct segregated directory
- [ ] Pipeline tracker is current and accurate

---

## PART 6 — ESCALATION PATH

### Escalation Triggers and Timelines

| Trigger | Severity | Who Notifies | Timeline | Escalate To |
|---|---|---|---|---|
| Client expresses dissatisfaction | Tier 2 | COO | Within 2 hours | CEO (Moosa) |
| Client threatens to cancel | Tier 2 | COO | Within 2 hours | CEO (Moosa) |
| Client requests work outside agreed scope | Tier 2 | COO | Within 4 hours | CEO (Moosa) |
| Client has not responded in 14 days | Tier 3 | COO | Within 24 hours | CEO (Moosa) |
| 80%+ follow-up delivery failure | Tier 2 | COO | Within 4 hours | CEO (Moosa) + CPO |
| Guarantee trigger risk identified | Tier 2 | COO | Within 4 hours | CEO (Moosa) |
| Legal/jurisdictional issue raised by client | Tier 1 | COO → CLA | Immediately | CEO (Moosa) + CLA |
| Data breach or suspected breach | Tier 1 | Any role | Immediately | CEO (Moosa) + CLA |
| Client wants to add a new service scope | Tier 2 | COO | Within 24 hours | CEO (Moosa) |
| Follow-up sequences not firing correctly | Tier 2 | COO | Within 4 hours | CPO |

### Escalation Process (Standard — Tier 2)

**Step 1:** COO documents the situation fully:
- What happened (exact words if client said it)
- What COO has already done
- Current status of the client/lead
- Recommended action

**Step 2:** COO sends escalation to CEO via:
- Immediate: WhatsApp message to Moosa + workspace log entry
- Format: `[ESCALATION] [CLIENT] [ISSUE] — What happened — What I've done — What I recommend`

**Step 3:** CEO decides within 4 hours. COO implements the decision.

**Step 4:** COO updates client per CEO's instruction. Never makes promises without CEO sign-off.

**Step 5:** COO logs the escalation and resolution in the client's pipeline file and in `strateon/csuite/COO/SESSION-STATES/`.

### Escalation to Board (Ahmad Salim)

CEO escalates to Board for:
- All Tier 1 events
- Any client termination
- Major financial issues
- Legal notices

COO does NOT contact Board directly. All Board communication goes through CEO.

---

## PART 7 — ROLES AND RESPONSIBILITIES

| Role | Responsibility |
|---|---|
| **COO** | Owns the onboarding protocol end-to-end. Executes Day 1 through Day 30. Delivers all weekly reports. Manages all client-facing communications. Identifies and escalates issues. |
| **CEO (Moosa)** | Reviews Day 14 and Day 30 COO reports. Makes all escalation decisions. Signs off on any scope changes or service modifications. Reports to Board. |
| **CLA** | Involved at Day 14 and Day 30 checkpoints for legal/service compliance review. Available for real-time escalation on legal matters. |
| **CPO** | Maintains Moosa's follow-up engine. Fixes any sequence delivery failures. Monitors technical health of the delivery system. |
| **CTO** | Maintains pipeline tracking infrastructure. Ensures file system and access is operational. |
| **CFO** | Sets up billing on Day 1. Monitors payment status. Issues Month 1 invoice. |

---

## PART 8 — DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-05-01 | COO | Initial approved version — complete protocol |

**This document supersedes all prior draft onboarding notes or informal checklists.**

**Approved by:** COO (execution authority)
**Reviewed by:** CEO (Moosa) — 2026-05-01

---
_Last updated: 2026-05-01 — COO_