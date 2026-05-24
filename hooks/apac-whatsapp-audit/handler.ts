/**
 * GPU Bridge Hook — inbound_claim handler
 * 
 * Intercepts inbound WhatsApp messages BEFORE OpenClaw runs MiniMax inference.
 * Routes them through the GPU-primary production inference wrapper.
 * Returns the GPU response — replaces the MiniMax inference path.
 * 
 * Hook event: inbound_claim (ModifyingHook)
 * ModifyingHook: return value replaces default agent processing.
 * If handler returns null/undefined, OpenClaw continues to normal MiniMax inference.
 * 
 * Safety: self-message guard, dedup, loop prevention, GPU-active check, MiniMax fallback.
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { createHash } from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// === PATHS ===
const LOG_FILE = '/home/node/.openclaw/workspace/state/gpu-bridge-hook-log.jsonl';
const DEDUP_FILE = '/home/node/.openclaw/workspace/state/bridge-dedup.jsonl';
const OPERATIONAL_MODE = '/home/node/.openclaw/workspace/state/operational-mode.json';
const GPU_AUTH_FILE = '/home/node/.openclaw/secrets/gpu-auth-proxy.json';
const BRIDGE_ROLLBACK = '/home/node/.openclaw/workspace/state/bridge-rollback.json';
const LOOP_PREVENTION_FILE = '/home/node/.openclaw/workspace/state/bridge-loop-prevention.json';

// === LOGGING ===
function log(level, msg, extra = {}) {
    const entry = { timestamp: new Date().toISOString(), level, msg, ...extra };
    const meta = extra.messageId ? ` (id=${extra.messageId})` : '';
    console.log(`[gpu-bridge-hook] [${level}] ${msg}${meta}`);
    try {
        const dir = dirname(LOG_FILE);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch {}
}

// === HELPERS ===
function safeReadJson(path) {
    try { return JSON.parse(readFileSync(path, 'utf8')); }
    catch { return null; }
}

function isGpuActive() {
    const state = safeReadJson(OPERATIONAL_MODE);
    if (!state) return false;
    if (state.gpu_primary_active !== true) return false;
    const hours = state.active_hours;
    if (!hours) return true;
    try {
        const now = new Date();
        const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();
        const [sh, sm] = (hours.start || '00:00').split(':').map(Number);
        const [eh, em] = (hours.end || '23:59').split(':').map(Number);
        const start = sh * 60 + sm, end = eh * 60 + em;
        if (start <= end) return nowMins >= start && nowMins < end;
        return nowMins >= start || nowMins < end;
    } catch { return true; }
}

function isRollback() {
    try {
        if (existsSync(BRIDGE_ROLLBACK)) {
            const d = JSON.parse(readFileSync(BRIDGE_ROLLBACK, 'utf8'));
            return d.disabled === true;
        }
    } catch {}
    return false;
}

function checkDedup(messageId) {
    if (!messageId) return false;
    try {
        if (existsSync(DEDUP_FILE)) {
            const lines = readFileSync(DEDUP_FILE, 'utf8').split('\n').filter(Boolean);
            for (const l of lines) {
                try {
                    const e = JSON.parse(l);
                    if (e.message_id === messageId) {
                        const age = Date.now() - new Date(e.processed_at).getTime();
                        if (age < 5 * 60 * 1000) return true;
                    }
                } catch {}
            }
        }
    } catch {}
    return false;
}

function markDedup(messageId, response) {
    if (!messageId) return;
    try {
        const dir = dirname(DEDUP_FILE);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        appendFileSync(DEDUP_FILE, JSON.stringify({
            message_id: messageId,
            processed_at: new Date().toISOString(),
            response: (response || '').substring(0, 100)
        }) + '\n');
    } catch {}
}

function loadLoopHashes() {
    try {
        if (existsSync(LOOP_PREVENTION_FILE)) {
            return safeReadJson(LOOP_PREVENTION_FILE)?.hashes || [];
        }
    } catch {}
    return [];
}

function saveLoopHashes(hashes) {
    try {
        const dir = dirname(LOOP_PREVENTION_FILE);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(LOOP_PREVENTION_FILE, JSON.stringify({ hashes: hashes.slice(-10) }));
    } catch {}
}

function checkLoop(text) {
    if (!text) return false;
    const hash = createHash('sha256').update(text).digest('hex').substring(0, 16);
    const prev = loadLoopHashes();
    if (prev.includes(hash)) return true;
    saveLoopHashes([...prev, hash]);
    return false;
}

function isSelfMessage(context): boolean {
    const selfNumber = '+923215139934';
    const from = context.from || '';
    const senderE164 = context.metadata?.senderE164 || '';
    const senderId = context.metadata?.senderId || '';
    return from === selfNumber || senderE164 === selfNumber || senderId === selfNumber;
}

function isWhatsAppChannel(context): boolean {
    const channel = context.channelId || '';
    const provider = context.metadata?.provider || '';
    const surface = context.metadata?.surface || '';
    return channel.includes('whatsapp') || provider.includes('whatsapp') || surface.includes('whatsapp');
}

// === GPU INFERENCE ===
async function callGpu(userMessage: string): Promise<{ ok: boolean; response?: string; error?: string }> {
    const auth = safeReadJson(GPU_AUTH_FILE);
    if (!auth?.token) return { ok: false, error: 'no GPU auth token' };

    const GPU_URL = 'https://23a9nue4xq4r4p-11440.proxy.runpod.net';
    const GPU_MODEL = 'mistral-small3.2:latest';
    const token = auth.token;

    const body = {
        model: GPU_MODEL,
        messages: [
            { role: 'system', content: 'You are Moosa, a warm and resourceful AI assistant. Keep responses concise (under 100 words) and genuinely helpful.' },
            { role: 'user', content: userMessage }
        ],
        max_tokens: 512,
        temperature: 0.7
    };

    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve({ ok: false, error: 'timeout' }), 20000);
        try {
            const https = require('https');
            const postData = JSON.stringify(body);
            const url = new URL(`${GPU_URL}/api/chat`);
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    clearTimeout(timeout);
                    const lines = data.split('\n').filter(l => l.trim());
                    let responseText = '';
                    for (const line of lines) {
                        try {
                            const obj = JSON.parse(line);
                            if (obj.message?.content) responseText = obj.message.content;
                            if (obj.done) break;
                        } catch {}
                    }
                    resolve({ ok: true, response: responseText.trim() });
                });
            });
            req.on('error', (e) => { clearTimeout(timeout); resolve({ ok: false, error: e.message }); });
            req.write(postData);
            req.end();
        } catch (e) { clearTimeout(timeout); resolve({ ok: false, error: String(e) }); }
    });
}

// === MINIMAX FALLBACK (for when GPU fails or rollback is active) ===
async function callMinimax(userMessage: string): Promise<string | null> {
    const auth = safeReadJson('/root/.openclaw/agents/main/agent/auth-profiles.json');
    const token = auth?.profiles?.minimax?.token;
    if (!token) return null;

    const body = {
        model: 'MiniMax-M2.7-200K',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
            { role: 'system', content: 'You are Moosa, a warm and capable AI assistant. Keep responses concise.' },
            { role: 'user', content: userMessage }
        ]
    };

    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 25000);
        try {
            const https = require('https');
            const postData = JSON.stringify(body);
            const url = new URL('https://api.minimax.io/anthropic/v1/messages');
            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    clearTimeout(timeout);
                    try {
                        const d = JSON.parse(data);
                        resolve(d.content?.[0]?.text || d.choices?.[0]?.message?.content || null);
                    } catch { resolve(null); }
                });
            });
            req.on('error', () => { clearTimeout(timeout); resolve(null); });
            req.write(postData);
            req.end();
        } catch { clearTimeout(timeout); resolve(null); }
    });
}

// === WRITE FILE HELPER (needed for loop prevention) ===
function writeFileSync(path: string, data: string) {
    const { writeFileSync: w } = require('fs');
    w(path, data);
}

// === MAIN HOOK HANDLER ===
export default async function handler(context: any): Promise<string | null> {
    const startMs = Date.now();
    const messageId: string = context.messageId || `hook-${Date.now()}`;

    // === CHANNEL GUARD ===
    if (!isWhatsAppChannel(context)) {
        log('SKIP', 'not_whatsapp', { channelId: context.channelId });
        return undefined; // Let OpenClaw handle normally
    }

    // === SELF-MESSAGE GUARD ===
    if (isSelfMessage(context)) {
        log('SKIP', 'self_message_outbound', { from: context.from });
        return undefined; // Don't respond to our own sent messages
    }

    // === DEDUP ===
    if (checkDedup(messageId)) {
        log('SKIP', 'duplicate_message', { messageId });
        return undefined;
    }

    // === GET MESSAGE TEXT ===
    const messageText: string = context.content || context.text || context.message?.content || '';
    if (!messageText.trim()) {
        log('SKIP', 'empty_message', { messageId });
        return undefined;
    }

    log('INFO', 'inbound_claim received', { messageId, text: messageText.substring(0, 80) });

    // === ROLLBACK MODE ===
    if (isRollback()) {
        log('WARN', 'rollback_active_using_minimax', { messageId });
        const response = await callMinimax(messageText);
        if (response) {
            markDedup(messageId, response);
            log('INFO', 'minimax_response_sent', { messageId, latency_ms: Date.now() - startMs, source: 'Minimax-rollback' });
            return response;
        }
        return undefined;
    }

    // === GPU ACTIVE CHECK ===
    const gpuActive = isGpuActive();
    log('INFO', 'gpu_status_check', { messageId, gpuActive, gpu_primary_active: safeReadJson(OPERATIONAL_MODE)?.gpu_primary_active });

    // === GPU ROUTING ===
    if (gpuActive) {
        log('INFO', 'routing_to_gpu', { messageId });
        const gpuResult = await callGpu(messageText);

        if (gpuResult?.ok && gpuResult.response) {
            const responseText = gpuResult.response;

            // Loop check
            if (checkLoop(responseText)) {
                log('WARN', 'loop_detected_aborting_response', { messageId });
                markDedup(messageId, '[loop detected]');
                return '👍'; // Neutral acknowledgment
            }

            markDedup(messageId, responseText);
            log('INFO', 'gpu_response_success', {
                messageId,
                latency_ms: Date.now() - startMs,
                source: 'GPU',
                response_length: responseText.length
            });
            // Return the GPU response — THIS REPLACES MiniMax
            return responseText;
        }

        log('WARN', 'gpu_failed_using_fallback', { messageId, error: gpuResult?.error || 'unknown' });
    }

    // === GPU UNAVAILABLE OR FAILED — TRY MINIMAX FALLBACK ===
    log('INFO', 'using_minimax_fallback', { messageId });
    const mmResponse = await callMinimax(messageText);

    if (mmResponse) {
        markDedup(messageId, mmResponse);
        log('INFO', 'minimax_fallback_success', { messageId, latency_ms: Date.now() - startMs, source: 'Minimax' });
        return mmResponse;
    }

    // === TOTAL FAILURE ===
    log('ERROR', 'all_providers_failed', { messageId, latency_ms: Date.now() - startMs });
    return undefined; // Let OpenClaw handle normally (will use MiniMax)
}