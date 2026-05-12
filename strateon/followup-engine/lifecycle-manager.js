/**
 * lifecycle-manager.js — Qiyadon Client Lifecycle State Machine
 * 
 * Simple, explicit state transitions with audit logging.
 * No abstractions, no orchestration complexity.
 */

const VALID_STATES = [
  'ACTIVATION_PENDING',
  'ACTIVATION_ACTIVE',
  'EVALUATION_ACTIVE',
  'EVALUATION_COMPLETE',
  'SCALE_PENDING',
  'SCALE_ACTIVE',
  'CLOSED_NO_SCALE'
];

// Explicit transition map — no hidden or cascading transitions
const STATE_TRANSITIONS = {
  ACTIVATION_PENDING: ['ACTIVATION_ACTIVE'],
  ACTIVATION_ACTIVE: ['EVALUATION_ACTIVE'],
  EVALUATION_ACTIVE: ['EVALUATION_COMPLETE', 'CLOSED_NO_SCALE'],
  EVALUATION_COMPLETE: ['SCALE_PENDING', 'CLOSED_NO_SCALE'],
  SCALE_PENDING: ['SCALE_ACTIVE', 'CLOSED_NO_SCALE'],
  SCALE_ACTIVE: ['CLOSED_NO_SCALE'],  // Cancel after minimum term
  CLOSED_NO_SCALE: []  // Terminal — no transitions out
};

const LIFECYCLE_TIMESTAMP_FIELDS = {
  ACTIVATION_PENDING: [],
  ACTIVATION_ACTIVE: ['activation_started_at'],
  EVALUATION_ACTIVE: ['evaluation_started_at'],
  EVALUATION_COMPLETE: ['evaluation_completed_at'],
  SCALE_PENDING: [],
  SCALE_ACTIVE: ['scale_started_at'],
  CLOSED_NO_SCALE: ['closed_at']
};

// ── State Transition ────────────────────────────────────────────────────────

function canTransition(fromState, toState) {
  const allowed = STATE_TRANSITIONS[fromState];
  if (!allowed) return { valid: false, error: `Unknown state: ${fromState}` };
  if (!VALID_STATES.includes(toState)) return { valid: false, error: `Invalid target state: ${toState}` };
  if (!allowed.includes(toState)) return { valid: false, error: `Illegal transition: ${fromState} → ${toState}` };
  return { valid: true };
}

// ── Build Transition Event ───────────────────────────────────────────────────

function buildLifecycleEvent(clientId, eventType, fromState, toState, eventData = {}, triggeredBy = 'system') {
  return {
    client_id: clientId,
    event_type: eventType,
    from_state: fromState,
    to_state: toState,
    event_data: eventData,
    triggered_by: triggeredBy,
    created_at: new Date().toISOString()
  };
}

// ── Transition Executor ─────────────────────────────────────────────────────

async function executeTransition(supabase, clientId, fromState, toState, eventData = {}, triggeredBy = 'system') {
  const check = canTransition(fromState, toState);
  if (!check.valid) {
    console.error(`[lifecycle] BLOCKED: ${check.error}`);
    return { success: false, error: check.error };
  }

  // Build event
  const event = buildLifecycleEvent(clientId, 'STATE_TRANSITION', fromState, toState, eventData, triggeredBy);

  // Persist event
  const { error: eventError } = await supabase
    .from('client_lifecycle_events')
    .insert(event);

  if (eventError) {
    console.error(`[lifecycle] Failed to log event: ${eventError.message}`);
    return { success: false, error: eventError.message };
  }

  // Update client state + timestamp
  const timestampField = LIFECYCLE_TIMESTAMP_FIELDS[toState] || [];
  const updates = { lifecycle_state: toState };
  
  if (timestampField.length > 0) {
    timestampField.forEach(field => { updates[field] = new Date().toISOString(); });
  }

  const { error: updateError } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId);

  if (updateError) {
    console.error(`[lifecycle] Failed to update state: ${updateError.message}`);
    return { success: false, error: updateError.message };
  }

  console.log(`[lifecycle] ${clientId}: ${fromState} → ${toState} (${triggeredBy})`);
  return { success: true, from: fromState, to: toState, event };
}

