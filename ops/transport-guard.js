/**
 * transport-guard.js
 * RISI-P5.3 Phase 4A — Transport-Safe Execution Guardrails
 *
 * Purpose: Classify commands by transport impact, persist detached jobs,
 *          and generate acknowledgments — WITHOUT autonomous execution.
 *
 * Scope:   Classification + queue persistence only.
 *          No automatic execution, no cron, no PM2 mutation.
 */

const fs = require('fs');
const path = require('path');

const PENDING_JOBS_FILE = '/ops/pending-transport-jobs.json';

// ── Transport Impact Taxonomy ────────────────────────────────────────────────

const TRANSPORT_AFFECTING = [
  /pm2\s+(?:stop|delete)\s+openclaw-gateway/,
  /openclaw\s+gateway\s+(?:stop|kill)/,
  /gateway\.stop/,
];

const TRANSPORT_ADJACENT = [
  /pm2\s+restart\s+openclaw-gateway/,
  /pm2\s+(?:stop|restart|delete)\s+.*whatsapp/,
  /openclaw\s+(?:gateway\s+)?restart/,
  /openclaw\s+restart/,
  /systemctl\s+restart\s+openclaw-gateway/,
];

const BOUNDED = [
  /pm2\s+(?:stop|delete|restart)\s+(?!openclaw-gateway|whatsapp)/,
];

// ── Classification Engine ────────────────────────────────────────────────────

/**
 * Classify a command string by transport impact.
 * @param {string} command - raw command string
 * @returns {{ class: string, safe: boolean, requiresDetach: boolean, bannerMessage: string|null }}
 */
function classify(command) {
  const trimmed = command.trim();

  for (const pattern of TRANSPORT_AFFECTING) {
    if (pattern.test(trimmed)) {
      return {
        class: 'TRANSPORT_AFFECTING',
        safe: false,
        requiresDetach: true,
        bannerMessage: '⚠️ This command affects the active communications channel. It will be executed in isolated context only.',
      };
    }
  }

  for (const pattern of TRANSPORT_ADJACENT) {
    if (pattern.test(trimmed)) {
      return {
        class: 'TRANSPORT_ADJACENT',
        safe: false,
        requiresDetach: true,
        bannerMessage: '⚠️ This command affects the runtime communications substrate. It will be executed in isolated context only.',
      };
    }
  }

  for (const pattern of BOUNDED) {
    if (pattern.test(trimmed)) {
      return {
        class: 'BOUNDED',
        safe: true,
        requiresDetach: false,
        bannerMessage: null,
      };
    }
  }

  return {
    class: 'SAFE',
    safe: true,
    requiresDetach: false,
    bannerMessage: null,
  };
}

// ── Job Queue Management ─────────────────────────────────────────────────────

/**
 * Generate a short unique job ID.
 */
