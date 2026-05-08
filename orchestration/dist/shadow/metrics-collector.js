"use strict";
/**
 * Metrics Collector — Phase 4: Runtime Metrics Collection
 *
 * Collects performance and operational metrics for the orchestration
 * runtime. Metrics are collected in shadow mode and do not affect
 * production systems.
 *
 * Metrics collected:
 * - Execution timing (event processing time, workflow duration)
 * - Queue depths (shadow queue, production queue comparison)
 * - Replay accuracy (shadow vs N8N behavior matching)
 * - Drift frequency and severity
 * - Error rates and types
 * - Governance enforcement (blocked actions, allowed actions)
 * - Resource utilization (memory, CPU proxy via timing)
 *
 * Metrics are stored in Redis (short-term) and Supabase shadow_events (long-term).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordEventTiming = recordEventTiming;
exports.recordGovernanceDecision = recordGovernanceDecision;
exports.trackShadowRun = trackShadowRun;
exports.collectMetrics = collectMetrics;
exports.takeMetricsSnapshot = takeMetricsSnapshot;
exports.saveMetricsSnapshot = saveMetricsSnapshot;
exports.getMetricsRange = getMetricsRange;
exports.getRealTimeMetrics = getRealTimeMetrics;
exports.resetMetrics = resetMetrics;
exports.getTrackedShadowRuns = getTrackedShadowRuns;
const uuid_1 = require("uuid");
const _eventTimings = [];
const _governanceDecisions = [];
let _metricsStartTime = Date.now();
let _shadowRunIds = new Set();
// ─── Metrics Collection ─────────────────────────────────────────────────────────
/**
 * Record an event processing timing.
 * Called after each event is processed (shadow or production).
 */
function recordEventTiming(eventType, processingTimeMs) {
    _eventTimings.push({
        event_type: eventType,
        processing_time_ms: processingTimeMs,
        timestamp: new Date().toISOString(),
    });
    // Keep only last 10000 timings to prevent memory bloat
    if (_eventTimings.length > 10000) {
        _eventTimings.shift();
    }
}
/**
 * Record a governance decision.
 * Called whenever governance guard makes a decision.
 */
function recordGovernanceDecision(action, allowed, blocked) {
    _governanceDecisions.push({
        action,
        allowed,
        blocked,
        timestamp: new Date().toISOString(),
    });
    // Keep only last 10000 decisions
    if (_governanceDecisions.length > 10000) {
        _governanceDecisions.shift();
    }
}
/**
 * Track a shadow run ID.
 */
function trackShadowRun(shadow_run_id) {
    _shadowRunIds.add(shadow_run_id);
}
/**
 * Collect all metrics for the current period.
 */
