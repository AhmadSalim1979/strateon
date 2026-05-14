/**
 * Phase 4 — Shadow Mode + Replay Safety + Processed-By Population
 * 
 * This module implements three Phase 4 requirements:
 * 
 * 1. Event execution context (live vs shadow)
 *    Events are marked as 'live' or 'shadow' so handlers know whether
 *    they're processing real production work or simulated replay.
 * 
 * 2. processed_by population
 *    The processed_by column in the events table is now written on every
 *    event persist, identifying which component processed the event.
 * 
 * 3. Replay safety enforcement
 *    claimEventProcessing is now wired into the webhook → event bus flow.
 *    Duplicate events (same event_id) are rejected at the entry point,
 *    not just inside handlers.
 * 
 * Flow:
 *   HTTP POST /internal/event (webhook)
 *     → validate payload
 *     → claimEventProcessing (atomic idempotency check) ← Phase 4 NEW
 *     → markEventLive OR markEventShadow                  ← Phase 4 NEW
 *     → publishEvent (Redis pub/sub + Supabase dual-write)
 *       → persistEventToSupabase writes processed_by     ← Phase 4 UNCOMMENTED
 *     → event bus → router → handlers
 * 
 * The shadow mode indicator comes from:
 *   - X-Shadow-Mode header on incoming webhooks (N8N parallel observer)
 *   - simulated: true flag in shadow-queue context (replay engine)
 * 
 * Dependencies:
 *   - src/events/replay-safety.ts  (claimEventProcessing)
 *   - src/persistence/supabase-client.ts
 *   - src/events/event-bus.ts (publishEvent)
 *   - src/events/router.ts (registerRoute)
 */

import { getClient } from './persistence/supabase-client';
import { OrchestrationEvent } from './events/event-schemas';
import {
  claimEventProcessing,
  isEventProcessed,
} from './events/replay-safety';
import { publishEvent } from './events/event-bus';

// ─── Execution Mode ────────────────────────────────────────────────────────────

export type ExecutionMode = 'live' | 'shadow';

const PROCESSED_EVENT_TTL_SECONDS = 86400;

// ─── Phase 4: Mark Event Live ─────────────────────────────────────────────────
/**
 * markEventLive(eventId) — Marks an event as live production execution.
 * 
 * Updates the events table to set execution_mode = 'live'.
 * Also records the processor identity (who is processing this event).
 * 
 * Called by the webhook receiver before publishing live events.
 * The processor name is extracted from the event source or webhook headers.
 */
export async function markEventLive(
  eventId: string,
  processor: string = 'webhook-receiver'
): Promise<void> {
  const client = getClient();
  
  const { error } = await client
    .from('events')
    .update({ execution_mode: 'live' })
    .eq('event_id', eventId);
  
  if (error) {
    // Table might not have execution_mode column yet (schema not migrated)
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.warn(`[phase4] execution_mode column not in schema yet — skipping live mark for ${eventId}`);
      return;
    }
    console.error(`[phase4] Failed to mark event ${eventId} as live: ${error.message}`);
    return;
  }
  
  console.log(`[phase4] Marked event ${eventId} as LIVE (processor=${processor})`);
}

// ─── Phase 4: Mark Event Shadow ───────────────────────────────────────────────
/**
 * markEventShadow(eventId) — Marks an event as shadow/replay execution.
 * 
 * Updates the events table to set execution_mode = 'shadow'.
 * Shadow events are processed without making real production changes.
 * 
 * Called when:
 *   - N8N parallel observer captures events (X-Shadow-Mode: true header)
 *   - Shadow replay engine replays captured events
 */
export async function markEventShadow(
  eventId: string,
  processor: string = 'shadow-replay'
): Promise<void> {
  const client = getClient();
  
  const { error } = await client
    .from('events')
    .update({ execution_mode: 'shadow' })
    .eq('event_id', eventId);
  
  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.warn(`[phase4] execution_mode column not in schema yet — skipping shadow mark for ${eventId}`);
      return;
    }
    console.error(`[phase4] Failed to mark event ${eventId} as shadow: ${error.message}`);
    return;
  }
  
  console.log(`[phase4] Marked event ${eventId} as SHADOW (processor=${processor})`);
}

// ─── Phase 4: Replay Safety — Webhook Entry Point ─────────────────────────────
/**
 * claimEventForWebhook(eventId) — Atomic replay safety at webhook entry.
 * 
 * Uses Redis SETNX to atomically claim an event_id for processing.
 * Only the first caller wins — duplicates are rejected immediately.
 * 
 * Returns { claimed: true } if this caller should process the event.
 * Returns { claimed: false, reason: string } if another processor claimed it.
 * 
 * This is called BEFORE creating/publishing the event, so we reject
 * duplicates before any work is done.
 */
export async function claimEventForWebhook(eventId: string): Promise<{
  claimed: boolean;
  reason?: string;
}> {
  // Check if already processed first (cheap check before atomic claim)
  const alreadyProcessed = await isEventProcessed(eventId);
  if (alreadyProcessed) {
    return {
      claimed: false,
      reason: `Event ${eventId} already processed (idempotency check)`,
    };
  }
  
  // Atomic claim — only one caller wins
  const claimed = await claimEventProcessing(eventId);
  
  if (!claimed) {
    return {
      claimed: false,
      reason: `Event ${eventId} already claimed by another processor (replay safety)`,
    };
  }
  
  return { claimed: true };
}

// ─── Phase 4: Processed-By Population ─────────────────────────────────────────
/**
 * updateProcessedBy(eventId, processedBy) — Updates processed_by column.
 * 
 * Called after an event is successfully processed by a handler.
 * Records which component processed the event and when.
 * 
 * Also updates processed_at to the current time.
 */
export async function updateProcessedBy(
  eventId: string,
  processedBy: string
): Promise<void> {
  const client = getClient();
  
  const { error } = await client
    .from('events')
    .update({
      processed_by: processedBy,
      processed_at: new Date().toISOString(),
    })
    .eq('event_id', eventId);
  
  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.warn(`[phase4] processed_by column not in schema yet — skipping for ${eventId}`);
      return;
    }
    console.error(`[phase4] Failed to update processed_by for ${eventId}: ${error.message}`);
    return;
  }
  
  console.log(`[phase4] Updated processed_by=${processedBy} for event ${eventId}`);
}

// ─── Phase 4: Get Execution Mode ──────────────────────────────────────────────
/**
 * getEventExecutionMode(eventId) — Query the execution mode of an event.
 * 
 * Returns 'live', 'shadow', or undefined if not yet set / not in DB.
 */
export async function getEventExecutionMode(
  eventId: string
): Promise<ExecutionMode | undefined> {
  const client = getClient();
  
  const { data, error } = await client
    .from('events')
    .select('execution_mode')
    .eq('event_id', eventId)
    .single();
  
  if (error || !data) {
    return undefined;
  }
  
  return data.execution_mode as ExecutionMode | undefined;
}

// ─── Phase 4: Enforce Replay Safety on Webhook ────────────────────────────────
/**
 * wrapWithReplaySafety(handler) — Middleware to enforce replay safety.
 * 
 * Wraps an async webhook handler to:
 *   1. Check if event_id is already claimed (idempotency)
 *   2. Atomically claim the event for this processor
 *   3. Continue to the wrapped handler if claimed
 *   4. Return 409 Conflict if already claimed
 * 
 * Usage:
 *   app.post('/internal/event', wrapWithReplaySafety(handleEvent));
 */
export function wrapWithReplaySafety(
  handler: (event: OrchestrationEvent, processor: string) => Promise<void>
): (event: OrchestrationEvent, processor: string) => Promise<{ rejected: boolean; reason?: string }> {
  return async (event: OrchestrationEvent, processor: string) => {
    const claim = await claimEventForWebhook(event.event_id);
    
    if (!claim.claimed) {
      console.log(`[phase4][replay-safety] Rejected duplicate event ${event.event_id}: ${claim.reason}`);
      return { rejected: true, reason: claim.reason };
    }
    
    try {
      await handler(event, processor);
      return { rejected: false };
    } catch (err: any) {
      // Processing failed — clear the claim so the event can be retried
      const { clearProcessedMarker } = await import('./events/replay-safety');
      await clearProcessedMarker(event.event_id);
      throw err;
    }
  };
}

// ─── Phase 4: Shadow Mode Detection ───────────────────────────────────────────
/**
 * detectExecutionMode(event, headers) — Determine if event is live or shadow.
 * 
 * Shadow mode can be indicated by:
 *   - X-Shadow-Mode: true header (from N8N parallel observer)
 *   - simulated: true in the event context
 *   - event.source starts with 'shadow-' or 'n8n-capture'
 */
