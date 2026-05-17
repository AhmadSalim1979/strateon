// Add canonical tags to all marketing pages
const fs = require('fs');

const pages = {
  'pipeline-leak-audit.html': 'https://qiyadon.com/pipeline-leak-audit.html',
  'privacy-policy.html': 'https://qiyadon.com/privacy-policy.html',
  'terms-of-service.html': 'https://qiyadon.com/terms-of-service.html',
  'ownership-statement.html': 'https://qiyadon.com/ownership-statement.html',
  'cancellation-refund-policy.html': 'https://qiyadon.com/cancellation-refund-policy.html',
  'sign-trial.html': 'https://qiyadon.com/sign-trial.html',
  'sign-starter.html': 'https://qiyadon.com/sign-starter.html',
  'sign-growth.html': 'https://qiyadon.com/sign-growth.html',
  'sign-scale.html': 'https://qiyadon.com/sign-scale.html',
  'sign-csa.html': 'https://qiyadon.com/sign-csa.html',
  'dashboard.html': 'https://qiyadon.com/dashboard.html',
  'product.html': 'https://qiyadon.com/product.html',
};

const dir = '/home/node/.openclaw/workspace/public';

Object.entries(pages).forEach(([filename, canonicalUrl]) => {
  const filepath = `${dir}/${filename}`;
  if (!fs.existsSync(filepath)) { console.log('MISSING:', filename); return; }

  let content = fs.readFileSync(filepath, 'utf8');

  // Skip if already has canonical
  if (content.includes('rel="canonical"')) { console.log('SKIP:', filename); return; }

  // Find the </head> tag and insert canonical before it
  if (content.includes('</head>')) {
    content = content.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}">\n</head>`);
    fs.writeFileSync(filepath, content);
    console.log('ADDED:', filename, '->', canonicalUrl);
  } else {
    console.log('NO HEAD:', filename);
  }
});

console.log('Done.');