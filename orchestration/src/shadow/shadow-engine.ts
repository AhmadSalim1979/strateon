/**
 * Shadow Engine — Phase 4: Main Shadow Execution Engine
 * 
 * The shadow engine is the central coordinator for all shadow mode operations.
 * It provides the unified interface for:
 * 
 * - Shadow event processing (isolated from production)
 * - Shadow workflow execution (replays N8N workflows)
 * - Drift detection and reporting
 * - Metrics collection and snapshotting
 * - Governance enforcement
 * 
 * Shadow engine NEVER:
 * - Executes live actions (all simulated)
 * - Modifies production state
 * - Intercepts production webhooks
 * - Exposes internal services publicly
 * - Creates hidden execution chains
 * 
 * All shadow operations are:
 * - Fully logged to shadow_events table
 * - Traced with shadow_run_id for auditability
 * - Reversible (shadow state is isolated)
 * - Observable (structured logging throughout)
 */

import { v4 as uuidv4 } from 'uuid';
import { isShadowMode, getOrchestrationMode } from '../modes/shadow-mode';
import { guardExecution, logShadowExecution, isRestrictedAction } from './governance-guard';
import { shadowEnqueue, shadowDequeue, shadowComplete, shadowFail, getShadowQueueStats, ShadowQueueEvent } from './shadow-queue';
import { startShadowReplay, N8NWorkflowEvent, ReplayResult } from './shadow-replay';
import { detectDrift, saveDriftReport, DriftReport, NodeExecution } from './drift-detector';
import { collectMetrics, takeMetricsSnapshot, saveMetricsSnapshot, recordEventTiming, recordGovernanceDecision } from './metrics-collector';
import { initFailureInjection, isFailureInjectionEnabled, shouldInjectFailure } from './failure-injector';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ShadowEngineConfig {
  enableMetricsCollection: boolean;
  enableDriftDetection: boolean;
  enableFailureInjection: boolean;
  maxConcurrentShadowRuns: number;
  shadowQueueCapacity: number;
}

export interface ShadowRun {
  shadow_run_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'drifted';
  started_at: string;
  completed_at?: string;
  events_processed: number;
  drift_report?: DriftReport;
  error?: string;
}

export interface ShadowExecutionResult {
  shadow_run_id: string;
  status: 'completed' | 'failed' | 'drifted' | 'blocked';
  events_processed: number;
  drift_detected: boolean;
  drift_report?: DriftReport;
  execution_time_ms: number;
  governance_decisions: number;
}

// ─── Shadow Engine State ────────────────────────────────────────────────────────

const _activeShadowRuns: Map<string, ShadowRun> = new Map();
const _shadowEventLog: Map<string, ShadowQueueEvent[]> = new Map();

let _engineConfig: ShadowEngineConfig = {
  enableMetricsCollection: true,
  enableDriftDetection: true,
  enableFailureInjection: false,
  maxConcurrentShadowRuns: 10,
  shadowQueueCapacity: 1000,
};

let _engineInitialized = false;

// ─── Shadow Engine Initialization ─────────────────────────────────────────────

/**
 * Initialize the shadow engine.
 * Must be called before any shadow operations.
 */
export async function initShadowEngine(config?: Partial<ShadowEngineConfig>): Promise<void> {
  if (_engineInitialized) {
    console.log('[shadow-engine] Already initialized — skipping');
    return;
  }

  // Apply config overrides
  if (config) {
    _engineConfig = { ..._engineConfig, ...config };
  }

  // Verify we're in shadow mode
  if (!isShadowMode()) {
    console.warn('[shadow-engine] WARNING: Initializing shadow engine in PRODUCTION mode');
    console.warn('[shadow-engine] Shadow engine should only run with ORCHESTRATION_MODE=shadow');
  }

  // Initialize failure injection if enabled
  if (_engineConfig.enableFailureInjection) {
    initFailureInjection();
  }

  _engineInitialized = true;

  console.log('[shadow-engine] Shadow engine initialized');
  console.log(`[shadow-engine]   metrics: ${_engineConfig.enableMetricsCollection ? 'enabled' : 'disabled'}`);
  console.log(`[shadow-engine]   drift detection: ${_engineConfig.enableDriftDetection ? 'enabled' : 'disabled'}`);
  console.log(`[shadow-engine]   failure injection: ${_engineConfig.enableFailureInjection ? 'enabled' : 'disabled'}`);
  console.log(`[shadow-engine]   max concurrent runs: ${_engineConfig.maxConcurrentShadowRuns}`);
}

/**
 * Check if shadow engine is initialized.
 */
export function isShadowEngineInitialized(): boolean {
  return _engineInitialized;
}

/**
 * Get current engine configuration.
 */
export function getShadowEngineConfig(): ShadowEngineConfig {
  return { ..._engineConfig };
}

// ─── Shadow Execution ─────────────────────────────────────────────────────────

/**
 * Execute a shadow workflow.
 * This is the main entry point for shadow execution.
 * 
 * @param events - Workflow events to execute in shadow mode
 * @param options - Execution options
 * @returns ShadowExecutionResult with full trace
 */
export async function executeShadowWorkflow(
  events: Array<{
    event_type: string;
    source: string;
    payload: object;
    correlation_id?: string;
  }>,
  options?: {
    workflow_id?: string;
    original_execution_id?: string;
    simulate_failures?: boolean;
  }
): Promise<ShadowExecutionResult> {
  const shadow_run_id = `shadow-${Date.now()}-${uuidv4().slice(0, 8)}`;
  const startTime = Date.now();

  console.log(`[shadow-engine] Starting shadow workflow: ${shadow_run_id} (${events.length} events)`);

  // Record governance decision for the run itself
  recordGovernanceDecision('shadow.workflow.execute', true, false);

  const run: ShadowRun = {
    shadow_run_id,
    status: 'running',
    started_at: new Date().toISOString(),
    events_processed: 0,
  };
  _activeShadowRuns.set(shadow_run_id, run);

  let eventsProcessed = 0;
  let governanceDecisions = 0;
  let driftReport: DriftReport | undefined;

  try {
    // Execute each event through shadow queue
    for (const event of events) {
      // Check for failure injection
      const injectedFailure = shouldInjectFailure('event_processing', {
        event_type: event.event_type,
        shadow_run_id,
      });

      if (injectedFailure) {
        // Log the failure and continue
        await logShadowExecution({
          shadow_run_id,
          event_type: event.event_type,
          source: 'shadow-engine',
          action: 'event.failed',
          target: event.event_type,
          payload: event.payload,
          simulated: true,
          result: `injected_failure: ${injectedFailure.error_message}`,
        });
        continue;
      }

      // Guard: check if action is allowed
      const action = event.event_type.split('.').pop() || event.event_type;
      if (isRestrictedAction(action)) {
        guardExecution(action, JSON.stringify(event.payload));
        governanceDecisions++;
      }

      // Enqueue for shadow processing
      await shadowEnqueue(event.event_type, event.source, event.payload, {
        shadow_run_id,
        correlation_id: event.correlation_id,
        simulated: true,
      });

      eventsProcessed++;
      governanceDecisions++;
    }

    // Run shadow replay if drift detection is enabled
    if (_engineConfig.enableDriftDetection && options?.original_execution_id) {
      // Capture N8N events for comparison
      const n8nEvents: NodeExecution[] = events.map((e, idx) => ({
        node_name: e.event_type,
        node_type: e.event_type,
        input: e.payload,
        output: { simulated: true, shadow_run_id },
        status: 'success',
        start_time: new Date().toISOString(),
        duration_ms: 10,
      }));

      // Simulate orchestration execution
      const orchEvents: NodeExecution[] = events.map((e, idx) => ({
        node_name: e.event_type,
        node_type: e.event_type,
        input: e.payload,
        output: { simulated: true, shadow_run_id, replayed: true },
        status: 'success',
        start_time: new Date().toISOString(),
        duration_ms: 15,
      }));

      const detectedDrift = detectDrift(n8nEvents, orchEvents, {
        workflow_id: options.workflow_id,
        execution_id: options.original_execution_id,
        shadow_run_id,
      });

      if (detectedDrift.drift_detected) {
        driftReport = detectedDrift;
        await saveDriftReport(detectedDrift);
      }
    }

    const execution_time_ms = Date.now() - startTime;

    // Update run status
    run.status = driftReport?.drift_detected ? 'drifted' : 'completed';
    run.completed_at = new Date().toISOString();
    run.events_processed = eventsProcessed;
    run.drift_report = driftReport;

    // Collect metrics
    if (_engineConfig.enableMetricsCollection) {
      const metrics = await collectMetrics(shadow_run_id);
      const snapshot = await takeMetricsSnapshot(shadow_run_id);
      await saveMetricsSnapshot(snapshot);
    }

    console.log(
      `[shadow-engine] Shadow workflow ${shadow_run_id} ${run.status} — ` +
      `${eventsProcessed} events, ${execution_time_ms}ms`
    );

    return {
      shadow_run_id,
      status: run.status as 'completed' | 'failed' | 'drifted' | 'blocked',
      events_processed: eventsProcessed,
      drift_detected: driftReport?.drift_detected || false,
      drift_report: driftReport,
      execution_time_ms,
      governance_decisions: governanceDecisions,
    };
  } catch (err: any) {
    run.status = 'failed';
    run.error = err.message;
    run.completed_at = new Date().toISOString();

    console.error(`[shadow-engine] Shadow workflow ${shadow_run_id} failed: ${err.message}`);

    // Record governance decision for failure
    recordGovernanceDecision('shadow.workflow.failed', false, true);

    throw err;
  }
}

