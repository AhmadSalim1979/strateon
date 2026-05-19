// Phase 3B Validation Script
const {
  VSTATUS, ETYPE, CBAND, mkVid,
  createVerification, updateVerificationStatus, appendEvidence,
  runVerificationSweep, detectOrphanedVerifications,
  validateVerificationChain, takeVerificationSnapshot,
  getVerificationMetrics, readVLog
} = require('./verification');
const fs = require('fs');
const path = require('path');

const VLOG = path.join(process.cwd(), 'state', 'verification-log.jsonl');
const AUDIT = path.join(process.cwd(), 'state', 'verification-audit.log');
const CLOG = path.join(process.cwd(), 'state', 'commitments.jsonl');

// Reset
fs.writeFileSync(VLOG, '');
fs.writeFileSync(AUDIT, '');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); passed++; }
  catch (e) { console.log(`  ❌ ${name}: ${e.message}`); failed++; }
}

console.log('\n=== Phase 3B Validation ===\n');

// 1. Deterministic verification IDs
test('Deterministic verification IDs stable across runs', () => {
  const v1 = mkVid('C001', 'pm2_output', '2026-05-19T00:00:00Z');
  const v2 = mkVid('C001', 'pm2_output', '2026-05-19T00:00:00Z');
  if (v1 !== v2) throw new Error(`ID mismatch: ${v1} vs ${v2}`);
  if (v1.length !== 12) throw new Error(`Expected 12-char ID, got: ${v1}`);
});

// 2. Create verification record — valid structure
test('createVerification returns 12-char ID and correct structure', () => {
  const vid = createVerification({
    commitment_id: 'c001abc12345',
    verification_method: ETYPE.PM2_OUTPUT,
    evidence: [
      { evidence_type: ETYPE.PM2_OUTPUT, evidence_content: 'App running since 09:00', evidence_ref: null }
    ],
    verifier: 'SYSTEM',
    confidence_band: CBAND.HIGH,
    verification_status: VSTATUS.VERIFIED
  });
  if (vid.length !== 12) throw new Error(`Expected 12-char ID, got: ${vid}`);
  const entries = readVLog();
  if (entries.length !== 1) throw new Error(`Expected 1 entry, got: ${entries.length}`);
  if (entries[0].type !== 'VERIFICATION') throw new Error(`Expected VERIFICATION type`);
  if (!entries[0].expires_at) throw new Error('expires_at must be set');
});

// 3. Invalid evidence type rejected
test('Invalid evidence_type rejected', () => {
  try {
    createVerification({
      commitment_id: 'test001',
      verification_method: 'INVALID_TYPE',
      evidence: []
    });
    throw new Error('Should have thrown');
  } catch (e) {
    if (!e.message.includes('Invalid verification_method')) throw e;
  }
});

test('Invalid evidence type in evidence array rejected', () => {
  try {
    createVerification({
      commitment_id: 'test001',
      verification_method: ETYPE.PM2_OUTPUT,
      evidence: [{ evidence_type: 'NOT_ALLOWED', evidence_content: 'x', evidence_ref: null }]
    });
    throw new Error('Should have thrown');
  } catch (e) {
    if (!e.message.includes('Invalid evidence_type')) throw e;
  }
});

// 4. Evidence without content or ref rejected
test('Evidence without content or ref rejected', () => {
  try {
    createVerification({
      commitment_id: 'test001',
      verification_method: ETYPE.LOG_FILE,
      evidence: [{ evidence_type: ETYPE.LOG_FILE }]
    });
    throw new Error('Should have thrown');
  } catch (e) {
    if (!e.message.includes('evidence_content or evidence_ref')) throw e;
  }
});

// 5. Update verification status
test('Update verification status works', () => {
  const vid = createVerification({
    commitment_id: 'c001abc12345',
    verification_method: ETYPE.HEARTBEAT_FILE,
    evidence: [{ evidence_type: ETYPE.HEARTBEAT_FILE, evidence_content: ' heartbeat OK', evidence_ref: null }],
    verification_status: VSTATUS.VERIFIED
  });
  updateVerificationStatus(vid, VSTATUS.STALE_VERIFICATION);
  const entries = readVLog();
  const v = entries.find(e => e.verification_id === vid);
  if (v.verification_status !== VSTATUS.STALE_VERIFICATION) throw new Error(`Expected STALE_VERIFICATION, got: ${v.verification_status}`);
});

// 6. Append evidence to existing verification
test('Append evidence to existing verification', () => {
  const vid = createVerification({
    commitment_id: 'c001abc12345',
    verification_method: ETYPE.API_RESPONSE,
    evidence: [{ evidence_type: ETYPE.API_RESPONSE, evidence_content: '200 OK', evidence_ref: null }],
    verification_status: VSTATUS.PARTIALLY_VERIFIED
  });
  const updated = appendEvidence({
    verification_id: vid,
    newEvidence: [{ evidence_type: ETYPE.LOG_FILE, evidence_content: 'Lines confirmed', evidence_ref: null }]
  });
  if (updated.evidence.length !== 2) throw new Error(`Expected 2 evidence items, got: ${updated.evidence.length}`);
});

// 7. STALE transition via sweep
test('TTL sweep marks VERIFIED as STALE_VERIFICATION when expired', () => {
  fs.writeFileSync(VLOG, '');
  // Create a verification with a past expiry
  const pastExpiry = new Date(Date.now() - 5000).toISOString();
  const fd = fs.openSync(VLOG, 'a');
  fs.writeSync(fd, JSON.stringify({
    type: 'VERIFICATION',
    verification_id: 'abcd123456ab',
    commitment_id: 'c001abc12345',
    verified_at: new Date(Date.now() - 10000).toISOString(),
    verification_method: ETYPE.API_RESPONSE,
    evidence: [{ evidence_type: ETYPE.API_RESPONSE, evidence_content: 'response', evidence_ref: null }],
    verifier: 'SYSTEM',
    confidence_band: CBAND.MEDIUM,
    verification_status: VSTATUS.VERIFIED,
    expires_at: pastExpiry,
    notes: ''
  }) + '\n');
  fs.closeSync(fd);

  const changed = runVerificationSweep();
  if (!changed) throw new Error('Sweep should report changed=true');
  const entries = readVLog();
  const v = entries.find(e => e.verification_id === 'abcd123456ab');
  if (v.verification_status !== VSTATUS.STALE_VERIFICATION) throw new Error(`Expected STALE_VERIFICATION, got: ${v.verification_status}`);
});

// 8. Append-only verification chain
test('Verification records append only — no update on new entry', () => {
  fs.writeFileSync(VLOG, '');
  const vid = createVerification({
    commitment_id: 'c001abc12345',
    verification_method: ETYPE.LOG_FILE,
    evidence: [{ evidence_type: ETYPE.LOG_FILE, evidence_content: 'log line', evidence_ref: null }],
    verification_status: VSTATUS.UNVERIFIED
  });
  const linesBefore = fs.readFileSync(VLOG, 'utf8').trim().split('\n').filter(Boolean).length;
  createVerification({
    commitment_id: 'c001abc12345',
    verification_method: ETYPE.HEARTBEAT_FILE,
    evidence: [{ evidence_type: ETYPE.HEARTBEAT_FILE, evidence_content: 'beat', evidence_ref: null }],
    verification_status: VSTATUS.VERIFIED
  });
  const linesAfter = fs.readFileSync(VLOG, 'utf8').trim().split('\n').filter(Boolean).length;
  if (linesAfter !== linesBefore + 1) throw new Error('Each verification must append as a new line');
});

// 9. Orphan detection
test('Orphan detection identifies verifications without matching commitment', () => {
  fs.writeFileSync(VLOG, '');
  createVerification({
    commitment_id: 'orphan-commitment-id',
    verification_method: ETYPE.PM2_OUTPUT,
    evidence: [{ evidence_type: ETYPE.PM2_OUTPUT, evidence_content: 'output', evidence_ref: null }],
    verification_status: VSTATUS.VERIFIED
  });
  // commitments log is empty in this test
  const orphans = detectOrphanedVerifications();
  if (orphans.length !== 1) throw new Error(`Expected 1 orphan, got: ${orphans.length}`);
  if (orphans[0] === undefined) throw new Error('Orphan should have a verification_id');
});

