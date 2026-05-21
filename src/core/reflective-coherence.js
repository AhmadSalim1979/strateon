/**
 * reflective-coherence.js — MCAI Phase 8D
 * Shadow-only reflective coherence layer
 *
 * Checks whether reflection, reflective integrity, and reflective continuity
 * remain internally aligned over time.
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

const MAX_HISTORY = 30;

// === COHERENCE CLASSIFICATIONS ===

const COHERENCE_CLASS = {
  INCOHERENT: 'INCOHERENT',
  TENSIONED: 'TENSIONED',
  COHERENT: 'COHERENT',
  STRONGLY_COHERENT: 'STRONGLY_COHERENT'
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

// === STATE FILES ===

const COHERENCE_STATE_FILE = join(process.cwd(), 'state', 'reflective-coherence.json');
const COHERENCE_HISTORY_FILE = join(process.cwd(), 'state', 'reflective-coherence-history.jsonl');

// === STATE MANAGEMENT ===

function ensureStateDir() {
  const dir = join(process.cwd(), 'state');
  if (!existsSync(dir)) {
    import('node:fs').then(({ mkdirSync }) => mkdirSync(dir, { recursive: true }));
  }
}

function loadState(filePath) {
  ensureStateDir();
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function saveState(state, filePath) {
  ensureStateDir();
  writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
}

function appendHistory(entry) {
  ensureStateDir();
  appendFileSync(COHERENCE_HISTORY_FILE, JSON.stringify(entry) + '\n', 'utf8');
  try {
    const lines = readFileSync(COHERENCE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
    if (lines.length > MAX_HISTORY) {
      writeFileSync(COHERENCE_HISTORY_FILE, lines.slice(-MAX_HISTORY).join('\n') + '\n', 'utf8');
    }
  } catch { /* ignore */ }
}

