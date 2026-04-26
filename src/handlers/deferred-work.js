/**
 * Deferred Work — Minimal stub for R6.1 Integration Validation
 * 
 * Provides:
 * - Deferred queue management
 * - tickRevisitClock()
 * - getRevisitCandidates()
 * - addDeferredItem() / promoteDeferredItem() / suppressDeferredItem()
 */

const DEFERRED_CATEGORY = {
  HOUSEKEEPING: 'housekeeping',
  WEAK_INITIATIVE: 'weak_initiative',
  STABILITY_DEFERRED: 'stability_deferred',
  RECURRING_DEFERRAL: 'recurring_deferral',
  LOW_PRIORITY: 'low_priority',
  OPERATOR_ALIGNMENT: 'operator_alignment',
};

const REVISIT_STATUS = {
  PENDING: 'pending',
  REVISITED: 'revisited',
  PROMOTED: 'promoted',
  RESOLVED: 'resolved',
  EXPIRED: 'expired',
};

let _deferredStore = null;

const STORE_PATH = require('path').join(__dirname, '../../state/deferred-work.json');

function _loadStore() {
  if (_deferredStore) return _deferredStore;
  try {
    const fs = require('fs');
    if (require('fs').existsSync(STORE_PATH)) {
      _deferredStore = JSON.parse(require('fs').readFileSync(STORE_PATH, 'utf8'));
    } else {
      _deferredStore = { items: [], cycle_count: 0 };
    }
  } catch (e) {
    _deferredStore = { items: [], cycle_count: 0 };
  }
  return _deferredStore;
}

function _saveStore() {
  try {
    const fs = require('fs');
    const dir = require('path').dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(_loadStore(), null, 2), 'utf8');
  } catch (e) {
    // Ignore
  }
}

function _freshStore() {
  return { items: [], cycle_count: 0 };
}

/**
 * addDeferredItem(item)
 * 
 * Adds an item to the deferred queue.
 */
