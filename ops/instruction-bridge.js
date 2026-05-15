/**
 * Instruction Bridge
 * File: /ops/instruction-bridge.js
 * 
 * Purpose: Durable instruction intake, acknowledgement, and lifecycle tracking.
 * Every instruction received in the main session creates a row in the `instructions` table.
 * 
 * Owner: Moosa (CEO)
 * Validation: Check Supabase instructions table after test injection
 * Last Modified: 2026-05-15
 * 
 * Key Rules:
 * - NEVER silently drop an instruction
 * - If queue write fails → status = 'received_only' or 'blocked', NOT 'queued'
 * - original_message is immutable — never update after insert
 * - Always emit explicit acknowledgement within 2 minutes
 * - state_transitions records every status change for auditability
 */

const { createClient } = require('/home/node/.openclaw/workspace/orchestration/node_modules/@supabase/supabase-js');

// ─── Configuration ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Lazy singleton client — initialized on first use
let _client = null;

function getClient() {
  if (!_client) {
    if (!SUPABASE_SERVICE_KEY) {
      throw new Error('[instruction-bridge] SUPABASE_SERVICE_KEY not set. Cannot connect to Supabase.');
    }
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log('[instruction-bridge] Connected to Supabase');
  }
  return _client;
}

// ─── Instruction Classification ───────────────────────────────────────────────
function classifyInstruction(message) {
  if (!message || typeof message !== 'string') return 'inform';
  const text = message.toLowerCase().trim();
  
  // Execute patterns — clear action requests
  if (text.match(/^(execute|do|fix|build|create|implement|wire|restart|update|replace|check|verify|run|test)/)) {
    return 'execute';
  }
  // Review patterns — assessment requests
  if (text.match(/^(review|analyze|audit|assess|interpret|evaluate)/)) {
    return 'review';
  }
  // Approve patterns — confirmation requests
  if (text.match(/^(approve|confirm|yes|proceed|go|approved|ok|agree)/)) {
    return 'approve';
  }
  // Default — informational or unclear
  return 'inform';
}

function normalizeInstruction(message) {
  if (!message) return '';
  // Strip leading/trailing whitespace, collapse multiple spaces
  return message.trim().replace(/\s+/g, ' ');
}

function classifyPriority(message) {
  if (!message || typeof message !== 'string') return 'medium';
  const text = message.toLowerCase();
  if (text.includes('urgent') || text.includes('critical') || text.includes('asap') || text.includes('immediately')) {
    return 'critical';
  }
  if (text.includes('high priority') || text.includes('important') || text.includes('soon')) {
    return 'high';
  }
  if (text.includes('low priority') || text.includes('when possible') || text.includes('eventually')) {
    return 'low';
  }
  return 'medium';
}

// ─── State Transition Recorder ─────────────────────────────────────────────────
/**
 * Append a state transition to the state_transitions JSONB array.
 * @param {string} instructionId 
 * @param {string} fromState - null for initial insert
 * @param {string} toState 
 * @param {Object} metadata - optional extra info
 */
async function recordTransition(instructionId, fromState, toState, metadata = {}) {
  const supabase = getClient();
  const transition = {
    from: fromState || 'initial',
    to: toState,
    at: new Date().toISOString(),
    by: 'moosa',
    note: metadata.note || null,
    ...metadata
  };
  
  try {
    // Fetch current transitions, then update with appended array
    const { data, error: fetchError } = await supabase
      .from('instructions')
      .select('state_transitions')
      .eq('id', instructionId)
      .single();
    
    if (fetchError) {
      console.error('[instruction-bridge] Failed to fetch transitions for record:', fetchError.message);
      return false;
    }
    
    const currentTransitions = data?.state_transitions || [];
    const updatedTransitions = [...currentTransitions, transition];
    
    const { error: updateError } = await supabase
      .from('instructions')
      .update({
        state_transitions: updatedTransitions,
        last_update_at: new Date().toISOString()
      })
      .eq('id', instructionId);
    
    if (updateError) {
      console.error('[instruction-bridge] Failed to record transition:', updateError.message);
      return false;
    }
    
    console.log(`[instruction-bridge] Transition recorded: ${fromState || 'initial'} → ${toState} for ${instructionId}`);
    return true;
  } catch (err) {
    console.error('[instruction-bridge] recordTransition exception:', err.message);
    return false;
  }
}

