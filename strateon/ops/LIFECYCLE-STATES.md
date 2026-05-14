# Qiyadon — Lifecycle State Engine

**Purpose:** Defines the 12 explicit operational states a client passes through from signup to Scale qualification. Each state has a defined entry condition, internal actions, client-facing communications, exit condition, and expected duration. No client progresses to EVALUATION_ACTIVE without completing all prerequisite steps.

---

## State 1 — AGREEMENT_RECEIVED

**Entry condition:**
Client has submitted and agreed to the CSA / trial terms via `/submit-signature`. Signature record stored in `/home/node/.openclaw/signed-agreements/[id].json`.

**What Qiyadon does internally:**
- Signature record validated and stored
- Client record created in the client registry
- Initial workspace provisioned (client directory, evaluation tracking file)
- Transition to ACTIVATION_INITIATED triggered automatically

**What the client receives:**
- Confirmation email: "Your evaluation is live — Day 1 begins now" (buildSignatureEmailHtml)
- Immediate acknowledgement of signed agreement

**Exit condition / next state:**
T+0 automatic → ACTIVATION_INITIATED (activation email sent)

**Typical duration:**
T+0 (immediate, automated)

---

## State 2 — ACTIVATION_INITIATED

**Entry condition:**
Activation email sent to client via `/submit-signature` handler. buildSignatureEmailHtml delivered.

**What Qiyadon does internally:**
- Activation email queued and sent
- Onboarding intake form prepared and queued for delivery
- Client flagged as `activation_initiated = true` in registry
- Internal calendar entry created: T+15min intake link delivery

**What the client receives:**
- Email: "Your evaluation is live — Day 1 begins now"
- Badge: "ACTIVATION INITIATED"
- Timeline overview: T+15min intake link, T+1h briefing, T+24h briefing, Day 14 results
- "No action required" clearly stated
- CTA: "Your onboarding intake arrives in 15 minutes"

**Exit condition / next state:**
T+15min (intake link sent) → AWAITING_INTAKE

**Typical duration:**
15 minutes

---

## State 3 — AWAITING_INTAKE

**Entry condition:**
Secure onboarding intake link delivered to client (email or direct delivery).

**What Qiyadon does internally:**
- Onboarding intake form URL accessible at `/onboarding-intake.html`
- Client record updated: `awaiting_intake = true`
- No cadence sequences fired while in this state
- Internal tracking: intake form open, awaiting submission
- Followup engine blocks all outbound sequences

**What the client receives:**
- Intake link (T+15min window as stated in activation email)
- Access to intake form: Sections A–F covering CRM, ICP, pipeline context, operational setup, constraints, priorities

**Exit condition / next state:**
When client submits the intake form → INTAKE_RECEIVED

**Typical duration:**
Typically 15 minutes – 72 hours (client-driven). No escalation until T+24h.

---

## State 4 — INTAKE_RECEIVED

**Entry condition:**
Client submits onboarding intake form via `/submit-intake`. Data stored to `/home/node/.openclaw/signed-agreements/[email]-intake.json`.

**What Qiyadon does internally:**
- Intake data validated and stored
- Confirmation email sent via buildIntakeConfirmationEmailHtml
- Client record updated: `intake_completed = true`, `intake_received_at = timestamp`
- CRM platform, ICP, pipeline context, and priority extracted and indexed
- Internal brief prepared for activation briefing
- Transition to CRM_REVIEW_PENDING set for T+24h

**What the client receives:**
- Confirmation email: "Intake received — environment preparation begins"
- "INTAKE RECEIVED" badge
- Timeline: T+24h briefing, Day 2–3 cadence draft

**Exit condition / next state:**
T+24h automatic after intake received → CRM_REVIEW_PENDING

**Typical duration:**
Up to 24 hours (preparation window)

---

## State 5 — CRM_REVIEW_PENDING

**Entry condition:**
Intake has been stored for 24 hours. Client's stated CRM platform and access method are under review.

**What Qiyadon does internally:**
- Review client's stated CRM platform and access method from intake
- If "OAuth" or "API key": validate whether credentials can be connected
- If "Not connected yet": mark `crm_validated = false`, note for kickoff call
- Compliance requirements from intake flagged and reviewed
- Client record updated: `crm_review = in_progress`
- Internal status: awaiting CRM confirmation before environment setup begins

