/**
 * APAC Phase 1 — AUDIT_ONLY Tests
 * 
 * Tests replay detection, forwarded messages, emoji-only messages,
 * malformed approvals, missing fields, stale approvals, wrong sender,
 * wrong channel, and duplicate approval_message_id.
 * 
 * Phase 1: AUDIT_ONLY — all functions have ZERO execution authority.
 * Tests verify parsing/logging only — no execution path exists.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const {
  isEmojiOnlyMessage,
  parseOperationId,
  parseActionHash,
  classifyKeywordStrength,
  extractApprovalMessageId,
  extractSenderE164,
  extractTimestamp,
  isForwardedMessage,
  classifyApprovalMessage,
  createApprovalAuditEntry,
  APPROVAL_KEYWORDS,
} = require('../src/apac-parsers.js');

const {
  processApprovalAudit,
  checkReplay,
  recordReplay,
  getAuditLogPath,
} = require('../src/apac-audit-only.js');

const {
  AUTHORITATIVE_CHANNELS,
  AUTHORITATIVE_OPERATORS,
  APPROVAL_MAX_AGE_MS,
  REQUIRED_KEYWORDS,
  EMOJI_KEYWORDS,
} = require('../src/apac-authority-registry.js');

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

// ============================================
// SECTION 1: isEmojiOnlyMessage
// ============================================
console.log('\nSection 1: Emoji-Only Detection');

test('👍 — emoji only — true', () => {
  assert.strictEqual(isEmojiOnlyMessage('👍'), true);
});

test('✓ — emoji only — true', () => {
  assert.strictEqual(isEmojiOnlyMessage('✓'), true);
});

test('👌 — emoji only — true', () => {
  assert.strictEqual(isEmojiOnlyMessage('👌'), true);
});

test('😀 — emoji only — true', () => {
  assert.strictEqual(isEmojiOnlyMessage('😀'), true);
});

test('👍🏼 — emoji only — true', () => {
  assert.strictEqual(isEmojiOnlyMessage('👍🏼'), true);
});

test('ok — ASCII text — false', () => {
  assert.strictEqual(isEmojiOnlyMessage('ok'), false);
});

test('ok approved operation_id=abc — mixed content — false', () => {
  assert.strictEqual(isEmojiOnlyMessage('ok approved operation_id=abc'), false);
});

test('approved operation_id=abc — normal text — false', () => {
  assert.strictEqual(isEmojiOnlyMessage('approved operation_id=abc action_hash=xyz'), false);
});

test('empty string — false', () => {
  assert.strictEqual(isEmojiOnlyMessage(''), false);
});

test('null — false', () => {
  assert.strictEqual(isEmojiOnlyMessage(null), false);
});

test('undefined — false', () => {
  assert.strictEqual(isEmojiOnlyMessage(undefined), false);
});

// ============================================
// SECTION 2: parseOperationId
// ============================================
console.log('\nSection 2: operation_id Parser');

test('operation_id=abc-123 — found', () => {
  const r = parseOperationId('approved operation_id=abc-123 action_hash=xyz');
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.value, 'abc-123');
});

test('operation_id=ABC-123 — case insensitive', () => {
  const r = parseOperationId('approved OPERATION_ID=ABC-123');
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.value, 'ABC-123');
});

test('no operation_id — not found', () => {
  const r = parseOperationId('approved action_hash=xyz');
  assert.strictEqual(r.found, false);
  assert.strictEqual(r.value, null);
});

test('malformed (no value) — not found', () => {
  const r = parseOperationId('operation_id= action_hash=xyz');
  assert.strictEqual(r.found, false);
});

test('operation_id only — no action_hash — found with value', () => {
  const r = parseOperationId('approved operation_id=abc-123');
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.value, 'abc-123');
});

test('null — not found', () => {
  const r = parseOperationId(null);
  assert.strictEqual(r.found, false);
});

test('UUID-style id — found', () => {
  const r = parseOperationId('approved operation_id=3f2e1d0c-9b8a-7f6e-5d4c-3b2a1');
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.value, '3f2e1d0c-9b8a-7f6e-5d4c-3b2a1');
});

// ============================================
// SECTION 3: parseActionHash
// ============================================
console.log('\nSection 3: action_hash Parser');

test('action_hash=3f2e1d — found', () => {
  const r = parseActionHash('approved operation_id=abc action_hash=3f2e1d');
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.value, '3f2e1d');
});

test('action_hash long hex — found', () => {
  const r = parseActionHash('approved operation_id=abc action_hash=3f2e1d0c9b8a7f6e5d4c3b2a1');
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.value, '3f2e1d0c9b8a7f6e5d4c3b2a1');
});

test('no action_hash — not found', () => {
  const r = parseActionHash('approved operation_id=abc');
  assert.strictEqual(r.found, false);
  assert.strictEqual(r.value, null);
});

test('malformed (no value) — not found', () => {
  const r = parseActionHash('action_hash= operation_id=abc');
  assert.strictEqual(r.found, false);
});

test('operation_id only — no action_hash — not found', () => {
  const r = parseActionHash('approved operation_id=abc');
  assert.strictEqual(r.found, false);
});

test('null — not found', () => {
  const r = parseActionHash(null);
  assert.strictEqual(r.found, false);
});

// ============================================
// SECTION 4: classifyKeywordStrength
// ============================================
console.log('\nSection 4: Keyword Strength Classification');

test('approved — STRONG', () => {
  const r = classifyKeywordStrength('approved operation_id=abc');
  assert.strictEqual(r.strength, 'STRONG');
  assert.strictEqual(r.score, 1.0);
});

test('proceed — STRONG', () => {
  const r = classifyKeywordStrength('proceed operation_id=abc');
  assert.strictEqual(r.strength, 'STRONG');
});

test('do it — STRONG', () => {
  const r = classifyKeywordStrength('do it operation_id=abc');
  assert.strictEqual(r.strength, 'STRONG');
});

test('go ahead — STRONG', () => {
  const r = classifyKeywordStrength('go ahead operation_id=abc');
  assert.strictEqual(r.strength, 'STRONG');
});

test('ok — MEDIUM', () => {
  const r = classifyKeywordStrength('ok operation_id=abc');
  assert.strictEqual(r.strength, 'MEDIUM');
  assert.strictEqual(r.score, 0.5);
});

test('yes — WEAK', () => {
  const r = classifyKeywordStrength('yes operation_id=abc');
  assert.strictEqual(r.strength, 'WEAK');
  assert.strictEqual(r.score, 0.4);
});

test('yes — WEAK even with full context', () => {
  const r = classifyKeywordStrength('yes operation_id=abc action_hash=xyz');
  assert.strictEqual(r.strength, 'WEAK');
});

test('no keyword — null', () => {
  const r = classifyKeywordStrength('hello world');
  assert.strictEqual(r.keyword, null);
  assert.strictEqual(r.strength, null);
  assert.strictEqual(r.score, 0);
});

test('null — null', () => {
  const r = classifyKeywordStrength(null);
  assert.strictEqual(r.strength, null);
});

// ============================================
// SECTION 5: extractApprovalMessageId
// ============================================
console.log('\nSection 5: MessageSid Extraction');

test('MessageSid available — found', () => {
  const ctx = { MessageSid: 'wamid.test123' };
  const r = extractApprovalMessageId(ctx);
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.value, 'wamid.test123');
  assert.strictEqual(r.source, 'MessageSid');
});

test('MessageSidFull fallback — found', () => {
  const ctx = { MessageSidFull: 'wamid.full.test456' };
  const r = extractApprovalMessageId(ctx);
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.value, 'wamid.full.test456');
  assert.strictEqual(r.source, 'MessageSidFull');
});

test('MessageSid takes priority over MessageSidFull', () => {
  const ctx = { MessageSid: 'wamid.primary', MessageSidFull: 'wamid.full' };
  const r = extractApprovalMessageId(ctx);
  assert.strictEqual(r.value, 'wamid.primary');
  assert.strictEqual(r.source, 'MessageSid');
});

test('Neither available — not found', () => {
  const ctx = {};
  const r = extractApprovalMessageId(ctx);
  assert.strictEqual(r.found, false);
  assert.strictEqual(r.value, null);
});

test('Empty string MessageSid — not found', () => {
  const ctx = { MessageSid: '' };
  const r = extractApprovalMessageId(ctx);
  assert.strictEqual(r.found, false);
});

test('null context — not found', () => {
  const r = extractApprovalMessageId(null);
  assert.strictEqual(r.found, false);
});

test('whitespace trimmed from MessageSid', () => {
  const ctx = { MessageSid: '  wamid.test789  ' };
  const r = extractApprovalMessageId(ctx);
  assert.strictEqual(r.value, 'wamid.test789');
});

// ============================================
// SECTION 6: extractSenderE164
// ============================================
console.log('\nSection 6: Sender E.164 Extraction');

test('SenderE164 available — found', () => {
  const ctx = { SenderE164: '+923215139934' };
  const r = extractSenderE164(ctx);
  assert.strictEqual(r, '+923215139934');
});

test('SenderId fallback — found', () => {
  const ctx = { SenderId: '+923215139934' };
  const r = extractSenderE164(ctx);
  assert.strictEqual(r, '+923215139934');
});

test('Neither available — null', () => {
  const ctx = {};
  const r = extractSenderE164(ctx);
  assert.strictEqual(r, null);
});

test('null context — null', () => {
  const r = extractSenderE164(null);
  assert.strictEqual(r, null);
});

test('whitespace trimmed', () => {
  const ctx = { SenderE164: '  +923215139934  ' };
  const r = extractSenderE164(ctx);
  assert.strictEqual(r, '+923215139934');
});

// ============================================
// SECTION 7: extractTimestamp
// ============================================
console.log('\nSection 7: Timestamp Extraction');

test('number timestamp — ISO-8601 + unix_ms', () => {
  const ctx = { Timestamp: 1715844000000 }; // 2024-05-16T07:20:00.000Z UTC
  const r = extractTimestamp(ctx);
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.unix_ms, 1715844000000);
  assert.strictEqual(r.value, '2024-05-16T07:20:00.000Z');
});

test('non-number timestamp — not found', () => {
  const ctx = { Timestamp: 'not-a-number' };
  const r = extractTimestamp(ctx);
  assert.strictEqual(r.found, false);
});

test('missing timestamp — not found', () => {
  const ctx = {};
  const r = extractTimestamp(ctx);
  assert.strictEqual(r.found, false);
});

test('null context — not found', () => {
  const r = extractTimestamp(null);
  assert.strictEqual(r.found, false);
});

// ============================================
// SECTION 8: isForwardedMessage
// ============================================
console.log('\nSection 8: Forwarded Message Detection');

test('ForwardedFrom = true — true', () => {
  const ctx = { ForwardedFrom: true };
  assert.strictEqual(isForwardedMessage(ctx), true);
});

test('ForwardedFrom = string — true', () => {
  const ctx = { ForwardedFrom: '+1234567890@s.whatsapp.net' };
  assert.strictEqual(isForwardedMessage(ctx), true);
});

test('ForwardedFrom = "" — false', () => {
  const ctx = { ForwardedFrom: '' };
  assert.strictEqual(isForwardedMessage(ctx), false);
});

test('ForwardedFrom missing — false', () => {
  const ctx = {};
  assert.strictEqual(isForwardedMessage(ctx), false);
});

test('null context — false', () => {
  assert.strictEqual(isForwardedMessage(null), false);
});

// ============================================
// SECTION 9: Full Classification — Error Codes
// ============================================
console.log('\nSection 9: Full Classification — Error Codes');

test('Complete valid message — no error codes', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const body = 'approved operation_id=abc-123 action_hash=3f2e1d';
  const r = classifyApprovalMessage(ctx, body);
  assert.strictEqual(r.error_codes.length, 0, 'No errors for complete valid message');
  assert.strictEqual(r.is_valid, true);
});

test('Missing approval_message_id — EEL_APPROVAL_ID_UNAVAILABLE', () => {
  const ctx = {
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const body = 'approved operation_id=abc-123 action_hash=xyz';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_ID_UNAVAILABLE'));
});

test('Missing operation_id — EEL_APPROVAL_NO_OPERATION_LINK', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const body = 'approved action_hash=xyz';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_NO_OPERATION_LINK'));
});

test('Missing action_hash — EEL_APPROVAL_NO_ACTION_HASH', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const body = 'approved operation_id=abc-123';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_NO_ACTION_HASH'));
});

test('Emoji-only — EEL_APPROVAL_EMOJI_BLOCKED', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const r = classifyApprovalMessage(ctx, '👍');
  assert(r.error_codes.includes('EEL_APPROVAL_EMOJI_BLOCKED'));
});

test('Forwarded message — EEL_APPROVAL_FORWARDED', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    ForwardedFrom: '+1234567890@s.whatsapp.net',
  };
  const body = 'approved operation_id=abc-123 action_hash=xyz';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_FORWARDED'));
});

test('Wrong sender — EEL_APPROVAL_NOT_AUTHORITATIVE', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+9876543210', // wrong number
    Timestamp: Date.now(),
  };
  const body = 'approved operation_id=abc-123 action_hash=xyz';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_NOT_AUTHORITATIVE'));
});

test('yes alone (no context) — EEL_APPROVAL_ESCALATED + WEAK keyword', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const body = 'yes';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_ESCALATED'));
  assert(r.error_codes.includes('EEL_APPROVAL_NO_OPERATION_LINK'));
  assert(r.error_codes.includes('EEL_APPROVAL_NO_ACTION_HASH'));
});

test('yes with full context — still WEAK keyword (blocked)', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const body = 'yes operation_id=abc action_hash=xyz';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_INSUFFICIENT_KEYWORD'));
  assert.strictEqual(r.keyword.strength, 'WEAK');
});

// ============================================
// SECTION 10: Stale Approvals
// ============================================
console.log('\nSection 10: Stale Approval Detection');

test('Fresh approval (<30min) — no expiry error', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
  };
  const body = 'approved operation_id=abc action_hash=xyz';
  const r = classifyApprovalMessage(ctx, body);
  assert(!r.error_codes.includes('EEL_APPROVAL_EXPIRED'), 'Fresh approval should not be expired');
});

test('Stale approval (>30min) — EEL_APPROVAL_EXPIRED', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now() - 45 * 60 * 1000, // 45 minutes ago
  };
  const body = 'approved operation_id=abc action_hash=xyz';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_EXPIRED'));
});

test('Missing timestamp — EEL_APPROVAL_TIMESTAMP_MISSING', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
  };
  const body = 'approved operation_id=abc action_hash=xyz';
  const r = classifyApprovalMessage(ctx, body);
  assert(r.error_codes.includes('EEL_APPROVAL_TIMESTAMP_MISSING'));
});

// ============================================
// SECTION 11: Replay Detection
// ============================================
console.log('\nSection 11: Replay Detection');

test('First use of approval_message_id — not replayed', () => {
  const testId = `replay-test-${Date.now()}`;
  const r = checkReplay(testId);
  assert.strictEqual(r.replayed, false);
  cleanupReplayTest(testId);
});

test('After recordReplay — shows as replayed', () => {
  const testId = `replay-test-${Date.now()}`;
  recordReplay(testId);
  const r = checkReplay(testId);
  assert.strictEqual(r.replayed, true);
  assert(r.first_seen_at !== null);
  cleanupReplayTest(testId);
});

function cleanupReplayTest(id) {
  const replayLogPath = path.join(process.cwd(), 'memory', 'EEL-APAC-AUDIT-REPLAY.json');
  if (fs.existsSync(replayLogPath)) {
    try {
      const log = JSON.parse(fs.readFileSync(replayLogPath, 'utf8'));
      delete log[id];
      fs.writeFileSync(replayLogPath, JSON.stringify(log, null, 2));
    } catch (e) { /* ignore */ }
  }
}

// ============================================
// SECTION 12: Audit Log
// ============================================
console.log('\nSection 12: Audit Log Path');

test('getAuditLogPath — returns today date path', () => {
  const p = getAuditLogPath();
  const today = new Date().toISOString().slice(0, 10);
  assert(p.includes(`EEL-APAC-AUDIT-${today}`));
});

test('processApprovalAudit — returns classification (no throw)', () => {
  const ctx = {
    MessageSid: 'wamid.test123',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    SessionId: 'test-session',
  };
  const body = 'approved operation_id=abc action_hash=xyz';
  const r = processApprovalAudit(ctx, body);
  assert.strictEqual(r.approval_message_id.value, 'wamid.test123');
  assert.strictEqual(r.operation_id.value, 'abc');
  assert.strictEqual(r.action_hash.value, 'xyz');
});

test('processApprovalAudit — invalid — returns classification with error codes', () => {
  const ctx = {
    MessageSid: 'wamid.test456',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const body = 'yes'; // insufficient
  const r = processApprovalAudit(ctx, body);
  assert(r.error_codes.length > 0);
  assert.strictEqual(r.is_valid, false);
});

// ============================================
// SECTION 13: Authority Registry Constants
// ============================================
console.log('\nSection 13: Authority Registry');

test('AUTHORITATIVE_CHANNELS includes whatsapp', () => {
  assert(AUTHORITATIVE_CHANNELS.includes('whatsapp'));
});

test('AUTHORITATIVE_OPERATORS has +923215139934', () => {
  assert(AUTHORITATIVE_OPERATORS['+923215139934']);
  assert.strictEqual(AUTHORITATIVE_OPERATORS['+923215139934'].scope, 'ALL');
});

test('APPROVAL_MAX_AGE_MS is 30 minutes', () => {
  assert.strictEqual(APPROVAL_MAX_AGE_MS, 30 * 60 * 1000);
});

test('REQUIRED_KEYWORDS.STRONG has approved, proceed, do it, go ahead', () => {
  assert(REQUIRED_KEYWORDS.STRONG.includes('approved'));
  assert(REQUIRED_KEYWORDS.STRONG.includes('proceed'));
  assert(REQUIRED_KEYWORDS.STRONG.includes('do it'));
  assert(REQUIRED_KEYWORDS.STRONG.includes('go ahead'));
});

test('EMOJI_KEYWORDS includes 👍 ✓ 👌 😀 👍🏼', () => {
  assert(EMOJI_KEYWORDS.includes('👍'));
  assert(EMOJI_KEYWORDS.includes('✓'));
  assert(EMOJI_KEYWORDS.includes('👌'));
  assert(EMOJI_KEYWORDS.includes('😀'));
  assert(EMOJI_KEYWORDS.includes('👍🏼'));
});

// ============================================
// SECTION 14: Constants Exported
// ============================================
console.log('\nSection 14: Module Exports');

test('APPROVAL_KEYWORDS exported from parsers', () => {
  assert(APPROVAL_KEYWORDS);
  assert(Array.isArray(APPROVAL_KEYWORDS.STRONG));
});

// ============================================
// SECTION 15: createApprovalAuditEntry
// ============================================
console.log('\nSection 15: Audit Entry Creation');

test('createApprovalAuditEntry — returns valid entry object', () => {
  const ctx = {
    MessageSid: 'wamid.test789',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
    SessionId: 'session-abc',
  };
  const body = 'approved operation_id=op1 action_hash=ah1';
  const classification = classifyApprovalMessage(ctx, body);
  const entry = createApprovalAuditEntry(classification, { session_id: 'session-abc' });
  
  assert.strictEqual(entry.event_type, 'APPROVAL_CLASSIFIED');
  assert.strictEqual(entry.approval_message_id, 'wamid.test789');
  assert.strictEqual(entry.operation_id, 'op1');
  assert.strictEqual(entry.sender, '+923215139934');
  assert.strictEqual(entry.keyword, 'approved');
  assert(entry.error_codes.length === 0);
  assert.strictEqual(entry.is_valid, true);
});

test('createApprovalAuditEntry — invalid — includes error codes', () => {
  const ctx = {
    MessageSid: 'wamid.test999',
    SenderE164: '+923215139934',
    Timestamp: Date.now(),
  };
  const body = 'yes';
  const classification = classifyApprovalMessage(ctx, body);
  const entry = createApprovalAuditEntry(classification);
  
  assert.strictEqual(entry.is_valid, false);
  assert(entry.error_codes.length > 0);
  assert(entry.error_codes.includes('EEL_APPROVAL_NO_OPERATION_LINK'));
  assert(entry.error_codes.includes('EEL_APPROVAL_NO_ACTION_HASH'));
});

// ============================================
// SECTION 16: Error Code Completeness
// ============================================
console.log('\nSection 16: Error Code Completeness');

test('APAC v3 defined error codes all fire correctly', () => {
  // [input, expectedCode] for string inputs; [ctx, body, expectedCode] for object inputs
  const cases = [
    ['yes operation_id=abc', 'EEL_APPROVAL_INSUFFICIENT_KEYWORD'],
    ['approved operation_id=abc', 'EEL_APPROVAL_NO_ACTION_HASH'],
    ['approved action_hash=xyz', 'EEL_APPROVAL_NO_OPERATION_LINK'],
    [{ MessageSid: '', SenderE164: '+923215139934', Timestamp: Date.now() }, 'approved operation_id=abc action_hash=xyz', 'EEL_APPROVAL_ID_UNAVAILABLE'],
    ['👍', 'EEL_APPROVAL_EMOJI_BLOCKED'],
  ];
  
  for (const caseItem of cases) {
    let ctx, body, expectedCode;
    if (typeof caseItem[0] === 'object') {
      // [ctx, body, expectedCode]
      [ctx, body, expectedCode] = caseItem;
    } else {
      // [body, expectedCode]
      [body, expectedCode] = caseItem;
      ctx = { MessageSid: 'wamid.test', SenderE164: '+923215139934', Timestamp: Date.now() };
    }
    const r = classifyApprovalMessage(ctx, body);
    assert(r.error_codes.includes(expectedCode), `Expected ${expectedCode} for input "${body}"`);
  }
});

// ============================================
// SUMMARY
// ============================================
console.log('\n=== Test Summary ===');
console.log('Passed:', passed);
console.log('Failed:', failed);
console.log(failed === 0 ? '✅ All tests passed!' : `❌ ${failed} test(s) failed`);

process.exit(failed > 0 ? 1 : 0);