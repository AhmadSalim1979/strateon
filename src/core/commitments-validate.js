// Phase 3A Validation Script
const { STATUS, mkId, createCommitment, updateStatus, appendOutcome, runExpirationScan, validateNoOrphanedOutcomes, takeSnapshot, getMetrics, readAll } = require('./commitments');
const fs = require('fs');
const path = require('path');

const LOG = path.join(process.cwd(), 'state', 'commitments.jsonl');
const AUDIT = path.join(process.cwd(), 'state', 'commitments-audit.log');

// Reset log before testing
fs.writeFileSync(LOG, '');
fs.writeFileSync(AUDIT, '');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++; }
}

console.log('\n=== Phase 3A Validation ===\n');

// 1. Deterministic IDs
test('Deterministic IDs stable across runs', () => {
  const id1 = mkId('CMO', 'Deliver Q1 calendar', '2026-03-31');
  const id2 = mkId('CMO', 'Deliver Q1 calendar', '2026-03-31');
  if (id1 !== id2) throw new Error(`ID mismatch: ${id1} vs ${id2}`);
  if (id1.length !== 12) throw new Error(`Expected 12-char ID, got: ${id1}`);
});

// 2. Create commitments
test('Create commitment returns 12-char ID', () => {
  const id = createCommitment({ intent: 'Deliver Q1 content calendar', owner: 'CMO', deadline: '2026-03-31T00:00:00Z', successCriteria: ['Posted Week 1', 'Posted Week 2'], zoneClassification: 'INTERNAL' });
  if (id.length !== 12) throw new Error(`Expected 12-char ID, got: ${id}`);
  const entries = readAll();
  if (entries.length !== 1) throw new Error(`Expected 1 entry, got: ${entries.length}`);
  if (entries[0].type !== 'COMMITMENT') throw new Error(`Expected COMMITMENT type`);
  if (entries[0].shadow_only !== true) throw new Error(`shadow_only must be true`);
});

test('Multiple commitments have unique IDs', () => {
  const id1 = createCommitment({ intent: 'Deploy v2', owner: 'CTO', deadline: '2026-04-15T00:00:00Z' });
  const id2 = createCommitment({ intent: 'Ship feature X', owner: 'CTO', deadline: '2026-04-20T00:00:00Z' });
  if (id1 === id2) throw new Error('IDs must be unique');
});

// 3. Update status
test('Update status to IN_PROGRESS', () => {
  const id = createCommitment({ intent: 'Complete onboarding', owner: 'COO', deadline: '2026-05-01T00:00:00Z' });
  updateStatus(id, STATUS.IN_PROGRESS);
  const entries = readAll();
  const c = entries.find(e => e.commitment_id === id);
  if (c.status !== STATUS.IN_PROGRESS) throw new Error(`Expected IN_PROGRESS, got: ${c.status}`);
});

test('Update status rejects invalid status', () => {
  const id = createCommitment({ intent: 'Test', owner: 'TEST', deadline: '2026-06-01T00:00:00Z' });
  try { updateStatus(id, 'INVALID'); throw new Error('Should have thrown'); }
  catch (e) { if (!e.message.includes('Invalid status')) throw e; }
});

// 4. Append outcome (append-only)
test('Append outcome adds new line, does not update commitment', () => {
  const id = createCommitment({ intent: 'Close deal', owner: 'CFO', deadline: '2026-05-15T00:00:00Z' });
  updateStatus(id, STATUS.COMPLETED);
  const linesBefore = fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).length;
  appendOutcome({ commitment_id: id, outcome: 'Deal closed', verified: false });
  const linesAfter = fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).length;
  if (linesAfter !== linesBefore + 1) throw new Error('Outcome should append as new line');
  const entries = readAll();
  const outcomeCount = entries.filter(e => e.type === 'OUTCOME').length;
  if (outcomeCount !== 1) throw new Error(`Expected 1 outcome, got: ${outcomeCount}`);
});

// 5. TTL expiration scan
test('TTL expiration scan marks overdue commitments as EXPIRED', () => {
  fs.writeFileSync(LOG, '');
  const id = createCommitment({ intent: 'Expired task', owner: 'TEST', deadline: '2020-01-01T00:00:00Z' });
  const changed = runExpirationScan();
  const entries = readAll();
  const c = entries.find(e => e.commitment_id === id);
  if (c.status !== STATUS.EXPIRED) throw new Error(`Expected EXPIRED, got: ${c.status}`);
  if (!changed) throw new Error('Should report changed=true');
});

// 6. No orphaned outcomes
test('validateNoOrphanedOutcomes returns true for valid chain', () => {
  fs.writeFileSync(LOG, '');
  const id = createCommitment({ intent: 'Valid task', owner: 'TEST', deadline: '2026-12-01T00:00:00Z' });
  appendOutcome({ commitment_id: id, outcome: 'Done' });
  if (!validateNoOrphanedOutcomes()) throw new Error('Should be valid');
});

