"use strict";
/**
 * Redis Client — Orchestration Framework
 *
 * ioredis client configured for local-first operation.
 * Designed to be swappable: if we migrate to Redis Cloud later,
 * only this file changes (same interface, different connection string).
 *
 * Connection: local Redis on Hetzner server (127.0.0.1:6379)
 * Future migration: change REDIS_HOST in config.ts to Redis Cloud host
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.healthCheck = healthCheck;
exports.closeRedis = closeRedis;
exports.enqueueJob = enqueueJob;
exports.dequeueJob = dequeueJob;
exports.requeueForRetry = requeueForRetry;
exports.moveRetryJobsToPending = moveRetryJobsToPending;
exports.moveToDeadLetter = moveToDeadLetter;
exports.getQueueDepth = getQueueDepth;
exports.getPendingJobs = getPendingJobs;
exports.workerHeartbeat = workerHeartbeat;
exports.getAliveWorkers = getAliveWorkers;
exports.removeWorkerHeartbeat = removeWorkerHeartbeat;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
let _client = null;
/**
 * getRedis() — Returns the singleton Redis client.
 */
function getRedis() {
    if (!_client) {
        _client = new ioredis_1.default({
            host: config_1.REDIS_HOST,
            port: config_1.REDIS_PORT,
            password: config_1.REDIS_PASSWORD === '' ? undefined : config_1.REDIS_PASSWORD,
            db: config_1.REDIS_DB,
            // Connection handling
            retryStrategy: (times) => {
                if (times > 10) {
                    console.error('[redis] Max reconnection attempts reached');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000); // Cap backoff at 2 seconds
            },
            // Keep-alive for persistent connections
            keepAlive: 10000,
            // Enable ready event logging
            lazyConnect: false,
        });
        _client.on('connect', () => {
            console.log(`[redis] Connected to ${config_1.REDIS_HOST}:${config_1.REDIS_PORT}`);
        });
        _client.on('error', (err) => {
            console.error('[redis] Connection error:', err.message);
        });
        _client.on('close', () => {
            console.log('[redis] Connection closed');
        });
    }
    return _client;
}
/**
 * Health check — verifies Redis is alive.
 */
