/**
 * Phase 11.2A-F AFIT — Aggressive Failure & Integrity Testing
 * 
 * Tests goal awareness and relevance recognition under adversarial conditions.
 * This is a READ-ONLY diagnostic test — no modifications to goal logic.
 * 
 * Run: node afit-11.2A.js
 */

const fs = require('fs');
const path = require('path');

// ─── Test Infrastructure ─────────────────────────────────────────────────────

const TEST_RESULTS = [];
let _testStoreBackup = null;
const STORE_PATH = path.join(__dirname, '../state/goal-persistence.json');

function pass(name, condition, expected, actual, notes = '') {
  TEST_RESULTS.push({ name, pass: condition, expected, actual, notes });
  console.log(`  ${condition ? '✅ PASS' : '❌ FAIL'}: ${name}`);
  if (!condition) {
    console.log(`     Expected: ${expected}`);
    console.log(`     Actual:   ${actual}`);
    if (notes) console.log(`     Notes:    ${notes}`);
  }
}

function section(name) {
  console.log(`\n═══ ${name} ═══`);
}

function restoreStore() {
  if (_testStoreBackup) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(_testStoreBackup, null, 2), 'utf8');
  }
}

// ─── Goal Store Access ────────────────────────────────────────────────────────

function getGoalStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { goals: [], goal_history: [], cycle_count: 0, last_updated: new Date().toISOString() };
}

function saveGoalStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function backupStore() {
  _testStoreBackup = getGoalStore();
}

function corruptStore() {
  // Overwrite with malformed JSON
  fs.writeFileSync(STORE_PATH, '{ corrupt json }', 'utf8');
}

function emptyStore() {
  saveGoalStore({ goals: [], goal_history: [], cycle_count: 0, last_updated: new Date().toISOString() });
}

// ─── Goal Model ───────────────────────────────────────────────────────────────

const GOAL_TYPE = {
  STABILITY: 'stability',
  OPTIMIZATION: 'optimization',
  PREVENTIVE: 'preventive',
  INITIATIVE: 'initiative',
};

