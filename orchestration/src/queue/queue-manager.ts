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

import { v4 as uuidv4 } from 'uuid';
import { 
  getRedis, 
  enqueueJob, 
  dequeueJob, 
  requeueForRetry, 
  moveToDeadLetter, 
  getQueueDepth 
} from '../queue/redis-queue';
import { QUEUE_CONFIG } from '../config';

export interface Job {
  job_id: string;
  job_type: string;
  payload: object;
  priority: number;  // 1=high, 2=medium, 3=low
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

interface JobStore {
  [job_id: string]: Job;
}

const _jobStore: JobStore = {};

const JOB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create a new job and enqueue it.
 */
export async function enqueue(
  jobType: string,
  payload: object,
  options?: {
    priority?: number;
    max_retries?: number;
    correlation_id?: string;
    caused_by_job_id?: string;
  }
): Promise<Job> {
  const jobId = uuidv4();
  const now = Date.now();
  
  const job: Job = {
    job_id: jobId,
    job_type: jobType,
    payload,
    priority: options?.priority ?? QUEUE_CONFIG.priorityMedium,
    status: 'pending',
    retry_count: 0,
    max_retries: options?.max_retries ?? QUEUE_CONFIG.maxRetriesDefault,
    created_at: new Date(now).toISOString(),
    correlation_id: options?.correlation_id,
    caused_by_job_id: options?.caused_by_job_id,
  };
  
  // Store job in memory (production would use Redis hash with TTL)
  _jobStore[jobId] = job;
  
  // Enqueue to Redis priority queue
  await enqueueJob(jobId, job.priority, now);
  
  console.log(`[queue-manager] enqueued job ${jobId} (${jobType}) priority=${job.priority}`);
  
  return job;
}

/**
 * Dequeue the next available job (highest priority, oldest first).
 * Returns null if no jobs are available.
 */
export async function dequeue(): Promise<Job | null> {
  const jobId = await dequeueJob();
  
  if (!jobId) return null;
  
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
export async function complete(jobId: string, result?: object): Promise<void> {
  const job = _jobStore[jobId];
  
  if (!job) {
    console.warn(`[queue-manager] complete() for unknown job ${jobId}`);
    return;
  }
  
  job.status = 'completed';
  job.completed_at = new Date().toISOString();
  if (result) {
    (job.payload as any)._result = result;
  }
  
  console.log(`[queue-manager] completed job ${jobId} (${job.job_type})`);
}

/**
 * Mark a job as failed. If retry_count < max_retries, schedules a retry.
 * Otherwise moves to dead letter queue.
 */
export async function fail(jobId: string, error: string): Promise<void> {
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
    
    await requeueForRetry(jobId, nextRetryAt);
    
    console.log(`[queue-manager] job ${jobId} failed (attempt ${job.retry_count}/${job.max_retries}), retry scheduled in ${backoffMs}ms`);
  } else {
    // Max retries exceeded — move to dead letter
    await moveToDeadLetter(jobId);
    job.status = 'dead_lettered';
    job.completed_at = new Date().toISOString();
    
    console.log(`[queue-manager] job ${jobId} dead-lettered after ${job.retry_count} attempts`);
  }
}

/**
 * Cancel a pending job.
 */
export async function cancel(jobId: string): Promise<void> {
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
export function getJob(jobId: string): Job | undefined {
  return _jobStore[jobId];
}

/**
 * Get queue depth statistics.
 */
export async function getQueueStats(): Promise<{
  pending: number;
  active: number;
  retry: number;
  dead_letter: number;
}> {
  const [pending, retry, deadLetter] = await Promise.all([
    getQueueDepth('pending'),
    getQueueDepth('retry'),
    getQueueDepth('dead_letter'),
  ]);
  
  const active = Object.values(_jobStore).filter(j => j.status === 'active').length;
  
  return { pending, active, retry, dead_letter: deadLetter };
}

/**
 * Calculate exponential backoff delay.
 */
function calculateBackoff(attempt: number): number {
  const delay = Math.min(
    QUEUE_CONFIG.retryInitialDelayMs * Math.pow(QUEUE_CONFIG.retryBackoffMultiplier, attempt - 1),
    QUEUE_CONFIG.retryMaxDelayMs
  );
  return Math.floor(delay);
}

/**
 * Move expired retry jobs back to pending queue.
 * Called periodically to process retry queue.
 */
export async function processRetryQueue(): Promise<number> {
  const { moveRetryJobsToPending } = await import('../queue/redis-queue');
  return await moveRetryJobsToPending();
}

/**
 * Get all jobs in memory (for debugging/testing).
 */
export function getAllJobs(): Job[] {
  return Object.values(_jobStore);
}

/**
 * Clear job from memory (for testing).
 */
export function clearJob(jobId: string): void {
  delete _jobStore[jobId];
}

/**
 * Reset queue manager (for testing).
 */
export function resetQueueManager(): void {
  Object.keys(_jobStore).forEach(key => delete _jobStore[key]);
  console.log('[queue-manager] reset');
}

export { calculateBackoff };