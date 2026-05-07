/**
 * Phase 2 Validation Tests
 * 
 * Inline tests that validate each Phase 2 component.
 * Run with: node --loader ts-node/esm src/phase2-validate.ts
 * Or compiled: node dist/phase2-validate.js
 * 
 * These tests are isolated and do not affect production systems.
 */

import { getRedis, closeRedis } from './queue/redis-queue';
import { publishEvent, subscribe, closeEventBus } from './events/event-bus';
import { createEvent } from './events/event-schemas';
import { calculateBackoffDelay, getRetryConfig, shouldRetry, validateBackoffCalculations } from './retry/retry-processor';
import { runRecoveryScan, scanDeadLetterQueue, removeFromDeadLetter } from './recovery/scan';
import { enqueue, dequeue, complete, fail, getQueueStats, resetQueueManager } from './queue/queue-manager';
import { createWebhookReceiver } from './webhooks/receiver';
import http from 'http';

const results: Array<{ test: string; passed: boolean; error?: string }> = [];

async function runTest(name: string, fn: () => Promise<boolean>): Promise<void> {
  try {
    const passed = await fn();
    results.push({ test: name, passed });
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  } catch (err: any) {
    results.push({ test: name, passed: false, error: err.message });
    console.log(`❌ ${name}: ${err.message}`);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Test 1: Event Bus ─────────────────────────────────────────────────────────

async function testEventBus(): Promise<boolean> {
  const redis = getRedis();
  
  // Publish a test event
  const testEvent = createEvent('test.published', 'phase2-validator', { phase: 2, test: true });
  await publishEvent(testEvent);
  
  // Subscribe and wait for it
  let received = false;
  const unsubscribe = await subscribe((event) => {
    if (event.event_id === testEvent.event_id) {
      received = true;
    }
  }, 'test.*');
  
  await sleep(500);
  await unsubscribe();
  
  if (!received) throw new Error('Event bus did not deliver published event');
  return true;
}

// ─── Test 2: Queue Manager ─────────────────────────────────────────────────────

async function testQueueManager(): Promise<boolean> {
  resetQueueManager();
  
  // Enqueue a test job
  const job = await enqueue('test_job', { test: true }, { priority: 2 });
  
  if (!job.job_id) throw new Error('enqueue() did not return job_id');
  
  // Dequeue the job
  const dequeued = await dequeue();
  
  if (!dequeued) throw new Error('dequeue() returned null after enqueue');
  if (dequeued.job_id !== job.job_id) throw new Error('Dequeued wrong job');
  
  // Complete the job
  await complete(job.job_id, { result: 'success' });
  
  const completed = await getQueueStats();
  if (completed.active !== 0) throw new Error('Active count should be 0 after complete');
  
  return true;
}

// ─── Test 3: Retry Processor ──────────────────────────────────────────────────

async function testRetryProcessor(): Promise<boolean> {
  // Test backoff calculation
  const config = getRetryConfig('default');
  
  const delay1 = calculateBackoffDelay(1, config, 0); // no jitter
  const delay2 = calculateBackoffDelay(2, config, 0);
  const delay3 = calculateBackoffDelay(3, config, 0);
  
  // With initial_delay=5000, multiplier=2:
  // attempt 1: 5000 * 2^0 = 5000
  // attempt 2: 5000 * 2^1 = 10000
  // attempt 3: 5000 * 2^2 = 20000
  
  if (delay1 !== 5000) throw new Error(`Delay 1 should be 5000, got ${delay1}`);
  if (delay2 !== 10000) throw new Error(`Delay 2 should be 10000, got ${delay2}`);
  if (delay3 !== 20000) throw new Error(`Delay 3 should be 20000, got ${delay3}`);
  
  // Test shouldRetry
  const decision1 = shouldRetry(1, 'default');
  if (!decision1.shouldRetry) throw new Error('Attempt 1 should retry');
  if (decision1.delayMs !== 5000) throw new Error(`Attempt 1 delay should be 5000, got ${decision1.delayMs}`);
  
  const decision3 = shouldRetry(3, 'default');
  if (decision3.shouldRetry) throw new Error('Attempt 3 (max 3) should not retry');
  
  // Test validateBackoffCalculations
  const validation = validateBackoffCalculations();
  if (!validation.passed) {
    const failed = validation.tests.filter(t => !t.passed);
    throw new Error(`Backoff validation failed: ${JSON.stringify(failed)}`);
  }
  
  return true;
}

// ─── Test 4: Recovery Scan ────────────────────────────────────────────────────

async function testRecoveryScan(): Promise<boolean> {
  const redis = getRedis();
  
  // Add a test dead letter entry
  const testJobId = 'test-dead-letter-' + Date.now();
  const entry = `${testJobId}:${Date.now()}:3:Test error`;
  await redis.lpush(redis.options.keyPrefix + 'orchestration:job:dead_letter', entry);
  
  // Scan dead letters
  const deadLetters = await scanDeadLetterQueue();
  
  // Find our test entry
  const found = deadLetters.find(dl => dl.job_id === testJobId);
  
  // Clean up
  await removeFromDeadLetter(testJobId);
  
  if (!found) throw new Error('Recovery scan did not find test dead letter entry');
  if (found.attempt !== 3) throw new Error(`Dead letter attempt should be 3, got ${found.attempt}`);
  
  // Run full scan
  const scanResult = await runRecoveryScan();
  
  if (typeof scanResult.deadLetterCount !== 'number') {
    throw new Error('runRecoveryScan() did not return proper structure');
  }
  
  return true;
}

// ─── Test 5: Webhook Receiver ─────────────────────────────────────────────────

async function testWebhookReceiver(): Promise<boolean> {
  const app = createWebhookReceiver();
  
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
        const healthRes = await new Promise<http.IncomingMessage>((res, rej) => {
          const req = http.get(`http://127.0.0.1:${port}/health`, res);
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
        if (health.status !== 'ok') throw new Error('Health endpoint returned non-ok status');
        
        // Test internal event endpoint with wrong secret
        const failRes = await new Promise<http.IncomingMessage>((res, rej) => {
          const req = http.request(
            `http://127.0.0.1:${port}/internal/event`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' } },
            res
          );
          req.on('error', rej);
          req.write(JSON.stringify({ event_type: 'test', source: 'test' }));
          req.end();
          req.setTimeout(2000, () => {
            req.destroy();
            rej(new Error('Request timeout'));
          });
        });
        
        if (failRes.statusCode !== 401) throw new Error(`Expected 401 without secret, got ${failRes.statusCode}`);
        
        // Test internal event endpoint with correct secret
        const successRes = await new Promise<http.IncomingMessage>((res, rej) => {
          const req = http.request(
            `http://127.0.0.1:${port}/internal/event`,
            { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret } },
            res
          );
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
          await new Promise(res => successRes.on('end', () => {}));
          throw new Error(`Expected 200, got ${successRes.statusCode}: ${data}`);
        }
        
        server.close();
        resolve(true);
      } catch (err) {
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
  await closeEventBus();
  await closeRedis();
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});