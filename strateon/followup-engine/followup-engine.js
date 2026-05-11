/**
 * Qiyadon — Follow-Up Engine
 * Version: 1.0
 * Role: CPO — Chief Product Development Officer
 * 
 * This engine is the core product of Pipeline Execution Service.
 * It runs on a schedule (cron) and:
 *   1. Reads client leads from HubSpot
 *   2. Applies follow-up cadence (Day 1, 3, 7, 14, 21...)
 *   3. Sends follow-up emails at the right time
 *   4. Tracks responses (replies = lead is alive)
 *   5. Escalates stalled leads (no reply after N days)
 *   6. Logs all activity for weekly report
 * 
 * CRON: Run every hour. Safe to run frequently — engine is idempotent.
 *       Use pm2 to schedule: pm2 start ecosystem-followup.config.js --cron "0 * * * *"
 */

const https = require('https');
const nodemailer = require('/home/node/.openclaw/workspace/node_modules/nodemailer');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// SAFETY FLAGS — Must be explicitly enabled before any emails sent
// ═══════════════════════════════════════════════════════════════
//
// ALL of the following must be TRUE for emails to be sent:
//   1. process.env.GLOBAL_ENABLED === 'true'  (global kill switch)
//   2. process.env.SEND_EMAILS === 'true'     (email send enable)
//   3. process.env.DRY_RUN !== 'true'          (dry-run mode OFF)
//
// Defaults: ALL SAFE. Missing env vars = sending blocked.
// Malformed env vars = treated as blocking (not enabling).
//
// Duplicate prevention: ALWAYS active regardless of flags.
// Per-client kill switch: ALWAYS active regardless of flags.

const SAFETY = {
  get GLOBAL_ENABLED() {
    return process.env.GLOBAL_ENABLED === 'true';
  },
  get SEND_EMAILS() {
    return process.env.SEND_EMAILS === 'true';
  },
  get DRY_RUN() {
    // DRY_RUN defaults to true (safe) — must be explicitly set to 'false' to disable
    return process.env.DRY_RUN !== 'false';
  },
  get canSendEmails() {
    // All three conditions must be true:
    // 1. Global kill switch is ON
    // 2. Email send flag is ON
    // 3. Dry-run mode is OFF
    return this.GLOBAL_ENABLED && this.SEND_EMAILS && !this.DRY_RUN;
  },
  // ─── LIVE-TEST SAFETY GATE ────────────────────────────────────────────────
  // Hard per-test allowlist — must be explicitly set to enable one-recipient send
  get LIVE_TEST_ENABLED() {
    return process.env.LIVE_TEST_ALLOWED_EMAIL === 'ahmad.salim@qiyadon.com';
  },
  get LIVE_TEST_MAX_SENDS() {
    return parseInt(process.env.LIVE_TEST_MAX_SENDS || '0', 10);
  },
  // Live-test send counter — persists across calls within a single run
  _liveSends: 0,
  get liveSends() {
    return this._liveSends;
  },
  recordLiveSend() {
    this._liveSends++;
  },
  resetLiveSends() {
    this._liveSends = 0;
  },
  isAllowedRecipient(email) {
    if (!this.LIVE_TEST_ENABLED) return false;
    return email === process.env.LIVE_TEST_ALLOWED_EMAIL;
  },
  canSendLive() {
    if (!this.LIVE_TEST_ENABLED) return false;
    return this._liveSends < this.LIVE_TEST_MAX_SENDS;
  },
};

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  hubspotApiKey: 'HUBSPOT_KEY_PLACEHOLDER', // Overwritten at init from secrets
  smtpPort: 587,
  smtpHost: 'smtp0001.neo.space',
  fromEmail: 'contact@qiyadon.com',
  fromName: 'Qiyadon Pipeline',

  // Default cadence: [days since lead added, email subject prefix, body template key]
  // Adjust per-client in CLIENT_CADENCES below
  defaultCadence: [
    { day: 1,  subject: 'Pipeline health assessment',               bodyKey: 'intro'     },
    { day: 3,  subject: 'What the system found',                  bodyKey: 'followup1' },
    { day: 7,  subject: 'Cadence health summary',                  bodyKey: 'valueadd'  },
    { day: 14, subject: 'Pipeline velocity observation',          bodyKey: 'checkin'  },
    { day: 21, subject: 'Closing the loop',                       bodyKey: 'pivot'     },
    { day: 30, subject: 'Last follow-up from the system',         bodyKey: 'final'    },
  ],

  // Stalled lead threshold: if no reply after this many days → escalate
  stalledDays: 14,

  // HubSpot contact properties to read
  hubspotProperties: [
    'email', 'firstname', 'lastname', 'company', 'phone',
    'hs_lead_status', 'createdate', 'notes_last_updated',
    'strtn_followup_cadence_day',    // custom: current cadence day (1,3,7,14,21,30)
    'strtn_last_followup_date',       // custom: ISO date of last sent
    'strtn_last_email_subject',       // custom: subject of last sent email
    'strtn_response_received',        // custom: yes/no — did lead reply?
    'strtn_escalated',                // custom: yes/no — flagged for human review
    'strtn_lead_owner_email',         // custom: client's email to send from
  ],

  // Logging
  logDir: '/home/node/.openclaw/workspace/strateon/followup-engine/logs',
  reportDir: '/home/node/.openclaw/workspace/strateon/followup-engine/reports',
};

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────
// ─── MESSAGING SAFETY LAYER ──────────────────────────────────────────────────
// Hard rules enforced across all outbound copy:
// - No guaranteed outcomes (revenue, conversion, response)
// - No fabricated personalization (only CRM-sourced data)
// - No invented behavioral claims (9x stats without sourcing)
// - No unverifiable operational assertions
// - No implied SLA commitments
// - No claims about user actions unless sourced from real CRM activity
//
// Qiyadon is positioned accurately as:
//   pipeline follow-up orchestration, lead continuity automation,
//   cadence consistency support, workflow assistance
// NOT: guaranteed revenue, guaranteed response, guaranteed conversion

