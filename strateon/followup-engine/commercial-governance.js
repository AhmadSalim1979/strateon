/**
 * Qiyadon — Commercial Governance Policy Engine
 * Version: 1.0
 *
 * ═══════════════════════════════════════════════════════════════════
 * CORE PRINCIPLE
 * ═══════════════════════════════════════════════════════════════════
 *
 * The system operates AUTONOMOUSLY inside clearly defined policy
 * boundaries. It does NOT ask Ahmad for approval before routine
 * outbound sends.
 *
 * Human role: governors, strategists, escalation handlers, policy setters.
 * NOT: email approvers.
 *
 * ═══════════════════════════════════════════════════════════════════
 * RISK TIER DEFINITIONS
 * ═══════════════════════════════════════════════════════════════════
 *
 * TIER 1 — SAFE_AUTONOMOUS
 *   System may act without human involvement.
 *   Examples: cadence follow-up, artifact delivery, reply parsing,
 *   lead suppression, cadence continuation, lightweight engagement.
 *
 * TIER 2 — MONITOR_AUTONOMOUS
 *   System may act but logs decision for review.
 *   Examples: first outreach to new segment, template adaptation,
 *   tone shift, new context module activation.
 *
 * TIER 3 — ESCALATE_REQUIRED
 *   System must flag for human review before or immediately after.
 *   Examples: pricing discussion, procurement request,
 *   enterprise contract discussion, legal concern.
 *
 * TIER 4 — RESTRICTED
 *   System must NOT act autonomously. Human required.
 *   Examples: discount approval, contract terms, integration commitments,
 *   security guarantees, media exposure.
 *
 * ═══════════════════════════════════════════════════════════════════
 * OUTBOUND RISK CLASSIFICATION
 * ═══════════════════════════════════════════════════════════════════
 *
 * Every outbound action is classified across 3 dimensions:
 *
 * RISK LEVEL:    1 (minimal) → 5 (severe)
 * ESCALATION:    none | log | immediate | block
 * AUTONOMY:      full | monitored | required | prohibited
 */

'use strict';

// ─── RISK TIER CONSTANTS ──────────────────────────────────────────────────────

const TIER = {
  SAFE_AUTONOMOUS:     1,
  MONITOR_AUTONOMOUS:  2,
  ESCALATE_REQUIRED:   3,
  RESTRICTED:          4,
};

const AUTONOMY = {
  full:       'full',       // Acts without asking
  monitored: 'monitored',  // Acts but logs for review
  required:  'required',  // Human review required before
  prohibited:'prohibited', // Must never act
};

const ESCALATION = {
  none:     'none',     // No escalation needed
  log:     'log',      // Log decision, act immediately
  immediate: 'immediate', // Flag immediately, act after review
  block:   'block',    // Block, do not act
};

// ─── ACTION CLASSIFICATION ───────────────────────────────────────────────────

/**
 * classifyAction — determines risk tier and autonomy level for any action.
 * Returns { tier, riskLevel, autonomy, escalation, reason }
 */
function classifyAction(actionType, context = {}) {
  const registry = ACTION_REGISTRY[actionType];
  if (!registry) {
    return {
      tier: TIER.RESTRICTED,
      riskLevel: 5,
      autonomy: AUTONOMY.prohibited,
      escalation: ESCALATION.block,
      reason: 'Unknown action type — default restricted',
    };
  }

  const base = { ...registry };

  // Context modifiers
  if (context.hasRecipientOptOut) {
    return {
      tier: TIER.RESTRICTED,
      riskLevel: 1,
      autonomy: AUTONOMY.prohibited,
      escalation: ESCALATION.block,
      reason: 'Recipient has opted out — cannot send',
    };
  }

  if (context.isNegativeSentiment) {
    return {
      tier: TIER.ESCALATE_REQUIRED,
      riskLevel: 4,
      autonomy: AUTONOMY.required,
      escalation: ESCALATION.immediate,
      reason: 'Negative sentiment detected — escalate immediately',
    };
  }

  if (context.isEnterpriseDeal) {
    // Enterprise deals raise certain actions to escalation tier
    if (base.tier >= TIER.MONITOR_AUTONOMOUS) {
      return { ...base, reason: base.reason + ' (enterprise modifier applied)' };
    }
  }

  return base;
}

// ─── ACTION REGISTRY ─────────────────────────────────────────────────────────

const ACTION_REGISTRY = {

  // ── TIER 1: SAFE_AUTONOMOUS ─────────────────────────────────────────────
  // System acts without asking

  'cadence.follow_up': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Routine cadence follow-up within established sequence',
  },
  'cadence.continue': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Continuing established cadence',
  },
  'cadence.pause': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Pausing cadence per lead request or opt-out',
  },
  'cadence.resume': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Resuming paused cadence',
  },
  'artifact.deliver': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Delivering requested operational artifact',
  },
  'reply.parse': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Parsing and classifying lead reply',
  },
  'lead.suppress': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Suppressing lead per opt-out or governance rule',
  },
  'cadence.adapt_tone': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Adapting message tone within approved templates',
  },
  'cadence.adapt_context': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Selecting context-appropriate template variant',
  },
  'report.weekly_digest': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Delivering scheduled weekly digest',
  },
  'escalation.acknowledge': {
    tier: TIER.SAFE_AUTONOMOUS,
    riskLevel: 1,
    autonomy: AUTONOMY.full,
    escalation: ESCALATION.none,
    reason: 'Acknowledging escalation to human',
  },

  // ── TIER 2: MONITOR_AUTONOMOUS ─────────────────────────────────────────
  // System acts but logs for review

  'outreach.first_contact': {
    tier: TIER.MONITOR_AUTONOMOUS,
    riskLevel: 2,
    autonomy: AUTONOMY.monitored,
    escalation: ESCALATION.log,
    reason: 'First outreach to new lead — log for review',
  },
  'outreach.new_segment': {
    tier: TIER.MONITOR_AUTONOMOUS,
    riskLevel: 2,
    autonomy: AUTONOMY.monitored,
    escalation: ESCALATION.log,
    reason: 'First outreach to new company segment or industry',
  },
  'template.adapt': {
    tier: TIER.MONITOR_AUTONOMOUS,
    riskLevel: 2,
    autonomy: AUTONOMY.monitored,
    escalation: ESCALATION.log,
    reason: 'Adapting template for new context module',
  },
  'cadence.escalate_to_artifacts': {
    tier: TIER.MONITOR_AUTONOMOUS,
    riskLevel: 2,
    autonomy: AUTONOMY.monitored,
    escalation: ESCALATION.log,
    reason: 'Escalating from cadence to artifact delivery',
  },
  'outreach.reactivate': {
    tier: TIER.MONITOR_AUTONOMOUS,
    riskLevel: 2,
    autonomy: AUTONOMY.monitored,
    escalation: ESCALATION.log,
    reason: 'Reactivating suppressed lead after cooling period',
  },

  // ── TIER 3: ESCALATE_REQUIRED ──────────────────────────────────────────
  // Human review required before action

  'commercial.pricing_discussion': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 4,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Pricing discussion — escalate to human',
  },
  'commercial.procurement_request': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 4,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Procurement or vendor onboarding request — escalate',
  },
  'legal.contract_question': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 4,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Contract or legal question — escalate to human',
  },
  'security.concern': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 4,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Security concern raised — escalate immediately',
  },
  'enterprise.contract_discussion': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 4,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Enterprise contract discussion — escalate to human',
  },
  'executive.complaint': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 4,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Executive complaint or escalation — escalate immediately',
  },
  'sentiment.negative': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 4,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Negative sentiment detected — escalate immediately',
  },
  'media.exposure': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 5,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Media or public exposure mention — escalate immediately',
  },
  'compliance.data_concern': {
    tier: TIER.ESCALATE_REQUIRED,
    riskLevel: 5,
    autonomy: AUTONOMY.required,
    escalation: ESCALATION.immediate,
    reason: 'Data privacy or compliance concern — escalate immediately',
  },

  // ── TIER 4: RESTRICTED ─────────────────────────────────────────────────
  // Must never act autonomously

  'commercial.discount_approve': {
    tier: TIER.RESTRICTED,
    riskLevel: 5,
    autonomy: AUTONOMY.prohibited,
    escalation: ESCALATION.block,
    reason: 'Discount approval — human decision only',
  },
  'legal.contract_commit': {
    tier: TIER.RESTRICTED,
    riskLevel: 5,
    autonomy: AUTONOMY.prohibited,
    escalation: ESCALATION.block,
    reason: 'Contractual commitment — human only',
  },
  'commercial.outcome_guarantee': {
    tier: TIER.RESTRICTED,
    riskLevel: 5,
    autonomy: AUTONOMY.prohibited,
    escalation: ESCALATION.block,
    reason: 'Outcome guarantee or promise — prohibited',
  },
  'governance.policy_alter': {
    tier: TIER.RESTRICTED,
    riskLevel: 5,
    autonomy: AUTONOMY.prohibited,
    escalation: ESCALATION.block,
    reason: 'Altering governance policy — prohibited',
  },
  'integration.commit': {
    tier: TIER.RESTRICTED,
    riskLevel: 5,
    autonomy: AUTONOMY.prohibited,
    escalation: ESCALATION.block,
    reason: 'Integration commitment — human only',
  },
  'security.guarantee': {
    tier: TIER.RESTRICTED,
    riskLevel: 5,
    autonomy: AUTONOMY.prohibited,
    escalation: ESCALATION.block,
    reason: 'Security guarantee — human only',
  },
  'public.statement': {
    tier: TIER.RESTRICTED,
    riskLevel: 5,
    autonomy: AUTONOMY.prohibited,
    escalation: ESCALATION.block,
    reason: 'Public-facing statement — human only',
  },
};

