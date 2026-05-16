/**
 * EEL Phase E2 Tests — Output Layer Integration
 * 
 * Tests:
 * 1. Sensitive operational facts are blocked before output
 * 2. Non-sensitive facts are labeled (not blocked)
 * 3. Expired runtime commands are blocked
 * 4. Alert destinations from text are blocked
 * 5. Credentials referenced in text are blocked
 * 6. VERIFIED with fresh runtime source passes
 * 7. Malformed/future timestamps are blocked
 * 8. Email addresses are blocked (UNKNOWN)
 * 9. Approval claims are blocked
 * 10. Classification labels applied correctly
 */

const assert = require('assert');
const {
  TRUTH_STATES,
  FACT_CATEGORIES,
  EEL_ERROR_CODES,
  createProvenance,
} = require('../src/fact-classification');

const {
  eelClassify,
  RUNTIME_COMMAND_MAX_AGE_MS,
} = require('../src/eel-gate');

const {
  sanitizeOutput,
  classifyOutputFact,
  extractFacts,
  isOutputSensitive,
  STATE_LABELS,
} = require('../src/eel-output-sanitizer.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('✅', name);
    passed++;
  } catch (e) {
    console.log('❌', name);
    console.log('   Error:', e.message);
    failed++;
  }
}

function assertBlocked(result, expectedCode) {
  assert.strictEqual(result.allowed, false, `Expected blocked but got allowed=true`);
  if (expectedCode) {
    assert.strictEqual(result.error_code, expectedCode, `Expected ${expectedCode} but got ${result.error_code}`);
  }
}

function assertAllowed(result) {
  assert.strictEqual(result.allowed, true, `Expected allowed but got allowed=false (${result.error_code})`);
}

// ============================================
// SECTION 1: SENSITIVE FACTS BLOCKED IN OUTPUT
// ============================================
console.log('\nSection 1: Sensitive Facts Blocked in Output');

test('Email address (alert_destination) in output text — BLOCKED', () => {
  const r = sanitizeOutput('Sending alerts to ahmad@salim.pk');
  assert.strictEqual(r.blockedFacts.length >= 1, true, 'Should block alert_destination');
  const ad = r.blockedFacts.find(b => b.category === 'alert_destination');
  assert(ad, 'Should have alert_destination in blockedFacts');
  assert.strictEqual(ad.error_code, 'EEL_UNKNOWN_BLOCKED');
});

test('Approval claim (ahmad approved) — BLOCKED', () => {
  const r = sanitizeOutput('Ahmad approved the action');
  const approval = r.blockedFacts.find(b => b.category === 'approval');
  assert(approval, 'Should block approval category');
});

test('Credential reference in text (SMTP password is...) — BLOCKED', () => {
  const r = sanitizeOutput('SMTP password is mysecret123');
  const cred = r.blockedFacts.find(b => b.category === 'credential');
  assert(cred, 'Should block credential');
});

test('Billing/revenue claim — BLOCKED', () => {
  // Pattern captures both "$5000" and "revenue" as billing facts
  const r = sanitizeOutput('Revenue is $5000 this month');
  const billing = r.blockedFacts.filter(b => b.category === 'billing');
  assert(billing.length >= 1, 'Should block at least 1 billing fact');
});

test('Account ID in text — BLOCKED', () => {
  const r = sanitizeOutput('Client account_id is abc-123');
  const aid = r.blockedFacts.find(b => b.category === 'account_id');
  assert(aid, 'Should block account_id');
});

test('Multiple sensitive facts in one message — all BLOCKED', () => {
  const r = sanitizeOutput('Alert to ahmad@salim.pk, SMTP password is secret, revenue $5000');
  const alertDest = r.blockedFacts.filter(b => b.category === 'alert_destination');
  const cred = r.blockedFacts.filter(b => b.category === 'credential');
  const billing = r.blockedFacts.filter(b => b.category === 'billing');
  assert(alertDest.length >= 1, 'Should block alert_destination');
  assert(cred.length >= 1, 'Should block credential');
  assert(billing.length >= 1, 'Should block billing');
});

// ============================================
// SECTION 2: NON-SENSITIVE FACTS — LABELLED NOT BLOCKED
// ============================================
console.log('\nSection 2: Non-Sensitive Facts Labeled (Allowed)');

