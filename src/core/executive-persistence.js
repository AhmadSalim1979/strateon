/**
 * Executive Persistence Consolidation Layer — MCAI Phase 6D
 * SHADOW-ONLY: Bounded observational persistence modeling without action authority.
 * 
 * This module observes executive-persistence consolidation dynamics:
 * - Sustained executive-focus continuity
 * - Persistence durability under pressure
 * - Convergence survivability
 * - Interruption resistance
 * - Fragmentation resilience
 * 
 * It models persistence — NOT priorities. NOT recommendations. NOT actions.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations.
 * NO prioritization. NO planning. NO remediation. NO scheduling.
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const PERSISTENCE_FILE = path.join(STATE_DIR, 'executive-persistence.json');
const PERSISTENCE_HISTORY_FILE = path.join(STATE_DIR, 'executive-persistence-history.jsonl');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

const MAX_HISTORY = 30;
const CONSOLIDATION_WINDOW = 10;     // Window for detecting consolidation patterns
const SURVIVABILITY_WINDOW = 5;      // Short window for survivability detection
const DECAY_WINDOW = 8;              // Window for decay detection
const PERSISTENCE_CONFIDENCE_MIN = 3; // Min observations for confidence

// === PERSISTENCE STATES ===

const PERSISTENCE_STATES = {
    TRANSIENT: {
        state: 'TRANSIENT',
        description: 'Executive-focus persistence is transient. Executive regions appear briefly without sustained continuity. Convergence does not hold under pressure. High risk of collapse.',
        requirements: 'Single observation or rapid succession of different regions'
    },
    HOLDING: {
        state: 'HOLDING',
        description: 'Executive-focus persistence is holding. Convergence is maintained. Executive regions persist under normal conditions. Moderate survivability under interruption.',
        requirements: 'Consistent region in recent history, some interruption resistance'
    },
    CONSOLIDATING: {
        state: 'CONSOLIDATING',
        description: 'Executive-focus persistence is consolidating. Convergence is strengthening. Executive regions are gaining persistence durability. Increasing resistance to fragmentation.',
        requirements: 'Multiple consecutive observations of same region, strengthening trend'
    },
    ENTRENCHED: {
        state: 'ENTRENCHED',
        description: 'Executive-focus persistence is entrenched. Convergence is highly durable. Executive regions have demonstrated sustained persistence. Strong survivability under oscillation and fragmentation pressure.',
        requirements: 'Consistent region across long history, high confidence, strong persistence metrics'
    }
};

// === PERSISTENCE DRIFT PROFILES ===

const DRIFT_PROFILES = {
    STRENGTHENING: {
        profile: 'STRENGTHENING',
        description: 'Executive persistence is strengthening. Convergence durability is increasing. Executive regions are gaining persistence reinforcement.',
        observation: 'Persistence trend is toward consolidation.'
    },
    STABILIZING: {
        profile: 'STABILIZING',
        description: 'Executive persistence is stabilizing. Persistence metrics are consistent. No significant drift in consolidation.',
        observation: 'Persistence trend is neutral.'
    },
    WEAKENING: {
        profile: 'WEAKENING',
        description: 'Executive persistence is weakening. Convergence durability is decreasing. Executive regions are losing persistence strength.',
        observation: 'Persistence trend is toward decay.'
    },
    OSCILLATING: {
        profile: 'OSCILLATING',
        description: 'Executive persistence is oscillating. Continuity alternates between stable and unstable. No sustained persistence pattern.',
        observation: 'Persistence trend is unstable alternation.'
    },
    FRAGMENTING: {
        profile: 'FRAGMENTING',
        description: 'Executive persistence is fragmenting. Convergence is breaking into multiple competing persistence structures.',
        observation: 'Persistence trend is toward fragmentation.'
    },
    RECOVERING: {
        profile: 'RECOVERING',
        description: 'Executive persistence is recovering. Previous decay is reversing. Convergence durability is being restored.',
        observation: 'Persistence trend is toward stability.'
    },
    ADAPTING: {
        profile: 'ADAPTING',
        description: 'Executive persistence is adapting. Persistence dynamics are shifting in response to environmental pressure.',
        observation: 'Persistence trend is in transition.'
    },
    CONSOLIDATING: {
        profile: 'CONSOLIDATING',
        description: 'Executive persistence is consolidating. Multiple persistence structures are merging into fewer stronger candidates.',
        observation: 'Persistence trend is toward concentration.'
    },
    INDETERMINATE: {
        profile: 'INDETERMINATE',
        description: 'Executive persistence drift cannot be determined. Insufficient history or conflicting signals.',
        observation: 'Drift classification requires more observations.'
    }
};

// === COMPUTATION HELPERS ===

/**
 * Compute persistence metrics from executive-focus state and history
 */
