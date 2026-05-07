/**
 * Environment Configuration — Orchestration Framework
 *
 * All configuration is environment-driven. No hard-coded values.
 * Workers scale safely via these configuration values.
 */
export declare const SUPABASE_URL: string;
export declare const SUPABASE_SERVICE_KEY: string;
export declare const REDIS_HOST: string;
export declare const REDIS_PORT: number;
export declare const REDIS_PASSWORD: string | undefined;
export declare const REDIS_DB: number;
export declare const REDIS_PREFIX: string;
export declare const REDIS_KEYS: {
    jobPending: string;
    jobRetry: string;
    jobDeadLetter: string;
    workerHeartbeat: string;
    eventsChannel: string;
};
export declare const WORKER_CONFIG: {
    poolSize: number;
    heartbeatIntervalMs: number;
    heartbeatTimeoutMs: number;
    maxJobsPerWorker: number;
    jobTimeoutMs: number;
    gracefulShutdownTimeoutMs: number;
};
export declare const WORKER_SCALING: {
    minPoolSize: number;
    maxPoolSize: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    scaleUpCooldownMs: number;
    scaleDownCooldownMs: number;
};
export declare const QUEUE_CONFIG: {
    priorityHigh: number;
    priorityMedium: number;
    priorityLow: number;
    maxRetriesDefault: number;
    retryBackoffMultiplier: number;
    retryInitialDelayMs: number;
    retryMaxDelayMs: number;
    staleJobAgeMs: number;
};
export declare const EXECUTION_CONFIG: {
    maxPlanDepth: number;
    maxEventHops: number;
    approvalTimeoutMs: number;
    stepEvalBatchSize: number;
};
export declare const OBSERVABILITY_CONFIG: {
    healthPort: number;
    metricsRetentionDays: number;
    tracingEnabled: boolean;
};
export declare const JOB_TYPE_RETRY_CONFIGS: Record<string, {
    max_attempts: number;
    backoff_multiplier: number;
    initial_delay_ms: number;
    max_delay_ms: number;
}>;
export declare function validateConfig(): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=config.d.ts.map