test('Non-sensitive infrastructure_state — not blocked', () => {
  const r = sanitizeOutput('The server is running well');
  assert.strictEqual(r.blockedFacts.length, 0, 'Should not be blocked');
});

test('Non-sensitive process_state (runtime) — not blocked', () => {
  const r = sanitizeOutput('moosa-worker is online');
  // process_state is non-sensitive, pm2_list result should pass if fresh
  assert.strictEqual(r.blockedFacts.filter(b => b.category === 'process_state').length, 0);
});

test('Informational category with UNKNOWN — passes with warning', () => {
  const r = eelClassify({
    fact: 'The server might be running',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.UNKNOWN,
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'The server might be running',
    }),
  });
  assertAllowed(r);
  assert.strictEqual(r.state, TRUTH_STATES.UNKNOWN);
  assert(r.warnings && r.warnings.length > 0, 'Should have warning');
});

// ============================================
// SECTION 3: RUNTIME COMMAND EXPIRY
// ============================================
console.log('\nSection 3: Runtime Command Expiry');

test('Runtime command (pm2_list) — current — PASSES', () => {
  const r = eelClassify({
    fact: 'moosa-worker is online',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'pm2_list',
      timestamp: new Date().toISOString(),
      raw: 'moosa-worker online',
    }),
  });
  assertAllowed(r);
  assert.strictEqual(r.state, TRUTH_STATES.VERIFIED);
});

test('Runtime command (pm2_list) — 2min old — BLOCKED as EXPIRED', () => {
  const r = eelClassify({
    fact: 'moosa-worker is online',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'pm2_list',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      raw: 'moosa-worker online',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_FACT_EXPIRED);
});

test('Runtime command (pm2_list) — 59s old — PASSES (within window)', () => {
  const r = eelClassify({
    fact: 'moosa-worker is online',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'pm2_list',
      timestamp: new Date(Date.now() - 59000).toISOString(),
      raw: 'moosa-worker online',
    }),
  });
  assertAllowed(r);
});

