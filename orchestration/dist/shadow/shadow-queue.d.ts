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
export interface ShadowQueueEvent {
    shadow_run_id: string;
    shadow_event_id: string;
    event_type: string;
    source: string;
    correlation_id?: string;
    payload: object;
    hop_count: number;
    queued_at: string;
    status: 'pending' | 'processing' | 'completed' | 'blocked' | 'failed';
    result?: string;
    error?: string;
    simulated: boolean;
}
export interface ShadowQueueStats {
    pending: number;
    processing: number;
    completed: number;
    blocked: number;
    failed: number;
    total: number;
}
/**
 * Enqueue an event for shadow replay.
 * The event is stored in-memory and also logged to Supabase shadow_events table.
 *
 * @param eventType - Event type (e.g., 'job.queued')
 * @param source - Source component
 * @param payload - Event payload
 * @param options - shadow_run_id and correlation_id for tracing
 */
export declare function shadowEnqueue(eventType: string, source: string, payload: object, options?: {
    shadow_run_id?: string;
    correlation_id?: string;
    priority?: number;
    simulated?: boolean;
}): Promise<ShadowQueueEvent>;
/**
 * Dequeue the next shadow event for processing.
 * Returns null if queue is empty.
 */
export declare function shadowDequeue(): ShadowQueueEvent | null;
/**
 * Peek at the next shadow event without removing it.
 */
export declare function shadowPeek(): ShadowQueueEvent | null;
/**
 * Mark the current shadow event as completed.
 */
export declare function shadowComplete(shadow_event_id: string, result?: string): void;
/**
 * Mark the current shadow event as failed.
 */
export declare function shadowFail(shadow_event_id: string, error: string): void;
/**
 * Mark the current shadow event as blocked (governance decision).
 */
export declare function shadowBlock(shadow_event_id: string, reason: string): void;
/**
 * Get current shadow queue depth.
 */
export declare function shadowQueueDepth(): number;
/**
 * Get shadow queue statistics.
 */
export declare function getShadowQueueStats(): ShadowQueueStats;
/**
 * Clear all shadow events from the queue.
 * Use for testing or reset.
 */
export declare function shadowClearQueue(): void;
/**
 * Pause shadow queue processing.
 * Events remain in queue but won't be dequeued.
 */
export declare function shadowPause(): void;
/**
 * Resume shadow queue processing.
 */
export declare function shadowResume(): void;
/**
 * Check if shadow queue is currently processing.
 */
export declare function isShadowProcessing(): boolean;
/**
 * Get the current shadow run ID.
 */
export declare function getCurrentShadowRunId(): string | null;
/**
 * Get all events in the shadow queue (for observability).
 */
export declare function getShadowQueueEvents(): ShadowQueueEvent[];
/**
 * Enqueue multiple events in a batch.
 * Useful for replaying captured N8N event sequences.
 */
export declare function shadowEnqueueBatch(events: Array<{
    event_type: string;
    source: string;
    payload: object;
    shadow_run_id?: string;
    correlation_id?: string;
}>): Promise<ShadowQueueEvent[]>;
/**
 * Persist shadow queue state to Supabase.
 * Allows the queue to survive restarts.
 */
export declare function persistShadowQueue(): Promise<void>;
/**
 * Restore shadow queue state from Supabase.
 * Called on startup to recover queue state.
 */
export declare function restoreShadowQueue(): Promise<void>;
//# sourceMappingURL=shadow-queue.d.ts.map