/**
 * createGpuJob.js — Create a GPU bridge job
 * 
 * Phase 2A: Dry-run job creation for GPU bridge
 * Usage: node createGpuJob.js <jobType> <targetPod> <command>
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import crypto from 'crypto';

const GPU_BRIDGE_ROOT = '/home/node/.openclaw/workspace/gpu-bridge';
const QUEUE_DIR = join(GPU_BRIDGE_ROOT, 'QUEUE');
const CONFIG_DIR = join(GPU_BRIDGE_ROOT, 'CONFIG');

// ============================================================
// HELPERS
// ============================================================

function loadJSON(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function generateJobId(jobType) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const shortId = crypto.randomBytes(3).toString('hex');
  return `${jobType.replace(/_/g, '-')}-${timestamp}-${shortId}`;
}

// ============================================================
// VALIDATORS
// ============================================================

function validateJobType(jobType) {
  const validTypes = [
    'pod_ssh_validate', 'pod_pm2_status', 'pod_health_check',
    'pod_proxy_inspect', 'pod_gpu_generate_test', 'pod_remediation_readonly',
    'pod_runpod_api_status', 'pod_proxy_health_check'
  ];
  if (!validTypes.includes(jobType)) {
    throw new Error(`INVALID_JOB_TYPE: '${jobType}' — must be one of: ${validTypes.join(', ')}`);
  }
  return true;
}

function validateTargetPod(targetPod) {
  const podTargets = loadJSON(join(CONFIG_DIR, 'pod-targets.json'));
  const knownPods = podTargets.knownPods.map(p => p.podId);
  if (!knownPods.includes(targetPod)) {
    throw new Error(`UNKNOWN_POD: '${targetPod}' — known pods: ${knownPods.join(', ')}`);
  }
  return true;
}

function validateCommand(command) {
  if (!command || command.trim().length === 0) {
    throw new Error('EMPTY_COMMAND: command must not be empty');
  }
  if (command.length > 500) {
    throw new Error('COMMAND_TOO_LONG: max 500 characters');
  }
  return true;
}

// ============================================================
// JOB CREATION
// ============================================================

export async function createGpuJob({ jobType, targetPod, command, metadata = {} }) {
  const allowedCommands = loadJSON(join(CONFIG_DIR, 'allowed-commands.json'));
  const timeoutPolicy = loadJSON(join(CONFIG_DIR, 'timeout-policy.json'));
  const retryPolicy = loadJSON(join(CONFIG_DIR, 'retry-policy.json'));
  
  validateJobType(jobType);
  validateTargetPod(targetPod);
  validateCommand(command);
  
  const jobTypeConfig = allowedCommands.jobTypes[jobType];
  const jobTimeout = timeoutPolicy.timeouts[jobType]?.timeoutMs || 30000;
  const requiresExplicitApproval = jobTypeConfig?.requiresExplicitApproval || false;
  const maxRetries = retryPolicy.retryLimits?.[jobType]?.maxRetries ?? retryPolicy.retryLimits?.defaultMaxRetries ?? 2;
  
  const jobId = generateJobId(jobType);
  
  const job = {
    jobId,
    jobType,
    targetPod,
    command,
    createdAt: new Date().toISOString(),
    createdBy: 'moosa-ceo',
    status: 'pending',
    retryCount: 0,
    maxRetries,
    timeoutMs: jobTimeout,
    safety: {
      gpuShadowOnly: true,
      noProductionRouting: true,
      noRebuildOrRedeploy: true,
    },
    metadata: {
      ...metadata,
      requiresExplicitApproval,
      phase: 'phase-2a-dry-run',
    },
  };
  
  if (requiresExplicitApproval) {
    job.status = 'requires_approval';
    job.metadata.approvalNote = `Job type '${jobType}' requires explicit approval before execution`;
  }
  
  const jobFile = join(QUEUE_DIR, `job-${jobId}.json`);
  
  if (!existsSync(QUEUE_DIR)) {
    mkdirSync(QUEUE_DIR, { recursive: true });
  }
  
  writeFileSync(jobFile, JSON.stringify(job, null, 2));
  
  console.log(`[createGpuJob] Job created: ${jobId}`);
  console.log(`[createGpuJob] File: ${jobFile}`);
  console.log(`[createGpuJob] Status: ${job.status}`);
  console.log(`[createGpuJob] Requires approval: ${requiresExplicitApproval}`);
  
  return { jobId, jobFile, job };
}

// ============================================================
// CLI
// ============================================================

const isMain = process.argv[1]?.endsWith('createGpuJob.js');
if (isMain) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node createGpuJob.js <jobType> <targetPod> <command>');
    console.error('Example: node createGpuJob.js pod_ssh_validate ku2tmyupp8tkbs "cat /workspace/gpu-api-token.txt"');
    process.exit(1);
  }
  
  const [jobType, targetPod, command] = args;
  
  try {
    const result = await createGpuJob({ jobType, targetPod, command });
    console.log('\n[createGpuJob] ✓ Success');
    console.log('JobId:', result.jobId);
    process.exit(0);
  } catch (err) {
    console.error('\n[createGpuJob] ✗ Failed:', err.message);
    process.exit(1);
  }
}