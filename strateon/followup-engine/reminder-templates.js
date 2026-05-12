/**
 * reminder-templates.js — Qiyadon 4-email reminder sequence
 * 
 * Calm, operational, trust-first tone.
 * No aggressive urgency, no growth-hack language, no countdown mechanics.
 * 
 * Strategic shift: "continuation" not "conversion" — operational infrastructure, not a funnel product.
 * 
 * Revision: 2026-05-12 — Continuation framing, no urgency windows, diagnostic-aware
 */

function buildActivationCompleteEmail(clientName, activationDetails = {}) {
  // "what we set up" section — makes the activation tangible and verifiable
  const setupSection = activationDetails.setup && activationDetails.setup.length > 0
    ? `\nHere's what we set up in your ${activationDetails.crm || 'CRM'}:\n${activationDetails.setup.map(item => `• ${item}`).join('\n')}\n`
    : '';

  return {
    subject: `Your Qiyadon system is live — what's next`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'activation-complete'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

Your Qiyadon activation is complete.${setupSection || '\n\nHere\'s what we connected:\n• CRM: ' + (activationDetails.crm || 'Connected') + '\n• Channels: ' + (activationDetails.channels || 'Email, WhatsApp') + '\n• Cadence: ' + (activationDetails.cadence || '6-touch sequence')}

What happens next:

The operational evaluation period begins now. For the next 13 days, your campaigns run live and we generate weekly reports.

This is not a sprint — it's an operational evaluation. The system needs the full 14 days to demonstrate what it can do.

You'll receive your first operational report at the Day 7 mark.

Questions during the evaluation? Reply to this email. We're monitoring.

— Qiyadon Team
    `.trim()
  };
}

function buildDay7ReviewEmail(clientName, metrics = {}) {
  return {
    subject: `Day 7 — your pipeline performance update`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'day-7-review'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

We're at the midpoint of your operational evaluation.

Here's what the system has generated so far:
${metrics.leads ? `• Leads delivered: ${metrics.leads}\n` : ''}
${metrics.openRate ? `• Open rate: ${metrics.openRate}\n` : ''}
${metrics.replyRate ? `• Reply rate: ${metrics.replyRate}\n` : ''}
${metrics.meetings ? `• Meetings scheduled: ${metrics.meetings}\n` : ''}

The system is running live cadence across all activated channels.

You'll receive a full operational report at Day 14.

If you have feedback on anything — targeting, messaging, cadence frequency — reply to this email and we adjust. This is a live evaluation, not a passive observation period.

9 days left in the evaluation. At Day 14, we'll conduct a shared assessment of the operational performance. If the data supports continued operation, we can discuss what ongoing partnership looks like.

Questions? Reply anytime.

— Qiyadon Team
    `.trim()
  };
}

