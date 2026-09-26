// Team content.
//
// `clinicians` holds VERIFIED current clinicians only. It is empty: none has
// been confirmed. When one is approved, add an entry with the verified fields
// below and the site will list them.
//
// `sampleClinicians` are DELIBERATELY FICTIONAL design demonstrations. The
// names are invented and the portraits are AI-generated. They must never be
// given a PMDC number, university, employment history, years of experience,
// schedule or bookable appointment, and must be deleted (with their image
// slots) before any production launch. Every card, profile, caption and alt
// text states that they are fictional.

export const teamStatus = 'The clinic’s current clinicians and leadership are awaiting confirmation.';

export const fictionalLabel = 'Fictional example · not a member of this practice';

export const teamDisclosure = 'The portraits and profiles below are fictional examples showing how the clinic’s real team could be presented. These people do not work at this practice. Verified clinician profiles will replace them after the family and clinicians approve them.';

// Fields every real profile needs before publication (all unverified today).
export const verificationFields = [
  ['Registered full name', 'As it appears on the PMDC register'],
  ['Actual role at the practice', 'Confirmed by the practice'],
  ['Qualifications', 'Degree, awarding institution and year'],
  ['PMDC registration', 'Number, and the date it was checked on the PMDC register'],
  ['Clinical scope', 'The care this clinician actually provides at the practice'],
  ['Languages', 'Languages the clinician consults in'],
  ['Clinic days', 'Days and times at the practice'],
  ['Consent to publish', 'Written consent for the portrait and profile text'],
];

// Verified clinician schema (every field required by the production gate):
// { slug, registeredName, role, clinicalScope, languages: [], clinicDays,
//   qualifications: [{ name, institution, year }],
//   pmdc: { number, verifiedOn: 'YYYY-MM-DD' },
//   consent: { portrait: true, profile: true, date: 'YYYY-MM-DD' },
//   portraitSlot: 'team-portrait-<slug>' (image status 'authentic-approved'),
//   approvedBy, approvedOn: 'YYYY-MM-DD' }
export const clinicians = [];

export const sampleClinicians = [
  {
    slug: 'sample-amina-rahman',
    name: 'Dr. Amina Rahman',
    role: 'Sample general dentistry profile',
    slot: 'team-portrait-sample-amina-rahman',
    teaser: 'Shows how a profile could introduce a clinician through the way she talks with patients.',
    emphasis: ['Preventive conversations', 'Explaining examination findings', 'Helping a patient understand the options'],
    intro: 'Amina’s sample profile demonstrates how we might introduce a clinician through her approach to conversations with patients: listening to what brought them in, explaining findings in everyday language and allowing time for questions.',
    bio: [
      'This is hypothetical copy, written to show tone and structure. A general dentistry profile like this would open with how the clinician approaches a first conversation: asking what brought someone in, what they have noticed, and what they most want to understand before anything else happens. For a patient who has been putting off a visit, knowing that the first few minutes are a conversation rather than a procedure can make the appointment easier to face.',
      'The profile would go on to describe how findings are explained: showing what was seen, putting it into everyday language, and separating what needs attention now from what can simply be watched. It would close with the kinds of questions the clinician welcomes, so that a reader feels free to ask about options, timing and cost before deciding anything.',
    ],
    related: ['checkups-and-cleaning', 'gum-care'],
  },
  {
    slug: 'sample-zoya-siddiqui',
    name: 'Dr. Zoya Siddiqui',
    role: 'Sample restorative care profile',
    slot: 'team-portrait-sample-zoya-siddiqui',
    teaser: 'Shows how a profile could explain restorative conversations about a damaged tooth.',
    emphasis: ['Discussing a damaged tooth', 'What a filling or crown may involve', 'Alternatives and useful follow-up questions'],
    intro: 'Zoya’s sample profile demonstrates how a clinician could be introduced through the way she talks a patient through a damaged tooth and the choices that come with it.',
    bio: [
      'This is hypothetical copy, written to show tone and structure. A restorative care profile would introduce how a clinician talks through a damaged tooth: what may have caused the damage, how much healthy tooth remains, and why that shapes the options. The aim is to help a reader picture a calm, specific conversation rather than a list of procedures.',
      'It might explain, in the clinician’s own words, what a filling or a crown may involve, which alternatives exist, including monitoring or removal, and which follow-up questions are worth asking: how the tooth should be cared for, what signs would mean coming back sooner, and how the decision could change over time.',
    ],
    related: ['fillings-and-crowns', 'root-canal-and-extraction'],
  },
  {
    slug: 'sample-hamza-khan',
    name: 'Dr. Hamza Khan',
    role: 'Sample family and preventive care profile',
    slot: 'team-portrait-sample-hamza-khan',
    teaser: 'Shows how a profile could present care for adults and families, and everyday prevention.',
    emphasis: ['Making findings accessible to adults and families', 'Home care that fits daily life', 'Understanding review intervals'],
    intro: 'Hamza’s sample profile demonstrates how a clinician could be introduced through the way he explains examination findings to adults and families, and how he talks about everyday prevention.',
    bio: [
      'This is hypothetical copy, written to show tone and structure. A family and preventive care profile would describe how a clinician makes examination findings accessible to adults and to families attending together: using plain language, checking what has been understood, and adjusting an explanation for a child or an older relative.',
      'It would also show how home care and review intervals are discussed: why the time between check-ups can differ from one person to another, which small changes to brushing or cleaning between the teeth tend to matter most, and how parents can help a child feel prepared for a visit.',
    ],
    related: ['childrens-dentistry', 'checkups-and-cleaning'],
  },
];
