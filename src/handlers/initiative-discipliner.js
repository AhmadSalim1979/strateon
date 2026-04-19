/**
 * Initiative Discipliner — R6
 * 
 * Disciplined proactive behavior: classifies opportunities,
 * gates surfacing decisions, interacts with priority system,
 * and remains aligned with operator context.
 * 
 * NO AUTONOMOUS EXECUTION. All surfacing is recommendation only.
 * 
 * Classification: HIGH_VALUE | LOW_VALUE | NOISE
 * Gating: SURFACE_IMMEDIATELY | DEFER | SUPPRESS
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const OPPORTUNITY_CLASS = {
  HIGH_VALUE: 'high_value',
  LOW_VALUE: 'low_value',
  NOISE: 'noise',
};

const GATING_DECISION = {
  SURFACE_IMMEDIATELY: 'surface_immediately',
  DEFER: 'defer',
  SUPPRESS: 'suppress',
};

const OPPORTUNITY_CATEGORY = {
  OPTIMIZATION: 'optimization',         // Performance improvement
  RECOVERY: 'recovery',                 // Restoring failed state
  PREVENTION: 'prevention',              // Preventing future issues
  HOUSEKEEPING: 'housekeeping',          // Maintenance/cleanup
  INTELLIGENCE: 'intelligence',          // Informational opportunities
  CORRELATION: 'correlation',            // Pattern correlation opportunities
};

const DEGRADED_SUPPRESSION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes — suppress during degraded unless HIGH_VALUE

// ─── State ───────────────────────────────────────────────────────────────────

let _opportunityStore = null;
const STORE_PATH = path.join(__dirname, '../../state/opportunity-store.json');

function getStore() {
  if (_opportunityStore) return _opportunityStore;
  
  if (fs.existsSync(STORE_PATH)) {
    try {
      _opportunityStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
      _opportunityStore = _freshStore();
    }
  } else {
    _opportunityStore = _freshStore();
  }
  return _opportunityStore;
}

function _freshStore() {
  return {
    opportunities: [],
    suppressed_opportunities: [],
    surfaced_this_cycle: [],
    last_cycle_surfaced: [],
    history: [],
  };
}

function saveStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(getStore(), null, 2), 'utf8');
}

// ─── Opportunity Classification ─────────────────────────────────────────────

/**
 * classifyOpportunity(opportunity, systemContext)
 * 
 * Classifies an opportunity as HIGH_VALUE, LOW_VALUE, or NOISE
 * based on explicit criteria.
 * 
 * HIGH_VALUE criteria (ALL must be true):
 *   - Clear, measurable benefit
 *   - Aligns with operator priorities
 *   - Actionable with low risk
 *   - Not speculative
 * 
 * NOISE criteria (ANY triggers NOISE):
 *   - Highly speculative (no clear signal)
 *   - Benefit is marginal (<5% improvement)
 *   - Would create noise for operator
 *   - Duplicate of recent suppression
 * 
 * Default: LOW_VALUE (middle ground)
 */
