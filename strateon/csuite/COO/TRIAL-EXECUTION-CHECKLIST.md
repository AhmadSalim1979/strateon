# TRIAL EXECUTION CHECKLIST
**Qiyadon — COO Playbook**
*Version 1.0 | For internal use*

---

## PURPOSE

This document is the COO's operating manual for every trial client from onboarding to close. Follow it step-by-step. No ambiguity. No skipping.

If you are reading this for the first time as a new COO: execute every section in order. Do not skip, combine, or interpret. Every bullet is a real task.

---

## PART 0: APPLICATION REVIEW CHECKLIST

Before accepting any trial, verify every item. A trial starts only when all are confirmed green. If any item is red, do not proceed — escalate to CEO.

### Lead Volume
- [ ] Client submitted a lead list
- [ ] Count leads — minimum **5 active leads** required
- [ ] Flag if any leads are duplicates, clearly dead (bounce, out-of-business), or placeholder/test entries
- [ ] If <5 clean leads: ask client to supplement before trial start — do not begin trial with a deficient list

### Company Verification
- [ ] Company name, website, and primary contact confirmed
- [ ] Company appears real and operational (active website, LinkedIn presence, traceable address/registration)
- [ ] Primary contact has a valid business email (no gmail/yahoo/personal domains unless pre-approved by CEO)
- [ ] No signs of shell company, scam, or front

### ICP Match
- [ ] Client's target prospect profile reviewed against Qiyadon's ICP framework
- [ ] Industry vertical confirmed and approved
- [ ] Geography confirmed and approved
- [ ] Company size range confirmed (SMB / Mid-Market / Enterprise — as applicable to campaign)
- [ ] Deal flow is B2B (no D2C, no consumer leads)
- [ ] Client's offer is a real, deliverable product or service
- [ ] **RED FLAG**: If ICP mismatch is identified, do not proceed — escalate to CEO with written rationale

### Trial Application Approval Gate
```
All items GREEN → Trial can proceed (sign off: COO)
Any item RED    → Trial is PAUSED → Escalate to CEO immediately
                 → Do not begin Day 1 activation until CEO resolves
```

---

## PART 1: DAY 1 ACTIVATION CHECKLIST

Day 1 means the first day the trial campaign goes live. Complete every step before end of business Day 1.

### 1.1 Confirm Lead List Received
- [ ] Re-verify lead count: minimum 5 active, qualified leads in the submitted list
- [ ] Confirm leads are in a usable format (CSV, spreadsheet, or CRM-export)
- [ ] Load leads into the CRM under the client's campaign/pipeline
- [ ] Flag any leads that appear invalid — notify client same day, request replacements if count drops below 5

### 1.2 Create Client Directory
- [ ] Create folder: `/clients/[ClientName]/`
- [ ] Subfolders to create:
  - `/leads/` — raw lead list + cleaned version
  - `/reports/` — Day 7, Day 14, and any ad-hoc reports
  - `/communications/` — email/WhatsApp logs with client
  - `/contracts/` — signed trial agreement, any amendments
  - `/campaign/` — sequence configs, cadence, script versions
- [ ] Name files with date stamps: `Day7-Report_2024-01-15.md`, etc.

### 1.3 Set Up CRM Pipeline Columns
- [ ] Create or confirm pipeline named `[ClientName] — Trial`
- [ ] Required columns/stages (minimum):
  1. **New** — Lead received, not yet contacted
  2. **Sequence Active** — In 6-touch sequence
  3. **Replied** — Responded to one or more touches
  4. **Reactivated** — Re-engaged after going cold
  5. **Meeting Booked** — Solid meeting/call confirmed
  6. **Escalated to Client** — Client must make a decision
  7. **Qualified / Closed-Won** — Converted
  8. **Disqualified / Closed-Lost** — Does not fit, or trial ended
- [ ] Assign lead owners (the sequencer or designated rep)
- [ ] Set initial stage to **New** for all trial leads