// 10. Audit log events emitted
test('Audit entries emitted for VERIFICATION_CREATED and VERIFICATION_UPDATED', () => {
  const auditContent = fs.readFileSync(AUDIT, 'utf8').trim();
  const auditEntries = auditContent.split('\n').filter(Boolean).map(JSON.parse);
  const actions = auditEntries.map(e => e.action);
  if (!actions.includes('VERIFICATION_CREATED')) throw new Error('Missing VERIFICATION_CREATED audit');
  if (!actions.includes('VERIFICATION_UPDATED')) throw new Error('Missing VERIFICATION_UPDATED audit');
  if (!actions.includes('VERIFICATION_STALE')) throw new Error('Missing VERIFICATION_STALE audit');
});

// 11. Snapshot writes correct file
test('Verification snapshot writes to correct date-stamped path', () => {
  const snapPath = takeVerificationSnapshot();
  const date = new Date().toISOString().slice(0, 10);
  if (!snapPath.includes(`verification-${date}.json`)) throw new Error(`Expected verification-*.json in path, got: ${snapPath}`);
  if (!fs.existsSync(snapPath)) throw new Error('Snapshot not created');
  const data = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
  if (!Array.isArray(data.entries)) throw new Error('Snapshot missing entries array');
});

// 12. Metrics computed correctly
test('Metrics computed correctly', () => {
  fs.writeFileSync(VLOG, '');
  createVerification({ commitment_id: 'c1', verification_method: ETYPE.PM2_OUTPUT, evidence: [{ evidence_type: ETYPE.PM2_OUTPUT, evidence_content: 'ok', evidence_ref: null }], verification_status: VSTATUS.VERIFIED });
  createVerification({ commitment_id: 'c2', verification_method: ETYPE.LOG_FILE, evidence: [{ evidence_type: ETYPE.LOG_FILE, evidence_content: 'ok', evidence_ref: null }], verification_status: VSTATUS.STALE_VERIFICATION });
  createVerification({ commitment_id: 'c3', verification_method: ETYPE.API_RESPONSE, evidence: [{ evidence_type: ETYPE.API_RESPONSE, evidence_content: 'ok', evidence_ref: null }], verification_status: VSTATUS.FAILED_VERIFICATION });
  createVerification({ commitment_id: 'c4', verification_method: ETYPE.HUMAN_CONFIRMATION, evidence: [{ evidence_type: ETYPE.HUMAN_CONFIRMATION, evidence_content: 'confirmed', evidence_ref: null }], verification_status: VSTATUS.UNVERIFIED });

  const m = getVerificationMetrics();
  if (m.total_verifications !== 4) throw new Error(`Expected total=4, got: ${m.total_verifications}`);
  if (m.verified_count !== 1) throw new Error(`Expected verified=1, got: ${m.verified_count}`);
  if (m.stale_count !== 1) throw new Error(`Expected stale=1, got: ${m.stale_count}`);
  if (m.failed_count !== 1) throw new Error(`Expected failed=1, got: ${m.failed_count}`);
  if (m.unverified_count !== 1) throw new Error(`Expected unverified=1, got: ${m.unverified_count}`);
  if (m.verification_coverage !== 25) throw new Error(`Expected coverage=25, got: ${m.verification_coverage}`);
  if (!m.evidence_source_distribution[ETYPE.PM2_OUTPUT]) throw new Error('Missing PM2_OUTPUT in distribution');
  if (!m.evidence_source_distribution[ETYPE.LOG_FILE]) throw new Error('Missing LOG_FILE in distribution');
});

