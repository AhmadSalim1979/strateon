# Dental concept preview: Dr. Asif Niaz Arain & Associates

An isolated concept website for Dr. Asif Niaz Arain & Associates Dental
Professionals (Clifton, Karachi), hosted for family review at
**https://qiyadon.com/dental-preview/**. It is not the clinic's official site.

## How it is hosted
- qiyadon.com is a static Cloudflare Pages site built from `public/` on the
  `deploy/v2` branch of this repository. There is no build step.
- The preview lives only under `public/dental-preview/`. It uses its own
  CSS and JS (`dp-` prefixed) and never loads Qiyadon's `/styles.css`.
- `public/_headers` adds `X-Robots-Tag: noindex, nofollow` to
  `/dental-preview` and `/dental-preview/*` only. Every page also carries
  `<meta name="robots" content="noindex, nofollow">`.
- `public/dental-preview/404.html` is the preview's own "not found" page.
  Cloudflare serves the nearest `404.html`, so it applies only under
  `/dental-preview/`. Qiyadon's other URLs keep their existing behaviour,
  because there is still no top-level `404.html`.
- The preview is **not** in Qiyadon's navigation, `sitemap.xml`, `llms.txt`
  or `robots.txt`, and contains no structured data.
- A hidden URL is not private. If the family needs restricted access, put a
  Cloudflare Access policy (email one-time PIN for named family members) on
  `qiyadon.com/dental-preview/*`. This requires a Cloudflare dashboard change.

## Editing and rebuilding
```
node dental-preview-src/build.mjs          # regenerates public/dental-preview/
```
- `clinic-facts.json`: every clinic fact, with source, status
  (`verified` / `candidate` / `missing`), last-check date and approver. Only
  `verified` facts render as current statements. Everything else shows
  "Being confirmed".
- `image-manifest.json`: image slots (see `docs/IMAGE-SLOTS.md`). Add a
  `src` value to replace a placeholder.
- `content/en.mjs`: copy, proposed care categories, guides and FAQs.
  `pages.mjs` holds the page templates, and `build.mjs` the layout and
  helpers.
- Urdu/RTL: add `content/ur.mjs` with `dir: 'rtl'`. The CSS uses logical
  properties throughout. Don't publish machine-translated medical copy.
- Production (clinic domain only):
  `node dental-preview-src/build.mjs --mode=production --site-url=https://<domain> --out=<dir>`.
  The build refuses to write production output into this repository's
  `public/` directory.

## Production launch gate
`production-gate.mjs` blocks any production (clinic-domain) build until facts, clinicians, services, clinical reviews and images are verified, and no preview-only wording remains. Run `node dental-preview-src/build.mjs --mode=production --check-only` for the current list. The preview build is unaffected. See `docs/LAUNCH-CHECKLIST.md` §2b.

## File inventory (all new, nothing existing modified)
| Path | Purpose |
|---|---|
| `public/_headers` | `noindex, nofollow` header scoped to `/dental-preview` |
| `public/dental-preview/**` | Generated preview: 13 pages, a 404 page, `assets/dp.css`, `assets/dp.js` |
| `dental-preview-src/**` | Source: build script, content, facts, image manifest, docs |

## Rollback
Everything was added in one commit on `deploy/v2`, with no existing file
changed, so either of these fully restores the previous site:
```
git revert <preview-commit>            # then push to deploy/v2
# or, remove the files by hand:
git rm -r public/dental-preview dental-preview-src public/_headers
```
Cloudflare Pages redeploys from the push. Afterwards, check that
`https://qiyadon.com/dental-preview/` no longer serves the preview and that
`https://qiyadon.com/` is unchanged.

## Docs
- `docs/LAUNCH-CHECKLIST.md`: production launch on the clinic's domain
- `docs/SEO-AND-GBP-HANDOVER.md`: Google Business Profile, Search Console, reviews, measurement
- `docs/PRODUCTION-POLICIES-DRAFT.md`: privacy, terms and patient-notice outlines for legal review
- `docs/IMAGE-SLOTS.md`: image slot specification
