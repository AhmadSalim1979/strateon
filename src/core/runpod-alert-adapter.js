/**
 * RunPod GPU Watchdog Alert Adapter — Phase D-2.4
 * Connects runpod-watchdog.js severity output to WhatsApp alerts
 *
 * Alert routing: openclaw send-whatsapp via execSync
 * Destination: +923215139934 (Ahmad Salim — pre-authorized sender)
 *
 * ALERT TRIGGERS:
 * - HIGH: after retry exhaustion — alert sent
 * - CRITICAL: immediate — alert sent
 * - INFO / WARNING: no WhatsApp alert, log only
 *
 * SUPPRESSION:
 * - Same alert type (same check + severity) within suppression window: skip
 * - Suppression window: 30 minutes (configurable)
 *
 * SECURITY INVARIANTS:
 * - No token printing or exposure
 * - No pod start/stop actions
 * - No production routing changes
 * - No MiniMax changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === PATH CONFIG ===

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const ALERT_STATE_FILE = path.join(STATE_DIR, 'runpod-alert-state.json');
const ALERT_HISTORY_FILE = path.join(STATE_DIR, 'runpod-alert-history.jsonl');

// === CONFIG ===

const ALERT_CONFIG = {
    destination: '+923215139934',
    suppressionWindowMs: 30 * 60 * 1000, // 30 minutes
    alertCooldownMs: 5 * 60 * 1000       // 5 minutes between alerts of same type
};

const SEVERITY_ALERT_THRESHOLD = {
    'INFO': false,    // never alert
    'WARNING': false, // log only for now
    'HIGH': true,     // alert after retry exhaustion
    'CRITICAL': true  // alert immediately
};

// === HELPERS ===

function timestamp() {
    return new Date().toISOString();
}

function ensureStateDir() {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

// === ALERT STATE PERSISTENCE ===

function loadAlertState() {
    ensureStateDir();
    if (!fs.existsSync(ALERT_STATE_FILE)) {
        return { suppressed: {}, lastAlertAt: null, totalSent: 0 };
    }
    try {
        return JSON.parse(fs.readFileSync(ALERT_STATE_FILE, 'utf8'));
    } catch {
        return { suppressed: {}, lastAlertAt: null, totalSent: 0 };
    }
}

function saveAlertState(state) {
    ensureStateDir();
    fs.writeFileSync(ALERT_STATE_FILE, JSON.stringify(state, null, 2));
}

function appendAlertHistory(entry) {
    ensureStateDir();
    fs.appendFileSync(ALERT_HISTORY_FILE, JSON.stringify(entry) + '\n');
}

// === SUPPRESSION LOGIC ===

function isSuppressed(check, severity) {
    const state = loadAlertState();
    const key = check + '::' + severity;
    const entry = state.suppressed[key];

    if (!entry) return false;

    const now = Date.now();
    if (now - entry.lastSent < ALERT_CONFIG.suppressionWindowMs) {
        return true; // still within suppression window
    }

    // Clean up expired entry
    delete state.suppressed[key];
    saveAlertState(state);
    return false;
}

function recordAlert(check, severity) {
    const state = loadAlertState();
    const key = check + '::' + severity;
    state.suppressed[key] = {
        lastSent: Date.now(),
        check,
        severity
    };
    state.lastAlertAt = timestamp();
    state.totalSent = (state.totalSent || 0) + 1;
    saveAlertState(state);
}

// === MESSAGE BUILDERS ===

function buildHighAlertText(alert) {
    const lines = [];
    lines.push('🔶 GPU WATCHDOG ALERT — HIGH');
    lines.push('');
    lines.push('Check: ' + alert.check);
    lines.push('Pod: ' + alert.podId);
    lines.push('Endpoint: ' + alert.endpoint);
    lines.push('Status: ' + alert.statusCode);
    lines.push('');
    lines.push('⚠️ HIGH — Retry exhausted, issue persisting.');
    lines.push('');
    lines.push('Action: Check RunPod dashboard for pod health.');
    lines.push('GPU billing may still be active — verify stop if unused.');
    lines.push('');
    lines.push('Time: ' + alert.timestamp);

    return lines.join('\n');
}

function buildCriticalAlertText(alert) {
    const lines = [];
    lines.push('🚨 GPU WATCHDOG ALERT — CRITICAL');
    lines.push('');
    lines.push('Check: ' + alert.check);
    lines.push('Pod: ' + alert.podId);
    lines.push('Endpoint: ' + alert.endpoint);
    lines.push('Status: ' + alert.statusCode);
    lines.push('');
    lines.push('🚨 CRITICAL — Immediate attention required.');
    lines.push('');
    lines.push('Action: Log into RunPod dashboard now.');
    lines.push('GPU billing continues while pod is RUNNING.');
    lines.push('');
    lines.push('Time: ' + alert.timestamp);

    return lines.join('\n');
}

// === WHATSAPP SEND ===

function sendWhatsAppAlert(text) {
    // Escape single quotes for shell
    const escaped = text.replace(/'/g, "'\\''");
    const cmd = 'openclaw send-whatsapp \'' + ALERT_CONFIG.destination + '\' \'' + escaped + '\'';

    try {
        execSync(cmd, { stdio: 'ignore' });
        return { sent: true, timestamp: timestamp() };
    } catch (e) {
        return { sent: false, error: e.message, timestamp: timestamp() };
    }
}

// === MAIN ALERT FUNCTION ===

function sendGPUAlert(severity, check, podId, endpoint, statusCode, details) {
    // Only alert for HIGH and CRITICAL
    if (!SEVERITY_ALERT_THRESHOLD[severity]) {
        return { sent: false, reason: 'below_alert_threshold', severity };
    }

    // Check suppression
    if (isSuppressed(check, severity)) {
        return { sent: false, reason: 'suppressed', severity, check, podId };
    }

    // Build alert object
    const alert = {
        severity,
        check,
        podId,
        endpoint,
        statusCode,
        details,
        timestamp: timestamp()
    };

    // Build message
    const text = severity === 'CRITICAL'
        ? buildCriticalAlertText(alert)
        : buildHighAlertText(alert);

    // Send
    const result = sendWhatsAppAlert(text);

    // Record if sent
    if (result.sent) {
        recordAlert(check, severity);
        appendAlertHistory({
            ...alert,
            ...result,
            type: severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
        });
    }

    return { ...result, alert };
}

// === CLI ===

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 5) {
        console.log('Usage: node runpod-alert-adapter.js <severity> <check> <podId> <endpoint> <statusCode>');
        console.log('Example: node runpod-alert-adapter.js HIGH model_mistral_present c1as99lq8xtphy https://c1as99lq8xtphy-11440.proxy.runpod.net 401');
        process.exit(1);
    }

    const [severity, check, podId, endpoint, statusCode] = args;
    const result = sendGPUAlert(severity, check, podId, endpoint, statusCode, {});
    console.log(JSON.stringify(result, null, 2));
}

module.exports = { sendGPUAlert, buildHighAlertText, buildCriticalAlertText, sendWhatsAppAlert, isSuppressed, loadAlertState };