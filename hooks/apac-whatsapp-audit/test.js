/**
 * APAC Hook Tests — verify AUDIT_ONLY behavior in isolation
 * 
 * CRITICAL: Default is now OFF — explicit APAC_ENABLED=true required.
 * 
 * Testing approach:
 * - Tests 1-7: test the handler() function itself (OpenClaw hook interface)
 * - Tests 8-11: test apacObserveMessage() directly (bypassing the handler's env checks)
 * 
 * Verification method for handler tests: check the LOCAL APAC audit log file
 * (The hook writes to local file when Supabase pg module is unavailable.
 *  We verify by counting lines added to the audit log.)
 */

const fs = require('fs');
const path = require('path');
const { handler } = require('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js');
const { apacObserveMessage } = require('/home/node/.openclaw/workspace/strateon/eel/src/apac-whatsapp-hook.js');

// ─── Constants ────────────────────────────────────────────────────────────────

const APAC_ENABLED_ORIGINAL = process.env.APAC_ENABLED;
const LOCAL_AUDIT_FILE = path.join(process.cwd(), 'memory', 'EEL-APAC-AUDIT-2026-05-16.md');

// ─── Helpers ────────────────────────────────────────────────────────────────

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) { testsPassed++; console.log(`  ✅ ${message}`); }
  else { testsFailed++; console.log(`  ❌ FAIL: ${message}`); }
}

function section(name) { console.log(`\n[ ${name} ]`); }

function getAuditLineCount() {
  try {
    return fs.readFileSync(LOCAL_AUDIT_FILE, 'utf8').trim().split('\n').length;
  } catch {
    return 0;
  }
}

function setApacEnabled(value) {
  if (value === undefined) {
    delete process.env.APAC_ENABLED;
  } else {
    process.env.APAC_ENABLED = String(value);
  }
  // Clear require cache to force fresh module load with new env
  delete require.cache[require.resolve('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js')];
}

