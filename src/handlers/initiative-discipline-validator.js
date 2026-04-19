/**
 * Initiative Discipliner — Validation Suite R6
 * 
 * Validates all 5 required scenarios plus safety checks.
 */

const {
  assessOpportunity,
  assessAllOpportunities,
  classifyOpportunity,
  assessGating,
  assessPriorityInteraction,
  checkOperatorAlignment,
  addOpportunity,
  getOpportunities,
  clearSurfacedThisCycle,
  getInitiativeSummary,
  OPPORTUNITY_CLASS,
  GATING_DECISION,
} = require('./initiative-discipliner');

// ─── Test Utilities ───────────────────────────────────────────────────────────

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${testName}`);
    if (details) console.log(`     Details: ${details}`);
    testsFailed++;
  }
}

function section(name) {
  console.log(`\n▸ ${name}`);
}

// ─── Base System States ───────────────────────────────────────────────────────

const HEALTHY_STATE = {
  systemStatus: 'HEALTHY',
  isDegraded: false,
  isUnhealthy: false,
  isCritical: false,
  activePriorityScore: 0,
  activeIssueCount: 0,
  deferredIssueCount: 0,
  pausedChainCount: 0,
  cycleCount: 0,
};

const DEGRADED_STATE = {
  systemStatus: 'DEGRADED',
  isDegraded: true,
  isUnhealthy: false,
  isCritical: false,
  activePriorityScore: 0.4,
  activeIssueCount: 1,
  deferredIssueCount: 0,
  pausedChainCount: 0,
  cycleCount: 5,
};

const UNHEALTHY_STATE = {
  systemStatus: 'UNHEALTHY',
  isDegraded: false,
  isUnhealthy: true,
  isCritical: false,
  activePriorityScore: 0.75,
  activeIssueCount: 2,
  deferredIssueCount: 3,
  pausedChainCount: 0,
  cycleCount: 10,
};

const CRITICAL_STATE = {
  systemStatus: 'CRITICAL',
  isDegraded: false,
  isUnhealthy: false,
  isCritical: true,
  activePriorityScore: 0.95,
  activeIssueCount: 3,
  deferredIssueCount: 5,
  pausedChainCount: 1,
  cycleCount: 15,
};

const OPERATOR_CONTEXT_DEFAULT = {
  operatorPriorities: [],
  escalationLevel: 0,
  operatorBusy: false,
  operatorAway: false,
  quietHoursActive: false,
  suppressNotifications: false,
};

const OPERATOR_CONTEXT_ESCALATED = {
  operatorPriorities: ['stability', 'reliability'],
  escalationLevel: 3,
  operatorBusy: false,
  operatorAway: false,
  quietHoursActive: false,
  suppressNotifications: false,
};

// ─── Test Scenarios ───────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  INITIATIVE DISCIPLINE — R6 VALIDATION SUITE');
console.log('═══════════════════════════════════════════════════════════════');

// ── V1: High-value opportunity during stable system → surfaced ───────────────
section('V1: High-value opportunity during HEALTHY system → surfaced');

{
  clearSurfacedThisCycle();
  
  const opportunity = {
    opportunity_id: 'v1_optimization_001',
    category: 'optimization',
    hasClearBenefit: true,
    alignsWithOperatorPriority: true,
    actionableWithLowRisk: true,
    speculative: false,
    confidence: 0.85,
    marginPercent: 15,
    priority_score: 0.7,
    description: 'Optimize database connection pool for 20% throughput gain',
  };
  
  const result = assessOpportunity(
    opportunity,
    HEALTHY_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [], // activeIssues
    []  // deferredIssues
  );
  
  assert(
    result.classification === OPPORTUNITY_CLASS.HIGH_VALUE,
    'V1.1: Opportunity classified as HIGH_VALUE'
  );
  
  assert(
    result.gating === GATING_DECISION.SURFACE_IMMEDIATELY,
    'V1.2: Gating decision is SURFACE_IMMEDIATELY',
    `Got: ${result.gating}`
  );
  
  assert(
    result.operatorAlignment.isAligned === true,
    'V1.3: Operator alignment is positive'
  );
  
  assert(
    result.requiresApproval === true,
    'V1.4: Requires approval (never autonomous)'
  );
  
  assert(
    result.recommendation.includes('High-value'),
    'V1.5: Recommendation mentions high-value'
  );
  
  assert(
    result.adjustedPriority >= 0.6,
    'V1.6: Adjusted priority is high',
    `Got: ${result.adjustedPriority}`
  );
}

// ── V2: Low-value opportunity → suppressed ───────────────────────────────────
section('V2: Low-value opportunity → suppressed');

{
  const opportunity = {
    opportunity_id: 'v2_noise_001',
    category: 'housekeeping',
    hasClearBenefit: false,
    alignsWithOperatorPriority: false,
    actionableWithLowRisk: false,
    speculative: true,
    confidence: 0.4,
    marginPercent: 2,
    priority_score: 0.3,
    createsNoise: true,
    description: 'Minor cosmetic log formatting improvement',
  };
  
  const result = assessOpportunity(
    opportunity,
    HEALTHY_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [],
    []
  );
  
  assert(
    result.classification === OPPORTUNITY_CLASS.NOISE,
    'V2.1: Opportunity classified as NOISE',
    `Got: ${result.classification}`
  );
  
  assert(
    result.gating === GATING_DECISION.SUPPRESS,
    'V2.2: Gating decision is SUPPRESS',
    `Got: ${result.gating}`
  );
  
  assert(
    result.suppressedReason !== undefined,
    'V2.3: Suppressed reason is recorded',
    `Reason: ${result.suppressedReason}`
  );
  
  assert(
    result.recommendation === 'Do not surface. Suppressed by initiative discipline.',
    'V2.4: Recommendation correctly says do not surface'
  );
}

// ── V3: Opportunity during degraded state → deferred ─────────────────────────
section('V3: Opportunity during DEGRADED state → deferred');

{
  // HIGH_VALUE during degraded
  const highValueOpp = {
    opportunity_id: 'v3_highvalue_degraded',
    category: 'optimization',
    hasClearBenefit: true,
    alignsWithOperatorPriority: true,
    actionableWithLowRisk: true,
    speculative: false,
    confidence: 0.8,
    marginPercent: 12,
    priority_score: 0.65,
    description: 'Database query optimization',
  };
  
  const highValueResult = assessOpportunity(
    highValueOpp,
    DEGRADED_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [],
    []
  );
  
  assert(
    highValueResult.gating === GATING_DECISION.DEFER,
    'V3.1: High-value opportunity DEFERRED during DEGRADED',
    `Got: ${highValueResult.gating}`
  );
  
  assert(
    highValueResult.deferralCategory !== undefined,
    'V3.2: Deferral category is set',
    `Category: ${highValueResult.deferralCategory}`
  );
  
  assert(
    highValueResult.gatingReason.includes('DEGRADED'),
    'V3.3: Gating reason mentions degraded state'
  );
  
  // LOW_VALUE during degraded
  const lowValueOpp = {
    opportunity_id: 'v3_lowvalue_degraded',
    category: 'housekeeping',
    hasClearBenefit: false,
    alignsWithOperatorPriority: false,
    speculative: false,
    confidence: 0.6,
    marginPercent: 8,
    priority_score: 0.4,
    description: 'Log rotation check',
  };
  
  const lowValueResult = assessOpportunity(
    lowValueOpp,
    DEGRADED_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [],
    []
  );
  
  assert(
    lowValueResult.gating === GATING_DECISION.DEFER,
    'V3.4: Low-value opportunity DEFERRED during DEGRADED',
    `Got: ${lowValueResult.gating}`
  );
  
  // NOISE during degraded
  const noiseOpp = {
    opportunity_id: 'v3_noise_degraded',
    category: 'intelligence',
    speculative: true,
    confidence: 0.3,
    createsNoise: true,
    priority_score: 0.2,
  };
  
  const noiseResult = assessOpportunity(
    noiseOpp,
    DEGRADED_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [],
    []
  );
  
  assert(
    noiseResult.gating === GATING_DECISION.SUPPRESS,
    'V3.5: Noise opportunity SUPPRESSED during DEGRADED',
    `Got: ${noiseResult.gating}`
  );
}

// ── V4: Opportunity conflicting with active issue → deprioritized ────────────
section('V4: Opportunity conflicting with active issue → deprioritized');

{
  const activeIssues = [
    { issue_id: 'active_001', priority_score: 0.8, category: 'stability' },
  ];
  
  const systemStateWithActive = {
    ...HEALTHY_STATE,
    activePriorityScore: 0.8,
    activeIssueCount: 1,
  };
  
  // HIGH_VALUE with active issue
  const highValueOpp = {
    opportunity_id: 'v4_highvalue_active',
    category: 'optimization',
    hasClearBenefit: true,
    alignsWithOperatorPriority: true,
    actionableWithLowRisk: true,
    speculative: false,
    confidence: 0.85,
    marginPercent: 20,
    priority_score: 0.7,
  };
  
  const result = assessOpportunity(
    highValueOpp,
    systemStateWithActive,
    OPERATOR_CONTEXT_DEFAULT,
    activeIssues,
    []
  );
  
  assert(
    result.adjustedPriority < 0.7,
    'V4.1: High-value adjusted priority reduced by active issue',
    `Original: 0.7, Adjusted: ${result.adjustedPriority}`
  );
  
  assert(
    result.interactionNotes.length > 0,
    'V4.2: Interaction notes recorded'
  );
  
  // LOW_VALUE with active issue should defer
  const lowValueOpp = {
    opportunity_id: 'v4_lowvalue_active',
    category: 'housekeeping',
    hasClearBenefit: false,
    speculative: false,
    confidence: 0.5,
    priority_score: 0.4,
  };
  
  const lowResult = assessOpportunity(
    lowValueOpp,
    {
      ...HEALTHY_STATE,
      activePriorityScore: 0.8,
      activeIssueCount: 1,
      activeChainExists: true, // Explicitly set to trigger high-priority check
    },
    OPERATOR_CONTEXT_DEFAULT,
    [{ issue_id: 'active_001', priority_score: 0.8, category: 'stability' }],
    []
  );
  
  assert(
    lowResult.gating === GATING_DECISION.DEFER,
    'V4.3: Low-value with active high-priority issue DEFERRED',
    `Got: ${lowResult.gating}`
  );
  
  assert(
    lowResult.gatingReason.includes('high-priority'),
    'V4.4: Gating reason mentions high-priority work',
    `Reason: ${lowResult.gatingReason}`
  );
}

// ── V5: Opportunity aligned with operator priorities → surfaced correctly ───
section('V5: Opportunity aligned with operator priorities → surfaced correctly');

{
  const operatorContextAligned = {
    operatorPriorities: ['performance', 'reliability'],
    escalationLevel: 0,
    operatorBusy: false,
    operatorAway: false,
    quietHoursActive: false,
    suppressNotifications: false,
  };
  
  // Opportunity aligns with operator priority
  const alignedOpp = {
    opportunity_id: 'v5_aligned_perf',
    category: 'performance',
    hasClearBenefit: true,
    alignsWithOperatorPriority: true,
    actionableWithLowRisk: true,
    speculative: false,
    confidence: 0.9,
    marginPercent: 25,
    priority_score: 0.75,
    tags: ['performance', 'optimization'],
    description: 'Cache warming strategy for 30% latency reduction',
  };
  
  const result = assessOpportunity(
    alignedOpp,
    HEALTHY_STATE,
    operatorContextAligned,
    [],
    []
  );
  
  assert(
    result.classification === OPPORTUNITY_CLASS.HIGH_VALUE,
    'V5.1: Aligned opportunity classified as HIGH_VALUE',
    `Got: ${result.classification}`
  );
  
  assert(
    result.gating === GATING_DECISION.SURFACE_IMMEDIATELY,
    'V5.2: Aligned opportunity SURFACED',
    `Got: ${result.gating}`
  );
  
  assert(
    result.operatorAlignment.isAligned === true,
    'V5.3: Operator alignment check passed'
  );
  
  assert(
    result.operatorAlignment.canSurface === true,
    'V5.4: Can surface is true'
  );
  
  // Same opportunity during escalation should be deferred
  const escalatedContext = {
    ...operatorContextAligned,
    escalationLevel: 3,
    operatorBusy: true,
  };
  
  const escalatedResult = assessOpportunity(
    alignedOpp,
    HEALTHY_STATE,
    escalatedContext,
    [],
    []
  );
  
  assert(
    escalatedResult.gating === GATING_DECISION.DEFER,
    'V5.5: Aligned opportunity DEFERRED during escalation+busy',
    `Got: ${escalatedResult.gating}`
  );
  
  assert(
    escalatedResult.operatorAlignment.issues.length > 0,
    'V5.6: Operator alignment issues recorded during escalation'
  );
}

// ─── Safety Validation ───────────────────────────────────────────────────────

section('SAFETY: No increase in noise, no approval bypass, no hidden escalation');

{
  // S1: Noise is never surfaced
  const noiseOpp = {
    opportunity_id: 'safety_noise_001',
    speculative: true,
    confidence: 0.3,
    createsNoise: true,
    marginPercent: 1,
    priority_score: 0.2,
  };
  
  const noiseResult = assessOpportunity(
    noiseOpp,
    HEALTHY_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [],
    []
  );
  
  assert(
    noiseResult.gating === GATING_DECISION.SUPPRESS,
    'S1: Noise opportunity is always suppressed',
    `Got: ${noiseResult.gating}`
  );
  
  // S2: All surfacing requires approval
  const highValueOpp = {
    opportunity_id: 'safety_hv_001',
    hasClearBenefit: true,
    alignsWithOperatorPriority: true,
    actionableWithLowRisk: true,
    speculative: false,
    confidence: 0.9,
    marginPercent: 20,
    priority_score: 0.8,
  };
  
  const surfacingResult = assessOpportunity(
    highValueOpp,
    HEALTHY_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [],
    []
  );
  
  assert(
    surfacingResult.requiresApproval === true,
    'S2: All surfacing opportunities require approval',
    `requiresApproval: ${surfacingResult.requiresApproval}`
  );
  
  // S3: No hidden escalation behavior
  // HIGH_VALUE opportunities are designed to surface at all escalation levels (consistent behavior)
  // Non-HIGH_VALUE opportunities are deferred at escalation >= 3
  // The safety check: surfacing should NOT INCREASE as escalation rises
  const escalationLevels = [0, 1, 2, 3, 4, 5];
  const escalationResults = escalationLevels.map(level => {
    const opp = {
      opportunity_id: `safety_esc_${level}`,
      hasClearBenefit: true,
      alignsWithOperatorPriority: true,
      actionableWithLowRisk: true,
      speculative: false,
      confidence: 0.85,
      marginPercent: 15,
      priority_score: 0.7,
    };
    return assessOpportunity(
      opp,
      HEALTHY_STATE,
      { ...OPERATOR_CONTEXT_DEFAULT, escalationLevel: level },
      [],
      []
    );
  });
  
  // Surfacing counts should be consistent across escalation (not increasing)
  // HIGH_VALUE: surfaces at all levels (6 total - by design, consistent)
  // The "no increase" means: at level N, surfacing <= level 0 surfacing
  const level0Surfacing = escalationResults[0].gating === GATING_DECISION.SURFACE_IMMEDIATELY ? 1 : 0;
  
  // Check: no escalation level produces MORE surfacing than level 0
  let maxSurfacingInAnyLevel = 0;
  for (let i = 1; i < escalationResults.length; i++) {
    const surfaces = escalationResults[i].gating === GATING_DECISION.SURFACE_IMMEDIATELY ? 1 : 0;
    maxSurfacingInAnyLevel = Math.max(maxSurfacingInAnyLevel, surfaces);
  }
  
  // Since HIGH_VALUE surfaces at ALL levels, count should be same across all
  const surfacingConsistent = escalationResults.every(r => 
    r.gating === escalationResults[0].gating
  );
  
  assert(
    surfacingConsistent,
    'S3: Surfacing behavior is consistent across escalation levels (no hidden escalation)',
    `Escalation 0-5 surfacing: ${escalationResults.map(r => r.gating)}`
  );
  
  // All HIGH_VALUE surfacing at all escalation is consistent with "no increase" requirement
  // because it never increases - it's always the same (by design for HIGH_VALUE consistency)
  
  // S4: Critical system suppresses everything
  const anyOpp = {
    opportunity_id: 'safety_critical_any',
    hasClearBenefit: true,
    alignsWithOperatorPriority: true,
    actionableWithLowRisk: true,
    speculative: false,
    confidence: 0.95,
    marginPercent: 30,
    priority_score: 0.9,
  };
  
  const criticalResult = assessOpportunity(
    anyOpp,
    CRITICAL_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [],
    []
  );
  
  assert(
    criticalResult.gating === GATING_DECISION.SUPPRESS,
    'S4: Critical system suppresses ALL opportunities (even high-value)',
    `Got: ${criticalResult.gating}`
  );
}

// ─── Batch Assessment Validation ────────────────────────────────────────────

section('BATCH: assessAllOpportunities sorts and categorizes correctly');

{
  const opportunities = [
    {
      opportunity_id: 'batch_001',
      category: 'noise',
      speculative: true,
      confidence: 0.3,
      createsNoise: true,
      priority_score: 0.2,
    },
    {
      opportunity_id: 'batch_002',
      category: 'optimization',
      hasClearBenefit: true,
      alignsWithOperatorPriority: true,
      speculative: false,
      confidence: 0.85,
      marginPercent: 20,
      priority_score: 0.7,
    },
    {
      opportunity_id: 'batch_003',
      category: 'housekeeping',
      speculative: false,
      confidence: 0.5,
      priority_score: 0.35,
    },
  ];
  
  const batchResult = assessAllOpportunities(
    opportunities,
    HEALTHY_STATE,
    OPERATOR_CONTEXT_DEFAULT,
    [],
    []
  );
  
  assert(
    batchResult.surfacingCandidates.length === 1,
    'B1: Exactly 1 surfacing candidate (the high-value optimization)',
    `Got: ${batchResult.surfacingCandidates.length}`
  );
  
  assert(
    batchResult.suppressedCount === 1,
    'B2: Exactly 1 suppressed (the noise)',
    `Got: ${batchResult.suppressedCount}`
  );
  
  assert(
    batchResult.deferredCandidates.length >= 1,
    'B3: At least 1 deferred (low-value)',
    `Got: ${batchResult.deferredCandidates.length}`
  );
  
  assert(
    batchResult.highValueCount === 1,
    'B4: Exactly 1 high-value classified',
    `Got: ${batchResult.highValueCount}`
  );
  
  assert(
    batchResult.noiseCount === 1,
    'B5: Exactly 1 noise classified',
    `Got: ${batchResult.noiseCount}`
  );
  
  // Surfacing candidate should be first in sorted list
  assert(
    batchResult.assessments[0].opportunity_id === 'batch_002',
    'B6: Highest priority opportunity is first in sorted list',
    `First: ${batchResult.assessments[0].opportunity_id}`
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (testsFailed > 0) {
  console.log('⚠️  VALIDATION FAILED — Review tests above');
  process.exit(1);
} else {
  console.log('✅ ALL VALIDATIONS PASSED');
  process.exit(0);
}
