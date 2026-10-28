// Page definitions. `path` is relative to the site root (the build prefixes
// /dental-preview in preview mode). `approvedForProduction` controls the
// production sitemap; flip it only after the page's facts are approved.
// Copy that carries a verification state lives in content/*.mjs.

export function pages(h, c) {
  const { url, img, pill, bookBtn, factText, fact, esc, ui } = h;
  const { articles, faqs, care, team, sources, CHECKED } = c;
  const { carePages, careGroups, concerns, redFlags } = care;
  const careBySlug = Object.fromEntries(carePages.map((p) => [p.slug, p]));
  const articleBySlug = Object.fromEntries(articles.map((a) => [a.slug, a]));

  // ------------------------------------------------------------- helpers
  const careUrl = (slug, anchor) => url(`/care/${slug}/`) + (anchor ? `#${anchor}` : '');
  const guideUrl = (slug) => url(`/insights/${slug}/`);
  const fmtDate = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const links = (html) => html.replace(/\{\{(care|guide):([a-z0-9-]+)\}\}/g, (_, k, s) => (k === 'care' ? careUrl(s) : guideUrl(s)));
  const statusPills = () => `${pill('pending', ui.availabilityTbc)} ${pill('draft', ui.clinicalReviewPending)}`;
  const illustrativeNote = (extra = '') => `<div class="dp-note dp-note--sage dp-page-notice"><p><strong>${esc(ui.illustrativeNotice)}</strong>${extra ? ` ${extra}` : ''}</p></div>`;

  const sourcesList = (ids) => `<ul class="dp-sources">${ids.map((id) => {
    const s = sources[id];
    const reviewed = s.reviewed ? `page last reviewed ${fmtDate(s.reviewed)}` : 'no review date shown on the page';
    return `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.publisher)}: ${esc(s.title)}</a> <span class="dp-muted">(${reviewed}; checked ${fmtDate(CHECKED)})</span></li>`;
  }).join('')}</ul>`;

  // A light "next steps" strip replaces the old dark appointment banner, so
  // pages don't end on a call to book when booking isn't open.
  const nextSteps = (exclude = '') => {
    const items = [
      ['/your-visit/', 'Plan your visit'],
      ['/care/', 'Explore care topics'],
      ['/contact/', 'Contact information'],
    ].filter(([p]) => p !== exclude);
    return `
<section class="dp-section dp-section--ivory dp-section--tight">
  <div class="dp-wrap dp-next">
    <p class="dp-eyebrow" style="margin:0">Next steps</p>
    <ul class="dp-next__links">${items.map(([p, l]) => `<li><a class="dp-textlink" href="${url(p)}">${esc(l)}</a></li>`).join('')}</ul>
  </div>
</section>`;
  };

  const legacyNote = `<p class="dp-muted" style="font-size:.95rem">Dr. Asif Niaz Arain died on 9 March 2024. The practice bears his name. He is not available for appointments.</p>`;

  const redFlagBox = (compact = false) => `<div class="dp-urgent dp-redflags" role="note">
  <p class="dp-redflags__title"><strong>${esc(redFlags.heading)}</strong></p>
  <ul>${redFlags.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
  ${compact ? '' : '<p class="dp-redflags__foot">Don’t wait for a dental appointment, and don’t rely on this website to arrange care.</p>'}
</div>`;

  // Sample clinician card. The fictional label is visible on the card itself.
  const sampleCard = (s, { headingLevel = 3 } = {}) => `
<article class="dp-sample" aria-labelledby="card-${s.slug}">
  <p class="dp-sample__flag">${esc(team.fictionalLabel)}</p>
  ${img(s.slot, { compact: true, sizes: '(max-width: 640px) calc(100vw - 32px), (max-width: 980px) 46vw, 360px' })}
  <div class="dp-sample__body">
    <h${headingLevel} class="dp-sample__name" id="card-${s.slug}">${esc(s.name)}</h${headingLevel}>
    <p class="dp-sample__role">${esc(s.role)}</p>
    <p class="dp-muted dp-sample__teaser">${esc(s.teaser)}</p>
    <p style="margin:0"><a class="dp-textlink" href="${url(`/team/${s.slug}/`)}">View the sample profile<span class="dp-visually-hidden"> for ${esc(s.name)}, a fictional example</span></a></p>
  </div>
</article>`;

  const visitSteps = [
    { t: 'Getting in touch', d: 'Once the clinic’s phone, WhatsApp or request channel is confirmed, you would contact the practice and say briefly what you’d like help with. Medical details would be discussed with the clinic directly, never through this website.' },
    { t: 'Confirming a time', d: 'The clinic would confirm a date and time with you. The proposal is that you are told who you will see, roughly how long to allow, and anything to bring.' },
    { t: 'Arriving and settling in', d: 'A short welcome at reception. How your medical history is collected and kept would follow the clinic’s own confirmed process. If you feel anxious, this is a good moment to say so.' },
    { t: 'A conversation, then an examination', d: 'The visit starts with what brought you in and what matters to you. The dentist then examines your teeth, gums and mouth, with X-rays only where they judge them clinically useful, and explains each step before it happens.' },
    { t: 'Findings, options and your decision', d: 'The dentist explains what they found and the realistic options, including doing nothing. You can ask what each involves and costs, ask for an estimate, and take time to think before agreeing to any treatment.' },
  ];
  const stepsHtml = (label = ui.sampleWorkflow) => `
<div class="dp-visit-steps">
  <p style="margin:0 0 14px">${pill('draft', label)}</p>
  <ol class="dp-steps" aria-label="Proposed first-visit journey, for clinic review">
    ${visitSteps.map((s) => `<li><div><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div></li>`).join('')}
  </ol>
</div>`;

  const list = [];

  // ================================================================ HOME
  const homeTopics = ['checkups-and-cleaning', 'gum-care', 'fillings-and-crowns', 'urgent-dental-concerns'];
  list.push({
    path: '/', nav: 'home', approvedForProduction: true,
    title: 'Dr. Asif Niaz Arain & Associates Dental Professionals',
    description: 'A concept preview of the website for Dr. Asif Niaz Arain & Associates Dental Professionals. Clinic details, treatments and appointments are awaiting confirmation by the practice.',
    body: () => `
<section class="dp-hero">
  <div class="dp-wrap dp-hero__grid">
    <div>
      <p class="dp-eyebrow">Dental Professionals</p>
      <h1>Care begins with a conversation.</h1>
      <p class="dp-lede">Time to talk about what brought you in, clear explanations of what the dentist finds, and decisions you make together.</p>
      <p class="dp-hero__qualifier">${pill('draft', ui.conceptCopy)}</p>
      <div class="dp-actions">
        <a class="dp-btn" href="${url('/your-visit/')}">Plan your visit</a>
        <a class="dp-btn dp-btn--ghost" href="${url('/care/')}">Explore care</a>
      </div>
    </div>
    <div class="dp-hero__media">${img('hero-clinic', { eager: true })}</div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-head">
      <div>
        <p class="dp-eyebrow">The approach</p>
        <h2>Listening, explaining, deciding together.</h2>
        <p class="dp-lede">The approach proposed for the practice, for the family and clinical team to shape before it describes how the practice works.</p>
      </div>
    </div>
    <div class="dp-grid dp-grid--3">
      <article class="dp-card dp-card--quiet"><span class="dp-card__num">i.</span><h3>Listen first</h3><p class="dp-muted">A visit that begins with what you want to talk about, whether that's a specific worry or simply a check-up.</p></article>
      <article class="dp-card dp-card--quiet"><span class="dp-card__num">ii.</span><h3>Explain the options</h3><p class="dp-muted">What the dentist found, the realistic options and what each involves and costs, in everyday language.</p></article>
      <article class="dp-card dp-card--quiet"><span class="dp-card__num">iii.</span><h3>Decide together</h3><p class="dp-muted">Time for questions, and no treatment until you have agreed to it.</p></article>
    </div>
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap">
    <div class="dp-head">
      <div>
        <p class="dp-eyebrow">Common topics</p>
        <h2>Understand your options.</h2>
        <p class="dp-lede">Plain-language explanations of common dental care. Which treatments the practice offers is awaiting confirmation.</p>
      </div>
      <a class="dp-textlink" href="${url('/care/')}">See all nine topics</a>
    </div>
    <ul class="dp-topic-grid dp-topic-grid--4">
      ${homeTopics.map((slug) => careBySlug[slug]).map((p) => `<li><a class="dp-topic" href="${careUrl(p.slug)}"><span class="dp-topic__name">${esc(p.title)}</span><span class="dp-topic__text">${esc(p.summary)}</span></a></li>`).join('')}
    </ul>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap dp-split">
    <div>${img('interior-reception')}</div>
    <div>
      <p class="dp-eyebrow">Your first visit</p>
      <h2>Know what to expect.</h2>
      <p class="dp-lede">A first visit as proposed for the practice: a conversation, a careful examination, then a clear explanation of your options.</p>
      <p>The full journey, what to bring and answers to common questions are on Your Visit.</p>
      <p><a class="dp-textlink" href="${url('/your-visit/')}">Plan your visit</a></p>
    </div>
  </div>
</section>

<section class="dp-section dp-section--ivory dp-section--tight">
  <div class="dp-wrap dp-teaser">
    <div>
      <p class="dp-eyebrow">The team</p>
      <p class="dp-teaser__text">Verified profiles of the practice's clinicians will be published once they are confirmed. Until then, the team page shows its layout using clearly labelled fictional examples.</p>
    </div>
    <a class="dp-textlink" href="${url('/team/')}">Preview the team page</a>
  </div>
</section>

<section class="dp-section dp-section--tight">
  <div class="dp-wrap dp-next">
    <p class="dp-eyebrow" style="margin:0">Next steps</p>
    <ul class="dp-next__links">
      <li><a class="dp-textlink" href="${url('/your-visit/')}">Plan your visit</a></li>
      <li><a class="dp-textlink" href="${url('/contact/')}">Contact information</a></li>
    </ul>
  </div>
</section>`,
  });

  // ================================================================ ABOUT (/our-practice/)
  list.push({
    path: '/our-practice/', nav: 'practice', approvedForProduction: true,
    crumbs: [{ label: 'About', path: '/our-practice/' }],
    title: 'About the Practice',
    description: 'About Dr. Asif Niaz Arain & Associates Dental Professionals: the approach to care proposed for the practice, and a remembrance of Dr. Asif Niaz Arain for his family to review.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">About the practice</p>
  <h1>Dr. Asif Niaz Arain &amp; Associates</h1>
  <p class="dp-lede">Dr. Asif Niaz Arain &amp; Associates Dental Professionals bears the name of Dr. Asif Niaz Arain. This page introduces the approach to care proposed for the practice, and remembers Dr. Arain.</p>
</div></header>

<section class="dp-section">
  <div class="dp-wrap dp-split dp-split--top">
    <div>
      <p class="dp-eyebrow">Our approach</p>
      <h2>How the practice could describe its care.</h2>
      <p>${pill('draft', ui.conceptCopy)}</p>
      <p class="dp-muted">Proposed wording for the family and clinical team to approve, adapt or replace before it describes how the practice works.</p>
    </div>
    <div class="dp-prose dp-principles">
      <h3>Listening first</h3>
      <p>Every visit begins with the patient's own account: what they have noticed, what worries them, and what they hope for. Time spent listening shapes everything that follows.</p>
      <h3>Clear explanations</h3>
      <p>Findings are explained in everyday language, with the chance to see what the dentist sees. Clinical terms are used only when they help, and always explained.</p>
      <h3>Informed decisions</h3>
      <p>Patients hear the realistic options, including doing nothing, with what each involves and what it costs. Decisions are theirs to make, in their own time where the situation allows.</p>
      <h3>Continuity</h3>
      <p>Good dental care is a long conversation, not a single appointment. Follow-up is planned sensibly, and prevention matters as much as treatment.</p>
    </div>
  </div>
</section>

<section class="dp-section dp-section--ivory" id="remembering">
  <div class="dp-wrap dp-split dp-split--top">
    <div style="max-width:440px;width:100%">${img('namesake-portrait')}</div>
    <div>
      <p class="dp-eyebrow">In memory</p>
      <h2>Remembering Dr. Asif Niaz Arain</h2>
      <p class="dp-lede">The practice bears the name of Dr. Asif Niaz Arain, who died on 9 March 2024. He is not available for appointments.</p>
      <p>A tribute to Dr. Arain will appear here once his family has reviewed and approved it. His portrait will be shown only with the family's approval.</p>
      <div class="dp-note" style="margin-block:28px 0">
        <p style="margin-bottom:.6em">${pill('draft', ui.draftForReview)}</p>
        <p style="margin-bottom:.6em">Public reporting at the time of his death (<a href="https://www.dentalnews.pk/12-Mar-2024/renowned-dentist-dr-asif-niaz-arain-is-no-more" rel="noopener">Dental News</a>, article dated 10 March 2024) described Dr. Arain as:</p>
        <ul style="margin-bottom:.8em">${fact('founder_biography').value.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <p>That reporting concerns Dr. Arain's professional life. It does not describe how this practice began or who has led it since, and this page makes no such claims. These points are shown so the family can confirm, correct or replace them.</p>
      </div>
    </div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-head"><div>
      <p class="dp-eyebrow">The clinic</p>
      <h2>Picturing the practice.</h2>
      <p class="dp-lede">Illustrations of an imagined clinic, shown until authentic photographs of the practice are supplied.</p>
    </div></div>
    <div class="dp-grid dp-grid--2">
      <div>${img('interior-reception')}</div>
      <div>${img('interior-room')}</div>
    </div>
    <p class="dp-muted" style="margin-top:32px;max-width:44em">Introductions to the practice's clinicians, photographs of the practice and practical details will be added here once the practice has confirmed them.</p>
  </div>
</section>
${nextSteps()}`,
  });

  // ================================================================ TEAM
  const verificationPanel = () => `
<aside class="dp-verify" aria-labelledby="verify-title">
  <h2 id="verify-title" class="dp-verify__title">How this profile would work</h2>
  <p class="dp-muted">A real profile is published only when each field below has been verified and the clinician has approved the text. For this fictional example, none is filled in.</p>
  <dl class="dp-verify__list">
    ${team.verificationFields.map(([k, d]) => `<div><dt>${esc(k)}</dt><dd><span class="dp-verify__state">${esc(ui.awaitingVerification)}</span><span class="dp-verify__hint">${esc(d)}</span></dd></div>`).join('')}
  </dl>
</aside>`;

  list.push({
    path: '/team/', nav: 'team', approvedForProduction: true,
    crumbs: [{ label: 'Team', path: '/team/' }],
    title: 'Team Page Preview',
    description: 'A layout preview of the team page, using three fictional examples. The practice’s real clinicians, credentials and photographs are awaiting verification.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Team</p>
  <h1>A preview of the team page.</h1>
  <p class="dp-lede">Real clinician names, credentials, roles, photographs and biographies are awaiting verification. Until they are confirmed, this page shows its layout using three fictional examples.</p>
</div></header>

<section class="dp-section dp-section--tight">
  <div class="dp-wrap">
    <div class="dp-disclosure" role="note">
      <p class="dp-disclosure__label">Fictional layout examples</p>
      <p class="dp-disclosure__text">${esc(team.teamDisclosure)}</p>
      <p class="dp-disclosure__status"><strong>Current team status:</strong> ${esc(team.teamStatus)}</p>
    </div>
  </div>
</section>

<section class="dp-section" style="padding-block-start:0">
  <div class="dp-wrap">
    <h2 class="dp-visually-hidden">Fictional example profiles</h2>
    <div class="dp-grid dp-grid--3">${team.sampleClinicians.map((s) => sampleCard(s)).join('')}</div>
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-split dp-split--top">
    <div>
      <p class="dp-eyebrow">Before a real profile appears</p>
      <h2>What will be verified for every clinician.</h2>
      <p class="dp-muted">Each real profile will be checked against the PMDC register and approved by the clinician before publication. Portraits will be authentic photographs, used with written consent.</p>
    </div>
    <ul class="dp-feature-list">
      ${team.verificationFields.map(([k, d]) => `<li><strong>${esc(k)}.</strong> ${esc(d)}.</li>`).join('')}
    </ul>
  </div>
</section>
${nextSteps()}`,
  });

  for (const s of team.sampleClinicians) {
    const others = team.sampleClinicians.filter((o) => o.slug !== s.slug);
    list.push({
      path: `/team/${s.slug}/`, nav: 'team', noindex: true,
      crumbs: [{ label: 'Team', path: '/team/' }, { label: `${s.name} (fictional example)`, path: `/team/${s.slug}/` }],
      title: `${s.name}: Fictional Sample Profile`,
      description: `A fictional example profile (${s.role.toLowerCase()}) showing how a clinician could be presented. This person does not work at the practice.`,
      body: () => `
<header class="dp-pagehead dp-pagehead--profile"><div class="dp-wrap">
  <p class="dp-sample__flag dp-sample__flag--inline">${esc(team.fictionalLabel)}</p>
  <h1>${esc(s.name)}</h1>
  <p class="dp-lede">${esc(s.role)}. An invented person and an AI-generated portrait, created to show how a real clinician's profile could be presented.</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap dp-profile">
    <div class="dp-profile__media">
      ${img(s.slot, { eager: true, sizes: '(max-width: 820px) calc(100vw - 32px), 420px' })}
      <p class="dp-figcaption">AI-generated portrait of a fictional sample clinician. Not a photograph of anyone at the practice.</p>
    </div>
    <div class="dp-profile__body">
      <p class="dp-profile__intro">${esc(s.intro)}</p>
      <h2>Sample biography</h2>
      <p>${pill('draft', 'Hypothetical copy')}</p>
      ${s.bio.map((p) => `<p>${esc(p)}</p>`).join('')}
      <h2>Example emphasis</h2>
      <p class="dp-muted">Illustrative editorial themes for this sample, not qualifications or services.</p>
      <ul class="dp-checklist">${s.emphasis.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
      <p>Related care topics: ${s.related.map((r) => `<a href="${careUrl(r)}">${esc(careBySlug[r].title)}</a>`).join(', ')}.</p>
      ${verificationPanel()}
      <div class="dp-card dp-profile__book">
        <h2 class="dp-profile__book-title">Appointments</h2>
        <p class="dp-muted">This is a fictional example, so no appointment can be made with this person. Bookings are not available on this preview for anyone.</p>
        ${bookBtn(ui.appointmentPreview, 'dp-btn dp-btn--ghost')}
      </div>
      <p class="dp-muted" style="margin-top:28px">Other fictional examples: ${others.map((o) => `<a href="${url(`/team/${o.slug}/`)}">${esc(o.name)}</a>`).join(' · ')}</p>
    </div>
  </div>
</section>`,
    });
  }

  // The generic template this page used to link to; kept so old links work.
  list.push({
    path: '/team/profile-template/', redirectTo: '/team/', nav: 'team', noindex: true,
    title: 'Team profiles', description: 'This page has moved to the Team page.',
  });

  // ================================================================ CARE
  list.push({
    path: '/care/', nav: 'care', approvedForProduction: true,
    crumbs: [{ label: 'Care', path: '/care/' }],
    title: 'Care',
    description: 'Plain-language explanations of dental care, from check-ups to replacing a missing tooth. Illustrative content; service availability has not been confirmed by the practice.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Care</p>
  <h1>Care, explained clearly.</h1>
  <p class="dp-lede">What common dental care involves, what a dentist looks at first, and the questions worth asking. These are educational explanations, not a list of services confirmed at this practice.</p>
</div></header>
<section class="dp-section dp-section--tight">
  <div class="dp-wrap">${illustrativeNote('Each topic below is also awaiting review by a named local clinician.')}</div>
</section>

<section class="dp-section" style="padding-block-start:0">
  <div class="dp-wrap dp-split dp-split--top">
    <div>
      <p class="dp-eyebrow">From assessment to a plan</p>
      <h2>Every plan starts with an assessment.</h2>
    </div>
    <div class="dp-prose">
      <p>The same symptom can have different causes, and the same treatment isn't right for everyone. That is why dental care starts with an assessment: a conversation about what you have noticed and your general health, an examination, and sometimes X-rays.</p>
      <p>From there a dentist can explain what is happening, which options are realistic for you, and what each involves. The topics below describe those options in general terms. A clinician decides what is suitable in an individual case, and individual costs and appointment schedules can only be discussed once the practice's details are confirmed.</p>
    </div>
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap">
    <div class="dp-head"><div>
      <p class="dp-eyebrow">Start with a concern</p>
      <h2>What brings you here?</h2>
    </div></div>
    <ul class="dp-concerns">
      ${concerns.map((q) => `<li><a href="${careUrl(q.to, q.anchor)}"><span>${esc(q.q)}</span></a></li>`).join('')}
    </ul>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap">
    ${careGroups.map((g) => `
    <div class="dp-care-group">
      <h2 class="dp-care-group__title">${esc(g.name)}</h2>
      <div class="dp-care-group__list">
        ${g.pages.map((slug) => { const p = careBySlug[slug]; return p.topics.map((t) => `
        <article class="dp-card dp-card--link dp-care-card">
          <h3><a href="${careUrl(p.slug, p.topics.length > 1 ? t.id : '')}">${esc(t.name)}</a></h3>
          <p class="dp-muted">${esc(p.topics.length > 1 ? (t.short || firstSentence(stripTags(t.whatItIs))) : p.summary)}</p>
          <p class="dp-care-card__meta">${esc(ui.availabilityTbc)}</p>
        </article>`).join(''); }).join('')}
      </div>
    </div>`).join('')}
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-split">
    <div>${img('interior-room')}</div>
    <div>
      <p class="dp-eyebrow">Not sure which topic fits?</p>
      <h2>An assessment comes first.</h2>
      <p class="dp-lede">You don't need to know the name of a treatment. A dentist can assess what's bothering you and explain the options. Appointment details will be published once the practice confirms them.</p>
      <div class="dp-actions"><a class="dp-btn dp-btn--ghost" href="${url('/your-visit/')}">What to expect at a first visit</a></div>
    </div>
  </div>
</section>`,
  });

  const topicSections = (t, multi) => {
    const H = multi ? 'h3' : 'h2';
    const sec = (title, html) => html ? `<${H}>${title}</${H}>${html}` : '';
    return `
    ${sec('What it is', t.whatItIs)}
    ${sec('Why people ask about it', t.why)}
    ${t.triage ? `<${H}>What to do</${H}>${t.triage.map((x) => `<div class="dp-triage" id="${x.id}"><h${multi ? 4 : 3} class="dp-triage__title">${esc(x.title)}</h${multi ? 4 : 3}>${x.html}</div>`).join('')}` : ''}
    ${sec('What assessment may involve', t.assessment)}
    ${sec('Common approaches and alternatives', t.approaches)}
    ${t.extra ? sec(esc(t.extra.heading), t.extra.html) : ''}
    <${H}>Questions to ask a clinician</${H}>
    <ul class="dp-checklist">${t.ask.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
    <div class="dp-note dp-important"><p><strong>Important to know.</strong> ${esc(t.limitation)}</p></div>`;
  };

  for (const p of carePages) {
    const multi = p.topics.length > 1;
    list.push({
      path: `/care/${p.slug}/`, nav: 'care', approvedForProduction: false,
      crumbs: [{ label: 'Care', path: '/care/' }, { label: p.title, path: `/care/${p.slug}/` }],
      title: p.title,
      description: `${p.summary} Illustrative content; availability not confirmed by the practice.`,
      body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Care</p>
  <h1>${esc(p.title)}</h1>
  <p class="dp-lede">${esc(p.summary)}</p>
  <p class="dp-status-row">${statusPills()}</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap dp-care-layout">
    <div class="dp-article dp-care-main">
      ${illustrativeNote('This page does not describe a treatment as available at the practice. A clinician decides what is suitable for each person, and individual costs and appointment schedules are not yet known.')}
      ${p.redFlags ? redFlagBox() : ''}
      ${p.intro || ''}
      ${multi ? `<nav class="dp-onpage" aria-label="On this page"><p class="dp-onpage__title">On this page</p><ul>${p.topics.map((t) => `<li><a href="#${t.id}">${esc(t.name)}</a></li>`).join('')}${p.comparison ? `<li><a href="#${p.comparison.id}">${esc(p.comparison.heading)}</a></li>` : ''}</ul></nav>` : ''}
      ${p.topics.map((t) => multi
        ? `<section class="dp-topic-section" id="${t.id}" aria-labelledby="h-${t.id}"><h2 id="h-${t.id}">${esc(t.name)}</h2>${topicSections(t, true)}</section>`
        : `<div id="${t.id}">${topicSections(t, false)}</div>`).join('')}
      ${p.comparison ? `
      <section class="dp-topic-section" id="${p.comparison.id}" aria-labelledby="h-${p.comparison.id}">
        <h2 id="h-${p.comparison.id}">${esc(p.comparison.heading)}</h2>
        ${p.comparison.intro}
        <div class="dp-compare">
          ${p.comparison.rows.map((r) => `<div class="dp-compare__row" id="${r.id}">
            <h3 class="dp-compare__name">${esc(r.name)}</h3>
            <dl>
              <div><dt>What it is</dt><dd>${esc(r.what)}</dd></div>
              <div><dt>What it usually involves</dt><dd>${esc(r.involves)}</dd></div>
              <div><dt>Worth discussing</dt><dd>${esc(r.discuss)}</dd></div>
            </dl>
          </div>`).join('')}
        </div>
        ${p.comparison.after}
      </section>` : ''}
      <hr class="dp-rule" style="margin-block:48px 28px">
      <h2 class="dp-sources__title">Sources and review</h2>
      <p class="dp-muted" style="font-size:.95rem">Drafted from the sources below, which describe UK and US practice. <strong>Clinical review pending:</strong> a named clinician must review this page, including how the guidance applies under local requirements and practice, before it can appear on the clinic's official website.</p>
      ${sourcesList(p.sources)}
    </div>
    <aside class="dp-care-aside" aria-label="Related">
      ${p.guides.length ? `<div class="dp-aside-block"><p class="dp-aside-block__title">Related guides</p><ul>${p.guides.map((g) => `<li><a href="${guideUrl(g)}">${esc(articleBySlug[g].title)}</a></li>`).join('')}</ul></div>` : ''}
      <div class="dp-aside-block"><p class="dp-aside-block__title">Related care topics</p><ul>${p.related.map((r) => `<li><a href="${careUrl(r)}">${esc(careBySlug[r].title)}</a></li>`).join('')}</ul></div>
      <div class="dp-aside-block dp-aside-block--card"><p class="dp-aside-block__title">Appointments</p><p class="dp-muted">Appointments aren't available through this preview.</p>${bookBtn(ui.appointmentPreview, 'dp-btn dp-btn--ghost dp-btn--sm')}</div>
    </aside>
  </div>
</section>`,
    });
  }

  // ================================================================ YOUR VISIT
  list.push({
    path: '/your-visit/', nav: 'visit', approvedForProduction: true,
    crumbs: [{ label: 'Your Visit', path: '/your-visit/' }],
    title: 'Your Visit',
    description: 'A sample first-visit workflow for Dr. Asif Niaz Arain & Associates, for the clinic to approve, with what to bring, how treatment decisions work and common questions.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap dp-split">
  <div>
    <p class="dp-eyebrow">Your visit</p>
    <h1>Your first visit, step by step.</h1>
    <p class="dp-lede">What a first visit could look like, what to bring, and how decisions about treatment are made.</p>
  </div>
  <div>${img('interior-reception')}</div>
</div></header>
<section class="dp-section dp-section--tight">
  <div class="dp-wrap">${illustrativeNote('The journey below is a sample workflow for the clinic to approve or change.')}</div>
</section>

<section class="dp-section" style="padding-block-start:0">
  <div class="dp-wrap dp-split dp-split--top">
    <div>
      <p class="dp-eyebrow">The journey</p>
      <h2>From first contact to a clear plan.</h2>
      <div class="dp-note" style="margin-block:22px 8px"><p><strong>A request is not a booking.</strong> If the clinic adds appointment requests, a request would only tell the clinic when you'd prefer to come. An appointment is confirmed only when the clinic confirms a date and time with you.</p></div>
    </div>
    ${stepsHtml()}
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap">
    <div class="dp-head"><div>
      <p class="dp-eyebrow">Before you go</p>
      <h2>What to bring or discuss.</h2>
      <p class="dp-lede">Useful to have with you, or ready to talk about, at any first dental visit. Please share these with the clinic in person or through its confirmed channels, never through this website.</p>
    </div></div>
    <div class="dp-grid dp-grid--2">
      <div class="dp-card"><h3>Your concerns and symptoms</h3><p class="dp-muted">What you've noticed, when it started, what makes it better or worse, and anything that has changed since your last dental visit.</p></div>
      <div class="dp-card"><h3>Medicines and health conditions</h3><p class="dp-muted">A list of medicines with doses, any allergies, and conditions such as diabetes, heart problems or pregnancy, which can affect dental care.</p></div>
      <div class="dp-card"><h3>Previous dental records</h3><p class="dp-muted">Recent X-rays, treatment notes or referral letters from another dentist, if you have them.</p></div>
      <div class="dp-card"><h3>Your questions</h3><p class="dp-muted">About options, timing and costs. Writing them down makes it easier to remember them in the chair.</p></div>
    </div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap dp-split dp-split--top">
    <div>
      <p class="dp-eyebrow">After the examination</p>
      <h2>Choosing treatment.</h2>
      <p class="dp-muted">What a good treatment conversation usually covers, at any practice. You can ask about each point.</p>
    </div>
    <dl class="dp-decide">
      <div><dt>Diagnosis</dt><dd>What the dentist found, and what is causing your symptoms.</dd></div>
      <div><dt>Options</dt><dd>The realistic ways to address it, including monitoring or doing nothing.</dd></div>
      <div><dt>Alternatives and trade-offs</dt><dd>What each option offers, its limitations and its risks.</dd></div>
      <div><dt>Stages</dt><dd>How many visits each option might take and what happens at each.</dd></div>
      <div><dt>Fees</dt><dd>What each option costs, and whether an estimate can be given in writing.</dd></div>
      <div><dt>Time to decide</dt><dd>The chance to ask questions and think it over, unless the situation is urgent.</dd></div>
    </dl>
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap">
    <div class="dp-head"><div>
      <p class="dp-eyebrow">Practical details</p>
      <h2>Still to be confirmed by the practice.</h2>
      <p class="dp-lede">These will be published here once the practice confirms them.</p>
    </div></div>
    <ul class="dp-pending-list">
      <li><strong>Arrival</strong><span>Where to go, and how early to arrive.</span></li>
      <li><strong>Accessibility</strong><span>Step-free access, parking and drop-off.</span></li>
      <li><strong>Fees and payment</strong><span>Consultation fee and accepted payment methods.</span></li>
      <li><strong>Insurance</strong><span>Any insurance or corporate panel arrangements.</span></li>
      <li><strong>Visit length</strong><span>How long a first visit usually takes.</span></li>
      <li><strong>Languages</strong><span>Languages spoken by clinicians and reception.</span></li>
      <li><strong>Cancellations</strong><span>How to change or cancel an appointment.</span></li>
      <li><strong>Urgent appointments</strong><span>Whether and how urgent care is offered.</span></li>
    </ul>
  </div>
</section>

<section class="dp-section" id="faqs">
  <div class="dp-wrap dp-narrow">
    <p class="dp-eyebrow">Questions and answers</p>
    <h2>Planning your visit.</h2>
    <div class="dp-faq" style="margin-top:28px">
      ${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><div>${links(f.a)}</div></details>`).join('')}
    </div>
  </div>
</section>
${nextSteps('/your-visit/')}`,
  });

  // ================================================================ CONTACT
  list.push({
    path: '/contact/', nav: 'contact', approvedForProduction: true,
    crumbs: [{ label: 'Contact', path: '/contact/' }],
    title: 'Contact',
    description: 'Contact information for Dr. Asif Niaz Arain & Associates Dental Professionals is being confirmed. Why this preview cannot take appointment requests or health information.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Contact</p>
  <h1>Contact information is being confirmed.</h1>
  <p class="dp-lede">The verified address, directions, telephone, WhatsApp, opening hours and appointment process will appear here after the practice confirms them.</p>
</div></header>

<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-head"><div>
      <p class="dp-eyebrow">What will appear here</p>
      <h2>Once the practice confirms its details.</h2>
      <p class="dp-lede">None of these is available yet. Each will be added only after the practice has confirmed it.</p>
    </div></div>
    <ul class="dp-pending-list">
      <li><strong>Address and directions</strong><span>The verified street address, with a map link and directions.</span></li>
      <li><strong>Telephone</strong><span>The practice's number for appointments and questions.</span></li>
      <li><strong>WhatsApp</strong><span>Only if the practice confirms a clinic-owned WhatsApp number.</span></li>
      <li><strong>Opening hours</strong><span>Regular hours, Friday timings and holidays.</span></li>
      <li><strong>Appointment requests</strong><span>Only with a secure, clinic-owned system and a published privacy policy.</span></li>
      <li><strong>Getting here</strong><span>Parking, step-free access and drop-off arrangements.</span></li>
    </ul>
  </div>
</section>

<section class="dp-section dp-section--ivory">
  <div class="dp-wrap dp-split dp-split--top">
    <div>
      <p class="dp-eyebrow">About appointment requests</p>
      <h2 id="appointments" style="scroll-margin-top:120px">Why this preview can't take requests.</h2>
    </div>
    <div class="dp-prose">
      <p>This is a concept preview, not the clinic's official website. It has no verified contact channel, so there is nobody at the practice to receive a message sent here, and no appointment could be confirmed.</p>
      <p>Health information needs particular care. Before the clinic's own website collects any appointment request, the practice will decide who reads requests, where they are stored, how they are protected and how long they are kept, and publish a privacy policy that explains this. Until then, please don't send symptoms, medical history or personal details through this site.</p>
    </div>
  </div>
</section>

<section class="dp-section">
  <div class="dp-wrap dp-narrow">
    <h2 class="dp-visually-hidden">In an emergency</h2>
    ${redFlagBox(true)}
    <p class="dp-muted" style="margin-top:16px">For toothache or a dental problem that isn't an emergency, contact a dentist you can reach promptly. <a href="${careUrl('urgent-dental-concerns')}">Read about urgent dental concerns</a>.</p>
  </div>
</section>
${nextSteps('/contact/')}`,
  });

  // ================================================================ INSIGHTS
  list.push({
    path: '/insights/', nav: 'insights', approvedForProduction: true,
    crumbs: [{ label: 'Insights', path: '/insights/' }],
    title: 'Dental Guides',
    description: 'Draft plain-language guides to common dental questions, prepared from NHS and NICE sources and awaiting review by a named clinician.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap">
  <p class="dp-eyebrow">Insights</p>
  <h1>Clear answers to real questions.</h1>
  <p class="dp-lede">Short guides to questions patients often ask. Each is a draft prepared from NHS and NICE sources, awaiting review by a named clinician before it can appear on the clinic's official website.</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap">
    <div class="dp-grid dp-grid--3">
      ${articles.map((a) => `<article class="dp-card dp-card--link">
        <div class="dp-card__meta">${pill('draft', ui.guideDraft)}</div>
        <p class="dp-muted" style="font-size:.9rem;font-style:italic;margin-bottom:.6em">“${esc(a.question)}”</p>
        <h2 style="font-size:1.6rem"><a href="${guideUrl(a.slug)}">${esc(a.title)}</a></h2>
        <p class="dp-muted">${esc(a.description)}</p>
        <p style="margin:0;font-size:.88rem" class="dp-muted">${a.readMinutes} minute read</p>
      </article>`).join('')}
    </div>
    <div class="dp-note" style="margin-top:40px"><p>Looking for a specific treatment? The <a href="${url('/care/')}">Care</a> section explains common dental care topic by topic.</p></div>
  </div>
</section>`,
  });

  for (const a of articles) {
    list.push({
      path: `/insights/${a.slug}/`, nav: 'insights', ogType: 'article',
      crumbs: [{ label: 'Insights', path: '/insights/' }, { label: a.title, path: `/insights/${a.slug}/` }],
      title: a.title, description: `Draft guide awaiting clinician review: ${a.description}`,
      body: () => `
<header class="dp-pagehead"><div class="dp-wrap dp-narrow">
  <p class="dp-eyebrow">Dental guide</p>
  <h1 style="font-size:clamp(2.1rem,4.5vw,3.2rem)">${esc(a.title)}</h1>
  <p class="dp-lede">${esc(a.description)}</p>
  <div class="dp-article-meta">
    ${pill('draft', ui.guideDraft)}
    <span>Clinical reviewer: to be named</span>
    <span>Sources checked ${fmtDate(CHECKED)}</span>
  </div>
  <div class="dp-note" style="margin-top:20px"><p><strong>Draft.</strong> This guide is not yet approved clinical advice. It awaits review by a named clinician before it can appear on the clinic's official website. It draws on UK (NHS and NICE) guidance; the reviewer will also check how that guidance applies under local requirements and practice.</p></div>
</div></header>
<section class="dp-section">
  <div class="dp-wrap dp-narrow dp-article">
    <div class="dp-summary" role="note"><p class="dp-summary__title">What this means for you</p><ul>${a.summary.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    ${a.body}
    <div class="dp-related">
      <p class="dp-related__title">Related care topics</p>
      <ul>${a.relatedCare.map((r) => `<li><a href="${careUrl(r)}">${esc(careBySlug[r].title)}</a></li>`).join('')}</ul>
    </div>
    <hr class="dp-rule" style="margin-block:48px 28px">
    <h2 style="font-size:1.4rem;margin-top:0">Sources</h2>
    ${sourcesList(a.sources)}
    <div class="dp-note" style="margin-top:28px"><p><strong>General information, not a diagnosis.</strong> This guide can't take your individual circumstances into account. Please speak to a dentist about your own situation.</p></div>
  </div>
</section>`,
    });
  }

  // ================================================================ NOTICE
  list.push({
    path: '/notice/', nav: null,
    crumbs: [{ label: 'About this preview', path: '/notice/' }],
    title: 'About This Preview: Privacy, Terms and Medical Information',
    description: 'What this concept preview of the Dr. Asif Niaz Arain & Associates website is, what is fictional or illustrative, and its privacy, terms and medical-information notices.',
    body: () => `
<header class="dp-pagehead"><div class="dp-wrap dp-narrow">
  <p class="dp-eyebrow">About this preview</p>
  <h1 style="font-size:clamp(2.1rem,4.5vw,3.2rem)">A concept, shared for review.</h1>
  <p class="dp-lede">This website is a concept preview of a future website for Dr. Asif Niaz Arain &amp; Associates Dental Professionals. ${esc(h.hostingNote)} It is not the clinic's official website.</p>
</div></header>
<section class="dp-section">
  <div class="dp-wrap dp-narrow dp-article">
    <h2 id="summary" style="margin-top:0">In brief</h2>
    <ul>
      <li><strong>This is a concept.</strong> It shows how the clinic's website could look and read once its details are approved.</li>
      <li><strong>Clinic details are unconfirmed.</strong> The address, contact channels, opening hours, fees and which treatments are available have not yet been confirmed by the practice.</li>
      <li><strong>The team profiles are fictional.</strong> Dr. Amina Rahman, Dr. Zoya Siddiqui and Dr. Hamza Khan are invented examples with AI-generated portraits. They do not work at this practice and cannot be booked. The practice's actual clinicians and leadership are awaiting confirmation.</li>
      <li><strong>Clinic images are illustrative.</strong> The reception, treatment-room and clinic images are AI-generated illustrations of an imagined clinic, not photographs of the practice.</li>
      <li><strong>Health information needs clinical review.</strong> The care pages and guides are general information drafted from UK and US public health sources and await review by a named clinician.</li>
      <li><strong>Appointment requests are not being collected.</strong> The appointment buttons only open an explanation.</li>
    </ul>
    <p>The practice bears the name of Dr. Asif Niaz Arain; he is remembered on the <a href="${url('/our-practice/')}#remembering">About</a> page.</p>
    <h2 id="privacy">Preview privacy notice</h2>
    <ul>
      <li>This preview has <strong>no forms</strong> and does not collect names, contact details, symptoms, medical history, prescriptions or payment details.</li>
      <li>The appointment buttons open an information message only. Nothing is sent anywhere.</li>
      <li>The preview pages load no analytics, advertising or tracking scripts, set no cookies of their own, and make no requests to third-party services. Fonts are served from this site.</li>
      <li>Like any website, the hosting provider (Cloudflare) processes basic technical request data to deliver and protect the site.</li>
    </ul>
    <h2 id="terms">Preview terms</h2>
    <ul>
      <li>Apart from the practice's name and the public record of Dr. Asif Niaz Arain, clinic details on this preview are provisional and should not be relied on.</li>
      <li>Qiyadon's own commercial terms do not apply to dental care, and nothing on this preview forms an agreement for dental treatment.</li>
      <li>Separate privacy and patient-information policies will be prepared for the clinic's own website and reviewed by the clinic and its legal adviser before launch.</li>
    </ul>
    <h2 id="medical">Medical information notice</h2>
    <p>The guides and care pages on this preview are general information. They have not yet been reviewed by the practice's clinicians and are not a substitute for an examination or personal advice from a dentist.</p>
    <p><strong>Please don't send medical details through this website</strong>, and don't delay seeking care because of anything you read here.</p>
    ${redFlagBox(true)}
  </div>
</section>`,
  });

  // ================================================================ 404
  list.push({
    path: '/404', file: '404.html', nav: null, noindex: true,
    title: 'Page Not Found',
    description: 'This page could not be found.',
    body: () => `
<section class="dp-section">
  <div class="dp-wrap dp-narrow" style="text-align:center">
    <p class="dp-eyebrow" style="justify-content:center">Page not found</p>
    <h1 style="margin-inline:auto">We couldn't find that page.</h1>
    <p class="dp-lede" style="margin-inline:auto">The link may be out of date, or the page may have moved. These are good places to continue:</p>
    <div class="dp-actions" style="justify-content:center;margin-top:28px">
      <a class="dp-btn" href="${url('/')}">Home</a>
      <a class="dp-btn dp-btn--ghost" href="${url('/care/')}">Care</a>
      <a class="dp-btn dp-btn--ghost" href="${url('/team/')}">Team</a>
      <a class="dp-btn dp-btn--ghost" href="${url('/contact/')}">Contact</a>
    </div>
    <p class="dp-muted" style="margin-top:32px">Looking for a specific topic? Try <a href="${careUrl('checkups-and-cleaning')}">check-ups</a>, <a href="${careUrl('urgent-dental-concerns')}">urgent dental concerns</a> or <a href="${url('/your-visit/')}">your first visit</a>.</p>
  </div>
</section>`,
  });

  return list;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstSentence(text) {
  const m = text.match(/^.*?[.!?](\s|$)/);
  return m ? m[0].trim() : text;
}
