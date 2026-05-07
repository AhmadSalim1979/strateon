"use strict";
/**
 * Event Schemas — Orchestration Framework
 *
 * All events in the system are typed. This file defines the event type
 * constants and the TypeScript interfaces for all event payloads.
 *
 * Event architecture:
 * - Events flow through Redis pub/sub (real-time)
 * - Events are also persisted to Supabase events table (immutable log)
 * - This dual approach gives us speed (Redis) + durability (Supabase)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypes = void 0;
exports.createEvent = createEvent;
exports.isExecutionEvent = isExecutionEvent;
exports.isJobEvent = isJobEvent;
exports.isApprovalEvent = isApprovalEvent;
exports.isSystemEvent = isSystemEvent;
exports.isWorkerEvent = isWorkerEvent;
// ─── Event Type Constants ─────────────────────────────────────────────────────
exports.EventTypes = {
    // Execution events
    PLAN_CREATED: 'plan.created',
    PLAN_UPDATED: 'plan.updated',
    PLAN_ACTIVATED: 'plan.activated',
    PLAN_PAUSED: 'plan.paused',
    PLAN_RESUMED: 'plan.resumed',
    PLAN_COMPLETED: 'plan.completed',
    PLAN_FAILED: 'plan.failed',
    PLAN_ABANDONED: 'plan.abandoned',
    // Step events
    STEP_READY: 'step.ready',
    STEP_WAITING_APPROVAL: 'step.waiting_approval',
    STEP_APPROVED: 'step.approved',
    STEP_REJECTED: 'step.rejected',
    STEP_EXECUTING: 'step.executing',
    STEP_COMPLETED: 'step.completed',
    STEP_FAILED: 'step.failed',
    // Job events
    JOB_QUEUED: 'job.queued',
    JOB_STARTED: 'job.started',
    JOB_COMPLETED: 'job.completed',
    JOB_FAILED: 'job.failed',
    JOB_RETRY_SCHEDULED: 'job.retry_scheduled',
    JOB_DEAD_LETTERED: 'job.dead_lettered',
    JOB_CANCELLED: 'job.cancelled',
    // Approval events
    APPROVAL_REQUESTED: 'approval.requested',
    APPROVAL_RECEIVED: 'approval.received',
    APPROVAL_REJECTED: 'approval.rejected',
    APPROVAL_EXPIRED: 'approval.expired',
    // System events
    SYSTEM_STATUS_CHANGED: 'system.status_changed',
    SYSTEM_HEALTH_CHECK: 'system.health_check',
    SYSTEM_ALERT: 'system.alert',
    // Worker events
    WORKER_REGISTERED: 'worker.registered',
    WORKER_HEARTBEAT: 'worker.heartbeat',
    WORKER_DEAD: 'worker.dead',
    WORKER_JOB_STARTED: 'worker.job_started',
    WORKER_JOB_COMPLETED: 'worker.job_completed',
    // Trigger events
    TRIGGER_FIRED: 'trigger.fired',
    TRIGGER_WEBHOOK_RECEIVED: 'trigger.webhook_received',
    // Custom events can be added at runtime via the event bus
};
// ─── Event Creation Helper ─────────────────────────────────────────────────────
function createEvent(eventType, source, payload, options) {
    const { v4: uuidv4 } = require('uuid');
    return {
        event_id: uuidv4(),
        event_type: eventType,
        source,
        payload,
        correlation_id: options?.correlation_id,
        caused_by_job_id: options?.caused_by_job_id,
        hop_count: options?.hop_count ?? 0,
        created_at: new Date().toISOString(),
    };
}
// ─── Event Type Guards ─────────────────────────────────────────────────────────
function isExecutionEvent(eventType) {
    return eventType.startsWith('plan.') || eventType.startsWith('step.');
}
function isJobEvent(eventType) {
    return eventType.startsWith('job.');
}
function isApprovalEvent(eventType) {
    return eventType.startsWith('approval.');
}
function isSystemEvent(eventType) {
    return eventType.startsWith('system.');
}
function isWorkerEvent(eventType) {
    return eventType.startsWith('worker.');
}
//# sourceMappingURL=event-schemas.js.map