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
    priority: goalDef.priority || GOAL_PRIORITY.MEDIUM,
    description: goalDef.description || 'Unnamed goal',
    creation_reason: goalDef.creation_reason || '',
    success_criteria: Array.isArray(goalDef.success_criteria) 
      ? goalDef.success_criteria 
      : [goalDef.success_criteria || 'Goal achieved'],
    current_status: GOAL_STATUS.ACTIVE,
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
  return store.goals.find(g => g.goal_id === goalId) || null;
}

/**
 * getActiveGoals()
 */
function getActiveGoals() {
  const store = getStore();
  return store.goals
    .filter(g => g.current_status === GOAL_STATUS.ACTIVE)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * getPausedGoals()
 */
function getPausedGoals() {
  const store = getStore();
  return store.goals
    .filter(g => g.current_status === GOAL_STATUS.PAUSED)
    .sort((a, b) => b.priority - a.priority);
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
 */
function assessGoalInteraction(goals, systemState, activeIssues = [], deferredWork = [], pausedChains = []) {
  const { systemStatus = 'HEALTHY', isCritical, isUnhealthy } = systemState;
  
  const interactionResults = [];
  
  for (const goal of goals) {
    const result = {
      goal_id: goal.goal_id,
      goal_type: goal.goal_type,
      priority: goal.priority,
      current_status: goal.current_status,
      recommendation: 'pursue',  // pursue | pause | suppress
      reason: '',
      blocked_by: [],
    };
    
    // CRITICAL system: suppress all non-stability goals
    if (isCritical) {
      if (goal.goal_type === GOAL_TYPE.STABILITY) {
        result.recommendation = 'pursue';
        result.reason = 'Stability goal aligns with critical system needs';
      } else {
        result.recommendation = 'suppress';
        result.reason = 'System is CRITICAL — non-stability goals suppressed';
      }
      interactionResults.push(result);
      continue;
    }
    
    // UNHEALTHY: pause non-stability goals
    if (isUnhealthy) {
      if (goal.goal_type === GOAL_TYPE.STABILITY) {
        result.recommendation = 'pursue';
        result.reason = 'Stability goal aligns with unhealthy system needs';
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
    },
  };
}

// ─── Progress Discipline ──────────────────────────────────────────────────

/**
 * getNextActionableGoal(goals, systemState, activeIssues)
 * 
 * Returns the goal with the highest priority that should be acted on now.
 */
function getNextActionableGoal(goals, systemState, activeIssues = []) {
  const activeGoals = goals.filter(g => g.current_status === GOAL_STATUS.ACTIVE);
  
  if (activeGoals.length === 0) return null;
  
  // Sort by priority
  const sorted = activeGoals.sort((a, b) => b.priority - a.priority);
  
  // Check interaction
  for (const goal of sorted) {
    const interaction = assessGoalInteraction([goal], systemState, activeIssues);
    
    if (interaction.interactions[0]?.recommendation === 'pursue') {
      // Verify no duplication - goal has remaining steps
      if (goal.progress_state.remaining_steps.length > 0 || goal.progress_state.steps_completed < goal.progress_state.steps_total) {
        return {
          goal,
          next_step: goal.progress_state.current_step,
          progress: goal.progress_state.progress_percent,
          recommendation: 'proceed',
        };
      } else {
        // All steps done but not marked complete
        return {
          goal,
          next_step: 'complete_goal',
          progress: goal.progress_state.progress_percent,
          recommendation: 'complete',
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
