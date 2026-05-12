# Qiyadon Shadow Lifecycle Simulation
**Simulated as:** VP Sales, B2B SaaS, Series A, 35 employees
**Date:** 2026-05-12
**Objective:** Commercial believability validation — not technical validation

---

## METHODOLOGY

This is NOT a system test. This is a human experience walkthrough.

Persona: "Marcus" — VP Sales at a Series A B2B SaaS startup, 35 employees, $8M ARR, using HubSpot, running outbound manually with a small team. Has tried 3 other "sales tools" and was underwhelmed. Found Qiyadon through a LinkedIn post by Ahmad.

Goal: Identify friction, confusion, hesitation, trust breaks, emotional discomfort, and credibility gaps — from discovery through long-term operation.

---

## STAGE 1 — DISCOVERY EXPERIENCE

### What Marcus Sees

Marcus reads Ahmad's LinkedIn post about Qiyadon. It's specific — talks about "leads dying of silence" not generic SaaS fluff. He recognizes the pain.

He clicks the link → qiyadon.com

### First Impression (30 seconds)

```
PAGE: qiyadon.com

What Marcus sees:
- Clean, dark, professional (not startup-cute)
- "No lead left behind. Every lead followed up."
- Headline: Pipeline Execution-as-a-Service
- "We run your outbound so your pipeline never goes dark."

What he thinks:
"Hmm. 'Execution-as-a-Service' — what does that mean?"
"It's not another dashboard or tool."
"Someone else runs my outreach? That seems... different."

### Friction #1 — Vocabulary Confusion

"Execution-as-a-Service" is not immediately clear.
Marcus thinks: "Is this a agency? A tool? An AI? A human team?"

**Gap:** Qiyadon describes itself in operational terms, not customer terms.
**Risk:** If Marcus can't quickly categorize what Qiyadon is, he might bounce.

### What I'd Adjust

Add a single line under the headline:
> "We run your outbound campaigns — WhatsApp, Email, LinkedIn — until you have meetings booked in your calendar."

Specific. Understandable. Actionable.

### Friction #2 — Pricing Ambiguity

Marcus scrolls, sees "Start free trial" but no pricing.

He thinks: "How much does this actually cost? I don't want to waste time on a free trial just to find out it's $5,000/month."

**Gap:** Pricing not visible on homepage (only on /pricing page).
**Risk:** High-intent visitors with budget concerns may bounce before reaching pricing.

### What I'd Adjust

Add starting price on homepage:
> "Plans from $300/month" with "See pricing" link.

Not full breakdown — just anchor so he knows it's not enterprise-only.

---

## STAGE 2 — AUDIT ENTRY EXPERIENCE

### The Form: qiyadon.com/pipeline-leak-audit

Marcus fills the audit form.

Questions:
1. What's your biggest pipeline problem? (dropdown)
2. Current outbound approach (dropdown)
3. Average deal size (number)
4. Monthly lead target (number)
5. HubSpot usage level (dropdown)

### First Friction

Question: "What's your biggest pipeline problem?"

Dropdown options: "Leads go dark", "Low response rates", "Can't scale outreach", "No visibility into pipeline"

Marcus thinks: "All of these. But 'Leads go dark' — that's the one that kills me."

He selects "Leads go dark" and continues.

**Observation:** The audit form uses Qiyadon's terminology — which means it already understands his problem. This is GOOD. The form is written by people who know pipeline pain.

### Second Friction

He reaches the last question: "What's your biggest concern about solving this?"

Text field. Optional.

He pauses. Thinks: "Do I really want to type this out? I could just skip it."

He skips it.

**Observation:** Optional open text fields have low fill rates. This is fine — it's optional. But the data is sparse.

### Submit + What Happens Next

He submits → receives confirmation email.

Subject: "Your Pipeline Leak Audit is on its way"

Email body: "We'll be in touch within 24 hours."

Marcus thinks: "Wait — I have to wait 24 hours? I wanted to see if this thing works right now."

**Friction:** The audit is a capture form, not an immediate value delivery. Marcus expects speed, not a "we'll get back to you" promise.

**Gap:** No immediate feedback loop after form submission.
**Risk:** High-intent visitors who don't hear back within 24h may lose interest or forget.

### What I'd Adjust

Change confirmation to: "We'll be in touch within 24 hours. In the meantime — here's what a typical audit looks like: [link to sample audit]"

This gives Marcus immediate content and sets expectations.

---

## STAGE 3 — CRM CONNECTION EXPERIENCE

### The Offer

A week later, Marcus gets an email from Ahmad: "Your audit is ready. Want to see it and discuss?"

On the call, Ahmad says: "We can show you how this works with your actual data. Connect HubSpot and we'll run a 14-day evaluation."

Marcus says: "Okay. But what do you need access to?"

Ahmad: "Read access to your contacts, ability to send emails from your domain."

Marcus pauses.

**Hesitation #1 — Security Concern**

"What exactly will you have access to?"

Ahmad explains. Marcus is thinking: "These are my customer emails. My pipeline. My deal values. You're a stranger on a call I just met."

**Trust Break Point:** CRM access is an intimacy level question. Marcus is giving access to his entire sales operation.

The framing matters enormously here.

### How Qiyadon Currently Frames It (based on onboarding docs):

> "We connect your CRM, activate outbound cadence, initialize workflows, and validate integrations."

**Problem:** "Connect your CRM" sounds like a technical integration, not an operational partnership.

**Gap:** The human relationship framing is missing from the CRM connection explanation.

### What I'd Adjust

Frame it differently on the call:

> "You'll give us read access to your contacts — no write access, no data extraction, nothing goes out of your HubSpot. We use it solely to execute your cadence. Think of it like hiring a freelance execution team that works inside your CRM. They can see what you see, but they can't take anything with them."

Specific. Human. Clear boundaries.

### OAuth Flow — What Marcus Sees

The HubSpot OAuth screen:

```
Qiyadon is requesting access to:
- Read your contacts
- Send email on your behalf
- Access deal information

[Accept / Cancel]
```

Marcus thinks: "Send email on my behalf? From my email address?"

**Hesitation #2 — Email Sending Concern**

This is a big trust moment. If Qiyadon sends FROM his domain, he's worried about:
- Spam complaints hitting his domain reputation
- Messages going out without his knowledge
- His prospects getting contacted in ways he didn't approve

**Gap:** The OAuth screen doesn't explain the send behavior. "Send email on your behalf" is ambiguous.

### What I'd Adjust

The OAuth screen (if we can customize HubSpot's screen — we can't directly, but we can explain in onboarding email):

Explain BEFORE OAuth:

> "We send from your domain — not ours. This means your prospects see emails from you, with your signature, from your address. We act as your outbound team, executing the cadence you approve. You can pause or stop at any time."

Address the fear before it becomes a hesitation.

---

## STAGE 4 — FIRST 48-HOUR ONBOARDING EXPERIENCE

### The Wait

Marcus signs the trial agreement at sign-trial.html. Submits name, email, company. Checks the two boxes (activation acknowledgment + Scale transition acknowledgment).

**Observation:** The dual checkbox is clear and explicit. Marcus knows what he's getting into. Good.

He gets confirmation: "We'll be in touch within 24–48 hours."

Day 1 passes. No email.

Day 2 passes. No email.

Marcus thinks: "Did this get lost? Did they forget about me?"

**Friction:** 48 hours is a long time to wait with no contact, especially if he expected "fast" from a tech company.

### Day 2 — First Email: Activation Complete

Finally, Day 2 evening:

Subject: "Your Qiyadon system is live — what's next"

Email body:
```
Hi Marcus,

Your Qiyadon activation is complete.

Here's what we connected:
• CRM: HubSpot
• Channels: Email, WhatsApp
• Cadence: 6-touch sequence

What happens next:

The operational evaluation period begins now. For the next 13 days, your campaigns run live and we generate weekly reports.

This is not a sprint — it's an operational evaluation. The system needs the full 14 days to demonstrate what it can do.

You'll receive your first operational report at the Day 7 mark.

Questions during the evaluation? Reply to this email. We're monitoring.

