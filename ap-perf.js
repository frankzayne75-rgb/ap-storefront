/**
 * ap-perf.js — faster navigation for the static mirror
 * Prefetch on hover/touch + Speculation Rules when supported.
 */
(function () {
  'use strict';
  var prefetched = Object.create(null);

  function sameOrigin(href) {
    try {
      var u = new URL(href, location.href);
      return u.origin === location.origin && u.pathname !== location.pathname;
    } catch (e) {
      return false;
    }
  }

  function prefetch(href) {
    if (!href || prefetched[href]) return;
    if (!sameOrigin(href)) return;
    if (href.indexOf('#') === 0) return;
    if (/\/(cart|checkout|my-account)\//.test(href)) return;
    prefetched[href] = 1;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'document';
    document.head.appendChild(link);
  }

  function onIntent(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    prefetch(a.href);
  }

  document.addEventListener('pointerover', onIntent, { capture: true, passive: true });
  document.addEventListener('touchstart', onIntent, { capture: true, passive: true });
  document.addEventListener('focusin', onIntent, true);

  // Prefetch primary nav targets after idle
  function warmNav() {
    var sel = 'header a[href], .wd-nav a[href], .whb-main-header a[href], .ap-hero-cta a[href]';
    var nodes = document.querySelectorAll(sel);
    var i = 0;
    function step() {
      if (i >= nodes.length || i > 12) return;
      prefetch(nodes[i++].href);
      if ('requestIdleCallback' in window) requestIdleCallback(step, { timeout: 500 });
      else setTimeout(step, 50);
    }
    step();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', warmNav);
  else warmNav();

  // Speculation Rules (Chrome) for prerender of next likely pages
  try {
    if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      var s = document.createElement('script');
      s.type = 'speculationrules';
      s.textContent = JSON.stringify({
        prerender: [{
          where: { and: [
            { href_matches: '/*' },
            { not: { href_matches: '/cart/*' } },
            { not: { href_matches: '/checkout/*' } },
            { not: { href_matches: '/my-account/*' } }
          ]},
          eagerness: 'moderate'
        }],
        prefetch: [{
          where: { href_matches: '/*' },
          eagerness: 'moderate'
        }]
      });
      document.head.appendChild(s);
    }
  } catch (e) {}
})();