function loadHistory(limit = MAX_HISTORY) {
  try {
    if (!existsSync(COHERENCE_HISTORY_FILE)) return [];
    const lines = readFileSync(COHERENCE_HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
    return lines.slice(-limit).map(line => JSON.parse(line)).filter(Boolean);
  } catch {
    return [];
  }
}

function getDefaultState() {
  return {
    reflective_coherence_state: 'TENSIONED',
    coherence_strength: 0,
    aligned_reflective_regions: [],
    fragmented_reflective_regions: [],
    reflective_contradiction_zones: [],
    integrity_alignment_analysis: {},
    continuity_alignment_analysis: {},
    coherence_recovery_analysis: {},
    coherence_fragmentation: [],
    reflective_coherence_drift_profile: { drift_type: 'INDETERMINATE', trend: [], window: [] },
    uncertainty_boundaries: [],
    environmental_reflective_coherence_summary: { status: 'initializing' },
    generated_at: new Date().toISOString(),
    shadow_only: true,
    version: '8D.1'
  };
}

// === ALIGNMENT ANALYSIS ===

/**
 * Check alignment between integrity and continuity assessments.
 * Returns alignment score and contradiction details.
 */
function analyzeIntegrityContinuityAlignment(integrityState, continuityState) {
  const analysis = {
    alignment_score: 0,
    contradictions: [],
    alignment_factors: {}
  };

  if (!integrityState || !continuityState) {
    analysis.alignment_score = 0.5;
    analysis.alignment_factors.status = 'insufficient_data';
    return analysis;
  }

  const integrityStrength = integrityState.integrity_strength || 0;
  const continuityStrength = continuityState.continuity_strength || 0;
  const strengthDiff = Math.abs(integrityStrength - continuityStrength);

  // Factor 1: strength alignment
  const strengthAlignment = 1 - Math.min(strengthDiff / 0.5, 1);
  analysis.alignment_factors.strength_alignment = Math.round(strengthAlignment * 1000) / 1000;

  // Factor 2: classification alignment
  const icClass = integrityState.reflective_integrity_state || 'UNKNOWN';
  const ccClass = continuityState.reflective_continuity_state || 'UNKNOWN';
  const classAligned = (icClass === 'STRONGLY_GROUNDED' && ccClass === 'CONTINUOUS') ||
                       (icClass === 'STRONGLY_GROUNDED' && ccClass === 'ENTRENCHED_REFLECTIVE_CONTINUITY') ||
                       (icClass === 'GROUNDED' && ccClass === 'CONTINUOUS') ||
                       (icClass === 'GROUNDED' && ccClass === 'CONTINUOUS') ||
                       (icClass === 'INSUFFICIENT_GROUNDING' && ccClass === 'FRAGMENTED') ||
                       (icClass === 'INSUFFICIENT_GROUNDING' && ccClass === 'TRANSITIONAL') ||
                       (icClass === 'OVERREACH_RISK' && ccClass === 'FRAGMENTED') ||
                       (icClass === 'OVERREACH_RISK' && ccClass === 'TRANSITIONAL');
  analysis.alignment_factors.classification_alignment = classAligned ? 1.0 : 0.0;

  if (!classAligned && (icClass === 'OVERREACH_RISK' || icClass === 'INSUFFICIENT_GROUNDING') &&
      (ccClass === 'CONTINUOUS' || ccClass === 'ENTRENCHED_REFLECTIVE_CONTINUITY')) {
    analysis.contradictions.push({
      type: 'integrity_continuity_mismatch',
      integrity_class: icClass,
      continuity_class: ccClass,
      severity: 'HIGH',
      message: `Integrity shows ${icClass} but continuity shows ${ccClass} — coherence gap`
    });
  }

  // Factor 3: overreach alignment
  const integrityOverreachCount = integrityState.overreach_flags?.length || 0;
  const continuityOverreachPatterns = continuityState.recurring_overreach_patterns?.length || 0;
  const overreachAligned = (integrityOverreachCount > 0 && continuityOverreachPatterns > 0) ||
                          (integrityOverreachCount === 0 && continuityOverreachPatterns === 0);
  analysis.alignment_factors.overreach_alignment = overreachAligned ? 1.0 : 0.5;

  // Factor 4: uncertainty alignment
  const intUncertainty = integrityState.uncertainty_boundaries?.filter(b => b.active)?.length || 0;
  const contUncertainty = continuityState.uncertainty_boundaries?.filter(b => b.active)?.length || 0;
  const uncertaintyDiff = Math.abs(intUncertainty - contUncertainty);
  const uncertaintyAlignment = 1 - Math.min(uncertaintyDiff / 3, 1);
  analysis.alignment_factors.uncertainty_alignment = Math.round(uncertaintyAlignment * 1000) / 1000;

  // Compute overall alignment score
  const factors = [
    analysis.alignment_factors.strength_alignment,
    analysis.alignment_factors.classification_alignment,
    analysis.alignment_factors.overreach_alignment,
    analysis.alignment_factors.uncertainty_alignment
  ];
  analysis.alignment_score = Math.round((factors.reduce((a, b) => a + b, 0) / factors.length) * 1000) / 1000;

  return analysis;
}

/**
 * Analyze alignment between direct reflection and integrity layer.
 */
function analyzeReflectionIntegrityAlignment(coherenceHistory, integrityState) {
  const analysis = {
    alignment_score: 0,
    contradictions: [],
    alignment_factors: {}
  };

  if (!integrityState || coherenceHistory.length < 2) {
    analysis.alignment_score = 0.5;
    analysis.alignment_factors.status = 'insufficient_data';
    return analysis;
  }

  // Recent coherence trend
  const recentCoherence = coherenceHistory.slice(-5).map(h => h.coherence_strength || 0);
  const avgRecentCoherence = recentCoherence.reduce((a, b) => a + b, 0) / recentCoherence.length;
  const integrityStrength = integrityState.integrity_strength || 0;

  const strengthDiff = Math.abs(avgRecentCoherence - integrityStrength);
  analysis.alignment_factors.strength_alignment = Math.round((1 - Math.min(strengthDiff / 0.5, 1)) * 1000) / 1000;

  // Overreach consistency
  const recentOverreachSum = coherenceHistory.slice(-5).reduce((a, h) => a + (h.contradiction_count || 0), 0);
  const integrityOverreach = integrityState.overreach_flags?.length || 0;
  const overreachConsistency = recentOverreachSum === 0 && integrityOverreach === 0 ? 1.0 :
                               recentOverreachSum > 0 && integrityOverreach > 0 ? 0.8 :
                               recentOverreachSum === 0 && integrityOverreach > 0 ? 0.3 : 0.5;
  analysis.alignment_factors.overreach_consistency = Math.round(overreachConsistency * 1000) / 1000;

  if (overreachConsistency < 0.4) {
    analysis.contradictions.push({
      type: 'reflection_integrity_overreach_mismatch',
      coherence_overreach_count: recentOverreachSum,
      integrity_overreach_count: integrityOverreach,
      severity: 'MEDIUM'
    });
  }

  const factors = [
    analysis.alignment_factors.strength_alignment || 0,
    analysis.alignment_factors.overreach_consistency || 0
  ];
  analysis.alignment_score = Math.round((factors.reduce((a, b) => a + b, 0) / factors.length) * 1000) / 1000;

  return analysis;
}

/**
 * Analyze coherence recovery patterns in history.
 */
function analyzeCoherenceRecovery(history) {
  if (history.length < 3) {
    return { status: 'insufficient_history', recovery_count: 0, recovery_ratio: null, recovery_episodes: [] };
  }

  const episodes = [];
  let inLowCoherence = false;
  let episodeStart = null;

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const isLow = (entry.coherence_strength || 0) < 0.5;

    if (isLow && !inLowCoherence) {
      inLowCoherence = true;
      episodeStart = i;
    } else if (!isLow && inLowCoherence) {
      inLowCoherence = false;
      const episodeLength = i - episodeStart;
      const recoveredStrength = entry.coherence_strength || 0;
      episodes.push({
        start_index: episodeStart,
        end_index: i - 1,
        length: episodeLength,
        recovered_to: recoveredStrength
      });
    }
  }

  const totalRecoveries = episodes.length;
  const totalEpisodes = episodes.length + history.filter(h => (h.coherence_strength || 0) < 0.5).length;
  const recoveryRatio = totalEpisodes > 0 ? totalRecoveries / totalEpisodes : 0.5;

  return {
    status: 'analyzed',
    recovery_count: totalRecoveries,
    total_low_coherence_episodes: totalEpisodes,
    recovery_ratio: Math.round(recoveryRatio * 1000) / 1000,
    recovery_episodes: episodes.slice(-5) // keep last 5
  };
}

