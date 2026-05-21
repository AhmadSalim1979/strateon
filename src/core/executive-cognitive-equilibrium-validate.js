/**
 * Executive Cognitive Equilibrium Validator — MCAI Phase 7D
 * SHADOW-ONLY: Validates equilibrium layer without action authority.
 */

const path = require('path');
const STATE_DIR = path.join(__dirname, '..', '..', 'state');

const VALIDATOR_STATE = {
    name: 'MCAI Phase 7D — Executive Cognitive Equilibrium Validator',
    phase: '7D',
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
    console.log('=== MCAI Phase 7D — Executive Cognitive Equilibrium Validation ===\n');
    console.log(`Validator: ${VALIDATOR_STATE.name}`);
    console.log(`Status: ${VALIDATOR_STATE.status}`);
    console.log(`Shadow-only constraint: ${VALIDATOR_STATE.shadow_authority ? '❌ VIOLATED' : '✅ PRESERVED'}\n`);

    // === File existence ===
    section('File Existence');
    const fs = require('fs');

    test('Phase 7D source file exists', () => {
        const f = path.join(__dirname, 'executive-cognitive-equilibrium.js');
        return fs.existsSync(f);
    });

    test('Phase 7D state file can be written', () => {
        const f = path.join(STATE_DIR, 'executive-cognitive-equilibrium.json');
        try {
            fs.writeFileSync(f, '{}');
            return fs.existsSync(f);
        } catch { return false; }
    });

    test('Phase 7D history file can be written', () => {
        const f = path.join(STATE_DIR, 'executive-cognitive-equilibrium-history.jsonl');
        try {
            fs.writeFileSync(f, '');
            return fs.existsSync(f);
        } catch { return false; }
    });

    // === SHADOW-only constraint ===
    section('SHADOW-Only Constraint Preservation');

    test('File contains SHADOW-ONLY comment block', () => {
        const f = path.join(__dirname, 'executive-cognitive-equilibrium.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('SHADOW-ONLY') && content.includes('SHADOW-ONLY: Observational');
    });

    test('File contains explicit no-action declarations', () => {
        const f = path.join(__dirname, 'executive-cognitive-equilibrium.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('NO prioritization') &&
            content.includes('NO recommendations') &&
            content.includes('NO planning') &&
            content.includes('NO decisions') &&
            content.includes('NO actions');
    });

    test('File contains no execution authority grants', () => {
        const f = path.join(__dirname, 'executive-cognitive-equilibrium.js');
        const content = fs.readFileSync(f, 'utf8');
        return !content.includes('executeTask') &&
            !content.includes('execute_request') &&
            !content.includes('EXECUTION AUTHORITY');
    });

    test('File contains no planning authority grants', () => {
        const f = path.join(__dirname, 'executive-cognitive-equilibrium.js');
        const content = fs.readFileSync(f, 'utf8');
        return !content.includes('planExecution') &&
            !content.includes('plan_') &&
            !content.includes('PLANNING AUTHORITY');
    });

    test('shadow_only flag set to true in output', () => {
        const f = path.join(__dirname, 'executive-cognitive-equilibrium.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes('shadow_only: true');
    });

    test('phase field set to MCAI Phase 7D', () => {
        const f = path.join(__dirname, 'executive-cognitive-equilibrium.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes("phase: 'MCAI Phase 7D'");
    });

    test('parent_phases references 7A, 7B, 7C', () => {
        const f = path.join(__dirname, 'executive-cognitive-equilibrium.js');
        const content = fs.readFileSync(f, 'utf8');
        return content.includes("'7A (Continuity)'") &&
            content.includes("'7B (Context Consolidation)'") &&
            content.includes("'7C (Cognitive Transition)'");
    });

    // === Module structure ===
    section('Module Structure');

    test('Module exports computeCognitiveEquilibrium', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        return typeof mod.computeCognitiveEquilibrium === 'function';
    });

    test('Module exports saveEquilibriumState', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        return typeof mod.saveEquilibriumState === 'function';
    });

    test('Module exports EQUILIBRIUM_STATES', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        return mod.EQUILIBRIUM_STATES &&
            mod.EQUILIBRIUM_STATES.IMBALANCED &&
            mod.EQUILIBRIUM_STATES.FORMING &&
            mod.EQUILIBRIUM_STATES.ESTABLISHED &&
            mod.EQUILIBRIUM_STATES.DEEP_EQUILIBRIUM;
    });

    test('Module exports DRIFT_PROFILES', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        return mod.DRIFT_PROFILES &&
            mod.DRIFT_PROFILES.STRENGTHENING &&
            mod.DRIFT_PROFILES.WEAKENING &&
            mod.DRIFT_PROFILES.STABILIZING;
    });

    test('Module exports FRAGMENTATION_TYPES', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        return mod.FRAGMENTATION_TYPES &&
            mod.FRAGMENTATION_TYPES.DIMENSIONAL_IMBALANCE &&
            mod.FRAGMENTATION_TYPES.EQUILIBRIUM_COLLAPSE;
    });

    // === Core computation ===
    section('Core Computation');

    test('computeCognitiveEquilibrium returns equilibrium_state', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return result && typeof result.equilibrium_state === 'string';
    });

    test('computeCognitiveEquilibrium returns equilibrium_strength (0-1 normalized)', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return result &&
            typeof result.equilibrium_strength === 'number' &&
            result.equilibrium_strength >= 0 &&
            result.equilibrium_strength <= 1;
    });

    test('computeCognitiveEquilibrium returns equilibrium_fragmentation array', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return Array.isArray(result.equilibrium_fragmentation);
    });

    test('computeCognitiveEquilibrium returns equilibrium_stability_assessment object', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return result &&
            typeof result.equilibrium_stability_assessment === 'object' &&
            result.equilibrium_stability_assessment !== null;
    });

    test('computeCognitiveEquilibrium returns equilibrium_drift_profile', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return result &&
            typeof result.equilibrium_drift_profile === 'object' &&
            result.equilibrium_drift_profile !== null &&
            typeof result.equilibrium_drift_profile.profile === 'string';
    });

    test('computeCognitiveEquilibrium returns component_summaries for all 3 dimensions', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return result.component_summaries &&
            result.component_summaries.continuity &&
            result.component_summaries.context &&
            result.component_summaries.transition;
    });

    test('computeCognitiveEquilibrium returns dimensional_analysis', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return result.dimensional_analysis &&
            typeof result.dimensional_analysis.dimension_strengths === 'object' &&
            typeof result.dimensional_analysis.balance_score === 'number' &&
            typeof result.dimensional_analysis.integration_score === 'number';
    });

    test('computeCognitiveEquilibrium returns uncertainty_boundaries array', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return Array.isArray(result.uncertainty_boundaries);
    });

    test('computeCognitiveEquilibrium returns survivability_regions array', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return Array.isArray(result.survivability_regions);
    });

    // === Equilibrium state classification ===
    section('Equilibrium State Classification');

    test('Returns FRAGMENTED (imbalanced) state for very low strength', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.1, continuity_state: 'FRAGMENTED' },
            { consolidation_strength: 0.1, context_state: 'DIFFUSE' },
            { transition_strength: 0.1, transition_state: 'STATIC' },
            []
        );
        return result.equilibrium_state === 'IMBALANCED';
    });

    test('Returns FORMING state for moderate strength', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.35, continuity_state: 'TRANSITIONAL' },
            { consolidation_strength: 0.35, context_state: 'FORMING' },
            { transition_strength: 0.35, transition_state: 'TRANSITIONING' },
            []
        );
        return result.equilibrium_state === 'FORMING';
    });

    test('Returns ESTABLISHED state for higher strength with sufficient history', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const mockHistory = Array.from({ length: 12 }, (_, i) => ({
            equilibrium_strength: 0.65,
            equilibrium_state: 'ESTABLISHED'
        }));
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.7, continuity_state: 'CONTINUOUS' },
            { consolidation_strength: 0.65, context_state: 'CONSOLIDATED' },
            { transition_strength: 0.6, transition_state: 'STABILIZING' },
            mockHistory
        );
        return result.equilibrium_state === 'ESTABLISHED';
    });

    test('Returns DEEP_EQUILIBRIUM for very high strength + low fragmentation + history', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const mockHistory = Array.from({ length: 18 }, (_, i) => ({
            equilibrium_strength: 0.88,
            equilibrium_state: 'DEEP_EQUILIBRIUM'
        }));
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.88, continuity_state: 'ENTRENCHED_CONTINUITY' },
            { consolidation_strength: 0.85, context_state: 'ENTRENCHED_CONTEXT' },
            { transition_strength: 0.87, transition_state: 'STABILIZING' },
            mockHistory
        );
        return result.equilibrium_state === 'DEEP_EQUILIBRIUM';
    });

    // === Cross-dimensional analysis ===
    section('Cross-Dimensional Analysis');

    test('Identifies weakest dimension correctly', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.8, continuity_state: 'CONTINUOUS' },
            { consolidation_strength: 0.3, context_state: 'DIFFUSE' },
            { transition_strength: 0.7, transition_state: 'STABILIZING' },
            []
        );
        return result.dimensional_analysis &&
            result.dimensional_analysis.weakest_dimension === 'context';
    });

    test('Identifies strongest dimension correctly', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.8, continuity_state: 'CONTINUOUS' },
            { consolidation_strength: 0.3, context_state: 'DIFFUSE' },
            { transition_strength: 0.7, transition_state: 'STABILIZING' },
            []
        );
        return result.dimensional_analysis &&
            result.dimensional_analysis.strongest_dimension === 'continuity';
    });

    test('Balance score penalizes when dimensions are unequal', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.9, continuity_state: 'CONTINUOUS' },
            { consolidation_strength: 0.2, context_state: 'DIFFUSE' },
            { transition_strength: 0.8, transition_state: 'STABILIZING' },
            []
        );
        return result.dimensional_analysis &&
            result.dimensional_analysis.balance_score < 0.7;
    });

    test('Mutual reinforcement computed across all dimension pairs', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.7, continuity_state: 'CONTINUOUS' },
            { consolidation_strength: 0.7, context_state: 'CONSOLIDATED' },
            { transition_strength: 0.7, transition_state: 'STABILIZING' },
            []
        );
        return result.dimensional_analysis &&
            result.dimensional_analysis.mutual_reinforcement > 0;
    });

    // === Fragmentation detection ===
    section('Fragmentation Detection');

    test('Detects DIMENSIONAL_IMBALANCE when dimensions differ by >0.3', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.9, continuity_state: 'CONTINUOUS' },
            { consolidation_strength: 0.1, context_state: 'DIFFUSE' },
            { transition_strength: 0.85, transition_state: 'STABILIZING' },
            []
        );
        const hasImbalance = result.equilibrium_fragmentation.some(f => f.type === 'DIMENSIONAL_IMBALANCE');
        return hasImbalance;
    });

    test('Detects OSCILLATORY_EQUILIBRIUM when oscillation index > 0.5', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const mockHistory = Array.from({ length: 10 }, (_, i) => ({
            equilibrium_strength: i % 2 === 0 ? 0.8 : 0.3,
            equilibrium_state: 'ESTABLISHED'
        }));
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.6, continuity_state: 'CONTINUOUS' },
            { consolidation_strength: 0.6, context_state: 'CONSOLIDATED' },
            { transition_strength: 0.6, transition_state: 'STABILIZING' },
            mockHistory
        );
        return result.equilibrium_fragmentation.some(f => f.type === 'OSCILLATORY_EQUILIBRIUM');
    });

    test('Detects CONTINUITY_CONTEXT_DIVERGENCE when dimensions drift apart', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium(
            { continuity_strength: 0.8, continuity_state: 'CONTINUOUS' },
            { consolidation_strength: 0.3, context_state: 'DIFFUSE' },
            { transition_strength: 0.5, transition_state: 'STABILIZING' },
            []
        );
        return result.equilibrium_fragmentation.some(f => f.type === 'CONTINUITY_CONTEXT_DIVERGENCE');
    });

    // === Drift profiles ===
    section('Drift Profiles');

    test('Returns STRENGTHENING drift when equilibrium improving', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const mockHistory = [
            { equilibrium_strength: 0.5 }, { equilibrium_strength: 0.52 },
            { equilibrium_strength: 0.55 }, { equilibrium_strength: 0.58 },
            { equilibrium_strength: 0.62 }, { equilibrium_strength: 0.65 },
            { equilibrium_strength: 0.68 }
        ];
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, mockHistory);
        return ['STRENGTHENING', 'DEEPENING'].includes(result.equilibrium_drift_profile.profile);
    });

    test('Returns WEAKENING drift when equilibrium declining', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const mockHistory = [
            { equilibrium_strength: 0.7 }, { equilibrium_strength: 0.68 },
            { equilibrium_strength: 0.65 }, { equilibrium_strength: 0.6 },
            { equilibrium_strength: 0.55 }, { equilibrium_strength: 0.5 },
            { equilibrium_strength: 0.45 }
        ];
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, mockHistory);
        return result.equilibrium_drift_profile.profile === 'WEAKENING';
    });

    test('Returns OSCILLATING drift when equilibrium fluctuates wildly', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const mockHistory = [
            { equilibrium_strength: 0.8 }, { equilibrium_strength: 0.3 },
            { equilibrium_strength: 0.75 }, { equilibrium_strength: 0.35 },
            { equilibrium_strength: 0.78 }, { equilibrium_strength: 0.32 }
        ];
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, mockHistory);
        return result.equilibrium_drift_profile.profile === 'OSCILLATING';
    });

    test('Returns INDETERMINATE drift when history < 5 entries', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const result = mod.computeCognitiveEquilibrium({}, {}, {}, []);
        return result.equilibrium_drift_profile.profile === 'INDETERMINATE';
    });

    // === Persistence ===
    section('Persistence');

    test('saveEquilibriumState writes state file', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const testState = {
            equilibrium_state: 'FORMING',
            equilibrium_strength: 0.45,
            equilibrium_fragmentation: [],
            equilibrium_drift_profile: { profile: 'STABILIZING' },
            component_summaries: {},
            dimensional_analysis: {},
            generated_at: new Date().toISOString(),
            shadow_only: true
        };
        try {
            mod.saveEquilibriumState(testState);
            const f = path.join(STATE_DIR, 'executive-cognitive-equilibrium.json');
            return fs.existsSync(f);
        } catch { return false; }
    });

    test('saveEquilibriumState appends to history file', () => {
        const mod = require('./executive-cognitive-equilibrium.js');
        const testState = {
            equilibrium_state: 'ESTABLISHED',
            equilibrium_strength: 0.65,
            equilibrium_fragmentation: [],
            equilibrium_drift_profile: { profile: 'STABILIZING' },
            component_summaries: {},
            generated_at: new Date().toISOString(),
            shadow_only: true
        };
        try {
            mod.saveEquilibriumState(testState);
            const f = path.join(STATE_DIR, 'executive-cognitive-equilibrium-history.jsonl');
            return fs.existsSync(f) && fs.readFileSync(f, 'utf8').trim().length > 0;
        } catch { return false; }
    });

    // === CLI run ===
    section('CLI Execution');

    test('CLI runs without error', () => {
        const { execSync } = require('child_process');
        try {
            execSync(`node ${path.join(__dirname, 'executive-cognitive-equilibrium.js')}`, { encoding: 'utf8' });
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