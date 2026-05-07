"use strict";
/**
 * Structured Logger — Observability Hooks
 * Phase 3: Emits structured, machine-parseable log entries for every event
 *
 * Every event processed by the orchestration runtime generates a structured
 * log entry with consistent fields:
 *   { event_id, event_type, timestamp, source, correlation_id, duration_ms, success }
 *
 * This enables:
 * - Query-based log analysis (Elasticsearch, Grafana Loki, etc.)
 * - Event pipeline debugging and tracing
 * - Performance analysis and bottleneck identification
 * - Audit trails for governance
 *
 * Shadow-safe: logs what would have happened without making real calls.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitStructuredLog = emitStructuredLog;
exports.logEventStart = logEventStart;
exports.logEventComplete = logEventComplete;
exports.withStructuredLogging = withStructuredLogging;
exports.startTimer = startTimer;
exports.logQueueMetrics = logQueueMetrics;
/**
 * Emit a structured log entry to console.
 *
 * In production, this would be routed to a log aggregation system.
 * Currently outputs as JSON to stdout for machine parsing.
 */
function emitStructuredLog(entry) {
    const output = JSON.stringify({
        // Normalize null/undefined for consistent field presence
        event_id: entry.event_id || 'unknown',
        event_type: entry.event_type || 'unknown',
        timestamp: entry.timestamp || new Date().toISOString(),
        duration_ms: entry.duration_ms || 0,
        source: entry.source || 'unknown',
        correlation_id: entry.correlation_id || null,
        success: entry.success,
        error: entry.error || null,
        hop_count: entry.hop_count ?? null,
        mode: entry.mode || 'production',
        job_id: entry.job_id || null,
    });
    if (entry.success) {
        console.log(`[structured-log] ${output}`);
    }
    else {
        console.error(`[structured-log] ${output}`);
    }
}
/**
 * Log an event start — marks the beginning of event processing.
 */
function logEventStart(params) {
    emitStructuredLog({
        event_id: params.event_id,
        event_type: params.event_type,
        timestamp: new Date().toISOString(),
        duration_ms: 0,
        source: params.source,
        correlation_id: params.correlation_id || null,
        success: true,
        hop_count: params.hop_count,
        mode: params.mode || 'production',
        job_id: params.job_id,
    });
}
/**
 * Log an event completion — marks the end of event processing.
 */
function logEventComplete(params) {
    emitStructuredLog({
        event_id: params.event_id,
        event_type: params.event_type,
        timestamp: new Date().toISOString(),
        duration_ms: params.duration_ms,
        source: params.source,
        correlation_id: params.correlation_id || null,
        success: params.success,
        error: params.error,
        hop_count: params.hop_count,
        mode: params.mode || 'production',
        job_id: params.job_id,
    });
}
/**
 * Wrap a handler function to automatically emit structured logs.
 *
 * Usage:
 *   const wrappedHandler = withStructuredLogging(originalHandler, 'event-router');
 *   await registerRoute('job.*', wrappedHandler);
 */
function withStructuredLogging(handler, source, mode = 'production') {
    return async (event) => {
        const startTime = Date.now();
        try {
            await handler(event);
            const duration_ms = Date.now() - startTime;
            logEventComplete({
                event_id: event.event_id,
                event_type: event.event_type,
                duration_ms,
                source,
                correlation_id: event.correlation_id,
                success: true,
                hop_count: event.hop_count,
                mode,
            });
        }
        catch (err) {
            const duration_ms = Date.now() - startTime;
            logEventComplete({
                event_id: event.event_id,
                event_type: event.event_type,
                duration_ms,
                source,
                correlation_id: event.correlation_id,
                success: false,
                error: err.message,
                hop_count: event.hop_count,
                mode,
            });
            throw err;
        }
    };
}
/**
 * Create a timing helper for measuring operation duration.
 */
function startTimer() {
    const start = Date.now();
    return () => Date.now() - start;
}
/**
 * Emit a batch of structured logs for queue monitoring.
 */
function logQueueMetrics(params) {
    const entry = {
        event_id: 'queue-metrics',
        event_type: 'system.queue_metrics',
        timestamp: params.timestamp || new Date().toISOString(),
        duration_ms: 0,
        source: 'queue-monitor',
        correlation_id: null,
        success: true,
        metrics: {
            pending: params.pending,
            active: params.active,
            retry: params.retry,
            dead_letter: params.dead_letter,
        },
    };
    console.log(`[structured-log] ${JSON.stringify(entry)}`);
}
//# sourceMappingURL=structured-logger.js.map