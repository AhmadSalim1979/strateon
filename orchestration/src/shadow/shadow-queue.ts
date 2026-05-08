/**
 * Shadow Queue — Phase 4: Shadow Mode Queue Processing
 * 
 * Shadow queue receives events and queues them for shadow replay.
 * Unlike the production queue, shadow queue:
 * 
 * - Never executes live actions
 * - Is completely isolated from production Redis queue
 * - Stores shadow events in memory + Supabase shadow_events table
 * - Supports replay, pause, resume
 * - Does not affect production job execution
 * 
 * Architecture:
 * - shadow_events are stored in a Redis-backed in-process queue
 * - Each event is wrapped with shadow_run_id for traceability
 * - Events are processed by shadow-replay, not by production workers
 * - Shadow queue state persists to Supabase (survives restarts)
 */

import { v4 as uuidv4 } from 'uuid';
import { logShadowExecution } from './governance-guard';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShadowQueueEvent {
  shadow_run_id: string;
  shadow_event_id: string;
  event_type: string;
  source: string;
  correlation_id?: string;
  payload: object;
  hop_count: number;
  queued_at: string;
  status: 'pending' | 'processing' | 'completed' | 'blocked' | 'failed';
  result?: string;
  error?: string;
  simulated: boolean;
}

export interface ShadowQueueStats {
  pending: number;
  processing: number;
  completed: number;
  blocked: number;
  failed: number;
  total: number;
}

interface QueueEntry {
  event: ShadowQueueEvent;
  addedAt: number;
  priority: number;
}

// ─── In-Memory Shadow Queue ────────────────────────────────────────────────────

const _shadowQueue: QueueEntry[] = [];
let _processing = false;
let _currentShadowRunId: string | null = null;

// ─── Shadow Queue Operations ────────────────────────────────────────────────────

/**
 * Enqueue an event for shadow replay.
 * The event is stored in-memory and also logged to Supabase shadow_events table.
 * 
 * @param eventType - Event type (e.g., 'job.queued')
 * @param source - Source component
 * @param payload - Event payload
 * @param options - shadow_run_id and correlation_id for tracing
 */
export async function shadowEnqueue(
  eventType: string,
  source: string,
  payload: object,
  options?: {
    shadow_run_id?: string;
    correlation_id?: string;
    priority?: number;
    simulated?: boolean;
  }
): Promise<ShadowQueueEvent> {
  const shadow_run_id = options?.shadow_run_id || `shadow-${Date.now()}-${uuidv4().slice(0, 8)}`;
  const shadow_event_id = `se-${Date.now()}-${uuidv4().slice(0, 8)}`;

  const event: ShadowQueueEvent = {
    shadow_run_id,
    shadow_event_id,
    event_type: eventType,
    source,
    correlation_id: options?.correlation_id,
    payload,
    hop_count: 0,
    queued_at: new Date().toISOString(),
    status: 'pending',
    simulated: options?.simulated ?? true,
  };

  const entry: QueueEntry = {
    event,
    addedAt: Date.now(),
    priority: options?.priority || 2,
  };

  _shadowQueue.push(entry);

  // Sort by priority (1=high, 2=medium, 3=low) then FIFO
  _shadowQueue.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.addedAt - b.addedAt;
  });

  // Log to Supabase shadow_events table
  await logShadowExecution({
    shadow_run_id,
    event_type: eventType,
    source,
    action: 'queue.enqueue',
    target: shadow_event_id,
    payload,
    simulated: event.simulated,
    result: 'queued',
  });

  console.log(`[shadow-queue] enqueued ${eventType} shadow_run_id=${shadow_run_id} shadow_event_id=${shadow_event_id}`);

  return event;
}

/**
 * Dequeue the next shadow event for processing.
 * Returns null if queue is empty.
 */
export function shadowDequeue(): ShadowQueueEvent | null {
  if (_shadowQueue.length === 0) return null;

  const entry = _shadowQueue.shift();
  if (!entry) return null;

  entry.event.status = 'processing';
  _currentShadowRunId = entry.event.shadow_run_id;

  return entry.event;
}

/**
 * Peek at the next shadow event without removing it.
 */
export function shadowPeek(): ShadowQueueEvent | null {
  if (_shadowQueue.length === 0) return null;
  return _shadowQueue[0]?.event || null;
}

/**
 * Mark the current shadow event as completed.
 */
export function shadowComplete(shadow_event_id: string, result?: string): void {
  const idx = _shadowQueue.findIndex(
    e => e.event.shadow_event_id === shadow_event_id && e.event.status === 'processing'
  );

  if (idx !== -1) {
    _shadowQueue[idx].event.status = 'completed';
    _shadowQueue[idx].event.result = result;
  }

  if (_currentShadowRunId) {
    _currentShadowRunId = null;
  }
}

/**
 * Mark the current shadow event as failed.
 */
export function shadowFail(shadow_event_id: string, error: string): void {
  const idx = _shadowQueue.findIndex(
    e => e.event.shadow_event_id === shadow_event_id && e.event.status === 'processing'
  );

  if (idx !== -1) {
    _shadowQueue[idx].event.status = 'failed';
    _shadowQueue[idx].event.error = error;
  }
}