function classifyOpportunity(opportunity, systemContext = {}) {
  const {
    hasClearBenefit = false,
    alignsWithOperatorPriority = false,
    actionableWithLowRisk = false,
    speculative = false,
    duplicateOfRecentSuppression = false,
    marginPercent = 0,
    createsNoise = false,
    category = null,
    confidence = 0.5,
    systemStatus = 'HEALTHY',
    isOperatorInitiated = false,
  } = opportunity;

  const {
    operatorPriorities = [],
    activeEscalationLevel = 0,
  } = systemContext;

  // Operator-initiated opportunities get a boost
  if (isOperatorInitiated) {
    return OPPORTUNITY_CLASS.HIGH_VALUE;
  }

  // ── NOISE filters ─────────────────────────────────────────────────────────
  
  // Duplicate of recently suppressed opportunity
  if (duplicateOfRecentSuppression) {
    return OPPORTUNITY_CLASS.NOISE;
  }

  // Highly speculative with low confidence
  if (speculative && confidence < 0.6) {
    return OPPORTUNITY_CLASS.NOISE;
  }

  // Marginal benefit
  if (marginPercent > 0 && marginPercent < 5) {
    return OPPORTUNITY_CLASS.NOISE;
  }

  // Would create noise
  if (createsNoise) {
    return OPPORTUNITY_CLASS.NOISE;
  }

  // ── HIGH_VALUE criteria ───────────────────────────────────────────────────
  
  const highValueSignals = [
    hasClearBenefit,
    alignsWithOperatorPriority,
    actionableWithLowRisk,
    !speculative,
    confidence >= 0.75,
    marginPercent >= 10,
  ];

  const highValueScore = highValueSignals.filter(Boolean).length;

  // Strong HIGH_VALUE: 5+ signals
  if (highValueScore >= 5) {
    return OPPORTUNITY_CLASS.HIGH_VALUE;
  }

  // Aligned HIGH_VALUE: 4 signals AND aligns with operator priority
  if (highValueScore >= 4 && alignsWithOperatorPriority) {
    return OPPORTUNITY_CLASS.HIGH_VALUE;
  }

  // ── Default: LOW_VALUE ─────────────────────────────────────────────────────
  
  return OPPORTUNITY_CLASS.LOW_VALUE;
}

// ─── Initiative Gating ───────────────────────────────────────────────────────

/**
 * assessGating(classification, opportunity, systemState, activeIssues)
 * 
 * Determines whether an opportunity should be:
 *   - SURFACE_IMMEDIATELY: surfaced now
 *   - DEFER: added to deferred queue
 *   - SUPPRESS: discarded with reason
 */
function assessGating(classification, opportunity, systemState = {}, activeIssues = []) {
  const {
    systemStatus = 'HEALTHY',
    isDegraded = false,
    isUnhealthy = false,
    isCritical = false,
    activePriorityScore = 0,
    activeChainExists = false,
    cycleCount = 0,
  } = systemState;

  const opportunityScore = opportunity.priority_score || 0.5;

  // ── CRITICAL system: suppress all non-critical opportunities ──────────────
  if (isCritical) {
    return {
      decision: GATING_DECISION.SUPPRESS,
      reason: 'System is CRITICAL. No non-critical opportunities surface during critical instability.',
      suppressedReason: 'system_critical',
    };
  }

  // ── UNHEALTHY: suppress LOW_VALUE, defer HIGH_VALUE ───────────────────────
  if (isUnhealthy) {
    if (classification === OPPORTUNITY_CLASS.HIGH_VALUE) {
      return {
        decision: GATING_DECISION.DEFER,
        reason: 'System is UNHEALTHY. High-value opportunity deferred until stability returns.',
        deferralReason: 'stability_degraded',
        deferralCategory: 'stability_deferred',
      };
    }
    return {
      decision: GATING_DECISION.SUPPRESS,
      reason: 'System is UNHEALTHY. Low-value opportunity suppressed during instability.',
      suppressedReason: 'system_unhealthy_low_value',
    };
  }

  // ── DEGRADED: suppress NOISE, defer others ────────────────────────────────
  if (isDegraded) {
    if (classification === OPPORTUNITY_CLASS.NOISE) {
      return {
        decision: GATING_DECISION.SUPPRESS,
        reason: 'Degraded system + noise opportunity = suppressed. Would add noise to degraded state.',
        suppressedReason: 'degraded_noise',
      };
    }
    
    if (classification === OPPORTUNITY_CLASS.LOW_VALUE) {
      return {
        decision: GATING_DECISION.DEFER,
        reason: 'System is DEGRADED. Low-value opportunity deferred — not worth surfacing during degraded state.',
        deferralReason: 'system_degraded_low_value',
        deferralCategory: 'low_priority',
      };
    }
    
    // HIGH_VALUE during degraded
    return {
      decision: GATING_DECISION.DEFER,
      reason: 'System is DEGRADED. High-value opportunity deferred until HEALTHY for maximum impact.',
      deferralReason: 'stability_degraded',
      deferralCategory: 'stability_deferred',
    };
  }

  // ── HEALTHY system ─────────────────────────────────────────────────────────
  
  // NOISE never surfaces
  if (classification === OPPORTUNITY_CLASS.NOISE) {
    return {
      decision: GATING_DECISION.SUPPRESS,
      reason: 'Opportunity is classified as noise. Not surfacing regardless of system state.',
      suppressedReason: 'classified_noise',
    };
  }

  // Active critical chain preempts non-critical opportunities
  if (activeChainExists && activePriorityScore > 0.7) {
    if (classification === OPPORTUNITY_CLASS.LOW_VALUE) {
      return {
        decision: GATING_DECISION.DEFER,
        reason: 'Active high-priority work in progress. Low-value opportunity deferred.',
        deferralReason: 'active_high_priority_work',
        deferralCategory: 'weak_initiative',
      };
    }
  }

  // HIGH_VALUE during HEALTHY: surface immediately
  if (classification === OPPORTUNITY_CLASS.HIGH_VALUE) {
    return {
      decision: GATING_DECISION.SURFACE_IMMEDIATELY,
      reason: 'High-value opportunity during HEALTHY system. Clear to surface.',
    };
  }

  // LOW_VALUE during HEALTHY: surface if clear benefit, else defer
  if (opportunityScore > 0.5) {
    return {
      decision: GATING_DECISION.SURFACE_IMMEDIATELY,
      reason: 'Low-value opportunity with above-threshold priority during HEALTHY system.',
    };
  }

  return {
    decision: GATING_DECISION.DEFER,
    reason: 'Low-value opportunity with marginal priority. Deferred for later revisit.',
    deferralReason: 'low_priority_marginal',
    deferralCategory: 'low_priority',
  };
}

