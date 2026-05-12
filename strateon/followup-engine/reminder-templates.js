/**
 * reminder-templates.js — Qiyadon 4-email reminder sequence
 * 
 * Calm, operational, trust-first tone.
 * No aggressive urgency, no growth-hack language, no countdown mechanics.
 */

function buildActivationCompleteEmail(clientName, activationDetails = {}) {
  return {
    subject: `Your Qiyadon system is live — what's next`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'activation-complete'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

Your Qiyadon activation is complete.

Here's what we connected:
${activationDetails.crm ? `• CRM: ${activationDetails.crm}\n` : ''}
${activationDetails.channels ? `• Channels: ${activationDetails.channels}\n` : ''}
${activationDetails.cadence ? `• Cadence: ${activationDetails.cadence}\n` : ''}

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

9 days left in the evaluation. Here's what happens at Day 14:
→ We assess the 5 qualification criteria together
→ If at least 3 are met → Scale offer delivered (72-hour acceptance window)
→ If fewer than 3 → you owe nothing, evaluation closes cleanly

Questions? Reply anytime.

— Qiyadon Team
    `.trim()
  };
}

function buildDay13ReminderEmail(clientName) {
  return {
    subject: `Tomorrow is Day 14 — what to expect`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'day-13-reminder'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

Tomorrow we complete the operational evaluation.

Here's the sequence:

1. We share our assessment of the 5 qualification criteria
2. If at least 3 are met → Scale offer delivered (72-hour acceptance window)
3. You decide yes or no — no pressure, no obligations
4. If no → we close cleanly, no follow-up for 60 days

Scale plan offer (if you qualify):
• $1,500/month | 3-month minimum | $4,500 total
• 500 leads/month | $6 overage after that | $500/month cap

No card will be charged unless you sign a new paid agreement.

One thing: if you're going to pass on the offer, let us know within the 72-hour window so we can close cleanly. If we don't hear back, we'll send one follow-up and then not reach out for 60 days.

Questions before tomorrow? Reply anytime.

— Qiyadon Team
    `.trim()
  };
}

function buildDay14OfferEmail(clientName, qualificationResults, scaleOffer) {
  const criteriaLines = qualificationResults
    .map(c => `• ${c.label}: ${c.met ? 'Met' : 'Not met'}${c.detail ? ` — ${c.detail}` : ''}`)
    .join('\n');

  const resultText = qualificationResults.filter(c => c.met).length >= 3
    ? `${qualificationResults.filter(c => c.met).length} of 5 criteria met — Scale offer below`
    : `${qualificationResults.filter(c => c.met).length} of 5 criteria met — no paid offer this cycle`;

  return {
    subject: `Day 14 Assessment — here's where we stand`,
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

Result: ${resultText}

${qualificationResults.filter(c => c.met).length >= 3 ? `
Based on this, we'd like to offer you the Scale plan.

SCALE PLAN — OFFER VALID FOR 72 HOURS
• Plan: Scale | $1,500/month
• Minimum: 3 months | Total commitment: $4,500
• Included: 500 leads/month
• Overage: $6/lead after 500 | $500/month cap
• Cancellation: 30-day written notice after minimum

To accept: visit https://qiyadon.com/sign-scale

If you want to proceed: review the Scale Service Agreement and sign. No charge occurs until the signed agreement is received.

If you're passing: just reply and we'll close the evaluation cleanly.

We're grateful for the chance to demonstrate what Qiyadon can do. Regardless of the outcome, thank you for the full 14-day evaluation.

— Qiyadon Team
` : `
Based on this, the criteria for a paid offer weren't met this cycle. We want to be straightforward with you — we won't push a fit that isn't there.

The evaluation ends here. No charge, no obligation, no follow-up pressure. We'll send one final note and then not reach out for 60 days.

If your circumstances change or you want to revisit, you're welcome to reach out directly.

Thank you for the 14-day evaluation. It gave us the time we needed to demonstrate what Qiyadon does — even if the results didn't cross the qualification threshold this time.

— Qiyadon Team
`}`.trim()
  };
}

function buildScaleOfferExpiredEmail(clientName) {
  return {
    subject: `Scale offer has closed — what's next`,
    to: clientName.email,
    headers: {
      'X-Qiyadon-Type': 'reminder',
      'X-Qiyadon-Template': 'scale-offer-expired'
    },
    body: `
Hi ${clientName.firstName || clientName.name},

Your 72-hour Scale offer window has closed.

The evaluation is complete. No charge, no obligation.

If you'd like to revisit Qiyadon in the future, you're welcome to reach out directly. We'll be here.

Thank you for the 14-day evaluation.

— Qiyadon Team
    `.trim()
  };
}

module.exports = {
  buildActivationCompleteEmail,
  buildDay7ReviewEmail,
  buildDay13ReminderEmail,
  buildDay14OfferEmail,
  buildScaleOfferExpiredEmail
};