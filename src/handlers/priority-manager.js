/**
 * Priority Manager — Minimal stub for R6.1 Integration Validation
 * 
 * Provides:
 * - runPriorityAssessment() — generates system state + active issues
 * - System status classification
 */

const SYSTEM_STATUS = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  CRITICAL: 'CRITICAL',
};

/**
 * runPriorityAssessment(patternMemory, priorCycleContext)
 * 
 * Analyzes patterns and determines:
 * - current system status
 * - active issues with priority scores
 * - overall health score
 */
function runPriorityAssessment(patternMemory = {}, priorCycleContext = {}) {
  const patterns = patternMemory.patterns || [];
  const activePatterns = patterns.filter(p => p.status === 'active' || p.status === 'triggered');
  
  // Calculate health score from active patterns
  let healthScore = 1.0;
  let worstStatus = SYSTEM_STATUS.HEALTHY;
  const activeIssues = [];
  
  for (const pattern of activePatterns) {
    const severity = pattern.severity || 1;
    const persistence = pattern.persistence || 1;
    
    // Degrade health based on severity and persistence
    healthScore -= (severity * 0.15 * Math.min(persistence, 3));
    
    // Determine issue priority
    const priorityScore = Math.min(1, (severity * persistence * 0.25));
    
    if (priorityScore > 0.3) {
      activeIssues.push({
        issue_id: pattern.pattern_id || pattern.pattern_key,
        pattern_key: pattern.pattern_key,
        description: pattern.description || pattern.pattern_key,
        priority_score: priorityScore,
        severity: severity,
        persistence: persistence,
        status: pattern.status,
        is_worsening: pattern.is_worsening || false,
        category: pattern.category || 'unknown',
      });
    }
    
    // Determine worst status
    if (severity >= 4) {
      worstStatus = SYSTEM_STATUS.CRITICAL;
    } else if (severity >= 3 && worstStatus !== SYSTEM_STATUS.CRITICAL) {
      worstStatus = SYSTEM_STATUS.UNHEALTHY;
    } else if (severity >= 2 && worstStatus === SYSTEM_STATUS.HEALTHY) {
      worstStatus = SYSTEM_STATUS.DEGRADED;
    }
  }
  
  // Health score bounds
  healthScore = Math.max(0, Math.min(1, healthScore));
  
  // Final status determination
  let systemStatus = SYSTEM_STATUS.HEALTHY;
  if (healthScore < 0.2) systemStatus = SYSTEM_STATUS.CRITICAL;
  else if (healthScore < 0.4) systemStatus = SYSTEM_STATUS.UNHEALTHY;
  else if (healthScore < 0.7) systemStatus = SYSTEM_STATUS.DEGRADED;
  
  // Override with worst status if it indicates higher severity
  if (worstStatus === SYSTEM_STATUS.CRITICAL) systemStatus = SYSTEM_STATUS.CRITICAL;
  else if (worstStatus === SYSTEM_STATUS.UNHEALTHY && systemStatus === SYSTEM_STATUS.HEALTHY) systemStatus = SYSTEM_STATUS.UNHEALTHY;
  else if (worstStatus === SYSTEM_STATUS.DEGRADED && systemStatus === SYSTEM_STATUS.HEALTHY) systemStatus = SYSTEM_STATUS.DEGRADED;
  
  // Sort issues by priority descending
  activeIssues.sort((a, b) => b.priority_score - a.priority_score);
  const topIssue = activeIssues[0] || null;
  
  return {
    systemStatus,
    healthScore,
    activeIssues,
    topPriorityIssue: topIssue,
    activeIssueCount: activeIssues.length,
    isDegraded: systemStatus === SYSTEM_STATUS.DEGRADED,
    isUnhealthy: systemStatus === SYSTEM_STATUS.UNHEALTHY || systemStatus === SYSTEM_STATUS.CRITICAL,
    isCritical: systemStatus === SYSTEM_STATUS.CRITICAL,
    isHealthy: systemStatus === SYSTEM_STATUS.HEALTHY,
    patternSummary: {
      total: patterns.length,
      active: activePatterns.length,
      critical: patterns.filter(p => p.severity >= 4).length,
    },
  };
}

/**
 * getSystemStateFromSelfCheck(selfCheckResult)
 * 
 * Extracts system state from the self-check output.
 */
