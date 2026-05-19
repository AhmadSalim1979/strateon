/**
 * Priority Explanation Layer — MCAI Phase 4B
 * SHADOW-ONLY: Explanation without action authority
 * 
 * This module generates human-readable explanations for priority perception records.
 * It explains WHY something appears important — NOT what should be done about it.
 * 
 * NO execution authority. NO autonomous actions. NO recommendations. NO remediation.
 * 
 * Explanation output does NOT influence behavior.
 */

const path = require('path');
const STATE_DIR = path.join(__dirname, '..', '..', 'state');
const AUDIT_LOG = path.join(STATE_DIR, 'priority-audit.log');

// === CATEGORY EXPLANATIONS ===

const CATEGORY_EXPLANATIONS = {
    STABLE: {
        summary: 'Entity appears stable based on current observation window.',
        description: 'The entity has exhibited consistent, predictable behavior with low rates of instability, contradiction, or verification failure. No significant drift patterns were detected.',
        interpretation: 'Current operational state is nominal. No acute concerns observed.',
        uncertainty_note: 'Stability assessment is based on available evidence and may not reflect latent issues not captured in the observation window.'
    },
    WATCH: {
        summary: 'Entity warrants passive observation due to emerging mild instabilities.',
        description: 'The entity has shown some signs of mild instability, occasional contradictions, or minor verification failures. Patterns do not yet indicate acute dysfunction but merit attention.',
        interpretation: 'Situation is marginal. Not yet concerning but should be monitored during routine operations.',
        uncertainty_note: 'Watch category may reflect transient conditions rather than structural issues. Confidence increases with observation window length.'
    },
    DEGRADED: {
        summary: 'Entity is experiencing measurable instability or degradation.',
        description: 'The entity has exhibited elevated rates of state transitions to unstable states, recurring verification failures, contradictions, or commitment expirations. The pattern is consistent but not yet severe.',
        interpretation: 'Operational quality is reduced. Degraded state indicates measurable deviation from nominal performance.',
        uncertainty_note: 'Degradation may be temporary (e.g., recovery in progress) or结构性. Additional observation needed for confident classification.'
    },
    VOLATILE: {
        summary: 'Entity exhibits significant instability with frequent state changes.',
        description: 'The entity has shown high rates of unstable state transitions, significant contradictions, frequent verification failures, and elevated scores across multiple instability metrics. The pattern is persistent and measurable.',
        interpretation: 'Operational reliability is significantly compromised. Volatile state indicates high probability of further instability.',
        uncertainty_note: 'Volatile classification is based on observed patterns. Underlying cause (structural vs. transient) requires deeper analysis outside this layer.'
    },
    CRITICAL_PATTERN: {
        summary: 'Entity exhibits critical patterns warranting heightened scrutiny.',
        description: 'The entity has triggered critical pattern markers: high commitment expirations, repeated verification failures, or frequent status flips. These patterns suggest systemic stress or governance-relevant concerns that exceed normal volatility thresholds.',
        interpretation: 'Critical patterns indicate conditions that warrant human operator awareness. This classification does not constitute an emergency response requirement.',
        uncertainty_note: 'Critical pattern detection is based on threshold crossing. False positive classification is possible if environmental factors (e.g., service restarts) artificially trigger markers.'
    }
};

// === DRIFT PATTERN EXPLANATIONS ===

