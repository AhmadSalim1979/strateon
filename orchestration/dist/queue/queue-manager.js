"use strict";
/**
 * Queue Manager — Redis-backed job queue CRUD
 * Phase 2: Manages job queues in Redis with priority ordering
 *
 * Provides higher-level queue operations on top of redis-queue primitives.
 * Shadow-safe: does not affect production N8N workflows.
 *
 * Job states: pending → active → completed/failed/dead_lettered
 * Jobs move through states via explicit transition calls.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueue = enqueue;
exports.dequeue = dequeue;
exports.complete = complete;
exports.fail = fail;
exports.cancel = cancel;
exports.getJob = getJob;
exports.getQueueStats = getQueueStats;
exports.processRetryQueue = processRetryQueue;
exports.getAllJobs = getAllJobs;
exports.clearJob = clearJob;
exports.resetQueueManager = resetQueueManager;
exports.calculateBackoff = calculateBackoff;
const uuid_1 = require("uuid");
const redis_queue_1 = require("../queue/redis-queue");
const config_1 = require("../config");
const _jobStore = {};
const JOB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
/**
 * Create a new job and enqueue it.
 */
async function enqueue(jobType, payload, options) {
    const jobId = (0, uuid_1.v4)();
    const now = Date.now();
    const job = {
        job_id: jobId,
        job_type: jobType,
        payload,
        priority: options?.priority ?? config_1.QUEUE_CONFIG.priorityMedium,
        status: 'pending',
        retry_count: 0,
        max_retries: options?.max_retries ?? config_1.QUEUE_CONFIG.maxRetriesDefault,
        created_at: new Date(now).toISOString(),
        correlation_id: options?.correlation_id,
        caused_by_job_id: options?.caused_by_job_id,
    };
    // Store job in memory (production would use Redis hash with TTL)
    _jobStore[jobId] = job;
    // Enqueue to Redis priority queue
    await (0, redis_queue_1.enqueueJob)(jobId, job.priority, now);
    console.log(`[queue-manager] enqueued job ${jobId} (${jobType}) priority=${job.priority}`);
    return job;
}
/**
 * Dequeue the next available job (highest priority, oldest first).
 * Returns null if no jobs are available.
 */
async function dequeue() {
    const jobId = await (0, redis_queue_1.dequeueJob)();
    if (!jobId)
        return null;
    const job = _jobStore[jobId];
    if (!job) {
        console.warn(`[queue-manager] dequeued unknown job ${jobId}`);
        return null;
    }
    if (job.status !== 'pending') {
        console.warn(`[queue-manager] job ${jobId} is not pending (status=${job.status}), skipping`);
        return null;
    }
    job.status = 'active';
    job.started_at = new Date().toISOString();
    console.log(`[queue-manager] dequeued job ${jobId} (${job.job_type})`);
    return job;
}
/**
 * Mark a job as completed.
 */
async function complete(jobId, result) {
    const job = _jobStore[jobId];
    if (!job) {
        console.warn(`[queue-manager] complete() for unknown job ${jobId}`);
        return;
    }
    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    if (result) {
        job.payload._result = result;
    }
    console.log(`[queue-manager] completed job ${jobId} (${job.job_type})`);
}
/**
 * Mark a job as failed. If retry_count < max_retries, schedules a retry.
 * Otherwise moves to dead letter queue.
 */
async function fail(jobId, error) {
    const job = _jobStore[jobId];
    if (!job) {
        console.warn(`[queue-manager] fail() for unknown job ${jobId}`);
        return;
    }
    job.retry_count++;
    job.error = error;
    if (job.retry_count < job.max_retries) {
        // Schedule retry with exponential backoff
        const backoffMs = calculateBackoff(job.retry_count);
        const nextRetryAt = Date.now() + backoffMs;
        await (0, redis_queue_1.requeueForRetry)(jobId, nextRetryAt);
        console.log(`[queue-manager] job ${jobId} failed (attempt ${job.retry_count}/${job.max_retries}), retry scheduled in ${backoffMs}ms`);
    }
    else {
        // Max retries exceeded — move to dead letter
        await (0, redis_queue_1.moveToDeadLetter)(jobId);
        job.status = 'dead_lettered';
        job.completed_at = new Date().toISOString();
        console.log(`[queue-manager] job ${jobId} dead-lettered after ${job.retry_count} attempts`);
    }
}
/**
 * Cancel a pending job.
 */
async function cancel(jobId) {
    const job = _jobStore[jobId];
    if (!job) {
        console.warn(`[queue-manager] cancel() for unknown job ${jobId}`);
        return;
    }
    if (job.status !== 'pending' && job.status !== 'active') {
        console.warn(`[queue-manager] cannot cancel job ${jobId} with status ${job.status}`);
        return;
    }
    job.status = 'failed';
    job.completed_at = new Date().toISOString();
    job.error = 'Cancelled by operator';
    console.log(`[queue-manager] cancelled job ${jobId}`);
}
/**
 * Get job by ID.
 */
function getJob(jobId) {
    return _jobStore[jobId];
}
/**
 * Get queue depth statistics.
 */
async function getQueueStats() {
    const [pending, retry, deadLetter] = await Promise.all([
        (0, redis_queue_1.getQueueDepth)('pending'),
        (0, redis_queue_1.getQueueDepth)('retry'),
        (0, redis_queue_1.getQueueDepth)('dead_letter'),
    ]);
    const active = Object.values(_jobStore).filter(j => j.status === 'active').length;
    return { pending, active, retry, dead_letter: deadLetter };
}
/**
 * Calculate exponential backoff delay.
 */
function calculateBackoff(attempt) {
    const delay = Math.min(config_1.QUEUE_CONFIG.retryInitialDelayMs * Math.pow(config_1.QUEUE_CONFIG.retryBackoffMultiplier, attempt - 1), config_1.QUEUE_CONFIG.retryMaxDelayMs);
    return Math.floor(delay);
}
/**
 * Move expired retry jobs back to pending queue.
 * Called periodically to process retry queue.
 */
async function processRetryQueue() {
    const { moveRetryJobsToPending } = await Promise.resolve().then(() => __importStar(require('../queue/redis-queue')));
    return await moveRetryJobsToPending();
}
/**
 * Get all jobs in memory (for debugging/testing).
 */
function getAllJobs() {
    return Object.values(_jobStore);
}
/**
 * Clear job from memory (for testing).
 */
function clearJob(jobId) {
    delete _jobStore[jobId];
}
/**
 * Reset queue manager (for testing).
 */
function resetQueueManager() {
    Object.keys(_jobStore).forEach(key => delete _jobStore[key]);
    console.log('[queue-manager] reset');
}
//# sourceMappingURL=queue-manager.js.map