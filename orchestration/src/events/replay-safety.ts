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
import { getRedis } from '../queue/redis-queue';
import { REDIS_KEYS } from '../config';
import { EXECUTION_CONFIG } from '../config';

/**
 * Track processed events in Redis with TTL.
 * An event is considered "processed" if it exists in this set.
 */
const PROCESSED_EVENT_TTL_SECONDS = 86400; // 24 hours

/**
 * Check if an event has already been processed (idempotency check).
 * Returns true if the event was already processed.
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const redis = getRedis();
  const key = `${REDIS_KEYS.eventsChannel}:processed:${eventId}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Mark an event as processed.
 * This should be called AFTER successful processing.
 */
export async function markEventProcessed(eventId: string): Promise<void> {
  const redis = getRedis();
  const key = `${REDIS_KEYS.eventsChannel}:processed:${eventId}`;
  await redis.setex(key, PROCESSED_EVENT_TTL_SECONDS, '1');
}

/**
 * Clear a processed event marker (for testing or manual replay).
 */
export async function clearProcessedMarker(eventId: string): Promise<void> {
  const redis = getRedis();
  const key = `${REDIS_KEYS.eventsChannel}:processed:${eventId}`;
  await redis.del(key);
}

/**
 * Check if an event should be processed (idempotency + hop count).
 * Returns { shouldProcess: true } if the event should be processed.
 * Returns { shouldProcess: false, reason: string } if the event should be skipped.
 */
export async function shouldProcessEvent(event: OrchestrationEvent): Promise<{
  shouldProcess: boolean;
  reason?: string;
}> {
  // Check idempotency — has this event_id been processed before?
  const alreadyProcessed = await isEventProcessed(event.event_id);
  if (alreadyProcessed) {
    return {
      shouldProcess: false,
      reason: `Event ${event.event_id} already processed (idempotency check)`,
    };
  }

  // Check hop count — has this event traveled too many hops?
  const maxHops = EXECUTION_CONFIG.maxEventHops;
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
export async function claimEventProcessing(eventId: string): Promise<boolean> {
  const redis = getRedis();
  const key = `${REDIS_KEYS.eventsChannel}:processed:${eventId}`;
  
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
export async function getEventAttemptCount(eventId: string): Promise<number> {
  const redis = getRedis();
  const attemptsKey = `${REDIS_KEYS.eventsChannel}:attempts:${eventId}`;
  const count = await redis.get(attemptsKey);
  return count ? parseInt(count, 10) : 0;
}

/**
 * Increment the attempt counter for an event.
 */
export async function incrementEventAttempt(eventId: string): Promise<number> {
  const redis = getRedis();
  const attemptsKey = `${REDIS_KEYS.eventsChannel}:attempts:${eventId}`;
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
export function withReplaySafety<T extends OrchestrationEvent>(
  handler: (event: T) => void | Promise<void>
): (event: T) => Promise<void> {
  return async (event: T) => {
    // Check hop count first (synchronous, no Redis needed)
    const maxHops = EXECUTION_CONFIG.maxEventHops;
    if (event.hop_count > maxHops) {
      console.warn(
        `[replay-safety] Skipping event ${event.event_id} — ` +
        `hop_count ${event.hop_count} exceeds max ${maxHops}`
      );
      return;
    }

    // Atomically claim this event for processing
    const claimed = await claimEventProcessing(event.event_id);
    
    if (!claimed) {
      console.log(
        `[replay-safety] Skipping duplicate event ${event.event_id} ` +
        `(event already claimed by another processor)`
      );
      return;
    }

    // Increment attempt counter for monitoring
    await incrementEventAttempt(event.event_id);

    try {
      await handler(event);
    } catch (err: any) {
      // Processing failed — clear the processed marker so the event can be retried
      await clearProcessedMarker(event.event_id);
      throw err;
    }
  };
}

/**
 * Get replay safety statistics from Redis.
 */
export async function getReplaySafetyStats(): Promise<{
  recentEventCount: number;
  processedEventCount: number;
  attemptedEventCount: number;
}> {
  const redis = getRedis();
  
  // Count keys matching the patterns (approximate)
  const processedKeys = await redis.keys(`${REDIS_KEYS.eventsChannel}:processed:*`);
  const attemptKeys = await redis.keys(`${REDIS_KEYS.eventsChannel}:attempts:*`);
  
  return {
    recentEventCount: processedKeys.length,
    processedEventCount: processedKeys.length,
    attemptedEventCount: attemptKeys.length,
  };
}