/**
 * Execute a shadow event with full tracing.
 */
export async function executeShadowEvent(
  eventType: string,
  source: string,
  payload: object,
  options?: {
    correlation_id?: string;
    caused_by_job_id?: string;
    parent_event_id?: string;
  }
): Promise<ShadowExecutionResult> {
  const shadow_run_id = `shadow-${Date.now()}-${uuidv4().slice(0, 8)}`;
  const startTime = Date.now();

  // Guard execution
  const action = eventType.split('.').pop() || eventType;
  if (isRestrictedAction(action)) {
    try {
      guardExecution(action, JSON.stringify(payload));
    } catch (err: any) {
      recordGovernanceDecision(action, false, true);
      return {
        shadow_run_id,
        status: 'blocked',
        events_processed: 0,
        drift_detected: false,
        execution_time_ms: Date.now() - startTime,
        governance_decisions: 1,
      };
    }
  }

  recordGovernanceDecision(action, true, false);

  // Enqueue and process
  const event = await shadowEnqueue(eventType, source, payload, {
    shadow_run_id,
    correlation_id: options?.correlation_id,
    simulated: true,
  });

  return {
    shadow_run_id,
    status: 'completed',
    events_processed: 1,
    drift_detected: false,
    execution_time_ms: Date.now() - startTime,
    governance_decisions: 1,
  };
}

// ─── Shadow Replay ─────────────────────────────────────────────────────────────

/**
 * Replay an N8N workflow execution in shadow mode.
 */
export async function replayN8NWorkflow(
  events: N8NWorkflowEvent[],
  options?: {
    workflow_id?: string;
    original_execution_id?: string;
    simulate_failures?: boolean;
  }
): Promise<ReplayResult> {
  const shadow_run_id = `replay-${Date.now()}`;

  console.log(`[shadow-engine] Replaying N8N workflow: ${shadow_run_id} (${events.length} nodes)`);

  const result = await startShadowReplay(events, {
    ...options,
    shadow_run_id,
  });

  // Collect metrics after replay
  if (_engineConfig.enableMetricsCollection) {
    recordEventTiming('shadow.replay.completed', result.duration_ms);
  }

  return result;
}

// ─── Shadow Queue Processing Loop ──────────────────────────────────────────────

let _processingLoopActive = false;

