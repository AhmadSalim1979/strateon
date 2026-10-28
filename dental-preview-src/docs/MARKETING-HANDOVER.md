# Handover note: Dr. Asif Niaz Arain & Associates website template

**Status:** design template, not an approved or operational clinic website.
Every page is `noindex, nofollow`. It shows a concept preview notice, fictional
team examples, illustrative (AI-generated) clinic images and inactive booking
and contact features. Nothing on it has been approved by the practice, the
family or a clinician.

## How the site is built
- Source: `dental-preview-src/` (static, zero-dependency Node build).
  - Facts and their verification state: `clinic-facts.json`
  - Copy: `content/en.mjs` (site, guides, FAQ), `content/care.mjs` (9 care
    pages, 11 topics), `content/team.mjs`, `content/sources.mjs`
  - Layout: `pages.mjs`, `build.mjs`; styles and scripts in `assets/`
  - Images: `image-manifest.json` + `img/`; regenerate sizes with
    `tools/process-images.mjs`
- Template build (what is deployed at the template domain):
  `node dental-preview-src/build.mjs --mode=template --host=<domain> --out=<dir>`
- Production build (the real, indexable site):
  `node dental-preview-src/build.mjs --mode=production --site-url=https://<domain> --out=<dir>`
  This is blocked by `production-gate.mjs` until everything below is done.
  Run `--mode=production --check-only` to see what is outstanding.

## Content to replace
1. **Team.** Delete the three fictional examples (Dr. Amina Rahman, Dr. Zoya
   Siddiqui, Dr. Hamza Khan), their AI-generated portraits and their
   `/team/sample-*` pages. Add the real clinicians, each with:
   - registered name, role and clinical scope;
   - qualifications with institution and year;
   - PMDC number and the date it was checked on the PMDC register;
   - languages and clinic days;
   - dated written consent and an authentic portrait.
2. **Images.** Replace all four illustrative clinic images (hero, reception,
   treatment room, entrance) with authentic, approved photographs of the
   practice.
3. **Contact.** Add the verified address, map, telephone, WhatsApp (if used),
   email, opening hours and booking process. The Contact page currently says
   these are being confirmed.
4. **Booking.** The "Appointments" button only opens an explanation. Any real
   booking form needs, before it goes live:
   - a named owner and a secure, clinic-owned endpoint;
   - access controls, consent wording and a retention period;
   - an approved privacy policy;
   - end-to-end testing.
5. **Care.** Confirm which of the 11 care topics the practice offers. Delete the
   others. Remove "Availability to be confirmed" only for confirmed treatments.
6. **Proposed wording.** The home page approach, About-page philosophy and
   visit journey are proposals. Replace them with wording the practice
   approves, then remove the "proposed" labels.
7. **Preview notices.** Remove the preview bar, the "About this preview" page
   and the fictional/illustrative labels only once the content they describe
   has been replaced.

## Approvals required
- **Family:**
  - tribute wording and portrait of Dr. Arain;
  - whether "founder" is accurate and wanted;
  - whether to show his date of death (9 March 2024);
  - the logo file.

  A draft request is in `docs/FAMILY-REQUEST-DRAFT.md`.
- **Practice owner:** every operational fact in `clinic-facts.json` (fees,
  insurance, languages, access, urgent-care and cancellation policies,
  leadership, patient process).
- **Named local clinician:** review and date every care page and the three
  guides, including how the UK/US source guidance applies locally.
- **Legal adviser:** the clinic's privacy policy, terms and patient-information
  notice (outlines in `docs/PRODUCTION-POLICIES-DRAFT.md`).

## Launch
Follow `docs/LAUNCH-CHECKLIST.md`. Remove `noindex` only by publishing the
production build after `--check-only` passes. Never edit `noindex` out of the
template build.
