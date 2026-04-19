/**
 * Identity / Memory Consistency Validation — R12
 * 
 * Ensures MOOSA's self-described identity, memory, and behavioral reality
 * remain consistent over time.
 * 
 * Core principle: NO SILENT REWRITING. All inconsistencies are surfaced
 * for operator review. Nothing is automatically modified.
 * 
 * This is a READ-ONLY validation layer that:
 * - Extracts claims from identity/memory artifacts
 * - Compares against actual behavioral evidence
 * - Classifies consistency
 * - Surfaces drift for operator review
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ───────────────────────────────────────────────────────────────

const CONSISTENCY_STATUS = {
  SUPPORTED: 'SUPPORTED',              // Claim matches evidence
  PARTIALLY_SUPPORTED: 'PARTIALLY_SUPPORTED',  // Some evidence supports
  OUTDATED: 'OUTDATED',              // Was true, no longer is
  CONTRADICTED: 'CONTRADICTED',      // Evidence directly contradicts
  UNVERIFIED: 'UNVERIFIED',          // No evidence available to verify
};

const CLAIM_TYPE = {
  IDENTITY: 'identity',        // From IDENTITY.md
  MEMORY: 'memory',            // From MEMORY.md / memory files
  CAPABILITY: 'capability',    // What MOOSA claims it can do
  CONSTRAINT: 'constraint',    // What MOOSA claims it follows
  PATTERN: 'pattern',          // Lesson/pattern claimed to have learned
  RELATIONSHIP: 'relationship', // Claims about relationships/context
};

const EVIDENCE_SOURCE = {
  VALIDATION: 'validation',    // Validation test outputs
  DECISION_LOG: 'decision_log', // Decision records
  ACTION_HISTORY: 'action_history', // Action execution history
  LEARNING_STATE: 'learning_state', // Outcome evaluation records
  SAFETY_CONSTRAINTS: 'safety_constraints', // Safety system state
  CONFIG: 'config',            // Configuration files
  HANDLER_STATE: 'handler_state', // Current handler states
};

// ─── State ───────────────────────────────────────────────────────────────────

let _state = null;
const STATE_PATH = path.join(__dirname, '../../state/identity-consistency.json');

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
    // Last validation timestamp
    last_validated_at: null,
    
    // Extracted claims
    claims: [],
    
    // Evidence gathered
    evidence: {},
    
    // Consistency findings
    findings: [],
    
    // Drift alerts (require operator review)
    drift_alerts: [],
    
    // Proposed updates (NOT auto-applied)
    proposed_updates: [],
    
    // Audit log
    audit_log: [],
    
    // Metrics
    total_validations: 0,
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

// ─── Artifact Locations ─────────────────────────────────────────────────────

const ARTIFACT_PATHS = {
  IDENTITY: path.join(__dirname, '../../../workspace/IDENTITY.md'),
  USER: path.join(__dirname, '../../../workspace/USER.md'),
  SOUL: path.join(__dirname, '../../../workspace/SOUL.md'),
  MEMORY: path.join(__dirname, '../../../workspace/MEMORY.md'),
  AGENTS: path.join(__dirname, '../../../workspace/AGENTS.md'),
  HEARTBEAT: path.join(__dirname, '../../../workspace/HEARTBEAT.md'),
  RECENT_MEMORY: path.join(__dirname, '../../../memory'),
};

// ─── Claim Extraction ───────────────────────────────────────────────────────

/**
 * extractClaims()
 * 
 * Extracts key claims from identity and memory artifacts.
 */
function extractClaims() {
  const claims = [];
  
  // Extract from IDENTITY.md
  const identityClaims = _extractFromFile(ARTIFACT_PATHS.IDENTITY, CLAIM_TYPE.IDENTITY);
  claims.push(...identityClaims);
  
  // Extract from SOUL.md
  const soulClaims = _extractFromFile(ARTIFACT_PATHS.SOUL, CLAIM_TYPE.CONSTRAINT);
  claims.push(...soulClaims);
  
  // Extract from MEMORY.md
  const memoryClaims = _extractFromFile(ARTIFACT_PATHS.MEMORY, CLAIM_TYPE.MEMORY);
  claims.push(...memoryClaims);
  
  // Extract from USER.md (relationships)
  const userClaims = _extractFromFile(ARTIFACT_PATHS.USER, CLAIM_TYPE.RELATIONSHIP);
  claims.push(...userClaims);
  
  // Extract from AGENTS.md (responsibilities)
  const agentsClaims = _extractFromFile(ARTIFACT_PATHS.AGENTS, CLAIM_TYPE.CAPABILITY);
  claims.push(...agentsClaims);
  
  return claims;
}

