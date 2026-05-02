const toggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Billing toggle
const billingToggle = document.getElementById('billingToggle');
const toggleTrack = document.getElementById('toggleTrack');
const toggleThumb = document.getElementById('toggleThumb');
const labels = billingToggle ? billingToggle.querySelectorAll('.billing-label') : [];
const cards = document.querySelectorAll('.price-card');

function updateBilling(isAnnual) {
  if (isAnnual) {
    toggleTrack.classList.add('annual');
    labels.forEach(l => l.classList.toggle('active', l.dataset.billing === 'annual'));
    cards.forEach(card => {
      const monthly = card.dataset.monthly;
      const annual = card.dataset.annual;
      if (monthly && annual) {
        const p = card.querySelector('.price-amount');
        const strong = p.querySelector('strong');
        strong.textContent = '$' + annual;
      }
    });
  } else {
    toggleTrack.classList.remove('annual');
    labels.forEach(l => l.classList.toggle('active', l.dataset.billing === 'monthly'));
    cards.forEach(card => {
      const monthly = card.dataset.monthly;
      if (monthly) {
        const p = card.querySelector('.price-amount');
        const strong = p.querySelector('strong');
        strong.textContent = '$' + monthly;
      }
    });
  }
}

labels.forEach(label => {
  label.addEventListener('click', () => {
    updateBilling(label.dataset.billing === 'annual');
  });
});

toggleTrack.addEventListener('click', () => {
  const isAnnual = toggleTrack.classList.contains('annual');
  updateBilling(!isAnnual);
});
