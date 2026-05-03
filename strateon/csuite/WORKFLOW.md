# STRATEON — C-SUITE OPERATING WORKFLOW

**Version:** 1.0
**Date:** 2026-04-26
**Author:** CEO (Moosa)

---

## PURPOSE

This document defines how all six C-suite roles work together as a single operating system. It is the playbook for how work flows through Qiyadon — from market research to client delivery to self-improvement. Each workflow is defined with triggers, steps, roles involved, and escalation paths.

---

## THE ROLES AT A GLANCE

| Role | Primary Function |
|---|---|
| **CEO (Moosa)** | Coordinate all C-suite, make final decisions, answer to Board |
| **CTO** | Technical infrastructure, website, deployment, tools |
| **CMO** | Market research, content, positioning, customer-facing materials |
| **CFO** | Pricing, contracts, financial health, revenue |
| **COO** | Service delivery, pipeline execution, client happiness |
| **CPO** | Product development, Moosa's capabilities, bug fixes, updates |
| **CLA** | Legal safety, compliance, contracts, jurisdiction approval |

---

## ORCHESTRATION PRINCIPLES

1. **CEO convenes the C-suite** — The CEO calls on the right C-suite role at the right time. No C-suite acts without CEO direction.
2. **CLA gates everything legal** — Before any client-facing action, CLA must clear it for legal compliance.
3. **CMO reviews before anything goes public** — All customer-facing content passes through CMO FILTER before Board approval.
4. **COO delivers the service** — Once a client is onboarded, COO owns delivery. CPO keeps the product running. CFO tracks the money.
5. **CPO develops the product** — Between client deliveries, CPO builds and improves Moosa.
6. **Feedback flows up, decisions flow down** — C-suite reports to CEO. CEO reports to Board.

---

## ═══════════════════════════════════
## WORKFLOW 1: NEW CLIENT ACQUISITION
**Trigger:** A potential client expresses interest (website inquiry, LinkedIn message, referral)
**Frequency:** As triggered
**Primary flow:** CMO → CEO → CLA → CFO → COO → CPO → CTO

---

### STEP 1.1 — INQUIRY RECEIVED (CMO → CEO)

**Who does it:** CMO surfaces the inquiry (from LinkedIn DM, website form, or referral message)
**What happens:**
- CMO acknowledges receipt and logs the inquiry in `strateon/prospects/{name}/`
- CMO performs initial qualification:
  - Company size (SMB: 5–50 employees?)
  - Industry (IT services, MSPs, SaaS — ideal fit?)
  - Hiring pain point (do they have a pipeline problem?)
  - Geographic location (jurisdiction check initiated)
- CMO sends initial response template to CEO for review
- CMO flags jurisdiction to CLA for preliminary legal check

**Output:** Qualified or disqualified. If qualified → CEO reviews. If not → CMO archives.

---

### STEP 1.2 — INITIAL QUALIFICATION (CEO)

**Who does it:** CEO reviews CMO's qualification report
**What happens:**
- CEO assesses: Is this the right client for Qiyadon?
- CEO reviews CMO's notes and CLA's preliminary jurisdiction flag
- CEO decides: Proceed or decline
- If proceed: CEO assigns a Deal Owner (typically CEO or CMO for first clients)
- CEO notifies CLA to begin legal review

**Output:** Go/No-Go decision. If Go → CLA begins formal review.

---

### STEP 1.3 — LEGAL REVIEW (CLA)

**Who does it:** CLA reviews the prospect's jurisdiction and service scope
**What happens:**
- CLA identifies the prospect's primary jurisdiction
- CLA checks: Are we legally able to serve this client in this jurisdiction?
- CLA reviews: Does the service scope raise any regulatory concerns?
  - Data types they'll send us (any special category data?)
  - Industry-specific regulations (healthcare, finance, legal — higher risk)
  - Consent requirements for their leads
- CLA produces a legal clearance memo:
  - CLEAR: Proceed with standard agreements
  - CONDITIONAL: Proceed with specific conditions (e.g., EU client requires DPA)
  - REJECT: Legal risk too high — do not serve this client
- CLA sends clearance memo to CEO

**Output:** Legal clearance status. If Reject → CEO declines client gracefully.

---

### STEP 1.4 — PRICING & PROPOSAL (CFO)

**Who does it:** CFO prepares the commercial proposal
**What happens:**
- CFO reviews the client's needs (from CMO's qualification)
- CFO selects appropriate plan: Starter ($200) / Growth ($500) / Custom
- CFO drafts the commercial proposal including:
  - Selected service package
  - Monthly retainer
  - What's included
  - Guarantee terms
  - Payment terms