// ─── Core Bridge Function ──────────────────────────────────────────────────────
/**
 * Main entry point — bridge an instruction from any channel.
 * 
 * @param {string} message - Raw original message
 * @param {string} channel - 'whatsapp' | 'cron' | 'webhook' | 'internal'
 * @param {string} sender - Sender identifier (phone number, system name, etc.)
 * @returns {Promise<{success: boolean, instruction_id: string|null, task_id: string|null, status: string, error: string|null}>}
 */
async function bridgeInstruction(message, channel, sender) {
  const startTime = Date.now();
  const instructionId = null;
  const taskId = null;
  let finalStatus = 'received';
  let taskWriteSucceeded = false;
  
  console.log(`[instruction-bridge] Bridging instruction from ${channel} | sender: ${sender} | message: ${(message || '').slice(0, 80)}...`);
  
  // ─── Validate inputs ─────────────────────────────────────────────────────────
  if (!message || typeof message !== 'string') {
    console.error('[instruction-bridge] ERROR: message is required and must be a string');
    return {
      success: false,
      instruction_id: null,
      task_id: null,
      status: 'blocked',
      error: 'message is required and must be a string'
    };
  }
  
  if (!channel || typeof channel !== 'string') {
    console.error('[instruction-bridge] ERROR: channel is required');
    return {
      success: false,
      instruction_id: null,
      task_id: null,
      status: 'blocked',
      error: 'channel is required'
    };
  }
  
  // ─── Create instruction record ───────────────────────────────────────────────
  let instructionRecord = null;
  
  try {
    const supabase = getClient();
    
    const insertResult = await supabase
      .from('instructions')
      .insert({
        source_channel: channel,
        received_at: new Date().toISOString(),
        original_message: message,  // immutable — never updated
        normalized_instruction: normalizeInstruction(message),
        instruction_type: classifyInstruction(message),
        priority: classifyPriority(message),
        status: 'received',
        execution_mode: null,  // set after classification
        acknowledgement_state: 'pending',
        last_update_at: new Date().toISOString(),
        retry_count: 0,
        state_transitions: [],  // populated by recordTransition below
        metadata: {
          sender,
          bridged_at: new Date().toISOString(),
          bridge_version: '1.0.0'
        }
      })
      .select()
      .single();
    
    if (insertResult.error) {
      throw new Error(`Failed to insert instruction: ${insertResult.error.message}`);
    }
    
    instructionRecord = insertResult.data;
    console.log(`[instruction-bridge] Instruction created: ${instructionRecord.id}`);
    
    // Record initial transition: null → received
    await recordTransition(instructionRecord.id, null, 'received');
    
  } catch (err) {
    console.error(`[instruction-bridge] CRITICAL: Failed to write instruction record: ${err.message}`);
    // EMIT EXPLICIT FAILURE — never silently drop
    return {
      success: false,
      instruction_id: null,
      task_id: null,
      status: 'blocked',
      error: `instruction_record_write_failed: ${err.message}`
    };
  }
  
  // ─── Attempt to create task (if actionable) ──────────────────────────────────
  let taskIdValue = null;
  
  const instructionType = classifyInstruction(message);
  
  if (instructionType === 'execute' || instructionType === 'review') {
    // Actionable instruction — try to create a task
    try {
      const supabase = getClient();
      
      const taskInsertResult = await supabase
        .from('tasks')
        .insert({
          goal: normalizeInstruction(message).slice(0, 500),  // truncate for safety
          status: 'pending',
          action_type: 'instruction_bridge',
          input_json: {
            instruction_id: instructionRecord.id,
            original_message: message,
            source_channel: channel,
            sender
          },
          max_retries: 3,
          retry_count: 0
        })
        .select()
        .single();
      
      if (taskInsertResult.error) {
        throw new Error(`Task insert failed: ${taskInsertResult.error.message}`);
      }
      
      taskIdValue = taskInsertResult.data.id;
      taskWriteSucceeded = true;
      console.log(`[instruction-bridge] Task created: ${taskIdValue} linked to instruction ${instructionRecord.id}`);
      
      // Update instruction with task linkage
      await supabase
        .from('instructions')
        .update({
          execution_mode: 'task-queue',
          assigned_worker: 'moosa-worker',
          status: 'queued',
          last_update_at: new Date().toISOString()
        })
        .eq('id', instructionRecord.id);
      
      finalStatus = 'queued';
      await recordTransition(instructionRecord.id, 'received', 'queued', { task_id: taskIdValue });
      
    } catch (err) {
      console.warn(`[instruction-bridge] Task write failed (instruction still valid): ${err.message}`);
      taskWriteSucceeded = false;
      // If task write fails → status must be received_only, NOT falsely queued
      await supabase
        .from('instructions')
        .update({
          status: 'received_only',
          execution_mode: 'direct',  // will be handled in-session
          failure_reason: `task_queue_write_failed: ${err.message}`,
          last_update_at: new Date().toISOString()
        })
        .eq('id', instructionRecord.id);
      
      finalStatus = 'received_only';
      await recordTransition(instructionRecord.id, 'received', 'received_only', { 
        note: 'task queue write failed — handled in-session directly'
      });
    }
  } else {
    // Inform/approve — no task needed, acknowledge only
    await supabase
      .from('instructions')
      .update({
        status: 'acknowledged',
        execution_mode: 'inform',
        last_update_at: new Date().toISOString()
      })
      .eq('id', instructionRecord.id);
    
    finalStatus = 'acknowledged';
    await recordTransition(instructionRecord.id, 'received', 'acknowledged');
  }
  
  // ─── Emit acknowledgement ────────────────────────────────────────────────────
  // Note: Acknowledgement emission to sender (WhatsApp) happens in the main session
  // This function records acknowledgement_state in the DB
  // The calling code (main session) is responsible for sending WhatsApp reply
  
  const elapsedMs = Date.now() - startTime;
  console.log(`[instruction-bridge] Bridge complete in ${elapsedMs}ms | instruction: ${instructionRecord.id} | status: ${finalStatus} | task: ${taskIdValue || 'none'}`);
  
  return {
    success: true,
    instruction_id: instructionRecord.id,
    task_id: taskIdValue,
    status: finalStatus,
    error: null
  };
}

