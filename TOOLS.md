# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### Visual Audit / Screenshot Tooling

**Playwright** is installed locally in the workspace (`node_modules/playwright`) and is part of the permanent operational stack.

### Standard Visual Validation Workflow

1. **Capture** — Use `playwright` (Chromium headless) to capture rendered websites
2. **Viewport targets:**
   - Desktop: `1440×900`
   - Mobile: `393×852` (iPhone 14 Pro equivalent)
3. **Export to:** `public/visual-audit/` — auto-served at `/visual-audit/` on qiyadon.com
4. **Naming convention:**
   ```
   homepage-full.png
   hero-section-desktop.png / hero-section-mobile.png
   what-you-receive-desktop.png / what-you-receive-mobile.png
   pricing-full.png / mobile-pricing-full.png
   audit-full.png / mobile-audit-full.png
   mid-scroll-desktop.png
   footer-desktop.png
   homepage-mid-scroll-full.png
   ```
5. **Verify public access** after export:
   ```bash
   curl -I https://qiyadon.com/visual-audit/<filename>
   # Expect: HTTP 200 + content-type: image/png
   ```

### When to Use

- Deployment QA (after every push)
- CRO / UX review
- Mobile validation
- Visual regression checking
- Homepage optimization workflows
- Before/after comparison exports

### Screenshot Capture Scripts

- `visual-audit/capture-screenshots.js` — full-page captures (desktop + mobile, all pages)
- `visual-audit/capture-sections.js` — section-isolated captures

### Deployment QA Check

After every significant deployment, run both capture scripts and verify all screenshots return HTTP 200 before reporting completion.

## SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
