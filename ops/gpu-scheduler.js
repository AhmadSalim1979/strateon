/**
 * gpu-scheduler.js — Phase D GPU Window Scheduler
 * 
 * File: /ops/gpu-scheduler.js
 * Owner: Moosa (CEO)
 * Purpose: Orchestrates RunPod GPU start/stop and window state
 * 
 * Cron jobs (created separately via OpenClaw cron):
 *   gpu-wakeup    — 05:45 UTC daily
 *   gpu-cooldown  — 21:15 UTC daily
 *   gpu-health    — every 15min during window (06:00-21:00 UTC)
 * 
 * DO NOT enable these crons until Phase D-7 production activation.
 * This file only defines the logic — cron activation is a separate step.
 */

const { execSync } = require('child_process');
const FS = require('fs');
const PATH = require('path');

// ============================================================================
// PATHS
// ============================================================================

const STATE_DIR = '/home/node/.openclaw/workspace/state';
const GPU_WINDOW_PATH = `${STATE_DIR}/gpu-window.json`;
const SECRETS_DIR = '/home/node/.openclaw/secrets';

// ============================================================================
// HELPERS
// ============================================================================

function loadJSON(path) {
  return JSON.parse(FS.readFileSync(path, 'utf8'));
}

function saveJSON(path, data) {
  FS.writeFileSync(path, JSON.stringify(data, null, 2));
}

function sendAlert(msg) {
  try {
    const escaped = msg.replace(/'/g, "'\"'\"'");
    execSync(`openclaw send-whatsapp '+923215139934' '${escaped}'`, { stdio: 'ignore' });
  } catch (e) {
    console.error('[gpu-scheduler] Alert failed:', e.message);
  }
}

function runpodGraphQL(query, variables = {}) {
  const secrets = loadJSON(`${SECRETS_DIR}/runpod.json`);
  if (!secrets.api_key || secrets.api_key.startsWith('<')) {
    throw new Error('RunPod API key not configured — edit secrets/runpod.json');
  }
  
  const cmd = `curl -s -X POST '${secrets.graphql_endpoint}' \\
    -H 'Content-Type: application/json' \\
    -H 'Authorization: Bearer ${secrets.api_key}' \\
    -d '{"query":"${query}","variables":${JSON.stringify(variables)}}'`;
  
  const result = execSync(cmd, { encoding: 'utf8' });
  return JSON.parse(result);
}

// ============================================================================
// WAKEUP — Start GPU (05:45 UTC)
// ============================================================================

async function gpuWakeup() {
  console.log('[gpu-scheduler] gpu-wakeup firing...');
  const state = loadJSON(GPU_WINDOW_PATH);

  // Check emergency stop
  if (state.emergency_stop) {
    console.log('[gpu-scheduler] Emergency stop active — skipping wakeup');
    return { success: false, reason: 'emergency_stop' };
  }

  const secrets = loadJSON(`${SECRETS_DIR}/runpod.json`);
  if (!secrets.instance_id || secrets.instance_id.startsWith('<')) {
    console.log('[gpu-scheduler] RunPod instance_id not configured');
    return { success: false, reason: 'instance_id not set' };
  }

  try {
    // Start pod
    console.log('[gpu-scheduler] Starting RunPod instance...');
    const startRes = runpodGraphQL(
      'mutation StartPod($input: StartPodInput!) { startPod(input: $input) { id status } }',
      { input: { id: secrets.instance_id } }
    );
    console.log('[gpu-scheduler] Start API response:', JSON.stringify(startRes));

    // Poll for running
    let attempts = 0;
    let podIp = null;
    while (attempts < 20) {
      await new Promise(r => setTimeout(r, 30000)); // 30s
      attempts++;

      const statusRes = runpodGraphQL(
        'query Pod($id: String!) { pod(id: $id) { id status runtime { ipAddresses } } }',
        { id: secrets.instance_id }
      );
      
      const pod = statusRes.data?.pod;
      console.log(`[gpu-scheduler] Pod status attempt ${attempts}:`, pod?.status);

      if (pod?.status === 'RUNNING' && pod?.runtime?.ipAddresses?.length > 0) {
        podIp = pod.runtime.ipAddresses[0];
        break;
      }
    }

    if (!podIp) {
      sendAlert('GPU wakeup: pod did not start within 10 minutes');
      return { success: false, reason: 'timeout waiting for pod' };
    }

    // Wait additional 60s for Ollama to be ready
    console.log('[gpu-scheduler] Waiting 60s for Ollama to be ready...');
    await new Promise(r => setTimeout(r, 60000));

    // Health check
    let healthy = false;
    for (let i = 0; i < 5; i++) {
      try {
        const check = execSync(
          `curl -s --max-time 10 http://${podIp}:11440/health`,
          { encoding: 'utf8' }
        );
        if (check.includes('OK')) {
          healthy = true;
          break;
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 30000));
      }
    }

    // Update state
    state.window_open = true;
    state.window_open_since = new Date().toISOString();
    state.pod_ip = podIp;
    state.instance_status = 'running';
    state.gpu_healthy = healthy;
    state.last_health_check = new Date().toISOString();
    state.last_error = null;
    saveJSON(GPU_WINDOW_PATH, state);

    if (healthy) {
      sendAlert('GPU window open — RunPod/Mistral active until 21:00 UTC');
    } else {
      sendAlert('GPU window open but Ollama not responding — using MiniMax fallback');
    }

    return { success: true, podIp, healthy };
  } catch (e) {
    console.error('[gpu-scheduler] Wakeup error:', e.message);
    state.last_error = e.message;
    saveJSON(GPU_WINDOW_PATH, state);
    sendAlert(`GPU wakeup failed: ${e.message}`);
    return { success: false, reason: e.message };
  }
}