— Qiyadon Team
```

**Trust Signal — POSITIVE:** "This is not a sprint — it's an operational evaluation. The system needs the full 14 days to demonstrate what it can do."

This framing is excellent. Marcus thinks: "They're managing my expectations. They know this takes time. That's professional."

**Trust Signal — POSITIVE:** "Reply to this email. We're monitoring."

This tells Marcus there's a human here, not just automation.

### But — Confusion Point

The email says "we connected" but Marcus doesn't know what that means.

He thinks: "What exactly did they connect? Did they import my leads? Did they set up a sequence? Did they configure anything in my HubSpot?"

**Gap:** The email is clear about what happens next, but vague about what "connected" actually means. Marcus can't see his own HubSpot to know what's changed.

### What I'd Adjust

Include in the email:

> "What we set up in your HubSpot:
> - Created a 'Qiyadon' folder with your active leads
> - Added your first outreach sequence (Day 1 touch)
> - Configured reply tracking (replies will auto-log)
> - Set up a weekly report dashboard for Day 7"

Specific. Verifiable. Builds trust that something real happened.

---

## STAGE 5 — FIRST ARTIFACT DELIVERY EXPERIENCE

### Day 7 — The Weekly Report

Marcus receives an email with a PDF/HTML report attachment.

Subject: "Week 1 Pipeline Report — Marcus"

He opens it.

**What he sees:**

```
WEEK 1 PIPELINE REPORT
Marcus Chen | VP Sales | Your Company

PIPELINE OVERVIEW
Active leads: 18
Touches sent: 24
Replies received: 3
Reply rate: 12.5%

CHANNEL BREAKDOWN
Email: 18 touches | 2 replies | 11%
WhatsApp: 6 touches | 1 reply | 16%

INDIVIDUAL LEAD STATUS
[Lead Name] [Company] — Day 2 — Replied
[Lead Name] [Company] — Day 1 — No reply
...

NEXT ACTIONS
- Continue cadence for leads 1-15
- Escalate leads with no response by Day 14
- Adjust targeting if reply rate drops below 5%

— Qiyadon Operations | Questions? Reply to this email
```

**Emotional Response:**

Marcus thinks: "This is... actually useful. I can see what's happening."

**Trust Signal — POSITIVE:** The report is clear, professional, actionable. He's not getting a vanity metric — he's getting operational data.

**Trust Signal — POSITIVE:** "Reply rate: 12.5%" is specific. He knows what happened.

**Trust Signal — POSITIVE:** Individual lead status — he can see his specific leads, not just aggregate numbers.

**Would Marcus forward this internally?**

He might. The report is useful for his own visibility. But would he show his CEO? Probably not — it's operational, not executive-level.

**Gap:** This is a tactical report, not an executive summary. Marcus sees value, but his VP of Marketing (if he had one) would need a different view.

### Friction #1 — No Context

The report shows numbers but no context: "Why did email outperform WhatsApp? Why are certain leads not replying?"

Marcus thinks: "The report tells me what happened, not why. I still have to figure out what to do."

**Gap:** No recommendations, no insight, no "here's what we think is happening."

### Friction #2 — Actionable Next Steps Are Vague

"Continue cadence for leads 1-15" — Marcus doesn't know which leads are #1-#15. He's reading names but can't connect "leads 1-15" to the list he knows.

**Gap:** The "next actions" assume Marcus knows the lead numbering system. He doesn't.

### What I'd Adjust

Make the report more interpretable:

- Add a "What's Working" section: "Email replies are 2x WhatsApp — your market responds better to longer-form outreach"
- Make lead references by name AND company, not just name
- Add "This week we learned" — one insight per report, not just data

---

## STAGE 6 — ONGOING CADENCE EXPERIENCE

### What Marcus Experiences

Days 1–14, Marcus receives touches on his leads.

**Day 1:** "Hi [Lead], this is Marcus from [Company]. I wanted to reach out because..."

**Day 3:** "[Lead], following up from my earlier message — did you get a chance to see this?"

**Day 7:** "[Lead], I found something that might be relevant to your situation..."

**Day 14:** "[Lead], checking in one last time..."

Marcus sees these go out. His CRM shows them being sent.

### His Reaction

**Positive:** "They're actually doing it. My leads are being touched consistently."

**Concern:** "Wait — are these personalized or just generic? My leads are getting the same message as everyone else."

**Hesitation:** He opens one of the emails. It's well-written but he notices it's the same structure as the others. Not personalized to each lead's company or role.

**Gap:** The cadence is executing, but Marcus can tell it's templated — not truly personalized. This isn't necessarily bad (it works), but it might feel "inauthentic" to a VP Sales who cares about buyer experience.

### Question: Does Marcus Feel "Monitored"?

He knows Qiyadon is watching the cadence. He gets weekly reports. The system is tracking his leads.

He thinks: "Is this too much visibility? Am I being watched?"

**Trust Risk:** If a system has too much operational visibility into Marcus's pipeline, he might feel like he's losing control. "They can see everything my team is doing."

**Mitigation:** The report framing should emphasize "we're helping you run outreach" not "we're watching your every move."

**Current framing:** "Pipeline Overview" — good. "Qiyadon Operations" — good. It's positioned as an operational partner, not a surveillance system.

### Question: Does He Feel "Supported" or "Pressured"?

The touches are helpful, not pushy. No "LIMITED TIME OFFER" language. No aggressive follow-up.

**Positive:** The cadence feels calm, professional.

**Negative:** At Day 13, Marcus gets the closing reminder email. It says: "Tomorrow is Day 14 — what to expect."

He thinks: "Wait — I need to decide something tomorrow? I haven't even evaluated whether this is working yet."

**Friction:** The reminder is clear, but it puts implicit pressure on Marcus to make a decision in 24 hours.

**Gap:** The Day 13 email says "here's what happens at Day 14" — but Marcus isn't sure if he wants to continue. He feels like the decision is being accelerated on the system's timeline, not his.

---

## STAGE 7 — ESCALATION EXPERIENCE

### The Scenario

A lead, Sarah from a target company, has been in cadence for 14 days with no response. Qiyadon's system marks her as "stalled" and escalates.

Marcus gets an email:

Subject: "Lead Escalation — Sarah Johnson, [Target Company]"

```
Lead: Sarah Johnson | [Target Company]
Status: No response in 14 days
Last touch: Day 14 (final)
Action required: Human review needed

