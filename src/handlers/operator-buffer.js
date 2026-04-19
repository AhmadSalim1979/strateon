/**
 * Operator Independence Buffer — R14
 * 
 * Reduces dependency on immediate operator availability while preserving
 * all approval boundaries and safety constraints.
 * 
 * This layer does NOT:
 * - Execute actions without approval
 * - Bypass proposal tokens
 * - Introduce autonomous execution
 * 
 * Instead, it provides:
 * - Safe deferral of pending approvals
 * - Controlled retry intervals
 * - Escalation persistence for critical items
 * - Operator availability awareness
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const BUFFER_STATUS = {
  PENDING: 'pending',           // Awaiting approval
  DEFERRED: 'deferred',         // Temporarily delayed
  ESCALATING: 'escalating',     // Re-surfaced with urgency
  EXPIRED: 'expired',           // Abandoned after max wait
  APPROVED: 'approved',         // Got approval (should be removed)
  CANCELLED: 'cancelled',       // Operator cancelled
};

const URGENCY_LEVEL = {
  LOW: 'low',                   // Can wait
  NORMAL: 'normal',             // Standard priority
  HIGH: 'high',                // Important, escalate after delay
  CRITICAL: 'critical',        // MUST persist, never spam
};

const DECAY_CONFIG = {
  INITIAL_STRENGTH: 1.0,
  DECAY_RATE_PER_HOUR: 0.15,   // 15% decay per hour
  MIN_STRENGTH_THRESHOLD: 0.2, // Below this, suggest expiry
  MAX_DECAY_HOURS: 24,         // Auto-expire after 24 hours unless critical
};

const RETRY_CONFIG = {
  INITIAL_INTERVAL_MINUTES: 30,
  MAX_INTERVAL_MINUTES: 240,   // 4 hours max between attempts
  BACKOFF_MULTIPLIER: 1.5,
  MAX_RETRIES: 10,
  SPAM_PREVENTION_MINUTES: 15, // Min time between same-item re-surfaces
};

const OPERATOR_CONTEXT_PATH = path.join(__dirname, '../../../workspace/USER.md');

// ─── State ───────────────────────────────────────────────────────────────────

let _state = null;
const STATE_PATH = path.join(__dirname, '../../state/operator-buffer.json');

function getState() {
  if (_state) return _state;
  
  if (fs.existsSync(STATE_PATH)) {
    try {
      _state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {
      _state = _freshState();
    }
  } else {
    _state = _freshState();
  }
  return _state;
}

function _freshState() {
  return {
    // Pending items awaiting operator approval
    pending_items: [],
    
    // Audit log
    audit_log: [],
    
    // Metrics
    total_buffered: 0,
    total_approved: 0,
    total_expired: 0,
    total_cancelled: 0,
    
    // Operator availability (cached)
    operator_context: null,
    last_context_update: null,
  };
}

function saveState() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(getState(), null, 2), 'utf8');
}

function resetCaches() {
  _state = null;
}

// ─── Operator Availability ───────────────────────────────────────────────────

/**
 * getOperatorContext()
 * 
 * Reads operator availability from USER.md and other context.
 */
function getOperatorContext() {
  const state = getState();
  
  // Cache for 5 minutes
  if (state.operator_context && state.last_context_update) {
    const age = Date.now() - new Date(state.last_context_update).getTime();
    if (age < 5 * 60 * 1000) return state.operator_context;
  }
  
  let timezone = 'Europe/Berlin';
  let workingHours = { start: 9, end: 18 };  // 9 AM - 6 PM
  let dndWindows = [];  // Array of { start: '22:00', end: '08:00', days: [0,6] } (UTC)
  
  // Try to read from USER.md
  if (fs.existsSync(OPERATOR_CONTEXT_PATH)) {
    const content = fs.readFileSync(OPERATOR_CONTEXT_PATH, 'utf8');
    
    // Extract timezone
    const tzMatch = content.match(/timezone:\s*(.+)/i);
    if (tzMatch) timezone = tzMatch[1].trim();
    
    // Extract working hours
    const hoursMatch = content.match(/working hours?:\s*(\d+)[-:.]?(\d+)?\s*[-–to]+\s*(\d+)/i);
    if (hoursMatch) {
      workingHours = {
        start: parseInt(hoursMatch[1]),
        end: parseInt(hoursMatch[3]),
      };
    }
    
    // Extract DND (simplified)
    const dndMatch = content.match(/dnd:\s*(.+)/i) || content.match(/do not disturb:\s*(.+)/i);
    if (dndMatch) {
      // Parse DND windows if present
      dndWindows = _parseDNDBoolean(dndMatch[1]) ? [{ hours: [22, 8], days: [0, 1, 2, 3, 4, 5, 6] }] : [];
    }
  }
  
  const context = {
    timezone,
    workingHours,
    dndWindows,
    currentTimeUTC: new Date().toISOString(),
  };
  
  state.operator_context = context;
  state.last_context_update = new Date().toISOString();
  
  return context;
}