// ─── Priority Interaction ─────────────────────────────────────────────────────

/**
 * assessPriorityInteraction(opportunityScore, opportunityClass, systemState, activeIssues, deferredIssues)
 * 
 * Determines how an opportunity competes with:
 * - Active issues
 * - Deferred issues
 * - Paused chains
 * 
 * Returns adjustment to opportunity priority and interaction notes.
 */
function assessPriorityInteraction(opportunityScore, opportunityClass, systemState = {}, activeIssues = [], deferredIssues = []) {
  const {
    activePriorityScore = 0,
    activeIssueCount = 0,
    deferredIssueCount = 0,
    pausedChainCount = 0,
    systemStatus = 'HEALTHY',
  } = systemState;

  let adjustedScore = opportunityScore;
  const interactionNotes = [];

  // Active issues outrank opportunities unless opportunity is HIGH_VALUE
  if (activeIssueCount > 0) {
    if (opportunityClass === OPPORTUNITY_CLASS.HIGH_VALUE) {
      // HIGH_VALUE competes at 80% of its score
      adjustedScore = opportunityScore * 0.8;
      interactionNotes.push('High-value competes with active issues at reduced weight');
    } else {
      // LOW_VALUE competes at 40% of its score
      adjustedScore = opportunityScore * 0.4;
      interactionNotes.push('Low-value opportunity deprioritized against active issues');
    }
  }

  // Deferred issues: only HIGH_VALUE can jump queue
  if (deferredIssueCount > 0 && opportunityClass !== OPPORTUNITY_CLASS.HIGH_VALUE) {
    adjustedScore = adjustedScore * 0.7;
    interactionNotes.push('Deferred issues present — opportunity score reduced');
  }

  // Paused chains: opportunity should not displace unless critical
  if (pausedChainCount > 0) {
    adjustedScore = adjustedScore * 0.9;
    interactionNotes.push('Paused chains present — slight reduction to preserve resume opportunity');
  }

  // System status modifier
  if (systemStatus === 'HEALTHY') {
    // No modifier — full score
  } else if (systemStatus === 'DEGRADED') {
    adjustedScore = adjustedScore * 0.5;
    interactionNotes.push('Degraded status — opportunity score halved');
  } else if (systemStatus === 'UNHEALTHY' || systemStatus === 'CRITICAL') {
    adjustedScore = adjustedScore * 0.2;
    interactionNotes.push('Unhealthy/critical status — opportunity severely deprioritized');
  }

  return {
    adjustedScore: Math.min(1, Math.max(0, adjustedScore)),
    interactionNotes,
    originalScore: opportunityScore,
    suppressionThreshold: 0.15, // Below this, suppress regardless
  };
}

