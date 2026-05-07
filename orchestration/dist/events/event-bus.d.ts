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
import { OrchestrationEvent } from './event-schemas';
export type EventHandler = (event: OrchestrationEvent) => void | Promise<void>;
/**
 * Publish an event to the orchestration event channel.
 * All Phase 2 components use this to emit events.
 */
export declare function publishEvent(event: OrchestrationEvent): Promise<void>;
/**
 * Subscribe to events with optional type filter.
 * Returns an unsubscribe function.
 *
 * @param handler - Callback for matching events
 * @param eventTypeFilter - Optional pattern to filter (e.g., 'job.*', 'plan.created')
 */
export declare function subscribe(handler: EventHandler, eventTypeFilter?: string): Promise<() => void>;
/**
 * Publish an internal test event for validation.
 */
export declare function publishTestEvent(eventType: string, payload: object): Promise<OrchestrationEvent>;
/**
 * Close all subscriptions and subscriber connection.
 */
export declare function closeEventBus(): Promise<void>;
//# sourceMappingURL=event-bus.d.ts.map