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

import { getQueueStats } from '../queue/queue-manager';

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

const DEFAULT_THRESHOLDS: QueueThresholds = {
  warningPending: 20,
  criticalPending: 50,
  warningRetry: 10,
  criticalRetry: 25,
  warningDeadLetter: 5,
  criticalDeadLetter: 20,
  warningActive: 10,
  criticalActive: 20,
};

let _alertHandlers: AlertHandler[] = [];
let _thresholds: QueueThresholds = DEFAULT_THRESHOLDS;

/**
 * Register an alert handler (e.g., for Slack notifications, PagerDuty, etc.)
 */
export function registerAlertHandler(handler: AlertHandler): void {
  _alertHandlers.push(handler);
}

/**
 * Clear all alert handlers (for testing).
 */
export function clearAlertHandlers(): void {
  _alertHandlers.length = 0;
}

/**
 * Configure queue depth thresholds.
 */
export function setThresholds(thresholds: Partial<QueueThresholds>): void {
  _thresholds = { ..._thresholds, ...thresholds };
}

/**
 * Reset thresholds to defaults.
 */
export function resetThresholds(): void {
  _thresholds = { ...DEFAULT_THRESHOLDS };
}

/**
 * Emit alerts to all registered handlers.
 */
function emitAlert(alert: QueueAlert): void {
  // Console output as default handler
  if (alert.severity === 'critical') {
    console.error(`🚨 QUEUE ALERT [CRITICAL]: ${alert.message}`);
  } else {
    console.warn(`⚠️  QUEUE ALERT [WARNING]: ${alert.message}`);
  }

  for (const handler of _alertHandlers) {
    try {
      handler(alert);
    } catch (err) {
      console.error('[queue-monitor] alert handler error:', err);
    }
  }
}

/**
 * Check thresholds and emit alerts if exceeded.
 * Returns the current queue stats plus any alerts triggered.
 */
export async function checkQueueHealth(): Promise<{
  stats: { pending: number; active: number; retry: number; dead_letter: number };
  alerts: QueueAlert[];
}> {
  const stats = await getQueueStats();
  const alerts: QueueAlert[] = [];
  const now = new Date().toISOString();

  // Check pending
  if (stats.pending >= _thresholds.criticalPending) {
    alerts.push({
      severity: 'critical',
      message: `Pending queue critical: ${stats.pending} jobs (threshold: ${_thresholds.criticalPending})`,
      metrics: stats,
      timestamp: now,
    });
  } else if (stats.pending >= _thresholds.warningPending) {
    alerts.push({
      severity: 'warning',
      message: `Pending queue warning: ${stats.pending} jobs (threshold: ${_thresholds.warningPending})`,
      metrics: stats,
      timestamp: now,
    });
  }

  // Check retry
  if (stats.retry >= _thresholds.criticalRetry) {
    alerts.push({
      severity: 'critical',
      message: `Retry queue critical: ${stats.retry} jobs (threshold: ${_thresholds.criticalRetry})`,
      metrics: stats,
      timestamp: now,
    });
  } else if (stats.retry >= _thresholds.warningRetry) {
    alerts.push({
      severity: 'warning',
      message: `Retry queue warning: ${stats.retry} jobs (threshold: ${_thresholds.warningRetry})`,
      metrics: stats,
      timestamp: now,
    });
  }

  // Check dead letter
  if (stats.dead_letter >= _thresholds.criticalDeadLetter) {
    alerts.push({
      severity: 'critical',
      message: `Dead letter queue critical: ${stats.dead_letter} jobs (threshold: ${_thresholds.criticalDeadLetter})`,
      metrics: stats,
      timestamp: now,
    });
  } else if (stats.dead_letter >= _thresholds.warningDeadLetter) {
    alerts.push({
      severity: 'warning',
      message: `Dead letter queue warning: ${stats.dead_letter} jobs (threshold: ${_thresholds.warningDeadLetter})`,
      metrics: stats,
      timestamp: now,
    });
  }

  // Check active
  if (stats.active >= _thresholds.criticalActive) {
    alerts.push({
      severity: 'critical',
      message: `Active workers critical: ${stats.active} jobs (threshold: ${_thresholds.criticalActive})`,
      metrics: stats,
      timestamp: now,
    });
  } else if (stats.active >= _thresholds.warningActive) {
    alerts.push({
      severity: 'warning',
      message: `Active workers warning: ${stats.active} jobs (threshold: ${_thresholds.warningActive})`,
      metrics: stats,
      timestamp: now,
    });
  }

  // Emit all triggered alerts
  for (const alert of alerts) {
    emitAlert(alert);
  }

  return { stats, alerts };
}

/**
 * Get a human-readable queue health summary.
 */
export async function getQueueHealthSummary(): Promise<string> {
  const { stats, alerts } = await checkQueueHealth();

  const lines = [
    `Queue Health (${new Date().toISOString()})`,
    `  Pending:    ${stats.pending}`,
    `  Active:     ${stats.active}`,
    `  Retry:      ${stats.retry}`,
    `  Dead Letter: ${stats.dead_letter}`,
  ];

  if (alerts.length > 0) {
    lines.push('');
    lines.push('Alerts:');
    for (const alert of alerts) {
      const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
      lines.push(`  ${icon} [${alert.severity}] ${alert.message}`);
    }
  } else {
    lines.push('');
    lines.push('✅ All queue metrics within normal limits');
  }

  return lines.join('\n');
}

/**
 * Start periodic queue health checks.
 * Returns a stop function.
 */
export function startPeriodicHealthCheck(intervalMs: number = 60000): () => void {
  const intervalId = setInterval(async () => {
    try {
      await checkQueueHealth();
    } catch (err) {
      console.error('[queue-monitor] periodic check error:', err);
    }
  }, intervalMs);

  console.log(`[queue-monitor] Periodic health checks started (every ${intervalMs}ms)`);

  return () => {
    clearInterval(intervalId);
    console.log('[queue-monitor] Periodic health checks stopped');
  };
}