// ─── AUTONOMOUS ACTION REGISTRY ──────────────────────────────────────────────

/**
 * AutonomousActionLog — logs every action taken by the system
 * with full decision context. Used for audit and governance.
 */
class AutonomousActionLog {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.localBuffer = [];
  }

  /**
   * Log an action that the system took or will take.
   */
  async log(action) {
    const entry = {
      id: generateUUID(),
      action_type: action.actionType,
      lead_id: action.leadId || null,
      client_id: action.clientId || null,
      decision_reason: action.reason,
      risk_tier: action.tier,
      risk_level: action.riskLevel,
      autonomy_mode: action.autonomy,
      escalation_state: action.escalation,
      context_module: action.contextModule || null,
      account_brief_snapshot: action.accountBrief || null,
      email_subject: action.emailSubject || null,
      email_sent_at: action.emailSentAt || null,
      escalation_notified_at: action.escalationNotifiedAt || null,
      human_response_at: null, // filled when human responds
      outcome: 'pending',
      created_at: new Date().toISOString(),
    };

    if (this.supabase) {
      await this.supabase.from('governance_action_log').insert(entry).catch(() => {
        this.localBuffer.push(entry); // buffer if insert fails
      });
    } else {
      this.localBuffer.push(entry);
    }

    return entry;
  }

  /**
   * Update an action's outcome after completion or escalation.
   */
  async updateOutcome(actionId, outcome) {
    if (this.supabase) {
      await this.supabase
        .from('governance_action_log')
        .update({ outcome, updated_at: new Date().toISOString() })
        .eq('id', actionId);
    }
  }

  /**
   * Get recent actions for a client (for review).
   */
  async getRecent(clientId, limit = 50) {
    if (!this.supabase) return this.localBuffer.slice(-limit);
    const { data } = await this.supabase
      .from('governance_action_log')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }
}

// ─── REPUTATION SAFETY LAYER ─────────────────────────────────────────────────

/**
 * ReputationSafetyLayer — prevents outbound patterns that could
 * damage domain reputation or deliverability.
 */