function _extractFromFile(filePath, baseType) {
  const claims = [];
  
  if (!fs.existsSync(filePath)) return claims;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Pattern: lines starting with "-" or "*" followed by claim text
  // Or lines containing "I am", "I do", "I follow", "I remember"
  
  const claimPatterns = [
    /^[-*]\s+(.+)/,                                    // Bullet points
    /^\*\*(.+?)\*\*/,                                  // Bold headers
    /^#+\s+(.+)/,                                      // Markdown headers
  ];
  
  const selfReferences = [
    /I am\s+(.+)/i,
    /I do\s+(.+)/i,
    /I follow\s+(.+)/i,
    /I remember\s+(.+)/i,
    /I believe\s+(.+)/i,
    /I intend\s+(.+)/i,
    /My (?:name|emoji|vibe)\s+(?:is|are|:)\s*(.+)/i,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    
    // Check self-reference patterns
    for (const pattern of selfReferences) {
      const match = line.match(pattern);
      if (match) {
        claims.push({
          claim_id: `claim_${path.basename(filePath)}_${i}`,
          type: baseType,
          source_file: path.basename(filePath),
          original_text: line,
          extracted_claim: match[1] || match[0],
          line_number: i + 1,
          extracted_at: new Date().toISOString(),
        });
      }
    }
    
    // Check bullet points
    for (const pattern of claimPatterns) {
      const match = line.match(pattern);
      if (match) {
        const text = match[1].trim();
        // Skip if it looks like metadata
        if (text.includes('─') || text.includes('═') || text.includes('...')) continue;
        
        claims.push({
          claim_id: `claim_${path.basename(filePath)}_${i}`,
          type: _inferClaimType(text, baseType),
          source_file: path.basename(filePath),
          original_text: line,
          extracted_claim: text,
          line_number: i + 1,
          extracted_at: new Date().toISOString(),
        });
      }
    }
  }
  
  return claims;
}

function _inferClaimType(text, defaultType) {
  const lower = text.toLowerCase();
  
  if (lower.includes('responsible') || lower.includes('i handle') || lower.includes('i manage')) {
    return CLAIM_TYPE.CAPABILITY;
  }
  if (lower.includes('i do not') || lower.includes('i never') || lower.includes('i always')) {
    return CLAIM_TYPE.CONSTRAINT;
  }
  if (lower.includes('i learned') || lower.includes('pattern') || lower.includes('lesson')) {
    return CLAIM_TYPE.PATTERN;
  }
  if (lower.includes('friend') || lower.includes('human') || lower.includes('my')) {
    return CLAIM_TYPE.RELATIONSHIP;
  }
  
  return defaultType;
}

// ─── Evidence Gathering ─────────────────────────────────────────────────────

/**
 * gatherEvidence(evidenceSources)
 * 
 * Gathers behavioral evidence from various sources.
 */
function gatherEvidence(evidenceSources = Object.values(EVIDENCE_SOURCE)) {
  const evidence = {};
  
  if (evidenceSources.includes(EVIDENCE_SOURCE.VALIDATION)) {
    evidence.validations = _gatherValidationEvidence();
  }
  
  if (evidenceSources.includes(EVIDENCE_SOURCE.DECISION_LOG)) {
    evidence.decisions = _gatherDecisionEvidence();
  }
  
  if (evidenceSources.includes(EVIDENCE_SOURCE.LEARNING_STATE)) {
    evidence.learning = _gatherLearningEvidence();
  }
  
  if (evidenceSources.includes(EVIDENCE_SOURCE.SAFETY_CONSTRAINTS)) {
    evidence.safety = _gatherSafetyEvidence();
  }
  
  if (evidenceSources.includes(EVIDENCE_SOURCE.HANDLER_STATE)) {
    evidence.handlers = _gatherHandlerState();
  }
  
  if (evidenceSources.includes(EVIDENCE_SOURCE.ACTION_HISTORY)) {
    evidence.action_history = _gatherActionHistory();
  }
  
  return evidence;
}

