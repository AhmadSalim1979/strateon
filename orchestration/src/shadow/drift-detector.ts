/**
 * Drift Detector — Phase 4: Detect Differences Between N8N and Orchestration
 * 
 * Drift detection compares N8N workflow execution behavior against
 * orchestration runtime behavior. When drift is detected, it indicates
 * that the orchestration runtime is not faithfully replicating N8N behavior.
 * 
 * Drift can be:
 * - Output mismatch: same input produces different output
 * - Missing nodes: orchestration skips nodes that N8N executes
 * - Extra nodes: orchestration executes nodes that N8N doesn't
 * - Status mismatch: node succeeds in one but fails in the other
 * - Ordering mismatch: nodes execute in different order
 * - Timing drift: execution takes significantly different time
 * 
 * Drift detection is:
 * - Non-intrusive: does not modify N8N or orchestration behavior
 * - Shadow-only: operates on shadow events, not production events
 * - Comparative: always compares N8N (reference) against orchestration (test)
 */

import { v4 as uuidv4 } from 'uuid';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DriftReport {
  report_id: string;
  shadow_run_id: string;
  compared_at: string;
  workflow_id: string;
  execution_id: string;
  drift_detected: boolean;
  overall_severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  total_drift_points: number;
  drift_points: DriftPoint[];
  execution_comparison: ExecutionComparison;
  recommendation: string;
}

