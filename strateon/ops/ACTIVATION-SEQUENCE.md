# ACTIVATION SEQUENCE — Operational Checklist
**Client type:** evaluation-start (sign-trial on qiyadon.com)  
**Engine:** server.js (port 3001) + followup-engine.js  
**Data layer:** Supabase  
**Activation window:** 14 days  
**Kill switch:** followup-engine only activates clients with status='active'

---

## T+0 — SIGNUP IMMEDIATE
**Trigger:** Client submits sign-trial form → POST /submit-signature

| Field | Value |
|---|---|
| What QIYADON does | Stores signature record in Supabase `signatures` table. Sets `status='active'`. Calls `buildSignatureEmailHtml()` with redesign (see Task 1). Sends activation email immediately. |
| What CLIENT receives | **"Your evaluation is live — Day 1 begins now"** — the redesigned activation email (ACTIVATION INITIATED badge, pipeline assessment announced, 14-day timeline, CTA) |
| What CLIENT needs to do | Nothing. This is a start signal. |
| System | server.js (submit-signature handler) |
| Supabase | `signatures` row inserted, `status` = 'active', `agreedAt` timestamped |

---

## T+5 min — FOLLOWUP ENGINE DETECTS NEW ACTIVE LEAD
**Trigger:** followup-engine polling loop (interval: check every 60s or Supabase webhook on insert)

| Field | Value |
|---|---|
| What QIYADON does | Queries Supabase for `clients` rows where `status='active'` AND `activation_initiated=false`. For each new row: (1) set `activation_initiated=true`, (2) create `pipeline_lead` records from sign-trial data — name, email, company, signup type, agreedAt. (3) Log `pipeline_activity` entry: "ACTIVATION_INITIATED". |
| What CLIENT receives | Nothing yet — kickoff email fires at T+1h |
| What CLIENT needs to do | Nothing |
| System | followup-engine.js |
| Supabase | `clients.activation_initiated` set true; `pipeline_leads` rows created; `pipeline_activity` log row inserted |

---

## T+1h — KICKOFF / INTAKE EMAIL
**Trigger:** followup-engine scheduled task fires at T+1h for newly activated clients

| Field | Value |
|---|---|
| **Subject** | `Day 1 kickoff — your pipeline is already being assessed` |
| **Body** | "This is your Day 1 start signal from Qiyadon ops. Your evaluation window is open. Your pipeline is currently being assessed against your stated priorities from signup. We're not waiting for your reply — but we do need three things from you. Details below. The 14-day clock started the moment you signed." |
| CTA | "See what's happening right now →" (qiyadon.com) |
| What CLIENT receives | Kickoff/intake email from Qiyadon ops |
| What CLIENT needs to do | Review the three asks (see briefing email at T+24h if not actioned) |
| System | followup-engine.js → Nodemailer (server.js `transporter`) |
| Supabase | `pipeline_activity` log: "KICKOFF_EMAIL_SENT" |

---

## T+24h — ONBOARDING BRIEFING EMAIL
**Trigger:** followup-engine T+24h task for any client not yet flagged `briefing_sent=true`

| Field | Value |
|---|---|
| **Subject** | `Your activation briefing — 3 things we need to start` |
| **Body** | "24 hours in. Your pipeline assessment is underway. To move from activation to live execution, we need the following. If we already have them, we're already using them. If not, reply to this email with: (1) HubSpot CRM credentials — or confirm which CRM you're on. (2) A calendar link to schedule your kickoff call. (3) A list of your 25 most active leads to start with. Without these, your cadence will be drafted from your sign-trial data alone — we'll request them in 48h if we don't hear from you." |
| CTA | "Upload your lead list →" (placeholder link: qiyadon.com/upload or crm-connect) |
| What CLIENT receives | Briefing email with specific asks |
| What CLIENT needs to do | Reply with CRM credentials / calendar link / lead list, or wait for T+48h reminder |
| System | followup-engine.js |
| Supabase | `clients.briefing_sent=true`; `pipeline_activity`: "BRIEFING_EMAIL_SENT" |

---

