/**
 * APAC WhatsApp — Passive Observer Hook
 * 
 * Hook event: inbound_claim
 * Type: Passive observer only — does NOT generate responses, does NOT alter behavior.
 * 
 * Purpose: Validate that inbound_claim fires correctly for WhatsApp messages.
 * All this hook does is LOG — then returns undefined to let OpenClaw handle normally.
 * 
 * Safety commitments:
 * - Never returns a response string
 * - Never calls GPU or MiniMax
 * - Never sends a WhatsApp reply
 * - Never interferes with existing OpenClaw/MiniMax path
 * - gpu_primary_active is FALSE — GPU routing code paths are dead code
 */

const { readFileSync, appendFileSync, existsSync, mkdirSync, writeFileSync } = require('fs');
const { dirname } = require('path');
const { createHash } = require('crypto');

// === PATHS ===
const LOG_FILE = '/home/node/.openclaw/workspace/state/inbound-observer-log.jsonl';
const DEDUP_FILE = '/home/node/.openclaw/workspace/state/inbound-observer-dedup.jsonl';

// === LOGGING ===
function log(level, msg, extra = {}) {
    const entry = { timestamp: new Date().toISOString(), level, msg, ...extra };
    const meta = extra.messageId ? ` (id=${extra.messageId})` : '';
    console.log(`[inbound-observer] [${level}] ${msg}${meta}`);
    try {
        const dir = dirname(LOG_FILE);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch {}
}

// === DEDUP (5-minute window) ===
function checkDedup(messageId) {
    if (!messageId) return false;
    try {
        if (existsSync(DEDUP_FILE)) {
            const lines = readFileSync(DEDUP_FILE, 'utf8').split('\n').filter(Boolean);
            for (const l of lines) {
                try {
                    const e = JSON.parse(l);
                    if (e.message_id === messageId) {
                        const age = Date.now() - new Date(e.ts).getTime();
                        if (age < 5 * 60 * 1000) return true;
                    }
                } catch {}
            }
        }
    } catch {}
    return false;
}

function markDedup(messageId) {
    if (!messageId) return;
    try {
        const dir = dirname(DEDUP_FILE);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        appendFileSync(DEDUP_FILE, JSON.stringify({ message_id: messageId, ts: new Date().toISOString() }) + '\n');
    } catch {}
}

// === CLASSIFICATION ===
const SELF_NUMBER = '+923215139934';

function classifyMessage(context) {
    const from = context.from || '';
    const senderE164 = context.metadata?.senderE164 || '';
    const senderId = context.metadata?.senderId || '';
    const isSelf = (from === SELF_NUMBER || senderE164 === SELF_NUMBER || senderId === SELF_NUMBER);
    
    const messageText = context.content || context.text || context.message?.content || '';
    const hasText = messageText.trim().length > 0;
    
    const channel = context.channelId || '';
    const provider = context.metadata?.provider || '';
    const surface = context.metadata?.surface || '';
    const isWhatsApp = channel.includes('whatsapp') || provider.includes('whatsapp') || surface.includes('whatsapp');
    
    return { isSelf, hasText, isWhatsApp };
}

function getEligibleForGpuRouting(context) {
    // GPU routing is NOT active — gpu_primary_active is false
    // But we still log what WOULD make a message eligible
    const { isSelf, hasText, isWhatsApp } = classifyMessage(context);
    const gpuActive = false; //gpu_primary_active is FALSE — confirmed above
    
    return {
        would_be_eligible: !isSelf && hasText && isWhatsApp && gpuActive,
        reason: !isWhatsApp ? 'not_whatsapp' : isSelf ? 'self_message' : !hasText ? 'empty_message' : !gpuActive ? 'gpu_not_active' : 'eligible'
    };
}

// === DETERMINE HOOK RESULT ===
// For passive observer: ALWAYS return undefined to preserve normal OpenClaw behavior
function shouldGenerateResponse(context) {
    // PASSIVE MODE: never generate a response
    return false;
}

// === MAIN HOOK HANDLER ===
// inbound_claim fires BEFORE OpenClaw runs MiniMax inference
// Return value: response string = replaces MiniMax, undefined = continue normally
async function handler(context) {
    const startMs = Date.now();
    const messageId = context.messageId || `hook-${Date.now()}`;

    // MARK DEDUP FIRST
    const isDup = checkDedup(messageId);
    if (isDup) {
        log('SKIP', 'duplicate_message_already_seen', { messageId });
        return undefined; // Let OpenClaw handle (dedup is our own guard)
    }
    markDedup(messageId);

    // CLASSIFY
    const { isSelf, hasText, isWhatsApp } = classifyMessage(context);
    const eligibility = getEligibleForGpuRouting(context);
    const messageText = context.content || context.text || context.message?.content || '';

    // LOG THE EVENT
    log('INFO', 'inbound_claim_fired', {
        messageId,
        isSelf,
        hasText,
        isWhatsApp,
        textPreview: messageText.substring(0, 60),
        from: context.from || '?',
        senderE164: context.metadata?.senderE164 || '?',
        eligibility: eligibility.reason,
        wouldBeEligibleForGpu: eligibility.would_be_eligible,
        gpuPrimaryActive: false, // PASSIVE MODE — always false
        hookResult: 'undefined (passive observer — no response generated)',
        latency_ms: Date.now() - startMs
    });

    // ALWAYS RETURN UNDEFINED — preserve normal OpenClaw/MiniMax path
    return undefined;
}

module.exports = { handler };