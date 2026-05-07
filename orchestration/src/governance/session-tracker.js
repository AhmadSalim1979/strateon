/**
 * AI Governance — Phase 3: Session Tracker
 * File: orchestration/src/governance/session-tracker.js
 *
 * Provides:
 *   - startSession(params)       → creates a new session log entry
 *   - logSessionEvent(sessionId, event) → appends an event to an active session
 *   - endSession(sessionId, summary) → marks session complete
 *   - getActiveSession(clientId) → returns current open session for a client
 *   - getSessionHistory(clientId, limit) → returns recent sessions
 *
 * Session Logs capture:
 *   - AI reasoning and decision context per action cycle
 *   - Token usage (input/output tokens)
 *   - Model used
 *   - Duration of reasoning
 *   - What was decided and why
 *   - What action was taken as a result
 */

import { createHash } from 'crypto';
import { getClient } from '../persistence/supabase-client.js';

// In-memory session cache (resets on worker restart — sessions are persisted to DB)
const _activeSessions = new Map(); // sessionId → session object

// ─── Session ID generation ───────────────────────────────────────────────────

function generateSessionId(clientId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `sess-${clientId}-${timestamp}-${random}`;
}

// ─── Start a new session ─────────────────────────────────────────────────────

/**
 * Start a new AI governance session for a client.
 *
 * @param {Object} params
 * @param {string} params.clientId
 * @param {string} params.runId
 * @param {string} [params.model]       — e.g. "minimax/MiniMax-M2.7"
 * @param {string} [params.prompt]      — the prompt that initiated this session
 * @param {Object} [params.context]     — lead_id, cadence_day, etc.
 * @returns {Promise<Object>} session record
 */
export async function startSession({ clientId, runId, model, prompt, context = {} }) {
  const supabase = getClient();
  const sessionId = generateSessionId(clientId);

  const session = {
    session_id: sessionId,
    client_id: clientId,
    run_id: runId,
    model: model || null,
    prompt: prompt || null,
    context: context || {},
    status: 'active',
    started_at: new Date().toISOString(),
    ended_at: null,
    total_duration_ms: null,
    events: [],
    input_tokens: 0,
    output_tokens: 0,
    reasoning_text: null,
    decisions_summary: null,
    created_at: new Date().toISOString(),
  };

  // Persist to Supabase
  const { data, error } = await supabase
    .from('session_logs')
    .insert(session)
    .select('*')
    .single();

  if (error) {
    console.error('[session-tracker] Failed to start session:', error.message);
    throw error;
  }

  _activeSessions.set(sessionId, { ...data, events: [] });
  return data;
}

// ─── Log an event within a session ──────────────────────────────────────────

/**
 * Log an event within an active session.
 *
 * @param {string} sessionId
 * @param {Object} event
 * @param {string} event.step         — e.g. "reasoning", "action", "result"
 * @param {string} event.thought      — what the AI was thinking
 * @param {string} [event.decision]   — what was decided
 * @param {string} [event.action]     — what was done
 * @param {number} [event.duration_ms]
 * @param {Object} [event.metadata]
 */
export async function logSessionEvent(sessionId, event) {
  const supabase = getClient();

  // Update in-memory cache
  const cached = _activeSessions.get(sessionId);
  if (cached) {
    cached.events.push(event);
  }

  // Persist event to Supabase (append to events JSONB)
  const { error } = await supabase
    .from('session_logs')
    .update({ events: cached?.events || [] })
    .eq('session_id', sessionId);

  if (error) {
    console.error('[session-tracker] Failed to log session event:', error.message);
    // Non-fatal — don't throw
  }
}

// ─── End a session ──────────────────────────────────────────────────────────

/**
 * End a session and write the final summary.
 *
 * @param {string} sessionId
 * @param {Object} summary
 * @param {string} [summary.reasoning_text]   — full reasoning trace
 * @param {string} [summary.decisions_summary] — condensed decisions made
 * @param {number} [summary.input_tokens]
 * @param {number} [summary.output_tokens]
 * @param {number} [summary.total_duration_ms]
 */
export async function endSession(sessionId, summary = {}) {
  const supabase = getClient();

  const updates = {
    status: 'completed',
    ended_at: new Date().toISOString(),
    reasoning_text: summary.reasoning_text || null,
    decisions_summary: summary.decisions_summary || null,
    input_tokens: summary.input_tokens || 0,
    output_tokens: summary.output_tokens || 0,
    total_duration_ms: summary.total_duration_ms || null,
  };

  const { data, error } = await supabase
    .from('session_logs')
    .update(updates)
    .eq('session_id', sessionId)
    .select('*')
    .single();

  if (error) {
    console.error('[session-tracker] Failed to end session:', error.message);
    throw error;
  }

  _activeSessions.delete(sessionId);
  return data;
}

// ─── Get active session for client ─────────────────────────────────────────

/**
 * Returns the currently active (open) session for a client, if any.
 * @param {string} clientId
 * @returns {Promise<Object|null>}
 */
export async function getActiveSession(clientId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('session_logs')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('[session-tracker] getActiveSession error:', error.message);
  }
  return data || null;
}

// ─── Get session history ─────────────────────────────────────────────────────

/**
 * Returns recent sessions for a client.
 * @param {string} clientId
 * @param {number} [limit=10]
 * @returns {Promise<Array>}
 */
export async function getSessionHistory(clientId, limit = 10) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('session_logs')
    .select('session_id, run_id, model, status, started_at, ended_at, total_duration_ms, decisions_summary, input_tokens, output_tokens')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[session-tracker] getSessionHistory error:', error.message);
    return [];
  }
  return data || [];
}

// ─── Wrapper for AI agent calls (auto-session) ───────────────────────────────

/**
 * Wrap an AI agent call with automatic session tracking.
 * Starts a session before the call, logs events during, ends after.
 *
 * @param {Object} params
 * @param {string} params.clientId
 * @param {string} params.runId
 * @param {string} [params.model]
 * @param {string} [params.prompt]
 * @param {Object} [params.context]
 * @param {Function} params.agentFn  — async function to wrap
 * @returns {Promise<Object>} result + session record
 */
export async function withSession({ clientId, runId, model, prompt, context, agentFn }) {
  const session = await startSession({ clientId, runId, model, prompt, context });
  const startTime = Date.now();

  try {
    await logSessionEvent(session.session_id, {
      step: 'start',
      thought: prompt || 'Session started',
      metadata: { context },
    });

    const result = await agentFn();

    await logSessionEvent(session.session_id, {
      step: 'complete',
      thought: 'Agent function completed successfully',
      action: 'result_received',
      metadata: { resultSummary: typeof result === 'object' ? JSON.stringify(result).slice(0, 200) : String(result) },
    });

    await endSession(session.session_id, {
      total_duration_ms: Date.now() - startTime,
    });

    return { result, session };
  } catch (err) {
    await logSessionEvent(session.session_id, {
      step: 'error',
      thought: 'Agent function threw an error',
      action: 'error',
      metadata: { error: err.message },
    });

    await endSession(session.session_id, {
      reasoning_text: `Session failed with error: ${err.message}`,
      total_duration_ms: Date.now() - startTime,
    });

    throw err;
  }
}