**What the client receives:**
- No new email — waiting state
- Environment preparation is actively underway (internal)
- Any compliance flags escalated to Qiyadon compliance team

**Exit condition / next state:**
When CRM access is confirmed or "not connected yet" is acknowledged → ENVIRONMENT_PREP

**Typical duration:**
Up to 24–48 hours (may align with kickoff call)

---

## State 6 — ENVIRONMENT_PREP

**Entry condition:**
CRM status resolved (connected, pending connection, or not applicable). Pipeline workspace setup underway.

**What Qiyadon does internally:**
- CRM environment configured based on intake data (OAuth connection or API key configured)
- Email sending infrastructure validated (if provided)
- Pipeline workspace created: lead context, cadence rules scaffolding
- Compliance review completed (`compliance_review_complete = true`)
- Client record updated: `environment_prep = in_progress`, `crm_validated = (true/false based on status)`
- Cadence draft assembly begins

**What the client receives:**
- No new email — preparation in progress
- Pipeline workspace initialization underway (internal)

**Exit condition / next state:**
When environment is validated and ready for rule configuration → EXECUTION_READINESS_REVIEW

**Typical duration:**
24–48 hours

---

## State 7 — EXECUTION_READINESS_REVIEW

**Entry condition:**
CRM/email environment validated. Cadence rules draft being assembled based on client's ICP, pipeline context, and priority.

**What Qiyadon does internally:**
- Draft cadence rules prepared from intake data:
  - ICP → target persona sequence
  - Monthly lead volume → outreach volume calibration
  - Challenge → priority sequence focus (e.g. re-engagement, follow-up, objection handling)
  - Priority → primary outcome metric
- Compliance constraints mapped to cadence rules
- Draft reviewed by Qiyadon ops for completeness and safety
- Client record updated: `cadence_draft_ready = true`
- Internal note: awaiting client approval before activation

**What the client receives:**
- No new email — draft in preparation
- Ready for approval step upcoming

**Exit condition / next state:**
When draft cadence is confirmed by ops reviewer → AWAITING_APPROVAL

**Typical duration:**
2–4 hours (internal review + draft assembly)

---

## State 8 — AWAITING_APPROVAL

**Entry condition:**
Draft cadence rules are prepared and sent to client for review and approval.

**What Qiyadon does internally:**
- Cadence draft delivered to client (email or client dashboard)
- Client has clear instructions to review and approve
- Client record updated: `awaiting_approval = true`, `client_approval_state = 'pending'`
- Followup engine continues to block outbound sequences
- Reminder sent if no response within agreed window

**What the client receives:**
- Cadence draft for review (sent at Day 2–3 as per activation timeline)
- Clear explanation of what the cadence does
- Action required: Approve or request modifications
- Approval CTA

**Exit condition / next state:**
Client approves rules → READY_FOR_EXECUTION
Client requests modifications → loop back to EXECUTION_READINESS_REVIEW (revised draft prepared and re-submitted)

**Typical duration:**
Day 2–3 (typically 24–72 hours client-driven)

---

## State 9 — READY_FOR_EXECUTION

**Entry condition:**
Client has approved cadence rules. All prerequisites verified.

**What Qiyadon does internally:**
- Client record updated:
  - `client_approval_state = 'approved'`
  - `outbound_rules_approved = true`
  - `onboarding_intake_completed = true`
  - `crm_validated = true` (if CRM connected) or `false` (if pending)
  - `execution_ready = true`
- All prerequisite checks now satisfied for followup engine
- Go-live signal prepared: first cadence sequence queued
- Internal: awaiting go-live signal (client date or automatic T+0 trigger)

**What the client receives:**
- Confirmation: "Your pipeline is ready. Activation begins [date]."
- Timeline reminder for Day 14 evaluation results

**Exit condition / next state:**
When first sequence fires (go-live trigger) → EVALUATION_ACTIVE

**Typical duration:**
Hours to 1 day (triggered by agreed start date)

---

## State 10 — EVALUATION_ACTIVE

**Entry condition:**
First outbound cadence sequence has fired. Live evaluation in progress.

**What Qiyadon does internally:**
- Followup engine running per approved cadence rules
- Daily/weekly pipeline monitoring active
- Data being collected: reply rates, meeting bookings, pipeline movement, conversion signals
- Client dashboard updated with live metrics
- Day 7 mid-point check: preliminary signals review
- Client record updated: `evaluation_active = true`, `evaluation_started_at = timestamp`