function computePersistenceMetrics(executiveState, history) {
    const candidates = executiveState.top_candidates || [];
    const dominant_region = executiveState.dominant_region || null;
    const stability_score = executiveState.stability_score || 0;
    const convergence_strength = executiveState.convergence_strength || 0;
    
    // 1. Persistence continuity — how consistently does the same region dominate
    let continuity_score = 0;
    let persistent_regions = [];
    
    if (history.length >= 3) {
        const recent_domains = history.slice(-Math.min(history.length, 10)).map(h => h.dominant_region).filter(Boolean);
        if (recent_domains.length > 0) {
            // Count occurrences of each region
            const region_counts = {};
            recent_domains.forEach(r => { region_counts[r] = (region_counts[r] || 0) + 1; });
            const max_count = Math.max(...Object.values(region_counts));
            continuity_score = max_count / recent_domains.length;
            persistent_regions = Object.entries(region_counts)
                .filter(([, count]) => count >= Math.ceil(recent_domains.length * 0.4))
                .map(([region]) => region);
        }
    }
    
    // 2. Survivability — can the region survive interruptions?
    let survivability_score = 0;
    let survivability_regions = [];
    
    if (history.length >= SURVIVABILITY_WINDOW) {
        // Check if dominant region re-emerges after being interrupted
        const last_domains = history.slice(-SURVIVABILITY_WINDOW).map(h => h.dominant_region);
        if (last_domains.length >= 3) {
            // Count how many times the most recent region appears
            const last_region = last_domains[last_domains.length - 1];
            const appearances = last_domains.filter(r => r === last_region).length;
            survivability_score = appearances / last_domains.length;
            if (survivability_score >= 0.6) {
                survivability_regions = [last_region];
            }
        }
    }
    
    // 3. Interruption resistance — does convergence hold through disruptions?
    let interruption_resistance_score = 0;
    let interruption_resistance_regions = [];
    
    if (history.length >= 5) {
        // Look for recovery patterns — region returns after being displaced
        const regions_seen = {};
        let recoveries = 0;
        let disruptions = 0;
        
        for (let i = 1; i < history.length; i++) {
            const prev = history[i - 1].dominant_region;
            const curr = history[i].dominant_region;
            if (prev && curr && prev !== curr) {
                disruptions++;
                // Check if prev region reappears within 3 steps
                const future = history.slice(i + 1, i + 4).map(h => h.dominant_region);
                if (future.includes(prev)) recoveries++;
            }
        }
        
        interruption_resistance_score = disruptions > 0 ? recoveries / disruptions : 1;
        if (interruption_resistance_score >= 0.5 && persistent_regions.length > 0) {
            interruption_resistance_regions = persistent_regions;
        }
    }
    
    // 4. Decay detection — is persistence weakening?
    let decay_score = 0;
    let decay_regions = [];
    
    if (history.length >= DECAY_WINDOW) {
        const recent = history.slice(-DECAY_WINDOW);
        const early = history.slice(0, Math.min(DECAY_WINDOW, history.length));
        
        // Compare continuity in early vs late
        const early_regions = early.map(h => h.dominant_region).filter(Boolean);
        const late_regions = recent.map(h => h.dominant_region).filter(Boolean);
        
        if (early_regions.length > 0 && late_regions.length > 0) {
            const early_counts = {};
            early_regions.forEach(r => { early_counts[r] = (early_counts[r] || 0) + 1; });
            const late_counts = {};
            late_regions.forEach(r => { late_counts[r] = (late_counts[r] || 0) + 1; });
            
            const early_top = Object.entries(early_counts).sort((a, b) => b[1] - a[1])[0];
            const late_top = Object.entries(late_counts).sort((a, b) => b[1] - a[1])[0];
            
            if (early_top && late_top) {
                const early_score = early_top[1] / early_regions.length;
                const late_score = late_top[1] / late_regions.length;
                decay_score = Math.max(0, early_score - late_score); // Positive = decay
                if (decay_score > 0.2) {
                    decay_regions = [late_top[0]];
                }
            }
        }
    }
    
    // 5. Consolidation score
    const consolidation_score = (continuity_score * 0.4) + (survivability_score * 0.3) + (interruption_resistance_score * 0.3);
    
    return {
        continuity_score,
        persistence_score: consolidation_score,
        persistent_regions,
        survivability_score,
        survivability_regions,
        interruption_resistance_score,
        interruption_resistance_regions,
        decay_score,
        decay_regions,
        consolidation_score
    };
}

