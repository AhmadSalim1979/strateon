// English content for the dental site. Every page body is a function of the
// shared helpers `h` (see build.mjs) so operational facts always come from
// clinic-facts.json and images from image-manifest.json. An Urdu locale would
// be a sibling file (content/ur.mjs) with dir: 'rtl', reviewed by a human
// translator and a clinician; never machine-translated medical copy.

export const locale = { lang: 'en', dir: 'ltr' };

export const ui = {
  previewNotice: 'Concept preview — clinic details and appointments are being confirmed.',
  previewMore: 'About this preview',
  skip: 'Skip to main content',
  menu: 'Menu',
  requestAppointment: 'Request an appointment',
  beingConfirmed: 'Being confirmed',
  subjectToConfirmation: 'Subject to clinic confirmation',
  conceptCopy: 'Proposed wording, for clinic review',
  proposedExperience: 'Proposed experience, for clinic review',
  draftForReview: 'Draft for family review',
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

// Proposed categories only. None is a confirmed offering until the lead
// clinician approves the list in clinic-facts.json -> services.
export const proposedCareCategories = [
  { group: 'Everyday and preventive care', items: [
    { slug: 'checkups-and-cleaning', name: 'Check-ups and cleaning', text: 'An examination of teeth, gums and soft tissues, with professional cleaning where needed, and advice on how often to return.' },
    { slug: 'fillings', name: 'Fillings', text: 'Repairing a tooth affected by decay or minor damage, and explaining the filling materials that suit that tooth.' },
    { slug: 'gum-care', name: 'Gum care', text: 'Checking for gum inflammation and disease, cleaning below the gum line where appropriate, and a plan for keeping gums healthy at home.' },
    { slug: 'childrens-dentistry', name: "Children's dentistry", text: 'Dental care for children, with guidance for parents on brushing, diet and developing teeth.' },
  ]},
  { group: 'Restoring teeth', items: [
    { slug: 'crowns', name: 'Crowns', text: 'A cap that covers and protects a weakened or heavily restored tooth.' },
    { slug: 'root-canal-care', name: 'Root canal care', text: 'Treating infection inside a tooth so that the tooth can be kept, often followed by a crown.' },
    { slug: 'extractions', name: 'Extractions', text: 'Removing a tooth that cannot be saved, and discussing options for the space afterwards.' },
    { slug: 'implants', name: 'Implants', text: 'Replacing a missing tooth with an implant-supported crown where assessment shows it is suitable.' },
  ]},
  { group: 'Alignment and appearance', items: [
    { slug: 'orthodontics-and-aligners', name: 'Orthodontics or aligners', text: 'Straightening teeth with braces or clear aligners after an assessment of bite, gums and expectations.' },
    { slug: 'whitening', name: 'Whitening', text: 'Clinician-supervised whitening after a check that teeth and gums are healthy enough for it. Whitening does not change the colour of crowns or fillings.' },
  ]},
  { group: 'When something hurts', items: [
    { slug: 'urgent-dental-concerns', name: 'Urgent dental concerns', text: 'Help with toothache, a broken tooth or a lost filling. Whether same-day appointments are available is still being confirmed.' },
  ]},
];

export const articles = [
  {
    slug: 'how-often-dental-check-up',
    title: 'How often should you have a dental check-up?',
    description: 'Why the right interval between check-ups depends on your own oral health, and what guidance says about it.',
    question: 'Do I really need a check-up every six months?',
    readMinutes: 4,
    sources: [
      ['NICE guideline CG19, Dental checks: intervals between oral health reviews', 'https://www.nice.org.uk/guidance/cg19'],
      ['NICE CG19, 1 Guidance', 'https://www.nice.org.uk/guidance/cg19/chapter/1-guidance'],
    ],
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
<p>If something changes between visits, such as pain, bleeding gums that don't settle, a broken tooth or a lump or ulcer that doesn't heal within a couple of weeks, don't wait for your next check-up. Contact a dentist sooner.</p>`,
  },
  {
    slug: 'what-happens-root-canal-treatment',
    title: 'What actually happens during root canal treatment?',
    description: 'A plain explanation of why root canal treatment is done, what the appointments involve, and what recovery usually feels like.',
    question: 'I have been told I need a root canal. What does that involve?',
    readMinutes: 5,
    sources: [
      ['NHS: Root canal treatment (page last reviewed 3 October 2025)', 'https://www.nhs.uk/conditions/root-canal-treatment/'],
    ],
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
<p>It is normal for the area to feel numb for a few hours, and for the tooth and gum to feel sore or a little swollen for a while. Your dentist will tell you which pain relief is suitable for you and how to look after the tooth until treatment is complete.</p>
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
    readMinutes: 4,
    sources: [
      ['NHS: Toothache (page last reviewed 1 July 2024)', 'https://www.nhs.uk/symptoms/toothache/'],
    ],
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
  ['Is an appointment request the same as a confirmed booking?', 'No. If the clinic adds appointment requests to its website, a request would only tell the clinic when you would prefer to come. An appointment is confirmed only when the clinic itself confirms a date and time with you.'],
  ['Can I book through this website today?', 'Not yet. This is a concept preview of the clinic\'s future website. The phone number, WhatsApp and booking details are being confirmed with the practice and would be listed here only once verified.'],
  ['What will my first visit cost?', 'Consultation fees are being confirmed with the practice. Whatever clinic you visit, it is reasonable to ask about fees, and for an estimate, before agreeing to treatment.'],
  ['Do you accept insurance or corporate panels?', 'This is being confirmed with the practice.'],
  ['Which languages do the dentists speak?', 'This is being confirmed with the practice.'],
  ['Is the clinic accessible, and is there parking?', 'Step-free access, parking and drop-off arrangements are being confirmed with the practice.'],
  ['Who will treat me?', 'Current clinician profiles will be added after review, once each clinician has confirmed their details.'],
];