export interface DriftPoint {
  node_name: string;
  drift_type: DriftType;
  n8n_value: string;
  orchestration_value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export type DriftType =
  | 'output_mismatch'
  | 'missing_node'
  | 'extra_node'
  | 'status_mismatch'
  | 'ordering_mismatch'
  | 'timing_drift'
  | 'payload_drift';

export interface ExecutionComparison {
  n8n_duration_ms: number;
  orchestration_duration_ms: number;
  n8n_node_count: number;
  orchestration_node_count: number;
  duration_ratio: number; // orchestration_duration / n8n_duration
  timing_significant: boolean;
}

export interface NodeExecution {
  node_name: string;
  node_type: string;
  input: object;
  output: object;
  status: 'success' | 'error' | 'pending';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  error?: string;
}

// ─── Drift Detection Thresholds ────────────────────────────────────────────────

const DRIFT_THRESHOLDS = {
  // Output size difference threshold (ratio)
  outputSizeThreshold: 2.0, // orchestration output 2x larger = drift

  // Timing ratio threshold (orchestration/n8n)
  // If orchestration takes 3x longer, flag as potential drift
  timingRatioThreshold: 3.0,

  // Payload similarity threshold (0-1, higher = more similar)
  // Below 0.7 = drift detected
  payloadSimilarityThreshold: 0.7,

  // Node count difference threshold
  nodeCountThreshold: 1, // if difference > 1, flag
};

// ─── Core Drift Detection ──────────────────────────────────────────────────────

/**
 * Compare N8N execution against orchestration execution.
 * Returns a full DriftReport with all drift points.
 */
export function detectDrift(
  n8nExecution: NodeExecution[],
  orchestrationExecution: NodeExecution[],
  options?: {
    workflow_id?: string;
    execution_id?: string;
    shadow_run_id?: string;
  }
): DriftReport {
  const report_id = `drift-${Date.now()}-${uuidv4().slice(0, 8)}`;
  const compared_at = new Date().toISOString();

  console.log(
    `[drift-detector] Comparing N8N (${n8nExecution.length} nodes) vs ` +
    `Orchestration (${orchestrationExecution.length} nodes)`
  );

  const drift_points: DriftPoint[] = [];

  // 1. Check for missing nodes (in N8N but not in orchestration)
  const n8nNodeNames = new Set(n8nExecution.map(n => n.node_name));
  const orchNodeNames = new Set(orchestrationExecution.map(n => n.node_name));

  for (const n8nNode of n8nExecution) {
    if (!orchNodeNames.has(n8nNode.node_name)) {
      drift_points.push({
        node_name: n8nNode.node_name,
        drift_type: 'missing_node',
        n8n_value: `executed (status=${n8nNode.status})`,
        orchestration_value: 'not executed',
        severity: 'high',
        description: `Node '${n8nNode.node_name}' was executed by N8N but not by orchestration`,
      });
    }
  }

  // 2. Check for extra nodes (in orchestration but not in N8N)
  for (const orchNode of orchestrationExecution) {
    if (!n8nNodeNames.has(orchNode.node_name)) {
      drift_points.push({
        node_name: orchNode.node_name,
        drift_type: 'extra_node',
        n8n_value: 'not executed',
        orchestration_value: `executed (status=${orchNode.status})`,
        severity: 'medium',
        description: `Node '${orchNode.node_name}' was executed by orchestration but not by N8N`,
      });
    }
  }

  // 3. Compare node outputs (for nodes present in both)
  const n8nByNode = new Map(n8nExecution.map(n => [n.node_name, n]));
  const orchByNode = new Map(orchestrationExecution.map(n => [n.node_name, n]));

  for (const [nodeName, n8nNode] of n8nByNode) {
    const orchNode = orchByNode.get(nodeName);
    if (!orchNode) continue; // Already flagged as missing

    // Status comparison
    if (n8nNode.status !== orchNode.status) {
      drift_points.push({
        node_name: nodeName,
        drift_type: 'status_mismatch',
        n8n_value: n8nNode.status,
        orchestration_value: orchNode.status,
        severity: 'critical',
        description: `Node '${nodeName}' status differs: N8N=${n8nNode.status}, Orchestration=${orchNode.status}`,
      });
    }

    // Output comparison (skip if either is error)
    if (n8nNode.status === 'success' && orchNode.status === 'success') {
      const outputDrift = compareOutputs(n8nNode.output, orchNode.output);
      if (outputDrift) {
        drift_points.push({
          node_name: nodeName,
          drift_type: 'output_mismatch',
          n8n_value: outputDrift.n8n_value,
          orchestration_value: outputDrift.orchestration_value,
          severity: outputDrift.severity,
          description: `Node '${nodeName}' output differs`,
        });
      }
    }

    // Payload drift (check input similarity)
    const payloadSimilarity = computePayloadSimilarity(n8nNode.input, orchNode.input);
    if (payloadSimilarity < DRIFT_THRESHOLDS.payloadSimilarityThreshold) {
      drift_points.push({
        node_name: nodeName,
        drift_type: 'payload_drift',
        n8n_value: JSON.stringify(n8nNode.input).slice(0, 200),
        orchestration_value: JSON.stringify(orchNode.input).slice(0, 200),
        severity: 'medium',
        description: `Node '${nodeName}' input similarity ${(payloadSimilarity * 100).toFixed(1)}% (threshold: ${(DRIFT_THRESHOLDS.payloadSimilarityThreshold * 100).toFixed(0)}%)`,
      });
    }
  }

  // 4. Check execution ordering
  const orderingDrift = checkOrderingDrift(n8nExecution, orchestrationExecution);
  if (orderingDrift) {
    drift_points.push(orderingDrift);
  }

  // 5. Check timing drift
  const timingDrift = checkTimingDrift(n8nExecution, orchestrationExecution);
  if (timingDrift) {
    drift_points.push(timingDrift);
  }

  // Compute overall severity
  const severityScores = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
  const maxSeverity = drift_points.reduce(
    (max, dp) => (severityScores[dp.severity] > severityScores[max] ? dp.severity : max),
    'none' as DriftPoint['severity']
  );

  const execution_comparison = computeExecutionComparison(n8nExecution, orchestrationExecution);

  const report: DriftReport = {
    report_id,
    shadow_run_id: options?.shadow_run_id || `shadow-${Date.now()}`,
    compared_at,
    workflow_id: options?.workflow_id || 'unknown',
    execution_id: options?.execution_id || 'unknown',
    drift_detected: drift_points.length > 0,
    overall_severity: maxSeverity,
    total_drift_points: drift_points.length,
    drift_points,
    execution_comparison,
    recommendation: generateRecommendation(maxSeverity, drift_points.length, execution_comparison),
  };

  console.log(
    `[drift-detector] Report ${report_id}: ${drift_points.length} drift points, ` +
    `severity=${maxSeverity}, drift_detected=${report.drift_detected}`
  );

  return report;
}

// ─── Output Comparison ──────────────────────────────────────────────────────────

interface OutputDriftResult {
  n8n_value: string;
  orchestration_value: string;
  severity: 'low' | 'medium' | 'high';
}

function compareOutputs(n8nOutput: object, orchOutput: object): OutputDriftResult | null {
  const n8nStr = JSON.stringify(n8nOutput);
  const orchStr = JSON.stringify(orchOutput);

  // Exact match — no drift
  if (n8nStr === orchStr) return null;

  // Check output size
  const n8nSize = n8nStr.length;
  const orchSize = orchStr.length;
  const sizeRatio = Math.max(orchSize, n8nSize) / Math.min(orchSize, n8nSize);

  if (sizeRatio > DRIFT_THRESHOLDS.outputSizeThreshold) {
    return {
      n8n_value: n8nStr.slice(0, 200) + (n8nStr.length > 200 ? '...' : ''),
      orchestration_value: orchStr.slice(0, 200) + (orchStr.length > 200 ? '...' : ''),
      severity: 'high',
    };
  }

  // Deep comparison for similar-sized outputs
  const n8nObj = typeof n8nOutput === 'string' ? JSON.parse(n8nOutput) : n8nOutput;
  const orchObj = typeof orchOutput === 'string' ? JSON.parse(orchOutput) : orchOutput;

  const diff = findObjectDiff(n8nObj, orchObj);
  if (diff) {
    return {
      n8n_value: JSON.stringify(diff.n8n_diff).slice(0, 200),
      orchestration_value: JSON.stringify(diff.orch_diff).slice(0, 200),
      severity: 'medium',
    };
  }

  // Non-structured difference
  return {
    n8n_value: n8nStr.slice(0, 200),
    orchestration_value: orchStr.slice(0, 200),
    severity: 'low',
  };
}

interface ObjectDiff {
  n8n_diff: object;
  orch_diff: object;
}

function findObjectDiff(n8n: any, orch: any): ObjectDiff | null {
  if (typeof n8n !== 'object' || typeof orch !== 'object') {
    return n8n !== orch ? { n8n_diff: n8n, orch_diff: orch } : null;
  }

  if (Array.isArray(n8n) && Array.isArray(orch)) {
    if (n8n.length !== orch.length) {
      return { n8n_diff: { length: n8n.length }, orch_diff: { length: orch.length } };
    }
    for (let i = 0; i < n8n.length; i++) {
      const diff = findObjectDiff(n8n[i], orch[i]);
      if (diff) return diff;
    }
    return null;
  }

  const n8nKeys = Object.keys(n8n || {});
  const orchKeys = Object.keys(orch || {});

  for (const key of n8nKeys) {
    if (!(key in orch)) {
      return { n8n_diff: { [key]: n8n[key] }, orch_diff: {} };
    }
    const diff = findObjectDiff(n8n[key], orch[key]);
    if (diff) return diff;
  }

  for (const key of orchKeys) {
    if (!(key in n8n)) {
      return { n8n_diff: {}, orch_diff: { [key]: orch[key] } };
    }
  }

  return null;
}

// ─── Ordering Drift ─────────────────────────────────────────────────────────────

function checkOrderingDrift(
  n8nExecution: NodeExecution[],
  orchExecution: NodeExecution[]
): DriftPoint | null {
  const n8nOrder = n8nExecution.map(n => n.node_name);
  const orchOrder = orchExecution.map(n => n.node_name);

  // Find common nodes
  const commonNodes = n8nOrder.filter(n => orchOrder.includes(n));
  if (commonNodes.length < 2) return null;

  // Check if relative ordering is preserved
  let differences = 0;
  for (let i = 0; i < commonNodes.length - 1; i++) {
    for (let j = i + 1; j < commonNodes.length - 1; j++) {
      const n8nIdx = n8nOrder.indexOf(commonNodes[i]);
      const n8nJdx = n8nOrder.indexOf(commonNodes[j]);
      const orchIdx = orchOrder.indexOf(commonNodes[i]);
      const orchJdx = orchOrder.indexOf(commonNodes[j]);

      if (
        (n8nIdx < n8nJdx && orchIdx > orchJdx) ||
        (n8nIdx > n8nJdx && orchIdx < orchJdx)
      ) {
        differences++;
      }
    }
  }

  if (differences > 0) {
    return {
      node_name: 'execution_order',
      drift_type: 'ordering_mismatch',
      n8n_value: n8nOrder.join(' → '),
      orchestration_value: orchOrder.join(' → '),
      severity: 'medium',
      description: `Execution ordering differs: ${differences} node pairs have different relative order`,
    };
  }

  return null;
}

// ─── Timing Drift ──────────────────────────────────────────────────────────────

function checkTimingDrift(
  n8nExecution: NodeExecution[],
  orchExecution: NodeExecution[]
): DriftPoint | null {
  const n8nTotal = n8nExecution.reduce(
    (sum, n) => sum + (n.duration_ms || 0),
    0
  );
  const orchTotal = orchExecution.reduce(
    (sum, n) => sum + (n.duration_ms || 0),
    0
  );

  if (n8nTotal === 0) return null;

  const ratio = orchTotal / n8nTotal;

  if (ratio > DRIFT_THRESHOLDS.timingRatioThreshold || ratio < 1 / DRIFT_THRESHOLDS.timingRatioThreshold) {
    return {
      node_name: 'execution_timing',
      drift_type: 'timing_drift',
      n8n_value: `${n8nTotal}ms`,
      orchestration_value: `${orchTotal}ms`,
      severity: ratio > DRIFT_THRESHOLDS.timingRatioThreshold ? 'medium' : 'low',
      description: `Execution time differs: N8N=${n8nTotal}ms, Orchestration=${orchTotal}ms (ratio=${ratio.toFixed(2)}x)`,
    };
  }

  return null;
}

// ─── Execution Comparison ───────────────────────────────────────────────────────

function computeExecutionComparison(
  n8nExecution: NodeExecution[],
  orchExecution: NodeExecution[]
): ExecutionComparison {
  const n8nDuration = n8nExecution.reduce(
    (sum, n) => sum + (n.duration_ms || 0),
    0
  );
  const orchDuration = orchExecution.reduce(
    (sum, n) => sum + (n.duration_ms || 0),
    0
  );

  const n8nNodeCount = n8nExecution.length;
  const orchNodeCount = orchExecution.length;

  const duration_ratio = n8nDuration > 0 ? orchDuration / n8nDuration : 0;

  return {
    n8n_duration_ms: n8nDuration,
    orchestration_duration_ms: orchDuration,
    n8n_node_count: n8nNodeCount,
    orchestration_node_count: orchNodeCount,
    duration_ratio,
    timing_significant: duration_ratio > DRIFT_THRESHOLDS.timingRatioThreshold ||
                        (n8nDuration > 0 && duration_ratio < 1 / DRIFT_THRESHOLDS.timingRatioThreshold),
  };
}

// ─── Payload Similarity ────────────────────────────────────────────────────────

function computePayloadSimilarity(a: object, b: object): number {
  const aStr = JSON.stringify(a);
  const bStr = JSON.stringify(b);

  if (aStr === bStr) return 1.0;

  // Simple Jaccard-like similarity on keys
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  const commonKeys = aKeys.filter(k => k in b);

  if (commonKeys.length === 0) return 0;

  // Compare values for common keys
  let matchingValues = 0;
  for (const key of commonKeys) {
    const aVal = JSON.stringify(a[key as keyof typeof a]);
    const bVal = JSON.stringify(b[key as keyof typeof b]);
    if (aVal === bVal) matchingValues++;
  }

  const keySimilarity = commonKeys.length / Math.max(aKeys.length, bKeys.length);
  const valueSimilarity = matchingValues / commonKeys.length;

  return (keySimilarity + valueSimilarity) / 2;
}

// ─── Recommendation Engine ─────────────────────────────────────────────────────

function generateRecommendation(
  severity: string,
  driftCount: number,
  comparison: ExecutionComparison
): string {
  if (driftCount === 0) {
    return 'No drift detected — orchestration faithfully replicates N8N behavior. Safe to proceed to Phase 5.';
  }

  const recommendations: Record<string, string[]> = {
    none: ['No drift detected.'],
    low: [
      `Detected ${driftCount} low-severity drift point(s).`,
      'Monitor for 48 hours and re-validate.',
      'Low-severity drift does not block Phase 5.',
    ],
    medium: [
      `Detected ${driftCount} medium-severity drift point(s).`,
      'Investigate root cause before Phase 5.',
      'Schedule review of drift points.',
    ],
    high: [
      `Detected ${driftCount} high-severity drift point(s).`,
      'CRITICAL: Do NOT proceed to Phase 5 until resolved.',
      'Review node handlers and replay accuracy.',
    ],
    critical: [
      `Detected ${driftCount} critical drift point(s).`,
      'FURTHER DEVELOPMENT HALTED until critical drift is resolved.',
      'Immediate review required.',
      'Consider reverting to Phase 3 baseline.',
    ],
  };

  return (recommendations[severity] || recommendations.none).join(' ');
}

// ─── Drift Report Persistence ──────────────────────────────────────────────────

/**
 * Save a drift report to Supabase shadow_events table.
 */
export async function saveDriftReport(report: DriftReport): Promise<void> {
  const { getClient } = await import('../persistence/supabase-client');

  try {
    const supabase = getClient();
    await supabase.from('shadow_events').insert({
      shadow_run_id: report.shadow_run_id,
      event_type: 'drift.report',
      action: 'drift.detected',
      target: report.workflow_id,
      payload: JSON.stringify({
        report_id: report.report_id,
        workflow_id: report.workflow_id,
        execution_id: report.execution_id,
        drift_detected: report.drift_detected,
        overall_severity: report.overall_severity,
        total_drift_points: report.total_drift_points,
        drift_points: report.drift_points,
        execution_comparison: report.execution_comparison,
        recommendation: report.recommendation,
      }),
      simulated: true,
      result: report.drift_detected ? 'drift_detected' : 'no_drift',
      executed_at: report.compared_at,
    });
  } catch (err: any) {
    console.error(`[drift-detector] Failed to save report: ${err.message}`);
  }
}

/**
 * Load drift reports for a given shadow_run_id.
 */
export async function loadDriftReports(shadow_run_id: string): Promise<DriftReport[]> {
  const { getClient } = await import('../persistence/supabase-client');

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('shadow_events')
      .select('*')
      .eq('shadow_run_id', shadow_run_id)
      .eq('event_type', 'drift.report')
      .order('executed_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => {
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      return {
        report_id: payload.report_id,
        shadow_run_id,
        compared_at: row.executed_at,
        workflow_id: payload.workflow_id,
        execution_id: payload.execution_id,
        drift_detected: payload.drift_detected,
        overall_severity: payload.overall_severity,
        total_drift_points: payload.total_drift_points,
        drift_points: payload.drift_points || [],
        execution_comparison: payload.execution_comparison,
        recommendation: payload.recommendation,
      };
    });
  } catch (err: any) {
    console.error(`[drift-detector] Failed to load reports: ${err.message}`);
    return [];
  }
}