// ─── Status Update Helper ──────────────────────────────────────────────────────
/**
 * Update instruction status — use recordTransition to maintain audit trail.
 */
async function updateStatus(instructionId, newStatus, note = '') {
  try {
    const supabase = getClient();
    
    // Fetch current status for transition recording
    const { data } = await supabase
      .from('instructions')
      .select('status')
      .eq('id', instructionId)
      .single();
    
    const oldStatus = data?.status || 'unknown';
    
    // Update status
    const updateData = {
      status: newStatus,
      last_update_at: new Date().toISOString()
    };
    
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('instructions')
      .update(updateData)
      .eq('id', instructionId);
    
    if (error) throw error;
    
    // Record transition
    await recordTransition(instructionId, oldStatus, newStatus, { note });
    
    return { success: true };
  } catch (err) {
    console.error(`[instruction-bridge] updateStatus failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─── Query Helpers ─────────────────────────────────────────────────────────────
/**
 * Get instruction by ID with all fields.
 */
async function getInstruction(instructionId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('instructions')
    .select('*')
    .eq('id', instructionId)
    .single();
  
  if (error) return { instruction: null, error: error.message };
  return { instruction: data, error: null };
}

/**
 * Get recent instructions for a channel.
 */
async function getRecentInstructions(channel, limit = 10) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('instructions')
    .select('*')
    .eq('source_channel', channel)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) return { instructions: [], error: error.message };
  return { instructions: data || [], error: null };
}

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  bridgeInstruction,
  recordTransition,
  updateStatus,
  getInstruction,
  getRecentInstructions,
  classifyInstruction,
  normalizeInstruction,
  
  // Constants for status values
  STATUS: {
    RECEIVED: 'received',
    RECEIVED_ONLY: 'received_only',
    QUEUED: 'queued',
    ACKNOWLEDGED: 'acknowledged',
    EXECUTED: 'executed',
    BLOCKED: 'blocked',
    NEEDS_CLARIFICATION: 'needs-clarification',
    STALLED: 'stalled',
    COMPLETED: 'completed'
  }
};