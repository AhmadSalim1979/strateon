const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = '/home/node/.openclaw/workspace/public/visual-audit';

// Files to recapture (clean, full render)
const FILES = [
  { name: 'homepage-full.png', url: 'https://qiyadon.com', desktop: { width: 1440, height: 900 } },
  { name: 'hero-section-desktop.png', url: 'https://qiyadon.com', section: '#hero', desktop: { width: 1440, height: 900 } },
  { name: 'hero-section-mobile.png', url: 'https://qiyadon.com', section: '#hero', mobile: { width: 393, height: 852 } },
  { name: 'mobile-homepage-full.png', url: 'https://qiyadon.com', mobile: { width: 393, height: 852 } },
  { name: 'what-you-receive-desktop.png', url: 'https://qiyadon.com', section: '#operational-visibility', desktop: { width: 1440, height: 900 } },
  { name: 'what-you-receive-mobile.png', url: 'https://qiyadon.com', section: '#operational-visibility', mobile: { width: 393, height: 852 } },
  // Section-specific mobile captures to diagnose overlap issues
  { name: 'mobile-nav-header-area.png', url: 'https://qiyadon.com', section: 'header', mobile: { width: 393, height: 852 } },
  { name: 'mobile-how-it-works.png', url: 'https://qiyadon.com', section: '#how-it-works', mobile: { width: 393, height: 852 } },
  { name: 'mobile-is-this-for-you.png', url: 'https://qiyadon.com', section: '#is-this-for-you', mobile: { width: 393, height: 852 } },
  { name: 'mobile-pricing-full.png', url: 'https://qiyadon.com/pricing', mobile: { width: 393, height: 852 } },
  { name: 'mobile-audit-full.png', url: 'https://qiyadon.com/pipeline-leak-audit', mobile: { width: 393, height: 852 } },
];

async function capture(page, url, opts) {
  const { width, height } = opts;
  const isMobile = width < 500;
  await page.setViewportSize({ width, height });

  if (opts.section) {
    // Scroll to section element
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ behavior: 'instant' });
    }, opts.section);
    await page.waitForTimeout(800);
    // Capture viewport around section
    const el = await page.$(opts.section);
    if (el) {
      const box = await el.boundingBox();
      if (box) {
        await page.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height + 80) });
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }, opts.section);
        await page.waitForTimeout(400);
      }
    }
  } else {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (isMobile) {
      // Scroll to just below header to show real mobile rendering
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
    } else {
      await page.waitForTimeout(500);
    }
  }

  const buffer = await page.screenshot({ fullPage: !opts.section, captureBeyondViewport: true });
  return buffer;
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();

  for (const f of FILES) {
    const outPath = path.join(OUT_DIR, f.name);
    try {
      if (f.mobile) {
        const buf = await capture(page, f.url, f.mobile);
        fs.writeFileSync(outPath, buf);
      }
      if (f.desktop) {
        const buf = await capture(page, f.url, f.desktop);
        fs.writeFileSync(outPath, buf);
      }
      console.log('Captured:', f.name);
    } catch(e) {
      console.error('ERROR', f.name, ':', e.message);
    }
  }

  await browser.close();
  console.log('Done.');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });