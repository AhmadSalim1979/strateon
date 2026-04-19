/**
 * Interrupt Handler — Minimal stub for R6.1 Integration Validation
 * 
 * Provides:
 * - assessInterrupt() — preemption decision
 * - assessResume() — resume eligibility
 */

const {
  getActiveChain,
  getPausedChains,
  savePausedWork,
  CONTINUITY_STATUS,
} = require('./continuity-store');

const PREEMPTION_DECISION = {
  NONE: 'none',
  IGNORE_NOISE: 'ignore_noise',
  QUEUE_NEW_ISSUE: 'queue_new_issue',
  PREEMPT_AND_PAUSE_CURRENT: 'preempt_and_pause_current',
  ESCALATE_INTERRUPT: 'escalate_interrupt',
};

const RESUME_DECISION = {
  REMAIN_PAUSED: 'remain_paused',
  ELIGIBLE_TO_RESUME: 'eligible_to_resume',
  SUPPRESS_PAUSED_CHAIN: 'suppress_paused_chain',
  REQUIRE_FRESH_REPLAN: 'require_fresh_replan',
};

/**
 * assessInterrupt(currentCycleResult, priorCycleContext, activePatterns, prioritizationResult)
 */
function assessInterrupt(currentCycleResult = {}, priorCycleContext = {}, activePatterns = [], prioritizationResult = {}) {
  const currentStatus = currentCycleResult.systemStatus || 'HEALTHY';
  const priorStatus = priorCycleContext.systemStatus || 'HEALTHY';
  
  // Check for new degradation
  const isNewBreakdown = currentStatus !== 'HEALTHY' && priorStatus === 'HEALTHY';
  
  // Check for worsening
  const statusOrder = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2, CRITICAL: 3 };
  const isWorsening = statusOrder[currentStatus] > statusOrder[priorStatus];
  
  // Get interrupting pattern if any
  const activeIssues = prioritizationResult.activeIssues || [];
  const topIssue = activeIssues[0] || null;
  
  let interruptDetected = false;
  let preemptionDecision = PREEMPTION_DECISION.NONE;
  let preemptionReason = 'No interrupt detected.';
  
  // CRITICAL always preempts
  if (currentStatus === 'CRITICAL') {
    const activeChain = getActiveChain();
    if (activeChain) {
      interruptDetected = true;
      preemptionDecision = PREEMPTION_DECISION.PREEMPT_AND_PAUSE_CURRENT;
      preemptionReason = `System is CRITICAL. Critical instability takes absolute precedence over any ongoing work. Current chain will be paused.`;
      
      // Save paused work
      savePausedWork({
        chain_id: activeChain.chain_id,
        issue: activeChain.chain_issue,
        paused_reason: preemptionReason,
        resume_condition: 'Cannot resume while system is CRITICAL. Escalation required.',
        completed_steps: activeChain.completed_steps || [],
        remaining_steps: activeChain.remaining_steps || [],
        preemption: {
          interrupting_issue: topIssue ? topIssue.description : 'critical_system_state',
          preemption_decision: preemptionDecision,
        },
      });
    } else {
      preemptionDecision = PREEMPTION_DECISION.ESCALATE_INTERRUPT;
      preemptionReason = 'System is CRITICAL. No active chain to pause. Escalation required.';
      interruptDetected = true;
    }
  }
  // UNHEALTHY + worsening + persistent pattern
  else if (currentStatus === 'UNHEALTHY' && isWorsening) {
    const activeChain = getActiveChain();
    const worseningPattern = activePatterns.find(p => p.is_worsening && p.severity >= 3);
    
    if (activeChain && worseningPattern) {
      interruptDetected = true;
      preemptionDecision = PREEMPTION_DECISION.PREEMPT_AND_PAUSE_CURRENT;
      preemptionReason = `System is UNHEALTHY and worsening. Active work paused.`;
      
      savePausedWork({
        chain_id: activeChain.chain_id,
        issue: activeChain.chain_issue,
        paused_reason: preemptionReason,
        resume_condition: 'Cannot resume while system is UNHEALTHY.',
        completed_steps: activeChain.completed_steps || [],
        remaining_steps: activeChain.remaining_steps || [],
        preemption: {
          interrupting_issue: worseningPattern.description || 'unhealthy_worsening',
          preemption_decision: preemptionDecision,
        },
      });
    }
  }
  // DEGRADED alone is not sufficient for preemption unless noisy
  else if (currentStatus === 'DEGRADED') {
    const activeChain = getActiveChain();
    const noisyPattern = activePatterns.find(p => 
      p.first_seen && p.is_noisy && p.severity < 3
    );
    
    if (!activeChain || noisyPattern) {
      preemptionDecision = PREEMPTION_DECISION.IGNORE_NOISE;
      preemptionReason = 'Degraded but signal is weak or stable. Current work continues.';
    }
  }
  
  // Check paused chains
  const pausedChains = getPausedChains();
  
  return {
    interrupt_detected: interruptDetected,
    interrupting_issue: topIssue ? {
      issue: topIssue.description,
      status: currentStatus,
      priority_score: topIssue.priority_score,
      pattern_severity: topIssue.severity,
      is_worsening: isWorsening,
      is_new_breakdown: isNewBreakdown,
    } : null,
    preemption_decision: preemptionDecision,
    preemption_reason: preemptionReason,
    paused_work_item: getActiveChain() ? null : null, // Will be set if preemption occurred
    noise_filtered: preemptionDecision === PREEMPTION_DECISION.IGNORE_NOISE,
    resume_condition: interruptDetected ? 'Interrupt in progress' : null,
    proceed_with_new_issue: !interruptDetected || preemptionDecision === PREEMPTION_DECISION.IGNORE_NOISE,
  };
}

/**
 * assessResume(currentStatus, activePatterns, prioritizationResult)
 */
function assessResume(currentStatus = 'HEALTHY', activePatterns = [], prioritizationResult = {}) {
  const pausedChains = getPausedChains();
  
  if (pausedChains.length === 0) {
    return {
      resume_detected: false,
      resume_candidate_chain: null,
      resume_eligibility: null,
      resume_decision: null,
      resume_reason: 'No paused chains.',
      resume_next_step: null,
      total_paused_chains: 0,
    };
  }
  
  // Sort by most recently paused
  pausedChains.sort((a, b) => new Date(b.paused_at) - new Date(a.paused_at));
  const candidate = pausedChains[0];
  
  // Calculate paused age
  const pausedAgeMs = Date.now() - new Date(candidate.paused_at).getTime();
  const pausedAgeCycles = Math.floor(pausedAgeMs / (5 * 60 * 1000)); // 5 min per cycle
  
  candidate.paused_age_cycles = pausedAgeCycles;
  candidate.is_stale = pausedAgeCycles > 24;
  
  // Determine resume eligibility
  let resumeEligibility = 'pending';
  let resumeDecision = RESUME_DECISION.REMAIN_PAUSED;
  let resumeReason = 'Checking conditions...';
  
  if (candidate.is_stale) {
    resumeEligibility = 'stale';
    resumeDecision = RESUME_DECISION.REQUIRE_FRESH_REPLAN;
    resumeReason = 'Paused chain is stale (>24 cycles). Fresh re-plan required.';
  } else if (currentStatus !== 'HEALTHY') {
    resumeEligibility = 'blocked_by_status';
    resumeDecision = RESUME_DECISION.REMAIN_PAUSED;
    resumeReason = `System is ${currentStatus}. Resume condition: HEALTHY required.`;
  } else if (prioritizationResult.activeIssues && prioritizationResult.activeIssues.length > 0) {
    const topIssue = prioritizationResult.activeIssues[0];
    if (topIssue.priority_score > 0.8) {
      resumeEligibility = 'blocked_by_higher_priority';
      resumeDecision = RESUME_DECISION.REMAIN_PAUSED;
      resumeReason = 'Active higher-priority issue. Paused work remains paused.';
    }
  }
  
  if (resumeDecision === RESUME_DECISION.REMAIN_PAUSED) {
    return {
      resume_detected: true,
      resume_candidate_chain: candidate,
      resume_eligibility: resumeEligibility,
      resume_decision: resumeDecision,
      resume_reason: resumeReason,
      resume_next_step: null,
      total_paused_chains: pausedChains.length,
    };
  }
  
  // Eligible to resume
  resumeEligibility = 'ready';
  resumeDecision = RESUME_DECISION.ELIGIBLE_TO_RESUME;
  resumeReason = `System is HEALTHY and interrupting issue has cleared. Paused chain eligible to resume.`;
  
  // Build next step
  let resumeNextStep = null;
  if (candidate.remaining_steps && candidate.remaining_steps.length > 0) {
    const nextStep = candidate.remaining_steps[0];
    resumeNextStep = {
      step_number: nextStep.step_number || candidate.completed_steps.length + 1,
      action_id: nextStep.action_id,
      step_description: nextStep.description || nextStep.action_id,
      requires_approval: true,
      is_valid: true,
    };
  }
  
  return {
    resume_detected: true,
    resume_candidate_chain: candidate,
    resume_eligibility: resumeEligibility,
    resume_decision: resumeDecision,
    resume_reason: resumeReason,
    resume_next_step: resumeNextStep,
    total_paused_chains: pausedChains.length,
  };
}

module.exports = {
  assessInterrupt,
  assessResume,
  PREEMPTION_DECISION,
  RESUME_DECISION,
};
