"use strict";
/**
 * Event Router — Routes events to handlers by type
 * Phase 2: Internal event routing system
 *
 * Routes incoming events to registered handlers based on event_type.
 * Supports wildcard patterns (e.g., 'job.*' matches all job events).
 *
 * Shadow-safe: does not modify production behavior.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltInRoutes = void 0;
exports.registerRoute = registerRoute;
exports.unregisterAllRoutes = unregisterAllRoutes;
exports.getRegisteredRoutes = getRegisteredRoutes;
exports.matchesPattern = matchesPattern;
const event_bus_1 = require("./event-bus");
const _routes = [];
/**
 * Register a handler for events matching a pattern.
 * Pattern supports wildcards: 'job.*', 'plan.created', '*'
 */
async function registerRoute(pattern, handler, description) {
    const existing = _routes.find(r => r.pattern === pattern);
    if (existing) {
        const originalHandler = existing.handler;
        existing.handler = async (event) => {
            await originalHandler(event);
            await handler(event);
        };
        existing.description = existing.description
            ? `${existing.description}; also: ${description || 'additional handler'}`
            : description;
        return () => { };
    }
    const unsubscribe = await (0, event_bus_1.subscribe)(async (event) => {
        if (matchesPattern(event.event_type, pattern)) {
            try {
                await handler(event);
            }
            catch (err) {
                console.error(`[event-router] handler error for pattern '${pattern}':`, err);
            }
        }
    }, pattern);
    const registration = {
        pattern,
        handler,
        description,
        unsubscribe,
    };
    _routes.push(registration);
    console.log(`[event-router] registered route: '${pattern}'${description ? ` (${description})` : ''}`);
    return () => {
        unsubscribe();
        const idx = _routes.indexOf(registration);
        if (idx !== -1)
            _routes.splice(idx, 1);
    };
}
async function unregisterAllRoutes() {
    for (const route of _routes) {
        route.unsubscribe();
    }
    _routes.length = 0;
    console.log('[event-router] all routes unregistered');
}
function getRegisteredRoutes() {
    return _routes.map(r => ({ pattern: r.pattern, description: r.description }));
}
function matchesPattern(eventType, pattern) {
    if (pattern === '*')
        return true;
    if (pattern === eventType)
        return true;
    const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    return regex.test(eventType);
}
// Built-in route templates
exports.BuiltInRoutes = {
    jobLifecycle: async (handlers) => {
        const unsubs = [];
        if (handlers.onJobQueued)
            unsubs.push(await registerRoute('job.queued', handlers.onJobQueued, 'job queued'));
        if (handlers.onJobStarted)
            unsubs.push(await registerRoute('job.started', handlers.onJobStarted, 'job started'));
        if (handlers.onJobCompleted)
            unsubs.push(await registerRoute('job.completed', handlers.onJobCompleted, 'job completed'));
        if (handlers.onJobFailed)
            unsubs.push(await registerRoute('job.failed', handlers.onJobFailed, 'job failed'));
        if (handlers.onJobDeadLettered)
            unsubs.push(await registerRoute('job.dead_lettered', handlers.onJobDeadLettered, 'job dead lettered'));
        return () => unsubs.forEach(r => r());
    },
    planLifecycle: async (handlers) => {
        const unsubs = [];
        if (handlers.onPlanCreated)
            unsubs.push(await registerRoute('plan.created', handlers.onPlanCreated, 'plan created'));
        if (handlers.onPlanActivated)
            unsubs.push(await registerRoute('plan.activated', handlers.onPlanActivated, 'plan activated'));
        if (handlers.onPlanCompleted)
            unsubs.push(await registerRoute('plan.completed', handlers.onPlanCompleted, 'plan completed'));
        if (handlers.onPlanFailed)
            unsubs.push(await registerRoute('plan.failed', handlers.onPlanFailed, 'plan failed'));
        return () => unsubs.forEach(r => r());
    },
};
//# sourceMappingURL=router.js.map