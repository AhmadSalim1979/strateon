/**
 * Qiyadon — Account Intelligence & Commercial Strategy Layer
 * Version: 1.0
 * Role: Autonomous account brief generation with 8 context modules
 *
 * This module operates like a Chief Sales Officer / RevOps strategist.
 * It analyzes company signals and generates an Operational Thesis — an
 * inferential, non-invasive account brief that informs contextual messaging.
 *
 * Phase 1: HubSpot CRM fields + email domain + hardcoded inferential logic only.
 * Phase 2: Domain-based public signal fetching (company website, LinkedIn).
 *
 * TRUSTED PUBLIC SIGNALS:
 * Allowed:
 *  - Company domain (from email) → company website
 *  - HubSpot CRM company fields: industry, size, revenue, location
 *  - LinkedIn company page: public description, size, GTM signals
 *  - Public job postings on company careers page
 *  - Public funding announcements (Crunchbase, press releases)
 *  - Public pricing pages (signals product complexity)
 *  - Public case studies (indicates enterprise readiness)
 *
 * NEVER allowed:
 *  - Individual employee LinkedIn activity or posts
 *  - Private Slack/message scraping
 *  - Internal CRM behavioral data without explicit access
 *  - Fabricated pain points or invented metrics
 *  - Web scraping behind auth walls
 *  - Personal social activity
 */

'use strict';

// ─── CONTEXT MODULES ──────────────────────────────────────────────────────────
// Each module maps to a specific account type and messaging angle.
// messagingAngle drives which email template variant is selected.

const CONTEXT_MODULES = {
  founder_bandwidth: {
    messagingAngle: 'founder_bandwidth',
    thesis_template: 'When the founder is handling both closing and follow-up, leads can slip through when attention is on deals. The challenge is bandwidth, not intent — leads that don\'t get a follow-up within the first few days often go quiet, not because they lost interest but because no one had capacity to continue the sequence.',
    toneLevel: 'direct_smb',
    riskFactors: ['bandwidth_constraint', 'no_revenue_ops', 'informal_follow_up'],
    recommendedSubject: 'Pipeline continuity when you\'re doing it all',
  },
  revops_handoff: {
    messagingAngle: 'revops_handoff',
    thesis_template: 'SDR-to-AE handoffs tend to be where follow-up gaps form most commonly. A lead that doesn\'t hear from anyone for a few days after initial outreach often goes quiet — not because the AE isn\'t interested but because the queue is too full and the handoff timing was off.',
    toneLevel: 'operational_midmarket',
    riskFactors: ['handoff_gap', 'ae_bandwidth', 'lead_queue_overflow'],
    recommendedSubject: 'Follow-up gaps at the SDR-to-AE handoff',
  },
  multi_stakeholder_continuity: {
    messagingAngle: 'multi_stakeholder_continuity',
    thesis_template: 'With multiple stakeholders and long sales cycles, follow-up gaps tend to form between deal stages. Leads can go quiet not because they lost interest but because the cadence didn\'t continue at the right stage — and in complex deals, the right stage is easy to miss.',
    toneLevel: 'formal_enterprise',
    riskFactors: ['stage_gap', 'stakeholder_complexity', 'long_cycle_forgetting'],
    recommendedSubject: 'Pipeline continuity across complex sales motions',
  },
  volume_continuity: {
    messagingAngle: 'volume_continuity',
    thesis_template: 'High inbound volume tends to create bandwidth constraints on follow-up. Leads that don\'t immediately respond often get deprioritized, and cadence breaks down around step 2 or 3 — not because the team doesn\'t care but because there are too many leads and not enough consistent follow-up capacity.',
    toneLevel: 'operational_midmarket',
    riskFactors: ['volume_overflow', 'bandwidth_constraint', 'hot_lead_prioritization'],
    recommendedSubject: 'Follow-up consistency at inbound scale',
  },
  scaling_continuity: {
    messagingAngle: 'scaling_continuity',
    thesis_template: 'At the expansion stage, the challenge shifts from generating pipeline to maintaining follow-up consistency across a growing team. Handoffs, coverage shifts, and new rep onboarding all tend to create cadence gaps — leads that were moving quietly stall when the sequence breaks.',
    toneLevel: 'operational_midmarket',
    riskFactors: ['team_scaling', 'handoff_churn', 'coverage_gaps'],
    recommendedSubject: 'Pipeline continuity as sales orgs scale',
  },
  cycle_continuity: {
    messagingAngle: 'cycle_continuity',
    thesis_template: 'Long sales cycles tend to widen follow-up gaps between stages. Leads that were engaged early can stall as the deal progresses through evaluation stages where the cadence doesn\'t follow — the follow-up sequence that worked for outreach doesn\'t always adapt to where the deal actually is.',
    toneLevel: 'formal_enterprise',
    riskFactors: ['cycle_length', 'stage_transition_gap', 'attention_drift'],
    recommendedSubject: 'Follow-up continuity in long sales cycles',
  },
  multi_line_continuity: {
    messagingAngle: 'multi_line_continuity',
    thesis_template: 'When follow-up spans multiple product lines and buyer stages, cadence consistency across all of them tends to become harder. Later-stage leads can quietly stall while earlier opportunities demand attention — and without a system to maintain rhythm across all lines, some leads go quiet without anyone noticing.',
    toneLevel: 'formal_enterprise',
    riskFactors: ['product_complexity', 'segment_conflict', 'priority_inversion'],
    recommendedSubject: 'Pipeline continuity across multiple product lines',
  },
  late_continuity: {
    messagingAngle: 'late_continuity',
    thesis_template: 'By step 4 or 5 of a cadence, follow-up consistency tends to slip. Leads that were engaged in early steps can fall off the radar as earlier-stage opportunities and new leads demand attention — the cadence that worked at step 1 often breaks down before it reaches step 4.',
    toneLevel: 'operational_midmarket',
    riskFactors: ['cadence_decay', 'attention_competition', 'engagement_drop'],
    recommendedSubject: 'Where follow-up cadence tends to break down',
  },
};