function _parseDNDBoolean(str) {
  const trueVals = ['yes', 'true', '1', 'on', 'enabled'];
  return trueVals.includes(str.toLowerCase().trim());
}

/**
 * isOperatorAvailable()
 * 
 * Determines if operator is currently available.
 * Returns: { available: bool, reason: string, inDND: bool, inWorkingHours: bool }
 */
function isOperatorAvailable() {
  const ctx = getOperatorContext();
  const now = new Date();
  
  // Get current hour in operator's timezone (simplified - using UTC offset)
  const utcOffset = _getTimezoneOffset(ctx.timezone);
  const localHour = (now.getUTCHours() + utcOffset) % 24;
  const localDay = now.getUTCDay();
  
  // Check working hours
  const inWorkingHours = localHour >= ctx.workingHours.start && localHour < ctx.workingHours.end;
  
  // Check DND
  let inDND = false;
  for (const window of ctx.dndWindows) {
    if (window.days.includes(localDay)) {
      if (window.hours[0] <= localHour || localHour < window.hours[1]) {
        inDND = true;
        break;
      }
    }
  }
  
  // If no DND defined, assume always available during working hours
  const available = !inDND && inWorkingHours;
  
  return {
    available,
    inDND,
    inWorkingHours,
    reason: !inDND 
      ? (inWorkingHours ? 'available_during_working_hours' : 'outside_working_hours')
      : 'in_dnd_window',
    timezone: ctx.timezone,
    localHour,
  };
}

function _getTimezoneOffset(timezone) {
  // Simplified timezone offset calculation
  // In production, would use a proper timezone library
  const offsets = {
    'Europe/Berlin': 2,
    'Europe/London': 0,
    'Europe/Paris': 2,
    'US/Eastern': -5,
    'US/Pacific': -8,
    'Asia/Tokyo': 9,
  };
  
  return offsets[timezone] || 0;
}

// ─── Buffer Management ───────────────────────────────────────────────────────

/**
 * bufferPendingProposal(proposal, options)
 * 
 * Adds a proposal to the buffer when operator unavailable.
 */
