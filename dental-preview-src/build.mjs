#!/usr/bin/env node
// Static site builder for the Dr. Asif Niaz Arain & Associates concept site.
// Zero dependencies. Two modes:
//
//   node dental-preview-src/build.mjs
//     -> preview mode (default): writes ../public/dental-preview/**, every page
//        noindex,nofollow, no canonical, no sitemap, no structured data.
//
//   node dental-preview-src/build.mjs --mode=production --site-url=https://clinic-domain --out=/some/dir
//     -> production mode for the clinic's own domain: index,follow, canonical
//        + og:url, sitemap.xml of approved pages, and Dentist JSON-LD ONLY for
//        facts whose status is 'verified' in clinic-facts.json.
//        Never run production mode into this repository's public/ directory.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as en from './content/en.mjs';
import { pages } from './pages.mjs';

const SRC = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=?(.*)$/);
  return m ? [m[1], m[2] || true] : [a, true];
}));
const MODE = args.mode === 'production' ? 'production' : 'preview';
const BASE = MODE === 'preview' ? '/dental-preview' : '';
const SITE_URL = MODE === 'production' ? String(args['site-url'] || '').replace(/\/$/, '') : '';
const OUT = path.resolve(args.out || path.join(SRC, '..', 'public', 'dental-preview'));

