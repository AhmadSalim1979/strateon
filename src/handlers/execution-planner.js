/**
 * Phase 10I — Multi-Step Execution Planning (MSP)
 * 
 * Structured execution planning with per-step approval discipline.
 * 
 * IMPORTANT: This is a PLANNING module only. It does NOT execute actions.
 * All execution must go through the existing proposal/approval system.
 * 
 * Integrates with:
 * - R9: Goal persistence
 * - R10: Workload governance (SATURATED suppression)
 * - R14: Operator buffer (pending approvals)
 * - R16: Reasoning depth (HIGH for complex plans)
 * - R8: Safe action zones
 * - Decision layer: step prioritization
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAN_STATUS = {
  DRAFT: 'DRAFT',           // Plan created but not active
  ACTIVE: 'ACTIVE',         // Plan is being executed
  PAUSED: 'PAUSED',         // Plan paused (can resume)
  COMPLETED: 'COMPLETED',   // All steps completed
  FAILED: 'FAILED',         // Plan failed (terminal)
  ABANDONED: 'ABANDONED',   // Plan abandoned (terminal)
};

const STEP_STATUS = {
  PENDING: 'PENDING',           // Not yet ready
  READY: 'READY',               // Ready to execute
  AWAITING_APPROVAL: 'AWAITING_APPROVAL', // Waiting for approval
  APPROVED: 'APPROVED',         // Approved, ready to execute
  EXECUTING: 'EXECUTING',      // Currently executing
  COMPLETED: 'COMPLETED',       // Step completed
  FAILED: 'FAILED',            // Step failed
  BLOCKED: 'BLOCKED',           // Dependency not met
};

const ACTION_TYPE = {
  SAFE_AUTONOMOUS: 'SAFE_AUTONOMOUS',     // No approval needed
  SUPERVISED: 'SUPERVISED',               // Requires approval
  RESTRICTED: 'RESTRICTED',               // Requires approval + verification
};

// ─── State ───────────────────────────────────────────────────────────────────

let _state = null;
const STATE_PATH = path.join(__dirname, '../../state/execution-plans.json');

function getState() {
  if (_state) return _state;
  
  if (fs.existsSync(STATE_PATH)) {
    try {
      _state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {
      _state = _freshState();
    }
  } else {
    _state = _freshState();
  }
  return _state;
}

function _freshState() {
  return {
    // All plans indexed by plan_id
    plans: {},
    
    // Audit log
    audit_log: [],
    
    // Metrics
    total_plans_created: 0,
    total_steps_executed: 0,
    total_plans_completed: 0,
    total_plans_abandoned: 0,
  };
}

function saveState() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(getState(), null, 2), 'utf8');
}

function resetCaches() {
  _state = null;
}

// ─── Plan Creation ──────────────────────────────────────────────────────────

/**
 * createPlan(planConfig)
 * 
 * Creates a new execution plan.
 * 
 * planConfig = {
 *   plan_id: string (optional, auto-generated if not provided)
 *   goal_id: string (optional, links to R9 goal)
 *   parent_task_id: string (optional)
 *   description: string,
 *   created_by: string,
 * }
 */
