"use strict";
/**
 * Phase 2 Validation Tests
 *
 * Inline tests that validate each Phase 2 component.
 * Run with: node --loader ts-node/esm src/phase2-validate.ts
 * Or compiled: node dist/phase2-validate.js
 *
 * These tests are isolated and do not affect production systems.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_queue_1 = require("./queue/redis-queue");
const event_bus_1 = require("./events/event-bus");
const event_schemas_1 = require("./events/event-schemas");
const retry_processor_1 = require("./retry/retry-processor");
const scan_1 = require("./recovery/scan");
const queue_manager_1 = require("./queue/queue-manager");
const receiver_1 = require("./webhooks/receiver");
const http_1 = __importDefault(require("http"));
const results = [];
async function runTest(name, fn) {
    try {
        const passed = await fn();
        results.push({ test: name, passed });
        console.log(`${passed ? '✅' : '❌'} ${name}`);
    }
    catch (err) {
        results.push({ test: name, passed: false, error: err.message });
        console.log(`❌ ${name}: ${err.message}`);
    }
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// ─── Test 1: Event Bus ─────────────────────────────────────────────────────────
async function testEventBus() {
    const redis = (0, redis_queue_1.getRedis)();
    const testEvent = (0, event_schemas_1.createEvent)('test.published', 'phase2-validator', { phase: 2, test: true });
    // Subscribe BEFORE publishing (timing fix)
    let received = false;
    const unsubscribe = await (0, event_bus_1.subscribe)((event) => {
        if (event.event_id === testEvent.event_id) {
            received = true;
        }
    }, 'test.*');
    // Now publish — subscriber is already listening
    await (0, event_bus_1.publishEvent)(testEvent);
    // Wait for delivery
    await sleep(800);
    await unsubscribe();
    if (!received)
        throw new Error('Event bus did not deliver published event');
    return true;
}
// ─── Test 2: Queue Manager ─────────────────────────────────────────────────────
async function testQueueManager() {
    (0, queue_manager_1.resetQueueManager)();
    // Enqueue a test job
    const job = await (0, queue_manager_1.enqueue)('test_job', { test: true }, { priority: 2 });
    if (!job.job_id)
        throw new Error('enqueue() did not return job_id');
    // Dequeue the job
    const dequeued = await (0, queue_manager_1.dequeue)();
    if (!dequeued)
        throw new Error('dequeue() returned null after enqueue');
    if (dequeued.job_id !== job.job_id)
        throw new Error('Dequeued wrong job');
    // Complete the job
    await (0, queue_manager_1.complete)(job.job_id, { result: 'success' });
    const completed = await (0, queue_manager_1.getQueueStats)();
    if (completed.active !== 0)
        throw new Error('Active count should be 0 after complete');
    return true;
}
// ─── Test 3: Retry Processor ──────────────────────────────────────────────────
async function testRetryProcessor() {
    // Test backoff calculation with jitterFactor=0 (deterministic)
    // Allow ±10% tolerance since jitter=0 should give exact values but
    // floating point arithmetic during the max() call can introduce tiny rounding
    const config = (0, retry_processor_1.getRetryConfig)('default');
    const delay1 = (0, retry_processor_1.calculateBackoffDelay)(1, config, 0); // no jitter
    const delay2 = (0, retry_processor_1.calculateBackoffDelay)(2, config, 0);
    const delay3 = (0, retry_processor_1.calculateBackoffDelay)(3, config, 0);
    // Expected: 5000, 10000, 20000 with jitterFactor=0
    // Allow 1% tolerance for floating point arithmetic edge cases
    const tolerance = 0.01;
    if (Math.abs(delay1 - 5000) > 5000 * tolerance)
        throw new Error(`Delay 1 should be ~5000, got ${delay1}`);
    if (Math.abs(delay2 - 10000) > 10000 * tolerance)
        throw new Error(`Delay 2 should be ~10000, got ${delay2}`);
    if (Math.abs(delay3 - 20000) > 20000 * tolerance)
        throw new Error(`Delay 3 should be ~20000, got ${delay3}`);
    // Test shouldRetry uses default jitter — check delay is in expected ballpark
    const decision1 = (0, retry_processor_1.shouldRetry)(1, 'default');
    if (!decision1.shouldRetry)
        throw new Error('Attempt 1 should retry');
    if (decision1.delayMs < 4500 || decision1.delayMs > 5500) {
        throw new Error(`Attempt 1 delayMs should be ~5000 with jitter, got ${decision1.delayMs}`);
    }
    const decision3 = (0, retry_processor_1.shouldRetry)(3, 'default');
    if (decision3.shouldRetry)
        throw new Error('Attempt 3 (max 3) should not retry');
    // Test validateBackoffCalculations
    const validation = (0, retry_processor_1.validateBackoffCalculations)();
    if (!validation.passed) {
        const failed = validation.tests.filter(t => !t.passed);
        throw new Error(`Backoff validation failed: ${JSON.stringify(failed)}`);
    }
    return true;
}
// ─── Test 4: Recovery Scan ────────────────────────────────────────────────────
async function testRecoveryScan() {
    const redis = (0, redis_queue_1.getRedis)();
    // Add a test dead letter entry
    const testJobId = 'test-dead-letter-' + Date.now();
    const entry = `${testJobId}:${Date.now()}:3:Test error`;
    await redis.lpush(redis.options.keyPrefix + 'orchestration:job:dead_letter', entry);
    // Scan dead letters
    const deadLetters = await (0, scan_1.scanDeadLetterQueue)();
    // Find our test entry
    const found = deadLetters.find(dl => dl.job_id === testJobId);
    // Clean up
    await (0, scan_1.removeFromDeadLetter)(testJobId);
    if (!found)
        throw new Error('Recovery scan did not find test dead letter entry');
    if (found.attempt !== 3)
        throw new Error(`Dead letter attempt should be 3, got ${found.attempt}`);
    // Run full scan
    const scanResult = await (0, scan_1.runRecoveryScan)();
    if (typeof scanResult.deadLetterCount !== 'number') {
        throw new Error('runRecoveryScan() did not return proper structure');
    }
    return true;
}
// ─── Test 5: Webhook Receiver ─────────────────────────────────────────────────
async function testWebhookReceiver() {
    const app = (0, receiver_1.createWebhookReceiver)();
    // Start server on random port
    return new Promise((resolve, reject) => {
        const server = app.listen(0, '127.0.0.1', async () => {
            const addr = server.address();
            if (!addr || typeof addr === 'string') {
                server.close();
                reject(new Error('Server did not start properly'));
                return;
            }
            const port = addr.port;
            const secret = 'dev-internal-secret-change-in-prod';
            try {
                // Test health endpoint
                const healthRes = await new Promise((res, rej) => {
                    const req = http_1.default.get(`http://127.0.0.1:${port}/health`, res);
                    req.on('error', rej);
                    req.setTimeout(2000, () => {
                        req.destroy();
                        rej(new Error('Health endpoint timeout'));
                    });
                });
                let healthData = '';
                healthRes.on('data', chunk => healthData += chunk);
                await new Promise(res => healthRes.on('end', res));
                const health = JSON.parse(healthData);
                if (health.status !== 'ok')
                    throw new Error('Health endpoint returned non-ok status');
                // Test internal event endpoint with wrong secret
                const failRes = await new Promise((res, rej) => {
                    const req = http_1.default.request(`http://127.0.0.1:${port}/internal/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, res);
                    req.on('error', rej);
                    req.write(JSON.stringify({ event_type: 'test', source: 'test' }));
                    req.end();
                    req.setTimeout(2000, () => {
                        req.destroy();
                        rej(new Error('Request timeout'));
                    });
                });
                if (failRes.statusCode !== 401)
                    throw new Error(`Expected 401 without secret, got ${failRes.statusCode}`);
                // Test internal event endpoint with correct secret
                const successRes = await new Promise((res, rej) => {
                    const req = http_1.default.request(`http://127.0.0.1:${port}/internal/event`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret } }, res);
                    req.on('error', rej);
                    req.write(JSON.stringify({ event_type: 'test.phase2', source: 'phase2-validator', payload: { test: true } }));
                    req.end();
                    req.setTimeout(2000, () => {
                        req.destroy();
                        rej(new Error('Request timeout'));
                    });
                });
                if (successRes.statusCode !== 200) {
                    let data = '';
                    successRes.on('data', chunk => data += chunk);
                    await new Promise(res => successRes.on('end', () => { }));
                    throw new Error(`Expected 200, got ${successRes.statusCode}: ${data}`);
                }
                server.close();
                resolve(true);
            }
            catch (err) {
                server.close();
                reject(err);
            }
        });
        server.on('error', reject);
    });
}
// ─── Run All Tests ────────────────────────────────────────────────────────────
async function main() {
    console.log('\n=== Phase 2 Component Validation ===\n');
    await runTest('Event Bus — publish/subscribe', testEventBus);
    await runTest('Queue Manager — enqueue/dequeue', testQueueManager);
    await runTest('Retry Processor — backoff calculation', testRetryProcessor);
    await runTest('Recovery Scan — dead letter detection', testRecoveryScan);
    await runTest('Webhook Receiver — internal endpoint', testWebhookReceiver);
    console.log('\n=== Results ===');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Passed: ${passed}/${results.length}`);
    console.log(`Failed: ${failed}/${results.length}`);
    if (failed > 0) {
        console.log('\nFailed tests:');
        for (const r of results.filter(r => !r.passed)) {
            console.log(`  - ${r.test}: ${r.error}`);
        }
    }
    // Cleanup
    await (0, event_bus_1.closeEventBus)();
    await (0, redis_queue_1.closeRedis)();
    process.exit(failed > 0 ? 1 : 0);
}
main().catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
});
//# sourceMappingURL=phase2-validate.js.map