if (path.basename(OUT) === 'public' || OUT === path.resolve(SRC, '..')) throw new Error('Refusing to use a shared directory as the output root');
if (MODE === 'production') {
  if (!/^https:\/\//.test(SITE_URL)) throw new Error('--site-url=https://... is required in production mode');
  if (OUT.startsWith(path.resolve(SRC, '..', 'public'))) throw new Error('Refusing to write a production (indexable) build into the Qiyadon public/ directory');
}

const facts = JSON.parse(fs.readFileSync(path.join(SRC, 'clinic-facts.json'), 'utf8')).facts;
const images = JSON.parse(fs.readFileSync(path.join(SRC, 'image-manifest.json'), 'utf8')).slots;
const { ui, nav, locale } = en;

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = (p) => BASE + p;
const fact = (key) => {
  const f = facts[key];
  if (!f) throw new Error(`Unknown fact: ${key}`);
  return { ...f, verified: f.status === 'verified' };
};
// Render a fact as a current assertion only when verified.
const factText = (key, fallback = ui.beingConfirmed) => {
  const f = fact(key);
  return f.verified && f.value ? esc(f.value) : pill('pending', fallback);
};
const pill = (kind, text) => `<span class="dp-pill dp-pill--${kind}">${esc(text)}</span>`;
const bookBtn = (label = ui.requestAppointment, cls = 'dp-btn') =>
  `<a class="${cls}" href="${url('/contact/')}#appointments" data-dp-booking aria-haspopup="dialog">${esc(label)}</a>`;

const ratio = (r) => (r ? r.replace(':', ' / ') : null);
function img(slotKey, { instance, eager = false, compact = false, caption = '', alt } = {}) {
  // Wildcard slots (team-portrait-*, service-*) can be filled per instance by
  // adding a concrete entry, e.g. "team-portrait-dr-example", to the manifest.
  const id = instance ? slotKey.replace('*', instance) : slotKey;
  const slot = images[id] || images[slotKey];
  if (!slot) throw new Error(`Unknown image slot: ${slotKey}`);
  const ar = ratio(slot.aspect_ratio);
  const arM = ratio(slot.mobile_aspect_ratio) || ar;
  const style = `--dp-ar:${ar};--dp-ar-m:${arM}`;
  const cls = `dp-media dp-media--mobile-crop${compact ? ' dp-media--compact' : ''}`;
  let inner;
  if (slot.src) {
    const [w, hgt] = slot.px;
    const src = url('/assets/img/' + slot.src);
    const mobile = slot.src_mobile ? `<source media="(max-width: 640px)" srcset="${url('/assets/img/' + slot.src_mobile)}" width="${slot.mobile_px[0]}" height="${slot.mobile_px[1]}">` : '';
    inner = `<picture>${mobile}<img src="${src}" width="${w}" height="${hgt}" alt="${esc(alt || '')}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
  } else {
    inner = `<div class="dp-ph" role="img" aria-label="${esc(`Image placeholder: ${slot.subject}`)}">
      <span class="dp-ph__id">Image slot · ${esc(id)}</span>
      <span class="dp-ph__subject">${esc(slot.label)}</span>
      <span class="dp-ph__note">${slot.authentic_required ? 'Authentic photograph to be supplied' : 'To be supplied'} · ${esc(slot.aspect_ratio)}${slot.mobile_aspect_ratio && slot.mobile_aspect_ratio !== slot.aspect_ratio ? ` (mobile ${esc(slot.mobile_aspect_ratio)})` : ''}</span>
    </div>`;
  }
  return `<figure class="${cls}" style="${style}" data-slot="${esc(id)}">${inner}</figure>${caption ? `<p class="dp-figcaption">${caption}</p>` : ''}`;
}

const h = { esc, url, fact, factText, pill, bookBtn, img, ui };

// ---------------------------------------------------------------- layout
function wordmark() {
  return `<a class="dp-wordmark" href="${url('/')}" aria-label="Dr. Asif Niaz Arain &amp; Associates Dental Professionals, home">
    <span class="dp-wordmark__name">Dr. Asif Niaz Arain <span>&amp;</span> Associates</span>
    <span class="dp-wordmark__sub">DENTAL PROFESSIONALS</span>
  </a>`;
}

function header(active) {
  const items = nav.map((n) => `<li><a href="${url(n.path)}"${n.key === active ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('');
  return `<header class="dp-header">
  <div class="dp-wrap">
    ${wordmark()}
    <nav class="dp-nav" data-dp-nav aria-label="Main">
      <button class="dp-menu-btn" type="button" data-dp-menu-btn aria-expanded="false" aria-controls="dp-nav-panel"><span class="dp-menu-btn__bars" aria-hidden="true"></span>${esc(ui.menu)}</button>
      <div class="dp-nav__panel" id="dp-nav-panel">
        <ul class="dp-nav__list">${items}</ul>
        <div class="dp-nav__cta">${bookBtn()}</div>
      </div>
    </nav>
    <div class="dp-header__cta">${bookBtn(ui.requestAppointment, 'dp-btn dp-btn--sm')}</div>
  </div>
</header>`;
}

function crumbsHtml(crumbs) {
  if (!crumbs || !crumbs.length) return '';
  const all = [{ label: 'Home', path: '/' }, ...crumbs];
  return `<nav class="dp-crumbs dp-wrap" aria-label="${esc(ui.breadcrumb)}"><ol>${all.map((c, i) =>
    i === all.length - 1 ? `<li><span aria-current="page">${esc(c.label)}</span></li>` : `<li><a href="${url(c.path)}">${esc(c.label)}</a></li>`).join('')}</ol></nav>`;
}

function footer() {
  return `<footer class="dp-footer">
  <div class="dp-wrap">
    <div class="dp-footer__grid">
      <div>
        ${wordmark()}
        <p style="margin-top:22px;max-width:30em">${factText('location_broad')}. Clinic phone, WhatsApp, opening hours and appointment details are being confirmed with the practice.</p>
      </div>
      <div>
        <h2>Explore</h2>
        <ul>${nav.map((n) => `<li><a href="${url(n.path)}">${esc(n.label)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h2>For patients</h2>
        <ul>
          <li><a href="${url('/your-visit/')}#faqs">Questions and answers</a></li>
          <li><a href="${url('/notice/')}#privacy">Preview privacy notice</a></li>
          <li><a href="${url('/notice/')}#terms">Preview terms</a></li>
          <li><a href="${url('/notice/')}#medical">Medical information notice</a></li>
        </ul>
      </div>
    </div>
    <div class="dp-footer__legal">
      <span>Concept preview prepared by Qiyadon for review by the practice. This is not yet the clinic's official website.</span>
      <span>No appointments or medical information are collected on this preview.</span>
    </div>
  </div>
</footer>`;
}

function bookingDialog() {
  return `<dialog class="dp-dialog" id="dp-booking-dialog" aria-labelledby="dp-booking-title" aria-describedby="dp-booking-desc">
  <div class="dp-dialog__inner">
    <button class="dp-dialog__close" type="button" data-dp-dialog-close aria-label="Close">&times;</button>
    <p class="dp-eyebrow">Appointments</p>
    <h2 id="dp-booking-title">Booking isn't open on this preview yet</h2>
    <div id="dp-booking-desc">
      <p>You're viewing a concept of the clinic's future website. The practice is confirming its phone number, WhatsApp and appointment process, and these will appear here once verified.</p>
      <p>Nothing has been sent and no appointment has been requested. Please don't share symptoms or medical details through this website.</p>
    </div>
    <div class="dp-urgent" role="note" style="margin:18px 0 24px"><p style="margin:0"><strong>In an emergency:</strong> if you have dental pain with facial or neck swelling, or difficulty breathing or swallowing, seek emergency medical care straight away.</p></div>
    <div class="dp-actions">
      <button class="dp-btn" type="button" data-dp-dialog-close>Close</button>
      <a class="dp-btn dp-btn--ghost" href="${url('/your-visit/')}">What to expect at a first visit</a>
    </div>
  </div>
</dialog>`;
}

function jsonLd(page) {
  if (MODE !== 'production') return '';
  const blocks = [];
  // Dentist markup only when every fact it would assert is verified.
  const need = ['practice_name', 'address_full', 'phone_primary', 'opening_hours'];
  if (page.path === '/' && need.every((k) => fact(k).verified)) {
    blocks.push({
      '@context': 'https://schema.org', '@type': 'Dentist',
      name: fact('practice_name').value, url: SITE_URL + '/',
      address: { '@type': 'PostalAddress', streetAddress: fact('address_full').value, addressLocality: 'Karachi', addressCountry: 'PK' },
      telephone: fact('phone_primary').value,
      openingHours: fact('opening_hours').value,
      ...(fact('map_coordinates').verified ? { geo: { '@type': 'GeoCoordinates', ...fact('map_coordinates').value } } : {}),
    });
  }
  if (page.crumbs && page.crumbs.length) {
    const all = [{ label: 'Home', path: '/' }, ...page.crumbs];
    blocks.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: SITE_URL + c.path })) });
  }
  return blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join('\n');
}

function layout(page) {
  const title = page.path === '/' ? `${page.title}` : `${page.title} | Dr. Asif Niaz Arain & Associates`;
  const share = images['social-share'];
  const robots = MODE === 'preview' ? 'noindex, nofollow' : (page.noindex ? 'noindex, follow' : 'index, follow');
  const canonical = MODE === 'production' && !page.noindex ? `<link rel="canonical" href="${SITE_URL}${page.path}">\n  <meta property="og:url" content="${SITE_URL}${page.path}">` : '';
  const ogImage = MODE === 'production' && share.src ? `<meta property="og:image" content="${SITE_URL}/assets/img/${share.src}">\n  <meta name="twitter:card" content="summary_large_image">` : '';
  return `<!doctype html>
<html lang="${locale.lang}" dir="${locale.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <meta name="robots" content="${robots}">
  ${canonical}
  <meta property="og:type" content="${page.ogType || 'website'}">
  <meta property="og:title" content="${esc(page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:site_name" content="Dr. Asif Niaz Arain &amp; Associates Dental Professionals">
  ${ogImage}
  <meta name="theme-color" content="#fbfaf7">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="${url('/assets/dp.css')}">
  <script src="${url('/assets/dp.js')}" defer></script>
  ${jsonLd(page)}
</head>
<body class="dp">
<a class="dp-skip" href="#main">${esc(ui.skip)}</a>
${MODE === 'preview' ? `<aside class="dp-preview-bar" aria-label="Preview notice"><div class="dp-wrap"><strong>${esc(ui.previewNotice)}</strong><a href="${url('/notice/')}">${esc(ui.previewMore)}</a></div></aside>` : ''}
${header(page.nav)}
<main id="main" tabindex="-1">
${crumbsHtml(page.crumbs)}
${page.body(h)}
</main>
${footer()}
${bookingDialog()}
</body>
</html>
`;
}

// ---------------------------------------------------------------- pages
const allPages = pages(h, en);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const f of ['dp.css', 'dp.js']) fs.copyFileSync(path.join(SRC, 'assets', f), path.join(OUT, 'assets', f));
const imgDir = path.join(SRC, 'img');
if (fs.existsSync(imgDir)) fs.cpSync(imgDir, path.join(OUT, 'assets', 'img'), { recursive: true });

for (const page of allPages) {
  const file = page.file || path.join(page.path.replace(/^\//, ''), 'index.html');
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, layout(page));
}

if (MODE === 'production') {
  const approved = allPages.filter((p) => p.approvedForProduction && !p.noindex);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${approved.map((p) => `  <url><loc>${SITE_URL}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
}

console.log(`[dental-preview] ${MODE} build: ${allPages.length} pages -> ${OUT}`);
