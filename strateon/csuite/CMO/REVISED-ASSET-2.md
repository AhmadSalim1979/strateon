# STRATEON CMO — REVISED ASSET PROMPT
## Asset Type: Icon/Favicon (16×16, 32×32, 64×64)
## Issue: Previous version too complex for small-scale rendering

---

## 🎯 OBJECTIVE

Design a **minimalist hexagonal favicon** for Qiyadon, optimized for pixel-perfect legibility at **16×16, 32×32, and 64×64 pixels**. The icon must communicate brand identity through extreme simplification — no fine details, no gradients, no thin lines. Think bold, chunky, iconic.

---

## 🎨 CANONICAL PALETTE

| Role | Color | Hex |
|---|---|---|
| Background / Fill | Navy | `#0B1F3A` |
| Accent / Line | Teal | `#00C2CB` |

---

## ✅ WHAT TO BUILD

**A solid-navy hexagon** with a **stylized "S"** formed by negative space or a thick teal stroke cut through it. That's it.

**Three acceptable approaches:**

### Option A — Negative Space S
A navy hexagon with the letter **"S"** literally cut out (showing the white/light background through it). The S should be drawn with **no more than 4–6 straight line segments** — essentially a bold, angular S shape.

### Option B — Teal S Overlay
A **teal "S"** rendered as a single thick monoline or double-stroke shape, placed centrally on the navy hexagon. The S should be constructed from **no more than 3–4 line segments** (two vertical descenders + one or two horizontal crossbars).

### Option C — Sliced Hexagon
A navy hexagon split into two halves by a **diagonal or zigzag teal line** that visually reads as an abstract "S" — the hexagon itself becomes the S through color division. Maximum **2–3 shapes total**.

---

## 📝 EXACT CHATGPT / DALL·E PROMPT

> **Copy and paste this exactly:**

```
Design a minimalist app icon for a company called Qiyadon.

RULES (follow these strictly):
- The icon must fit inside a hexagonal shape
- Only TWO colors: navy (#0B1F3A) and teal (#00C2CB)
- The letter "S" must be the central motif, simplified to its essence
- NO gradients, NO shadows, NO fine details
- NO curves — use only straight lines and 45° or 90° angles
- Lines and shapes must be THICK (minimum 2px stroke at icon base size)
- The "S" must be readable when the icon is only 16x16 pixels
- Style: bold geometric, flat design, tech/fint

Show me THREE variations side by side, all on a WHITE background.
Each variation should be labeled: Option A (Negative Space S), Option B (Teal S Overlay), Option C (Sliced Hexagon).
```

---

## 🌊 NANOBANANA / MIDJOURNEY / FIREFLY VERSION

*(For teams using NanoBanana or other image gen tools that prefer ultra-condensed prompts)*

```
minimalist hexagonal icon, navy #0B1F3A background, teal #00C2CB S letter in center, flat design, no gradients, no shadows, bold straight lines only, angular S shape, legible at 16x16px, tech company logo style --ar 1:1 --v 6
```

---

## 🚫 WHAT TO AVOID

| ❌ AVOID | ✅ INSTEAD |
|---|---|
| Curved S letters (serifs, calligraphic) | Angular, blocky S built from straight lines |
| Thin strokes (< 2px at base) | Thick, chunky strokes |
| Multiple shades or gradients | Flat solid fills only |
| Rounded corners on the hexagon | Sharp, crisp hexagon vertices |
| Internal details, dots, accents | One clean motif only |
| Teal fill with navy S (inverted) | Navy fill dominant, teal as accent only |
| More than 2–3 distinct shapes | Absolute minimum geometry |
| Text labels or wordmarks inside | Symbol only, no text |

---

## 🔬 SCALE TESTING NOTES

**Test at these exact sizes in your design tool:**

- [ ] **64×64** — Does the S read clearly? Does the hexagon feel bold, not busy?
- [ ] **32×32** — Does anything disappear or become mud?
- [ ] **16×16** — Does the S still read as an S, or does it become a blob? Can you distinguish it from a plain hexagon?
- [ ] **Favicon test** — Open in a browser tab as a favicon. Does it hold up at 16×16 in Chrome tab?
- [ ] **Retina / @2x** — At 32×32 on a retina screen (renders as 64 physical pixels), does it still look bold?
- [ ] **Dark background** — Test on both white AND dark backgrounds. Does it pop?

**Passing criteria:** If the icon passes 16×16 with no ambiguity about the "S" shape, it's ready.

---

## 📦 DELIVERABLES

When this prompt generates satisfactory outputs, request:
1. **SVG** (vector, infinitely scalable — this is mandatory)
2. **PNG at 16×16, 32×32, 64×64, 128×128, 256×256**
3. **ICO file** (multi-resolution Windows favicon)
4. **ICNS** (multi-resolution macOS app icon)

**Filename convention:** `strateon-icon-[variant]-[size].png`
**Example:** `strateon-icon-optionA-32x32.png`

---

*Prepared by: Chief Marketing Officer, Qiyadon*
*Date: 2026-04-26*
*Version: 2 — Small-Scale Optimized*
