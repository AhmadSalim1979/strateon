/* Dental preview: mobile menu + informational booking dialog.
   No analytics, no network requests, no storage, no console logging.
   Without JavaScript the menu is always visible and every appointment
   link falls back to the Contact page's "Appointments" section. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('dp-js');

  // Mobile menu
  var nav = document.querySelector('[data-dp-nav]');
  var btn = document.querySelector('[data-dp-menu-btn]');
  if (nav && btn) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        btn.focus();
      }
    });
    window.matchMedia('(min-width: 981px)').addEventListener('change', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  // Booking dialog: appointments are not active on the preview, so every
  // "Request an appointment" action opens an explanation instead of a form.
  var dialog = document.getElementById('dp-booking-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var opener = null;
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-dp-booking]');
    if (!trigger) return;
    e.preventDefault();
    opener = trigger;
    if (nav && btn) { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    dialog.showModal();
  });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog || (e.target.closest && e.target.closest('[data-dp-dialog-close]'))) dialog.close();
  });
  dialog.addEventListener('close', function () {
    if (opener && document.contains(opener)) opener.focus();
  });
})();
