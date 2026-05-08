"use strict";
/**
 * Phase 3 — Webhook Integration Entry Point
 *
 * Starts the webhook receiver AND the event router integration.
 *
 * Usage:
 *   npm run phase3
 *   or: node dist/phase3-integration.js
 *
 * Env vars required:
 *   WEBHOOK_INTERNAL_SECRET  — must override the dev default in production
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   REDIS_HOST, REDIS_PORT (optional)
 *
 * Env vars optional:
 *   WEBHOOK_PORT (default 3003)
 *   QUEUE_DEPTH_WARNING  — alert threshold (default 50)
 *   QUEUE_DEPTH_CRITICAL — critical threshold (default 100)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const receiver_1 = require("./webhooks/receiver");
const phase3_webhook_integration_1 = require("./phase3-webhook-integration");
const queue_monitor_1 = require("./monitoring/queue-monitor");
const queue_manager_1 = require("./queue/queue-manager");
const config_1 = require("./config");
async function main() {
    console.log('[phase3-integration] Starting Phase 3 webhook integration...');
    // ─── Config Validation ─────────────────────────────────────────────────────
    const configValidation = (0, config_1.validateConfig)();
    const secret = process.env.WEBHOOK_INTERNAL_SECRET;
    if (!secret || secret === 'dev-internal-secret-change-in-prod') {
        console.error('[phase3-integration] FATAL: WEBHOOK_INTERNAL_SECRET not set or still has default value.');
        console.error('[phase3-integration] Set WEBHOOK_INTERNAL_SECRET env var before running in production.');
        process.exit(1);
    }
    if (!configValidation.valid) {
        console.warn('[phase3-integration] Config validation warnings:', configValidation.errors);
    }
    // ─── Integration Verification ─────────────────────────────────────────────
    console.log('[phase3-integration] Verifying integration...');
    const verification = await (0, phase3_webhook_integration_1.verifyIntegration)();
    for (const check of verification.checks) {
        const icon = check.pass ? '✅' : '❌';
        console.log(`  ${icon} ${check.name}: ${check.detail}`);
    }
    if (!verification.ok) {
        console.warn('[phase3-integration] ⚠️  Integration verification incomplete — some checks failed.');
        console.warn('[phase3-integration] Continuing anyway — non-critical checks may recover at runtime.');
    }
    else {
        console.log('[phase3-integration] ✅ Integration verification passed');
    }
    // ─── Initialize Event Handlers ─────────────────────────────────────────────
    console.log('[phase3-integration] Initializing event handlers...');
    const shutdownHandlers = await (0, phase3_webhook_integration_1.initializeWebhookHandlers)();
    // ─── Start Queue Monitor ───────────────────────────────────────────────────
    const warningThreshold = parseInt(process.env.QUEUE_DEPTH_WARNING || '50', 10);
    const criticalThreshold = parseInt(process.env.QUEUE_DEPTH_CRITICAL || '100', 10);
    (0, queue_monitor_1.startQueueMonitor)({
        warningThreshold,
        criticalThreshold,
        checkIntervalMs: 30000, // check every 30s
    });
    // ─── Start Webhook Receiver ───────────────────────────────────────────────
    const app = (0, receiver_1.createWebhookReceiver)();
    const PORT = parseInt(process.env.WEBHOOK_PORT || '3003', 10);
    const server = app.listen(PORT, '127.0.0.1', () => {
        console.log(`[phase3-integration] 🚀 Webhook receiver listening on 127.0.0.1:${PORT} (internal only)`);
        console.log(`[phase3-integration]   Queue depth warning threshold: ${warningThreshold}`);
        console.log(`[phase3-integration]   Queue depth critical threshold: ${criticalThreshold}`);
        console.log('[phase3-integration] ✅ Phase 3 integration running');
    });
    // ─── Graceful Shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal) => {
        console.log(`[phase3-integration] ${signal} received, shutting down gracefully...`);
        (0, queue_monitor_1.stopQueueMonitor)();
        await shutdownHandlers();
        await (0, phase3_webhook_integration_1.shutdownPhase3)();
        server.close(() => {
            console.log('[phase3-integration] HTTP server closed');
            process.exit(0);
        });
        // Force exit after 10s
        setTimeout(() => {
            console.error('[phase3-integration] Forced exit after graceful shutdown timeout');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    // ─── Status Endpoint (for external monitoring) ────────────────────────────
    // Expose a /status endpoint on a separate port for queue monitoring
    const STATUS_PORT = parseInt(process.env.STATUS_PORT || '3005', 10);
    const statusApp = require('express')();
    statusApp.get('/status', async (_req, res) => {
        const stats = (0, queue_manager_1.getQueueStats)();
        const verification2 = await (0, phase3_webhook_integration_1.verifyIntegration)();
        res.json({
            status: 'running',
            phase: 'phase3',
            timestamp: new Date().toISOString(),
            queue: stats,
            integration: verification2.ok ? 'ok' : 'degraded',
            checks: verification2.checks,
        });
    });
    statusApp.listen(STATUS_PORT, '127.0.0.1', () => {
        console.log(`[phase3-integration] Status endpoint on 127.0.0.1:${STATUS_PORT}`);
    });
}
main().catch((err) => {
    console.error('[phase3-integration] Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=phase3-integration.js.map