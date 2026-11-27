/**
 * Anabolic Pharmacy AU — motion / preview chrome (static mirror)
 * Cart, checkout, and account are non-functional in this preview.
 */
(function () {
  'use strict';

  const styleEl = document.createElement('style');
  styleEl.id = 'ap-motion-runtime';
  styleEl.textContent = `
    .ap-reveal { opacity: 0; transform: translateY(24px); transition: opacity .65s ease, transform .65s ease; }
    .ap-reveal.ap-visible { opacity: 1; transform: none; }
    #ap-hero {
      position: relative; overflow: hidden;
      background: linear-gradient(135deg, #0e1a14 0%, #1a3a2a 50%, #0e1a14 100%);
      color: #f5f7f5; padding: 3.25rem 1.5rem 3rem; text-align: center;
    }
    #ap-hero .ap-hero-title { font-family: Georgia, serif; font-size: clamp(1.6rem, 4vw, 2.6rem); margin: .4rem 0; }
    #ap-hero .ap-hero-sub { max-width: 36rem; margin: 0 auto 1rem; opacity: .9; }
    #ap-hero .ap-hero-eyebrow { color: #c4a35a; letter-spacing: .08em; text-transform: uppercase; font-size: .75rem; }
    #ap-hero .ap-btn { display: inline-block; margin: .35rem; padding: .65rem 1.1rem; border: 1px solid #c4a35a; color: #f5f7f5; text-decoration: none; }
    #ap-hero .ap-btn-gold { background: #c4a35a; color: #0e1a14; }
    #ap-preview-note {
      background: #142018; color: #d7e0d9; text-align: center;
      padding: .55rem 1rem; font-size: .85rem; border-bottom: 1px solid rgba(196,163,90,.35);
    }
    #ap-footer-brand img { max-width: 160px; height: auto; }
    #ap-footer-tagline { opacity: .85; font-size: .9rem; }
  `;
  document.head.appendChild(styleEl);

  function previewBanner() {
    if (document.getElementById('ap-preview-note')) return;
    var note = document.createElement('div');
    note.id = 'ap-preview-note';
    note.textContent = 'Static preview — browsing only. Cart, checkout, account, and contact submit are disabled.';
    document.body.insertBefore(note, document.body.firstChild);
  }

  function buildHero() {
    var hero = document.querySelector('.elementor-element-e910896');
    if (!hero || document.getElementById('ap-hero')) return;
    hero.innerHTML =
      '<section id="ap-hero">' +
      '<span class="ap-hero-eyebrow">Static storefront preview</span>' +
      '<h1 class="ap-hero-title">Anabolic Pharmacy AU</h1>' +
      '<p class="ap-hero-sub">Browse categories and product pages from this mirrored catalog. Purchases and account actions are not available here.</p>' +
      '<div class="ap-hero-cta">' +
      '<a href="/shop/" class="ap-btn ap-btn-gold">Browse the catalog</a>' +
      '<a href="/product-category/peptides/" class="ap-btn">Explore peptides</a>' +
      '</div></section>';
  }

  function upgradeFooter() {
    var col1 = document.querySelector('.footer-column-1');
    if (!col1 || document.getElementById('ap-footer-brand')) return;
    var brand = document.createElement('div');
    brand.id = 'ap-footer-brand';
    brand.innerHTML =
      '<img src="/wp-content/uploads/anabolicpharmacyau-logo.svg" alt="Anabolic Pharmacy AU" width="160" height="auto" loading="lazy">' +
      '<p id="ap-footer-tagline">Static catalog preview for design review. Commerce features are intentionally disabled.</p>';
    col1.insertBefore(brand, col1.firstChild);
  }

  function applyReveal() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('ap-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.products .product, li.product, .elementor-heading-title').forEach(function (el, i) {
      if (i > 48) return;
      el.classList.add('ap-reveal');
      io.observe(el);
    });
  }

  function blockCommerceClicks() {
    document.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest && ev.target.closest('a, button');
      if (!t) return;
      var href = (t.getAttribute('href') || '').toLowerCase();
      var cls = (t.className || '').toString().toLowerCase();
      if (cls.indexOf('add_to_cart') >= 0 || cls.indexOf('checkout') >= 0 || href.indexOf('add-to-cart') >= 0) {
        ev.preventDefault();
        ev.stopPropagation();
        alert('Static preview — cart and checkout are disabled.');
      }
    }, true);
  }

  function init() {
    previewBanner();
    buildHero();
    upgradeFooter();
    applyReveal();
    blockCommerceClicks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