// ── Log Reminder ─────────────────────────────────────────────────────────────

async function logReminder(supabase, clientId, reminderType, channel = 'email', outcome = null) {
  const event = {
    client_id: clientId,
    reminder_type: reminderType,
    channel,
    outcome,
    acknowledged: false,
    sent_at: new Date().toISOString()
  };

  const { error } = await supabase.from('reminder_logs').insert(event);
  if (error) {
    console.error(`[lifecycle] Failed to log reminder: ${error.message}`);
    return { success: false, error: error.message };
  }

  // Also log lifecycle event
  const lifecycleEvent = buildLifecycleEvent(clientId, 'REMINDER_SENT', null, null, { reminder_type: reminderType, channel, outcome }, 'system');
  await supabase.from('client_lifecycle_events').insert(lifecycleEvent).catch(() => {});

  console.log(`[lifecycle] Reminder logged: ${clientId} / ${reminderType} / ${channel}`);
  return { success: true };
}

// ── Log Artifact Engagement ───────────────────────────────────────────────────

async function logArtifactEngagement(supabase, clientId, artifactType, leadId = null) {
  const event = buildLifecycleEvent(clientId, 'ARTIFACT_DELIVERED', null, null, { artifact_type: artifactType, lead_id: leadId }, 'system');
  const { error } = await supabase.from('client_lifecycle_events').insert(event);
  if (error) console.error(`[lifecycle] Failed to log artifact: ${error.message}`);
  return { success: !error };
}

// ── Log Escalation ──────────────────────────────────────────────────────────

async function logEscalation(supabase, clientId, leadId, reason) {
  const event = buildLifecycleEvent(clientId, 'ESCALATION_TRIGGERED', null, null, { lead_id: leadId, reason }, 'engine');
  const { error } = await supabase.from('client_lifecycle_events').insert(event);
  if (error) console.error(`[lifecycle] Failed to log escalation: ${error.message}`);
  return { success: !error };
}

// ── Get Current State ─────────────────────────────────────────────────────────

async function getClientState(supabase, clientId) {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, lifecycle_state, activation_started_at, evaluation_started_at, evaluation_completed_at, scale_started_at, closed_at')
    .eq('id', clientId)
    .single();

  if (error) return { found: false, state: null };
  return { found: true, state: data };
}

// ── Get Lifecycle History ─────────────────────────────────────────────────────

async function getLifecycleHistory(supabase, clientId, limit = 50) {
  const { data, error } = await supabase
    .from('client_lifecycle_events')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { events: [], error: error.message };
  return { events: data || [], error: null };
}

// ── Get Reminder Status ───────────────────────────────────────────────────────

async function getReminderStatus(supabase, clientId) {
  const { data, error } = await supabase
    .from('reminder_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('sent_at', { ascending: false });

  return { reminders: data || [], error: error?.message };
}

// ── Validation Guards ────────────────────────────────────────────────────────

function isTerminalState(state) {
  return state === 'CLOSED_NO_SCALE';
}

function isActiveState(state) {
  return ['ACTIVATION_ACTIVE', 'EVALUATION_ACTIVE', 'SCALE_ACTIVE'].includes(state);
}

module.exports = {
  VALID_STATES,
  STATE_TRANSITIONS,
  canTransition,
  executeTransition,
  buildLifecycleEvent,
  logReminder,
  logArtifactEngagement,
  logEscalation,
  getClientState,
  getLifecycleHistory,
  getReminderStatus,
  isTerminalState,
  isActiveState,
  LIFECYCLE_TIMESTAMP_FIELDS
};