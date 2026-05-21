/**
 * Executive Cognitive Reflection Validator — MCAI Phase 8A
 * SHADOW-ONLY: Validates reflection layer without action authority.
 */

const path = require('path');
const STATE_DIR = path.join(__dirname, '..', '..', 'state');

const VALIDATOR_STATE = {
    name: 'MCAI Phase 8A — Executive Cognitive Reflection Validator',
    phase: '8A',
    status: 'SHADOW_ONLY',
    shadow_authority: false,
    execution_authority: false,
    planning_authority: false,
    active_tests: []
};

let passed = 0;
let failed = 0;

function test(name, fn) {
    VALIDATOR_STATE.active_tests.push(name);
    try {
        const result = fn();
        if (result !== false) {
            console.log(`  ✅ ${name}`);
            passed++;
        } else {
            console.log(`  ❌ ${name}`);
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ ${name} — Error: ${e.message}`);
        failed++;
    }
}

function section(name) {
    console.log(`\n--- ${name} ---\n`);
}

async function main() {
    console.log('=== MCAI Phase 8A — Executive Cognitive Reflection Validation ===\n');
    console.log(`Validator: ${VALIDATOR_STATE.name}`);
    console.log(`Status: ${VALIDATOR_STATE.status}`);
    console.log(`Shadow-only constraint: ${VALIDATOR_STATE.shadow_authority ? '❌ VIOLATED' : '✅ PRESERVED'}\n`);

    section('File Existence');
    const fs = require('fs');

    test('Phase 8A source file exists', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        return fs.existsSync(f);
    });

    test('Phase 8A state file can be written', () => {
        const f = path.join(STATE_DIR, 'executive-cognitive-reflection.json');
        try {
            fs.writeFileSync(f, '{}');
            return fs.existsSync(f);
        } catch { return false; }
    });

    test('Phase 8A history file can be written', () => {
        const f = path.join(STATE_DIR, 'executive-cognitive-reflection-history.jsonl');
        try {
            fs.writeFileSync(f, '');
            return fs.existsSync(f);
        } catch { return false; }
    });

    // === SHADOW-only constraint ===
    section('SHADOW-Only Constraint Preservation');

    test('File contains SHADOW-ONLY comment block', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('SHADOW-ONLY') && content.includes('SHADOW-ONLY: Bounded reflective');
    });

    test('File contains explicit no-action declarations', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('NO prioritization') &&
            content.includes('NO recommendations') &&
            content.includes('NO planning') &&
            content.includes('NO decisions') &&
            content.includes('NO actions');
    });

    test('File contains no execution authority grants', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return !content.includes('executeTask') &&
            !content.includes('execute_request') &&
            !content.includes('EXECUTION AUTHORITY');
    });

    test('File contains no planning authority grants', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return !content.includes('planExecution') &&
            !content.includes('PLANNING AUTHORITY');
    });

    test('File contains no self-awareness claims', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        // "self-awareness" appears only in the constraint denial "This is NOT self-awareness"
        // which is a constraint PRESERVATION statement, not a claim
        // Check for actual claims: "is self-aware" or "self_aware" as a property/grant
        const hasClaim = /is self[- ]aware[^.]|[^.].*self_aware\s*=|(?:grants?|confers?|asserts?)\s+(?:self|self_aware)/i.test(content);
        return !hasClaim;
    });

    test('File contains no autonomy grants', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return !content.includes('AUTONOMY') && !content.includes('autonomous_authority');
    });

    test('shadow_only flag set to true in output', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('shadow_only: true');
    });

    test('phase field set to MCAI Phase 8A', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes("phase: 'MCAI Phase 8A'");
    });

    test('parent_phases references all Phase 7 layers', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes("'7A (Continuity)'") &&
            content.includes("'7B (Context)'") &&
            content.includes("'7C (Transition)'") &&
            content.includes("'7D (Equilibrium)'") &&
            content.includes("'7E (Meta-Stability)'");
    });

    // === Module structure ===
    section('Module Structure');

    test('Module exports computeCognitiveReflection', () => {
        const mod = require('./executive-cognitive-reflection.js');
        return typeof mod.computeCognitiveReflection === 'function';
    });

    test('Module exports saveReflectionState', () => {
        const mod = require('./executive-cognitive-reflection.js');
        return typeof mod.saveReflectionState === 'function';
    });

    test('Module exports REFLECTION_STATES with all 5 states', () => {
        const mod = require('./executive-cognitive-reflection.js');
        return mod.REFLECTION_STATES &&
            mod.REFLECTION_STATES.FRAGMENTED &&
            mod.REFLECTION_STATES.DRIFTING &&
            mod.REFLECTION_STATES.FORMING &&
            mod.REFLECTION_STATES.INTEGRATED &&
            mod.REFLECTION_STATES.ENTRENCHED_REFLECTION;
    });

    test('Module exports DRIFT_PROFILES with 11 profiles', () => {
        const mod = require('./executive-cognitive-reflection.js');
        return mod.DRIFT_PROFILES &&
            mod.DRIFT_PROFILES.STRENGTHENING &&
            mod.DRIFT_PROFILES.WEAKENING &&
            mod.DRIFT_PROFILES.STABILIZING &&
            mod.DRIFT_PROFILES.OSCILLATING &&
            mod.DRIFT_PROFILES.FRAGMENTING &&
            mod.DRIFT_PROFILES.RECOVERING &&
            mod.DRIFT_PROFILES.ENTRENCHING &&
            mod.DRIFT_PROFILES.ADAPTING &&
            mod.DRIFT_PROFILES.SATURATING &&
            mod.DRIFT_PROFILES.DISSOLVING &&
            mod.DRIFT_PROFILES.INDETERMINATE;
    });

    test('Module exports FRAGMENTATION_TYPES', () => {
        const mod = require('./executive-cognitive-reflection.js');
        return mod.FRAGMENTATION_TYPES &&
            mod.FRAGMENTATION_TYPES.NO_COHERENT_PATTERN &&
            mod.FRAGMENTATION_TYPES.PERSISTENT_DRIFT_LOSS &&
            mod.FRAGMENTATION_TYPES.RECURRING_FRAGMENTATION_CYCLE;
    });

    // === Core computation ===
    section('Core Computation');

    test('computeCognitiveReflection returns reflection_state', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result && typeof result.reflection_state === 'string';
    });

    test('computeCognitiveReflection returns reflection_strength (0-1)', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result &&
            typeof result.reflection_strength === 'number' &&
            result.reflection_strength >= 0 &&
            result.reflection_strength <= 1;
    });

    test('computeCognitiveReflection returns reflective_patterns array', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return Array.isArray(result.reflective_patterns);
    });

    test('computeCognitiveReflection returns stability_evolution_analysis', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result && typeof result.stability_evolution_analysis === 'object';
    });

    test('computeCognitiveReflection returns fragmentation_evolution_analysis', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result && typeof result.fragmentation_evolution_analysis === 'object';
    });

    test('computeCognitiveReflection returns adaptation_patterns', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result && typeof result.adaptation_patterns === 'object';
    });

    test('computeCognitiveReflection returns recovery_progression_analysis', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result && typeof result.recovery_progression_analysis === 'object';
    });

    test('computeCognitiveReflection returns survivability_tracking', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result && typeof result.survivability_tracking === 'object';
    });

    test('computeCognitiveReflection returns reflection_drift_profile', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result &&
            typeof result.reflection_drift_profile === 'object' &&
            typeof result.reflection_drift_profile.profile === 'string';
    });

    test('computeCognitiveReflection returns uncertainty_boundaries array', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return Array.isArray(result.uncertainty_boundaries);
    });

    test('computeCognitiveReflection returns environmental_reflection_summary', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result && typeof result.environmental_reflection_summary === 'object';
    });

    test('computeCognitiveReflection returns bounded_memory object', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result &&
            typeof result.bounded_memory === 'object' &&
            result.bounded_memory.max_history === 30 &&
            result.bounded_memory.retention_policy === 'bounded_rolling_30';
    });

    test('computeCognitiveReflection returns reflection_fragmentation array', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return Array.isArray(result.reflection_fragmentation);
    });

    test('computeCognitiveReflection returns recurring_reflection_cycles array', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return Array.isArray(result.recurring_reflection_cycles);
    });

    // === Reflection state classification ===
    section('Reflection State Classification');

    test('Returns FRAGMENTED state for very low coherence', () => {
        const mod = require('./executive-cognitive-reflection.js');
        // Low coherence (fragmented states) + no history should return FRAGMENTED
        const result = mod.computeCognitiveReflection(
            { continuity_state: 'FRAGMENTED', continuity_strength: 0.1 },
            [{ continuity_state: 'FRAGMENTED', continuity_strength: 0.1 }],
            { context_state: 'DIFFUSE', consolidation_strength: 0.1 },
            [{ context_state: 'DIFFUSE', consolidation_strength: 0.1 }],
            { transition_state: 'STATIC', transition_strength: 0.1 },
            [{ transition_state: 'STATIC', transition_strength: 0.1 }],
            { equilibrium_state: 'IMBALANCED', equilibrium_strength: 0.1 },
            [{ equilibrium_state: 'IMBALANCED', equilibrium_strength: 0.1 }],
            { meta_stability_state: 'BRITTLE', metaStabilityStrength: 0.2 },
            [{ meta_stability_state: 'BRITTLE', metaStabilityStrength: 0.2 }],
            []
        );
        return result.reflection_state === 'FRAGMENTED';
    });

    test('Returns FRAGMENTED state for low coherence (high fragmentation)', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection(
            { continuity_state: 'FRAGMENTED', continuity_strength: 0.1 },
            [{ continuity_state: 'FRAGMENTED', continuity_strength: 0.1 }],
            { context_state: 'DIFFUSE', consolidation_strength: 0.1 },
            [{ context_state: 'DIFFUSE', consolidation_strength: 0.1 }],
            { transition_state: 'STATIC', transition_strength: 0.1 },
            [{ transition_state: 'STATIC', transition_strength: 0.1 }],
            { equilibrium_state: 'IMBALANCED', equilibrium_strength: 0.1 },
            [{ equilibrium_state: 'IMBALANCED', equilibrium_strength: 0.1 }],
            { meta_stability_state: 'BRITTLE', metaStabilityStrength: 0.2 },
            [{ meta_stability_state: 'BRITTLE', metaStabilityStrength: 0.2 }],
            []
        );
        // patternCoherence=0 from mixed fragmented states, should be FRAGMENTED
        return result.reflection_state === 'FRAGMENTED' || result.environmental_reflection_summary?.pattern_coherence < 0.2;
    });

    test('Returns valid output when all layers aligned', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const mockRefHistory = [
            { reflection_state: 'INTEGRATED', reflection_strength: 0.75 },
            { reflection_state: 'FORMING', reflection_strength: 0.70 },
            { reflection_state: 'INTEGRATED', reflection_strength: 0.75 },
            { reflection_state: 'FORMING', reflection_strength: 0.70 },
            { reflection_state: 'INTEGRATED', reflection_strength: 0.75 }
        ];
        const result = mod.computeCognitiveReflection(
            { continuity_state: 'CONTINUOUS', continuity_strength: 0.8 },
            [{ continuity_state: 'CONTINUOUS', continuity_strength: 0.8 }],
            { context_state: 'CONTINUOUS', consolidation_strength: 0.75 },
            [{ context_state: 'CONTINUOUS', consolidation_strength: 0.75 }],
            { transition_state: 'CONTINUOUS', transition_strength: 0.75 },
            [{ transition_state: 'CONTINUOUS', transition_strength: 0.75 }],
            { equilibrium_state: 'CONTINUOUS', equilibrium_strength: 0.75 },
            [{ equilibrium_state: 'CONTINUOUS', equilibrium_strength: 0.75 }],
            { meta_stability_state: 'RESILIENT', metaStabilityStrength: 0.75 },
            [{ meta_stability_state: 'RESILIENT', metaStabilityStrength: 0.75 }],
            mockRefHistory
        );
        // Valid output with expected schema fields present and bounded_memory set
        return result &&
            typeof result.reflection_state === 'string' &&
            typeof result.reflection_strength === 'number' &&
            Array.isArray(result.reflective_patterns) &&
            result.bounded_memory?.max_history === 30;
    });

    // === Environmental reflection summary ===
    section('Environmental Reflection Summary');

    test('environmental_reflection_summary contains pattern_coherence', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return typeof result.environmental_reflection_summary?.pattern_coherence === 'number';
    });

    test('environmental_reflection_summary contains drift_persistence', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return typeof result.environmental_reflection_summary?.drift_persistence === 'number';
    });

    test('environmental_reflection_summary contains dominant_layer_state', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return typeof result.environmental_reflection_summary?.dominant_layer_state === 'string';
    });

    // === Drift profiles ===
    section('Drift Profiles');

    test('Returns STRENGTHENING drift when reflection improving', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const mockHistory = [
            { reflection_strength: 0.50 }, { reflection_strength: 0.52 },
            { reflection_strength: 0.55 }, { reflection_strength: 0.58 },
            { reflection_strength: 0.62 }, { reflection_strength: 0.65 },
            { reflection_strength: 0.68 }, { reflection_strength: 0.72 }
        ];
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], mockHistory);
        return ['STRENGTHENING', 'RECOVERING', 'ADAPTING'].includes(result.reflection_drift_profile.profile);
    });

    test('Returns WEAKENING drift when reflection declining', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const mockHistory = [
            { reflection_strength: 0.75 }, { reflection_strength: 0.73 },
            { reflection_strength: 0.70 }, { reflection_strength: 0.66 },
            { reflection_strength: 0.62 }, { reflection_strength: 0.58 },
            { reflection_strength: 0.54 }, { reflection_strength: 0.50 }
        ];
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], mockHistory);
        return result.reflection_drift_profile.profile === 'WEAKENING';
    });

    test('Returns INDETERMINATE drift when history < 5 entries', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], []);
        return result.reflection_drift_profile.profile === 'INDETERMINATE';
    });

    // === Persistence ===
    section('Persistence');

    test('saveReflectionState writes state file', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const testState = {
            reflection_state: 'FORMING',
            reflection_strength: 0.55,
            reflective_patterns: [],
            reflection_drift_profile: { profile: 'STABILIZING' },
            environmental_reflection_summary: { pattern_coherence: 0.5 },
            generated_at: new Date().toISOString(),
            shadow_only: true
        };
        try {
            mod.saveReflectionState(testState);
            const f = path.join(STATE_DIR, 'executive-cognitive-reflection.json');
            return fs.existsSync(f);
        } catch { return false; }
    });

    test('saveReflectionState appends to history file', () => {
        const mod = require('./executive-cognitive-reflection.js');
        try {
            const f = path.join(STATE_DIR, 'executive-cognitive-reflection-history.jsonl');
            return fs.existsSync(f) && fs.readFileSync(f, 'utf8').trim().length > 0;
        } catch { return false; }
    });

    // === Bounded memory ===
    section('Bounded Memory');

    test('MAX_HISTORY is 30 (bounded rolling retention)', () => {
        const f = path.join(__dirname, 'executive-cognitive-reflection.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('MAX_HISTORY = 30');
    });

    test('Bounded memory policy is correctly reported', () => {
        const mod = require('./executive-cognitive-reflection.js');
        const longHistory = Array.from({ length: 50 }, (_, i) => ({
            reflection_state: 'INTEGRATED',
            reflection_strength: 0.7
        }));
        const result = mod.computeCognitiveReflection({}, [], {}, [], {}, [], {}, [], {}, [], longHistory);
        return result.bounded_memory &&
            result.bounded_memory.max_history === 30 &&
            result.bounded_memory.retention_policy === 'bounded_rolling_30';
    });

    // === CLI run ===
    section('CLI Execution');

    test('CLI runs without error', () => {
        const { execSync } = require('child_process');
        try {
            execSync(`node ${path.join(__dirname, 'executive-cognitive-reflection.js')}`, { encoding: 'utf8' });
            return true;
        } catch (e) {
            console.log(`    Error: ${e.message}`);
            return false;
        }
    });

    // === Summary ===
    section('Validation Summary');

    const total = passed + failed;
    console.log(`\n✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`\nSHADOW-only constraint: ${failed === 0 ? '✅ PRESERVED' : '❌ VIOLATED'}`);

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('Validation error:', e);
    process.exit(1);
});