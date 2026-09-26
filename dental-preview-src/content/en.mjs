// English content for the dental site. Page bodies live in pages.mjs and use
// the shared helpers `h` (see build.mjs), so operational facts always come
// from clinic-facts.json and images from image-manifest.json. Care and team
// copy live in content/care.mjs and content/team.mjs; health sources in
// content/sources.mjs. An Urdu locale would be a sibling set of files with
// dir: 'rtl', reviewed by a human translator and a clinician; never
// machine-translated medical copy.

export const locale = { lang: 'en', dir: 'ltr' };

export const ui = {
  previewNotice: 'Concept preview: clinic details and appointments are being confirmed. Team profiles are fictional examples.',
  previewMore: 'About this preview',
  skip: 'Skip to main content',
  menu: 'Menu',
  requestAppointment: 'Request an appointment',
  appointmentPreview: 'View the appointment preview',
  beingConfirmed: 'Being confirmed',
  awaitingConfirmation: 'Awaiting practice confirmation',
  awaitingVerification: 'Awaiting verification',
  availabilityTbc: 'Availability to be confirmed',
  clinicalReviewPending: 'Clinical review pending',
  illustrativeNotice: 'Illustrative content for family and clinician review. Service availability and the actual patient experience have not been confirmed.',
  conceptCopy: 'Proposed wording, for clinic review',
  proposedExperience: 'Proposed experience, for clinic review',
  sampleWorkflow: 'Sample workflow, to be approved by the clinic',
  draftForReview: 'Draft for family review',
  guideDraft: 'Draft · awaiting clinician review',
  breadcrumb: 'Breadcrumb',
};

export const nav = [
  { key: 'home', label: 'Home', path: '/' },
  { key: 'practice', label: 'Our Practice', path: '/our-practice/' },
  { key: 'team', label: 'Team', path: '/team/' },
  { key: 'care', label: 'Care', path: '/care/' },
  { key: 'visit', label: 'Your Visit', path: '/your-visit/' },
  { key: 'insights', label: 'Insights', path: '/insights/' },
  { key: 'contact', label: 'Contact', path: '/contact/' },
];