/**
 * Detect persistence decay chains — sustained weakening
 */
function detectDecayChains(history) {
    if (history.length < 5) return { chains_detected: false, decay_chain_length: 0, decaying_regions: [] };
    
    // Look for sustained downward trend in any region
    const regions = {};
    history.forEach(h => {
        if (h.dominant_region) {
            if (!regions[h.dominant_region]) regions[h.dominant_region] = [];
            regions[h.dominant_region].push(h.dominant_region === history.slice(-1)[0]?.dominant_region ? 1 : 0);
        }
    });
    
    let max_chain = 0;
    let decaying_region = null;
    
    for (const [region, appearances] of Object.entries(regions)) {
        // Find longest consecutive streak of not being dominant
        let current_streak = 0;
        let max_streak = 0;
        for (const val of appearances) {
            if (val === 0) { current_streak++; max_streak = Math.max(max_streak, current_streak); }
            else { current_streak = 0; }
        }
        if (max_streak > max_chain) { max_chain = max_streak; decaying_region = region; }
    }
    
    return {
        chains_detected: max_chain >= 3,
        decay_chain_length: max_chain,
        decaying_regions: max_chain >= 3 ? [decaying_region] : []
    };
}

/**
 * Detect persistence consolidation — strengthening over time
 */
function detectConsolidation(history) {
    if (history.length < 5) return { consolidation_detected: false, consolidation_score: 0, consolidating_regions: [] };
    
    const half = Math.floor(history.length / 2);
    const early = history.slice(0, half);
    const late = history.slice(half);
    
    const early_domains = early.map(h => h.dominant_region).filter(Boolean);
    const late_domains = late.map(h => h.dominant_region).filter(Boolean);
    
    if (early_domains.length === 0 || late_domains.length === 0) {
        return { consolidation_detected: false, consolidation_score: 0, consolidating_regions: [] };
    }
    
    // Check if late has fewer unique regions (consolidation)
    const early_unique = new Set(early_domains).size;
    const late_unique = new Set(late_domains).size;
    const consolidation_ratio = (early_unique - late_unique) / early_unique; // Positive = consolidating
    
    if (consolidation_ratio > 0.2) {
        // Find which region is consolidating
        const late_counts = {};
        late_domains.forEach(r => { late_counts[r] = (late_counts[r] || 0) + 1; });
        const top_region = Object.entries(late_counts).sort((a, b) => b[1] - a[1])[0]?.[0];
        
        return {
            consolidation_detected: true,
            consolidation_score: consolidation_ratio,
            consolidating_regions: [top_region].filter(Boolean)
        };
    }
    
    return { consolidation_detected: false, consolidation_score: 0, consolidating_regions: [] };
}

/**
 * Compute persistence drift profile from history
 */
