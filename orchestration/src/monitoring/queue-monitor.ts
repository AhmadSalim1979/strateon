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

import { getQueueStats } from '../queue/queue-manager';
import { publishEvent } from '../events/event-bus';
import { createEvent, EventTypes } from '../events/event-schemas';

// Re-export for convenience
export { getQueueStats } from '../queue/queue-manager';

interface QueueStats {
  pending: number;
  active: number;
  retry: number;
  dead_letter: number;
}

interface QueueMonitorConfig {
  warningThreshold: number;
  criticalThreshold: number;
  checkIntervalMs: number;
}

let _intervalId: ReturnType<typeof setInterval> | null = null;
let _lastWarningAt: number | null = null;
let _lastCriticalAt: number | null = null;

// Cooldown: don't re-alert for the same level within this window
const ALERT_COOLDOWN_MS = 300000; // 5 minutes

function shouldAlert(lastAlertAt: number | null): boolean {
  if (!lastAlertAt) return true;
  return Date.now() - lastAlertAt > ALERT_COOLDOWN_MS;
}

async function emitAlert(severity: 'warning' | 'critical', message: string, stats: QueueStats): Promise<void> {
  const event = createEvent(EventTypes.SYSTEM_ALERT, 'queue-monitor', {
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
  
  await publishEvent(event);
}

/**
 * Start the queue monitoring loop.
 * Checks queue depth at the configured interval and emits alerts when thresholds are exceeded.
 */
export function startQueueMonitor(config: QueueMonitorConfig): void {
  if (_intervalId) {
    console.warn('[queue-monitor] Already running. Call stopQueueMonitor() first.');
    return;
  }
  
  console.log(`[queue-monitor] Starting queue monitor (warning=${config.warningThreshold}, critical=${config.criticalThreshold}, interval=${config.checkIntervalMs}ms)`);
  
  _intervalId = setInterval(async () => {
    try {
      const stats = await getQueueStats();
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
    } catch (err) {
      console.error('[queue-monitor] Error checking queue depth:', err);
    }
  }, config.checkIntervalMs);
}

/**
 * Stop the queue monitoring loop.
 */
export function stopQueueMonitor(): void {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log('[queue-monitor] Stopped');
  }
}

/**
 * Get current monitor status (for health checks).
 */
export function getMonitorStatus(): { running: boolean; lastWarningAt: number | null; lastCriticalAt: number | null } {
  return {
    running: _intervalId !== null,
    lastWarningAt: _lastWarningAt,
    lastCriticalAt: _lastCriticalAt,
  };
}