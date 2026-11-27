(function () {
  function injectHero() {
    if (document.querySelector(".ap-hero-banner")) return;
    var host = document.querySelector(".elementor-location-header") ||
               document.querySelector("header") ||
               document.body;
    var banner = document.createElement("section");
    banner.className = "ap-hero-banner ap-fade-in";
    banner.innerHTML =
      '<p class="ap-brand">Anabolic Pharmacy AU</p>' +
      '<p class="ap-tagline">Premium Anabolics for Performance &amp; Recovery</p>' +
      '<p class="ap-sub">Static preview mirror of the Australian storefront — browse categories and products locally.</p>';
    // Insert after header when possible
    if (host && host.parentNode && host !== document.body) {
      host.parentNode.insertBefore(banner, host.nextSibling);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }

  function observeReveal() {
    var nodes = document.querySelectorAll(
      ".product, .product-grid-item, .wd-product, .elementor-widget-image, .woocommerce ul.products li"
    );
    nodes.forEach(function (el, i) {
      if (i > 40) return;
      el.classList.add("ap-reveal");
    });
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".ap-reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".ap-reveal").forEach(function (el) { io.observe(el); });
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    injectHero();
    observeReveal();
  });
})();
