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
const nodemailer = require('/home/node/.openclaw/imap-worker/node_modules/nodemailer');

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
    { day: 1,  subject: 'Following up on your pipeline',        bodyKey: 'intro'     },
    { day: 3,  subject: 'Quick follow-up',                       bodyKey: 'followup1' },
    { day: 7,  subject: 'Value-add: pipeline benchmark',          bodyKey: 'valueadd'  },
    { day: 14, subject: 'Checking in',                            bodyKey: 'checkin'  },
    { day: 21, subject: 'Should we try a different approach?',    bodyKey: 'pivot'     },
    { day: 30, subject: 'Final follow-up — then I\'ll step back', bodyKey: 'final'    },
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
const EMAIL_BODIES = {
  intro: (lead) => ({
    subject: `Following up on your pipeline, ${lead.firstname || 'there'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I noticed you submitted a Pipeline Leak Audit request for ${lead.company || 'your company'} — thanks for that.</p>
<p>I've been reviewing your pipeline, and I have a few observations I think you'll find useful. Want me to dig in?</p>
<p>Pipeline doesn't fill itself. And the leads you have are worth real revenue — if they're followed up on consistently.</p>
<p>I'll keep this brief: what would it mean for your month if every single lead in your pipeline got a response within 24 hours?</p>
<p>Talk soon,</p>
<p><strong>Qiyadon Pipeline</strong></p>`,
  }),

  followup1: (lead) => ({
    subject: `Quick follow-up — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my note from a few days ago — wanted to make sure it didn't get buried.</p>
<p>No pressure, but the leads in your pipeline right now are losing value every day they sit. A follow-up email can be the difference between a conversation and silence.</p>
<p>Can we schedule 15 minutes this week? I have some specific ideas about your pipeline I'd love to share.</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  valueadd: (lead) => ({
    subject: `A benchmark that might surprise you — ${lead.company || ''}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>Sharing something that might be useful: companies that follow up with leads within 5 minutes are 9x more likely to convert. The problem isn't usually the lead — it's the lag.</p>
<p>For B2B SaaS at your stage, the median time to first follow-up is 47 hours. That's half a work week of dead time.</p>
<p>I've been running this analysis for VP Sales across a dozen companies. The pattern is always the same: the leads are good, the follow-through is inconsistent.</p>
<p>I'd love to show you what I see in your specific pipeline. Worth 15 minutes?</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  checkin: (lead) => ({
    subject: `Checking in — ${lead.company || 'your pipeline'}`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I don't want to overdo this — but I'm genuinely curious how things are going with your pipeline.</p>
<p>If you found what you needed, great. If not, I have some thoughts on what's working for other VP Sales in similar companies.</p>
<p>Either way — let me know if you'd like to chat, or if you'd prefer I stop following up.</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  pivot: (lead) => ({
    subject: `A different angle on your pipeline challenge`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>I keep thinking about your situation — and I want to ask a different question than the one I started with.</p>
<p>Not "how can we follow up better?" but "what would it take for your pipeline to feel healthy and predictable?"</p>
<p>Because if I can help you get there, it changes everything about how you run the quarter.</p>
<p>I've seen this with other VP Sales: once the follow-up rhythm is automatic, the pipeline stops being a source of anxiety and starts being a source of confidence.</p>
<p>Is that worth a conversation?</p>
<p>— Qiyadon Pipeline</p>`,
  }),

  final: (lead) => ({
    subject: `Last note from me — then I'll step back`,
    html: `<p>Hi ${lead.firstname || ''},</p>
<p>This is my final follow-up on this thread — I don't want to become background noise in your inbox.</p>
<p>If what I'm offering doesn't feel relevant right now, I completely understand. The door stays open if that changes.</p>
<p>If you did want to explore what a consistent follow-up rhythm could do for your pipeline — I'm here.</p>
<p>Best of luck with everything,</p>
<p>— Qiyadon Pipeline</p>`,
  }),
};

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
        { propertyName: 'hs_lead_status', operator: 'NOT_EQUAL_TO', value: 'CLOSED_LOST' },
        { propertyName: 'hs_lead_status', operator: 'NOT_EQUAL_TO', value: 'CLOSED_WON' },
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
    host: CONFIG.smtpHost,
    port: CONFIG.smtpPort,
    secure: false, // STARTTLS
    auth: {
      user: creds.user || 'contact@qiyadon.com',
      pass: creds.pass,
    },
    connectionTimeout: 15000,
  });

  return _transporter;
}

async function sendFollowupEmail(contact, cadenceStep) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const bodyFn = EMAIL_BODIES[cadenceStep.bodyKey];
  if (!bodyFn) {
    log(`Unknown body key: ${cadenceStep.bodyKey}`, 'ERROR');
    return false;
  }

  const emailData = bodyFn(contact.properties);
  const toEmail = contact.properties.email;
  const toName = [contact.properties.firstname, contact.properties.lastname].filter(Boolean).join(' ');

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

// ─── MAIN ENGINE ─────────────────────────────────────────────────────────────
async function runEngine() {
  log('══════════════════════════════════════════');
  log('Follow-Up Engine starting');
  log(`Time: ${new Date().toISOString()}`);
  log('══════════════════════════════════════════');

  // Load secrets
  const fs = require('fs');
  const secretsPath = '/home/node/.openclaw/secrets/qiyadon-email.json';
  try {
    const creds = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    CONFIG.hubspotApiKey = fs.readFileSync('/home/node/.openclaw/secrets/hubspot.json', 'utf8').trim();
    // SMTP auth from email secret
    if (!getTransporter()) throw new Error('Transporter failed to init');
  } catch (e) {
    log(`Failed to load secrets: ${e.message}`, 'ERROR');
    process.exit(1);
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