Options:
1. Resume cadence (she may just be busy)
2. Pivot message (try a different angle)
3. Close lead (move to dormant)

Reply with your decision and we'll execute.
```

**Trust Signal — POSITIVE:** Marcus knows exactly what's happening and why. He can make an informed decision.

**Trust Signal — POSITIVE:** The escalation is human-shaped — it's asking for his input, not making a decision for him.

**Concern:** "Sarah is a good prospect. I don't want to lose her. But I also don't want to keep touching her if she's not interested."

Marcus replies: "Pivot — try a different message about our case studies."

Qiyadon executes.

**Gap:** The response time on escalations matters. If Marcus gets the escalation email and takes 2 days to respond, the lead stays in limbo. There's no SLA on escalation responses.

---

## STAGE 8 — DAY 14 EVALUATION EXPERIENCE

### The Assessment Email

Day 14 morning. Marcus receives:

Subject: "Day 14 Assessment — here's where we stand"

```
Hi Marcus,

Here's our Day 14 operational assessment:

QUALIFICATION CRITERIA
• Lead quality score: Met — Above threshold
• Engagement rate: Met — 12.5% reply rate
• Feedback quality: Partially met — Client engaged but data could be cleaner
• Meetings scheduled: Not met — None booked yet
• List quality: Met — Sufficient data

Result: 3 of 5 criteria met

Based on this, we'd like to offer you the Scale plan.

SCALE PLAN — OFFER VALID FOR 72 HOURS
Plan: Scale | $1,500/month
Minimum: 3 months | Total commitment: $4,500
Included: 500 leads/month
Overage: $6/lead after 500 | $500/month cap

