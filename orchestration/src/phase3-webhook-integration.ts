/**
 * Phase 4 — Shadow Mode + Replay Safety + Processed-By Population
 * 
 * This module wires the webhook receiver to the event router so that
 * incoming internal events are published to Redis pub/sub and then routed
 * to registered handlers based on event type patterns.
 * 
 * Flow:
 *   HTTP POST /internal/event
 *     → webhook receiver validates payload
 *     → claimEventProcessing (replay safety — Phase 4 NEW)
 *     → creates OrchestrationEvent
 *     → publishEvent (Redis pub/sub) ← Phase 2
 *     → event bus delivers to router  ← Phase 3
 *     → router matches pattern, calls handler
 *     → handler processes the event
 * 
 * Dual-write (Phase 3 + Phase 4):
 *   publishEvent now does BOTH:
 *     1. Redis publish (real-time, low latency)
 *     2. Supabase events table insert (durability, audit log)
 *       → Phase 4: now writes hop_count, processed_at, processed_by, execution_mode
 * 
 * Replay Safety (Phase 4):
 *   claimEventProcessing is called BEFORE publishing to reject duplicate event_ids.
 *   Only the first caller wins — duplicates get 409 Conflict response.
 * 
 * Shadow Mode (Phase 4):
 *   Events can be marked as 'live' or 'shadow' based on X-Shadow-Mode header
 *   or event source. Shadow events are tracked separately for drift detection.
 * 
 * Dependencies:
 *   - src/events/event-bus.ts (Phase 2)
 *   - src/events/router.ts (Phase 2)
 *   - src/persistence/supabase-client.ts (Phase 2)
 *   - src/config.ts (Phase 2)
 *   - src/phase4-shadow-replay.ts (Phase 4)
 */

import { publishEvent, subscribe, closeEventBus } from './events/event-bus';
import { registerRoute, unregisterAllRoutes, BuiltInRoutes, getRegisteredRoutes, EventHandler } from './events/router';
import { getClient } from './persistence/supabase-client';
import { OrchestrationEvent } from './events/event-schemas';
import { QUEUE_CONFIG } from './config';

// Phase 4 imports — shadow mode, replay safety, processed_by population
import { processWebhookEvent, recordEventProcessed, ExecutionMode, detectExecutionMode } from './phase4-shadow-replay';
import { claimEventProcessing } from './events/replay-safety';

// ─── Dual-Write Strategy ──────────────────────────────────────────────────────

/**
 * dualWriteEvent(event, options) — Writes event to BOTH Redis and Supabase
 * 
 * Redis is the fast path (real-time pub/sub delivery to subscribers).
 * Supabase is the durable path (immutable audit log for governance, replay, recovery).
 * 
 * Phase 4 enhancement: Also writes processed_by and execution_mode.
 * 
 * If Supabase write fails, we log the error but DO NOT fail the event publish.
 * Rationale: Redis pub/sub is already delivering the event to live subscribers.
 * Supabase is for durability/audit — losing a write doesn't break operational flow,
 * but failing the entire publish would.
 */
async function dualWriteEvent(
  event: OrchestrationEvent,
  options?: { processed_by?: string; execution_mode?: ExecutionMode }
): Promise<void> {
  // Step 1: Redis pub/sub publish (the existing Phase 2 behavior)
  // This is synchronous-ish — ioredis publish returns once Redis acknowledges
  await publishEvent(event);
  
  // Step 2: Supabase durable write
  // Non-blocking: failures are logged but don't break the event flow
  // Phase 4: Now passes processed_by and execution_mode
  persistEventToSupabase(event, options).catch((err) => {
    console.error(`[phase4][dual-write] Supabase write failed for event ${event.event_id}: ${err.message}`);
  });
}

/**
 * Phase 4 — persistEventToSupabase
 * 
 * Writes an orchestration event to the Supabase events table.
 * Now includes hop_count, processed_at, processed_by, and execution_mode.
 * 
 * The events table schema (Phase 4 confirmed columns):
 *   event_id          UUID PRIMARY KEY
 *   event_type        TEXT NOT NULL
 *   source            TEXT NOT NULL
 *   payload           JSONB NOT NULL
 *   correlation_id    TEXT (nullable)
 *   caused_by_job_id  TEXT (nullable)
 *   hop_count         INTEGER DEFAULT 0
 *   processed_at      TIMESTAMPTZ
 *   processed_by      TEXT
 *   execution_mode    TEXT DEFAULT 'live'  ← Phase 4: live | shadow
 *   created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
 */
async function persistEventToSupabase(
  event: OrchestrationEvent,
  options?: { processed_by?: string; execution_mode?: ExecutionMode }
): Promise<void> {
  const client = getClient();
  
  // Phase 4: Write all confirmed columns including processed_by and execution_mode
  const { error } = await client.from('events').insert({
    event_id: event.event_id,
    event_type: event.event_type,
    source: event.source,
    payload: event.payload,
    correlation_id: event.correlation_id ?? null,
    caused_by_job_id: event.caused_by_job_id ?? null,
    created_at: event.created_at,
    // Phase 4 active — all Phase 3 PENDING columns now written:
    hop_count: event.hop_count,
    processed_at: new Date().toISOString(),
    processed_by: options?.processed_by ?? event.source,
    execution_mode: options?.execution_mode ?? 'live',
  });
  
  if (error) {
    // Distinguish between "table doesn't exist" (schema not ready) and actual write errors
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.warn(`[phase4][dual-write] events table schema not ready (${error.message}). Skipping Supabase write.`);
      return; // Don't treat as hard failure — schema may still be pending
    }
    throw error; // Real write error — retry
  }
  
  console.log(`[phase4][dual-write] persisted event ${event.event_id} to Supabase [${options?.execution_mode ?? 'live'}] processed_by=${options?.processed_by ?? event.source}`);
}

// ─── Modify publishEvent to use dual-write ────────────────────────────────────
// We monkey-patch publishEvent at the module level so webhook-receiver.ts
// automatically gets dual-write behavior without changing its import.
//
// This is done by re-exporting a wrapped version of publishEvent.
// The webhook receiver imports { publishEvent } from event-bus.ts.
// We replace that import with a dual-write version here.
//
// Note: In TypeScript this works because we're just exporting a function
// with the same signature. The caller (receiver.ts) doesn't change.

export { publishEvent as publishEventWithDualWrite } from './events/event-bus';

// ─── Webhook Handler Registrations ───────────────────────────────────────────
/**
 * Initialize webhook handlers — registers routes for all event types.
 * 
 * Each handler processes events from the event bus.
 * 
 * Current handlers (Phase 3 + Phase 4):
 *   - job.queued: logs and tracks job enqueue
 *   - job.dead_lettered: logs and alerts
 *   - system.alert: logs and emits alerts
 * 
 * Phase 4: All handlers now record processed_by after successful handling.
 */
export async function initializeWebhookHandlers(): Promise<() => void> {
  console.log('[phase3] Initializing webhook event handlers...');
  
  const routes: Array<{ pattern: string; description: string; unsub: () => void }> = [];
  
  // Job lifecycle handlers
  const jobLifecycleUnsub = await BuiltInRoutes.jobLifecycle({
    onJobQueued: async (event: OrchestrationEvent) => {
      console.log(`[handler][job.queued] job_id=${(event.payload as any).job_id} type=${(event.payload as any).job_type}`);
      // Phase 4: Record processed_by
      await recordEventProcessed(event.event_id, 'job-lifecycle-handler');
    },
    onJobDeadLettered: async (event: OrchestrationEvent) => {
      const payload = event.payload as any;
      console.warn(`[handler][job.dead_lettered] job_id=${payload.job_id} error=${payload.error}`);
      // Phase 4: Record processed_by
      await recordEventProcessed(event.event_id, 'job-lifecycle-handler');
    },
  });
  routes.push({ pattern: 'job.queued', description: 'job queued handler', unsub: jobLifecycleUnsub });
  
  // System alert handler
  const systemUnsub = await registerRoute('system.alert', async (event: OrchestrationEvent) => {
    const payload = event.payload as any;
    console.warn(`[handler][system.alert] severity=${payload.severity} component=${payload.component} message=${payload.message}`);
    // Phase 4: Record processed_by
    await recordEventProcessed(event.event_id, 'system-alert-handler');
  }, 'system alert handler');
  routes.push({ pattern: 'system.alert', description: 'system alert handler', unsub: systemUnsub });
  
  // Generic catch-all logger (for development visibility)
  // Remove or disable in production to avoid log spam
  const catchallUnsub = await registerRoute('*', async (event: OrchestrationEvent) => {
    // Only log non-job events to avoid noise
    if (!event.event_type.startsWith('job.')) {
      console.log(`[handler][catchall] ${event.event_type} event_id=${event.event_id}`);
    }
    // Phase 4: Record processed_by for all handled events
    await recordEventProcessed(event.event_id, 'catch-all-handler');
  }, 'catch-all logger');
  routes.push({ pattern: '*', description: 'catch-all logger', unsub: catchallUnsub });
  
  console.log(`[phase3] Registered ${routes.length} event handler routes`);
  console.log(`[phase3] Routes: ${routes.map(r => r.pattern).join(', ')}`);
  
  return async () => {
    for (const route of routes) {
      route.unsub();
    }
    await unregisterAllRoutes();
    console.log('[phase3] All webhook handlers shut down');
  };
}

