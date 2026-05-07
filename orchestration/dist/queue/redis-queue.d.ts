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
/**
 * getRedis() — Returns the singleton Redis client.
 */
export declare function getRedis(): Redis;
/**
 * Health check — verifies Redis is alive.
 */
export declare function healthCheck(): Promise<{
    ok: boolean;
    latencyMs: number;
    error?: string;
}>;
/**
 * Close the Redis connection (for graceful shutdown).
 */
export declare function closeRedis(): Promise<void>;
/**
 * Enqueue a job to the pending queue.
 * Score = priority (lower = higher priority) + timestamp for FIFO within priority.
 *
 * @param jobId - UUID of the job
 * @param priority - 1 (high), 2 (medium), 3 (low)
 * @param timestamp - Unix timestamp in milliseconds
 */
export declare function enqueueJob(jobId: string, priority: number, timestamp: number): Promise<void>;
/**
 * Dequeue the next job from the pending queue.
 * Uses ZPOPMIN to atomically get and remove the highest-priority, oldest job.
 *
 * Returns null if queue is empty.
 */
export declare function dequeueJob(): Promise<string | null>;
/**
 * Requeue a job for retry with exponential backoff.
 * Adds to the retry sorted set with the next retry time as score.
 *
 * @param jobId - UUID of the job
 * @param nextRetryAt - Unix timestamp when job should be retried
 */
export declare function requeueForRetry(jobId: string, nextRetryAt: number): Promise<void>;
/**
 * Move expired retry jobs back to pending queue.
 * Called periodically by the queue manager.
 *
 * @returns number of jobs moved
 */
export declare function moveRetryJobsToPending(): Promise<number>;
/**
 * Move a job to the dead letter queue.
 *
 * @param jobId - UUID of the job
 */
export declare function moveToDeadLetter(jobId: string): Promise<void>;
/**
 * Get the count of jobs in a queue.
 *
 * @param queue - 'pending' | 'retry' | 'dead_letter'
 */
export declare function getQueueDepth(queue: 'pending' | 'retry' | 'dead_letter'): Promise<number>;
/**
 * Get jobs in pending queue (for observability).
 * Returns up to `limit` jobs starting from highest priority.
 */
export declare function getPendingJobs(limit?: number): Promise<string[]>;
/**
 * Register/update a worker's heartbeat.
 *
 * @param workerId - Unique worker identifier
 * @param metadata - Optional metadata about current job
 */
export declare function workerHeartbeat(workerId: string, metadata?: object): Promise<void>;
/**
 * Get all alive workers (heartbeat within timeout).
 *
 * @param timeoutMs - Workers with heartbeat older than this are considered dead
 */
export declare function getAliveWorkers(timeoutMs?: number): Promise<string[]>;
/**
 * Remove a worker's heartbeat (on shutdown).
 */
export declare function removeWorkerHeartbeat(workerId: string): Promise<void>;
//# sourceMappingURL=redis-queue.d.ts.map