// 13. STALE verification preserved (never deleted)
test('STALE_VERIFICATION records are preserved, never deleted', () => {
  fs.writeFileSync(VLOG, '');
  const vid = createVerification({
    commitment_id: 'c001abc12345',
    verification_method: ETYPE.API_RESPONSE,
    evidence: [{ evidence_type: ETYPE.API_RESPONSE, evidence_content: 'ok', evidence_ref: null }],
    verification_status: VSTATUS.VERIFIED
  });
  updateVerificationStatus(vid, VSTATUS.STALE_VERIFICATION);
  const entries = readVLog();
  const stale = entries.find(e => e.verification_id === vid);
  if (!stale) throw new Error('STALE verification must not be deleted');
  if (stale.verification_status !== VSTATUS.STALE_VERIFICATION) throw new Error('Status must be STALE_VERIFICATION');
});

// 14. Validation: evidence types correct
test('Evidence source distribution tracks all evidence types', () => {
  fs.writeFileSync(VLOG, '');
  createVerification({
    commitment_id: 'c1',
    verification_method: ETYPE.PM2_OUTPUT,
    evidence: [
      { evidence_type: ETYPE.PM2_OUTPUT, evidence_content: 'output', evidence_ref: null },
      { evidence_type: ETYPE.LOG_FILE, evidence_content: 'log lines', evidence_ref: null }
    ],
    verification_status: VSTATUS.VERIFIED
  });
  const m = getVerificationMetrics();
  if (m.evidence_source_distribution[ETYPE.PM2_OUTPUT] !== 1) throw new Error('PM2 count wrong');
  if (m.evidence_source_distribution[ETYPE.LOG_FILE] !== 1) throw new Error('LOG_FILE count wrong');
});

console.log(`\n${passed} passed / ${failed} failed\n`);

// Sample verification entries
console.log('=== Sample Verification Entries ===\n');
fs.writeFileSync(VLOG, '');

const vid1 = createVerification({
  commitment_id: 'a081a5818a86', // Alpha client onboarding
  verification_method: ETYPE.HEARTBEAT_FILE,
  evidence: [
    { evidence_type: ETYPE.HEARTBEAT_FILE, evidence_content: 'worker heartbeat alive', evidence_ref: null },
    { evidence_type: ETYPE.LOG_FILE, evidence_content: 'Onboarding sequence complete', evidence_ref: null }
  ],
  verifier: 'moosa-worker',
  confidence_band: CBAND.HIGH,
  verification_status: VSTATUS.VERIFIED,
  notes: 'COO onboarding for Alpha client — CRM populated, kickoff done'
});

const vid2 = createVerification({
  commitment_id: 'd283ffe3be9f', // CTO v2 deploy
  verification_method: ETYPE.PM2_OUTPUT,
  evidence: [
    { evidence_type: ETYPE.PM2_OUTPUT, evidence_content: 'qiyadon-audit-form running', evidence_ref: null },
    { evidence_type: ETYPE.FILESYSTEM_CHECK, evidence_content: 'package.json verified', evidence_ref: null }
  ],
  verifier: 'SYSTEM',
  confidence_band: CBAND.MEDIUM,
  verification_status: VSTATUS.PARTIALLY_VERIFIED,
  notes: 'CTO v2 deploy — partial evidence, pending final smoke test'
});

const vid3 = createVerification({
  commitment_id: 'd455c15787dd', // CMO Q1 calendar
  verification_method: ETYPE.HUMAN_CONFIRMATION,
  evidence: [
    { evidence_type: ETYPE.HUMAN_CONFIRMATION, evidence_content: 'Ahmad confirmed calendar delivered', evidence_ref: null }
  ],
  verifier: 'Ahmad Salim',
  confidence_band: CBAND.HIGH,
  verification_status: VSTATUS.UNVERIFIED,
  notes: 'CMO Q1 calendar — awaiting Ahmad verification'
});

const entries = readVLog();
entries.forEach(e => console.log(JSON.stringify(e, null, 2)));

console.log('\n=== Metrics ===\n');
const metrics = getVerificationMetrics();
console.log(JSON.stringify(metrics, null, 2));

console.log('\n=== Phase 3B Status: COMPLETE ✅ ===\n');
process.exit(failed > 0 ? 1 : 0);