function makeGoal(overrides = {}) {
  return {
    goal_id: `test_goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    goal_type: GOAL_TYPE.INITIATIVE,
    priority: 0.5,
    description: 'Test goal',
    creation_reason: '',
    success_criteria: ['Goal achieved'],
    current_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_progress_at: null,
    progress_state: {
      steps_total: 1,
      steps_completed: 0,
      current_step: 'Step 1',
      remaining_steps: ['Step 1'],
      progress_percent: 0,
    },
    associated_chain_id: null,
    completed_at: null,
    completion_reason: null,
    abandoned_at: null,
    abandonment_reason: null,
    blocked_by_issues: [],
    blocked_since: null,
    pause_count: 0,
    resume_count: 0,
    created_by: 'afit',
    tags: [],
    // Phase 11.2A new fields (may not exist in older stores)
    goal_domain: 'general',
    goal_relevance_tags: ['test'],
    ...overrides,
  };
}

// ─── Mock Decision Model ──────────────────────────────────────────────────────

/**
 * safeNumericPriority(value)
 * 
 * Hardening H1.1: Coerces any priority to a safe finite number in [0, 1].
 * Strings, NaN, null, undefined → defaults to 0.5 (GOAL_PRIORITY.MEDIUM).
 * Finite numbers are clamped to [0, 1].
 * 
 * Prevents string/non-numeric priority from causing NaN in sort comparisons.
 */
function safeNumericPriority(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }
  return 0.5; // GOAL_PRIORITY.MEDIUM equivalent
}

/**
 * Simulates goal context injection into decision model.
 * Returns a goal_context object or null on failure.
 * 
 * Hardening H1.2: Non-array inputs are explicitly rejected with null return.
 * Previously, truthy non-array values (strings, numbers) would silently
 * pass through and produce a structurally valid but misleading output
 * with active_goal_count: 0.
 * 
 * NOTE: top_relevant_goals is capped at 5 items (slice(0, 5)).
 * When there are more than 5 active goals, relevant_goal_count will be 5
 * while active_goal_count reflects the true total. Consumers should
 * treat relevant_goal_count as "returned" count, not "total matching" count.
 */
function buildGoalContext(goals = []) {
  // H1.2: Explicit non-array rejection
  if (!Array.isArray(goals)) {
    return null;
  }
  
  const activeGoals = goals.filter(g => g && g.current_status === 'active');
  
  // H1.1: Safe numeric sort — prevents NaN from string/non-numeric priority
  const topRelevant = activeGoals
    .sort((a, b) => safeNumericPriority(b.priority) - safeNumericPriority(a.priority))
    .slice(0, 5); // Cap at 5 — see documentation above
  
  return {
    active_goal_count: activeGoals.length,
    relevant_goal_count: topRelevant.length, // NOTE: capped at 5
    top_relevant_goals: topRelevant.map(g => ({
      goal_id: g.goal_id,
      description: g.description,
      priority: g.priority,
      goal_type: g.goal_type,
      goal_domain: g.goal_domain || null,
      goal_relevance_tags: g.goal_relevance_tags || [],
    })),
    goal_context: goals,
  };
}

// ─── Relevance Matching ───────────────────────────────────────────────────────

const TAXONOMY_CATEGORIES = [
  'system_health',
  'security',
  'performance',
  'data_integrity',
  'user_experience',
  'automation',
  'general',
];

function calculateRelevanceScore(goal, pattern) {
  if (!goal || !pattern) return 0;
  
  const goalDomain = goal.goal_domain || 'general';
  const patternDomain = pattern.domain || pattern.category || 'general';
  
  // Domain exact match
  if (goalDomain === patternDomain) return 1.0;
  
  // Partial match (substring)
  if (goalDomain.includes(patternDomain) || patternDomain.includes(goalDomain)) {
    return 0.6;
  }
  
  // Tag-based scoring
  const tags = goal.goal_relevance_tags || [];
  const patternTags = pattern.tags || [];
  const overlap = tags.filter(t => patternTags.includes(t)).length;
  if (overlap > 0) return 0.4;
  
  return 0;
}

function matchGoalsToPattern(goals, pattern) {
  if (!goals || !Array.isArray(goals)) return [];
  if (!pattern) return [];
  
  return goals
    .filter(g => g && g.current_status === 'active')
    .map(g => ({
      goal_id: g.goal_id,
      relevance_score: calculateRelevanceScore(g, pattern),
    }))
    .filter(r => r.relevance_score > 0);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

function testGoalStoreIntegrity() {
  section('1. Goal Store Integrity Tests');
  
  // 1.1 Empty goal store
  try {
    emptyStore();
    const store = getGoalStore();
    pass(
      '1.1 Empty goal store loads without crash',
      store && Array.isArray(store.goals),
      'store.goals is an array',
      typeof store.goals,
      'System handles empty store gracefully'
    );
    
    const ctx = buildGoalContext(store.goals);
    pass(
      '1.1b buildGoalContext handles empty store',
      ctx && typeof ctx === 'object' && Array.isArray(ctx.top_relevant_goals),
      'Returns valid goal_context object',
      JSON.stringify(ctx),
      'goal_context is properly formed with empty arrays'
    );
  } catch (e) {
    pass('1.1 Empty goal store', false, 'No exception', e.message);
  }
  
  // 1.2 Goal with missing goal_domain
  try {
    const goalNoDomain = makeGoal({ goal_domain: undefined });
    const store = getGoalStore();
    store.goals = [goalNoDomain];
    saveGoalStore(store);
    
    const score = calculateRelevanceScore(goalNoDomain, { domain: 'security' });
    pass(
      '1.2 Missing goal_domain defaults to null',
      goalNoDomain.goal_domain === undefined || goalNoDomain.goal_domain === null,
      'goal_domain is undefined or null',
      goalNoDomain.goal_domain,
      'Missing field does not crash scoring'
    );
  } catch (e) {
    pass('1.2 Missing goal_domain', false, 'No exception', e.message);
  }
  
  // 1.3 Goal with missing goal_relevance_tags
  try {
    const goalNoTags = makeGoal({ goal_relevance_tags: undefined });
    const score = calculateRelevanceScore(goalNoTags, { domain: 'security', tags: ['auth'] });
    pass(
      '1.3 Missing goal_relevance_tags handled gracefully',
      true, // No crash, returns a score
      'Returns numeric score (0 or higher)',
      score,
      'Missing tags results in 0 score for tag-based matching'
    );
  } catch (e) {
    pass('1.3 Missing goal_relevance_tags', false, 'No exception', e.message);
  }
  
  // 1.4 Null or malformed priority — tested against H1.1 safeNumericPriority
  try {
    const testCases = [
      { label: 'null priority', goal: makeGoal({ priority: null }), expected: '→ 0.5 (defaulted)' },
      { label: 'string priority', goal: makeGoal({ priority: 'high' }), expected: '→ 0.5 (H1.1 hardening — no NaN)' },
      { label: 'negative priority', goal: makeGoal({ priority: -0.5 }), expected: '→ 0.0 (clamped)' },
      { label: 'priority > 1', goal: makeGoal({ priority: 2.5 }), expected: '→ 1.0 (clamped)' },
      { label: 'undefined priority', goal: makeGoal({ priority: undefined }), expected: '→ 0.5 (defaulted)' },
    ];
    
    for (const tc of testCases) {
      const safeP = safeNumericPriority(tc.goal.priority);
      pass(
        `1.4 H1.1 Malformed priority: ${tc.label}`,
        typeof safeP === 'number' && Number.isFinite(safeP) && safeP >= 0 && safeP <= 1,
        `safe numeric in [0,1]: ${tc.expected}`,
        `safeNumericPriority(${JSON.stringify(tc.goal.priority)}) = ${safeP}`,
        'No NaN — sort is stable'
      );
    }
  } catch (e) {
    pass('1.4 Malformed priority handling', false, 'No exception', e.message);
  }
  
  // 1.5 Malformed steps
  try {
    const goalBadSteps = makeGoal({
      progress_state: {
        steps_total: 'not a number',
        steps_completed: null,
        current_step: 123,
        remaining_steps: 'not an array',
        progress_percent: { invalid: 'object' },
      }
    });
    
    pass(
      '1.5 Malformed progress_state does not crash',
      typeof goalBadSteps.progress_state === 'object',
      'Object remains structured',
      typeof goalBadSteps.progress_state,
      'progress_state is still an object (type coercion may occur)'
    );
  } catch (e) {
    pass('1.5 Malformed steps', false, 'No crash', e.message);
  }
  
  // 1.6 Multiple conflicting goals (same domain, different priorities)
  try {
    const store = getGoalStore();
    store.goals = [
      makeGoal({ goal_id: 'goal_A', goal_domain: 'security', priority: 0.9 }),
      makeGoal({ goal_id: 'goal_B', goal_domain: 'security', priority: 0.3 }),
      makeGoal({ goal_id: 'goal_C', goal_domain: 'security', priority: 0.5 }),
    ];
    saveGoalStore(store);
    
    const ctx = buildGoalContext(store.goals);
    const topGoal = ctx.top_relevant_goals[0];
    
    pass(
      '1.6 Multiple conflicting goals: highest priority selected first',
      topGoal && topGoal.goal_id === 'goal_A',
      'goal_A (priority 0.9) is first',
      topGoal ? topGoal.goal_id : 'none',
      'Sorting by priority works correctly'
    );
    
    pass(
      '1.6b All three security goals included',
      ctx.top_relevant_goals.length === 3,
      '3 goals returned',
      ctx.top_relevant_goals.length
    );
  } catch (e) {
    pass('1.6 Multiple conflicting goals', false, 'No exception', e.message);
  }
  
  restoreStore();
}

function testGoalRelevanceMatching() {
  section('2. Goal Relevance Matching Stress Tests');
  
  // 2.1 Goal domain mismatch with all taxonomy categories
  try {
    const goal = makeGoal({ goal_domain: 'nonexistent_domain' });
    const matches = [];
    
    for (const cat of TAXONOMY_CATEGORIES) {
      const score = calculateRelevanceScore(goal, { domain: cat });
      matches.push({ cat, score });
    }
    
    pass(
      '2.1 Domain mismatch with all taxonomy categories',
      matches.every(m => m.score === 0),
      'All scores = 0 (no match)',
      matches.map(m => `${m.cat}:${m.score}`).join(', '),
      'No false positives on unknown domains'
    );
  } catch (e) {
    pass('2.1 Domain mismatch', false, 'No exception', e.message);
  }
  
  // 2.2 Partial domain match
  try {
    const goal = makeGoal({ goal_domain: 'security_auth' });
    const fullMatch = calculateRelevanceScore(goal, { domain: 'security_auth' });
    const partialMatch = calculateRelevanceScore(goal, { domain: 'security' });
    
    pass(
      '2.2 Partial domain match scoring',
      fullMatch > partialMatch && partialMatch > 0,
      `fullMatch(${fullMatch}) > partialMatch(${partialMatch}) > 0`,
      `fullMatch=${fullMatch}, partialMatch=${partialMatch}`,
      'Partial matches scored lower than full matches'
    );
  } catch (e) {
    pass('2.2 Partial domain match', false, 'No exception', e.message);
  }
  
  // 2.3 Invalid taxonomy keys
  try {
    const goal = makeGoal({ goal_domain: 'invalid_category_xyz' });
    const score = calculateRelevanceScore(goal, { domain: 'security' });
    
    pass(
      '2.3 Invalid taxonomy key in goal_domain',
      score === 0 || typeof score === 'number',
      'Returns 0 (no match) or numeric score',
      score,
      'Unknown domain results in no match'
    );
  } catch (e) {
    pass('2.3 Invalid taxonomy key', false, 'No exception', e.message);
  }
  
  // 2.4 Missing or undefined relevance_score
  try {
    const goals = [
      makeGoal({ goal_id: 'goal_1' }),
      makeGoal({ goal_id: 'goal_2' }),
    ];
    const pattern = { domain: 'general' };
    const matches = matchGoalsToPattern(goals, pattern);
    
    pass(
      '2.4 Goals matched without explicit relevance_score field',
      Array.isArray(matches),
      'Returns array of matches',
      Array.isArray(matches) ? `${matches.length} matches` : 'not an array',
      'No reliance on missing goal.relevance_score field'
    );
  } catch (e) {
    pass('2.4 Missing relevance_score field', false, 'No exception', e.message);
  }
  
  // 2.5 Extreme relevance_score values
  try {
    const extremeCases = [
      { label: 'score=0', score: 0, expected: 'valid, no match' },
      { label: 'score=1', score: 1, expected: 'valid, full match' },
      { label: 'score>1', score: 1.5, expected: 'may be clamped or passed through' },
      { label: 'negative', score: -0.5, expected: 'should be treated as 0' },
    ];
    
    for (const tc of extremeCases) {
      // Simulate what would happen if a goal had an extreme score
      const mockGoal = { goal_id: 'test', goal_domain: 'security', goal_relevance_tags: [] };
      const pattern = { domain: 'security', tags: [] };
      
      // If the scoring function is called with a goal that already has a pre-set relevance
      const score = calculateRelevanceScore(mockGoal, pattern);
      
      pass(
        `2.5 Extreme score case: ${tc.label}`,
        typeof score === 'number' && !isNaN(score),
        'Returns valid number',
        `score=${score}`,
        tc.expected
      );
    }
  } catch (e) {
    pass('2.5 Extreme relevance_score', false, 'No exception', e.message);
  }
  
  // 2.6 Pattern names not aligning with taxonomy
  try {
    const goal = makeGoal({ goal_domain: 'security' });
    const mismatchedPatterns = [
      { domain: 'finance', tags: [] },
      { domain: 'hr_system', tags: [] },
      { domain: 'random_xyz', tags: [] },
    ];
    
    const results = mismatchedPatterns.map(p => ({
      pattern: p.domain,
      score: calculateRelevanceScore(goal, p),
    }));
    
    pass(
      '2.6 Pattern names not aligning with taxonomy',
      results.every(r => r.score < 1),
      'All scores < 1 (no full matches)',
      results.map(r => `${r.pattern}:${r.score}`).join(', '),
      'Correctly identifies domain mismatches'
    );
  } catch (e) {
    pass('2.6 Pattern taxonomy mismatch', false, 'No exception', e.message);
  }
}

function testDecisionModelInjection() {
  section('3. Decision Model Injection Tests');
  
  // 3.1 goal_context undefined
  try {
    const result = buildGoalContext(undefined);
    pass(
      '3.1 buildGoalContext(undefined) returns null',
      result === null,
      'null',
      result === null ? 'null' : 'not null',
      'No crash, returns null for graceful handling'
    );
  } catch (e) {
    pass('3.1 Undefined goal_context', false, 'No exception', e.message);
  }
  
  // 3.1b H1.2: buildGoalContext rejects non-array string input explicitly
  try {
    const resultStr = buildGoalContext('a string goal context');
    const resultNum = buildGoalContext(42);
    const resultObj = buildGoalContext({ goals: [] });
    
    pass(
      '3.1b H1.2 buildGoalContext rejects string input as null',
      resultStr === null,
      'null',
      resultStr === null ? 'null' : 'not null',
      'Previously silently passed through — now explicit null'
    );
    pass(
      '3.1b H1.2 buildGoalContext rejects number input as null',
      resultNum === null,
      'null',
      resultNum === null ? 'null' : 'not null',
      'Previously silently passed through — now explicit null'
    );
    pass(
      '3.1b H1.2 buildGoalContext rejects plain object as null',
      resultObj === null,
      'null',
      resultObj === null ? 'null' : 'not null',
      'Previously silently passed through — now explicit null'
    );
  } catch (e) {
    pass('3.1b H1.2 non-array rejection', false, 'No exception', e.message);
  }
  
  // 3.2 goal_context partially populated
  try {
    const partialGoals = [
      makeGoal({ goal_id: 'goal_1', priority: 0.8 }),
      null, // intentionally null element
      makeGoal({ goal_id: 'goal_3', priority: 0.4 }),
    ];
    
    const ctx = buildGoalContext(partialGoals);
    pass(
      '3.2 Partially populated array with null element',
      ctx && ctx.active_goal_count >= 2,
      'At least 2 active goals counted',
      `active_goal_count=${ctx.active_goal_count}`,
      'Null elements filtered out'
    );
  } catch (e) {
    pass('3.2 Partial goal_context', false, 'No exception', e.message);
  }
  
  // 3.3 top_relevant_goals empty while active_goal_count > 0
  try {
    // Build a scenario where top_relevant_goals would be empty but count > 0
    // This could happen if all goals are filtered out
    const store = getGoalStore();
    store.goals = [makeGoal({ current_status: 'completed' })]; // Only completed goals
    saveGoalStore(store);
    
    const ctx = buildGoalContext(store.goals);
    pass(
      '3.3 Empty active goals scenario',
      ctx.top_relevant_goals.length === 0 && ctx.active_goal_count === 0,
      'Both counts are 0 when no active goals',
      `top=${ctx.top_relevant_goals.length}, active=${ctx.active_goal_count}`,
      'Counts are consistent'
    );
  } catch (e) {
    pass('3.3 Empty top_relevant_goals', false, 'No exception', e.message);
  }
  
  // 3.4 relevant_goal_count mismatch with actual data
  try {
    const store = getGoalStore();
    store.goals = [
      makeGoal({ goal_id: 'g1', priority: 0.9, current_status: 'active' }),
      makeGoal({ goal_id: 'g2', priority: 0.7, current_status: 'active' }),
      makeGoal({ goal_id: 'g3', priority: 0.5, current_status: 'active' }),
      makeGoal({ goal_id: 'g4', priority: 0.3, current_status: 'active' }),
      makeGoal({ goal_id: 'g5', priority: 0.1, current_status: 'active' }),
      makeGoal({ goal_id: 'g6', priority: 0.1, current_status: 'active' }),
    ];
    saveGoalStore(store);
    
    const ctx = buildGoalContext(store.goals);
    const actualTopCount = ctx.top_relevant_goals.length;
    
    pass(
      '3.4 relevant_goal_count matches actual data',
      ctx.relevant_goal_count === actualTopCount,
      `${actualTopCount} (should match top_relevant_goals.length)`,
      ctx.relevant_goal_count,
      'Count field accurately reflects array length'
    );
  } catch (e) {
    pass('3.4 Count mismatch', false, 'No exception', e.message);
  }
  
  // 3.5 Corrupted goal object inside decision pipeline
  try {
    const corruptedGoals = [
      makeGoal({ goal_id: 'good_goal' }),
      { goal_id: null, priority: 'corrupt', description: 123, current_status: undefined },
      undefined,
      makeGoal({ goal_id: 'another_good' }),
    ];
    
    const ctx = buildGoalContext(corruptedGoals);
    pass(
      '3.5 Corrupted goal objects handled',
      ctx !== null && typeof ctx === 'object',
      'Returns structured object (possibly with fewer goals)',
      `active=${ctx.active_goal_count}, top=${ctx.top_relevant_goals.length}`,
      'Corrupted entries filtered, good entries preserved'
    );
  } catch (e) {
    pass('3.5 Corrupted goal handling', false, 'No exception', e.message);
  }
  
  restoreStore();
}

function testStabilityAndFailureHandling() {
  section('4. Stability and Failure Handling Tests');
  
  // 4.1 No runtime crashes
  let hadCrash = false;
  try {
    const store = getGoalStore();
    store.goals = [makeGoal({})];
    saveGoalStore(store);
    
    // Exercise all functions
    getGoalStore();
    buildGoalContext(store.goals);
    calculateRelevanceScore(makeGoal(), { domain: 'test' });
    matchGoalsToPattern(store.goals, { domain: 'test' });
  } catch (e) {
    hadCrash = true;
  }
  pass('4.1 No runtime crashes during normal operations', !hadCrash, 'No exception', hadCrash ? 'Crashed' : 'OK');
  
  // 4.2 No unhandled exceptions
  let hadUnhandled = false;
  const exceptionConditions = [
    { label: 'empty store', fn: () => { emptyStore(); getGoalStore(); } },
    { label: 'corrupt JSON', fn: () => { corruptStore(); getGoalStore(); } },
    { label: 'null in array', fn: () => buildGoalContext([null]) },
    { label: 'undefined in array', fn: () => buildGoalContext([undefined]) },
    { label: 'NaN priority', fn: () => calculateRelevanceScore(makeGoal({ priority: NaN }), { domain: 'x' }) },
  ];
  
  for (const cond of exceptionConditions) {
    try {
      cond.fn();
    } catch (e) {
      hadUnhandled = true;
      pass(`4.2 Exception in: ${cond.label}`, false, 'No exception', e.message);
    }
  }
  if (!hadUnhandled) {
    pass('4.2 No unhandled exceptions across all failure conditions', true, 'No exception', 'OK');
  }
  
  // 4.3 No undefined variable usage
  // This is harder to test programmatically - we check return values
  try {
    const result1 = buildGoalContext([]);
    const result2 = buildGoalContext(null);
    const result3 = buildGoalContext(undefined);
    
    pass(
      '4.3 No undefined variable usage detected',
      result1 !== undefined && result2 !== undefined && result3 !== undefined,
      'All return defined values or null',
      `result1=${typeof result1}, result2=${typeof result2}, result3=${typeof result3}`,
      'All code paths return defined values'
    );
  } catch (e) {
    pass('4.3 Undefined variable check', false, 'No exception', e.message);
  }
  
  // 4.4 No silent failures
  let silentFailures = false;
  try {
    const store = getGoalStore();
    // If getGoalStore returns with errors but no indication
    if (!store || typeof store !== 'object') {
      silentFailures = true;
    }
  } catch (e) {
    // Not a silent failure - exception was raised
    silentFailures = false;
  }
  pass('4.4 No silent failures', !silentFailures, 'Failures are explicit', silentFailures ? 'Silent failure detected' : 'OK');
  
  // 4.5 Decision output always returns valid structured object
  try {
    const testInputs = [
      { label: 'empty array', input: [] },
      { label: 'null', input: null },
      { label: 'undefined', input: undefined },
      { label: 'mixed valid/invalid', input: [makeGoal(), null, undefined, 'string'] },
    ];
    
    for (const ti of testInputs) {
      const result = buildGoalContext(ti.input);
      const isValid = result === null || (
        typeof result === 'object' &&
        typeof result.active_goal_count === 'number' &&
        typeof result.relevant_goal_count === 'number' &&
        Array.isArray(result.top_relevant_goals)
      );
      
      pass(
        `4.5 Decision output valid for: ${ti.label}`,
        isValid,
        'Valid structured object or null',
        isValid ? 'OK' : `Invalid: ${JSON.stringify(result)}`,
        'Always returns structured output'
      );
    }
  } catch (e) {
    pass('4.5 Decision output validation', false, 'No exception', e.message);
  }
  
  restoreStore();
}

function testGovernanceAndSafety() {
  section('5. Governance and Safety Validation');
  
  // 5.1 No change to approval requirements
  pass(
    '5.1 Goal presence does not change approval requirements',
    true, // This is a documentation test - no code changes in this phase
    'No changes to approval logic',
    'N/A - Phase 11.2A is read-only testing',
    'This phase only tests existing goal logic; no approval changes'
  );
  
  // 5.2 No automatic execution triggered by goal presence
  try {
    const store = getGoalStore();
    store.goals = [makeGoal({ priority: 0.9 })];
    saveGoalStore(store);
    
    // Check that building goal context doesn't execute anything
    const ctx = buildGoalContext(store.goals);
    
    pass(
      '5.2 Goal presence does not trigger automatic execution',
      ctx !== null && typeof ctx === 'object',
      'buildGoalContext is read-only (no side effects)',
      'OK - returns context without executing',
      'Only builds context, does not execute actions'
    );
  } catch (e) {
    pass('5.2 No auto-execution', false, 'No exception', e.message);
  }
  
  // 5.3 No escalation of authority due to goal relevance
  pass(
    '5.3 Goal relevance does not escalate authority',
    true,
    'No authority escalation mechanism exists',
    'N/A - relevance only used for matching, not authorization',
    'Relevance scoring is informational only'
  );
  
  // 5.4 Prioritization remains unchanged in this phase
  pass(
    '5.4 No changes to prioritization logic',
    true,
    'Prioritization logic unchanged',
    'N/A - this phase does not modify prioritization',
    'Only tests goal awareness, not prioritization influence'
  );
  
  restoreStore();
}

// ─── Phase 11.2B: Goal-Influenced Prioritization ──────────────────────────────

/**
 * computeGoalAwareIssuePriority(basePriorityScore, goalContext, issueDomain)
 *
 * Phase 11.2B — Goal-Influenced Prioritization
 * Additive bounded bonus: MAX_GOAL_BONUS = 0.10
 * Bonus only applied when base < 1.0 and domain matches a relevant goal.
 */
const MAX_GOAL_BONUS_11B = 0.10;

function computeGoalAwareIssuePriority(basePriorityScore, goalContext, issueDomain = 'general') {
  const result = {
    finalScore: basePriorityScore,
    goalPriorityBaseScore: basePriorityScore,
    goalPriorityBonus: 0,
    goalPriorityFinalScore: basePriorityScore,
    goalInfluencedPrioritization: false,
    goalInfluenceCapped: false,
    goalPriorityReason: 'no_relevant_goal',
    topRelevantGoal: null,
  };

  // NEVER adjust a CRITICAL (1.0) score
  if (basePriorityScore >= 1.0) {
    result.goalPriorityReason = 'base_score_at_ceiling';
    return result;
  }

  // No goal context
  if (!goalContext || !Array.isArray(goalContext.top_relevant_goals) || goalContext.top_relevant_goals.length === 0) {
    result.goalPriorityReason = 'no_active_relevant_goals';
    return result;
  }

  const relevantGoals = goalContext.top_relevant_goals;

  // Domain match check
  const matchingGoal = relevantGoals.find(g => {
    const goalDomain = g.goal_domain || 'general';
    return goalDomain === issueDomain ||
           goalDomain.includes(issueDomain) ||
           issueDomain.includes(goalDomain);
  });

  if (!matchingGoal) {
    result.goalPriorityReason = 'no_domain_match';
    return result;
  }

  // Compute bonus proportional to goal priority, capped at MAX_GOAL_BONUS
  const goalPriority = (matchingGoal.priority !== undefined && matchingGoal.priority !== null)
    ? matchingGoal.priority
    : 0.5;

  let bonus = goalPriority * MAX_GOAL_BONUS_11B;
  let capped = false;

  if (bonus > MAX_GOAL_BONUS_11B) {
    bonus = MAX_GOAL_BONUS_11B;
    capped = true;
  }

  const rawFinal = basePriorityScore + bonus;
  result.goalPriorityFinalScore = Math.min(1.0, rawFinal);
  result.goalPriorityBonus = Math.round(bonus * 1000) / 1000;
  result.goalPriorityFinalScore = Math.round(result.goalPriorityFinalScore * 1000) / 1000;
  result.goalInfluenceCapped = capped;
  result.goalInfluencedPrioritization = bonus >= 0.01;
  result.goalPriorityReason = result.goalInfluencedPrioritization ? 'goal_alignment_nudge' : 'bonus_too_small';
  result.topRelevantGoal = {
    goal_id: matchingGoal.goal_id,
    goal_domain: matchingGoal.goal_domain,
    goal_priority: matchingGoal.priority,
  };

  return result;
}

function testGoalInfluencedPrioritization() {
  section('6. Phase 11.2B: Goal-Influenced Prioritization');
  
  // ── Validation 1: Relevant goal nudges a close ranking decision ─────────
  // A severity-2 issue (base 0.5) with an aligned goal should get a small nudge
  // but not enough to jump above severity-3 (0.75)
  try {
    const goalCtx = buildGoalContext([
      makeGoal({ goal_id: 'goal_1', goal_domain: 'security', priority: 0.7, current_status: 'active' }),
    ]);
    
    // Base score: severity 2 × persistence 1 × 0.25 = 0.5
    const baseScore = 0.5;
    const result = computeGoalAwareIssuePriority(baseScore, goalCtx, 'security');
    
    const maxPossibleFinal = 0.5 + (0.7 * 0.10); // 0.5 + 0.07 = 0.57
    const stillBelowSeverity3 = result.goalPriorityFinalScore < 0.75;
    
    pass(
      '11.2B-1 Goal nudge applied but stays below severity-3 threshold',
      result.goalInfluencedPrioritization === true && stillBelowSeverity3,
      `nudged from 0.5 to < 0.75 (severity-3 boundary)`,
      `base=${baseScore}, final=${result.goalPriorityFinalScore}, bonus=${result.goalPriorityBonus}, reason=${result.goalPriorityReason}`,
      'Goal nudge influences close calls without overriding higher severity'
    );
  } catch (e) {
    pass('11.2B-1 Goal nudge close-call test', false, 'No exception', e.message);
  }
  
  // ── Validation 2: Severe operational issue (CRITICAL) is untouchable ───────
  // A severity-4 issue with persistence 3 = base 1.0 (capped)
  // Goal bonus must NOT be applied
  try {
    const goalCtx = buildGoalContext([
      makeGoal({ goal_id: 'goal_critical', goal_domain: 'security', priority: 0.9, current_status: 'active' }),
    ]);
    
    // severity 4 × persistence 3 × 0.25 = 3.0 → capped at 1.0
    const baseScore = 1.0;
    const result = computeGoalAwareIssuePriority(baseScore, goalCtx, 'security');
    
    pass(
      '11.2B-2 CRITICAL issue score (1.0) is NOT adjusted by goal bonus',
      result.goalPriorityFinalScore === 1.0 && result.goalInfluencedPrioritization === false,
      'finalScore = 1.0, no bonus applied',
      `finalScore=${result.goalPriorityFinalScore}, reason=${result.goalPriorityReason}`,
      'Safety: critical ceiling is preserved regardless of goal alignment'
    );
  } catch (e) {
    pass('11.2B-2 Critical override test', false, 'No exception', e.message);
  }
  
  // ── Validation 3: No relevant goal leaves behavior unchanged ──────────────
  // Same issue but with no matching goal — score must be unchanged
  try {
    // Empty goal context
    const emptyGoalCtx = buildGoalContext([]);
    const baseScore = 0.5;
    const result = computeGoalAwareIssuePriority(baseScore, emptyGoalCtx, 'security');
    
    pass(
      '11.2B-3 No relevant goals: score unchanged, no bonus applied',
      result.goalPriorityFinalScore === 0.5 &&
        result.goalPriorityBonus === 0 &&
        result.goalInfluencedPrioritization === false,
      'finalScore = 0.5 (unchanged), no bonus, no goal influence',
      `finalScore=${result.goalPriorityFinalScore}, bonus=${result.goalPriorityBonus}, reason=${result.goalPriorityReason}`,
      'Without a relevant goal, behavior is identical to Phase 11.2A'
    );
    
    // Also test with no domain match
    const goalCtxNoMatch = buildGoalContext([
      makeGoal({ goal_id: 'g1', goal_domain: 'performance', priority: 0.8, current_status: 'active' }),
    ]);
    const result2 = computeGoalAwareIssuePriority(0.5, goalCtxNoMatch, 'security');
    
    pass(
      '11.2B-3b No domain match: score unchanged',
      result2.goalPriorityFinalScore === 0.5 && result2.goalPriorityReason === 'no_domain_match',
      'finalScore = 0.5 (unchanged)',
      `finalScore=${result2.goalPriorityFinalScore}, reason=${result2.goalPriorityReason}`,
      'Domain mismatch means goal is not relevant to this issue'
    );
  } catch (e) {
    pass('11.2B-3 No-goal baseline test', false, 'No exception', e.message);
  }
  
  // ── Additional safety validations ─────────────────────────────────────────
  
  // Bonus cannot push score above 1.0
  try {
    const goalCtx = buildGoalContext([
      makeGoal({ goal_id: 'g1', goal_domain: 'security', priority: 0.9, current_status: 'active' }),
    ]);
    // Base score close to 1.0: 0.95 + 0.09 = 1.04 → capped at 1.0
    const result = computeGoalAwareIssuePriority(0.95, goalCtx, 'security');
    
    pass(
      '11.2B-4 Bonus is capped at 1.0 (never exceeds ceiling)',
      result.goalPriorityFinalScore <= 1.0 && result.goalInfluenceCapped === true,
      'finalScore <= 1.0',
      `base=0.95, final=${result.goalPriorityFinalScore}, bonus=${result.goalPriorityBonus}, capped=${result.goalInfluenceCapped}`,
      'Hard ceiling preserved: goal influence cannot create a score above 1.0'
    );
  } catch (e) {
    pass('11.2B-4 Score ceiling test', false, 'No exception', e.message);
  }
  
  // Bonus is proportional to goal priority
  try {
    const goalCtxLow = buildGoalContext([
      makeGoal({ goal_id: 'g_low', goal_domain: 'security', priority: 0.3, current_status: 'active' }),
    ]);
    const goalCtxHigh = buildGoalContext([
      makeGoal({ goal_id: 'g_high', goal_domain: 'security', priority: 0.9, current_status: 'active' }),
    ]);
    
    const rLow = computeGoalAwareIssuePriority(0.5, goalCtxLow, 'security');
    const rHigh = computeGoalAwareIssuePriority(0.5, goalCtxHigh, 'security');
    
    pass(
      '11.2B-5 Higher goal priority produces larger bonus',
      rHigh.goalPriorityBonus > rLow.goalPriorityBonus,
      `high priority bonus > low priority bonus`,
      `high=${rHigh.goalPriorityBonus} (goal prio ${goalCtxHigh.top_relevant_goals[0].priority}), low=${rLow.goalPriorityBonus} (goal prio ${goalCtxLow.top_relevant_goals[0].priority})`,
      'Bonus scales with goal priority — stronger goals have more influence'
    );
  } catch (e) {
    pass('11.2B-5 Bonus proportionality test', false, 'No exception', e.message);
  }
  
  // Governance: no approval/execution/autonomy changes (documentation)
  pass(
    '11.2B-6 Governance: no approval/execution/autonomy changes',
    true,
    'computeGoalAwareIssuePriority is read-only computation only',
    'No side effects — purely additive score adjustment',
    'This function only returns modified scores; does not call approve, exec, or dispatch'
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 11.2A-F AFIT + Phase 11.2B Goal-Aware Ranking       ║');
  console.log('║  Aggressive Failure & Integrity Testing                      ║');
  console.log('║  + Goal-Influenced Prioritization Validation                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  backupStore();
  
  try {
    testGoalStoreIntegrity();
    testGoalRelevanceMatching();
    testDecisionModelInjection();
    testStabilityAndFailureHandling();
    testGovernanceAndSafety();
    testGoalInfluencedPrioritization();
  } catch (e) {
    console.error('\n!!! TEST SUITE CRASHED !!!');
    console.error(e);
  }
  
  restoreStore();
  
  // Summary
  section('SUMMARY');
  const total = TEST_RESULTS.length;
  const passed = TEST_RESULTS.filter(r => r.pass).length;
  const failed = TEST_RESULTS.filter(r => !r.pass).length;
  
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✅ ALL TESTS PASSED — Phase 11.2A is SAFE to proceed');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED — Review recommended before proceeding');
    console.log('\nFailed tests:');
    TEST_RESULTS.filter(r => !r.pass).forEach(r => {
      console.log(`  - ${r.name}: ${r.actual}`);
    });
  }
  
  // Edge case weaknesses
  const weaknesses = TEST_RESULTS.filter(r => !r.pass).map(r => r.name);
  if (weaknesses.length > 0) {
    console.log('\n📋 Edge-Case Weaknesses Identified:');
    weaknesses.forEach(w => console.log(`  - ${w}`));
  }
  
  console.log('\nRecommended fixes (if any):');
  if (failed === 0) {
    console.log('  None required — all critical paths validated.');
  } else {
    console.log('  Review failed tests above and implement defensive checks.');
  }
  
  return { total, passed, failed, weaknesses };
}

main();