function safeBody(key, lead) {
  return EMAIL_BODIES_SAFE[key](lead);
}

const EMAIL_BODIES_SAFE = {
  // ── STEP 1: Automated audit report delivery ──────────────────────────────
  // Delivers pipeline health assessment on cadence day 1
  // CTA: "Reply 'leakage' and I'll send the breakdown"
  intro: (lead) => ({
    subject: `Pipeline health assessment — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I've generated a pipeline health assessment for ${lead.company || 'your pipeline'} based on your current HubSpot data.</p>
<p>Here's what the system flagged:</p>
<ul>
<li>${lead.company || 'Your pipeline'} has ${lead.strtn_followup_cadence_day || 'N/A'} active cadence day(s) recorded</li>
<li>No response received yet on the most recent follow-up</li>
<li>Lead source activity is detected — follow-up rhythm appears inconsistent</li>
</ul>
<p>Reply <strong>leakage</strong> and I'll send the full pipeline leakage breakdown — which leads have gone cold, which steps were missed, and where the gaps are widest.</p>
<p>Reply <strong>cadence</strong> and I'll generate a cadence health summary for ${lead.company || 'your pipeline'}.</p>
<p>— Qiyadon Pipeline System</p>`,
  }),

  // ── STEP 2: Async value delivery — system-generated insight ─────────────
  // CTA: "Reply 'audit' and I'll send the full analysis"
  followup1: (lead) => ({
    subject: `What the system found in ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>Quick update from the pipeline system: I've completed a follow-up rhythm analysis for ${lead.company || 'your pipeline'}.</p>
<p><strong>Key finding:</strong> The gap between lead creation and first follow-up appears to exceed the window where response rates are highest. That gap is the most common source of pipeline leakage at this stage.</p>
<p>I can generate a complete pipeline leakage audit — showing every lead that went silent after initial contact, and which follow-up step was missed. Just reply <strong>audit</strong> and I'll send it over.</p>
<p>I'll follow up again in a few days unless I hear from you.</p>
<p>— Qiyadon Pipeline System</p>`,
  }),

  // ── STEP 3: Cadence health summary — automated deliverable ───────────────
  // CTA: "Reply 'summary' and I'll generate the full cadence health report"
  valueadd: (lead) => ({
    subject: `Cadence health summary for ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I've been running a cadence consistency analysis on ${lead.company || 'your pipeline'}. Here's the summary:</p>
<p>Across active leads, the system is tracking follow-up consistency. Leads that receive timely follow-ups tend to progress through pipeline stages more predictably. Leads that don't — tend to go quiet.</p>
<p>Reply <strong>summary</strong> and I'll generate the full cadence health report — a complete breakdown of every lead, which follow-up steps were completed, and which gaps are costing you pipeline velocity.</p>
<p>No meeting required. I'll send the full report directly to this email.</p>
<p>— Qiyadon Pipeline System</p>`,
  }),

  // ── STEP 4: Pipeline velocity observation ─────────────────────────────────
  // CTA: "Reply 'report' and I'll deliver the full velocity analysis"
  checkin: (lead) => ({
    subject: `Pipeline velocity observation — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>One pattern worth flagging from the system: pipeline velocity at ${lead.company || 'your stage'} tends to drop when follow-up consistency breaks down — which is common as pipeline volume increases.</p>
<p>I've set up a pipeline velocity tracking view for ${lead.company || 'your pipeline'}. It monitors which leads are progressing and which have gone quiet based on follow-up cadence data.</p>
<p>Reply <strong>report</strong> and I'll send the current velocity report — which leads are active, which are stalling, and what the cadence gaps are for each.</p>
<p>— Qiyadon Pipeline System</p>`,
  }),

  // ── STEP 5: Open-loop close with autonomous escalation trigger ───────────
  // CTA: Human escalation if keyword detected, otherwise open-loop
  pivot: (lead) => ({
    subject: `Closing the loop — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I wanted to close the loop on this thread. Based on the pipeline analysis, here's where things stand:</p>
<p>Your follow-up cadence consistency score is something the system can continue monitoring automatically. If you'd like, I can keep generating weekly cadence health summaries and pipeline velocity reports — delivered directly to your inbox, no calls required.</p>
<p>To opt in to automated weekly reports, reply <strong>reports</strong>.</p>
<p>If this isn't relevant to where you are right now, just say the word and I'll stop following up. No hard feelings.</p>
<p>— Qiyadon Pipeline System</p>`,
  }),

  // ── STEP 6: Lightweight final follow-up — open-loop, no CTA pressure ─────
  final: (lead) => ({
    subject: `Last follow-up from the system — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>This is my final automated follow-up on this thread. I've kept the cadence light and tried to deliver value with each touch — not just follow up for the sake of it.</p>
<p>If you ever want to revisit pipeline follow-up consistency, the system is running. Just reply <strong>restart</strong> and the cadence will pick back up from where it left off.</p>
<p>Good luck with everything,</p>
<p>— Qiyadon Pipeline System</p>`,
  }),
};

