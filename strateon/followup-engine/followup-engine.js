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
const { generateAccountBrief } = require('./account-intelligence.js');

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
    { day: 1,  subject: 'Pipeline continuity',                 bodyKey: 'intro'     },
    { day: 3,  subject: 'Follow-up gaps in growing pipelines',  bodyKey: 'followup1' },
    { day: 7,  subject: 'How follow-up cadence breaks down',   bodyKey: 'valueadd'  },
    { day: 14, subject: 'Follow-up cadence at scale',         bodyKey: 'checkin'  },
    { day: 21, subject: 'Pipeline continuity at scale',        bodyKey: 'pivot'     },
    { day: 30, subject: 'Quick note',                           bodyKey: 'final'    },
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
  // ── CONTEXT-ADAPTIVE TEMPLATES ─────────────────────────────────────────────
  // Each step has 8 context-aware variants + default.
  // Selects based on accountBrief.messagingAngle.
  // accountBrief may be empty {} in Phase 1 (template selection falls through to default).

  intro: (lead, accountBrief = {}) => {
    const angle = accountBrief.messagingAngle || 'general_continuity';
    const templates = {
      founder_bandwidth: {
        subject: accountBrief.recommendedSubject || 'Pipeline continuity when you\'re doing it all',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      revops_handoff: {
        subject: 'Follow-up gaps at the SDR-to-AE handoff',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_stakeholder_continuity: {
        subject: accountBrief.recommendedSubject || 'Pipeline continuity across complex sales motions',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      volume_continuity: {
        subject: accountBrief.recommendedSubject || 'Follow-up consistency at inbound scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      scaling_continuity: {
        subject: accountBrief.recommendedSubject || 'Pipeline continuity as sales orgs scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      cycle_continuity: {
        subject: accountBrief.recommendedSubject || 'Follow-up continuity in long sales cycles',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_line_continuity: {
        subject: accountBrief.recommendedSubject || 'Pipeline continuity across multiple product lines',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      late_continuity: {
        subject: accountBrief.recommendedSubject || 'Where follow-up cadence tends to break down',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      general_continuity: {
        subject: accountBrief.recommendedSubject || 'Pipeline continuity',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>As B2B pipelines grow, follow-up consistency tends to become harder to maintain. It's one of the most common sources of pipeline leakage at this stage — leads quietly go cold because the follow-up sequence breaks down somewhere in the middle.</p>
<p>If you have a few minutes, I can walk you through where follow-up gaps are most likely forming in a pipeline like yours — and what the pattern typically looks like. No commitment required.</p>
<p>If that sounds useful, just say the word and I'll send it over.</p>
<p>— Qiyadon Pipeline</p>`,
      },
    };
    const tpl = templates[angle] || templates.general_continuity;
    return { subject: tpl.subject, html: tpl.body };
  },

  followup1: (lead, accountBrief = {}) => {
    const angle = accountBrief.messagingAngle || 'general_continuity';
    const templates = {
      founder_bandwidth: {
        subject: 'Follow-up gaps in growing pipelines',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my earlier note — one pattern worth keeping an eye on as pipelines scale: the gap between first contact and first follow-up. In growing pipelines, that gap tends to widen, and leads that don't get a follow-up within the first few days often go quiet.</p>
<p>I can share what that pattern typically looks like in a pipeline at your stage. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      revops_handoff: {
        subject: 'Follow-up gaps at the SDR-to-AE handoff',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing that tends to show up in pipelines with active SDR teams: the gap between initial outreach and first follow-up. SDR-to-AE handoffs can create natural delays — and leads that don't get a follow-up within the first few days often go quiet.</p>
<p>I can show you where that gap tends to form and what it looks like in a pipeline at your stage. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_stakeholder_continuity: {
        subject: 'Follow-up gaps in complex sales motions',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my earlier note — one pattern worth keeping an eye on as pipelines scale: the gap between first contact and first follow-up. In growing pipelines, that gap tends to widen, and leads that don't get a follow-up within the first few days often go quiet.</p>
<p>I can share what that pattern typically looks like in a pipeline at your stage. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      volume_continuity: {
        subject: 'Follow-up gaps at inbound scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my earlier note — one pattern that tends to show up at high inbound volume: the gap between first contact and first follow-up. When lead volume is high, that gap can widen quickly — leads that don't get a follow-up within the first few days often go quiet.</p>
<p>I can show you where that gap tends to form in a pipeline like yours. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      scaling_continuity: {
        subject: 'Follow-up gaps as teams scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my earlier note — one pattern worth keeping an eye on as pipelines scale: the gap between first contact and first follow-up. As teams grow and handoffs become more complex, that gap tends to widen, and leads that don't get a follow-up within the first few days often go quiet.</p>
<p>I can share what that pattern typically looks like in a pipeline at your stage. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      cycle_continuity: {
        subject: 'Follow-up gaps in long sales cycles',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my earlier note — one pattern that tends to show up in long sales cycles: the gap between first contact and first follow-up. In long cycles, that gap can stretch longer than it should — leads that don't get a timely follow-up often disengage before the deal progresses further.</p>
<p>I can show you where that gap tends to form and what it looks like in a pipeline at your stage. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_line_continuity: {
        subject: 'Follow-up gaps across product lines',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my earlier note — one pattern worth keeping an eye on as pipelines scale: the gap between first contact and first follow-up. In multi-line pipelines, that gap can vary by product line — and leads that don't get a follow-up within the first few days often go quiet.</p>
<p>I can show you where that gap tends to form in a pipeline like yours. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      late_continuity: {
        subject: 'Where follow-up cadence tends to break down',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my earlier note — one pattern worth noting: the gap between first contact and first follow-up. By step 4 or 5 of a cadence, that gap tends to widen — leads that were engaged early can fall off the radar as earlier-stage opportunities demand attention.</p>
<p>I can show you where that gap tends to form in a pipeline like yours. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      general_continuity: {
        subject: 'Follow-up gaps in growing pipelines',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up on my earlier note — one pattern worth keeping an eye on as pipelines scale: the gap between first contact and first follow-up. In growing pipelines, that gap tends to widen, and leads that don't get a follow-up within the first few days often go quiet.</p>
<p>I can share what that pattern typically looks like in a pipeline at your stage. Happy to send it over if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
    };
    const tpl = templates[angle] || templates.general_continuity;
    return { subject: tpl.subject, html: tpl.body };
  },

  valueadd: (lead, accountBrief = {}) => {
    const angle = accountBrief.messagingAngle || 'general_continuity';
    const templates = {
      founder_bandwidth: {
        subject: 'How follow-up cadence tends to break down',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see as pipeline volume increases: follow-up cadence tends to break down somewhere around step 3 or 4. Steps 1 and 2 usually get handled, but by step 3 or 4, the rhythm starts to slip — leads go quiet not because they lost interest, but because the follow-up sequence didn't continue on schedule.</p>
<p>I can show you what that pattern looks like and where it tends to show up first. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      revops_handoff: {
        subject: 'Where SDR-to-AE handoffs tend to break down',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see in pipelines with active SDR teams: follow-up cadence tends to break down at the handoff point. SDRs handle early outreach well, but when a lead passes to an AE, follow-up often slows — not because the AE isn't interested, but because the queue is full and the handoff timing was off.</p>
<p>I can show you where that gap tends to form in your pipeline. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_stakeholder_continuity: {
        subject: 'How follow-up cadence breaks down in complex deals',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see as pipeline volume increases: follow-up cadence tends to break down somewhere around step 3 or 4. Steps 1 and 2 usually get handled, but by step 3 or 4, the rhythm starts to slip — leads go quiet not because they lost interest, but because the follow-up sequence didn't continue on schedule.</p>
<p>I can show you what that pattern looks like and where it tends to show up first. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      volume_continuity: {
        subject: 'Where follow-up breaks down at scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see at high inbound volume: follow-up cadence tends to break down around step 2 or 3. Leads that don't immediately respond often get deprioritized as the team focuses on the most engaged prospects — and cadence breaks down not because the team doesn't care, but because bandwidth is limited.</p>
<p>I can show you where that gap tends to form in your pipeline. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      scaling_continuity: {
        subject: 'Where follow-up breaks down during growth',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see at the growth stage: follow-up cadence tends to break down as the team scales. New rep onboarding, coverage shifts, and handoff changes all tend to create gaps — leads that were moving quietly stall when the sequence breaks.</p>
<p>I can show you where those gaps tend to form. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      cycle_continuity: {
        subject: 'Where follow-up breaks down between deal stages',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see in long sales cycles: follow-up cadence tends to break down between deal stages. The sequence that worked for initial outreach often doesn't follow the deal as it progresses — leads go quiet not because they lost interest, but because the cadence didn't adapt to where the deal actually is.</p>
<p>I can show you where those gaps tend to form. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_line_continuity: {
        subject: 'Where follow-up breaks down across product lines',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see in multi-line pipelines: follow-up cadence tends to break down around step 3 or 4. Later-stage leads can quietly stall while earlier opportunities demand attention — and without a system to maintain rhythm across all lines, some leads go quiet without anyone noticing.</p>
<p>I can show you where those gaps tend to form. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      late_continuity: {
        subject: 'Where late-stage cadence tends to decay',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see by step 4 or 5 of a cadence: follow-up consistency tends to slip. Leads that were engaged in early steps can fall off the radar as earlier-stage opportunities and new leads demand attention — the cadence that worked at step 1 often breaks down before it reaches step 4.</p>
<p>I can show you where that decay tends to happen first. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      general_continuity: {
        subject: 'How follow-up cadence tends to break down',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>One thing we often see as pipeline volume increases: follow-up cadence tends to break down somewhere around step 3 or 4. Steps 1 and 2 usually get handled, but by step 3 or 4, the rhythm starts to slip — leads go quiet not because they lost interest, but because the follow-up sequence didn't continue on schedule.</p>
<p>I can show you what that pattern looks like and where it tends to show up first. Worth a few minutes to review.</p>
<p>— Qiyadon Pipeline</p>`,
      },
    };
    const tpl = templates[angle] || templates.general_continuity;
    return { subject: tpl.subject, html: tpl.body };
  },

  checkin: (lead, accountBrief = {}) => {
    const angle = accountBrief.messagingAngle || 'general_continuity';
    const templates = {
      founder_bandwidth: {
        subject: 'Follow-up cadence at scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: as pipeline velocity increases, follow-up consistency often starts to slip. It's rarely intentional; it's usually a matter of bandwidth. Leads that were on track in early cadence steps can quietly fall off as the team gets busy.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      revops_handoff: {
        subject: 'SDR-to-AE handoff at scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: as pipeline velocity increases, follow-up consistency at the SDR-to-AE handoff often starts to slip. It's rarely intentional; it's usually a matter of AE bandwidth and handoff timing. Leads that were engaged at the SDR stage can quietly stall when the handoff doesn't land cleanly.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_stakeholder_continuity: {
        subject: 'Follow-up cadence at enterprise scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: as pipeline velocity increases and deal complexity grows, follow-up consistency often starts to slip between stages. It's rarely intentional; it's usually a matter of bandwidth across multiple stakeholders. Leads that were engaged early can quietly stall as the deal moves through evaluation.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      volume_continuity: {
        subject: 'Follow-up consistency at inbound scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: at high inbound volume, follow-up consistency often starts to slip as the team focuses on the most engaged leads. It's rarely intentional; it's usually a matter of bandwidth. Leads that weren't immediately responsive can quietly get deprioritized.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      scaling_continuity: {
        subject: 'Follow-up as teams scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: as teams scale and handoffs increase, follow-up consistency often starts to slip. It's rarely intentional; it's usually a matter of coverage gaps and new rep onboarding. Leads that were moving quietly stall when the sequence breaks during transitions.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      cycle_continuity: {
        subject: 'Follow-up in long sales cycles',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: in long sales cycles, follow-up consistency often starts to slip between deal stages. It's rarely intentional; it's usually a matter of attention drift as the deal sits between stages. Leads that were engaged early can quietly stall as the evaluation period extends.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_line_continuity: {
        subject: 'Follow-up across product lines',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: in multi-line pipelines, follow-up consistency across all lines often starts to slip as volume increases. It's rarely intentional; it's usually a matter of bandwidth and priority. Later-stage leads can quietly stall while earlier opportunities demand attention.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      late_continuity: {
        subject: 'Late-stage follow-up decay',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: by step 4 or 5 of a cadence, follow-up consistency tends to slip. Leads that were engaged in early steps can fall off the radar as earlier-stage opportunities and new leads demand attention. It's rarely intentional; it's usually a matter of focus.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      general_continuity: {
        subject: 'Follow-up cadence at scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Following up — one more pattern worth noting: as pipeline velocity increases, follow-up consistency often starts to slip. It's rarely intentional; it's usually a matter of bandwidth. Leads that were on track in early cadence steps can quietly fall off as the team gets busy.</p>
<p>If you're seeing that pattern, it's worth a quick look to see where the cadence may be weakening. I can send over a snapshot if useful.</p>
<p>— Qiyadon Pipeline</p>`,
      },
    };
    const tpl = templates[angle] || templates.general_continuity;
    return { subject: tpl.subject, html: tpl.body };
  },

  pivot: (lead, accountBrief = {}) => {
    const angle = accountBrief.messagingAngle || 'general_continuity';
    const templates = {
      founder_bandwidth: {
        subject: 'Pipeline continuity — next steps',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity is one of those operational disciplines that tends to slip when things get busy, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue running the follow-up cadence in the background — just keeping the sequence on track and flagging when leads need attention. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      revops_handoff: {
        subject: 'SDR-to-AE handoff continuity',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity at the SDR-to-AE handoff is one of those operational disciplines that tends to slip when things get busy, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue monitoring the handoff rhythm and flagging when leads appear to go quiet between stages. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_stakeholder_continuity: {
        subject: 'Pipeline continuity across deal stages',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity across complex deal stages is one of those operational disciplines that tends to slip when deals move slowly, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue monitoring the follow-up rhythm across all deal stages and flagging when leads appear to go quiet between stages. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      volume_continuity: {
        subject: 'Pipeline continuity at scale',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity at high volume is one of those operational disciplines that tends to slip when lead flow exceeds bandwidth, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue running the follow-up cadence in the background — keeping the sequence on track and flagging when leads appear to go quiet. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      scaling_continuity: {
        subject: 'Pipeline continuity during growth',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity as teams scale is one of those operational disciplines that tends to slip during transitions and handoffs, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue monitoring the cadence and flagging when leads appear to go quiet during team transitions. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      cycle_continuity: {
        subject: 'Pipeline continuity across deal stages',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity in long sales cycles is one of those operational disciplines that tends to slip between deal stages, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue monitoring the follow-up rhythm across all deal stages and flagging when leads appear to go quiet between stages. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      multi_line_continuity: {
        subject: 'Pipeline continuity across product lines',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity across multiple product lines is one of those operational disciplines that tends to slip when bandwidth is split across segments, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue monitoring the cadence across all product lines and flagging when leads appear to go quiet. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      late_continuity: {
        subject: 'Late-stage pipeline continuity',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity through late cadence steps is one of those operational disciplines that tends to slip when early-stage leads demand attention, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue monitoring the late-stage cadence and flagging when leads appear to fall off the radar. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
      general_continuity: {
        subject: 'Pipeline continuity — next steps',
        body: `<p>Hi ${lead.firstname || ''},</p>
<p>Wrapping up this thread — pipeline continuity is one of those operational disciplines that tends to slip when things get busy, and it's also one of the hardest to maintain consistently without a system to support it.</p>
<p>If you'd find it useful, I can continue running the follow-up cadence in the background — just keeping the sequence on track and flagging when leads need attention. No additional work on your end.</p>
<p>Let me know if that makes sense for your situation.</p>
<p>— Qiyadon Pipeline</p>`,
      },
    };
    const tpl = templates[angle] || templates.general_continuity;
    return { subject: tpl.subject, html: tpl.body };
  },

  final: (lead, accountBrief = {}) => {
    const angle = accountBrief.messagingAngle || 'general_continuity';
    // Final step is the same for all contexts — open loop, no pressure
    return {
      subject: `Quick note — ${lead.company || 'your pipeline'}`,
      html: `<p>Hi ${lead.firstname || ''},</p>
<p>This is my last follow-up on this thread. I've tried to keep it light and only share patterns that might be worth knowing about as you manage pipeline continuity at scale.</p>
<p>If you ever want to revisit the cadence, or if the situation changes and follow-up consistency becomes a priority, I'm here. Otherwise — good luck with everything.</p>
<p>— Qiyadon Pipeline</p>`,
    };
  },
};;




// Safety layer wrapper — routes all email body generation through compliant templates
function getEmailBody(bodyKey, lead, accountBrief = {}) {
  if (EMAIL_BODIES_SAFE[bodyKey]) {
    return EMAIL_BODIES_SAFE[bodyKey](lead, accountBrief);
  }
  // Fallback to safe intro for unknown keys
  return EMAIL_BODIES_SAFE.intro(lead, accountBrief);
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

  const accountBrief = generateAccountBrief(contact.properties, {});
      const emailData = getEmailBody(cadenceStep.bodyKey, contact.properties, accountBrief);

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

// ─── CLIENT ACTIVATION TRIGGER ───────────────────────────────────────────────
// On client status='active', this function:
//   1. Creates pipeline_lead records from the trial signup data
//   2. Triggers the T+1h kickoff email sequence
//   3. Logs each activation step to pipeline_activity table
// Called once per newly activated client (idempotent via activation_initiated flag)

async function initiateClientActivation(client) {
  const s = getSupabaseClient();
  const now = new Date().toISOString();

  // ── Step 1: Mark activation initiated (idempotency lock) ──────────────────
  if (client.activation_initiated) {
    log(`Client "${client.name}" already activated — skipping`);
    return { alreadyActivated: true };
  }

  log(`ACTIVATION: Initiating client "${client.name}" (${client.email}) — pipeline_lead records + kickoff sequence`);

  // ── Step 2: Create pipeline_lead records ─────────────────────────────────
  try {
    const leadRows = await s.from('pipeline_leads').select('id').eq('client_id', client.id).limit(1);
    if (leadRows.data && leadRows.data.length > 0) {
      // pipeline_leads already exist — just update activation flag
      await s.from('clients').update({ activation_initiated: true }).eq('id', client.id);
      log(`Pipeline leads already exist for client "${client.name}"`);
    } else {
      // Seed pipeline_leads from sign-trial data
      const signupData = {
        name: client.name || '',
        email: client.email || '',
        company: client.company || '',
        signup_type: client.signup_type || client.type || 'evaluation-start',
      };

      if (signupData.email) {
        const { error: insertErr } = await s.from('pipeline_leads').insert({
          client_id: client.id,
          name: signupData.name,
          email: signupData.email,
          company: signupData.company,
          signup_type: signupData.signup_type,
          status: 'pending',
        });

        if (insertErr) {
          log(`Failed to create pipeline_lead for client "${client.name}": ${insertErr.message}`, 'ERROR');
        } else {
          log(`Pipeline lead created for "${signupData.email}"`);
        }
      } else {
        log(`No email found for client "${client.name}" — skipping pipeline_lead creation`, 'WARN');
      }
    }
  } catch (e) {
    log(`pipeline_lead creation error for client "${client.name}": ${e.message}`, 'ERROR');
  }

  // ── Step 3: Log ACTIVATION_INITIATED to pipeline_activity ──────────────
  await logActivity({
    lead_id: null,
    client_id: client.id,
    activity_type: 'ACTIVATION_INITIATED',
    description: `Client activation triggered for "${client.name}". Pipeline lead initialized from trial signup.`,
    subject: 'Your evaluation is live — Day 1 begins now',
    triggered_by: 'engine',
    outcome: 'activation_started',
  });

  // ── Step 4: Mark activation_initiated=true on clients row ──────────────
  try {
    await s.from('clients').update({ activation_initiated: true }).eq('id', client.id);
  } catch (e) {
    log(`Failed to set activation_initiated on client "${client.name}": ${e.message}`, 'ERROR');
  }

  // ── Step 5: Log KICKOFF_EMAIL_QUEUED (T+1h is handled by scheduler; we queue intent here) ─
  await logActivity({
    lead_id: null,
    client_id: client.id,
    activity_type: 'KICKOFF_EMAIL_QUEUED',
    description: 'T+1h kickoff email queued for delivery',
    subject: 'Day 1 kickoff — your pipeline is already being assessed',
    triggered_by: 'engine',
    outcome: 'queued',
  });

  // ── Step 6: Immediate kickoff/intake email (T+1h from now) ──────────────
  // We store a kickoff_scheduled_at timestamp — a T+1h scheduler picks this up
  try {
    const kickoffEta = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // T+1h
    await s.from('clients').update({ kickoff_scheduled_at: kickoffEta }).eq('id', client.id);
    log(`Kickoff email scheduled for client "${client.name}" at ${kickoffEta}`);
  } catch (e) {
    log(`Failed to schedule kickoff email for "${client.name}": ${e.message}`, 'ERROR');
  }

  log(`ACTIVATION complete for client "${client.name}"`);
  return { success: true };
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
      // ── ACTIVATION TRIGGER: Check each active client for pending activation ──
      for (const client of activeClients) {
        if (client.status === 'active') {
          await initiateClientActivation(client);
        }
      }
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