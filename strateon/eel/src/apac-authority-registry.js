/**
 * APAC v3 — Authority Registry
 * 
 * Defines authoritative sources for approval verification.
 * This file is PURE DATA — no execution authority.
 */

const AUTHORITATIVE_CHANNELS = ['whatsapp'];

const AUTHORITATIVE_OPERATORS = {
  '+923215139934': {
    name: 'Ahmad Salim',
    scope: 'ALL',
    channel: 'whatsapp',
    notes: 'Primary operator — all operations',
  },
};

const APPROVAL_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
const APPROVAL_CRITICAL_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes for critical ops

const REQUIRED_KEYWORDS = {
  STRONG: ['approved', 'proceed', 'do it', 'go ahead'],
  MEDIUM: ['ok'],
  BLOCKED: ['yes'], // yes alone is insufficient
};

const EMOJI_KEYWORDS = ['👍', '✓', '👌', '😀', '👍🏼', 'ok'];

module.exports = {
  AUTHORITATIVE_CHANNELS,
  AUTHORITATIVE_OPERATORS,
  APPROVAL_MAX_AGE_MS,
  APPROVAL_CRITICAL_MAX_AGE_MS,
  REQUIRED_KEYWORDS,
  EMOJI_KEYWORDS,
};