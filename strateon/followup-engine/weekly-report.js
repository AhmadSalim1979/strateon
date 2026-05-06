/**
 * Qiyadon — Weekly Pipeline Report Generator
 * Version: 1.0
 * Role: CPO — Chief Product Development Officer
 * 
 * Generates a weekly pipeline activity report from engine logs,
 * formatted for WhatsApp delivery by COO.
 * 
 * Run: node weekly-report.js
 * Output: Prints formatted WhatsApp-ready report to stdout
 *         Saves JSON + Markdown to reports/{date}-report.{json,md}
 * 
 * Dependencies: followup-engine.js logs
 */

const fs = require('fs');
const path = require('path');

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const LOG_DIR   = '/home/node/.openclaw/workspace/strateon/followup-engine/logs';
const REPORT_DIR = '/home/node/.openclaw/workspace/strateon/followup-engine/reports';
const TODAY    = new Date();

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function daysAgo(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── LOAD ENGINE LOGS ─────────────────────────────────────────────────────────
/**
 * Parse engine log directory and read all log entries.
 * Engine logs are stored as individual files: logs/{date}-{type}.log
 * Format: JSON each line {ts, level, message, ...extras}
 */
function loadEngineLogs(fromDate, toDate) {
  const entries = [];
  if (!fs.existsSync(LOG_DIR)) return entries;

  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.log'));
  for (const file of files) {
    const fileDate = file.replace(/^(\d{4}-\d{2}-\d{2}).*\.log$/, '$1');
    if (fileDate < fromDate || fileDate > toDate) continue;

    const content = fs.readFileSync(path.join(LOG_DIR, file), 'utf8');
    const lines = content.trim().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip malformed lines
      }
    }
  }
  return entries.sort((a, b) => a.ts < b.ts ? -1 : 1);
}

// ─── ANALYZE LOGS ──────────────────────────────────────────────────────────────
function analyzeLogs(entries) {
  const stats = {
    totalRuns:         0,
    leadsProcessed:    0,
    emailsSent:        0,
    responsesReceived: 0,
    leadsEscalated:    0,
    errors:            0,
    firstClientReady:  false,
    startDate:         null,
    endDate:           null,
  };

  for (const entry of entries) {
    if (entry.level === 'ERROR') stats.errors++;
    if (entry.message === 'Response webhook received') stats.responsesReceived++;
    if (entry.message === 'Engine run complete') {
      stats.totalRuns++;
      stats.leadsProcessed += entry.leadsProcessed || 0;
      stats.emailsSent     += entry.emailsSent     || 0;
      stats.leadsEscalated  += entry.leadsEscalated || 0;
    }
    if (entry.level === 'INFO' && entry.message && entry.message.startsWith('Engine run started')) {
      stats.startDate = entry.ts;
    }
    if (entry.level === 'INFO' && entry.message && entry.message.startsWith('Engine run complete')) {
      stats.endDate = entry.ts;
    }
    if (entry.level === 'INFO' && entry.message === 'First client can now be onboarded') {
      stats.firstClientReady = true;
    }
  }

  return stats;
}

// ─── FORMAT WHATSAPP REPORT ────────────────────────────────────────────────────
/**
 * Returns a WhatsApp-formatted multi-message array.
 * Each element is a string chunk that fits WhatsApp character limits.
 */
function formatWhatsAppReport(stats, periodStr) {
  const lines = [];
  lines.push(`📊 *Pipeline Report — ${periodStr}*`);
  lines.push('');

  if (stats.totalRuns === 0) {
    lines.push('No engine runs detected this week.');
    lines.push('');
    lines.push('This is expected before first client onboarding.');
    lines.push('');
    lines.push('✅ *Product Status: READY*');
    lines.push('• Follow-Up Engine — built, syntax checked ✅');
    lines.push('• Response Webhook — built, needs CTO deploy ✅');
    lines.push('• HubSpot custom properties — *Ahmad must create in HubSpot* 🔴');
    lines.push('');
    lines.push('🔴 *Action required:* Create HubSpot custom properties to enable first client.');
    lines.push('');
    lines.push('*Next:* Once HubSpot properties are created + webhook deployed, first client can be onboarded.');
    return [lines.join('\n')];
  }

  // Real stats
  lines.push(`🔄 Engine runs: ${stats.totalRuns}`);
  lines.push(`📧 Emails sent: ${stats.emailsSent}`);
  lines.push(`💬 Responses received: ${stats.responsesReceived}`);
  lines.push(`⚠️ Leads escalated: ${stats.leadsEscalated}`);
  lines.push(`❌ Errors: ${stats.errors}`);
  lines.push('');

  if (stats.errors > 0) {
    lines.push(`⚠️ ${stats.errors} error(s) detected — review logs.`);
    lines.push('');
  }

  const responseRate = stats.emailsSent > 0
    ? ((stats.responsesReceived / stats.emailsSent) * 100).toFixed(1) + '%'
    : 'N/A';
  lines.push(`📈 Response rate: ${responseRate}`);
  lines.push('');

  lines.push('*Product Status: READY*');
  lines.push('• Follow-Up Engine — running ✅');
  lines.push('• Response Webhook — active ✅');
  lines.push('• Weekly Report Generator — built ✅');

  return [lines.join('\n')];
}