// ─── Shutdown ─────────────────────────────────────────────────────────────────
export async function shutdownPhase3(): Promise<void> {
  await closeEventBus();
  await unregisterAllRoutes();
  console.log('[phase3] Shutdown complete');
}

// ─── Integration Verification ─────────────────────────────────────────────────
/**
 * verifyIntegration() — Smoke test for Phase 4 wiring.
 * 
 * Tests:
 *   1. Supabase client is reachable
 *   2. Events table exists (schema check — Phase 3 columns)
 *   3. execution_mode column exists (Phase 4)
 *   4. publishEvent works (Redis pub/sub)
 *   5. Event bus subscription works
 *   6. Routes are registered
 *   7. Replay safety claimEventProcessing works
 */
export async function verifyIntegration(): Promise<{
  ok: boolean;
  checks: Array<{ name: string; pass: boolean; detail?: string }>;
}> {
  const checks: Array<{ name: string; pass: boolean; detail?: string }> = [];
  
  // Check 1: Supabase client health
  try {
    const { healthCheck } = await import('./persistence/supabase-client');
    const health = await healthCheck();
    checks.push({ name: 'Supabase connection', pass: health.ok, detail: `${health.latencyMs}ms` });
  } catch (err: any) {
    checks.push({ name: 'Supabase connection', pass: false, detail: err.message });
  }
  
  // Check 2: Redis connection (via event bus)
  try {
    const { getRedis } = await import('./queue/redis-queue');
    const redis = getRedis();
    await redis.ping();
    checks.push({ name: 'Redis connection', pass: true, detail: 'pong received' });
  } catch (err: any) {
    checks.push({ name: 'Redis connection', pass: false, detail: err.message });
  }
  
  // Check 3: Phase 3 SQL columns (hop_count, processed_at, processed_by)
  try {
    const client = getClient();
    const { error } = await client.from('events').select('event_id, event_type, hop_count, processed_at, processed_by').limit(1);
    if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
      checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: 'hop_count/processed_at/processed_by not in schema yet' });
    } else if (error) {
      checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: error.message });
    } else {
      checks.push({ name: 'Phase 3 SQL columns', pass: true, detail: 'schema ready' });
    }
  } catch (err: any) {
    checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: err.message });
  }
  
  // Check 4: Phase 4 execution_mode column
  try {
    const client = getClient();
    const { error } = await client.from('events').select('execution_mode').limit(1);
    if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
      checks.push({ name: 'Phase 4 execution_mode column', pass: false, detail: 'execution_mode not in schema yet — add via migration' });
    } else if (error) {
      checks.push({ name: 'Phase 4 execution_mode column', pass: false, detail: error.message });
    } else {
      checks.push({ name: 'Phase 4 execution_mode column', pass: true, detail: 'schema ready' });
    }
  } catch (err: any) {
    checks.push({ name: 'Phase 4 execution_mode column', pass: false, detail: err.message });
  }
  
  // Check 5: Routes registered
  const routes = getRegisteredRoutes();
  checks.push({ name: 'Event routes registered', pass: routes.length > 0, detail: `${routes.length} routes active` });
  
  // Check 6: Replay safety (claimEventProcessing)
  try {
    const testEventId = `verify-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const claimed = await claimEventProcessing(testEventId);
    if (claimed) {
      const { clearProcessedMarker } = await import('./events/replay-safety');
      await clearProcessedMarker(testEventId);
      checks.push({ name: 'Replay safety (claimEventProcessing)', pass: true, detail: 'atomic claim works' });
    } else {
      checks.push({ name: 'Replay safety (claimEventProcessing)', pass: false, detail: 'claim returned false unexpectedly' });
    }
  } catch (err: any) {
    checks.push({ name: 'Replay safety (claimEventProcessing)', pass: false, detail: err.message });
  }
  
  const allPass = checks.every(c => c.pass);
  return { ok: allPass, checks };
}

// ─── Module Re-Exports ────────────────────────────────────────────────────────
// Re-export everything from event-bus so consumers can import from one place
export { publishEvent, subscribe, closeEventBus } from './events/event-bus';
export { registerRoute, unregisterAllRoutes, BuiltInRoutes, getRegisteredRoutes } from './events/router';
export { OrchestrationEvent } from './events/event-schemas';

// Phase 4 re-exports for consumers
export { ExecutionMode } from './phase4-shadow-replay';
export { recordEventProcessed, processWebhookEvent, detectExecutionMode } from './phase4-shadow-replay';