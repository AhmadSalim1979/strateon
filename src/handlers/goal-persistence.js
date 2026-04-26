/**
 * Goal Persistence Layer — R9
 * 
 * Enables MOOSA to maintain and pursue meaningful goals across multiple cycles,
 * rather than only reacting to immediate conditions.
 * 
 * Goals persist across cycles, track progress, and interact with the
 * existing priority/deferred/chain systems without overriding critical state.
 * 
 * NO AUTONOMOUS EXECUTION. Goals require approval to act on.
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const GOAL_TYPE = {
  STABILITY: 'stability',         // Fix/resolve system instability
  OPTIMIZATION: 'optimization',   // Improve performance/efficiency
  PREVENTIVE: 'preventive',       // Prevent future issues
  INITIATIVE: 'initiative',       // Proactive opportunity pursuit
};

const GOAL_STATUS = {
  ACTIVE: 'active',               // Goal is being pursued
  PAUSED: 'paused',               // Goal paused (by higher priority work)
  COMPLETED: 'completed',         // Goal achieved its success criteria
  ABANDONED: 'abandoned',         // Goal no longer relevant or feasible
};

const GOAL_PRIORITY = {
  CRITICAL: 0.9,   // Must pursue immediately
  HIGH: 0.7,        // High priority
  MEDIUM: 0.5,      // Default priority
  LOW: 0.3,         // Background priority
};

/**
 * safeNumericPriority(value)
 * 
 * Hardening H1.1: Coerces any priority value to a safe finite number in [0, 1].
 * - Finite numbers are clamped to [0, 1]
 * - Non-numbers (strings, NaN, objects, undefined, null) default to GOAL_PRIORITY.MEDIUM (0.5)
 * 
 * Prevents string/non-numeric priority from causing NaN in sort comparisons.
 */
function safeNumericPriority(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }
  return GOAL_PRIORITY.MEDIUM;
}

// ─── State ───────────────────────────────────────────────────────────────────

let _goalStore = null;
const STORE_PATH = path.join(__dirname, '../../state/goal-persistence.json');

function getStore() {
  if (_goalStore) return _goalStore;
  
  if (fs.existsSync(STORE_PATH)) {
    try {
      _goalStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
      _goalStore = _freshStore();
    }
  } else {
    _goalStore = _freshStore();
  }
  return _goalStore;
}

function _freshStore() {
  return {
    goals: [],
    goal_history: [],
    cycle_count: 0,
    last_updated: new Date().toISOString(),
  };
}

function saveStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const store = getStore();
  store.last_updated = new Date().toISOString();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

// ─── Goal Model ───────────────────────────────────────────────────────────

// ─── Goal Metadata Normalization ───────────────────────────────────────────────

/**
 * normalizeGoalMetadata(goal)
 *
 * Phase 11.2B.1: Applies default metadata to a goal if missing.
 * Called at goal retrieval time for backward compatibility.
 *
 * Ensures:
 *   goal.goal_domain            ← inferred from goal_type if missing
 *   goal.goal_relevance_tags    ← inferred from goal_type + description if missing
 *
 * Does NOT modify the stored goal — returns a normalized copy.
 */
function normalizeGoalMetadata(goal) {
  return {
    ...goal,
    goal_domain: goal.goal_domain || _inferGoalDomain(goal.goal_type),
    goal_relevance_tags: goal.goal_relevance_tags || _inferGoalTags(goal.goal_type, goal.description),
  };
}

// ─── Goal Metadata Inference ───────────────────────────────────────────────────

/**
 * _inferGoalDomain(goalType)
 *
 * Phase 11.2B.1: Provides sensible domain defaults based on goal_type.
 * Maps Phase 10D operational categories to goal domains for relevance matching.
 *
 * Taxonomy:
 *   GOAL_TYPE.STABILITY   → 'stability'     (reactive system stability)
 *   GOAL_TYPE.OPTIMIZATION → 'performance'   (efficiency/performance goals)
 *   GOAL_TYPE.PREVENTIVE   → 'stability'     (preventive stability)
 *   GOAL_TYPE.INITIATIVE   → 'automation'    (proactive workflow/efficiency)
 *   default                → 'general'
 */
function _inferGoalDomain(goalType) {
  const domainMap = {
    [GOAL_TYPE.STABILITY]:   'stability',
    [GOAL_TYPE.OPTIMIZATION]: 'performance',
    [GOAL_TYPE.PREVENTIVE]:   'stability',
    [GOAL_TYPE.INITIATIVE]:   'automation',
  };
  return domainMap[goalType] || 'general';
}

/**
 * _inferGoalTags(goalType, description)
 *
 * Phase 11.2B.1: Provides tag hints based on goal_type and description.
 * Tags improve fine-grained relevance matching beyond domain.
 *
 * Tags are lowercased and stripped for consistency.
 */
function _inferGoalTags(goalType, description = '') {
  const desc = description.toLowerCase();
  const tags = [];

  // Tag inference from goal_type
  if (goalType === GOAL_TYPE.STABILITY) {
    tags.push('system_health', 'reactive');
  } else if (goalType === GOAL_TYPE.OPTIMIZATION) {
    tags.push('efficiency', 'automation');
  } else if (goalType === GOAL_TYPE.PREVENTIVE) {
    tags.push('preventive', 'system_health');
  } else if (goalType === GOAL_TYPE.INITIATIVE) {
    tags.push('proactive', 'automation');
  }

  // Tag inference from description keywords
  if (desc.includes('disk') || desc.includes('memory') || desc.includes('cpu')) {
    tags.push('resource');
  }
  if (desc.includes('error') || desc.includes('fail') || desc.includes('crash')) {
    tags.push('failure');
  }
  if (desc.includes('security') || desc.includes('auth') || desc.includes('access')) {
    tags.push('security');
  }
  if (desc.includes('data') || desc.includes('backup') || desc.includes('replication')) {
    tags.push('data_integrity');
  }

  return [...new Set(tags)]; // deduplicate
}

/**
 * createGoal(goalDef)
 * 
 * Creates a new goal and adds it to the persistent store.
 * 
 * goalDef = {
 *   goal_type: GOAL_TYPE.*,
 *   priority: 0-1,
 *   description: string,
 *   creation_reason: string,
 *   success_criteria: string | string[],
 *   associated_chain_id?: string,
 *   initial_steps?: string[],
 * }
 */
function createGoal(goalDef) {
  const store = getStore();
  const now = new Date().toISOString();
  
  const goal = {
    goal_id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    goal_type: goalDef.goal_type || GOAL_TYPE.INITIATIVE,
    priority: safeNumericPriority(goalDef.priority),
    description: goalDef.description || 'Unnamed goal',
    creation_reason: goalDef.creation_reason || '',
    success_criteria: Array.isArray(goalDef.success_criteria) 
      ? goalDef.success_criteria 
      : [goalDef.success_criteria || 'Goal achieved'],
    current_status: GOAL_STATUS.ACTIVE,

    // Phase 11.2B.1: Normalized goal metadata
    // goal_domain: operational domain for relevance matching (see taxonomy below)
    // goal_relevance_tags: additional relevance labels for fine-grained matching
    goal_domain: goalDef.goal_domain || _inferGoalDomain(goalDef.goal_type),
    goal_relevance_tags: goalDef.goal_relevance_tags || _inferGoalTags(goalDef.goal_type, goalDef.description),
    created_at: now,
    updated_at: now,
    last_progress_at: null,
    
    // Progress tracking
    progress_state: {
      steps_total: goalDef.initial_steps?.length || 0,
      steps_completed: 0,
      current_step: goalDef.initial_steps?.[0] || null,
      remaining_steps: goalDef.initial_steps || [],
      progress_percent: 0,
    },
    
    // Association
    associated_chain_id: goalDef.associated_chain_id || null,
    
    // Completion tracking
    completed_at: null,
    completion_reason: null,
    abandoned_at: null,
    abandonment_reason: null,
    
    // Interaction state
    blocked_by_issues: [],
    blocked_since: null,
    pause_count: 0,
    resume_count: 0,
    
    // Metadata
    created_by: goalDef.created_by || 'system',
    tags: goalDef.tags || [],
  };
  
  store.goals.push(goal);
  _pruneHistory(store);
  saveStore();
  
  return goal;
}

// ─── Goal Queries ─────────────────────────────────────────────────────────

/**
 * getGoal(goalId)
 */
function getGoal(goalId) {
  const store = getStore();
  const goal = store.goals.find(g => g.goal_id === goalId) || null;
  return goal ? normalizeGoalMetadata(goal) : null;
}

/**
 * getActiveGoals()
 */
function getActiveGoals() {
  const store = getStore();
  return store.goals
    .filter(g => g.current_status === GOAL_STATUS.ACTIVE)
    .map(normalizeGoalMetadata)
    .sort((a, b) => safeNumericPriority(b.priority) - safeNumericPriority(a.priority));
}

/**
 * getPausedGoals()
 */
function getPausedGoals() {
  const store = getStore();
  return store.goals
    .filter(g => g.current_status === GOAL_STATUS.PAUSED)
    .map(normalizeGoalMetadata)
    .sort((a, b) => safeNumericPriority(b.priority) - safeNumericPriority(a.priority));
}

/**
 * getCompletedGoals()
 */
function getCompletedGoals() {
  const store = getStore();
  return store.goal_history
    .filter(g => g.current_status === GOAL_STATUS.COMPLETED);
}

/**
 * getAbandonedGoals()
 */
function getAbandonedGoals() {
  const store = getStore();
  return store.goal_history
    .filter(g => g.current_status === GOAL_STATUS.ABANDONED);
}

/**
 * getGoalsByType(goalType)
 */
function getGoalsByType(goalType) {
  const store = getStore();
  return store.goals.filter(g => g.goal_type === goalType);
}

/**
 * getGoalSummary()
 */
function getGoalSummary() {
  const store = getStore();
  const activeGoals = store.goals;
  const historyGoals = store.goal_history || [];
  const allGoals = [...activeGoals, ...historyGoals];
  
  return {
    total_goals: allGoals.length,
    by_status: {
      active: activeGoals.filter(g => g.current_status === GOAL_STATUS.ACTIVE).length,
      paused: activeGoals.filter(g => g.current_status === GOAL_STATUS.PAUSED).length,
      completed: allGoals.filter(g => g.current_status === GOAL_STATUS.COMPLETED).length,
      abandoned: allGoals.filter(g => g.current_status === GOAL_STATUS.ABANDONED).length,
    },
    by_type: {
      stability: allGoals.filter(g => g.goal_type === GOAL_TYPE.STABILITY).length,
      optimization: allGoals.filter(g => g.goal_type === GOAL_TYPE.OPTIMIZATION).length,
      preventive: allGoals.filter(g => g.goal_type === GOAL_TYPE.PREVENTIVE).length,
      initiative: allGoals.filter(g => g.goal_type === GOAL_TYPE.INITIATIVE).length,
    },
    active_goals: activeGoals.length,
    history_goals: historyGoals.length,
    cycle_count: store.cycle_count,
    last_updated: store.last_updated,
  };
}

// ─── Goal Lifecycle ───────────────────────────────────────────────────────

/**
 * advanceProgress(goalId, stepsCompleted = 1)
 * 
 * Advances the goal's progress.
 */
function advanceProgress(goalId, stepsCompleted = 1) {
  const store = getStore();
  const goal = store.goals.find(g => g.goal_id === goalId);
  
  if (!goal) return null;
  if (goal.current_status !== GOAL_STATUS.ACTIVE) {
    return { error: 'Goal is not active', goal };
  }
  
  goal.progress_state.steps_completed += stepsCompleted;
  
  // Update current step
  const remaining = goal.progress_state.remaining_steps;
  if (remaining.length > 0) {
    const nextIndex = goal.progress_state.steps_completed;
    goal.progress_state.current_step = remaining[nextIndex] || null;
  }
  
  // Update progress percent
  if (goal.progress_state.steps_total > 0) {
    goal.progress_state.progress_percent = Math.min(
      100,
      Math.round((goal.progress_state.steps_completed / goal.progress_state.steps_total) * 100)
    );
  }
  
  goal.last_progress_at = new Date().toISOString();
  goal.updated_at = new Date().toISOString();
  
  // Check if complete
  _checkGoalCompletion(goal);
  
  saveStore();
  return goal;
}

/**
 * addStep(goalId, step)
 * 
 * Adds a step to the goal's remaining steps.
 */
function addStep(goalId, step) {
  const store = getStore();
  const goal = store.goals.find(g => g.goal_id === goalId);
  
  if (!goal) return null;
  
  goal.progress_state.steps_total++;
  goal.progress_state.remaining_steps.push(step);
  goal.updated_at = new Date().toISOString();
  
  saveStore();
  return goal;
}

/**
 * _checkGoalCompletion(goal)
 * 
 * Checks if goal has met success criteria and marks complete if so.
 */
function _checkGoalCompletion(goal) {
  // Check if all steps completed
  if (goal.progress_state.steps_completed >= goal.progress_state.steps_total) {
    goal.current_status = GOAL_STATUS.COMPLETED;
    goal.completed_at = new Date().toISOString();
    goal.completion_reason = 'All steps completed';
    
    // Move to history
    _archiveGoal(goal);
  }
}

/**
 * pauseGoal(goalId, reason, blockingIssues = [])
 * 
 * Pauses a goal due to higher-priority work.
 */
function pauseGoal(goalId, reason = '', blockingIssues = []) {
  const store = getStore();
  const goal = store.goals.find(g => g.goal_id === goalId);
  
  if (!goal) return null;
  if (goal.current_status !== GOAL_STATUS.ACTIVE) {
    return { error: 'Goal is not active', goal };
  }
  
  goal.current_status = GOAL_STATUS.PAUSED;
  goal.pause_count++;
  goal.blocked_by_issues = blockingIssues;
  goal.blocked_since = goal.blocked_since || new Date().toISOString();
  goal.updated_at = new Date().toISOString();
  
  saveStore();
  return goal;
}

/**
 * resumeGoal(goalId, reason = '')
 * 
 * Resumes a paused goal.
 */
function resumeGoal(goalId, reason = '') {
  const store = getStore();
  const goal = store.goals.find(g => g.goal_id === goalId);
  
  if (!goal) return null;
  if (goal.current_status !== GOAL_STATUS.PAUSED) {
    return { error: 'Goal is not paused', goal };
  }
  
  goal.current_status = GOAL_STATUS.ACTIVE;
  goal.resume_count++;
  goal.blocked_by_issues = [];
  goal.blocked_since = null;
  goal.updated_at = new Date().toISOString();
  
  saveStore();
  return goal;
}

/**
 * abandonGoal(goalId, reason)
 * 
 * Abandons a goal (no longer relevant or feasible).
 */
function abandonGoal(goalId, reason) {
  const store = getStore();
  const goal = store.goals.find(g => g.goal_id === goalId);
  
  if (!goal) return null;
  
  goal.current_status = GOAL_STATUS.ABANDONED;
  goal.abandoned_at = new Date().toISOString();
  goal.abandonment_reason = reason;
  goal.updated_at = new Date().toISOString();
  
  _archiveGoal(goal);
  saveStore();
  
  return goal;
}

/**
 * completeGoal(goalId, completionReason)
 * 
 * Marks a goal as completed with a specific reason.
 */
function completeGoal(goalId, completionReason) {
  const store = getStore();
  const goal = store.goals.find(g => g.goal_id === goalId);
  
  if (!goal) return null;
  
  goal.current_status = GOAL_STATUS.COMPLETED;
  goal.completed_at = new Date().toISOString();
  goal.completion_reason = completionReason || 'Manually completed';
  goal.updated_at = new Date().toISOString();
  
  _archiveGoal(goal);
  saveStore();
  
  return goal;
}

/**
 * _archiveGoal(goal)
 * 
 * Moves goal to history.
 */
function _archiveGoal(goal) {
  const store = getStore();
  
  // Remove from active list
  store.goals = store.goals.filter(g => g.goal_id !== goal.goal_id);
  
  // Add to history
  store.goal_history.push({
    ...goal,
    archived_at: new Date().toISOString(),
  });
  
  // Prune old history
  if (store.goal_history.length > 50) {
    store.goal_history = store.goal_history.slice(-50);
  }
}

function _pruneHistory(store) {
  if (store.goals.length > 100) {
    // Keep most recent 100
    store.goals = store.goals.slice(-100);
  }
}

/**
 * resetCaches()
 * 
 * Resets in-memory caches. For testing purposes.
 */
function resetCaches() {
  _goalStore = null;
}

// ─── Priority Interaction ──────────────────────────────────────────────────

/**
 * assessGoalInteraction(goals, systemState, activeIssues, deferredWork, pausedChains)
 * 
 * Determines how goals interact with the current system priority state.
 * 
 * Goals should not override critical system state but should persist
 * and be pursued when system is HEALTHY.
 * 
 * REFINEMENT R9.1: STABILITY goals in CRITICAL may only produce
 * diagnostic or containment steps — not actions competing with incident handling.
 * 
 * REFINEMENT R9.2: Active issues always outrank goals EXCEPT when
 * a STABILITY goal directly addresses the same issue.
 */
function assessGoalInteraction(goals, systemState, activeIssues = [], deferredWork = [], pausedChains = []) {
  const { systemStatus = 'HEALTHY', isCritical, isUnhealthy } = systemState;
  
  const interactionResults = [];
  
  // REFINEMENT R9.2: Build map of issue_id to active issue for quick lookup
  const activeIssueIds = new Set(activeIssues.map(i => i.issue_id || i.pattern_key || i.description));
  
  for (const goal of goals) {
    const result = {
      goal_id: goal.goal_id,
      goal_type: goal.goal_type,
      priority: goal.priority,
      current_status: goal.current_status,
      recommendation: 'pursue',  // pursue | pause | suppress | diagnostic_only | containment_only
      reason: '',
      blocked_by: [],
      step_type: 'full',  // full | diagnostic_only | containment_only — R9.1 refinement
    };
    
    // REFINEMENT R9.1: CRITICAL system — STABILITY goals restricted to diagnostic/containment
    if (isCritical) {
      if (goal.goal_type === GOAL_TYPE.STABILITY) {
        // STABILITY goals in CRITICAL may only produce diagnostic or containment steps
        // They must not recommend actions that compete with immediate incident handling
        result.recommendation = 'diagnostic_or_containment_only';
        result.reason = 'System is CRITICAL — STABILITY goal limited to diagnostic/containment steps only';
        result.step_type = 'diagnostic_or_containment_only';
        
        // Check if this STABILITY goal is addressing a currently active issue (R9.2 exception)
        // If so, it may be co-prioritized (but still diagnostic/containment only)
        const goalAddressesActiveIssue = _goalAddressesIssue(goal, activeIssues);
        if (goalAddressesActiveIssue) {
          result.recommendation = 'diagnostic_or_containment_only';
          result.reason = 'System is CRITICAL — STABILITY goal addressing active issue, limited to diagnostic/containment';
        }
      } else {
        result.recommendation = 'suppress';
        result.reason = 'System is CRITICAL — non-stability goals suppressed';
      }
      interactionResults.push(result);
      continue;
    }
    
    // REFINEMENT R9.2: Active issues outrank goals EXCEPT STABILITY addressing same issue
    const activeHighPriorityIssues = activeIssues.filter(i => i.priority_score > 0.7);
    
    if (activeHighPriorityIssues.length > 0) {
      // Check if STABILITY goal directly addresses one of the active issues
      const stabilityGoalAddressingIssue = 
        goal.goal_type === GOAL_TYPE.STABILITY && 
        _goalAddressesIssue(goal, activeHighPriorityIssues);
      
      if (stabilityGoalAddressingIssue) {
        // R9.2 Exception: STABILITY goal directly addressing active issue — co-prioritized
        result.recommendation = 'pursue';
        result.reason = 'STABILITY goal addressing active issue — co-prioritized';
        result.step_type = 'full';  // Full scope since it's addressing the issue directly
      } else if (goal.goal_type === GOAL_TYPE.STABILITY) {
        // STABILITY goal not addressing active issue — still pursue but lower priority
        result.recommendation = 'pursue';
        result.reason = 'STABILITY goal — higher priority than blocking issues';
      } else {
        // Non-STABILITY goals are paused by active high-priority issues
        result.recommendation = 'pause';
        result.reason = 'Active high-priority issues present — goal paused';
        result.blocked_by = activeHighPriorityIssues.map(i => i.issue_id || i.pattern_key || i.description);
      }
      interactionResults.push(result);
      continue;
    }
    
    // UNHEALTHY: pause non-stability goals
    if (isUnhealthy) {
      if (goal.goal_type === GOAL_TYPE.STABILITY) {
        result.recommendation = 'pursue';
        result.reason = 'Stability goal aligns with unhealthy system needs';
        result.step_type = 'full';
      } else {
        result.recommendation = 'pause';
        result.reason = 'System is UNHEALTHY — non-stability goals paused';
        result.blocked_by = ['system_unhealthy'];
      }
      interactionResults.push(result);
      continue;
    }
    
    // DEGRADED: pause non-stability, non-preventive goals
    if (systemStatus === 'DEGRADED') {
      if (goal.goal_type === GOAL_TYPE.STABILITY || goal.goal_type === GOAL_TYPE.PREVENTIVE) {
        result.recommendation = 'pursue';
        result.reason = `${goal.goal_type} goal aligns with degraded system`;
        result.step_type = 'full';
      } else {
        result.recommendation = 'pause';
        result.reason = 'System is DEGRADED — pausing non-critical goals';
        result.blocked_by = ['system_degraded'];
      }
      interactionResults.push(result);
      continue;
    }
    
    // HEALTHY: pursue all active goals
    // Check for blocking issues (available in both ACTIVE and PAUSED branches)
    const highPriorityIssues = activeIssues.filter(i => i.priority_score > 0.7);
    
    if (goal.current_status === GOAL_STATUS.ACTIVE) {
      // Check for blocking issues
      if (highPriorityIssues.length > 0 && goal.priority < GOAL_PRIORITY.HIGH) {
        result.recommendation = 'pause';
        result.reason = 'High-priority issues present — goal paused';
        result.blocked_by = highPriorityIssues.map(i => i.issue_id || i.pattern_key);
      } else {
        result.recommendation = 'pursue';
        result.reason = 'System is HEALTHY — pursuing goal';
        result.step_type = 'full';
      }
    } else if (goal.current_status === GOAL_STATUS.PAUSED) {
      // Check if can resume
      if (highPriorityIssues?.length > 0) {
        result.recommendation = 'remain_paused';
        result.reason = 'Still blocked by high-priority issues';
        result.blocked_by = highPriorityIssues.map(i => i.issue_id || i.pattern_key);
      } else {
        result.recommendation = 'resume';
        result.reason = 'Blockers cleared — goal eligible to resume';
        result.step_type = 'full';
      }
    }
    
    interactionResults.push(result);
  }
  
  return {
    interactions: interactionResults,
    summary: {
      to_pursue: interactionResults.filter(r => r.recommendation === 'pursue').length,
      to_pause: interactionResults.filter(r => r.recommendation === 'pause').length,
      to_resume: interactionResults.filter(r => r.recommendation === 'resume').length,
      suppressed: interactionResults.filter(r => r.recommendation === 'suppress').length,
      diagnostic_or_containment_only: interactionResults.filter(r => r.recommendation === 'diagnostic_or_containment_only').length,
    },
  };
}

/**
 * _goalAddressesIssue(goal, activeIssues)
 * 
 * Internal helper: checks if a goal is addressing a specific active issue.
 * A STABILITY goal addresses an issue if:
 * - The goal has an addressing_issue_id field matching the issue, OR
 * - The goal's description/reason matches the issue description
 */
function _goalAddressesIssue(goal, activeIssues) {
  if (!goal || !activeIssues || activeIssues.length === 0) return false;
  
  // Check explicit addressing
  if (goal.addressing_issue_id) {
    return activeIssues.some(i => 
      i.issue_id === goal.addressing_issue_id || 
      i.pattern_key === goal.addressing_issue_id
    );
  }
  
  // Check if goal description mentions the issue description
  // This is a fuzzy match — more precise matching would use explicit issue IDs
  const goalText = `${goal.description} ${goal.creation_reason}`.toLowerCase();
  
  for (const issue of activeIssues) {
    const issueText = (issue.description || issue.pattern_key || '').toLowerCase();
    // Simple substring match
    if (issueText && goalText.includes(issueText.substring(0, 20))) {
      return true;
    }
    // Also check if issue description is contained in goal text
    if (issueText && goalText.length > 10) {
      // Partial match for longer descriptions
      const shortIssue = issueText.substring(0, Math.min(30, issueText.length));
      if (goalText.includes(shortIssue)) {
        return true;
      }
    }
  }
  
  return false;
}

// ─── Progress Discipline ──────────────────────────────────────────────────

/**
 * getNextActionableGoal(goals, systemState, activeIssues)
 * 
 * Returns the goal with the highest priority that should be acted on now.
 * 
 * Handles R9.1 refinement: diagnostic_or_containment_only goals are actionable
 * but only for diagnostic or containment steps.
 */
function getNextActionableGoal(goals, systemState, activeIssues = []) {
  const activeGoals = goals.filter(g => g.current_status === GOAL_STATUS.ACTIVE);
  
  if (activeGoals.length === 0) return null;
  
  // Sort by priority
  const sorted = activeGoals.sort((a, b) => b.priority - a.priority);
  
  // Check interaction
  for (const goal of sorted) {
    const interaction = assessGoalInteraction([goal], systemState, activeIssues);
    const interactionResult = interaction.interactions[0];
    
    if (interactionResult?.recommendation === 'pursue') {
      // Verify no duplication - goal has remaining steps
      if (goal.progress_state.remaining_steps.length > 0 || goal.progress_state.steps_completed < goal.progress_state.steps_total) {
        return {
          goal,
          next_step: goal.progress_state.current_step,
          progress: goal.progress_state.progress_percent,
          recommendation: 'proceed',
          step_type: interactionResult.step_type || 'full',
        };
      } else {
        // All steps done but not marked complete
        return {
          goal,
          next_step: 'complete_goal',
          progress: goal.progress_state.progress_percent,
          recommendation: 'complete',
          step_type: interactionResult.step_type || 'full',
        };
      }
    } else if (interactionResult?.recommendation === 'diagnostic_or_containment_only') {
      // R9.1: CRITICAL state — STABILITY goal limited to diagnostic/containment
      // Still actionable but step_type signals restricted scope
      if (goal.progress_state.remaining_steps.length > 0 || goal.progress_state.steps_completed < goal.progress_state.steps_total) {
        return {
          goal,
          next_step: goal.progress_state.current_step,
          progress: goal.progress_state.progress_percent,
          recommendation: 'proceed_diagnostic_or_containment',  // Different recommendation
          step_type: 'diagnostic_or_containment_only',  // Explicit step type
          reason: 'CRITICAL state — only diagnostic/containment steps allowed',
        };
      }
    }
  }
  
  return null;
}

/**
 * checkForDuplicateWork(goalId, actionDescription)
 * 
 * Checks if an action was already completed as part of this goal.
 */
