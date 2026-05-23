/**
 * readGpuJobResult.js — Read GPU bridge job result
 * 
 * Usage: node readGpuJobResult.js <jobId>
 * 
 * Or import as module:
 *   import { readGpuJobResult } from './readGpuJobResult.js';
 *   const result = await readGpuJobResult(jobId);
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GPU_BRIDGE_ROOT = '/home/node/.openclaw/workspace/gpu-bridge';
const QUEUE_DIR = join(GPU_BRIDGE_ROOT, 'QUEUE');
const RESULTS_DIR = join(GPU_BRIDGE_ROOT, 'RESULTS');

// ============================================================
// RESULT READING
// ============================================================

function loadJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8').toString());
  } catch {
    return null;
  }
}

export async function readGpuJobResult(jobId) {
  // Try RESULTS/ first — completed result
  const resultFile = join(RESULTS_DIR, `job-${jobId}-result.json`);
  if (existsSync(resultFile)) {
    const result = loadJSON(resultFile);
    console.log(`[readGpuJobResult] Found result: ${resultFile}`);
    console.log(`[readGpuJobResult] Status: ${result.status}`);
    return { found: true, type: 'result', data: result };
  }
  
  // Try QUEUE/ — job may still be pending or running
  const jobFile = join(QUEUE_DIR, `job-${jobId}.json`);
  if (existsSync(jobFile)) {
    const job = loadJSON(jobFile);
    console.log(`[readGpuJobResult] Job still in queue: ${jobFile}`);
    console.log(`[readGpuJobResult] Status: ${job.status}`);
    
    // Provide status context
    const statusContext = {
      pending: 'Job is queued, not yet picked up by runner',
      running: 'Job is currently executing',
      requires_approval: 'Job requires explicit approval before execution',
      stale: 'Job is older than 24h and was marked stale',
    };
    
    return {
      found: true,
      type: 'job',
      data: {
        jobId: job.jobId,
        jobType: job.jobType,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt || null,
        statusNote: statusContext[job.status] || 'Unknown status',
        requiresExplicitApproval: job.metadata?.requiresExplicitApproval || false,
      },
    };
  }
  
  // Not found anywhere
  console.log(`[readGpuJobResult] Job not found: ${jobId}`);
  return { found: false, type: null, data: null };
}

// ============================================================
// CLI
// ============================================================

const isMain = process.argv[1]?.endsWith('readGpuJobResult.js');
if (isMain) {
  const jobId = process.argv[2];
  
  if (!jobId) {
    console.error('Usage: node readGpuJobResult.js <jobId>');
    process.exit(1);
  }
  
  readGpuJobResult(jobId)
    .then(result => {
      if (!result.found) {
        console.log('\n[readGpuJobResult] Job not found in queue or results');
        process.exit(1);
      }
      console.log('\n[readGpuJobResult] Result:');
      console.log(JSON.stringify(result.data, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('\n[readGpuJobResult] Error:', err.message);
      process.exit(1);
    });
}