export const articles = [
  {
    slug: 'how-often-dental-check-up',
    title: 'How often should you have a dental check-up?',
    description: 'Why the right interval between check-ups depends on your own oral health, and what guidance says about it.',
    question: 'Do I really need a check-up every six months?',
    review: { status: 'pending', reviewer: null, reviewedOn: null },
    readMinutes: 4,
    sources: ['nice-cg19', 'nice-cg19-guidance', 'nhs-checkups', 'nhs-mouth-ulcers'],
    relatedCare: ['checkups-and-cleaning', 'gum-care', 'childrens-dentistry'],
    summary: ['There is no single right interval for everyone. UK guidance ranges from 3 months to 2 years for adults.', 'Your dentist should explain why they suggest a particular interval, and it can change over time.', "Don't wait for a scheduled check-up if something new appears or doesn't heal."],
    body: `
<p>Many people grow up with the idea that everyone should see a dentist every six months. Current clinical guidance is more personal than that. The right interval between check-ups depends on the health of your teeth and gums, and on your risk of developing problems.</p>
<h2>What the guidance says</h2>
<p>The UK's National Institute for Health and Care Excellence (NICE) recommends that the interval between oral health reviews is set for each patient, based on an assessment of their disease levels and risk. Under that guidance:</p>
<ul>
  <li>the <strong>shortest</strong> recommended interval is <strong>3 months</strong>;</li>
  <li>for adults, the <strong>longest</strong> recommended interval is <strong>24 months</strong>;</li>
  <li>for children, the longest recommended interval is <strong>12 months</strong>, which gives more chances to reinforce preventive advice while teeth are developing.</li>
</ul>
<p>Someone who has kept their mouth healthy for years may, over time and by agreement with their dentist, move to a longer interval. Someone with active gum disease, frequent decay or other risk factors may be asked to come back sooner.</p>
<h2>What affects your interval</h2>
<p>Your dentist will usually consider things such as recent decay or fillings, the condition of your gums, how well you are able to clean your teeth, your diet, smoking, dry mouth, and relevant medical conditions or medicines. The interval can change as your circumstances change.</p>
<h2>Questions worth asking at your next visit</h2>
<ul>
  <li>When should I come back, and why that interval?</li>
  <li>Is there anything about my teeth or gums you would like me to keep an eye on?</li>
  <li>Is there one thing I could change at home that would make the most difference?</li>
</ul>
<p>If something changes between visits, such as pain, bleeding gums that don't settle, a broken tooth, or a mouth ulcer that hasn't healed after three weeks, don't wait for your next check-up. Contact a dentist sooner.</p>`,
  },
  {
    slug: 'what-happens-root-canal-treatment',
    title: 'What actually happens during root canal treatment?',
    description: 'A plain explanation of why root canal treatment is done, what the appointments involve, and what recovery usually feels like.',
    question: 'I have been told I need a root canal. What does that involve?',
    review: { status: 'pending', reviewer: null, reviewedOn: null },
    readMinutes: 5,
    sources: ['nhs-root-canal'],
    relatedCare: ['root-canal-and-extraction', 'fillings-and-crowns', 'urgent-dental-concerns'],
    summary: ['Root canal treatment aims to save a tooth whose inner pulp is infected or badly damaged.', 'It is done under local anaesthetic and often takes two or more appointments; a crown may follow.', 'The main alternative is removing the tooth, so ask about the prospects of each option.'],
    body: `
<p>Being told you need root canal treatment can sound alarming. Knowing what the treatment is for, and what happens at each stage, often makes it much easier to face.</p>
<h2>What it is for</h2>
<p>Inside every tooth is soft tissue called the pulp. If the pulp becomes infected, for example through deep decay, a crack, gum disease or an abscess, the infection can cause pain and spread. Root canal treatment removes the infection from inside the tooth, then cleans and seals it so that it is less likely to become infected again. The main alternative is usually removing the tooth.</p>
<h2>What happens during treatment</h2>
<p>The NHS describes the treatment in broad steps:</p>
<ol>
  <li>A local anaesthetic numbs the tooth. You stay awake.</li>
  <li>A small opening is made in the tooth to reach the pulp.</li>
  <li>The infected pulp is removed and the inside of the tooth is cleaned and shaped.</li>
  <li>The tooth is sealed with a filling.</li>
</ol>
<p>It commonly takes <strong>two or more appointments</strong>, which may each last one to two hours, or sometimes longer. If the tooth was badly damaged, your dentist may recommend a <strong>crown</strong> afterwards to protect it.</p>
<h2>Afterwards</h2>
<p>It is normal for the area to feel numb for a few hours, and for the tooth and gum to feel sore or a little swollen for a while; the NHS says this should improve within a couple of weeks. Your dentist will tell you which pain relief is suitable for you and how to look after the tooth until treatment is complete.</p>
<p>Contact your dentist if pain or swelling gets worse rather than better, or if you develop a high temperature.</p>
<h2>Questions you might ask</h2>
<ul>
  <li>Why do you recommend root canal treatment for this tooth, and what are the alternatives?</li>
  <li>How many visits do you expect, and will I need a crown?</li>
  <li>What will the complete course of treatment cost?</li>
</ul>`,
  },
  {
    slug: 'toothache-when-to-see-a-dentist',
    title: 'Toothache: what you can do now, and when to see a dentist',
    description: 'Sensible first steps for toothache, the signs that mean you should see a dentist, and when to seek emergency help.',
    question: 'My tooth hurts. Is it urgent?',
    review: { status: 'pending', reviewer: null, reviewedOn: null },
    readMinutes: 4,
    sources: ['nhs-toothache', 'nhs-abscess'],
    relatedCare: ['urgent-dental-concerns', 'root-canal-and-extraction', 'gum-care'],
    summary: ['Facial, eye or neck swelling, or difficulty breathing, swallowing or speaking, needs hospital emergency care straight away.', 'Toothache lasting more than two days, or not settling with painkillers, needs a dental assessment.', 'Home measures can ease pain for a while, but they do not treat the cause.'],
    body: `
<div class="dp-urgent" role="note"><p><strong>Seek emergency medical help straight away</strong> if you have toothache with swelling around your eye or in your neck, or swelling in your mouth or neck that makes it hard to breathe, swallow or speak. Go to a hospital emergency department rather than waiting for a dental appointment.</p></div>
<p>Toothache has many possible causes, including decay, an abscess, a cracked tooth, a loose or broken filling, gum disease, a wisdom tooth coming through, teeth grinding and sensitive teeth. A dentist needs to find the cause to treat it properly.</p>
<h2>Things that may help in the meantime</h2>
<p>General health guidance suggests:</p>
<ul>
  <li>eating soft foods and chewing on the other side of your mouth;</li>
  <li>avoiding very hot, very cold or sugary food and drink;</li>
  <li>brushing gently with a soft toothbrush;</li>
  <li>for adults, rinsing with warm salt water;</li>
  <li>taking an over-the-counter painkiller that is suitable for you, following the packet instructions or a pharmacist's advice.</li>
</ul>
<p>These steps can ease discomfort for a short time. They do not treat the cause.</p>
<h2>When to see a dentist</h2>
<p>Arrange to see a dentist if your toothache:</p>
<ul>
  <li>lasts more than two days;</li>
  <li>does not get better with painkillers;</li>
  <li>comes with a high temperature, pain when you bite, red or swollen gums, or a bad taste in your mouth;</li>
  <li>comes with swelling in your cheek or jaw.</li>
</ul>
<h2>Preparing for the appointment</h2>
<p>It helps to note when the pain started, what makes it better or worse, and any medicines you have taken. Please share medical details with the dental team in person or through the clinic's confirmed channels, not through this preview website.</p>`,
  },
];

