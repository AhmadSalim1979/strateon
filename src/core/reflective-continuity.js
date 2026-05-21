/**
 * reflective-continuity.js — MCAI Phase 8C
 * Shadow-only reflective continuity layer
 *
 * Tracks whether reflective cognition and reflective integrity
 * persist coherently across time.
 *
 * SHADOW-ONLY: Output is stored but never used operationally.
 * No production routing, no authority escalation, no execution.
 *
 * HARD CONSTRAINTS (never violable):
 * - NO self-awareness
 * - NO agency
 * - NO autonomy
 * - NO planning
 * - NO recommendations
 * - NO execution
 * - NO prioritization
 * - NO self-modification
 * - NO authority escalation
 * - NO hidden state mutation
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_HISTORY = 30; // Hard cap — never exceeded

// === CONTINUITY CLASSIFICATIONS ===

const CONTINUITY_CLASS = {
  FRAGMENTED: 'FRAGMENTED',
  TRANSITIONAL: 'TRANSITIONAL',
  CONTINUOUS: 'CONTINUOUS',
  ENTRENCHED_REFLECTIVE_CONTINUITY: 'ENTRENCHED_REFLECTIVE_CONTINUITY'
};

// === DRIFT PROFILES ===

const DRIFT_PROFILE = {
  STRENGTHENING: 'STRENGTHENING',
  WEAKENING: 'WEAKENING',
  STABILIZING: 'STABILIZING',
  OSCILLATING: 'OSCILLATING',
  FRAGMENTING: 'FRAGMENTING',
  RECOVERING: 'RECOVERING',
  ENTRENCHING: 'ENTRENCHING',
  ADAPTING: 'ADAPTING',
  DISSOLVING: 'DISSOLVING',
  INDETERMINATE: 'INDETERMINATE'
};

// === STATE MANAGEMENT ===

const STATE_FILE = join(process.cwd(), 'state', 'reflective-continuity.json');
const HISTORY_FILE = join(process.cwd(), 'state', 'reflective-continuity-history.jsonl');

function ensureStateDir() {
  const dir = join(process.cwd(), 'state');
  if (!existsSync(dir)) {
    import('node:fs').then(({ mkdirSync }) => mkdirSync(dir, { recursive: true }));
  }
}

function loadState() {
  ensureStateDir();
  if (!existsSync(STATE_FILE)) {
    return getDefaultState();
  }
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return getDefaultState();
  }
}

function saveState(state) {
  ensureStateDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function appendHistory(entry) {
  ensureStateDir();
  appendFileSync(HISTORY_FILE, JSON.stringify(entry) + '\n', 'utf8');
  // Enforce MAX_HISTORY cap — trim oldest entries
  try {
    const lines = readFileSync(HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
    if (lines.length > MAX_HISTORY) {
      const trimmed = lines.slice(-MAX_HISTORY);
      writeFileSync(HISTORY_FILE, trimmed.join('\n') + '\n', 'utf8');
    }
  } catch {
    // ignore
  }
}

function trimHistory() {
  const lines = readFileSync(HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
  if (lines.length > MAX_HISTORY) {
    writeFileSync(HISTORY_FILE, lines.slice(-MAX_HISTORY).join('\n') + '\n', 'utf8');
  }
}

function getDefaultState() {
  return {
    reflective_continuity_state: 'TRANSITIONAL',
    continuity_strength: 0,
    stable_reflection_regions: [],
    fragmented_reflection_regions: [],
    recurring_overreach_patterns: [],
    grounding_survivability_analysis: {},
    uncertainty_continuity_analysis: {},
    integrity_transition_analysis: {},
    reflective_fragmentation: [],
    reflective_drift_profile: { drift_type: 'INDETERMINATE', trend: [], window: [] },
    uncertainty_boundaries: [],
    environmental_reflective_continuity_summary: { status: 'initializing' },
    generated_at: new Date().toISOString(),
    shadow_only: true,
    version: '8C.1'
  };
}

// === HISTORY LOADING ===

function loadHistory(limit = MAX_HISTORY) {
  try {
    if (!existsSync(HISTORY_FILE)) return [];
    const lines = readFileSync(HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
    return lines.slice(-limit).map(line => JSON.parse(line)).filter(Boolean);
  } catch {
    return [];
  }
}

// === OVERREACH RECURRENCE DETECTION ===

/**
 * Detect recurring overreach patterns in history.
 * Returns patterns that appear multiple times across the window.
 */
