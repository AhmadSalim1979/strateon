# Production launch checklist: clinic's own domain

The Qiyadon-hosted preview (`qiyadon.com/dental-preview/`) is a review
concept. It is always `noindex, nofollow` and must never be made indexable on
qiyadon.com. Work through this list before the site goes live on the
clinic's own domain.

## 1. Ownership and access
- [ ] Clinic domain registered **in the practice's name**, with the family or practice owner holding the registrar login.
- [ ] Hosting account owned by the practice (or a documented agency arrangement).
- [ ] DNS, TLS and email (SPF/DKIM/DMARC) configured on the clinic domain.
- [ ] If an older clinic website exists: inventory its URLs and plan 301 redirects to the matching new pages.

## 2a. Remove all fictional and illustrative material
- [ ] Delete the three fictional sample clinicians (Dr. Amina Rahman, Dr. Zoya Siddiqui, Dr. Hamza Khan): empty `sampleClinicians` in `content/team.mjs`, remove the `team-portrait-sample-*` slots from `image-manifest.json`, and delete their files from `img/` and `img/masters/`.
- [ ] Replace the four AI-generated clinic illustrations (`hero-clinic`, `interior-reception`, `interior-room`, `location-exterior`) with authentic, approved photographs, or revert them to placeholders.
- [ ] `node build.mjs --mode=production ...` refuses to run until both steps are done. Don't bypass this check.
- [ ] Replace proposed wording (approach, visit journey, philosophy of care) with text the practice has approved, and remove the "proposed" labels only once it has.

## 2. Facts and approvals (`clinic-facts.json`)
- [ ] Every fact shown on the site has `status: "verified"`, a source, a `last_checked` date and the named approver's sign-off.
- [ ] Address, phone, WhatsApp, hours and map pin match the Google Business Profile **exactly**.
- [ ] Current SHCC registration certificate seen (the May 2025 register listing alone does not prove current status).
- [ ] Each clinician: name as registered, PMDC registration verified on the PMDC register, qualifications, written consent for portrait and profile.
- [ ] Approved treatment list in `services`. Only approved treatments get pages and navigation entries.
- [ ] Founder tribute text, photograph and whether to show the date of death approved by the family.
- [ ] Logo: original SVG or high-resolution transparent file received, with usage confirmed.

## 3. Clinical content
- [ ] Care: a named local clinician reviews all 9 care pages (11 categories) in `content/care.mjs`, confirms which treatments the practice actually provides, deletes or rewrites the rest, and records their name and review date in `careStatus`. Check every source in `content/sources.mjs` for newer versions.
- [ ] Remove "Availability to be confirmed" labels only for treatments the practice has confirmed, and remove the page-level illustrative notice only when every item on the page is confirmed.
- [ ] Every treatment page and guide reviewed by a named clinician; reviewer name and review date shown on the page.
- [ ] Emergency guidance localised for Karachi (which hospital emergency departments and numbers to use), approved by the lead clinician.
- [ ] No guarantees, success statistics, "pain-free" or "best" claims, before/after images without written consent, or invented reviews.
- [ ] Urdu content (if launched) translated by a human translator and reviewed by a clinician, with `dir="rtl"` tested.

## 4. Booking and privacy
- [ ] Booking channel chosen (phone, WhatsApp Business, or a form). For a form, document **before** activating:
  - owner (who reads and answers requests, and within what hours);
  - endpoint (HTTPS, clinic-controlled, not a Qiyadon form or marketing CRM);
  - access control (named staff only, MFA);
  - consent text and a link to the privacy policy;
  - retention (e.g. delete unconverted requests after 90 days);
  - fields limited to name, phone, preferred time and optional short reason; **no** medical history, prescriptions or payment details.
- [ ] Confirmation message says "request received, the clinic will contact you to confirm", never "booked".
- [ ] End-to-end test: submit a request, confirm it reaches the right person, confirm nothing is logged to analytics or the browser console.
- [ ] Clinic privacy policy, website terms and patient-information notice reviewed by the clinic and its legal adviser (drafts in `PRODUCTION-POLICIES-DRAFT.md`).

## 5. Technical SEO
- [ ] Build with `node build.mjs --mode=production --site-url=https://<clinic-domain> --out=<dir>`.
- [ ] Set `approvedForProduction: true` in `pages.mjs` only for approved pages; add a page per approved treatment and clinician.
- [ ] Unique title and description per page; one `h1` per page; canonical URLs point at the clinic domain.
- [ ] `sitemap.xml` lists approved pages only; `robots.txt` references it.
- [ ] `Dentist` JSON-LD appears only when name, address, phone and hours are all verified (enforced by the build). No `AggregateRating` or review markup.
- [ ] Open Graph image (`social-share` slot) supplied and approved.
- [ ] **Remove preview-only `noindex` on the production site only** (production mode does this automatically; the preview on qiyadon.com stays `noindex`).

## 6. Google Business Profile and Search Console
See `SEO-AND-GBP-HANDOVER.md`.

## 7. Quality
- [ ] Every page checked at 320px, 390px, 768px and 1440px, and at 200% zoom.
- [ ] Automated accessibility scan (axe) clean, plus a manual keyboard and screen-reader pass.
- [ ] Real images supplied at the manifest sizes, compressed (AVIF/WebP with JPEG fallback), with width and height set.
- [ ] Field Core Web Vitals monitored after launch. Targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. Report measured values, not targets.

## 8. Retire the preview
- [ ] Once production is live, remove `public/dental-preview/`, `dental-preview-src/` (or move it to the clinic's own repository) and the `/dental-preview` rules in `public/_headers` from the Qiyadon repository. See `../README.md`, "Rollback".
