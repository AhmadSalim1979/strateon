/**
 * Replay Safety — Idempotency and Replay Controls
 * Phase 3: Prevents duplicate event processing and limits replay depth
 *
 * Events carry an event_id that must be unique. If the same event_id is
 * received twice, only the first processing attempt succeeds.
 *
 * Also enforces maximum hop_count to prevent infinite event loops.
 *
 * Shadow-safe: does not affect production behavior.
 */
import { OrchestrationEvent } from './event-schemas';
/**
 * Check if an event has already been processed (idempotency check).
 * Returns true if the event was already processed.
 */
export declare function isEventProcessed(eventId: string): Promise<boolean>;
/**
 * Mark an event as processed.
 * This should be called AFTER successful processing.
 */
export declare function markEventProcessed(eventId: string): Promise<void>;
/**
 * Clear a processed event marker (for testing or manual replay).
 */
export declare function clearProcessedMarker(eventId: string): Promise<void>;
/**
 * Check if an event should be processed (idempotency + hop count).
 * Returns { shouldProcess: true } if the event should be processed.
 * Returns { shouldProcess: false, reason: string } if the event should be skipped.
 */
export declare function shouldProcessEvent(event: OrchestrationEvent): Promise<{
    shouldProcess: boolean;
    reason?: string;
}>;
/**
 * Atomically check and mark an event as processed.
 * Uses Redis SETNX to ensure only one processing attempt wins.
 * Returns true if this caller should process the event.
 * Returns false if another caller already claimed it.
 */
export declare function claimEventProcessing(eventId: string): Promise<boolean>;
/**
 * Get the number of times an event has been attempted (for monitoring).
 */
export declare function getEventAttemptCount(eventId: string): Promise<number>;
/**
 * Increment the attempt counter for an event.
 */
export declare function incrementEventAttempt(eventId: string): Promise<number>;
/**
 * Create a replay-safe wrapper for event handlers.
 *
 * Usage:
 *   const safeHandler = withReplaySafety(handler);
 *   await registerRoute('job.*', safeHandler);
 */
export declare function withReplaySafety<T extends OrchestrationEvent>(handler: (event: T) => void | Promise<void>): (event: T) => Promise<void>;
/**
 * Get replay safety statistics from Redis.
 */
export declare function getReplaySafetyStats(): Promise<{
    recentEventCount: number;
    processedEventCount: number;
    attemptedEventCount: number;
}>;
//# sourceMappingURL=replay-safety.d.ts.map