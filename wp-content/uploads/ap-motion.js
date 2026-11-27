/**
 * Anabolic Pharmacy AU — Premium Motion Effects
 * Scroll-triggered + hero animations (no jQuery)
 */
(function () {
  'use strict';

  /* ─── 1. CSS KEYFRAMES injected at runtime ─────────────────────────────── */
  const styleEl = document.createElement('style');
  styleEl.id = 'ap-motion-runtime';
  styleEl.textContent = `
    /* Base hidden state for scroll-reveal elements */
    .ap-reveal {
      opacity: 0;
      transform: translateY(36px);
      transition: opacity 0.65s cubic-bezier(.22,.68,0,1.2),
                  transform 0.65s cubic-bezier(.22,.68,0,1.2);
    }
    .ap-reveal.ap-from-left  { transform: translateX(-40px); }
    .ap-reveal.ap-from-right { transform: translateX(40px);  }
    .ap-reveal.ap-scale-in   { transform: scale(0.88);       }

    .ap-reveal.ap-visible {
      opacity: 1;
      transform: translateY(0) translateX(0) scale(1);
    }

    /* Stagger children */
    .ap-stagger .ap-reveal:nth-child(1)  { transition-delay: 0.05s; }
    .ap-stagger .ap-reveal:nth-child(2)  { transition-delay: 0.13s; }
    .ap-stagger .ap-reveal:nth-child(3)  { transition-delay: 0.21s; }
    .ap-stagger .ap-reveal:nth-child(4)  { transition-delay: 0.29s; }
    .ap-stagger .ap-reveal:nth-child(5)  { transition-delay: 0.37s; }
    .ap-stagger .ap-reveal:nth-child(6)  { transition-delay: 0.45s; }
    .ap-stagger .ap-reveal:nth-child(7)  { transition-delay: 0.53s; }
    .ap-stagger .ap-reveal:nth-child(8)  { transition-delay: 0.61s; }

    /* Gold shimmer sweep on product card hover */
    .product.type-product {
      position: relative;
      overflow: hidden;
    }
    .product.type-product::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        105deg,
        transparent 40%,
        rgba(201,168,76,0.12) 50%,
        transparent 60%
      );
      transform: translateX(-100%);
      transition: transform 0s;
      pointer-events: none;
      z-index: 2;
    }
    .product.type-product:hover::after {
      transform: translateX(100%);
      transition: transform 0.55s ease;
    }

    /* Floating gold particles in hero */
    @keyframes ap-float-up {
      0%   { transform: translateY(0)   scale(1);   opacity: 0; }
      15%  { opacity: 0.7; }
      85%  { opacity: 0.5; }
      100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
    }
    @keyframes ap-pulse-ring {
      0%   { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
      70%  { transform: scale(1);    box-shadow: 0 0 0 14px rgba(201,168,76,0);  }
      100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(201,168,76,0);     }
    }
    @keyframes ap-badge-pop {
      0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
      70%  { transform: scale(1.1) rotate(3deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg);   opacity: 1; }
    }
    @keyframes ap-ticker-slide {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* Hero particle canvas */
    #ap-particles {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    }
    .ap-particle {
      position: absolute;
      bottom: -10px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(201,168,76,0.6);
      animation: ap-float-up linear infinite;
    }

    /* Add-to-cart pulse */
    .button.add_to_cart_button:active,
    .single_add_to_cart_button:active {
      animation: ap-pulse-ring 0.5s ease;
    }

    /* Section counters */
    .ap-count-up {
      display: inline-block;
      font-variant-numeric: tabular-nums;
    }

    /* Ticker bar */
    #ap-ticker {
      background: linear-gradient(90deg, #080c14 0%, #0f1824 50%, #080c14 100%);
      border-top: 1px solid rgba(201,168,76,0.25);
      border-bottom: 1px solid rgba(201,168,76,0.25);
      overflow: hidden;
      padding: 8px 0;
      position: relative;
    }
    #ap-ticker .ap-ticker-inner {
      display: flex;
      gap: 80px;
      white-space: nowrap;
      animation: ap-ticker-slide 22s linear infinite;
      width: max-content;
    }
    #ap-ticker .ap-ticker-item {
      color: rgba(201,168,76,0.9);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    #ap-ticker .ap-ticker-item::before {
      content: '★';
      margin-right: 10px;
      color: #c9a84c;
    }

    /* Badge animation on sale items */
    .onsale, .woodmart-badge {
      animation: ap-badge-pop 0.5s cubic-bezier(.18,.89,.32,1.28) both;
    }

    /* Hero overlay gradient (if no bg image) */
    .ap-hero-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 120%, rgba(201,168,76,0.08) 0%, transparent 65%),
                  linear-gradient(180deg, rgba(8,12,20,0.6) 0%, rgba(8,12,20,0.9) 100%);
      z-index: 1;
      pointer-events: none;
    }

    /* Smooth appear for whole page on load */
    @keyframes ap-page-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .site-content {
      animation: ap-page-in 0.5s ease both;
    }
  `;
  document.head.appendChild(styleEl);

  /* ─── 2. INTERSECTION OBSERVER — scroll-reveal ─────────────────────────── */
  const iOpts = { rootMargin: '0px 0px -60px 0px', threshold: 0.08 };
  const revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('ap-visible');
        revealIO.unobserve(e.target);
      }
    });
  }, iOpts);

  function applyReveal() {
    /* Product cards */
    document.querySelectorAll(
      '.products .product, .wd-product-grid .product, li.product'
    ).forEach(function (el) {
      if (!el.classList.contains('ap-reveal')) {
        el.classList.add('ap-reveal');
        revealIO.observe(el);
      }
    });
    /* Product grid wrappers — mark for stagger */
    document.querySelectorAll('.products, .wd-product-grid').forEach(function (el) {
      el.classList.add('ap-stagger');
    });

    /* Section headings */
    document.querySelectorAll(
      '.elementor-heading-title, .woocommerce-products-header__title, .section-title, .widget-title, .woodmart-title-container'
    ).forEach(function (el) {
      if (!el.classList.contains('ap-reveal')) {
        el.classList.add('ap-reveal', 'ap-from-left');
        revealIO.observe(el);
      }
    });

    /* Category tiles */
    document.querySelectorAll(
      '.woodmart-product-categories .category-grid-item, .wd-cat, .cat-item'
    ).forEach(function (el) {
      if (!el.classList.contains('ap-reveal')) {
        el.classList.add('ap-reveal', 'ap-scale-in');
        revealIO.observe(el);
      }
    });

    /* Elementor widgets / columns */
    document.querySelectorAll(
      '.elementor-widget-wrap > .elementor-widget:not(.elementor-widget-heading)'
    ).forEach(function (el) {
      if (!el.classList.contains('ap-reveal') && !el.querySelector('.ap-reveal')) {
        el.classList.add('ap-reveal');
        revealIO.observe(el);
      }
    });

    /* Banner / promo blocks */
    document.querySelectorAll(
      '.woodmart-banner, .wd-promo-banner, .elementor-widget-image'
    ).forEach(function (el) {
      if (!el.classList.contains('ap-reveal')) {
        el.classList.add('ap-reveal', 'ap-scale-in');
        revealIO.observe(el);
      }
    });
  }

  /* ─── 3. HERO PARTICLES ────────────────────────────────────────────────── */
  function injectParticles() {
    const heroSel = [
      '#ap-hero',
      '.elementor-section.elementor-section-full_width:first-of-type',
      '.wd-slider-section',
      '.woodmart-main-slider',
      '.elementor-top-section:first-of-type',
      '.site-content > article:first-child .entry-content > .elementor-section:first-child'
    ];
    let hero = null;
    for (const s of heroSel) {
      hero = document.querySelector(s);
      if (hero) break;
    }
    if (!hero) return;

    if (hero.style.position !== 'absolute') hero.style.position = 'relative';
    hero.style.overflow = 'hidden';

    const canvas = document.createElement('div');
    canvas.id = 'ap-particles';
    hero.insertBefore(canvas, hero.firstChild);

    const overlay = document.createElement('div');
    overlay.className = 'ap-hero-overlay';
    hero.insertBefore(overlay, hero.firstChild);

    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'ap-particle';
      const size = 2 + Math.random() * 5;
      p.style.cssText = [
        'left:' + (Math.random() * 100) + '%',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'animation-duration:' + (6 + Math.random() * 10) + 's',
        'animation-delay:' + (Math.random() * 8) + 's',
        'opacity:' + (0.3 + Math.random() * 0.6)
      ].join(';');
      canvas.appendChild(p);
    }
  }

  /* ─── 3a. PREMIUM HERO — replaces the broken 600x300 image widget ───────── */
  function buildHero() {
    const hero = document.querySelector('.elementor-element-e910896');
    if (!hero || document.getElementById('ap-hero')) return;
    hero.innerHTML = `
      <section id="ap-hero">
        <div class="ap-hero-grid"></div>
        <div class="ap-hero-inner">
          <span class="ap-hero-eyebrow">Pharmaceutical Grade &middot; Australia Wide</span>
          <h1 class="ap-hero-title">Premium Anabolics,<br><em>Delivered Discreetly.</em></h1>
          <p class="ap-hero-sub">Injectables, orals, peptides, SARMs and PCT from lab-verified brands.
          Secure checkout, plain packaging and tracked express shipping across Australia.</p>
          <div class="ap-hero-cta">
            <a href="/shop/" class="ap-btn ap-btn-gold">Shop the Range</a>
            <a href="/product-category/peptides/" class="ap-btn ap-btn-ghost">Explore Peptides</a>
          </div>
          <ul class="ap-hero-stats">
            <li><strong>500+</strong><span>Products</span></li>
            <li><strong>24h</strong><span>Dispatch</span></li>
            <li><strong>100%</strong><span>Discreet</span></li>
            <li><strong>Lab</strong><span>Verified</span></li>
          </ul>
        </div>
        <div class="ap-hero-vial" aria-hidden="true">
          <div class="ap-vial"><div class="ap-vial-cap"></div><div class="ap-vial-body"><div class="ap-vial-liquid"></div><div class="ap-vial-label">AP</div></div></div>
          <div class="ap-vial ap-vial-2"><div class="ap-vial-cap"></div><div class="ap-vial-body"><div class="ap-vial-liquid"></div><div class="ap-vial-label">AU</div></div></div>
        </div>
      </section>`;
  }

  /* ─── 3b. FOOTER UPGRADE — logo, tagline, socials, copyright ───────────── */
  function upgradeFooter() {
    const col1 = document.querySelector('.footer-column-1');
    if (!col1 || document.getElementById('ap-footer-brand')) return;

    const logoUrl = 'http://anabolicpharmacyau.com/wp-content/uploads/anabolicpharmacyau-logo.svg';

    // Brand block: logo + tagline + socials
    const brand = document.createElement('div');
    brand.id = 'ap-footer-brand';
    brand.innerHTML = `
      <img src="${logoUrl}" alt="Anabolic Pharmacy AU" width="160" height="auto" loading="lazy">
      <p id="ap-footer-tagline">
        Australia's trusted source for pharmaceutical-grade performance products.
        Discreet shipping · Lab-tested quality · Expert support.
      </p>
      <div id="ap-footer-socials">
        <a href="mailto:sales@anabolicpharmacyau.com" title="Email" aria-label="Email">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        </a>
        <a href="http://anabolicpharmacyau.com/shop/" title="Shop" aria-label="Shop all products">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-9.8-3.2L9 13h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20.9 4H5.21l-.94-2H1v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h13v-2H7.42c-.13 0-.25-.11-.22-.2z"/></svg>
        </a>
        <a href="http://anabolicpharmacyau.com/contact-us/" title="Contact" aria-label="Contact us">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        </a>
      </div>
    `;
    col1.insertBefore(brand, col1.firstChild);

    // Premium copyright bar — replace WoodMart's plain one
    const copyrightBar = document.createElement('div');
    copyrightBar.id = 'ap-footer-copyright';
    const year = new Date().getFullYear();
    copyrightBar.innerHTML = `
      <div class="ap-cr-inner">
        <p>© ${year} Anabolic Pharmacy AU — All rights reserved. For educational and research purposes only.</p>
        <div class="ap-cr-badges">
          <span>🔒 SSL Secure</span>
          <span>🚚 Discreet Shipping</span>
          <span>✓ Lab Tested</span>
        </div>
      </div>
    `;
    const footerEl = document.querySelector('.footer-container') || document.querySelector('footer.site-footer, footer');
    if (footerEl) footerEl.appendChild(copyrightBar);
    const oldBar = document.querySelector('.footer-container .site-info, .footer-container .footer-bottom, .wd-footer-bottom');
    if (oldBar) oldBar.style.display = 'none';
  }

  /* ─── 4. TRUST TICKER (above footer or after hero) ─────────────────────── */
  function injectTicker() {
    if (document.getElementById('ap-ticker') || !document.body.classList.contains('home')) return;
    const items = [
      'Discreet Packaging & Delivery',
      'Lab-Tested Quality',
      'Fast Australia-Wide Shipping',
      'Secure Checkout',
      'Genuine Pharmaceutical Grade',
      '100% Satisfaction Guarantee',
      'Discreet Packaging & Delivery',
      'Lab-Tested Quality',
      'Fast Australia-Wide Shipping',
      'Secure Checkout',
      'Genuine Pharmaceutical Grade',
      '100% Satisfaction Guarantee'
    ];
    const ticker = document.createElement('div');
    ticker.id = 'ap-ticker';
    ticker.innerHTML =
      '<div class="ap-ticker-inner">' +
      items.map(t => '<span class="ap-ticker-item">' + t + '</span>').join('') +
      '</div>';

    const hero = document.querySelector(
      '.elementor-top-section:first-of-type, .wd-slider-section, .woodmart-main-slider, .elementor-section.elementor-section-full_width:first-of-type'
    );
    if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(ticker, hero.nextSibling);
    } else {
      const content = document.querySelector('.site-content .entry-content, .woocommerce-page .site-content');
      if (content) content.insertBefore(ticker, content.firstChild);
    }
  }

  /* ─── 5. COUNT-UP for any number elements ──────────────────────────────── */
  function countUp(el, target, duration) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(function () {
      start += step;
      if (start >= target) { start = target; clearInterval(timer); }
      el.textContent = Math.floor(start).toLocaleString();
    }, 16);
  }

  function initCounters() {
    document.querySelectorAll('.ap-count-up[data-target]').forEach(function (el) {
      const io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          countUp(el, parseInt(el.dataset.target, 10), 1800);
          io.disconnect();
        }
      });
      io.observe(el);
    });
  }

  /* ─── 6. INIT ───────────────────────────────────────────────────────────── */
  function init() {
    buildHero();
    applyReveal();
    injectParticles();
    upgradeFooter();
    injectTicker();
    initCounters();

    /* Re-run after AJAX shop loads new products */
    document.addEventListener('woodmart_ajax_shop_loaded', applyReveal);
    document.addEventListener('added_to_cart', applyReveal);

    /* MutationObserver for dynamically inserted products */
    const mo = new MutationObserver(function () { applyReveal(); });
    const shopEl = document.querySelector('.site-content');
    if (shopEl) mo.observe(shopEl, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