/**
 * Get aggregate drift statistics across all reports.
 */
export async function getDriftStatistics(): Promise<{
  total_reports: number;
  reports_with_drift: number;
  average_drift_points: number;
  severity_distribution: Record<string, number>;
}> {
  const { getClient } = await import('../persistence/supabase-client');

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('shadow_events')
      .select('*')
      .eq('event_type', 'drift.report');

    if (error) throw error;

    const reports = (data || []).map(row => {
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      return payload;
    });

    const severityDistribution: Record<string, number> = {};
    let withDrift = 0;
    let totalDriftPoints = 0;

    for (const report of reports) {
      if (report.drift_detected) withDrift++;
      totalDriftPoints += report.total_drift_points || 0;
      const sev = report.overall_severity || 'none';
      severityDistribution[sev] = (severityDistribution[sev] || 0) + 1;
    }

    return {
      total_reports: reports.length,
      reports_with_drift: withDrift,
      average_drift_points: reports.length > 0 ? totalDriftPoints / reports.length : 0,
      severity_distribution: severityDistribution,
    };
  } catch (err: any) {
    console.error(`[drift-detector] Failed to get statistics: ${err.message}`);
    return {
      total_reports: 0,
      reports_with_drift: 0,
      average_drift_points: 0,
      severity_distribution: {},
    };
  }
}