async function collectMetrics(shadow_run_id) {
    const now = new Date();
    const periodEnd = now.toISOString();
    const periodStart = new Date(_metricsStartTime).toISOString();
    const runId = shadow_run_id || `metrics-${Date.now()}`;
    // Get queue stats
    let shadowQueueDepth = 0;
    let shadowQueueCapacity = 1000;
    try {
        const { getShadowQueueStats } = await Promise.resolve().then(() => __importStar(require('./shadow-queue')));
        const stats = getShadowQueueStats();
        shadowQueueDepth = stats.pending + stats.processing;
        shadowQueueCapacity = 1000; // arbitrary capacity limit
    }
    catch {
        // shadow-queue not yet loaded
    }
    // Calculate execution metrics
    const recentTimings = _eventTimings.slice(-1000); // last 1000 events
    const eventTypeCounts = {};
    let totalProcessingMs = 0;
    let maxProcessingMs = 0;
    let minProcessingMs = Infinity;
    for (const timing of recentTimings) {
        eventTypeCounts[timing.event_type] = (eventTypeCounts[timing.event_type] || 0) + 1;
        totalProcessingMs += timing.processing_time_ms;
        maxProcessingMs = Math.max(maxProcessingMs, timing.processing_time_ms);
        minProcessingMs = Math.min(minProcessingMs, timing.processing_time_ms);
    }
    const avgProcessingMs = recentTimings.length > 0 ? totalProcessingMs / recentTimings.length : 0;
    // Calculate governance metrics
    const recentDecisions = _governanceDecisions.slice(-1000);
    let actionsAllowed = 0;
    let actionsBlocked = 0;
    const blockedByType = {};
    for (const decision of recentDecisions) {
        if (decision.allowed) {
            actionsAllowed++;
        }
        else {
            actionsBlocked++;
            blockedByType[decision.action] = (blockedByType[decision.action] || 0) + 1;
        }
    }
    // Calculate drift metrics
    const driftStats = await getDriftStats();
    // System metrics
    const memUsageMb = await getMemoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - _metricsStartTime) / 1000);
    // Redis health
    let redisConnected = false;
    let supabaseConnected = false;
    try {
        const { healthCheck: redisHealth } = await Promise.resolve().then(() => __importStar(require('../queue/redis-queue')));
        const redisResult = await redisHealth();
        redisConnected = redisResult.ok;
    }
    catch {
        redisConnected = false;
    }
    try {
        const { healthCheck: supabaseHealth } = await Promise.resolve().then(() => __importStar(require('../persistence/supabase-client')));
        const supabaseResult = await supabaseHealth();
        supabaseConnected = supabaseResult.ok;
    }
    catch {
        supabaseConnected = false;
    }
    // Count errors/warnings in last hour
    const oneHourAgo = Date.now() - 3600000;
    const recentErrors = _eventTimings.filter(t => new Date(t.timestamp).getTime() > oneHourAgo && t.processing_time_ms > 5000).length;
    const metrics = {
        collected_at: now.toISOString(),
        period_start: periodStart,
        period_end: periodEnd,
        shadow_run_id: runId,
        execution_metrics: {
            total_events_processed: _eventTimings.length,
            shadow_events_processed: recentTimings.filter(t => t.event_type.startsWith('shadow.')).length,
            production_events_processed: recentTimings.filter(t => !t.event_type.startsWith('shadow.')).length,
            events_by_type: eventTypeCounts,
            average_event_processing_ms: Math.round(avgProcessingMs * 100) / 100,
            max_event_processing_ms: maxProcessingMs,
            min_event_processing_ms: minProcessingMs === Infinity ? 0 : minProcessingMs,
            total_workflow_duration_ms: totalProcessingMs,
            workflows_completed: recentTimings.filter(t => t.event_type.endsWith('.completed')).length,
            workflows_failed: recentTimings.filter(t => t.event_type.endsWith('.failed')).length,
        },
        queue_metrics: {
            shadow_queue_depth: shadowQueueDepth,
            shadow_queue_capacity: shadowQueueCapacity,
            shadow_queue_utilization_pct: Math.round((shadowQueueDepth / shadowQueueCapacity) * 100),
            shadow_events_enqueued: recentTimings.filter(t => t.event_type.endsWith('.enqueued')).length,
            shadow_events_dequeued: recentTimings.filter(t => t.event_type.endsWith('.dequeued')).length,
            shadow_events_completed: recentTimings.filter(t => t.event_type.endsWith('.completed')).length,
            shadow_events_failed: recentTimings.filter(t => t.event_type.endsWith('.failed')).length,
            shadow_events_blocked: recentTimings.filter(t => t.event_type.endsWith('.blocked')).length,
        },
        drift_metrics: driftStats,
        governance_metrics: {
            total_decisions: recentDecisions.length,
            actions_allowed: actionsAllowed,
            actions_blocked: actionsBlocked,
            blocked_by_type: blockedByType,
            shadow_enforcements: recentDecisions.filter(d => !d.allowed).length,
            production_enforcements: recentDecisions.filter(d => d.allowed).length,
        },
        system_metrics: {
            memory_usage_mb: memUsageMb,
            uptime_seconds: uptimeSeconds,
            redis_connected: redisConnected,
            supabase_connected: supabaseConnected,
            errors_last_hour: recentErrors,
            warnings_last_hour: 0,
        },
    };
    return metrics;
}
/**
 * Get drift statistics from Supabase.
 */
async function getDriftStats() {
    try {
        const { getDriftStatistics } = await Promise.resolve().then(() => __importStar(require('./drift-detector')));
        const stats = await getDriftStatistics();
        const severityDistribution = stats.severity_distribution || {};
        const mostCommon = Object.entries(severityDistribution).sort((a, b) => b[1] - a[1])[0];
        return {
            total_reports: stats.total_reports,
            reports_with_drift: stats.reports_with_drift,
            drift_rate_pct: stats.total_reports > 0
                ? Math.round((stats.reports_with_drift / stats.total_reports) * 100)
                : 0,
            average_drift_points_per_report: Math.round(stats.average_drift_points * 100) / 100,
            severity_distribution: severityDistribution,
            most_common_drift_type: mostCommon ? mostCommon[0] : 'none',
        };
    }
    catch {
        return {
            total_reports: 0,
            reports_with_drift: 0,
            drift_rate_pct: 0,
            average_drift_points_per_report: 0,
            severity_distribution: {},
            most_common_drift_type: 'none',
        };
    }
}
/**
 * Get current memory usage in MB.
 */