// === COHERENCE CLASSIFICATION ===

function classifyCoherence(alignmentAnalysis, contradictionZones, coherenceHistory) {
  const avgAlignment = (alignmentAnalysis?.overall_score ?? alignmentAnalysis?.alignment_score) || 0.5;
  const contradictionCount = contradictionZones?.length || 0;
  const contradictionSeverity = contradictionZones?.some(c => c.severity === 'HIGH') ? 'HIGH' :
                                contradictionZones?.some(c => c.severity === 'MEDIUM') ? 'MEDIUM' : 'LOW';

  // INCOHERENT: multiple high-severity contradictions OR very low alignment
  if (contradictionCount >= 3 || (contradictionSeverity === 'HIGH' && avgAlignment < 0.4)) {
    return COHERENCE_CLASS.INCOHERENT;
  }

  // INCOHERENT: persistent contradictions in history
  if (coherenceHistory.length >= 5) {
    const recent = coherenceHistory.slice(-5);
    const avgRecent = recent.reduce((a, h) => a + (h.coherence_strength || 0), 0) / recent.length;
    if (avgRecent < 0.3) return COHERENCE_CLASS.INCOHERENT;
  }

  // TENSIONED: moderate alignment OR moderate contradictions
  if (avgAlignment < 0.7 || contradictionCount >= 1 || contradictionSeverity !== 'LOW') {
    return COHERENCE_CLASS.TENSIONED;
  }

  // STRONGLY_COHERENT: very high alignment AND no contradictions
  if (avgAlignment >= 0.85 && contradictionCount === 0 && coherenceHistory.length >= 3) {
    return COHERENCE_CLASS.STRONGLY_COHERENT;
  }

  return COHERENCE_CLASS.COHERENT;
}

// === DRIFT PROFILE COMPUTATION ===

