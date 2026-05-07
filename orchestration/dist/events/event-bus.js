"use strict";
/**
 * Event Bus — Redis Pub/Sub Wrapper
 * Phase 2: Internal orchestration event system
 *
 * Provides publish/subscribe over Redis channels with typed events.
 * Shadow-safe: does not affect production workflows or N8N.
 *
 * Architecture:
 * - Events published to Redis channels
 * - Subscribers receive events via Redis subscription
 * - This is internal-only (not exposed publicly)
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
exports.publishEvent = publishEvent;
exports.subscribe = subscribe;
exports.publishTestEvent = publishTestEvent;
exports.closeEventBus = closeEventBus;
const redis_queue_1 = require("../queue/redis-queue");
const config_1 = require("../config");
const _subscriptions = [];
let _subscriberRedis = null;
/**
 * Initialize the subscriber connection (separate from main Redis client).
 * Redis requires a dedicated connection for subscribing.
 */
async function ensureSubscriber() {
    if (!_subscriberRedis) {
        const { getRedis } = await Promise.resolve().then(() => __importStar(require('../queue/redis-queue')));
        const Redis = (await Promise.resolve().then(() => __importStar(require('ioredis')))).default;
        // Subscriber must use separate connection to avoid command conflicts
        const main = getRedis();
        _subscriberRedis = new Redis({
            host: main.options.host,
            port: main.options.port,
            password: main.options.password,
            db: main.options.db,
        });
        _subscriberRedis.on('error', (err) => {
            console.error('[event-bus][subscriber] error:', err.message);
        });
    }
    return _subscriberRedis;
}
/**
 * Publish an event to the orchestration event channel.
 * All Phase 2 components use this to emit events.
 */
async function publishEvent(event) {
    const redis = (0, redis_queue_1.getRedis)();
    const channel = config_1.REDIS_KEYS.eventsChannel;
    await redis.publish(channel, JSON.stringify(event));
    console.log(`[event-bus] published ${event.event_type} event_id=${event.event_id}`);
}
/**
 * Subscribe to events with optional type filter.
 * Returns an unsubscribe function.
 *
 * @param handler - Callback for matching events
 * @param eventTypeFilter - Optional pattern to filter (e.g., 'job.*', 'plan.created')
 */
async function subscribe(handler, eventTypeFilter) {
    const subscriber = await ensureSubscriber();
    const pattern = eventTypeFilter || '*';
    const channel = config_1.REDIS_KEYS.eventsChannel;
    // Channel-only subscription for specific channel
    await subscriber.subscribe(channel);
    const messageHandler = (ch, message) => {
        if (ch !== channel)
            return;
        try {
            const event = JSON.parse(message);
            // Apply filter if specified
            if (eventTypeFilter) {
                const matches = matchesPattern(event.event_type, eventTypeFilter);
                if (!matches)
                    return;
            }
            handler(event);
        }
        catch (err) {
            console.error('[event-bus][subscriber] failed to parse message:', err);
        }
    };
    subscriber.on('message', messageHandler);
    const subscription = {
        pattern: eventTypeFilter || '*',
        handler,
        channel,
        listener: () => subscriber.off('message', messageHandler),
    };
    _subscriptions.push(subscription);
    console.log(`[event-bus] subscribed to${eventTypeFilter ? ` pattern: ${eventTypeFilter}` : ' all events'}`);
    return () => {
        subscription.listener();
        const idx = _subscriptions.indexOf(subscription);
        if (idx !== -1)
            _subscriptions.splice(idx, 1);
        // Check if any subscriptions remain on this channel
        const remaining = _subscriptions.filter(s => s.channel === channel);
        if (remaining.length === 0) {
            subscriber.unsubscribe(channel);
        }
    };
}
/**
 * Publish an internal test event for validation.
 */
async function publishTestEvent(eventType, payload) {
    const { createEvent } = await Promise.resolve().then(() => __importStar(require('./event-schemas')));
    const event = createEvent(eventType, 'phase2-validator', payload);
    await publishEvent(event);
    return event;
}
/**
 * Utility: match event type against a pattern with wildcards.
 */
function matchesPattern(eventType, pattern) {
    if (pattern === '*')
        return true;
    if (pattern === eventType)
        return true;
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    return regex.test(eventType);
}
/**
 * Close all subscriptions and subscriber connection.
 */
async function closeEventBus() {
    for (const sub of _subscriptions) {
        sub.listener();
    }
    _subscriptions.length = 0;
    if (_subscriberRedis) {
        await _subscriberRedis.quit();
        _subscriberRedis = null;
    }
}
//# sourceMappingURL=event-bus.js.map