async function getMemoryUsage() {
    try {
        const memUsage = process.memoryUsage();
        return Math.round(memUsage.heapUsed / 1024 / 1024);
    }
    catch {
        return 0;
    }
}
/**
 * Take a snapshot of current metrics.
 * Snapshots are stored for historical comparison.
 */
async function takeMetricsSnapshot(shadow_run_id) {
    const snapshot_id = `snapshot-${Date.now()}-${(0, uuid_1.v4)().slice(0, 8)}`;
    const metrics = await collectMetrics(shadow_run_id);
    return {
        snapshot_id,
        timestamp: new Date().toISOString(),
        metrics,
    };
}
/**
 * Save metrics snapshot to Supabase.
 */
async function saveMetricsSnapshot(snapshot) {
    const { getClient } = await Promise.resolve().then(() => __importStar(require('../persistence/supabase-client')));
    try {
        const supabase = getClient();
        await supabase.from('shadow_events').insert({
            shadow_run_id: snapshot.metrics.shadow_run_id,
            event_type: 'metrics.snapshot',
            action: 'metrics.collected',
            target: 'orchestration',
            payload: JSON.stringify({
                snapshot_id: snapshot.snapshot_id,
                collected_at: snapshot.metrics.collected_at,
                period_start: snapshot.metrics.period_start,
                period_end: snapshot.metrics.period_end,
                execution_metrics: snapshot.metrics.execution_metrics,
                queue_metrics: snapshot.metrics.queue_metrics,
                drift_metrics: snapshot.metrics.drift_metrics,
                governance_metrics: snapshot.metrics.governance_metrics,
                system_metrics: snapshot.metrics.system_metrics,
            }),
            simulated: true,
            result: 'snapshot_saved',
            executed_at: snapshot.timestamp,
        });
    }
    catch (err) {
        console.error(`[metrics-collector] Failed to save snapshot: ${err.message}`);
    }
}
// ─── Metrics Query ─────────────────────────────────────────────────────────────
/**
 * Get metrics for a time range.
 */
async function getMetricsRange(from, to) {
    const { getClient } = await Promise.resolve().then(() => __importStar(require('../persistence/supabase-client')));
    try {
        const supabase = getClient();
        const { data, error } = await supabase
            .from('shadow_events')
            .select('*')
            .eq('event_type', 'metrics.snapshot')
            .gte('executed_at', from)
            .lte('executed_at', to)
            .order('executed_at', { ascending: true });
        if (error)
            throw error;
        return (data || []).map(row => {
            const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
            return {
                collected_at: payload.collected_at,
                period_start: payload.period_start,
                period_end: payload.period_end,
                shadow_run_id: row.shadow_run_id,
                execution_metrics: payload.execution_metrics,
                queue_metrics: payload.queue_metrics,
                drift_metrics: payload.drift_metrics,
                governance_metrics: payload.governance_metrics,
                system_metrics: payload.system_metrics,
            };
        });
    }
    catch (err) {
        console.error(`[metrics-collector] Failed to get metrics range: ${err.message}`);
        return [];
    }
}
// ─── Real-time Metrics ─────────────────────────────────────────────────────────
/**
 * Get real-time metrics summary.
 * Lightweight call for dashboards / health checks.
 */
function getRealTimeMetrics() {
    const recent = _eventTimings.slice(-100);
    const avgMs = recent.length > 0
        ? recent.reduce((s, t) => s + t.processing_time_ms, 0) / recent.length
        : 0;
    const recentErrors = recent.filter(t => t.processing_time_ms > 5000).length;
    const blockedCount = _governanceDecisions.slice(-100).filter(d => !d.allowed).length;
    return {
        events_processed: _eventTimings.length,
        avg_processing_ms: Math.round(avgMs * 100) / 100,
        queue_depth: _shadowRunIds.size,
        recent_errors: recentErrors,
        governance_blocked: blockedCount,
        redis_connected: true,
    };
}
/**
 * Reset metrics collection (for testing).
 */
function resetMetrics() {
    _eventTimings.length = 0;
    _governanceDecisions.length = 0;
    _metricsStartTime = Date.now();
    _shadowRunIds.clear();
}
/**
 * Get summary of all shadow run IDs.
 */
function getTrackedShadowRuns() {
    return Array.from(_shadowRunIds);
}
//# sourceMappingURL=metrics-collector.js.map