function buildDay10PreparationEmail(clientName, metrics = {}) {
  // Day 10 — preparation notice, NOT a countdown
  return {
    subject: `Day 14 is approaching — what to expect`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'day-10-preparation'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

Four days from now, we complete the operational evaluation.

Here's what the Day 14 assessment looks like:

1. We share our assessment of the 5 operational criteria
2. If the data supports it → we discuss operational continuation
3. If it's not the right fit → we close cleanly, no pressure

No artificial urgency. No countdown. Just a clear operational assessment.

If you've been meaning to share feedback on targeting, messaging, or list quality — now is a good time. Reply to this email and we adjust before the Day 14 review.

Operational continuity is available to you regardless of the outcome. If Qiyadon is working for your pipeline, we'll make that clear. If it's not the right time, we'll tell you directly.

Questions before Day 14? Reply anytime.

— Qiyadon Team
    `.trim()
  };
}

function buildDay13ReminderEmail(clientName) {
  return {
    subject: `Tomorrow is Day 14 — here's where we stand`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'day-13-reminder'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

Tomorrow we complete the operational evaluation and conduct the shared assessment.

If the data supports it, operational continuation is available. This is not a sales decision — it's an operational continuity assessment.

Scale plan continuation (if criteria are met):
• $1,500/month | 3-month minimum | $4,500 total
• 500 leads/month | $6 overage after that | $500/month cap
• Cancellation: 30-day written notice after minimum
• No auto-renewal — new agreement each cycle

No card will be charged unless you affirmatively sign an agreement. Operational continuity remains available regardless of your decision timing.

If you're not sure whether to continue — that's fine. Reply and we can discuss what the data shows and what the options are.

Questions before tomorrow? Reply anytime.

— Qiyadon Team
    `.trim()
  };
}

function buildDay14OfferEmail(clientName, qualificationResults, scaleOffer = {}, operationalObservations = {}) {
  const criteriaLines = qualificationResults
    .map(c => `• ${c.label}: ${c.met ? 'Met' : 'Not met'}${c.detail ? ` — ${c.detail}` : ''}`)
    .join('\n');

  const criteriaMet = qualificationResults.filter(c => c.met).length;
  const qualifies = criteriaMet >= 3;

  // Diagnostic section — explains WHY meetings did or didn't book
  const diagnosticSection = operationalObservations.meetingsBooked !== undefined
    ? buildMeetingsDiagnostic(operationalObservations)
    : '';

  if (!qualifies) {
    return {
      subject: `Day 14 Assessment — evaluation complete`,
      to: clientName.email,
      headers: {
        'X-Qiyadon-Type': 'reminder',
        'X-Qiyadon-Template': 'day-14-assessment'
      },
      body: `
Hi ${clientName.firstName || clientName.name},

Here's our Day 14 operational assessment.

QUALIFICATION CRITERIA
${criteriaLines}

Result: ${criteriaMet} of 5 criteria met

Based on this assessment, the conditions for operational continuation weren't met this cycle.

Here's what we observed:

${diagnosticSection || 'The operational data showed promise in some areas and gaps in others. We want to be straightforward rather than push a fit that isn\'t there.'}

The evaluation ends here. No charge, no obligation, no follow-up pressure.

Operational continuity remains available if your circumstances change. You're welcome to revisit at any point.

Thank you for the 14-day evaluation — it gave us the time needed to demonstrate what Qiyadon does.

— Qiyadon Team
      `.trim()
    };
  }

  // Qualified — continuation framing, not sales closing
  return {
    subject: `Day 14 Assessment — operational continuation available`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'day-14-assessment'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

Here's our Day 14 operational assessment.

QUALIFICATION CRITERIA
${criteriaLines}

Result: ${criteriaMet} of 5 criteria met

${diagnosticSection}

Based on this data, operational continuation is available to you.

SCALE PLAN — OPERATIONAL CONTINUATION
• $1,500/month | 3-month minimum | $4,500 total
• 500 leads/month | $6 overage after that | $500/month cap
• LinkedIn activation begins (full channel coverage)
• Cancellation: 30-day written notice after minimum
• No auto-renewal — new agreement each cycle

This is operational infrastructure, not a sales funnel. If the system has demonstrated value for your pipeline, operational continuation makes sense. If you have questions about what the data shows — reply and let's discuss.

No pressure. No urgency windows. Continuity remains available at your convenience.

To continue: https://qiyadon.com/sign-scale

— Qiyadon Team
    `.trim()
  };
}

function buildMeetingsDiagnostic(observations) {
  // Generates diagnostic text explaining why meetings did or didn't book
  const { meetingsBooked, totalReplies, targetingAssessment, messageAssessment, listQualityAssessment } = observations;

  const lines = ['Our observations:'];

  if (meetingsBooked === 0 && totalReplies > 0) {
    lines.push('• Reply rate is positive — prospects are engaging — but no meetings have booked yet. This typically indicates one of: (1) the message is resonating but the call-to-action needs adjustment, (2) prospects are interested but need more nurturing before committing to a call, (3) the targeting is broad enough to generate replies but the specific ICP fit needs refinement.');
  } else if (meetingsBooked === 0 && totalReplies === 0) {
    lines.push('• No replies yet. This suggests the outreach is not breaking through — likely due to: (1) message-to-targeting mismatch, (2) subject line not resonating, (3) list quality issue (old data, wrong personas). The system needs adjustment before Scale activation would be effective.');
  } else if (meetingsBooked > 0) {
    lines.push('• Meetings booked indicates the system is working — prospects are engaging and converting to calendar. Scale activation will expand capacity and add LinkedIn channel.');
  }

  if (targetingAssessment) {
    lines.push(`• Targeting: ${targetingAssessment}`);
  }
  if (messageAssessment) {
    lines.push(`• Messaging: ${messageAssessment}`);
  }
  if (listQualityAssessment) {
    lines.push(`• List quality: ${listQualityAssessment}`);
  }

  return lines.join('\n');
}

function buildScaleOfferExpiredEmail(clientName, operationalObservations = {}) {
  // "continuation remains available" — not "offer expired"
  const diagnostic = operationalObservations && Object.keys(operationalObservations).length > 0
    ? buildMeetingsDiagnostic(operationalObservations) + '\n\n'
    : '';

  return {
    subject: `Operational continuation remains available`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'scale-continuation-available'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

Operational continuation remains available whenever you're ready.

${diagnostic}The evaluation is complete. No charge, no obligation.

If you'd like to revisit what the data showed or discuss options — reply anytime.

We're here if your pipeline needs us.

— Qiyadon Team
    `.trim()
  };
}

module.exports = {
  buildActivationCompleteEmail,
  buildDay7ReviewEmail,
  buildDay10PreparationEmail,
  buildDay13ReminderEmail,
  buildDay14OfferEmail,
  buildScaleOfferExpiredEmail,
  buildMeetingsDiagnostic
};