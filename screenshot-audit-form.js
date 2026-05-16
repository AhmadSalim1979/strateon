const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://qiyadon.com/pipeline-leak-audit', { waitUntil: 'networkidle', timeout: 30000 });

  // Force all fade-in elements to visible
  await page.evaluate(() => {
    document.querySelectorAll('.fade-in').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/screenshots/audit-form-desktop.png', fullPage: true });
  console.log('audit-form-desktop.png done');

  // Fill and submit the form (option values match text content)
  await page.fill('#name', 'Ahmad Salim Final Test');
  await page.fill('#company', 'Qiyadon Final Validation');
  await page.fill('#email', 'ahmad.salim@qiyadon.com');
  await page.fill('#phone', '+923215139934');
  await page.selectOption('#industry', { label: 'SaaS / Software' });
  await page.selectOption('#leads_per_month', { label: '50–100' });
  await page.selectOption('#close_rate', { label: '10–20%' });
  await page.selectOption('#crm', { label: 'HubSpot' });
  await page.fill('#challenge', 'Leads going dark after demo — end-to-end validation test');
  await page.selectOption('#followup_process', { label: 'We try to follow up but it\'s inconsistent' });
  await page.selectOption('#found_us', { label: 'LinkedIn' });
  await page.waitForTimeout(500);

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  // Check for success state
  const successVisible = await page.evaluate(() => {
    const success = document.querySelector('.success-state');
    return success ? getComputedStyle(success).display !== 'none' : false;
  });

  console.log('Success state visible:', successVisible);

  // Screenshot of result
  await page.screenshot({ path: 'public/screenshots/audit-form-success.png', fullPage: true });
  console.log('audit-form-success.png done');

  await browser.close();
  console.log('ALL DONE');
})();