function checkForDuplicateWork(goalId, actionDescription) {
  const goal = getGoal(goalId);
  
  // If not in active goals, check history
  const store = getStore();
  const historyGoal = store.goal_history?.find(g => g.goal_id === goalId);
  const foundGoal = goal || historyGoal;
  
  if (!foundGoal) return { is_duplicate: false, completed_steps: 0 };
  
  // Check completed steps
  const completedSteps = foundGoal.progress_state?.steps_completed || 0;
  
  return {
    is_duplicate: false,  // Simplified - would need action tracking
    completed_steps: completedSteps,
  };
}

// ─── Cycle Integration ───────────────────────────────────────────────────

/**
 * tickGoalCycle(systemState, activeIssues, deferredWork, pausedChains)
 * 
 * Called each decision cycle to update goal states based on current conditions.
 * 
 * Returns recommended goal state changes.
 */
function tickGoalCycle(systemState, activeIssues = [], deferredWork = [], pausedChains = []) {
  const store = getStore();
  store.cycle_count++;
  saveStore();
  
  const activeGoals = getActiveGoals();
  const pausedGoals = getPausedGoals();
  
  // Assess all goals
  const allGoals = [...activeGoals, ...pausedGoals];
  const interaction = assessGoalInteraction(allGoals, systemState, activeIssues, deferredWork, pausedChains);
  
  const recommendations = {
    to_pause: [],
    to_resume: [],
    to_complete: [],
    to_abandon: [],
    to_pursue: [],
  };
  
  for (const interactionResult of interaction.interactions) {
    const goal = allGoals.find(g => g.goal_id === interactionResult.goal_id);
    if (!goal) continue;
    
    if (interactionResult.recommendation === 'pause') {
      recommendations.to_pause.push({
        goal_id: goal.goal_id,
        reason: interactionResult.reason,
        blocked_by: interactionResult.blocked_by,
      });
    } else if (interactionResult.recommendation === 'resume') {
      recommendations.to_resume.push({
        goal_id: goal.goal_id,
        reason: interactionResult.reason,
      });
    } else if (interactionResult.recommendation === 'pursue') {
      recommendations.to_pursue.push({
        goal_id: goal.goal_id,
        next_step: goal.progress_state.current_step,
        progress: goal.progress_state.progress_percent,
      });
    }
  }
  
  return {
    cycle_count: store.cycle_count,
    goals_assessed: allGoals.length,
    recommendations,
    goal_summary: getGoalSummary(),
  };
}

// ─── Goal Association ───────────────────────────────────────────────────

/**
 * associateGoalWithChain(goalId, chainId)
 * 
 * Associates a goal with a paused chain for resume tracking.
 */
function associateGoalWithChain(goalId, chainId) {
  const store = getStore();
  const goal = store.goals.find(g => g.goal_id === goalId);
  if (!goal) return null;
  
  goal.associated_chain_id = chainId;
  goal.updated_at = new Date().toISOString();
  saveStore();
  
  return goal;
}

/**
 * getGoalsForChain(chainId)
 * 
 * Returns goals associated with a specific chain.
 */
function getGoalsForChain(chainId) {
  const store = getStore();
  return store.goals.filter(g => g.associated_chain_id === chainId);
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  GOAL_TYPE,
  GOAL_STATUS,
  GOAL_PRIORITY,
  safeNumericPriority,
  
  // Goal lifecycle
  createGoal,
  getGoal,
  getActiveGoals,
  getPausedGoals,
  getCompletedGoals,
  getAbandonedGoals,
  getGoalsByType,
  getGoalSummary,
  
  // Progress
  advanceProgress,
  addStep,
  
  // State transitions
  pauseGoal,
  resumeGoal,
  abandonGoal,
  completeGoal,
  
  // Priority interaction
  assessGoalInteraction,
  getNextActionableGoal,
  
  // Progress discipline
  checkForDuplicateWork,
  resetCaches,
  
  // Cycle integration
  tickGoalCycle,
  
  // Association
  associateGoalWithChain,
  getGoalsForChain,
};