test('ps_aux runtime command — 90s old — BLOCKED', () => {
  const r = eelClassify({
    fact: 'node process is running',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'ps_aux',
      timestamp: new Date(Date.now() - 90000).toISOString(),
      raw: 'node process running',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_FACT_EXPIRED);
});

test('Runtime command result (supabase_query) — expired — BLOCKED', () => {
  const r = eelClassify({
    fact: 'Task status is pending',
    category: FACT_CATEGORIES.DATA_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'supabase_query',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      raw: 'task status: pending',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_FACT_EXPIRED);
});

test('Runtime command result (curl_http) — expired — BLOCKED', () => {
  const r = eelClassify({
    fact: 'API is responding',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'curl_http',
      timestamp: new Date(Date.now() - 90000).toISOString(),
      raw: 'HTTP 200',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_FACT_EXPIRED);
});

// ============================================
// SECTION 4: TRUTH-STATE LABELS
// ============================================
console.log('\nSection 4: Truth-State Labels');

test('STATE_LABELS contains all four states', () => {
  assert(STATE_LABELS.VERIFIED, 'VERIFIED label missing');
  assert(STATE_LABELS.DERIVED, 'DERIVED label missing');
  assert(STATE_LABELS.ASSUMED, 'ASSUMED label missing');
  assert(STATE_LABELS.UNKNOWN, 'UNKNOWN label missing');
});

test('VERIFIED classification returns VERIFIED label', () => {
  const r = classifyOutputFact({
    fact: 'SMTP password is in secrets file',
    category: 'credential',
    claimedState: 'VERIFIED',
    provenance: createProvenance({
      type: 'file',
      source: 'secrets/qiyadon-email.json',
      timestamp: new Date().toISOString(),
      raw: 'SMTP_PASSWORD=...',
    }),
  });
  assertAllowed(r);
  assert.strictEqual(r.state, TRUTH_STATES.VERIFIED);
  assert(r.suggestedLabel, 'Should have a suggested label');
});

test('UNKNOWN classification — state is UNKNOWN, blocked for sensitive', () => {
  // alert_destination is sensitive — UNKNOWN blocks output
  const r = classifyOutputFact({
    fact: 'Alert destination might be ahmad@salim.pk',
    category: 'alert_destination',
    claimedState: 'UNKNOWN',
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'Alert destination might be ahmad@salim.pk',
    }),
  });
  assert.strictEqual(r.state, TRUTH_STATES.UNKNOWN);
  assert.strictEqual(r.isSensitive, true, 'alert_destination should be sensitive');
  assert.strictEqual(r.blockedForOutput, true, 'UNKNOWN for sensitive category blocks output');
  // suggestedLabel is null when allowed=false — correct behavior
  assert.strictEqual(r.suggestedLabel, null, 'suggestedLabel is null when blocked');
});

test('isOutputSensitive — credential is sensitive', () => {
  assert.strictEqual(isOutputSensitive('credential'), true);
});

test('isOutputSensitive — alert_destination is sensitive', () => {
  assert.strictEqual(isOutputSensitive('alert_destination'), true);
});

test('isOutputSensitive — approval is sensitive', () => {
  assert.strictEqual(isOutputSensitive('approval'), true);
});

test('isOutputSensitive — billing is sensitive', () => {
  assert.strictEqual(isOutputSensitive('billing'), true);
});

test('isOutputSensitive — process_state is NOT sensitive', () => {
  assert.strictEqual(isOutputSensitive('process_state'), false);
});

test('isOutputSensitive — infrastructure_state is NOT sensitive', () => {
  assert.strictEqual(isOutputSensitive('infrastructure_state'), false);
});

test('isOutputSensitive — data_state is NOT sensitive', () => {
  assert.strictEqual(isOutputSensitive('data_state'), false);
});

// ============================================
// SECTION 5: MALFORMED TIMESTAMPS BLOCKED
// ============================================
console.log('\nSection 5: Malformed Timestamps Blocked');

// NOTE: source must be registered authority path ('workspace/server.js') — not 'server.js'
test('Malformed timestamp — BLOCKED (workspace/server.js source)', () => {
  const r = eelClassify({
    fact: 'server is up',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      timestamp: 'not-a-date',
      raw: 'server runs',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_TIMESTAMP_INVALID);
});

test('Future timestamp — BLOCKED (workspace/server.js source)', () => {
  const r = eelClassify({
    fact: 'server is up',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      timestamp: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      raw: 'server runs',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_TIMESTAMP_FUTURE);
});

test('Empty timestamp — BLOCKED (workspace/server.js source)', () => {
  const r = eelClassify({
    fact: 'server is up',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      timestamp: '',
      raw: 'server runs',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_TIMESTAMP_INVALID);
});

// ============================================
// SECTION 6: EXECUTION-SENSITIVE — FAIL CLOSED
// ============================================
console.log('\nSection 6: Execution-Sensitive Fail-Closed');

test('DERIVED credential — BLOCKED for output', () => {
  const r = classifyOutputFact({
    fact: 'Test fact for credential',
    category: 'credential',
    claimedState: 'DERIVED',
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'Test fact for credential',
    }),
  });
  assert.strictEqual(r.blockedForOutput, true);
});

test('DERIVED approval — BLOCKED for output', () => {
  const r = classifyOutputFact({
    fact: 'Test fact for approval',
    category: 'approval',
    claimedState: 'DERIVED',
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'Test fact for approval',
    }),
  });
  assert.strictEqual(r.blockedForOutput, true);
});

test('DERIVED recovery_action — BLOCKED', () => {
  const r = classifyOutputFact({
    fact: 'Test fact for recovery_action',
    category: 'recovery_action',
    claimedState: 'DERIVED',
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'Test fact for recovery_action',
    }),
  });
  assert.strictEqual(r.blockedForOutput, true);
});

test('DERIVED billing — BLOCKED', () => {
  const r = classifyOutputFact({
    fact: 'Test fact for billing',
    category: 'billing',
    claimedState: 'DERIVED',
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'Test fact for billing',
    }),
  });
  assert.strictEqual(r.blockedForOutput, true);
});

test('UNKNOWN alert_destination — BLOCKED', () => {
  const r = classifyOutputFact({
    fact: 'Test fact for alert_destination',
    category: 'alert_destination',
    claimedState: 'UNKNOWN',
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'Test fact for alert_destination',
    }),
  });
  assert.strictEqual(r.blockedForOutput, true);
});

// ============================================
// SECTION 7: DERIVED WITHOUT CHAIN = BLOCKED
// ============================================
console.log('\nSection 7: DERIVED Without Chain Blocked');