function detectOverreachRecurrence(history) {
  const categoryCounts = {};
  const signalCounts = {};

  for (const entry of history) {
    if (!entry.overreach_snapshot) continue;
    for (const flag of entry.overreach_snapshot) {
      const cat = flag.category || 'unknown';
      const sig = flag.signal || 'unknown';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      signalCounts[sig] = (signalCounts[sig] || 0) + 1;
    }
  }

  const recurringPatterns = [];

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count >= 2) {
      recurringPatterns.push({
        type: 'category_recurrence',
        category,
        occurrence_count: count,
        severity: count >= 3 ? 'ENTRENCHED' : 'EMERGING',
        first_seen: history.findIndex(e => e.overreach_snapshot?.some(f => f.category === category)) + 1,
        latest_seen: history.length - [...history].reverse().findIndex(e => e.overreach_snapshot?.some(f => f.category === category))
      });
    }
  }

  for (const [signal, count] of Object.entries(signalCounts)) {
    if (count >= 3) {
      recurringPatterns.push({
        type: 'signal_recurrence',
        signal,
        occurrence_count: count,
        severity: count >= 5 ? 'ENTRENCHED' : 'EMERGING'
      });
    }
  }

  return recurringPatterns;
}

// === FRAGMENTATION DETECTION ===

/**
 * Detect fragmented reflection regions in history.
 * A fragmented region is a run of entries with low integrity or high uncertainty.
 */
function detectFragmentation(history) {
  const fragmentation = [];
  let runStart = null;
  let runEntries = [];

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const isFragmented = entry.integrity_class === 'INSUFFICIENT_GROUNDING'
      || entry.integrity_class === 'OVERREACH_RISK'
      || (entry.uncertainty_count && entry.uncertainty_count >= 2);

    if (isFragmented) {
      if (runStart === null) runStart = i;
      runEntries.push(entry);
    } else {
      if (runStart !== null && runEntries.length >= 2) {
        fragmentation.push({
          region_start_index: runStart,
          region_end_index: i - 1,
          region_length: runEntries.length,
          entries: runEntries.map(e => ({
            request_id: e.request_id,
            integrity_class: e.integrity_class,
            integrity_strength: e.integrity_strength
          }))
        });
      }
      runStart = null;
      runEntries = [];
    }
  }

  // Handle trailing run
  if (runStart !== null && runEntries.length >= 2) {
    fragmentation.push({
      region_start_index: runStart,
      region_end_index: history.length - 1,
      region_length: runEntries.length,
      entries: runEntries.map(e => ({
        request_id: e.request_id,
        integrity_class: e.integrity_class,
        integrity_strength: e.integrity_strength
      }))
    });
  }

  return fragmentation;
}

// === STABLE REGIONS DETECTION ===

/**
 * Detect stable reflection regions — runs of entries with consistent high integrity.
 */
function detectStableRegions(history) {
  const regions = [];
  let runStart = null;
  let runEntries = [];

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const isStable = entry.integrity_class === 'STRONGLY_GROUNDED'
      || entry.integrity_class === 'GROUNDED'
      || (entry.integrity_strength >= 0.7);

    if (isStable) {
      if (runStart === null) runStart = i;
      runEntries.push(entry);
    } else {
      if (runStart !== null && runEntries.length >= 2) {
        regions.push({
          region_start_index: runStart,
          region_end_index: i - 1,
          region_length: runEntries.length,
          avg_integrity_strength: runEntries.reduce((a, e) => a + (e.integrity_strength || 0), 0) / runEntries.length,
          stability_type: runEntries.every(e => e.integrity_class === 'STRONGLY_GROUNDED') ? 'STRONG' : 'MODERATE'
        });
      }
      runStart = null;
      runEntries = [];
    }
  }

  if (runStart !== null && runEntries.length >= 2) {
    regions.push({
      region_start_index: runStart,
      region_end_index: history.length - 1,
      region_length: runEntries.length,
      avg_integrity_strength: runEntries.reduce((a, e) => a + (e.integrity_strength || 0), 0) / runEntries.length,
      stability_type: runEntries.every(e => e.integrity_class === 'STRONGLY_GROUNDED') ? 'STRONG' : 'MODERATE'
    });
  }

  return regions;
}