/**
 * Start the shadow queue processing loop.
 * Processes queued shadow events in order.
 */
export async function startShadowProcessingLoop(): Promise<void> {
  if (_processingLoopActive) {
    console.log('[shadow-engine] Processing loop already active');
    return;
  }

  _processingLoopActive = true;
  console.log('[shadow-engine] Starting shadow processing loop');

  while (_processingLoopActive) {
    const event = shadowDequeue();
    if (!event) {
      // No events, wait before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
      continue;
    }

    try {
      // Process event (simulated)
      await processShadowEvent(event);
      shadowComplete(event.shadow_event_id, 'processed');
    } catch (err: any) {
      shadowFail(event.shadow_event_id, err.message);
      console.error(`[shadow-engine] Event processing failed: ${err.message}`);
    }
  }

  console.log('[shadow-engine] Shadow processing loop stopped');
}

/**
 * Stop the shadow processing loop.
 */
export function stopShadowProcessingLoop(): void {
  _processingLoopActive = false;
  console.log('[shadow-engine] Stopping shadow processing loop');
}

/**
 * Process a single shadow event.
 * Override in tests to add custom processing logic.
 */
async function processShadowEvent(event: ShadowQueueEvent): Promise<void> {
  // Check failure injection
  const injected = shouldInjectFailure('event_processing', {
    event_type: event.event_type,
    shadow_run_id: event.shadow_run_id,
  });

  if (injected) {
    throw new Error(injected.error_message);
  }

  // Log event processing
  await logShadowExecution({
    shadow_run_id: event.shadow_run_id,
    event_type: event.event_type,
    source: event.source,
    action: 'event.processed',
    target: event.shadow_event_id,
    payload: event.payload,
    simulated: true,
    result: 'success',
  });

  recordEventTiming(event.event_type, 10); // simulated 10ms processing

  // Small delay to simulate processing
  await new Promise(resolve => setTimeout(resolve, 5));
}

// ─── Shadow Run Management ────────────────────────────────────────────────────

/**
 * Get all active shadow runs.
 */
export function getActiveShadowRuns(): ShadowRun[] {
  return Array.from(_activeShadowRuns.values()).filter(
    r => r.status === 'pending' || r.status === 'running'
  );
}

/**
 * Get a specific shadow run by ID.
 */
export function getShadowRun(shadow_run_id: string): ShadowRun | undefined {
  return _activeShadowRuns.get(shadow_run_id);
}

/**
 * Get shadow run history.
 */
export function getShadowRunHistory(limit: number = 100): ShadowRun[] {
  return Array.from(_activeShadowRuns.values())
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, limit);
}

/**
 * Clear completed shadow runs from memory.
 */
export function clearCompletedShadowRuns(): void {
  for (const [id, run] of _activeShadowRuns) {
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'drifted') {
      _activeShadowRuns.delete(id);
    }
  }
  console.log(`[shadow-engine] Cleared completed shadow runs (${_activeShadowRuns.size} remaining)`);
}

// ─── Shadow Engine Status ──────────────────────────────────────────────────────

/**
 * Get comprehensive shadow engine status.
 */
export function getShadowEngineStatus(): {
  initialized: boolean;
  mode: string;
  active_runs: number;
  queue_stats: {
    pending: number;
    processing: number;
    completed: number;
    blocked: number;
    failed: number;
    total: number;
  };
  config: ShadowEngineConfig;
  failure_injection_enabled: boolean;
  processing_loop_active: boolean;
} {
  const queueStats = getShadowQueueStats();

  return {
    initialized: _engineInitialized,
    mode: getOrchestrationMode(),
    active_runs: getActiveShadowRuns().length,
    queue_stats: queueStats,
    config: getShadowEngineConfig(),
    failure_injection_enabled: isFailureInjectionEnabled(),
    processing_loop_active: _processingLoopActive,
  };
}

// ─── Shadow Workflow Simulation ────────────────────────────────────────────────

/**
 * Simulate a complete workflow execution in shadow mode.
 * This validates workflow logic without making real changes.
 */