export const faqs = [
  { q: 'Is an appointment request the same as a confirmed booking?', a: `<p>No. If the clinic adds appointment requests to its website, a request would only tell the clinic when you would prefer to come. An appointment is confirmed only when the clinic itself confirms a date and time with you.</p>` },
  { q: 'Can I book through this website today?', a: `<p>Not yet. This is a concept preview of the clinic's future website. The phone number, WhatsApp and booking details are being confirmed with the practice and will appear on the Contact page once verified.</p>` },
  { q: 'How often should I have a check-up?', a: `<p>It depends on your own oral health. UK guidance suggests intervals from three months to two years for adults, and up to one year for children, set by your dentist after an examination rather than a fixed six months for everyone. <a href="{{guide:how-often-dental-check-up}}">Read the guide on check-up intervals</a>.</p>` },
  { q: 'Will I need X-rays at my first visit?', a: `<p>Not necessarily. X-rays are usually taken when a dentist judges they will show something an examination can't, such as decay between teeth or the bone around the roots. If X-rays are suggested, it is reasonable to ask what they are for. If you have recent X-rays from another dentist, mention them.</p>` },
  { q: "I'm anxious about visiting a dentist. What can I do?", a: `<p>Many people feel this way. It helps to say so at the start, ask for each step to be explained before it happens, and agree a simple signal, such as raising a hand, for when you'd like a pause. Bringing someone with you, or booking a first visit that is only a conversation and examination, can also make it easier.</p>` },
  { q: 'Can I ask for a written estimate before treatment?', a: `<p>Asking for the cost of a proposed treatment, and for it in writing, is a sensible step at any dental practice, particularly for treatment over several visits. How this practice provides estimates is being confirmed.</p>` },
  { q: 'When should a child first see a dentist?', a: `<p>UK guidance suggests a first visit when the first teeth appear, or before a child's first birthday, followed by regular check-ups. Whether this practice sees children is being confirmed. <a href="{{care:childrens-dentistry}}">Read about children's dental care</a>.</p>` },
  { q: 'What should I do if I have pain before an appointment?', a: `<p>If you have facial, eye or neck swelling, or difficulty breathing, swallowing or speaking, go to a hospital emergency department straight away. For toothache that lasts more than two days or doesn't settle with painkillers, see a dentist you can reach promptly. <a href="{{care:urgent-dental-concerns}}">Read about urgent dental concerns</a>.</p>` },
  { q: 'What will my first visit cost?', a: `<p>Consultation fees, payment methods and any insurance or corporate panel arrangements are being confirmed with the practice.</p>` },
  { q: 'Who will treat me?', a: `<p>The clinic's current clinicians are awaiting confirmation. The Team page shows three fictional example profiles that demonstrate how real profiles could look; those people do not work at the practice.</p>` },
];
