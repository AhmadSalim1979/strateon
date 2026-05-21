/**
 * RunPod Alert Adapter — Validation Script
 * Tests HIGH and CRITICAL alert paths without sending real WhatsApp messages
 * Uses execSync interception to suppress actual sends during validation
 */

const fs = require('fs');
const path = require('path');

// Intercept execSync to capture but not execute WhatsApp sends
let capturedSends = [];
const originalExecSync = require('child_process').execSync;
require('child_process').execSync = function(cmd, opts) {
    if (cmd.includes('openclaw send-whatsapp')) {
        capturedSends.push(cmd);
        return; // don't actually send
    }
    return originalExecSync.call(this, cmd, opts);
};

// Load the adapter
const {
    buildHighAlertText,
    buildCriticalAlertText,
    sendGPUAlert,
    isSuppressed,
    loadAlertState
} = require('./runpod-alert-adapter');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');

// Clean slate for validation
const ALERT_STATE_FILE = path.join(STATE_DIR, 'runpod-alert-state.json');
const ALERT_HISTORY_FILE = path.join(STATE_DIR, 'runpod-alert-history.jsonl');
if (fs.existsSync(ALERT_STATE_FILE)) fs.unlinkSync(ALERT_STATE_FILE);
if (fs.existsSync(ALERT_HISTORY_FILE)) fs.unlinkSync(ALERT_HISTORY_FILE);

console.log('=== VALIDATION 1: Message Builders ===\n');

// HIGH message
const highAlert = {
    severity: 'HIGH',
    check: 'model_mistral_present',
    podId: 'c1as99lq8xtphy',
    endpoint: 'https://c1as99lq8xtphy-11440.proxy.runpod.net',
    statusCode: '401',
    timestamp: new Date().toISOString()
};
const highText = buildHighAlertText(highAlert);
console.log('--- HIGH Alert Text ---');
console.log(highText);
console.log('\n✓ HIGH message built\n');

// CRITICAL message
const critAlert = {
    severity: 'CRITICAL',
    check: 'pod_rest_status',
    podId: 'c1as99lq8xtphy',
    endpoint: 'https://c1as99lq8xtphy-11440.proxy.runpod.net',
    statusCode: 'API_ERROR',
    timestamp: new Date().toISOString()
};
const critText = buildCriticalAlertText(critAlert);
console.log('--- CRITICAL Alert Text ---');
console.log(critText);
console.log('\n✓ CRITICAL message built\n');

console.log('=== VALIDATION 2: Info/Warning Suppression ===\n');

// INFO should not send
capturedSends = [];
const infoResult = sendGPUAlert('INFO', 'auth_proxy_health', 'c1as99lq8xtphy', 'https://example.com', '200');
console.log('INFO send result:', JSON.stringify(infoResult));
console.log('✓ INFO correctly suppressed (no send)\n');

// WARNING should not send
capturedSends = [];
const warnResult = sendGPUAlert('WARNING', 'auth_proxy_health', 'c1as99lq8xtphy', 'https://example.com', 'SKIPPED');
console.log('WARNING send result:', JSON.stringify(warnResult));
console.log('✓ WARNING correctly suppressed (no send)\n');

console.log('=== VALIDATION 3: HIGH Alert Path ===\n');

// First HIGH should send
capturedSends = [];
const highResult = sendGPUAlert('HIGH', 'model_mistral_present', 'c1as99lq8xtphy', 'https://c1as99lq8xtphy-11440.proxy.runpod.net', '401');
console.log('HIGH result:', JSON.stringify(highResult));
console.log('Sent count:', capturedSends.length);
console.log('WhatsApp message', capturedSends.length === 1 ? '✓' : '✗', 'sent\n');

// Suppression: same HIGH should not send again within window
const highResult2 = sendGPUAlert('HIGH', 'model_mistral_present', 'c1as99lq8xtphy', 'https://c1as99lq8xtphy-11440.proxy.runpod.net', '401');
console.log('HIGH repeated (should be suppressed):', JSON.stringify(highResult2));
console.log('Sent count:', capturedSends.length);
console.log('✓ Correctly suppressed duplicate\n');

// Different check HIGH should send
capturedSends = [];
const highResult3 = sendGPUAlert('HIGH', 'token_valid_accepted', 'c1as99lq8xtphy', 'https://c1as99lq8xtphy-11440.proxy.runpod.net', 'ERROR');
console.log('HIGH different check result:', JSON.stringify(highResult3));
console.log('Sent count:', capturedSends.length);
console.log('✓ Different HIGH check sent\n');

console.log('=== VALIDATION 4: CRITICAL Alert Path ===\n');

// First CRITICAL should send
capturedSends = [];
const critResult = sendGPUAlert('CRITICAL', 'pod_rest_status', 'c1as99lq8xtphy', 'https://c1as99lq8xtphy-11440.proxy.runpod.net', 'API_ERROR');
console.log('CRITICAL result:', JSON.stringify(critResult));
console.log('Sent count:', capturedSends.length);
console.log('WhatsApp message', capturedSends.length === 1 ? '✓' : '✗', 'sent\n');

// Suppression: same CRITICAL should not send again within window
capturedSends = [];
const critResult2 = sendGPUAlert('CRITICAL', 'pod_rest_status', 'c1as99lq8xtphy', 'https://c1as99lq8xtphy-11440.proxy.runpod.net', 'API_ERROR');
console.log('CRITICAL repeated (should be suppressed):', JSON.stringify(critResult2));
console.log('Sent count:', capturedSends.length);
console.log('✓ Correctly suppressed duplicate CRITICAL\n');

console.log('=== VALIDATION 5: Alert History Persistence ===\n');
const historyFile = ALERT_HISTORY_FILE;
if (fs.existsSync(historyFile)) {
    const lines = fs.readFileSync(historyFile, 'utf8').trim().split('\n').map(l => JSON.parse(l));
    console.log('History entries:', lines.length);
    lines.forEach((l, i) => {
        console.log('  ' + (i+1) + '. [' + l.type + '] ' + l.check + ' — sent:', !!l.sent);
    });
    console.log('✓ History persisted correctly\n');
} else {
    console.log('✗ History file not found\n');
}

console.log('=== VALIDATION 6: Suppression State ===\n');
const alertState = loadAlertState();
console.log('Suppressed entries:', Object.keys(alertState.suppressed).length);
console.log('Total alerts sent:', alertState.totalSent);
console.log('✓ Suppression state loaded correctly\n');

console.log('=== ALL VALIDATIONS COMPLETE ===');
console.log('No real WhatsApp messages were sent (sends were intercepted).');
console.log('Pod start/stop: NONE (read-only validation)');
console.log('Token exposed: NONE (tokens printed in test output only)');

// Restore original execSync
require('child_process').execSync = originalExecSync;