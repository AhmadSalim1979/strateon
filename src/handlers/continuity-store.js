/**
 * Continuity Store — Minimal stub for R6.1 Integration Validation
 * 
 * Provides:
 * - Chain state management (active, paused, stopped)
 * - getActiveChain() / getPausedChains() / savePausedWork()
 */

const CONTINUITY_STATUS = {
  CHAIN_ACTIVE: 'chain_active',
  CHAIN_PAUSED: 'chain_paused',
  CHAIN_STOPPED: 'chain_stopped',
  CHAIN_COMPLETED: 'chain_completed',
};

let _store = null;
const STORE_PATH = require('path').join(__dirname, '../../state/continuity-store.json');

function _loadStore() {
  if (_store) return _store;
  try {
    const fs = require('fs');
    if (fs.existsSync(STORE_PATH)) {
      _store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } else {
      _store = { chains: [], last_updated: new Date().toISOString() };
    }
  } catch (e) {
    _store = { chains: [], last_updated: new Date().toISOString() };
  }
  return _store;
}

function _saveStore() {
  try {
    const fs = require('fs');
    const dir = require('path').dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    _store.last_updated = new Date().toISOString();
    fs.writeFileSync(STORE_PATH, JSON.stringify(_loadStore(), null, 2), 'utf8');
  } catch (e) {
    // Ignore
  }
}

/**
 * getActiveChain()
 */
function getActiveChain() {
  const store = _loadStore();
  return store.chains.find(c => c.continuity_status === CONTINUITY_STATUS.CHAIN_ACTIVE) || null;
}

/**
 * getPausedChains()
 */
function getPausedChains() {
  const store = _loadStore();
  return store.chains.filter(c => c.continuity_status === CONTINUITY_STATUS.CHAIN_PAUSED);
}

/**
 * savePausedWork(pausedWorkItem, currentCycle)
 */
function savePausedWork(pausedWorkItem, currentCycle = 0) {
  const store = _loadStore();
  const now = new Date().toISOString();
  
  // Find existing chain
  let chain = store.chains.find(c => c.chain_id === pausedWorkItem.chain_id);
  
  if (chain) {
    // Update existing
    chain.continuity_status = CONTINUITY_STATUS.CHAIN_PAUSED;
    chain.paused_at = now;
    chain.paused_reason = pausedWorkItem.paused_reason;
    chain.resume_condition = pausedWorkItem.resume_condition;
    chain.preemption = pausedWorkItem.preemption || null;
    chain.completed_steps = pausedWorkItem.completed_steps || [];
    chain.remaining_steps = pausedWorkItem.remaining_steps || [];
    chain.updated_at = now;
    chain.paused_age_cycles = 0;
  } else {
    // Create new
    store.chains.push({
      chain_id: pausedWorkItem.chain_id,
      chain_issue: pausedWorkItem.issue || 'unknown',
      continuity_status: CONTINUITY_STATUS.CHAIN_PAUSED,
      created_at: now,
      updated_at: now,
      paused_at: now,
      paused_reason: pausedWorkItem.paused_reason,
      resume_condition: pausedWorkItem.resume_condition,
      preemption: pausedWorkItem.preemption || null,
      completed_steps: pausedWorkItem.completed_steps || [],
      remaining_steps: pausedWorkItem.remaining_steps || [],
      paused_age_cycles: 0,
    });
  }
  
  _saveStore();
  return true;
}

/**
 * activatePausedChain(chainId)
 */
function activatePausedChain(chainId) {
  const store = _loadStore();
  const chain = store.chains.find(c => c.chain_id === chainId);
  if (!chain) return false;
  
  chain.continuity_status = CONTINUITY_STATUS.CHAIN_ACTIVE;
  chain.updated_at = new Date().toISOString();
  _saveStore();
  return true;
}

/**
 * suppressPausedChain(chainId, suppression_reason)
 */
function suppressPausedChain(chainId, suppression_reason) {
  const store = _loadStore();
  const chain = store.chains.find(c => c.chain_id === chainId);
  if (!chain) return false;
  
  chain.continuity_status = CONTINUITY_STATUS.CHAIN_STOPPED;
  chain.suppression_reason = suppression_reason;
  chain.suppressed_at = new Date().toISOString();
  chain.updated_at = new Date().toISOString();
  _saveStore();
  return true;
}

/**
 * getChainSummary()
 */
function getChainSummary() {
  const store = _loadStore();
  return {
    total_chains: store.chains.length,
    active_chains: store.chains.filter(c => c.continuity_status === CONTINUITY_STATUS.CHAIN_ACTIVE).length,
    paused_chains: store.chains.filter(c => c.continuity_status === CONTINUITY_STATUS.CHAIN_PAUSED).length,
    stopped_chains: store.chains.filter(c => c.continuity_status === CONTINUITY_STATUS.CHAIN_STOPPED).length,
    completed_chains: store.chains.filter(c => c.continuity_status === CONTINUITY_STATUS.CHAIN_COMPLETED).length,
  };
}

module.exports = {
  getActiveChain,
  getPausedChains,
  savePausedWork,
  activatePausedChain,
  suppressPausedChain,
  getChainSummary,
  CONTINUITY_STATUS,
};
