const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = '/home/node/.openclaw/workspace/visual-audit';

// Pages to capture
const DESKTOP_PAGES = [
  { name: 'homepage-full', url: 'https://qiyadon.com', sections: null },
  { name: 'pricing-full', url: 'https://qiyadon.com/pricing', sections: null },
  { name: 'audit-full', url: 'https://qiyadon.com/pipeline-leak-audit', sections: null },
];

// Mobile pages
const MOBILE_PAGES = [
  { name: 'mobile-homepage-full', url: 'https://qiyadon.com', sections: null },
  { name: 'mobile-pricing-full', url: 'https://qiyadon.com/pricing', sections: null },
  { name: 'mobile-audit-full', url: 'https://qiyadon.com/pipeline-leak-audit', sections: null },
];

async function capturePage(browser, url, outputPath, viewport) {
  const page = await browser.newPage();
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: outputPath, fullPage: true });
  await page.close();
  return outputPath;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // Desktop
  for (const p of DESKTOP_PAGES) {
    const out = path.join(OUT_DIR, p.name + '.png');
    await capturePage(browser, p.url, out, { width: 1440, height: 900 });
    console.log('Captured (desktop):', p.name);
  }

  // Mobile
  for (const p of MOBILE_PAGES) {
    const out = path.join(OUT_DIR, p.name + '.png');
    await capturePage(browser, p.url, out, { width: 393, height: 852 }); // iPhone 14 Pro
    console.log('Captured (mobile):', p.name);
  }

  await browser.close();
  console.log('Done. All screenshots in', OUT_DIR);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });