/**
 * GPU Health Watchdog — GPU-NATIVE (replaces agentTurn-based cron)
 * 
 * Does NOT call:
 * - MiniMax
 * - default OpenClaw model
 * - any LLM inference for cognition
 * - sub-agent cognition
 * 
 * Does ONLY:
 * - Direct GPU API health checks
 * - Auth token validation via /api/tags
 * - /api/tags enumeration
 * - Tiny inference test: "Reply with exactly: OK" (validates GPU is working)
 * - Latency measurement
 * - State file update
 */

const { execSync: exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// === CONFIG ===
const GPU_POD_URL = process.env.GPU_POD_URL || 'https://23a9nue4xq4r4p-11440.proxy.runpod.net';
const GPU_MODEL = process.env.GPU_MODEL || 'mistral-small3.2:latest';
const AUTH_FILE = '/home/node/.openclaw/secrets/gpu-auth-proxy.json';
const STATE_FILE = '/home/node/.openclaw/workspace/state/gpu-watchdog-state.json';
const LOG_FILE = '/home/node/.openclaw/workspace/state/gpu-watchdog-history.jsonl';
const HEALTH_SLO_FILE = '/home/node/.openclaw/workspace/state/gpu-health-slo.json';

// === HELPERS ===

function log(tag, msg) {
    console.log(`[gpu-watchdog] [${tag}] ${msg}`);
}

function loadAuthToken() {
    try {
        const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
        return data.token || null;
    } catch {
        return null;
    }
}

function curlgpu(path, method = 'GET', body = null, timeoutMs = 30000) {
    const token = loadAuthToken();
    const headersArr = [
        '-H', 'Content-Type: application/json',
    ];
    if (token) {
        headersArr.push('-H', `Authorization: Bearer ${token}`);
    }
    
    const cmdParts = ['curl', '-s', '--max-time', String(Math.round(timeoutMs / 1000)), '-X', method];
    
    for (const h of headersArr) {
        cmdParts.push(h);
    }
    
    if (body) {
        // Use a temp file to avoid shell escaping issues with large JSON
        const tmpFile = `/tmp/curlgpu-body-${process.pid}.json`;
        fs.writeFileSync(tmpFile, JSON.stringify(body));
        cmdParts.push('-d', `@${tmpFile}`);
    }
    
    cmdParts.push(GPU_POD_URL + path);
    
    try {
        const result = exec(cmdParts.join(' '), { encoding: 'utf8', timeout: timeoutMs + 5000 });
        return { ok: true, data: result.trim() };
    } catch (e) {
        const code = e.status;
        const stderr = e.stderr || '';
        const stdout = e.stdout || '';
        const output = stdout || stderr;
        return { ok: false, error: e.message, output: output.trim(), code };
    }
}

function curlgpuSSE(path, method = 'POST', body, timeoutMs = 60000) {
    // For streaming endpoints — collects all SSE lines and returns combined output
    const token = loadAuthToken();
    const tmpFile = `/tmp/curlgpu-sse-${process.pid}.out`;
    
    const cmd = [
        'curl', '-s', '--max-time', String(Math.round(timeoutMs / 1000)),
        '-X', method,
        '-H', 'Content-Type: application/json'
    ];
    if (token) cmd.push('-H', `Authorization: Bearer ${token}`);
    
    const tmpBodyFile = `/tmp/curlgpu-body-${process.pid}.json`;
    fs.writeFileSync(tmpBodyFile, JSON.stringify(body));
    cmd.push('-d', `@${tmpBodyFile}`);
    cmd.push('-o', tmpFile);
    cmd.push(GPU_POD_URL + path);
    
    try {
        exec(cmd.join(' '), { encoding: 'utf8', timeout: timeoutMs + 5000 });
        
        // SSE output: each line is "data: {...}"
        // Last line with [DONE] or total_duration indicates completion
        const output = fs.readFileSync(tmpFile, 'utf8');
        
        // Clean up temp files
        try { fs.unlinkSync(tmpFile); } catch {}
        try { fs.unlinkSync(tmpBodyFile); } catch {}
        
        return { ok: true, data: output };
    } catch (e) {
        try { fs.unlinkSync(tmpFile); } catch {}
        try { fs.unlinkSync(tmpBodyFile); } catch {}
        return { ok: false, error: e.message };
    }
}

// === HEALTH CHECKS ===

function checkEndpoint() {
    log('HEALTH', 'Checking GPU /health endpoint...');
    const r = curlgpu('/health', 'GET', null, 10000);
    if (!r.ok) {
        return { step: 'endpoint', ok: false, error: r.error || 'connection failed', code: r.code };
    }
    // /health returns plain text "GPU brain auth proxy OK" — any non-empty text = healthy
    const isHealthy = r.data.length > 0 && !r.data.includes('error') && !r.data.includes('Error');
    return {
        step: 'endpoint', ok: isHealthy,
        raw: r.data.substring(0, 200)
    };
}

function checkAuthToken() {
    log('AUTH', 'Validating GPU auth token via /api/tags...');
    const r = curlgpu('/api/tags', 'GET', null, 15000);
    if (!r.ok) {
        return { step: 'auth', ok: false, error: r.error || r.output || 'auth failed', code: r.code };
    }
    try {
        const d = JSON.parse(r.data);
        const models = d.models || [];
        if (Array.isArray(models)) {
            return { step: 'auth', ok: true, model_count: models.length };
        }
        return { step: 'auth', ok: false, error: 'unexpected tags response structure', data: r.data.substring(0, 200) };
    } catch {
        return { step: 'auth', ok: false, error: 'tags parse failed', data: r.data.substring(0, 200) };
    }
}

function checkTags() {
    log('TAGS', 'Fetching /api/tags for model enumeration...');
    const r = curlgpu('/api/tags', 'GET', null, 15000);
    if (!r.ok) {
        return { step: 'tags', ok: false, error: r.error || r.output || 'tags failed', code: r.code };
    }
    try {
        const d = JSON.parse(r.data);
        const models = d.models || [];
        const target = models.find(m => m.name === GPU_MODEL || m.model === GPU_MODEL);
        return {
            step: 'tags', ok: true,
            total_models: models.length,
            target_model_loaded: !!target,
            target_model: target || null,
            models: models.map(m => m.name)
        };
    } catch {
        return { step: 'tags', ok: false, error: 'tags parse failed', data: r.data.substring(0, 200) };
    }
}

function checkInference() {
    log('INFERENCE', 'Running tiny inference test: "Reply with exactly: OK"...');
    const startMs = Date.now();
    
    const token = loadAuthToken();
    const body = {
        model: GPU_MODEL,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 10,
        temperature: 0.1
    };
    
    // Write body to temp file to avoid shell escaping issues
    const tmpBodyFile = `/tmp/gpu-watchdog-body-${process.pid}.json`;
    fs.writeFileSync(tmpBodyFile, JSON.stringify(body));
    
    let rawOutput = '';
    try {
        const cmd = `curl -s --max-time 60 -X POST ` +
            `-H "Content-Type: application/json" ` +
            `-H "Authorization: Bearer ${token}" ` +
            `-d @${tmpBodyFile} ` +
            `${GPU_POD_URL}/api/chat`;
        rawOutput = exec(cmd, { encoding: 'utf8', timeout: 65000, shell: '/bin/bash' });
    } catch (e) {
        rawOutput = '';
    } finally {
        try { fs.unlinkSync(tmpBodyFile); } catch {}
    }
    
    const latencyMs = Date.now() - startMs;

    // Parse response: each line is a JSON object
    // Accumulate all content values — the last non-empty one is the final response
    const lines = rawOutput.split('\n').filter(l => l.trim());
    let responseContent = '';
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            if (obj.message?.content) {
                responseContent = obj.message.content;
            }
            if (obj.done || obj.total_duration) {
                break;
            }
        } catch {}
    }

    const trimmed = responseContent.trim();
    const passed = trimmed === 'OK';
    
    return {
        step: 'inference', ok: passed, passed,
        response: trimmed,
        expected: 'OK',
        latency_ms: latencyMs,
        raw: rawOutput.substring(0, 300)
    };
}

