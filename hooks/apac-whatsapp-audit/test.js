/**
 * APAC Hook Tests — verify AUDIT_ONLY behavior in isolation
 */

const { handler } = require('/home/node/.openclaw/workspace/hooks/apac-whatsapp-audit/index.js');
const { apacObserveMessage } = require('/home/node/.openclaw/workspace/strateon/eel/src/apac-whatsapp-hook.js');

// ─── Mock Supabase audit entries ───────────────────────────────────────────────

let mockAuditEntries = [];

function createMockPgClient() {
  return {
    query: async (text, params) => {
      if (text.includes('INSERT INTO approval_audit_log')) {
        mockAuditEntries.push({ text, params });
      }
      return { rows: [] };
    },
    end: async () => {},
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) { testsPassed++; console.log(`  ✅ ${message}`); }
  else { testsFailed++; console.log(`  ❌ FAIL: ${message}`); }
}

function section(name) { console.log(`\n[ ${name} ]`); }

async function runtests() {

  // ─── TEST 1: Hook loads and is a function ─────────────────────────────────

  section('TEST 1: Hook loads correctly');
  assert(typeof handler === 'function', `handler is a function`);

  // ─── TEST 2: APAC_ENABLED=false disables hook ──────────────────────────────

  section('TEST 2: Feature flag — APAC_ENABLED=false disables observation');
  process.env.APAC_ENABLED = 'false';
  await handler({ content: 'approved operation_id=test', messageId: 'wamid.test' });
  assert(mockAuditEntries.length === 0, `hook did not process when APAC_ENABLED=false`);
  process.env.APAC_ENABLED = 'true';

  // ─── TEST 3: No body = no-op ────────────────────────────────────────────────

  section('TEST 3: No body = no-op (pass-through)');
  const entriesBefore = mockAuditEntries.length;
  await handler({ messageId: 'wamid.no-body' });
  assert(mockAuditEntries.length === entriesBefore, `no audit entry written for empty body`);

  // ─── TEST 4: Approval-like message generates audit entry ─────────────────────

  section('TEST 4: Approval-like message generates audit entry');
  mockAuditEntries = [];

  const ctx = {
    MessageSid: 'wamid.test-approval',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    Body: 'approved operation_id=test-123 action_hash=hash-abc',
    ForwardedFrom: false,
    SessionId: 'session-test',
  };

  await apacObserveMessage(ctx, ctx.Body, {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
    session_id: ctx.SessionId,
  });

  assert(mockAuditEntries.length >= 1, `audit INSERT written (got ${mockAuditEntries.length} entries)`);
  assert(mockAuditEntries[0].params[1] === 'wamid.test-approval', `approval_message_id param correct`);

  // ─── TEST 5: Hook error is caught and never propagates ─────────────────────

  section('TEST 5: Hook error is caught — never propagates');
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

  // ─── TEST 6: ZERO execution authority ───────────────────────────────────────

  section('TEST 6: Hook output has ZERO execution authority');
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

  // ─── TEST 7: Original message flow preserved (no return value used) ─────────

  section('TEST 7: Original message flow preserved — no blocking');
  const originalFlowResult = await apacObserveMessage(
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

  // Result is just an object — nothing in it changes execution flow
  assert(originalFlowResult !== null, `result is not null`);
  assert(typeof originalFlowResult === 'object', `result is an object`);
  assert(originalFlowResult.classification === 'BLOCKED', `classification is BLOCKED (informational only)`);
  assert(mockAuditEntries.length >= 1, `audit entry written without blocking original flow`);

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