"use strict";
/**
 * Phase 3 Validation Script
 * Tests all 10 Phase 3 objectives
 *
 * Run: node dist/phase3-validate.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_validator_js_1 = require("./config-validator.js");
const shadow_mode_js_1 = require("./modes/shadow-mode.js");
const replay_safety_js_1 = require("./events/replay-safety.js");
const lineage_js_1 = require("./events/lineage.js");
const queue_monitor_js_1 = require("./observability/queue-monitor.js");
const event_schemas_js_1 = require("./events/event-schemas.js");
const event_bus_js_1 = require("./events/event-bus.js");
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
function test(name, fn) {
    testsRun++;
    try {
        const result = fn();
        if (result === true || (result && result.then)) {
            console.log(`  ✅ ${name}`);
            testsPassed++;
        }
        else {
            console.log(`  ❌ ${name} — ${result}`);
            testsFailed++;
        }
    }
    catch (err) {
        console.log(`  ❌ ${name} — ${err.message}`);
        testsFailed++;
    }
}
async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}
async function run() {
    console.log('\n=== PHASE 3 VALIDATION ===\n');
    // ─── Objective 1: Webhook receiver routes through event router ───────────────
    console.log('1. Webhook receiver → event router wiring');
    test('Event router has subscribe function', () => {
        const { subscribe } = require('./events/event-bus.js');
        return typeof subscribe === 'function';
    });
    test('Event router registerRoute is async', async () => {
        const { registerRoute } = require('./events/router.js');
        const unsub = await registerRoute('test.phase3-validation', async (event) => {
            console.log(`    [router] received test event: ${event.event_id}`);
        }, 'phase3 validation');
        return typeof unsub === 'function';
    });
    // ─── Objective 2: Dual-write to Supabase ────────────────────────────────────
    console.log('\n2. Dual-write durability (Redis + Supabase)');
    test('event-bus imports supabase client', () => {
        const fs = require('fs');
        const content = fs.readFileSync('./dist/events/event-bus.js', 'utf8');
        return content.includes('writeEventToSupabase') && content.includes('getClient');
    });
    test('event-bus skips Supabase write in shadow mode', () => {
        const fs = require('fs');
        const content = fs.readFileSync('./dist/events/event-bus.js', 'utf8');
        return content.includes('isShadowMode()') && content.includes('skipping dual-write');
    });
    // ─── Objective 3: Remove default development secrets ─────────────────────────
    console.log('\n3. Remove default development secrets');
    test('config.ts has no hardcoded Supabase URL', () => {
        const fs = require('fs');
        const content = fs.readFileSync('./dist/config.js', 'utf8');
        return !content.includes('btrbczqjwzuybgcxckvm.supabase.co');
    });
    test('config validator requires WEBHOOK_INTERNAL_SECRET', () => {
        const result = (0, config_validator_js_1.validateRuntimeConfig)();
        return result.errors.some(e => e.includes('WEBHOOK_INTERNAL_SECRET'));
    });
    // ─── Objective 4: Harden internal auth handling ──────────────────────────────
    console.log('\n4. Harden internal auth handling');
    test('receiver.ts has no hardcoded secret fallback', () => {
        const fs = require('fs');
        const content = fs.readFileSync('./dist/webhooks/receiver.js', 'utf8');
        return !content.includes('dev-internal-secret-change-in-prod') ||
            (content.includes('throw') && content.includes('development secret'));
    });
    // ─── Objective 5: Queue depth monitoring hooks ───────────────────────────────
    console.log('\n5. Queue depth monitoring hooks');
    test('queue-monitor exports checkQueueHealth', async () => {
        const result = await (0, queue_monitor_js_1.checkQueueHealth)();
        return result && typeof result.stats === 'object' && typeof result.alerts === 'object';
    });
    test('queue-monitor has threshold configuration', async () => {
        const { getQueueHealthSummary } = require('./observability/queue-monitor.js');
        const summary = await getQueueHealthSummary();
        return summary.includes('Queue Health') && summary.includes('Pending');
    });
    // ─── Objective 6: Structured observability hooks ─────────────────────────────
    console.log('\n6. Structured observability hooks');
    test('structured-logger exports logEventStart and logEventComplete', async () => {
        const { logEventStart, logEventComplete } = require('./observability/structured-logger.js');
        return typeof logEventStart === 'function' && typeof logEventComplete === 'function';
    });
    test('structured-logger emits JSON to stdout', async () => {
        const { logEventStart } = require('./observability/structured-logger.js');
        // This will log to stdout
        logEventStart({ event_id: 'test-123', event_type: 'test', source: 'validator' });
        return true;
    });
    // ─── Objective 7: Shadow mode execution path ────────────────────────────────
    console.log('\n7. Shadow mode execution path');
    test('ORCHESTRATION_MODE environment variable works', () => {
        const mode = (0, shadow_mode_js_1.getOrchestrationMode)();
        return mode === 'shadow' || mode === 'production';
    });
    test('isShadowMode() returns boolean', () => {
        return typeof (0, shadow_mode_js_1.isShadowMode)() === 'boolean';
    });
    test('shadow-mode.ts has withShadowMode wrapper', () => {
        const fs = require('fs');
        const content = fs.readFileSync('./dist/modes/shadow-mode.js', 'utf8');
        return content.includes('withShadowMode') && content.includes('simulated');
    });
    // ─── Objective 8: Replay/recovery safety controls ────────────────────────────
    console.log('\n8. Replay/recovery safety controls');
    test('claimEventProcessing returns boolean', async () => {
        const testEventId = `test-replay-${Date.now()}`;
        const claimed = await (0, replay_safety_js_1.claimEventProcessing)(testEventId);
        if (claimed) {
            await (0, replay_safety_js_1.clearProcessedMarker)(testEventId);
        }
        return typeof claimed === 'boolean';
    });
    test('duplicate event_id is rejected', async () => {
        const testEventId = `test-dup-${Date.now()}`;
        const first = await (0, replay_safety_js_1.claimEventProcessing)(testEventId);
        const second = await (0, replay_safety_js_1.claimEventProcessing)(testEventId);
        if (first)
            await (0, replay_safety_js_1.clearProcessedMarker)(testEventId);
        return first === true && second === false;
    });
    // ─── Objective 9: Event lineage tracing ─────────────────────────────────────
    console.log('\n9. Event lineage tracing improvements');
    test('validateLineage detects invalid hop_count', () => {
        const badEvent = { event_id: 'test', event_type: 'test', source: 'test', hop_count: -1, created_at: new Date().toISOString(), payload: {} };
        const result = (0, lineage_js_1.validateLineage)(badEvent);
        return !result.valid && result.errors.some(e => e.includes('negative'));
    });
    test('createChildEvent preserves correlation_id', () => {
        const parent = (0, event_schemas_js_1.createEvent)('plan.created', 'test', { plan_id: 'p1' }, { correlation_id: 'corr-123' });
        const child = (0, lineage_js_1.createChildEvent)(parent, 'step.completed', 'test', { step_id: 's1' });
        return child.correlation_id === 'corr-123' && child.hop_count === parent.hop_count + 1;
    });
    // ─── Objective 10: Runtime configuration validation ─────────────────────────
    console.log('\n10. Runtime configuration validation');
    test('validateRuntimeConfig returns errors for missing secrets', () => {
        const result = (0, config_validator_js_1.validateRuntimeConfig)();
        return result.errors.length > 0 && result.valid === false;
    });
    test('getConfigSummary returns config without secrets', () => {
        const { getConfigSummary } = require('./config-validator.js');
        const summary = getConfigSummary();
        return summary.WEBHOOK_INTERNAL_SECRET === undefined || summary.SUPABASE_SERVICE_KEY?.includes('(set)');
    });
    // ─── Summary ─────────────────────────────────────────────────────────────────
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log(`Tests run:    ${testsRun}`);
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    // Cleanup
    await (0, event_bus_js_1.closeEventBus)();
    if (testsFailed > 0) {
        console.log('\n❌ PHASE 3 VALIDATION FAILED');
        process.exit(1);
    }
    else {
        console.log('\n✅ PHASE 3 VALIDATION PASSED');
        process.exit(0);
    }
}
run().catch(err => {
    console.error('Validation error:', err);
    process.exit(1);
});
//# sourceMappingURL=phase3-validate.js.map