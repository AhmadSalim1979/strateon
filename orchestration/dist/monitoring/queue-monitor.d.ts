/**
 * Queue Monitor — Queue depth monitoring and alerting
 * Phase 3: Queue depth monitoring and alerting
 *
 * Periodically checks queue depth and emits alerts when thresholds are exceeded.
 * Alerts are emitted as system.alert events via the event bus.
 *
 * Thresholds:
 *   - warning: queue depth exceeds warning threshold
 *   - critical: queue depth exceeds critical threshold
 *
 * Env vars:
 *   QUEUE_DEPTH_WARNING    — default 50
 *   QUEUE_DEPTH_CRITICAL   — default 100
 *   QUEUE_MONITOR_INTERVAL — check interval in ms (default 30000)
 */
export { getQueueStats } from '../queue/queue-manager';
interface QueueMonitorConfig {
    warningThreshold: number;
    criticalThreshold: number;
    checkIntervalMs: number;
}
/**
 * Start the queue monitoring loop.
 * Checks queue depth at the configured interval and emits alerts when thresholds are exceeded.
 */
export declare function startQueueMonitor(config: QueueMonitorConfig): void;
/**
 * Stop the queue monitoring loop.
 */
export declare function stopQueueMonitor(): void;
/**
 * Get current monitor status (for health checks).
 */
export declare function getMonitorStatus(): {
    running: boolean;
    lastWarningAt: number | null;
    lastCriticalAt: number | null;
};
//# sourceMappingURL=queue-monitor.d.ts.map