// ============================================================================
// COOLDOWN — Stop GPU (21:15 UTC)
// ============================================================================

async function gpuCooldown() {
  console.log('[gpu-scheduler] gpu-cooldown firing...');
  const state = loadJSON(GPU_WINDOW_PATH);

  state.window_closing = true;
  saveJSON(GPU_WINDOW_PATH, state);

  // Accept in-flight requests until 21:20 UTC (handled by router)
  // This just triggers the stop sequence

  try {
    const secrets = loadJSON(`${SECRETS_DIR}/runpod.json`);

    // Stop pod
    console.log('[gpu-scheduler] Stopping RunPod instance...');
    const stopRes = runpodGraphQL(
      'mutation StopPod($input: StopPodInput!) { stopPod(input: $input) { id status } }',
      { input: { id: secrets.instance_id } }
    );
    console.log('[gpu-scheduler] Stop API response:', JSON.stringify(stopRes));

    // Poll for stopped
    let attempts = 0;
    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 30000));
      attempts++;

      const statusRes = runpodGraphQL(
        'query Pod($id: String!) { pod(id: $id) { id status } }',
        { id: secrets.instance_id }
      );

      if (statusRes.data?.pod?.status === 'STOPPED') {
        break;
      }
    }

    // Compute today's cost
    let costToday = 0;
    try {
      const billingRes = runpodGraphQL(
        'query { podBillingHistory(instanceId: "' + secrets.instance_id + '") { totalCost } }'
      );
      costToday = parseFloat(billingRes.data?.podBillingHistory?.totalCost || '0');
    } catch (e) {
      console.log('[gpu-scheduler] Could not fetch billing:', e.message);
    }

    // Update state
    state.window_open = false;
    state.window_open_since = null;
    state.pod_ip = null;
    state.instance_status = 'stopped';
    state.gpu_healthy = false;
    state.window_closing = false;
    state.cost_today = costToday;
    state.last_health_check = new Date().toISOString();
    saveJSON(GPU_WINDOW_PATH, state);

    sendAlert(`GPU window closed — cost today: $${costToday.toFixed(2)}`);
    return { success: true, costToday };
  } catch (e) {
    console.error('[gpu-scheduler] Cooldown error:', e.message);
    state.last_error = e.message;
    state.window_closing = false;
    saveJSON(GPU_WINDOW_PATH, state);
    sendAlert(`GPU cooldown failed: ${e.message}`);
    return { success: false, reason: e.message };
  }
}

// ============================================================================
// HEALTH CHECK — Every 15min during window
// ============================================================================

async function gpuHealthCheck() {
  const state = loadJSON(GPU_WINDOW_PATH);

  if (!state.window_open) {
    return { skipped: true, reason: 'window closed' };
  }

  if (!state.pod_ip) {
    return { skipped: true, reason: 'no pod IP' };
  }

  const startTime = Date.now();
  let healthy = false;

  try {
    const check = execSync(
      `curl -s --max-time 10 http://${state.pod_ip}:11440/health`,
      { encoding: 'utf8' }
    );
    healthy = check.includes('OK') || check.includes('auth proxy');
  } catch (e) {
    healthy = false;
  }

  state.gpu_healthy = healthy;
  state.last_health_check = new Date().toISOString();
  saveJSON(GPU_WINDOW_PATH, state);

  if (!healthy) {
    sendAlert('GPU brain unhealthy — routing to MiniMax');
  }

  return { healthy, latencyMs: Date.now() - startTime };
}

// ============================================================================
// MAIN
// ============================================================================

const action = process.argv[2] || 'help';

const actions = {
  'wakeup': () => gpuWakeup().then(r => console.log('Result:', JSON.stringify(r))),
  'cooldown': () => gpuCooldown().then(r => console.log('Result:', JSON.stringify(r))),
  'health': () => gpuHealthCheck().then(r => console.log('Result:', JSON.stringify(r))),
  'help': () => {
    console.log('Usage: node gpu-scheduler.js <action>');
    console.log('Actions: wakeup | cooldown | health');
    console.log('DO NOT run manually — cron jobs invoke these');
  }
};

if (actions[action]) {
  actions[action]();
} else {
  console.log('Unknown action:', action);
  actions.help();
}

module.exports = { gpuWakeup, gpuCooldown, gpuHealthCheck };