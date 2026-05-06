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

// ─── Event Type Constants ─────────────────────────────────────────────────────

export const EventTypes = {
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
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes] | string;

// ─── Base Event Interface ─────────────────────────────────────────────────────

export interface OrchestrationEvent {
  event_id: string;        // UUID
  event_type: EventType;
  source: string;          // Which component emitted this event
  payload: object;
  correlation_id?: string; // Links related events in a flow
  caused_by_job_id?: string;
  hop_count: number;       // Incremented each time event is processed (prevents infinite loops)
  created_at: string;     // ISO8601
}

// ─── Event Payload Types ───────────────────────────────────────────────────────

// Execution plan payloads
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

// Step payloads
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

// Job payloads
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

// Approval payloads
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

// System payloads
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

// Worker payloads
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

// Trigger payloads
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

// ─── Event Creation Helper ─────────────────────────────────────────────────────

export function createEvent(
  eventType: EventType,
  source: string,
  payload: object,
  options?: {
    correlation_id?: string;
    caused_by_job_id?: string;
    hop_count?: number;
  }
): OrchestrationEvent {
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

export function isExecutionEvent(eventType: string): boolean {
  return eventType.startsWith('plan.') || eventType.startsWith('step.');
}

export function isJobEvent(eventType: string): boolean {
  return eventType.startsWith('job.');
}

export function isApprovalEvent(eventType: string): boolean {
  return eventType.startsWith('approval.');
}

export function isSystemEvent(eventType: string): boolean {
  return eventType.startsWith('system.');
}

export function isWorkerEvent(eventType: string): boolean {
  return eventType.startsWith('worker.');
}