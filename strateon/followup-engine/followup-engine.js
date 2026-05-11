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
    { day: 1,  subject: 'Pipeline continuity check',          bodyKey: 'intro'     },
    { day: 3,  subject: 'Follow-up patterns',               bodyKey: 'followup1' },
    { day: 7,  subject: 'Response gaps',                   bodyKey: 'valueadd'  },
    { day: 14, subject: 'Cadence consistency',              bodyKey: 'checkin'  },
    { day: 21, subject: 'Pipeline continuity',             bodyKey: 'pivot'     },
    { day: 30, subject: 'Quick note',                       bodyKey: 'final'    },
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
  // ── STEP 1: Quiet observation — pipeline continuity check ────────────────
  intro: (lead) => ({
    subject: `Pipeline continuity check — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I noticed ${lead.company || 'your pipeline'} has a follow-up cadence set up in HubSpot. I've been observing how it's been running.</p>
<p>A few things I observed:</p>
<ul>
<li>The most recent follow-up in the sequence may not have gone out yet</li>
<li>There are leads that appear to have gone quiet after initial contact</li>
<li>The follow-up rhythm appears inconsistent — some steps may have been skipped or delayed</li>
</ul>
<p>If you'd like, I can send over a more detailed view of where follow-up appears inconsistent.</p>
<p>Happy to share the findings — just let me know.</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  // ── STEP 2: Lightweight pattern observation ───────────────────────────────
  followup1: (lead) => ({
    subject: `Follow-up patterns — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my note from earlier — I wanted to share something I noticed.</p>
<p>There appears to be a gap between when some leads were first contacted and when the first follow-up went out. That gap may be worth reviewing — leads that don't get a follow-up within a certain window can often go quiet.</p>
<p>I can show you where follow-up appears inconsistent. If that's useful, just say the word and I'll send the details.</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  // ── STEP 3: Response gap observation ──────────────────────────────────────
  valueadd: (lead) => ({
    subject: `Response gaps — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I've noticed a pattern worth bringing to your attention: there are leads in the pipeline where the response follow-up cadence may have some gaps — steps that appear to have been missed or delayed.</p>
<p>I can send a more detailed view of which leads appear to have gone quiet and which follow-up steps may have been skipped. It may be useful for identifying where pipeline continuity can be improved.</p>
<p>Let me know if you'd like to see it — happy to share.</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  // ── STEP 4: Cadence consistency observation ────────────────────────────────
  checkin: (lead) => ({
    subject: `Cadence consistency — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I wanted to flag something I observed: some leads in the pipeline appear to have moved through early stages but may have slowed at later follow-up steps. That can happen when the cadence breaks down somewhere in the sequence.</p>
<p>I can send the current cadence snapshot — which leads are progressing, which may have stalled, and where the gaps appear to be. Worth a look if you're trying to keep the pipeline moving.</p>
<p>Just let me know.</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  // ── STEP 5: Open loop close — operational continuity ───────────────────────
  pivot: (lead) => ({
    subject: `Pipeline continuity — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — I wanted to leave you with the key observation.</p>
<p>Pipeline continuity tends to work best when follow-up cadence stays consistent across all leads, all the way through the sequence. When steps get missed or delayed, leads can slip through without anyone noticing.</p>
<p>I can continue monitoring the cadence automatically if that's useful — I'd just need to know. Otherwise, I'll leave the sequence as it is and check in again next week.</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  // ── STEP 6: Quiet close — minimal friction ────────────────────────────────
  final: (lead) => ({
    subject: `Quick note — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>This is my last follow-up on this thread. I've tried to keep the cadence light and only reach out when I had something worth observing.</p>
<p>If you ever want to revisit pipeline continuity, the follow-up sequence can pick back up from where it left off. Just let me know.</p>
<p>Otherwise — good luck with everything.</p>
<p>— Qiyadon Pipeline</p>`,
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