- CFO sends draft to CEO and CLA for review

**Output:** Commercial proposal ready for client delivery.

---

### STEP 1.5 — CONTRACT & LEGAL AGREEMENTS (CLA + CFO)

**Who does it:** CLA finalizes contracts, CFO prepares billing
**What happens:**
- CLA prepares the engagement:
  - Standard Client Service Agreement (2 copies)
  - Data Processing Agreement (DPA) — mandatory for any client with EU/UK prospects
  - Client Intake Form (jurisdiction, industry, consent procedures documented)
- CLA sends agreements to client for signature
- CFO sets up client billing in financial tracking
- Once signed: CFO confirms to COO that client is ready for onboarding

**Output:** Signed agreements. Client cleared for onboarding.

---

### STEP 1.6 — ONBOARDING (COO + CPO)

**Who does it:** COO runs the onboarding protocol
**What happens:**

**Day 1 — Lead Intake Setup:**
- COO receives signed agreements and client contact details
- COO creates client pipeline directory: `strateon/clients/{client-name}/`
- COO sends onboarding welcome message to client on WhatsApp
- COO collects: existing lead list, CRM access (if any), follow-up cadence preferences
- COO ingests all leads into pipeline tracker

**Day 2–7 — Execution Begins:**
- COO configures follow-up sequences for this client's leads
- COO sets cadences: number of touches, spacing, channels (WhatsApp/email/SMS)
- COO begins active pipeline management
- COO sends first daily brief to client

**Day 7 — First Weekly Report:**
- COO delivers first weekly pipeline report to client via WhatsApp
- COO flags any stalled leads or concerns
- COO escalates any client issues to CEO

**Output:** Client is live and receiving pipeline execution.

---

### STEP 1.7 — INFRASTRUCTURE CHECK (CTO + CPO)