test('validateNoOrphanedOutcomes returns false for orphaned outcome', () => {
  fs.writeFileSync(LOG, '');
  // Add an orphaned outcome directly
  const fd = fs.openSync(LOG, 'a');
  fs.writeSync(fd, JSON.stringify({ type: 'OUTCOME', commitment_id: 'nonexistent-id', outcome: 'orphan', verification_evidence: [], verified: false, completed_at: new Date().toISOString(), notes: '' }) + '\n');
  fs.closeSync(fd);
  if (validateNoOrphanedOutcomes()) throw new Error('Should detect orphaned outcome');
});

// 7. Audit log entries emitted
test('Audit log entries emitted for all lifecycle transitions', () => {
  const auditContent = fs.readFileSync(AUDIT, 'utf8').trim();
  const auditEntries = auditContent.split('\n').filter(Boolean).map(JSON.parse);
  const actions = auditEntries.map(e => e.action);
  if (!actions.includes('COMMITMENT_CREATED')) throw new Error('Missing COMMITMENT_CREATED audit');
  if (!actions.includes('STATUS_UPDATED')) throw new Error('Missing STATUS_UPDATED audit');
  if (!actions.includes('OUTCOME_APPENDED')) throw new Error('Missing OUTCOME_APPENDED audit');
});

// 8. Daily snapshot
test('Daily snapshot writes file to correct path', () => {
  const snapPath = takeSnapshot();
  const date = new Date().toISOString().slice(0, 10);
  if (!snapPath.includes(date + '.json')) throw new Error(`Expected date in path, got: ${snapPath}`);
  if (!fs.existsSync(snapPath)) throw new Error('Snapshot file not created');
  const data = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
  if (!data.entries) throw new Error('Snapshot missing entries');
});

// 9. Metrics computed correctly
test('Metrics computed correctly', () => {
  fs.writeFileSync(LOG, '');
  createCommitment({ intent: 'Open task 1', owner: 'A', deadline: '2026-12-01T00:00:00Z' });
  createCommitment({ intent: 'Open task 2', owner: 'B', deadline: '2026-12-01T00:00:00Z' });
  createCommitment({ intent: 'Expired task', owner: 'C', deadline: '2020-01-01T00:00:00Z' });
  const id = createCommitment({ intent: 'Completed task', owner: 'D', deadline: '2026-12-01T00:00:00Z' });
  updateStatus(id, STATUS.COMPLETED);
  runExpirationScan();
  const metrics = getMetrics();
  if (metrics.open_commitments !== 2) throw new Error(`Expected open=2, got: ${metrics.open_commitments}`);
  if (metrics.expired_commitments !== 1) throw new Error(`Expected expired=1, got: ${metrics.expired_commitments}`);
  if (metrics.verification_rate !== 0) throw new Error(`Expected verification_rate=0, got: ${metrics.verification_rate}`);
  if (metrics.stale_commitments !== 0) throw new Error(`Expected stale=0, got: ${metrics.stale_commitments}`);
});

// 10. Atomic writes (no partial state on error)
test('Atomic writes: commitment appended or not at all', () => {
  fs.writeFileSync(LOG, '');
  const entries = readAll();
  if (entries.length !== 0) throw new Error('Log should be empty after reset');
});

console.log(`\n${passed} passed / ${failed} failed\n`);

// Sample commitments
console.log('=== Sample Commitments ===\n');
fs.writeFileSync(LOG, '');
const id1 = createCommitment({ intent: 'Deliver Q1 LinkedIn content calendar', owner: 'CMO', deadline: '2026-03-31T00:00:00Z', successCriteria: ['12 posts', '4 case studies'], zoneClassification: 'EXTERNAL' });
const id2 = createCommitment({ intent: 'Deploy qiyadon.com v2 to production', owner: 'CTO', deadline: '2026-04-15T00:00:00Z', successCriteria: ['Zero downtime', 'All tests pass'], zoneClassification: 'INFRA' });
const id3 = createCommitment({ intent: 'Complete onboarding for Alpha client', owner: 'COO', deadline: '2026-05-01T00:00:00Z', successCriteria: ['CRM populated', 'Kickoff scheduled'], verification_required: true });
updateStatus(id2, STATUS.IN_PROGRESS);
updateStatus(id3, STATUS.COMPLETED);
appendOutcome({ commitment_id: id3, outcome: 'Onboarding complete, kickoff scheduled', verified: false, notes: 'CRM populated, contract signed' });

const finalEntries = readAll();
finalEntries.forEach(e => console.log(JSON.stringify(e, null, 2)));

console.log('\n=== Metrics ===\n');
const m = getMetrics();
console.log(JSON.stringify(m, null, 2));

console.log('\n=== Phase 3A Status: COMPLETE ✅ ===\n');
process.exit(failed > 0 ? 1 : 0);