class ReputationSafetyLayer {
  constructor() {
    this.outboundCounts = new Map();      // domain → count (rolling window)
    this.similarityCache = new Map();      // leadId → last content hash
    this.escalationCounts = new Map();    // leadId → escalation count (24h)
    this.lastOutboundAt = new Map();      // leadId → timestamp

    this.LIMITS = {
      maxPerDomainPerDay: 50,            // Domain-level rate cap
      maxSameContentGap: 3,               // Days between near-identical sends
      maxEscalationsPerLeadPerDay: 3,    // Escalation throttle
      minOutboundGapMs: 300000,          // 5 min minimum between sends to same lead
      similarityThreshold: 0.85,         // Content similarity that triggers throttle
      maxTotalPerDay: 200,               // Total outbound cap
    };
  }

  /**
   * Check if an outbound action is safe to proceed.
   * Returns { allowed: boolean, reason: string, throttleMs?: number }
   */
  checkOutbound(action) {
    const { lead, contentHash } = action;
    const domain = extractDomain(lead.email);
    const now = Date.now();

    // Check 1: Domain rate limit
    const domainCount = this.outboundCounts.get(domain) || 0;
    if (domainCount >= this.LIMITS.maxPerDomainPerDay) {
      return {
        allowed: false,
        reason: `Domain rate limit reached (${domainCount}/${this.LIMITS.maxPerDomainPerDay})`,
        throttleMs: null,
      };
    }

    // Check 2: Total outbound cap
    const totalToday = Array.from(this.outboundCounts.values()).reduce((a, b) => a + b, 0);
    if (totalToday >= this.LIMITS.maxTotalPerDay) {
      return {
        allowed: false,
        reason: `Total daily outbound cap reached (${this.LIMITS.maxTotalPerDay})`,
        throttleMs: null,
      };
    }

    // Check 3: Lead-level minimum gap
    const lastOut = this.lastOutboundAt.get(lead.id);
    if (lastOut && (now - lastOut) < this.LIMITS.minOutboundGapMs) {
      const waitMs = this.LIMITS.minOutboundGapMs - (now - lastOut);
      return {
        allowed: false,
        reason: `Minimum gap between sends not reached`,
        throttleMs: waitMs,
      };
    }

    // Check 4: Content similarity (don't send near-identical content twice quickly)
    const lastHash = this.similarityCache.get(lead.id);
    if (lastHash && this._contentSimilarity(contentHash, lastHash) > this.LIMITS.similarityThreshold) {
      return {
        allowed: false,
        reason: `Similar content sent recently — throttle active`,
        throttleMs: null,
      };
    }

    // Check 5: Escalation frequency for this lead
    const escCount = this.escalationCounts.get(lead.id) || 0;
    if (escCount >= this.LIMITS.maxEscalationsPerLeadPerDay) {
      return {
        allowed: false,
        reason: `Escalation frequency limit reached for this lead`,
        throttleMs: null,
      };
    }

    return { allowed: true, reason: 'All checks passed' };
  }

  /**
   * Record that an outbound action was taken.
   */
  recordOutbound(action) {
    const domain = extractDomain(action.lead.email);
    this.outboundCounts.set(domain, (this.outboundCounts.get(domain) || 0) + 1);
    this.lastOutboundAt.set(action.lead.id, Date.now());
    this.similarityCache.set(action.lead.id, action.contentHash);
  }

  /**
   * Record an escalation for this lead.
   */
  recordEscalation(leadId) {
    const current = this.escalationCounts.get(leadId) || 0;
    this.escalationCounts.set(leadId, current + 1);
  }

  /**
   * Reset daily counters (called at midnight).
   */
  resetDaily() {
    this.outboundCounts.clear();
    this.escalationCounts.clear();
  }

  _contentSimilarity(hash1, hash2) {
    if (hash1 === hash2) return 1;
    // Simple hash comparison — in production, use proper diff
    return hash1.split('').filter((c, i) => c === hash2[i]).length / Math.max(hash1.length, hash2.length);
  }
}

// ─── COMMERCIAL GOVERNANCE ENGINE ────────────────────────────────────────────

