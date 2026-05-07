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

import { getRedis } from '../queue/redis-queue';
import { REDIS_KEYS } from '../config';
import { OrchestrationEvent } from './event-schemas';

export type EventHandler = (event: OrchestrationEvent) => void | Promise<void>;

interface Subscription {
  pattern: string;
  handler: EventHandler;
  channel: string;
  listener: () => void;
}

const _subscriptions: Subscription[] = [];
let _subscriberRedis: import('ioredis').default | null = null;

/**
 * Initialize the subscriber connection (separate from main Redis client).
 * Redis requires a dedicated connection for subscribing.
 */
async function ensureSubscriber(): Promise<import('ioredis').default> {
  if (!_subscriberRedis) {
    const { getRedis } = await import('../queue/redis-queue');
    const Redis = (await import('ioredis')).default;
    
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
export async function publishEvent(event: OrchestrationEvent): Promise<void> {
  const redis = getRedis();
  const channel = REDIS_KEYS.eventsChannel;
  
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
export async function subscribe(
  handler: EventHandler,
  eventTypeFilter?: string
): Promise<() => void> {
  const subscriber = await ensureSubscriber();
  const pattern = eventTypeFilter || '*';
  const channel = REDIS_KEYS.eventsChannel;
  
  // Channel-only subscription for specific channel
  await subscriber.subscribe(channel);
  
  const messageHandler = (ch: string, message: string) => {
    if (ch !== channel) return;
    
    try {
      const event: OrchestrationEvent = JSON.parse(message);
      
      // Apply filter if specified
      if (eventTypeFilter) {
        const matches = matchesPattern(event.event_type, eventTypeFilter);
        if (!matches) return;
      }
      
      handler(event);
    } catch (err) {
      console.error('[event-bus][subscriber] failed to parse message:', err);
    }
  };
  
  subscriber.on('message', messageHandler);
  
  const subscription: Subscription = {
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
    if (idx !== -1) _subscriptions.splice(idx, 1);
    
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
export async function publishTestEvent(eventType: string, payload: object): Promise<OrchestrationEvent> {
  const { createEvent } = await import('./event-schemas');
  const event = createEvent(eventType, 'phase2-validator', payload);
  await publishEvent(event);
  return event;
}

/**
 * Utility: match event type against a pattern with wildcards.
 */
function matchesPattern(eventType: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === eventType) return true;
  
  const regex = new RegExp(
    '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
  );
  return regex.test(eventType);
}

/**
 * Close all subscriptions and subscriber connection.
 */
export async function closeEventBus(): Promise<void> {
  for (const sub of _subscriptions) {
    sub.listener();
  }
  _subscriptions.length = 0;
  
  if (_subscriberRedis) {
    await _subscriberRedis.quit();
    _subscriberRedis = null;
  }
}