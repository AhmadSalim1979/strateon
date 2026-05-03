# STRATEON — CANONICAL BRAND COLOR PALETTE
## Version 1.0 | ✅ APPROVED | 2026-04-26

**Document Owner:** CMO (Moosa)  
**Status:** APPROVED — MANDATORY REFERENCE

---

## 🎨 PRIMARY PALETTE

### Qiyadon Navy
```
#0A1628
```
**Use:** Primary brand background, headers, logo wordmark on light backgrounds.  
**Do NOT use for:** Large decorative blocks of Electric Blue. Navy is for dominance, not decoration.

---

### Qiyadon Electric Blue
```
#2563EB
```
**Use:** CTAs, buttons, links, hover states, icon accents, progress indicators.  
**Never use as:** A large background area. Reserve for accents, not blocks.  
**Contrast:** Passes WCAG AA on white (`#FFFFFF`). Does NOT pass WCAG AAA on white — do not use for body text.

---

### Qiyadon White
```
#FFFFFF
```
**Use:** Reversed text on dark backgrounds, white sections, white cards.  
**Do NOT use for:** Large backgrounds next to Gold (fails contrast).

---

### Qiyadon Off-White
```
#F8FAFC
```
**Use:** Light page backgrounds, card backgrounds, alternating row backgrounds.  
**Note:** Very slightly cool-toned. Do not substitute `#F5F5F5` or `#FAFAFA`.

---

## 🌫️ SECONDARY PALETTE

### Qiyadon Gold (Accent)
```
#F59E0B
```
**Use:** Premium badges, achievement indicators, star ratings, rare accent moments.  
**Never use next to:** Off-White (`#F8FAFC`) for large areas — contrast fails.  
**Never use for:** Body text, large backgrounds, primary CTAs.

---

### Qiyadon Slate
```
#64748B
```
**Use:** Body text on light backgrounds, subtitles, secondary labels, captions.  
**Never use for:** Primary headings, CTAs, or on dark backgrounds (use White instead).

---

### Qiyadon Border Gray
```
#E2E8F0
```
**Use:** Card borders, dividers, input field borders, table row separators.  
**Never use for:** Backgrounds or text.

---

### Qiyadon Dark Slate
```
#1E293B
```
**Use:** Secondary dark backgrounds (dark cards, dark sections), sidebar backgrounds in dark-mode UI.

---

## 🔠 ACCESSIBILITY

| Color Pair | Contrast Ratio | WCAG Level | Usable For |
|------------|---------------|------------|------------|
| Navy `#0A1628` + White `#FFFFFF` | 18.3:1 | AAA | All text sizes |
| Navy `#0A1628` + Off-White `#F8FAFC` | 16.6:1 | AAA | All text sizes |
| Electric Blue `#2563EB` + White `#FFFFFF` | 4.6:1 | AA | Large text (18px+), UI components |
| Electric Blue `#2563EB` + Off-White `#F8FAFC` | 4.2:1 | AA | Large text (18px+), UI components |
| Slate `#64748B` + White `#FFFFFF` | 5.9:1 | AA | Body text |
| Gold `#F59E0B` + Navy `#0A1628` | 8.2:1 | AAA | Small text and large text |
| Gold `#F59E0B` + White `#FFFFFF` | 1.6:1 | Fail | ❌ Do not use |
| Slate `#64748B` + Off-White `#F8FAFC` | 2.8:1 | Fail | ❌ Do not use |

---

## 📐 CSS CUSTOM PROPERTIES

```css
:root {
  /* Primary */
  --color-navy:          #0A1628;
  --color-electric-blue: #2563EB;
  --color-white:         #FFFFFF;
  --color-off-white:     #F8FAFC;

  /* Secondary */
  --color-gold:          #F59E0B;
  --color-slate:         #64748B;
  --color-border:        #E2E8F0;
  --color-dark-slate:    #1E293B;
}
```

---

## 🚫 NEVER USE THESE COLORS

These colors are NOT part of the Qiyadon palette. Do not introduce them into any brand application:

| Prohibited Color | Hex | Reason |
|------------------|-----|--------|
| Pure Black | `#000000` | Too harsh — use Navy instead |
| Light Gray | `#CCCCCC` | Use Off-White or Border Gray |
| Bright Red | `#FF0000` | Not in palette — no emergency colors in brand |
| Bright Green | `#00FF00` | Not in palette — use Electric Blue |
| Orange | `#FF6600` | Not approved — use Gold |

---

## ✅ REVISION LOG

| Date | Version | Change |
|------|---------|--------|
| 2026-04-26 | 1.0 | Initial palette approved |

---

*This file is the canonical color reference. All other documents must reference this file. Maintained by CMO.*