/**
 * CommercialGovernanceEngine — orchestrates the full governance decision.
 *
 * Usage:
 *   const decision = await engine.evaluate({ actionType: 'cadence.follow_up', lead, content });
 *   if (decision.canAct) { await engine.execute(decision); }
 *   else { await engine.escalate(decision); }
 */
class CommercialGovernanceEngine {
  constructor(supabaseClient, reputationSafety) {
    this.actionLog = new AutonomousActionLog(supabaseClient);
    this.safety = reputationSafety || new ReputationSafetyLayer();
    this.onEscalation = null; // callback: (escalation) => void
  }

  /**
   * Evaluate an action and determine if it can proceed.
   */
  async evaluate(actionType, context = {}) {
    const { lead, accountBrief, contentHash, clientId } = context;

    // Step 1: Classify the action
    const classification = classifyAction(actionType, { ...context });

    // Step 2: If restricted, block immediately
    if (classification.autonomy === AUTONOMY.prohibited) {
      return {
        canAct: false,
        classification,
        reason: classification.reason,
        escalateImmediately: false,
        blocked: true,
      };
    }

    // Step 3: If escalation required, flag but don't block cadence
    if (classification.autonomy === AUTONOMY.required) {
      return {
        canAct: true, // System can continue — but escalation is required
        classification,
        reason: classification.reason,
        escalateImmediately: true,
        blocked: false,
      };
    }

    // Step 4: Reputation safety check for outbound actions
    if (actionType.startsWith('outreach.') || actionType.startsWith('cadence.')) {
      const safetyCheck = this.safety.checkOutbound({ lead, contentHash });
      if (!safetyCheck.allowed) {
        return {
          canAct: false,
          classification,
          reason: `Reputation safety: ${safetyCheck.reason}`,
          throttleMs: safetyCheck.throttleMs,
          blocked: true,
        };
      }
    }

    // Step 5: Log monitored actions (but allow to proceed)
    if (classification.autonomy === AUTONOMY.monitored) {
      const logEntry = await this.actionLog.log({
        actionType,
        leadId: lead?.id,
        clientId,
        reason: classification.reason,
        tier: classification.tier,
        riskLevel: classification.riskLevel,
        autonomy: classification.autonomy,
        escalation: classification.escalation,
        contextModule: accountBrief?.messagingAngle,
        accountBrief,
      });
      return {
        canAct: true,
        classification,
        reason: classification.reason,
        escalateImmediately: false,
        blocked: false,
        logEntry,
      };
    }

    // Step 6: Full autonomous — log if configured, proceed
    return {
      canAct: true,
      classification,
      reason: classification.reason,
      escalateImmediately: false,
      blocked: false,
    };
  }

  /**
   * Execute an approved action.
   */
  async execute(actionType, context = {}) {
    const { lead, contentHash, emailSubject } = context;

    // Record in reputation safety layer
    if (lead) {
      this.safety.recordOutbound({ lead, contentHash });
    }

    // Log the action
    const logEntry = await this.actionLog.log({
      actionType,
      leadId: lead?.id,
      clientId: context.clientId,
      reason: context.reason,
      tier: context.classification?.tier,
      riskLevel: context.classification?.riskLevel,
      autonomy: context.classification?.autonomy,
      escalation: context.classification?.escalation,
      contextModule: context.accountBrief?.messagingAngle,
      accountBrief: context.accountBrief,
      emailSubject,
      emailSentAt: new Date().toISOString(),
    });

    return logEntry;
  }

  /**
   * Escalate an action to human review.
   */
  async escalate(decision, lead, context = {}) {
    const { classification, reason } = decision;

    // Record escalation
    if (lead?.id) {
      this.safety.recordEscalation(lead.id);
    }

    const escalationEntry = await this.actionLog.log({
      actionType: 'escalation.triggered',
      leadId: lead?.id,
      clientId: context.clientId,
      reason: `ESCALATE: ${reason}`,
      tier: classification.tier,
      riskLevel: classification.riskLevel,
      autonomy: AUTONOMY.required,
      escalation: ESCALATION.immediate,
      contextModule: context.accountBrief?.messagingAngle,
      accountBrief: context.accountBrief,
    });

    // Notify human (async)
    if (this.onEscalation) {
      this.onEscalation({
        lead,
        classification,
        reason,
        escalationEntry,
        context,
      });
    }

    return escalationEntry;
  }

