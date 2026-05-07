"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEventProcessed = isEventProcessed;
exports.markEventProcessed = markEventProcessed;
exports.clearProcessedMarker = clearProcessedMarker;
exports.shouldProcessEvent = shouldProcessEvent;
exports.claimEventProcessing = claimEventProcessing;
exports.getEventAttemptCount = getEventAttemptCount;
exports.incrementEventAttempt = incrementEventAttempt;
exports.withReplaySafety = withReplaySafety;
exports.getReplaySafetyStats = getReplaySafetyStats;
const redis_queue_1 = require("../queue/redis-queue");
const config_1 = require("../config");
const config_2 = require("../config");
/**
 * Track processed events in Redis with TTL.
 * An event is considered "processed" if it exists in this set.
 */
const PROCESSED_EVENT_TTL_SECONDS = 86400; // 24 hours
/**
 * Check if an event has already been processed (idempotency check).
 * Returns true if the event was already processed.
 */
async function isEventProcessed(eventId) {
    const redis = (0, redis_queue_1.getRedis)();
    const key = `${config_1.REDIS_KEYS.eventsChannel}:processed:${eventId}`;
    const exists = await redis.exists(key);
    return exists === 1;
}
/**
 * Mark an event as processed.
 * This should be called AFTER successful processing.
 */
async function markEventProcessed(eventId) {
    const redis = (0, redis_queue_1.getRedis)();
    const key = `${config_1.REDIS_KEYS.eventsChannel}:processed:${eventId}`;
    await redis.setex(key, PROCESSED_EVENT_TTL_SECONDS, '1');
}
/**
 * Clear a processed event marker (for testing or manual replay).
 */
async function clearProcessedMarker(eventId) {
    const redis = (0, redis_queue_1.getRedis)();
    const key = `${config_1.REDIS_KEYS.eventsChannel}:processed:${eventId}`;
    await redis.del(key);
}
/**
 * Check if an event should be processed (idempotency + hop count).
 * Returns { shouldProcess: true } if the event should be processed.
 * Returns { shouldProcess: false, reason: string } if the event should be skipped.
 */
async function shouldProcessEvent(event) {
    // Check idempotency — has this event_id been processed before?
    const alreadyProcessed = await isEventProcessed(event.event_id);
    if (alreadyProcessed) {
        return {
            shouldProcess: false,
            reason: `Event ${event.event_id} already processed (idempotency check)`,
        };
    }
    // Check hop count — has this event traveled too many hops?
    const maxHops = config_2.EXECUTION_CONFIG.maxEventHops;
    if (event.hop_count > maxHops) {
        return {
            shouldProcess: false,
            reason: `Event ${event.event_id} exceeded max hop count (${event.hop_count}/${maxHops})`,
        };
    }
    return { shouldProcess: true };
}
/**
 * Atomically check and mark an event as processed.
 * Uses Redis SETNX to ensure only one processing attempt wins.
 * Returns true if this caller should process the event.
 * Returns false if another caller already claimed it.
 */
async function claimEventProcessing(eventId) {
    const redis = (0, redis_queue_1.getRedis)();
    const key = `${config_1.REDIS_KEYS.eventsChannel}:processed:${eventId}`;
    // SETNX returns 1 if the key was set (first claim)
    // Returns 0 if the key already exists (duplicate)
    const result = await redis.setnx(key, '1');
    if (result === 1) {
        // We claimed it — set TTL
        await redis.expire(key, PROCESSED_EVENT_TTL_SECONDS);
        return true;
    }
    return false;
}
/**
 * Get the number of times an event has been attempted (for monitoring).
 */
async function getEventAttemptCount(eventId) {
    const redis = (0, redis_queue_1.getRedis)();
    const attemptsKey = `${config_1.REDIS_KEYS.eventsChannel}:attempts:${eventId}`;
    const count = await redis.get(attemptsKey);
    return count ? parseInt(count, 10) : 0;
}
/**
 * Increment the attempt counter for an event.
 */
async function incrementEventAttempt(eventId) {
    const redis = (0, redis_queue_1.getRedis)();
    const attemptsKey = `${config_1.REDIS_KEYS.eventsChannel}:attempts:${eventId}`;
    const count = await redis.incr(attemptsKey);
    // Expire after 24 hours
    await redis.expire(attemptsKey, PROCESSED_EVENT_TTL_SECONDS);
    return count;
}
/**
 * Create a replay-safe wrapper for event handlers.
 *
 * Usage:
 *   const safeHandler = withReplaySafety(handler);
 *   await registerRoute('job.*', safeHandler);
 */
function withReplaySafety(handler) {
    return async (event) => {
        // Check hop count first (synchronous, no Redis needed)
        const maxHops = config_2.EXECUTION_CONFIG.maxEventHops;
        if (event.hop_count > maxHops) {
            console.warn(`[replay-safety] Skipping event ${event.event_id} — ` +
                `hop_count ${event.hop_count} exceeds max ${maxHops}`);
            return;
        }
        // Atomically claim this event for processing
        const claimed = await claimEventProcessing(event.event_id);
        if (!claimed) {
            console.log(`[replay-safety] Skipping duplicate event ${event.event_id} ` +
                `(event already claimed by another processor)`);
            return;
        }
        // Increment attempt counter for monitoring
        await incrementEventAttempt(event.event_id);
        try {
            await handler(event);
        }
        catch (err) {
            // Processing failed — clear the processed marker so the event can be retried
            await clearProcessedMarker(event.event_id);
            throw err;
        }
    };
}
/**
 * Get replay safety statistics from Redis.
 */
async function getReplaySafetyStats() {
    const redis = (0, redis_queue_1.getRedis)();
    // Count keys matching the patterns (approximate)
    const processedKeys = await redis.keys(`${config_1.REDIS_KEYS.eventsChannel}:processed:*`);
    const attemptKeys = await redis.keys(`${config_1.REDIS_KEYS.eventsChannel}:attempts:*`);
    return {
        recentEventCount: processedKeys.length,
        processedEventCount: processedKeys.length,
        attemptedEventCount: attemptKeys.length,
    };
}
//# sourceMappingURL=replay-safety.js.map