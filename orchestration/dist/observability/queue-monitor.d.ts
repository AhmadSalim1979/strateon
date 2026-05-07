/**
 * Queue Monitor — Queue Depth Monitoring Hooks
 * Phase 3: Monitors queue depth and emits alerts when thresholds are exceeded
 *
 * Wraps the existing getQueueStats() with monitoring hooks for:
 * - Warning thresholds (queue depth approaching limits)
 * - Critical thresholds (queue depth exceeding safe limits)
 * - Automatic alerting when conditions are met
 *
 * Shadow-safe: monitoring does not affect production queue operations.
 */
export interface QueueThresholds {
    /** Warning: pending jobs exceed this count */
    warningPending: number;
    /** Critical: pending jobs exceed this count */
    criticalPending: number;
    /** Warning: retry jobs exceed this count */
    warningRetry: number;
    /** Critical: retry jobs exceed this count */
    criticalRetry: number;
    /** Warning: dead letter jobs exceed this count */
    warningDeadLetter: number;
    /** Critical: dead letter jobs exceed this count */
    criticalDeadLetter: number;
    /** Warning: active jobs exceed this count */
    warningActive: number;
    /** Critical: active jobs exceed this count */
    criticalActive: number;
}
export interface QueueAlert {
    severity: 'warning' | 'critical';
    message: string;
    metrics: {
        pending: number;
        active: number;
        retry: number;
        dead_letter: number;
    };
    timestamp: string;
}
export type AlertHandler = (alert: QueueAlert) => void;
/**
 * Register an alert handler (e.g., for Slack notifications, PagerDuty, etc.)
 */
export declare function registerAlertHandler(handler: AlertHandler): void;
/**
 * Clear all alert handlers (for testing).
 */
export declare function clearAlertHandlers(): void;
/**
 * Configure queue depth thresholds.
 */
export declare function setThresholds(thresholds: Partial<QueueThresholds>): void;
/**
 * Reset thresholds to defaults.
 */
export declare function resetThresholds(): void;
/**
 * Check thresholds and emit alerts if exceeded.
 * Returns the current queue stats plus any alerts triggered.
 */
export declare function checkQueueHealth(): Promise<{
    stats: {
        pending: number;
        active: number;
        retry: number;
        dead_letter: number;
    };
    alerts: QueueAlert[];
}>;
/**
 * Get a human-readable queue health summary.
 */
export declare function getQueueHealthSummary(): Promise<string>;
/**
 * Start periodic queue health checks.
 * Returns a stop function.
 */
export declare function startPeriodicHealthCheck(intervalMs?: number): () => void;
//# sourceMappingURL=queue-monitor.d.ts.map