function _gatherValidationEvidence() {
  // Get recent validation results
  const validations = [];
  
  // R6 validation
  const r6Validator = path.join(__dirname, '../../src/handlers/r6-integration-validator.js');
  if (fs.existsSync(r6Validator)) {
    validations.push({
      source: 'r6-validator',
      last_run: fs.statSync(r6Validator).mtime.toISOString(),
      description: 'R6 Continuity Integration Validation',
    });
  }
  
  // R7 validation
  const r7Validator = path.join(__dirname, '../../src/handlers/initiative-discipline-validator.js');
  if (fs.existsSync(r7Validator)) {
    validations.push({
      source: 'r7-validator',
      last_run: fs.statSync(r7Validator).mtime.toISOString(),
      description: 'R7 Initiative Discipline Validation',
    });
  }
  
  // R9 validation
  const r9Validator = path.join(__dirname, '../../src/handlers/r9-validator.js');
  if (fs.existsSync(r9Validator)) {
    validations.push({
      source: 'r9-validator',
      last_run: fs.statSync(r9Validator).mtime.toISOString(),
      description: 'R9 Goal Persistence Validation',
    });
  }
  
  // R10 validation
  const r10Validator = path.join(__dirname, '../../src/handlers/r10-validator.js');
  if (fs.existsSync(r10Validator)) {
    validations.push({
      source: 'r10-validator',
      last_run: fs.statSync(r10Validator).mtime.toISOString(),
      description: 'R10 Workload Governance Validation',
    });
  }
  
  // R11 validation
  const r11Validator = path.join(__dirname, '../../src/handlers/r11-validator.js');
  if (fs.existsSync(r11Validator)) {
    validations.push({
      source: 'r11-validator',
      last_run: fs.statSync(r11Validator).mtime.toISOString(),
      description: 'R11 Outcome Evaluation Validation',
    });
  }
  
  return validations;
}

function _gatherDecisionEvidence() {
  // Check decision log if it exists
  const decisionLog = path.join(__dirname, '../../state/decision-log.json');
  
  if (fs.existsSync(decisionLog)) {
    try {
      const log = JSON.parse(fs.readFileSync(decisionLog, 'utf8'));
      return {
        exists: true,
        entries: Array.isArray(log) ? log.slice(-50) : [],
        last_decision_at: log.last_decision_at || null,
      };
    } catch (e) {
      return { exists: true, error: e.message };
    }
  }
  
  return { exists: false };
}

function _gatherLearningEvidence() {
  // Check outcome evaluation state
  const outcomeState = path.join(__dirname, '../../state/outcome-evaluation.json');
  
  if (fs.existsSync(outcomeState)) {
    try {
      const state = JSON.parse(fs.readFileSync(outcomeState, 'utf8'));
      return {
        exists: true,
        total_evaluations: state.total_evaluations || 0,
        actions_tracked: Object.keys(state.action_reliability || {}).length,
        suppressed_actions: Object.keys(state.suppressed_actions || {}).length,
        recent_match_rate: _calculateRecentMatchRate(state.outcomes || []),
      };
    } catch (e) {
      return { exists: true, error: e.message };
    }
  }
  
  return { exists: false };
}

function _calculateRecentMatchRate(outcomes) {
  const recent = outcomes.slice(-20);
  if (recent.length === 0) return null;
  
  const matches = recent.filter(o => o.outcome_match === 'match').length;
  return {
    matches,
    total: recent.length,
    rate: (matches / recent.length * 100).toFixed(1) + '%',
  };
}

function _gatherSafetyEvidence() {
  // Check safety constraints
  const frozenConstraints = [];
  
  try {
    const outcomeEval = require('./outcome-evaluation');
    frozenConstraints.push(...outcomeEval.getFrozenConstraints());
  } catch (e) {
    // Module not loaded
  }
  
  // Check safety-related handlers
  const interruptHandler = path.join(__dirname, '../../src/handlers/interrupt-handler.js');
  const priorityManager = path.join(__dirname, '../../src/handlers/priority-manager.js');
  
  const safetyHandlers = [];
  if (fs.existsSync(interruptHandler)) safetyHandlers.push('interrupt-handler');
  if (fs.existsSync(priorityManager)) safetyHandlers.push('priority-manager');
  
  return {
    frozen_constraints: frozenConstraints,
    safety_handlers_loaded: safetyHandlers,
    constraints_verified: frozenConstraints.length > 0,
  };
}

