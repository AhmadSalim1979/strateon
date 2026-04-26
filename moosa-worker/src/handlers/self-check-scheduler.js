/**
 * src/handlers/self-check-scheduler.js
 *
 * Phase SCS-3C — Self-Check Scheduling Logic
 *
 * Callable handler for self-check scheduling.
 * Contains the full logic previously in schedule-self-check.js:
 * - Deduplication: checks for active run_self_check_and_decide tasks before creating
 * - Chain reuse: reuses existing active chain_id or generates a new UUID
 * - Task creation: inserts into tasks table
 * - Dispatch creation: inserts into dispatches table
 *
 * Exported for use by:
 * - schedule-self-check.js (thin CLI wrapper — unchanged behavior)
 * - src/core/loop.js (trigger-based invocation via file signal)
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFileSync } from 'node:fs';

// ─── Credentials ───────────────────────────────────────────────────────────────

function getCredentials() {
  try {
    const envContent = readFileSync('/root/.openclaw/.env.supabase', 'utf8');
    for (const line of envContent.split('\n')) {
      const [k, ...v] = line.split('=');
      if (k === 'SUPABASE_URL') return v.join('=').trim();
    }
  } catch {}
  throw new Error('Could not read SUPABASE_URL from /root/.openclaw/.env.supabase');
}

function getServiceKey() {
  try {
    const envContent = readFileSync('/root/.openclaw/.env.supabase', 'utf8');
    for (const line of envContent.split('\n')) {
      const [k, ...v] = line.split('=');
      if (k === 'SUPABASE_SERVICE_KEY') return v.join('=').trim();
    }
  } catch {}
  throw new Error('Could not read SUPABASE_SERVICE_KEY from /root/.openclaw/.env.supabase');
}

// ─── Core Logic ────────────────────────────────────────────────────────────────

/**
 * Get the active chain_id if one exists.
 * Checks for any active chain-bearing task (run_self_check_and_decide or
 * ops_health_check triggered by it) with stable ordering.
 * Returns null if no active chain is found.
 *
 * @param {object} supabase - Supabase client instance
 * @returns {Promise<string|null>}
 */
async function getActiveChainId(supabase) {
  // Check run_self_check_and_decide tasks first (deterministic ordering)
  const { data: decisionTasks } = await supabase
    .from('tasks')
    .select('id, input_json')
    .eq('action_type', 'run_self_check_and_decide')
    .in('status', ['created', 'executing', 'retrying'])
    .not('input_json->>chain_id', 'is', null)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (decisionTasks && decisionTasks.length > 0) {
    const chainId = decisionTasks[0]?.input_json?.chain_id;
    if (chainId) return chainId;
  }

  // Check active ops_health_check follow-ups with deterministic ordering
  const { data: followUpTasks } = await supabase
    .from('tasks')
    .select('id, input_json')
    .eq('action_type', 'ops_health_check')
    .in('status', ['created', 'executing', 'retrying'])
    .eq('input_json->>triggered_by', 'run_self_check_and_decide')
    .not('input_json->>chain_id', 'is', null)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (followUpTasks && followUpTasks.length > 0) {
    const chainId = followUpTasks[0]?.input_json?.chain_id;
    if (chainId) return chainId;
  }

  return null;
}

/**
 * runSelfCheckScheduling(supabaseClient?)
 *
 * Main exported function. Checks for active self-check task, creates one if
 * none exists, and creates the corresponding dispatch record.
 *
 * @param {object|null} supabaseClient - Optional Supabase client instance.
 *                                        If omitted, creates one from .env.supabase.
 * @returns {Promise<{
 *   didRun: boolean,
 *   reason: string,
 *   chainId?: string,
 *   taskId?: string,
 *   dispatchId?: string,
 *   error?: string
 * }>}
 *
 * Reasons:
 *   'already_running'  - active task exists, no new task created
 *   'created'         - new task and dispatch created successfully
 *   'dispatch_failed' - task created but dispatch insert failed (worker will skip)
 *   'error'           - unexpected error
 */
export async function runSelfCheckScheduling(supabaseClient = null) {
  const supabase = supabaseClient || createClient(getCredentials(), getServiceKey());
  const now = new Date().toISOString();

  // ── Deduplication: skip if a task is already active ────────────────────────
  const { data: existing } = await supabase
    .from('tasks')
    .select('id')
    .eq('action_type', 'run_self_check_and_decide')
    .in('status', ['created', 'executing', 'retrying'])
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`[schedule-self-check] Active decision task already exists (${existing[0].id}). Skipping.`);
    return { didRun: false, reason: 'already_running', taskId: existing[0].id };
  }

  // ── Determine chain_id: reuse existing or start new ───────────────────────
  const existingChainId = await getActiveChainId(supabase);
  const chainId = existingChainId || randomUUID();
  console.log(
    `[schedule-self-check] ${existingChainId ? 'Continuing' : 'Starting new'} incident chain: ${chainId}`
  );

  // ── Insert task ─────────────────────────────────────────────────────────────
  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .insert({
      goal: 'Scheduled self-check and decision cycle for Moosa',
      status: 'created',
      action_type: 'run_self_check_and_decide',
      input_json: {
        chain_id: chainId,
        incident_origin: 'scheduled',
        created_by: 'schedule-self-check.js',
      },
      output_json: null,
      retry_count: 0,
      max_retries: 3,
      error_message: null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (taskError) {
    console.error('[schedule-self-check] Failed to insert task:', taskError.message);
    return { didRun: false, reason: 'error', error: taskError.message };
  }

  console.log(`[schedule-self-check] Task created: ${taskData.id} [chain=${chainId}]`);

  // ── Insert dispatch ─────────────────────────────────────────────────────────
  const dispatchId = randomUUID();
  const dispatchRef = `dispatch/self_check/${dispatchId}`;
  const idempotencyKey = `dispatch/self_check/${dispatchId}/scheduler`;

  const { error: dispatchError } = await supabase
    .from('dispatches')
    .insert({
      id: dispatchId,
      dispatch_ref: dispatchRef,
      idempotency_key: idempotencyKey,
      status: 'created',
      task_id: taskData.id,
      lifecycle_state: 'execution_pending',
      executor_claimed: false,
      terminal: false,
      creation_class: 'self_check_scheduler',
    });

  if (dispatchError) {
    console.error(`[schedule-self-check] Failed to create dispatch: ${dispatchError.message}`);
    // Task was created but dispatch failed — worker will skip, self-heals on next cycle
    return {
      didRun: true,
      reason: 'dispatch_failed',
      chainId,
      taskId: taskData.id,
      error: dispatchError.message,
    };
  }

  return {
    didRun: true,
    reason: 'created',
    chainId,
    taskId: taskData.id,
    dispatchId,
  };
}

export default { runSelfCheckScheduling };