// ─── Operator Alignment ──────────────────────────────────────────────────────

/**
 * checkOperatorAlignment(opportunity, operatorContext = {})
 * 
 * Ensures opportunities respect:
 * - System priorities
 * - Escalation thresholds
 * - Operator preferences
 * - Interrupt rules
 */
function checkOperatorAlignment(opportunity, operatorContext = {}) {
  const {
    operatorPriorities = [],       // What operator cares about
    escalationLevel = 0,           // Current escalation level
    operatorBusy = false,          // Operator is actively working
    operatorAway = false,          // Operator not available
    quietHoursActive = false,       // Quiet hours mode
    suppressNotifications = false, // Notifications suppressed
    lastOperatorMessageAt = null,  // When operator last spoke
    cycleCount = 0,
  } = operatorContext;

  const alignmentScore = {
    priorityAlignment: 0,           // 0-1: aligns with what operator cares about
    escalationAppropriate: true,   // Is this appropriate for current escalation
    timingAppropriate: true,       // Is this a good time to surface
    notificationAppropriate: true, // Should this trigger a notification
  };

  const issues = [];

  // ── Priority alignment ─────────────────────────────────────────────────────
  if (operatorPriorities.length > 0) {
    const aligns = operatorPriorities.some(p => 
      opportunity.category === p || 
      (opportunity.tags && opportunity.tags.includes(p))
    );
    alignmentScore.priorityAlignment = aligns ? 1 : 0;
    if (!aligns && opportunity.classification !== OPPORTUNITY_CLASS.HIGH_VALUE) {
      alignmentScore.timingAppropriate = false;
      issues.push('Does not align with operator priorities');
    }
  }

  // ── Escalation level ───────────────────────────────────────────────────────
  if (escalationLevel >= 3 && opportunity.classification !== OPPORTUNITY_CLASS.HIGH_VALUE) {
    alignmentScore.escalationAppropriate = false;
    alignmentScore.timingAppropriate = false;
    issues.push('Too noisy during active escalation');
  }

  // ── Operator busy ─────────────────────────────────────────────────────────
  if (operatorBusy && !opportunity.isOperatorInitiated) {
    alignmentScore.notificationAppropriate = false;
    issues.push('Operator busy — surfacing deferred');
  }

  // ── Operator away ─────────────────────────────────────────────────────────
  if (operatorAway) {
    alignmentScore.notificationAppropriate = false;
    alignmentScore.timingAppropriate = false;
    issues.push('Operator away — opportunities queued for return');
  }

  // ── Quiet hours ────────────────────────────────────────────────────────────
  if (quietHoursActive && !opportunity.isCritical) {
    alignmentScore.notificationAppropriate = false;
    alignmentScore.timingAppropriate = false;
    issues.push('Quiet hours active — non-critical opportunities suppressed');
  }

  // ── Suppress notifications ────────────────────────────────────────────────
  if (suppressNotifications) {
    alignmentScore.notificationAppropriate = false;
    issues.push('Notifications suppressed globally');
  }

  // ── Recently surfaced opportunity of same type ───────────────────────────
  const store = getStore();
  const recentlySurfaced = store.last_cycle_surfaced || [];
  const duplicateDetected = recentlySurfaced.some(s => 
    s.opportunity_id === opportunity.opportunity_id ||
    s.category === opportunity.category
  );
  if (duplicateDetected && opportunity.classification === OPPORTUNITY_CLASS.LOW_VALUE) {
    alignmentScore.timingAppropriate = false;
    issues.push('Same opportunity type recently surfaced — deferring');
  }

  const isAligned = alignmentScore.timingAppropriate && alignmentScore.escalationAppropriate;

  return {
    isAligned,
    alignmentScore,
    issues,
    canSurface: isAligned && alignmentScore.notificationAppropriate,
    canNotify: isAligned && alignmentScore.notificationAppropriate,
  };
}