**Who does it:** CTO and CPO ensure everything is technically ready
**What happens (parallel to onboarding):**
- CTO confirms: email inbox configured, pipeline tracker accessible, WhatsApp integration active
- CPO confirms: Moosa's follow-up sequence engine is configured for this client's cadence
- CPO sets up: per-client data segregation (each client's leads stored separately)
- CTO reports readiness to CEO

**Output:** Technical infrastructure confirmed operational for this client.

---

### STEP 1.8 — ONBOARDING COMPLETE (CEO + BOARD)

**Who does it:** CEO declares client live, Board is informed
**What happens:**
- CEO sends onboarding completion report to Board (Ahmad)
- CFO confirms first invoice sent
- CMO updates prospect → active client in all tracking
- Monthly review cycle begins (see Workflow 3)

**Output:** Client is a paying, live Qiyadon client.

---

## ═══════════════════════════════════
## WORKFLOW 2: ONGOING SERVICE DELIVERY
**Trigger:** Client is active and receiving pipeline execution
**Frequency:** Continuous, with weekly and monthly review cycles
**Primary flow:** COO → CEO → CFO → CPO (with CTO and CLA supporting)

---

### STEP 2.1 — DAILY PIPELINE EXECUTION (COO + Moosa)

**Who does it:** COO executes pipeline operations daily
**What happens:**
- New leads: ingested within 2 hours of client forwarding
- Follow-up sequences: sent on schedule per client's configured cadence
- Stalled leads: recovery sequence triggered when lead goes dark 7+ days
- Daily brief: sent to client WhatsApp (summary of today's actions)
- Pipeline tracker: updated after every action taken

**Output:** Every lead is current. Client is informed daily.

---

### STEP 2.2 — WEEKLY PIPELINE REPORT (COO)

**Who does it:** COO delivers every 7 days
**What happens:**
- COO generates weekly report:
  - Total active leads, new leads, closed leads
  - Response rate this week
  - Stalled leads requiring client action
  - Hot leads advancing
  - What's working, what's not
- COO sends report to client via WhatsApp
- COO sends summary to CEO

**Output:** Client has full visibility. CEO has full accountability.

---

### STEP 2.3 — MONTHLY SERVICE REVIEW (CEO + COO + CFO)

**Who does it:** CEO reviews with COO and CFO at month end
**What happens:**
- COO presents: Month summary (leads processed, follow-ups sent, results)
- CFO presents: Revenue received vs. invoice sent, any payment issues
- CEO assesses: Is the client happy? Is the service delivering value?
- CEO decides: Continue, modify scope, or flag for relationship review

**Output:** Month-end report to Board. Any client concerns escalated.

---

### STEP 2.4 — FINANCIAL TRACKING (CFO)

**Who does it:** CFO tracks every month
**What happens:**
- CFO records: Revenue received this month
- CFO records: AI compute costs this month (actual)
- CFO updates: Running margin calculation
- CFO compares: Actual vs. target ($1,000/month)
- CFO reports: Financial health to CEO every month

**Output:** Monthly P&L. CEO and Board know the numbers.

---

### STEP 2.5 — PRODUCT HEALTH CHECK (CPO)

**Who does it:** CPO monitors Moosa's performance continuously
**What happens:**
- CPO monitors: Are all follow-ups being sent on schedule?
- CPO checks: Any errors, missed sends, or system failures?
- CPO reviews: Token usage vs. estimates
- CPO reports: Any technical issues to CEO immediately

**Output:** Moosa is running reliably. Client delivery is not interrupted.

---

### STEP 2.6 — CLIENT ESCALATION (COO → CEO)

**Trigger:** Client expresses dissatisfaction, threatens to leave, or asks for work outside scope
**What happens:**
- COO documents: What the client said, full context
- COO escalates to CEO within 1 hour with:
  - What happened
  - What COO has already done
  - Recommended response
- CEO decides: How to respond, whether to offer remediation
- CEO + COO respond to client together

**Output:** Client concern is addressed. Relationship preserved or terminated gracefully.

---

## ═══════════════════════════════════
## WORKFLOW 3: CONTENT PUBLICATION
**Trigger:** Any customer-facing content needs to go public
**Frequency:** As triggered (LinkedIn posts, website updates, proposals, emails)
**Primary flow:** CMO writes → CMO self-reviews → CEO reviews → CLA legal check → Board approves → CTO publishes

---

### STEP 3.1 — CONTENT DRAFT (CMO)

**Who does it:** CMO creates the content
**What happens:**
- CMO identifies: What type of content is needed?
  - LinkedIn post: 150–300 words, data-grounded
  - Website copy: hero, services, about, CTA
  - Service proposal: formal offer document
  - Outreach email: personalized cold outreach
- CMO writes against the CMO FILTER criteria:
  1. Clarity — would a skeptical SMB owner understand this?
  2. Pain resonance — does it speak to a problem they actually have?
  3. Differentiation — would any competitor say this?
  4. CTA — is the next step specific and low-friction?
  5. Trust signals — are we showing proof, not just claims?
  6. Channel fit — is this right for this platform?
- CMO completes a self-review against all 6 criteria before passing to CEO

**Output:** Content draft with CMO self-review sign-off.

---

### STEP 3.2 — CEO REVIEW (CEO)

**Who does it:** CEO reviews content for strategic fit
**What happens:**
- CEO assesses: Does this align with our positioning?
- CEO checks: Is this consistent with our brand voice?
- CEO flags: Anything that conflicts with Board-approved strategy
- CEO approves: Pass to CLA for legal review
- OR CEO rejects: Returns to CMO with specific notes

**Output:** CEO-approved content. Ready for legal review.

---

### STEP 3.3 — LEGAL REVIEW (CLA)

**Who does it:** CLA reviews for legal compliance
**What happens:**
- CLA checks: Does this content make any claims that could be legally problematic?
- CLA reviews: GDPR/CCPA/CAN-SPAM compliance (if applicable)
- CLA reviews: Would any competent competitor call this misleading?
- CLA produces: APPROVED / REVISED / REJECTED
  - APPROVED: Safe to publish
  - REVISED: Make specific changes, re-submit to CLA
  - REJECTED: Do not publish — legally too risky

**Output:** CLA clearance. Content is legally cleared or rejected.

---

### STEP 3.4 — BOARD APPROVAL (BOARD)

**Who does it:** Ahmad Salim reviews and approves
**What happens:**
- CEO presents: Content + CMO review + CEO approval + CLA clearance
- Board reviews: Does this represent Qiyadon correctly?
- Board approves: CEO can publish
- OR Board requests changes: Specific revisions requested

**Output:** Board approval. Content cleared to publish.

---

### STEP 3.5 — PUBLICATION (CTO or CMO)

**Who does it:** Depends on channel
**What happens:**
- LinkedIn post: CMO publishes on Moosa Salim profile
- Website update: CTO pushes to GitHub and deploys
- Outreach email: CMO executes via configured email
- Proposal: CFO sends via secure email

**Output:** Content is live.

---

## ═══════════════════════════════════
## WORKFLOW 4: PRODUCT DEVELOPMENT
**Trigger:** A new capability needs to be built, or an existing one needs fixing
**Frequency:** As triggered, with regular development sprints
**Primary flow:** CEO identifies → CPO architects → CLA legal check → CTO deploys

---

### STEP 4.1 — DEVELOPMENT NEED IDENTIFIED

**Who identifies:** CEO (from client feedback, market research, or self-assessment)
**What triggers development:**
- Client needs a feature we don't have
- CMO reports market demand for a capability
- CPO identifies a vulnerability or performance issue
- CEO's self-improvement identifies a weakness

**What happens:**
- CEO defines: The development need in a Product Requirement Document (PRD)
- CEO assigns: CPO as Development Lead
- CEO sets: Priority (Critical / High / Medium / Low)
- CEO sets: Timeline expectation

**Output:** PRD created. CPO is Development Lead.

---

### STEP 4.2 — TECHNICAL ASSESSMENT (CPO)

**Who does it:** CPO assesses feasibility
**What happens:**
- CPO reviews: Current architecture — can we build this within existing systems?
- CPO identifies: New tools, packages, or infrastructure needed?
- CPO assesses: Security implications of this change
- CPO assesses: Performance impact (token usage, latency)
- CPO writes: Technical Specification (what we'll build, how)
- CPO escalates to CEO if: New dependencies, security concerns, breaking changes

**Output:** Technical Specification. CEO approval to proceed.

---

### STEP 4.3 — LEGAL REVIEW (CLA)

**Trigger:** Required if development involves new data handling, new jurisdictions, or changes to how Moosa communicates
**Who does it:** CLA reviews technical specification
**What happens:**
- CLA reviews: Does this development handle personal data differently?
- CLA reviews: Does this change how Moosa communicates with clients or prospects?
- CLA reviews: Does this affect our compliance posture in any jurisdiction?
- CLA produces: APPROVED / CONCERNS / REJECTED

**Output:** CLA clearance or concerns. No development proceeds without CLA clearance if data/communication is involved.

---

### STEP 4.4 — DEVELOPMENT (CPO)

**Who does it:** CPO builds and tests
**What happens:**
- CPO writes: The code/features
- CPO self-reviews: Security, performance, clarity
- CPO tests: Does it do what the PRD requires?
- CPO commits: To git with clear commit message
- CPO updates: `strateon/csuite/CPO/DAILY/{date}.md` with what was built

**Output:** Development complete and committed.

---

### STEP 4.5 — DEPLOYMENT (CTO)

**Who does it:** CTO deploys to production
**What happens:**
- CTO reviews: CPO's commit — any infrastructure concerns?
- CTO deploys: To production environment
- CTO monitors: First 24 hours — any errors or degradation?
- CTO reports: Deployment success/failure to CEO

**Output:** New capability is live in production.

---

### STEP 4.6 — VALIDATION & FEEDBACK (CEO + CMO)

**Who does it:** CEO validates with CMO market fit
**What happens:**
- CEO tests: Does the new capability work as specified?
- CMO assesses: Is this marketable? Does it change our positioning?
- If capability affects client service: COO validates delivery quality
- CEO updates Board: What was built and why

**Output:** New capability is validated and live.

---

## ═══════════════════════════════════
## WORKFLOW 5: CEO SELF-IMPROVEMENT (WEEKLY CYCLE)
**Trigger:** Every week — continuous improvement loop
**Primary flow:** CEO → AI Architect → Board

---

### STEP 5.1 — WEEKLY WEAKNESS REVIEW (CEO)

**Who does it:** CEO reviews own performance
**When:** Every Sunday (before Board meeting)
**What happens:**
- CEO reviews: `strateon/weaknesses/` log
- CEO asks:
  - What weakness did I address this week?
  - What action did I take?
  - What was the result?
  - What weakness remains?
  - What new weakness did I discover?
- CEO updates: Weaknesses log with this week's entry

**Output:** Current weakness status is documented and current.

---

### STEP 5.2 — DEVELOPMENT SPRINT (AI ARCHITECT)

**Who does it:** AI Architect executes a focused development sprint
**When:** 30–60 minutes per day
**What happens:**
- AI Architect selects: Top 1–2 weaknesses or capabilities for Moosa this week
- AI Architect develops: In short focused sessions
- AI Architect commits: After each session
- AI Architect reports: To CEO what was built this week

**Output:** Continuous Moosa improvement. The CEO gets stronger every week.

---

### STEP 5.3 — MEMORY AUDIT (CEO)

**Who does it:** CEO audits own memory files
**When:** Every Sunday
**What happens:**
- CEO reviews: Daily log chain from this week
- CEO identifies: What context is worth keeping long-term?
- CEO updates: MEMORY.md with important new information
- CEO merges: Daily logs — old daily → condensed summary → delete old
- CEO reviews: Claims log — are any claims now verified or disproven?

**Output:** Memory is clean, current, and accurate.

---

### STEP 5.4 — BOARD REPORT (CEO → BOARD)

**Who does it:** CEO reports to Ahmad
**When:** Every Sunday
**What happens:**
- CEO sends brief report to Board:
  - Revenue status (CFO update)
  - Client status (COO update)
  - What was built this week (CPO update)
  - What weakness was addressed (CEO update)
  - What needs Board attention this week
- Board responds with: Approval, changes, or new direction

**Output:** Board is informed. Week is closed.

---

## ═══════════════════════════════════
## WORKFLOW 6: ESCALATION PROCEDURES
**When something goes wrong and needs immediate attention**
**Primary flow:** Detecting role → CEO → Relevant C-suite → CEO → Board

---

### TIER 1 — Immediate (1 Hour Max)
*Escalate to CEO immediately, CEO to Board within 1 hour*

| Trigger | Action |
|---|---|
| Data breach or suspected breach | CLA + CEO immediately |
| Government authority contacts us | CLA + CEO immediately |
| Client threatens legal action | CLA + CEO immediately |
| Credential exposure | CPO + CTO + CEO immediately |
| Unauthorized access to system | CTO + CEO immediately |

**Process:**
1. Detecting role notifies CEO with full context
2. CEO notifies Board within 1 hour
3. CLA prepares response
4. CTO contains technical issue
5. No public statement without Board approval

---

### TIER 2 — Urgent (24 Hours)
*Escalate to CEO within 4 hours, resolved within 24 hours*

| Trigger | Action |
|---|
| Client wants to cancel | COO → CEO within 4h |
| Service delivery failure | COO → CEO within 4h |
| Major system outage | CTO → CEO within 4h |
| Legal notice received | CLA → CEO within 4h |
| Revenue below target 2+ months | CFO → CEO within 24h |

**Process:**
1. Role notifies CEO with: What happened, what was done, what needs decision
2. CEO decides within 24 hours
3. CEO updates Board

---

### TIER 3 — Standard (Weekly Review)
*Handled in next weekly Board meeting*

| Trigger | Action |
|---|
| New competitor noticed | CMO → CEO this week |
| Client feedback suggests positioning change | COO → CEO this week |
| CFO sees margin pressure | CFO → CEO this week |
| CPO identifies minor vulnerability | CPO → CEO this week |
| CTO has infrastructure concern | CTO → CEO this week |

---

## ═══════════════════════════════════
## CROSS-CUTTING: FEEDBACK LOOPS

### CMO → Product (Market Feedback)
- CMO surfaces: What are clients/prospects asking for that we don't have?
- CEO routes: Valid requests → CPO as development priorities
- Frequency: CMO flags weekly in Board report

### COO → Product (Delivery Feedback)
- COO surfaces: What in Moosa's execution is failing or frictioning?
- CEO routes: Technical issues → CPO fix queue
- Frequency: COO flags weekly in service report

### CFO → Pricing (Financial Feedback)
- CFO surfaces: Are our margins healthy? Is pricing competitive?
- CEO acts: With CMO and CLA if pricing needs restructuring
- Frequency: Monthly financial review

### CPO → CEO (Product Health)
- CPO surfaces: What broke? What was built? What needs attention?
- CEO routes: Issues to appropriate C-suite
- Frequency: Weekly sprint report to CEO

---

## ═══════════════════════════════════
## DECISION RIGHTS SUMMARY

| Decision | Who Decides | Who Must Be Consulted |
|---|---|---|
| Accept a new client | CEO | CLA (legal), CFO (commercial) |
| Change pricing | CEO | CFO, CMO, Board |
| Publish any content | CEO | CMO (marketing), CLA (legal), Board |
| New capability/feature | CEO | CPO (build), CLA (legal if data/comms) |
| Decline a client | CEO | CLA (reason) |
| Sign a contract | CEO | CLA (review), CFO (terms) |
| Hire/change C-suite | Board | CEO proposes |
| Change company strategy | Board | CEO recommends |
| Emergency (Tier 1) | CEO | Board immediately after |
| Daily operations | CEO | C-suite as needed |

---

_Last updated: 2026-04-26 — CEO Moosa_