function createPlan(planConfig = {}) {
  const state = getState();
  
  const planId = planConfig.plan_id || `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (state.plans[planId]) {
    return { success: false, error: 'Plan ID already exists' };
  }
  
  const plan = {
    // Identity
    plan_id: planId,
    goal_id: planConfig.goal_id || null,
    parent_task_id: planConfig.parent_task_id || null,
    
    // Metadata
    description: planConfig.description || 'Unnamed plan',
    created_by: planConfig.created_by || 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Status
    plan_status: PLAN_STATUS.DRAFT,
    
    // Steps
    steps: [],
    
    // Plan-level state
    current_step_index: 0,
    completed_steps: 0,
    failed_steps: 0,
    blocked_steps: 0,
    
    // Execution tracking
    execution_history: [],
    last_executed_step: null,
    last_executed_at: null,
    
    // Terminal state protection
    is_terminal: false,
    terminal_reason: null,
    terminal_at: null,
  };
  
  state.plans[planId] = plan;
  state.total_plans_created++;
  
  _auditLog('PLAN_CREATED', planId, {
    description: plan.description,
    goal_id: plan.goal_id,
  });
  
  saveState();
  return { success: true, plan };
}

/**
 * addStep(planId, stepConfig)
 * 
 * Adds a step to an existing plan.
 * 
 * stepConfig = {
 *   step_id: string (optional)
 *   description: string,
 *   action_type: SAFE_AUTONOMOUS | SUPERVISED | RESTRICTED,
 *   dependencies: string[] (step_ids this step depends on)
 *   approval_required: boolean,
 *   estimated_duration: string (optional),
 * }
 */
function addStep(planId, stepConfig = {}) {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) {
    return { success: false, error: 'Plan not found' };
  }
  
  if (plan.is_terminal) {
    return { success: false, error: 'Cannot add steps to terminal plan' };
  }
  
  const stepId = stepConfig.step_id || `step_${planId}_${plan.steps.length + 1}`;
  
  // Check for duplicate step_id
  if (plan.steps.some(s => s.step_id === stepId)) {
    return { success: false, error: 'Step ID already exists in plan' };
  }
  
  // Validate dependencies exist
  if (stepConfig.dependencies && stepConfig.dependencies.length > 0) {
    for (const depId of stepConfig.dependencies) {
      if (!plan.steps.some(s => s.step_id === depId)) {
        return { success: false, error: `Dependency ${depId} not found in plan` };
      }
    }
  }
  
  // Resolve action_type and approval_required BEFORE step object construction.
  // A step with dependencies and no explicit action_type defaults to SUPERVISED,
  // not SAFE_AUTONOMOUS. Explicit values always take precedence.
  const hasExplicitActionType = stepConfig.action_type !== undefined;
  const hasDependencies = stepConfig.dependencies && stepConfig.dependencies.length > 0;
  
  const resolvedActionType = hasExplicitActionType
    ? stepConfig.action_type
    : (hasDependencies ? ACTION_TYPE.SUPERVISED : ACTION_TYPE.SAFE_AUTONOMOUS);
  
  const resolvedApprovalRequired = stepConfig.approval_required === true ||
    (stepConfig.approval_required !== false &&
     resolvedActionType !== ACTION_TYPE.SAFE_AUTONOMOUS);
  
  const step = {
    // Identity
    step_id: stepId,
    plan_id: planId,
    
    // Description
    description: stepConfig.description || 'Unnamed step',
    
    // Dependencies
    dependencies: stepConfig.dependencies || [],
    
    // Action type: explicit wins; dependent step defaults to SUPERVISED
    action_type: resolvedActionType,
    
    // Approval: based on resolved action type; explicit override wins
    approval_required: resolvedApprovalRequired,
    approval_token: null,
    approved_at: null,
    approved_by: null,
    
    // Status
    step_status: STEP_STATUS.PENDING,
    
    // Execution
    executed_at: null,
    execution_result: null,
    failure_reason: null,
    
    // Metadata
    estimated_duration: stepConfig.estimated_duration || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Sequence
    sequence_order: plan.steps.length,
  };
  
  // Set initial status based on dependencies
  if (step.dependencies.length === 0) {
    step.step_status = STEP_STATUS.READY;
  } else {
    step.step_status = STEP_STATUS.PENDING;
  }
  
  plan.steps.push(step);
  plan.updated_at = new Date().toISOString();
  
  _auditLog('STEP_ADDED', planId, {
    step_id: stepId,
    dependencies: step.dependencies,
  });
  
  saveState();
  return { success: true, step };
}

/**
 * activatePlan(planId)
 * 
 * Activates a draft plan, making it ready for execution.
 */
function activatePlan(planId) {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) {
    return { success: false, error: 'Plan not found' };
  }
  
  if (plan.plan_status !== PLAN_STATUS.DRAFT) {
    return { success: false, error: `Cannot activate plan in ${plan.plan_status} status` };
  }
  
  if (plan.steps.length === 0) {
    return { success: false, error: 'Cannot activate plan with no steps' };
  }
  
  // Evaluate all steps for READY status
  _evaluateAllSteps(plan);
  
  // Check if any steps can execute
  const readySteps = plan.steps.filter(s => s.step_status === STEP_STATUS.READY);
  if (readySteps.length === 0 && plan.steps.some(s => s.step_status === STEP_STATUS.BLOCKED)) {
    return { success: false, error: 'All steps are blocked by dependencies' };
  }
  
  plan.plan_status = PLAN_STATUS.ACTIVE;
  plan.updated_at = new Date().toISOString();
  
  _auditLog('PLAN_ACTIVATED', planId, {
    ready_steps: readySteps.length,
    total_steps: plan.steps.length,
  });
  
  saveState();
  return { success: true, plan };
}

// ─── Dependency Resolution ──────────────────────────────────────────────────

/**
 * _evaluateStep(plan, step)
 * 
 * Evaluates a single step's readiness based on dependencies.
 * 
 * A step can be approved when:
 * - All dependencies are at least READY (not FAILED, not BLOCKED)
 * - No dependency is FAILED
 * 
 * A step is BLOCKED only when:
 * - A dependency has FAILED
 */
function _evaluateStep(plan, step) {
  if (step.step_status === STEP_STATUS.COMPLETED || 
      step.step_status === STEP_STATUS.FAILED) {
    return; // Terminal states don't change
  }
  
  // Terminal-like states we don't auto-change
  if (step.step_status === STEP_STATUS.EXECUTING ||
      step.step_status === STEP_STATUS.AWAITING_APPROVAL) {
    return; // Keep current status until something changes
  }
  
  // Note: APPROVED steps ARE re-evaluated because a dependency completing
  // (e.g., step_1 completes) may change the step from APPROVED→READY.
  // Both READY and APPROVED are executable; READY is just the normalized state.
  // COMPLETED and FAILED are terminal and cannot change.
  
  // Check dependency statuses
  let allDependenciesReady = true;
  let anyDependencyFailed = false;
  
  for (const depId of step.dependencies) {
    const depStep = plan.steps.find(s => s.step_id === depId);
    if (!depStep) {
      // Dependency doesn't exist - shouldn't happen but treat as blocked
      allDependenciesReady = false;
      break;
    }
    
    if (depStep.step_status === STEP_STATUS.FAILED) {
      anyDependencyFailed = true;
      break;
    }
    
    // Dependency must be at least READY (COMPLETED or APPROVED/EXECUTING)
    if (depStep.step_status === STEP_STATUS.PENDING ||
        depStep.step_status === STEP_STATUS.BLOCKED) {
      allDependenciesReady = false;
    }
  }
  
  // Determine status
  if (anyDependencyFailed) {
    step.step_status = STEP_STATUS.BLOCKED;
    step.failure_reason = 'Dependency failed';
  } else if (step.dependencies.length > 0 && !allDependenciesReady) {
    // Has deps but they're not all READY yet
    step.step_status = STEP_STATUS.PENDING;
    step.failure_reason = 'Waiting for dependencies';
  } else {
    // Dependencies are ready (or no dependencies)
    if (step.approval_required) {
      step.step_status = STEP_STATUS.AWAITING_APPROVAL;
    } else {
      step.step_status = STEP_STATUS.READY;
    }
    step.failure_reason = null;
  }
  
  step.updated_at = new Date().toISOString();
}

/**
 * _evaluateAllSteps(plan)
 * 
 * Re-evaluates all steps in a plan.
 */
function _evaluateAllSteps(plan) {
  for (const step of plan.steps) {
    _evaluateStep(plan, step);
  }
}

// ─── Plan Lifecycle ─────────────────────────────────────────────────────────

/**
 * pausePlan(planId, reason)
 */
function pausePlan(planId, reason = '') {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  if (plan.is_terminal) {
    return { success: false, error: 'Cannot pause terminal plan' };
  }
  
  if (plan.plan_status === PLAN_STATUS.PAUSED) {
    return { success: false, error: 'Plan is already paused' };
  }
  
  plan.plan_status = PLAN_STATUS.PAUSED;
  plan.updated_at = new Date().toISOString();
  
  _auditLog('PLAN_PAUSED', planId, { reason });
  saveState();
  
  return { success: true, plan };
}

/**
 * resumePlan(planId)
 */
function resumePlan(planId) {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  if (plan.is_terminal) {
    return { success: false, error: 'Cannot resume terminal plan' };
  }
  
  if (plan.plan_status !== PLAN_STATUS.PAUSED) {
    return { success: false, error: 'Plan is not paused' };
  }
  
  // Re-evaluate steps
  _evaluateAllSteps(plan);
  
  plan.plan_status = PLAN_STATUS.ACTIVE;
  plan.updated_at = new Date().toISOString();
  
  _auditLog('PLAN_RESUMED', planId, {});
  saveState();
  
  return { success: true, plan };
}

/**
 * abandonPlan(planId, reason)
 */
function abandonPlan(planId, reason = '') {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  if (plan.is_terminal) {
    return { success: false, error: 'Plan is already terminal' };
  }
  
  plan.plan_status = PLAN_STATUS.ABANDONED;
  plan.is_terminal = true;
  plan.terminal_reason = reason;
  plan.terminal_at = new Date().toISOString();
  plan.updated_at = new Date().toISOString();
  
  state.total_plans_abandoned++;
  
  _auditLog('PLAN_ABANDONED', planId, { reason });
  saveState();
  
  return { success: true, plan };
}

/**
 * completePlan(planId)
 * 
 * Marks plan as completed. Called when all steps are done.
 */
function completePlan(planId) {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  // Check all steps are complete
  const allComplete = plan.steps.every(s => 
    s.step_status === STEP_STATUS.COMPLETED || s.step_status === STEP_STATUS.PENDING
  );
  
  if (!allComplete) {
    return { success: false, error: 'Cannot complete plan with incomplete steps' };
  }
  
  plan.plan_status = PLAN_STATUS.COMPLETED;
  plan.is_terminal = true;
  plan.terminal_reason = 'All steps completed';
  plan.terminal_at = new Date().toISOString();
  plan.updated_at = new Date().toISOString();
  
  state.total_plans_completed++;
  
  _auditLog('PLAN_COMPLETED', planId, {});
  saveState();
  
  return { success: true, plan };
}

/**
 * failPlan(planId, reason)
 * 
 * Marks plan as failed. Terminal state.
 */
function failPlan(planId, reason = '') {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  plan.plan_status = PLAN_STATUS.FAILED;
  plan.is_terminal = true;
  plan.terminal_reason = reason;
  plan.terminal_at = new Date().toISOString();
  plan.updated_at = new Date().toISOString();
  
  _auditLog('PLAN_FAILED', planId, { reason });
  saveState();
  
  return { success: true, plan };
}

// ─── Step Lifecycle ────────────────────────────────────────────────────────

/**
 * getNextExecutableStep(planId)
 * 
 * Returns the next step ready for execution.
 * Does NOT auto-execute — only returns the step for decision layer.
 */
function getNextExecutableStep(planId) {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return null;
  if (plan.is_terminal) return null;
  if (plan.plan_status !== PLAN_STATUS.ACTIVE) return null;
  
  // Find READY steps (not awaiting approval)
  const readySteps = plan.steps.filter(s => 
    s.step_status === STEP_STATUS.READY
  );
  
  if (readySteps.length === 0) return null;
  
  // Return the earliest READY step
  return readySteps.sort((a, b) => a.sequence_order - b.sequence_order)[0];
}

/**
 * requestStepApproval(planId, stepId, requester)
 * 
 * Requests approval for a step. Integrates with R14 operator buffer.
 */
function requestStepApproval(planId, stepId, requester = 'system') {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  const step = plan.steps.find(s => s.step_id === stepId);
  if (!step) return { success: false, error: 'Step not found' };
  
  if (step.step_status !== STEP_STATUS.AWAITING_APPROVAL) {
    return { success: false, error: `Step is not awaiting approval (status: ${step.step_status})` };
  }
  
  if (!step.approval_required) {
    return { success: false, error: 'Step does not require approval' };
  }
  
  // Generate approval token
  const token = `approval_${planId}_${stepId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  step.approval_token = token;
  step.approval_requested_at = new Date().toISOString();
  step.approval_requested_by = requester;
  step.step_status = STEP_STATUS.AWAITING_APPROVAL;
  
  plan.updated_at = new Date().toISOString();
  
  _auditLog('APPROVAL_REQUESTED', planId, { step_id: stepId });
  saveState();
  
  return { 
    success: true, 
    step,
    token,
    message: 'Approval token generated. Submit to operator for approval.' 
  };
}

/**
 * approveStep(planId, stepId, approvalToken, approver)
 * 
 * Approves a step. Token must be valid and one-time use.
 */
function approveStep(planId, stepId, approvalToken, approver = 'operator') {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  const step = plan.steps.find(s => s.step_id === stepId);
  if (!step) return { success: false, error: 'Step not found' };
  
  // Validate token
  if (step.approval_token !== approvalToken) {
    return { success: false, error: 'Invalid approval token' };
  }
  
  if (step.step_status === STEP_STATUS.APPROVED) {
    return { success: false, error: 'Step already approved' };
  }
  
  // Mark as approved
  step.step_status = STEP_STATUS.APPROVED;
  step.approval_token = null; // Consume token
  step.approved_at = new Date().toISOString();
  step.approved_by = approver;
  
  plan.updated_at = new Date().toISOString();
  
  _auditLog('STEP_APPROVED', planId, { step_id: stepId, approver });
  saveState();
  
  return { success: true, step };
}

/**
 * executeStep(planId, stepId, executionContext)
 * 
 * Records step execution. Does NOT actually execute — caller must do that.
 * This is just lifecycle state management.
 */
function executeStep(planId, stepId, executionContext = {}) {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  if (plan.is_terminal) return { success: false, error: 'Plan is terminal' };
  
  const step = plan.steps.find(s => s.step_id === stepId);
  if (!step) return { success: false, error: 'Step not found' };
  
  // Verify step is executable
  const executableStatuses = [STEP_STATUS.READY, STEP_STATUS.APPROVED];
  if (!executableStatuses.includes(step.step_status)) {
    return { success: false, error: `Step cannot execute (status: ${step.step_status})` };
  }
  
  // Mark as executing
  step.step_status = STEP_STATUS.EXECUTING;
  step.executed_at = new Date().toISOString();
  step.execution_context = executionContext;
  
  plan.last_executed_step = stepId;
  plan.last_executed_at = step.executed_at;
  plan.updated_at = new Date().toISOString();
  
  state.total_steps_executed++;
  
  _auditLog('STEP_EXECUTING', planId, { step_id: stepId });
  saveState();
  
  return { success: true, step };
}

/**
 * completeStep(planId, stepId, result)
 * 
 * Marks a step as completed. Does NOT auto-trigger next step.
 */
function completeStep(planId, stepId, result = {}) {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  const step = plan.steps.find(s => s.step_id === stepId);
  if (!step) return { success: false, error: 'Step not found' };
  
  if (step.step_status !== STEP_STATUS.EXECUTING) {
    return { success: false, error: 'Step is not executing' };
  }
  
  // Mark as completed
  step.step_status = STEP_STATUS.COMPLETED;
  step.execution_result = result;
  step.completed_at = new Date().toISOString();
  
  plan.completed_steps++;
  plan.updated_at = new Date().toISOString();
  
  // CRITICAL: Do NOT auto-trigger next step
  // Re-evaluate all steps for READY status
  _evaluateAllSteps(plan);
  
  // Check if plan is complete
  const allComplete = plan.steps.every(s => 
    s.step_status === STEP_STATUS.COMPLETED || 
    s.step_status === STEP_STATUS.PENDING ||
    s.step_status === STEP_STATUS.BLOCKED // Blocked steps won't complete
  );
  
  if (allComplete && plan.steps.every(s => s.step_status === STEP_STATUS.COMPLETED)) {
    completePlan(planId);
  }
  
  _auditLog('STEP_COMPLETED', planId, { step_id: stepId });
  saveState();
  
  return { success: true, step, plan };
}

/**
 * failStep(planId, stepId, reason)
 * 
 * Marks a step as failed. Does NOT cascade to next steps.
 */
function failStep(planId, stepId, reason = '') {
  const state = getState();
  const plan = state.plans[planId];
  
  if (!plan) return { success: false, error: 'Plan not found' };
  
  const step = plan.steps.find(s => s.step_id === stepId);
  if (!step) return { success: false, error: 'Step not found' };
  
  // Mark as failed
  step.step_status = STEP_STATUS.FAILED;
  step.failure_reason = reason;
  step.failed_at = new Date().toISOString();
  
  plan.failed_steps++;
  plan.updated_at = new Date().toISOString();
  
  // Re-evaluate all steps (dependents may need to become BLOCKED)
  _evaluateAllSteps(plan);
  
  _auditLog('STEP_FAILED', planId, { step_id: stepId, reason });
  saveState();
  
  return { success: true, step, plan_status: plan.plan_status };
}

// ─── Query Functions ───────────────────────────────────────────────────────

/**
 * getPlan(planId)
 */
function getPlan(planId) {
  const state = getState();
  return state.plans[planId] || null;
}

/**
 * getActivePlans()
 */
function getActivePlans() {
  const state = getState();
  return Object.values(state.plans).filter(p => 
    !p.is_terminal && p.plan_status === PLAN_STATUS.ACTIVE
  );
}

/**
 * getPlanSummary(planId)
 */
function getPlanSummary(planId) {
  const plan = getPlan(planId);
  if (!plan) return null;
  
  return {
    plan_id: plan.plan_id,
    goal_id: plan.goal_id,
    description: plan.description,
    plan_status: plan.plan_status,
    is_terminal: plan.is_terminal,
    total_steps: plan.steps.length,
    completed_steps: plan.completed_steps,
    failed_steps: plan.failed_steps,
    blocked_steps: plan.blocked_steps,
    next_step: getNextExecutableStep(planId),
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

/**
 * getStep(planId, stepId)
 */
function getStep(planId, stepId) {
  const plan = getPlan(planId);
  if (!plan) return null;
  return plan.steps.find(s => s.step_id === stepId) || null;
}

/**
 * getAuditLog(filter)
 */
function getAuditLog(filter = {}) {
  const state = getState();
  let log = [...state.audit_log];
  
  if (filter.planId) {
    log = log.filter(e => e.plan_id === filter.planId);
  }
  if (filter.eventType) {
    log = log.filter(e => e.event_type === filter.eventType);
  }
  
  return log;
}

/**
 * getPlanningStats()
 */
function getPlanningStats() {
  const state = getState();
  const plans = Object.values(state.plans);
  
  return {
    total_plans: plans.length,
    active_plans: plans.filter(p => p.plan_status === PLAN_STATUS.ACTIVE).length,
    paused_plans: plans.filter(p => p.plan_status === PLAN_STATUS.PAUSED).length,
    completed_plans: plans.filter(p => p.plan_status === PLAN_STATUS.COMPLETED).length,
    failed_plans: plans.filter(p => p.plan_status === PLAN_STATUS.FAILED).length,
    abandoned_plans: plans.filter(p => p.plan_status === PLAN_STATUS.ABANDONED).length,
    total_steps_executed: state.total_steps_executed,
    total_plans_created: state.total_plans_created,
    total_plans_completed: state.total_plans_completed,
    total_plans_abandoned: state.total_plans_abandoned,
  };
}

// ─── Integration Helpers ───────────────────────────────────────────────────

/**
 * getPlansForGoal(goalId)
 * 
 * Returns all plans linked to a specific goal (R9 integration).
 */
function getPlansForGoal(goalId) {
  const state = getState();
  return Object.values(state.plans).filter(p => p.goal_id === goalId);
}

/**
 * getPendingApprovals()
 * 
 * Returns all steps awaiting approval (R14 integration).
 */
function getPendingApprovals() {
  const state = getState();
  const pending = [];
  
  for (const plan of Object.values(state.plans)) {
    if (plan.is_terminal) continue;
    
    const awaitingSteps = plan.steps.filter(s => 
      s.step_status === STEP_STATUS.AWAITING_APPROVAL && s.approval_token
    );
    
    for (const step of awaitingSteps) {
      pending.push({
        plan_id: plan.plan_id,
        plan_description: plan.description,
        step_id: step.step_id,
        step_description: step.description,
        action_type: step.action_type,
        approval_token: step.approval_token,
        requested_at: step.approval_requested_at,
      });
    }
  }
  
  return pending;
}

/**
 * validatePlanForWorkload(planId, workloadState)
 * 
 * Checks if plan can proceed under current workload (R10 integration).
 * Returns { can_proceed, reason, suggestions }
 */
function validatePlanForWorkload(planId, workloadState = {}) {
  const plan = getPlan(planId);
  if (!plan) return { can_proceed: false, reason: 'Plan not found' };
  
  if (plan.is_terminal) {
    return { can_proceed: false, reason: 'Plan is terminal' };
  }
  
  // Check workload state
  const state = workloadState.current_state || 'NORMAL';
  
  if (state === 'SATURATED') {
    // In SATURATED state, only allow SAFE_AUTONOMOUS steps
    const nextStep = getNextExecutableStep(planId);
    if (nextStep && nextStep.action_type !== ACTION_TYPE.SAFE_AUTONOMOUS) {
      return {
        can_proceed: false,
        reason: 'SATURATED state: non-SAFE steps suppressed',
        suggestions: ['Wait for workload to decrease', 'Execute SAFE_AUTONOMOUS steps only'],
      };
    }
  }
  
  return { can_proceed: true, reason: 'OK' };
}

/**
 * getReasoningDepthRecommendation(planId)
 * 
 * Returns recommended reasoning depth for this plan (R16 integration).
 */
function getReasoningDepthRecommendation(planId) {
  const plan = getPlan(planId);
  if (!plan) return 'LOW';
  
  // Complex plans (5+ steps, RESTRICTED actions) need HIGH
  const hasRestrictedActions = plan.steps.some(s => s.action_type === ACTION_TYPE.RESTRICTED);
  const manySteps = plan.steps.length >= 5;
  const hasComplexDependencies = plan.steps.some(s => s.dependencies.length > 2);
  
  if (hasRestrictedActions || (manySteps && hasComplexDependencies)) {
    return 'HIGH';
  }
  
  if (manySteps || hasComplexDependencies) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

// ─── Audit ─────────────────────────────────────────────────────────────────

function _auditLog(eventType, planId, details) {
  const state = getState();
  
  state.audit_log.push({
    event_type: eventType,
    plan_id: planId,
    details,
    timestamp: new Date().toISOString(),
  });
  
  // Keep last 500 entries
  if (state.audit_log.length > 500) {
    state.audit_log = state.audit_log.slice(-500);
  }
}

// ─── Constants Export ──────────────────────────────────────────────────────

function getConstants() {
  return {
    PLAN_STATUS,
    STEP_STATUS,
    ACTION_TYPE,
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  ...getConstants(),
  
  // Plan lifecycle
  createPlan,
  activatePlan,
  pausePlan,
  resumePlan,
  abandonPlan,
  completePlan,
  failPlan,
  
  // Step lifecycle
  addStep,
  getNextExecutableStep,
  requestStepApproval,
  approveStep,
  executeStep,
  completeStep,
  failStep,
  
  // Queries
  getPlan,
  getActivePlans,
  getPlanSummary,
  getStep,
  getAuditLog,
  getPlanningStats,
  
  // Integration helpers
  getPlansForGoal,
  getPendingApprovals,
  validatePlanForWorkload,
  getReasoningDepthRecommendation,
  
  // Utils
  resetCaches,
};
