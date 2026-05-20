/**
 * gpu-cost-tracker.js — Phase D GPU Cost Tracking
 * 
 * File: /ops/gpu-cost-tracker.js
 * Owner: Moosa (CEO)
 * Purpose: Track GPU spend, enforce budget limits
 * 
 * Runs: Daily at midnight (via OpenClaw cron)
 * Budget thresholds:
 *   - Alert at 80% ($240 of $300)
 *   - Emergency stop at 100% ($300)
 */

const { execSync } = require('child_process');
const FS = require('fs');

const STATE_DIR = '/home/node/.openclaw/workspace/state';
const SECRETS_DIR = '/home/node/.openclaw/secrets';
const GPU_WINDOW_PATH = `${STATE_DIR}/gpu-window.json`;
const COST_LOG_PATH = `${STATE_DIR}/gpu-cost-log.jsonl`;

// ============================================================================
// CONSTANTS
// ============================================================================

const COST_CONTROLS = {
  gpu_rate_dollars_per_hour: 0.69,
  window_hours_per_day: 15,
  max_days_per_month: 27,
  max_monthly_gpu_cost: 279.45,
  storage_monthly_estimate: 5.00,
  total_monthly_budget: 300.00,
  alert_threshold_pct: 0.80,       // Alert at 80% ($240)
  emergency_stop_threshold: 300.00 // Force stop at $300
};

// ============================================================================
// HELPERS
// ============================================================================

function loadJSON(path) {
  return JSON.parse(FS.readFileSync(path, 'utf8'));
}

function saveJSON(path, data) {
  FS.writeFileSync(path, JSON.stringify(data, null, 2));
}

function appendLog(path, entry) {
  FS.appendFileSync(path, JSON.stringify(entry) + '\n');
}

function sendAlert(msg) {
  try {
    const escaped = msg.replace(/'/g, "'\"'\"'");
    execSync(`openclaw send-whatsapp '+923215139934' '${escaped}'`, { stdio: 'ignore' });
  } catch (e) {
    console.error('[gpu-cost-tracker] Alert failed:', e.message);
  }
}

function runpodGraphQL(query) {
  const secrets = loadJSON(`${SECRETS_DIR}/runpod.json`);
  if (!secrets.api_key || secrets.api_key.startsWith('<')) {
    throw new Error('RunPod API key not configured');
  }
  
  const cmd = `curl -s -X POST '${secrets.graphql_endpoint}' \\
    -H 'Content-Type: application/json' \\
    -H 'Authorization: Bearer ${secrets.api_key}' \\
    -d '{"query":"${query}"}'`;
  
  const result = execSync(cmd, { encoding: 'utf8' });
  return JSON.parse(result);
}

// ============================================================================
// MAIN
// ============================================================================

async function trackCost() {
  console.log('[gpu-cost-tracker] Running...');
  const state = loadJSON(GPU_WINDOW_PATH);

  // Get billing from RunPod
  let monthlyCost = 0;
  try {
    const billingRes = runpodGraphQL(
      'query { me { podBillings { totalCost breakDown { gpuDuration costPerMinute } } } }'
    );
    monthlyCost = parseFloat(billingRes.data?.me?.podBillings?.totalCost || '0');
  } catch (e) {
    console.log('[gpu-cost-tracker] Could not fetch billing:', e.message);
    // Estimate based on window hours if no billing data
    monthlyCost = state.cost_this_month || 0;
  }

  state.cost_this_month = monthlyCost;
  saveJSON(GPU_WINDOW_PATH, state);

  // Log daily entry
  const logEntry = {
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    cost_this_month: monthlyCost,
    budget_pct: (monthlyCost / COST_CONTROLS.total_monthly_budget * 100).toFixed(1),
    window_hours_today: COST_CONTROLS.window_hours_per_day,
    rate_per_hour: COST_CONTROLS.gpu_rate_dollars_per_hour
  };
  appendLog(COST_LOG_PATH, logEntry);

  console.log(`[gpu-cost-tracker] Monthly cost: $${monthlyCost.toFixed(2)} / $${COST_CONTROLS.total_monthly_budget}`);

  // Check thresholds
  const pctUsed = monthlyCost / COST_CONTROLS.total_monthly_budget;

  if (pctUsed >= 1.0) {
    state.emergency_stop = true;
    saveJSON(GPU_WINDOW_PATH, state);
    sendAlert('GPU budget EMERGENCY STOP — $300 limit reached. GPU scheduler disabled.');
    console.log('[gpu-cost-tracker] EMERGENCY STOP triggered');
  } else if (pctUsed >= COST_CONTROLS.alert_threshold_pct) {
    sendAlert(`GPU budget alert: $${monthlyCost.toFixed(2)} (${Math.round(pctUsed * 100)}%) of $${COST_CONTROLS.total_monthly_budget}`);
    console.log('[gpu-cost-tracker] Budget alert sent');
  } else {
    console.log('[gpu-cost-tracker] Budget OK');
  }

  return {
    cost_this_month: monthlyCost,
    budget_pct: Math.round(pctUsed * 100),
    emergency_stop: state.emergency_stop
  };
}

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  trackCost()
    .then(r => console.log('Result:', JSON.stringify(r)))
    .catch(e => {
      console.error('Error:', e.message);
      process.exit(1);
    });
}

module.exports = { trackCost, COST_CONTROLS };