async function runtests() {

  // ─── TEST 1: Hook loads and is a function ─────────────────────────────────

  section('TEST 1: Hook loads correctly');
  assert(typeof handler === 'function', `handler is a function`);

  // ─── TEST 2: Default OFF — APAC_ENABLED unset → bypasses ─────────────────

  section('TEST 2: Default OFF — APAC_ENABLED unset → hook bypassed');
  setApacEnabled(undefined);
  const linesBefore2 = getAuditLineCount();
  await handler({
    messageId: 'wamid.default-off-test',
    metadata: { senderE164: '+923215139934' },
    content: 'approved operation_id=default-test action_hash=hash',
    timestamp: Date.now(),
  });
  const linesAfter2 = getAuditLineCount();
  assert(linesAfter2 === linesBefore2, `hook bypassed when APAC_ENABLED unset (delta=0, expected 0)`);

  // ─── TEST 3: APAC_ENABLED=false → bypasses ───────────────────────────────

  section('TEST 3: APAC_ENABLED=false → hook bypassed');
  setApacEnabled(false);
  const linesBefore3 = getAuditLineCount();
  await handler({
    messageId: 'wamid.disabled-test',
    metadata: { senderE164: '+923215139934' },
    content: 'approved operation_id=disabled-test action_hash=hash',
    timestamp: Date.now(),
  });
  const linesAfter3 = getAuditLineCount();
  assert(linesAfter3 === linesBefore3, `hook bypassed when APAC_ENABLED=false (delta=0)`);
  setApacEnabled(true); // Reset to enabled

  // ─── TEST 4: APAC_ENABLED=true → hook is active ───────────────────────────

  section('TEST 4: APAC_ENABLED=true → hook writes to audit log');
  setApacEnabled(true);
  // Reload to pick up APAC_ENABLED=true
  delete require.cache[require.resolve('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js')];
  const { handler: handlerEnabled } = require('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js');
  
  const linesBefore4 = getAuditLineCount();
  await handlerEnabled({
    messageId: 'wamid.enabled-test-' + Date.now(),
    metadata: { senderE164: '+923215139934' },
    content: 'approved operation_id=enabled-test action_hash=hash-et',
    timestamp: Date.now(),
  });
  const linesAfter4 = getAuditLineCount();
  assert(linesAfter4 > linesBefore4, `audit file grew when APAC_ENABLED=true (delta=${linesAfter4 - linesBefore4})`);

  // ─── TEST 5: APAC_ENABLED=1 → hook is active (numeric string) ────────────

  section('TEST 5: APAC_ENABLED=1 → hook is active');
  setApacEnabled('1');
  delete require.cache[require.resolve('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js')];
  const { handler: handler1 } = require('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js');
  
  const linesBefore5 = getAuditLineCount();
  await handler1({
    messageId: 'wamid.enabled-1-test-' + Date.now(),
    metadata: { senderE164: '+923215139934' },
    content: 'approved operation_id=enabled-1-test action_hash=hash-e1',
    timestamp: Date.now(),
  });
  const linesAfter5 = getAuditLineCount();
  assert(linesAfter5 > linesBefore5, `audit file grew when APAC_ENABLED=1 (delta=${linesAfter5 - linesBefore5})`);
  setApacEnabled(true); // Reset

  // ─── TEST 6: Invalid APAC_ENABLED value → bypasses with warning ──────────

  section('TEST 6: Invalid APAC_ENABLED value → bypasses with warning');
  setApacEnabled('bogus-value');
  delete require.cache[require.resolve('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js')];
  const { handler: handlerInvalid } = require('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js');
  
  const linesBefore6 = getAuditLineCount();
  let warningEmitted = false;
  const origWarn = console.warn;
  console.warn = (m) => { if (m.includes('Invalid APAC_ENABLED')) warningEmitted = true; origWarn(m); };
  await handlerInvalid({
    messageId: 'wamid.invalid-test-' + Date.now(),
    metadata: { senderE164: '+923215139934' },
    content: 'approved operation_id=invalid-test action_hash=hash-it',
    timestamp: Date.now(),
  });
  console.warn = origWarn;
  const linesAfter6 = getAuditLineCount();
  assert(linesAfter6 === linesBefore6, `hook bypassed when APAC_ENABLED=invalid (delta=0)`);
  assert(warningEmitted, `config warning logged for invalid value`);
  setApacEnabled(true); // Reset

  // ─── TEST 7: No body = no-op ────────────────────────────────────────────────

  section('TEST 7: No body = no-op (pass-through)');
  const linesBefore7 = getAuditLineCount();
  delete require.cache[require.resolve('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js')];
  const { handler: handlerNoBody } = require('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js');
  await handlerNoBody({ messageId: 'wamid.no-body' });
  const linesAfter7 = getAuditLineCount();
  assert(linesAfter7 === linesBefore7, `no audit entry written for empty body`);

  // ─── TEST 8: Approval-like message generates audit entry (direct call) ─────────

  section('TEST 8: Approval-like message generates audit entry (apacObserveMessage direct)');
  let mockEntries = [];
  function createMockPgClient() {
    return {
      query: async (text, params) => {
        if (text.includes('INSERT INTO approval_audit_log')) mockEntries.push({ text, params });
        return { rows: [] };
      },
      end: async () => {},
    };
  }

  mockEntries = [];
  await apacObserveMessage(
    {
      MessageSid: 'wamid.test-approval',
      SenderE164: '+923215139934',
      Timestamp: Date.now(),
      Body: 'approved operation_id=test-123 action_hash=hash-abc',
      ForwardedFrom: false,
      SessionId: 'session-test',
    },
    'approved operation_id=test-123 action_hash=hash-abc',
    { supabaseClient: createMockPgClient(), useSecretsFallback: false }
  );
  assert(mockEntries.length >= 1, `audit INSERT written via mock client (got ${mockEntries.length})`);
  assert(mockEntries[0].params[1] === 'wamid.test-approval', `approval_message_id param correct`);

  // ─── TEST 9: Hook error is caught and never propagates ─────────────────────

  section('TEST 9: Hook error is caught — never propagates');
  let errorPropagated = false;
  try {
    await handler({
      messageId: 'wamid.test-err',
      metadata: { senderE164: '+923215139934' },
      content: null,
      timestamp: Date.now(),
    });
  } catch (err) {
    errorPropagated = true;
  }
  assert(!errorPropagated, `error did not propagate to caller`);

  // ─── TEST 10: ZERO execution authority ───────────────────────────────────

  section('TEST 10: Hook output has ZERO execution authority');
  const authResult = await apacObserveMessage(
    {
      MessageSid: 'wamid.auth-test',
      SenderE164: '+923215139934',
      Timestamp: Date.now(),
      Body: 'approved operation_id=auth action_hash=auth-hash',
      ForwardedFrom: false,
      SessionId: 'session-auth',
    },
    'approved operation_id=auth action_hash=auth-hash',
    { supabaseClient: createMockPgClient(), useSecretsFallback: false }
  );

  const NO_AUTHORITY = [
    ['no authorize() method',    authResult.authorize === undefined],
    ['no deny() method',         authResult.deny === undefined],
    ['no block() method',       authResult.block === undefined],
    ['no mutate() method',      authResult.mutate === undefined],
    ['no dispatch mutation',    authResult.dispatch === undefined],
    ['no execute() method',     authResult.execute === undefined],
    ['classification BLOCKED',  authResult.classification === 'BLOCKED'],
  ];

  let authPassed = 0;
  NO_AUTHORITY.forEach(([k, v]) => {
    if (v) { authPassed++; console.log(`  ✅ ${k}`); }
    else { console.log(`  ❌ ${k}`); }
  });
  assert(authPassed === NO_AUTHORITY.length, `${authPassed}/${NO_AUTHORITY.length} zero-authority signals`);

  // ─── TEST 11: Original message flow preserved ─────────────────────────────

  section('TEST 11: Original message flow preserved — no blocking');
  const flowResult = await apacObserveMessage(
    {
      MessageSid: 'wamid.flow-test',
      SenderE164: '+923215139934',
      Timestamp: Date.now(),
      Body: 'go ahead with deployment',
      ForwardedFrom: false,
      SessionId: 'session-flow',
    },
    'go ahead with deployment',
    { supabaseClient: createMockPgClient(), useSecretsFallback: false }
  );
  assert(flowResult !== null, `result is not null`);
  assert(typeof flowResult === 'object', `result is an object`);
  assert(flowResult.classification === 'BLOCKED', `classification is BLOCKED (informational only)`);

  // ─── SUMMARY ────────────────────────────────────────────────────────────────

  console.log(`\n[ TEST SUMMARY ]`);
  console.log(`  Passed: ${testsPassed}`);
  console.log(`  Failed: ${testsFailed}`);
  console.log(`  Total:  ${testsRun}`);
  console.log(`  Status: ${testsFailed === 0 ? '✅ ALL PASSED' : '❌ FAILURES DETECTED'}`);
  process.exit(testsFailed > 0 ? 1 : 0);
}

runtests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});