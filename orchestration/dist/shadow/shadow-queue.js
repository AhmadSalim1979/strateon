"use strict";
/**
 * Shadow Queue — Phase 4: Shadow Mode Queue Processing
 *
 * Shadow queue receives events and queues them for shadow replay.
 * Unlike the production queue, shadow queue:
 *
 * - Never executes live actions
 * - Is completely isolated from production Redis queue
 * - Stores shadow events in memory + Supabase shadow_events table
 * - Supports replay, pause, resume
 * - Does not affect production job execution
 *
 * Architecture:
 * - shadow_events are stored in a Redis-backed in-process queue
 * - Each event is wrapped with shadow_run_id for traceability
 * - Events are processed by shadow-replay, not by production workers
 * - Shadow queue state persists to Supabase (survives restarts)
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
exports.shadowEnqueue = shadowEnqueue;
exports.shadowDequeue = shadowDequeue;
exports.shadowPeek = shadowPeek;
exports.shadowComplete = shadowComplete;
exports.shadowFail = shadowFail;
exports.shadowBlock = shadowBlock;
exports.shadowQueueDepth = shadowQueueDepth;
exports.getShadowQueueStats = getShadowQueueStats;
exports.shadowClearQueue = shadowClearQueue;
exports.shadowPause = shadowPause;
exports.shadowResume = shadowResume;
exports.isShadowProcessing = isShadowProcessing;
exports.getCurrentShadowRunId = getCurrentShadowRunId;
exports.getShadowQueueEvents = getShadowQueueEvents;
exports.shadowEnqueueBatch = shadowEnqueueBatch;
exports.persistShadowQueue = persistShadowQueue;
exports.restoreShadowQueue = restoreShadowQueue;
const uuid_1 = require("uuid");
const governance_guard_1 = require("./governance-guard");
// ─── In-Memory Shadow Queue ────────────────────────────────────────────────────
const _shadowQueue = [];
let _processing = false;
let _currentShadowRunId = null;
// ─── Shadow Queue Operations ────────────────────────────────────────────────────
/**
 * Enqueue an event for shadow replay.
 * The event is stored in-memory and also logged to Supabase shadow_events table.
 *
 * @param eventType - Event type (e.g., 'job.queued')
 * @param source - Source component
 * @param payload - Event payload
 * @param options - shadow_run_id and correlation_id for tracing
 */
async function shadowEnqueue(eventType, source, payload, options) {
    const shadow_run_id = options?.shadow_run_id || `shadow-${Date.now()}-${(0, uuid_1.v4)().slice(0, 8)}`;
    const shadow_event_id = `se-${Date.now()}-${(0, uuid_1.v4)().slice(0, 8)}`;
    const event = {
        shadow_run_id,
        shadow_event_id,
        event_type: eventType,
        source,
        correlation_id: options?.correlation_id,
        payload,
        hop_count: 0,
        queued_at: new Date().toISOString(),
        status: 'pending',
        simulated: options?.simulated ?? true,
    };
    const entry = {
        event,
        addedAt: Date.now(),
        priority: options?.priority || 2,
    };
    _shadowQueue.push(entry);
    // Sort by priority (1=high, 2=medium, 3=low) then FIFO
    _shadowQueue.sort((a, b) => {
        if (a.priority !== b.priority)
            return a.priority - b.priority;
        return a.addedAt - b.addedAt;
    });
    // Log to Supabase shadow_events table
    await (0, governance_guard_1.logShadowExecution)({
        shadow_run_id,
        event_type: eventType,
        source,
        action: 'queue.enqueue',
        target: shadow_event_id,
        payload,
        simulated: event.simulated,
        result: 'queued',
    });
    console.log(`[shadow-queue] enqueued ${eventType} shadow_run_id=${shadow_run_id} shadow_event_id=${shadow_event_id}`);
    return event;
}
/**
 * Dequeue the next shadow event for processing.
 * Returns null if queue is empty.
 */
function shadowDequeue() {
    if (_shadowQueue.length === 0)
        return null;
    const entry = _shadowQueue.shift();
    if (!entry)
        return null;
    entry.event.status = 'processing';
    _currentShadowRunId = entry.event.shadow_run_id;
    return entry.event;
}
/**
 * Peek at the next shadow event without removing it.
 */
function shadowPeek() {
    if (_shadowQueue.length === 0)
        return null;
    return _shadowQueue[0]?.event || null;
}
/**
 * Mark the current shadow event as completed.
 */
function shadowComplete(shadow_event_id, result) {
    const idx = _shadowQueue.findIndex(e => e.event.shadow_event_id === shadow_event_id && e.event.status === 'processing');
    if (idx !== -1) {
        _shadowQueue[idx].event.status = 'completed';
        _shadowQueue[idx].event.result = result;
    }
    if (_currentShadowRunId) {
        _currentShadowRunId = null;
    }
}
/**
 * Mark the current shadow event as failed.
 */
