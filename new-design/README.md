# Qiyadon Homepage Redesign

This package contains a complete redesigned homepage for qiyadon.com.

## Files

- `index.html` — full homepage structure and content
- `styles.css` — complete visual system and responsive styling
- `script.js` — mobile navigation toggle

## Design Requirements Implemented

- Same Qiyadon red/black/white color scheme
- Same core homepage content and service positioning
- No large logo/banner artwork
- Code-generated cinematic hero background
- Alternating dark/light section rhythm
- Premium card system
- Larger, more readable typography
- Conversion-focused CTA placement
- Mobile responsive layout

## Implementation Notes for MOOSA

Integrate this design into the current site rather than pasting it as a separate orphan page.

Recommended mapping:

- Header/nav → existing site header component
- Hero → homepage hero component
- Reusable section classes → global CSS
- Cards/timeline/pricing/FAQ → homepage sections
- Keep existing live routes:
  - `/pipeline-leak-audit`
  - `/pricing`
  - `/sign-trial`
  - `/privacy-policy`
  - `/terms-of-service`

If the current project is React/Next/Vite, convert the HTML sections into JSX and move CSS into the existing global stylesheet or module system.

Critical:
Do not reintroduce large Qiyadon logo/banner images into the homepage body.