## T+48h — REMINDER OR CADENCE DRAFT
**Branch A — No CRM connected:**
> **Subject:** `Reminder: we need your CRM access to run your evaluation`  
> **Body:** "48 hours in. We still don't have your HubSpot credentials. Your pipeline is assessed — but without live CRM data, we can't run your sequences on real leads. Reply to this email or visit qiyadon.com/crm-connect. If we don't hear from you by 72h, we'll draft your cadence from your sign-trial inputs and send it for review — you can add CRM data at any time."  
> **CTA:** "Connect HubSpot now →"

**Branch B — CRM connected:**
> **Subject:** `Your cadence is drafted — review it before we go live`  
> **Body:** "Good. Your CRM is connected. Our team has reviewed your pipeline and drafted your first follow-up cadence rules. We're ready to launch your sequences — pending your approval. Review the attached draft and reply with any changes, or reply APPROVED to go live immediately. If we don't hear from you in 24h, we'll launch with your sign-trial inputs and adjust based on first reports."  
> **CTA:** "Review cadence rules →"

| Field | Value |
|---|---|
| What CLIENT needs to do | Branch A: provide CRM credentials. Branch B: approve cadence or request changes |
| System | followup-engine.js (conditional logic checks `crm_connected` flag in Supabase) |
| Supabase | `pipeline_activity`: "CADENCE_DRAFT_SENT" or "CRM_REMINDER_SENT" |

---

## T+72h — CADENCE REVIEW REMINDER OR FIRST LIVE SEQUENCE BEGINS
**Branch A — Cadence not yet approved:**
> **Subject:** `Final reminder: your cadence is ready to go live`  
> **Body:** "72 hours in. Your evaluation clock is at Day 3. Your cadence draft is still pending your approval. We're ready to launch whenever you are. Reply APPROVED to go live now, or reply with changes. If we still don't hear from you by end of day tomorrow (Day 4), we'll activate your default cadence and run it — you'll see first results in your Day 7 pipeline report."  
> **CTA:** "Approve now →"

**Branch B — Cadence approved:**
> **Subject:** `Sequences are live — your pipeline is being worked`  
> **Body:** "Your cadence is approved. Qiyadon is now actively working your pipeline. First follow-up sequences are running against your active leads. Monitor your inbox — your first pipeline report arrives on Day 7. We'll escalate anything that needs your attention."  
> **CTA:** "View live pipeline →" (qiyadon.com)

| Field | Value |
|---|---|
| What CLIENT needs to do | Branch A: approve cadence or wait for default activation. Branch B: monitor inbox |
| System | followup-engine.js (activates `followup_sequences` for client) |
| Supabase | `clients.sequence_live=true`; `pipeline_activity`: "SEQUENCE_ACTIVATED" or "CADENCE_APPROVAL_REMINDER_SENT" |

---

## T+Day 4 — FIRST ESCALATION RULE TEST
**Trigger:** Automated followup-engine scheduled task**

| Field | Value |
|---|---|
| What QIYADON does | followup-engine fires test escalation alert for each active client — verifies that the escalation rule engine is working (e.g., if a lead goes cold for X hours, alert fires correctly). Logs test result to `pipeline_activity`. |
| What CLIENT receives | No external email. Internal verification only. |
| What CLIENT needs to do | Nothing |
| System | followup-engine.js (escalation test routine) |
| Supabase | `pipeline_activity`: "ESCALATION_TEST_FIRED" with test metadata |

---

## T+Day 7 — MID-EVALUATION CHECK — FIRST PIPELINE REPORT
**Trigger:** followup-engine scheduled task**

| Field | Value |
|---|---|
| **Subject** | `7 days in. Here's your first pipeline report.` |
| **Body** | "One week in. Here's your first operational snapshot from Qiyadon: leads contacted, response rates, cadence adherence, escalation flags. Your pipeline is being worked daily. Review this report. Anything that needs immediate attention — reply to this email. 7 days remain in your evaluation." |
| CTA | "Read full pipeline report →" |
| What CLIENT receives | First structured pipeline report email |
| What CLIENT needs to do | Review report, flag anything requiring immediate action, continue evaluating |
| System | followup-engine.js (aggregates `pipeline_leads` activity + `pipeline_activity` log into report) |
| Supabase | `pipeline_activity`: "MID_EVAL_REPORT_SENT"; report data stored/queried from `pipeline_leads` |

---