function computeDriftProfile(history) {
  if (history.length < 3) {
    return { drift_type: 'INDETERMINATE', trend: [], window: [], coherence_sequence: [] };
  }

  const strengths = history.map(h => h.coherence_strength || 0);
  const windowSize = Math.min(history.length, 10);
  const window = strengths.slice(-windowSize);

  const firstHalf = window.slice(0, Math.ceil(window.length / 2));
  const secondHalf = window.slice(Math.floor(window.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const delta = avgSecond - avgFirst;

  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance = window.reduce((a, s) => a + Math.pow(s - mean, 2), 0) / window.length;
  const stdDev = Math.sqrt(variance);

  let driftType;
  if (stdDev > 0.3 && Math.abs(delta) < 0.1) {
    driftType = 'OSCILLATING';
  } else if (avgFirst < 0.5 && avgSecond >= 0.6) {
    driftType = 'RECOVERING';
  } else if (delta < -0.15) {
    if (avgSecond < 0.3) driftType = 'DISSOLVING';
    else driftType = 'WEAKENING';
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
    coherence_sequence: strengths,
    delta_estimate: Math.round(delta * 1000) / 1000,
    std_dev: Math.round(stdDev * 1000) / 1000
  };
}

// === COHERENCE STRENGTH COMPUTATION ===

function computeCoherenceStrength(alignmentAnalysis, contradictionZones, recoveryAnalysis, coherenceHistory) {
  let strength = 0.5;

  // Alignment bonus
  const alignmentScore = (alignmentAnalysis?.overall_score ?? alignmentAnalysis?.alignment_score) || 0.5;
  strength += (alignmentScore - 0.5) * 0.3;

  // Contradiction penalty
  const highSevCount = contradictionZones?.filter(c => c.severity === 'HIGH').length || 0;
  const medSevCount = contradictionZones?.filter(c => c.severity === 'MEDIUM').length || 0;
  strength -= Math.min(highSevCount * 0.2, 0.5);
  strength -= Math.min(medSevCount * 0.1, 0.3);

  // Recovery bonus
  if (recoveryAnalysis?.recovery_ratio != null) {
    strength += (recoveryAnalysis.recovery_ratio - 0.5) * 0.2;
  }

  // History stability bonus
  if (coherenceHistory.length >= 5) {
    const recentStdDev = Math.sqrt(
      coherenceHistory.slice(-5).reduce((a, h) => {
        const s = h.coherence_strength || 0;
        return a + Math.pow(s - (coherenceHistory.slice(-5).reduce((a2, h2) => a2 + (h2.coherence_strength || 0), 0) / 5), 2);
      }, 0) / 5
    );
    if (recentStdDev < 0.1) strength += 0.1;
  }

  return Math.max(0, Math.min(1, Math.round(strength * 1000) / 1000));
}

// === ALIGNED / FRAGMENTED REGION DETECTION ===

function detectAlignedRegions(history) {
  const regions = [];
  let runStart = null;
  let runEntries = [];

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const isAligned = (entry.coherence_strength || 0) >= 0.7 && (entry.contradiction_count || 0) === 0;

    if (isAligned) {
      if (runStart === null) runStart = i;
      runEntries.push(entry);
    } else {
      if (runStart !== null && runEntries.length >= 2) {
        regions.push({
          region_start_index: runStart,
          region_end_index: i - 1,
          region_length: runEntries.length,
          avg_coherence_strength: runEntries.reduce((a, e) => a + (e.coherence_strength || 0), 0) / runEntries.length
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
      avg_coherence_strength: runEntries.reduce((a, e) => a + (e.coherence_strength || 0), 0) / runEntries.length
    });
  }

  return regions;
}

function detectFragmentedRegions(history) {
  const regions = [];
  let runStart = null;
  let runEntries = [];

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const isFragmented = (entry.coherence_strength || 0) < 0.5 || (entry.contradiction_count || 0) >= 2;

    if (isFragmented) {
      if (runStart === null) runStart = i;
      runEntries.push(entry);
    } else {
      if (runStart !== null && runEntries.length >= 2) {
        regions.push({
          region_start_index: runStart,
          region_end_index: i - 1,
          region_length: runEntries.length
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
      region_length: runEntries.length
    });
  }

  return regions;
}

// === CONTRADICTION ZONE DETECTION ===

function detectContradictionZones(history, integrityState, continuityState) {
  const zones = [];

  // Check current integrity vs continuity contradiction
  if (integrityState?.reflective_integrity_state === 'OVERREACH_RISK' &&
      (continuityState?.reflective_continuity_state === 'CONTINUOUS' ||
       continuityState?.reflective_continuity_state === 'ENTRENCHED_REFLECTIVE_CONTINUITY')) {
    zones.push({
      type: 'integrity_continuity_state_contradiction',
      severity: 'HIGH',
      description: 'Integrity layer shows OVERREACH_RISK but continuity layer shows stable state',
      detected_at: new Date().toISOString()
    });
  }

  // Check coherence fragmentation in recent history
  const recent = history.slice(-5);
  const lowCoherenceCount = recent.filter(e => (e.coherence_strength || 0) < 0.5).length;
  if (lowCoherenceCount >= 3) {
    zones.push({
      type: 'coherence_fragmentation_zone',
      severity: 'MEDIUM',
      description: `Coherence below 0.5 in ${lowCoherenceCount}/5 recent entries`,
      detected_at: new Date().toISOString()
    });
  }

  // Check drift reversal (strengthening then weakening in short window)
  if (history.length >= 6) {
    const strengths = history.slice(-6).map(h => h.coherence_strength || 0);
    const firstHalf = strengths.slice(0, 3);
    const secondHalf = strengths.slice(3);
    const delta1 = firstHalf[2] - firstHalf[0];
    const delta2 = secondHalf[2] - secondHalf[0];
    if (delta1 > 0.1 && delta2 < -0.1) {
      zones.push({
        type: 'coherence_drift_reversal',
        severity: 'MEDIUM',
        description: 'Coherence strengthening followed by immediate weakening',
        detected_at: new Date().toISOString()
      });
    }
  }

  return zones;
}

// === UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(alignmentAnalysis, contradictionZones, coherenceStrength) {
  const boundaries = [];

  if (((alignmentAnalysis?.overall_score ?? alignmentAnalysis?.alignment_score) || 0.5) < 0.4) {
    boundaries.push({
      type: 'low_alignment_score',
      active: true,
      required: true,
      message: 'Uncertainty must be preserved: alignment score below 0.4'
    });
  }

  const highSevCount = contradictionZones?.filter(c => c.severity === 'HIGH').length || 0;
  if (highSevCount >= 2) {
    boundaries.push({
      type: 'multiple_high_severity_contradictions',
      active: true,
      required: true,
      message: 'Uncertainty must be preserved: multiple high-severity contradictions detected'
    });
  }

  if (coherenceStrength < 0.3) {
    boundaries.push({
      type: 'low_coherence_strength',
      active: true,
      required: true,
      message: `Uncertainty must be preserved: coherence strength (${coherenceStrength}) critically low`
    });
  }

  return boundaries;
}

// === MAIN ASSESS FUNCTION ===

/**
 * Assess reflective coherence across all three layers.
 *
 * @param {Object} integrityAssessment - Output from validateReflection() (Phase 8B)
 * @param {Object} continuityAssessment - Output from assessContinuity() (Phase 8C)
 * @returns {Object} Full coherence assessment (shadow only)
 */
export function assessCoherence(integrityAssessment, continuityAssessment) {
  const requestId = `rc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  // Load current states from the other layers
  const currentIntegrityState = loadState(join(process.cwd(), 'state', 'reflective-integrity.json'));
  const currentContinuityState = loadState(join(process.cwd(), 'state', 'reflective-continuity.json'));

  // Compute alignment analyses
  const icAlignment = analyzeIntegrityContinuityAlignment(
    currentIntegrityState || integrityAssessment,
    currentContinuityState || continuityAssessment
  );

  // Load coherence history
  const history = loadHistory(MAX_HISTORY);
  const reflAlignment = analyzeReflectionIntegrityAlignment(history, currentIntegrityState || integrityAssessment);

  // Combine alignment scores
  const combinedAlignment = {
    integrity_continuity: icAlignment,
    reflection_integrity: reflAlignment,
    overall_score: Math.round(((icAlignment.alignment_score || 0.5) + (reflAlignment.alignment_score || 0.5)) / 2 * 1000) / 1000,
    all_contradictions: [...(icAlignment.contradictions || []), ...(reflAlignment.contradictions || [])]
  };

  // Detect contradiction zones
  const contradictionZones = detectContradictionZones(history, currentIntegrityState, currentContinuityState);
  // Add any fresh contradictions from current assessment
  if (integrityAssessment?.overreach_flags?.length > 0 && continuityAssessment?.continuity_strength > 0.7) {
    contradictionZones.push({
      type: 'cross_layer_overreach_mismatch',
      severity: 'MEDIUM',
      description: 'Integrity layer flags overreach but continuity layer shows strong coherence',
      detected_at: new Date().toISOString()
    });
  }

  // Coherence recovery analysis
  const recoveryAnalysis = analyzeCoherenceRecovery(history);

  // Coherence strength
  const coherenceStrength = computeCoherenceStrength(combinedAlignment, contradictionZones, recoveryAnalysis, history);

  // Classify coherence
  const coherenceClass = classifyCoherence(combinedAlignment, contradictionZones, history);

  // Detect aligned/fragmented regions
  const alignedRegions = detectAlignedRegions(history);
  const fragmentedRegions = detectFragmentedRegions(history);

  // Coherence drift profile
  const driftProfile = computeDriftProfile(history);

  // Uncertainty boundaries
  const uncertaintyBoundaries = computeUncertaintyBoundaries(combinedAlignment, contradictionZones, coherenceStrength);

  // Build assessment entry for history
  const historyEntry = {
    request_id: requestId,
    timestamp: new Date().toISOString(),
    coherence_class: coherenceClass,
    coherence_strength: coherenceStrength,
    alignment_score: combinedAlignment.overall_score,
    contradiction_count: contradictionZones.length,
    integrity_continuity_alignment: icAlignment.alignment_score,
    reflection_integrity_alignment: reflAlignment.alignment_score
  };

  appendHistory(historyEntry);

  // Build full assessment
  const assessment = {
    request_id: requestId,
    reflective_coherence_state: coherenceClass,
    coherence_strength: coherenceStrength,
    aligned_reflective_regions: alignedRegions,
    fragmented_reflective_regions: fragmentedRegions,
    reflective_contradiction_zones: contradictionZones,
    integrity_alignment_analysis: {
      alignment_score: icAlignment.alignment_score,
      alignment_factors: icAlignment.alignment_factors,
      contradictions: icAlignment.contradictions
    },
    continuity_alignment_analysis: {
      alignment_score: reflAlignment.alignment_score,
      alignment_factors: reflAlignment.alignment_factors,
      contradictions: reflAlignment.contradictions
    },
    coherence_recovery_analysis: recoveryAnalysis,
    coherence_fragmentation: fragmentedRegions.map(r => ({
      region: `${r.region_start_index}–${r.region_end_index}`,
      length: r.region_length,
      severity: r.region_length >= 4 ? 'SEVERE' : 'MODERATE'
    })),
    reflective_coherence_drift_profile: {
      drift_type: driftProfile.drift_type,
      trend: driftProfile.trend,
      delta_estimate: driftProfile.delta_estimate,
      std_dev: driftProfile.std_dev
    },
    uncertainty_boundaries: uncertaintyBoundaries,
    environmental_reflective_coherence_summary: {
      status: coherenceClass === 'INCOHERENT' ? 'coherence_fractured' :
              coherenceClass === 'STRONGLY_COHERENT' ? 'coherence_maintained' : 'coherence_variable',
      history_depth: history.length + 1,
      max_history: MAX_HISTORY,
      shadow_only: true,
      assessed_at: new Date().toISOString()
    },
    generated_at: new Date().toISOString(),
    shadow_only: true,
    version: '8D.1'
  };

  saveState(assessment, COHERENCE_STATE_FILE);
  return assessment;
}

// === GET STATE ===

export function getCoherenceState() {
  return loadState(COHERENCE_STATE_FILE) || getDefaultState();
}

export function getCoherenceHistory(limit = MAX_HISTORY) {
  return loadHistory(limit);
}

// === SEED FUNCTION ===

export function seedCoherenceHistory(entries) {
  for (const entry of entries) {
    appendHistory({
      request_id: entry.request_id || `seed-${Date.now()}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      coherence_class: entry.coherence_class || 'TENSIONED',
      coherence_strength: entry.coherence_strength || 0.5,
      alignment_score: entry.alignment_score || 0.5,
      contradiction_count: entry.contradiction_count || 0
    });
  }
}

// === CLEAR FUNCTION ===

export function clearCoherenceHistory() {
  try {
    if (existsSync(COHERENCE_HISTORY_FILE)) {
      writeFileSync(COHERENCE_HISTORY_FILE, '', 'utf8');
    }
  } catch { /* ignore */ }
}