function bufferPendingProposal(proposal, options = {}) {
  const state = getState();
  
  const {
    urgency = URGENCY_LEVEL.NORMAL,
    maxWaitMinutes = 60,
    expiresAt = null,
  } = options;
  
  // Check if already buffered
  const existing = state.pending_items.find(p => 
    p.proposal_id === proposal.proposal_id || 
    (p.proposal.action === proposal.action && 
     JSON.stringify(p.proposal) === JSON.stringify(proposal))
  );
  
  if (existing) {
    // Update existing entry
    existing.retry_count++;
    existing.last_tried_at = new Date().toISOString();
    existing.urgency = _escalateUrgency(existing.urgency);
    existing.next_retry_at = _calculateNextRetry(existing.retry_count);
    
    _auditLog('PROPOSAL_RE_UPDATED', proposal.proposal_id, {
      retry_count: existing.retry_count,
      urgency: existing.urgency,
    });
    
    saveState();
    return existing;
  }
  
  const item = {
    item_id: `buf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    proposal_id: proposal.proposal_id || null,
    proposal,
    
    // Timing
    buffered_at: new Date().toISOString(),
    last_tried_at: new Date().toISOString(),
    last_escalated_at: new Date().toISOString(),
    expires_at: expiresAt || _calculateExpiry(maxWaitMinutes, urgency),
    
    // Retry control
    retry_count: 0,
    next_retry_at: _calculateNextRetry(0),
    
    // Recommendation decay
    recommendation_strength: DECAY_CONFIG.INITIAL_STRENGTH,
    
    // Status
    status: BUFFER_STATUS.PENDING,
    urgency,
    
    // Spam prevention
    last_surface_at: null,
    surface_count: 0,
  };
  
  state.pending_items.push(item);
  state.total_buffered++;
  
  _auditLog('PROPOSAL_BUFFERED', proposal.proposal_id, {
    urgency,
    expires_at: item.expires_at,
  });
  
  saveState();
  return item;
}

function _calculateExpiry(maxWaitMinutes, urgency) {
  // Critical items don't auto-expire
  if (urgency === URGENCY_LEVEL.CRITICAL) {
    return null;  // No expiry
  }
  
  const now = new Date();
  const maxMs = Math.min(maxWaitMinutes * 60 * 1000, DECAY_CONFIG.MAX_DECAY_HOURS * 60 * 60 * 1000);
  return new Date(now.getTime() + maxMs).toISOString();
}

function _calculateNextRetry(retryCount) {
  const intervalMs = RETRY_CONFIG.INITIAL_INTERVAL_MINUTES * 60 * 1000 
    * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount);
  const cappedMs = Math.min(intervalMs, RETRY_CONFIG.MAX_INTERVAL_MINUTES * 60 * 1000);
  return new Date(Date.now() + cappedMs).toISOString();
}

function _escalateUrgency(current) {
  if (current === URGENCY_LEVEL.LOW) return URGENCY_LEVEL.NORMAL;
  if (current === URGENCY_LEVEL.NORMAL) return URGENCY_LEVEL.HIGH;
  if (current === URGENCY_LEVEL.HIGH) return URGENCY_LEVEL.CRITICAL;
  return current;
}

// ─── Processing ──────────────────────────────────────────────────────────────

/**
 * processBuffer(options)
 * 
 * Main entry point. Processes buffered items based on operator availability.
 * Returns items that should be presented to operator.
 */
function processBuffer(options = {}) {
  const {
    forceProcess = false,  // For testing/debugging
    checkAvailability = true,
  } = options;
  
  const state = getState();
  const toSurface = [];
  const toExpire = [];
  const toKeep = [];
  
  // Check operator availability
  const availability = checkAvailability ? isOperatorAvailable() : { available: true, inDND: false };
  
  // If operator unavailable (and not forcing), limit what we surface
  const canSurfaceNormal = availability.available && !availability.inDND;
  
  for (const item of state.pending_items) {
    // Check expiry
    if (item.expires_at && new Date(item.expires_at) < new Date() && item.urgency !== URGENCY_LEVEL.CRITICAL) {
      item.status = BUFFER_STATUS.EXPIRED;
      toExpire.push(item);
      state.total_expired++;
      continue;
    }
    
    // CRITICAL items ALWAYS persist and eventually surface
    if (item.urgency === URGENCY_LEVEL.CRITICAL) {
      // Check spam prevention (but not when forcing)
      if (!forceProcess && item.last_surface_at) {
        const timeSinceSurface = Date.now() - new Date(item.last_surface_at).getTime();
        if (timeSinceSurface < RETRY_CONFIG.SPAM_PREVENTION_MINUTES * 60 * 1000) {
          toKeep.push(item);
          continue;
        }
      }
      
      // Decay recommendation strength but keep urgency
      item.recommendation_strength = Math.max(
        DECAY_CONFIG.MIN_STRENGTH_THRESHOLD,
        item.recommendation_strength - DECAY_CONFIG.DECAY_RATE_PER_HOUR * 0.5  // Slower decay for critical
      );
      
      item.status = BUFFER_STATUS.ESCALATING;
      item.last_escalated_at = new Date().toISOString();
      item.surface_count++;
      item.last_surface_at = new Date().toISOString();
      
      toSurface.push(item);
      continue;
    }
    
    // HIGH urgency items
    if (item.urgency === URGENCY_LEVEL.HIGH) {
      if (canSurfaceNormal || forceProcess) {
        // forceProcess bypasses retry timing check
        if (forceProcess || _canRetry(item)) {
          item.status = BUFFER_STATUS.ESCALATING;
          item.last_surface_at = new Date().toISOString();
          item.surface_count++;
          toSurface.push(item);
          continue;
        }
      }
      toKeep.push(item);
      continue;
    }
    
    // NORMAL/LOW urgency - only surface if operator available
    if (canSurfaceNormal || forceProcess) {
      // forceProcess bypasses retry timing check
      if (forceProcess || _canRetry(item)) {
        item.status = BUFFER_STATUS.ESCALATING;
        item.last_surface_at = new Date().toISOString();
        item.surface_count++;
        toSurface.push(item);
        continue;
      }
    }
    
    // Apply decay to kept items
    _applyDecay(item);
    toKeep.push(item);
  }
  
  // Remove expired items
  state.pending_items = state.pending_items.filter(i => 
    i.status !== BUFFER_STATUS.EXPIRED && i.status !== BUFFER_STATUS.APPROVED && i.status !== BUFFER_STATUS.CANCELLED
  );
  
  _auditLog('BUFFER_PROCESSED', null, {
    available: availability.available,
    inDND: availability.inDND,
    surfaced: toSurface.length,
    expired: toExpire.length,
    kept: toKeep.length,
  });
  
  saveState();
  
  return {
    surfaced_items: toSurface,
    expired_items: toExpire,
    kept_items: toKeep,
    operator_available: availability.available,
    in_dnd: availability.inDND,
    availability_context: availability,
  };
}

function _canRetry(item) {
  // Check if it's time for next retry
  if (!item.next_retry_at) return true;
  return new Date(item.next_retry_at) <= new Date();
}

function _applyDecay(item) {
  if (item.urgency === URGENCY_LEVEL.CRITICAL) {
    // Critical items decay very slowly
    item.recommendation_strength = Math.max(
      DECAY_CONFIG.MIN_STRENGTH_THRESHOLD * 2,  // Higher floor for critical
      item.recommendation_strength - DECAY_CONFIG.DECAY_RATE_PER_HOUR * 0.25
    );
  } else {
    // Normal decay
    item.recommendation_strength = Math.max(
      DECAY_CONFIG.MIN_STRENGTH_THRESHOLD,
      item.recommendation_strength - DECAY_CONFIG.DECAY_RATE_PER_HOUR * 0.5
    );
  }
  
  // Update next retry time
  if (item.retry_count < RETRY_CONFIG.MAX_RETRIES) {
    item.retry_count++;
    item.next_retry_at = _calculateNextRetry(item.retry_count);
  }
}

// ─── Approval Handling ───────────────────────────────────────────────────────

/**
 * markApproved(itemId)
 * 
 * Marks a buffered item as approved.
 */
function markApproved(itemId) {
  const state = getState();
  const item = state.pending_items.find(i => i.item_id === itemId);
  
  if (!item) return null;
  
  item.status = BUFFER_STATUS.APPROVED;
  item.approved_at = new Date().toISOString();
  state.total_approved++;
  
  _auditLog('BUFFER_ITEM_APPROVED', itemId, {
    wait_time_minutes: Math.round((Date.now() - new Date(item.buffered_at).getTime()) / 60000),
    retry_count: item.retry_count,
  });
  
  saveState();
  return item;
}

/**
 * markCancelled(itemId, reason)
 * 
 * Marks a buffered item as cancelled by operator.
 */
function markCancelled(itemId, reason = '') {
  const state = getState();
  const item = state.pending_items.find(i => i.item_id === itemId);
  
  if (!item) return null;
  
  item.status = BUFFER_STATUS.CANCELLED;
  item.cancelled_at = new Date().toISOString();
  item.cancellation_reason = reason;
  state.total_cancelled++;
  
  _auditLog('BUFFER_ITEM_CANCELLED', itemId, { reason });
  
  saveState();
  return item;
}

/**
 * removeFromBuffer(itemId)
 * 
 * Removes an item from buffer (after approval or expiry cleanup).
 */
function removeFromBuffer(itemId) {
  const state = getState();
  const before = state.pending_items.length;
  state.pending_items = state.pending_items.filter(i => i.item_id !== itemId);
  return state.pending_items.length < before;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * getPendingItems(filter)
 */
function getPendingItems(filter = {}) {
  const state = getState();
  let items = [...state.pending_items];
  
  if (filter.status) {
    items = items.filter(i => i.status === filter.status);
  }
  if (filter.urgency) {
    items = items.filter(i => i.urgency === filter.urgency);
  }
  if (filter.minStrength !== undefined) {
    items = items.filter(i => i.recommendation_strength >= filter.minStrength);
  }
  
  return items;
}

/**
 * getBufferSummary()
 */
function getBufferSummary() {
  const state = getState();
  
  const byStatus = {};
  const byUrgency = {};
  
  for (const item of state.pending_items) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    byUrgency[item.urgency] = (byUrgency[item.urgency] || 0) + 1;
  }
  
  return {
    total_pending: state.pending_items.length,
    by_status: byStatus,
    by_urgency: byUrgency,
    critical_count: byUrgency[URGENCY_LEVEL.CRITICAL] || 0,
    high_count: byUrgency[URGENCY_LEVEL.HIGH] || 0,
    total_buffered: state.total_buffered,
    total_approved: state.total_approved,
    total_expired: state.total_expired,
    total_cancelled: state.total_cancelled,
  };
}

/**
 * getAuditLog(filter)
 */
function getAuditLog(filter = {}) {
  const state = getState();
  let log = [...state.audit_log];
  
  if (filter.eventType) {
    log = log.filter(e => e.event_type === filter.eventType);
  }
  
  return log;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

function _auditLog(eventType, targetId, details) {
  const state = getState();
  
  state.audit_log.push({
    event_type: eventType,
    target_id: targetId,
    details,
    timestamp: new Date().toISOString(),
  });
  
  // Keep last 200 entries
  if (state.audit_log.length > 200) {
    state.audit_log = state.audit_log.slice(-200);
  }
}

// ─── Integration Helpers ─────────────────────────────────────────────────────

/**
 * shouldBufferProposal(proposal, context)
 * 
 * Determines if a proposal should be buffered.
 */
function shouldBufferProposal(proposal, context = {}) {
  const { operatorAvailable = false, requiresApproval = true } = context;
  
  if (!requiresApproval) return false;
  if (operatorAvailable) return false;
  
  // Always buffer if operator not available and approval needed
  return true;
}

/**
 * getBufferedProposalForApproval()
 * 
 * Gets proposals that should be presented for approval now.
 */
function getBufferedProposalForApproval() {
  const result = processBuffer({ forceProcess: true });
  return result.surfaced_items.map(item => ({
    item_id: item.item_id,
    proposal: item.proposal,
    urgency: item.urgency,
    recommendation_strength: item.recommendation_strength,
    wait_time_minutes: Math.round((Date.now() - new Date(item.buffered_at).getTime()) / 60000),
    retry_count: item.retry_count,
    surface_count: item.surface_count,
  }));
}

// ─── Constants Export ─────────────────────────────────────────────────────────

function getConstants() {
  return {
    BUFFER_STATUS,
    URGENCY_LEVEL,
    DECAY_CONFIG,
    RETRY_CONFIG,
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  ...getConstants(),
  
  // Operator availability
  isOperatorAvailable,
  getOperatorContext,
  
  // Buffer management
  bufferPendingProposal,
  processBuffer,
  markApproved,
  markCancelled,
  removeFromBuffer,
  
  // Queries
  getPendingItems,
  getBufferSummary,
  getAuditLog,
  
  // Integration helpers
  shouldBufferProposal,
  getBufferedProposalForApproval,
  
  // Utils
  resetCaches,
};