## T+Day 10 — "4 DAYS LEFT" — SCALE CONVERSION PROMPT
**Trigger:** followup-engine scheduled task**

| Field | Value |
|---|---|
| **Subject** | `4 days left. Are you ready to Scale?` |
| **Body** | "Day 10. 4 days remain in your evaluation. You've seen the pipeline in motion. You have the data. Is Qiyadon working for your pipeline? Here's where Scale comes in: we take over full execution — your CRM, your leads, your escalation rules, your strategy. You monitor the results. The question isn't whether the pipeline works. It's whether you're ready to let it run at scale. Reply SCALE to receive your Scale offer. Or reply any questions — we're still here." |
| CTA | "Explore Scale →" |
| What CLIENT needs to do | Respond with Scale intent or questions; or wait for Day 14 summary |
| System | followup-engine.js |
| Supabase | `pipeline_activity`: "SCALE_PROMPT_SENT" |

---

## T+Day 14 — EVALUATION SUMMARY + SCALE OFFER DELIVERY
**Trigger:** followup-engine scheduled task**

| Field | Value |
|---|---|
| **Subject** | `Day 14 — your evaluation results are ready` |
| **Body** | "Your 14-day evaluation is complete. Here's the full summary: leads touched, response rate, escalations handled, cadence performance, net pipeline movement. This is your scorecard. Qiyadon was built for this. If you're ready to Scale — we activate your full execution stack on Day 15. Reply SCALE to activate. Reply with questions. Or reply STOP if you're done, and we'll close your evaluation cleanly. Either way, the data is yours." |
| CTA | "Activate Scale — start Day 15 →" (Scale offer landing / qiyadon.com/scale) |
| What CLIENT needs to do | Review results, decide on Scale, reply accordingly |
| System | followup-engine.js + server.js (if SCALE response received → triggers scale-opt-in flow) |
| Supabase | `clients.evaluation_complete=true`; `pipeline_activity`: "EVALUATION_SUMMARY_DELIVERED"; if Scale accepted → `status` updated to 'scale', `type` updated to 'scale-opt-in' |

---

## SUPPABASE SCHEMA REQUIREMENTS

### clients table additions
```sql
status              TEXT DEFAULT 'active'   -- 'active' | 'evaluation' | 'scale' | 'churned'
activation_initiated BOOLEAN DEFAULT false
crm_connected       BOOLEAN DEFAULT false
briefing_sent       BOOLEAN DEFAULT false
cadence_approved    BOOLEAN DEFAULT false
sequence_live       BOOLEAN DEFAULT false
evaluation_complete BOOLEAN DEFAULT false
evaluation_start_at TIMESTAMPTZ             -- set at T+0
```

### pipeline_leads (new table)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
client_id       UUID REFERENCES clients(id),
name            TEXT,
email           TEXT,
company         TEXT,
signup_type     TEXT,          -- 'evaluation-start'
status          TEXT DEFAULT 'pending',  -- 'pending' | 'active' | 'contacted' | 'escalated' | 'converted'
created_at      TIMESTAMPTZ DEFAULT now()
```

### pipeline_activity (new table)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
client_id       UUID REFERENCES clients(id),
event           TEXT,   -- e.g. 'ACTIVATION_INITIATED', 'KICKOFF_EMAIL_SENT', etc.
timestamp       TIMESTAMPTZ DEFAULT now(),
metadata        JSONB DEFAULT '{}'
```

---

## OPERATIONAL NOTES

- All times are relative to `clients.evaluation_start_at = agreedAt` timestamp from sign-trial submission
- followup-engine must be idempotent — re-running a T+milestone check must not re-send already-sent emails (use boolean flags on `clients` row)
- Day 4 escalation test is **internal verification only** — client does not receive this email
- The "CRM not connected" branch at T+48h and T+72h requires `clients.crm_connected` to be set manually in Supabase if client provides credentials out-of-band, or via a future CRM OAuth connector
- Scale response (client replies "SCALE") triggers server.js `submit-signature` with `type='scale-opt-in'` — this routes to existing scale flow
- If client replies "STOP", set `clients.evaluation_complete=true` and `status='churned'`, log `pipeline_activity`: 'EVALUATION_STOPPED_BY_CLIENT'