**What the client receives:**
- Live evaluation underway (no further emails required unless cadence includes client-touching steps)
- Day 7 mid-point check-in (if applicable)
- Dashboard visibility into pipeline performance
- Day 14 evaluation results pending

**Exit condition / next state:**
Day 14 evaluation window closes → EVALUATION_COMPLETED

**Typical duration:**
14 days

---

## State 11 — EVALUATION_COMPLETED

**Entry condition:**
14-day evaluation window has ended. All cadence data collected and analyzed.

**What Qiyadon does internally:**
- Full evaluation report compiled:
  - Lead volume processed
  - Reply rate, meeting booking rate
  - Pipeline movement attributable to cadence
  - ICP fit analysis
  - Top performing sequence types
  - Client's priority outcome vs. baseline
- Scale qualification assessment prepared:
  - Does client meet Scale qualification criteria?
  - Recommended Scale tier
  - Custom scope and pricing based on evaluation data
- Client record updated: `evaluation_completed = true`, `evaluation_completed_at = timestamp`

**What the client receives:**
- Day 14 evaluation results delivered
- Scale offer prepared (if qualified)
- Clear recommendation: Scale, adjust scope, or close

**Exit condition / next state:**
Automatic → SCALE_QUALIFICATION_REVIEW

**Typical duration:**
Day 14 (immediate transition)

---

## State 12 — SCALE_QUALIFICATION_REVIEW

**Entry condition:**
Evaluation results and Scale offer delivered to client. Client is reviewing.

**What Qiyadon does internally:**
- Scale offer in client's hands
- Client decision tracked: `scale_offered = true`
- Three possible outcomes tracked:
  - **Deal won:** Scale agreement signed, onboarding to Scale begins
  - **Renewed (non-Scale):** Client wants to continue evaluation or pause — track accordingly
  - **Churned:** Client declines, offboarding initiated, data retained per retention policy

**What the client receives:**
- Day 14 evaluation report
- Scale offer with clear scope, pricing, and commitment
- Decision requested: Scale, adjust, or close

**Exit condition / next state:**
- Scale signed → Scale onboarding begins (new lifecycle)
- Evaluation renewed → new evaluation cycle flagged
- Declined → offboarding

**Typical duration:**
Client-driven (typically 3–14 days to decision)

---

## Prerequisite Matrix

The followup engine must NOT fire any sequences until all of the following are confirmed:

| # | Prerequisite | Record Key | State Where Set |
|---|---|---|---|
| 1 | Onboarding intake completed | `onboarding_intake_completed = true` | INTAKE_RECEIVED |
| 2 | CRM credentials validated | `crm_validated = true` | ENVIRONMENT_PREP |
| 3 | Outbound cadence rules approved | `outbound_rules_approved = true` | READY_FOR_EXECUTION |
| 4 | Compliance review complete | `compliance_review_complete = true` | ENVIRONMENT_PREP |
| 5 | Client approval state approved | `client_approval_state = 'approved'` | READY_FOR_EXECUTION |

**If any prerequisite is missing**, the followup engine blocks all sequence firing and logs the active blockers.

---

## State Transition Summary Table

| State | Enter when | Exit when | Duration |
|---|---|---|---|
| AGREEMENT_RECEIVED | Signature stored | T+0 automatic | Immediate |
| ACTIVATION_INITIATED | Activation email sent | T+15min | 15 min |
| AWAITING_INTAKE | Intake link sent | Form submitted | Client-driven |
| INTAKE_RECEIVED | Intake stored | T+24h automatic | Up to 24h |
| CRM_REVIEW_PENDING | CRM review begins | CRM status resolved | 24–48h |
| ENVIRONMENT_PREP | Environment setup | Environment validated | 24–48h |
| EXECUTION_READINESS_REVIEW | Cadence draft being assembled | Draft ready | 2–4h |
| AWAITING_APPROVAL | Draft sent to client | Client approves | 24–72h |
| READY_FOR_EXECUTION | Client approves | First sequence fires | Hours–1d |
| EVALUATION_ACTIVE | First sequence fires | Day 14 | 14 days |
| EVALUATION_COMPLETED | Day 14 window closes | Results delivered | Immediate |
| SCALE_QUALIFICATION_REVIEW | Scale offer delivered | Deal won / churned / renewed | Client-driven |