/**
 * Qiyadon — Operational Deliverables Architecture
 * Version: 1.0
 * Role: Design document for autonomous operational intelligence delivery
 *
 * ═══════════════════════════════════════════════════════════════════
 * STRATEGIC CONTEXT
 * ═══════════════════════════════════════════════════════════════════
 *
 * Qiyadon is NOT:
 *  - An outbound automation tool
 *  - A marketing personalization engine
 *  - An AI SDR platform
 *  - An email cadence scheduler
 *
 * Qiyadon IS:
 *  - A continuous commercial oversight layer
 *  - Pipeline continuity infrastructure
 *  - Operational cadence intelligence
 *  - Async RevOps support
 *  - Autonomous operational intelligence delivery
 *
 * The email is only:
 *  - The delivery vector
 *  - The engagement surface
 *  - The asynchronous entry point
 *
 * The REAL product is:
 *  OPERATIONAL COMMERCIAL INTELLIGENCE
 *
 * ═══════════════════════════════════════════════════════════════════
 * ARTIFACT TAXONOMY
 * ═══════════════════════════════════════════════════════════════════
 *
 * Each artifact is a standalone operational document that:
 *  - Demonstrates genuine operational value
 *  - Requires no meeting to understand
 *  - Enables independent follow-up action
 *  - Builds trust through evidence-based observations
 *  - Positions Qiyadon as operational infrastructure
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #1: PIPELINE CONTINUITY SNAPSHOT                 │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    Executive overview of pipeline follow-up health        │
 * │    across all active leads.                               │
 * │                                                            │
 * │  Triggers:                                                │
 * │    - Lead replies "send it" / "show me" / "details"       │
 * │    - Manual request via keyword                           │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - HubSpot contacts: strtn_followup_cadence_day         │
 * │    - HubSpot: createdate, lastContacted, hs_lead_status   │
 * │    - HubSpot: strtn_last_followup_date                    │
 * │    - HubSpot: strtn_response_received                    │
 * │                                                            │
 * │  Confidence base: 85%                                     │
 * │  (direct CRM data — high confidence, low inference)      │
 * │                                                            │
 * │  Sections:                                                 │
 * │  1. Pipeline Health Summary (1 sentence)                   │
 * │  2. Leads by Cadence Step (table)                          │
 * │  3. Response Rate by Step (table)                         │
 * │  4. Stalled Leads Flagged (list)                           │
 * │  5. Consistency Observations (bullet list)                │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #2: CADENCE GAP MAP                              │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    Visual/table map of where follow-up steps              │
 * │    appear to have gaps or delays.                         │
 * │                                                            │
 * │  Triggers:                                                │
 * │    - Lead engaged with cadence topic                      │
 * │    - Reply to follow-up sequence                          │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - strtn_last_followup_date vs expected                 │
 * │    - Day-over-day cadence progression                     │
 * │    - Response gap between steps                           │
 * │                                                            │
 * │  Confidence base: 70%                                     │
 * │  (inferential — observes delays, doesn't know cause)    │
 * │                                                            │
 * │  Severity levels:                                          │
 * │    LOW: 1 step delayed < 3 days                           │
 * │    MEDIUM: 1-2 steps delayed 3-7 days                     │
 * │    HIGH: 2+ steps delayed > 7 days OR stalled            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #3: FOLLOW-UP FRICTION SUMMARY                   │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    Analysis of which leads show signs of                   │
 * │    follow-up friction (delays, gaps, silence risk).       │
 * │                                                            │
 * │  Triggers:                                                 │
 * │    - After 7+ days in cadence without response            │
 * │    - Step 3+ without reply                                 │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - Days since last follow-up                             │
 * │    - Current cadence day vs lead age                       │
 * │    - Response status (hasReplied flag)                     │
 * │                                                            │
 * │  Confidence base: 75%                                     │
 * │  (direct behavioral signals)                              │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #4: RESPONSE DELAY BREAKDOWN                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    For leads that have responded, how quickly             │
 * │    does the team respond vs industry baseline.             │
 * │                                                            │
 * │  Triggers:                                                 │
 * │    - Monthly digest                                        │
 * │    - On request via keyword                                │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - HubSpot: strtn_last_followup_date                     │
 * │    - Supabase: pipeline_activity timestamps                │
 * │    - HubSpot: hs_email_open, hs_email_click                │
 * │                                                            │
 * │  Confidence base: 60%                                    │
 * │  (limited signal — doesn't track actual reply time)       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #5: OPPORTUNITY DRIFT INDICATORS                │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    Leads that appear to have gone quiet                    │
 * │    (no response in N+ days) despite being                  │
 * │    in active cadence.                                     │
 * │                                                            │
 * │  Triggers:                                                 │
 * │    - Automatic when stalled lead detected                  │
 * │    - Weekly report inclusion                               │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - strtn_response_received = 'no'                        │
 * │    - Days since last follow-up > cadence step threshold    │
 * │    - Lead age > 14 days without response                  │
 * │                                                            │
 * │  Confidence base: 80%                                     │
 * │  (clear behavioral silence — high confidence)            │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #6: STAGE TRANSITION DELAY SUMMARY              │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    Leads that appear to have stalled at                    │
 * │    a specific stage — cadence step hasn't                  │
 * │    advanced despite time.                                 │
 * │                                                            │
 * │  Triggers:                                                 │
 * │    - Weekly report inclusion                               │
 * │    - On request                                            │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - Cadence day not advancing                             │
 * │    - No response received                                  │
 * │    - Lead age vs cadence progression rate                  │
 * │                                                            │
 * │  Confidence base: 65%                                     │
 * │  (infers stalling — doesn't know internal prioritization)  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #7: SEQUENCE CONSISTENCY REVIEW                  │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    Summary of how consistently the follow-up              │
 * │    sequence has been maintained across all leads.         │
 * │                                                            │
 * │  Triggers:                                                 │
 * │    - Monthly digest                                        │
 * │    - On request                                            │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - Step completion rate                                  │
 * │    - Step-on-time rate                                      │
 * │    - Response rate per step                                │
 * │                                                            │
 * │  Confidence base: 70%                                     │
 * │  (aggregate pattern observation)                          │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #8: REP HANDOFF RISK SUMMARY                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    Leads where SDR→AE handoff may have                    │
 * │    created a follow-up gap.                                │
 * │                                                            │
 * │  Triggers:                                                 │
 * │    - Detected handoff in CRM activity                      │
 * │    - Reply gap after owner change                          │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - HubSpot: hubspot_owner_id changes                     │
 * │    - Lead age vs cadence progression                       │
 * │                                                            │
 * │  Confidence base: 55%                                     │
 * │  (inferential — observes gap, can't confirm cause)        │
 * │  Trust label: INFERRED — confirmation recommended          │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT #9: LATE-STAGE SILENCE INDICATORS                │
 * ├─────────────────────────────────────────────────────────────┤
 * │  What it is:                                              │
 * │    Leads in step 4+ of cadence that appear                 │
 * │    to have gone silent — high-priority                     │
 * │    retention risk.                                        │
 * │                                                            │
 * │  Triggers:                                                 │
 * │    - Automatic at step 4+ with no response                 │
 * │    - Escalation trigger                                    │
 * │                                                            │
 * │  Data sources:                                             │
 * │    - strtn_followup_cadence_day >= 4                       │
 * │    - strtn_response_received = 'no'                        │
 * │    - Days since last follow-up > 5                         │
 * │                                                            │
 * │  Confidence base: 85%                                     │
 * │  (clear behavioral signals — late stage + silence)         │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONFIDENCE & EVIDENCE MODEL
 * ═══════════════════════════════════════════════════════════════════
 *
 * Every artifact carries a CONFIDENCE LEVEL and EVIDENCE LABEL.
 * This is critical for trust and credibility.
 *
 * ┌──────────────┬──────────────────────────────────────────────┐
 * │ CONFIDENCE   │ DEFINITION                                    │
 * ├──────────────┼──────────────────────────────────────────────────┤
 * │ 90-100%      │ Direct CRM data. No inference required.       │
 * │ 75-89%       │ Direct CRM data with minor interpretation.    │
 * │ 60-74%       │ Inferential — pattern observed, cause unknown│
 * │ 40-59%       │ Inferential — trend identified, low certainty│
 * │ < 40%        │ Not displayed — too uncertain to be useful   │
 * └──────────────┴──────────────────────────────────────────────┘
 *
 * ┌──────────────┬──────────────────────────────────────────────┐
 * │ EVIDENCE     │ DEFINITION                                    │
 * ├──────────────┼──────────────────────────────────────────────┤
 * │ CONFIRMED    │ Direct CRM behavioral data                    │
 * │ INFERRED     │ Pattern observed, cause requires confirmation │
 * │ INDICATED    │ Weak signal, trend possible, needs review    │
 * │ UNKNOWN      │ Gap in data, cannot determine                │
 * └──────────────┴──────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════
 * OPERATIONAL SEVERITY LEVELS
 * ═══════════════════════════════════════════════════════════════════
 *
 * Each observation in an artifact carries a severity level.
 * These are carefully worded — NOT alarming, NOT marketing.
 *
 * ┌────────┬────────┬────────────────────────────────────────────┐
 * │ LEVEL  │ LABEL  │ DEFINITION                                  │
 * ├────────┼────────┼────────────────────────────────────────────┤
 * │ 1      │ LOW    │ Minor consistency deviation.               │
 * │        │        │ Worth noting but not urgent.               │
 * ├────────┼────────┼────────────────────────────────────────────┤
 * │ 2      │ MEDIUM │ Notable follow-up delay.                    │
 * │        │        │ May indicate a consistency gap.            │
 * │        │        │ Worth reviewing.                           │
 * ├────────┼────────┼────────────────────────────────────────────┤
 * │ 3      │ HIGH   │ Significant delay or pattern.              │
 * │        │        │ Possible pipeline continuity risk.        │
 * │        │        │ Recommend review.                         │
 * └────────┴────────┴────────────────────────────────────────────┘
 *
 * LANGUAGE RULES FOR SEVERITY:
 *  ✅ USE: "possible", "potential", "appears to", "may indicate"
 *  ✅ USE: "observed pattern", "consistency risk", "follow-up delay"
 *  ✅ USE: "worth reviewing", "recommend checking"
 *  ❌ NEVER: "revenue leakage", "pipeline failure", "conversion collapse"
 *  ❌ NEVER: "critical issue", "AI insight", "our analysis shows"
 *  ❌ NEVER: "your team is failing", "leads are dying"
 *
 * ═══════════════════════════════════════════════════════════════════
 * ARTIFACT GENERATION PIPELINE
 * ═══════════════════════════════════════════════════════════════════
 *
 * Step 1: Trigger Detection
 *  - Inbound reply parsing (keyword: "send it", "show me", etc.)
 *  - Scheduled triggers (weekly/monthly digest)
 *  - Event triggers (stalled lead detected, handoff detected)
 *
 * Step 2: Data Gathering
 *  - Fetch lead(s) from HubSpot
 *  - Fetch cadence state from HubSpot
 *  - Fetch activity history from Supabase
 *  - Fetch response signals from HubSpot
 *
 * Step 3: Signal Processing
 *  - Calculate derived metrics (days since, delay gaps)
 *  - Apply severity scoring
 *  - Apply confidence scoring
 *  - Filter by confidence threshold (>50%)
 *
 * Step 4: Artifact Composition
 *  - Select appropriate artifact type
 *  - Compose sections with evidence labels
 *  - Apply severity levels
 *  - Apply language rules (hedged, operational)
 *
 * Step 5: Review Gate
 *  - Final language audit (no prohibited language)
 *  - Confidence label verification
 *  - Trust label verification
 *
 * Step 6: Async Delivery
 *  - Format for email (HTML, lightweight)
 *  - Send to lead's email
 *  - Log delivery in Supabase pipeline_activity
 *
 * ═══════════════════════════════════════════════════════════════════
 * EXECUTIVE-GRADE REPORT STRUCTURE
 * ═══════════════════════════════════════════════════════════════════
 *
 * Every artifact follows this structure:
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  HEADER                                                    │
 * │  [Artifact Name]                                           │
 * │  Generated: [timestamp] | Confidence: [X]% | Evidence: [Y] │
 * ├─────────────────────────────────────────────────────────────┤
 * │  SUMMARY (1 sentence)                                     │
 * │  "One possible follow-up consistency pattern              │
 * │   worth noting in your pipeline..."                        │
 * ├─────────────────────────────────────────────────────────────┤
 * │  KEY OBSERVATION (2-3 sentences, highest confidence)       │
 * │  Evidence: CONFIRMED | Severity: MEDIUM                    │
 * ├─────────────────────────────────────────────────────────────┤
 * │  DETAIL SECTIONS (varies by artifact type)                 │
 * │  - Each section has evidence label + severity              │
 * │  - Tables where applicable (clean, minimal)               │
 * │  - Bullet points, not dense paragraphs                    │
 * ├─────────────────────────────────────────────────────────────┤
 * │  RECOMMENDED ACTIONS (optional, only if severity 3+)        │
 * │  - Specific, not generic                                   │
 * │  - "Consider reviewing lead [X] at step [Y]"              │
 * ├─────────────────────────────────────────────────────────────┤
 * │  FOOTER                                                    │
 * │  Confidence: [X]% | This artifact is automated.             │
 * │  For internal use only. Not a guarantee.                  │
 * │  Reply to this email with questions or follow-up requests. │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════
 * ASYNC ARTIFACT DELIVERY LIFECYCLE
 * ═══════════════════════════════════════════════════════════════════
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  LEAD REPLIES TO CADENCE EMAIL                                │
 * │  Keywords: "send it", "show me", "details", "what do you     │
 * │            see", "show the breakdown", "share findings"     │
 * └─────────────────────────┬──────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │  REPLY PARSER                                               │
 * │  - Detects artifact request keywords                       │
 * │  - Maps keyword to artifact type                           │
 * │  - Triggers generation for specific lead + context          │
 * └─────────────────────────┬───────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ARTIFACT GENERATOR                                          │
 * │  - Gathers data (CRM + Supabase)                           │
 * │  - Applies confidence scoring                               │
 * │  - Composes artifact (executive-grade HTML)                 │
 * │  - Reviews against language rules                          │
 * │  - Logs generation in Supabase                              │
 * └─────────────────────────┬───────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │  ASYNC DELIVERY                                              │
 * │  - HTML email delivered to lead's email                     │
 * │  - Subject: artifact name + pipeline reference             │
 * │  - No CTA pressure — informational only                     │
 * │  - Clean, executive-grade formatting │
 * └─────────────────────────┬───────────────────────────────────┘
 *                            │
 *                            ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │  FOLLOW-UP CADENCE RESUMES                                   │
 * │  - Lead receives artifact + cadence continues               │
 * │  - Next step waits for response or next trigger             │
 * │  - Human escalation only if lead requests it                │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════
 * HUMAN ESCALATION TRIGGERS
 * ═══════════════════════════════════════════════════════════════════
 *
 * Humans enter the loop ONLY when:
 *
 * 1. LEAD REQUESTS MEETING
 *    Keywords: "call", "schedule", "let's talk", "15 minutes"
 *    → Human gets: lead context + full cadence history
 *
 * 2. LEAD ASKS COMMERCIAL QUESTION
 *    Keywords: "pricing", "how much", "contract", "timeline"
 *    → Human gets: lead context + commercial qualification
 *
 * 3. ARTIFACT TRIGGERS INTENT SIGNAL
 *    Lead replies to artifact with engagement language
 *    → Human gets: lead engagement + artifact interaction
 *
 * 4. STALLED LEAD ESCALATION
 *    Lead at step 4+ with no response after threshold
 *    → Human gets: stalled lead summary
 *
 * HUMAN ESCALATION IS NEVER AUTOMATIC OUTREACH.
 * IT IS ALWAYS A RESPONSE TO LEAD INITIATED ENGAGEMENT.
 *
 * ═══════════════════════════════════════════════════════════════════
 * ANTI-HYPE / CREDIBILITY RULES
 * ═══════════════════════════════════════════════════════════════════
 *
 * ARTIFACTS MUST NEVER:
 *  - Use the word "insight" or "analysis"
 *  - Claim predictive capabilities
 *  - Make revenue claims
 *  - Use alarming language
 *  - Include marketing fluff
 *  - Claim to "fix" anything
 *  - Promise outcomes
 *
 * ARTIFACTS SHOULD ALWAYS:
 *  - Use hedged language ("appears", "may", "possible")
 *  - Include confidence labels
 *  - Cite specific data sources (CRM field names)
 *  - Be actionable without a meeting
 *  - Be understandable in 60 seconds
 *  - Fit on one screen (no scrolling required)
 *
 * ═══════════════════════════════════════════════════════════════════
 * PHASE ROADMAP
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 1 (Current): Email cadence + account intelligence
 *  - Autonomous follow-up cadence
 *  - Account context module selection
 *  - Anti-surveillance tone rules
 *
 * PHASE 2 (This Design): Artifact delivery engine
 *  - Artifact generation module
 *  - Reply parsing + keyword detection
 *  - Async artifact composition
 *  - Pipeline: Reply → Artifact → Delivery
 *
 * PHASE 3 (Future): Scheduled artifacts
 *  - Weekly continuity digest
 *  - Monthly cadence consistency report
 *  - Quarterly pipeline health summary
 *
 * PHASE 4 (Future): Human escalation UI
 *  - Slack/email notification to human
 *  - Lead context dashboard
 *  - One-click response capability
 */