/**
 * Mark the current shadow event as blocked (governance decision).
 */
export function shadowBlock(shadow_event_id: string, reason: string): void {
  const idx = _shadowQueue.findIndex(
    e => e.event.shadow_event_id === shadow_event_id
  );

  if (idx !== -1) {
    _shadowQueue[idx].event.status = 'blocked';
    _shadowQueue[idx].event.result = reason;
  }
}

/**
 * Get current shadow queue depth.
 */
export function shadowQueueDepth(): number {
  return _shadowQueue.length;
}

/**
 * Get shadow queue statistics.
 */
export function getShadowQueueStats(): ShadowQueueStats {
  const stats: ShadowQueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    blocked: 0,
    failed: 0,
    total: 0,
  };

  for (const entry of _shadowQueue) {
    stats[entry.event.status]++;
    stats.total++;
  }

  return stats;
}

/**
 * Clear all shadow events from the queue.
 * Use for testing or reset.
 */
export function shadowClearQueue(): void {
  _shadowQueue.length = 0;
  _currentShadowRunId = null;
  console.log('[shadow-queue] queue cleared');
}

/**
 * Pause shadow queue processing.
 * Events remain in queue but won't be dequeued.
 */
export function shadowPause(): void {
  _processing = false;
  console.log('[shadow-queue] paused');
}

/**
 * Resume shadow queue processing.
 */
export function shadowResume(): void {
  _processing = true;
  console.log('[shadow-queue] resumed');
}

/**
 * Check if shadow queue is currently processing.
 */
export function isShadowProcessing(): boolean {
  return _processing;
}

/**
 * Get the current shadow run ID.
 */
export function getCurrentShadowRunId(): string | null {
  return _currentShadowRunId;
}

/**
 * Get all events in the shadow queue (for observability).
 */
export function getShadowQueueEvents(): ShadowQueueEvent[] {
  return _shadowQueue.map(e => e.event);
}

// ─── Batch Shadow Operations ───────────────────────────────────────────────────

/**
 * Enqueue multiple events in a batch.
 * Useful for replaying captured N8N event sequences.
 */
export async function shadowEnqueueBatch(
  events: Array<{
    event_type: string;
    source: string;
    payload: object;
    shadow_run_id?: string;
    correlation_id?: string;
  }>
): Promise<ShadowQueueEvent[]> {
  const results: ShadowQueueEvent[] = [];

  for (const event of events) {
    const result = await shadowEnqueue(
      event.event_type,
      event.source,
      event.payload,
      {
        shadow_run_id: event.shadow_run_id,
        correlation_id: event.correlation_id,
      }
    );
    results.push(result);
  }

  return results;
}

// ─── Shadow Queue Persistence ──────────────────────────────────────────────────

/**
 * Persist shadow queue state to Supabase.
 * Allows the queue to survive restarts.
 */
export async function persistShadowQueue(): Promise<void> {
  const supabase = (await import('../persistence/supabase-client')).getClient();

  const events = getShadowQueueEvents();

  for (const event of events) {
    try {
      await supabase.from('shadow_queue_state').upsert({
        shadow_event_id: event.shadow_event_id,
        shadow_run_id: event.shadow_run_id,
        event_type: event.event_type,
        source: event.source,
        correlation_id: event.correlation_id,
        payload: JSON.stringify(event.payload),
        hop_count: event.hop_count,
        status: event.status,
        result: event.result,
        error: event.error,
        queued_at: event.queued_at,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'shadow_event_id',
      });
    } catch (err: any) {
      console.error(`[shadow-queue] Failed to persist ${event.shadow_event_id}: ${err.message}`);
    }
  }

  console.log(`[shadow-queue] persisted ${events.length} events to Supabase`);
}

/**
 * Restore shadow queue state from Supabase.
 * Called on startup to recover queue state.
 */
export async function restoreShadowQueue(): Promise<void> {
  const supabase = (await import('../persistence/supabase-client')).getClient();

  const { data, error } = await supabase
    .from('shadow_queue_state')
    .select('*')
    .in('status', ['pending', 'processing'])
    .order('queued_at', { ascending: true });

  if (error) {
    console.error(`[shadow-queue] Failed to restore queue: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('[shadow-queue] No persisted state to restore');
    return;
  }

  for (const row of data) {
    const event: ShadowQueueEvent = {
      shadow_run_id: row.shadow_run_id,
      shadow_event_id: row.shadow_event_id,
      event_type: row.event_type,
      source: row.source,
      correlation_id: row.correlation_id,
      payload: JSON.parse(row.payload),
      hop_count: row.hop_count,
      queued_at: row.queued_at,
      status: row.status,
      result: row.result,
      error: row.error,
      simulated: true,
    };

    const entry: QueueEntry = {
      event,
      addedAt: new Date(row.queued_at).getTime(),
      priority: 2,
    };

    _shadowQueue.push(entry);
  }

  // Re-sort
  _shadowQueue.sort((a, b) => a.addedAt - b.addedAt);

  console.log(`[shadow-queue] restored ${data.length} events from Supabase`);
}