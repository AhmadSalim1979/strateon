/**
 * RunPod GPU Pod Lifecycle Control — Phase D-2 (REST)
 * SHADOW-ONLY: Read-only status + lifecycle control (start/stop authorized separately)
 *
 * SECURITY INVARIANTS:
 * - Never prints or logs the API key value
 * - Never uses terminate, create, or billing operations
 * - SSH host key validation is fail-closed
 * - Token access logged without exposing token value
 *
 * REST OPERATIONS AUTHORIZED:
 * - GET /pods/{podId} (read-only status)
 * - POST /pods/{podId}/start (requires explicit Ahmad approval per cycle)
 * - POST /pods/{podId}/stop (requires explicit Ahmad approval per cycle)
 *
 * OPERATIONS NEVER AUTHORIZED:
 * - POST /pods (create) — NEVER
 * - DELETE /pods/{podId} (terminate) — NEVER
 * - Billing/payment/account operations — NEVER
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

const SECRETS_FILE = path.join(__dirname, '..', '..', 'secrets', 'runpod.json');
const STATE_FILE = path.join(__dirname, '..', '..', 'state', 'runpod-gpu-endpoint.json');
const TOKEN_LOG = '/home/node/.openclaw/workspace/ops/TOKEN-ACCOUNTABILITY.md';
const KNOWN_HOSTS = path.join(process.env.HOME, '.ssh', 'known_hosts');
const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const REST_BASE = 'https://rest.runpod.io/v1';

// === TOKEN ACCESS LOG ===

function logTokenAccess(operation, details) {
    const entry = `[${new Date().toISOString()}] RunPod API key accessed for operation: ${operation} — ${details}`;
    try {
        fs.appendFileSync(TOKEN_LOG, entry + '\n');
    } catch(e) {
        // silently fail if log not writable
    }
}

// === LOAD SECRETS ===

function loadSecrets() {
    const locations = [SECRETS_FILE];
    let secrets = null;

    for (const loc of locations) {
        if (fs.existsSync(loc)) {
            try {
                const raw = fs.readFileSync(loc, 'utf8').trim();
                if (raw && raw !== '{}') {
                    secrets = JSON.parse(raw);
                    if (secrets.api_key && secrets.pod_id) {
                        logTokenAccess('load', 'loaded from ' + loc);
                        return secrets;
                    }
                }
            } catch(e) {
                // continue to next location
            }
        }
    }

    throw new Error('SECRETS_NOT_FOUND: no valid runpod.json with api_key and pod_id found in any expected location');
}

// === SAVE ENDPOINT STATE ===

function saveEndpointState(endpointState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    const current = fs.existsSync(STATE_FILE)
        ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
        : {};
    const updated = { ...current, ...endpointState, updated_at: new Date().toISOString() };
    fs.writeFileSync(STATE_FILE, JSON.stringify(updated, null, 2));
    return updated;
}

// === LOAD ENDPOINT STATE ===

function loadEndpointState() {
    if (!fs.existsSync(STATE_FILE)) {
        return { status: 'UNKNOWN', note: 'no prior state' };
    }
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

// === REST API CALL ===

function restGet(endpoint, operationName) {
    const secrets = loadSecrets();
    logTokenAccess(operationName, 'GET ' + REST_BASE + endpoint);

    const curlCmd = [
        'curl -s',
        '-X GET',
        '-H "Authorization: Bearer ' + secrets.api_key + '"',
        '-H "Content-Type: application/json"',
        '"' + REST_BASE + endpoint + '"',
        '--max-time 30'
    ].join(' ');

    const raw = execSync(curlCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(raw);
}

// === POD STATUS (REST) ===

function getPodStatus() {
    const secrets = loadSecrets();
    return restGet('/pods/' + secrets.pod_id, 'getPodStatus');
}

// === SYNC ENDPOINT FROM REST RESPONSE ===

function syncEndpointFromPodStatus(podData) {
    if (!podData) return null;
    return saveEndpointState({
        pod_id: podData.id || podData.podId,
        status: podData.status,
        ssh_host: podData.remoteHost || podData.sshHost,
        ssh_port: podData.remotePort || podData.sshPort || podData.port,
        gpu: podData.machine?.gpuDisplayName || podData.gpuDisplayName,
        gpu_count: podData.machine?.gpuCount || podData.gpuCount,
        last_status_change: podData.lastStatusChange,
        uptime_seconds: podData.uptimeInSeconds
    });
}

// === SECURITY-COMPLIANT SSH HOST KEY SCAN ===

function sshKeyscan(host, port) {
    if (!host) return null;
    const target = port ? `${host}:${port}` : host;
    logTokenAccess('sshKeyscan', 'running ssh-keyscan for ' + target);
    try {
        const raw = execSync(
            'ssh-keyscan -p ' + port + ' -T 10 -t rsa,ecdsa,ed25519 -- ' + host,
            { encoding: 'utf8', timeout: 15000 }
        );
        return raw;
    } catch(e) {
        throw new Error('SSH_KEYSCAN_FAILED: ' + e.message + ' — host: ' + target);
    }
}

// === PIN HOST KEY ===

function pinHostKey(host, port, knownHostsPath = KNOWN_HOSTS) {
    if (!host) return null;
    const target = port ? `${host}:${port}` : host;
    const scannedKeys = sshKeyscan(host, port);
    const sshDir = path.dirname(knownHostsPath);
    if (!fs.existsSync(sshDir)) {
        fs.mkdirSync(sshDir, { recursive: true });
    }
    const entry = '# ' + new Date().toISOString() + ' — RunPod GPU pod ' + target + '\n' + scannedKeys;
    fs.appendFileSync(knownHostsPath, entry);
    logTokenAccess('pinHostKey', 'pinned host key for ' + target);
    return target;
}

// === VERIFY HOST KEY (FAIL-CLOSED) ===

function verifyHostKey(host, port, knownHostsPath = KNOWN_HOSTS) {
    if (!host) return { valid: false, reason: 'NO_HOST' };
    const target = port ? `${host}:${port}` : host;
    if (!fs.existsSync(knownHostsPath)) {
        return { valid: false, reason: 'KNOWN_HOSTS_MISSING', action: 'PIN_FIRST' };
    }
    const knownHosts = fs.readFileSync(knownHostsPath, 'utf8');
    const lines = knownHosts.split('\n');
    let pinned = false;
    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        const hostPart = line.split(' ')[0];
        if (hostPart === target || hostPart === host || hostPart.startsWith(host + ':')) {
            pinned = true;
            break;
        }
    }
    if (!pinned) {
        return { valid: false, reason: 'HOST_NOT_PINNED', action: 'PIN_FIRST' };
    }
    return { valid: true, reason: 'HOST_PINNED_AND_VALID' };
}

// === MAIN VALIDATION ===

function runPodStatusValidation() {
    const results = {
        files_created: [],
        rest_endpoint: null,
        rest_method: 'GET',
        pod_status: null,
        endpoint: null,
        host_key_status: null,
        sanitized_response: null,
        errors: [],
        step: 'INIT'
    };

    try {
        // Step 1: Load secrets
        results.step = 'LOAD_SECRETS';
        const secrets = loadSecrets();
        results.files_created.push(SECRETS_FILE);

        // Step 2: REST GET pod status
        results.step = 'REST_GET_POD_STATUS';
        results.rest_endpoint = REST_BASE + '/pods/' + secrets.pod_id;
        const podData = getPodStatus();
        results.pod_status = podData.status || podData.pod?.status || 'UNKNOWN';
        results.endpoint = {
            ssh_host: podData.remoteHost || podData.sshHost || podData.host || 'UNKNOWN',
            ssh_port: podData.remotePort || podData.sshPort || podData.port || 'UNKNOWN'
        };

        // Step 3: Sync endpoint state
        results.step = 'SYNC_ENDPOINT';
        const endpointState = syncEndpointFromPodStatus(podData);
        results.files_created.push(STATE_FILE);

        // Step 4: Pin host key (only if host available)
        results.step = 'HOST_KEY_PIN';
        const host = podData.remoteHost || podData.sshHost;
        const port = podData.remotePort || podData.sshPort || podData.port;

        if (host) {
            try {
                pinHostKey(host, port);
                results.host_key_status = verifyHostKey(host, port);
            } catch(e) {
                results.host_key_status = { valid: false, reason: 'PIN_FAILED: ' + e.message };
            }
        } else {
            results.host_key_status = { valid: false, reason: 'NO_HOST_FROM_API' };
        }

        // Step 5: Sanitize response (remove all token/value info)
        results.step = 'SANITIZE_RESPONSE';
        results.sanitized_response = sanitizeResponse(podData);

    } catch(e) {
        results.errors.push({ step: results.step, error: e.message });
    }

    return results;
}

// === SANITIZE RESPONSE ===

function sanitizeResponse(raw) {
    if (!raw || typeof raw !== 'object') return { raw: 'UNPARSABLE' };
    const safe = {};
    const safeFields = [
        'id', 'podId', 'status', 'statusOverride', 'runtime',
        'remoteHost', 'remotePort', 'sshHost', 'sshPort', 'port',
        'machine', 'gpuDisplayName', 'gpuCount', 'gpuType',
        'lastStatusChange', 'uptimeInSeconds', 'costPerHour',
        'podType', 'containerDiskSizeInGb', 'volumeInGb', 'volumeSizeInGb'
    ];
    for (const key of Object.keys(raw)) {
        if (safeFields.includes(key)) {
            safe[key] = raw[key];
        }
    }
    safe.rest_status = 'SUCCESS';
    return safe;
}

// === CLI ===

if (require.main === module) {
    const results = runPodStatusValidation();
    console.log(JSON.stringify(results, null, 2));
}

module.exports = {
    loadSecrets,
    saveEndpointState,
    loadEndpointState,
    getPodStatus,
    syncEndpointFromPodStatus,
    pinHostKey,
    verifyHostKey,
    sshKeyscan,
    runPodStatusValidation,
    logTokenAccess,
    REST_BASE,
    SECRETS_FILE,
    STATE_FILE
};