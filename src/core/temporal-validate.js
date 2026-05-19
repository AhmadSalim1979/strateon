// Phase 3C Validation Script
const {
  ETYPE, mkCid,
  recordStateChange, recordBelief, recordCommitmentLifecycle, recordVerificationFreshness,
  detectRepeatedFlips, detectStaleBeliefs, computeEntityStability,
  trackCommitmentLifecycle, trackVerificationFreshness,
  getContinuityMetrics, takeContinuitySnapshot, detectOrphanedContinuityRecords, readTLog
} = require('./temporal-continuity');
const fs = require('fs');
const path = require('path');

const TLOG = path.join(process.cwd(), 'state', 'temporal-continuity.jsonl');
const AUDIT = path.join(process.cwd(), 'state', 'temporal-audit.log');
const CLOG = path.join(process.cwd(), 'state', 'commitments.jsonl');
const VLOG = path.join(process.cwd(), 'state', 'verification-log.jsonl');

// Reset
fs.writeFileSync(TLOG, '');
fs.writeFileSync(AUDIT, '');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++; }
}

console.log('\n=== Phase 3C Validation ===\n');

// 1. Deterministic continuity IDs
test('Deterministic continuity IDs stable across runs', () => {
  const id1 = mkCid('BELIEF', 'entity-x', 'status', '2026-05-19T00:00:00Z');
  const id2 = mkCid('BELIEF', 'entity-x', 'status', '2026-05-19T00:00:00Z');
  if (id1 !== id2) throw new Error(`ID mismatch: ${id1} vs ${id2}`);
  if (id1.length !== 12) throw new Error(`Expected 12-char ID, got: ${id1}`);
});

// 2. Record state change
test('recordStateChange appends entry with correct structure', () => {
  const cid = recordStateChange({
    entity_type: ETYPE.COMMITMENT,
    entity_id: 'c001',
    field: 'status',
    old_value: 'PENDING',
    new_value: 'IN_PROGRESS'
  });
  if (cid.length !== 12) throw new Error(`Expected 12-char ID, got: ${cid}`);
  const entries = readTLog();
  if (entries.length !== 1) throw new Error(`Expected 1 entry, got: ${entries.length}`);
  if (entries[0].type !== 'CONTINUITY') throw new Error(`Expected CONTINUITY type`);
  if (entries[0].old_value !== 'PENDING') throw new Error('old_value mismatch');
  if (entries[0].new_value !== 'IN_PROGRESS') throw new Error('new_value mismatch');
});

// 3. Record belief
test('recordBelief appends BELIEF_CONTINUITY entry', () => {
  fs.writeFileSync(TLOG, '');
  const cid = recordBelief({
    entity_id: 'qiyadon-model',
    predicate: 'revenue_growing',
    object_value: true,
    belief_system: 'FINANCIAL'
  });
  if (cid.length !== 12) throw new Error(`Expected 12-char ID, got: ${cid}`);
  const entries = readTLog();
  if (entries[0].type !== 'BELIEF_CONTINUITY') throw new Error(`Expected BELIEF_CONTINUITY`);
  if (entries[0].stale !== false) throw new Error('stale must be false on record');
});

// 4. Repeated flip detection
test('detectRepeatedFlips marks entity as repeated_flip when flips >= 3', () => {
  fs.writeFileSync(TLOG, '');
  const eid = 'flip-entity-1';
  // Record 3 status flips
  recordStateChange({ entity_type: ETYPE.COMMITMENT, entity_id: eid, field: 'status', old_value: 'PENDING', new_value: 'IN_PROGRESS' });
  recordStateChange({ entity_type: ETYPE.COMMITMENT, entity_id: eid, field: 'status', old_value: 'IN_PROGRESS', new_value: 'PENDING' });
  recordStateChange({ entity_type: ETYPE.COMMITMENT, entity_id: eid, field: 'status', old_value: 'PENDING', new_value: 'IN_PROGRESS' });
  const result = detectRepeatedFlips(eid);
  if (!result.repeated_flip) throw new Error(`Expected repeated_flip=true, got: ${result.repeated_flip}`);
  if (result.flip_count !== 3) throw new Error(`Expected flip_count=3, got: ${result.flip_count}`);
});

