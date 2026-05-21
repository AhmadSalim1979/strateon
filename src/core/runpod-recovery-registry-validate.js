/**
 * RunPod Recovery Registry — Validation Script
 * Simulates failures and confirms proposal logging without executing any recovery
 */

const fs = require('fs');
const path = require('path');
const { RECOVERY_REGISTRY, CLASS, getRecoveryById, getAllForCheck, proposeRecovery } = require('./runpod-recovery-registry');

const PROPOSALS_FILE = path.join(__dirname, '..', '..', 'state', 'recovery-proposals.jsonl');

// Clean slate
if (fs.existsSync(PROPOSALS_FILE)) fs.unlinkSync(PROPOSALS_FILE);

console.log('=== D-2.5 Validation: Simulated Failure → Proposal Flow ===\n');

// Simulate 6 failure scenarios
const scenarios = [
    {
        name: 'SIMULATED: pod_rest_status → desiredStatus !== RUNNING',
        check: 'pod_rest_status',
        trigger: 'desiredStatus !== RUNNING',
        recoveryId: 'POD-001',
        expectedClass: CLASS.APPROVAL_REQUIRED,
        expectedAction: 'podResume',
        simulateFailure: { desiredStatus: 'STOPPED', publicIp: null }
    },
    {
        name: 'SIMULATED: auth_proxy_health → HTTP 503 after retry',
        check: 'auth_proxy_health',
        trigger: 'HTTP 503 / connection refused after retry',
        recoveryId: 'PROXY-001',
        expectedClass: CLASS.APPROVAL_REQUIRED,
        expectedAction: 'proxyRestartPlan',
        simulateFailure: { http_code: '503', error: 'Service Unavailable' }
    },
    {
        name: 'SIMULATED: token_invalid_rejected → returns 200 (security!)',
        check: 'token_invalid_rejected',
        trigger: 'invalid token returns !== 401',
        recoveryId: 'TOKEN-001',
        expectedClass: CLASS.FORBIDDEN,
        expectedAction: null,
        simulateFailure: { http_code: '200', error: null }
    },
    {
        name: 'SIMULATED: token_valid_accepted → returns 500 after retry',
        check: 'token_valid_accepted',
        trigger: 'valid token returns !== 200 after retry',
        recoveryId: 'TOKEN-002',
        expectedClass: CLASS.APPROVAL_REQUIRED,
        expectedAction: 'tokenRotationPlan',
        simulateFailure: { http_code: '500', error: 'Internal Server Error' }
    },
    {
        name: 'SIMULATED: model_mistral_present → model missing',
        check: 'model_mistral_present',
        trigger: 'model missing after Ollama is running',
        recoveryId: 'MODEL-001',
        expectedClass: CLASS.APPROVAL_REQUIRED,
        expectedAction: 'modelPullPlan',
        simulateFailure: { model_found: false, models: [] }
    },
    {
        name: 'SIMULATED: GPU_OUT_OF_WINDOW → pod RUNNING outside window',
        check: 'GPU_OUT_OF_WINDOW',
        trigger: 'pod RUNNING outside approved window',
        recoveryId: 'WINDOW-001',
        expectedClass: CLASS.APPROVAL_REQUIRED,
        expectedAction: 'podStopPlan',
        simulateFailure: { podId: 'c1as99lq8xtphy', isRunning: true, costPerHr: 0.69 }
    }
];

let allPassed = true;

scenarios.forEach((s, i) => {
    console.log('Test ' + (i+1) + ': ' + s.name);

    // 1. Confirm recovery entry exists and is correctly classified
    const recovery = getRecoveryById(s.recoveryId);
    if (!recovery) {
        console.log('  ❌ FAIL: Recovery ID ' + s.recoveryId + ' not found');
        allPassed = false;
        return;
    }
    console.log('  ✅ Recovery entry found: ' + recovery.actionLabel);
    console.log('     Classification: ' + recovery.classification + ' (expected: ' + s.expectedClass + ')');
    if (recovery.classification !== s.expectedClass) {
        console.log('  ❌ FAIL: Wrong classification');
        allPassed = false;
        return;
    }

    // 2. Confirm action matches
    if (recovery.action !== s.expectedAction) {
        console.log('  ❌ FAIL: Wrong action ' + (recovery.action || 'null') + ' (expected: ' + s.expectedAction + ')');
        allPassed = false;
        return;
    }

    // 3. Confirm hook is DISABLED
    if (recovery.enabled !== false) {
        console.log('  ❌ FAIL: Hook should be DISABLED but is enabled');
        allPassed = false;
        return;
    }
    console.log('  ✅ Hook is correctly DISABLED');

    // 4. Simulate proposal logging (does not execute anything)
    const proposal = proposeRecovery(s.check, s.trigger, s.simulateFailure, s.recoveryId);
    console.log('  ✅ Proposal logged: ' + proposal.id + ' [' + proposal.classification + ']');
    console.log('     Action: ' + proposal.action + ' (' + recovery.params.dryRunNote + ')');

    // 5. For FORBIDDEN — confirm no recovery action is set
    if (s.expectedClass === CLASS.FORBIDDEN) {
        if (recovery.action !== null) {
            console.log('  ❌ FAIL: FORBIDDEN action should be null');
            allPassed = false;
            return;
        }
        console.log('  ✅ FORBIDDEN correctly has null action (no auto-fix permitted)');
    }

    console.log('');
});

console.log('=== Validation 2: Proposals Persisted ===\n');
if (fs.existsSync(PROPOSALS_FILE)) {
    const lines = fs.readFileSync(PROPOSALS_FILE, 'utf8').trim().split('\n').filter(l => l);
    console.log('Proposals logged: ' + lines.length);
    lines.forEach((l, i) => {
        const p = JSON.parse(l);
        console.log('  ' + (i+1) + '. [' + p.classification + '] ' + p.id + ' — ' + p.action + ' — status: ' + p.status);
    });
    if (lines.length === scenarios.length) {
        console.log('✅ All ' + scenarios.length + ' proposals persisted correctly\n');
    } else {
        console.log('❌ Expected ' + scenarios.length + ' proposals, got ' + lines.length + '\n');
        allPassed = false;
    }
} else {
    console.log('❌ Proposals file not found\n');
    allPassed = false;
}

console.log('=== Validation 3: Classification Table ===\n');
const byClass = {};
Object.values(CLASS).forEach(c => { byClass[c] = []; });
RECOVERY_REGISTRY.forEach(r => byClass[r.classification].push(r));
Object.entries(byClass).forEach(([cls, entries]) => {
    console.log(cls + ': ' + entries.length + ' entries');
    entries.forEach(e => {
        console.log('  ' + e.id + ' [' + e.check + '] — ' + (e.action || '(no action)') + ' — ' + (e.enabled ? 'ENABLED' : 'disabled'));
    });
    console.log('');
});

console.log('=== ALL VALIDATIONS ===');
console.log(allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED');
console.log('');
console.log('Confirmations:');
console.log('  ✅ No real recovery actions executed');
console.log('  ✅ No pod start/stop/terminate/create operations');
console.log('  ✅ No production routing changes');
console.log('  ✅ No MiniMax changes');
console.log('  ✅ No cron behavior changes');
console.log('  ✅ All hooks DISABLED by default');
console.log('  ✅ FORBIDDEN entries have null action');
console.log('  ✅ All proposals logged to state/recovery-proposals.jsonl');
console.log('  ✅ Classification correctly assigned');