'use strict';

// ─── ARTIFACT GENERATOR ─────────────────────────────────────────────────────

class ArtifactGenerator {
  constructor(hubspotClient, supabaseClient) {
    this.hubspot = hubspotClient;
    this.supabase = supabaseClient;
  }

  /**
   * Generate a specific artifact for a lead or client.
   * @param {string} artifactType - One of the 9 artifact types
   * @param {Object} context - { leadId, clientId, leadEmail, accountBrief }
   * @returns {Object} { artifact, confidence, evidenceLabel }
   */
  async generate(artifactType, context) {
    const generators = {
      'pipeline-continuity-snapshot': this._pipelineContinuitySnapshot.bind(this),
      'cadence-gap-map': this._cadenceGapMap.bind(this),
      'follow-up-friction-summary': this._followUpFrictionSummary.bind(this),
      'response-delay-breakdown': this._responseDelayBreakdown.bind(this),
      'opportunity-drift-indicators': this._opportunityDriftIndicators.bind(this),
      'stage-transition-delay': this._stageTransitionDelay.bind(this),
      'sequence-consistency-review': this._sequenceConsistencyReview.bind(this),
      'rep-handoff-risk': this._repHandoffRisk.bind(this),
      'late-stage-silence': this._lateStageSilence.bind(this),
    };

    if (!generators[artifactType]) {
      throw new Error(`Unknown artifact type: ${artifactType}`);
    }

    return generators[artifactType](context);
  }

