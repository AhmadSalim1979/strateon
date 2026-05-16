const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = '/home/node/.openclaw/workspace/visual-audit';

async function captureSection(browser, url, selector, outputPath, viewport) {
  const page = await browser.newPage();
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView();
  }, selector);
  await page.waitForTimeout(500);
  const screenshot = await page.screenshot({ fullPage: false });
  // Crop to element
  const element = await page.$(selector);
  let buffer;
  if (element) {
    const box = await element.boundingBox();
    await page.setViewportSize({ width: Math.ceil(box.width), height: Math.ceil(box.height) });
    buffer = await page.screenshot({ fullPage: false });
  } else {
    buffer = await page.screenshot({ fullPage: false });
  }
  fs.writeFileSync(outputPath, buffer);
  await page.close();
  return outputPath;
}

async function captureViewport(browser, url, outputPath, viewport, scrollDelay) {
  const page = await browser.newPage();
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(scrollDelay || 1000);
  await page.screenshot({ path: outputPath, fullPage: true });
  await page.close();
  return outputPath;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // Hero section — desktop
  const heroDesktopPath = path.join(OUT_DIR, 'hero-section-desktop.png');
  await captureSection(browser, 'https://qiyadon.com', '#hero', heroDesktopPath, { width: 1440, height: 900 });
  console.log('Captured: hero-section-desktop.png');

  // Hero section — mobile
  const heroMobilePath = path.join(OUT_DIR, 'hero-section-mobile.png');
  await captureSection(browser, 'https://qiyadon.com', '#hero', heroMobilePath, { width: 393, height: 852 });
  console.log('Captured: hero-section-mobile.png');

  // What you receive section — desktop
  const whatDesktopPath = path.join(OUT_DIR, 'what-you-receive-desktop.png');
  await captureSection(browser, 'https://qiyadon.com', '#operational-visibility', whatDesktopPath, { width: 1440, height: 900 });
  console.log('Captured: what-you-receive-desktop.png');

  // What you receive section — mobile
  const whatMobilePath = path.join(OUT_DIR, 'what-you-receive-mobile.png');
  await captureSection(browser, 'https://qiyadon.com', '#operational-visibility', whatMobilePath, { width: 393, height: 852 });
  console.log('Captured: what-you-receive-mobile.png');

  // Mid-scroll state — desktop (how-it-works)
  const midDesktopPath = path.join(OUT_DIR, 'mid-scroll-desktop.png');
  await captureSection(browser, 'https://qiyadon.com', '#how-it-works', midDesktopPath, { width: 1440, height: 900 });
  console.log('Captured: mid-scroll-desktop.png');

  // Footer area — desktop
  const footerDesktopPath = path.join(OUT_DIR, 'footer-desktop.png');
  await captureSection(browser, 'https://qiyadon.com', 'footer', footerDesktopPath, { width: 1440, height: 900 });
  console.log('Captured: footer-desktop.png');

  // Homepage mid-scroll — full page at how-it-works
  const midFullPath = path.join(OUT_DIR, 'homepage-mid-scroll-full.png');
  await captureViewport(browser, 'https://qiyadon.com#how-it-works', midFullPath, { width: 1440, height: 900 }, 1500);
  console.log('Captured: homepage-mid-scroll-full.png');

  await browser.close();
  console.log('Done.');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });