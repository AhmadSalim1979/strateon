# QIYADON — COMPLETE END-TO-END EXECUTION MAP
**Document Type:** Systems Architecture — Full Operational & Customer Lifecycle
**Version:** 1.0
**Date:** 2026-05-09
**Classification:** Internal — Qiyadon Technical Operations

---

## DOCUMENT PURPOSE

This document maps every stage, trigger, event, service, data flow, and state transition in the Qiyadon platform — from the moment a visitor lands on qiyadon.com through ongoing autonomous pipeline execution and customer reporting.

This is not a high-level overview. This is a production-grade technical blueprint. Every system, every queue, every webhook, every state transition, every failure mode, and every recovery path is documented.

---

# ═══════════════════════════════════════════════════════════════
# PHASE 1 — WEBSITE ENTRY & LEAD CAPTURE
# ═══════════════════════════════════════════════════════════════

## STAGE 1.1 — Visitor Lands on qiyadon.com

**What happens at the edge:**

1. Cloudflare receives the HTTP request for `qiyadon.com` or `qiyadon.com/`
2. Cloudflare checks edge cache — if cached and fresh, serves from edge with `CF-Cache-Status: HIT`
3. If not cached — request forwarded to Cloudflare Pages (origin), which serves `index.html` + `styles.css`
4. Google Fonts Inter is loaded via `<link rel="preconnect">` + Google Fonts CDN stylesheet
5. Page renders in browser — visitor sees hero, value prop, how it works, pricing, FAQ

**Asset delivery chain:**
```
Cloudflare Edge → Cloudflare Pages (origin) → /public/index.html + /public/styles.css
                                                    ↓
                                            /assets/logo.png (transparent PNG)
                                            /assets/qiyadon-banner.jpg
```

**Key pages and their URLs:**
- `qiyadon.com/` → `public/index.html`
- `qiyadon.com/pricing` → `public/pricing.html`
- `qiyadon.com/sign-trial` → `public/sign-trial.html`
- `qiyadon.com/sign-csa` → `public/sign-csa.html`
- `qiyadon.com/pipeline-leak-audit` → `public/pipeline-leak-audit.html`
- `qiyadon.com/privacy-policy` → `public/privacy-policy.html`
- `qiyadon.com/terms-of-service` → `public/terms-of-service.html`
- `qiyadon.com/dashboard` → `public/dashboard.html` (new — live pipeline dashboard)

**All pages share a common CSS:** `styles.css` — design system, navbar, typography, responsive breakpoints

---

## STAGE 1.2 — Primary CTA: "Get a Free Pipeline Leak Audit"

**CTA Location:** Navbar (persistent) + Hero section + multiple page sections

**Button HTML:**
```html
<a class="nav-cta" href="/pipeline-leak-audit">Get a Free Pipeline Leak Audit</a>
```

**Click event flow:**

```
Visitor clicks CTA
    ↓
Browser navigates to qiyadon.com/pipeline-leak-audit
    ↓
Cloudflare → Cloudflare Pages serves: /public/pipeline-leak-audit.html
    ↓
Page loads — form visible, empty fields
    ↓
User sees:
  - Headline: "Discover How Many Leads You're Losing"
  - 9-question form (see form fields below)
  - Submit button: "Get My Free Pipeline Leak Audit"
```

---

## STAGE 1.3 — Form Fill & Submission

**Form fields (pipeline-leak-audit.html):**

1. `first_name` — text, required
2. `last_name` — text, required
3. `email` — email, required (used for audit delivery)
4. `company` — text, required
5. `website` — text, optional
6. `monthly_lead_volume` — select: "<10 / 10–50 / 50–200 / 200+"
7. `crm_platform` — select: "None / HubSpot / Salesforce / Zoho / Pipedrive / Other"
8. `biggest_pain_point` — textarea, required
9. `consent_checkbox` — required, GDPR compliance

**Frontend validation (client-side, before submit):**
- All required fields non-empty
- Email format validation (regex)
- Consent checkbox checked
- If invalid → inline error messages shown, form not submitted

**On valid submit:**

```javascript
// Form submit → JavaScript handler
const formData = new FormData(formElement);
fetch('/submit-audit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.fromEntries(formData))
})
```

**Request payload example:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@acmecorp.com",
  "company": "Acme Corp",
  "website": "acmecorp.com",
  "monthly_lead_volume": "50–200",
  "crm_platform": "HubSpot",
  "biggest_pain_point": "Leads go dark after first contact, nobody follows up",
  "consent": true
}
```

---

## STAGE 1.4 — Backend Form Handler (server.js on port 3001)

**Server:** `strateon-site/server.js` running as PM2 process `qiyadon-audit-form` on port `3001`

**Route:** `POST /submit-audit`

**Incoming request:**
```
POST /submit-audit HTTP/1.1
Host: qiyadon.com
Content-Type: application/json
```

**Step-by-step backend execution:**

```
1. Express.js parses JSON body
2. Input sanitization:
   - trim all strings
   - validate email format (regex)
   - escape special characters (prevent XSS)
3. Validation check — if invalid → HTTP 400 with field-level errors
4. Generate audit_id: UUID v4 (e.g., "a3f8b2c1-...")
5. Generate timestamp: ISO 8601 UTC
6. Build audit record object
7. Send to HubSpot via HubSpot API v3:
   - Create/update Contact in HubSpot CRM
   - Properties set:
     * firstname, lastname, email, company, website
     * monthly_lead_volume, crm_platform, biggest_pain_point
     * pipeline_leak_audit_id = audit_id
     * pipeline_leak_audit_submitted_at = timestamp
     * lead_source = "Pipeline Leak Audit"
8. Send confirmation email to submitter via SMTP:
   - From: contact@qiyadon.com
   - To: submitter's email
   - Template: audit-submitted-confirmation.html
   - Subject: "We got your audit — analyzing now"
9. Send internal notification email to ahmad.salim@qiyadon.com:
   - New audit submitted
   - Lead score assessment (based on lead volume + CRM status)
   - Link to HubSpot contact
10. Respond HTTP 200 to browser:
    { "success": true, "audit_id": "a3f8b2c1-...", "message": "Audit submitted" }
```

**Data stored — Supabase `pipeline_lead_audits` table (if connected) or just HubSpot:**
- Primary: HubSpot Contact record (source of truth)
- Backup: Supabase `pipeline_lead_audits` table (pending integration)

**HubSpot API call details:**
```
POST https://api.hubapi.com/crm/v3/objects/contacts
Authorization: Bearer {HUBSPOT_API_KEY}
Content-Type: application/json

{
  "properties": {
    "email": "john@acmecorp.com",
    "firstname": "John",
    "lastname": "Smith",
    "company": "Acme Corp",
    "website": "acmecorp.com",
    "monthly_lead_volume": "50-200",
    "crm_platform": "HubSpot",
    "biggest_pain_point": "Leads go dark after first contact",
    "lead_source": "Pipeline Leak Audit",
    "pipeline_leak_audit_id": "a3f8b2c1-...",
    "pipeline_leak_audit_submitted_at": "2026-05-09T10:00:00Z"
  }
}
```

---

## STAGE 1.5 — Post-Submission Page (Success State)

**Browser receives HTTP 200 → renders:**
```html
<div class="success-state">
  <h2>Audit Submitted — We'll Be In Touch Within 24 Hours</h2>
  <p>Check your inbox — confirmation sent to {email}</p>
  <p class="audit-id">Your audit ID: <code>a3f8b2c1-...</code></p>
</div>
```

**What the success page communicates:**
- Audit has been received and is being processed
- Confirmation email sent to their inbox
- Internal team has been notified
- What to expect next (48-hour delivery)

---

## STAGE 1.6 — Email Notifications Triggered

**Email 1 — Confirmation to lead (SMTP → SendGrid/Mailgun or direct SMTP):**
```
From: Qiyadon Pipeline <contact@qiyadon.com>
To: john@acmecorp.com
Subject: We got your audit — analyzing now
Template: audit-submitted-confirmation.html
```

**Email 2 — Internal alert to Qiyadon team:**
```
From: noreply@qiyadon.com
To: ahmad.salim@qiyadon.com
Subject: [Lead Alert] New Pipeline Leak Audit — Acme Corp
Body: Lead details + HubSpot link
```

---

## STAGE 1.7 — CRM State Machine (HubSpot)

**Contact lifecycle state transitions:**
```
Contact created in HubSpot:
  → hs_lead_status: "NEW"
  → lifecyclestage: "lead"
  → lead_source: "Pipeline Leak Audit"
  → audit_id recorded
  → audit_submitted_at recorded

After internal review (human decision):
  → hs_lead_status: "ATTEMPTING_TO_CONTACT" (if qualified)
  → hs_lead_status: "UNQUALIFIED" (if not qualified)
  → Owner assigned (Ahmad or Moosa)

During follow-up cadence:
  → strtn_followup_cadence_day updated per cadence step
  → strtn_last_followup_date updated
  → strtn_response_received updated on reply
  → strtn_escalated updated if stalled
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 2 — INITIAL CUSTOMER RESPONSE FLOW & QUALIFICATION
# ═══════════════════════════════════════════════════════════════

## STAGE 2.1 — Lead Qualification

**Trigger:** Audit form submitted → internal alert received by Qiyadon team

**Human qualification step (Ahmad or Moosa):**
```
1. Review HubSpot contact — lead volume, CRM, pain point
2. Assess fit score:
   - Monthly lead volume >= 10 → qualified
   - CRM in use (HubSpot/Salesforce) → high priority
   - Pain point relates to follow-up/pipeline → high priority
3. Decision branches:
   - NOT QUALIFIED → tag in HubSpot, no further outreach
   - QUALIFIED → proceed to outreach cadence
   - UNCERTAIN → add to warm nurture sequence
```

**Automated lead scoring (pending):**
- Fit score calculated from form data
- Score range: 0–100
- If score >= 70 → auto-escalate to Ahmad
- If score >= 40 → add to nurture sequence
- If score < 40 → tag as low-priority, no immediate action

---

## STAGE 2.2 — Outbound Qualification Outreach

**Trigger:** Lead qualified → Moosa or Ahmad initiates outreach

**Channel:** Email (primary) + LinkedIn (secondary if profile found)

**Email template flow:**
```
Step 1: Personalized intro email
  - Subject: "Re: {biggest_pain_point} — {company} + Qiyadon"
  - Body references: their pain point, audit submitted, specific value prop
  - CTA: "Jump on a 15-min call?"

Step 2: If no response in 48h → follow-up #1
  - Subject: "Re: pipeline follow-up"
  - Shorter, lower pressure

Step 3: If no response in 72h → follow-up #2
  - Subject: "Quick yes/no"
  - Very brief, CTA only

Step 4: If engaged → schedule discovery call
  - Calendly link or direct scheduling
  - Meeting booked → HubSpot contact updated
```

**State tracking in HubSpot:**
- `strtn_last_outreach_date` updated
- `strtn_outreach_count` incremented
- `hs_lead_status` updated to "IN_CONTACT" if reply received

---

## STAGE 2.3 — Discovery Call & Product Fit

**Trigger:** Lead responds positively → call scheduled

**Pre-call preparation:**
1. Moosa reviews HubSpot contact — lead volume, current follow-up process, pain points
2. Prepare custom pitch based on their specific situation
3. Pricing tier recommendation based on lead volume:
   - <25 leads/mo → Starter ($300/mo)
   - 25–100 leads/mo → Growth ($750/mo)
   - 100+ leads/mo → Scale ($1,500/mo)
   - Enterprise → custom

**During call:**
- Assess fit: do they have a live pipeline? Are they the decision maker? Can they afford it?
- If fit confirmed → propose trial or direct contract
- If not fit → provide advice, tag as "not a fit", close record

**Post-call HubSpot update:**
```
Call completed → contact properties updated:
  - call_completed: true
  - fit_score: {score}
  - proposed_tier: {starter/growth/scale}
  - meeting_notes: {text}
  - next_step: {description}
  - follow_up_cadence_day: 0 (reset for onboarding if accepted)
```

---

## STAGE 2.4 — Contract & Commercial Agreement

**Trigger:** Lead accepted → moving to contract

**Contract types:**
- **Trial Agreement:** 14-day trial, ≤25 leads, no credit card
- **Client Service Agreement (CSA):** Full contract for paying clients
- **Data Processing Addendum (DPA):** Required for GDPR compliance

**Contract flow:**
```
1. COO generates contract package:
   - CSA (16 sections, all decisions confirmed)
   - DPA (data processing terms)
   - Trial Policy (14-day, ≤25 leads, no discovery call)
2. Contract sent via DocuSign or direct email PDF
3. Lead signs (digital or printed + scanned)
4. Signed contract stored in: strateon/legal/contracts/{client_name}/
5. HubSpot contact updated: contract_signed: true, contract_date: {date}
6. Billing setup initiated (Stripe payment link)
```

**Contract decisions already confirmed (2026-04-28):**
- Governing law: Delaware
- Liability cap: 12 months of fees paid
- Data residency: US-based (AWS us-east-1 or equivalent)
- Indemnification: mutual, standard for service agreements
- Guarantees: performance-based, 98% follow-up SLA
- SLA credits: 10% credit per day of SLA violation

---

## STAGE 2.5 — Payment / Subscription Initiation

**Trigger:** Contract signed → payment setup

**Payment flow:**
```
1. CFO generates Stripe payment link based on tier:
   - Starter: $300/mo → Stripe Payment Link
   - Growth: $750/mo → Stripe Payment Link
   - Scale: $1,500/mo → Stripe Payment Link
2. Payment link emailed to client
3. Client enters card → Stripe holds subscription
4. Stripe webhook fires → subscription.recorded event
5. Supabase subscription table updated:
   - client_id, stripe_subscription_id, tier, status, next_billing_date
6. Client onboarding pipeline activated
```

**Stripe events handled:**
- `checkout.session.completed` → subscription activated
- `invoice.payment_succeeded` → billing cycle OK
- `invoice.payment_failed` → alert Ahmad, retry in 3 days
- `customer.subscription.deleted` → deactivate client, alert Ahmad

---

# ═══════════════════════════════════════════════════════════════
# PHASE 3 — PRODUCT ACTIVATION & OAUTH INTEGRATION FLOW
# ═══════════════════════════════════════════════════════════════

## STAGE 3.1 — HubSpot OAuth Initialization

**Trigger:** Trial client signs up OR paying client onboarding begins

**Required setup sequence:**
```
1. Client visits qiyadon.com/dashboard
2. Clicks "Connect HubSpot" button
3. Browser opens: https://app.hubspot.com/oauth/authorize
   - Parameters: client_id, redirect_uri, scope, response_type=code
4. Client logs into HubSpot → grants permissions
5. HubSpot redirects to: https://qiyadon.com/hubspot/callback?code=XXXXX
6. OAuth callback server (hub-oauth-v2.js on port 3003) receives code
7. Server exchanges code for tokens via HubSpot API:
   POST https://api.hubapi.com/oauth/v1/token
   Body: grant_type=authorization_code, code, client_id, client_secret, redirect_uri
8. HubSpot returns: access_token, refresh_token, expires_in
9. Server stores tokens in Supabase hubspot_connections table:
   - hub_id (their HubSpot account ID)
   - access_token (encrypted at rest)
   - refresh_token (encrypted at rest)
   - expires_at (token expiry timestamp)
   - connected_at (timestamp)
   - status: 'active'
10. Dashboard updated to show "HubSpot Connected" state
11. Follow-up engine can now read/write HubSpot contacts for this client
```

**HubSpot OAuth scopes requested:**
```
crm.objects.contacts.read      → read contact data
crm.objects.contacts.write     → update contact properties (cadence, status)
crm.objects.owners.read        → read HubSpot owners (for email routing)
crm.schemas.contacts.read      → read contact schema (for property mapping)
```

**Security model:**
- Tokens stored in Supabase `hubspot_connections` table (not in code)
- Access token expires in ~6 hours → refresh token used to rotate
- Refresh token rotation handled by hub-oauth server
- Per-client isolation: each client has unique hub_id

---

## STAGE 3.2 — OAuth Token Refresh Flow

**Trigger:** Access token expires (typically 6 hours after issue)

```
1. Follow-up engine makes HubSpot API call
2. HubSpot returns: 401 Unauthorized
3. Engine detects 401 → calls hub-oauth refresh endpoint
4. hub-oauth server reads refresh_token from Supabase
5. Exchanges refresh_token for new access_token:
   POST https://api.hubapi.com/oauth/v1/token
   Body: grant_type=refresh_token, refresh_token, client_id, client_secret
6. New tokens stored in Supabase (upsert)
7. Original API call retried with new token
8. If refresh fails → alert: "HubSpot re-authentication required"
   → Client receives email: "Please reconnect HubSpot"
   → Dashboard shows "Connection Expired — Reconnect"
```

**Auto-refresh schedule:**
- hub-oauth server monitors token expiry
- Background job runs every 5 hours → refresh tokens expiring within 2 hours
- No manual intervention needed for tokens under normal operation

---

## STAGE 3.3 — HubSpot Connection Health Monitoring

**Endpoint:** `GET /hubspot/status?hub_id={client_hub_id}`

**Health check performed:**
```
1. Check Supabase hubspot_connections for hub_id
2. If record missing → { connected: false }
3. If record exists but expires_at < now → token expired → { connected: false, expired: true }
4. If record exists + valid → test with lightweight API call:
   GET https://api.hubapi.com/crm/v3/objects/contacts?limit=1
   - If 200 → { connected: true, healthy: true }
   - If 403 → scopes lost → { connected: false, scopes_revoked: true }
   - If 429 → rate limited → { connected: true, healthy: false, rate_limited: true }
```

**Alert thresholds:**
- Token expired >24h → alert Ahmad via email
- API 403 errors >5 in 1 hour → pause engine for that client
- API 429 rate limit → back off 15 minutes, retry with exponential backoff

---

# ═══════════════════════════════════════════════════════════════
# PHASE 4 — ONBOARDING & SYSTEM PROVISIONING
# ═══════════════════════════════════════════════════════════════

## STAGE 4.1 — Onboarding Pipeline Activation

**Trigger:** Contract signed + payment confirmed + HubSpot connected

**Day 0 (Onboarding Initiated):**
```
1. COO receives onboarding alert
2. COO creates client record in Supabase:
   INSERT INTO clients (id, name, email, tier, hub_id, status, onboarding_started_at)
   VALUES (uuid, 'Acme Corp', 'john@acmecorp.com', 'growth', 'hub123', 'onboarding', NOW())
3. Client Onboarding Board initialized (TBD — Notion or Linear integration pending)
4. Onboarding email sent to client:
   Subject: "Welcome to Qiyadon — Here's What Happens Next"
   Body: Day 1–7 timeline, what we need from them, who their POC is
5. C-suite notified:
   - CTO: infrastructure provisioning
   - COO: pipeline setup
   - CFO: billing confirmed
   - CPO: dashboard configuration
   - CMO: client intro sequence initiated
```

---

## STAGE 4.2 — Day 1: Pipeline Intake

**Client delivers:**
- Lead list (CSV export from CRM, or direct HubSpot access)
- CRM access credentials (OAuth connected)
- Outreach context (current cadence, what's been tried, brand voice notes)
- Contact list format: name, email, company, last contact date, current status

**Intake processing:**
```
1. If CSV uploaded:
   → Parse CSV, validate rows (required: email, name)
   → Upsert each contact to HubSpot (create if new, update if existing)
   → Tag all imported leads with client_id in HubSpot custom property
2. If HubSpot OAuth connected:
   → Pull all open contacts from HubSpot where:
      - hs_lead_status NOT IN (["CLOSED", "BOOKED"])
      - AND last_activity_date < 30 days ago
   → Apply client tag to all pulled contacts
3. Record intake completion in Supabase:
   - intake_complete: true
   - intake_complete_at: NOW()
   - lead_count: {number}
4. Notify COO intake is complete
```

**Data isolation:**
- Each client's contacts tagged with unique `qiy_client_id` property in HubSpot
- Supabase queries always filtered by `client_id` — no cross-client data leakage
- Email sending scoped to client-specific contacts only

---

## STAGE 4.3 — Day 2: CRM & Follow-Up Configuration

**Follow-up engine configuration per client:**
```
1. CTO configures CLIENT_CADENCES map in followup-engine:
   {
     'client_uuid': {
       cadence: [
         { day: 1, subject: '...', bodyKey: 'intro' },
         { day: 3, subject: '...', bodyKey: 'followup1' },
         ...
       ],
       stalledDays: 14,
       sendFromEmail: 'client_brand@clientdomain.com' (optional override)
     }
   }
2. HubSpot custom properties initialized per client:
   - strtn_followup_cadence_day = 0 (all leads start at day 0)
   - strtn_last_followup_date = null
   - strtn_response_received = 'no'
   - strtn_escalated = 'no'
3. Client team added to HubSpot as collaboration users (optional)
4. Client receives Day 2 email:
   Subject: "Day 2 — CRM configured, here's your pipeline summary"
   Body: Number of leads imported, cadence activated, what to expect
```

**HubSpot custom properties required for engine:**
| Property | Type | Description |
|---|---|---|
| `strtn_followup_cadence_day` | Number | Current step (0, 1, 3, 7, 14, 21, 30) |
| `strtn_last_followup_date` | Date | Last email sent date |
| `strtn_last_email_subject` | String | Subject of last email |
| `strtn_response_received` | Single-line | "yes" / "no" |
| `strtn_escalated` | Single-line | "yes" / "no" |
| `strtn_lead_owner_email` | String | Client's sending email |
| `qiy_client_id` | Single-line | Qiyadon internal client identifier |

---

## STAGE 4.4 — Day 3: Follow-Up Sequences Approved

**Client receives:** Draft follow-up email sequences for review

**Sequence structure:**
- 6 emails per cadence (Day 1, 3, 7, 14, 21, 30)
- Customized based on client's industry, pain points, brand voice
- Client reviews → approves or requests changes
- Approved sequences stored in Supabase `client_sequences` table

**Approval workflow:**
```
1. CMO drafts sequences based on:
   - Client industry (MSP, SaaS, professional services)
   - Client's specific pain points
   - Qiyadon's proven templates
2. CMO sends to client via email:
   Subject: "Your follow-up sequences — please review and approve"
3. Client reviews → replies with approval or change requests
4. CMO incorporates feedback → final sequences stored
5. COO notified → sequences go live
6. Follow-up engine loads sequences on Day 4
```

---

## STAGE 4.5 — Days 4–6: Follow-Up Engine Activates

**Trigger:** Sequences approved → engine starts executing

**Hourly cron job:** `pm2 start ecosystem-followup.config.js --cron "0 * * * *"`

**Each hourly run executes:**
```
1. Get all active clients with HubSpot connections
2. For each client:
   a. Fetch all open leads from HubSpot (where strtn_response_received != 'yes')
   b. For each lead:
      - Read strtn_followup_cadence_day (current step)
      - Read strtn_last_followup_date
      - Calculate days since last touch
      - Determine if next cadence step is due
      - If due → send follow-up email
      - After sending → update HubSpot properties:
        * strtn_followup_cadence_day = next_step
        * strtn_last_followup_date = NOW()
        * strtn_last_email_subject = {subject sent}
      - Log to Supabase pipeline_activity table
   c. Check for stalled leads (no response in stalledDays):
      - If strtn_last_followup_date < (NOW - stalledDays) AND strtn_response_received = 'no'
      - → Set strtn_escalated = 'yes'
      - → Send escalation alert to client
      - → Log escalation in Supabase
```

**Idempotency guarantee:**
- Engine is idempotent — safe to run every hour
- Before sending, checks if email already sent today for this lead
- Duplicate send prevention: compares strtn_last_followup_date + cadence gap

---

## STAGE 4.6 — Day 7: First Weekly Report Delivered

**Trigger:** Weekly cron (Saturday 07:00 Berlin) → weekly report generated

**Report generation process:**
```
1. Weekly report job runs:
   node weekly-report.js --client {client_id} --week {week_number}
2. Engine queries Supabase for week's data:
   - Total leads in pipeline
   - Emails sent (by cadence step)
   - Responses received
   - Escalations triggered
   - Leads that went hot (response received)
   - Leads that went dormant (30+ days, no response)
3. Report compiled from templates:
   - Growth tier: HTML email + PDF
   - Scale tier: Full presentation deck
4. Report delivered:
   - Email to client contact: ahmad.salim@qiyadon.com
   - Stored in Supabase reports table
   - Link shared via dashboard
5. Report archived:
   - /strateon/followup-engine/reports/{client}/{YYYY-MM-DD}-report.html
   - Also committed to git for audit trail
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 5 — ACTIVE PRODUCT OPERATION (LIVE SYSTEM)
# ═══════════════════════════════════════════════════════════════

## STAGE 5.1 — Core Follow-Up Engine (Hourly Cron)

**Process manager:** PM2 `ecosystem-followup.config.js`
**Cron expression:** `0 * * * *` (top of every hour, 24/7)
**Runtime:** Node.js (JavaScript/ES modules)
**Idempotency:** Yes — safe to run every hour

**Hourly execution flow:**
```
CRON TRIGGER (every hour :00)
    ↓
Read all active clients from Supabase clients table
    ↓
For each client:
    ↓ Fetch open leads from HubSpot (API call)
    ↓ For each lead:
        ├─ Check if responded (strtn_response_received == 'yes')
        │   └─ YES → skip (lead is alive, cadence paused)
        ├─ Check if escalated (strtn_escalated == 'yes')
        │   └─ YES → skip (human review, no auto follow-up)
        ├─ Calculate next cadence step
        │   └─ Read: strtn_followup_cadence_day
        │   └─ Compute: days_since_last = today - strtn_last_followup_date
        │   └─ If days_since_last >= cadence_gap → send now
        ├─ Send follow-up email (SMTP 587 STARTTLS)
        │   ├─ From: contact@qiyadon.com (or client-specific)
        │   ├─ To: lead's email from HubSpot
        │   ├─ Subject: cadence step's subject
        │   └─ Body: cadence step's HTML template (personalized)
        ├─ Update HubSpot contact properties:
        │   ├─ strtn_followup_cadence_day = next_step
        │   ├─ strtn_last_followup_date = NOW()
        │   └─ strtn_last_email_subject = subject
        ├─ Log to Supabase pipeline_activity:
        │   ├─ lead_id, client_id, activity_type: 'email_sent'
        │   ├─ description: subject, created_at: NOW()
        ├─ Check stalled threshold:
        │   ├─ If days_since_last > stalledDays AND !responded
        │   ├─ → Set strtn_escalated = 'yes' in HubSpot
        │   ├─ → Log to Supabase pipeline_activity (type: 'escalated')
        │   └─ → Send client alert email
        └─ Move to next lead
    ↓ Move to next client
    ↓ Log completion to: /logs/{YYYY-MM-DD}.log
```

---

## STAGE 5.2 — Response Detection & Webhook Architecture

**Endpoint:** `response-webhook.js` (PM2 process `response-webhook` on port 3002)
**Route:** `POST /followup-response`

**Trigger:** Lead replies to any follow-up email

**Email routing flow:**
```
Lead's email client replies to: contact@qiyadon.com
    ↓
Mail server (neo.space, port 587) receives reply
    ↓
Postfix/SMTP forwards to local mailbox OR
SendGrid/Mailgun webhook fires: POST https://qiyadon.com/followup-response
    ↓
response-webhook.js receives POST request:
{
  "from": "lead@prospectcompany.com",
  "subject": "Re: Following up on your pipeline",
  "body_text": "Hi, I'd love to chat. Can you send me a time?"
}
    ↓
Lookup: Find lead in HubSpot by email address
    ↓
Update HubSpot contact:
  - strtn_response_received = 'yes'
  - hs_lead_status = 'IN_CONTACT' (or custom 'RESPONDED')
  - last_contact_date = NOW()
    ↓
Log to Supabase pipeline_activity:
  { lead_id, client_id, activity_type: 'reply_received', description: '...', created_at: NOW() }
    ↓
Dashboard auto-updates via Supabase Realtime subscription
    ↓
Client dashboard shows lead moved from active cadence → "Responded"
```

**Response tracking states:**
```
Lead lifecycle states (HubSpot contact property: strtn_response_received):
  'no'          → Default, in cadence
  'yes'         → Lead replied, cadence paused, human takes over
  'escalated'   → No response after stalledDays, human review required
```

---

## STAGE 5.3 — Dashboard Real-Time Updates (Supabase Realtime)

**Dashboard:** `qiyadon.com/dashboard` (public/dashboard.html)
**Data layer:** Supabase `pipeline_leads` + `pipeline_activity` tables

**Realtime subscription:**
```javascript
const channel = supabase.channel('pipeline-live')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pipeline_leads'
  }, handleLeadChange)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pipeline_activity'
  }, handleActivityChange)
  .subscribe();
```

**What happens when a lead changes:**
```
Follow-up engine sends email
    ↓
Engine writes to HubSpot AND Supabase pipeline_leads:
  - status: 'warm' (default) → 'hot' (if replied) → 'dormant' (if 30+ days no contact)
  - last_touch: NOW()
  - cadence_day: incremented
    ↓
Supabase fires postgres_changes webhook
    ↓
Dashboard channel receives change event
    ↓
handleLeadChange() re-renders pipeline board:
  - Hot/Warm/Cold/Dormant columns updated
  - Stats row (total, hot, response rate, escalations) updated
  - Activity feed updated
    ↓
Dashboard UI re-renders in < 1 second (no page refresh)
```

**Dashboard stats computed in real-time:**
```
Total leads:    COUNT(pipeline_leads WHERE client_id = X)
Hot leads:      COUNT(pipeline_leads WHERE status = 'hot')
Response rate:   COUNT(responded) / COUNT(total) * 100
Escalations:    COUNT(pipeline_leads WHERE escalated = true)
```

---

## STAGE 5.4 — Client Dashboard (qiyadon.com/dashboard)

**Who sees it:** Qiyadon internal team (primary), clients (future phase)

**Dashboard sections:**

1. **Stats Row** (4 cards)
   - Total Leads — count from Supabase
   - Hot Leads — leads with response in last 7 days
   - Response Rate — % of leads who replied in last 30 days
   - Escalations — leads needing human review

2. **Pipeline Board** (4 columns)
   - 🔥 Hot: leads with response_received = true
   - 🌡 Warm: leads mid-cadencele, no response yet
   - ❄️ Cold: leads 14+ days into cadence, no response
   - 💤 Dormant: leads 30+ days, no response, likely lost

3. **Recent Activity Feed**
   - Real-time log of all engine actions
   - Types: email_sent, reply_received, escalated, lead_hot
   - Updates via Supabase Realtime — no page refresh

4. **Response Metrics**
   - Open rate, reply rate, meeting booked %
   - Computed from pipeline_activity table

5. **HubSpot Connection Status**
   - Green dot: connected + healthy
   - Orange: token expiring soon
   - Red: re-auth required

---

## STAGE 5.5 — Email Sequencing & Cadence Logic

**Current default cadence (6 steps):**
| Day | Email | Purpose |
|---|---|---|
| 1 | Intro | Start conversation, offer value |
| 3 | Follow-up 1 | Quick ping, keep it light |
| 7 | Value-add | Share benchmark data, show insight |
| 14 | Check-in | Low-pressure touch |
| 21 | Pivot | New angle on the problem |
| 30 | Final | Last note, then step back |

**Cadence logic pseudocode:**
```javascript
function nextCadenceStep(lead, clientConfig) {
  const currentDay = lead.strtn_followup_cadence_day || 0;
  const cadence = clientConfig.cadence; // array of {day, subject, bodyKey}
  
  // Find the next step where day > currentDay
  const next = cadence.find(step => step.day > currentDay);
  return next || null; // null = cadence complete
}

function shouldSend(lead, cadenceStep) {
  if (lead.strtn_response_received === 'yes') return false; // already alive
  if (lead.strtn_escalated === 'yes') return false; // human is handling
  if (!cadenceStep) return false; // cadence complete

  const lastTouch = new Date(lead.strtn_last_followup_date);
  const daysSince = (Date.now() - lastTouch) / (1000 * 60 * 60 * 24);
  const gap = cadenceStep.day - (lead.strtn_followup_cadence_day || 0);

  return daysSince >= gap;
}
```

**Per-client cadence override:**
```javascript
const CLIENT_CADENCES = {
  'client_uuid_here': {
    stalledDays: 10,  // more aggressive
    cadence: [
      { day: 1, subject: 'Custom intro', bodyKey: 'custom-intro' },
      { day: 5, subject: 'Final reminder', bodyKey: 'final' },
    ]
  }
};
```

---

## STAGE 5.6 — Failure Handling & Recovery

**Failure categories and recovery:**

### A. HubSpot API Failure
```
Symptoms:
  - API returns 401 (auth), 403 (scopes lost), 429 (rate limit), 5xx (server error)

Recovery:
  - 401 → trigger token refresh → retry once → if still 401 → alert Ahmad
  - 403 → alert: "HubSpot scopes revoked — please reconnect"
  - 429 → back off 15 min → retry → max 3 retries → then pause client engine
  - 5xx → retry in 5 min → exponential backoff → max 3 retries → then alert
```

### B. SMTP Email Failure
```
Symptoms:
  - Nodemailer throws error (connection refused, relay denied, etc.)

Recovery:
  - Log failure to: /logs/{date}-email-failures.log
  - Increment failure counter for this lead
  - If failures >= 3 for this lead → pause email, alert Ahmad
  - On next engine run → check failures, resume if resolved
  - Supabase pipeline_activity logged with type: 'email_failed'
```

### C. Supabase Write Failure
```
Symptoms:
  - Supabase returns error on activity log write

Recovery:
  - Email and HubSpot update still succeed (they don't depend on Supabase)
  - Supabase failure logged locally
  - Retry on next hourly run
  - If persistent → alert Ahmad
```

### D. Lead Not Found in HubSpot
```
Symptoms:
  - Contact deleted from HubSpot while in active cadence

Recovery:
  - Log: "Lead not found in HubSpot — removing from pipeline"
  - Mark as 'removed' in Supabase
  - No further follow-up attempted
  - No alert needed (normal churn)
```

### E. Duplicate Email Prevention
```
Symptoms:
  - Engine runs twice within same hour (double-trigger)

Recovery:
  - Idempotency check: compare strtn_last_followup_date to today
  - If last_followup_date is today → skip (already sent)
  - No duplicate emails possible regardless of cron overlap
```

---

## STAGE 5.7 — Escalation Workflow

**Trigger:** Lead has no response after `stalledDays` (default 14, configurable)

**Escalation sequence:**
```
1. Engine detects: days_since_last > stalledDays AND response != 'yes'
2. Engine updates HubSpot:
   - strtn_escalated = 'yes'
   - hs_lead_status = 'ESCALATED' (custom status)
3. Engine logs to Supabase:
   - type: 'escalated'
   - description: 'No response after {stalledDays} days — escalated'
4. Alert sent to client:
   - To: client's contact email
   - Subject: "[Escalation] Lead requires attention — {lead_name}"
   - Body: Lead details, last contact, recommended action
5. Alert sent to Qiyadon internal:
   - To: ahmad.salim@qiyadon.com
   - Subject: "[Qiyadon Escalation] {client} — {lead_name}"
   - Body: Full lead context + client dashboard link
6. Dashboard updates:
   - Lead shown in "Escalated" state
   - Escalation count in stats row increments
```

**Escalation resolution:**
```
Human reviews escalated lead
    ↓
Decision: re-engage / close / transfer
    ↓
HubSpot updated:
  - strtn_escalated = 'no' (if re-engaging)
  - OR hs_lead_status = 'CLOSED' (if closing)
    ↓
Follow-up engine resumes normal cadence or stops (based on decision)
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 6 — REPORTING PIPELINE & CUSTOMER COMMUNICATION
# ═══════════════════════════════════════════════════════════════

## STAGE 6.1 — Weekly Report Generation (Every Saturday 07:00 Berlin)

**Trigger:** Cron job `qiyadon-weekly-report` fires every Saturday 07:00 Berlin

**Process:**
```
1. Cron fires → spawns weekly-report subagent
2. For each active client:
   a. Query Supabase pipeline_leads WHERE client_id = X
   b. Query Supabase pipeline_activity WHERE client_id = X AND created_at > (today - 7 days)
   c. Compute metrics:
      - Pipeline size: total leads
      - Cadence performance: emails sent by day
      - Response rate: replies / emails sent
      - Hot leads: new responses this week
      - Escalations: count of escalations
      - Dormant leads: 30+ days no contact
   d. Generate report HTML from template
   e. Email to client contact
   f. Store in Supabase reports table
   g. Store in: /reports/{client}/{YYYY-MM-DD}-WEEKLY-REPORT.html
   h. Commit to git (audit trail)
```

**Report sections:**
1. Executive Summary (one paragraph — pipeline health at a glance)
2. Pipeline Snapshot (total leads, hot, warm, cold, dormant)
3. This Week's Activity (emails sent, responses, new escalations)
4. Response Rate Trend (7-day rolling)
5. Leads Needing Attention (escalated + dormant)
6. Week-over-Week Comparison
7. Recommended Actions (AI-generated next steps)

---

## STAGE 6.2 — Friday Board Report (Every Friday)

**Trigger:** Cron job `qiyadon-csuite-morning` fires Friday 07:00 Berlin

**C-suite (CMO, CTO, CFO, COO, CPO, CLA) morning spawn:**
```
Each role receives:
  - Previous week's performance data (from Supabase)
  - Client updates (from HubSpot)
  - Task list for the week
  - Revenue pipeline status

CMO: Content calendar advancement, LinkedIn posts, pipeline report
CTO: System health, HubSpot OAuth, dashboard enhancements
CFO: Revenue status, payment issues, financial model update
COO: Client onboarding status, escalation review, pipeline health
CPO: Product enhancements, threat response, feature backlog
CLA: Contract review, compliance check, legal issues
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 7 — DATA ARCHITECTURE & PERSISTENCE
# ═══════════════════════════════════════════════════════════════

## STAGE 7.1 — Supabase Schema

**Tables:**

```sql
-- Client master record
clients (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  tier TEXT, -- 'starter' | 'growth' | 'scale'
  hub_id TEXT, -- HubSpot account ID
  status TEXT, -- 'onboarding' | 'active' | 'paused' | 'churned'
  created_at TIMESTAMPTZ,
  onboarded_at TIMESTAMPTZ
)

-- HubSpot OAuth tokens (per client)
hubspot_connections (
  id SERIAL PRIMARY KEY,
  hub_id TEXT UNIQUE, -- HubSpot account ID
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
)

-- Pipeline leads (mirrored from HubSpot for dashboard speed)
pipeline_leads (
  id SERIAL PRIMARY KEY,
  client_id TEXT,
  hub_id TEXT,
  contact_id TEXT,
  name TEXT,
  email TEXT,
  company TEXT,
  status TEXT DEFAULT 'warm', -- 'hot' | 'warm' | 'cold' | 'dormant'
  cadence_day INTEGER DEFAULT 0,
  last_touch TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT FALSE,
  escalated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- All engine activity (append-only log)
pipeline_activity (
  id SERIAL PRIMARY KEY,
  lead_id TEXT,
  client_id TEXT,
  activity_type TEXT, -- 'email_sent' | 'reply_received' | 'escalated' | 'lead_hot'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Weekly reports
reports (
  id SERIAL PRIMARY KEY,
  client_id TEXT,
  report_date DATE,
  report_type TEXT, -- 'weekly' | 'monthly'
  html_content TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Subscriptions (billing)
subscriptions (
  id SERIAL PRIMARY KEY,
  client_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT,
  status TEXT, -- 'active' | 'past_due' | 'canceled'
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## STAGE 7.2 — Data Flow Diagram

```
[Visitor] → [qiyadon.com] → [Form Submit] → [server.js:3001] → [HubSpot CRM]
                                                        ↓
                                                 [Supabase DB]
                                                        ↓
                                            [Follow-up Engine]
                                                        ↓
                           [HubSpot API] ← → [Email (SMTP 587)]
                                                        ↓
                                              [pipeline_activity log]
                                                        ↓
                                              [Dashboard (Realtime)]
                                                        ↓
                                              [Weekly Report Generator]
                                                        ↓
                                                 [Email to Client]
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 8 — AUTONOMOUS CONTINUITY & OPERATIONAL SUSTAINABILITY
# ═══════════════════════════════════════════════════════════════

## STAGE 8.1 — PM2 Process Management

**All services managed by PM2 (process manager):**

| Process | Name | Port | Cron | Purpose |
|---|---|---|---|---|
| openclaw-gateway | `openclaw-gateway` | — | Always on | Main AI gateway |
| moosa-worker | `moosa-worker` | — | Always on | Main AI worker |
| qiyadon-audit-form | `qiyadon-audit-form` | 3001 | Always on | Form handler |
| response-webhook | `response-webhook` | 3002 | Always on | Email response detection |
| hub-oauth | `hub-oauth` | 3003 | Always on | HubSpot OAuth flow |
| strateon-followup-engine | (stopped) | — | Hourly cron | Follow-up engine (disabled until client) |
| Business Disruptor | (cron) | — | Saturday 07:00 | Competitor intel |
| C-suite Morning | (cron) | — | Daily 07:00 | Morning spawn |

**Auto-restart:** All PM2 processes restart automatically on failure
**Startup:** `pm2 save` → processes restored on server reboot
**Logging:** All stdout/stderr → `/root/.pm2/logs/`

---

## STAGE 8.2 — Git-Based Audit Trail

**All significant events committed to git:**
```
/strateon/followup-engine/reports/{client}/{YYYY-MM-DD}-REPORT.html
/strateon/csuite/{ROLE}/SESSION-STATES/{YYYY-MM-DD}-{NNN}.md
/strateon/business-disruptor/COMPETITOR-INTEL-{YYYY-MM-DD}.md
```

**Why git:** Tamper-evident audit log. Every report, every decision, every session state committed with timestamp. Cannot be altered retroactively.

---

## STAGE 8.3 — Session & State Persistence

**C-suite state persistence (solved May 3):**
```
Previous problem: C-suite agents stopped, progress lost, sessions not recoverable
Solution: SESSION-STATE files

Every C-suite session ends with:
  → Write state file: /strateon/csuite/{ROLE}/SESSION-STATES/{DATE}-{NNN}.md
  → Contents: what was accomplished, what's blocked, next actions, files created

Every C-suite session starts with:
  → Read most recent SESSION-STATE.md for that role
  → CEO reviews state before spawning
  → Spawn with full context injected + explicit task
```

**Full spawn protocol:** `strateon/csuite/SPAWN-PROTOCOL.md`

---

## STAGE 8.4 — C-Suite Roles & Responsibilities

| Role | Domain | Key Systems |
|---|---|---|
| **CTO** | Technical infrastructure, hosting, DNS, GitHub, Cloudflare Pages, HubSpot OAuth, PM2 | server.js, hub-oauth, response-webhook, Cloudflare, GitHub |
| **CMO** | Marketing, content, LinkedIn, blog, Reddit, GIR response | Content calendar, LinkedIn posts, GIR execution |
| **CFO** | Finance, pricing, contracts, billing, Stripe | Stripe integration, payment links, financial model |
| **COO** | Pipeline operations, onboarding, service delivery, client success | Follow-up engine, HubSpot, Supabase, reports |
| **CPO** | Product, follow-up engine, cadence design, feature development | followup-engine.js, response-webhook.js, dashboard |
| **CLA** | Legal, contracts, compliance, data privacy | CSA, DPA, GDPR compliance |
| **CEO (Moosa)** | Strategy, oversight, C-suite coordination, decisions, MEMORY.md | MEMORY.md, orchestration |

---

# ═══════════════════════════════════════════════════════════════
# PHASE 9 — ONGOING AUTONOMOUS EXECUTION
# ═══════════════════════════════════════════════════════════════

## STAGE 9.1 — Daily C-Suite Morning Spawn (07:00 Berlin)

**Cron:** `qiyadon-csuite-morning` → fires 07:00 Berlin every day

**Spawn sequence:**
```
1. CEO (Moosa) reviews MEMORY.md
2. CEO reads previous day SESSION-STATES (CTO, CMO, CFO, COO, CPO, CLA)
3. CEO determines today's priorities
4. CEO spawns 7 C-suite agents simultaneously (isolated sessions)
   - Each receives: role domain + current state + today's tasks
   - Each executes within their domain
   - Each writes SESSION-STATE on completion
5. All SESSION-STATEs read by CEO
6. CEO produces morning report for Ahmad (WhatsApp)
   - Yesterday's accomplishments per role
   - Today's tasks per role
   - Blockers / decisions needed from Ahmad
```

**Deliverable:** Ahmad receives WhatsApp morning report at 07:00 Berlin daily

---

## STAGE 9.2 — Business Disruptor (Saturday 07:00 Berlin)

**Cron:** `qiyadon-business-disruptor` → fires Saturday 07:00 Berlin

**Output:** `strateon/business-disruptor/COMPETITOR-INTEL-{YYYY-MM-DD}.md`
**Format:** Technological threat assessment (NOT internal audit)
**Threats assessed:**
- End-to-end AI outbound agents (Artisan, AiSDR, 11x)
- Real-time CRM-native pipeline intelligence (Clari, Gong)
- Self-serve trial + automated close
- Instant 60-minute onboarding
- Autonomous 30-touch adaptive sequences
- Predictive pipeline health engine
- Vertical-specific models

**Format change (2026-05-09):** Removed internal checklist audit → replaced with technology/product threat analysis as originally intended

---

## STAGE 9.3 — AI Memory & Continuity

**MEMORY.md (long-term):**
- Curated, distilled learnings — not raw session logs
- Updated after every significant decision
- Contains: Vision, Mission, Key Decisions, Completed Assets, OPERATIONAL-ASSETS

**Daily memory files:** `memory/YYYY-MM-DD.md`
- Raw session logs per day
- Subagent SESSION-STATE summaries
- Pending commitments tracked
- End-of-day state carry-forward

**HEARTBEAT.md checklist (every 30 min):**
- Check email for urgent messages
- Check calendar for upcoming events
- Check git status for uncommitted changes
- Check today's memory file exists
- Check Pending Commitments

---

# ═══════════════════════════════════════════════════════════════
# PHASE 10 — SYSTEM INTERDEPENDENCIES & REQUIREMENTS
# ═══════════════════════════════════════════════════════════════

## STAGE 10.1 — External Service Dependencies

| Service | Used For | Key |
|---|---|---|
| HubSpot | CRM, lead data, contact properties, OAuth | Primary client data store |
| Supabase | Pipeline data, activity logs, OAuth tokens, dashboards | Primary data layer |
| SendGrid/Mailgun or direct SMTP | Email delivery (follow-ups, reports, alerts) | Port 587 STARTTLS |
| Cloudflare Pages | Website hosting (qiyadon.com) | GitHub deploy hook |
| Cloudflare | DNS, CDN, edge caching, DDoS protection | DNS zone: qiyadon.com |
| Google Fonts | Inter font for UI | CDN |
| Stripe | Subscription billing, payment links | Payment processing |
| GitHub | Code storage, deployment, audit trail | deploy/v2 branch |

## STAGE 10.2 — Environment Variables Required

```bash
# Supabase
SUPABASE_URL=https://btrbczqjwzuybgcxckvm.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_T1GYuCAvox2_...

# HubSpot
HUBSPOT_API_KEY=hubspot_api_key_here

# SMTP
SMTP_HOST=smtp0001.neo.space
SMTP_PORT=587
SMTP_USER=contact@qiyadon.com
SMTP_PASS=smtp_password_here

# Cloudflare
CLOUDFLARE_API_TOKEN=cfut_hx7Knx...

# Stripe (future)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## STAGE 10.3 — Infrastructure Ports

| Port | Process | Purpose |
|---|---|---|
| 80/443 | Cloudflare (external) | qiyadon.com traffic |
| 3001 | qiyadon-audit-form (PM2) | Form handler API |
| 3002 | response-webhook (PM2) | Email response webhook |
| 3003 | hub-oauth (PM2) | HubSpot OAuth server |

---

# ═══════════════════════════════════════════════════════════════
# PHASE 11 — KNOWN GAPS & OPEN TECHNICAL DEBT
# ═══════════════════════════════════════════════════════════════

## STAGE 11.1 — Production Gaps (Must Fix Before Scale)

| Gap | Status | Owner | Impact |
|---|---|---|---|
| HubSpot custom properties (strtn_*) not created | ❌ Not done | Ahmad (HubSpot dashboard) | Engine can't track cadence |
| Follow-up engine not writing to Supabase pipeline_leads | ❌ Not done | COO/CPO | Dashboard always shows demo/empty |
| Email/click webhooks not fully configured | ❌ Partial | CTO | Response detection relies on manual or SendGrid webhook |
| Stripe not connected | ❌ Not done | CFO | No payment processing |
| Delaware entity not registered | ❌ Not done | Ahmad | Blocks Stripe business account, contracts |
| WhatsApp inbound dead (session invalidated) | 🔴 Dead, needs re-auth | Ahmad | Inbound not working, re-auth via physical phone |

## STAGE 11.2 — Product Gaps (Threat Response)

| Enhancement | Addresses | Priority |
|---|---|---|
| Live dashboard → real-time (Supabase dual-write from engine) | Threat 2 (CRM-native intelligence) | HIGH |
| HubSpot OAuth one-click connect (auto-configuration) | Threat 4 (60-min onboarding) | HIGH |
| 5-lead instant trial onboarding | Threat 4 (instant onboarding) | HIGH |
| Adaptive cadence engine (AI-generated touches, not rule-based) | Threat 5 (30-touch adaptive) | MEDIUM |
| Lead enrichment module (Apollo/Hunter API) | Threat 1 (end-to-end outbound) | MEDIUM |
| Predictive pipeline health scoring | Threat 6 (predictive engine) | LOW |

## STAGE 11.3 — Data Assets (Long-term Moat)

**The proprietary moat is the follow-up outcome data:**
```
Every follow-up sent → logged
Every response received → logged
Every escalation → logged
Every deal outcome → logged

In 12 months: Qiyadon has structured data on:
  - What email subject lines generate responses by industry
  - What cadence steps work vs. don't work by lead source
  - Response rate patterns by company size, industry, CRM status
  - Optimal follow-up timing by deal age

Competitor can't buy this data. New entrant can't build it without 12+ months of clients.
```

---

# ═══════════════════════════════════════════════════════════════
# DOCUMENT END
# ═══════════════════════════════════════════════════════════════

**Next:** This document serves as the single source of truth for Qiyadon's operational architecture. All system changes must update this document. All new features must be mapped against this architecture before build.