// ─── Main Initiative Assessment ──────────────────────────────────────────────

/**
 * assessOpportunity(opportunity, systemState, operatorContext, activeIssues, deferredIssues)
 * 
 * Main entry point. Performs full initiative discipline assessment.
 * 
 * Returns:
 * {
 *   opportunity_id: string,
 *   classification: HIGH_VALUE | LOW_VALUE | NOISE,
 *   gating: SURFACE_IMMEDIATELY | DEFER | SUPPRESS,
 *   gatingReason: string,
 *   adjustedPriority: number,
 *   interactionNotes: string[],
 *   operatorAlignment: { isAligned, canSurface, canNotify, issues },
 *   suppressedReason?: string,
 *   deferralCategory?: string,
 *   recommendation: string,  // Human-readable recommendation
 *   requiresApproval: true,    // Always true — never autonomous
 * }
 */
function assessOpportunity(opportunity, systemState = {}, operatorContext = {}, activeIssues = [], deferredIssues = []) {
  const opportunityId = opportunity.opportunity_id || `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Step 1: Classify
  const classification = classifyOpportunity(opportunity, operatorContext);
  
  // Step 2: Assess priority interaction
  const opportunityScore = opportunity.priority_score || 0.5;
  const priorityResult = assessPriorityInteraction(
    opportunityScore,
    classification,
    systemState,
    activeIssues,
    deferredIssues
  );

  // Step 3: Assess gating (uses classification + system state)
  const gatingResult = assessGating(
    classification,
    { ...opportunity, classification, priority_score: priorityResult.adjustedScore },
    systemState,
    activeIssues
  );

  // Step 4: Check operator alignment
  const operatorAlignment = checkOperatorAlignment(
    { ...opportunity, classification },
    operatorContext
  );

  // ── Build result ────────────────────────────────────────────────────────────
  const result = {
    opportunity_id: opportunityId,
    classification,
    priority_score: opportunityScore,
    adjustedPriority: priorityResult.adjustedScore,
    gating: gatingResult.decision,
    gatingReason: gatingResult.reason,
    interactionNotes: priorityResult.interactionNotes,
    operatorAlignment,
    requiresApproval: true, // Always — never autonomous
    
    // Override gating if operator not aligned
    recommendation: _buildRecommendation(classification, gatingResult.decision, operatorAlignment, priorityResult),
  };

  // Add suppressed reason if applicable
  if (gatingResult.decision === GATING_DECISION.SUPPRESS) {
    result.suppressedReason = gatingResult.suppressedReason;
  }

  // Add deferral info if applicable
  if (gatingResult.decision === GATING_DECISION.DEFER) {
    result.deferralCategory = gatingResult.deferralCategory || 'low_priority';
    result.deferralReason = gatingResult.deferralReason;
  }

  // Mark if can actually surface
  if (gatingResult.decision === GATING_DECISION.SURFACE_IMMEDIATELY && !operatorAlignment.canSurface) {
    result.gating = GATING_DECISION.DEFER;
    result.gatingReason = 'Operator alignment check failed — deferred';
    result.deferralCategory = 'operator_alignment';
    result.deferralReason = 'operator_context';
  }

  return result;
}

function _buildRecommendation(classification, gating, operatorAlignment, priorityResult) {
  if (gating === GATING_DECISION.SUPPRESS) {
    return 'Do not surface. Suppressed by initiative discipline.';
  }
  
  if (gating === GATING_DECISION.DEFER) {
    return 'Deferred. Will revisit based on system state and priority changes.';
  }
  
  if (!operatorAlignment.canNotify) {
    return 'Ready to surface but notification suppressed by operator context. Queue for later notification.';
  }
  
  if (classification === OPPORTUNITY_CLASS.HIGH_VALUE) {
    return 'High-value opportunity. Recommend surfacing to operator for approval.';
  }
  
  return 'Opportunity available. Recommend surfacing if operator bandwidth permits.';
}

// ─── Opportunity Store Management ────────────────────────────────────────────

/**
 * addOpportunity(opportunity) — Add to store
 */
function addOpportunity(opportunity) {
  const store = getStore();
  const now = new Date().toISOString();
  
  const record = {
    opportunity_id: opportunity.opportunity_id || `opp_${Date.now()}`,
    added_at: now,
    last_assessed_at: now,
    classification: null, // Set by assessOpportunity
    gating: null,
    surfacing_attempts: 0,
    surfaced_at: null,
    suppressed_at: null,
    deferred_at: null,
    ...opportunity,
  };
  
  store.opportunities.push(record);
  _pruneOldHistory(store);
  saveStore();
  return record;
}

/**
 * updateOpportunity(opportunityId, updates)
 */
function updateOpportunity(opportunityId, updates) {
  const store = getStore();
  const idx = store.opportunities.findIndex(o => o.opportunity_id === opportunityId);
  if (idx === -1) return null;
  
  store.opportunities[idx] = {
    ...store.opportunities[idx],
    ...updates,
    last_assessed_at: new Date().toISOString(),
  };
  
  saveStore();
  return store.opportunities[idx];
}

/**
 * suppressOpportunity(opportunityId, reason)
 */
function suppressOpportunity(opportunityId, reason) {
  const store = getStore();
  const idx = store.opportunities.findIndex(o => o.opportunity_id === opportunityId);
  if (idx === -1) return null;
  
  const opportunity = store.opportunities[idx];
  
  // Move to suppressed history
  store.opportunities.splice(idx, 1);
  store.suppressed_opportunities.push({
    ...opportunity,
    suppressed_at: new Date().toISOString(),
    suppression_reason: reason,
  });
  
  _pruneOldHistory(store);
  saveStore();
  return opportunity;
}

/**
 * getOpportunities(filter = {})
 */
function getOpportunities(filter = {}) {
  const store = getStore();
  let opportunities = [...store.opportunities];
  
  if (filter.classification) {
    opportunities = opportunities.filter(o => o.classification === filter.classification);
  }
  if (filter.gating) {
    opportunities = opportunities.filter(o => o.gating === filter.gating);
  }
  if (filter.category) {
    opportunities = opportunities.filter(o => o.category === filter.category);
  }
  
  return opportunities;
}

/**
 * getSurfacedThisCycle()
 */
function getSurfacedThisCycle() {
  const store = getStore();
  return store.surfaced_this_cycle;
}

/**
 * markSurfaced(opportunityId)
 */
function markSurfaced(opportunityId) {
  const store = getStore();
  const opportunity = store.opportunities.find(o => o.opportunity_id === opportunityId);
  if (!opportunity) return;
  
  opportunity.surfaced_at = new Date().toISOString();
  opportunity.surfacing_attempts = (opportunity.surfacing_attempts || 0) + 1;
  
  store.surfaced_this_cycle.push({
    opportunity_id: opportunityId,
    surfaced_at: new Date().toISOString(),
    category: opportunity.category,
    classification: opportunity.classification,
  });
  
  saveStore();
}

/**
 * clearSurfacedThisCycle()
 */
function clearSurfacedThisCycle() {
  const store = getStore();
  store.last_cycle_surfaced = [...store.surfaced_this_cycle];
  store.surfaced_this_cycle = [];
  saveStore();
}

/**
 * _pruneOldHistory(store) — Keep history bounded
 */
function _pruneOldHistory(store) {
  const MAX_HISTORY = 100;
  const MAX_SUPPRESSED = 50;
  
  if (store.history.length > MAX_HISTORY) {
    store.history = store.history.slice(-MAX_HISTORY);
  }
  if (store.suppressed_opportunities.length > MAX_SUPPRESSED) {
    store.suppressed_opportunities = store.suppressed_opportunities.slice(-MAX_SUPPRESSED);
  }
}

// ─── Batch Assessment ─────────────────────────────────────────────────────────

/**
 * assessAllOpportunities(opportunities[], systemState, operatorContext, activeIssues, deferredIssues)
 * 
 * Assesses multiple opportunities, returns sorted by adjusted priority.
 */
function assessAllOpportunities(opportunities, systemState, operatorContext, activeIssues, deferredIssues) {
  const results = opportunities.map(opp => {
    const assessment = assessOpportunity(opp, systemState, operatorContext, activeIssues, deferredIssues);
    return assessment;
  });
  
  // Sort: SURFACE > DEFER > SUPPRESS, then by adjusted priority
  const sorted = results.sort((a, b) => {
    const gatingOrder = { surface_immediately: 0, defer: 1, suppress: 2 };
    const gatingDiff = gatingOrder[a.gating] - gatingOrder[b.gating];
    if (gatingDiff !== 0) return gatingDiff;
    return b.adjustedPriority - a.adjustedPriority;
  });
  
  return {
    assessments: sorted,
    surfacingCandidates: sorted.filter(r => r.gating === GATING_DECISION.SURFACE_IMMEDIATELY),
    deferredCandidates: sorted.filter(r => r.gating === GATING_DECISION.DEFER),
    suppressedCount: sorted.filter(r => r.gating === GATING_DECISION.SUPPRESS).length,
    highValueCount: sorted.filter(r => r.classification === OPPORTUNITY_CLASS.HIGH_VALUE).length,
    lowValueCount: sorted.filter(r => r.classification === OPPORTUNITY_CLASS.LOW_VALUE).length,
    noiseCount: sorted.filter(r => r.classification === OPPORTUNITY_CLASS.NOISE).length,
  };
}

// ─── Summary ─────────────────────────────────────────────────────────────────

/**
 * getInitiativeSummary()
 * 
 * Returns current state of initiative discipline system.
 */
function getInitiativeSummary() {
  const store = getStore();
  const opportunities = store.opportunities;
  
  return {
    total_opportunities: opportunities.length,
    by_classification: {
      high_value: opportunities.filter(o => o.classification === OPPORTUNITY_CLASS.HIGH_VALUE).length,
      low_value: opportunities.filter(o => o.classification === OPPORTUNITY_CLASS.LOW_VALUE).length,
      noise: opportunities.filter(o => o.classification === OPPORTUNITY_CLASS.NOISE).length,
    },
    by_gating: {
      surface_immediately: opportunities.filter(o => o.gating === GATING_DECISION.SURFACE_IMMEDIATELY).length,
      defer: opportunities.filter(o => o.gating === GATING_DECISION.DEFER).length,
      suppress: opportunities.filter(o => o.gating === GATING_DECISION.SUPPRESS).length,
    },
    suppressed_history_count: store.suppressed_opportunities.length,
    surfaced_this_cycle: store.surfaced_this_cycle.length,
    last_cycle_surfaced: store.last_cycle_surfaced.length,
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Core assessment
  assessOpportunity,
  assessAllOpportunities,
  
  // Classification
  classifyOpportunity,
  OPPORTUNITY_CLASS,
  
  // Gating
  assessGating,
  GATING_DECISION,
  
  // Priority interaction
  assessPriorityInteraction,
  
  // Operator alignment
  checkOperatorAlignment,
  
  // Store management
  addOpportunity,
  updateOpportunity,
  suppressOpportunity,
  getOpportunities,
  getSurfacedThisCycle,
  markSurfaced,
  clearSurfacedThisCycle,
  getInitiativeSummary,
  
  // Categories
  OPPORTUNITY_CATEGORY,
};