// Default fallback module
const DEFAULT_MODULE = {
  messagingAngle: 'general_continuity',
  thesis_template: 'Follow-up consistency tends to become harder to maintain as pipeline grows. Leads can quietly go cold when the cadence doesn\'t continue on schedule — not because they lost interest but because the follow-up sequence didn\'t stay on track.',
  toneLevel: 'operational_midmarket',
  riskFactors: ['general_risk'],
  recommendedSubject: 'Pipeline continuity',
};

// ─── ACCOUNT INTELLIGENCE CLASS ──────────────────────────────────────────────

class AccountIntelligence {
  constructor() {
    this.signals = {};
    this.intelligenceGaps = [];
  }

  /**
   * Gather company signals from available data sources.
   * Phase 1: Only HubSpot CRM fields + email domain inference.
   * Phase 2: Add public website signals via lightweight fetch.
   */
  gatherCompanySignals(lead, hubspotCompanyData = {}) {
    const signals = {};

    // ── Email domain ──────────────────────────────────────────────
    if (lead.email) {
      const domain = lead.email.split('@')[1] || '';
      signals.domain = domain;
      signals.isFreeEmail = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain);
    }

    // ── HubSpot company fields (most reliable Phase 1 source) ────
    if (hubspotCompanyData) {
      signals.industry = hubspotCompanyData.industry || null;
      signals.size = parseInt(hubspotCompanyData.numberofemployees) || 0;
      signals.annualRevenue = parseFloat(hubspotCompanyData.annual_revenue) || 0;
      signals.location = hubspotCompanyData.city || hubspotCompanyData.country || null;
      signals.companyName = hubspotCompanyData.name || null;
      signals.domain = hubspotCompanyData.domain || signals.domain || null;
    }

    // ── Inferred signals from lead data ───────────────────────────
    signals.isSaaS = this._isSaaS(signals.industry, lead);
    signals.isEnterprise = signals.size > 500 || signals.annualRevenue > 10000000;
    signals.isMidMarket = signals.size > 50 && signals.size <= 500;
    signals.isSMB = signals.size > 0 && signals.size <= 50;