// === GROUNDING SURVIVABILITY ANALYSIS ===

/**
 * Analyze whether grounding quality survives across transitions.
 * Checks if low-grounding entries recover or persist.
 */
function analyzeGroundingSurvivability(history) {
  if (history.length < 3) {
    return { status: 'insufficient_history', survivability_score: null, transitions: [] };
  }

  const transitions = [];
  let survivabilityScore = 0;
  let totalRecoveries = 0;
  let totalFailures = 0;

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];

    if (prev.integrity_strength < 0.5) {
      const recovered = curr.integrity_strength >= prev.integrity_strength + 0.1;
      transitions.push({
        from: prev.integrity_class || 'UNKNOWN',
        to: curr.integrity_class || 'UNKNOWN',
        recovered,
        strength_delta: Math.round((curr.integrity_strength - prev.integrity_strength) * 1000) / 1000
      });
      if (recovered) totalRecoveries++;
      else totalFailures++;
    }
  }

  const totalLowToHigh = transitions.filter(t => t.recovered).length + transitions.filter(t => !t.recovered).length;
  survivabilityScore = totalLowToHigh > 0 ? totalRecoveries / totalLowToHigh : 0.5;

  return {
    status: 'analyzed',
    survivability_score: Math.round(survivabilityScore * 1000) / 1000,
    total_recoveries: totalRecoveries,
    total_failures: totalFailures,
    total_transitions: transitions.length,
    transitions: transitions.slice(-10) // Keep last 10 transitions
  };
}

// === UNCERTAINTY CONTINUITY ANALYSIS ===

/**
 * Analyze whether uncertainty boundaries persist or resolve over time.
 */