const DRIFT_EXPLANATIONS = {
    INSUFFICIENT_DATA: {
        summary: 'Insufficient historical data to determine drift direction.',
        description: 'The entity has fewer than the minimum required observation points to establish a meaningful trend. Drift assessment is indeterminate.',
        interpretation: 'Trend cannot be reliably determined with current data. More observations needed before drift can be characterized.',
        uncertainty_note: 'INSUFFICIENT_DATA is a data limitation, not a stability statement. Entity may be stable, escalating, or recovering — cannot determine from current evidence.'
    },
    ESCALATING_INSTABILITY: {
        summary: 'Entity is trending toward increasing instability over the observation window.',
        description: 'Recent observations show a statistically meaningful increase in instability metrics compared to earlier observations. The direction of change is upward — more instability is present in recent data relative to earlier data. The escalation rate is measurable based on the observation window.',
        interpretation: 'The entity is becoming progressively less stable over time. Escalation rate reflects observable trend direction, not cause. Underlying factors driving the escalation are not determined by this layer.',
        uncertainty_note: 'Escalation is measured over the observation window. The pattern may reflect environmental factors, load conditions, or structural issues. Do not extrapolate linearly — escalation rate may change, accelerate, or reverse in future observation periods.'
    },
    RECOVERING_STABILITY: {
        summary: 'Entity is trending toward decreasing instability over the observation window.',
        description: 'Recent observations show a statistically meaningful decrease in instability metrics compared to earlier observations. The direction of change is downward — less instability is present in recent data relative to earlier data. Recovery trajectory is observable but completion cannot be assured.',
        interpretation: 'The entity appears to be in a period of improving stability. Recovery is measurable but may be partial, temporary, or subject to reversal by future conditions.',
        uncertainty_note: 'Recovery may be interrupted by future events. Current trajectory does not guarantee sustained improvement. External factors or load changes may reverse the observed improvement without warning.'
    },
    OSCILLATING: {
        summary: 'Entity exhibits repeating instability cycles without clear directional trend.',
        description: 'The entity shows a repeating pattern of instability followed by recovery, followed by renewed instability. The cycle is measurable and consistent within the observation window.',
        interpretation: 'The entity is in a cyclic state with no clear directional improvement or degradation. Oscillation may indicate feedback loop, environmental cycling, or unresolved root cause.',
        uncertainty_note: 'Oscillation pattern is based on historical window. Pattern may change (stabilize, escalate, or dampen) in future observation periods. Do not assume the cycle will continue indefinitely.'
    },
    STABLE_TREND: {
        summary: 'Entity maintains consistent instability levels with no significant directional change.',
        description: 'The entity has shown stable instability metrics across the observation window. No meaningful escalation or recovery trend is detectable. Levels are consistent but not necessarily optimal.',
        interpretation: 'The entity is in a steady state. Stability does not imply that the current state is desirable — only that it is consistent.',
        uncertainty_note: 'Stable trend is measured across the observation window. The entity may be appropriately stable or inappropriately stagnant — this explanation does not distinguish between these cases.'
    }
};

// === SCORE BREAKDOWN EXPLANATIONS ===

/**
 * Generate explanation for a single score component.
 * @param {string} component - Score component name
 * @param {number} value - Component value (0-1)
 * @returns {Object} Component explanation
 */
function explainScoreComponent(component, value) {
    const pct = Math.round(value * 100);
    const explanations = {
        recurrence_frequency: {
            high: `Entity has been observed ${pct}% of maximum expected frequency. High recurrence indicates repeated encounters across the observation window.`,
            medium: `Entity has been observed ${pct}% of maximum expected frequency. Moderate recurrence suggests periodic but not persistent presence.`,
            low: `Entity has been observed ${pct}% of maximum expected frequency. Low recurrence indicates infrequent encounters in the observation window.`
        },
        instability_persistence: {
            high: `${pct}% of state transitions involved unstable states (DEGRADED, STALLED, CRITICAL, or FAILED). High persistence indicates a strong pattern of instability once a state change begins.`,
            medium: `${pct}% of state transitions involved unstable states. Moderate persistence suggests instability is present but not dominant in state behavior.`,
            low: `${pct}% of state transitions involved unstable states. Low persistence indicates that when state changes occur, they rarely involve unstable states.`
        },
        contradiction_density: {
            high: `${pct}% of observations contained contradictions. High density indicates that contradictions are frequent relative to total observations. This may reflect information conflicts or belief instability in the entity's reported state.`,
            medium: `${pct}% of observations contained contradictions. Moderate density suggests contradictions occur occasionally but are not dominant in the entity's behavior profile during the observation window.`,
            low: `${pct}% of observations contained contradictions. Low density indicates that contradictions are rare for this entity in the current observation window.`
        },
        stale_evidence_accumulation: {
            high: `${pct}% of verifications returned stale results. High stale evidence rate indicates that verification freshness is frequently compromised, which may affect the reliability of current state assessments.`,
            medium: `${pct}% of verifications returned stale results. Moderate stale rate suggests occasional verification delays but not a systematic freshness problem.`,
            low: `${pct}% of verifications returned stale results. Low stale rate indicates that verifications are typically fresh and current.`
        },
        verification_failure_recurrence: {
            high: `${pct}% of verifications failed. High failure recurrence indicates that verification attempts frequently do not produce valid results, which may reflect underlying reliability issues with the entity's reporting or state management.`,
            medium: `${pct}% of verifications failed. Moderate failure rate suggests verification sometimes fails but the entity generally produces results for verification attempts during the observation window.`,
            low: `${pct}% of verifications failed. Low failure rate indicates that verifications generally succeed for this entity in the current observation window.`
        }
    };

    const tier = value >= 0.7 ? 'high' : value >= 0.3 ? 'medium' : 'low';
    return {
        component,
        value,
        percentage: pct,
        explanation: explanations[component]?.[tier] || `Component value is ${pct}% of maximum.`
    };
}

// === ENTITY EXPLANATION ===

/**
 * Generate full explanation for a single perception record.
 * @param {Object} perception - Perception record from priority-perception.js
 * @returns {Object} Explanation object
 */
function explainPerception(perception) {
    const { entity_id, category, score, score_breakdown, drift, observation_counts } = perception;

    // Get category explanation
    const catExpl = CATEGORY_EXPLANATIONS[category] || CATEGORY_EXPLANATIONS.STABLE;

    // Get drift explanation
    const driftExpl = DRIFT_EXPLANATIONS[drift?.pattern] || DRIFT_EXPLANATIONS.INSUFFICIENT_DATA;

    // Sort contributing factors by value descending (most impactful first)
    const sortedComponents = Object.entries(score_breakdown || {})
        .sort((a, b) => b[1] - a[1])
        .map(([component, value]) => ({ component, value }));

    const contributing_factors = sortedComponents
        .filter(entry => entry.value > 0.1)
        .map(({ component, value }) => {
            const compExpl = explainScoreComponent(component, value);
            return {
                factor: component.replace(/_/g, ' '),
                contribution: `${Math.round(value * 100)}% of total score`,
                detail: compExpl.explanation
            };
        });

    // Generate uncertainty factors
    const limiting_uncertainties = [];

    // Insufficient history uncertainty
    if (drift.pattern === 'INSUFFICIENT_DATA') {
        limiting_uncertainties.push({
            factor: 'Limited observation history',
            impact: 'Drift direction cannot be reliably determined. Current category and score may change as more data accumulates.'
        });
    }

    // Short observation window uncertainty
    if (perception.window === '1h' && perception.observation_counts.occurrences < 5) {
        limiting_uncertainties.push({
            factor: 'Short observation window',
            impact: '1-hour window may capture transient behavior rather than sustained patterns. Category confidence is reduced for short windows with few observations.'
        });
    }

    // Single category uncertainty (no drift data)
    if (Object.keys(observation_counts || {}).reduce((sum, k) => sum + (observation_counts[k] || 0), 0) === 0) {
        limiting_uncertainties.push({
            factor: 'No observation events in window',
            impact: 'Perception is based on absence of events, not active observation. Category reflects lack of instability signals, not confirmed stability.'
        });
    }

    // Score near boundary uncertainty
    if (score >= 0.35 && score <= 0.45) {
        limiting_uncertainties.push({
            factor: 'Score near WATCH/DEGRADED boundary',
            impact: 'Score is in the overlap zone between WATCH and DEGRADED categories. Small changes in observation could shift category assignment.'
        });
    }

    // Build evidence references
    const evidence_refs = [];
    if (observation_counts?.occurrences > 0) {
        evidence_refs.push(`${observation_counts.occurrences} occurrence(s) observed`);
    }
    if (observation_counts?.contradictions > 0) {
        evidence_refs.push(`${observation_counts.contradictions} contradiction(s) detected`);
    }
    if (observation_counts?.status_flips > 0) {
        evidence_refs.push(`${observation_counts.status_flips} status flip(s) detected`);
    }
    if (observation_counts?.verification_failures > 0) {
        evidence_refs.push(`${observation_counts.verification_failures} verification failure(s)`);
    }
    if (observation_counts?.commitment_expirations > 0) {
        evidence_refs.push(`${observation_counts.commitment_expirations} commitment expiration(s)`);
    }
    if (observation_counts?.degraded_periods > 0) {
        evidence_refs.push(`${observation_counts.degraded_periods} degraded period(s)`);
    }
    if (observation_counts?.unstable_state_changes > 0) {
        evidence_refs.push(`${observation_counts.unstable_state_changes} unstable state transition(s)`);
    }

    // Generate human-readable explanation
    const explanation = [
        catExpl.summary,
        catExpl.description,
        driftExpl.summary,
        driftExpl.description
    ].filter(Boolean).join(' ');

    const result = {
        entity_id,
        category,
        score: Math.round(score * 1000) / 1000,
        explanation,
        contributing_factors,
        limiting_uncertainties,
        evidence_refs,
        drift_pattern: drift?.pattern || 'UNKNOWN',
        drift_trend: drift?.trend || null,
        drift_delta: drift?.delta || 0,
        window: perception.window,
        generated_at: new Date().toISOString(),
        shadow_only: true
    };

    return result;
}

