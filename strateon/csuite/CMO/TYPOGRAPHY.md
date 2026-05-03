# STRATEON — TYPOGRAPHY SYSTEM
## Version 1.0 | ✅ APPROVED | 2026-04-26

**Document Owner:** CMO (Moosa)  
**Status:** APPROVED — MANDATORY REFERENCE

---

## 📋 OVERVIEW

Qiyadon's typography is built entirely on **Inter** — a variable font from Google Fonts. No other typeface is approved for brand use without explicit CMO sign-off.

**Why Inter?**  
Clean, highly legible, professional, and available in a variable font format that allows precise weight control. It is the standard for modern SaaS and fintech brands.

---

## 🔤 PRIMARY TYPEFACE: INTER

### Weights in Use

| Weight Name | CSS Value | Usage |
|-------------|-----------|-------|
| Inter Light | 300 | ❌ NOT APPROVED — avoid |
| Inter Regular | 400 | Body text, descriptions |
| Inter Medium | 500 | Labels, captions, secondary UI |
| Inter SemiBold | 600 | Sub-headings, emphasis |
| Inter Bold | 700 | H3, H4, section sub-headers |
| Inter ExtraBold | 800 | H1, H2, hero headlines, logo wordmark |
| Inter Black | 900 | ❌ NOT APPROVED — too heavy for brand |

---

## 📏 TYPE SCALE

### Desktop Scale

| Level | Element | Font | Weight | Size | Line Height | Letter Spacing | Use |
|-------|---------|------|--------|------|-------------|----------------|-----|
| `--text-hero` | Hero H1 | Inter | 800 | 56px | 1.1 | -0.03em | Main headline on hero sections |
| `--text-h1` | H1 | Inter | 800 | 48px | 1.1 | -0.02em | Page titles |
| `--text-h2` | H2 | Inter | 700 | 40px | 1.2 | -0.02em | Section headers |
| `--text-h3` | H3 | Inter | 700 | 28px | 1.3 | -0.01em | Sub-section headers |
| `--text-h4` | H4 | Inter | 600 | 20px | 1.4 | 0em | Card titles, product feature labels |
| `--text-body-lg` | Body Large | Inter | 400 | 18px | 1.6 | 0em | Lead paragraphs, introductory text |
| `--text-body` | Body | Inter | 400 | 16px | 1.6 | 0em | Standard body copy |
| `--text-body-sm` | Body Small | Inter | 400 | 14px | 1.5 | 0em | Secondary body text, footnotes |
| `--text-caption` | Caption | Inter | 500 | 13px | 1.4 | 0em | Captions under images, metadata |
| `--text-label` | Label | Inter | 600 | 12px | 1.2 | 0.06em | Small UI labels, tabs |
| `--text-overline` | Overline | Inter | 600 | 11px | 1.2 | 0.12em | ALL CAPS, tracked — section category labels |

---

### Mobile Scale

Multiply desktop sizes by 0.85 for mobile (≤768px).

| Level | Size (Mobile) | Line Height |
|-------|---------------|-------------|
| Hero H1 | 40px | 1.1 |
| H1 | 36px | 1.1 |
| H2 | 28px | 1.2 |
| H3 | 22px | 1.3 |
| H4 | 18px | 1.4 |
| Body | 15px | 1.6 |

---

## 🎛️ TYPE TREATMENT RULES

### Headlines
- **Always:** Tight letter spacing (-0.02em to -0.03em). This gives headlines a premium, tight feel.
- **Never:** Loose tracking on headlines. Never use full caps for H1/H2 (use Inter 800, not "STRATEON").

### Body Text
- **Always:** Normal letter spacing (0em). Comfortable reading.
- **Paragraph spacing:** 1.5× the line height between paragraphs.

### Labels and Overlines
- **Always:** Uppercase + tracked (+0.08em to +0.12em). These are visual labels, not sentences.
- **Never:** Use overlines for body content. Keep them short (1–3 words max).

### Numerals
- Use Inter's tabular numerals (`font-variant-numeric: tabular-nums`) for data, statistics, and financial figures.
- For large hero statistics: Inter 800, oversized (72px+), tight tracking.

---

## 🚫 PROHIBITED TYPE TREATMENTS

| Treatment | Why Prohibited |
|-----------|----------------|
| Times New Roman | Dated, unprofessional for tech brand |
| Arial / Helvetica | Generic, overused |
| Comic Sans | Unprofessional |
| Papyrus | Unprofessional |
| All-caps body text | Hard to read, poor accessibility |
| Italics for emphasis | Use SemiBold instead — italics reduce legibility in UI |
| Underlines (non-link) | Implies hyperlink — use SemiBold for emphasis |
| Text shadows | Adds noise, not in brand |
| Gradient text | Not approved — flat colors only |

---

## 🔗 WEB IMPLEMENTATION

### Google Fonts Import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### CSS Variables
```css
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  --text-hero:    800 56px/1.1   var(--font-family);
  --text-h1:      800 48px/1.1   var(--font-family);
  --text-h2:      700 40px/1.2   var(--font-family);
  --text-h3:      700 28px/1.3   var(--font-family);
  --text-h4:      600 20px/1.4   var(--font-family);
  --text-body-lg: 400 18px/1.6   var(--font-family);
  --text-body:    400 16px/1.6   var(--font-family);
  --text-caption: 500 13px/1.4   var(--font-family);
  --text-overline: 600 11px/1.2  var(--font-family);
  --text-letter-spacing-overline: 0.12em;
}
```

---

## 📄 PRINT TYPOGRAPHY NOTES

- For print: Use Inter from Adobe Fonts (licensed) or the desktop font files.
- Minimum body text size in print: 9pt.
- Line length: 60–75 characters (2.5–3× the alphabet) for comfortable reading.
- Never use Inter below 6pt for any reason.

---

## ✅ REVISION LOG

| Date | Version | Change |
|------|---------|--------|
| 2026-04-26 | 1.0 | Initial typography system approved |

---

*This file is the canonical typography reference. All other documents must reference this file. Maintained by CMO.*
