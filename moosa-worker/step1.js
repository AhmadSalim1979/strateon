#!/usr/bin/env node
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

async function main() {
  const staleTasks = [
    'a37f6113-2ad4-4f29-9a03-f2b53580c601',
    '5b870d83-1405-4e6a-aef0-71697ed13bd7',
    '0388068a-9410-4e35-a1e3-af40c18f8edb'
  ];
  
  console.log('=== Step 1a: Marking stale tasks as failed ===');
  for (const taskId of staleTasks) {
    const result = await patch(`/rest/v1/tasks?id=eq.${taskId}`, { status: 'failed' });
    console.log(`Task ${taskId}: status=${result.status}`);
  }
  
  console.log('\n=== Step 1b: Updating linked dispatches ===');
  for (const taskId of staleTasks) {
    const result = await patch(`/rest/v1/dispatches?task_id=eq.${taskId}`, { 
      terminal: true, 
      lifecycle_state: 'failed' 
    });
    console.log(`Dispatch for ${taskId}: status=${result.status}`);
  }
  
  console.log('\n=== Step 1 complete ===');
  
  // Wait 5 seconds
  console.log('\nWaiting 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('\n=== Step 3: Creating fresh task ===');
  const freshTaskResult = await patch('/rest/v1/tasks', {
    status: 'created',
    action_type: 'local_coder',
    input_json: { prompt: 'Return exactly HELLO_ROUTE_TEST and nothing else.', mode: 'test' },
    max_retries: 3
  });
  console.log('Fresh task creation response:', freshTaskResult);
  
  console.log('\nDone!');
}

main().catch(console.error);
