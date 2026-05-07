/**
 * Recovery Scan — Dead letter and stalled run detection
 * Phase 2: Scans for problematic jobs and suggests/executes recovery actions
 *
 * Identifies:
 * - Dead letter queue entries
 * - Stalled jobs (pending too long without being picked up)
 * - Jobs stuck in active state without progress
 *
 * Shadow-safe: only identifies problems, doesn't auto-fix without explicit enablement.
 */
export interface DeadLetterEntry {
    job_id: string;
    failedAt: string;
    attempt: number;
    lastError?: string;
}
export interface StalledJob {
    job_id: string;
    job_type: string;
    pendingSince: string;
    waitTimeMs: number;
    priority: number;
}
export interface RecoveryScanResult {
    deadLetterCount: number;
    deadLetters: DeadLetterEntry[];
    stalledJobsCount: number;
    stalledJobs: StalledJob[];
    totalPending: number;
    totalActive: number;
    scannedAt: string;
}
/**
 * Scan the dead letter queue for entries.
 */
export declare function scanDeadLetterQueue(): Promise<DeadLetterEntry[]>;
/**
 * Scan for stalled jobs (pending too long without being picked up).
 * Uses the STALE_JOB_AGE_MS threshold from config.
 */
export declare function scanStalledJobs(inMemoryJobs: Map<string, {
    job_type: string;
    created_at: string;
    priority: number;
}>): Promise<StalledJob[]>;
/**
 * Get queue depth for monitoring.
 */
export declare function getQueueDepths(): Promise<{
    pending: number;
    retry: number;
    deadLetter: number;
    total: number;
}>;
/**
 * Full recovery scan — checks all queues and identifies issues.
 */
export declare function runRecoveryScan(inMemoryJobs?: Map<string, {
    job_type: string;
    created_at: string;
    priority: number;
}>): Promise<RecoveryScanResult>;
/**
 * Peek at next dead letter without removing it.
 */
export declare function peekDeadLetter(): Promise<string | null>;
/**
 * Remove a specific job from dead letter queue (manual recovery).
 */
export declare function removeFromDeadLetter(jobId: string): Promise<boolean>;
/**
 * Replay a dead letter job back to pending queue (with new attempt).
 */
export declare function replayDeadLetter(jobId: string): Promise<void>;
/**
 * Format a recovery scan result for human-readable output.
 */
export declare function formatScanResult(result: RecoveryScanResult): string;
//# sourceMappingURL=scan.d.ts.map