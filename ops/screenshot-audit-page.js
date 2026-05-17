const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTDIR = '/home/node/.openclaw/workspace/public/screenshots/post-p4-audit';
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

const ANIMATION_DISABLE_CSS = `
  .fade-in { opacity: 1 !important; transform: none !important; transition: none !important; }
  * { animation: none !important; transition-duration: 0s !important; }
`;

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // Desktop above-fold (viewport top portion)
  let page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.screenshot({ path: path.join(OUTDIR, 'desktop-above-fold.png'), fullPage: false, type: 'png' });
  console.log('✓ desktop-above-fold.png');
  await page.close();

  // Desktop full page
  page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: path.join(OUTDIR, 'desktop-fullpage.png'), fullPage: true, type: 'png' });
  console.log('✓ desktop-fullpage.png');
  await page.close();

  // Desktop form interaction (scroll to form)
  page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => {
    const form = document.getElementById('auditForm');
    if (form) form.scrollIntoView({ behavior: 'instant' });
    window.scrollBy(0, -100);
  });
  await page.screenshot({ path: path.join(OUTDIR, 'desktop-form-section.png'), fullPage: false, type: 'png' });
  console.log('✓ desktop-form-section.png');
  await page.close();

  // Mobile above-fold
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.screenshot({ path: path.join(OUTDIR, 'mobile-above-fold.png'), fullPage: false, type: 'png' });
  console.log('✓ mobile-above-fold.png');
  await page.close();

  // Mobile full page
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.screenshot({ path: path.join(OUTDIR, 'mobile-fullpage.png'), fullPage: true, type: 'png' });
  console.log('✓ mobile-fullpage.png');
  await page.close();

  // Mobile form interaction
  page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  await page.evaluate(() => {
    const form = document.getElementById('auditForm');
    if (form) form.scrollIntoView({ behavior: 'instant' });
    window.scrollBy(0, -200);
  });
  await page.screenshot({ path: path.join(OUTDIR, 'mobile-form-section.png'), fullPage: false, type: 'png' });
  console.log('✓ mobile-form-section.png');
  await page.close();

  // Success state simulation (desktop)
  page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('https://qiyadon.com/pipeline-leak-audit.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.addStyleTag({ content: ANIMATION_DISABLE_CSS });
  // Show success state via JS
  await page.evaluate(() => {
    document.getElementById('auditForm').style.display = 'none';
    document.getElementById('successState').style.display = 'block';
  });
  await page.screenshot({ path: path.join(OUTDIR, 'desktop-success-state.png'), fullPage: false, type: 'png' });
  console.log('✓ desktop-success-state.png');
  await page.close();

  await browser.close();
  console.log('\nAll audit page screenshots captured.');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });