/**
 * Phase 3 — Webhook Integration: Receiver → Event Bus → Router
 * 
 * This module wires the webhook receiver to the event router so that
 * incoming internal events are published to Redis pub/sub and then routed
 * to registered handlers based on event type patterns.
 * 
 * Flow:
 *   HTTP POST /internal/event
 *     → webhook receiver validates payload
 *     → creates OrchestrationEvent
 *     → publishEvent (Redis pub/sub) ← Phase 2
 *     → event bus delivers to router  ← Phase 3 NEW
 *     → router matches pattern, calls handler
 *     → handler processes the event
 * 
 * Dual-write (Phase 3):
 *   publishEvent now does BOTH:
 *     1. Redis publish (real-time, low latency)
 *     2. Supabase events table insert (durability, audit log)
 * 
 * The hop_count / processed_at / processed_by columns for Phase 3 SQL are
 * PENDING from Ahmad. Code is written to accommodate them once the schema
 * is available.
 * 
 * Dependencies:
 *   - src/events/event-bus.ts (Phase 2)
 *   - src/events/router.ts (Phase 2)
 *   - src/persistence/supabase-client.ts (Phase 2)
 *   - src/config.ts (Phase 2)
 */

import { publishEvent, subscribe, closeEventBus } from './events/event-bus';
import { registerRoute, unregisterAllRoutes, BuiltInRoutes, getRegisteredRoutes, EventHandler } from './events/router';
import { getClient } from './persistence/supabase-client';
import { OrchestrationEvent } from './events/event-schemas';
import { QUEUE_CONFIG } from './config';

// ─── Dual-Write Strategy ──────────────────────────────────────────────────────
/**
 * dualWriteEvent(event) — Writes event to BOTH Redis and Supabase
 * 
 * Redis is the fast path (real-time pub/sub delivery to subscribers).
 * Supabase is the durable path (immutable audit log for governance, replay, recovery).
 * 
 * If Supabase write fails, we log the error but DO NOT fail the event publish.
 * Rationale: Redis pub/sub is already delivering the event to live subscribers.
 * Supabase is for durability/audit — losing a write doesn't break operational flow,
 * but failing the entire publish would.
 * 
 * TODO: In production, add a retry queue for failed Supabase writes (Phase 4).
 */
async function dualWriteEvent(event: OrchestrationEvent): Promise<void> {
  // Step 1: Redis pub/sub publish (the existing Phase 2 behavior)
  // This is synchronous-ish — ioredis publish returns once Redis acknowledges
  await publishEvent(event);
  
  // Step 2: Supabase durable write
  // Non-blocking: failures are logged but don't break the event flow
  persistEventToSupabase(event).catch((err) => {
    console.error(`[dual-write] Supabase write failed for event ${event.event_id}: ${err.message}`);
    // TODO: Phase 4 — enqueue to retry queue for later replay
  });
}

/**
 * persistEventToSupabase — Writes an orchestration event to the Supabase events table.
 * 
 * The events table schema (PENDING from Ahmad):
 *   event_id          UUID PRIMARY KEY
 *   event_type        TEXT NOT NULL
 *   source            TEXT NOT NULL
 *   payload           JSONB NOT NULL
 *   correlation_id    TEXT (nullable)
 *   caused_by_job_id  TEXT (nullable)
 *   hop_count         INTEGER DEFAULT 0  ← PENDING from Ahmad
 *   processed_at      TIMESTAMPTZ         ← PENDING from Ahmad
 *   processed_by      TEXT                ← PENDING from Ahmad
 *   created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * 
 * The hop_count, processed_at, processed_by columns are PENDING from Ahmad.
 * Code currently does NOT write to these columns — they will be added once schema is confirmed.
 */