[Accept offer: https://qiyadon.com/sign-scale]

If you want to proceed: review the Scale Service Agreement, and sign. No charge occurs until the signed agreement is received.

If you're passing: just reply and we'll close the evaluation cleanly.

We're grateful for the chance to demonstrate what Qiyadon can do. Regardless of the outcome, thank you for the full 14-day evaluation.

— Qiyadon Team
```

**Marcus's Reaction:**

He reads it carefully. He's not sure.

**Hesitation #1:** "3 of 5 criteria met — but one of them is 'Meetings scheduled' which is the most important thing I care about. We didn't book any meetings. Why are they offering me a paid plan if I didn't get the main outcome I wanted?"

**Gap:** The qualification framework is transparent, but it might feel like Qiyadon is lowering the bar to close a sale. "We need 3 criteria and you met 3 — here's your upsell" feels different from "You're a good fit for Scale because the engagement patterns predict future success."

**Friction:** The offer is 72 hours. Marcus thinks: "I need more time. I can't decide in 72 hours whether to commit $4,500."

**Trust Risk:** The urgency window (72 hours) might feel like a pressure tactic. Marcus is潜意识 thinking: "They're rushing me because they know I'll second-guess if given time."

### The Sign-Scale Page

Marcus clicks the link. He sees sign-scale.html.

**What he reads:**

He sees the evaluation summary (4 criteria met, 1 not met) with a clear explanation. He sees observed value ("cadence continuity", "pipeline velocity", "resonance patterns").

**Hesitation:** The observed value section is generic — "cadence ran consistently." He's not sure what that means for his specific business.

**He reads the pricing:** $1,500/month, 3-month minimum.

He thinks: "This is real money. And 3 months means $4,500 I can't easily get back if it doesn't work."

**Trust Signal — POSITIVE:** The page is transparent. He knows what he's getting. He knows the commitment.

**Trust Signal — POSITIVE:** "No auto-renewal" is clearly stated.

**Concern:** "But I'm not sure if we're actually getting results. We got reply rates but no meetings. Is that Qiyadon's fault or our list's fault?"

**Gap:** The evaluation summary doesn't help Marcus understand WHY meetings didn't book. Was it targeting? Message? List quality? Product-market fit? He has no diagnostic.

---

## STAGE 9 — SCALE TRANSITION EXPERIENCE

### If Marcus Accepts

He fills out sign-scale.html. Signs the agreement. Submits.

**What he gets:** "Scale Partnership Confirmed — Our team will be in touch within 24 hours."

**Gap:** The next steps are unclear. Does he get a welcome call? Onboarding? Who's his point of contact?

He thinks: "I signed. What happens now? Do I just wait?"

**Friction:** The sign-scale success page says "team will be in touch within 24 hours" but doesn't set clear expectations about what the next interaction looks like.

### What I'd Adjust

Add to success page:

> "What happens next:
> - Day 1: Your account manager reviews your evaluation data
> - Day 2: 30-min onboarding call (we'll send calendar invite)
> - Day 3+: LinkedIn activation begins, lead limit increases to 500/month
> - Week 1: First Scale weekly report"

Clear, sequential, expectation-setting.

---

## STAGE 10 — LONG-TERM OPERATIONAL CONTINUITY EXPERIENCE

### Month 2 — Marcus's Experience

Marcus has been on Scale for 6 weeks. Reports come every Friday. Cadence runs daily.

**What's working:**
- His pipeline has momentum
- Reply rate is consistent (8–12%)
- He's had 2 meetings booked from Qiyadon outreach
- He trusts the system

**What's annoying:**
- The weekly report is always the same format — he stopped reading it closely
- He feels like "Qiyadon is running in the background" — he doesn't think about it much
- Occasionally a lead will go dark and he gets an escalation email, but he often forgets to respond, leaving leads in limbo
- He's not sure if the system is optimizing or just executing the same cadence forever

**Gap:** No sense of improvement or learning. The system runs, but Marcus doesn't know if it's getting better.

**Question:** Would Marcus renew after 3 months?

He's not sure. He got 2 meetings but isn't sure if that's worth $1,500/month. He's also worried about the minimum commitment — "What if months 4–6 are worse than months 1–3?"

**Trust Risk:** The commercial relationship feels transactional — "I pay $1,500 and get some meetings." There's no sense of partnership evolution or customization.

---

## LIFECYCLE OBSERVATIONS SUMMARY

### Trust-Risk Findings

| Stage | Trust Risk | Severity | Mitigation |
|---|---|---|---|
| Discovery | "Execution-as-a-Service" unclear | Medium | Add specific value prop line on homepage |
| Audit | 24h wait feels slow | Low | Give immediate sample audit |
| CRM Connect | Security concern (intimacy level) | High | Human framing before OAuth |
| 48h Wait | "Did they forget me?" | Medium | Proactive "you're on our list" email at 24h |
| Artifact | Tactical vs executive view | Low | Add executive summary section |
| Cadence | "Is this personalized?" concern | Medium | Better message framing that it's "cadence template + your data" |
| Day 13 Reminder | Decision being accelerated | Medium | Let client know 5 days before Day 14 |
| Day 14 Offer | 72h feels like pressure tactic | High | Extend to 5 days for first conversion |
| Scale Sign | "What happens next?" unclear | Medium | Sequential onboarding plan on success page |
| Month 2+ | No sense of improvement/learning | Medium | Add "Here's what changed this month" to reports |

### Emotional-Friction Findings

| Stage | Friction | Emotional Impact |
|---|---|---|
| Discovery | Vocabulary confusion | Uncertainty about what Qiyadon is |
| Audit | Optional field skipped | Mild regret, low data capture |
| CRM Connect | "Will you send from my domain?" fear | Vulnerability, loss of control |
| Day 2 Wait | "Did I get forgotten?" | Slight anxiety, abandonment fear |
| Artifact | Report is useful but not exciting | Satisfaction but not delight |
| Ongoing | Templated messages feel generic | Mild disappointment, not trust-breaking |
| Day 13 | Pressure to decide in 24h | Uncomfortable urgency |
| Day 14 | Criteria met but no meetings = still offering sale | Suspicion — "lowering bar to close" |
| Scale | "What did I actually sign?" | Post-purchase uncertainty |
| Month 2+ | System feels static, no evolution | Complacency risk |

### Operational-Usability Findings

| Finding | Impact |
|---|---|
| Week 1 report has no recommendations section | Client still has to interpret data |
| "Continue cadence for leads 1-15" unclear | Client can't act without decoding |
| Escalation has no SLA on Marcus's response | Leads stay in limbo |
| Day 14 offer has no diagnostic on meeting failures | Client can't trust why Scale is recommended |
| No onboarding call after Scale signing | Client feels adrift |

### Recommended Corrections (No New Architecture — Just UX/Communication Fixes)

1. **Homepage:** Add "We run your outbound — WhatsApp, Email, LinkedIn — until you have meetings booked" under main headline
2. **Audit confirmation:** Include sample audit link + 24h expectation
3. **CRM connection:** Human framing before OAuth: "We work inside your CRM as your execution team — here's exactly what that means"
4. **Day 1 (24h mark):** Send "You're on our list" confirmation at 24h if no activation email yet
5. **Activation email:** Add "Here's what we actually set up in your HubSpot" section
6. **Weekly report:** Add "What's working / What we're adjusting" section, make lead references by name+company
7. **Day 10 email:** "FYI — Day 14 is next week. Here's how to interpret your evaluation" (not a countdown, a preparation)
8. **Day 14 offer:** Extend 72h → 96h for first conversion (reduces pressure perception)
9. **Day 14 offer:** Add diagnostic section: "Here's why meetings weren't booked [targeting/message/list] — here's what Scale will improve"
10. **Scale success page:** Add sequential onboarding timeline (Day 1, Day 2, Week 1)
11. **Monthly Scale reports:** Add "Month-over-month change" section — shows learning, not just execution

---

## OVERALL VERDICT

### Would Marcus Trust Qiyadon?

**Yes — with reservations.** The system is professional, transparent, and operationally useful. But there are moments of friction and hesitation that could cause a careful buyer to walk away.

### Would Marcus Continue After Day 14?

**Maybe.** He needs to see that meetings actually came from the outreach, not just reply rates. The metric that matters is bookings, not touches.

### Would Marcus Refer Qiyadon?

**Possibly — if meetings booked.** He would refer it to a peer if the outcome was clear. Without meetings, he's hesitant to recommend because he can't prove ROI.

### What Is the Single Biggest Trust Risk?

**The 72-hour window at Day 14.** It feels like a pressure tactic, not a professional offering. "Enterprise clients" don't make $4,500 decisions in 72 hours. Extending to 96h or even 5 days would increase trust significantly.

### What Is the Single Biggest Operational Gap?

**No diagnostic on why meetings didn't book.** Marcus is being asked to pay $1,500/month when the primary outcome (meetings) wasn't achieved. The offer should include an explanation of what would change in Scale to address this.

---

*Shadow lifecycle simulation: COMPLETE*
*Human experience validated — commercial believability: CONDITIONAL PASS*
*Key finding: Trust is earned through clarity and outcome attribution, not system sophistication*