    // ── Revenue-per-employee proxy ─────────────────────────────────
    if (signals.size > 0 && signals.annualRevenue > 0) {
      signals.revenuePerEmployee = signals.annualRevenue / signals.size;
    } else {
      signals.revenuePerEmployee = null;
    }

    // ── Track intelligence gaps ────────────────────────────────────
    if (!signals.size) this.intelligenceGaps.push('company_size');
    if (!signals.annualRevenue) this.intelligenceGaps.push('annual_revenue');
    if (!signals.industry) this.intelligenceGaps.push('industry');
    if (!hubspotCompanyData.name) this.intelligenceGaps.push('company_name');

    this.signals = signals;
    return signals;
  }

  _isSaaS(industry, lead) {
    const saasIndicators = ['SaaS', 'Software', 'Cloud', 'Technology', 'saas'];
    if (industry && saasIndicators.some(i => industry.toLowerCase().includes(i.toLowerCase()))) {
      return true;
    }
    // Heuristic: if revenue/employee is high and size is small-mid, likely SaaS
    if (this.signals.revenuePerEmployee > 80000 && this.signals.size > 10) {
      return true;
    }
    return false;
  }

  /**
   * Classify account stage based on signals.
   */
  classifyAccountStage(signals) {
    const { size, annualRevenue } = signals;

    if (!size && !annualRevenue) return 'unknown';
    if (size > 1000 || annualRevenue > 50000000) return 'enterprise';
    if (size > 500 || annualRevenue > 20000000) return 'scale';
    if (size > 150 || annualRevenue > 5000000) return 'growth';
    if (size > 50 || annualRevenue > 1000000) return 'early';
    return 'seed';
  }

  /**
   * Classify GTM motion based on available signals.
   * Phase 1: Inferential from company size + revenue.
   * Phase 2: Add LinkedIn/job posting signals.
   */
  classifyGTMMotion(signals) {
    const { size, isFreeEmail } = signals;

    // Free email = likely founder-led (no corporate email)
    if (isFreeEmail) return 'founder_led';

    // Large org = likely hybrid or outbound-heavy
    if (size > 200) return 'sdr_led';

    // Mid-size = likely inbound-heavy with some outbound
    if (size > 50) return 'inbound_heavy';

    // Small = likely founder-led or early outbound
    return 'founder_led';
  }

  /**
   * Classify sales complexity.
   */
  classifySalesComplexity(signals) {
    const { size, annualRevenue, isSaaS } = signals;

    if (size > 500 || annualRevenue > 20000000) return 'enterprise_complex';
    if (size > 100 || annualRevenue > 3000000) return 'complex';
    if (size > 20 || annualRevenue > 500000) return 'moderate';
    return 'simple';
  }

  /**
   * Classify follow-up risk profile with specific risk factors.
   */
  classifyFollowUpRiskProfile(signals) {
    const { size } = signals;
    const riskFactors = [];
    let riskLevel = 'low_risk';
    let riskScore = 20;

    // Size-based risk
    if (size < 20) {
      riskFactors.push('bandwidth_constraint');
      riskScore += 25;
      riskLevel = 'high_risk';
    } else if (size < 100) {
      riskFactors.push('handoff_gap');
      riskFactors.push('bandwidth_constraint');
      riskScore += 35;
      riskLevel = 'medium_risk';
    } else if (size < 500) {
      riskFactors.push('volume_overflow');
      riskFactors.push('handoff_churn');
      riskScore += 30;
      riskLevel = 'medium_risk';
    } else {
      riskFactors.push('stage_gap');
      riskFactors.push('multi_stakeholder');
      riskScore += 20;
      riskLevel = 'medium_risk';
    }

    // SaaS typically has longer cycles → higher late-stage risk
    if (signals.isSaaS) {
      riskFactors.push('cycle_length_risk');
      riskScore += 10;
    }

    return { riskLevel, riskFactors, riskScore: Math.min(riskScore, 100) };
  }

  /**
   * Determine tone level based on stage and GTM.
   */
  determineToneLevel(stage, gtm) {
    if (stage === 'enterprise' || stage === 'scale') return 'formal_enterprise';
    if (stage === 'seed' || stage === 'early') return 'direct_smb';
    return 'operational_midmarket';
  }

  /**
   * Score account relevance (0-100).
   * Higher = more relevant for Qiyadon's ICP.
   */
  scoreAccountRelevance(signals, gtm, complexity) {
    let score = 40; // Base relevance

    // B2B SaaS is primary ICP
    if (signals.isSaaS) score += 20;

    // Mid-market and above has the scaling challenge
    if (signals.isMidMarket || signals.isEnterprise) score += 15;

    // SMB has founder bandwidth problem
    if (signals.isSMB) score += 15;

    // Enterprise has complexity + multi-stakeholder problem
    if (signals.isEnterprise) score += 10;

    // Revenue signals ability to pay
    if (signals.annualRevenue > 1000000) score += 10;
    if (signals.annualRevenue > 10000000) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Select the best messaging angle based on account signals.
   */
  selectMessagingAngle(stage, gtm, complexity, risk) {
    // Priority order for messaging angle selection
    if (complexity === 'enterprise_complex' || stage === 'enterprise') {
      return 'multi_stakeholder_continuity';
    }
    if (risk.riskFactors.includes('handoff_gap') && (gtm === 'sdr_led' || gtm === 'inbound_heavy')) {
      return 'revops_handoff';
    }
    if (risk.riskFactors.includes('bandwidth_constraint') && (stage === 'seed' || stage === 'early')) {
      return 'founder_bandwidth';
    }
    if (risk.riskFactors.includes('volume_overflow')) {
      return 'volume_continuity';
    }
    if (stage === 'growth' || stage === 'scale') {
      return 'scaling_continuity';
    }
    if (risk.riskFactors.includes('cycle_length_risk')) {
      return 'cycle_continuity';
    }
    if (risk.riskLevel === 'high_risk' && stage === 'early') {
      return 'founder_bandwidth';
    }
    return 'general_continuity';
  }
}

// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

/**
 * Generate a structured Account Brief for a given lead and company data.
 *
 * @param {Object} lead - Lead properties from HubSpot (email, firstname, lastname, etc.)
 * @param {Object} hubspotCompanyData - Company fields from HubSpot CRM
 * @returns {Object} AccountBrief
 */
function generateAccountBrief(lead, hubspotCompanyData = {}) {
  const ai = new AccountIntelligence();

  // Step 1: Gather signals
  const signals = ai.gatherCompanySignals(lead, hubspotCompanyData);

  // Step 2: Classify dimensions
  const stage = ai.classifyAccountStage(signals);
  const gtmMotion = ai.classifyGTMMotion(signals);
  const salesComplexity = ai.classifySalesComplexity(signals);
  const riskProfile = ai.classifyFollowUpRiskProfile(signals);
  const toneLevel = ai.determineToneLevel(stage, gtmMotion);
  const relevanceScore = ai.scoreAccountRelevance(signals, gtmMotion, salesComplexity);
  const messagingAngle = ai.selectMessagingAngle(stage, gtmMotion, salesComplexity, riskProfile);

  // Step 3: Select context module
  const module = CONTEXT_MODULES[messagingAngle] || DEFAULT_MODULE;

  // Step 4: Build operational thesis
  // Use module's thesis template (already contextualized per account type)
  const operationalThesis = module.thesis_template;

  return {
    accountName: signals.companyName || lead.company || 'the company',
    domain: signals.domain || '',
    stage,
    gtmMotion,
    salesComplexity,
    followUpRiskScore: riskProfile.riskScore,
    riskFactors: riskProfile.riskFactors,
    riskLevel: riskProfile.riskLevel,
    operationalThesis,
    recommendedTone: toneLevel,
    messagingAngle,
    recommendedSubject: module.recommendedSubject,
    relevanceScore,
    intelligenceGaps: ai.intelligenceGaps,
    signals, // Include raw signals for debugging
  };
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = { generateAccountBrief, AccountIntelligence, CONTEXT_MODULES };