/**
 * GPU-Native CFO/CMO Spawn Guard
 * 
 * Attached to CFO and CMO morning spawn cron jobs.
 * Before spawning, checks:
 * 1. GPU is HEALTHY (gpu_health.healthy === true in operational-mode.json)
 * 2. operational-mode.json has gpu_primary_active === true OR current time is within active_hours
 * 3. If GPU unavailable, aborts spawn (no MiniMax fallback for cognitive tasks)
 * 
 * This ensures cognitive work (CFO/CMO) only runs on GPU, never MiniMax.
 * 
 * Logged events: gpu-spawn-guard.jsonl
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// === CONFIG ===
const STATE_FILE = '/home/node/.openclaw/workspace/state/operational-mode.json';
const LOG_FILE = '/home/node/.openclaw/workspace/state/gpu-spawn-guard.jsonl';
const SLO_FILE = '/home/node/.openclaw/workspace/state/gpu-health-slo.json';

function logEntry(level, msg, extra = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        msg,
        ...extra
    };
    console.log(`[gpu-guard] [${level}] ${msg}`, extra.role ? `(role=${extra.role})` : '');
    try {
        const dir = dirname(LOG_FILE);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch {}
}

function isWithinActiveHours(activeHours) {
    if (!activeHours) return true;
    try {
        const now = new Date();
        const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();
        const [startH, startM] = (activeHours.start || '00:00').split(':').map(Number);
        const [endH, endM] = (activeHours.end || '23:59').split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        if (startMins <= endMins) {
            return nowMins >= startMins && nowMins < endMins;
        } else {
            return nowMins >= startMins || nowMins < endMins;
        }
    } catch {
        return true;
    }
}

export function checkGpuReadiness() {
    let state = {};
    try {
        state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    } catch {
        return { ready: false, reason: 'state_file_missing', gpu_health: null };
    }

    const gpuHealth = state.gpu_health || {};
    
    let slo = { consecutive_failures: 0 };
    try {
        if (existsSync(SLO_FILE)) {
            slo = JSON.parse(readFileSync(SLO_FILE, 'utf8'));
        }
    } catch {}

    const gpuHealthy = gpuHealth.healthy === true;
    const inActiveHours = isWithinActiveHours(state.active_hours);
    const gpuPrimaryActive = state.gpu_primary_active === true;
    
    const gpuReady = gpuHealthy && (inActiveHours || gpuPrimaryActive);

    return {
        ready: gpuReady,
        reason: gpuReady ? null : (
            !gpuHealthy ? 'gpu_unhealthy' :
            !inActiveHours ? 'outside_active_hours' :
            !gpuPrimaryActive ? 'gpu_not_primary' :
            'unknown'
        ),
        gpu_health: gpuHealth,
        in_active_hours: inActiveHours,
        gpu_primary_active: gpuPrimaryActive,
        consecutive_failures: Math.max(gpuHealth.consecutive_failures || 0, slo.consecutive_failures),
        current_mode: state.current_mode,
        gpu_status: state.gpu_status
    };
}

export function isMinimaxModel(modelRef) {
    if (!modelRef) return false;
    const m = modelRef.toLowerCase();
    return m.includes('minimax') || m.includes('minimax-m2') || m.includes('minimax_m2');
}

export function guardSpawn({ role, model, sessionType }) {
    if (isMinimaxModel(model)) {
        logEntry('BLOCKED', 'blocked_minimax_spawn', { role, model, sessionType });
        return {
            allowed: false,
            reason: 'minimax_blocked',
            blocked: true,
            model,
            message: `Spawn blocked: ${model} is MiniMax. Cognitive tasks require GPU.`
        };
    }

    if (sessionType === 'isolated' || sessionType === 'cognitive') {
        const gpu = checkGpuReadiness();
        if (!gpu.ready) {
            logEntry('DEFERRED', 'gpu_deferred_spawn', { role, model, sessionType, reason: gpu.reason });
            return {
                allowed: false,
                reason: gpu.reason,
                deferred: true,
                gpu_state: gpu,
                message: `Spawn deferred: GPU ${gpu.reason}. Will retry on next cycle.`
            };
        }
        logEntry('ALLOWED', 'gpu_allowed_spawn', { role, model, sessionType, gpu_status: gpu.gpu_status });
        return {
            allowed: true,
            reason: 'gpu_ready',
            deferred: false,
            blocked: false,
            gpu_state: gpu
        };
    }

    logEntry('ALLOWED', 'allowed_non_cognitive', { role, model, sessionType });
    return { allowed: true, reason: 'non_cognitive', deferred: false, blocked: false };
}

function main() {
    const gpu = checkGpuReadiness();
    console.log(JSON.stringify(gpu, null, 2));
    process.exit(gpu.ready ? 0 : 1);
}

main();