  /**
   * Calculate confidence score for an observation.
   * Based on: data source reliability, inference depth, data completeness.
   */
  _calculateConfidence({ hasDirectCRM, hasInference, hasActivityHistory, dataCompleteness }) {
    let score = 0;
    if (hasDirectCRM) score += 40;
    if (hasActivityHistory) score += 25;
    if (!hasInference) score += 20; // Direct = higher confidence
    if (hasInference) score -= 15;   // Inference = lower confidence
    score += (dataCompleteness * 15); // 0-1 scale, adds 0-15 points
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Apply language rules to artifact content.
   * Replaces prohibited phrases with safe alternatives.
   */
  _applyLanguageRules(text) {
    const replacements = [
      // Never phrases → safe alternatives
      [/revenue leakage/gi, 'follow-up gap'],
      [/pipeline failure/gi, 'follow-up delay'],
      [/conversion collapse/gi, 'engagement decline'],
      [/critical issue/gi, 'noted observation'],
      [/AI insight/gi, 'automated observation'],
      [/our analysis shows/gi, 'the data suggests'],
      [/we found that/gi, 'the data indicates'],
      [/leads are dying/gi, 'leads may have gone quiet'],
      [/pipeline is broken/gi, 'follow-up consistency may have gaps'],
      [/failure/gi, 'gap'],
      [/urgent/gi, 'noted'],
      [/immediate/gi, 'prompt'],
    ];

    let result = text;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  /**
   * Generate Pipeline Continuity Snapshot artifact.
   */
  async _pipelineContinuitySnapshot({ lead, client }) {
    const { properties } = lead;
    const cadenceDay = parseInt(properties.strtn_followup_cadence_day) || 0;
    const lastFollowup = properties.strtn_last_followup_date;
    const hasResponded = properties.strtn_response_received === 'yes';
    const leadAge = this._daysSince(properties.createdate);

    // Build summary observation
    const summary = hasResponded
      ? 'The lead has responded to follow-up, indicating the cadence is reaching the right person.'
      : cadenceDay === 0
      ? 'The follow-up sequence may not have started yet.'
      : `The lead has been in cadence for ${cadenceDay} day(s) without a recorded response.`;

    // Leads by cadence step (simulated — in real implementation, batch query)
    const steps = [
      { step: 1, label: 'Day 1', count: cadenceDay >= 1 ? 1 : 0, responded: false },
      { step: 3, label: 'Day 3', count: cadenceDay >= 3 ? 1 : 0, responded: false },
      { step: 7, label: 'Day 7', count: cadenceDay >= 7 ? 1 : 0, responded: false },
    ];

    const observations = [];
    if (!hasResponded && cadenceDay > 3) {
      observations.push({
        text: 'The lead may not have responded to follow-up attempts. This is a possible follow-up continuity gap.',
        severity: cadenceDay > 7 ? 2 : 1,
        evidence: 'CONFIRMED',
      });
    }
    if (leadAge > 14 && cadenceDay < 3) {
      observations.push({
        text: 'The lead age is notable relative to cadence progression. There may be a delay in sequence initiation.',
        severity: 2,
        evidence: 'INFERRED',
      });
    }

    const artifact = {
      name: 'Pipeline Continuity Snapshot',
      generatedAt: new Date().toISOString(),
      confidence: this._calculateConfidence({
        hasDirectCRM: true,
        hasInference: observations.length > 0,
        hasActivityHistory: !!lastFollowup,
        dataCompleteness: lastFollowup ? 1 : 0.5,
      }),
      evidenceLabel: observations.some(o => o.evidence === 'INFERRED') ? 'INFERRED' : 'CONFIRMED',
      summary,
      observations,
      leadRef: properties.email,
    };

    artifact.html = this._renderArtifactHTML(artifact);
    return artifact;
  }

  /**
   * Generate Cadence Gap Map artifact.
   */
  async _cadenceGapMap({ lead }) {
    const { properties } = lead;
    const cadenceDay = parseInt(properties.strtn_followup_cadence_day) || 0;
    const lastFollowup = properties.strtn_last_followup_date;
    const daysSinceLast = lastFollowup ? this._daysSince(lastFollowup) : null;

    const observations = [];
    if (daysSinceLast !== null && daysSinceLast > 3) {
      observations.push({
        text: `${daysSinceLast} day(s) have passed since the last recorded follow-up. This may indicate a possible follow-up delay at the current step.`,
        severity: daysSinceLast > 7 ? 2 : 1,
        evidence: 'CONFIRMED',
      });
    }

    const gapSteps = [];
    const expectedDays = [1, 3, 7, 14, 21, 30];
    for (const expected of expectedDays) {
      if (cadenceDay >= expected) {
        const stepGap = daysSinceLast !== null ? daysSinceLast - (expected - cadenceDay) : null;
        if (stepGap !== null && stepGap > 2) {
          gapSteps.push({
            step: expected,
            gapDays: stepGap,
            severity: stepGap > 5 ? 2 : 1,
          });
        }
      }
    }

    const artifact = {
      name: 'Cadence Gap Map',
      generatedAt: new Date().toISOString(),
      confidence: this._calculateConfidence({
        hasDirectCRM: true,
        hasInference: true,
        hasActivityHistory: !!lastFollowup,
        dataCompleteness: lastFollowup ? 0.8 : 0.4,
      }),
      evidenceLabel: 'INFERRED',
      summary: `${gapSteps.length} possible follow-up gaps observed in the cadence sequence.`,
      gapSteps,
      observations,
      leadRef: properties.email,
    };

    artifact.html = this._renderArtifactHTML(artifact);
    return artifact;
  }

  /**
   * Generate Follow-Up Friction Summary artifact.
   */
  async _followUpFrictionSummary({ lead }) {
    const { properties } = lead;
    const cadenceDay = parseInt(properties.strtn_followup_cadence_day) || 0;
    const hasResponded = properties.strtn_response_received === 'yes';
    const leadAge = this._daysSince(properties.createdate);
    const lastFollowup = properties.strtn_last_followup_date;
    const daysSinceLast = lastFollowup ? this._daysSince(lastFollowup) : null;

    const frictionScore = hasResponded ? 0
      : cadenceDay >= 3 && (!daysSinceLast || daysSinceLast > 3) ? 3
      : cadenceDay >= 1 && !daysSinceLast ? 2
      : 1;

    const observations = [];
    if (!hasResponded && cadenceDay >= 3) {
      observations.push({
        text: 'The lead has been in active cadence for 3+ days without a recorded response. This may indicate possible follow-up friction.',
        severity: frictionScore >= 3 ? 2 : 1,
        evidence: 'CONFIRMED',
      });
    }
    if (leadAge > 10 && cadenceDay < 3) {
      observations.push({
        text: 'Lead age is notable relative to cadence progression. There may be a delay in follow-up sequence initiation.',
        severity: 1,
        evidence: 'INFERRED',
      });
    }

    const artifact = {
      name: 'Follow-Up Friction Summary',
      generatedAt: new Date().toISOString(),
      confidence: this._calculateConfidence({
        hasDirectCRM: true,
        hasInference: observations.some(o => o.evidence === 'INFERRED'),
        hasActivityHistory: !!lastFollowup,
        dataCompleteness: lastFollowup ? 0.9 : 0.6,
      }),
      evidenceLabel: observations.some(o => o.evidence === 'INFERRED') ? 'INFERRED' : 'CONFIRMED',
      summary: `Follow-up friction score: ${frictionScore}/3. ${frictionScore >= 2 ? 'There may be a possible continuity risk worth reviewing.' : 'Follow-up sequence appears to be progressing normally.'}`,
      frictionScore,
      observations,
      leadRef: properties.email,
    };

    artifact.html = this._renderArtifactHTML(artifact);
    return artifact;
  }

  /**
   * Generate Opportunity Drift Indicators artifact.
   */
  async _opportunityDriftIndicators({ lead }) {
    const { properties } = lead;
    const cadenceDay = parseInt(properties.strtn_followup_cadence_day) || 0;
    const hasResponded = properties.strtn_response_received === 'yes';
    const leadAge = this._daysSince(properties.createdate);

    const indicators = [];
    if (!hasResponded && leadAge > 14) {
      indicators.push({
        text: 'Lead has been in pipeline for 14+ days without a recorded response. There may be a possible engagement drift.',
        severity: 2,
        evidence: 'CONFIRMED',
      });
    }
    if (!hasResponded && cadenceDay >= 4) {
      indicators.push({
        text: 'Lead is at cadence step 4 or later without a response. Late-stage silence may indicate possible opportunity drift.',
        severity: 3,
        evidence: 'CONFIRMED',
      });
    }

    const artifact = {
      name: 'Opportunity Drift Indicators',
      generatedAt: new Date().toISOString(),
      confidence: this._calculateConfidence({
        hasDirectCRM: true,
        hasInference: false,
        hasActivityHistory: true,
        dataCompleteness: 1,
      }),
      evidenceLabel: 'CONFIRMED',
      summary: `${indicators.length} possible drift indicator(s) observed. ${indicators.length > 0 ? 'Review may be recommended.' : 'No notable drift signals detected.'}`,
      indicators,
      leadRef: properties.email,
    };

    artifact.html = this._renderArtifactHTML(artifact);
    return artifact;
  }

  /**
   * Generate Stage Transition Delay Summary artifact.
   */
  async _stageTransitionDelay({ lead }) {
    const { properties } = lead;
    const cadenceDay = parseInt(properties.strtn_followup_cadence_day) || 0;
    const lastFollowup = properties.strtn_last_followup_date;
    const daysSinceLast = lastFollowup ? this._daysSince(lastFollowup) : null;

    const delays = [];
    // Check if step 3 is reached but step 1 gap is large
    if (cadenceDay >= 3 && daysSinceLast && daysSinceLast > 7) {
      delays.push({
        text: 'Possible delay between early and mid-stage cadence. Step 1 may have completed but step 3 gap appears notable.',
        severity: 2,
        evidence: 'INFERRED',
      });
    }

    const artifact = {
      name: 'Stage Transition Delay Summary',
      generatedAt: new Date().toISOString(),
      confidence: this._calculateConfidence({
        hasDirectCRM: true,
        hasInference: true,
        hasActivityHistory: !!lastFollowup,
        dataCompleteness: lastFollowup ? 0.8 : 0.3,
      }),
      evidenceLabel: 'INFERRED',
      summary: delays.length === 0
        ? 'No notable stage transition delays observed in the available data.'
        : `${delays.length} possible stage transition delay(s) observed.`,
      delays,
      leadRef: properties.email,
    };

    artifact.html = this._renderArtifactHTML(artifact);
    return artifact;
  }

  /**
   * Generate Sequence Consistency Review artifact.
   */
  async _sequenceConsistencyReview({ lead }) {
    const { properties } = lead;
    const cadenceDay = parseInt(properties.strtn_followup_cadence_day) || 0;
    const hasResponded = properties.strtn_response_received === 'yes';

    const completionRate = cadenceDay > 0
      ? Math.round(((cadenceDay / 30) * 100))
      : 0;

    const observations = [];
    if (cadenceDay >= 3 && !hasResponded) {
      observations.push({
        text: 'The lead has progressed through early cadence steps without a recorded response. There may be a possible consistency gap in the follow-up sequence.',
        severity: 1,
        evidence: 'CONFIRMED',
      });
    }

    const artifact = {
      name: 'Sequence Consistency Review',
      generatedAt: new Date().toISOString(),
      confidence: this._calculateConfidence({
        hasDirectCRM: true,
        hasInference: false,
        hasActivityHistory: true,
        dataCompleteness: 1,
      }),
      evidenceLabel: 'CONFIRMED',
      summary: `Cadence step completion rate: approximately ${completionRate}%. ${completionRate < 30 ? 'Early stage — limited data available.' : 'Sequence appears to be progressing.'}`,
      completionRate,
      cadenceDay,
      observations,
      leadRef: properties.email,
    };

    artifact.html = this._renderArtifactHTML(artifact);
    return artifact;
  }

  /**
   * Generate Rep Handoff Risk Summary artifact.
   */
  async _repHandoffRisk({ lead }) {
    const { properties } = lead;
    const ownerHistory = properties.hubspot_owner_id ? [properties.hubspot_owner_id] : [];

    const artifact = {
      name: 'Rep Handoff Risk Summary',
      generatedAt: new Date().toISOString(),
      confidence: this._calculateConfidence({
        hasDirectCRM: true,
        hasInference: true,
        hasActivityHistory: false,
        dataCompleteness: 0.5,
      }),
      evidenceLabel: 'INFERRED',
      summary: ownerHistory.length > 1
        ? `${ownerHistory.length} owner change(s) detected. There may be a possible handoff risk worth reviewing.`
        : 'Only one owner on record. No notable handoff risk signals detected.',
      riskFactors: ownerHistory.length > 1 ? ['owner_change_detected'] : [],
      leadRef: properties.email,
    };

    artifact.html = this._renderArtifactHTML(artifact);
    return artifact;
  }

  /**
   * Generate Late-Stage Silence Indicators artifact.
   */
  async _lateStageSilence({ lead }) {
    const { properties } = lead;
    const cadenceDay = parseInt(properties.strtn_followup_cadence_day) || 0;
    const hasResponded = properties.strtn_response_received === 'yes';
    const lastFollowup = properties.strtn_last_followup_date;
    const daysSinceLast = lastFollowup ? this._daysSince(lastFollowup) : null;

    const indicators = [];
    if (cadenceDay >= 4 && !hasResponded) {
      indicators.push({
        text: 'Lead is at cadence step 4 or later without a recorded response. This may indicate a possible late-stage silence pattern.',
        severity: 3,
        evidence: 'CONFIRMED',
      });
    }
    if (cadenceDay >= 4 && daysSinceLast && daysSinceLast > 5) {
      indicators.push({
        text: `${daysSinceLast} days have passed since the last recorded follow-up at a late cadence stage. There may be a possible engagement gap.`,
        severity: 3,
        evidence: 'CONFIRMED',
      });
    }

    const artifact = {
      name: 'Late-Stage Silence Indicators',
      generatedAt: new Date().toISOString(),
      confidence: this._calculateConfidence({
        hasDirectCRM: true,
        hasInference: false,
        hasActivityHistory: !!lastFollowup,
        dataCompleteness: lastFollowup ? 1 : 0.7,
      }),
      evidenceLabel: indicators.length > 0 ? 'CONFIRMED' : 'UNKNOWN',
      summary: indicators.length === 0
        ? 'No notable late-stage silence indicators detected.'
        : `${indicators.length} late-stage silence indicator(s) observed. Review may be recommended.`,
      indicators,
      leadRef: properties.email,
    };

    artifact.html = this._renderArtifactHTML(artifact);
    return artifact;
  }

  /**
   * Stub: Response Delay Breakdown
   */
  async _responseDelayBreakdown(context) {
    return {
      name: 'Response Delay Breakdown',
      generatedAt: new Date().toISOString(),
      confidence: 55,
      evidenceLabel: 'INDICATED',
      summary: 'Response delay data requires additional tracking signals. Current data completeness may not support a full analysis.',
      note: 'This artifact type requires email open/click tracking data which is not yet fully connected.',
      leadRef: context.lead?.properties?.email,
    };
  }

  /**
   * Utility: Days since a timestamp
   */
  _daysSince(timestamp) {
    if (!timestamp) return null;
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  }

  /**
   * Render artifact as executive-grade HTML email.
   */
  _renderArtifactHTML(artifact) {
    const severityLabel = (s) => ['LOW', 'MEDIUM', 'HIGH'][s - 1] || 'LOW';
    const severityColor = (s) => ['#6b7280', '#d97706', '#dc2626'][s - 1] || '#6b7280';

    const observationsHTML = artifact.observations?.length
      ? artifact.observations.map(o => `
          <tr>
            <td style="padding:8px; border-bottom:1px solid #e5e7eb;">
              <span style="background:${severityColor(o.severity)}20;color:${severityColor(o.severity)};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;">
                ${severityLabel(o.severity)}
              </span>
            </td>
            <td style="padding:8px; border-bottom:1px solid #e5e7eb;">
              ${this._applyLanguageRules(o.text)}
            </td>
            <td style="padding:8px; border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
              ${o.evidence}
            </td>
          </tr>
        `).join('')
      : '<tr><td colspan="3" style="padding:16px;color:#6b7280;font-size:13px;">No specific observations at this time.</td></tr>';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:600px; margin:0 auto; color:#1f2937; }
    .header { background:#f9fafb; border-bottom:1px solid #e5e7eb; padding:24px 32px; }
    .header h1 { margin:0; font-size:16px; font-weight:600; color:#111827; }
    .meta { margin-top:4px; font-size:12px; color:#6b7280; }
    .summary { padding:24px 32px; border-bottom:1px solid #e5e7eb; }
    .summary p { margin:0; font-size:14px; color:#374151; line-height:1.6; }
    .section { padding:20px 32px; border-bottom:1px solid #e5e7eb; }
    .section h2 { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin:0 0 12px 0; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; font-size:11px; font-weight:600; color:#6b7280; padding:8px; border-bottom:1px solid #e5e7eb; }
    .footer { padding:20px 32px; font-size:12px; color:#9ca3af; }
    .confidence { display:inline-block; background:#f3f4f6; padding:2px 8px; border-radius:4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${artifact.name}</h1>
    <div class="meta">
      Generated: ${new Date(artifact.generatedAt).toLocaleString('en-GB', { timeZone: 'Europe/Berlin' })} &nbsp;•&nbsp;
      <span class="confidence">Confidence: ${artifact.confidence}%</span> &nbsp;•&nbsp;
      Evidence: ${artifact.evidenceLabel}
    </div>
  </div>
  <div class="summary">
    <p>${this._applyLanguageRules(artifact.summary)}</p>
  </div>
  ${artifact.observations || artifact.indicators || artifact.delays || artifact.gapSteps ? `
  <div class="section">
    <h2>Observations</h2>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Observation</th>
          <th>Evidence</th>
        </tr>
      </thead>
      <tbody>
        ${observationsHTML}
      </tbody>
    </table>
  </div>
  ` : ''}
  <div class="footer">
    This artifact is automatically generated by Qiyadon Pipeline.
    ${artifact.note ? `<br>${artifact.note}` : ''}
    <br><br>
    Confidence: ${artifact.confidence}% | Evidence: ${artifact.evidenceLabel} | For internal use only. Not a guarantee.
  </div>
</body>
</html>`;
  }
}

// ─── REPLY PARSER ────────────────────────────────────────────────────────────

/**
 * Parse inbound replies and detect artifact requests.
 * Returns { type: 'artifact_request' | 'meeting_request' | 'commercial_question' | 'unknown', artifactType? }
 */
function parseReply(text) {
  if (!text) return { type: 'unknown' };

  const lower = text.toLowerCase();

  // Meeting requests — escalate immediately
  const meetingKeywords = ['call', 'schedule', "let's talk", 'hop on', '15 minutes', 'book a'];
  if (meetingKeywords.some(k => lower.includes(k))) {
    return { type: 'meeting_request' };
  }

  // Commercial questions — escalate
  const commercialKeywords = ['pricing', 'how much', 'cost', 'contract', 'timeline', 'when can'];
  if (commercialKeywords.some(k => lower.includes(k))) {
    return { type: 'commercial_question' };
  }

  // Artifact requests
  const artifactKeywords = {
    'pipeline-continuity-snapshot': ['send it', 'show me', 'the breakdown', 'the details', 'share findings', 'what do you see'],
    'cadence-gap-map': ['gap map', 'where are the gaps', 'cadence gaps'],
    'follow-up-friction-summary': ['friction', 'follow-up issues', 'what\'s slowing'],
    'opportunity-drift-indicators': ['drift', 'silent leads', 'gone quiet'],
    'stage-transition-delay': ['stage delay', 'transition', 'stuck at'],
    'sequence-consistency-review': ['consistency', 'sequence review', 'how consistent'],
    'rep-handoff-risk': ['handoff', 'rep change', 'owner change'],
    'late-stage-silence': ['late stage', 'step 4', 'step 5', 'step 6', 'step 7'],
  };

  for (const [artifactType, keywords] of Object.entries(artifactKeywords)) {
    if (keywords.some(k => lower.includes(k))) {
      return { type: 'artifact_request', artifactType };
    }
  }

  // Default: positive engagement but no specific request
  if (['yes', 'sure', 'okay', 'thanks', 'thank you', 'interesting'].some(k => lower.includes(k))) {
    return { type: 'positive_engagement' };
  }

  return { type: 'unknown' };
}

// ─── ARTIFACT DELIVERY ENGINE ─────────────────────────────────────────────────

class ArtifactDeliveryEngine {
  constructor(artifactGenerator, emailTransporter, supabaseClient) {
    this.generator = artifactGenerator;
    this.transporter = emailTransporter;
    this.supabase = supabaseClient;
  }

  async handleReply(lead, replyText, accountBrief = {}) {
    const parsed = parseReply(replyText);

    if (parsed.type === 'meeting_request') {
      return { action: 'escalate_to_human', reason: 'meeting_requested', lead };
    }

    if (parsed.type === 'commercial_question') {
      return { action: 'escalate_to_human', reason: 'commercial_question', lead };
    }

    if (parsed.type === 'artifact_request' && parsed.artifactType) {
      const artifact = await this.generator.generate(parsed.artifactType, { lead, accountBrief });
      await this._deliverArtifact(lead, artifact);
      return { action: 'artifact_delivered', artifact: artifact.name, lead };
    }

    return { action: 'no_action', reason: parsed.type };
  }

  async _deliverArtifact(lead, artifact) {
    const mailOptions = {
      from: '"Qiyadon Pipeline" <contact@qiyadon.com>',
      to: lead.properties.email,
      subject: `${artifact.name} — ${lead.properties.company || 'Pipeline'}`,
      html: artifact.html,
      text: artifact.html.replace(/<[^>]+>/g, ''),
    };

    await this.transporter.sendMail(mailOptions);

    // Log delivery
    if (this.supabase) {
      await this.supabase.from('pipeline_activity').insert({
        lead_id: lead.id,
        activity_type: 'artifact_delivered',
        description: artifact.name,
        subject: artifact.name,
        outcome: `${artifact.confidence}% confidence`,
        triggered_by: 'artifact_engine',
      });
    }
  }
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

module.exports = {
  ArtifactGenerator,
  ArtifactDeliveryEngine,
  parseReply,
};