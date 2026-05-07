/**
 * Event Router — Routes events to handlers by type
 * Phase 2: Internal event routing system
 *
 * Routes incoming events to registered handlers based on event_type.
 * Supports wildcard patterns (e.g., 'job.*' matches all job events).
 *
 * Shadow-safe: does not modify production behavior.
 */
import { OrchestrationEvent } from './event-schemas';
export type EventHandler = (event: OrchestrationEvent) => void | Promise<void>;
/**
 * Register a handler for events matching a pattern.
 * Pattern supports wildcards: 'job.*', 'plan.created', '*'
 */
export declare function registerRoute(pattern: string, handler: EventHandler, description?: string): Promise<() => void>;
export declare function unregisterAllRoutes(): Promise<void>;
export declare function getRegisteredRoutes(): Array<{
    pattern: string;
    description?: string;
}>;
export declare function matchesPattern(eventType: string, pattern: string): boolean;
export declare const BuiltInRoutes: {
    jobLifecycle: (handlers: {
        onJobQueued?: EventHandler;
        onJobStarted?: EventHandler;
        onJobCompleted?: EventHandler;
        onJobFailed?: EventHandler;
        onJobDeadLettered?: EventHandler;
    }) => Promise<() => void>;
    planLifecycle: (handlers: {
        onPlanCreated?: EventHandler;
        onPlanActivated?: EventHandler;
        onPlanCompleted?: EventHandler;
        onPlanFailed?: EventHandler;
    }) => Promise<() => void>;
};
export type { OrchestrationEvent };
//# sourceMappingURL=router.d.ts.map