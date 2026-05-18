# SafePay SP1 Implementation Spec

## Objectives
Add SafePay-required contact information, business address, complaints handling, and refund wording to qiyadon.com. No redesign, no branding changes.

## 1. Create /contact.html (new file)

Visual system: Same as qiyadon.com — CSS variables, same footer/navbar, restrained premium tone.

### Page sections:
1. **Header** — same navbar as index.html (copy from index.html nav section)
2. **Hero section** — "Get In Touch" heading, subline "Operational support for Qiyadon pipeline clients."
3. **Contact Grid** (2 columns on desktop, 1 on mobile):
   - Email: contact@qiyadon.com (mailto link)
   - Phone/WhatsApp: +92 321 513 9934 (wa.me link)
   - Address: 122. Street 65, F-11/4, Islamabad 44100, Pakistan
4. **Complaints Handling section:**
   - Heading: "Complaints & Disputes"
   - Body: "If you have a complaint or dispute, contact us through email or Phone / WhatsApp. We respond within 1 business day. Resolution is handled as quickly as reasonably possible depending on issue complexity."
5. **Footer** — same as index.html (copy the full footer from index.html)

### Design:
- Clean, operational, professional tone
- No corporate bloat or legal language
- Same color palette (--navy, --teal, --gold from existing site)
- Mobile responsive
- Max content width: 900px centered

### Navbar to use (copy from index.html):
```html
<nav id="navbar">
  <div class="nav-inner">
    <a href="/" class="nav-logo brand-lockup">
      <span class="brand-mark"><img src="assets/qiyadon-kun-logo.jpg" alt="Qiyadon"></span>
      <span class="brand-name">qiyadon</span>
    </a>
    <ul class="nav-links" id="navLinks">
      <li><a href="/">Home</a></li>
      <li><a href="/product.html">What We Do</a></li>
      <li><a href="/product.html#how-it-works">How It Works</a></li>
      <li><a href="/product.html#first-7-days">First 7 Days</a></li>
      <li><a href="/pricing.html">Pricing</a></li>
      <li><a href="/faq">FAQ</a></li>
    </ul>
    <a href="/pipeline-leak-audit.html" class="nav-cta">Get a Free Pipeline Leak Audit</a>
    <button class="mobile-toggle" id="mobileToggle" aria-label="Menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </div>
</nav>
```

### Footer to use (copy from index.html full footer HTML):
Full footer from index.html lines 2663-2699.

## 2. Update footer in ALL pages with this exact contact block

Replace the Contact footer column (currently just email) with:
```html
<div class="footer-col">
  <h4>Contact</h4>
  <ul>
    <li><a href="mailto:contact@qiyadon.com">contact@qiyadon.com</a></li>
    <li><a href="https://wa.me/923215139934" target="_blank" rel="noopener">+92 321 513 9934</a></li>
    <li><span style="color: var(--slate);">Islamabad, Pakistan</span></li>
  </ul>
</div>
```

Files to update (14 files):
1. /home/node/.openclaw/workspace/public/index.html
2. /home/node/.openclaw/workspace/public/cancellation-refund-policy.html
3. /home/node/.openclaw/workspace/public/onboarding-intake.html
4. /home/node/.openclaw/workspace/public/ownership-statement.html
5. /home/node/.openclaw/workspace/public/pipeline-leak-audit.html
6. /home/node/.openclaw/workspace/public/pricing.html
7. /home/node/.openclaw/workspace/public/privacy-policy.html
8. /home/node/.openclaw/workspace/public/product.html
9. /home/node/.openclaw/workspace/public/sign-csa.html
10. /home/node/.openclaw/workspace/public/sign-growth.html
11. /home/node/.openclaw/workspace/public/sign-scale.html
12. /home/node/.openclaw/workspace/public/sign-starter.html
13. /home/node/.openclaw/workspace/public/sign-trial.html
14. /home/node/.openclaw/workspace/public/terms-of-service.html

Only change the Contact footer column. Do NOT touch any other footer content. Preserve all other HTML exactly.

## 3. Update terms-of-service.html

After the first paragraph of the Terms content (before the "Your Responsibilities" section), add this block:

```html
<section style="background: var(--light-bg); padding: 32px 24px; border-radius: var(--radius-md); margin: 32px 0;">
  <h3 style="font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 16px;">Business Information</h3>
  <p style="color: var(--text-primary); margin-bottom: 8px;"><strong>Business Name:</strong> Qiyadon</p>
  <p style="color: var(--text-primary); margin-bottom: 8px;"><strong>Registered Address:</strong> 122. Street 65, F-11/4, Islamabad 44100, Pakistan</p>
  <p style="color: var(--text-primary); margin-bottom: 8px;"><strong>Support:</strong> <a href="mailto:contact@qiyadon.com">contact@qiyadon.com</a> or <a href="https://wa.me/923215139934" target="_blank" rel="noopener">+92 321 513 9934</a></p>
</section>
```

Do NOT rewrite the existing Terms content. Only add this block after the intro paragraph.

## 4. Update cancellation-refund-policy.html

In the "How to Cancel" section (or before the closing legal paragraph), add this block:

```html
<section style="background: var(--light-bg); padding: 32px 24px; border-radius: var(--radius-md); margin: 32px 0;">
  <h3 style="font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 16px;">Complaints & Disputes</h3>
  <p style="color: var(--text-primary); margin-bottom: 12px;">If you have a complaint or dispute, contact us through email or Phone / WhatsApp. We respond within 1 business day. Resolution is handled as quickly as reasonably possible depending on issue complexity.</p>
  <p style="color: var(--text-primary);">Email: <a href="mailto:contact@qiyadon.com">contact@qiyadon.com</a> · Phone/WhatsApp: <a href="https://wa.me/923215139934" target="_blank" rel="noopener">+92 321 513 9934</a></p>
</section>
```

After the complaints section, add this refund section near the bottom of the policy (before the closing legal paragraph):

```html
<section style="background: var(--light-bg); padding: 32px 24px; border-radius: var(--radius-md); margin: 32px 0;">
  <h3 style="font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 16px;">Refunds</h3>
  <p style="color: var(--text-primary); margin-bottom: 12px;">Refund eligibility is reviewed on a case-by-case basis. If a refund is approved, it will be processed within 7–10 business days of approval.</p>
  <p style="color: var(--text-primary);">Service dissatisfaction concerns may be submitted through <a href="mailto:contact@qiyadon.com">contact@qiyadon.com</a> or <a href="https://wa.me/923215139934" target="_blank" rel="noopener">+92 321 513 9934</a>.</p>
</section>
```

Do NOT rewrite the existing cancellation policy content. Only add these two blocks.

## Implementation Rules
- Read each existing file before modifying it
- Preserve all existing HTML, CSS, JS exactly
- Only add new content, do not remove existing content
- Use existing CSS variables (--navy, --teal, --gold, --slate, --text-primary, --white, --light-bg)
- The footer Contact column update is identical in all 14 files
- Mobile nav toggle JS is already in all pages via shared script.js

## Deployment
After all files are written, deploy to `/home/node/.openclaw/workspace/deploy/v2/` by copying all updated HTML files plus assets folder.

Create the deploy directory if it doesn't exist.