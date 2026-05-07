/**
 * Retry Processor — Exponential backoff retry logic
 * Phase 2: Handles failed jobs with configurable retry strategies
 *
 * Provides retry scheduling with exponential backoff, jitter, and
 * per-job-type retry configuration.
 *
 * Shadow-safe: does not modify production workflow behavior.
 */
export interface RetryConfig {
    max_attempts: number;
    backoff_multiplier: number;
    initial_delay_ms: number;
    max_delay_ms: number;
}
export interface RetryDecision {
    shouldRetry: boolean;
    nextRetryAt: number;
    attemptNumber: number;
    delayMs: number;
}
/**
 * Get retry config for a specific job type, or default config.
 */
export declare function getRetryConfig(jobType: string): RetryConfig;
/**
 * Calculate backoff delay with exponential increase and jitter.
 *
 * Formula: min(initial_delay * multiplier^(attempt-1) + jitter, max_delay)
 *
 * @param attempt - Current retry attempt (1-indexed)
 * @param config - Retry configuration
 * @param jitterFactor - Random jitter factor (0.0 to 1.0), default 0.1
 */
export declare function calculateBackoffDelay(attempt: number, config: RetryConfig, jitterFactor?: number): number;
/**
 * Decide whether a job should be retried and when.
 *
 * @param attemptNumber - Current attempt (1-indexed, attempt 1 = first failure)
 * @param jobType - Type of job (determines retry config)
 * @param currentTime - Current timestamp in ms (for testing)
 */
export declare function shouldRetry(attemptNumber: number, jobType: string, currentTime?: number): RetryDecision;
/**
 * Test: verify backoff calculation.
 */
export declare function validateBackoffCalculations(): {
    passed: boolean;
    tests: Array<{
        attempt: number;
        jobType: string;
        expectedMin: number;
        expectedMax: number;
        actual: number;
        passed: boolean;
    }>;
};
/**
 * Get the next retry timestamp for a job.
 */
export declare function getNextRetryTimestamp(jobId: string, attemptNumber: number, jobType: string): number;
/**
 * Format delay for human-readable output.
 */
export declare function formatDelay(ms: number): string;
/**
 * Retry processor main loop — processes retry queue.
 * This would be called by a cron job or worker.
 */
export declare function processRetryQueue(getRetryJobs: () => Promise<Array<{
    job_id: string;
    attempt: number;
    job_type: string;
}>>, enqueueJob: (jobId: string, priority: number, timestamp: number) => Promise<void>): Promise<{
    processed: number;
    retried: number;
    deadLettered: number;
    errors: string[];
}>;
//# sourceMappingURL=retry-processor.d.ts.map