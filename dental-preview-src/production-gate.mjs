// Production launch gate. Runs only for `--mode=production` builds (the
// clinic's own, indexable domain). The family-review preview is unaffected.
//
// Two layers:
//   1. checkData()      - every fact, person, service, image and review the
//                          production site depends on must be verified/approved.
//   2. scanRendered()   - the rendered HTML must contain no preview-only wording
//                          (fictional, illustrative, "being confirmed", drafts...).
//                          This catches template copy the data checks can't see.
//
// Every failure is reported at once. Nothing here can be satisfied by editing
// a label: each check reads the underlying status fields.

// Facts the production site states or depends on. Each must be status
// 'verified' in clinic-facts.json. Where the practice confirms it does NOT use
// a channel (e.g. no WhatsApp), record that as a verified value such as
// "Not used" so the site can say so accurately.
export const REQUIRED_FACTS = {
  'Identity and location': ['practice_name', 'location_broad', 'address_full', 'map_coordinates'],
  'Contact channels and hours': ['phone_primary', 'whatsapp', 'email', 'booking_channel', 'opening_hours'],
  'Clinicians and leadership': ['clinicians', 'practice_leadership'],
  'Services and patient information': ['services', 'patient_experience', 'fees_and_payment', 'insurance_and_panels', 'languages', 'accessibility_and_parking', 'urgent_care_policy', 'cancellation_policy'],
  'Tribute (family approval)': ['tribute_approval', 'founder_biography', 'founder_date_of_death'],
};

const CLINICIAN_FIELDS = ['registeredName', 'role', 'qualifications', 'pmdc', 'clinicalScope', 'languages', 'clinicDays', 'consent', 'portraitSlot'];

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const filled = (v) => v !== null && v !== undefined && !(typeof v === 'string' && !v.trim()) && !(Array.isArray(v) && !v.length);

export function checkData({ facts, images, care, team, articles }) {
  const fail = [];
  const add = (area, msg) => fail.push({ area, msg });

  // 1. Facts --------------------------------------------------------------
  for (const [area, keys] of Object.entries(REQUIRED_FACTS)) {
    for (const k of keys) {
      const f = facts[k];
      if (!f) { add(area, `fact "${k}" is missing from clinic-facts.json`); continue; }
      if (f.status !== 'verified') add(area, `fact "${k}" is ${f.status || 'unset'}, must be verified (approver: ${f.approver || 'unset'})`);
      else if (!filled(f.value)) add(area, `fact "${k}" is marked verified but has no value`);
      else if (!isDate(f.last_checked)) add(area, `fact "${k}" has no valid last_checked date`);
    }
  }

  // 2. Clinicians ---------------------------------------------------------
  if (team.sampleClinicians.length) add('Clinicians and leadership', `${team.sampleClinicians.length} fictional sample clinician(s) still in content/team.mjs (sampleClinicians must be empty)`);
  if (!team.clinicians.length) add('Clinicians and leadership', 'no verified clinicians in content/team.mjs (clinicians is empty)');
  for (const c of team.clinicians) {
    const who = c.registeredName || c.slug || '(unnamed clinician)';
    for (const fld of CLINICIAN_FIELDS) if (!filled(c[fld])) add('Clinicians and leadership', `${who}: "${fld}" is not filled in`);
    if (c.pmdc && !(filled(c.pmdc.number) && isDate(c.pmdc.verifiedOn))) add('Clinicians and leadership', `${who}: PMDC number and verifiedOn date (checked on the PMDC register) are required`);
    if (Array.isArray(c.qualifications) && c.qualifications.some((q) => !(q && filled(q.name) && filled(q.institution) && filled(q.year)))) add('Clinicians and leadership', `${who}: each qualification needs name, institution and year`);
    if (c.consent && !(c.consent.portrait === true && c.consent.profile === true && isDate(c.consent.date))) add('Clinicians and leadership', `${who}: written consent for portrait and profile (with date) is required`);
    if (c.approvedBy === undefined || !filled(c.approvedBy) || !isDate(c.approvedOn)) add('Clinicians and leadership', `${who}: profile text needs approvedBy and approvedOn`);
    if (c.portraitSlot && images[c.portraitSlot]?.status !== 'authentic-approved') add('Clinicians and leadership', `${who}: portrait slot "${c.portraitSlot}" must be an authentic, approved photograph`);
  }

  // 3. Services and clinical review of Care pages --------------------------
  for (const p of care.carePages) {
    const st = { ...care.careStatus, ...(p.status || {}) };
    for (const t of p.topics) {
      const ts = { ...st, ...(t.status || {}) };
      if (ts.availability !== 'confirmed') add('Services and clinical review', `care topic "${t.id}" (${p.slug}): availability is ${ts.availability}; confirm it is offered, or remove the topic`);
    }
    if (st.clinicalReview !== 'approved' || !filled(st.reviewer) || !isDate(st.reviewedOn)) add('Services and clinical review', `care page "${p.slug}": needs clinicalReview "approved", a named local clinician (reviewer) and reviewedOn date`);
  }

  // 4. Clinical review of guides ------------------------------------------
  for (const a of articles) {
    const r = a.review || {};
    if (r.status !== 'approved' || !filled(r.reviewer) || !isDate(r.reviewedOn)) add('Services and clinical review', `guide "${a.slug}": needs review { status: "approved", reviewer, reviewedOn }`);
  }

  // 5. Images -------------------------------------------------------------
  for (const [k, v] of Object.entries(images)) {
    if ((v.src || v.variants) && v.status !== 'authentic-approved') add('Images', `image slot "${k}" is ${v.status || 'unset'}; only authentic-approved images may be published`);
  }

  return fail;
}

// Preview-only wording that must never reach the production site. Matched
// case-insensitively against visible text and meta descriptions.
export const PREVIEW_MARKERS = [
  /fictional/i, /\billustrati(ve|on)\b/i, /ai-generated/i, /hypothetical/i,
  /being confirmed/i, /to be confirmed/i, /awaiting (verification|confirmation|review|practice)/i,
  /still to be confirmed/i, /to be published once verified/i, /once (details are|the address is) (confirmed|verified)/i,
  /\bproposed (wording|experience|journey|website language|philosophy)/i, /sample (workflow|profile|biography)/i,
  /clinical review pending/i, /availability to be confirmed/i, /\bdraft\b/i,
  /not active on this preview/i, /\bthis preview\b/i, /concept preview/i, /to be added/i, /to be supplied/i,
];

export function scanRendered(rendered) {
  const hits = new Map();
  for (const { path, html } of rendered) {
    const meta = [...html.matchAll(/<meta (?:name|property)="(?:description|og:description|og:title)" content="([^"]*)"/g)].map((m) => m[1]).join(' ');
    const text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ') + ' ' + meta;
    for (const re of PREVIEW_MARKERS) {
      const m = text.match(re);
      if (m) {
        const key = re.source;
        if (!hits.has(key)) hits.set(key, { phrase: m[0], pages: [] });
        hits.get(key).pages.push(path);
      }
    }
  }
  return [...hits.values()].map((h) => ({ area: 'Preview-only wording in rendered pages', msg: `"${h.phrase}" appears on ${h.pages.length} page(s): ${h.pages.slice(0, 6).join(', ')}${h.pages.length > 6 ? ', ...' : ''}` }));
}

export function formatReport(failures) {
  const byArea = {};
  for (const f of failures) (byArea[f.area] ||= []).push(f.msg);
  return Object.entries(byArea).map(([a, list]) => `\n${a} (${list.length}):\n${list.map((m) => `  - ${m}`).join('\n')}`).join('\n');
}
