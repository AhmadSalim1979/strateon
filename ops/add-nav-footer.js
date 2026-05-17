// Add nav + footer to sign-*.html pages
const fs = require('fs');
const path = require('path');

const NAV_HTML = `<!-- NAV -->
<nav id="navbar" style="position:fixed;top:0;left:0;right:0;background:rgba(15,13,14,0.96);backdrop-filter:blur(12px);z-index:1000;border-bottom:1px solid #333;">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:72px;display:flex;align-items:center;justify-content:space-between;gap:32px;">
    <a href="/" style="font-size:26px;font-weight:800;color:#e0e0e0;text-decoration:none;letter-spacing:-0.04em;display:flex;align-items:center;gap:10px;flex-shrink:0;">
      <img src="assets/qiyadon-kun-logo.jpg" alt="Qiyadon" style="height:36px;border-radius:6px;">
      <span style="color:#e0e0e0;">qiyadon</span>
    </a>
    <ul id="navLinks" style="display:flex;gap:28px;list-style:none;margin:0;">
      <li><a href="/#what-we-do" style="font-size:14px;font-weight:500;color:#888;text-decoration:none;">What We Do</a></li>
      <li><a href="/#how-it-works" style="font-size:14px;font-weight:500;color:#888;text-decoration:none;">How It Works</a></li>
      <li><a href="/pricing.html" style="font-size:14px;font-weight:500;color:#888;text-decoration:none;">Pricing</a></li>
      <li><a href="/#faq" style="font-size:14px;font-weight:500;color:#888;text-decoration:none;">FAQ</a></li>
    </ul>
    <button id="mobileToggle" aria-label="Toggle navigation" style="display:none;background:none;border:none;cursor:pointer;padding:8px;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
    </button>
    <a href="/sign-trial.html" style="background:#b81414;color:#fff;font-size:13px;font-weight:600;padding:9px 20px;border-radius:999px;text-decoration:none;flex-shrink:0;">Start Free Trial</a>
  </div>
</nav>`;

const FOOTER_HTML = `<footer style="background:linear-gradient(135deg,#0a0a0a 0%,#111 50%,#0a0a0a 100%);padding:48px 24px 28px;border-top:1px solid #333;margin-top:80px;">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:28px;padding-bottom:32px;border-bottom:1px solid #333;margin-bottom:20px;">
      <div>
        <h3 style="color:#fff;font-size:18px;margin-bottom:8px;">qiya<span style="color:#b81414;">d</span>on</h3>
        <p style="color:#666;font-size:13px;max-width:220px;line-height:1.5;">Done-for-you pipeline follow-up for founder-led SMBs.</p>
      </div>
      <div>
        <h4 style="color:#666;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Navigate</h4>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:8px;padding:0;margin:0;">
          <li><a href="/#what-we-do" style="color:#888;font-size:13px;text-decoration:none;">What We Do</a></li>
          <li><a href="/pricing.html" style="color:#888;font-size:13px;text-decoration:none;">Pricing</a></li>
          <li><a href="/#faq" style="color:#888;font-size:13px;text-decoration:none;">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4 style="color:#666;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Try It</h4>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:8px;padding:0;margin:0;">
          <li><a href="/sign-trial.html" style="color:#888;font-size:13px;text-decoration:none;">Start Free Trial</a></li>
        </ul>
      </div>
      <div>
        <h4 style="color:#666;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px;">Legal</h4>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:8px;padding:0;margin:0;">
          <li><a href="/privacy-policy.html" style="color:#888;font-size:13px;text-decoration:none;">Privacy Policy</a></li>
          <li><a href="/terms-of-service.html" style="color:#888;font-size:13px;text-decoration:none;">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <p style="color:#666;font-size:12px;margin:0;">&copy; 2026 Qiyadon. Pipeline execution that actually follows up.</p>
    </div>
  </div>
</footer>`;

const MOBILE_NAV_CSS = `
@media(max-width:600px){.nav-links{display:none;}.mobile-nav-toggle{display:flex!important;}.nav-cta{display:none!important;}.nav-links.active{display:flex!important;flex-direction:column;position:fixed;top:72px;left:0;right:0;background:rgba(15,13,14,0.98);padding:20px 24px;border-bottom:1px solid #333;gap:16px;}}`;

const MOBILE_NAV_JS = `const mobileToggle=document.getElementById('mobileToggle');const navLinks=document.getElementById('navLinks');if(mobileToggle&&navLinks){mobileToggle.addEventListener('click',()=>navLinks.classList.toggle('active'));}`;

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add mobile nav CSS if not present
  if (!content.includes('.mobile-nav-toggle')) {
    const styleEnd = content.indexOf('</style>');
    if (styleEnd !== -1) {
      content = content.slice(0, styleEnd) + '\n' + MOBILE_NAV_CSS + '\n    ' + content.slice(styleEnd);
    }
  }

  // Add nav before container
  if (!content.includes('id="navbar"')) {
    content = content.replace('<body>', '<body>\n' + NAV_HTML);
  }

  // Add footer at end before </body>
  if (!content.includes('<footer')) {
    content = content.replace('</body>', FOOTER_HTML + '\n</body>');
  }

  // Add mobile nav JS if not present
  if (!content.includes('mobileToggle')) {
    content = content.replace('</script>', MOBILE_NAV_JS + '\n  });\n  </script>');
  }

  fs.writeFileSync(filepath, content);
  console.log('Updated:', filepath);
}

const pages = [
  '/home/node/.openclaw/workspace/public/sign-starter.html',
  '/home/node/.openclaw/workspace/public/sign-growth.html',
  '/home/node/.openclaw/workspace/public/sign-scale.html',
  '/home/node/.openclaw/workspace/public/sign-csa.html',
];

pages.forEach(processFile);
console.log('Done.');