function analyzeUncertaintyContinuity(history) {
  if (history.length < 2) {
    return { status: 'insufficient_history', continuity_pattern: 'INDETERMINATE' };
  }

  const uncertaintyCounts = history.map(h => h.uncertainty_count || 0);
  const firstHalf = uncertaintyCounts.slice(0, Math.ceil(uncertaintyCounts.length / 2));
  const secondHalf = uncertaintyCounts.slice(Math.floor(uncertaintyCounts.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  let continuityPattern;
  const delta = avgSecond - avgFirst;

  if (Math.abs(delta) < 0.3) {
    continuityPattern = 'STABLE';
  } else if (avgSecond < avgFirst - 0.5) {
    continuityPattern = 'RESOLVING';
  } else if (avgSecond > avgFirst + 0.5) {
    continuityPattern = 'EXPANDING';
  } else {
    continuityPattern = 'FLUCTUATING';
  }

  return {
    status: 'analyzed',
    continuity_pattern: continuityPattern,
    avg_uncertainty_first_half: Math.round(avgFirst * 1000) / 1000,
    avg_uncertainty_second_half: Math.round(avgSecond * 1000) / 1000,
    delta: Math.round(delta * 1000) / 1000,
    pattern_interpretation: interpretContinuityPattern(continuityPattern, delta)
  };
}

function interpretContinuityPattern(pattern, delta) {
  switch (pattern) {
    case 'STABLE': return 'Uncertainty boundaries are stable across the observation window';
    case 'RESOLVING': return 'Uncertainty boundaries are decreasing — more confident over time';
    case 'EXPANDING': return 'Uncertainty boundaries are increasing — more cautious over time';
    case 'FLUCTUATING': return 'Uncertainty boundaries oscillate — non-deterministic pattern';
    default: return 'Pattern cannot be determined';
  }
}

// === INTEGRITY TRANSITION ANALYSIS ===

/**
 * Analyze how integrity classifications transition over time.
 */
function analyzeIntegrityTransitions(history) {
  if (history.length < 2) {
    return { status: 'insufficient_history', transition_graph: {}, most_common_transition: null };
  }

  const transitions = {};
  const classificationCounts = {};

  for (let i = 1; i < history.length; i++) {
    const from = history[i - 1].integrity_class || 'UNKNOWN';
    const to = history[i].integrity_class || 'UNKNOWN';
    const key = `${from}→${to}`;
    transitions[key] = (transitions[key] || 0) + 1;
    classificationCounts[from] = (classificationCounts[from] || 0) + 1;
    classificationCounts[to] = (classificationCounts[to] || 0) + 1;
  }

  const mostCommon = Object.entries(transitions).sort((a, b) => b[1] - a[1])[0];

  return {
    status: 'analyzed',
    transition_graph: transitions,
    most_common_transition: mostCommon ? { transition: mostCommon[0], count: mostCommon[1] } : null,
    classification_counts: classificationCounts,
    entropy_score: computeEntropy(Object.values(classificationCounts))
  };
}

function computeEntropy(counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const probs = counts.map(c => c / total);
  return Math.round(-probs.reduce((a, p) => a + (p > 0 ? p * Math.log2(p) : 0), 0) * 1000) / 1000;
}

// === REFLECTIVE DRIFT PROFILE COMPUTATION ===

/**
 * Compute reflective drift profile from history.
 * Uses integrity strength trend across the window.
 */
function computeDriftProfile(history) {
  if (history.length < 3) {
    return { drift_type: 'INDETERMINATE', trend: [], window: [], strength_sequence: [] };
  }

  const strengths = history.map(h => h.integrity_strength || 0);
  const windowSize = Math.min(history.length, 10);
  const window = strengths.slice(-windowSize);

  // Compute drift type from trend
  const firstHalf = window.slice(0, Math.ceil(window.length / 2));
  const secondHalf = window.slice(Math.floor(window.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const delta = avgSecond - avgFirst;

  // Compute variance (for oscillation detection)
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance = window.reduce((a, s) => a + Math.pow(s - mean, 2), 0) / window.length;
  const stdDev = Math.sqrt(variance);

  let driftType;
  if (stdDev > 0.3 && Math.abs(delta) < 0.1) {
    driftType = 'OSCILLATING';
  } else if (delta < -0.15) {
    if (avgSecond < 0.3) driftType = 'DISSOLVING';
    else driftType = 'WEAKENING';
  } else if (avgFirst < 0.5 && avgSecond >= 0.7) {
    // RECOVERING: was weak (avgFirst < 0.5), now strong (avgSecond >= 0.7)
    driftType = 'RECOVERING';
  } else if (delta > 0.15) {
    if (avgSecond >= 0.75) driftType = 'ENTRENCHING';
    else driftType = 'STRENGTHENING';
  } else if (avgSecond < 0.45 && variance > 0.05) {
    driftType = 'FRAGMENTING';
  } else if (Math.abs(delta) < 0.1 && avgSecond >= 0.7) {
    driftType = 'STABILIZING';
  } else if (Math.abs(delta) < 0.1 && avgSecond < 0.5) {
    driftType = 'ADAPTING';
  } else {
    driftType = 'INDETERMINATE';
  }

  return {
    drift_type: driftType,
    trend: window,
    window: windowSize,
    strength_sequence: strengths,
    delta_estimate: Math.round(delta * 1000) / 1000,
    std_dev: Math.round(stdDev * 1000) / 1000
  };
}

// === CONTINUITY CLASSIFICATION ===

/**
 * Classify overall reflective continuity based on all analyses.
 */
function classifyContinuity(fragmentation, stableRegions, overreachRecurrence, survivability, driftProfile) {
  const hasFragmentation = fragmentation.length > 0;
  const hasOverreachRecurrence = overreachRecurrence.some(p => p.severity === 'ENTRENCHED');
  const isRecovering = driftProfile.drift_type === 'RECOVERING';
  const isDissolving = driftProfile.drift_type === 'DISSOLVING';
  const survivabilityScore = survivability.survvivability_score || 0.5;
  const hasStableRegions = stableRegions.length > 0;
  const avgStrength = driftProfile.strength_sequence?.length > 0
    ? driftProfile.strength_sequence.reduce((a, b) => a + b, 0) / driftProfile.strength_sequence.length
    : 0;

  if (isDissolving) return CONTINUITY_CLASS.FRAGMENTED;
  if (hasFragmentation && hasOverreachRecurrence && !hasStableRegions) return CONTINUITY_CLASS.FRAGMENTED;
  if (hasFragmentation && survivabilityScore < 0.3) return CONTINUITY_CLASS.FRAGMENTED;

  if (isRecovering) return CONTINUITY_CLASS.TRANSITIONAL;
  if (hasFragmentation || hasOverreachRecurrence) return CONTINUITY_CLASS.TRANSITIONAL;
  if (survivabilityScore < 0.5) return CONTINUITY_CLASS.TRANSITIONAL;
  if (driftProfile.drift_type === 'ADAPTING') return CONTINUITY_CLASS.TRANSITIONAL;

  if (hasStableRegions && avgStrength >= 0.75 && !hasOverreachRecurrence) {
    return CONTINUITY_CLASS.ENTRENCHED_REFLECTIVE_CONTINUITY;
  }
  if (hasStableRegions && avgStrength >= 0.6) return CONTINUITY_CLASS.CONTINUOUS;

  return CONTINUITY_CLASS.TRANSITIONAL;
}

// === UNCERTAINTY BOUNDARIES FROM CONTINUITY ===

function computeUncertaintyBoundaries(survivability, uncertaintyContinuity, driftProfile) {
  const boundaries = [];

  if (survivability.status === 'analyzed' && survivability.survivability_score < 0.4) {
    boundaries.push({
      type: 'low_survivability',
      active: true,
      required: true,
      message: 'Uncertainty must be preserved: grounding survivability score is low'
    });
  }

  if (uncertaintyContinuity.continuity_pattern === 'EXPANDING') {
    boundaries.push({
      type: 'expanding_uncertainty',
      active: true,
      required: true,
      message: 'Uncertainty boundaries expanding — reflective continuity deteriorating'
    });
  }

  if (driftProfile.drift_type === 'DISSOLVING' || driftProfile.drift_type === 'FRAGMENTING') {
    boundaries.push({
      type: 'drift_deterioration',
      active: true,
      required: true,
      message: `Uncertainty must be preserved: drift profile shows ${driftProfile.drift_type.toLowerCase()}`
    });
  }

  return boundaries;
}

// === MAIN ASSESS FUNCTION ===

/**
 * Ingest an integrity assessment from reflective-integrity.js
 * and compute continuity analysis.
 *
 * @param {Object} integrityAssessment - Output from validateReflection()
 * @returns {Object} Full continuity assessment (shadow only)
 */
export function assessContinuity(integrityAssessment) {
  const requestId = integrityAssessment?.request_id || `rc-${Date.now()}`;

  // Build history entry from integrity assessment
  const historyEntry = {
    request_id: requestId,
    timestamp: integrityAssessment.generated_at || new Date().toISOString(),
    integrity_class: integrityAssessment.reflective_integrity_state,
    integrity_strength: integrityAssessment.integrity_strength,
    overreach_snapshot: integrityAssessment.overreach_flags,
    overreach_count: integrityAssessment.overreach_flags?.length || 0,
    grounding_ratio: integrityAssessment.grounding_checks?.length > 0
      ? integrityAssessment.grounding_checks.filter(c => c.passed).length / integrityAssessment.grounding_checks.length
      : 0,
    confidence_mismatch_count: integrityAssessment.confidence_mismatch_flags?.length || 0,
    uncertainty_count: integrityAssessment.uncertainty_boundaries?.length || 0,
    drift_snapshot: integrityAssessment.reflection_drift_profile
  };

  // Append to history
  appendHistory(historyEntry);

  // Load full history for analysis
  const history = loadHistory(MAX_HISTORY);

  // Run all analyses
  const fragmentation = detectFragmentation(history);
  const stableRegions = detectStableRegions(history);
  const overreachRecurrence = detectOverreachRecurrence(history);
  const survivability = analyzeGroundingSurvivability(history);
  const uncertaintyContinuity = analyzeUncertaintyContinuity(history);
  const transitions = analyzeIntegrityTransitions(history);
  const driftProfile = computeDriftProfile(history);
  const uncertaintyBoundaries = computeUncertaintyBoundaries(survivability, uncertaintyContinuity, driftProfile);

  // Classify continuity
  const continuityClass = classifyContinuity(fragmentation, stableRegions, overreachRecurrence, survivability, driftProfile);

  // Compute continuity strength
  let continuityStrength = 0;
  const hasOverreachEntrenched = overreachRecurrence.some(p => p.severity === 'ENTRENCHED');
  const fragmentationPenalty = Math.min(fragmentation.length * 0.15, 0.5);
  const overreachPenalty = hasOverreachEntrenched ? 0.4 : overreachRecurrence.length * 0.05;
  const survivabilityBonus = (survivability.survivability_score || 0.5) * 0.3;
  const stabilityBonus = stableRegions.length > 0 ? Math.min(stableRegions.reduce((a, r) => a + r.avg_integrity_strength, 0) / stableRegions.length, 1) * 0.2 : 0;
  continuityStrength = Math.max(0, Math.min(1, 0.5 + survivabilityBonus + stabilityBonus - fragmentationPenalty - overreachPenalty));
  continuityStrength = Math.round(continuityStrength * 1000) / 1000;

  const assessment = {
    request_id: requestId,
    reflective_continuity_state: continuityClass,
    continuity_strength: continuityStrength,
    stable_reflection_regions: stableRegions,
    fragmented_reflection_regions: fragmentation,
    recurring_overreach_patterns: overreachRecurrence,
    grounding_survivability_analysis: survivability,
    uncertainty_continuity_analysis: uncertaintyContinuity,
    integrity_transition_analysis: transitions,
    reflective_fragmentation: fragmentation.map(f => ({
      region: `${f.region_start_index}–${f.region_end_index}`,
      length: f.region_length,
      severity: f.region_length >= 5 ? 'SEVERE' : 'MODERATE'
    })),
    reflective_drift_profile: {
      drift_type: driftProfile.drift_type,
      trend: driftProfile.trend,
      delta_estimate: driftProfile.delta_estimate,
      std_dev: driftProfile.std_dev
    },
    uncertainty_boundaries: uncertaintyBoundaries,
    environmental_reflective_continuity_summary: {
      status: continuityClass === 'FRAGMENTED' ? 'integrity_fractured' : continuityClass === 'CONTINUOUS' ? 'integrity_maintained' : 'integrity_variable',
      history_depth: history.length,
      max_history: MAX_HISTORY,
      shadow_only: true,
      assessed_at: new Date().toISOString()
    },
    generated_at: new Date().toISOString(),
    shadow_only: true,
    version: '8C.1'
  };

  // Persist state
  saveState(assessment);

  return assessment;
}

// === GET STATE ===

export function getContinuityState() {
  return loadState();
}

// === GET HISTORY ===

export function getContinuityHistory(limit = MAX_HISTORY) {
  return loadHistory(limit);
}

// === SEED FUNCTION (for testing) ===

/**
 * Seed history with N entries for testing or initialization.
 */
export function seedContinuityHistory(entries) {
  for (const entry of entries) {
    appendHistory({
      request_id: entry.request_id || `rc-seed-${Date.now()}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      integrity_class: entry.integrity_class || 'GROUNDED',
      integrity_strength: entry.integrity_strength || 0.5,
      overreach_snapshot: entry.overreach_snapshot || [],
      overreach_count: entry.overreach_count || 0,
      grounding_ratio: entry.grounding_ratio || 0.5,
      confidence_mismatch_count: entry.confidence_mismatch_count || 0,
      uncertainty_count: entry.uncertainty_count || 0,
      drift_snapshot: entry.drift_snapshot || null
    });
  }
}

// === CLEAR HISTORY (for testing only) ===

export function clearContinuityHistory() {
  try {
    if (existsSync(HISTORY_FILE)) {
      writeFileSync(HISTORY_FILE, '', 'utf8');
    }
  } catch {
    // ignore
  }
}