test('detectRepeatedFlips returns repeated_flip=false when flips < 3', () => {
  const eid = 'stable-entity-1';
  recordStateChange({ entity_type: ETYPE.BELIEF, entity_id: eid, field: 'status', old_value: 'A', new_value: 'B' });
  const result = detectRepeatedFlips(eid);
  if (result.repeated_flip) throw new Error('Should not be marked as repeated flip');
});

// 5. Stale belief detection
test('detectStaleBeliefs flags beliefs older than 7 days', () => {
  fs.writeFileSync(TLOG, '');
  // Write a stale belief directly (10 days old)
  const staleAt = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString();
  const fd = fs.openSync(TLOG, 'a');
  fs.writeSync(fd, JSON.stringify({
    type: 'BELIEF_CONTINUITY', continuity_id: 'stale001', entity_type: ETYPE.BELIEF,
    entity_id: 'old-belief-1', predicate: 'pi_estimate', object_value: 3.14,
    belief_system: 'MATH', asserted_at: staleAt, last_verified_at: staleAt,
    evidence_ref: null, stability_tag: null, stale: false
  }) + '\n');
  fs.closeSync(fd);
  const stale = detectStaleBeliefs();
  if (stale.length !== 1) throw new Error(`Expected 1 stale belief, got: ${stale.length}`);
  if (stale[0].entity_id !== 'old-belief-1') throw new Error('Wrong entity_id');
});

// 6. Lifecycle duration tracking
test('trackCommitmentLifecycle computes lifecycle days correctly', () => {
  fs.writeFileSync(TLOG, '');
  const cid = 'lifecycle-test-1';
  const createdAt = new Date(Date.now() - (5 * 24 * 60 * 60 * 1000)).toISOString();
  const completedAt = new Date().toISOString();
  // Simulate lifecycle events
  const events = [
    { event_type: 'CREATED', event_at: createdAt },
    { event_type: 'STATUS_CHANGED', event_at: new Date(Date.now() - (3 * 24 * 60 * 60 * 1000)).toISOString() },
    { event_type: 'COMPLETED', event_at: completedAt }
  ];
  const fd = fs.openSync(TLOG, 'a');
  events.forEach((ev, i) => {
    fs.writeSync(fd, JSON.stringify({
      type: 'COMMITMENT_LIFECYCLE', lifecycle_id: `lifecycle-${i}`,
      entity_type: ETYPE.COMMITMENT, commitment_id: cid, owner: 'TEST', intent: 'Test task',
      event_type: ev.event_type, event_value: null, deadline: null, event_at: ev.event_at
    }) + '\n');
  });
  fs.closeSync(fd);

  const result = trackCommitmentLifecycle(cid);
  if (!result) throw new Error('Should return lifecycle data');
  if (result.terminal_event !== 'COMPLETED') throw new Error(`Expected COMPLETED, got: ${result.terminal_event}`);
  if (result.lifecycle_days < 4 || result.lifecycle_days > 6) throw new Error(`lifecycle_days out of range: ${result.lifecycle_days}`);
});

// 7. Verification freshness tracking
test('trackVerificationFreshness returns correct freshness_tag', () => {
  const result = trackVerificationFreshness('ac9a02665067');
  if (!result) throw new Error('Should return freshness data for known verification_id');
  if (!['FRESH', 'STALE', 'EXPIRED', 'UNVERIFIED'].includes(result.freshness_tag)) {
    throw new Error(`Invalid freshness_tag: ${result.freshness_tag}`);
  }
  if (!result.age_ms || result.age_ms < 0) throw new Error('age_ms should be positive');
});