  /**
   * Get recent action history for review.
   */
  async getActionHistory(clientId, limit = 50) {
    return this.actionLog.getRecent(clientId, limit);
  }
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function extractDomain(email) {
  if (!email) return 'unknown';
  return email.split('@')[1] || 'unknown';
}

// ─── REPLY GOVERNANCE CLASSIFIER ──────────────────────────────────────────────

/**
 * Given a lead's reply text, classify it and return governance guidance.
 */
function classifyReply(text, accountContext = {}) {
  if (!text) return { governanceAction: 'continue_cadence', tier: TIER.SAFE_AUTONOMOUS };

  const lower = text.toLowerCase();

  // ── RESTRICTED ────────────────────────────────────────────────────────
  const restricted = [
    { patterns: ['discount', 'reduce price', 'lower the'], action: 'escalate_commercial' },
    { patterns: ['legal', 'contract terms', 'lawyer', 'attorney'], action: 'escalate_legal' },
    { patterns: ['integration', 'api access', 'technical spec'], action: 'escalate_technical' },
    { patterns: ['security', 'pen test', 'vulnerability', 'compliance'], action: 'escalate_security' },
  ];

  for (const { patterns, action } of restricted) {
    if (patterns.some(p => lower.includes(p))) {
      return {
        governanceAction: action,
        tier: TIER.RESTRICTED,
        canContinue: false,
      };
    }
  }

  // ── ESCALATE_REQUIRED ─────────────────────────────────────────────────
  const escalate = [
    { patterns: ['pricing', 'how much', 'cost'], action: 'escalate_pricing' },
    { patterns: ['procurement', 'vendor', 'onboarding'], action: 'escalate_procurement' },
    { patterns: ['enterprise', 'msa', 'baa', 'sow'], action: 'escalate_enterprise' },
    { patterns: ['call', 'schedule', "let's talk", 'meeting', 'book'], action: 'escalate_meeting' },
    { patterns: ['negative', 'frustrated', 'disappointed', 'upset', 'not happy'], action: 'escalate_complaint' },
    { patterns: ['media', 'press', 'journalist', 'reporter'], action: 'escalate_media' },
    { patterns: ['public', 'linkedin post', 'tweet', 'social media'], action: 'escalate_public' },
  ];

  for (const { patterns, action } of escalate) {
    if (patterns.some(p => lower.includes(p))) {
      return {
        governanceAction: action,
        tier: TIER.ESCALATE_REQUIRED,
        canContinue: false,
      };
    }
  }

  // ── MONITOR_AUTONOMOUS ─────────────────────────────────────────────────
  const monitor = [
    { patterns: ['show me', 'send it', 'what do you see'], action: 'deliver_artifact' },
    { patterns: ['yes', 'sure', 'ok', 'interested'], action: 'positive_engagement' },
  ];

  for (const { patterns, action } of monitor) {
    if (patterns.some(p => lower.includes(p))) {
      return {
        governanceAction: action,
        tier: TIER.MONITOR_AUTONOMOUS,
        canContinue: true,
      };
    }
  }

  // ── SAFE_AUTONOMOUS ──────────────────────────────────────────────────
  return {
    governanceAction: 'continue_cadence',
    tier: TIER.SAFE_AUTONOMOUS,
    canContinue: true,
  };
}

// ─── ESCALATION MATRIX ───────────────────────────────────────────────────────

const ESCALATION_MATRIX = {
  escalate_pricing: {
    urgency: 'high',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Commercial discussion triggered — pricing or cost conversation detected. Lead may be evaluating purchase. Human response recommended.',
    slaMinutes: 60,
  },
  escalate_meeting: {
    urgency: 'high',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Meeting request detected — lead wants to schedule a call. Human should respond with availability or appropriate deflection.',
    slaMinutes: 30,
  },
  escalate_procurement: {
    urgency: 'high',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Procurement or vendor onboarding request detected. Human review required before proceeding.',
    slaMinutes: 120,
  },
  escalate_enterprise: {
    urgency: 'critical',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Enterprise contract discussion triggered. Legal/compliance review may be required. Escalate immediately.',
    slaMinutes: 30,
  },
  escalate_complaint: {
    urgency: 'critical',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Negative sentiment or complaint detected from lead. Immediate human review required to prevent reputational damage.',
    slaMinutes: 15,
  },
  escalate_security: {
    urgency: 'critical',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Security concern raised by lead. Immediate escalation required — do not respond without human review.',
    slaMinutes: 15,
  },
  escalate_legal: {
    urgency: 'critical',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Legal or contract question detected. Do not respond. Human must handle.',
    slaMinutes: 30,
  },
  escalate_media: {
    urgency: 'critical',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Media or press inquiry detected. Do NOT respond. Forward to appropriate channels immediately.',
    slaMinutes: 5,
  },
  escalate_public: {
    urgency: 'high',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Public exposure or social media mention detected. Human review required immediately.',
    slaMinutes: 15,
  },
  escalate_commercial: {
    urgency: 'high',
    notify: 'ahmad',
    channel: 'whatsapp',
    template: 'Commercial negotiation triggered — discount, pricing concession, or commercial terms discussion. Human must respond.',
    slaMinutes: 60,
  },
  deliver_artifact: {
    urgency: 'low',
    notify: null,
    channel: null,
    template: 'Artifact request detected — system will deliver autonomously.',
    slaMinutes: null,
  },
  positive_engagement: {
    urgency: 'low',
    notify: null,
    channel: null,
    template: 'Positive engagement signal — system continues cadence.',
    slaMinutes: null,
  },
  continue_cadence: {
    urgency: 'none',
    notify: null,
    channel: null,
    template: 'No governance concern — system continues.',
    slaMinutes: null,
  },
};

// ─── AUTONOMOUS DECISION LOG EXAMPLE ────────────────────────────────────────

/*
Example autonomous decision log entries:

{
  id: "a1b2c3d4-...",
  action_type: "cadence.follow_up",
  lead_id: "lead-123",
  decision_reason: "Routine cadence follow-up within established sequence",
  risk_tier: 1,
  risk_level: 1,
  autonomy_mode: "full",
  escalation_state: "none",
  context_module: "founder_bandwidth",
  account_brief_snapshot: {
    stage: "seed",
    gtmMotion: "founder_led",
    messagingAngle: "founder_bandwidth",
    followUpRiskScore: 65,
    operationalThesis: "When the founder is handling both closing..."
  },
  email_subject: "Pipeline continuity when you're doing it all",
  email_sent_at: "2026-05-11T20:30:00.000Z",
  outcome: "delivered"
}

{
  id: "e5f6g7h8-...",
  action_type: "escalation.triggered",
  lead_id: "lead-456",
  decision_reason: "ESCALATE: Pricing discussion — escalate to human",
  risk_tier: 3,
  risk_level: 4,
  autonomy_mode: "required",
  escalation_state: "immediate",
  escalation_notified_at: "2026-05-11T20:35:00.000Z",
  outcome: "pending"
}

{
  id: "i9j0k1l2-...",
  action_type: "outreach.first_contact",
  lead_id: "lead-789",
  decision_reason: "First outreach to new lead — log for review",
  risk_tier: 2,
  risk_level: 2,
  autonomy_mode: "monitored",
  escalation_state: "log",
  context_module: "multi_stakeholder_continuity",
  email_subject: "Pipeline continuity across complex sales motions",
  email_sent_at: "2026-05-11T21:00:00.000Z",
  outcome: "delivered"
}
*/

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

module.exports = {
  CommercialGovernanceEngine,
  ReputationSafetyLayer,
  AutonomousActionLog,
  classifyAction,
  classifyReply,
  ESCALATION_MATRIX,
  ACTION_REGISTRY,
  TIER,
  AUTONOMY,
  ESCALATION,
};