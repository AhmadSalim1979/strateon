/**
 * GPU Lifecycle Controller — RunPod Pod Management
 *
 * Startup: 06:00 UTC (11:00 AM PKT)
 * Shutdown: 21:00 UTC (2:00 AM PKT)
 * Health check before activation
 * Graceful shutdown handling
 * Fallback to MiniMax if GPU unavailable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const SECRETS_FILE = '/home/node/.openclaw/secrets/runpod.json';
const STATE_FILE = '/home/node/.openclaw/workspace/state/gpu-lifecycle-state.json';
const LOG_FILE = '/home/node/.openclaw/workspace/state/gpu-lifecycle-log.jsonl';

const CONFIG = {
    POD_ID: '23a9nue4xq4r4p',
    GPU_PROXY_PORT: 11440,
    HEALTH_POLL_MS: 30_000,
    HEALTH_TIMEOUT_MS: 600_000,
    MAX_RESTARTS_24H: 3
};

let state = {
    status: 'IDLE',
    pod_id: CONFIG.POD_ID,
    started_at: null,
    stopped_at: null,
    last_health_check: null,
    health_check_failures: 0,
    restarts_24h: 0,
    last_error: null
};

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) };
        }
    } catch {}
}

function saveState() {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch {}
}

function logEvent(event) {
    const entry = { timestamp: new Date().toISOString(), ...event };
    try {
        fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch {}
    console.log('[GPU-LIFECYCLE] ' + JSON.stringify(entry));
}

function loadRunPodSecrets() {
    try {
        const s = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
        return { apiKey: s.api_key || s.apiKey };
    } catch (e) {
        throw new Error('Failed to load RunPod secrets: ' + e.message);
    }
}

function loadGpuToken() {
    try {
        const s = JSON.parse(fs.readFileSync('/home/node/.openclaw/secrets/gpu-auth-proxy.json', 'utf8'));
        return s.token;
    } catch {
        return null;
    }
}

const { execSync, exec } = await import('child_process');

function runpodApi(method, endpoint, body) {
    const { apiKey } = loadRunPodSecrets();
    const url = 'https://api.runpod.io/v1' + endpoint;
    const args = ['curl', '-s', '-X', method, '-H', 'Authorization: Bearer ' + apiKey, '-H', 'Content-Type: application/json'];
    if (body) args.push('-d', JSON.stringify(body));
    args.push(url);
    try {
        const out = execSync(args.join(' '), { encoding: 'utf8', timeout: 30_000 });
        return JSON.parse(out);
    } catch (e) {
        try { return JSON.parse(e.stdout || e.stderr || '{}'); }
        catch { throw new Error('RunPod API failed: ' + e.message.substring(0, 200)); }
    }
}

function runpodApiAsync(method, endpoint, body) {
    return new Promise((resolve, reject) => {
        const { apiKey } = loadRunPodSecrets();
        const url = 'https://api.runpod.io/v1' + endpoint;
        const args = ['curl', '-s', '-X', method, '-H', 'Authorization: Bearer ' + apiKey, '-H', 'Content-Type: application/json', '-w', '\n%{http_code}'];
        if (body) args.push('--data-binary', JSON.stringify(body));
        args.push(url);
        exec(args.join(' '), { encoding: 'utf8', timeout: 60_000 }, (err, stdout) => {
            if (err) { reject(new Error('API request failed: ' + err.message.substring(0, 200))); return; }
            const lines = stdout.trim().split('\n');
            const code = parseInt(lines.pop());
            try { resolve({ data: JSON.parse(lines.join('\n')), httpCode: code }); }
            catch { reject(new Error('Failed to parse RunPod API response')); }
        });
    });
}

async function verifyGpuHealth() {
    const token = loadGpuToken();
    if (!token) return { healthy: false, error: 'No auth token' };
    const endpoint = `https://${CONFIG.POD_ID}-${CONFIG.GPU_PROXY_PORT}.proxy.runpod.net/api/tags`;
    return new Promise(resolve => {
        exec('curl -s --max-time 30 -H "Authorization: Bearer ' + token + '" "' + endpoint + '"',
            { encoding: 'utf8', timeout: 35_000 },
            (err, stdout) => {
                if (err) { resolve({ healthy: false, error: err.message.substring(0, 100) }); return; }
                try {
                    const data = JSON.parse(stdout);
                    resolve({ healthy: !!data.models && data.models.length > 0, models: data.models });
                } catch { resolve({ healthy: false, error: 'Invalid JSON' }); }
            }
        );
    });
}

async function waitForHealth() {
    const start = Date.now();
    while (Date.now() - start < CONFIG.HEALTH_TIMEOUT_MS) {
        const h = await verifyGpuHealth();
        if (h.healthy) return { success: true, models: h.models };
        const elapsed = Math.round((Date.now() - start) / 1000);
        console.log('[GPU-LIFECYCLE] Waiting for GPU health... (' + elapsed + 's)');
        await new Promise(r => setTimeout(r, CONFIG.HEALTH_POLL_MS));
    }
    return { success: false, error: 'Health timeout after ' + CONFIG.HEALTH_TIMEOUT_MS / 1000 + 's' };
}

async function startGpuPod() {
    loadState();
    if (state.status === 'ACTIVE' || state.status === 'STARTING') {
        return { success: true, status: state.status };
    }
    logEvent({ type: 'START', message: 'Initiating GPU pod start' });
    state.status = 'STARTING';
    state.last_error = null;
    saveState();
    try {
        const r = await runpodApiAsync('POST', '/pod/' + CONFIG.POD_ID + '/start');
        if (r.httpCode !== 200 && r.httpCode !== 201) {
            state.status = 'UNAVAILABLE';
            state.last_error = 'Start API: ' + r.httpCode;
            saveState();
            return { success: false, status: 'UNAVAILABLE' };
        }
    } catch (e) {
        state.status = 'UNAVAILABLE';
        state.last_error = e.message;
        saveState();
        return { success: false, status: 'UNAVAILABLE' };
    }
    const health = await waitForHealth();
    if (health.success) {
        state.status = 'ACTIVE';
        state.started_at = new Date().toISOString();
        state.health_check_failures = 0;
        saveState();
        logEvent({ type: 'READY', message: 'GPU pod ACTIVE' });
        return { success: true, status: 'ACTIVE' };
    } else {
        state.status = 'DEGRADED';
        state.last_error = health.error;
        state.health_check_failures++;
        saveState();
        return { success: false, status: 'DEGRADED' };
    }
}

async function stopGpuPod() {
    loadState();
    if (state.status === 'IDLE' || state.status === 'STOPPING') {
        return { success: true, status: state.status };
    }
    logEvent({ type: 'STOP', message: 'Initiating GPU pod stop' });
    state.status = 'STOPPING';
    saveState();
    try {
        const r = await runpodApiAsync('POST', '/pod/' + CONFIG.POD_ID + '/stop');
        if (r.httpCode === 200 || r.httpCode === 202) {
            state.status = 'IDLE';
            state.stopped_at = new Date().toISOString();
            saveState();
            logEvent({ type: 'STOPPED', message: 'GPU pod stopped' });
            return { success: true, status: 'IDLE' };
        } else {
            state.status = 'DEGRADED';
            state.last_error = 'Stop API: ' + r.httpCode;
            saveState();
            return { success: false, status: 'DEGRADED' };
        }
    } catch (e) {
        state.status = 'DEGRADED';
        state.last_error = e.message;
        saveState();
        return { success: false, status: 'DEGRADED' };
    }
}

async function periodicHealthCheck() {
    loadState();
    if (state.status !== 'ACTIVE') return { status: state.status, healthy: false };
    const h = await verifyGpuHealth();
    if (h.healthy) {
        state.last_health_check = new Date().toISOString();
        state.health_check_failures = 0;
        saveState();
        return { status: 'ACTIVE', healthy: true };
    } else {
        state.health_check_failures++;
        state.last_health_check = new Date().toISOString();
        state.last_error = h.error;
        saveState();
        if (state.health_check_failures >= 3) {
            state.status = 'DEGRADED';
            saveState();
            return { status: 'DEGRADED', healthy: false };
        }
        return { status: 'ACTIVE', healthy: false, failures: state.health_check_failures };
    }
}

function getLifecycleStatus() { loadState(); return { ...state }; }
function isGpuAvailable() { loadState(); return state.status === 'ACTIVE'; }
function getGpuFallbackMode() { return isGpuAvailable() ? 'GPU_AVAILABLE' : 'MINIMAX_ONLY'; }

async function scheduledStartup() {
    logEvent({ type: 'SCHEDULED', message: 'Scheduled startup (06:00 UTC)' });
    return await startGpuPod();
}

async function scheduledShutdown() {
    logEvent({ type: 'SCHEDULED', message: 'Scheduled shutdown (21:00 UTC)' });
    return await stopGpuPod();
}

// === CLI ===
if (import.meta.url === 'file://' + process.argv[1]) {
    const cmd = process.argv[2];
    if (cmd === 'start') {
        startGpuPod().then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(r.success ? 0 : 1); });
    } else if (cmd === 'stop') {
        stopGpuPod().then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(r.success ? 0 : 1); });
    } else if (cmd === 'status') {
        console.log(JSON.stringify(getLifecycleStatus(), null, 2));
    } else if (cmd === 'health') {
        verifyGpuHealth().then(h => console.log(JSON.stringify(h, null, 2)));
    } else if (cmd === 'check') {
        periodicHealthCheck().then(h => console.log(JSON.stringify(h, null, 2)));
    } else {
        console.log('Usage: node gpu-lifecycle-controller.js [start|stop|status|health|check]');
    }
}

export {
    startGpuPod, stopGpuPod, getLifecycleStatus, verifyGpuHealth,
    periodicHealthCheck, scheduledStartup, scheduledShutdown,
    isGpuAvailable, getGpuFallbackMode, CONFIG
};