function addDeferredItem(item) {
  const store = _loadStore();
  const now = new Date().toISOString();
  
  // Check for duplicate
  const existing = store.items.find(i => 
    i.deferred_issue_id === item.deferred_issue_id &&
    (i.revisit_status === 'pending' || i.revisit_status === 'revisited')
  );
  
  if (existing) {
    // Refresh instead of duplicate
    existing.last_refreshed_at = now;
    existing.deferred_priority = item.deferred_priority || existing.deferred_priority;
    _saveStore();
    return existing;
  }
  
  const categoryDefaults = {
    housekeeping: { revisit_after: 12, max_cycles: 36 },
    weak_initiative: { revisit_after: 6, max_cycles: 24 },
    stability_deferred: { revisit_after: 3, max_cycles: 12 },
    recurring_deferral: { revisit_after: 4, max_cycles: 16 },
    low_priority: { revisit_after: 8, max_cycles: 32 },
    operator_alignment: { revisit_after: 6, max_cycles: 24 },
  };
  
  const defaults = categoryDefaults[item.deferred_category] || categoryDefaults.low_priority;
  
  const deferredItem = {
    deferred_id: `deferred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    deferred_issue_id: item.deferred_issue_id,
    deferred_reason: item.deferred_reason,
    deferred_category: item.deferred_category || 'low_priority',
    deferred_priority: item.deferred_priority || 0.5,
    deferred_at: now,
    deferred_at_relative_cycles: store.cycle_count,
    revisit_after: item.revisit_after || defaults.revisit_after,
    max_cycles: item.max_cycles || defaults.max_cycles,
    cycles_deferred: 0,
    revisit_status: REVISIT_STATUS.PENDING,
    last_revisited_at: null,
    revisit_count: 0,
    description: item.description || item.deferred_issue_id,
    related_pattern: item.related_pattern || null,
    recommended_action: item.recommended_action || null,
    promotion_reason: null,
    suppression_reason: null,
    promoted_at: null,
    resolved_at: null,
    last_refreshed_at: null,
  };
  
  store.items.push(deferredItem);
  _pruneStore(store);
  _saveStore();
  return deferredItem;
}

/**
 * tickRevisitClock()
 * 
 * Increments cycle counter and advances all pending items.
 */
function tickRevisitClock() {
  const store = _loadStore();
  store.cycle_count++;
  
  for (const item of store.items) {
    if (item.revisit_status === REVISIT_STATUS.PENDING || 
        item.revisit_status === REVISIT_STATUS.REVISITED) {
      item.cycles_deferred++;
      
      // Check expiry
      if (item.cycles_deferred >= item.max_cycles) {
        item.revisit_status = REVISIT_STATUS.EXPIRED;
      }
    }
  }
  
  _saveStore();
  return store.cycle_count;
}

/**
 * getRevisitCandidates()
 * 
 * Returns items that are due for revisit this cycle.
 */
function getRevisitCandidates() {
  const store = _loadStore();
  return store.items.filter(item => {
    return (item.revisit_status === REVISIT_STATUS.PENDING || 
            item.revisit_status === REVISIT_STATUS.REVISITED) &&
           item.cycles_deferred >= item.revisit_after;
  });
}

/**
 * getDeferredQueue()
 * 
 * Returns the full deferred queue (bounded to 20 items).
 */
function getDeferredQueue() {
  const store = _loadStore();
  const active = store.items.filter(i => 
    i.revisit_status === REVISIT_STATUS.PENDING || 
    i.revisit_status === REVISIT_STATUS.REVISITED
  );
  
  // Sort by cycles_deferred then priority
  active.sort((a, b) => {
    if (b.cycles_deferred !== a.cycles_deferred) {
      return b.cycles_deferred - a.cycles_deferred;
    }
    return b.deferred_priority - a.deferred_priority;
  });
  
  return {
    items: active.slice(0, 20),
    summary: {
      total: active.length,
      pending: active.filter(i => i.revisit_status === REVISIT_STATUS.PENDING).length,
      revisited: active.filter(i => i.revisit_status === REVISIT_STATUS.REVISITED).length,
      promoted: store.items.filter(i => i.revisit_status === REVISIT_STATUS.PROMOTED).length,
      resolved: store.items.filter(i => i.revisit_status === REVISIT_STATUS.RESOLVED).length,
      expired: store.items.filter(i => i.revisit_status === REVISIT_STATUS.EXPIRED).length,
      last_cycle: store.cycle_count,
    }
  };
}

/**
 * promoteDeferredItem(deferredId, reason)
 */
function promoteDeferredItem(deferredId, reason) {
  const store = _loadStore();
  const item = store.items.find(i => i.deferred_id === deferredId);
  if (!item) return null;
  
  item.revisit_status = REVISIT_STATUS.PROMOTED;
  item.promotion_reason = reason;
  item.promoted_at = new Date().toISOString();
  
  _saveStore();
  return item;
}

/**
 * suppressDeferredItem(deferredId, reason)
 */
function suppressDeferredItem(deferredId, reason) {
  const store = _loadStore();
  const item = store.items.find(i => i.deferred_id === deferredId);
  if (!item) return null;
  
  item.revisit_status = REVISIT_STATUS.RESOLVED;
  item.suppression_reason = reason;
  item.resolved_at = new Date().toISOString();
  
  _saveStore();
  return item;
}

function _pruneStore(store) {
  // Keep max 100 total items, preserving promoted/resolved for 10 cycles
  const cutoff = Date.now() - (10 * 60 * 60 * 1000);
  
  store.items = store.items.filter(item => {
    if (item.revisit_status === REVISIT_STATUS.PROMOTED || 
        item.revisit_status === REVISIT_STATUS.RESOLVED) {
      const timestamp = item.resolved_at || item.promoted_at;
      if (timestamp && new Date(timestamp).getTime() > cutoff) {
        return true; // Keep recent resolutions
      }
    }
    return store.items.length <= 100;
  });
}

module.exports = {
  addDeferredItem,
  tickRevisitClock,
  getRevisitCandidates,
  getDeferredQueue,
  promoteDeferredItem,
  suppressDeferredItem,
  DEFERRED_CATEGORY,
  REVISIT_STATUS,
};
