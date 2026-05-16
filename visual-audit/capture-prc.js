const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = '/home/node/.openclaw/workspace/public/visual-audit';

const FILES = [
  { name: 'mobile-pipeline-reality-check.png', url: 'https://qiyadon.com', section: '#pipeline-reality-check', mobile: { width: 393, height: 852 } },
  { name: 'desktop-pipeline-reality-check.png', url: 'https://qiyadon.com', section: '#pipeline-reality-check', desktop: { width: 1440, height: 900 } },
  { name: 'mobile-homepage-full-v3.png', url: 'https://qiyadon.com', mobile: { width: 393, height: 852 } },
];

async function capture(page, url, opts) {
  await page.setViewportSize({ width: opts.width, height: opts.height });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  if (opts.section) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, opts.section);
    await page.waitForTimeout(800);
    const box = await page.$(opts.section);
    if (box) {
      const b = await box.boundingBox();
      if (b && b.height > 0) {
        await page.setViewportSize({ width: Math.ceil(b.width), height: Math.ceil(b.height + 80) });
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }, opts.section);
        await page.waitForTimeout(300);
      }
    }
  }
  return page.screenshot({ fullPage: !opts.section });
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  for (const f of FILES) {
    const outPath = path.join(OUT_DIR, f.name);
    try {
      const buf = await capture(page, f.url, f.mobile || f.desktop);
      fs.writeFileSync(outPath, buf);
      console.log('Captured:', f.name, '(' + Math.round(buf.length/1024) + 'KB)');
    } catch(e) {
      console.error('ERROR', f.name, ':', e.message);
    }
  }
  await browser.close();
  console.log('Done.');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });