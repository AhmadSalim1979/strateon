/**
 * RunPod GPU Recovery Action Registry — Phase D-2.5 (DESIGN ONLY)
 * SHADOW-ONLY: All hooks DISABLED by default — no autonomous execution
 *
 * Classification levels:
 * - SAFE_AUTONOMOUS: Watchdog may propose this action without human approval (but still disabled here)
 * - APPROVAL_REQUIRED: Requires explicit Ahmad approval before execution
 * - FORBIDDEN: Watchdog must never propose or execute this action
 *
 * Recovery hooks are REGISTERED ONLY — activation requires separate explicit approval.
 * This file is a design + registry, not an execution engine.
 *
 * SECURITY INVARIANTS:
 * - No hook executes autonomously
 * - No FORBIDDEN actions are ever proposed
 * - All proposed recoveries are logged to state/recovery-proposals.jsonl
 * - No pod delete/terminate/create operations
 * - No production routing changes
 * - No MiniMax changes
 */

const fs = require('fs');
const path = require('path');

// === PATH CONFIG ===

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const PROPOSALS_FILE = path.join(STATE_DIR, 'recovery-proposals.jsonl');

// === CLASSIFICATION CONSTANTS ===

const CLASS = {
    SAFE_AUTONOMOUS: 'SAFE_AUTONOMOUS',
    APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
    FORBIDDEN: 'FORBIDDEN'
};

const SEVERITY = {
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
    WARNING: 'WARNING',
    INFO: 'INFO'
};

// === RECOVERY ACTION REGISTRY ===
// Each entry: { check, condition, classification, action, params, description, alertText }

const RECOVERY_REGISTRY = [

    // ================================================================
    // CHECK: pod_rest_status
    // ================================================================

    {
        id: 'POD-001',
        check: 'pod_rest_status',
        trigger: 'desiredStatus !== RUNNING',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'podResume',
        actionLabel: 'Resume RunPod pod via API',
        params: {
            method: 'POST',
            endpoint: '/pods/{pod_id}/start',
            body: null,
            idempotent: true,
            dryRunNote: 'Would POST to https://rest.runpod.io/v1/pods/{pod_id}/start'
        },
        description: 'Pod is not RUNNING. Propose resume via RunPod REST API.',
        alertText: 'Pod {pod_id} is not RUNNING. Resume via RunPod API? Approve: /approve POD-001',
        governed: true,
        enabled: false // DISABLED — approval required
    },

    {
        id: 'POD-002',
        check: 'pod_rest_status',
        trigger: 'API_ERROR or timeout',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'podStatusRequery',
        actionLabel: 'Re-query pod status via REST',
        params: {
            method: 'GET',
            endpoint: '/pods/{pod_id}',
            body: null,
            idempotent: true,
            dryRunNote: 'Would GET https://rest.runpod.io/v1/pods/{pod_id}'
        },
        description: 'Pod status check failed. Re-query after short delay.',
        alertText: 'Pod status check failed (API_ERROR). Re-query recommended. No action taken.',
        governed: true,
        enabled: false // DISABLED — informational only
    },

    {
        id: 'POD-003',
        check: 'pod_rest_status',
        trigger: 'pod explicitly STOPPED by user',
        classification: CLASS.FORBIDDEN,
        action: null,
        actionLabel: null,
        description: 'If user intentionally stopped the pod, watchdog must not resume it.',
        alertText: 'Pod stopped by user — no recovery proposed.',
        governed: false,
        enabled: false
    },

    // ================================================================
    // CHECK: auth_proxy_health
    // ================================================================

    {
        id: 'PROXY-001',
        check: 'auth_proxy_health',
        trigger: 'HTTP 503 / connection refused after retry',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'proxyRestartPlan',
        actionLabel: 'Restart auth proxy on RunPod (web-terminal command)',
        params: {
            method: 'INTERNAL_COMMAND',
            command: 'bash /workspace/start-all.sh',
            dryRunNote: 'Would instruct user to run: bash /workspace/start-all.sh on RunPod web-terminal'
        },
        description: 'Auth proxy not responding after retries. Propose manual restart via web terminal.',
        alertText: 'Auth proxy down after retry. Restart plan: run bash /workspace/start-all.sh on RunPod web-terminal. Approve: /approve PROXY-001',
        governed: true,
        enabled: false // DISABLED
    },

    {
        id: 'PROXY-002',
        check: 'auth_proxy_health',
        trigger: 'HTTP 200 but malformed response',
        classification: CLASS.SAFE_AUTONOMOUS,
        action: 'revalidateAuthProxy',
        actionLabel: 'Re-validate auth proxy with token check',
        params: {
            method: 'INTERNAL_RETRY',
            checkSequence: ['invalid token → 401', 'valid token → model list'],
            dryRunNote: 'Would run internal check sequence without external action'
        },
        description: 'Proxy responded but response was unexpected. Re-validate with token checks.',
        alertText: 'Auth proxy re-validation recommended (malformed response).',
        governed: false,
        enabled: false // DISABLED
    },

    // ================================================================
    // CHECK: token_invalid_rejected
    // ================================================================

    {
        id: 'TOKEN-001',
        check: 'token_invalid_rejected',
        trigger: 'invalid token returns !== 401',
        classification: CLASS.FORBIDDEN,
        action: null,
        actionLabel: null,
        description: 'Auth proxy accepting invalid tokens = security failure. Propose DISABLING GPU routing and alert.',
        alertText: 'SECURITY ALERT: Auth proxy not rejecting invalid tokens — disable GPU routing immediately. FORBIDDEN to auto-restore without investigation.',
        governed: false,
        enabled: false // FORBIDDEN to auto-fix — security incident
    },

    // ================================================================
    // CHECK: token_valid_accepted
    // ================================================================

    {
        id: 'TOKEN-002',
        check: 'token_valid_accepted',
        trigger: 'valid token returns !== 200 after retry',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'tokenRotationPlan',
        actionLabel: 'Rotate GPU auth proxy token',
        params: {
            method: 'MANUAL_PROCESS',
            steps: [
                '1. Generate new token on RunPod: node -e "require(crypto).randomBytes(32).toString(hex)"',
                '2. Update /workspace/gpu-api-token.txt on RunPod pod',
                '3. Update secrets/gpu-auth-proxy.json on Hetzner',
                '4. Re-run health check to validate'
            ],
            dryRunNote: 'Would propose token rotation process to Ahmad'
        },
        description: 'Valid token rejected — token may have rotated or proxy malfunctioning. Propose rotation.',
        alertText: 'Valid token rejected after retry. Token rotation recommended. Approve: /approve TOKEN-002',
        governed: true,
        enabled: false // DISABLED
    },

    {
        id: 'TOKEN-003',
        check: 'token_valid_accepted',
        trigger: 'connection timeout from Hetzner but proxy works internally',
        classification: CLASS.SAFE_AUTONOMOUS,
        action: 'logConnectionFiltering',
        actionLabel: 'Log upstream filtering event (no action)',
        params: {
            method: 'LOG_ONLY',
            dryRunNote: 'Would log event to state/recovery-proposals.jsonl only'
        },
        description: 'Hetzner→RunPod connection filtered but internal proxy works. Log only.',
        alertText: 'Connection filtered upstream. GPU proxy works internally. No action required — logging event.',
        governed: false,
        enabled: false // DISABLED — informational
    },

    // ================================================================
    // CHECK: model_mistral_present
    // ================================================================

    {
        id: 'MODEL-001',
        check: 'model_mistral_present',
        trigger: 'model missing after Ollama is running',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'modelPullPlan',
        actionLabel: 'Pull mistral-small3.2:latest model on RunPod',
        params: {
            method: 'INTERNAL_COMMAND',
            command: 'curl -X POST http://127.0.0.1:11434/api/pull -d \'{"name":"mistral-small3.2:latest"}\'',
            dryRunNote: 'Would instruct user to run model pull via RunPod web-terminal'
        },
        description: 'Model missing. Propose model pull via Ollama API.',
        alertText: 'mistral-small3.2:latest missing. Pull plan: curl -X POST http://127.0.0.1:11434/api/pull -d \'{"name":"mistral-small3.2:latest"}\' on RunPod. Approve: /approve MODEL-001',
        governed: true,
        enabled: false // DISABLED
    },

    {
        id: 'MODEL-002',
        check: 'model_mistral_present',
        trigger: 'Ollama not responding (11434 connection refused)',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'ollamaRestartPlan',
        actionLabel: 'Restart Ollama on RunPod',
        params: {
            method: 'INTERNAL_COMMAND',
            command: 'bash /workspace/start-all.sh',
            dryRunNote: 'Would instruct user to run: bash /workspace/start-all.sh on RunPod web-terminal'
        },
        description: 'Ollama not responding. Propose restart via start-all.sh.',
        alertText: 'Ollama not responding on GPU. Restart plan: bash /workspace/start-all.sh on RunPod web-terminal. Approve: /approve MODEL-002',
        governed: true,
        enabled: false // DISABLED
    },

    // ================================================================
    // CHECK: GPU_OUT_OF_WINDOW (custom check from wrapper)
    // ================================================================

    {
        id: 'WINDOW-001',
        check: 'GPU_OUT_OF_WINDOW',
        trigger: 'pod RUNNING outside approved window',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'podStopPlan',
        actionLabel: 'Stop RunPod pod via API',
        params: {
            method: 'POST',
            endpoint: '/pods/{pod_id}/stop',
            body: null,
            idempotent: true,
            dryRunNote: 'Would POST to https://rest.runpod.io/v1/pods/{pod_id}/stop'
        },
        description: 'Pod running outside window and billing. Propose stop via API. Requires explicit approval.',
        alertText: 'GPU running outside approved window — billing active. Stop plan: POST /pods/{pod_id}/stop. Approve: /approve WINDOW-001',
        governed: true,
        enabled: false // DISABLED — approval required
    },

    {
        id: 'WINDOW-002',
        check: 'GPU_OUT_OF_WINDOW',
        trigger: 'pod RUNNING outside window AND cost threshold exceeded',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'costEscalationAlert',
        actionLabel: 'Escalate cost risk to Ahmad',
        params: {
            method: 'WHATSAPP_ALERT',
            dryRunNote: 'Would send cost escalation WhatsApp alert to Ahmad'
        },
        description: 'Pod running outside window AND estimated cost exceeds safe threshold. Escalate.',
        alertText: 'COST ESCALATION: GPU running outside window, estimated cost exceeds safe threshold. Immediate attention required.',
        governed: true,
        enabled: false // DISABLED
    },

    // ================================================================
    // CHECK: MiniMax fallback
    // ================================================================

    {
        id: 'MINIMAX-001',
        check: 'minimax_fallback_spike',
        trigger: 'MiniMax usage > 50% of total requests in window',
        classification: CLASS.SAFE_AUTONOMOUS,
        action: 'queueNonCriticalTasks',
        actionLabel: 'Queue non-critical tasks for GPU window',
        params: {
            method: 'INTERNAL_QUEUE',
            dryRunNote: 'Would increment queued task counter in operational-state.json'
        },
        description: 'MiniMax usage spike — queue non-critical tasks for GPU window.',
        alertText: 'MiniMax fallback usage elevated. Non-critical tasks queued for next GPU window.',
        governed: false,
        enabled: false // DISABLED
    },

    {
        id: 'MINIMAX-002',
        check: 'minimax_fallback_spike',
        trigger: 'MiniMax usage > 80% of total for 3+ consecutive checks',
        classification: CLASS.APPROVAL_REQUIRED,
        action: 'gpuRoutingActivationPlan',
        actionLabel: 'Activate GPU primary routing',
        params: {
            method: 'ROUTING_CHANGE',
            dryRunNote: 'Would propose GPU routing activation plan to Ahmad'
        },
        description: 'Sustained MiniMax fallback — propose activating GPU as primary.',
        alertText: 'MiniMax sustained fallback. GPU routing activation recommended. Approve: /approve MINIMAX-002',
        governed: true,
        enabled: false // DISABLED
    },

    // ================================================================
    // CHECK: watchdog_crash
    // ================================================================

    {
        id: 'WATCHDOG-001',
        check: 'watchdog_crash',
        trigger: 'watchdog process exits with FATAL',
        classification: CLASS.SAFE_AUTONOMOUS,
        action: 'logAndAlert',
        actionLabel: 'Log FATAL and alert Ahmad',
        params: {
            method: 'WHATSAPP_ALERT',
            dryRunNote: 'Would send WhatsApp alert via runpod-alert-adapter.js'
        },
        description: 'Watchdog crashed. Log and alert — not self-healing.',
        alertText: 'GPU Watchdog FATAL crash. Manual investigation required.',
        governed: false,
        enabled: false // DISABLED — alert only
    }

];

// === LOOKUP HELPERS ===

function getRecoveryForFailure(check, triggerMatch) {
    return RECOVERY_REGISTRY.filter(r =>
        r.check === check && r.trigger === triggerMatch && r.enabled
    );
}

function getRecoveryById(id) {
    return RECOVERY_REGISTRY.find(r => r.id === id);
}

function getAllForCheck(check) {
    return RECOVERY_REGISTRY.filter(r => r.check === check);
}

// === PROPOSAL LOGGING ===

function proposeRecovery(check, trigger, failureDetails, recoveryId) {
    const recovery = getRecoveryById(recoveryId);
    if (!recovery) return null;

    const proposal = {
        timestamp: new Date().toISOString(),
        id: recoveryId,
        check,
        trigger,
        classification: recovery.classification,
        action: recovery.action,
        actionLabel: recovery.actionLabel,
        failureDetails,
        dryRunNote: recovery.params?.dryRunNote || 'N/A',
        status: 'PROPOSED'
    };

    fs.appendFileSync(PROPOSALS_FILE, JSON.stringify(proposal) + '\n');
    return proposal;
}

// === CLI ===

if (require.main === module) {
    console.log('=== RunPod Recovery Action Registry ===');
    console.log('Phase D-2.5 (DESIGN ONLY) — All hooks DISABLED\n');

    console.log('Recovery entries by check:\n');
    const byCheck = {};
    RECOVERY_REGISTRY.forEach(r => {
        if (!byCheck[r.check]) byCheck[r.check] = [];
        byCheck[r.check].push(r);
    });

    Object.entries(byCheck).forEach(([check, recoveries]) => {
        console.log('[' + check + ']');
        recoveries.forEach(r => {
            const status = r.enabled ? '✅ ENABLED' : r.classification === 'FORBIDDEN' ? '🚫 FORBIDDEN' : '⬜ DISABLED';
            console.log('  ' + status + ' ' + r.id + ': ' + r.actionLabel);
            console.log('    Trigger: ' + r.trigger);
            console.log('    Classification: ' + r.classification);
        });
        console.log('');
    });

    console.log('Total entries: ' + RECOVERY_REGISTRY.length);
    console.log('Enabled: ' + RECOVERY_REGISTRY.filter(r => r.enabled).length);
    console.log('FORBIDDEN: ' + RECOVERY_REGISTRY.filter(r => r.classification === CLASS.FORBIDDEN).length);
}

module.exports = {
    RECOVERY_REGISTRY,
    CLASS,
    SEVERITY,
    getRecoveryForFailure,
    getRecoveryById,
    getAllForCheck,
    proposeRecovery
};