### 1.4 Load 6-Touch Sequence for Each Lead
- [ ] Confirm the 6-touch sequence template is loaded for this campaign
- [ ] Sequence must include (at minimum):
  - Touch 1: Initial outreach (day 0)
  - Touch 2: Follow-up (day 2–3)
  - Touch 3: Value-add or social proof (day 5–7)
  - Touch 4: Reactivation attempt (day 9–11)
  - Touch 5: Breakup / final attempt (day 13–15)
  - Touch 6: Final close or referral ask (day 17–21, configurable)
- [ ] Personalization fields populated per lead (name, company, role)
- [ ] Confirm sending cadence with client (see 1.6) before sequence goes live
- [ ] Sequence status set to **ACTIVE** for all 5+ leads

### 1.5 Send Welcome Message to Client
Send this template within 2 hours of trial go-live:

> **Subject: Your Qiyadon Trial is Live — Day 1 ✅**
>
> Hi [Client Name],
>
> Welcome to your Qiyadon 14-day trial! 🎉
>
> Here's what just happened:
> ✅ Your lead list received and loaded ([X] leads, confirmed active)
> ✅ 6-touch sequence is live for each lead
> ✅ CRM pipeline is set up — you'll have visibility into every lead's status
>
> **What happens next:**
> - Days 1–7: Sequences run, we track replies and engagement
> - Day 7: I'll send you a mid-trial check-in report so we can see what's working
> - Day 14: You'll receive your full Trial Results Summary
>
> Your dedicated cadence: [X] touches per week, [channel — email/LinkedIn/WhatsApp]
>
> A quick note: **you are the most important variable here.** When a lead replies or escalates, your speed in responding matters enormously. I'll flag every client-side action needed — but the faster you act, the better the results.
>
> Questions? Reply here anytime. No is a full sentence — but silence from your leads is not. Let's go get them.
>
> — COO, Qiyadon

### 1.6 Confirm Cadence with Client
If cadence was not pre-agreed, send this before sequence launch:

> **Subject: Cadence Confirmation — Before We Go Live**
>
> Hi [Client Name],
>
> Before we fire up your sequence, I need one quick confirmation:
>
> **Proposed cadence: [X] outreach(s) per week per lead**
> **Channels: [Email / LinkedIn / WhatsApp / Mix]**
> **Sequence length: 6 touches over ~21 days**
>
> Does this work for you? Any adjustments?
>
> Once you confirm, we go live today.
>
> — COO

- [ ] Wait for client confirmation before activating sequence if cadence is not pre-set
- [ ] Log confirmation in `/clients/[ClientName]/communications/`
- [ ] If client does not respond within 4 business hours, proceed with pre-agreed or proposed cadence and note it in the file

### 1.7 Set Stall Triggers
These are automated alerts — configure them in the CRM or task system:

| Trigger | Condition | Action |
|---|---|---|
| **7-day stall** | No replies received by Day 7 across the list | Flag for Day 7 report; note in client check-in |
| **14-day stall** | No replies AND no reactivation responses | Escalate to COO for sequence review; consider acceleration or pivot |
| **21-day stall** | Zero movement across entire list | Initiate trial close review — pull full report, contact client for debrief |

- [ ] Log stall trigger configuration in client's campaign notes
- [ ] If stall trigger fires: do not wait for scheduled check-in — contact client immediately with an update

---

## PART 2: DAY 7 CHECK-IN CHECKLIST

Complete by end of Day 7 (or closest business day). Do not skip. Do not delay.

### 2.1 Pull Metrics

- [ ] **Lead Response Rate**: (Total leads with ≥1 reply / Total active leads) × 100
  - Minimum target: **≥15%**
  - Calculate for each channel separately and in aggregate
- [ ] **Reactivation Rate**: (Leads re-engaged after going cold / Total leads that went cold) × 100
  - Minimum target: **≥10%**
- [ ] **Active Lead Volume**: Current count of leads still in sequence or with open threads
  - Minimum target: **≥5 throughout trial**
