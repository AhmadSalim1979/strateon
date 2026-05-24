/**
 * Operational Mode Manager
 * 
 * Manages Moosa's three operational modes:
 * - MODE_A: MiniMax primary + GPU shadow (current default)
 * - MODE_B: GPU primary + MiniMax fallback
 * - AUTO: Lifecycle-driven — GPU primary during active hours, MiniMax-only outside
 * 
 * Mode switching is runtime-settable without restart.
 * All state persisted to operational-state.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const STATE_FILE = '/home/node/.openclaw/workspace/state/operational-mode.json';
const GPU_LIFECYCLE = '/home/node/.openclaw/workspace/ops/gpu-lifecycle-controller.js';

const VALID_MODES = ['MODE_A', 'MODE_B', 'AUTO'];

// Graceful require for lifecycle controller (may not be loaded yet)
let lifecycle = null;
try {
    lifecycle = require(GPU_LIFECYCLE);
} catch {}

let state = {
    current_mode: 'MODE_A',           // Current active mode
    target_mode: 'MODE_A',            // Target mode (may differ during transition)
    gpu_status: 'unknown',            // GPU pod status: unknown | idle | active | degraded
    gpu_health: null,                 // Last health check result
    gpu_primary_active: false,        // Whether GPU is currently primary (Mode B or AUTO active hours)
    minimax_primary_active: true,     // Whether MiniMax is currently primary (always true in Mode A)
    mode_start_time: null,            // When current mode became active
    mode_switches: 0,                 // Total mode switches this session
    last_mode_switch: null,           // ISO timestamp of last switch
    gpu_uptime_start: null,           // When GPU became active
    active_hours: {                    // AUTO mode active hours (PKT)
        start: '11:00',               // 11:00 AM PKT = 06:00 UTC
        end: '02:00'                   // 02:00 AM PKT next day = 21:00 UTC
    },
    telemetry: {
        mode_a_requests: 0,
        mode_b_requests: 0,
        auto_mode_requests: 0,
        gpu_primary_success: 0,
        gpu_primary_fallback: 0,
        minimax_primary_requests: 0
    },
    notes: []
};

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            state = { ...state, ...saved };
        }
    } catch {}
}

function saveState() {
    try {
        const dir = path.dirname(STATE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch {}
}

function nowPKT() {
    // Pakistan Time = UTC+5
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const pkt = new Date(utc + (5 * 3600000));
    return pkt;
}

function isWithinActiveHours() {
    const pkt = nowPKT();
    const currentHHMM = pkt.getHours().toString().padStart(2, '0') + ':' + pkt.getMinutes().toString().padStart(2, '0');
    
    const [startH, startM] = state.active_hours.start.split(':').map(Number);
    const [endH, endM] = state.active_hours.end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const currentMinutes = pkt.getHours() * 60 + pkt.getMinutes();
    
    if (startMinutes < endMinutes) {
        // Same day: e.g., 11:00 to 23:00
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
        // Overnight: e.g., 23:00 to 06:00 (next day)
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
}

async function checkGpuHealth() {
    if (!lifecycle) {
        try { lifecycle = require(GPU_LIFECYCLE); } catch { return null; }
    }
    try {
        return await lifecycle.verifyGpuHealth();
    } catch {
        return null;
    }
}

function isGpuHealthy() {
    return state.gpu_health?.healthy === true;
}

// === PUBLIC API ===

export function getCurrentMode() { loadState(); return state.current_mode; }
export function getTargetMode() { loadState(); return state.target_mode; }
export function getGpuStatus() { loadState(); return state.gpu_status; }
export function isGpuPrimary() { loadState(); return state.gpu_primary_active; }
export function isMinimaxPrimary() { loadState(); return state.minimax_primary_active; }

export function getModeState() {
    loadState();
    return { ...state };
}

export function getModeTelemetry() {
    loadState();
    return { ...state.telemetry };
}

export function getEffectiveMode() {
    loadState();
    
    if (state.current_mode !== 'AUTO') {
        return state.current_mode;
    }
    
    // AUTO mode: GPU active during hours, MiniMax-only outside
    if (isWithinActiveHours() && isGpuHealthy()) {
        return 'MODE_B';  // AUTO resolves to MODE_B during active hours
    }
    return 'MODE_A';      // AUTO resolves to MODE_A outside hours or if GPU unhealthy
}

export async function setMode(newMode, reason = 'manual') {
    if (!VALID_MODES.includes(newMode)) {
        throw new Error('Invalid mode. Must be one of: ' + VALID_MODES.join(', '));
    }
    
    loadState();
    const oldMode = state.current_mode;
    
    if (oldMode === newMode) {
        return { success: true, mode: oldMode, changed: false };
    }
    
    state.current_mode = newMode;
    state.target_mode = newMode;
    state.mode_start_time = new Date().toISOString();
    state.mode_switches++;
    state.last_mode_switch = new Date().toISOString();
    state.notes.push({
        timestamp: new Date().toISOString(),
        from: oldMode,
        to: newMode,
        reason
    });
    
    // Update primary active flags
    if (newMode === 'MODE_A') {
        state.gpu_primary_active = false;
        state.minimax_primary_active = true;
    } else if (newMode === 'MODE_B') {
        state.gpu_primary_active = true;
        state.minimax_primary_active = true;  // MiniMax still available as fallback
    } else {  // AUTO
        // Will be determined by active hours + health
        state.minimax_primary_active = true;
    }
    
    saveState();
    
    return {
        success: true,
        mode: newMode,
        changed: true,
        previous_mode: oldMode,
        gpu_primary_active: state.gpu_primary_active,
        minimax_primary_active: state.minimax_primary_active
    };
}

export function recordRequestMetrics({ source, quality, latency_ms }) {
    loadState();
    
    // Record by mode type
    if (state.current_mode === 'MODE_A') {
        state.telemetry.mode_a_requests++;
        state.telemetry.minimax_primary_requests++;
    } else if (state.current_mode === 'MODE_B') {
        state.telemetry.mode_b_requests++;
        if (source === 'GPU') {
            state.telemetry.gpu_primary_success++;
        } else {
            state.telemetry.gpu_primary_fallback++;
        }
    } else {  // AUTO
        state.telemetry.auto_mode_requests++;
        const effective = getEffectiveMode();
        if (effective === 'MODE_B') {
            if (source === 'GPU') {
                state.telemetry.gpu_primary_success++;
            } else {
                state.telemetry.gpu_primary_fallback++;
            }
        } else {
            state.telemetry.minimax_primary_requests++;
        }
    }
    
    saveState();
}

export async function refreshGpuStatus() {
    loadState();
    
    const lifecycleState = lifecycle ? lifecycle.getLifecycleStatus() : { status: 'unknown' };
    state.gpu_status = lifecycleState.status || 'unknown';
    
    const health = await checkGpuHealth();
    state.gpu_health = health;
    
    if (state.gpu_status === 'ACTIVE' && health?.healthy) {
        state.gpu_primary_active = (state.current_mode === 'MODE_B') || 
            (state.current_mode === 'AUTO' && isWithinActiveHours());
    } else {
        state.gpu_primary_active = false;
    }
    
    saveState();
    return {
        gpu_status: state.gpu_status,
        gpu_health: state.gpu_health,
        gpu_primary_active: state.gpu_primary_active
    };
}

export function resetTelemetry() {
    loadState();
    state.telemetry = {
        mode_a_requests: 0,
        mode_b_requests: 0,
        auto_mode_requests: 0,
        gpu_primary_success: 0,
        gpu_primary_fallback: 0,
        minimax_primary_requests: 0
    };
    saveState();
}

// === CLI ===
// Detects if run directly: node operational-mode.js <cmd>
function runCLI() {
    const args = process.argv.slice(1);  // slice(1) since ES module
    const scriptName = args[1];  // When run as script, args[0] is module path
    const cmd = args[2] || args[1];  // node operational-mode.js status -> args[1] is module, args[2] is status
    
    // Only run CLI if this file was executed directly (not imported)
    // In ES modules, we check if this is the main script via import.meta.url
    const isMain = import.meta.url === 'file://' + process.argv[1];
    if (!isMain) return;
    
    const commands = args.slice(2);
    const action = commands[0];
    
    if (action === 'status') {
        console.log(JSON.stringify(getModeState(), null, 2));
    } else if (action === 'mode') {
        console.log('Current mode:', getCurrentMode());
        console.log('Effective mode:', getEffectiveMode());
        console.log('GPU primary:', isGpuPrimary());
        console.log('MiniMax primary:', isMinimaxPrimary());
    } else if (action === 'telemetry') {
        console.log(JSON.stringify(getModeTelemetry(), null, 2));
    } else if (action === 'set' && commands[1]) {
        setMode(commands[1].toUpperCase(), 'cli').then(r => {
            console.log(JSON.stringify(r, null, 2));
            process.exit(r.success ? 0 : 1);
        });
    } else if (action === 'refresh') {
        refreshGpuStatus().then(r => {
            console.log(JSON.stringify(r, null, 2));
            process.exit(0);
        });
    } else {
        console.log('Usage: node operational-mode.js [status|mode|telemetry|set MODE|refresh]');
        console.log('Valid modes: MODE_A, MODE_B, AUTO');
    }
}

// Run CLI if this is the main script
if (process.argv[1] && process.argv[1].includes('operational-mode.js')) {
    runCLI();
}

export default {
    getCurrentMode,
    getTargetMode,
    getGpuStatus,
    isGpuPrimary,
    isMinimaxPrimary,
    getModeState,
    getModeTelemetry,
    getEffectiveMode,
    setMode,
    recordRequestMetrics,
    refreshGpuStatus,
    resetTelemetry,
    VALID_MODES
};