function generateJobId() {
  return 'tg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

/**
 * Persist a transport-affecting job to the pending queue.
 * @param {string} command
 * @param {string} classifiedAs - TRANSPORT_AFFECTING | TRANSPORT_ADJACENT
 * @returns {{ jobId: string, queuedAt: string }}
 */
function queueJob(command, classifiedAs) {
  const jobs = JSON.parse(fs.readFileSync(PENDING_JOBS_FILE, 'utf8'));

  const jobId = generateJobId();
  const queuedAt = new Date().toISOString();

  jobs.jobs.push({
    jobId,
    command,
    classifiedAs,
    queuedAt,
    executedAt: null,
    status: 'PENDING',
    result: null,
  });

  fs.writeFileSync(PENDING_JOBS_FILE, JSON.stringify(jobs, null, 2));

  return { jobId, queuedAt };
}

/**
 * Mark a job as complete.
 * @param {string} jobId
 * @param {string} result
 */
function markComplete(jobId, result) {
  const jobs = JSON.parse(fs.readFileSync(PENDING_JOBS_FILE, 'utf8'));
  const job = jobs.jobs.find(j => j.jobId === jobId);
  if (job) {
    job.status = 'COMPLETE';
    job.executedAt = new Date().toISOString();
    job.result = result;
    fs.writeFileSync(PENDING_JOBS_FILE, JSON.stringify(jobs, null, 2));
  }
}

/**
 * Read all pending jobs.
 * @returns {object[]}
 */
function getPendingJobs() {
  const jobs = JSON.parse(fs.readFileSync(PENDING_JOBS_FILE, 'utf8'));
  return jobs.jobs.filter(j => j.status === 'PENDING');
}

// ── Acknowledgment Generator ─────────────────────────────────────────────────

/**
 * Generate immediate acknowledgment text for a queued transport-affecting command.
 * @param {{ jobId: string, queuedAt: string }} queued
 * @param {string} command
 * @returns {string}
 */
function generateAck(queued, command) {
  return `Command queued for isolated execution.

Job ID: ${queued.jobId}
Queued at: ${queued.queuedAt}
Command: ${command}

This command affects the active communications channel and will be executed in isolated context only. You will be notified when execution completes.`;
}

// ── Main Entry Point ──────────────────────────────────────────────────────────

/**
 * Process a command — classify, queue if needed, generate acknowledgment.
 * @param {string} command
 * @returns {{ classification: object, queued: object|null, acknowledgment: string }}
 */
function handleCommand(command) {
  const classification = classify(command);

  if (!classification.requiresDetach) {
    return {
      classification,
      queued: null,
      acknowledgment: null,
    };
  }

  const queued = queueJob(command, classification.class);
  const acknowledgment = generateAck(queued, command);

  return { classification, queued, acknowledgment };
}

// ── Self-Test ────────────────────────────────────────────────────────────────

function runClassificationTests() {
  const testCases = [
    // TRANSPORT_AFFECTING
    { input: 'pm2 stop openclaw-gateway',                     expect: 'TRANSPORT_AFFECTING' },
    { input: 'pm2 delete openclaw-gateway',                   expect: 'TRANSPORT_AFFECTING' },
    { input: 'pm2 stop openclaw-gateway --force',            expect: 'TRANSPORT_AFFECTING' },
    { input: 'openclaw gateway stop',                        expect: 'TRANSPORT_AFFECTING' },
    { input: 'openclaw gateway kill',                        expect: 'TRANSPORT_AFFECTING' },

    // TRANSPORT_ADJACENT
    { input: 'pm2 restart openclaw-gateway',                 expect: 'TRANSPORT_ADJACENT' },
    { input: 'pm2 stop whatsapp',                            expect: 'TRANSPORT_ADJACENT' },
    { input: 'openclaw gateway restart',                      expect: 'TRANSPORT_ADJACENT' },
    { input: 'openclaw restart',                             expect: 'TRANSPORT_ADJACENT' },

    // BOUNDED
    { input: 'pm2 stop moosa-worker',                        expect: 'BOUNDED' },
    { input: 'pm2 delete qiyadon-audit-form',               expect: 'BOUNDED' },
    { input: 'pm2 restart cloudflared-tunnel',               expect: 'BOUNDED' },

    // SAFE
    { input: 'pm2 status',                                   expect: 'SAFE' },
    { input: 'pm2 jlist',                                    expect: 'SAFE' },
    { input: 'pm2 logs openclaw-gateway --lines 10',         expect: 'SAFE' },
    { input: 'pm2 status openclaw-gateway',                  expect: 'SAFE' },
    { input: 'pm2 status | grep gateway',                    expect: 'SAFE' },
    { input: 'curl http://localhost:18789/health',           expect: 'SAFE' },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const result = classify(tc.input);
    const ok = result.class === tc.expect;
    console.log(`${ok ? '✅' : '❌'} "${tc.input}" → ${result.class} ${ok ? '' : `(expected ${tc.expect})`}`);
    if (ok) passed++; else failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ── CLI ────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === '--test') {
    runClassificationTests();
    process.exit(0);
  }

  if (!args[0]) {
    console.error('Usage: node transport-guard.js "<command>" [--test]');
    process.exit(1);
  }

  const result = handleCommand(args.join(' '));
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { classify, queueJob, markComplete, getPendingJobs, generateAck, handleCommand };