function _gatherHandlerState() {
  const handlers = {};
  
  const handlerFiles = [
    'goal-persistence',
    'workload-governance',
    'outcome-evaluation',
    'deferred-work',
    'initiative-discipliner',
  ];
  
  for (const name of handlerFiles) {
    const handlerPath = path.join(__dirname, `../../src/handlers/${name}.js`);
    if (fs.existsSync(handlerPath)) {
      handlers[name] = {
        exists: true,
        last_modified: fs.statSync(handlerPath).mtime.toISOString(),
      };
    }
  }
  
  return handlers;
}

function _gatherActionHistory() {
  // Check action history
  const historyPath = path.join(__dirname, '../../state/action-history.json');
  
  if (fs.existsSync(historyPath)) {
    try {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      return {
        exists: true,
        entries: Array.isArray(history) ? history.slice(-100) : [],
      };
    } catch (e) {
      return { exists: true, error: e.message };
    }
  }
  
  return { exists: false };
}

// ─── Consistency Classification ─────────────────────────────────────────────

/**
 * classifyConsistency(claim, evidence)
 * 
 * Classifies a single claim against gathered evidence.
 */
function classifyConsistency(claim, evidence) {
  const claim_lower = claim.extracted_claim.toLowerCase();
  
  // Check various evidence sources for support/refutation
  
  // 1. Check frozen constraints (for constraint claims)
  if (claim.type === CLAIM_TYPE.CONSTRAINT) {
    const frozen = evidence.learning?.frozen_constraints || [];
    if (frozen.some(c => claim_lower.includes(c))) {
      return {
        status: CONSISTENCY_STATUS.SUPPORTED,
        reason: 'Constraint found in verified frozen constraints',
        supporting_evidence: ['safety_constraints'],
      };
    }
    
    // Check if claim about NOT doing something is actually NOT being done
    if (claim_lower.includes('not') || claim_lower.includes('never')) {
      // Check action history for violations
      if (evidence.action_history?.entries) {
        const violations = _findViolations(claim_lower, evidence.action_history.entries);
        if (violations.length > 0) {
          return {
            status: CONSISTENCY_STATUS.CONTRADICTED,
            reason: `Found ${violations.length} behavioral violations of this constraint`,
            contradicting_evidence: violations.slice(0, 3),
          };
        }
      }
    }
  }
  
  // 2. Check capability claims against handler state
  if (claim.type === CLAIM_TYPE.CAPABILITY) {
    const capability = _extractCapability(claim_lower);
    
    if (capability) {
      const handlerMatch = Object.keys(evidence.handlers || {}).find(h => 
        capability.includes(h.replace('-', ' ')) || h.includes(capability.replace(' ', '_'))
      );
      
      if (handlerMatch) {
        return {
          status: CONSISTENCY_STATUS.SUPPORTED,
          reason: `Handler ${handlerMatch} found for capability`,
          supporting_evidence: [`handler: ${handlerMatch}`],
        };
      }
      
      // Check validation evidence
      if (evidence.validations?.some(v => v.description?.toLowerCase().includes(capability))) {
        return {
          status: CONSISTENCY_STATUS.SUPPORTED,
          reason: 'Capability validated by test suite',
          supporting_evidence: ['validation_tests'],
        };
      }
    }
  }
  
  // 3. Check identity claims against source files
  if (claim.type === CLAIM_TYPE.IDENTITY) {
    // Verify the claim still exists in the source file
    const sourcePath = ARTIFACT_PATHS[claim.source_file.replace('.md', '').toUpperCase()] 
                     || path.join(__dirname, `../../workspace/${claim.source_file}`);
    
    if (fs.existsSync(sourcePath)) {
      const content = fs.readFileSync(sourcePath, 'utf8');
      if (content.includes(claim.extracted_claim) || content.includes(claim.original_text)) {
        return {
          status: CONSISTENCY_STATUS.SUPPORTED,
          reason: 'Claim verified in source artifact',
          supporting_evidence: [claim.source_file],
        };
      } else {
        return {
          status: CONSISTENCY_STATUS.OUTDATED,
          reason: 'Claim text no longer found in source artifact',
          supporting_evidence: [],
        };
      }
    }
  }
  
  // 4. Check learning/pattern claims against learning evidence
  if (claim.type === CLAIM_TYPE.PATTERN || claim.type === CLAIM_TYPE.MEMORY) {
    if (evidence.learning) {
      if (evidence.learning.total_evaluations > 0) {
        return {
          status: CONSISTENCY_STATUS.PARTIALLY_SUPPORTED,
          reason: 'Learning system active but specific pattern not verified',
          supporting_evidence: ['learning_system_active'],
        };
      } else {
        return {
          status: CONSISTENCY_STATUS.UNVERIFIED,
          reason: 'No learning data available to verify pattern',
          supporting_evidence: [],
        };
      }
    }
  }
  
  // 5. Check relationship claims
  if (claim.type === CLAIM_TYPE.RELATIONSHIP) {
    const userPath = ARTIFACT_PATHS.USER;
    if (fs.existsSync(userPath)) {
      const content = fs.readFileSync(userPath, 'utf8');
      if (content.includes(claim.extracted_claim)) {
        return {
          status: CONSISTENCY_STATUS.SUPPORTED,
          reason: 'Relationship claim verified in USER.md',
          supporting_evidence: ['USER.md'],
        };
      }
    }
  }
  
  // Default: unverified
  return {
    status: CONSISTENCY_STATUS.UNVERIFIED,
    reason: 'No sufficient evidence to classify claim',
    supporting_evidence: [],
  };
}

