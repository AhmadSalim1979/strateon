/**
 * EEL Phase E1 Tests
 * 
 * Validation requirements:
 * 1. EMAIL-SIGNATURES.md must remain evidence only
 * 2. Logs must remain evidence only  
 * 3. Runtime commands must verify current state only, not authorization
 * 4. DERIVED must be blocked for execution-sensitive categories
 * 5. UNKNOWN must fail closed for sensitive categories
 * 6. False-authority tests must pass
 */

const assert = require('assert');
const { 
  eelClassify, 
  getAuditLog, 
  clearAuditLog,
  TRUTH_STATES, 
  FACT_CATEGORIES,
  CLASSIFICATION_DECISION,
  EEL_ERROR_CODES,
} = require('../src/eel-gate');

const { createProvenance } = require('../src/fact-classification');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  clearAuditLog();
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${e.message}`);
    failed++;
  }
}

function assertAllowed(result) {
  if (!result.allowed) {
    throw new Error(`Expected allowed=true but got allowed=false. Error: ${result.error_code} — ${result.error_message}`);
  }
}

function assertBlocked(result, expectedErrorCode) {
  if (result.allowed) {
    throw new Error(`Expected blocked but got allowed=true`);
  }
  if (expectedErrorCode && result.error_code !== expectedErrorCode) {
    throw new Error(`Expected error_code ${expectedErrorCode} but got ${result.error_code}`);
  }
}

function assertDecision(result, expectedDecision) {
  if (result.decision !== expectedDecision) {
    throw new Error(`Expected decision ${expectedDecision} but got ${result.decision}`);
  }
}

console.log('\n=== EEL Phase E1 Tests ===\n');

// ============================================
// SECTION 1: TRUTH STATE CLASSIFICATION
// ============================================
console.log('Section 1: Truth State Classification');

test('VERIFIED with valid authority + provenance passes', () => {
  const result = eelClassify({
    fact: 'Neo is an approved email provider',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'registry',
      source: 'ops/PROVIDER-REGISTRY.md',
      path: '/home/node/.openclaw/workspace/ops/PROVIDER-REGISTRY.md:5',
      timestamp: new Date().toISOString(),
      raw: 'Neo (byONTICS) — email/SMTP',
    }),
  });
  assertAllowed(result);
  assert.strictEqual(result.state, TRUTH_STATES.VERIFIED);
  assert.strictEqual(result.prefix, '[VERIFIED FACT]');
});

test('VERIFIED without provenance is blocked', () => {
  const result = eelClassify({
    fact: 'Neo is an approved provider',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: null,
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_VERIFIED_WITHOUT_PROVENANCE);
});

test('VERIFIED with non-authoritative source is blocked', () => {
  const result = eelClassify({
    fact: 'Qiyadon uses Neo for email',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'strateon/business/project-notes.md',
      timestamp: new Date().toISOString(),
      raw: 'We use Neo for email',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('DERIVED with valid 2-step chain passes for non-sensitive category', () => {
  const result = eelClassify({
    fact: 'Worker heartbeat is fresh',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.DERIVED,
    provenance: createProvenance({
      type: 'file',
      source: 'state/heartbeats/moosa-worker.json',
      chain: [
        { step: 'Read heartbeat age = 5 seconds', source: 'state/heartbeats/moosa-worker.json', timestamp: new Date().toISOString(), raw: '8' },
        { step: 'Threshold is 600 seconds', source: 'watchdog.js:41', timestamp: new Date().toISOString(), raw: '600' },
      ],
      rule: '8 seconds < 600 second threshold → heartbeat is fresh',
    }),
  });
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.state, TRUTH_STATES.DERIVED);
  assert.strictEqual(result.prefix, '[DERIVED]');
});

test('DERIVED without chain is blocked', () => {
  const result = eelClassify({
    fact: 'Worker is alive',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.DERIVED,
    provenance: createProvenance({
      type: 'file',
      source: 'state/heartbeats/moosa-worker.json',
      // Missing chain
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_DERIVED_WITHOUT_CHAIN);
});

test('ASSUMED with explicit acknowledgment passes for non-sensitive category', () => {
  const result = eelClassify({
    fact: 'Watchdog requires gateway for WhatsApp alerts',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.ASSUMED,
    provenance: createProvenance({
      type: 'file',
      source: 'SOUL.md',
      acknowledgment: 'I have not verified this claim — my understanding of OpenClaw architecture suggests gateway is required, but I cannot confirm with evidence',
    }),
  });
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.state, TRUTH_STATES.ASSUMED);
  assert.strictEqual(result.prefix, '[ASSUMPTION]');
});

test('ASSUMED without acknowledgment is blocked', () => {
  const result = eelClassify({
    fact: 'Watchdog requires gateway',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.ASSUMED,
    provenance: createProvenance({
      type: 'file',
      source: 'SOUL.md',
      // Missing acknowledgment
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_ASSUMED_WITHOUT_ACKNOWLEDGMENT);
});

test('UNKNOWN for informational category passes with warning', () => {
  const result = eelClassify({
    fact: 'The dashboard was last viewed yesterday',
    category: FACT_CATEGORIES.DATA_STATE,
    claimedState: TRUTH_STATES.UNKNOWN,
    provenance: null,
  });
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.state, TRUTH_STATES.UNKNOWN);
  assert.strictEqual(result.prefix, '[UNKNOWN]');
});

// ============================================
// SECTION 2: AUTHORITY CHECKS
// ============================================
console.log('\nSection 2: Authority Checks');

test('secrets/*.json is authority for credential category', () => {
  const result = eelClassify({
    fact: 'SMTP password is [REDACTED]',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'secrets/qiyadon-email.json',
      path: '/home/node/.openclaw/workspace/secrets/qiyadon-email.json:3',
      timestamp: new Date().toISOString(),
      raw: '"password": "***"',
    }),
  });
  assertAllowed(result);
});

test('ops/PROVIDER-REGISTRY.md is authority for provider category', () => {
  const result = eelClassify({
    fact: 'Neo is an approved provider',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'registry',
      source: 'ops/PROVIDER-REGISTRY.md',
      timestamp: new Date().toISOString(),
    }),
  });
  assertAllowed(result);
});

test('ops/PROVIDER-REGISTRY.md is NOT authority for alert_destination', () => {
  const result = eelClassify({
    fact: 'Alert destination is ahmad.salim@qiyadon.com',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'registry',
      source: 'ops/PROVIDER-REGISTRY.md',
      timestamp: new Date().toISOString(),
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_CATEGORY_NOT_IN_SCOPE);
});

test('workspace/server.js is authority for infrastructure_state', () => {
  const result = eelClassify({
    fact: 'Server runs on port 3001',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      path: '/home/node/.openclaw/workspace/server.js:10',
      timestamp: new Date().toISOString(),
      raw: 'const PORT = 3001',
    }),
  });
  assertAllowed(result);
});

test('workspace/server.js is NOT authority for credential (wrong category scope)', () => {
  const result = eelClassify({
    fact: 'SMTP password is secret123',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      timestamp: new Date().toISOString(),
    }),
  });
  // workspace/server.js IS an authority, but for wrong category (infrastructure_state/process_state)
  // So error is CATEGORY_NOT_IN_SCOPE, not SOURCE_NOT_AUTHORITY
  assertBlocked(result, EEL_ERROR_CODES.EEL_CATEGORY_NOT_IN_SCOPE);
});

// ============================================
// SECTION 3: FALSE-AUTHORITY BLOCKING
// ============================================
console.log('\nSection 3: False-Authority Blocking (EMAIL-SIGNATURES.md, logs, memory)');

test('EMAIL-SIGNATURES.md is NOT authority — alert_destination blocked', () => {
  const result = eelClassify({
    fact: 'Alert destination is ahmad.salim@qiyadon.com',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'EMAIL-SIGNATURES.md',
      path: '/home/node/.openclaw/workspace/EMAIL-SIGNATURES.md:1',
      timestamp: new Date().toISOString(),
      raw: 'ahmad.salim@qiyadon.com',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('EMAIL-SIGNATURES.md is NOT authority — provider blocked', () => {
  const result = eelClassify({
    fact: 'Neo is approved provider',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'strateon/business/EMAIL-SIGNATURES.md',
      timestamp: new Date().toISOString(),
      raw: 'Neo mentioned in notes',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('strateon/business/EMAIL-SIGNATURES.md is NOT authority for any operational category', () => {
  const result = eelClassify({
    fact: 'Email from address is ahmad.salim@qiyadon.com',
    category: FACT_CATEGORIES.EMAIL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'strateon/business/EMAIL-SIGNATURES.md',
      timestamp: new Date().toISOString(),
      raw: 'From: ahmad.salim@qiyadon.com',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('.log files are NOT authority', () => {
  const result = eelClassify({
    fact: 'Worker was restarted at 10am',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'moosa-worker-error.log',
      timestamp: new Date().toISOString(),
      raw: '[2026-05-15 10:00:00] Worker restarted',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('memory/*.md files are NOT authority', () => {
  const result = eelClassify({
    fact: 'Ahmad approved the recovery action',
    category: FACT_CATEGORIES.APPROVAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'memory/2026-05-14.md',
      timestamp: new Date().toISOString(),
      raw: 'Ahmad said approved',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('CHANGELOG.md is NOT authority', () => {
  const result = eelClassify({
    fact: 'Neo was added as approved provider in v2',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'CHANGELOG.md',
      timestamp: new Date().toISOString(),
      raw: '- Added Neo as approved email provider',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

// ============================================
// SECTION 4: EXECUTION-SENSITIVE CATEGORIES — DERIVED BLOCKED
// ============================================
console.log('\nSection 4: DERIVED Blocked for Execution-Sensitive Categories');

const sensitiveCategories = [
  { cat: FACT_CATEGORIES.ALERT_DESTINATION, name: 'alert_destination' },
  { cat: FACT_CATEGORIES.CREDENTIAL, name: 'credential' },
  { cat: FACT_CATEGORIES.APPROVAL, name: 'approval' },
  { cat: FACT_CATEGORIES.RECOVERY_ACTION, name: 'recovery_action' },
  { cat: FACT_CATEGORIES.ACCOUNT_ID, name: 'account_id' },
  { cat: FACT_CATEGORIES.BILLING, name: 'billing' },
  { cat: FACT_CATEGORIES.COMMAND, name: 'command' },
  { cat: FACT_CATEGORIES.PROVIDER, name: 'provider' },
  { cat: FACT_CATEGORIES.IDENTITY, name: 'identity' },
];

for (const { cat, name } of sensitiveCategories) {
  test(`DERIVED blocked for ${name}`, () => {
    const result = eelClassify({
      fact: `Test ${name} claim`,
      category: cat,
      claimedState: TRUTH_STATES.DERIVED,
      provenance: createProvenance({
        type: 'file',
        source: 'state/test.json',
        chain: [
          { step: 'Verified step 1', source: 'secrets/test.json', timestamp: new Date().toISOString(), raw: 'value1' },
          { step: 'Derived step 2', source: 'state/test.json', timestamp: new Date().toISOString(), raw: 'value2' },
        ],
      }),
    });
    assertBlocked(result);
    // Should be treated as UNKNOWN
    assert.strictEqual(result.state, TRUTH_STATES.UNKNOWN);
  });
}

// ============================================
// SECTION 5: UNKNOWN FAIL-CLOSED FOR SENSITIVE CATEGORIES
// ============================================
console.log('\nSection 5: UNKNOWN Fail-Closed for Sensitive Categories');

const failClosedCategories = [
  { cat: FACT_CATEGORIES.ALERT_DESTINATION, name: 'alert_destination' },
  { cat: FACT_CATEGORIES.CREDENTIAL, name: 'credential' },
  { cat: FACT_CATEGORIES.APPROVAL, name: 'approval' },
  { cat: FACT_CATEGORIES.RECOVERY_ACTION, name: 'recovery_action' },
  { cat: FACT_CATEGORIES.ACCOUNT_ID, name: 'account_id' },
  { cat: FACT_CATEGORIES.BILLING, name: 'billing' },
  { cat: FACT_CATEGORIES.COMMAND, name: 'command' },
  { cat: FACT_CATEGORIES.PROVIDER, name: 'provider' },
  { cat: FACT_CATEGORIES.SECURITY, name: 'security' },
  { cat: FACT_CATEGORIES.IDENTITY, name: 'identity' },
];

for (const { cat, name } of failClosedCategories) {
  test(`UNKNOWN blocked for ${name}`, () => {
    const result = eelClassify({
      fact: `Unknown ${name} claim`,
      category: cat,
      claimedState: TRUTH_STATES.UNKNOWN,
      provenance: null,
    });
    assertBlocked(result);
    assert.strictEqual(result.state, TRUTH_STATES.UNKNOWN);
    assertDecision(result, CLASSIFICATION_DECISION.ESCALATE);
  });
}

// ============================================
// SECTION 6: ASSUMED BLOCKED FOR SENSITIVE CATEGORIES
// ============================================
console.log('\nSection 6: ASSUMED Blocked for Sensitive Categories');

const blockAssumedCategories = [
  { cat: FACT_CATEGORIES.ALERT_DESTINATION, name: 'alert_destination' },
  { cat: FACT_CATEGORIES.CREDENTIAL, name: 'credential' },
  { cat: FACT_CATEGORIES.APPROVAL, name: 'approval' },
  { cat: FACT_CATEGORIES.RECOVERY_ACTION, name: 'recovery_action' },
  { cat: FACT_CATEGORIES.ACCOUNT_ID, name: 'account_id' },
  { cat: FACT_CATEGORIES.BILLING, name: 'billing' },
  { cat: FACT_CATEGORIES.COMMAND, name: 'command' },
  { cat: FACT_CATEGORIES.PROVIDER, name: 'provider' },
  { cat: FACT_CATEGORIES.SECURITY, name: 'security' },
  { cat: FACT_CATEGORIES.IDENTITY, name: 'identity' },
];

for (const { cat, name } of blockAssumedCategories) {
  test(`ASSUMED blocked for ${name} even with acknowledgment`, () => {
    const result = eelClassify({
      fact: `Assumed ${name} claim`,
      category: cat,
      claimedState: TRUTH_STATES.ASSUMED,
      provenance: createProvenance({
        type: 'file',
        source: 'test.md',
        acknowledgment: 'I have not verified this claim',
      }),
    });
    assertBlocked(result);
    assert.strictEqual(result.state, TRUTH_STATES.UNKNOWN);
  });
}

// ============================================
// SECTION 7: EXPANDED FALSE-AUTHORITY SCENARIOS
// ============================================
console.log('\nSection 7: Expanded False-Authority Scenarios');

test('InfErring alert destination from email pattern is blocked', () => {
  const result = eelClassify({
    fact: 'Alert destination: ahmad@salim.pk',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.DERIVED,
    provenance: createProvenance({
      type: 'file',
      source: 'EMAIL-SIGNATURES.md',
      chain: [
        { step: 'Domain is salim.pk', source: 'EMAIL-SIGNATURES.md', timestamp: new Date().toISOString(), raw: 'ahmad.salim@qiyadon.com' },
        { step: 'Inferred personal email pattern', source: 'inference', timestamp: new Date().toISOString(), raw: 'ahmad@salim.pk' },
      ],
    }),
  });
  assertBlocked(result);
});

test('InfErring provider from blog post is blocked', () => {
  const result = eelClassify({
    fact: 'Zoho is an approved CRM provider',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'api',
      source: 'https://blog.example.com/providers',
      timestamp: new Date().toISOString(),
      raw: 'Zoho is a popular CRM',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('Approval inferred from log file is blocked', () => {
  const result = eelClassify({
    fact: 'Ahmad approved the action',
    category: FACT_CATEGORIES.APPROVAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'moosa-worker.log',
      timestamp: new Date().toISOString(),
      raw: 'From: Ahmad — approved',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('Credential assumed from filename pattern is blocked', () => {
  const result = eelClassify({
    fact: 'Neo SMTP credentials are in neo.json',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.ASSUMED,
    provenance: createProvenance({
      type: 'file',
      source: 'memory/assumptions.md',
      acknowledgment: 'I assume neo.json contains SMTP credentials based on naming convention',
    }),
  });
  assertBlocked(result);
  assert.strictEqual(result.state, TRUTH_STATES.UNKNOWN);
});

test('Runtime command result cannot authorize future action — BLOCKED', () => {
  // pm2_list has temporal: 'current' — 10 minutes = 600s > 60s max age → BLOCKED
  const result = eelClassify({
    fact: 'Worker was healthy 10 minutes ago, recovery not needed',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'command',
      source: 'pm2_list',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      raw: 'moosa-worker online',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_FACT_EXPIRED);
});

// ============================================
// SECTION 8: VERIFIED PATH EXAMPLES (MUST PASS)
// ============================================
console.log('\nSection 8: Verified Path Examples (Must Pass)');

test('VERIFIED provider from PROVIDER-REGISTRY passes', () => {
  const result = eelClassify({
    fact: 'Neo (byONTICS) is approved for email/SMTP',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'registry',
      source: 'ops/PROVIDER-REGISTRY.md',
      path: '/home/node/.openclaw/workspace/ops/PROVIDER-REGISTRY.md',
      timestamp: new Date().toISOString(),
      raw: 'Neo (byONTICS) — email/SMTP — contact@qiyadon.com',
    }),
  });
  assertAllowed(result);
  assert.strictEqual(result.state, TRUTH_STATES.VERIFIED);
  assert.strictEqual(result.prefix, '[VERIFIED FACT]');
});

test('VERIFIED credential from secrets file passes', () => {
  const result = eelClassify({
    fact: 'Supabase URL is https://btrbczqjwzuybgcxckvm.supabase.co',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'secrets/supabase.json',
      path: '/home/node/.openclaw/workspace/secrets/supabase.json:1',
      timestamp: new Date().toISOString(),
      raw: '"url": "https://btrbczqjwzuybgcxckvm.supabase.co"',
    }),
  });
  assertAllowed(result);
  assert.strictEqual(result.state, TRUTH_STATES.VERIFIED);
});

test('VERIFIED infrastructure_state from workspace file passes', () => {
  const result = eelClassify({
    fact: 'Server listens on port 3001',
    category: FACT_CATEGORIES.INFRASTRUCTURE_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/server.js',
      path: '/home/node/.openclaw/workspace/server.js:10',
      timestamp: new Date().toISOString(),
      raw: 'const PORT = 3001',
    }),
  });
  assertAllowed(result);
  assert.strictEqual(result.state, TRUTH_STATES.VERIFIED);
});

test('VERIFIED process_state from heartbeat file passes', () => {
  const result = eelClassify({
    fact: 'Worker heartbeat age is 5 seconds',
    category: FACT_CATEGORIES.PROCESS_STATE,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'state/heartbeats/moosa-worker.json',
      path: '/home/node/.openclaw/workspace/state/heartbeats/moosa-worker.json',
      timestamp: new Date().toISOString(),
      raw: '{"heartbeat_age": 5}',
    }),
  });
  assertAllowed(result);
  assert.strictEqual(result.state, TRUTH_STATES.VERIFIED);
});

// ============================================
// SECTION 9: AUDIT LOG VERIFICATION
// ============================================
console.log('\nSection 9: Audit Log Verification');

test('Audit log captures blocked classification', () => {
  clearAuditLog();
  
  const result = eelClassify({
    fact: 'Test alert destination',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'EMAIL-SIGNATURES.md',
      timestamp: new Date().toISOString(),
      raw: 'test@example.com',
    }),
    context: { session_id: 'test-session-123' },
  });
  
  assert.strictEqual(result.allowed, false);
  
  const log = getAuditLog({ category: FACT_CATEGORIES.ALERT_DESTINATION });
  assert.strictEqual(log.length, 1);
  assert.strictEqual(log[0].fact, 'Test alert destination');
  assert.strictEqual(log[0].claimed_state, TRUTH_STATES.VERIFIED);
  assert.strictEqual(log[0].actual_state, TRUTH_STATES.UNKNOWN);
  assert.strictEqual(log[0].allowed, false);
  assert.strictEqual(log[0].eel_error_code, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
  assert.strictEqual(log[0].session_id, 'test-session-123');
});

test('Audit log captures allowed classification', () => {
  clearAuditLog();
  
  eelClassify({
    fact: 'Test provider claim',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'registry',
      source: 'ops/PROVIDER-REGISTRY.md',
      timestamp: new Date().toISOString(),
    }),
  });
  
  const log = getAuditLog({ allowed: true });
  const matching = log.filter(e => e.fact === 'Test provider claim');
  assert.strictEqual(matching.length, 1);
  assert.strictEqual(matching[0].allowed, true);
});

// ============================================
// SECTION 10: DERIVED BLOCKING — SPECIFIC SCENARIOS FROM DESIGN DOC
// ============================================
console.log('\nSection 10: Specific Scenarios from Design Doc');

test('Scenario: Invented alert destination (ahmad@salim.pk) — BLOCKED', () => {
  const result = eelClassify({
    fact: 'Alert destination: ahmad@salim.pk',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'memory/inferred-destinations.md',
      acknowledgment: 'I inferred this from email patterns',
    }),
  });
  assertBlocked(result);
});

test('Scenario: Email destination from EMAIL-SIGNATURES.md — BLOCKED', () => {
  const result = eelClassify({
    fact: 'Alert destination: ahmad.salim@qiyadon.com',
    category: FACT_CATEGORIES.ALERT_DESTINATION,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'EMAIL-SIGNATURES.md',
      path: '/home/node/.openclaw/workspace/strateon/business/EMAIL-SIGNATURES.md',
      timestamp: new Date().toISOString(),
      raw: 'From: ahmad.salim@qiyadon.com',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('Scenario: Credential from non-secrets file — BLOCKED', () => {
  const result = eelClassify({
    fact: 'SMTP password is mysecret123',
    category: FACT_CATEGORIES.CREDENTIAL,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'file',
      source: 'workspace/.env',
      timestamp: new Date().toISOString(),
      raw: 'SMTP_PASSWORD=mysecret123',
    }),
  });
  assertBlocked(result, EEL_ERROR_CODES.EEL_SOURCE_NOT_AUTHORITY);
});

test('Scenario: Provider from blog post — BLOCKED', () => {
  const result = eelClassify({
    fact: 'Zoho is approved',
    category: FACT_CATEGORIES.PROVIDER,
    claimedState: TRUTH_STATES.VERIFIED,
    provenance: createProvenance({
      type: 'api',
      source: 'https://example.com/blog/zoho-review',
      timestamp: new Date().toISOString(),
      raw: 'Zoho CRM is great',
    }),
  });
  assertBlocked(result);
});

test('Scenario: Assumed approval from behavior — BLOCKED even with acknowledgment', () => {
  const result = eelClassify({
    fact: 'Ahmad approved (based on reviewing for 3 minutes)',
    category: FACT_CATEGORIES.APPROVAL,
    claimedState: TRUTH_STATES.ASSUMED,
    provenance: createProvenance({
      type: 'file',
      source: 'memory/session-notes.md',
      acknowledgment: 'I have not received explicit approval — Ahmad reviewed for 3 minutes but said nothing',
    }),
  });
  assertBlocked(result);
  assert.strictEqual(result.state, TRUTH_STATES.UNKNOWN);
});

// ============================================
// SUMMARY
// ============================================
console.log('\n=== Test Summary ===');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log('');

if (failed > 0) {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('✅ All tests passed');
  process.exit(0);
}