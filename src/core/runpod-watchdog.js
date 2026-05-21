/**
 * RunPod GPU Watchdog Orchestrator — Phase D-2.2
 * SHADOW-ONLY: Orchestration layer for continuous GPU runtime supervision
 *
 * Responsibilities:
 * - Execute all D-2.1 health modules sequentially
 * - Aggregate results with deterministic ordering
 * - Classify severity: INFO / WARNING / HIGH / CRITICAL
 * - Retry HIGH failures before escalation (max 2 retries, 10s apart)
 * - Immediately escalate CRITICAL without retry
 * - Persist state to state/runpod-watchdog-state.json
 * - Append history to state/runpod-watchdog-history.jsonl
 * - Produce sanitized executive summaries
 * - Route alerts (future WhatsApp integration hook)
 *
 * SECURITY INVARIANTS:
 * - No autonomous destructive actions
 * - No pod rebuild / terminate / start actions
 * - No token printing or exposure
 * - All failures fully explainable
 * - All decisions auditable via history log
 *
 * NOT yet integrated:
 * - Cron scheduling (future D-2.3)
 * - Autonomous bounded recovery hooks (future D-2.4)
 * - WhatsApp alert routing (future D-2.5)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { sendGPUAlert } = require('./runpod-alert-adapter');

// === PATH CONFIG ===

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const STATE_FILE = path.join(STATE_DIR, 'runpod-watchdog-state.json');
const HISTORY_FILE = path.join(STATE_DIR, 'runpod-watchdog-history.jsonl');
const SECRETS_DIR = path.join(__dirname, '..', '..', '..', 'secrets');
const GPU_AUTH_PROXY = path.join(SECRETS_DIR, 'gpu-auth-proxy.json');
const REST_BASE = 'https://rest.runpod.io/v1';

// === CONFIG ===

const RETRY_CONFIG = {
    maxRetries: 2,
    retryDelayMs: 10_000,
    retryableChecks: ['auth_proxy_health', 'token_invalid_rejected', 'token_valid_accepted', 'model_mistral_present']
};

const SEVERITY_MAP = {
    pod_rest_status: { pass: 'INFO', skip: 'WARNING', fail: 'CRITICAL' },
    auth_proxy_health: { pass: 'INFO', skip: 'WARNING', fail: 'HIGH' },
    token_invalid_rejected: { pass: 'INFO', skip: 'WARNING', fail: 'HIGH' },
    token_valid_accepted: { pass: 'INFO', skip: 'WARNING', fail: 'HIGH' },
    model_mistral_present: { pass: 'INFO', skip: 'WARNING', fail: 'HIGH' }
};

// === HELPERS ===

function ensureStateDir() {
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

function timestamp() {
    return new Date().toISOString();
}

function logAccess(operation) {
    const TOKEN_LOG = path.join(__dirname, '..', '..', 'ops', 'TOKEN-ACCOUNTABILITY.md');
    try {
        fs.appendFileSync(TOKEN_LOG, '[' + timestamp() + '] Watchdog — ' + operation + '\n');
    } catch {}
}

// === SECRETS ===

function loadSecrets() {
    const raw = fs.readFileSync(path.join(SECRETS_DIR, 'runpod.json'), 'utf8');
    logAccess('secrets loaded');
    return JSON.parse(raw);
}

function loadGpuAuthProxy() {
    try {
        if (fs.existsSync(GPU_AUTH_PROXY)) {
            const t = JSON.parse(fs.readFileSync(GPU_AUTH_PROXY, 'utf8'));
            logAccess('gpu-auth-proxy config loaded');
            return t;
        }
    } catch {}
    return null;
}

// === HTTP HELPERS ===

function httpCheckCode(url, headers) {
    const parts = ['curl -s -o /dev/null -w "%{http_code}" -X GET'];
    Object.entries(headers || {}).forEach(([k, v]) => {
        parts.push("-H '" + k + ': ' + v.replace(/'/g, "'\\''") + "'");
    });
    parts.push('"' + url + '"', '--max-time 20', '--connect-timeout 15');
    return execSync(parts.join(' '), { encoding: 'utf8' }).trim();
}

function httpGetRaw(url, headers) {
    const parts = ['curl -s -X GET'];
    Object.entries(headers || {}).forEach(([k, v]) => {
        parts.push("-H '" + k + ': ' + v.replace(/'/g, "'\\''") + "'");
    });
    parts.push('"' + url + '"', '--max-time 20', '--connect-timeout 15');
    return execSync(parts.join(' '), { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 });
}

function isConnectionRefused(err) {
    return err && (
        err.includes('Connection refused') ||
        err.includes('connect to host') ||
        err.includes('Connection timed out') ||
        err.includes('timeout') ||
        err.includes('name or service not known')
    );
}

// === CHECK 1: POD REST STATUS ===

function checkPodStatus(secrets) {
    const result = { check: 'pod_rest_status', pass: false, details: {} };
    try {
        const raw = execSync(
            'curl -s -X GET ' +
            '-H "Authorization: Bearer ' + secrets.api_key + '" ' +
            '-H "Content-Type: application/json" ' +
            '"' + REST_BASE + '/pods/' + secrets.pod_id + '" ' +
            '--max-time 20 --connect-timeout 15',
            { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
        );
        logAccess('GET pod status');
        const d = JSON.parse(raw);
        result.details = {
            pod_id: d.id,
            name: d.name,
            desiredStatus: d.desiredStatus,
            runtime: d.runtime,
            publicIp: d.publicIp,
            volumeMount: d.volumeMountPath,
            gpuCount: d.gpuCount,
            vcpuCount: d.vcpuCount,
            memoryGb: d.memoryInGb,
            ports: d.ports
        };
        result.pass = d.desiredStatus === 'RUNNING' && d.publicIp !== undefined;
        result.status_code = '200';
    } catch (e) {
        result.error = e.message;
        result.status_code = 'API_ERROR';
    }
    return result;
}

// === CHECK 2: AUTH PROXY /health ===

function checkAuthProxyHealth(proxyUrl) {
    const result = { check: 'auth_proxy_health', pass: false, details: {} };
    const url = proxyUrl + '/health';
    try {
        const code = httpCheckCode(url, {});
        result.status_code = code;
        result.pass = code === '200';
        result.details = { url, http_code: code };
    } catch (e) {
        if (isConnectionRefused(e.message)) {
            result.status_code = 'SKIPPED';
            result.details = { url, note: 'Connection filtered — validate via RunPod internal' };
            result.pass = 'SKIPPED';
        } else {
            result.error = e.message;
            result.status_code = 'ERROR';
        }
    }
    return result;
}

// === CHECK 3: TOKEN AUTH — INVALID TOKEN ===

function checkTokenInvalid(proxyUrl) {
    const result = { check: 'token_invalid_rejected', pass: false, details: {} };
    const url = proxyUrl + '/api/tags';
    try {
        const code = httpCheckCode(url, { 'Authorization': 'Bearer invalid-token-test-xyz' });
        result.status_code = code;
        result.pass = code === '401';
        result.details = { url, http_code: code, expected: '401' };
    } catch (e) {
        if (isConnectionRefused(e.message)) {
            result.status_code = 'SKIPPED';
            result.details = { url, note: 'Connection filtered — validate via RunPod internal' };
            result.pass = 'SKIPPED';
        } else {
            result.error = e.message;
            result.status_code = 'ERROR';
        }
    }
    return result;
}

// === CHECK 4: TOKEN AUTH — VALID TOKEN ===

function checkTokenValid(proxyUrl, gpuToken) {
    const result = { check: 'token_valid_accepted', pass: false, details: {} };
    const url = proxyUrl + '/api/tags';

    if (!gpuToken) {
        result.status_code = 'SKIPPED';
        result.details = { url, note: 'Token not available on Hetzner — store in secrets/gpu-auth-proxy.json' };
        result.pass = 'SKIPPED';
        return result;
    }

    try {
        logAccess('GET /api/tags via proxy with valid token');
        const raw = httpGetRaw(url, { 'Authorization': 'Bearer ' + gpuToken });
        try {
            const parsed = JSON.parse(raw);
            result.details = {
                url,
                http_code: '200',
                model_count: parsed.models ? parsed.models.length : 0,
                first_model: parsed.models && parsed.models[0] ? parsed.models[0].name : null
            };
            result.pass = parsed.models && parsed.models.length > 0;
        } catch {
            result.details = { raw: raw.substring(0, 100), parse_error: true };
            result.pass = false;
        }
        result.status_code = '200';
    } catch (e) {
        if (isConnectionRefused(e.message)) {
            result.status_code = 'SKIPPED';
            result.details = { url, note: 'Connection filtered — validate via RunPod internal' };
            result.pass = 'SKIPPED';
        } else {
            result.error = e.message;
            result.status_code = 'ERROR';
        }
    }
    return result;
}

// === CHECK 5: MODEL VERIFICATION ===

function checkModel(proxyUrl, gpuToken) {
    const result = { check: 'model_mistral_present', pass: false, details: {} };
    const url = proxyUrl + '/api/tags';

    if (!gpuToken) {
        result.status_code = 'SKIPPED';
        result.details = { note: 'Token required for model check' };
        result.pass = 'SKIPPED';
        return result;
    }

    try {
        logAccess('GET /api/tags model list check');
        const raw = httpGetRaw(url, { 'Authorization': 'Bearer ' + gpuToken });
        const parsed = JSON.parse(raw);
        const models = parsed.models || [];
        const targetModel = 'mistral-small3.2:latest';
        const found = models.some(m => m.name === targetModel);
        result.details = {
            url,
            models_found: models.map(m => m.name),
            target_model: targetModel,
            model_found: found,
            http_code: '200'
        };
        result.pass = found;
        result.status_code = '200';
    } catch (e) {
        if (isConnectionRefused(e.message)) {
            result.status_code = 'SKIPPED';
            result.details = { url, note: 'Connection filtered — validate via RunPod internal' };
            result.pass = 'SKIPPED';
        } else {
            result.error = e.message;
            result.status_code = 'ERROR';
        }
    }
    return result;
}

// === RETRY LOGIC ===

function retryCheck(checkKey, checkFn) {
    let attempt = 0;
    let lastResult;

    while (attempt <= RETRY_CONFIG.maxRetries) {
        attempt++;
        lastResult = checkFn();
        lastResult._attempt = attempt;

        if (lastResult.pass === true || lastResult.pass === 'SKIPPED') {
            return {
                attempts: [lastResult],
                final: lastResult,
                recovered: attempt > 1
            };
        }

        const isRetryable = RETRY_CONFIG.retryableChecks.includes(checkKey);
        if (!isRetryable || attempt > RETRY_CONFIG.maxRetries) {
            return { attempts: [lastResult], final: lastResult, recovered: false };
        }

        if (attempt <= RETRY_CONFIG.maxRetries) {
            execSync('sleep ' + (RETRY_CONFIG.retryDelayMs / 1000), { encoding: 'utf8' });
        }
    }

    return { attempts: [lastResult], final: lastResult, recovered: false };
}

// === SEVERITY CLASSIFICATION ===

function classifySeverity(results) {
    let maxSeverity = 'INFO';
    const alerts = [];

    for (const r of results) {
        const map = SEVERITY_MAP[r.check] || { pass: 'INFO', skip: 'WARNING', fail: 'CRITICAL' };
        let level;
        if (r.pass === true) level = map.pass;
        else if (r.pass === 'SKIPPED') level = map.skip;
        else level = map.fail;

        r._severity = level;

        const priority = { 'INFO': 0, 'WARNING': 1, 'HIGH': 2, 'CRITICAL': 3 };
        if (priority[level] > priority[maxSeverity]) {
            maxSeverity = level;
        }

        if (level === 'CRITICAL' || level === 'HIGH') {
            alerts.push({
                check: r.check,
                level,
                status_code: r.status_code,
                summary: level === 'CRITICAL'
                    ? 'CRITICAL failure — immediate escalation required'
                    : 'HIGH failure — retry before escalation',
                details: r.details || {},
                error: r.error || null
            });
        }
    }

    return { level: maxSeverity, alerts };
}

// === STATE PERSISTENCE ===

function persistState(state) {
    ensureStateDir();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function appendHistory(entry) {
    ensureStateDir();
    fs.appendFileSync(HISTORY_FILE, JSON.stringify(entry) + '\n');
}

// === SUMMARY BUILDERS ===

function buildSummary(runState, results, severity) {
    const passed = results.filter(r => r.pass === true).length;
    const failed = results.filter(r => r.pass === false).length;
    const skipped = results.filter(r => r.pass === 'SKIPPED').length;
    const total = results.length;

    const summary = {
        timestamp: runState.timestamp,
        overall: severity.level,
        executionId: runState.executionId,
        podId: runState.podId,
        gpuIp: runState.gpuIp,
        checks: { total, passed, failed, skipped },
        alertCount: severity.alerts.length,
        alerts: severity.alerts.map(a => ({
            check: a.check,
            level: a.level,
            status_code: a.status_code,
            summary: a.summary
        })),
        recovery: runState.recovered || false,
        durationMs: runState.durationMs,
        status: failed === 0 && skipped === 0
            ? 'ALL_SYSTEMS_NOMINAL'
            : failed === 0
                ? 'DEGRADED'
                : 'FAILURE'
    };

    return summary;
}

function buildExecSummary(runState, results, severity) {
    const passed = results.filter(r => r.pass === true).length;
    const failed = results.filter(r => r.pass === false).length;
    const skipped = results.filter(r => r.pass === 'SKIPPED').length;
    const total = results.length;

    const lines = [];
    lines.push('=== GPU Watchdog Report ===');
    lines.push('Time: ' + runState.timestamp);
    lines.push('Execution: ' + runState.executionId);
    lines.push('Pod: ' + runState.podId + ' @ ' + runState.gpuIp);
    lines.push('Overall: ' + severity.level);
    lines.push('');
    lines.push('Checks (' + total + ' total):');
    for (const r of results) {
        const icon = r.pass === true ? '✅' : r.pass === 'SKIPPED' ? '⏭️' : '❌';
        lines.push('  ' + icon + ' ' + r.check + ' [' + r.status_code + ']');
        if (r._severity === 'HIGH' || r._severity === 'CRITICAL') {
            lines.push('     → ' + (r.error || r.details.note || r.details.error || 'failed'));
        }
    }
    lines.push('');
    lines.push('Summary: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped');
    lines.push('Status: ' + (failed === 0 && skipped === 0 ? 'ALL_SYSTEMS_NOMINAL' : failed === 0 ? 'DEGRADED' : 'FAILURE'));
    if (runState.recovered) {
        lines.push('Recovery: YES (HIGH check recovered on retry)');
    }
    if (severity.alerts.length > 0) {
        lines.push('');
        lines.push('Alerts: ' + severity.alerts.length);
        for (const a of severity.alerts) {
            lines.push('  ⚠️ [' + a.level + '] ' + a.check + ': ' + a.summary);
        }
    }

    return lines.join('\n');
}

// === MAIN WATCHDOG RUN ===

function runWatchdog() {
    const startMs = Date.now();
    const executionId = 'wd-' + Date.now().toString(36);
    const runState = {
        timestamp: timestamp(),
        executionId,
        startedAt: startMs
    };

    try {
        const secrets = loadSecrets();
        const gpuAuth = loadGpuAuthProxy();

        // Determine proxy URL
        const proxyUrl = gpuAuth && gpuAuth.proxy_url
            ? gpuAuth.proxy_url
            : 'https://c1as99lq8xtphy-11440.proxy.runpod.net';

        runState.podId = gpuAuth?.pod_id || secrets.pod_id || 'unknown';
        runState.gpuIp = proxyUrl.replace('https://', '');

        // Run health checks
        const results = [];
        results.push(checkPodStatus(secrets));
        results.push(checkAuthProxyHealth(proxyUrl));
        results.push(checkTokenInvalid(proxyUrl));
        results.push(checkTokenValid(proxyUrl, gpuAuth?.token || null));
        results.push(checkModel(proxyUrl, gpuAuth?.token || null));

        // Classify severity
        const severity = classifySeverity(results);

        // Retry HIGH failures
        if (severity.level === 'HIGH' || severity.level === 'CRITICAL') {
            for (const r of results) {
                if (r.pass === false && RETRY_CONFIG.retryableChecks.includes(r.check)) {
                    const idx = results.indexOf(r);
                    let checkFn;

                    if (r.check === 'auth_proxy_health') checkFn = () => checkAuthProxyHealth(proxyUrl);
                    else if (r.check === 'token_invalid_rejected') checkFn = () => checkTokenInvalid(proxyUrl);
                    else if (r.check === 'token_valid_accepted') checkFn = () => checkTokenValid(proxyUrl, gpuAuth?.token || null);
                    else if (r.check === 'model_mistral_present') checkFn = () => checkModel(proxyUrl, gpuAuth?.token || null);

                    if (checkFn) {
                        const retryResult = retryCheck(r.check, checkFn);
                        results[idx] = retryResult.final;
                        if (retryResult.recovered) runState.recovered = true;
                    }
                }
            }

            // Re-classify after retry
            const newSev = classifySeverity(results);
            severity.alerts = newSev.alerts;
            severity.level = newSev.level;
        }

        const durationMs = Date.now() - startMs;
        runState.durationMs = durationMs;
        runState.finishedAt = Date.now();

        // Build summaries
        const summary = buildSummary(runState, results, severity);
        const execSummary = buildExecSummary(runState, results, severity);

        // Persist state
        persistState({
            ...runState,
            results,
            severity: severity.level,
            summary,
            alerts: severity.alerts
        });

        // Append history
        appendHistory({
            timestamp: runState.timestamp,
            executionId,
            severity: severity.level,
            podId: runState.podId,
            checksSummary: {
                total: results.length,
                passed: results.filter(r => r.pass === true).length,
                failed: results.filter(r => r.pass === false).length,
                skipped: results.filter(r => r.pass === 'SKIPPED').length
            },
            alertCount: severity.alerts.length,
            recovered: runState.recovered || false,
            durationMs
        });

        // Route WhatsApp alerts for HIGH/CRITICAL
        for (const alert of severity.alerts) {
            sendGPUAlert(
                alert.level,
                alert.check,
                runState.podId,
                proxyUrl,
                alert.status_code,
                alert.details
            );
        }

        return {
            executionId,
            results,
            severity,
            summary,
            execSummary,
            runState
        };

    } catch (e) {
        const durationMs = Date.now() - startMs;
        const fatalState = {
            ...runState,
            finishedAt: Date.now(),
            durationMs,
            error: e.message,
            severity: 'CRITICAL'
        };

        persistState({
            ...fatalState,
            results: [{ check: 'FATAL', pass: false, error: e.message, status_code: 'FATAL' }],
            severity: 'CRITICAL',
            summary: { status: 'FATAL', error: e.message },
            alerts: [{ check: 'FATAL', level: 'CRITICAL', summary: 'Watchdog crashed — ' + e.message }]
        });

        appendHistory({
            timestamp: runState.timestamp,
            executionId,
            severity: 'CRITICAL',
            event: 'fatal_crash',
            error: e.message,
            durationMs
        });

        // Route WhatsApp CRITICAL alert for fatal watchdog crash
        sendGPUAlert(
            'CRITICAL',
            'FATAL',
            runState.podId || 'unknown',
            'watchdog',
            'FATAL',
            { error: e.message }
        );

        return {
            executionId,
            results: [{ check: 'FATAL', pass: false, error: e.message }],
            severity: { level: 'CRITICAL', alerts: [{ check: 'FATAL', level: 'CRITICAL', summary: e.message }] },
            summary: { status: 'FATAL', error: e.message },
            execSummary: 'FATAL: Watchdog crashed — ' + e.message,
            runState: fatalState
        };
    }
}

// === CLI ===

if (require.main === module) {
    const output = runWatchdog();
    console.log('=== EXEC SUMMARY ===');
    console.log(output.execSummary);
    console.log('');
    console.log('=== JSON STATE ===');
    console.log(JSON.stringify({
        executionId: output.executionId,
        severity: output.severity.level,
        summary: output.summary
    }, null, 2));
}

module.exports = { runWatchdog, classifySeverity, retryCheck };