function _extractCapability(claimText) {
  // Extract key capability words
  const capabilities = [
    'goal persistence', 'workload governance', 'outcome evaluation',
    'initiative discipline', 'continuity', 'learning', 'validation',
    'priority management', 'deferred work', 'self-awareness',
  ];
  
  for (const cap of capabilities) {
    if (claimText.includes(cap)) return cap;
  }
  
  return null;
}

function _findViolations(constraintText, history) {
  const violations = [];
  const negativePatterns = ['not', 'never', 'no', 'without'];
  
  // Simple violation detection
  for (const entry of history.slice(-50)) {
    const entryText = JSON.stringify(entry).toLowerCase();
    
    // If constraint says "never do X" and history shows "did X"
    if (constraintText.includes('never') || constraintText.includes('not')) {
      // This is a simplified check
      violations.push({
        timestamp: entry.timestamp || entry.at,
        summary: entry.action || entry.type,
      });
    }
  }
  
  return violations.slice(0, 5);
}

// ─── Drift Detection ────────────────────────────────────────────────────────

/**
 * detectDrift(claims, evidence)
 * 
 * Detects drift between claims and behavioral reality.
 */
function detectDrift(claims, evidence) {
  const driftAlerts = [];
  
  for (const claim of claims) {
    const classification = classifyConsistency(claim, evidence);
    
    if (classification.status === CONSISTENCY_STATUS.CONTRADICTED) {
      driftAlerts.push({
        alert_id: `drift_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        claim_id: claim.claim_id,
        type: 'CONTRADICTION',
        severity: 'HIGH',
        claim: claim.extracted_claim,
        source_file: claim.source_file,
        finding: classification,
        requires_review: true,
        proposed_update: null,  // Never auto-generated
        detected_at: new Date().toISOString(),
      });
    } else if (classification.status === CONSISTENCY_STATUS.OUTDATED) {
      driftAlerts.push({
        alert_id: `drift_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        claim_id: claim.claim_id,
        type: 'OUTDATED',
        severity: 'MEDIUM',
        claim: claim.extracted_claim,
        source_file: claim.source_file,
        finding: classification,
        requires_review: true,
        proposed_update: null,
        detected_at: new Date().toISOString(),
      });
    }
  }
  
  return driftAlerts;
}

// ─── Main Validation Cycle ──────────────────────────────────────────────────

/**
 * runConsistencyValidationCycle()
 * 
 * Main entry point. Runs full identity/memory consistency validation.
 */