test('DERIVED without chain — BLOCKED', () => {
  const r = eelClassify({
    fact: 'SMTP is configured correctly',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.DERIVED,
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'SMTP is configured correctly',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_DERIVED_WITHOUT_CHAIN);
});

test('DERIVED with valid 2-step chain — PASSES for non-sensitive category', () => {
  // Must use 'workspace/server.js' — the registered authority path
  const r = eelClassify({
    fact: 'Server has port 3001',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.DERIVED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      timestamp: new Date().toISOString(),
      raw: 'const PORT = 3001',
      chain: [
        { step: 1, fact: 'server.js contains PORT definition', source: 'workspace/server.js', timestamp: new Date().toISOString() },
        { step: 2, fact: 'PORT = 3001 from source', source: 'workspace/server.js', timestamp: new Date().toISOString() },
      ],
    }),
  });
  assertAllowed(r, 'DERIVED with chain passes for non-sensitive category');
});

// ============================================
// SECTION 8: VERIFIED PATH EXAMPLES
// ============================================
console.log('\nSection 8: VERIFIED Path Examples');

test('VERIFIED credential from secrets file — PASSES', () => {
  const r = eelClassify({
    fact: 'SMTP password is in secrets file',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'secrets/qiyadon-email.json',
      timestamp: new Date().toISOString(),
      raw: 'SMTP_PASSWORD=...',
    }),
  });
  assertAllowed(r);
  assert.strictEqual(r.state, TRUTH_STATES.VERIFIED);
});

test('VERIFIED provider from ops/PROVIDER-REGISTRY.md — PASSES', () => {
  const r = eelClassify({
    fact: 'Neo is an approved email provider',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'ops/PROVIDER-REGISTRY.md',
      timestamp: new Date().toISOString(),
      raw: 'Neo — email/SMTP provider — approved',
    }),
  });
  assertAllowed(r);
  assert.strictEqual(r.state, TRUTH_STATES.VERIFIED);
});

test('VERIFIED infrastructure_state from workspace file — PASSES', () => {
  const r = eelClassify({
    fact: 'Server runs on port 3001',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      timestamp: new Date().toISOString(),
      raw: 'const PORT = 3001',
    }),
  });
  assertAllowed(r);
  assert.strictEqual(r.state, TRUTH_STATES.VERIFIED);
});

test('VERIFIED ecosystem.config.js — infrastructure_state — PASSES', () => {
  const r = eelClassify({
    fact: 'Ecosystem config is ecosystem.config.js',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/ecosystem.config.js',
      timestamp: new Date().toISOString(),
      raw: 'module.exports = {...}',
    }),
  });
  assertAllowed(r);
});

test('VERIFIED process_state from fresh pm2_list — PASSES', () => {
  const r = eelClassify({
    fact: 'moosa-worker is online',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'pm2_list',
      timestamp: new Date().toISOString(),
      raw: 'moosa-worker online 922274',
    }),
  });
  assertAllowed(r);
  assert.strictEqual(r.state, TRUTH_STATES.VERIFIED);
});

test('VERIFIED process_state from EXPIRED pm2_list — BLOCKED', () => {
  const r = eelClassify({
    fact: 'moosa-worker is online',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'pm2_list',
      timestamp: new Date(Date.now() - 90_000).toISOString(),
      raw: 'moosa-worker online 922274',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_FACT_EXPIRED);
});

// ============================================
// SECTION 9: INTEGRATION — sanitizeOutput SCANS WHOLE TEXT
// ============================================
console.log('\nSection 9: Integration — sanitizeOutput Scans Whole Text');

test('sanitizeOutput returns sanitized text with blocked markers', () => {
  const r = sanitizeOutput('The alert destination is ahmad@salim.pk and server is up');
  const ad = r.blockedFacts.find(b => b.category === 'alert_destination');
  assert(ad, 'Should block alert_destination');
  assert(r.sanitized.includes('[EEL:BLOCKED alert_destination]'), 'Should contain block marker');
});

test('sanitizeOutput — no sensitive facts — text unchanged', () => {
  const text = 'This is a general informational message about the system.';
  const r = sanitizeOutput(text);
  assert.strictEqual(r.blockedFacts.length, 0, 'Should have no blocked facts');
  assert.strictEqual(r.sanitized, text, 'Text should be unchanged');
});

test('extractFacts — finds all fact types', () => {
  const facts = extractFacts('Alert to ahmad@salim.pk, server is up, revenue $5000');
  const categories = facts.map(f => f.category);
  assert(categories.includes('alert_destination'), 'Should find email as alert_destination');
  assert(categories.includes('infrastructure_state'), 'Should find server claim');
  assert(categories.includes('billing'), 'Should find billing claim');
});

test('classifyOutputFact — sensitive flag set correctly', () => {
  const r = classifyOutputFact({
    fact: 'Alert to ahmad@salim.pk',
    category: 'alert_destination',
    claimedState: 'UNKNOWN',
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'Alert to ahmad@salim.pk',
    }),
  });
  assert.strictEqual(r.isSensitive, true, 'alert_destination should be sensitive');
  assert.strictEqual(r.blockedForOutput, true, 'should be blocked for output');
});