function computeDriftProfile(history, persistenceHistory) {
    if (history.length < 3 || persistenceHistory.length < 3) {
        return { ...DRIFT_PROFILES.INDETERMINATE, reason: 'INSUFFICIENT_HISTORY' };
    }
    
    const recent_persistence = persistenceHistory.slice(-5).map(h => h.persistence_strength || 0.5);
    const early_avg = recent_persistence.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const late_avg = recent_persistence.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const drift = late_avg - early_avg;
    
    if (drift > 0.15) {
        return { ...DRIFT_PROFILES.STRENGTHENING, drift_magnitude: drift };
    } else if (drift < -0.15) {
        return { ...DRIFT_PROFILES.WEAKENING, drift_magnitude: Math.abs(drift) };
    } else if (Math.abs(drift) < 0.05) {
        const oscillations = recent_persistence.filter((v, i) => i > 0 && Math.abs(v - recent_persistence[i - 1]) > 0.15).length;
        if (oscillations >= 3) {
            return { ...DRIFT_PROFILES.OSCILLATING };
        }
        return { ...DRIFT_PROFILES.STABILIZING, drift_magnitude: 0 };
    } else {
        if (drift > 0) return { ...DRIFT_PROFILES.CONSOLIDATING, drift_magnitude: drift };
        else return { ...DRIFT_PROFILES.RECOVERING, drift_magnitude: Math.abs(drift) };
    }
}

// === EXPLICIT UNCERTAINTY BOUNDARIES ===

function computeUncertaintyBoundaries(persistenceMetrics, history) {
    const boundaries = [];
    
    // Continuity confidence
    if (history.length < PERSISTENCE_CONFIDENCE_MIN) {
        boundaries.push({
            type: 'CONTINUITY_INSUFFICIENT_HISTORY',
            description: 'Persistence continuity classification requires more history to establish confidence.',
            confidence: 'LOW',
            caveat: 'Current continuity score may not reflect long-term patterns.'
        });
    }
    
    // Survivability window
    if (history.length < SURVIVABILITY_WINDOW + 2) {
        boundaries.push({
            type: 'SURVIVABILITY_WINDOW_INSUFFICIENT',
            description: 'Survivability detection window is too short to confirm interruption resistance.',
            confidence: 'LOW',
            caveat: 'Region may appear stable but fail under larger interruptions.'
        });
    }
    
    // Decay detection
    if (persistenceMetrics.decay_score > 0 && persistenceMetrics.decay_score < 0.3) {
        boundaries.push({
            type: 'DECAY_AMBIGUOUS',
            description: 'Decay score is moderate — may indicate normal fluctuation rather than sustained decay.',
            confidence: 'MEDIUM',
            caveat: 'Decay classification may be invalidated by normal variation.'
        });
    }
    
    // Consolidation detection
    if (!persistenceMetrics.consolidation_score || persistenceMetrics.consolidation_score < 0.3) {
        boundaries.push({
            type: 'CONSOLIDATION_WEAK',
            description: 'Consolidation signal is weak. Persistence may be stable but not consolidating.',
            confidence: 'MEDIUM',
            caveat: 'Entrenchment may be occurring without active consolidation.'
        });
    }
    
    // Fragmentation interference
    if (persistenceMetrics.decay_regions.length > 0 && persistenceMetrics.persistence_score > 0.7) {
        boundaries.push({
            type: 'FRAGMENTATION_INTERFERENCE',
            description: 'Decay detected alongside high persistence score — fragmentation may be distorting persistence classification.',
            confidence: 'MEDIUM',
            caveat: 'True persistence durability may be lower than measured.'
        });
    }
    
    return boundaries;
}

// === PERSISTENCE STABILITY ASSESSMENT ===