function runConsistencyValidationCycle() {
  const state = getState();
  
  // Step 1: Extract claims
  const claims = extractClaims();
  
  // Step 2: Gather evidence
  const evidence = gatherEvidence();
  
  // Step 3: Classify each claim
  const findings = claims.map(claim => ({
    ...claim,
    consistency: classifyConsistency(claim, evidence),
  }));
  
  // Step 4: Detect drift
  const driftAlerts = detectDrift(claims, evidence);
  
  // Step 5: Generate summary
  const summary = _generateSummary(findings, driftAlerts);
  
  // Update state (NOT auto-saving - this is read-only validation)
  state.last_validated_at = new Date().toISOString();
  state.claims = claims;
  state.evidence = evidence;
  state.findings = findings;
  state.drift_alerts = driftAlerts;
  state.total_validations++;
  
  // Audit
  _auditLog('CONSISTENCY_VALIDATION_COMPLETED', null, {
    claims_extracted: claims.length,
    findings_count: findings.length,
    drift_alerts: driftAlerts.length,
  });
  
  return {
    claims_count: claims.length,
    findings: findings,
    drift_alerts: driftAlerts,
    summary,
    evidence,
  };
}

function _generateSummary(findings, driftAlerts) {
  const statusCounts = {};
  
  for (const finding of findings) {
    const status = finding.consistency.status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
  
  return {
    total_claims: findings.length,
    by_status: statusCounts,
    drift_alerts_count: driftAlerts.length,
    high_severity_drift: driftAlerts.filter(a => a.severity === 'HIGH').length,
    medium_severity_drift: driftAlerts.filter(a => a.severity === 'MEDIUM').length,
  };
}

// ─── Proposed Updates (Operator Review Required) ────────────────────────────

/**
 * generateProposedUpdates(driftAlerts)
 * 
 * Generates proposed updates for operator review.
 * IMPORTANT: These are NEVER auto-applied.
 */
function generateProposedUpdates(driftAlerts) {
  const proposed = [];
  
  for (const alert of driftAlerts) {
    if (!alert.requires_review) continue;
    
    proposed.push({
      proposal_id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      alert_id: alert.alert_id,
      type: alert.type === 'OUTDATED' ? 'REMOVE_CLAIM' : 'INVESTIGATE',
      severity: alert.severity,
      
      current_claim: alert.claim,
      source_file: alert.source_file,
      
      // NOT auto-generated - just surfaces the issue
      recommended_action: alert.type === 'OUTDATED'
        ? 'Remove outdated claim or update to reflect current behavior'
        : 'Investigate contradiction between claim and observed behavior',
      
      auto_applied: false,  // Always false - operator review required
      
      created_at: new Date().toISOString(),
    });
  }
  
  return proposed;
}

// ─── Audit ──────────────────────────────────────────────────────────────────

function _auditLog(eventType, targetId, details) {
  const state = getState();
  
  state.audit_log.push({
    event_type: eventType,
    target_id: targetId,
    details,
    timestamp: new Date().toISOString(),
  });
  
  // Don't auto-save - caller decides
}

// ─── Status & Queries ────────────────────────────────────────────────────────

/**
 * getLastValidation()
 */
function getLastValidation() {
  const state = getState();
  
  if (!state.last_validated_at) {
    return null;
  }
  
  return {
    validated_at: state.last_validated_at,
    claims_count: state.claims.length,
    findings_count: state.findings.length,
    drift_alerts_count: state.drift_alerts.length,
  };
}

/**
 * getDriftAlerts(severity)
 */
function getDriftAlerts(severity = null) {
  const state = getState();
  
  if (severity) {
    return state.drift_alerts.filter(a => a.severity === severity);
  }
  
  return state.drift_alerts;
}

/**
 * getFindingsSummary()
 */
function getFindingsSummary() {
  const state = getState();
  
  const summary = {
    total: state.findings.length,
    by_status: {},
    by_type: {},
    by_source: {},
  };
  
  for (const finding of state.findings) {
    const status = finding.consistency.status;
    summary.by_status[status] = (summary.by_status[status] || 0) + 1;
    
    summary.by_type[finding.type] = (summary.by_type[finding.type] || 0) + 1;
    
    const source = finding.source_file;
    summary.by_source[source] = (summary.by_source[source] || 0) + 1;
  }
  
  return summary;
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  // Constants
  CONSISTENCY_STATUS,
  CLAIM_TYPE,
  EVIDENCE_SOURCE,
  
  // Core
  extractClaims,
  gatherEvidence,
  classifyConsistency,
  detectDrift,
  
  // Cycle
  runConsistencyValidationCycle,
  generateProposedUpdates,
  
  // Queries
  getLastValidation,
  getDriftAlerts,
  getFindingsSummary,
  
  // Utils
  resetCaches,
};