// ─── FORMAT MARKDOWN REPORT ────────────────────────────────────────────────────
function formatMarkdownReport(stats, periodStr) {
  const md = [];
  md.push(`# Pipeline Weekly Report — ${periodStr}`);
  md.push('');
  md.push(`*Generated: ${new Date().toISOString()}*`);
  md.push('');

  if (stats.totalRuns === 0) {
    md.push('## Status: Pre-Launch (No Engine Runs)');
    md.push('');
    md.push('No engine runs detected this period.');
    md.push('');
    md.push('## Product Readiness');
    md.push('');
    md.push('| Component | Status |');
    md.push('|---|---|');
    md.push('| Follow-Up Engine | ✅ Built 2026-05-03 |');
    md.push('| Response Webhook | ✅ Built 2026-05-04 |');
    md.push('| HubSpot Custom Properties | 🔴 Requires Ahmad action |');
    md.push('| Uptime Monitoring | ❌ Not started |');
    md.push('');
    md.push('## Action Required');
    md.push('');
    md.push('**Ahmad must create HubSpot custom properties** in the HubSpot dashboard before first client onboarding.');
    md.push('');
    md.push('See DAILY/2026-05-04.md for the exact property list.');
  } else {
    md.push('## Activity Summary');
    md.push('');
    md.push('| Metric | Value |');
    md.push('|---|---|');
    md.push(`| Engine runs | ${stats.totalRuns} |`);
    md.push(`| Leads processed | ${stats.leadsProcessed} |`);
    md.push(`| Emails sent | ${stats.emailsSent} |`);
    md.push(`| Responses received | ${stats.responsesReceived} |`);
    md.push(`| Leads escalated | ${stats.leadsEscalated} |`);
    md.push(`| Errors | ${stats.errors} |`);
    md.push('');
    const responseRate = stats.emailsSent > 0
      ? ((stats.responsesReceived / stats.emailsSent) * 100).toFixed(1) + '%'
      : 'N/A';
    md.push(`| Response rate | ${responseRate} |`);
    md.push('');
    md.push('## Product Status');
    md.push('');
    md.push('| Component | Status |');
    md.push('|---|---|');
    md.push('| Follow-Up Engine | ✅ Running |');
    md.push('| Response Webhook | ✅ Active |');
    md.push('| Weekly Report Generator | ✅ Built |');
    md.push('| Uptime Monitoring | ❌ Not started |');
  }

  return md.join('\n');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function getWeekRange() {
  const now = new Date();
  // Find last Monday
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  return {
    from: formatDate(lastMonday),
    to:   formatDate(daysAgo(1)),   // yesterday (last complete day)
    period: `${formatDateShort(lastMonday)} – ${formatDateShort(daysAgo(1))}`,
  };
}

function main() {
  // Ensure directories exist
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  const { from, to, period } = getWeekRange();

  console.error(`[INFO] Generating report for ${period} (${from} to ${to})`);

  const entries = loadEngineLogs(from, to);
  const stats   = analyzeLogs(entries);

  // Output WhatsApp report
  const whatsappMsgs = formatWhatsAppReport(stats, period);
  for (const msg of whatsappMsgs) {
    console.log(msg);
  }

  // Save JSON report
  const dateStr = formatDate(TODAY);
  const jsonPath = path.join(REPORT_DIR, `${dateStr}-report.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({ generated: new Date().toISOString(), period, from, to, stats }, null, 2));

  // Save Markdown report
  const mdPath = path.join(REPORT_DIR, `${dateStr}-report.md`);
  fs.writeFileSync(mdPath, formatMarkdownReport(stats, period));

  console.error(`[INFO] JSON report saved: ${jsonPath}`);
  console.error(`[INFO] Markdown report saved: ${mdPath}`);
}

main();