function shadowFail(shadow_event_id, error) {
    const idx = _shadowQueue.findIndex(e => e.event.shadow_event_id === shadow_event_id && e.event.status === 'processing');
    if (idx !== -1) {
        _shadowQueue[idx].event.status = 'failed';
        _shadowQueue[idx].event.error = error;
    }
}
/**
 * Mark the current shadow event as blocked (governance decision).
 */
function shadowBlock(shadow_event_id, reason) {
    const idx = _shadowQueue.findIndex(e => e.event.shadow_event_id === shadow_event_id);
    if (idx !== -1) {
        _shadowQueue[idx].event.status = 'blocked';
        _shadowQueue[idx].event.result = reason;
    }
}
/**
 * Get current shadow queue depth.
 */
function shadowQueueDepth() {
    return _shadowQueue.length;
}
/**
 * Get shadow queue statistics.
 */
function getShadowQueueStats() {
    const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        blocked: 0,
        failed: 0,
        total: 0,
    };
    for (const entry of _shadowQueue) {
        stats[entry.event.status]++;
        stats.total++;
    }
    return stats;
}
/**
 * Clear all shadow events from the queue.
 * Use for testing or reset.
 */
function shadowClearQueue() {
    _shadowQueue.length = 0;
    _currentShadowRunId = null;
    console.log('[shadow-queue] queue cleared');
}
/**
 * Pause shadow queue processing.
 * Events remain in queue but won't be dequeued.
 */
function shadowPause() {
    _processing = false;
    console.log('[shadow-queue] paused');
}
/**
 * Resume shadow queue processing.
 */
function shadowResume() {
    _processing = true;
    console.log('[shadow-queue] resumed');
}
/**
 * Check if shadow queue is currently processing.
 */
function isShadowProcessing() {
    return _processing;
}
/**
 * Get the current shadow run ID.
 */
function getCurrentShadowRunId() {
    return _currentShadowRunId;
}
/**
 * Get all events in the shadow queue (for observability).
 */
function getShadowQueueEvents() {
    return _shadowQueue.map(e => e.event);
}
// ─── Batch Shadow Operations ───────────────────────────────────────────────────
/**
 * Enqueue multiple events in a batch.
 * Useful for replaying captured N8N event sequences.
 */
async function shadowEnqueueBatch(events) {
    const results = [];
    for (const event of events) {
        const result = await shadowEnqueue(event.event_type, event.source, event.payload, {
            shadow_run_id: event.shadow_run_id,
            correlation_id: event.correlation_id,
        });
        results.push(result);
    }
    return results;
}
// ─── Shadow Queue Persistence ──────────────────────────────────────────────────
/**
 * Persist shadow queue state to Supabase.
 * Allows the queue to survive restarts.
 */
async function persistShadowQueue() {
    const supabase = (await Promise.resolve().then(() => __importStar(require('../persistence/supabase-client')))).getClient();
    const events = getShadowQueueEvents();
    for (const event of events) {
        try {
            await supabase.from('shadow_queue_state').upsert({
                shadow_event_id: event.shadow_event_id,
                shadow_run_id: event.shadow_run_id,
                event_type: event.event_type,
                source: event.source,
                correlation_id: event.correlation_id,
                payload: JSON.stringify(event.payload),
                hop_count: event.hop_count,
                status: event.status,
                result: event.result,
                error: event.error,
                queued_at: event.queued_at,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'shadow_event_id',
            });
        }
        catch (err) {
            console.error(`[shadow-queue] Failed to persist ${event.shadow_event_id}: ${err.message}`);
        }
    }
    console.log(`[shadow-queue] persisted ${events.length} events to Supabase`);
}
/**
 * Restore shadow queue state from Supabase.
 * Called on startup to recover queue state.
 */
async function restoreShadowQueue() {
    const supabase = (await Promise.resolve().then(() => __importStar(require('../persistence/supabase-client')))).getClient();
    const { data, error } = await supabase
        .from('shadow_queue_state')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('queued_at', { ascending: true });
    if (error) {
        console.error(`[shadow-queue] Failed to restore queue: ${error.message}`);
        return;
    }
    if (!data || data.length === 0) {
        console.log('[shadow-queue] No persisted state to restore');
        return;
    }
    for (const row of data) {
        const event = {
            shadow_run_id: row.shadow_run_id,
            shadow_event_id: row.shadow_event_id,
            event_type: row.event_type,
            source: row.source,
            correlation_id: row.correlation_id,
            payload: JSON.parse(row.payload),
            hop_count: row.hop_count,
            queued_at: row.queued_at,
            status: row.status,
            result: row.result,
            error: row.error,
            simulated: true,
        };
        const entry = {
            event,
            addedAt: new Date(row.queued_at).getTime(),
            priority: 2,
        };
        _shadowQueue.push(entry);
    }
    // Re-sort
    _shadowQueue.sort((a, b) => a.addedAt - b.addedAt);
    console.log(`[shadow-queue] restored ${data.length} events from Supabase`);
}
//# sourceMappingURL=shadow-queue.js.map