/**
 * Explain multiple perceptions (batch).
 * @param {Array} perceptions - Array of perception records
 * @returns {Array} Array of explanation objects
 */
function explainPerceptions(perceptions) {
    return perceptions.map(p => explainPerception(p));
}

/**
 * Append explanation event to audit log.
 * @param {Object} explanation - Explanation object
 */
function logExplanation(explanation) {
    try {
        const entry = {
            timestamp: new Date().toISOString(),
            phase: 'MCAI-4B',
            audit_action: 'explanation_generated',
            entity_id: explanation.entity_id,
            category: explanation.category,
            score: explanation.score,
            drift_pattern: explanation.drift_pattern,
            ...explanation
        };
        // Remove circular references before logging
        const logEntry = JSON.parse(JSON.stringify(entry));
        fs.appendFileSync(AUDIT_LOG, JSON.stringify(logEntry) + '\n');
    } catch (err) {
        console.error('[priority-explanation] Failed to log explanation:', err.message);
    }
}

/**
 * Generate a narrative summary for a perception array.
 * @param {Array} perceptions - Array of perception records
 * @returns {string} Human-readable narrative
 */
function generateNarrative(perceptions) {
    const sorted = [...perceptions].sort((a, b) => b.score - a.score);

    const lines = [];
    lines.push('=== Priority Perception Narrative ===');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Entities observed: ${perceptions.length}`);
    lines.push('');

    const categories = {};
    for (const p of sorted) {
        categories[p.category] = (categories[p.category] || 0) + 1;
    }

    lines.push('Category distribution:');
    for (const [cat, count] of Object.entries(categories)) {
        lines.push(`  ${cat}: ${count} entity(ies)`);
    }
    lines.push('');

    const highPriority = sorted.filter(p => p.score >= 0.4);
    if (highPriority.length > 0) {
        lines.push('Entities with elevated priority scores:');
        for (const p of highPriority) {
            lines.push(`  [${p.category}] ${p.entity_id} (score: ${p.score})`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

const fs = require('fs');

module.exports = {
    explainPerception,
    explainPerceptions,
    explainScoreComponent,
    logExplanation,
    generateNarrative,
    CATEGORY_EXPLANATIONS,
    DRIFT_EXPLANATIONS
};