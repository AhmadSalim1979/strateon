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
export { publishEvent as publishEventWithDualWrite } from './events/event-bus';
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
export declare function initializeWebhookHandlers(): Promise<() => void>;
export declare function shutdownPhase3(): Promise<void>;
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
export declare function verifyIntegration(): Promise<{
    ok: boolean;
    checks: Array<{
        name: string;
        pass: boolean;
        detail?: string;
    }>;
}>;
export { publishEvent, subscribe, closeEventBus } from './events/event-bus';
export { registerRoute, unregisterAllRoutes, BuiltInRoutes, getRegisteredRoutes } from './events/router';
export { OrchestrationEvent } from './events/event-schemas';
//# sourceMappingURL=phase3-webhook-integration.d.ts.map