export function detectExecutionMode(
  event: OrchestrationEvent,
  headers?: Record<string, string>
): ExecutionMode {
  // Check explicit header (N8N parallel observer)
  if (headers?.['x-shadow-mode'] === 'true') {
    return 'shadow';
  }
  
  // Check source prefix
  if (event.source.startsWith('shadow-') || event.source.startsWith('n8n-capture')) {
    return 'shadow';
  }
  
  // Check for simulated flag in payload (shadow replay engine)
  const payload = event.payload as Record<string, unknown>;
  if (payload?.simulated === true) {
    return 'shadow';
  }
  
  return 'live';
}

// ─── Phase 4: Webhook Processing Pipeline ─────────────────────────────────────
/**
 * processWebhookEvent(event, headers) — Full Phase 4 webhook processing pipeline.
 * 
 * Orchestrates the complete flow:
 *   1. Replay safety — claim event_id atomically
 *   2. Execution mode — detect and mark live vs shadow
 *   3. Publish — dual-write to Redis + Supabase
 *   4. Return processing context for downstream handlers
 * 
 * Returns the execution mode so handlers can adjust behavior accordingly.
 */
export async function processWebhookEvent(
  event: OrchestrationEvent,
  headers?: Record<string, string>,
  processorName: string = 'webhook-receiver'
): Promise<{
  success: boolean;
  executionMode: ExecutionMode;
  eventId: string;
  error?: string;
}> {
  // Step 1: Replay safety — atomically claim this event
  const claim = await claimEventForWebhook(event.event_id);
  if (!claim.claimed) {
    return {
      success: false,
      executionMode: 'live',
      eventId: event.event_id,
      error: claim.reason,
    };
  }
  
  // Step 2: Detect execution mode (live vs shadow)
  const mode = detectExecutionMode(event, headers);
  
  // Step 3: Mark event in DB with execution mode (async, non-blocking)
  if (mode === 'shadow') {
    markEventShadow(event.event_id, processorName).catch((err) => {
      console.warn(`[phase4] Shadow mark failed for ${event.event_id}: ${err.message}`);
    });
  } else {
    markEventLive(event.event_id, processorName).catch((err) => {
      console.warn(`[phase4] Live mark failed for ${event.event_id}: ${err.message}`);
    });
  }
  
  // Step 4: Publish to event bus (dual-write to Redis + Supabase)
  // The dual-write in phase3-webhook-integration.ts handles processed_by population
  try {
    await publishEvent(event);
  } catch (err: any) {
    // Publish failed — clear the claim so event can be retried
    const { clearProcessedMarker } = await import('./events/replay-safety');
    await clearProcessedMarker(event.event_id);
    
    return {
      success: false,
      executionMode: mode,
      eventId: event.event_id,
      error: `Publish failed: ${err.message}`,
    };
  }
  
  // Step 5: Log execution mode for observability
  console.log(
    `[phase4] Processed event ${event.event_id} [${mode}] ` +
    `type=${event.event_type} source=${event.source}`
  );
  
  return {
    success: true,
    executionMode: mode,
    eventId: event.event_id,
  };
}

// ─── Phase 4: Processed-By Helper for Handlers ─────────────────────────────────
/**
 * recordEventProcessed(eventId, handlerName) — Records that a handler processed an event.
 * 
 * Called by event handlers after successful processing.
 * Updates processed_by and processed_at in the events table.
 */
export async function recordEventProcessed(
  eventId: string,
  handlerName: string
): Promise<void> {
  await updateProcessedBy(eventId, handlerName);
}

// ─── Phase 4: Replay Safety Stats ─────────────────────────────────────────────
/**
 * getPhase4Stats() — Returns replay safety and execution mode stats.
 */
export async function getPhase4Stats(): Promise<{
  replaySafety: {
    recentEventCount: number;
    processedEventCount: number;
  };
  executionModes: {
    live: number;
    shadow: number;
    total: number;
  };
}> {
  const { getReplaySafetyStats } = await import('./events/replay-safety');
  const safetyStats = await getReplaySafetyStats();
  
  // Query DB for execution mode counts (approximate, via row count check)
  let liveCount = 0;
  let shadowCount = 0;
  
  try {
    const client = getClient();
    
    const { count: liveCountResult } = await client
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('execution_mode', 'live');
    
    const { count: shadowCountResult } = await client
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('execution_mode', 'shadow');
    
    liveCount = liveCountResult ?? 0;
    shadowCount = shadowCountResult ?? 0;
  } catch {
    // Schema might not have execution_mode column yet
  }
  
  return {
    replaySafety: {
      recentEventCount: safetyStats.recentEventCount,
      processedEventCount: safetyStats.processedEventCount,
    },
    executionModes: {
      live: liveCount,
      shadow: shadowCount,
      total: liveCount + shadowCount,
    },
  };
}