test('trackVerificationFreshness returns null for unknown ID', () => {
  const result = trackVerificationFreshness('nonexistent-id-xyz');
  if (result !== null) throw new Error('Should return null for unknown ID');
});

// 8. Entity stability rate
test('computeEntityStability returns stable=true for low-change entities', () => {
  fs.writeFileSync(TLOG, '');
  const eid = 'stable-entity-2';
  recordStateChange({ entity_type: ETYPE.BELIEF, entity_id: eid, field: 'status', old_value: 'A', new_value: 'B' });
  const result = computeEntityStability(eid);
  if (result.stable !== true) throw new Error(`Expected stable=true, got: ${result.stable}`);
  if (result.change_count !== 1) throw new Error(`Expected change_count=1, got: ${result.change_count}`);
});

test('computeEntityStability returns stable=false for high-change entities', () => {
  const eid = 'unstable-entity-1';
  for (let i = 0; i < 5; i++) {
    recordStateChange({ entity_type: ETYPE.BELIEF, entity_id: eid, field: 'status', old_value: `${i}`, new_value: `${i+1}` });
  }
  const result = computeEntityStability(eid);
  if (result.stable !== false) throw new Error(`Expected stable=false, got: ${result.stable}`);
});

// 9. Append-only log preserved
test('Temporal log is append-only — new entries only appended', () => {
  fs.writeFileSync(TLOG, '');
  const linesBefore = fs.readFileSync(TLOG, 'utf8').trim().split('\n').filter(Boolean).length;
  recordStateChange({ entity_type: ETYPE.BELIEF, entity_id: 'appendant-test', field: 'state', old_value: 'A', new_value: 'B' });
  const linesAfter = fs.readFileSync(TLOG, 'utf8').trim().split('\n').filter(Boolean).length;
  if (linesAfter !== linesBefore + 1) throw new Error('Should only append one line');
});

// 10. Audit log entries emitted
test('Audit entries emitted for STATE_CHANGED, BELIEF_RECORDED, COMMITMENT_LIFECYCLE', () => {
  fs.writeFileSync(TLOG, '');
  fs.writeFileSync(AUDIT, '');
  recordStateChange({ entity_type: ETYPE.BELIEF, entity_id: 'audit-test', field: 'status', old_value: 'A', new_value: 'B' });
  recordBelief({ entity_id: 'audit-test-belief', predicate: 'test_predicate', object_value: true });
  recordCommitmentLifecycle({ commitment_id: 'audit-lifecycle-test', owner: 'TEST', intent: 'Audit test', event_type: 'CREATED', event_value: 'PENDING', deadline: '2026-12-01T00:00:00Z' });
  const auditContent = fs.readFileSync(AUDIT, 'utf8').trim();
  const auditEntries = auditContent.split('\n').filter(Boolean).map(JSON.parse);
  const actions = auditEntries.map(e => e.action);
  if (!actions.includes('STATE_CHANGED')) throw new Error('Missing STATE_CHANGED audit');
  if (!actions.includes('BELIEF_RECORDED')) throw new Error('Missing BELIEF_RECORDED audit');
  if (!actions.includes('COMMITMENT_LIFECYCLE')) throw new Error('Missing COMMITMENT_LIFECYCLE audit');
});

// 11. Snapshot writes correct file
test('Continuity snapshot writes to correct date-stamped path', () => {
  const snapPath = takeContinuitySnapshot();
  const date = new Date().toISOString().slice(0, 10);
  if (!snapPath.includes(`continuity-${date}.json`)) throw new Error(`Path should contain continuity-YYYY-MM-DD.json, got: ${snapPath}`);
  if (!fs.existsSync(snapPath)) throw new Error('Snapshot not created');
  const data = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
  if (!Array.isArray(data.entries)) throw new Error('Snapshot missing entries');
});

