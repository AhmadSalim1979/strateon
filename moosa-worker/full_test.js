#!/usr/bin/env node
/**
 * Full test script for moosa-worker routing test
 * Steps:
 * 1. Clear stale tasks (mark as failed, update dispatches)
 * 2. Wait 5 seconds
 * 3. Create fresh task and dispatch
 * 4. Poll for completion (up to 90 seconds)
 * 5. Report results
 */

const https = require('https');

const SUPABASE_URL = 'btrbczqjwzuybgcxckvm.supabase.co';
const SUPABASE_KEY = 'sb_secret__T1GYuCAvox2_EQXrRwGLg_yXXI-GvS';

function patch(urlPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: urlPath,
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function post(urlPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: urlPath,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: urlPath,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const staleTaskIds = [
    'a37f6113-2ad4-4f29-9a03-f2b53580c601',
    '5b870d83-1405-4e6a-aef0-71697ed13bd7',
    '0388068a-9410-4e35-a1e3-af40c18f8edb'
  ];
  
  console.log('=== STEP 1: Clearing stale tasks ===');
  
  // Step 1a: Mark tasks as failed
  for (const taskId of staleTaskIds) {
    console.log(`Marking task ${taskId} as failed...`);
    const result = await patch(`/rest/v1/tasks?id=eq.${taskId}`, { status: 'failed' });
    console.log(`  -> status: ${result.status}`);
  }
  
  // Step 1b: Update linked dispatches
  for (const taskId of staleTaskIds) {
    console.log(`Updating dispatch for task ${taskId}...`);
    const result = await patch(`/rest/v1/dispatches?task_id=eq.${taskId}`, { 
      terminal: true, 
      lifecycle_state: 'failed' 
    });
    console.log(`  -> status: ${result.status}`);
  }
  
  console.log('\n=== STEP 2: Waiting 5 seconds ===');
  await sleep(5000);
  
  console.log('\n=== STEP 3: Creating fresh task ===');
  
  // Create fresh task
  const taskResult = await post('/rest/v1/tasks', {
    status: 'created',
    action_type: 'local_coder',
    input_json: { prompt: 'Return exactly HELLO_ROUTE_TEST and nothing else.', mode: 'test' },
    max_retries: 3
  });
  
  let freshTaskId;
  if (taskResult.body && taskResult.body.id) {
    freshTaskId = taskResult.body.id;
    console.log(`Fresh task created: ${freshTaskId}`);
    console.log(`  Full response:`, JSON.stringify(taskResult.body));
  } else {
    console.log(`Failed to create task! Status: ${taskResult.status}, Body:`, taskResult.body);
    process.exit(1);
  }
  
  // Create linked dispatch
  console.log('\nCreating linked dispatch...');
  const dispatchResult = await post('/rest/v1/dispatches', {
    task_id: freshTaskId,
    lifecycle_state: 'execution_pending',
    executor_ref: 'moosa-worker',
    action_type: 'local_coder'
  });
  
  let freshDispatchId;
  if (dispatchResult.body && dispatchResult.body.id) {
    freshDispatchId = dispatchResult.body.id;
    console.log(`Fresh dispatch created: ${freshDispatchId}`);
    console.log(`  Full response:`, JSON.stringify(dispatchResult.body));
  } else {
    console.log(`Failed to create dispatch! Status: ${dispatchResult.status}, Body:`, dispatchResult.body);
  }
  
  console.log('\n=== STEP 4: Polling for completion (up to 90s) ===');
  
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds
  const maxWait = 90000; // 90 seconds
  let finalTaskState = null;
  let finalDispatchState = null;
  
  while (Date.now() - startTime < maxWait) {
    await sleep(pollInterval);
    
    // Check task status
    const taskCheck = await get(`/rest/v1/tasks?id=eq.${freshTaskId}`);
    if (taskCheck.body && Array.isArray(taskCheck.body) && taskCheck.body.length > 0) {
      finalTaskState = taskCheck.body[0];
      console.log(`[${Math.round((Date.now() - startTime)/1000)}s] Task status: ${finalTaskState.status}`);
      
      if (finalTaskState.status === 'completed' || finalTaskState.status === 'failed') {
        break;
      }
    }
    
    // Check dispatch lifecycle_state
    if (freshDispatchId) {
      const dispatchCheck = await get(`/rest/v1/dispatches?id=eq.${freshDispatchId}`);
      if (dispatchCheck.body && Array.isArray(dispatchCheck.body) && dispatchCheck.body.length > 0) {
        finalDispatchState = dispatchCheck.body[0];
        console.log(`  Dispatch lifecycle_state: ${finalDispatchState.lifecycle_state}`);
      }
    }
  }
  
  console.log('\n=== STEP 5: REPORT ===');
  console.log(`Stale tasks cleared: ${staleTaskIds.join(', ')}`);
  console.log(`Fresh task ID: ${freshTaskId}`);
  console.log(`Fresh task final status: ${finalTaskState?.status}`);
  console.log(`Fresh dispatch ID: ${freshDispatchId}`);
  console.log(`Fresh dispatch final lifecycle_state: ${finalDispatchState?.lifecycle_state}`);
  console.log(`Task output_json: ${JSON.stringify(finalTaskState?.output_json)}`);
  
  const output = finalTaskState?.output_json || finalTaskState?.result || '';
  const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
  console.log(`Output contains "HELLO_ROUTE_TEST": ${outputStr.includes('HELLO_ROUTE_TEST')}`);
  
  console.log('\n=== Checking error log ===');
  const fs = require('fs');
  const logPath = '/root/.pm2/logs/moosa-worker-error.log';
  if (fs.existsSync(logPath)) {
    const stats = fs.statSync(logPath);
    // Get last 50 lines
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const lastLines = lines.slice(-50).join('\n');
    console.log(`Last 50 lines of ${logPath}:`);
    console.log(lastLines);
  } else {
    console.log(`Error log not found at ${logPath}`);
  }
  
  console.log('\n=== DONE ===');
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
