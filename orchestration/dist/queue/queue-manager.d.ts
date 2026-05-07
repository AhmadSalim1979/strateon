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
export interface Job {
    job_id: string;
    job_type: string;
    payload: object;
    priority: number;
    status: 'pending' | 'active' | 'completed' | 'failed' | 'dead_lettered';
    retry_count: number;
    max_retries: number;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    error?: string;
    correlation_id?: string;
    caused_by_job_id?: string;
}
/**
 * Create a new job and enqueue it.
 */
export declare function enqueue(jobType: string, payload: object, options?: {
    priority?: number;
    max_retries?: number;
    correlation_id?: string;
    caused_by_job_id?: string;
}): Promise<Job>;
/**
 * Dequeue the next available job (highest priority, oldest first).
 * Returns null if no jobs are available.
 */
export declare function dequeue(): Promise<Job | null>;
/**
 * Mark a job as completed.
 */
export declare function complete(jobId: string, result?: object): Promise<void>;
/**
 * Mark a job as failed. If retry_count < max_retries, schedules a retry.
 * Otherwise moves to dead letter queue.
 */
export declare function fail(jobId: string, error: string): Promise<void>;
/**
 * Cancel a pending job.
 */
export declare function cancel(jobId: string): Promise<void>;
/**
 * Get job by ID.
 */
export declare function getJob(jobId: string): Job | undefined;
/**
 * Get queue depth statistics.
 */
export declare function getQueueStats(): Promise<{
    pending: number;
    active: number;
    retry: number;
    dead_letter: number;
}>;
/**
 * Calculate exponential backoff delay.
 */
declare function calculateBackoff(attempt: number): number;
/**
 * Move expired retry jobs back to pending queue.
 * Called periodically to process retry queue.
 */
export declare function processRetryQueue(): Promise<number>;
/**
 * Get all jobs in memory (for debugging/testing).
 */
export declare function getAllJobs(): Job[];
/**
 * Clear job from memory (for testing).
 */
export declare function clearJob(jobId: string): void;
/**
 * Reset queue manager (for testing).
 */
export declare function resetQueueManager(): void;
export { calculateBackoff };
//# sourceMappingURL=queue-manager.d.ts.map