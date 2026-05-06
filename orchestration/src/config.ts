/**
 * Environment Configuration — Orchestration Framework
 * 
 * All configuration is environment-driven. No hard-coded values.
 * Workers scale safely via these configuration values.
 */

require('dotenv').config();

// ─── Supabase ─────────────────────────────────────────────────────────────────
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co';
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// ─── Redis ─────────────────────────────────────────────────────────────────────
export const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
export const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);

// Redis key prefixes (namespaced for future multi-tenant or environment separation)
export const REDIS_PREFIX = process.env.REDIS_PREFIX || 'orchestration:';
export const REDIS_KEYS = {
  jobPending: `${REDIS_PREFIX}job:pending`,
  jobRetry: `${REDIS_PREFIX}job:retry`,
  jobDeadLetter: `${REDIS_PREFIX}job:dead_letter`,
  workerHeartbeat: `${REDIS_PREFIX}workers:heartbeat`,
  eventsChannel: 'orchestration:events',
};

// ─── Worker Configuration ──────────────────────────────────────────────────────
// Scale configuration: workers are configurable at runtime, not hard-coded
export const WORKER_CONFIG = {
  // Number of concurrent workers. Default 3. Can be overridden via WORKER_COUNT env var.
  // Safe scaling: increase WORKER_COUNT when queue depth grows consistently above 10 jobs/worker
  poolSize: parseInt(process.env.WORKER_COUNT || '3', 10),
  
  // Worker heartbeat interval (ms). Worker sends heartbeat every N ms.
  heartbeatIntervalMs: parseInt(process.env.WORKER_HEARTBEAT_INTERVAL_MS || '10000', 10),
  
  // Worker is marked dead if no heartbeat received for this many ms
  heartbeatTimeoutMs: parseInt(process.env.WORKER_HEARTBEAT_TIMEOUT_MS || '60000', 10),
  
  // Worker recycling: restart worker after N jobs to prevent memory leaks
  maxJobsPerWorker: parseInt(process.env.WORKER_MAX_JOBS || '1000', 10),
  
  // Job timeout (ms): kill job if running longer than this (except long-running tasks)
  jobTimeoutMs: parseInt(process.env.JOB_TIMEOUT_MS || '300000', 10),
  
  // Graceful shutdown: wait this long for in-flight jobs before forcing shutdown
  gracefulShutdownTimeoutMs: parseInt(process.env.GRACEFUL_SHUTDOWN_MS || '30000', 10),
};

// Worker scaling safety rules:
// - Never scale above maxPoolSize (cap from env)
// - Monitor queue depth per worker: if consistently >15 jobs/worker, consider scaling up
// - Scale down during low-traffic periods to free resources
export const WORKER_SCALING = {
  minPoolSize: 1,
  maxPoolSize: parseInt(process.env.WORKER_MAX_POOL_SIZE || '10', 10),
  scaleUpThreshold: 15,  // queue depth per worker before suggesting scale-up
  scaleDownThreshold: 3, // queue depth per worker before suggesting scale-down
  scaleUpCooldownMs: 60000,  // don't scale up more than once per minute
  scaleDownCooldownMs: 300000, // don't scale down more than once per 5 minutes
};

// ─── Queue Configuration ───────────────────────────────────────────────────────
export const QUEUE_CONFIG = {
  // Priority levels: 1=high, 2=medium, 3=low
  priorityHigh: 1,
  priorityMedium: 2,
  priorityLow: 3,
  
  // Dead letter threshold: job moves to dead letter after this many retries
  maxRetriesDefault: parseInt(process.env.DEFAULT_MAX_RETRIES || '3', 10),
  
  // Retry backoff multiplier (exponential)
  retryBackoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '2.0'),
  
  // Initial retry delay (ms)
  retryInitialDelayMs: parseInt(process.env.RETRY_INITIAL_DELAY_MS || '5000', 10),
  
  // Maximum retry delay (ms) — prevents backoff from growing unbounded
  retryMaxDelayMs: parseInt(process.env.RETRY_MAX_DELAY_MS || '300000', 10),
  
  // Job age threshold (ms): jobs older than this in pending are flagged as stale
  staleJobAgeMs: parseInt(process.env.STALE_JOB_AGE_MS || '600000', 10),
};

// ─── Execution Configuration ───────────────────────────────────────────────────
export const EXECUTION_CONFIG = {
  // Maximum plan execution depth (prevents infinite loops in event chains)
  maxPlanDepth: parseInt(process.env.MAX_PLAN_DEPTH || '50', 10),
  
  // Maximum event emission hops per correlation_id (prevents event loops)
  maxEventHops: parseInt(process.env.MAX_EVENT_HOPS || '10', 10),
  
  // Approval timeout (ms): pending approval auto-expires after this
  approvalTimeoutMs: parseInt(process.env.APPROVAL_TIMEOUT_MS || '3600000', 10), // 1 hour
  
  // Step evaluation batch size: max steps to evaluate per plan per cycle
  stepEvalBatchSize: parseInt(process.env.STEP_EVAL_BATCH_SIZE || '10', 10),
};

// ─── Observability Configuration ───────────────────────────────────────────────
export const OBSERVABILITY_CONFIG = {
  // Health check port
  healthPort: parseInt(process.env.HEALTH_PORT || '3004', 10),
  
  // Metrics retention period (days)
  metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || '30', 10),
  
  // Enable/disable detailed tracing (performance cost in high-volume scenarios)
  tracingEnabled: process.env.TRACING_ENABLED !== 'false',
};

// ─── Default Retry Configurations Per Job Type ────────────────────────────────
export const JOB_TYPE_RETRY_CONFIGS: Record<string, {
  max_attempts: number;
  backoff_multiplier: number;
  initial_delay_ms: number;
  max_delay_ms: number;
}> = {
  default: {
    max_attempts: QUEUE_CONFIG.maxRetriesDefault,
    backoff_multiplier: QUEUE_CONFIG.retryBackoffMultiplier,
    initial_delay_ms: QUEUE_CONFIG.retryInitialDelayMs,
    max_delay_ms: QUEUE_CONFIG.retryMaxDelayMs,
  },
  send_email: {
    max_attempts: 5,
    backoff_multiplier: 2,
    initial_delay_ms: 2000,
    max_delay_ms: 60000,
  },
  hubspot_api: {
    max_attempts: 3,
    backoff_multiplier: 1.5,
    initial_delay_ms: 5000,
    max_delay_ms: 120000,
  },
  spawn_subagent: {
    max_attempts: 2,
    backoff_multiplier: 1,
    initial_delay_ms: 10000,
    max_delay_ms: 30000,
  },
  database_write: {
    max_attempts: 5,
    backoff_multiplier: 2,
    initial_delay_ms: 1000,
    max_delay_ms: 60000,
  },
};

// ─── Validation ───────────────────────────────────────────────────────────────
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!SUPABASE_URL) errors.push('SUPABASE_URL is required');
  if (!SUPABASE_SERVICE_KEY) errors.push('SUPABASE_SERVICE_KEY is required');
  if (WORKER_CONFIG.poolSize < WORKER_SCALING.minPoolSize) {
    errors.push(`WORKER_COUNT must be >= ${WORKER_SCALING.minPoolSize}`);
  }
  if (WORKER_CONFIG.poolSize > WORKER_SCALING.maxPoolSize) {
    errors.push(`WORKER_COUNT must be <= ${WORKER_SCALING.maxPoolSize}`);
  }
  if (QUEUE_CONFIG.retryInitialDelayMs <= 0) errors.push('RETRY_INITIAL_DELAY_MS must be positive');
  
  return { valid: errors.length === 0, errors };
}