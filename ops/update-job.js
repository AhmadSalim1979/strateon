/**
 * update-job.js
 * Update a pending-transport-jobs.json job atomically.
 * Called by transport-guard.sh — not used directly.
 *
 * Usage: node update-job.js <jobId> <status> <executedAt> <output_base64> <exitCode> <mode>
 */

const fs = require('fs');
const path = require('path');

const PENDING_FILE = '/ops/pending-transport-jobs.json';

const [, , jobId, status, executedAt, outputB64, exitCode, mode] = process.argv;

const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
const job = pending.jobs.find(j => j.jobId === jobId);

if (!job) {
    console.log('JOB-NOT-FOUND');
    process.exit(0);
}

job.status = status;
job.executedAt = executedAt;
job.result = {
    mode,
    command: job.command,
    executedAt,
    output: Buffer.from(outputB64, 'base64').toString('utf8'),
    exitCode: exitCode === 'null' ? null : Number(exitCode),
};

fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
console.log('UPDATED');