function getSystemStateFromSelfCheck(selfCheckResult = {}) {
  const status = selfCheckResult.status || 'HEALTHY';
  const healthScore = selfCheckResult.health_score || 1.0;
  
  return {
    systemStatus: status,
    healthScore,
    isDegraded: status === 'DEGRADED',
    isUnhealthy: status === 'UNHEALTHY' || status === 'CRITICAL',
    isCritical: status === 'CRITICAL',
    isHealthy: status === 'HEALTHY',
  };
}

/**
 * computeGoalAwareIssuePriority(basePriorityScore, goalContext, issueDomain)
 *
 * Phase 11.2B — Goal-Influenced Prioritization
 *
 * Applies a small, bounded, additive goal-alignment bonus to a base priority score.
 *
 * Constraints enforced:
 * - Bonus only applies when: relevant goal exists AND base score < 1.0
 * - Bonus is NEVER added to an already-critical (1.0) score
 * - Bonus is hard-capped at MAX_GOAL_BONUS (0.10)
 * - Bonus scales with goal priority: capped at MAX_GOAL_BONUS for priority >= 0.7
 * - bonus = 0 if no relevant goals or no domain match
 *
 * Safety:
 * - This function NEVER overrides a CRITICAL issue score
 * - The bonus is small enough to influence close calls (~0.05-0.10 range)
 *   but not enough to displace a severity-3+ issue
 * - Fully additive: goal bonus is added to base, not multiplied
 *
 * @param {number} basePriorityScore - Raw priority score from runPriorityAssessment (0-1)
 * @param {object|null} goalContext - buildGoalContext() output
 * @param {string} issueDomain - Domain of the issue/pattern (for domain matching)
 * @returns {object} - { finalScore, goalBonusApplied, goalInfluenced, influenceCapped, reason }
 */
const MAX_GOAL_BONUS = 0.10;  // Maximum additive bonus

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

  // Never adjust a CRITICAL (1.0) score — safety first
  if (basePriorityScore >= 1.0) {
    result.goalPriorityReason = 'base_score_at_ceiling';
    return result;
  }

  // No goal context — no adjustment
  if (!goalContext || !Array.isArray(goalContext.top_relevant_goals) || goalContext.top_relevant_goals.length === 0) {
    result.goalPriorityReason = 'no_active_relevant_goals';
    return result;
  }

  const relevantGoals = goalContext.top_relevant_goals;

  // Check if any relevant goal's domain matches the issue domain
  // Domain match: exact or substring (goal_domain in issueDomain or vice versa)
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

  // Compute bonus: proportional to goal priority, capped at MAX_GOAL_BONUS
  // Linear scale: priority 0.7+ → full bonus (0.10), priority 0.3 → minimal bonus (0.04)
  const goalPriority = (matchingGoal.priority !== undefined && matchingGoal.priority !== null)
    ? matchingGoal.priority
    : 0.5;

  let bonus = goalPriority * MAX_GOAL_BONUS;  // 0.7 * 0.10 = 0.07

  // Apply cap
  if (bonus > MAX_GOAL_BONUS) {
    bonus = MAX_GOAL_BONUS;
    result.goalInfluenceCapped = true;
  }

  // Final score cannot exceed 1.0
  const rawFinal = basePriorityScore + bonus;
  result.goalPriorityFinalScore = Math.min(1.0, rawFinal);

  // Only apply if it actually changes something meaningful
  if (bonus >= 0.01) {
    result.goalPriorityBonus = Math.round(bonus * 1000) / 1000; // 3 decimal precision
    result.goalPriorityFinalScore = Math.round(result.goalPriorityFinalScore * 1000) / 1000;
    result.goalInfluencedPrioritization = true;
    result.goalPriorityReason = 'goal_alignment_nudge';
    result.topRelevantGoal = {
      goal_id: matchingGoal.goal_id,
      goal_domain: matchingGoal.goal_domain,
      goal_priority: matchingGoal.priority,
    };
  } else {
    result.goalPriorityReason = 'bonus_too_small';
  }

  return result;
}

module.exports = {
  runPriorityAssessment,
  getSystemStateFromSelfCheck,
  computeGoalAwareIssuePriority,
  SYSTEM_STATUS,
};
