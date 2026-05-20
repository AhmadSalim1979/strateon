/**
 * Executive Readiness Layer — MCAI Phase 6E
 * SHADOW-ONLY: Observational readiness evaluation without action authority.
 * 
 * This module observes whether the cognitive architecture is stable, coherent,
 * persistent, and sufficiently grounded to eventually support bounded
 * executive prioritization.
 * 
 * READY_OBSERVATIONAL does NOT mean MOOSA is authorized to prioritize or act.
 * It only means the cognitive substrate appears observationally ready for the
 * next design discussion.
 * 
 * NO prioritization. NO recommendations. NO planning. NO decisions. NO actions.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const READINESS_FILE = path.join(STATE_DIR, 'executive-readiness.json');
const READINESS_HISTORY_FILE = path.join(STATE_DIR, 'executive-readiness-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const BLOCKER_WEIGHT = 0.4;
const SUPPORT_WEIGHT = 0.6;
const READINESS_CONFIDENCE_MIN = 5;

// === READINESS STATES ===

const READINESS_STATES = {
    NOT_READY: {
        state: 'NOT_READY',
        description: 'The cognitive architecture is not ready to support executive prioritization. Significant blockers are present across one or more required subsystems.',
        requirements: 'One or more readiness blockers are dominant or unresolved.'
    },
    EMERGING: {
        state: 'EMERGING',
        description: 'The cognitive architecture is beginning to demonstrate readiness characteristics. Some subsystems show stability, but critical blockers remain.',
        requirements: 'No dominant blockers, but insufficient support signals for CONDITIONALLY_READY.'
    },
    CONDITIONALLY_READY: {
        state: 'CONDITIONALLY_READY',
        description: 'The cognitive architecture demonstrates sufficient stability to support further design discussion. Blockers are minor or isolated. Continued observation warranted.',
        requirements: 'Support signals present, blockers are non-critical or manageable.'
    },
    READY_OBSERVATIONAL: {
        state: 'READY_OBSERVATIONAL',
        description: 'The cognitive substrate appears stable and coherent across all required dimensions. The architecture may be ready for the next design phase discussion.',
        requirements: 'Strong support signals, minimal blockers, stable drift profile.'
    }
};

// === READINESS DRIFT PROFILES ===

const DRIFT_PROFILES = {
    IMPROVING: {
        profile: 'IMPROVING',
        description: 'Readiness is improving. Support signals are strengthening and blockers are diminishing.',
        direction: 'POSITIVE'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Readiness is weakening. Support signals are diminishing or blockers are increasing.',
        direction: 'NEGATIVE'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Readiness is stable. No significant drift in either direction.',
        direction: 'NEUTRAL'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Readiness is oscillating between states. Stability cannot be confirmed.',
        direction: 'UNSTABLE'
    },
    BLOCKED: {
        profile: 'BLOCKED',
        description: 'Readiness is blocked by one or more dominant blockers. Progress is halted.',
        direction: 'STALLED'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Readiness drift cannot be determined. Insufficient history or conflicting signals.',
        direction: 'UNKNOWN'
    }
};

// === BLOCKER DEFINITIONS ===

const READINESS_BLOCKERS = {
    UNSTABLE_BELIEFS: {
        type: 'UNSTABLE_BELIEFS',
        severity: 'HIGH',
        description: 'Belief stability is low.Assertions lack verification or contradict established fact.',
        detection: 'epistemic_integrity < 0.4 or stability < 0.3'
    },
    STALE_VERIFICATION: {
        type: 'STALE_VERIFICATION',
        severity: 'MEDIUM',
        description: 'Verification data is stale or insufficient. Claims cannot be confirmed current.',
        detection: 'verification_discipline < 0.4 or last_verification_age > threshold'
    },
    WEAK_CONTINUITY: {
        type: 'WEAK_CONTINUITY',
        severity: 'MEDIUM',
        description: 'Temporal continuity is weak. Coherence breaks down over time.',
        detection: 'temporal_continuity < 0.35 or coherence_trend declining'
    },
    HIGH_FRAGMENTATION: {
        type: 'HIGH_FRAGMENTATION',
        severity: 'MEDIUM',
        description: 'Cognitive fragmentation is high. Attention and resources are scattered.',
        detection: 'cognitive_weighting.fragmentation_score > 0.6'
    },
    EXCESSIVE_OSCILLATION: {
        type: 'EXCESSIVE_OSCILLATION',
        severity: 'MEDIUM',
        description: 'Cognitive state is oscillating excessively. Stability cannot be maintained.',
        detection: 'cognitive_stability.oscillation_index > 0.5'
    },
    UNRESOLVED_CONTRADICTIONS: {
        type: 'UNRESOLVED_CONTRADICTIONS',
        severity: 'HIGH',
        description: 'Unresolved contradictions are present. Coherence is compromised.',
        detection: 'cognitive_coherence.unresolved_contradictions > 0 or coherence < 0.5'
    },
    UNSTABLE_EXECUTIVE_TENSION: {
        type: 'UNSTABLE_EXECUTIVE_TENSION',
        severity: 'HIGH',
        description: 'Executive selection tension is unstable. Convergence is not holding.',
        detection: 'executive_selection_tension.tension_state in [UNSTABLE, FRAGMENTING, OSCILLATING]'
    },
    WEAK_EXECUTIVE_PERSISTENCE: {
        type: 'WEAK_EXECUTIVE_PERSISTENCE',
        severity: 'MEDIUM',
        description: 'Executive persistence is weak. Convergence does not hold under pressure.',
        detection: 'executive_persistence.persistence_strength < 0.4'
    },
    INSUFFICIENT_HISTORY: {
        type: 'INSUFFICIENT_HISTORY',
        severity: 'LOW',
        description: 'Insufficient history to establish stable readiness classification.',
        detection: 'history.length < READINESS_CONFIDENCE_MIN'
    },
    WEAK_COHERENCE: {
        type: 'WEAK_COHERENCE',
        severity: 'HIGH',
        description: 'Cognitive coherence is weak. Competing cognitive structures lack integration.',
        detection: 'cognitive_coherence.coherence_score < 0.4'
    },
    UNSTABLE_PRIORITIZATION_PRESSURE: {
        type: 'UNSTABLE_PRIORITIZATION_PRESSURE',
        severity: 'MEDIUM',
        description: 'Prioritization pressure is unstable. No stable priority hierarchy has formed.',
        detection: 'prioritization_pressure.pressure_state in [Chaotic, Collapsed]'
    },
    WEAK_EXECUTIVE_FOCUS: {
        type: 'WEAK_EXECUTIVE_FOCUS',
        severity: 'MEDIUM',
        description: 'Executive focus is weak. No persistent focus candidate has emerged.',
        detection: 'executive_focus.focus_strength < 0.35'
    }
};

// === SUPPORT SIGNAL DEFINITIONS ===

const READINESS_SUPPORT_SIGNALS = {
    STRONG_COHERENCE: {
        type: 'STRONG_COHERENCE',
        weight: 0.2,
        description: 'Cognitive coherence is strong across all evaluated dimensions.',
        detection: 'cognitive_coherence.coherence_score >= 0.7'
    },
    STABLE_PERSISTENCE: {
        type: 'STABLE_PERSISTENCE',
        weight: 0.15,
        description: 'Executive persistence is stable. Convergence holds under normal conditions.',
        detection: 'executive_persistence.persistence_strength >= 0.65'
    },
    LOW_FRAGMENTATION: {
        type: 'LOW_FRAGMENTATION',
        weight: 0.1,
        description: 'Cognitive fragmentation is low. Attention is concentrated.',
        detection: 'cognitive_weighting.fragmentation_score <= 0.3'
    },
    STRONG_VERIFICATION_COVERAGE: {
        type: 'STRONG_VERIFICATION_COVERAGE',
        weight: 0.15,
        description: 'Verification discipline is strong. Claims are well-supported.',
        detection: 'verification_discipline >= 0.7'
    },
    STABLE_ATTENTION: {
        type: 'STABLE_ATTENTION',
        weight: 0.1,
        description: 'Attention dynamics are stable. No excessive attention drift.',
        detection: 'cognitive_stability.attention_stability >= 0.65'
    },
    COHERENT_SALIENCE: {
        type: 'COHERENT_SALIENCE',
        weight: 0.1,
        description: 'Salience landscape is coherent. Priority signals are well-integrated.',
        detection: 'cognitive_weighting.coherence_score >= 0.6'
    },
    DURABLE_EXECUTIVE_REGIONS: {
        type: 'DURABLE_EXECUTIVE_REGIONS',
        weight: 0.15,
        description: 'Executive regions are durable. Focus convergence is holding.',
        detection: 'executive_focus.focus_state in [CONVERGING, DOMINANT] and focus_strength >= 0.6'
    },
    LOW_CONTRADICTION_PRESSURE: {
        type: 'LOW_CONTRADICTION_PRESSURE',
        weight: 0.05,
        description: 'Contradiction pressure is low. Minimal unresolved conflicts.',
        detection: 'cognitive_pressure.contradiction_pressure <= 0.25'
    }
};

// === INPUT SOURCE LOCATIONS ===

const STATE_FILES = {
    epistemic_integrity: path.join(STATE_DIR, 'epistemic-integrity.json'),
    verification_discipline: null, // From memory/operational
    temporal_continuity: path.join(STATE_DIR, 'cognitive-coherence.json'),
    cognitive_coherence: path.join(STATE_DIR, 'cognitive-coherence.json'),
    cognitive_stability: path.join(STATE_DIR, 'cognitive-stability.json'),
    cognitive_weighting: path.join(STATE_DIR, 'cognitive-weighting.json'),
    prioritization_pressure: path.join(STATE_DIR, 'prioritization-pressure.json'),
    executive_focus: path.join(STATE_DIR, 'executive-focus.json'),
    executive_selection_tension: path.join(STATE_DIR, 'executive-selection-tension.json'),
    executive_persistence: path.join(STATE_DIR, 'executive-persistence.json')
};

// === READINESS INPUTS ===

function loadReadinessInputs() {
    const inputs = {};
    
    for (const [name, filePath] of Object.entries(STATE_FILES)) {
        if (filePath && fs.existsSync(filePath)) {
            try {
                inputs[name] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                inputs[name] = null;
            }
        } else {
            inputs[name] = null;
        }
    }
    
    return inputs;
}

// === BLOCKER DETECTION ===

function detectBlockers(inputs, history = []) {
    const blockers = [];
    
    // Insufficient history
    if (history.length < READINESS_CONFIDENCE_MIN) {
        blockers.push({
            ...READINESS_BLOCKERS.INSUFFICIENT_HISTORY,
            evidence: { history_length: history.length, required: READINESS_CONFIDENCE_MIN }
        });
    }
    
    // Unstable beliefs
    if (inputs.epistemic_integrity) {
        const integrity = inputs.epistemic_integrity;
        if (integrity.belief_stability < 0.3 || integrity.assertion_confidence < 0.4) {
            blockers.push({
                ...READINESS_BLOCKERS.UNSTABLE_BELIEFS,
                evidence: {
                    belief_stability: integrity.belief_stability,
                    assertion_confidence: integrity.assertion_confidence
                }
            });
        }
    }
    
    // Weak coherence
    if (inputs.cognitive_coherence) {
        const cc = inputs.cognitive_coherence;
        if (cc.coherence_score < 0.4) {
            blockers.push({
                ...READINESS_BLOCKERS.WEAK_COHERENCE,
                evidence: { coherence_score: cc.coherence_score }
            });
        }
        if (cc.unresolved_contradictions > 0 && cc.coherence_score < 0.5) {
            blockers.push({
                ...READINESS_BLOCKERS.UNRESOLVED_CONTRADICTIONS,
                evidence: {
                    unresolved_contradictions: cc.unresolved_contradictions,
                    coherence_score: cc.coherence_score
                }
            });
        }
    }
    
    // High fragmentation
    if (inputs.cognitive_weighting) {
        const cw = inputs.cognitive_weighting;
        if (cw.fragmentation_score > 0.6) {
            blockers.push({
                ...READINESS_BLOCKERS.HIGH_FRAGMENTATION,
                evidence: { fragmentation_score: cw.fragmentation_score }
            });
        }
    }
    
    // Excessive oscillation
    if (inputs.cognitive_stability) {
        const cs = inputs.cognitive_stability;
        if (cs.oscillation_index > 0.5) {
            blockers.push({
                ...READINESS_BLOCKERS.EXCESSIVE_OSCILLATION,
                evidence: { oscillation_index: cs.oscillation_index }
            });
        }
    }
    
    // Weak continuity
    if (inputs.temporal_continuity) {
        const tc = inputs.temporal_continuity;
        if (tc.coherence_trend === 'declining' && tc.continuity_score < 0.35) {
            blockers.push({
                ...READINESS_BLOCKERS.WEAK_CONTINUITY,
                evidence: { continuity_score: tc.continuity_score, trend: tc.coherence_trend }
            });
        }
    }
    
    // Unstable executive tension
    if (inputs.executive_selection_tension) {
        const est = inputs.executive_selection_tension;
        if (['UNSTABLE', 'FRAGMENTING', 'OSCILLATING'].includes(est.tension_state)) {
            blockers.push({
                ...READINESS_BLOCKERS.UNSTABLE_EXECUTIVE_TENSION,
                evidence: { tension_state: est.tension_state }
            });
        }
    }
    
    // Weak executive persistence
    if (inputs.executive_persistence) {
        const ep = inputs.executive_persistence;
        if (ep.persistence_strength < 0.4) {
            blockers.push({
                ...READINESS_BLOCKERS.WEAK_EXECUTIVE_PERSISTENCE,
                evidence: { persistence_strength: ep.persistence_strength }
            });
        }
    }
    
    // Unstable prioritization pressure
    if (inputs.prioritization_pressure) {
        const pp = inputs.prioritization_pressure;
        if (['CHAOTIC', 'COLLAPSED'].includes(pp.pressure_state)) {
            blockers.push({
                ...READINESS_BLOCKERS.UNSTABLE_PRIORITIZATION_PRESSURE,
                evidence: { pressure_state: pp.pressure_state }
            });
        }
    }
    
    // Weak executive focus
    if (inputs.executive_focus) {
        const ef = inputs.executive_focus;
        if (ef.focus_strength < 0.35) {
            blockers.push({
                ...READINESS_BLOCKERS.WEAK_EXECUTIVE_FOCUS,
                evidence: { focus_strength: ef.focus_strength }
            });
        }
    }
    
    return blockers;
}

// === SUPPORT SIGNAL DETECTION ===

function detectSupportSignals(inputs) {
    const signals = [];
    let totalWeight = 0;
    
    // Strong coherence
    if (inputs.cognitive_coherence && inputs.cognitive_coherence.coherence_score >= 0.7) {
        const signal = READINESS_SUPPORT_SIGNALS.STRONG_COHERENCE;
        signals.push({ ...signal, detected: true });
        totalWeight += signal.weight;
    }
    
    // Stable persistence
    if (inputs.executive_persistence && inputs.executive_persistence.persistence_strength >= 0.65) {
        const signal = READINESS_SUPPORT_SIGNALS.STABLE_PERSISTENCE;
        signals.push({ ...signal, detected: true });
        totalWeight += signal.weight;
    }
    
    // Low fragmentation
    if (inputs.cognitive_weighting && inputs.cognitive_weighting.fragmentation_score <= 0.3) {
        const signal = READINESS_SUPPORT_SIGNALS.LOW_FRAGMENTATION;
        signals.push({ ...signal, detected: true });
        totalWeight += signal.weight;
    }
    
    // Strong verification
    if (inputs.epistemic_integrity && inputs.epistemic_integrity.verification_discipline >= 0.7) {
        const signal = READINESS_SUPPORT_SIGNALS.STRONG_VERIFICATION_COVERAGE;
        signals.push({ ...signal, detected: true });
        totalWeight += signal.weight;
    }
    
    // Stable attention
    if (inputs.cognitive_stability && inputs.cognitive_stability.attention_stability >= 0.65) {
        const signal = READINESS_SUPPORT_SIGNALS.STABLE_ATTENTION;
        signals.push({ ...signal, detected: true });
        totalWeight += signal.weight;
    }
    
    // Coherent salience
    if (inputs.cognitive_weighting && inputs.cognitive_weighting.coherence_score >= 0.6) {
        const signal = READINESS_SUPPORT_SIGNALS.COHERENT_SALIENCE;
        signals.push({ ...signal, detected: true });
        totalWeight += signal.weight;
    }
    
    // Durable executive regions
    if (inputs.executive_focus && 
        ['CONVERGING', 'DOMINANT'].includes(inputs.executive_focus.focus_state) &&
        inputs.executive_focus.focus_strength >= 0.6) {
        const signal = READINESS_SUPPORT_SIGNALS.DURABLE_EXECUTIVE_REGIONS;
        signals.push({ ...signal, detected: true });
        totalWeight += signal.weight;
    }
    
    // Low contradiction pressure
    if (inputs.cognitive_pressure && inputs.cognitive_pressure.contradiction_pressure <= 0.25) {
        const signal = READINESS_SUPPORT_SIGNALS.LOW_CONTRADICTION_PRESSURE;
        signals.push({ ...signal, detected: true });
        totalWeight += signal.weight;
    }
    
    return { signals, totalWeight };
}

// === READINESS CLASSIFICATION ===

function classifyReadiness(blockers, supportSignals, history) {
    // High-severity blockers block higher states
    const highSeverityBlockers = blockers.filter(b => b.severity === 'HIGH');
    if (highSeverityBlockers.length >= 2) {
        return { state: READINESS_STATES.NOT_READY.state, reason: 'Multiple high-severity blockers' };
    }
    if (highSeverityBlockers.length === 1 && supportSignals.totalWeight < 0.4) {
        return { state: READINESS_STATES.NOT_READY.state, reason: 'High-severity blocker with weak support' };
    }
    
    // Insufficient history
    if (history.length < 3) {
        return { state: READINESS_STATES.NOT_READY.state, reason: 'Insufficient history for classification' };
    }
    
    // Strong support, minimal blockers
    if (supportSignals.totalWeight >= 0.7 && blockers.filter(b => b.severity !== 'LOW').length === 0) {
        return { state: READINESS_STATES.READY_OBSERVATIONAL.state, reason: 'Strong support with minimal blockers' };
    }
    
    // Moderate support, minor blockers
    if (supportSignals.totalWeight >= 0.4 && blockers.length <= 3) {
        return { state: READINESS_STATES.CONDITIONALLY_READY.state, reason: 'Moderate support with manageable blockers' };
    }
    
    // Emerging — some signals but blockers present
    if (supportSignals.totalWeight >= 0.2 || blockers.length > 0) {
        return { state: READINESS_STATES.EMERGING.state, reason: 'Some signals present, blockers being resolved' };
    }
    
    // Default — not ready
    return { state: READINESS_STATES.NOT_READY.state, reason: 'Insufficient readiness indicators' };
}

// === READINESS COMPUTATION ===

function computeReadiness(inputs, history = [], readinessHistory = []) {
    // Step 1: Detect blockers
    const blockers = detectBlockers(inputs, history);
    
    // Step 2: Detect support signals
    const supportSignals = detectSupportSignals(inputs);
    
    // Step 3: Classify readiness
    const classification = classifyReadiness(blockers, supportSignals, history);
    
    // Step 4: Compute readiness score
    let readinessScore = (supportSignals.totalWeight * SUPPORT_WEIGHT) - 
                        (blockers.filter(b => b.severity !== 'LOW').length * BLOCKER_WEIGHT * 0.2);
    readinessScore = Math.max(0, Math.min(1, readinessScore));
    
    // Step 5: Compute drift profile
    const driftProfile = computeDriftProfile(history, readinessHistory);
    
    // Step 6: Build readiness inputs summary
    const readinessInputs = {
        epistemic_integrity: inputs.epistemic_integrity ? {
            coherence_score: inputs.epistemic_integrity.coherence_score || null,
            belief_stability: inputs.epistemic_integrity.belief_stability || null,
            verification_discipline: inputs.epistemic_integrity.verification_discipline || null
        } : null,
        temporal_continuity: inputs.temporal_continuity ? {
            continuity_score: inputs.temporal_continuity.continuity_score || null,
            coherence_trend: inputs.temporal_continuity.coherence_trend || null
        } : null,
        cognitive_coherence: inputs.cognitive_coherence ? {
            coherence_score: inputs.cognitive_coherence.coherence_score || null,
            unresolved_contradictions: inputs.cognitive_coherence.unresolved_contradictions || null
        } : null,
        cognitive_stability: inputs.cognitive_stability ? {
            stability_score: inputs.cognitive_stability.stability_score || null,
            oscillation_index: inputs.cognitive_stability.oscillation_index || null
        } : null,
        cognitive_weighting: inputs.cognitive_weighting ? {
            fragmentation_score: inputs.cognitive_weighting.fragmentation_score || null,
            coherence_score: inputs.cognitive_weighting.coherence_score || null
        } : null,
        prioritization_pressure: inputs.prioritization_pressure ? {
            pressure_state: inputs.prioritization_pressure.pressure_state || null,
            pressure_score: inputs.prioritization_pressure.pressure_score || null
        } : null,
        executive_focus: inputs.executive_focus ? {
            focus_state: inputs.executive_focus.focus_state || null,
            focus_strength: inputs.executive_focus.focus_strength || null
        } : null,
        executive_selection_tension: inputs.executive_selection_tension ? {
            tension_state: inputs.executive_selection_tension.tension_state || null,
            tension_strength: inputs.executive_selection_tension.tension_strength || null
        } : null,
        executive_persistence: inputs.executive_persistence ? {
            persistence_state: inputs.executive_persistence.executive_persistence_state || null,
            persistence_strength: inputs.executive_persistence.persistence_strength || null
        } : null
    };
    
    // Step 7: Environmental readiness summary
    const environmental_readiness_summary = {
        total_inputs: Object.values(inputs).filter(Boolean).length,
        total_required: Object.keys(STATE_FILES).length,
        blocker_count: blockers.length,
        high_severity_blockers: blockers.filter(b => b.severity === 'HIGH').length,
        support_signal_count: supportSignals.signals.length,
        readiness_score: Math.round(readinessScore * 100) / 100
    };
    
    // Step 8: Uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(inputs, blockers, history);
    
    // Step 9: Build result
    const result = {
        readiness_state: classification.state,
        readiness_score: Math.round(readinessScore * 100) / 100,
        support_signals: supportSignals.signals.map(s => ({
            type: s.type,
            description: s.description,
            weight: s.weight,
            detected: s.detected
        })),
        readiness_blockers: blockers.map(b => ({
            type: b.type,
            severity: b.severity,
            description: b.description,
            evidence: b.evidence || null
        })),
        readiness_inputs: readinessInputs,
        readiness_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            direction: driftProfile.direction,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_readiness_summary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
    
    return result;
}

// === DRIFT PROFILE ===

function computeDriftProfile(history, readinessHistory) {
    if (history.length < 3 || readinessHistory.length < 3) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }
    
    const recentScores = readinessHistory.slice(-5).map(h => h.readiness_score || 0);
    const earlyAvg = recentScores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const lateAvg = recentScores.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const drift = lateAvg - earlyAvg;
    
    if (drift > 0.1) {
        return { ...DRIFT_PROFILES.IMPROVING, drift_magnitude: drift };
    } else if (drift < -0.1) {
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else {
        const oscillations = recentScores.filter((v, i) => i > 0 && Math.abs(v - recentScores[i - 1]) > 0.15).length;
        if (oscillations >= 3) {
            return { ...DRIFT_PROFILES.OSCILLATING };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    }
}

// === UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(inputs, blockers, history) {
    const boundaries = [];
    
    if (history.length < READINESS_CONFIDENCE_MIN) {
        boundaries.push({
            type: 'INSUFFICIENT_HISTORY',
            description: 'Readiness classification confidence is low. More observations needed.',
            confidence: 'LOW',
            caveat: 'Current classification may change significantly as history accumulates.'
        });
    }
    
    const missingInputs = Object.entries(inputs).filter(([, v]) => !v).map(([k]) => k);
    if (missingInputs.length > 3) {
        boundaries.push({
            type: 'MULTIPLE_MISSING_INPUTS',
            description: 'Multiple required inputs are not available.',
            confidence: 'LOW',
            caveat: `Missing: ${missingInputs.join(', ')}. Classification may be unreliable.`
        });
    }
    
    if (blockers.some(b => b.severity === 'HIGH')) {
        boundaries.push({
            type: 'HIGH_SEVERITY_BLOCKERS_PRESENT',
            description: 'High-severity blockers are present. Readiness classification may be pessimistic.',
            confidence: 'MEDIUM',
            caveat: 'Blockers may resolve or become less severe over time.'
        });
    }
    
    if (blockers.length === 0 && history.length < 5) {
        boundaries.push({
            type: 'UNUSUALLY_CLEAR',
            description: 'No blockers detected with limited history. This may be unusually optimistic.',
            confidence: 'MEDIUM',
            caveat: 'Classification may revert to EMERGING or NOT_READY as more data accumulates.'
        });
    }
    
    return boundaries;
}

// === PERSISTENCE ===

function saveReadinessState(readinessState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    // Write snapshot
    fs.writeFileSync(READINESS_FILE, JSON.stringify(readinessState, null, 2));
    
    // Append to history
    const historyEntry = {
        timestamp: readinessState.generated_at,
        readiness_state: readinessState.readiness_state,
        readiness_score: readinessState.readiness_score,
        blocker_count: readinessState.readiness_blockers.length,
        support_signal_count: readinessState.support_signals.length
    };
    
    try {
        const existingHistory = fs.existsSync(READINESS_HISTORY_FILE)
            ? fs.readFileSync(READINESS_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];
        
        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(READINESS_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(READINESS_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }
    
    // Audit log
    const auditEntry = {
        timestamp: readinessState.generated_at,
        type: 'EXECUTIVE_READINESS_COMPUTED',
        state: readinessState.readiness_state,
        score: readinessState.readiness_score,
        blockers: readinessState.readiness_blockers.length,
        signals: readinessState.support_signals.length,
        drift: readinessState.readiness_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    try {
        const inputs = loadReadinessInputs();
        
        let history = [];
        if (fs.existsSync(READINESS_HISTORY_FILE)) {
            history = fs.readFileSync(READINESS_HISTORY_FILE, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        const readinessState = computeReadiness(inputs, history, history);
        saveReadinessState(readinessState);
        
        console.log(JSON.stringify(readinessState, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeReadiness,
    saveReadinessState,
    loadReadinessInputs,
    READINESS_STATES,
    DRIFT_PROFILES,
    READINESS_BLOCKERS,
    READINESS_SUPPORT_SIGNALS
};