test('classifyOutputFact — non-sensitive flag', () => {
  const r = classifyOutputFact({
    fact: 'Server is running',
    category: 'infrastructure_state',
    claimedState: 'UNKNOWN',
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'Server is running',
    }),
  });
  assert.strictEqual(r.isSensitive, false, 'infrastructure_state should not be sensitive');
});

// ============================================
// SECTION 10: ALERT DESTINATION REGISTRY (EMPTY/PENDING)
// ============================================
console.log('\nSection 10: Alert Destination Registry — Empty/Pending');

test('ops/ALERT-DESTINATION-REGISTRY.md NOT registered — cannot be VERIFIED', () => {
  // The registry entry was REMOVED (commented out) — file doesn't exist
  // This means no alert destination can ever be VERIFIED until Ahmad creates the file
  const { AUTHORITY_REGISTRY } = require('../src/authority-registry.js');
  const entry = AUTHORITY_REGISTRY['ops/ALERT-DESTINATION-REGISTRY.md'];
  assert.strictEqual(entry, undefined, 'ops/ALERT-DESTINATION-REGISTRY.md should NOT be in registry');
});

test('Email address from EMAIL-SIGNATURES.md — EVIDENCE ONLY, not authority', () => {
  const r = eelClassify({
    fact: 'Email to ahmad@salim.pk',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'strateon/business/EMAIL-SIGNATURES.md',
      timestamp: new Date().toISOString(),
      raw: 'ahmad@salim.pk',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('Email address from memory file — EVIDENCE ONLY, not authority', () => {
  const r = eelClassify({
    fact: 'Email to ahmad@salim.pk',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'memory/2026-05-16.md',
      timestamp: new Date().toISOString(),
      raw: 'ahmad@salim.pk',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('Email address from log file — EVIDENCE ONLY, not authority', () => {
  const r = eelClassify({
    fact: 'Email to ahmad@salim.pk',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'moosa-worker.log',
      timestamp: new Date().toISOString(),
      raw: 'ahmad@salim.pk',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

// ============================================
// SECTION 11: WATCHDOG/RECOVERY/PM2 UNCHANGED (DESIGN VERIFICATION)
// ============================================
console.log('\nSection 11: Watchdog/Recovery/PM2 Unchanged (Design Verification)');

test('Watchdog process_state category — non-sensitive', () => {
  assert.strictEqual(isOutputSensitive('process_state'), false, 'process_state should not be output-sensitive');
});

test('Recovery_action category — IS sensitive (fail closed)', () => {
  assert.strictEqual(isOutputSensitive('recovery_action'), true, 'recovery_action should be output-sensitive');
});

test('Runtime command result (supabase_query) — expired — BLOCKED', () => {
  const r = eelClassify({
    fact: 'Task status is pending',
    category: FACT_CATEGORIES.DATA_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'supabase_query',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      raw: 'task status: pending',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_FACT_EXPIRED);
});

test('Runtime command result (curl_http) — expired — BLOCKED', () => {
  const r = eelClassify({
    fact: 'API is responding',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'curl_http',
      timestamp: new Date(Date.now() - 90000).toISOString(),
      raw: 'HTTP 200',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_FACT_EXPIRED);
});

test('PM2 ecosystem config file — permanent provenance (no expiry)', () => {
  const r = eelClassify({
    fact: 'Ecosystem config is ecosystem.config.js',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/ecosystem.config.js', // registered path — NOT a runtime command
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days old
      raw: 'module.exports = {...}',
    }),
  });
  assertAllowed(r, 'File-based sources have no temporal constraint');
});

// ============================================
// SECTION 12: NO CALLER BYPASS
// ============================================
console.log('\nSection 12: No Caller Bypass');

test('Cannot bypass by passing VERIFIED to non-credential authority for credential', () => {
  const r = eelClassify({
    fact: 'Password is hunter2',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js', // NOT credential authority
      timestamp: new Date().toISOString(),
      raw: 'password=hunter2',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_CATEGORY_NOT_IN_SCOPE);
});

test('Cannot bypass with EMAIL-SIGNATURES.md for credential', () => {
  const r = eelClassify({
    fact: 'SMTP credentials are in neo.json',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'strateon/business/EMAIL-SIGNATURES.md',
      timestamp: new Date().toISOString(),
      raw: 'neo.json contains credentials',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('Cannot bypass with log file as authority for approval', () => {
  const r = eelClassify({
    fact: 'Approved by Ahmad',
    category: FACT_CATEGORIES.APPROVAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'moosa-worker.log',
      timestamp: new Date().toISOString(),
      raw: 'From: Ahmad — approved',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('Cannot bypass with memory file for provider', () => {
  const r = eelClassify({
    fact: 'Provider is Neo',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'memory/2026-05-16.md',
      timestamp: new Date().toISOString(),
      raw: 'Neo is the email provider',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

// ============================================
// SECTION 13: UNKNOWN HONESTY
// ============================================
console.log('\nSection 13: UNKNOWN Honesty');

test('UNKNOWN for non-sensitive category — passes with warning', () => {
  const r = eelClassify({
    fact: 'The server might be up',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.UNKNOWN,
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'The server might be up',
    }),
  });
  assertAllowed(r);
  assert.strictEqual(r.state, TRUTH_STATES.UNKNOWN);
});

test('UNKNOWN for billing (sensitive) — BLOCKED', () => {
  const r = eelClassify({
    fact: 'The billing amount might be $500',
    category: FACT_CATEGORIES.BILLING,
    claimedState: TRUTH_STATES.UNKNOWN,
    provenance: createProvenance({
      type: 'inference',
      source: 'moosa_output',
      timestamp: new Date().toISOString(),
      raw: 'The billing amount might be $500',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_UNKNOWN_BLOCKED);
});

// ============================================
// SECTION 14: E1 TESTS STILL PASS (REGRESSION)
// ============================================
console.log('\nSection 14: E1 Regression Tests');

test('E1: VERIFIED with valid authority + provenance passes', () => {
  const r = eelClassify({
    fact: 'SMTP password is in secrets',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'secrets/qiyadon-email.json',
      timestamp: new Date().toISOString(),
      raw: 'SMTP_PASSWORD=...',
    }),
  });
  assertAllowed(r);
});

test('E1: VERIFIED without provenance is blocked', () => {
  const r = eelClassify({
    fact: 'SMTP password is secret',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_VERIFIED_WITHOUT_PROVENANCE);
});

test('E1: VERIFIED with non-authoritative source is blocked', () => {
  const r = eelClassify({
    fact: 'SMTP password is secret',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      timestamp: new Date().toISOString(),
      raw: 'SMTP_PASSWORD=secret',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_CATEGORY_NOT_IN_SCOPE);
});

test('E1: EMAIL-SIGNATURES.md is EVIDENCE ONLY for alert_destination', () => {
  const r = eelClassify({
    fact: 'Email ahmad@salim.pk',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'strateon/business/EMAIL-SIGNATURES.md',
      timestamp: new Date().toISOString(),
      raw: 'ahmad@salim.pk',
    }),
  });
  assertBlocked(r, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('E1: secrets/*.json is authority for credential', () => {
  const r = eelClassify({
    fact: 'API key is in secrets',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'secrets/supabase.json',
      timestamp: new Date().toISOString(),
      raw: 'API_KEY=...',
    }),
  });
  assertAllowed(r);
});

// ============================================
// SUMMARY
// ============================================
console.log('\n=== Test Summary ===');
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log(failed === 0 ? '✅ All tests passed!' : `❌ ${failed} test(s) failed`);

process.exit(failed > 0 ? 1 : 0);