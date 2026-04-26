/**
 * schedule-self-check.js
 *
 * Phase SCS-3C — Thin CLI Wrapper
 *
 * Previously: contained all self-check scheduling logic.
 * Now: imports and calls runSelfCheckScheduling() from the handler module.
 *
 * Behavior is IDENTICAL to before — this is a pure refactor with no
 * functional change. Existing direct invocations of this script are
 * unaffected.
 *
 * Run: node scripts/schedule-self-check.js
 */

import { runSelfCheckScheduling } from '../src/handlers/self-check-scheduler.js';

const result = await runSelfCheckScheduling();

if (result.didRun) {
  console.log(`[schedule-self-check] ${result.reason}${result.chainId ? ` [chain=${result.chainId}]` : ''}`);
} else {
  console.log(`[schedule-self-check] ${result.reason}`);
  if (result.error) console.error(`[schedule-self-check] Error: ${result.error}`);
}
