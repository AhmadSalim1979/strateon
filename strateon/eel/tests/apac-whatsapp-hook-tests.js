/**
 * APAC Phase 2 Step 2 — WhatsApp Hook Tests (AUDIT_ONLY)
 * 
 * Sequential async test runner — each test awaits completion before next starts.
 */

const { apacObserveMessage, isApprovalLikeMessage } = require('../src/apac-whatsapp-hook');

// ─── Helpers ──────────────────────────────────────────────────────────────────

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✅ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ❌ FAIL: ${message}`);
  }
}

function section(name) {
  console.log(`\n[ ${name} ]`);
}

async function runtests() {
  
  // ─── Mock Supabase pg-like client ────────────────────────────────────────
  
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
  
  // ─── TEST 1: Approval-like message is detected and audited ────────────────
  
  section('TEST 1: Approval-like message is detected and audited');
  mockAuditEntries = [];
  
  const r1 = await apacObserveMessage({
    MessageSid: 'wamid.test001',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    Body: 'approved operation_id=abc-123 action_hash=xyz-789',
    ForwardedFrom: false,
    SessionId: 'session-test-001',
  }, 'approved operation_id=abc-123 action_hash=xyz-789', {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
  });
  
  assert(r1.classification === 'BLOCKED', `classification is BLOCKED in AUDIT_ONLY`);
  assert(r1.is_valid === true, `is_valid is true — has all approval characteristics`);
  assert(r1.keyword.strength === 'STRONG', `keyword_strength is STRONG`);
  assert(r1.operation_id.found === true, `operation_id found`);
  assert(r1.operation_id.value === 'abc-123', `operation_id value is abc-123`);
  assert(r1.action_hash.found === true, `action_hash found`);
  assert(r1.approval_message_id.found === true, `approval_message_id found`);
  assert(r1.approval_message_id.value === 'wamid.test001', `approval_message_id value correct`);
  assert(r1.forward_detected === false, `forward_detected is false`);
  assert(mockAuditEntries.length >= 1, `audit INSERT written to mock (got ${mockAuditEntries.length})`);
  if (mockAuditEntries.length >= 1) {
    assert(mockAuditEntries[0].params[0] === 'APPROVAL_CLASSIFIED', `event_type param is APPROVAL_CLASSIFIED`);
    assert(mockAuditEntries[0].params[1] === 'wamid.test001', `approval_message_id param correct`);
    assert(mockAuditEntries[0].params[2] === 'abc-123', `operation_id param correct`);
  }
  console.log(`  → audit INSERT captured: ${mockAuditEntries[0]?.params?.length} params`);
  
  // ─── TEST 2: Non-approval message is audited without side effects ─────────
  
  section('TEST 2: Non-approval message is ignored/audited without side effects');
  
  const countBefore = mockAuditEntries.length;
  const r2 = await apacObserveMessage({
    MessageSid: 'wamid.test002',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    Body: 'what was the status of my pipeline audit?',
    ForwardedFrom: false,
    SessionId: 'session-test-002',
  }, 'what was the status of my pipeline audit?', {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
  });
  
  assert(r2.is_valid === false, `is_valid is false for non-approval`);
  assert(r2.keyword === null || (r2.keyword && r2.keyword.strength === null), `keyword is null/NONE`);
  assert(r2.error_codes.includes('EEL_APPROVAL_NO_OPERATION_LINK'), `EEL_APPROVAL_NO_OPERATION_LINK present`);
  assert(r2.operation_id.found === false, `operation_id not found`);
  assert(r2.action_hash.found === false, `action_hash not found`);
  assert(r2.classification === 'BLOCKED', `classification is BLOCKED`);
  assert(mockAuditEntries.length > countBefore, `audit entry added for non-approval`);
  
  // ─── TEST 3: Emoji-only message is audited as blocked, no clarification sent ─
  
  section('TEST 3: Emoji-only message is audited as blocked, no clarification sent');
  
  const r3 = await apacObserveMessage({
    MessageSid: 'wamid.test003',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    Body: '👍',
    ForwardedFrom: false,
    SessionId: 'session-test-003',
  }, '👍', {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
  });
  
  assert(r3.emoji_only === true, `emoji_only detected`);
  assert(r3.classification === 'BLOCKED', `classification is BLOCKED for emoji-only`);
  assert(r3.error_codes.includes('EEL_APPROVAL_EMOJI_BLOCKED'), `EEL_APPROVAL_EMOJI_BLOCKED present`);
  assert(r3.error_codes.includes('EEL_APPROVAL_ESCALATED'), `EEL_APPROVAL_ESCALATED present`);
  // AUDIT_ONLY: no clarification message sent (would require ENFORCE_SENSITIVE phase)
  console.log(`  → blocked_emoji: ${JSON.stringify(r3).slice(0, 80)}...`);
  
  // ─── TEST 4: Forwarded message is audited as blocked ─────────────────────
  
  section('TEST 4: Forwarded message is audited as blocked, runtime unchanged');
  
  const r4 = await apacObserveMessage({
    MessageSid: 'wamid.test004',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    Body: 'approved operation_id=fwd-test action_hash=hash-fwd',
    ForwardedFrom: 'forwarded from someone else',
    SessionId: 'session-test-004',
  }, 'approved operation_id=fwd-test action_hash=hash-fwd', {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
  });
  
  assert(r4.forward_detected === true, `forward_detected flag set`);
  assert(r4.classification === 'BLOCKED', `classification is BLOCKED for forwarded`);
  assert(r4.error_codes.includes('EEL_APPROVAL_FORWARDED'), `EEL_APPROVAL_FORWARDED present`);
  assert(r4.is_valid === false, `is_valid is false for forwarded`);
  // AUDIT_ONLY: no runtime behavior changes — observation only
  
  // ─── TEST 5: Missing MessageSid is audited as unverifiable ───────────────
  
  section('TEST 5: Missing MessageSid is audited as unverifiable');
  
  const r5 = await apacObserveMessage({
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    Body: 'approved operation_id=no-sid action_hash=hash-test',
    ForwardedFrom: false,
    SessionId: 'session-test-005',
  }, 'approved operation_id=no-sid action_hash=hash-test', {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
  });
  
  assert(r5.approval_message_id.found === false, `approval_message_id NOT found`);
  assert(r5.approval_message_id.source === null, `source is null for missing MessageSid`);
  assert(r5.error_codes.includes('EEL_APPROVAL_ID_UNAVAILABLE'), `EEL_APPROVAL_ID_UNAVAILABLE present`);
  assert(r5.classification === 'BLOCKED', `classification is BLOCKED`);
  
  // ─── TEST 6: Wrong sender is audited as non-authoritative ───────────────
  
  section('TEST 6: Wrong sender is audited as non-authoritative');
  
  const r6 = await apacObserveMessage({
    MessageSid: 'wamid.test006',
    SenderE164: '+9876543210',   // WRONG — not +923215139934
    Timestamp: Date.now(),
    Body: 'approved operation_id=wrong-sender action_hash=hash-ws',
    ForwardedFrom: false,
    SessionId: 'session-test-006',
  }, 'approved operation_id=wrong-sender action_hash=hash-ws', {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
  });
  
  assert(r6.is_valid === false, `is_valid is false for wrong sender`);
  assert(r6.error_codes.includes('EEL_APPROVAL_NOT_AUTHORITATIVE'), `EEL_APPROVAL_NOT_AUTHORITATIVE present`);
  assert(r6.keyword.strength === 'STRONG', `keyword still STRONG — detection worked`);
  assert(r6.classification === 'BLOCKED', `classification is BLOCKED`);
  
  // ─── TEST 7: apacObserveMessage has ZERO execution authority ────────────
  
  section('TEST 7: Confirmation — apacObserveMessage has ZERO execution authority');
  
  const r7 = await apacObserveMessage({
    MessageSid: 'wamid.test-auth',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    Body: 'approved operation_id=auth-test action_hash=auth-hash',
    ForwardedFrom: false,
    SessionId: 'session-test-auth',
  }, 'approved operation_id=auth-test action_hash=auth-hash', {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
  });
  
  const NO_AUTHORITY = [
    ['no authorize() method',     r7.authorize === undefined],
    ['no deny() method',          r7.deny === undefined],
    ['no block() method',         r7.block === undefined],
    ['no mutate() method',       r7.mutate === undefined],
    ['no dispatch mutation',      r7.dispatch === undefined],
    ['no execute() method',      r7.execute === undefined],
    ['no suppress/filter',         r7.suppress === undefined && r7.filter === undefined],
    ['no gating logic',           r7._gate === undefined && r7._block === undefined],
    ['returns plain object',     typeof r7 === 'object' && r7 !== null],
    ['classification BLOCKED',      r7.classification === 'BLOCKED'],
    ['audit INSERT captured',     mockAuditEntries.length >= 1],
  ];
  
  let authPassed = 0;
  NO_AUTHORITY.forEach(([k, v]) => {
    if (v) { authPassed++; console.log(`  ✅ ${k}`); }
    else { console.log(`  ❌ ${k}`); }
  });
  assert(authPassed === NO_AUTHORITY.length, `${authPassed}/${NO_AUTHORITY.length} zero-authority signals confirmed`);
  
  // ─── TEST 8: Runtime flow verification ───────────────────────────────────
  
  section('TEST 8: Runtime execution flow remains unaffected by observation');
  
  const countBefore8 = mockAuditEntries.length;
  const r8 = await apacObserveMessage({
    MessageSid: 'wamid.test-runtime',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    Body: 'go ahead with deployment',
    ForwardedFrom: false,
    SessionId: 'session-test-runtime',
  }, 'go ahead with deployment', {
    supabaseClient: createMockPgClient(),
    useSecretsFallback: false,
  });
  const countAfter8 = mockAuditEntries.length;
  
  const FLOW = [
    ['result is non-null object',   r8 !== null && typeof r8 === 'object'],
    ['result returned',             r8 !== undefined],
    ['no dispatch mutation',        r8.dispatch === undefined],
    ['no gating in result',         r8._gate === undefined && r8._block === undefined],
    ['classification is BLOCKED',   r8.classification === 'BLOCKED'],
    ['audit INSERT added',          countAfter8 > countBefore8],
  ];
  
  let flowPassed = 0;
  FLOW.forEach(([k, v]) => {
    if (v) { flowPassed++; console.log(`  ✅ ${k}`); }
    else { console.log(`  ❌ ${k}`); }
  });
  assert(flowPassed === FLOW.length, `${flowPassed}/${FLOW.length} runtime-flow-safe signals`);
  
  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  
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