function computeStabilityAssessment(persistenceMetrics, decayChains, consolidation) {
    const {
        continuity_score,
        survivability_score,
        interruption_resistance_score,
        decay_score,
        consolidation_score
    } = persistenceMetrics;
    
    // Composite stability
    let stability_score = 0.5;
    stability_score += continuity_score * 0.25;
    stability_score += survivability_score * 0.2;
    stability_score += interruption_resistance_score * 0.2;
    stability_score -= decay_score * 0.35;
    stability_score = Math.max(0, Math.min(1, stability_score));
    
    return {
        stability_score: Math.round(stability_score * 100) / 100,
        persistence_resilience: Math.round((continuity_score + survivability_score) / 2 * 100) / 100,
        continuity_stability: Math.round(continuity_score * 100) / 100,
        interruption_tolerance: Math.round(interruption_resistance_score * 100) / 100,
        coherence_survivability: Math.round(survivability_score * 100) / 100,
        fragmentation_resistance: Math.round(Math.max(0, 1 - decay_score) * 100) / 100,
        executive_retention_continuity: Math.round(consolidation_score * 100) / 100
    };
}

// === MAIN COMPUTATION ===

function computeExecutivePersistence(executiveState, history = [], persistenceHistory = []) {
    // Step 1: Compute persistence metrics
    const metrics = computePersistenceMetrics(executiveState, history);
    
    // Step 2: Detect decay chains
    const decayChains = detectDecayChains(history);
    
    // Step 3: Detect consolidation
    const consolidation = detectConsolidation(history);
    
    // Step 4: Compute drift profile
    const driftProfile = computeDriftProfile(history, persistenceHistory);
    
    // Step 5: Determine persistence state
    let persistence_state = PERSISTENCE_STATES.TRANSIENT.state;
    let persistence_strength = 0;
    
    // Entrenched: high continuity + high survivability + no decay + history > 10
    if (metrics.continuity_score > 0.7 && metrics.survivability_score > 0.6 && metrics.decay_score < 0.15 && history.length > 10) {
        persistence_state = PERSISTENCE_STATES.ENTRENCHED.state;
        persistence_strength = Math.min(1, 0.85 + (metrics.consolidation_score * 0.1));
    }
    // Consolidating: increasing continuity + consolidation detected
    else if (consolidation.consolidation_detected || metrics.continuity_score > 0.6) {
        persistence_state = PERSISTENCE_STATES.CONSOLIDATING.state;
        persistence_strength = Math.min(1, 0.6 + (metrics.continuity_score * 0.2) + (consolidation.consolidation_score * 0.1));
    }
    // Holding: moderate continuity, survivable
    else if (metrics.continuity_score > 0.4 || metrics.survivability_score > 0.5) {
        persistence_state = PERSISTENCE_STATES.HOLDING.state;
        persistence_strength = Math.min(1, 0.35 + (metrics.continuity_score * 0.3) + (metrics.survivability_score * 0.2));
    }
    // Transient: low continuity, high decay, short history
    else {
        persistence_state = PERSISTENCE_STATES.TRANSIENT.state;
        persistence_strength = Math.max(0, metrics.continuity_score * 0.5 - metrics.decay_score * 0.3);
    }
    
    // Step 6: Compute stability assessment
    const stabilityAssessment = computeStabilityAssessment(metrics, decayChains, consolidation);
    
    // Step 7: Compute uncertainty boundaries
    const uncertaintyBoundaries = computeUncertaintyBoundaries(metrics, history);
    
    // Step 8: Build persistence consolidation summary
    const persistenceConsolidationSummary = {
        consolidation_detected: consolidation.consolidation_detected,
        consolidation_score: consolidation.consolidation_score,
        consolidating_regions: consolidation.consolidating_regions,
        persistence_reinforcement: metrics.continuity_score > 0.5 && consolidation.consolidation_detected
    };
    
    // Step 9: Environmental persistence summary
    const environmental_persistence_summary = {
        candidate_count: executiveState.top_candidates?.length || 0,
        stability_score: executiveState.stability_score || 0,
        convergence_strength: executiveState.convergence_strength || 0,
        top_region: executiveState.dominant_region || null,
        persistence_score: metrics.persistence_score
    };
    
    // Step 10: Build result
    const result = {
        executive_persistence_state: persistence_state,
        persistence_strength: Math.round(persistence_strength * 100) / 100,
        persistent_executive_regions: metrics.persistent_regions,
        survivability_regions: metrics.survivability_regions,
        persistence_decay_regions: metrics.decay_regions.length > 0 ? metrics.decay_regions : (decayChains.decaying_regions || []),
        interruption_resistance_regions: metrics.interruption_resistance_regions,
        persistence_stability_assessment: stabilityAssessment,
        persistence_consolidation_summary: persistenceConsolidationSummary,
        persistence_drift_profile: {
            profile: driftProfile.profile,
            description: driftProfile.description,
            observation: driftProfile.observation,
            drift_magnitude: driftProfile.drift_magnitude || null
        },
        persistence_summary: {
            convergence_continuity: stabilityAssessment.continuity_stability,
            stable_regions: metrics.persistent_regions,
            weakening_regions: metrics.decay_regions,
            strengthening_regions: consolidation.consolidating_regions
        },
        uncertainty_boundaries: uncertaintyBoundaries,
        environmental_persistence_summary,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };
    
    return result;
}