async function healthCheck() {
    const start = Date.now();
    try {
        const redis = getRedis();
        const pong = await redis.ping();
        if (pong !== 'PONG')
            throw new Error('Unexpected ping response');
        return { ok: true, latencyMs: Date.now() - start };
    }
    catch (err) {
        return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
}
/**
 * Close the Redis connection (for graceful shutdown).
 */
async function closeRedis() {
    if (_client) {
        await _client.quit();
        _client = null;
        console.log('[redis] Disconnected');
    }
}
// ─── Queue Operations ──────────────────────────────────────────────────────────
// These are the queue primitives. They operate on Redis and are
// designed to be composeable into higher-level queue operations.
/**
 * Enqueue a job to the pending queue.
 * Score = priority (lower = higher priority) + timestamp for FIFO within priority.
 *
 * @param jobId - UUID of the job
 * @param priority - 1 (high), 2 (medium), 3 (low)
 * @param timestamp - Unix timestamp in milliseconds
 */
async function enqueueJob(jobId, priority, timestamp) {
    const redis = getRedis();
    // Score: priority * 1e13 + timestamp ensures priority ordering with FIFO tiebreak
    const score = priority * 1e13 + timestamp;
    await redis.zadd(config_1.REDIS_KEYS.jobPending, score, jobId);
}
/**
 * Dequeue the next job from the pending queue.
 * Uses ZPOPMIN to atomically get and remove the highest-priority, oldest job.
 *
 * Returns null if queue is empty.
 */
async function dequeueJob() {
    const redis = getRedis();
    const result = await redis.zpopmin(config_1.REDIS_KEYS.jobPending, 1);
    if (!result || result.length === 0)
        return null;
    // ioredis returns [member, score] flat array
    const jobId = result[0];
    return jobId;
}
/**
 * Requeue a job for retry with exponential backoff.
 * Adds to the retry sorted set with the next retry time as score.
 *
 * @param jobId - UUID of the job
 * @param nextRetryAt - Unix timestamp when job should be retried
 */
async function requeueForRetry(jobId, nextRetryAt) {
    const redis = getRedis();
    await redis.zadd(config_1.REDIS_KEYS.jobRetry, nextRetryAt, jobId);
}
/**
 * Move expired retry jobs back to pending queue.
 * Called periodically by the queue manager.
 *
 * @returns number of jobs moved
 */
async function moveRetryJobsToPending() {
    const redis = getRedis();
    const now = Date.now();
    // Get all retry jobs whose score (next retry time) <= now
    const expiredJobs = await redis.zrangebyscore(config_1.REDIS_KEYS.jobRetry, '-inf', now);
    if (expiredJobs.length === 0)
        return 0;
    // Move each to pending queue (re-rank by priority stored in job metadata)
    const pipeline = redis.pipeline();
    for (const jobId of expiredJobs) {
        // Remove from retry set
        pipeline.zrem(config_1.REDIS_KEYS.jobRetry, jobId);
        // Add to pending with priority 2 (medium) — priority will be corrected by job record lookup
        pipeline.zadd(config_1.REDIS_KEYS.jobPending, 2e13 + now, jobId);
    }
    await pipeline.exec();
    return expiredJobs.length;
}
/**
 * Move a job to the dead letter queue.
 *
 * @param jobId - UUID of the job
 */
async function moveToDeadLetter(jobId) {
    const redis = getRedis();
    await redis.zrem(config_1.REDIS_KEYS.jobRetry, jobId);
    await redis.lpush(config_1.REDIS_KEYS.jobDeadLetter, jobId);
}
/**
 * Get the count of jobs in a queue.
 *
 * @param queue - 'pending' | 'retry' | 'dead_letter'
 */
async function getQueueDepth(queue) {
    const redis = getRedis();
    switch (queue) {
        case 'pending':
            return await redis.zcard(config_1.REDIS_KEYS.jobPending);
        case 'retry':
            return await redis.zcard(config_1.REDIS_KEYS.jobRetry);
        case 'dead_letter':
            return await redis.llen(config_1.REDIS_KEYS.jobDeadLetter);
        default:
            throw new Error(`Unknown queue type: ${queue}`);
    }
}
/**
 * Get jobs in pending queue (for observability).
 * Returns up to `limit` jobs starting from highest priority.
 */
async function getPendingJobs(limit = 100) {
    const redis = getRedis();
    // ZRANGE with REV=true returns highest priority first
    return await redis.zrange(config_1.REDIS_KEYS.jobPending, 0, limit - 1, 'REV');
}
// ─── Worker Heartbeat Operations ───────────────────────────────────────────────
/**
 * Register/update a worker's heartbeat.
 *
 * @param workerId - Unique worker identifier
 * @param metadata - Optional metadata about current job
 */
async function workerHeartbeat(workerId, metadata) {
    const redis = getRedis();
    await redis.hset(config_1.REDIS_KEYS.workerHeartbeat, workerId, JSON.stringify({
        timestamp: Date.now(),
        metadata: metadata || {},
    }));
}
/**
 * Get all alive workers (heartbeat within timeout).
 *
 * @param timeoutMs - Workers with heartbeat older than this are considered dead
 */
async function getAliveWorkers(timeoutMs = 60000) {
    const redis = getRedis();
    const heartbeats = await redis.hgetall(config_1.REDIS_KEYS.workerHeartbeat);
    const now = Date.now();
    const aliveWorkers = [];
    for (const [workerId, value] of Object.entries(heartbeats)) {
        try {
            const { timestamp } = JSON.parse(value);
            if (now - timestamp < timeoutMs) {
                aliveWorkers.push(workerId);
            }
        }
        catch {
            // Invalid heartbeat data — treat as dead
        }
    }
    return aliveWorkers;
}
/**
 * Remove a worker's heartbeat (on shutdown).
 */
async function removeWorkerHeartbeat(workerId) {
    const redis = getRedis();
    await redis.hdel(config_1.REDIS_KEYS.workerHeartbeat, workerId);
}
//# sourceMappingURL=redis-queue.js.map