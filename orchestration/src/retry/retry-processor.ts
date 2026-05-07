/**
 * Retry Processor — Exponential backoff retry logic
 * Phase 2: Handles failed jobs with configurable retry strategies
 * 
 * Provides retry scheduling with exponential backoff, jitter, and
 * per-job-type retry configuration.
 * 
 * Shadow-safe: does not modify production workflow behavior.
 */

import { QUEUE_CONFIG, JOB_TYPE_RETRY_CONFIGS } from '../config';

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
export function getRetryConfig(jobType: string): RetryConfig {
  return JOB_TYPE_RETRY_CONFIGS[jobType] || JOB_TYPE_RETRY_CONFIGS.default;
}

/**
 * Calculate backoff delay with exponential increase and jitter.
 * 
 * Formula: min(initial_delay * multiplier^(attempt-1) + jitter, max_delay)
 * 
 * @param attempt - Current retry attempt (1-indexed)
 * @param config - Retry configuration
 * @param jitterFactor - Random jitter factor (0.0 to 1.0), default 0.1
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig,
  jitterFactor: number = 0.1
): number {
  const { backoff_multiplier, initial_delay_ms, max_delay_ms } = config;
  
  // Exponential backoff base
  const exponentialDelay = initial_delay_ms * Math.pow(backoff_multiplier, attempt - 1);
  
  // Add jitter to prevent thundering herd
  const jitterRange = exponentialDelay * jitterFactor;
  const jitter = (Math.random() * 2 - 1) * jitterRange;  // -jitterRange to +jitterRange
  
  const finalDelay = Math.max(0, exponentialDelay + jitter);
  
  // Cap at max_delay
  return Math.min(finalDelay, max_delay_ms);
}

/**
 * Decide whether a job should be retried and when.
 * 
 * @param attemptNumber - Current attempt (1-indexed, attempt 1 = first failure)
 * @param jobType - Type of job (determines retry config)
 * @param currentTime - Current timestamp in ms (for testing)
 */
export function shouldRetry(
  attemptNumber: number,
  jobType: string,
  currentTime: number = Date.now()
): RetryDecision {
  const config = getRetryConfig(jobType);
  
  if (attemptNumber >= config.max_attempts) {
    return {
      shouldRetry: false,
      nextRetryAt: 0,
      attemptNumber,
      delayMs: 0,
    };
  }
  
  const delayMs = calculateBackoffDelay(attemptNumber, config);
  const nextRetryAt = currentTime + delayMs;
  
  return {
    shouldRetry: true,
    nextRetryAt,
    attemptNumber,
    delayMs,
  };
}

/**
 * Test: verify backoff calculation.
 */
export function validateBackoffCalculations(): {
  passed: boolean;
  tests: Array<{
    attempt: number;
    jobType: string;
    expectedMin: number;
    expectedMax: number;
    actual: number;
    passed: boolean;
  }>;
} {
  const tests: Array<{
    attempt: number;
    jobType: string;
    expectedMin: number;
    expectedMax: number;
    actual: number;
    passed: boolean;
  }> = [];
  
  const testCases = [
    { attempt: 1, jobType: 'default', expectedMin: 4500, expectedMax: 5500 },
    { attempt: 2, jobType: 'default', expectedMin: 9000, expectedMax: 11000 },
    { attempt: 3, jobType: 'default', expectedMin: 18000, expectedMax: 22000 },
    { attempt: 1, jobType: 'send_email', expectedMin: 1800, expectedMax: 2200 },
    { attempt: 2, jobType: 'send_email', expectedMin: 3600, expectedMax: 4400 },
  ];
  
  let allPassed = true;
  
  for (const tc of testCases) {
    const config = getRetryConfig(tc.jobType);
    // Get deterministic value by using 0 jitter
    const delay = calculateBackoffDelay(tc.attempt, config, 0);
    const passed = delay >= tc.expectedMin && delay <= tc.expectedMax;
    
    tests.push({
      attempt: tc.attempt,
      jobType: tc.jobType,
      expectedMin: tc.expectedMin,
      expectedMax: tc.expectedMax,
      actual: delay,
      passed,
    });
    
    if (!passed) allPassed = false;
  }
  
  return { passed: allPassed, tests };
}

/**
 * Get the next retry timestamp for a job.
 */
export function getNextRetryTimestamp(
  jobId: string,
  attemptNumber: number,
  jobType: string
): number {
  const decision = shouldRetry(attemptNumber, jobType);
  return decision.nextRetryAt;
}

/**
 * Format delay for human-readable output.
 */
export function formatDelay(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Retry processor main loop — processes retry queue.
 * This would be called by a cron job or worker.
 */
export async function processRetryQueue(
  getRetryJobs: () => Promise<Array<{ job_id: string; attempt: number; job_type: string }>>,
  enqueueJob: (jobId: string, priority: number, timestamp: number) => Promise<void>
): Promise<{
  processed: number;
  retried: number;
  deadLettered: number;
  errors: string[];
}> {
  const jobs = await getRetryJobs();
  
  const result = {
    processed: 0,
    retried: 0,
    deadLettered: 0,
    errors: [] as string[],
  };
  
  const now = Date.now();
  
  for (const job of jobs) {
    try {
      const decision = shouldRetry(job.attempt, job.job_type, now);
      
      if (!decision.shouldRetry) {
        // Max retries exceeded — dead letter
        result.deadLettered++;
        continue;
      }
      
      if (decision.nextRetryAt > now) {
        // Not yet time to retry
        continue;
      }
      
      // Retry is due — move to pending queue
      const priority = 2; // medium priority for retries
      await enqueueJob(job.job_id, priority, now);
      result.retried++;
    } catch (err: any) {
      result.errors.push(`job ${job.job_id}: ${err.message}`);
    }
    
    result.processed++;
  }
  
  return result;
}