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

import Redis from 'ioredis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_KEYS, REDIS_PREFIX } from '../config';

let _client: Redis | null = null;

/**
 * getRedis() — Returns the singleton Redis client.
 */
export function getRedis(): Redis {
  if (!_client) {
    _client = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD === '' ? undefined : REDIS_PASSWORD,
      db: REDIS_DB,
      
      // Connection handling
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('[redis] Max reconnection attempts reached');
          return null;  // Stop retrying
        }
        return Math.min(times * 200, 2000);  // Cap backoff at 2 seconds
      },
      
      // Keep-alive for persistent connections
      keepAlive: 10000,
      
      // Enable ready event logging
      lazyConnect: false,
    });
    
    _client.on('connect', () => {
      console.log(`[redis] Connected to ${REDIS_HOST}:${REDIS_PORT}`);
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
export async function healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  
  try {
    const redis = getRedis();
    const pong = await redis.ping();
    if (pong !== 'PONG') throw new Error('Unexpected ping response');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}

/**
 * Close the Redis connection (for graceful shutdown).
 */
export async function closeRedis(): Promise<void> {
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
export async function enqueueJob(jobId: string, priority: number, timestamp: number): Promise<void> {
  const redis = getRedis();
  // Score: priority * 1e13 + timestamp ensures priority ordering with FIFO tiebreak
  const score = priority * 1e13 + timestamp;
  await redis.zadd(REDIS_KEYS.jobPending, score, jobId);
}

/**
 * Dequeue the next job from the pending queue.
 * Uses ZPOPMIN to atomically get and remove the highest-priority, oldest job.
 * 
 * Returns null if queue is empty.
 */
export async function dequeueJob(): Promise<string | null> {
  const redis = getRedis();
  const result = await redis.zpopmin(REDIS_KEYS.jobPending, 1);
  
  if (!result || result.length === 0) return null;
  
  // Result is [member, score] array
  const [, score] = result[0] as [string, number];
  const jobId = result[0][0] as string;
  
  return jobId;
}

/**
 * Requeue a job for retry with exponential backoff.
 * Adds to the retry sorted set with the next retry time as score.
 * 
 * @param jobId - UUID of the job
 * @param nextRetryAt - Unix timestamp when job should be retried
 */
export async function requeueForRetry(jobId: string, nextRetryAt: number): Promise<void> {
  const redis = getRedis();
  await redis.zadd(REDIS_KEYS.jobRetry, nextRetryAt, jobId);
}

/**
 * Move expired retry jobs back to pending queue.
 * Called periodically by the queue manager.
 * 
 * @returns number of jobs moved
 */
export async function moveRetryJobsToPending(): Promise<number> {
  const redis = getRedis();
  const now = Date.now();
  
  // Get all retry jobs whose score (next retry time) <= now
  const expiredJobs = await redis.zrangebyscore(REDIS_KEYS.jobRetry, '-inf', now);
  
  if (expiredJobs.length === 0) return 0;
  
  // Move each to pending queue (re-rank by priority stored in job metadata)
  const pipeline = redis.pipeline();
  
  for (const jobId of expiredJobs) {
    // Remove from retry set
    pipeline.zrem(REDIS_KEYS.jobRetry, jobId);
    // Add to pending with priority 2 (medium) — priority will be corrected by job record lookup
    pipeline.zadd(REDIS_KEYS.jobPending, 2e13 + now, jobId);
  }
  
  await pipeline.exec();
  return expiredJobs.length;
}

/**
 * Move a job to the dead letter queue.
 * 
 * @param jobId - UUID of the job
 */
export async function moveToDeadLetter(jobId: string): Promise<void> {
  const redis = getRedis();
  await redis.zrem(REDIS_KEYS.jobRetry, jobId);
  await redis.lpush(REDIS_KEYS.jobDeadLetter, jobId);
}

/**
 * Get the count of jobs in a queue.
 * 
 * @param queue - 'pending' | 'retry' | 'dead_letter'
 */
export async function getQueueDepth(queue: 'pending' | 'retry' | 'dead_letter'): Promise<number> {
  const redis = getRedis();
  
  switch (queue) {
    case 'pending':
      return await redis.zcard(REDIS_KEYS.jobPending);
    case 'retry':
      return await redis.zcard(REDIS_KEYS.jobRetry);
    case 'dead_letter':
      return await redis.llen(REDIS_KEYS.jobDeadLetter);
    default:
      throw new Error(`Unknown queue type: ${queue}`);
  }
}

/**
 * Get jobs in pending queue (for observability).
 * Returns up to `limit` jobs starting from highest priority.
 */
export async function getPendingJobs(limit: number = 100): Promise<string[]> {
  const redis = getRedis();
  // ZRANGE with REV=true returns highest priority first
  return await redis.zrange(REDIS_KEYS.jobPending, 0, limit - 1, 'REV');
}

// ─── Worker Heartbeat Operations ───────────────────────────────────────────────

/**
 * Register/update a worker's heartbeat.
 * 
 * @param workerId - Unique worker identifier
 * @param metadata - Optional metadata about current job
 */
export async function workerHeartbeat(workerId: string, metadata?: object): Promise<void> {
  const redis = getRedis();
  await redis.hset(REDIS_KEYS.workerHeartbeat, workerId, JSON.stringify({
    timestamp: Date.now(),
    metadata: metadata || {},
  }));
}

/**
 * Get all alive workers (heartbeat within timeout).
 * 
 * @param timeoutMs - Workers with heartbeat older than this are considered dead
 */
export async function getAliveWorkers(timeoutMs: number = 60000): Promise<string[]> {
  const redis = getRedis();
  const heartbeats = await redis.hgetall(REDIS_KEYS.workerHeartbeat);
  const now = Date.now();
  const aliveWorkers: string[] = [];
  
  for (const [workerId, value] of Object.entries(heartbeats)) {
    try {
      const { timestamp } = JSON.parse(value);
      if (now - timestamp < timeoutMs) {
        aliveWorkers.push(workerId);
      }
    } catch {
      // Invalid heartbeat data — treat as dead
    }
  }
  
  return aliveWorkers;
}

/**
 * Remove a worker's heartbeat (on shutdown).
 */
export async function removeWorkerHeartbeat(workerId: string): Promise<void> {
  const redis = getRedis();
  await redis.hdel(REDIS_KEYS.workerHeartbeat, workerId);
}