// === STATE MANAGEMENT ===

function loadSLO() {
    try {
        if (fs.existsSync(HEALTH_SLO_FILE)) {
            return JSON.parse(fs.readFileSync(HEALTH_SLO_FILE, 'utf8'));
        }
    } catch {}
    return { consecutive_failures: 0, last_healthy: null, slo_violations: 0 };
}

function saveSLO(slo) {
    try {
        const dir = path.dirname(HEALTH_SLO_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(HEALTH_SLO_FILE, JSON.stringify(slo, null, 2));
    } catch {}
}

function saveState(state) {
    try {
        const dir = path.dirname(STATE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch {}
}

function appendLog(entry) {
    try {
        const dir = path.dirname(LOG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(LOG_FILE, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n');
    } catch {}
}

// === MAIN ===

function run() {
    log('START', 'GPU Health Watchdog beginning...');
    const overallStartMs = Date.now();

    const endpointResult = checkEndpoint();
    log('ENDPOINT', `Result: ${endpointResult.ok ? 'OK' : 'FAIL'} ${endpointResult.error || endpointResult.raw || ''}`);

    const authResult = checkAuthToken();
    log('AUTH', `Result: ${authResult.ok ? 'OK' : 'FAIL'} ${authResult.error || ''}`);

    const tagsResult = checkTags();
    log('TAGS', `Result: ${tagsResult.ok ? 'OK' : 'FAIL'} ${tagsResult.error || ''} (${tagsResult.total_models || 0} models)`);

    const inferenceResult = checkInference();
    log('INFERENCE', `Result: ${inferenceResult.ok ? 'OK' : 'FAIL'} | Response: "${inferenceResult.response || ''}" | Latency: ${inferenceResult.latency_ms}ms`);

    const overallMs = Date.now() - overallStartMs;
    const allHealthy = endpointResult.ok && authResult.ok && tagsResult.ok && inferenceResult.ok;

    // SLO tracking
    const slo = loadSLO();
    if (allHealthy) {
        slo.consecutive_failures = 0;
        slo.last_healthy = new Date().toISOString();
        log('SLO', 'GPU is healthy. consecutive_failures reset to 0.');
    } else {
        slo.consecutive_failures++;
        log('SLO', `GPU unhealthy. consecutive_failures: ${slo.consecutive_failures}`);
    }
    saveSLO(slo);

    // Update operational-mode.json GPU health state
    try {
        const opModePath = '/home/node/.openclaw/workspace/state/operational-mode.json';
        let opMode = {};
        try {
            opMode = JSON.parse(fs.readFileSync(opModePath, 'utf8'));
        } catch {}
        
        opMode.gpu_health = {
            ...opMode.gpu_health,
            healthy: allHealthy,
            last_watchdog_check: new Date().toISOString(),
            watchdog_latency_ms: overallMs,
            endpoint_check: endpointResult.ok,
            auth_check: authResult.ok,
            tags_check: tagsResult.ok,
            inference_check: inferenceResult.ok,
            inference_response: inferenceResult.response || null,
            inference_latency_ms: inferenceResult.latency_ms,
            target_model_loaded: tagsResult.target_model_loaded || false,
            total_models: tagsResult.total_models || 0
        };
        opMode.gpu_status = allHealthy ? 'HEALTHY' : 'DEGRADED';
        
        fs.writeFileSync(opModePath, JSON.stringify(opMode, null, 2));
        log('STATE', 'Updated operational-mode.json');
    } catch (e) {
        log('STATE', `Failed to update operational-mode.json: ${e.message}`);
    }

    // Save watchdog state
    saveState({
        timestamp: new Date().toISOString(),
        overall_healthy: allHealthy,
        latency_ms: overallMs,
        endpoint: endpointResult,
        auth: authResult,
        tags: tagsResult,
        inference: inferenceResult,
        consecutive_failures: slo.consecutive_failures
    });

    // Append to history
    appendLog({
        healthy: allHealthy,
        latency_ms: overallMs,
        endpoint_ok: endpointResult.ok,
        auth_ok: authResult.ok,
        tags_ok: tagsResult.ok,
        inference_ok: inferenceResult.ok,
        inference_latency_ms: inferenceResult.latency_ms,
        consecutive_failures: slo.consecutive_failures,
        gpu_status: allHealthy ? 'HEALTHY' : 'DEGRADED'
    });

    log('DONE', `Overall: ${allHealthy ? 'HEALTHY' : 'DEGRADED'} | Total latency: ${overallMs}ms`);
    process.exit(allHealthy ? 0 : 1);
}

run();