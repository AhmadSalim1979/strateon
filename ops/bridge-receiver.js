/**
 * Message Bridge Receiver
 * 
 * Receives inbound WhatsApp messages and creates Supabase tasks for processing.
 * This is the inbound half of the GPU-primary message bridge.
 * 
 * Two modes:
 * 1. WEBHOOK MODE: Receive OpenClaw internal events → create bridge tasks
 * 2. POLLING MODE: Poll a message queue file → create bridge tasks
 * 
 * OpenClaw calls this receiver via internal hooks when configured.
 * Alternatively, OpenClaw can be configured to call a webhook on inbound messages.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// === CONFIG ===
const PORT = process.env.BRIDGE_PORT || 3099;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co';
let supabase = null;
const STATE_DIR = '/home/node/.openclaw/workspace/state';
const LOG_FILE = join(STATE_DIR, 'bridge-receiver-log.jsonl');
const ROLLBACK_FILE = join(STATE_DIR, 'bridge-rollback.json');

function getSupabase() {
    if (supabase) return supabase;
    
    // Load env config from moosa-worker .env (has SUPABASE_SERVICE_KEY)
    const envFile = '/home/node/.openclaw/workspace/moosa-worker/.env';
    if (existsSync(envFile)) {
        try {
            const content = readFileSync(envFile, 'utf8');
            for (const line of content.split('\n')) {
                const eqIdx = line.indexOf('=');
                if (eqIdx < 0) continue;
                const k = line.slice(0, eqIdx).trim();
                const v = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
                if (k === 'SUPABASE_SERVICE_KEY' && !process.env.SUPABASE_SERVICE_KEY) process.env.SUPABASE_SERVICE_KEY = v;
                if (k === 'SUPABASE_URL' && !process.env.SUPABASE_URL) process.env.SUPABASE_URL = v;
            }
        } catch {}
    }
    
    // Require @supabase/supabase-js from moosa-worker's node_modules (absolute path)
    let supabasePath;
    try {
        // Try moosa-worker node_modules first
        const { createRequire } = require('module');
        supabasePath = require.resolve('/home/node/.openclaw/workspace/moosa-worker/node_modules/@supabase/supabase-js');
        console.log('[bridge-receiver] [INIT] @supabase/supabase-js found at:', supabasePath);
    } catch {
        // Fallback: require normally (will use node resolution)
        supabasePath = '@supabase/supabase-js';
        console.log('[bridge-receiver] [INIT] Using @supabase/supabase-js from node_modules');
    }
    
    const { createClient } = require(supabasePath);
    let url = process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co';
    if (!url.startsWith('http')) url = 'https://' + url;
    supabase = createClient(url, process.env.SUPABASE_SERVICE_KEY || '');
    console.log('[bridge-receiver] [INIT] Supabase client initialized, URL:', url);
    return supabase;
}

function getSupabase() {
    if (supabase) return supabase;
    
    // Load env config before initializing supabase
    const envFile = '/home/node/.openclaw/workspace/moosa-worker/.env';
    if (existsSync(envFile)) {
        try {
            const content = readFileSync(envFile, 'utf8');
            for (const line of content.split('\n')) {
                const eqIdx = line.indexOf('=');
                if (eqIdx < 0) continue;
                const k = line.slice(0, eqIdx).trim();
                const v = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
                if (k === 'SUPABASE_URL' && !process.env.SUPABASE_URL) process.env.SUPABASE_URL = v;
                if (k === 'SUPABASE_SERVICE_KEY' && !process.env.SUPABASE_SERVICE_KEY) process.env.SUPABASE_SERVICE_KEY = v;
            }
        } catch {}
    }
    
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
        process.env.SUPABASE_URL || 'https://btrbczqjwzuybgcxckvm.supabase.co',
        process.env.SUPABASE_SERVICE_KEY || ''
    );
    return supabase;
}

// === LOGGING ===
function log(level, msg, extra = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        msg,
        ...extra
    };
    console.log(`[bridge-receiver] [${level}] ${msg}`, extra.message_id ? `(msg=${extra.message_id})` : '');
    try {
        if (!existsSync(dirname(LOG_FILE))) mkdirSync(dirname(LOG_FILE), { recursive: true });
        appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch {}
}

// === ROLLBACK CHECK ===
function isRollbackEnabled() {
    try {
        if (existsSync(ROLLBACK_FILE)) {
            const data = JSON.parse(readFileSync(ROLLBACK_FILE, 'utf8'));
            return data.disabled === true;
        }
    } catch {}
    return false;
}

// === TASK CREATION ===
async function createBridgeTask(messageData) {
    // Guard: messageData must be a non-null object
    if (!messageData || typeof messageData !== 'object') {
        throw new Error(`messageData is not an object: ${typeof messageData}`);
    }
    const text = messageData.text || '';
    const from = messageData.from || '';
    const message_id = messageData.message_id;
    const timestamp = messageData.timestamp || new Date().toISOString();
    
    if (!message_id) {
        throw new Error('message_id is required');
    }
    
    // Check rollback mode
    if (isRollbackEnabled()) {
        log('WARN', 'Rollback mode active — using MiniMax path');
    }
    
    // Create a task for the bridge to process
    const taskPayload = {
        action_type: 'message_bridge',
        status: 'pending',
        input_json: {
            text: text || '',
            from: from || '',
            message_id: message_id,
            timestamp: timestamp || new Date().toISOString()
        },
        created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
        .from('tasks')
        .insert(taskPayload)
        .select('id')
        .single();
    
    if (error) {
        throw new Error(`Failed to insert task: ${error.message}`);
    }
    
    log('INFO', 'Created bridge task', { taskId: data.id, message_id });
    return data.id;
}

// === HTTP SERVER ===
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

async function handleRequest(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method !== 'POST') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }
    
    try {
        const body = await parseBody(req);
        
        // Validate required fields
        if (!body.message_id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'message_id required' }));
            return;
        }
        
        // Route based on event type
        const eventType = body.event_type || body.type || 'whatsapp_message';
        
        if (eventType === 'whatsapp_message' || eventType === 'message' || eventType === 'channel_message') {
            // WhatsApp inbound message
            const taskId = await createBridgeTask({
                text: body.text || body.content || body.message || '',
                from: body.from || body.sender || body.phone || '',
                message_id: body.message_id,
                timestamp: body.timestamp || new Date().toISOString()
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true, task_id: taskId, message_id: body.message_id }));
            
        } else if (eventType === 'internal_event') {
            // OpenClaw internal event
            const taskId = await createBridgeTask({
                text: body.content || body.message || JSON.stringify(body.payload || {}),
                from: body.source || 'openclaw-internal',
                message_id: body.event_id || body.message_id || `int-${Date.now()}`,
                timestamp: body.timestamp || new Date().toISOString()
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true, task_id: taskId }));
            
        } else {
            // Unknown event type — log and acknowledge
            log('WARN', 'Unknown event type', { eventType, body_keys: Object.keys(body) });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true, skipped: true, reason: 'unknown_event_type' }));
        }
        
    } catch (err) {
        log('ERROR', 'Request failed', { error: err.message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}

// === HEALTH CHECK ===
function handleHealth(req, res) {
    if (req.method !== 'GET') {
        res.writeHead(404);
        res.end();
        return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'ok',
        service: 'bridge-receiver',
        timestamp: new Date().toISOString(),
        rollback: isRollbackEnabled()
    }));
}

// === START SERVER ===
function startServer() {
    const server = createServer((req, res) => {
        if (req.url === '/health') {
            handleHealth(req, res);
        } else {
            handleRequest(req, res);
        }
    });
    
    server.listen(PORT, '127.0.0.1', () => {
        log('INFO', `Bridge receiver listening on 127.0.0.1:${PORT}`);
        log('INFO', `Health check: http://127.0.0.1:${PORT}/health`);
        log('INFO', `Webhook endpoint: http://127.0.0.1:${PORT}/bridge`);
    });
    
    server.on('error', (err) => {
        console.error('[bridge-receiver] Server error:', err.message);
        process.exit(1);
    });
}

// === UNHANDLED EXCEPTION ===
process.on('unhandledRejection', (reason, promise) => {
    console.error('[bridge-receiver] UNHANDLED REJECTION:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[bridge-receiver] UNCAUGHT EXCEPTION:', err.message, err.stack);
    process.exit(1);
});

// === POLL MESSAGE FILE (alternative to webhook) ===
// OpenClaw can write pending messages to a file instead of calling a webhook.
// This is the fallback polling mechanism.
const MESSAGE_FILE = join(STATE_DIR, 'pending-bridge-messages.jsonl');
let pollCount = 0;

async function pollMessageFile() {
    pollCount++;
    console.log(`[bridge-receiver] [POLL] Starting poll #${pollCount}...`);
    if (!existsSync(MESSAGE_FILE)) {
        console.log(`[bridge-receiver] [POLL] MESSAGE_FILE does not exist yet, skipping`);
        return;
    }
    
    let content;
    try {
        content = readFileSync(MESSAGE_FILE, 'utf8');
        console.log(`[bridge-receiver] [POLL] FILE exists, ${content.length} bytes`);
    } catch (e) {
        console.error(`[bridge-receiver] [POLL] Failed to read file: ${e.message}`);
        return;
    }
    
    if (!content.trim()) {
        console.log(`[bridge-receiver] [POLL] File empty, skipping`);
        return;
    }
    
    const lines = content.split('\n').filter(l => l.trim());
    console.log(`[bridge-receiver] [POLL] ${lines.length} non-empty lines`);
    
    if (lines.length === 0) return;
    
    // Clear the file immediately to prevent double-processing
    try {
        writeFileSync(MESSAGE_FILE, '');
        console.log(`[bridge-receiver] [POLL] File cleared`);
    } catch (e) {
        console.error(`[bridge-receiver] [POLL] Failed to clear file: ${e.message}`);
    }
    
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        try {
            const msg = JSON.parse(line);
            log('INFO', 'Processing message from file', { message_id: msg.message_id, text: (msg.text || '').substring(0, 50) });
            await createBridgeTask(msg);
            log('INFO', 'Bridge task created successfully', { message_id: msg.message_id });
        } catch (e) {
            log('ERROR', 'Failed to process message file entry', { error: e.message, line: line.substring(0, 100) });
        }
    }
}

// === MAIN ===
startServer();

// Poll every 5 seconds as fallback
setInterval(pollMessageFile, 5000);
log('INFO', 'Message file poller started (5s interval)');