- [ ] **Escalation Count**: Number of leads escalated to client for decision
  - Minimum target: **≥2 escalation decisions by Day 14**
- [ ] **Day 7 Acknowledgement**: Has client opened/responded to any COO communications?
  - Minimum target: **Client acknowledged the trial is running**

### 2.2 Generate Day 7 Check-In Report
Create file: `/clients/[ClientName]/reports/Day7-Report_YYYY-MM-DD.md`

Report must include:
- Lead response rate (overall + by channel)
- Reactivation rate
- Active lead count vs. starting count
- Leads escalated to client so far
- Client acknowledgement status
- What's working (highest-performing message/touch)
- What's not working (lowest-performing message/touch)
- **COO Assessment**: On Track / At Risk / Off Track

### 2.3 Send Day 7 Report to Client
> **Subject: Day 7 Trial Check-In — [Client Name] 📊**
>
> Hi [Client Name],
>
> Here's your Day 7 snapshot. Straight facts, no fluff.
>
> **📊 Your Numbers at Day 7**
> - Lead Response Rate: [X]% (Target: ≥15%)
> - Reactivation Rate: [X]% (Target: ≥10%)
> - Active Leads: [X] of [Y] (Target: ≥5)
> - Escalations to you: [X] (Target: ≥2 by Day 14)
>
> **🚦 COO Assessment: [ON TRACK / AT RISK / OFF TRACK]**
>
> [Brief 2–3 sentence assessment: what's working, what isn't, what's being adjusted]
>
> **What happens next:**
> We're continuing the sequence through Day 14. If you get replies from leads — reply to them immediately. Your speed is the biggest lever we have left.
>
> Full Trial Results Summary coming on Day 14.
>
> — COO, Qiyadon

### 2.4 Assess Against 5 Success Criteria
Score each criterion:

| Criterion | Target | Day 7 Status | Pass/Fail |
|---|---|---|---|
| Lead response rate | ≥15% | [X]% | ✅ Pass / ❌ Fail |
| Reactivation rate | ≥10% | [X]% | ✅ Pass / ❌ Fail |
| Active lead volume | ≥5 throughout | [X] currently | ✅ Pass / ❌ Fail |
| Day 7 check-in acknowledged | Yes | [Yes/No] | ✅ Pass / ❌ Fail |
| Escalation decisions made | ≥2 by Day 14 | [X] so far | 🔄 In Progress / ❌ Fail |

- [ ] Log scores in `/clients/[ClientName]/reports/Day7-Report_YYYY-MM-DD.md`
- [ ] If ≥3 criteria are ❌ Fail at Day 7: flag client relationship as **At Risk** and prepare a recovery plan
- [ ] Recovery plan: propose cadence change, lead list enrichment, or message refresh — document in Day 7 report

---

## PART 3: DAY 14 — TRIAL CLOSE CHECKLIST

Complete by end of Day 14 (or closest business day). This is the conversion or close decision point.

### 3.1 Compile Trial Results Summary
Create file: `/clients/[ClientName]/reports/Day14-Results-Summary_YYYY-MM-DD.md`

Include:
- All Day 7 metrics repeated and updated to Day 14
- Final lead response rate
- Final reactivation rate
- Total active leads at trial end
- Total escalation decisions made
- Client acknowledgment status (all check-ins)
- List of leads converted / replied / disqualified / stalled
- Revenue or pipeline value generated during trial (if applicable)
- Sequence performance breakdown (which touch performed best)
- Client-side response time average (did the client reply to leads quickly?)

### 3.2 Score Against 5 Success Criteria

| Criterion | Target | Final Score | Pass/Fail |
|---|---|---|---|
| Lead response rate | ≥15% | [X]% | ✅ / ❌ |
| Reactivation rate | ≥10% | [X]% | ✅ / ❌ |
| Active lead volume | ≥5 throughout | [X] | ✅ / ❌ |
| Day 7 check-in acknowledged | Yes | Yes/No | ✅ / ❌ |
| Escalation decisions made | ≥2 by Day 14 | [X] | ✅ / ❌ |
| **TOTAL PASSING** | **3 of 5 required** | | **[X]/5** |

- [ ] **If score ≥ 3/5** → Client is **QUALIFIED** → Proceed to conversion
- [ ] **If score < 3/5** → Client is **NOT QUALIFIED** → Proceed to polite close
- [ ] Log final score in `/clients/[ClientName]/reports/Day14-Results-Summary_YYYY-MM-DD.md`

### 3.3 Prepare Conversion Offer (Score ≥3/5)
Prepare the following before sending:
- [ ] Proposed package: which service tier, which volume, which price
- [ ] Timeline: when onboarding starts if they convert
- [ ] Any trial-specific incentive (if authorized by CEO)
- [ ] Custom proposal document OR standard contract amendment

### 3.4 Prepare Polite Close (Score <3/5)
- [ ] Do not burn the bridge — client may grow, refer others, or convert later
- [ ] Identify what held the trial back (be honest, be constructive)
- [ ] Offer a future re-engagement path if appropriate

### 3.5 Send Day 14 Message — QUALIFIED (Score ≥3/5)

> **Subject: Your Trial Results Are In — Let's Talk Conversion 🚀**
>
> Hi [Client Name],
>
> Day 14. Here's the full picture.
>
> **Your Final Numbers**
> - Lead Response Rate: [X]% ✅ (Target: ≥15%)
> - Reactivation Rate: [X]% ✅ (Target: ≥10%)
> - Active Leads at Close: [X] ✅ (Target: ≥5)
> - Day 7 Check-In: ✅ Acknowledged
> - Escalation Decisions Made: [X] ✅ (Target: ≥2)
>
> **Result: QUALIFIED — 4/5 criteria met**
>
> [Client Name], your leads responded. The sequence worked. This trial delivered real signal.
>
> I'd like to schedule a 20-minute call this week to walk through your conversion options. I've prepared a proposed package based on what we saw — [brief description of proposed tier/volume].
>
> [Include: proposed pricing, start date, any trial-to-full-contract incentive]
>
> Are you available [Day/Time] or [Alternative Day/Time]?
>
> — COO, Qiyadon

### 3.6 Send Day 14 Message — NOT QUALIFIED (Score <3/5)

> **Subject: Your 14-Day Trial — Results & Next Steps**
>
> Hi [Client Name],
>
> We've reached the end of your 14-day trial. Here's the honest summary.
>
> **Your Final Numbers**
> - Lead Response Rate: [X]% (Target: ≥15%)
> - Reactivation Rate: [X]% (Target: ≥10%)
> - Active Leads at Close: [X] (Target: ≥5)
> - Escalation Decisions Made: [X] (Target: ≥2)
>
> **Result: [X]/5 criteria met**
>
> I want to be straight with you: the trial didn't hit the threshold we'd need to see to move forward confidently. The main gaps were [be specific but constructive: e.g., lead volume, response rates, or client-side response time].
>
> This isn't a final no — it's a "not yet." Here's what I'd recommend if you want to revisit in the future:
> 1. Source a stronger lead list with more targeted prospects
> 2. Be more responsive to lead replies during the trial window
> 3. Consider a longer runway before evaluating results
>
> I'd be happy to revisit this conversation in [timeframe — e.g., 60 days] if your situation changes. You're welcome to re-apply with a refreshed lead list at no cost.
>
> Thank you for the opportunity. I mean that.
>
> — COO, Qiyadon

### 3.7 Document Outcome
For every trial, regardless of outcome, complete the following:
- [ ] File Day 14 Results Summary in `/clients/[ClientName]/reports/`
- [ ] Update CRM: move all leads to appropriate final stage (Qualified / Disqualified / Closed-Lost)
- [ ] Log outcome in `/clients/[ClientName]/communications/log.md` with date, score, and which message was sent
- [ ] If converted: initiate onboarding handoff to CEO/Account Manager — do not let the client go quiet
- [ ] If not converted: tag client in CRM as "Trial Closed — Not Qualified — Re-engage [date]" with notes

---

## PART 4: SUCCESS CRITERIA — THE 5 METRICS

These are the ONLY criteria used to score a trial. No other subjective assessments apply.

| # | Criterion | Target | Notes |
|---|---|---|---|
| 1 | **Lead Response Rate** | ≥15% | (Replies received / Total active leads) × 100. Count each lead once. |
| 2 | **Reactivation Rate** | ≥10% | (Re-engagements / Leads that went cold) × 100. Must show renewed interest. |
| 3 | **Active Lead Volume** | ≥5 throughout | Measured at Day 1, Day 7, and Day 14. If it drops below 5 at any point, this criterion fails. |
| 4 | **Day 7 Check-In Acknowledged** | Yes | Client must open and acknowledge the Day 7 report. Silence = fail. |
| 5 | **Escalation Decisions Made** | ≥2 | Client must make at least 2 real business decisions (approve quote, pivot strategy, decline lead, etc.) during the 14 days. |

**Passing threshold: 3 of 5 criteria met**

---

## PART 5: CAPACITY ESCALATION PROTOCOL

Qiyadon COO manages a finite number of simultaneous active trials. Use this protocol when capacity is threatened.

### Definitions
- **Active trial**: A client currently in Days 1–14 with sequences running
- **Capacity limit**: Maximum 2 active trials simultaneously (or as set by CEO)
- **At capacity**: 2 trials already active and running

### Escalation Trigger
A third trial is requested or a new lead list is submitted while 2 trials are already active.

### Step-by-Step Escalation Protocol

1. **Do not begin the third trial.** Do not load leads. Do not activate sequences.

2. **Acknowledge the new application within 24 hours:**
   > "Thank you for your application. We've received your lead list and we're reviewing it. Due to high demand, we're currently at full capacity for trials. You'll hear from us within [X] business days with a status update."

3. **Immediately notify CEO** via written channel (message/email) with:
   - Client name and company
   - Lead list size
   - Application review notes (ICP match, quality)
   - Date capacity will free up (if known: after one of the current trials closes)
   - Your recommendation: Accept / Decline / Waitlist

4. **CEO decision required** before any further action. Options:
   - **Accept and prioritize**: CEO approves you take the third trial; one current trial may be accelerated or deprioritized
   - **Waitlist**: Third trial is queued; you proceed when first trial closes
   - **Decline**: Third trial is not accepted; client referred to future cohort

5. **If CEO approves the third trial**:
   - Notify the client within 24 hours of CEO approval
   - Begin Day 1 activation immediately upon client confirmation
   - Update your task system to show 3 active trials
   - At the next available window, audit all three active trials to confirm no quality degradation due to load

6. **If CEO declines or waitlists**:
   - Notify client within 24 hours with a clear and professional explanation
   - Set a re-engagement reminder in CRM for [date when capacity frees]
   - Log the decision and rationale in `/clients/[ClientName]/communications/log.md`

### No Exceptions
> **🚨 COO must not begin a third trial without explicit CEO approval.**
> Starting a trial without capacity is how quality collapses, clients are underserved, and the process breaks.
> If you are unsure whether you are at capacity, ask the CEO before acting — not after.

---

## QUICK REFERENCE: TRIAL TIMELINE

```
DAY 0  → Application approved, trial signed
DAY 1  → Leads loaded, CRM set up, sequence activated, welcome sent, cadence confirmed, stall triggers set
DAY 7  → Metrics pulled, Day 7 report generated, sent to client, 5-criteria score updated, recovery plan if needed
DAY 14 → Final metrics compiled, 5-criteria scored, conversion or close message sent, outcome documented, CRM updated
DAY 15+→ Conversion onboarding begins OR client tagged for future re-engagement
```

---

*Last updated: 2026-05-01 | COO, Qiyadon*