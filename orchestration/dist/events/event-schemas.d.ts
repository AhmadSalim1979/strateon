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
export declare const EventTypes: {
    readonly PLAN_CREATED: "plan.created";
    readonly PLAN_UPDATED: "plan.updated";
    readonly PLAN_ACTIVATED: "plan.activated";
    readonly PLAN_PAUSED: "plan.paused";
    readonly PLAN_RESUMED: "plan.resumed";
    readonly PLAN_COMPLETED: "plan.completed";
    readonly PLAN_FAILED: "plan.failed";
    readonly PLAN_ABANDONED: "plan.abandoned";
    readonly STEP_READY: "step.ready";
    readonly STEP_WAITING_APPROVAL: "step.waiting_approval";
    readonly STEP_APPROVED: "step.approved";
    readonly STEP_REJECTED: "step.rejected";
    readonly STEP_EXECUTING: "step.executing";
    readonly STEP_COMPLETED: "step.completed";
    readonly STEP_FAILED: "step.failed";
    readonly JOB_QUEUED: "job.queued";
    readonly JOB_STARTED: "job.started";
    readonly JOB_COMPLETED: "job.completed";
    readonly JOB_FAILED: "job.failed";
    readonly JOB_RETRY_SCHEDULED: "job.retry_scheduled";
    readonly JOB_DEAD_LETTERED: "job.dead_lettered";
    readonly JOB_CANCELLED: "job.cancelled";
    readonly APPROVAL_REQUESTED: "approval.requested";
    readonly APPROVAL_RECEIVED: "approval.received";
    readonly APPROVAL_REJECTED: "approval.rejected";
    readonly APPROVAL_EXPIRED: "approval.expired";
    readonly SYSTEM_STATUS_CHANGED: "system.status_changed";
    readonly SYSTEM_HEALTH_CHECK: "system.health_check";
    readonly SYSTEM_ALERT: "system.alert";
    readonly WORKER_REGISTERED: "worker.registered";
    readonly WORKER_HEARTBEAT: "worker.heartbeat";
    readonly WORKER_DEAD: "worker.dead";
    readonly WORKER_JOB_STARTED: "worker.job_started";
    readonly WORKER_JOB_COMPLETED: "worker.job_completed";
    readonly TRIGGER_FIRED: "trigger.fired";
    readonly TRIGGER_WEBHOOK_RECEIVED: "trigger.webhook_received";
};
export type EventType = typeof EventTypes[keyof typeof EventTypes] | string;
export interface OrchestrationEvent {
    event_id: string;
    event_type: EventType;
    source: string;
    payload: object;
    correlation_id?: string;
    caused_by_job_id?: string;
    hop_count: number;
    created_at: string;
}
export interface PlanCreatedPayload {
    plan_id: string;
    description: string;
    created_by: string;
    step_count: number;
}
export interface PlanCompletedPayload {
    plan_id: string;
    duration_ms: number;
    steps_completed: number;
}
export interface PlanFailedPayload {
    plan_id: string;
    reason: string;
    failed_step_id?: string;
}
export interface StepCompletedPayload {
    plan_id: string;
    step_id: string;
    step_index: number;
    duration_ms: number;
    result: object;
}
export interface StepWaitingApprovalPayload {
    plan_id: string;
    step_id: string;
    step_index: number;
    action_type: string;
    action_description: string;
    approval_token: string;
}
export interface JobQueuedPayload {
    job_id: string;
    job_type: string;
    priority: number;
    execution_plan_id?: string;
    step_id?: string;
}
export interface JobCompletedPayload {
    job_id: string;
    duration_ms: number;
    result: object;
}
export interface JobFailedPayload {
    job_id: string;
    error: string;
    retry_count: number;
    will_retry: boolean;
}
export interface ApprovalRequestedPayload {
    approval_id: string;
    plan_id: string;
    step_id?: string;
    action_type: string;
    action_description: string;
    requested_at: string;
    correlation_id: string;
}
export interface ApprovalReceivedPayload {
    approval_id: string;
    decision: 'APPROVED' | 'REJECTED';
    operator_id: string;
    decided_at: string;
    comment?: string;
}
export interface SystemStatusChangedPayload {
    old_status: string;
    new_status: string;
    reason: string;
}
export interface SystemAlertPayload {
    severity: 'info' | 'warning' | 'critical';
    component: string;
    message: string;
    details?: object;
}
export interface WorkerRegisteredPayload {
    worker_id: string;
    worker_type: string;
    started_at: string;
}
export interface WorkerDeadPayload {
    worker_id: string;
    last_heartbeat: string;
    current_job_id?: string;
}
export interface TriggerFiredPayload {
    trigger_id: string;
    trigger_type: string;
    trigger_name: string;
    target_plan_ids: string[];
    fired_at: string;
}
export interface WebhookReceivedPayload {
    trigger_id: string;
    source: string;
    headers: Record<string, string>;
    body: object;
    received_at: string;
}
export declare function createEvent(eventType: EventType, source: string, payload: object, options?: {
    correlation_id?: string;
    caused_by_job_id?: string;
    hop_count?: number;
}): OrchestrationEvent;
export declare function isExecutionEvent(eventType: string): boolean;
export declare function isJobEvent(eventType: string): boolean;
export declare function isApprovalEvent(eventType: string): boolean;
export declare function isSystemEvent(eventType: string): boolean;
export declare function isWorkerEvent(eventType: string): boolean;
//# sourceMappingURL=event-schemas.d.ts.map