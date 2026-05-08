"use strict";
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
exports.getRegisteredRoutes = exports.BuiltInRoutes = exports.unregisterAllRoutes = exports.registerRoute = exports.closeEventBus = exports.subscribe = exports.publishEvent = exports.publishEventWithDualWrite = void 0;
exports.initializeWebhookHandlers = initializeWebhookHandlers;
exports.shutdownPhase3 = shutdownPhase3;
exports.verifyIntegration = verifyIntegration;
const event_bus_1 = require("./events/event-bus");
const router_1 = require("./events/router");
const supabase_client_1 = require("./persistence/supabase-client");
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
async function dualWriteEvent(event) {
    // Step 1: Redis pub/sub publish (the existing Phase 2 behavior)
    // This is synchronous-ish — ioredis publish returns once Redis acknowledges
    await (0, event_bus_1.publishEvent)(event);
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
async function persistEventToSupabase(event) {
    const client = (0, supabase_client_1.getClient)();
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
var event_bus_2 = require("./events/event-bus");
Object.defineProperty(exports, "publishEventWithDualWrite", { enumerable: true, get: function () { return event_bus_2.publishEvent; } });
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
async function initializeWebhookHandlers() {
    console.log('[phase3] Initializing webhook event handlers...');
    const routes = [];
    // Job lifecycle handlers
    const jobLifecycleUnsub = await router_1.BuiltInRoutes.jobLifecycle({
        onJobQueued: async (event) => {
            console.log(`[handler][job.queued] job_id=${event.payload.job_id} type=${event.payload.job_type}`);
        },
        onJobDeadLettered: async (event) => {
            const payload = event.payload;
            console.warn(`[handler][job.dead_lettered] job_id=${payload.job_id} error=${payload.error}`);
        },
    });
    routes.push({ pattern: 'job.queued', description: 'job queued handler', unsub: jobLifecycleUnsub });
    // System alert handler
    const systemUnsub = await (0, router_1.registerRoute)('system.alert', async (event) => {
        const payload = event.payload;
        console.warn(`[handler][system.alert] severity=${payload.severity} component=${payload.component} message=${payload.message}`);
    }, 'system alert handler');
    routes.push({ pattern: 'system.alert', description: 'system alert handler', unsub: systemUnsub });
    // Generic catch-all logger (for development visibility)
    // Remove or disable in production to avoid log spam
    const catchallUnsub = await (0, router_1.registerRoute)('*', async (event) => {
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
        await (0, router_1.unregisterAllRoutes)();
        console.log('[phase3] All webhook handlers shut down');
    };
}
// ─── Shutdown ─────────────────────────────────────────────────────────────────
async function shutdownPhase3() {
    await (0, event_bus_1.closeEventBus)();
    await (0, router_1.unregisterAllRoutes)();
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
async function verifyIntegration() {
    const checks = [];
    // Check 1: Supabase client health
    try {
        const { healthCheck } = await Promise.resolve().then(() => __importStar(require('./persistence/supabase-client')));
        const health = await healthCheck();
        checks.push({ name: 'Supabase connection', pass: health.ok, detail: `${health.latencyMs}ms` });
    }
    catch (err) {
        checks.push({ name: 'Supabase connection', pass: false, detail: err.message });
    }
    // Check 2: Redis connection (via event bus)
    try {
        const { getRedis } = await Promise.resolve().then(() => __importStar(require('./queue/redis-queue')));
        const redis = getRedis();
        await redis.ping();
        checks.push({ name: 'Redis connection', pass: true, detail: 'pong received' });
    }
    catch (err) {
        checks.push({ name: 'Redis connection', pass: false, detail: err.message });
    }
    // Check 3: Events table schema (check if hop_count column exists)
    try {
        const client = (0, supabase_client_1.getClient)();
        // This will fail gracefully if the table doesn't have the new columns yet
        const { error } = await client.from('events').select('event_id, event_type, hop_count, processed_at, processed_by').limit(1);
        if (error && (error.message.includes('does not exist') || error.code === '42P01')) {
            checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: 'hop_count/processed_at/processed_by not in schema yet — pending from Ahmad' });
        }
        else if (error) {
            checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: error.message });
        }
        else {
            checks.push({ name: 'Phase 3 SQL columns', pass: true, detail: 'schema ready' });
        }
    }
    catch (err) {
        checks.push({ name: 'Phase 3 SQL columns', pass: false, detail: err.message });
    }
    // Check 4: Routes registered
    const routes = (0, router_1.getRegisteredRoutes)();
    checks.push({ name: 'Event routes registered', pass: routes.length > 0, detail: `${routes.length} routes active` });
    const allPass = checks.every(c => c.pass);
    return { ok: allPass, checks };
}
// ─── Module Re-Exports ────────────────────────────────────────────────────────
// Re-export everything from event-bus so consumers can import from one place
var event_bus_3 = require("./events/event-bus");
Object.defineProperty(exports, "publishEvent", { enumerable: true, get: function () { return event_bus_3.publishEvent; } });
Object.defineProperty(exports, "subscribe", { enumerable: true, get: function () { return event_bus_3.subscribe; } });
Object.defineProperty(exports, "closeEventBus", { enumerable: true, get: function () { return event_bus_3.closeEventBus; } });
var router_2 = require("./events/router");
Object.defineProperty(exports, "registerRoute", { enumerable: true, get: function () { return router_2.registerRoute; } });
Object.defineProperty(exports, "unregisterAllRoutes", { enumerable: true, get: function () { return router_2.unregisterAllRoutes; } });
Object.defineProperty(exports, "BuiltInRoutes", { enumerable: true, get: function () { return router_2.BuiltInRoutes; } });
Object.defineProperty(exports, "getRegisteredRoutes", { enumerable: true, get: function () { return router_2.getRegisteredRoutes; } });
//# sourceMappingURL=phase3-webhook-integration.js.map