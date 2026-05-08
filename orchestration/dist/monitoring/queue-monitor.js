"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueueStats = void 0;
exports.startQueueMonitor = startQueueMonitor;
exports.stopQueueMonitor = stopQueueMonitor;
exports.getMonitorStatus = getMonitorStatus;
const queue_manager_1 = require("../queue/queue-manager");
const event_bus_1 = require("../events/event-bus");
const event_schemas_1 = require("../events/event-schemas");
// Re-export for convenience
var queue_manager_2 = require("../queue/queue-manager");
Object.defineProperty(exports, "getQueueStats", { enumerable: true, get: function () { return queue_manager_2.getQueueStats; } });
let _intervalId = null;
let _lastWarningAt = null;
let _lastCriticalAt = null;
// Cooldown: don't re-alert for the same level within this window
const ALERT_COOLDOWN_MS = 300000; // 5 minutes
function shouldAlert(lastAlertAt) {
    if (!lastAlertAt)
        return true;
    return Date.now() - lastAlertAt > ALERT_COOLDOWN_MS;
}
async function emitAlert(severity, message, stats) {
    const event = (0, event_schemas_1.createEvent)(event_schemas_1.EventTypes.SYSTEM_ALERT, 'queue-monitor', {
        severity,
        component: 'queue-monitor',
        message,
        details: {
            queue_depth: stats.pending,
            active_jobs: stats.active,
            dead_letter_count: stats.dead_letter,
            retry_count: stats.retry,
        },
    });
    await (0, event_bus_1.publishEvent)(event);
}
/**
 * Start the queue monitoring loop.
 * Checks queue depth at the configured interval and emits alerts when thresholds are exceeded.
 */
function startQueueMonitor(config) {
    if (_intervalId) {
        console.warn('[queue-monitor] Already running. Call stopQueueMonitor() first.');
        return;
    }
    console.log(`[queue-monitor] Starting queue monitor (warning=${config.warningThreshold}, critical=${config.criticalThreshold}, interval=${config.checkIntervalMs}ms)`);
    _intervalId = setInterval(async () => {
        try {
            const stats = await (0, queue_manager_1.getQueueStats)();
            const depth = stats.pending;
            // Critical check
            if (depth >= config.criticalThreshold) {
                if (shouldAlert(_lastCriticalAt)) {
                    await emitAlert('critical', `Queue depth critical: ${depth} jobs pending (threshold: ${config.criticalThreshold})`, stats);
                    _lastCriticalAt = Date.now();
                    console.error(`[queue-monitor] 🚨 CRITICAL: Queue depth ${depth} exceeds critical threshold ${config.criticalThreshold}`);
                }
            }
            // Warning check
            else if (depth >= config.warningThreshold) {
                if (shouldAlert(_lastWarningAt)) {
                    await emitAlert('warning', `Queue depth warning: ${depth} jobs pending (threshold: ${config.warningThreshold})`, stats);
                    _lastWarningAt = Date.now();
                    console.warn(`[queue-monitor] ⚠️  WARNING: Queue depth ${depth} exceeds warning threshold ${config.warningThreshold}`);
                }
            }
        }
        catch (err) {
            console.error('[queue-monitor] Error checking queue depth:', err);
        }
    }, config.checkIntervalMs);
}
/**
 * Stop the queue monitoring loop.
 */
function stopQueueMonitor() {
    if (_intervalId) {
        clearInterval(_intervalId);
        _intervalId = null;
        console.log('[queue-monitor] Stopped');
    }
}
/**
 * Get current monitor status (for health checks).
 */
function getMonitorStatus() {
    return {
        running: _intervalId !== null,
        lastWarningAt: _lastWarningAt,
        lastCriticalAt: _lastCriticalAt,
    };
}
//# sourceMappingURL=queue-monitor.js.map