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

module.exports = {
  runPriorityAssessment,
  getSystemStateFromSelfCheck,
  SYSTEM_STATUS,
};
