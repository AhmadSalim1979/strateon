// MCAI Phase 3C — Temporal Continuity Layer
// Observation only. No planning, no execution authority.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = process.cwd();
const TLOG = path.join(BASE, 'state', 'temporal-continuity.jsonl');
const SNAPSHOT_DIR = path.join(BASE, 'state', 'snapshots', 'daily');
const AUDIT = path.join(BASE, 'state', 'temporal-audit.log');

const STABLE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days → stable
const FLIP_THRESHOLD = 3;                                // 3+ flips → repeated flip
const STALE_BELIEF_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days → stale belief

// Entity types tracked
const ETYPE = {
  BELIEF: 'BELIEF',
  COMMITMENT: 'COMMITMENT',
  VERIFICATION: 'VERIFICATION',
  WORLD_MODEL_ENTITY: 'WORLD_MODEL_ENTITY',
  WORLD_MODEL_RELATION: 'WORLD_MODEL_RELATION'
};

// Deterministic continuity record ID
function mkCid(entity_type, entity_id, field, ts) {
  return crypto.createHash('md5')
    .update(`${entity_type}:${entity_id}:${field}:${ts}`)
    .digest('hex').slice(0, 12);
}

function readTLog() {
  if (!fs.existsSync(TLOG)) return [];
  const content = fs.readFileSync(TLOG, 'utf8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).map(JSON.parse);
}

function appendT(entry) {
  const fd = fs.openSync(TLOG, 'a');
  fs.writeSync(fd, JSON.stringify(entry) + '\n');
  fs.closeSync(fd);
}

function auditT(action, entry) {
  fs.appendFileSync(AUDIT, JSON.stringify({
    ts: new Date().toISOString(),
    action,
    entry
  }) + '\n');
}

// 1. Record a state change event
function recordStateChange({ entity_type, entity_id, field, old_value, new_value, evidence_ref = null }) {
  const ts = new Date().toISOString();
  const continuity_id = mkCid(entity_type, entity_id, field, ts);
  const entry = {
    type: 'CONTINUITY',
    continuity_id,
    entity_type,
    entity_id,
    field,
    old_value,
    new_value,
    changed_at: ts,
    evidence_ref,
    stability_tag: null  // assigned later by analysis
  };
  appendT(entry);
  auditT('STATE_CHANGED', entry);
  return continuity_id;
}

// 2. Record a belief assertion
function recordBelief({ entity_id, predicate, object_value, belief_system = 'DEFAULT', evidence_ref = null }) {
  const ts = new Date().toISOString();
  const continuity_id = mkCid(ETYPE.BELIEF, entity_id, predicate, ts);
  const entry = {
    type: 'BELIEF_CONTINUITY',
    continuity_id,
    entity_type: ETYPE.BELIEF,
    entity_id,
    predicate,
    object_value,
    belief_system,
    asserted_at: ts,
    last_verified_at: ts,
    evidence_ref,
    stability_tag: null,
    stale: false        // becomes true when age > threshold
  };
  appendT(entry);
  auditT('BELIEF_RECORDED', entry);
  return continuity_id;
}

// 3. Record commitment lifecycle event
function recordCommitmentLifecycle({ commitment_id, owner, intent, event_type, event_value, deadline }) {
  const ts = new Date().toISOString();
  const cid = crypto.createHash('md5')
    .update(`${commitment_id}:${event_type}:${ts}`)
    .digest('hex').slice(0, 12);

  const entry = {
    type: 'COMMITMENT_LIFECYCLE',
    lifecycle_id: cid,
    entity_type: ETYPE.COMMITMENT,
    commitment_id,
    owner,
    intent,
    event_type, // CREATED | STATUS_CHANGED | EXPIRED | COMPLETED | VERIFIED | CANCELLED
    event_value,
    deadline,
    event_at: ts
  };
  appendT(entry);
  auditT('COMMITMENT_LIFECYCLE', entry);
  return cid;
}

// 4. Record verification freshness event
function recordVerificationFreshness({ verification_id, commitment_id, verification_status, age_ms, freshness_tag }) {
  const ts = new Date().toISOString();
  const vid = crypto.createHash('md5')
    .update(`${verification_id}:${freshness_tag}:${ts}`)
    .digest('hex').slice(0, 12);

  const entry = {
    type: 'VERIFICATION_FRESHNESS',
    freshness_id: vid,
    entity_type: ETYPE.VERIFICATION,
    verification_id,
    commitment_id,
    verification_status,
    age_ms,
    freshness_tag, // FRESH | STALE | EXPIRED | UNVERIFIED
    recorded_at: ts
  };
  appendT(entry);
  auditT('VERIFICATION_FRESHNESS', entry);
  return vid;
}

// 5. Detect repeated status flips
function detectRepeatedFlips(entity_id, windowMs = 30 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const entries = readTLog()
    .filter(e =>
      (e.type === 'CONTINUITY' || e.type === 'COMMITMENT_LIFECYCLE') &&
      e.entity_id === entity_id &&
      (now - new Date(e.changed_at || e.event_at).getTime()) < windowMs
    );
  const changes = entries.filter(e => e.type === 'CONTINUITY' && e.field === 'status');
  const flips = changes.length;
  return {
    entity_id,
    flip_count: flips,
    repeated_flip: flips >= FLIP_THRESHOLD,
    latest_status: changes.length > 0 ? changes[changes.length - 1].new_value : null
  };
}

// 6. Detect stale truth claims (beliefs older than threshold)
function detectStaleBeliefs(thresholdMs = STALE_BELIEF_THRESHOLD_MS) {
  const now = Date.now();
  const beliefs = readTLog().filter(e => e.type === 'BELIEF_CONTINUITY');
  return beliefs
    .filter(e => {
      const age = now - new Date(e.asserted_at).getTime();
      return age > thresholdMs;
    })
    .map(e => ({
      entity_id: e.entity_id,
      predicate: e.predicate,
      age_ms: now - new Date(e.asserted_at).getTime(),
      asserted_at: e.asserted_at,
      repeated_flip: detectRepeatedFlips(e.entity_id).repeated_flip
    }));
}

// 7. Compute entity stability rate
function computeEntityStability(entity_id, windowMs = 30 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const entries = readTLog()
    .filter(e => e.entity_id === entity_id && (now - new Date(e.changed_at || e.event_at).getTime()) < windowMs);
  const changes = entries.filter(e => e.type === 'CONTINUITY');
  if (changes.length === 0) return { entity_id, stability_rate: 1.0, change_count: 0, stable: true };
  const changeCount = changes.length;
  const stability_rate = Math.max(0, parseFloat((1 - (changeCount / 10)).toFixed(4)));
  return {
    entity_id,
    stability_rate,
    change_count: changeCount,
    stable: stability_rate >= 0.7
  };
}

// 8. Track commitment lifecycle duration
function trackCommitmentLifecycle(commitment_id) {
  const entries = readTLog()
    .filter(e => e.entity_type === ETYPE.COMMITMENT && e.commitment_id === commitment_id)
    .sort((a, b) => new Date(a.event_at) - new Date(b.event_at));

  if (entries.length === 0) return null;

  const created = entries.find(e => e.event_type === 'CREATED');
  const terminal = entries.find(e => ['COMPLETED', 'VERIFIED', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(e.event_type));

  const lifecycle_ms = terminal
    ? new Date(terminal.event_at).getTime() - new Date(created ? created.event_at : terminal.event_at).getTime()
    : Date.now() - new Date(created ? created.event_at : Date.now()).getTime();

  return {
    commitment_id,
    created_at: created ? created.event_at : null,
    completed_at: terminal ? terminal.event_at : null,
    lifecycle_ms,
    lifecycle_days: parseFloat((lifecycle_ms / (1000 * 60 * 60 * 24)).toFixed(2)),
    terminal_event: terminal ? terminal.event_type : 'OPEN'
  };
}

// 9. Verification freshness tracking
function trackVerificationFreshness(verification_id) {
  const vLog = path.join(BASE, 'state', 'verification-log.jsonl');
  if (!fs.existsSync(vLog)) return null;
  const content = fs.readFileSync(vLog, 'utf8').trim();
  if (!content) return null;
  const vEntries = content.split('\n').filter(Boolean).map(JSON.parse)
    .filter(e => e.type === 'VERIFICATION' && e.verification_id === verification_id);
  if (vEntries.length === 0) return null;

  const v = vEntries[0];
  const age_ms = Date.now() - new Date(v.verified_at).getTime();

  let freshness_tag = 'FRESH';
  if (v.verification_status === 'STALE_VERIFICATION') freshness_tag = 'STALE';
  else if (v.verification_status === 'FAILED_VERIFICATION') freshness_tag = 'FAILED';
  else if (new Date(v.expires_at).getTime() < Date.now()) freshness_tag = 'EXPIRED';
  else if (v.verification_status === 'UNVERIFIED') freshness_tag = 'UNVERIFIED';

  return {
    verification_id,
    commitment_id: v.commitment_id,
    status: v.verification_status,
    age_ms,
    age_hours: parseFloat((age_ms / (1000 * 60 * 60)).toFixed(2)),
    freshness_tag,
    expires_at: v.expires_at
  };
}

// 10. All continuity metrics
function getContinuityMetrics() {
  const entries = readTLog();
  const now = Date.now();

  // Entity stability rate
  const entityIds = [...new Set(entries.filter(e => e.entity_id).map(e => e.entity_id))];
  const stabilityScores = entityIds.map(id => computeEntityStability(id));
  const avgStability = stabilityScores.length > 0
    ? parseFloat((stabilityScores.reduce((a, b) => a + b.stability_rate, 0) / stabilityScores.length).toFixed(4))
    : 1.0;
  const stableCount = stabilityScores.filter(s => s.stable).length;
  const entity_stability_rate = parseFloat(((stableCount / stabilityScores.length) * 100).toFixed(2));

  // Belief stability
  const beliefs = entries.filter(e => e.type === 'BELIEF_CONTINUITY');
  const staleBeliefs = detectStaleBeliefs();
  const belief_stability_rate = beliefs.length > 0
    ? parseFloat((((beliefs.length - staleBeliefs.length) / beliefs.length) * 100).toFixed(2))
    : 100;

  // Repeated flip count
  const flipResults = entityIds.map(id => detectRepeatedFlips(id));
  const repeated_flip_count = flipResults.filter(r => r.repeated_flip).length;
  const stale_truth_claims = staleBeliefs.length;

  // Commitment lifecycle times
  const commitmentIds = [...new Set(entries.filter(e => e.type === 'COMMITMENT_LIFECYCLE').map(e => e.commitment_id))];
  const lifecycles = commitmentIds.map(id => trackCommitmentLifecycle(id)).filter(Boolean);
  const completedLifecycles = lifecycles.filter(l => l.terminal_event !== 'OPEN');
  const average_commitment_lifecycle_time = completedLifecycles.length > 0
    ? parseFloat((completedLifecycles.reduce((a, b) => a + b.lifecycle_days, 0) / completedLifecycles.length).toFixed(2))
    : null;

  // Verification freshness
  const freshEntries = entries.filter(e => e.type === 'VERIFICATION_FRESHNESS');
  const freshCount = freshEntries.filter(e => e.freshness_tag === 'FRESH').length;
  const staleVfCount = freshEntries.filter(e => e.freshness_tag === 'STALE').length;
  const verification_freshness_rate = freshEntries.length > 0
    ? parseFloat(((freshCount / freshEntries.length) * 100).toFixed(2))
    : 100;

  return {
    entity_stability_rate,
    belief_stability_rate,
    repeated_flip_count,
    stale_truth_claims,
    average_commitment_lifecycle_time,
    verification_freshness_rate,
    // Extra breakdowns
    stable_entity_count: stableCount,
    total_entity_count: entityIds.length,
    total_beliefs_tracked: beliefs.length,
    stale_belief_count: staleBeliefs.length,
    total_commitments_tracked: commitmentIds.length,
    completed_commitments: completedLifecycles.length,
    total_verification_freshness_records: freshEntries.length,
    stale_verification_freshness_count: staleVfCount
  };
}

// 11. Daily snapshot
function takeContinuitySnapshot() {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(SNAPSHOT_DIR, `continuity-${date}.json`);
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  fs.writeFileSync(dir, JSON.stringify({
    ts: new Date().toISOString(),
    entries: readTLog()
  }, null, 2));
  return dir;
}

// 12. Orphan detection for temporal log
function detectOrphanedContinuityRecords() {
  const entries = readTLog();
  const vLog = path.join(BASE, 'state', 'verification-log.jsonl');
  const cLog = path.join(BASE, 'state', 'commitments.jsonl');

  const validCommitmentIds = new Set();
  const validVerificationIds = new Set();

  // Collect valid commitment IDs
  if (fs.existsSync(cLog)) {
    const cContent = fs.readFileSync(cLog, 'utf8').trim();
    if (cContent) {
      cContent.split('\n').filter(Boolean).map(JSON.parse)
        .filter(e => e.type === 'COMMITMENT')
        .forEach(e => validCommitmentIds.add(e.commitment_id));
    }
  }

  // Collect valid verification IDs
  if (fs.existsSync(vLog)) {
    const vContent = fs.readFileSync(vLog, 'utf8').trim();
    if (vContent) {
      vContent.split('\n').filter(Boolean).map(JSON.parse)
        .filter(e => e.type === 'VERIFICATION')
        .forEach(e => validVerificationIds.add(e.verification_id));
    }
  }

  const orphaned = [];
  for (const e of entries) {
    if (e.type === 'COMMITMENT_LIFECYCLE' && !validCommitmentIds.has(e.commitment_id)) {
      orphaned.push(e.continuity_id || e.lifecycle_id);
    }
    if (e.type === 'VERIFICATION_FRESHNESS' && !validVerificationIds.has(e.verification_id)) {
      orphaned.push(e.freshness_id);
    }
  }
  return orphaned;
}

module.exports = {
  ETYPE,
  mkCid,
  recordStateChange,
  recordBelief,
  recordCommitmentLifecycle,
  recordVerificationFreshness,
  detectRepeatedFlips,
  detectStaleBeliefs,
  computeEntityStability,
  trackCommitmentLifecycle,
  trackVerificationFreshness,
  getContinuityMetrics,
  takeContinuitySnapshot,
  detectOrphanedContinuityRecords,
  readTLog
};