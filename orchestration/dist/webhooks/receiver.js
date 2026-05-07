"use strict";
/**
 * Webhook Receiver — Express app on port 3003
 * Phase 2: Internal event receiver (NOT publicly exposed)
 *
 * Receives internal orchestration events via HTTP.
 * Does NOT receive external traffic — this is an internal endpoint.
 *
 * Security: Only accepts requests with X-Internal-Secret header.
 * This prevents accidental external exposure.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERNAL_SECRET = exports.WEBHOOK_PORT = void 0;
exports.createWebhookReceiver = createWebhookReceiver;
const express_1 = __importDefault(require("express"));
const event_schemas_1 = require("../events/event-schemas");
const event_bus_1 = require("../events/event-bus");
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '3003', 10);
exports.WEBHOOK_PORT = WEBHOOK_PORT;
const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET || 'dev-internal-secret-change-in-prod';
exports.INTERNAL_SECRET = INTERNAL_SECRET;
// Auth middleware — reject requests without internal secret
function requireInternalSecret(req, res, next) {
    const secret = req.headers['x-internal-secret'];
    if (!secret || secret !== INTERNAL_SECRET) {
        res.status(401).json({ error: 'Unauthorized: internal secret required' });
        return;
    }
    next();
}
// Validate that the request body has expected fields
function validateWebhookPayload(body) {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Request body must be an object' };
    }
    const b = body;
    if (!b.event_type || typeof b.event_type !== 'string') {
        return { valid: false, error: 'event_type is required and must be a string' };
    }
    if (!b.source || typeof b.source !== 'string') {
        return { valid: false, error: 'source is required and must be a string' };
    }
    return { valid: true };
}
function createWebhookReceiver() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: '1mb' }));
    // Health check endpoint (no auth required)
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'webhook-receiver', port: WEBHOOK_PORT });
    });
    // Internal webhook endpoint — requires secret
    app.post('/internal/event', requireInternalSecret, async (req, res) => {
        try {
            const validation = validateWebhookPayload(req.body);
            if (!validation.valid) {
                res.status(400).json({ error: validation.error });
                return;
            }
            const { event_type, source, payload } = req.body;
            const event = (0, event_schemas_1.createEvent)(event_type, source, payload);
            await (0, event_bus_1.publishEvent)(event);
            res.status(200).json({
                received: true,
                event_id: event.event_id,
                event_type: event.event_type,
            });
        }
        catch (err) {
            console.error('[webhook-receiver] error processing event:', err);
            res.status(500).json({ error: 'Internal error processing webhook' });
        }
    });
    // Batch event endpoint for multiple events
    app.post('/internal/events/batch', requireInternalSecret, async (req, res) => {
        try {
            const events = req.body.events;
            if (!Array.isArray(events)) {
                res.status(400).json({ error: 'events must be an array' });
                return;
            }
            if (events.length > 100) {
                res.status(400).json({ error: 'Maximum 100 events per batch' });
                return;
            }
            const results = [];
            for (const rawEvent of events) {
                try {
                    const validation = validateWebhookPayload(rawEvent);
                    if (!validation.valid) {
                        results.push({ event_id: '', event_type: '', error: validation.error });
                        continue;
                    }
                    const { event_type, source, payload } = rawEvent;
                    const event = (0, event_schemas_1.createEvent)(event_type, source, payload);
                    await (0, event_bus_1.publishEvent)(event);
                    results.push({ event_id: event.event_id, event_type: event.event_type });
                }
                catch (err) {
                    results.push({ event_id: '', event_type: '', error: err.message });
                }
            }
            res.status(200).json({ received: results.length, results });
        }
        catch (err) {
            console.error('[webhook-receiver] error processing batch:', err);
            res.status(500).json({ error: 'Internal error processing batch' });
        }
    });
    return app;
}
// Start the receiver if run directly
if (require.main === module) {
    const app = createWebhookReceiver();
    const server = app.listen(WEBHOOK_PORT, '127.0.0.1', () => {
        console.log(`[webhook-receiver] listening on 127.0.0.1:${WEBHOOK_PORT} (internal only)`);
    });
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('[webhook-receiver] SIGTERM received, shutting down');
        server.close(() => process.exit(0));
    });
}
//# sourceMappingURL=receiver.js.map