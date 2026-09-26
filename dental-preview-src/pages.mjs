// Page definitions. `path` is relative to the site root (the build prefixes
// /dental-preview in preview mode). `approvedForProduction` controls the
// production sitemap; flip it only after the page's facts are approved.

export function pages(h, en) {
  const { url, img, pill, bookBtn, factText, fact, esc, ui } = h;
  const { proposedCareCategories, articles, faqs } = en;
  const loc = factText('location_broad');

  const closingCta = (title = 'When you\'re ready, we\'ll be here.') => `
<section class="dp-section dp-section--ink">
  <div class="dp-wrap dp-split">
    <div>
      <p class="dp-eyebrow">Appointments</p>
      <h2>${title}</h2>
      <p class="dp-lede">Requests will open once the clinic confirms its booking process. A request is not a booking: the clinic will contact you to confirm a date and time.</p>
    </div>
    <div class="dp-actions" style="justify-content:flex-start">
      ${bookBtn(ui.requestAppointment, 'dp-btn dp-btn--light')}
      <a class="dp-btn dp-btn--ghost" style="color:#f3efe7!important;border-color:#5b6064" href="${url('/contact/')}">Find us in Clifton</a>
    </div>
  </div>
</section>`;

  const teamEmpty = (heading = 'Current clinician profiles will be added after review.', level = 3) => `
<div class="dp-empty">
  <p class="dp-eyebrow" style="justify-content:center">Our team</p>
  <h${level} class="dp-empty__title">${heading}</h${level}>
  <p>We want you to know exactly who will look after you. Each profile will show the clinician's name as registered, qualifications, the care they focus on, the languages they speak and the days they see patients, once each detail has been confirmed with them.</p>
</div>`;

  const legacyNote = `<p class="dp-muted" style="font-size:.95rem">Dr. Asif Niaz Arain passed away on 9 March 2024. The practice continues to carry his name. He does not treat patients and cannot be booked.</p>`;

  const careGroupsHtml = (withPills = true) => proposedCareCategories.map((g) => `
  <div style="margin-block-end:48px">
    <h2 style="font-size:1.8rem;margin-block-end:18px">${esc(g.group)}</h2>
    <div class="dp-grid dp-grid--2">
      ${g.items.map((it) => `<article class="dp-card${it.slug === 'checkups-and-cleaning' ? ' dp-card--link' : ''}">
        ${withPills ? `<div class="dp-card__meta">${pill('pending', ui.subjectToConfirmation)}</div>` : ''}
        <h3 style="font-size:1.12rem;margin:0 0 .4em">${it.slug === 'checkups-and-cleaning' ? `<a href="${url('/care/checkups-and-cleaning/')}">${esc(it.name)}</a>` : esc(it.name)}</h3>
        <p class="dp-muted">${esc(it.text)}</p>
        ${it.slug === 'checkups-and-cleaning' ? `<p style="margin:0"><a class="dp-textlink" href="${url('/care/checkups-and-cleaning/')}">See the treatment-page template</a></p>` : ''}
      </article>`).join('')}
    </div>
  </div>`).join('');

  const visitSteps = `
<ol class="dp-steps">
  <li><div><h3>Before you arrive</h3><p>You request an appointment and the clinic contacts you to confirm a time. You'll know who you are seeing and roughly how long the visit will take.</p></div></li>
  <li><div><h3>Arriving and settling in</h3><p>A short welcome at reception. You'll be asked to complete a medical history form in person, kept with your clinical records rather than sent online.</p></div></li>
  <li><div><h3>A conversation first</h3><p>Your dentist asks what brought you in and what matters to you, whether that's pain, a worry or a check-up you've been putting off.</p></div></li>
  <li><div><h3>An unhurried examination</h3><p>A careful look at your teeth, gums and mouth. X-rays are taken only when they are clinically useful, and you'll be told why.</p></div></li>
  <li><div><h3>Clear options, in plain language</h3><p>What your dentist found, the realistic options including doing nothing, and what each option involves and costs. There's no pressure to decide on the day.</p></div></li>
</ol>`;

  const list = [];

  // ------------------------------------------------------------- Home
  list.push({
    path: '/', nav: 'home', approvedForProduction: true,
    title: 'Dr. Asif Niaz Arain & Associates Dental Professionals | Clifton, Karachi',
    description: 'A concept preview of the website for Dr. Asif Niaz Arain & Associates Dental Professionals in Clifton, Karachi. Clinic details and appointments are being confirmed.',
    body: () => `
<section class="dp-hero">
  <div class="dp-wrap dp-hero__grid">
    <div>
      <p class="dp-eyebrow">Dental practice · ${loc}</p>
      <h1>Thoughtful dental care in Clifton, Karachi.</h1>
      <p class="dp-lede">A practice that takes time to listen, explains every option clearly, and treats each visit with care, from a routine check-up to more involved treatment. ${pill('draft', ui.conceptCopy)}</p>
      <div class="dp-actions">
        ${bookBtn()}
        <a class="dp-btn dp-btn--ghost" href="${url('/your-visit/')}">Plan your first visit</a>
      </div>
      <div class="dp-hero__meta">
        <span>${loc}</span>
        <span>Opening hours: ${factText('opening_hours')}</span>
      </div>
    </div>
    <div class="dp-hero__media">${img('hero-clinic', { eager: true })}</div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-head">
      <div>
        <p class="dp-eyebrow">Our approach</p>
        <h2>Care that starts with a conversation.</h2>
        <p class="dp-lede">Principles we're proposing for the practice, to be refined with the clinical team. ${pill('draft', ui.conceptCopy)}</p>
      </div>
    </div>
    <div class="dp-grid dp-grid--3">
      <article class="dp-card dp-card--quiet"><span class="dp-card__num">i.</span><h3>Listen before we look</h3><p class="dp-muted">Every visit begins with what you want to talk about, whether that's a specific worry or simply a check-up.</p></article>
      <article class="dp-card dp-card--quiet"><span class="dp-card__num">ii.</span><h3>Explain before we treat</h3><p class="dp-muted">You'll hear what we found, the options, what each involves and costs, and time to decide.</p></article>
      <article class="dp-card dp-card--quiet"><span class="dp-card__num">iii.</span><h3>Care that lasts</h3><p class="dp-muted">Prevention, sensible follow-up and honest advice, so small problems are less likely to become big ones.</p></article>
    </div>
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-split">
    <div>${img('interior-reception')}</div>
    <div>
      <p class="dp-eyebrow">What your visit will be like</p>
      <h2>Calm, clear, and at your pace.</h2>
      <p class="dp-lede">If you haven't seen a dentist in a while, or you feel anxious about it, tell us. We'll explain each step before it happens and you can ask us to pause at any time.</p>
      <p><a class="dp-textlink" href="${url('/your-visit/')}">Your first visit, step by step</a></p>
    </div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-head">
      <div>
        <p class="dp-eyebrow">Who will treat you</p>
        <h2>Meet the people behind your care.</h2>
        <p class="dp-lede">The most important question before any visit: who will I see? This section will introduce the practice's current dentists.</p>
      </div>
      <a class="dp-textlink" href="${url('/team/')}">About the team</a>
    </div>
    ${teamEmpty()}
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-split">
    <div>
      <p class="dp-eyebrow">Our name</p>
      <h2>In memory of Dr. Asif Niaz Arain.</h2>
      <p class="dp-lede">The practice carries the name of its founder. A tribute, approved by his family, will be shared here.</p>
      ${legacyNote}
      <p><a class="dp-textlink" href="${url('/our-practice/')}">Our story</a></p>
    </div>
    <div style="max-width:420px;justify-self:center;width:100%">${img('founder-portrait')}</div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-head">
      <div>
        <p class="dp-eyebrow">Your first visit</p>
        <h2>What happens when you come in.</h2>
      </div>
      <a class="dp-textlink" href="${url('/your-visit/')}">Full patient information</a>
    </div>
    <div class="dp-split dp-split--top">
      ${visitSteps}
      <div>${img('first-visit')}</div>
    </div>
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-split">
    <div>
      <p class="dp-eyebrow">Find us</p>
      <h2>${loc}</h2>
      <p class="dp-lede">The exact address, directions, parking and opening hours are being confirmed with the practice and will be shown here once verified.</p>
      <ul class="dp-list-lines" style="margin-block:24px">
        <li><span>Address</span>${factText('address_full')}</li>
        <li><span>Opening hours</span>${factText('opening_hours')}</li>
        <li><span>Telephone</span>${factText('phone_primary')}</li>
      </ul>
      <a class="dp-textlink" href="${url('/contact/')}">Contact and directions</a>
    </div>
    <div>${img('location-exterior')}</div>
  </div>
</section>
${closingCta()}`,
  });

  // ------------------------------------------------------------- Our Practice
  list.push({
    path: '/our-practice/', nav: 'practice', approvedForProduction: true,
    crumbs: [{ label: 'Our Practice', path: '/our-practice/' }],
    title: 'Our Practice',
    description: 'The story of Dr. Asif Niaz Arain & Associates Dental Professionals in Clifton, Karachi, and the people who lead it today.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Our practice</p>
  <h1>A Clifton practice, and the name it carries.</h1>
  <p class="dp-lede">This page will tell the practice's story in the family's and team's own words: where it began, who leads it now, and how it cares for patients today.</p>
</div></header>

<section class="dp-section">
  <div class="dp-wrap dp-split dp-split--top">
    <div style="max-width:440px;width:100%">${img('founder-portrait')}</div>
    <div>
      <p class="dp-eyebrow">Founder and namesake</p>
      <h2>Dr. Asif Niaz Arain</h2>
      <p class="dp-lede">A tribute approved by the family will appear here.</p>
      ${legacyNote}
      <div class="dp-note" style="margin-block:28px">
        <p style="margin-bottom:.6em">${pill('draft', ui.draftForReview)}</p>
        <p style="margin-bottom:.6em">Public reporting at the time of his passing (Dental News Pakistan, 12 March 2024) described Dr. Arain as:</p>
        <ul style="margin-bottom:.6em">${fact('founder_biography').value.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <p>These points are shown only so the family can confirm, correct or replace them. They will not be published as part of the tribute without the family's approval.</p>
      </div>
    </div>
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-split">
    <div>
      <p class="dp-eyebrow">The practice today</p>
      <h2>Who leads the practice now.</h2>
      <p>${pill('pending', ui.beingConfirmed)}</p>
      <p class="dp-lede">This section is reserved for the practice's current leadership and its story in the present tense, written with them. We won't describe a succession or history that hasn't been confirmed.</p>
      <p><a class="dp-textlink" href="${url('/team/')}">Meet the team</a></p>
    </div>
    <div>${img('team-group')}</div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-head"><div>
      <p class="dp-eyebrow">The clinic</p>
      <h2>The space you'll visit.</h2>
      <p class="dp-lede">Authentic photographs of the reception and treatment rooms will replace these panels.</p>
    </div></div>
    <div class="dp-grid dp-grid--2">
      <div>${img('interior-reception', { compact: false })}</div>
      <div>${img('interior-room')}</div>
    </div>
  </div>
</section>
${closingCta()}`,
  });

  // ------------------------------------------------------------- Team
  const specimenCard = () => `
<article class="dp-specimen dp-clinician" aria-label="Clinician card template">
  <span class="dp-specimen__tag">${pill('draft', 'Template, not a real clinician')}</span>
  ${img('team-portrait-*', { instance: 'clinician-slug', compact: true })}
  <div class="dp-clinician__body">
    <p class="dp-clinician__name">Clinician name</p>
    <p class="dp-clinician__role">Role · qualifications as registered</p>
    <span class="dp-field dp-field--mid" aria-hidden="true"></span>
    <span class="dp-field dp-field--short" aria-hidden="true"></span>
    <p class="dp-muted" style="font-size:.88rem;margin:14px 0 0">Focus areas · languages · clinic days</p>
  </div>
</article>`;

  list.push({
    path: '/team/', nav: 'team', approvedForProduction: true,
    crumbs: [{ label: 'Team', path: '/team/' }],
    title: 'Meet the Team',
    description: 'The dentists and team at Dr. Asif Niaz Arain & Associates Dental Professionals, Clifton, Karachi.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Our team</p>
  <h1>Who will treat you.</h1>
  <p class="dp-lede">Knowing who you'll see makes a visit easier. Each dentist's profile will show their registered name and qualifications, the care they focus on, and the days they're at the clinic.</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap">
    ${teamEmpty(undefined, 2)}
  </div>
</section>
<section class="dp-section dp-section--ivory">
  <div class="dp-wrap">
    <div class="dp-head"><div>
      <p class="dp-eyebrow">For review</p>
      <h2>How a profile will look.</h2>
      <p class="dp-lede">A layout template for the practice to review. No names, portraits or credentials are shown until each clinician has confirmed their details and consented to publication.</p>
    </div>
    <a class="dp-textlink" href="${url('/team/profile-template/')}">View the full profile template</a></div>
    <div class="dp-grid dp-grid--3">${specimenCard()}${specimenCard()}${specimenCard()}</div>
  </div>
</section>
${closingCta()}`,
  });

  list.push({
    path: '/team/profile-template/', nav: 'team', noindex: true,
    crumbs: [{ label: 'Team', path: '/team/' }, { label: 'Profile template', path: '/team/profile-template/' }],
    title: 'Clinician Profile Template',
    description: 'Layout template for an individual clinician profile. Not a real clinician.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p>${pill('draft', 'Template, not a real clinician')}</p>
  <h1>Clinician name, as registered</h1>
  <p class="dp-lede">Role at the practice · qualifications · PMDC registration number (verified against the PMDC register)</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap dp-split dp-split--top">
    <div style="max-width:440px;width:100%">${img('team-portrait-*', { instance: 'clinician-slug' })}</div>
    <div>
      <h2>About</h2>
      <p class="dp-muted">A short, first-person or third-person introduction written with the clinician: how they approach patients, what they enjoy about their work, and what patients can expect from them. Two or three paragraphs, in plain language.</p>
      <h3 style="margin-top:32px">At a glance</h3>
      <ul class="dp-list-lines">
        <li><span>Focus areas</span><span class="dp-muted">Confirmed treatments only</span></li>
        <li><span>Languages</span><span class="dp-muted">e.g. English, Urdu</span></li>
        <li><span>At the clinic</span><span class="dp-muted">Days and times</span></li>
        <li><span>Qualifications</span><span class="dp-muted">Degrees and institutions, as registered</span></li>
        <li><span>Registration</span><span class="dp-muted">PMDC number</span></li>
      </ul>
      <h3 style="margin-top:32px">Before publication</h3>
      <p class="dp-muted">The clinician reviews and approves the full text, confirms their registration details, and gives written consent for their portrait and profile.</p>
      <div class="dp-actions" style="margin-top:28px">${bookBtn('Request an appointment with this clinician')}</div>
    </div>
  </div>
</section>`,
  });

  // ------------------------------------------------------------- Care
  list.push({
    path: '/care/', nav: 'care', approvedForProduction: true,
    crumbs: [{ label: 'Care', path: '/care/' }],
    title: 'Care and Treatments',
    description: 'Dental care at Dr. Asif Niaz Arain & Associates, Clifton, Karachi. The treatment list is subject to clinic confirmation.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Care</p>
  <h1>Care, explained clearly.</h1>
  <p class="dp-lede">Proposed treatment categories for the practice to review. Each is ${pill('pending', ui.subjectToConfirmation)} and only the approved list will appear on the finished site.</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-note dp-note--sage" style="margin-block-end:48px"><p><strong>How treatment pages will work.</strong> Each confirmed treatment will have its own page explaining who it's for, what happens, how long it takes, recovery, alternatives and how fees are discussed, reviewed and signed off by a named clinician. <a href="${url('/care/checkups-and-cleaning/')}">See the template, using check-ups as the example.</a></p></div>
    ${careGroupsHtml()}
  </div>
</section>
<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-split">
    <div>${img('interior-room')}</div>
    <div>
      <p class="dp-eyebrow">Not sure what you need?</p>
      <h2>Start with a consultation.</h2>
      <p class="dp-lede">You don't need to know the name of a treatment to book. Tell us what's bothering you and your dentist will explain the options.</p>
      <div class="dp-actions">${bookBtn()}</div>
    </div>
  </div>
</section>`,
  });

  list.push({
    path: '/care/checkups-and-cleaning/', nav: 'care', noindex: true,
    crumbs: [{ label: 'Care', path: '/care/' }, { label: 'Check-ups and cleaning', path: '/care/checkups-and-cleaning/' }],
    title: 'Check-ups and Cleaning (Treatment Page Template)',
    description: 'Template treatment page using check-ups and cleaning as the example. Subject to clinic confirmation.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p>${pill('draft', 'Treatment page template')} ${pill('pending', ui.subjectToConfirmation)}</p>
  <h1>Check-ups and cleaning</h1>
  <p class="dp-lede">A regular look at your teeth, gums and mouth, so problems can be spotted early and you get advice that fits you.</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap dp-split dp-split--top">
    <div class="dp-article">
      <h2 style="margin-top:0">Who it's for</h2>
      <p>Adults and children, whether you're keeping on top of things or haven't been for a while.</p>
      <h2>What happens</h2>
      <ul>
        <li>A conversation about any concerns, your medical history and medicines.</li>
        <li>An examination of your teeth, gums, tongue and the soft tissues of your mouth.</li>
        <li>X-rays only when they're clinically useful. Your dentist will explain why.</li>
        <li>Professional cleaning where it's needed, and advice for cleaning at home.</li>
        <li>A recommended interval before your next check-up, based on your own oral health.</li>
      </ul>
      <h2>How long it takes</h2>
      <p>${pill('pending', ui.beingConfirmed)} Typical appointment length will be confirmed by the clinic.</p>
      <h2>Fees</h2>
      <p>${pill('pending', ui.beingConfirmed)} Fees will be explained before any treatment begins.</p>
      <h2>Related reading</h2>
      <p><a href="${url('/insights/how-often-dental-check-up/')}">How often should you have a dental check-up?</a></p>
      <div class="dp-note" style="margin-top:32px"><p><strong>Clinical review:</strong> pending. This page must be reviewed and approved by a named clinician, with a review date, before production.</p></div>
    </div>
    <div>
      ${img('service-*', { instance: 'checkups-and-cleaning' })}
      <div class="dp-card" style="margin-top:24px">
        <h3>Ready to book?</h3>
        <p class="dp-muted">Appointments open once the clinic confirms its booking process.</p>
        ${bookBtn()}
      </div>
    </div>
  </div>
</section>`,
  });

  // ------------------------------------------------------------- Your Visit
  list.push({
    path: '/your-visit/', nav: 'visit', approvedForProduction: true,
    crumbs: [{ label: 'Your Visit', path: '/your-visit/' }],
    title: 'Your First Visit',
    description: 'What to expect at your first visit to Dr. Asif Niaz Arain & Associates in Clifton, Karachi: how to prepare, what to ask, and answers to common questions.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap dp-split">
  <div>
    <p class="dp-eyebrow">Your visit</p>
    <h1>Your first visit, step by step.</h1>
    <p class="dp-lede">What happens from the moment you get in touch to the moment you leave, so there are no surprises.</p>
  </div>
  <div>${img('first-visit')}</div>
</div></header>

<section class="dp-section">
  <div class="dp-wrap dp-split dp-split--top">
    <div>
      <p class="dp-eyebrow">The journey</p>
      <h2>From request to consultation.</h2>
      <div class="dp-note" style="margin-block:22px 8px"><p><strong>A request is not a booking.</strong> When booking opens, sending a request tells the clinic when you'd prefer to come. Your appointment is confirmed only when the clinic contacts you with a date and time.</p></div>
    </div>
    ${visitSteps}
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-grid dp-grid--2">
    <div class="dp-card">
      <h2 style="font-size:1.9rem">How to prepare</h2>
      <ul>
        <li>A list of any medicines you take, including doses.</li>
        <li>Details of any allergies or medical conditions.</li>
        <li>Previous dental X-rays or treatment notes, if you have them.</li>
        <li>Your questions, written down so nothing is forgotten.</li>
        <li>For children: a parent or guardian should come along.</li>
      </ul>
      <p class="dp-muted" style="font-size:.92rem">Please bring this information with you. Don't send it through this website.</p>
    </div>
    <div class="dp-card">
      <h2 style="font-size:1.9rem">Questions you can ask</h2>
      <ul>
        <li>What did you find, and how urgent is it?</li>
        <li>What are my options, including waiting?</li>
        <li>What does each option involve, and how many visits?</li>
        <li>What will it cost in total? Can I have that in writing?</li>
        <li>What happens if I decide not to go ahead?</li>
      </ul>
    </div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-head"><div>
      <p class="dp-eyebrow">Practical details</p>
      <h2>Fees, access and languages.</h2>
      <p class="dp-lede">These details are being confirmed with the practice.</p>
    </div></div>
    <ul class="dp-list-lines">
      <li><span>Consultation fee</span>${factText('fees_and_payment')}</li>
      <li><span>Payment methods</span>${factText('fees_and_payment')}</li>
      <li><span>Insurance and corporate panels</span>${factText('insurance_and_panels')}</li>
      <li><span>Languages spoken</span>${factText('languages')}</li>
      <li><span>Step-free access and parking</span>${factText('accessibility_and_parking')}</li>
      <li><span>Appointment length and waiting times</span>${pill('pending', ui.beingConfirmed)}</li>
      <li><span>Urgent appointments</span>${factText('urgent_care_policy')}</li>
    </ul>
  </div>
</section>

<section class="dp-section dp-section--ivory" id="faqs">
  <div class="dp-wrap dp-narrow">
    <p class="dp-eyebrow">Questions and answers</p>
    <h2>Before you come in.</h2>
    <div class="dp-faq" style="margin-top:28px">
      ${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><div><p>${esc(a)}</p></div></details>`).join('')}
    </div>
  </div>
</section>
${closingCta()}`,
  });

  // ------------------------------------------------------------- Contact
  const channel = (title, desc, inactiveLabel) => `<div class="dp-channel"><div><h3>${title}</h3><p>${desc}</p></div><span class="dp-channel__inactive" aria-label="${esc(title)}: ${esc(inactiveLabel)}">${esc(inactiveLabel)}</span></div>`;
  list.push({
    path: '/contact/', nav: 'contact', approvedForProduction: true,
    crumbs: [{ label: 'Contact', path: '/contact/' }],
    title: 'Contact and Find Us',
    description: 'Find Dr. Asif Niaz Arain & Associates Dental Professionals in Clifton, Karachi. Contact details and appointments are being confirmed.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Contact</p>
  <h1>Find us in Clifton.</h1>
  <p class="dp-lede">${loc}. The exact address, phone number, WhatsApp and opening hours are being confirmed with the practice and will be activated here once verified.</p>
</div></header>

<section class="dp-section">
  <div class="dp-wrap dp-split dp-split--top">
    <div>
      <h2 id="appointments" style="scroll-margin-top:120px">Appointments</h2>
      <div class="dp-note" style="margin-block:12px 28px"><p><strong>Booking isn't open on this preview yet.</strong> No form on this site collects appointment requests or medical information. When the clinic's booking channel is confirmed, you'll be able to request a time here, and the clinic will contact you to confirm it.</p></div>
      <div>
        ${channel('Telephone', 'Call the front desk to book or ask a question.', ui.beingConfirmed)}
        ${channel('WhatsApp', 'Message the clinic about appointments. Please don\'t send photos or medical details.', ui.beingConfirmed)}
        ${channel('Directions', 'Open the clinic\'s location in your maps app.', 'After address is verified')}
        ${channel('Opening hours', 'Regular hours, Friday timings and holidays.', ui.beingConfirmed)}
      </div>
      <div class="dp-actions" style="margin-top:32px">${bookBtn()}</div>
      <div class="dp-urgent" role="note" style="margin-top:32px"><p style="margin:0"><strong>In an emergency:</strong> if you have dental pain with facial or neck swelling, or difficulty breathing or swallowing, seek emergency medical care straight away.</p></div>
    </div>
    <div>
      ${img('location-exterior')}
      <div style="margin-top:24px">${img('location-map', { compact: true })}</div>
      <ul class="dp-list-lines" style="margin-top:28px">
        <li><span>Area</span>${loc}</li>
        <li><span>Street address</span>${factText('address_full')}</li>
        <li><span>Parking</span>${factText('accessibility_and_parking')}</li>
      </ul>
    </div>
  </div>
</section>`,
  });

  // ------------------------------------------------------------- Insights
  list.push({
    path: '/insights/', nav: 'insights', approvedForProduction: true,
    crumbs: [{ label: 'Insights', path: '/insights/' }],
    title: 'Dental Guides',
    description: 'Plain-language answers to common dental questions, prepared from authoritative health sources and reviewed by the practice\'s clinicians.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Insights</p>
  <h1>Clear answers to real questions.</h1>
  <p class="dp-lede">Short guides to the questions patients ask most. Each is drafted from authoritative health sources and must be reviewed by a named clinician before it's published.</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-grid dp-grid--3">
      ${articles.map((a) => `<article class="dp-card dp-card--link">
        <div class="dp-card__meta">${pill('draft', 'Draft · awaiting clinician review')}</div>
        <p class="dp-muted" style="font-size:.9rem;font-style:italic;margin-bottom:.6em">“${esc(a.question)}”</p>
        <h2 style="font-size:1.6rem"><a href="${url(`/insights/${a.slug}/`)}">${esc(a.title)}</a></h2>
        <p class="dp-muted">${esc(a.description)}</p>
        <p style="margin:0;font-size:.88rem" class="dp-muted">${a.readMinutes} minute read</p>
      </article>`).join('')}
    </div>
  </div>
</section>`,
  });

  for (const a of articles) {
    list.push({
      path: `/insights/${a.slug}/`, nav: 'insights', ogType: 'article',
      crumbs: [{ label: 'Insights', path: '/insights/' }, { label: a.title, path: `/insights/${a.slug}/` }],
      title: a.title, description: a.description,
      body: () => `
<header class="dp-pagehead"><div class="dp-wrap dp-narrow">
  <p class="dp-eyebrow">Dental guide</p>
  <h1 style="font-size:clamp(2.1rem,4.5vw,3.2rem)">${esc(a.title)}</h1>
  <p class="dp-lede">${esc(a.description)}</p>
  <div class="dp-article-meta">
    ${pill('draft', 'Draft · awaiting clinician review')}
    <span>Clinical reviewer: to be named</span>
    <span>Sources checked 26 September 2026</span>
  </div>
</div></header>
<section class="dp-section">
  <div class="dp-wrap dp-narrow dp-article">
    ${a.body}
    <hr class="dp-rule" style="margin-block:48px 28px">
    <h2 style="font-size:1.4rem;margin-top:0">Sources</h2>
    <ul class="dp-sources">${a.sources.map(([t, u]) => `<li><a href="${esc(u)}" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>
    <div class="dp-note" style="margin-top:28px"><p><strong>General information, not a diagnosis.</strong> This guide can't take your individual circumstances into account. Please speak to a dentist about your own situation.</p></div>
  </div>
</section>`,
    });
  }

  // ------------------------------------------------------------- Notice
  list.push({
    path: '/notice/', nav: null,
    crumbs: [{ label: 'About this preview', path: '/notice/' }],
    title: 'About This Preview: Privacy, Terms and Medical Information',
    description: 'Privacy, terms and medical-information notice for the concept preview of the Dr. Asif Niaz Arain & Associates website.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap dp-narrow">
  <p class="dp-eyebrow">About this preview</p>
  <h1 style="font-size:clamp(2.1rem,4.5vw,3.2rem)">A concept, shared for review.</h1>
  <p class="dp-lede">This website is a concept preview of a future website for Dr. Asif Niaz Arain &amp; Associates Dental Professionals. It is hosted temporarily on qiyadon.com by Qiyadon so the practice can review it. It is not yet the clinic's official website.</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap dp-narrow dp-article">
    <h2 id="privacy" style="margin-top:0">Preview privacy notice</h2>
    <ul>
      <li>This preview has <strong>no forms</strong> and does not collect names, contact details, symptoms, medical history, prescriptions or payment details.</li>
      <li>The appointment buttons open an information message only. Nothing is sent anywhere.</li>
      <li>The preview pages load no analytics, advertising or tracking scripts, and set no cookies of their own. Fonts are loaded from Google Fonts, which receives standard request information such as your IP address.</li>
      <li>Like any website, the hosting provider (Cloudflare) processes basic technical request data to deliver and protect the site.</li>
    </ul>
    <h2 id="terms">Preview terms</h2>
    <ul>
      <li>All clinic details shown are provisional and are being confirmed with the practice. Items marked "being confirmed" or "subject to clinic confirmation" should not be relied on.</li>
      <li>Placeholder panels show where the practice's own photographs will go. No image on this preview shows a real clinician or patient.</li>
      <li>Qiyadon's own commercial terms do not apply to dental care, and nothing on this preview forms an agreement for dental treatment.</li>
      <li>Separate privacy and patient-information policies will be prepared for the clinic's own website and reviewed by the clinic and its legal adviser before launch.</li>
    </ul>
    <h2 id="medical">Medical information notice</h2>
    <p>The guides on this preview are general information drafted from public health sources. They have not yet been reviewed by the practice's clinicians and are not a substitute for an examination or personal advice from a dentist.</p>
    <p><strong>Please don't send medical details through this website</strong>, and don't delay seeking care because of anything you read here.</p>
    <div class="dp-urgent" role="note"><p style="margin:0"><strong>In an emergency:</strong> if you have dental pain with facial or neck swelling, or difficulty breathing or swallowing, seek emergency medical care straight away.</p></div>
    <h2>In memory</h2>
    ${legacyNote}
  </div>
</section>`,
  });

  // ------------------------------------------------------------- 404
  list.push({
    path: '/404', file: '404.html', nav: null, noindex: true,
    title: 'Page Not Found',
    description: 'This page could not be found.',
    body: () => `
<section class="dp-section">
  <div class="dp-wrap dp-narrow" style="text-align:center">
    <p class="dp-eyebrow" style="justify-content:center">Page not found</p>
    <h1 style="margin-inline:auto">We couldn't find that page.</h1>
    <p class="dp-lede" style="margin-inline:auto">The link may be out of date, or the page may not have been added yet while the clinic's details are being confirmed.</p>
    <div class="dp-actions" style="justify-content:center;margin-top:28px">
      <a class="dp-btn" href="${url('/')}">Go to the home page</a>
      <a class="dp-btn dp-btn--ghost" href="${url('/contact/')}">Contact and directions</a>
    </div>
    <ul class="dp-list-clean" style="margin-top:40px;display:flex;flex-wrap:wrap;gap:10px 24px;justify-content:center">
      ${en.nav.filter((n) => n.key !== 'home').map((n) => `<li><a href="${url(n.path)}">${esc(n.label)}</a></li>`).join('')}
    </ul>
  </div>
</section>`,
  });

  return list;
}