// === PERSISTENCE ===

function savePersistenceState(persistenceState) {
    if (!fs.existsSync(STATE_DIR)) {
        fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    // Write current state
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(persistenceState, null, 2));
    
    // Append to history
    const historyEntry = {
        timestamp: persistenceState.generated_at,
        executive_persistence_state: persistenceState.executive_persistence_state,
        persistence_strength: persistenceState.persistence_strength,
        dominant_region: null,
        stability_score: persistenceState.persistence_stability_assessment?.stability_score
    };
    
    try {
        const existingHistory = fs.existsSync(PERSISTENCE_HISTORY_FILE)
            ? fs.readFileSync(PERSISTENCE_HISTORY_FILE, 'utf8').trim().split('\n').map(line => JSON.parse(line))
            : [];
        
        const updatedHistory = [...existingHistory, historyEntry].slice(-MAX_HISTORY);
        fs.writeFileSync(PERSISTENCE_HISTORY_FILE, updatedHistory.map(e => JSON.stringify(e)).join('\n') + '\n');
    } catch (e) {
        fs.appendFileSync(PERSISTENCE_HISTORY_FILE, JSON.stringify(historyEntry) + '\n');
    }
    
    // Audit log
    const auditEntry = {
        timestamp: persistenceState.generated_at,
        type: 'EXECUTIVE_PERSISTENCE_COMPUTED',
        state: persistenceState.executive_persistence_state,
        strength: persistenceState.persistence_strength,
        drift: persistenceState.persistence_drift_profile?.profile
    };
    fs.appendFileSync(AUDIT_LOG, JSON.stringify(auditEntry) + '\n');
}

// === CLI ===

if (require.main === module) {
    const executiveFocusFile = path.join(STATE_DIR, 'executive-focus.json');
    const executiveHistoryFile = path.join(STATE_DIR, 'executive-focus-history.jsonl');
    const persistenceHistoryFile = PERSISTENCE_HISTORY_FILE;
    
    try {
        const executiveState = fs.existsSync(executiveFocusFile)
            ? JSON.parse(fs.readFileSync(executiveFocusFile, 'utf8'))
            : { state: 'INCIDENTAL', top_candidates: [], stability_score: 0.5, convergence_strength: 0.5 };
        
        let history = [];
        if (fs.existsSync(executiveHistoryFile)) {
            history = fs.readFileSync(executiveHistoryFile, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        let persistenceHistory = [];
        if (fs.existsSync(persistenceHistoryFile)) {
            persistenceHistory = fs.readFileSync(persistenceHistoryFile, 'utf8').trim().split('\n').map(line => {
                try { return JSON.parse(line); } catch { return {}; }
            });
        }
        
        const persistenceState = computeExecutivePersistence(executiveState, history, persistenceHistory);
        savePersistenceState(persistenceState);
        
        console.log(JSON.stringify(persistenceState, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

module.exports = {
    computeExecutivePersistence,
    savePersistenceState,
    PERSISTENCE_STATES,
    DRIFT_PROFILES
};