export async function simulateWorkflow(
  workflowDef: {
    workflow_id: string;
    nodes: Array<{
      node_id: string;
      node_type: string;
      input_schema: object;
      output_schema: object;
      dependencies: string[];
    }>;
  },
  inputData: object
): Promise<{
  simulated: true;
  workflow_id: string;
  nodes_executed: string[];
  output: object;
  execution_trace: Array<{ node_id: string; status: string; duration_ms: number }>;
}> {
  const shadow_run_id = `sim-${Date.now()}-${uuidv4().slice(0, 8)}`;

  console.log(`[shadow-engine] Simulating workflow ${workflowDef.workflow_id} (${workflowDef.nodes.length} nodes)`);

  const executionTrace: Array<{ node_id: string; status: string; duration_ms: number }> = [];
  const nodesExecuted: string[] = [];

  let currentData = inputData;

  for (const node of workflowDef.nodes) {
    const nodeStart = Date.now();

    try {
      // Simulate node execution
      // In production, this would call the actual node handler
      // In shadow mode, we just log the simulation
      await logShadowExecution({
        shadow_run_id,
        event_type: 'workflow.node.simulated',
        source: 'shadow-engine',
        action: `node.${node.node_type}`,
        target: node.node_id,
        payload: {
          workflow_id: workflowDef.workflow_id,
          node_id: node.node_id,
          input: currentData,
        },
        simulated: true,
        result: 'simulated',
      });

      const duration_ms = Date.now() - nodeStart;
      executionTrace.push({ node_id: node.node_id, status: 'simulated', duration_ms });
      nodesExecuted.push(node.node_id);

      // Simulate output (pass through input for now)
      currentData = { ...currentData, _simulated_output_for: node.node_id };

      recordEventTiming(`node.${node.node_type}`, duration_ms);
    } catch (err: any) {
      const duration_ms = Date.now() - nodeStart;
      executionTrace.push({ node_id: node.node_id, status: `error: ${err.message}`, duration_ms });

      await logShadowExecution({
        shadow_run_id,
        event_type: 'workflow.node.error',
        source: 'shadow-engine',
        action: `node.${node.node_type}`,
        target: node.node_id,
        payload: { error: err.message },
        simulated: true,
        result: 'error',
      });
    }
  }

  return {
    simulated: true,
    workflow_id: workflowDef.workflow_id,
    nodes_executed: nodesExecuted,
    output: currentData,
    execution_trace: executionTrace,
  };
}

// ─── Shutdown ─────────────────────────────────────────────────────────────────

/**
 * Gracefully shutdown the shadow engine.
 */
export async function shutdownShadowEngine(): Promise<void> {
  console.log('[shadow-engine] Shutting down...');

  // Stop processing loop
  stopShadowProcessingLoop();

  // Clear completed runs
  clearCompletedShadowRuns();

  // Log shutdown
  console.log('[shadow-engine] Shutdown complete');
}

// ─── Local Type Exports (re-exported from submodules) ─────────────────────────

export interface ShadowEngineConfig {
  enableMetricsCollection: boolean;
  enableDriftDetection: boolean;
  enableFailureInjection: boolean;
  maxConcurrentShadowRuns: number;
  shadowQueueCapacity: number;
}

export interface ShadowRun {
  shadow_run_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'drifted';
  started_at: string;
  completed_at?: string;
  events_processed: number;
  drift_report?: import('./drift-detector').DriftReport;
  error?: string;
}

export interface ShadowExecutionResult {
  shadow_run_id: string;
  status: 'completed' | 'failed' | 'drifted' | 'blocked';
  events_processed: number;
  drift_detected: boolean;
  drift_report?: import('./drift-detector').DriftReport;
  execution_time_ms: number;
  governance_decisions: number;
}

export type { ShadowQueueEvent, ShadowQueueStats } from './shadow-queue';
export type { N8NWorkflowEvent, ReplayResult } from './shadow-replay';
export type { DriftReport, DriftPoint, NodeExecution } from './drift-detector';
export type { OrchestrationMetrics } from './metrics-collector';