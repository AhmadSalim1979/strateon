/**
 * AI Governance — Phase 2: Audit Trail
 * File: orchestration/src/governance/audit-trail.js
 *
 * Provides:
 *   - emitAuditEvent(event)   → persists audit event with SHA-256 chain hash to Supabase + JSONL
 *   - verifyAuditChain(clientId, fromTime?, toTime?) → validates chain integrity
 *
 * The SHA-256 chain:
 *   Each entry's hash = SHA-256(prev_hash + timestamp + actor + action_type + details + context_json)
 *   prev_hash is the hash of the previous audit event for this client (null for first entry)
 *   This creates a tamper-evident linked list — any modification breaks all subsequent hashes.
 */

import { createHash } from 'crypto';
import { existsSync, appendFileSync, mkdirSync } from 'fs';
import { getClient } from '../persistence/supabase-client.js';

// ─── SHA-256 Chain Helper ────────────────────────────────────────────────────

/**
 * Compute SHA-256 hash for an audit event entry.
 * Payload = prev_hash + timestamp + actor + action_type + details + JSON(context)
 *
 * @param {Object} entry
 * @returns {string} 64-char hex SHA-256 hash
 */
export function computeAuditHash(entry) {
  const payload = [
    entry.prev_hash     || '',
    entry.timestamp      || '',
    entry.actor          || '',
    entry.action_type    || '',
    entry.details        || '',
    JSON.stringify(entry.context || {})
  ].join('|');

  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

// ─── JSONL helpers ───────────────────────────────────────────────────────────

/**
 * Get the audit log path for a client.
 * Structure: clients/{client_id}/logs/audit/{YYYY-MM}.jsonl
 *
 * @param {string} clientId
 * @returns {string} absolute path
 */
function getAuditLogPath(clientId) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `/home/node/.openclaw/workspace/clients/${clientId}/logs/audit/${yearMonth}.jsonl`;
}

/**
 * Append an audit event to the per-client JSONL file.
 * Creates directories and file if they don't exist.
 *
 * @param {string} clientId
 * @param {Object} auditEntry
 */
function appendToJsonLog(clientId, auditEntry) {
  const path = getAuditLogPath(clientId);
  const dir = path.substring(0, path.lastIndexOf('/'));

  try {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    appendFileSync(path, JSON.stringify(auditEntry) + '\n', 'utf8');
  } catch (err) {
    console.error(`[audit-trail] failed to append to JSONL at ${path}: ${err.message}`);
  }
}

// ─── Core: emitAuditEvent ────────────────────────────────────────────────────

/**
 * Emit an audit event — persists to Supabase + JSONL, with SHA-256 chain hash.
 *
 * @param {Object} params
 * @param {string} params.client_id   - required
 * @param {string} params.run_id      - required
 * @param {string} params.actor       - required
 * @param {string} params.actor_type  - required: 'ai-agent' | 'human' | 'automated-system'
 * @param {string} params.action_type - required: e.g. 'lead-contacted', 'email-sent'
 * @param {string} [params.lead_id]
 * @param {string} [params.channel]   - 'whatsapp' | 'email' | 'sms' | 'system'
 * @param {string} params.details     - required: human-readable description
 * @param {Object} [params.context]   - AI decision context (arbitrary JSON)
 * @param {string} params.result      - required: 'sent' | 'failed' | 'bounced' | 'pending' | 'skipped'
 * @returns {Promise<{success:boolean, event?:Object, error?:string}>}
 */
export async function emitAuditEvent({
  client_id,
  run_id,
  actor,
  actor_type,
  action_type,
  lead_id = null,
  channel = null,
  details,
  context = null,
  result
}) {
  if (!client_id || !run_id || !actor || !actor_type || !action_type || !details || !result) {
    return { success: false, error: 'Missing required fields for audit event' };
  }

  const timestamp = new Date().toISOString();

  // 1. Fetch previous hash for this client (last audit event by timestamp)
  const prev_hash = await _getLastHash(client_id);

  // 2. Build the entry object
  const entry = {
    event_id:       `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    client_id,
    run_id,
    timestamp,
    actor,
    actor_type,
    action_type,
    lead_id,
    channel,
    details,
    context,
    result,
    prev_hash: prev_hash || null,
  };

  // 3. Compute this entry's hash (chain link)
  entry.hash = computeAuditHash(entry);

  // 4. Persist to Supabase
  const supabase = getClient();
  const { data, error } = await supabase
    .from('audit_trail_events')
    .insert({
      client_id:   entry.client_id,
      run_id:      entry.run_id,
      event_id:    entry.event_id,
      timestamp:   entry.timestamp,
      actor:       entry.actor,
      actor_type:  entry.actor_type,
      action_type: entry.action_type,
      lead_id:     entry.lead_id,
      channel:     entry.channel,
      details:     entry.details,
      context:     entry.context ? JSON.stringify(entry.context) : null,
      result:      entry.result,
      prev_hash:   entry.prev_hash,
      hash:        entry.hash,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`[audit-trail] emitAuditEvent failed to insert: ${error.message}`, entry);
    return { success: false, error: error.message };
  }

  // 5. Append to JSONL for tamper-evident backup
  appendToJsonLog(client_id, entry);

  return { success: true, event: { id: data.id, event_id: entry.event_id, hash: entry.hash } };
}

// ─── Chain Verification ──────────────────────────────────────────────────────

/**
 * Fetch the last hash for a client (most recent audit event by timestamp).
 * @param {string} clientId
 * @returns {Promise<string|null>}
 */
async function _getLastHash(clientId) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('audit_trail_events')
    .select('hash')
    .eq('client_id', clientId)
    .order('timestamp', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }
  return data[0].hash;
}

/**
 * Verify the audit chain integrity for a client within a time window.
 * Iterates through all events in chronological order, re-computing each hash
 * and checking that it matches the stored hash AND that stored prev_hash matches
 * the previous entry's hash.
 *
 * @param {string} clientId
 * @param {string} [fromTime] - ISO 8601 start time (optional)
 * @param {string} [toTime]   - ISO 8601 end time (optional)
 * @returns {Promise<{intact:boolean, brokenAt?:string, errors:string[]}>}
 */
export async function verifyAuditChain(clientId, fromTime = null, toTime = null) {
  const supabase = getClient();

  let query = supabase
    .from('audit_trail_events')
    .select('*')
    .eq('client_id', clientId)
    .order('timestamp', { ascending: true });

  if (fromTime) query = query.gte('timestamp', fromTime);
  if (toTime)   query = query.lte('timestamp', toTime);

  const { data, error } = await query;
  if (error) return { intact: false, errors: [error.message] };
  if (!data || data.length === 0) return { intact: true, errors: [] };

  const errors = [];

  for (let i = 0; i < data.length; i++) {
    const entry = data[i];

    // Re-compute the hash
    const recomputed = computeAuditHash(entry);
    if (recomputed !== entry.hash) {
      errors.push(`Entry ${entry.event_id} at index ${i}: hash mismatch — computed ${recomputed} but stored ${entry.hash}`);
    }

    // Check chain link: entry.prev_hash must equal previous entry's hash
    if (i > 0) {
      const prev = data[i - 1];
      if (entry.prev_hash !== prev.hash) {
        errors.push(
          `Entry ${entry.event_id} at index ${i}: broken chain — prev_hash is ${entry.prev_hash} but previous hash is ${prev.hash}`
        );
      }
    }
  }

  return {
    intact: errors.length === 0,
    errors
  };
}