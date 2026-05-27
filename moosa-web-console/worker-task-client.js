import fs from 'node:fs';

function loadSupabaseEnv() {
  const envPath = '/root/.openclaw/.env.supabase';
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['\"]|['\"]$/g, '');
  }
}

loadSupabaseEnv();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function createMoosaTask({ actionType, inputJson, goal, source }) {
  const now = new Date().toISOString();

  const { data: taskRow, error: taskError } = await supabase
    .from('tasks')
    .insert({
      goal: goal || `MOOSA Web Console task: ${actionType}`,
      status: 'created',
      action_type: actionType,
      input_json: {
        ...(inputJson || {}),
        source: source || 'moosa-web-console',
        created_by: 'moosa-web-console'
      },
      output_json: null,
      retry_count: 0,
      max_retries: 3,
      error_message: null,
      created_at: now,
      updated_at: now
    })
    .select()
    .single();

  if (taskError) throw new Error(`task_insert_failed: ${taskError.message}`);

  const { error: dispatchError } = await supabase
    .from('dispatches')
    .insert({
      id: taskRow.id,
      task_id: taskRow.id,
      dispatch_ref: `dispatch/web_console/${taskRow.id}`,
      idempotency_key: `dispatch/web_console/${taskRow.id}/moosa-web-console`,
      status: 'created',
      lifecycle_state: 'execution_pending',
      creation_class: 'web_console',
      executor_claimed: false,
      approval_required: false,
      approval_state: 'na',
      terminal: false,
      created_at: now
    });

  if (dispatchError) {
    await supabase.from('tasks').delete().eq('id', taskRow.id);
    throw new Error(`dispatch_insert_failed_compensated: ${dispatchError.message}`);
  }

  return {
    taskId: taskRow.id,
    dispatchId: taskRow.id,
    actionType,
    status: 'created'
  };
}

export async function getTaskResult(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id,status,action_type,input_json,output_json,error_message,created_at,updated_at')
    .eq('id', taskId)
    .single();

  if (error) throw new Error(`task_fetch_failed: ${error.message}`);
  return data;
}