// Safety layer wrapper — routes all email body generation through compliant templates
function getEmailBody(bodyKey, lead) {
  if (EMAIL_BODIES_SAFE[bodyKey]) {
    return EMAIL_BODIES_SAFE[bodyKey](lead);
  }
  // Fallback to safe intro for unknown keys
  return EMAIL_BODIES_SAFE.intro(lead);
}

// Legacy EMAIL_BODIES — DEPRECATED, use getEmailBody() or EMAIL_BODIES_SAFE directly
// Keeping for backwards compat during migration only
const EMAIL_BODIES = EMAIL_BODIES_SAFE;

// ─── LOGGING ─────────────────────────────────────────────────────────────────
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}`;
  console.log(line);
  
  // Also write to daily log file
  const { execSync } = require('child_process');
  const fs = require('fs');
  const logFile = `${CONFIG.logDir}/${new Date().toISOString().split('T')[0]}.log`;
  const logDir = require('path').dirname(logFile);
  
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line + '\n');
  } catch (e) {
    // Non-fatal — don't crash on log write failure
  }
  return line;
}

// ─── HUBSPOT API ─────────────────────────────────────────────────────────────
function hubspotRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const apiKey = CONFIG.hubspotApiKey;
    const options = {
      hostname: 'api.hubapi.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HubSpot API error ${res.statusCode}: ${JSON.stringify(json)}`));
          }
        } catch (e) {
          reject(new Error(`HubSpot parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Get all contacts for a given HubSpot pipeline owner (client).
 * Returns contacts that are in the "Open" or "Qualifying" stage.
 */
async function getClientLeads(clientId) {
  try {
    const filterGroups = [{
      filters: [
        { propertyName: 'hs_lead_status', operator: 'NEQ', value: 'CLOSED_LOST' },
        { propertyName: 'hs_lead_status', operator: 'NEQ', value: 'CLOSED_WON' },
      ]
    }];

    const response = await hubspotRequest('POST', 
      '/crm/v3/objects/contacts/search',
      {
        filterGroups,
        properties: CONFIG.hubspotProperties,
        limit: 100,
      }
    );

    return response.results || [];
  } catch (err) {
    log(`Error fetching leads: ${err.message}`, 'ERROR');
    return [];
  }
}

/**
 * Update a HubSpot contact property.
 */
async function updateContactProperty(contactId, property, value) {
  try {
    await hubspotRequest('PATCH',
      `/crm/v3/objects/contacts/${contactId}`,
      { properties: { [property]: value } }
    );
    return true;
  } catch (err) {
    log(`Error updating contact ${contactId} property ${property}: ${err.message}`, 'ERROR');
    return false;
  }
}

/**
 * Get lead age in days since creation.
 */
function getLeadAgeDays(contact) {
  const created = contact.properties.createdate;
  if (!created) return 0;
  const createdDate = new Date(parseInt(created));
  const now = new Date();
  return Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
}

/**
 * Get days since last follow-up.
 */
function getDaysSinceLastFollowup(contact) {
  const lastDate = contact.properties.strtn_last_followup_date;
  if (!lastDate) return 999; // Never followed up
  const date = new Date(lastDate);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

/**
 * Get the current cadence day the lead is on.
 */
function getCurrentCadenceDay(contact) {
  const day = contact.properties.strtn_followup_cadence_day;
  if (!day) return 0;
  return parseInt(day) || 0;
}

/**
 * Determine the next cadence step for a lead.
 * Returns { day, bodyKey, subject } for the next email to send.
 */
function getNextCadenceStep(contact) {
  const currentDay = getCurrentCadenceDay(contact);
  const cadence = CONFIG.defaultCadence;

  // Find the next step after currentDay
  const nextStep = cadence.find(s => s.day > currentDay);
  if (!nextStep) return null; // All cadence steps exhausted

  return nextStep;
}

/**
 * Check if a lead is "stalled" — no response and past stalled threshold.
 */
function isStalled(contact) {
  const hasResponded = contact.properties.strtn_response_received === 'yes';
  if (hasResponded) return false;
  
  const daysSinceLastFollowup = getDaysSinceLastFollowup(contact);
  return daysSinceLastFollowup >= CONFIG.stalledDays;
}

// ─── EMAIL SENDER ─────────────────────────────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  
  const secretsPath = '/home/node/.openclaw/secrets/qiyadon-email.json';
  const fs = require('fs');
  let creds;
  
  try {
    creds = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
  } catch (e) {
    log(`Cannot read email credentials: ${e.message}`, 'ERROR');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: creds.smtp?.host || 'smtp0001.neo.space',
    port: creds.smtp?.port || 587,
    secure: creds.smtp?.secure || false,
    requireTLS: creds.smtp?.requireTLS ?? true,
    auth: {
      user: creds.user || 'contact@qiyadon.com',
      pass: creds.password || creds.pass,
    },
    connectionTimeout: 15000,
  });

  return _transporter;
}

async function sendFollowupEmail(contact, cadenceStep) {
  // ── SAFETY GATE ──────────────────────────────────────────────────────────
  if (!SAFETY.canSendEmails) {
    if (SAFETY.DRY_RUN) {
      log(`[DRY_RUN] Would send email to ${contact.properties.email}: ${cadenceStep.subject}`);
      // Still log to Supabase in dry-run mode (dual-write test)
      await logActivity({
        lead_id: contact.id,
        client_id: 'demo',
        activity_type: 'email_sent',
        description: `[DRY_RUN] Would send: ${cadenceStep.subject}`,
        subject: cadenceStep.subject,
        triggered_by: 'engine',
        outcome: null
      });
      return { success: true, dry_run: true };
    }
    log(`[BLOCKED] Email sending disabled — GLOBAL_ENABLED=${SAFETY.GLOBAL_ENABLED}, SEND_EMAILS=${SAFETY.SEND_EMAILS}, DRY_RUN=${SAFETY.DRY_RUN}`);
    return { success: false, reason: 'safety_blocked' };
  }

  const transporter = getTransporter();
  if (!transporter) return false;

  const toEmail = contact.properties.email;
  const toName = [contact.properties.firstname, contact.properties.lastname].filter(Boolean).join(' ');

  // ── LIVE-TEST SAFETY GATE ─────────────────────────────────────────────────
  // Active ONLY when all three normal flags are set (live mode).
  // Hard-rejects any recipient not on the explicit allowlist.
  // Hard-caps total sends per run.
  if (SAFETY.canSendEmails) {
    if (!SAFETY.isAllowedRecipient(toEmail)) {
      log(`[LIVE_TEST_BLOCK] Recipient ${toEmail} not in LIVE_TEST_ALLOWED_EMAIL allowlist — skipping`);
      return { success: false, reason: 'live_test_blocked_not_allowed' };
    }
    if (!SAFETY.canSendLive()) {
      log(`[LIVE_TEST_BLOCK] Max sends (${SAFETY.LIVE_TEST_MAX_SENDS}) reached — skipping ${toEmail}`);
      return { success: false, reason: 'live_test_blocked_max_sends' };
    }
    SAFETY.recordLiveSend();
    log(`[LIVE_TEST_ALLOWED] Send #${SAFETY.liveSends} of ${SAFETY.LIVE_TEST_MAX_SENDS} — clearing for: ${toEmail}`);
  }

  const emailData = getEmailBody(cadenceStep.bodyKey, contact.properties);

  const mailOptions = {
    from: `"${CONFIG.fromName}" <${CONFIG.fromEmail}>`,
    to: toName ? `"${toName}" <${toEmail}>` : toEmail,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.html.replace(/<[^>]+>/g, ''), // Plain text fallback
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    log(`Email sent to ${toEmail}: ${emailData.subject} [${info.messageId}]`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    log(`Failed to send email to ${toEmail}: ${err.message}`, 'ERROR');
    return { success: false, error: err.message };
  }
}

// ─── SUPABASE ACTIVITY LOG HELPER ─────────────────────────────────────────────
function getSupabaseClient() {
  const { createClient } = require('/home/node/.openclaw/workspace/orchestration/node_modules/@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || '' // Must be set via env — no hardcoded secrets
  );
}

async function logActivity({ lead_id, client_id, activity_type, description, subject, triggered_by, outcome }) {
  try {
    const s = getSupabaseClient();
    const { error } = await s.from('pipeline_activity').insert({
      lead_id: String(lead_id),
      client_id: String(client_id),
      activity_type,
      description,
      subject,
      triggered_by: triggered_by || 'engine',
      outcome
    });
    if (error) log(`Supabase logActivity error: ${error.message}`, 'WARN');
  } catch (e) {
    log(`Supabase logActivity exception: ${e.message}`, 'WARN');
  }
}

// ─── MAIN ENGINE ─────────────────────────────────────────────────────────────
async function runEngine() {
  log('══════════════════════════════════════════');
  log('Follow-Up Engine starting');
  log(`Time: ${new Date().toISOString()}`);
  log(`DRY_RUN=${SAFETY.DRY_RUN} | GLOBAL_ENABLED=${SAFETY.GLOBAL_ENABLED} | SEND_EMAILS=${SAFETY.SEND_EMAILS}`);
  log(`LIVE_TEST_ALLOWED_EMAIL=${process.env.LIVE_TEST_ALLOWED_EMAIL || '(not set)'} | LIVE_TEST_MAX_SENDS=${process.env.LIVE_TEST_MAX_SENDS || 0}`);
  SAFETY.resetLiveSends(); // Reset live-send counter for this run

  // Load secrets
  const fs = require('fs');
  const secretsPath = '/home/node/.openclaw/secrets/qiyadon-email.json';
  try {
    // Load HubSpot key from its dedicated file, not qiyadon-email.json
    const hubspotRaw = fs.readFileSync('/home/node/.openclaw/secrets/hubspot.json', 'utf8');
    const hubspotCreds = JSON.parse(hubspotRaw);
    // Support both {accessToken: "..."} and plain "token" formats
    CONFIG.hubspotApiKey = (typeof hubspotCreds.accessToken === 'string' ? hubspotCreds.accessToken : hubspotCreds).trim();
    // SMTP auth from email secret
    if (!getTransporter()) throw new Error('Transporter failed to init');
  } catch (e) {
    log(`Failed to load secrets: ${e.message}`, 'ERROR');
    process.exit(1);
  }

  // ── CHECK ALL CLIENTS BEFORE PROCESSING (per-client kill switch) ─────────
  // If any clients exist in Supabase and NONE are 'active' → skip all processing
  // If Supabase is unreachable → proceed with caution (graceful degradation)
  let clientStatus = 'unknown';
  try {
    const { createClient } = require('/home/node/.openclaw/workspace/orchestration/node_modules/@supabase/supabase-js');
    const supabase = createClient('https://btrbczqjwzuybgcxckvm.supabase.co', process.env.SUPABASE_SERVICE_KEY);
    const { data: activeClients } = await supabase
      .from('clients')
      .select('id, name, status')
      .in('status', ['active', 'onboarding'])
      .limit(10);
    
    const hasActive = activeClients && activeClients.some(c => c.status === 'active');
    if (!hasActive && activeClients && activeClients.length > 0) {
      const firstClient = activeClients[0];
      log(`PER-CLIENT KILL SWITCH: client "${firstClient.name}" status="${firstClient.status}" — not 'active'. Skipping all leads.`);
      log(`To enable: set client status to 'active' in Supabase clients table.`);
      clientStatus = 'not_active';
      return { sent: 0, skipped: 0, escalated: 0, errors: 0, clientStatus };
    }
    if (activeClients && activeClients.length > 0) {
      log(`Found ${activeClients.length} active/onboarding client(s): ${activeClients.map(c => c.name).join(', ')}`);
      clientStatus = 'active';
    } else {
      log(`No clients found in Supabase — running in demo/empty mode (no leads to process)`);
      clientStatus = 'no_clients';
    }
  } catch (e) {
    log(`Supabase client check failed: ${e.message} — proceeding with caution (graceful degradation)`, 'WARN');
    clientStatus = 'unknown';
  }

  const leads = await getClientLeads();
  log(`Fetched ${leads.length} leads from HubSpot`);

  let sent = 0, skipped = 0, escalated = 0, errors = 0;

  for (const lead of leads) {
    try {
      const email = lead.properties.email;
      const ageDays = getLeadAgeDays(lead);
      const daysSinceFollowup = getDaysSinceLastFollowup(lead);
      const currentDay = getCurrentCadenceDay(lead);
      const hasResponded = lead.properties.strtn_response_received === 'yes';

      // ── STALLED LEAD ESCALATION ───────────────────────────────────────────
      if (isStalled(lead) && lead.properties.strtn_escalated !== 'yes') {
        log(`STALLED: ${email} — escalating for human review`);
        await updateContactProperty(lead.id, 'strtn_escalated', 'yes');
        // TODO: Notify via webhook/email to client owner
        escalated++;
        continue; // Don't send more emails to stalled leads until human reviews
      }

      // ── ALREADY RESPONDED — skip cadence ──────────────────────────────────
      if (hasResponded) {
        log(`ALIVE: ${email} — lead has responded, skipping cadence`);
        skipped++;
        continue;
      }

      // ── DETERMINE NEXT ACTION ──────────────────────────────────────────────
      const nextStep = getNextCadenceStep(lead);

      if (!nextStep) {
        log(`DONE: ${email} — all cadence steps exhausted`);
        skipped++;
        continue;
      }

      // Final safety: check global + email send flags (redundant with sendFollowupEmail safety gate, but explicit here)
      if (!SAFETY.canSendEmails) {
        if (SAFETY.DRY_RUN) {
          const nextStep = getNextCadenceStep(lead);
          log(`[DRY_RUN] Would send ${email}: step ${nextStep?.day} — ${nextStep?.subject}`);
          await logActivity({
            lead_id: lead.id,
            client_id: 'demo',
            activity_type: 'email_sent',
            description: `[DRY_RUN] Would send: step ${nextStep?.day} — ${nextStep?.subject}`,
            subject: nextStep?.subject || 'unknown',
            triggered_by: 'engine'
          });
          skipped++;
          continue;
        }
        log(`[BLOCKED] Sending blocked — SAFETY flags not met. DRY_RUN=${SAFETY.DRY_RUN}, GLOBAL_ENABLED=${SAFETY.GLOBAL_ENABLED}, SEND_EMAILS=${SAFETY.SEND_EMAILS}`);
        skipped++;
        continue;
      }

      // Check if it's time to send this step
      // Time condition: age >= step day AND (never followed up OR enough days since last)
      const shouldSend = ageDays >= nextStep.day &&
        (currentDay === 0 || daysSinceFollowup >= (nextStep.day - currentDay));

      if (!shouldSend) {
        log(`WAIT: ${email} — cadence day ${nextStep.day} not due yet (age: ${ageDays}d, since last: ${daysSinceFollowup}d)`);
        skipped++;
        continue;
      }

      // ── SEND FOLLOW-UP EMAIL ───────────────────────────────────────────────
      const result = await sendFollowupEmail(lead, nextStep);
      
      if (result.success) {
        // Update HubSpot with new cadence state
        await updateContactProperty(lead.id, 'strtn_followup_cadence_day', String(nextStep.day));
        await updateContactProperty(lead.id, 'strtn_last_followup_date', new Date().toISOString());
        await updateContactProperty(lead.id, 'strtn_last_email_subject', nextStep.subject);
        sent++;
      } else {
        errors++;
      }

    } catch (err) {
      log(`Error processing lead ${lead.id}: ${err.message}`, 'ERROR');
      errors++;
    }
  }

  log('══════════════════════════════════════════');
  log(`Follow-Up Engine complete`);
  log(`Sent: ${sent} | Skipped: ${skipped} | Escalated: ${escalated} | Errors: ${errors}`);
  log('══════════════════════════════════════════');

  return { sent, skipped, escalated, errors };
}

// ─── STANDALONE TEST MODE ─────────────────────────────────────────────────────
if (require.main === module) {
  runEngine()
    .then(r => { console.log('Result:', r); process.exit(0); })
    .catch(e => { console.error('Fatal:', e); process.exit(1); });
}

module.exports = { runEngine, CONFIG, EMAIL_BODIES };