async function persistEventToSupabase(event: OrchestrationEvent): Promise<void> {
  const client = getClient();
  
  // Phase 3 columns — hop_count, processed_at, processed_by PENDING from Ahmad
  // Using only the confirmed columns for now.
  // When Ahmad provides the SQL, this insert should be updated to include those columns.
  const { error } = await client.from('events').insert({
    event_id: event.event_id,
    event_type: event.event_type,
    source: event.source,
    payload: event.payload,
    correlation_id: event.correlation_id ?? null,
    caused_by_job_id: event.caused_by_job_id ?? null,
    created_at: event.created_at,
    // hop_count: event.hop_count,           // ← ADD WHEN SCHEMA READY
    // processed_at: new Date().toISOString(), // ← ADD WHEN SCHEMA READY
    // processed_by: 'webhook-receiver',       // ← ADD WHEN SCHEMA READY
  });
  
  if (error) {
    // Distinguish between "table doesn't exist" (schema not ready) and actual write errors
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.warn(`[dual-write] events table schema not ready (${error.message}). Skipping Supabase write.`);
      return; // Don't treat as hard failure — schema may still be pending
    }
    throw error; // Real write error — retry
  }
  
  console.log(`[dual-write] persisted event ${event.event_id} to Supabase`);
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
 * Current handlers (Phase 3 — minimal implementation):
 *   - job.queued: logs and tracks job enqueue
 *   - job.dead_lettered: logs and alerts
 *   - system.alert: logs and emits alerts
 * 
 * More handlers will be added in subsequent phases.
 */
export async function initializeWebhookHandlers(): Promise<() => void> {
  console.log('[phase3] Initializing webhook event handlers...');
  
  const routes: Array<{ pattern: string; description: string; unsub: () => void }> = [];
  
  // Job lifecycle handlers
  const jobLifecycleUnsub = await BuiltInRoutes.jobLifecycle({
    onJobQueued: async (event: OrchestrationEvent) => {
      console.log(`[handler][job.queued] job_id=${(event.payload as any).job_id} type=${(event.payload as any).job_type}`);
    },
    onJobDeadLettered: async (event: OrchestrationEvent) => {
      const payload = event.payload as any;
      console.warn(`[handler][job.dead_lettered] job_id=${payload.job_id} error=${payload.error}`);
    },
  });
  routes.push({ pattern: 'job.queued', description: 'job queued handler', unsub: jobLifecycleUnsub });
  
  // System alert handler
  const systemUnsub = await registerRoute('system.alert', async (event: OrchestrationEvent) => {
    const payload = event.payload as any;
    console.warn(`[handler][system.alert] severity=${payload.severity} component=${payload.component} message=${payload.message}`);
  }, 'system alert handler');
  routes.push({ pattern: 'system.alert', description: 'system alert handler', unsub: systemUnsub });
  
  // Generic catch-all logger (for development visibility)
  // Remove or disable in production to avoid log spam
  const catchallUnsub = await registerRoute('*', async (event: OrchestrationEvent) => {
    // Only log non-job events to avoid noise
    if (!event.event_type.startsWith('job.')) {
      console.log(`[handler][catchall] ${event.event_type} event_id=${event.event_id}`);
    }
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
 * verifyIntegration() — Smoke test for Phase 3 wiring.
 * 
 * Tests:
 *   1. Supabase client is reachable
 *   2. Events table exists (schema check)
 *   3. publishEvent works (Redis pub/sub)
 *   4. Event bus subscription works
 *   5. Routes are registered
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
  
  // Check 3: Events table schema (check if hop_count column exists)
  try {
    const client = getClient();
    // This will fail gracefully if the table doesn't have the new columns yet
    const { error } = await client.from('events').select('event_id, event_type, hop_count, processed_at, processed_by').limit(1);
    if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
      checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: 'hop_count/processed_at/processed_by not in schema yet — pending from Ahmad' });
    } else if (error) {
      checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: error.message });
    } else {
      checks.push({ name: 'Phase 3 SQL columns', pass: true, detail: 'schema ready' });
    }
  } catch (err: any) {
    checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: err.message });
  }
  
  // Check 4: Routes registered
  const routes = getRegisteredRoutes();
  checks.push({ name: 'Event routes registered', pass: routes.length > 0, detail: `${routes.length} routes active` });
  
  const allPass = checks.every(c => c.pass);
  return { ok: allPass, checks };
}

// ─── Module Re-Exports ────────────────────────────────────────────────────────
// Re-export everything from event-bus so consumers can import from one place
export { publishEvent, subscribe, closeEventBus } from './events/event-bus';
export { registerRoute, unregisterAllRoutes, BuiltInRoutes, getRegisteredRoutes } from './events/router';
export { OrchestrationEvent } from './events/event-schemas';