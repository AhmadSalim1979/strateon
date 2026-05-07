"use strict";
/**
 * Recovery Scan — Dead letter and stalled run detection
 * Phase 2: Scans for problematic jobs and suggests/executes recovery actions
 *
 * Identifies:
 * - Dead letter queue entries
 * - Stalled jobs (pending too long without being picked up)
 * - Jobs stuck in active state without progress
 *
 * Shadow-safe: only identifies problems, doesn't auto-fix without explicit enablement.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDeadLetterQueue = scanDeadLetterQueue;
exports.scanStalledJobs = scanStalledJobs;
exports.getQueueDepths = getQueueDepths;
exports.runRecoveryScan = runRecoveryScan;
exports.peekDeadLetter = peekDeadLetter;
exports.removeFromDeadLetter = removeFromDeadLetter;
exports.replayDeadLetter = replayDeadLetter;
exports.formatScanResult = formatScanResult;
const redis_queue_1 = require("../queue/redis-queue");
const config_1 = require("../config");
/**
 * Scan the dead letter queue for entries.
 */
async function scanDeadLetterQueue() {
    const redis = (0, redis_queue_1.getRedis)();
    const entries = await redis.lrange(config_1.REDIS_KEYS.jobDeadLetter, 0, -1);
    const deadLetters = [];
    for (const entry of entries) {
        try {
            // Entry format: jobId:timestamp:attempt[:error]
            const parts = entry.split(':');
            const jobId = parts[0];
            const failedAt = new Date(parseInt(parts[1], 10)).toISOString();
            const attempt = parseInt(parts[2] || '0', 10);
            const lastError = parts[3];
            deadLetters.push({ job_id: jobId, failedAt, attempt, lastError });
        }
        catch {
            // Invalid entry format — still include as unknown
            deadLetters.push({
                job_id: entry,
                failedAt: new Date().toISOString(),
                attempt: 0,
            });
        }
    }
    return deadLetters;
}
/**
 * Scan for stalled jobs (pending too long without being picked up).
 * Uses the STALE_JOB_AGE_MS threshold from config.
 */
async function scanStalledJobs(inMemoryJobs) {
    const stalledJobs = [];
    const now = Date.now();
    const staleThreshold = config_1.QUEUE_CONFIG.staleJobAgeMs;
    for (const [jobId, job] of inMemoryJobs) {
        const createdAt = new Date(job.created_at).getTime();
        const waitTimeMs = now - createdAt;
        if (waitTimeMs > staleThreshold) {
            stalledJobs.push({
                job_id: jobId,
                job_type: job.job_type,
                pendingSince: job.created_at,
                waitTimeMs,
                priority: job.priority,
            });
        }
    }
    return stalledJobs;
}
/**
 * Get queue depth for monitoring.
 */
async function getQueueDepths() {
    const redis = (0, redis_queue_1.getRedis)();
    const [pending, retry, deadLetter] = await Promise.all([
        redis.zcard(config_1.REDIS_KEYS.jobPending),
        redis.zcard(config_1.REDIS_KEYS.jobRetry),
        redis.llen(config_1.REDIS_KEYS.jobDeadLetter),
    ]);
    return { pending, retry, deadLetter, total: pending + retry + deadLetter };
}
/**
 * Full recovery scan — checks all queues and identifies issues.
 */
async function runRecoveryScan(inMemoryJobs) {
    console.log('[recovery-scan] starting full scan...');
    const [deadLetters, depths] = await Promise.all([
        scanDeadLetterQueue(),
        getQueueDepths(),
    ]);
    const stalledJobs = inMemoryJobs ? await scanStalledJobs(inMemoryJobs) : [];
    const result = {
        deadLetterCount: deadLetters.length,
        deadLetters,
        stalledJobsCount: stalledJobs.length,
        stalledJobs,
        totalPending: depths.pending,
        totalActive: 0, // Active is tracked in memory, not Redis
        scannedAt: new Date().toISOString(),
    };
    console.log(`[recovery-scan] results: ${result.deadLetterCount} dead letters, ` +
        `${result.stalledJobsCount} stalled, ${result.totalPending} pending`);
    return result;
}
/**
 * Peek at next dead letter without removing it.
 */
async function peekDeadLetter() {
    const redis = (0, redis_queue_1.getRedis)();
    return await redis.lindex(config_1.REDIS_KEYS.jobDeadLetter, -1);
}
/**
 * Remove a specific job from dead letter queue (manual recovery).
 */
async function removeFromDeadLetter(jobId) {
    const redis = (0, redis_queue_1.getRedis)();
    const removed = await redis.lrem(config_1.REDIS_KEYS.jobDeadLetter, 0, jobId);
    return removed > 0;
}
/**
 * Replay a dead letter job back to pending queue (with new attempt).
 */
async function replayDeadLetter(jobId) {
    const redis = (0, redis_queue_1.getRedis)();
    // Remove from dead letter
    await removeFromDeadLetter(jobId);
    // Re-enqueue with high priority
    await redis.zadd(config_1.REDIS_KEYS.jobPending, 1e13 + Date.now(), jobId);
    console.log(`[recovery-scan] replayed dead letter job ${jobId}`);
}
/**
 * Format a recovery scan result for human-readable output.
 */
function formatScanResult(result) {
    const lines = [];
    lines.push('=== Recovery Scan Results ===');
    lines.push(`Scanned at: ${result.scannedAt}`);
    lines.push('');
    lines.push(`Dead Letters: ${result.deadLetterCount}`);
    if (result.deadLetters.length > 0) {
        for (const dl of result.deadLetters.slice(0, 10)) {
            lines.push(`  - ${dl.job_id}: failed at ${dl.failedAt}, attempt ${dl.attempt}`);
            if (dl.lastError)
                lines.push(`    error: ${dl.lastError}`);
        }
        if (result.deadLetters.length > 10) {
            lines.push(`  ... and ${result.deadLetters.length - 10} more`);
        }
    }
    lines.push('');
    lines.push(`Stalled Jobs: ${result.stalledJobsCount}`);
    if (result.stalledJobs.length > 0) {
        for (const sj of result.stalledJobs.slice(0, 5)) {
            const waitMin = Math.floor(sj.waitTimeMs / 60000);
            lines.push(`  - ${sj.job_id} (${sj.job_type}): waiting ${waitMin}m`);
        }
        if (result.stalledJobs.length > 5) {
            lines.push(`  ... and ${result.stalledJobs.length - 5} more`);
        }
    }
    lines.push('');
    lines.push(`Queue depths: ${result.totalPending} pending`);
    return lines.join('\n');
}
//# sourceMappingURL=scan.js.map