// 12. Metrics computed correctly
test('getContinuityMetrics returns all required metric fields', () => {
  const m = getContinuityMetrics();
  const required = [
    'entity_stability_rate', 'belief_stability_rate', 'repeated_flip_count',
    'stale_truth_claims', 'average_commitment_lifecycle_time', 'verification_freshness_rate'
  ];
  for (const field of required) {
    if (!(field in m)) throw new Error(`Missing metric: ${field}`);
  }
  if (typeof m.entity_stability_rate !== 'number') throw new Error('entity_stability_rate must be a number');
  if (typeof m.belief_stability_rate !== 'number') throw new Error('belief_stability_rate must be a number');
  if (typeof m.repeated_flip_count !== 'number') throw new Error('repeated_flip_count must be a number');
  if (typeof m.stale_truth_claims !== 'number') throw new Error('stale_truth_claims must be a number');
});

// 13. Orphan detection
test('detectOrphanedContinuityRecords identifies records without matching commitment/verification', () => {
  fs.writeFileSync(TLOG, '');
  // Write a record for a non-existent commitment
  const fd = fs.openSync(TLOG, 'a');
  fs.writeSync(fd, JSON.stringify({
    type: 'COMMITMENT_LIFECYCLE', lifecycle_id: 'orphan-lifecycle',
    entity_type: ETYPE.COMMITMENT, commitment_id: 'nonexistent-commitment',
    owner: 'TEST', intent: 'Orphan task', event_type: 'CREATED',
    event_value: null, deadline: null, event_at: new Date().toISOString()
  }) + '\n');
  fs.closeSync(fd);
  // commitments log is empty (or doesn't have this CID)
  const orphans = detectOrphanedContinuityRecords();
  if (orphans.length !== 1) throw new Error(`Expected 1 orphan, got: ${orphans.length}`);
  if (!orphans.includes('orphan-lifecycle')) throw new Error('Should detect orphan-lifecycle');
});

console.log(`\n${passed} passed / ${failed} failed\n`);

// Sample continuity records
console.log('=== Sample Continuity Records ===\n');
fs.writeFileSync(TLOG, '');
fs.writeFileSync(AUDIT, '');

// Belief record
recordBelief({
  entity_id: 'qiyadon.com',
  predicate: 'website_operational',
  object_value: true,
  belief_system: 'INFRA',
  evidence_ref: 'state/operational-state.json'
});

// Belief flip
recordBelief({
  entity_id: 'qiyadon-pipeline',
  predicate: 'leak_identified',
  object_value: false,
  belief_system: 'PIPELINE'
});

// Repeated flips on a commitment
const flipEntity = 'c001-flagship';
recordStateChange({ entity_type: ETYPE.COMMITMENT, entity_id: flipEntity, field: 'status', old_value: 'PENDING', new_value: 'IN_PROGRESS' });
recordStateChange({ entity_type: ETYPE.COMMITMENT, entity_id: flipEntity, field: 'status', old_value: 'IN_PROGRESS', new_value: 'PENDING' });
recordStateChange({ entity_type: ETYPE.COMMITMENT, entity_id: flipEntity, field: 'status', old_value: 'PENDING', new_value: 'IN_PROGRESS' });

// Commitment lifecycle
const lifecycleCid = 'd455c15787dd';
recordCommitmentLifecycle({
  commitment_id: lifecycleCid,
  owner: 'CMO',
  intent: 'Deliver Q1 LinkedIn content calendar',
  event_type: 'CREATED',
  event_value: 'PENDING',
  deadline: '2026-03-31T00:00:00Z'
});

// Verification freshness record
recordVerificationFreshness({
  verification_id: 'ac9a02665067',
  commitment_id: 'a081a5818a86',
  verification_status: 'VERIFIED',
  age_ms: 3600000,
  freshness_tag: 'FRESH'
});

const entries = readTLog();
entries.forEach(e => console.log(JSON.stringify(e, null, 2)));

console.log('\n=== Metrics ===\n');
const metrics = getContinuityMetrics();
console.log(JSON.stringify(metrics, null, 2));

console.log('\n=== Phase 3C Status: COMPLETE ✅ ===\n');
process.exit(failed > 0 ? 1 : 0);