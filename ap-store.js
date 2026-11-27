/**
 * AP Store — auth gate, cart, checkout, account, contact
 * Client-side store suitable for static Hostinger hosting.
 */
(function () {
  'use strict';

  var NS = 'ap_store_v1';
  var FREE_SHIPPING = 499;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(NS) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function save(state) {
    localStorage.setItem(NS, JSON.stringify(state));
  }
  function state() {
    var s = load();
    s.users = s.users || {};
    s.session = s.session || null;
    s.cart = Array.isArray(s.cart) ? s.cart : [];
    s.orders = s.orders || {};
    s.messages = Array.isArray(s.messages) ? s.messages : [];
    return s;
  }

  function toast(msg) {
    var el = document.getElementById('ap-store-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ap-store-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove('is-on');
    }, 2600);
  }

  function money(n) {
    return 'AUD' + Number(n || 0).toFixed(2);
  }

  function path() {
    return location.pathname.replace(/\/+$/, '') || '/';
  }

  function isAuthPage() {
    return path() === '/my-account' || path().indexOf('/my-account/') === 0;
  }

  function currentUser() {
    var s = state();
    if (!s.session || !s.session.email) return null;
    if (s.session.exp && Date.now() > s.session.exp) {
      s.session = null;
      save(s);
      return null;
    }
    return s.users[s.session.email.toLowerCase()] || null;
  }

  function requireAuth() {
    if (currentUser()) return true;
    if (isAuthPage()) return false;
    var next = encodeURIComponent(location.pathname + location.search);
    location.replace('/my-account/?next=' + next);
    return false;
  }

  function bufToHex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
  }

  async function hashPassword(password, saltHex) {
    var enc = new TextEncoder();
    var salt = saltHex
      ? Uint8Array.from(saltHex.match(/.{1,2}/g).map(function (h) {
          return parseInt(h, 16);
        }))
      : crypto.getRandomValues(new Uint8Array(16));
    var key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    var bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt, iterations: 120000, hash: 'SHA-256' },
      key,
      256
    );
    return { hash: bufToHex(bits), salt: bufToHex(salt) };
  }

  async function register(email, password, name) {
    email = String(email || '')
      .trim()
      .toLowerCase();
    name = String(name || '').trim() || email.split('@')[0];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email.');
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');
    var s = state();
    if (s.users[email]) throw new Error('An account with that email already exists.');
    var hp = await hashPassword(password);
    s.users[email] = {
      email: email,
      name: name,
      salt: hp.salt,
      hash: hp.hash,
      createdAt: Date.now(),
    };
    s.orders[email] = s.orders[email] || [];
    s.session = { email: email, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 };
    save(s);
    return s.users[email];
  }

  async function login(email, password) {
    email = String(email || '')
      .trim()
      .toLowerCase();
    var s = state();
    var user = s.users[email];
    if (!user) throw new Error('No account found for that email.');
    var hp = await hashPassword(password, user.salt);
    if (hp.hash !== user.hash) throw new Error('Incorrect password.');
    s.session = { email: email, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 };
    save(s);
    return user;
  }

  function logout() {
    var s = state();
    s.session = null;
    save(s);
    location.href = '/my-account/';
  }

  function cartCount() {
    return state().cart.reduce(function (n, i) {
      return n + (i.qty || 0);
    }, 0);
  }

  function cartSubtotal() {
    return state().cart.reduce(function (n, i) {
      return n + (i.price || 0) * (i.qty || 0);
    }, 0);
  }

  function shippingFor(sub) {
    return sub <= 0 ? 0 : sub >= FREE_SHIPPING ? 0 : 15;
  }

  function upsertCartItem(item) {
    var s = state();
    var found = s.cart.find(function (c) {
      return c.id === item.id;
    });
    if (found) found.qty += item.qty || 1;
    else s.cart.push(item);
    save(s);
    refreshCartBadge();
  }

  function updateQty(id, qty) {
    var s = state();
    s.cart = s.cart
      .map(function (c) {
        if (c.id !== id) return c;
        return Object.assign({}, c, { qty: Math.max(1, qty | 0) });
      })
      .filter(function (c) {
        return c.qty > 0;
      });
    save(s);
    refreshCartBadge();
  }

  function removeItem(id) {
    var s = state();
    s.cart = s.cart.filter(function (c) {
      return c.id !== id;
    });
    save(s);
    refreshCartBadge();
  }

  function clearCart() {
    var s = state();
    s.cart = [];
    save(s);
    refreshCartBadge();
  }

  function placeOrder(details) {
    var user = currentUser();
    if (!user) throw new Error('Please log in first.');
    var s = state();
    if (!s.cart.length) throw new Error('Your cart is empty.');
    var sub = cartSubtotal();
    var ship = shippingFor(sub);
    var order = {
      id: 'AP-' + Date.now().toString(36).toUpperCase(),
      createdAt: Date.now(),
      items: s.cart.slice(),
      subtotal: sub,
      shipping: ship,
      total: sub + ship,
      details: details,
      status: 'Processing',
    };
    s.orders[user.email] = s.orders[user.email] || [];
    s.orders[user.email].unshift(order);
    s.cart = [];
    save(s);
    refreshCartBadge();
    return order;
  }

  function saveContact(payload) {
    var s = state();
    var user = currentUser();
    s.messages.push({
      id: 'MSG-' + Date.now().toString(36).toUpperCase(),
      at: Date.now(),
      email: (payload.email || (user && user.email) || '').toLowerCase(),
      name: payload.name || (user && user.name) || '',
      subject: payload.subject || '',
      message: payload.message || '',
    });
    save(s);
  }

  function refreshCartBadge() {
    var count = cartCount();
    var text = String(count);
    var sub = money(cartSubtotal());
    document.querySelectorAll('.wd-cart-number, .woodmart-cart-number, .cart-count, .wd-tools-count').forEach(function (el) {
      el.textContent = text;
      el.setAttribute('data-count', text);
    });
    document.querySelectorAll('.wd-header-cart .wd-tools-text').forEach(function (el) {
      if (el.classList.contains('wd-cart-number') || el.querySelector('.wd-cart-number')) return;
      el.textContent = count ? sub : 'AUD0.00';
    });
    var user = currentUser();
    document.querySelectorAll('.wd-header-my-account .wd-tools-text, .wd-header-my-account a span').forEach(function (el) {
      if (!el || el.children.length) return;
      if (/login|register|account|my account/i.test(el.textContent || '') || user) {
        el.textContent = user ? user.name || 'Account' : 'LOGIN / REGISTER';
      }
    });
  }

  function parsePrice(text) {
    if (!text) return 0;
    var m = String(text).replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function productFromDom(root) {
    root = root || document;
    var id =
      (document.querySelector('[name="add-to-cart"]') && document.querySelector('[name="add-to-cart"]').value) ||
      (document.querySelector('[data-product_id]') && document.querySelector('[data-product_id]').getAttribute('data-product_id')) ||
      path();
    var nameEl =
      document.querySelector('.product_title, h1.product_title, .product_title.entry-title, h1.entry-title') ||
      document.querySelector('meta[property="og:title"]');
    var name = nameEl
      ? nameEl.getAttribute('content') || nameEl.textContent
      : document.title.split(' - ')[0];
    name = String(name || 'Product').replace(/\s+/g, ' ').trim();
    var priceMeta = document.querySelector('meta[property="product:price:amount"]');
    var price = priceMeta ? parseFloat(priceMeta.getAttribute('content') || '0') : 0;
    if (!price) {
      var priceEl = document.querySelector('.summary .price .woocommerce-Price-amount, .summary .price ins .amount, .summary .price .amount');
      price = parsePrice(priceEl && priceEl.textContent);
    }
    var img =
      (document.querySelector('meta[property="og:image"]') && document.querySelector('meta[property="og:image"]').getAttribute('content')) ||
      (document.querySelector('.woocommerce-product-gallery__image img, .wp-post-image') &&
        document.querySelector('.woocommerce-product-gallery__image img, .wp-post-image').getAttribute('src')) ||
      '/wp-content/uploads/anabolicpharmacyau-logo.svg';
    var qtyInput = root.querySelector('input.qty, input[name="quantity"]');
    var qty = qtyInput ? Math.max(1, parseInt(qtyInput.value || '1', 10) || 1) : 1;
    return {
      id: String(id),
      name: name,
      price: price || 0,
      image: img,
      url: location.pathname,
      qty: qty,
    };
  }


  var BTC_WALLET = '1DpjFpydr853RX5JbxGcdjqccrkTyUNEDQ';
  var TELEGRAM_URL = 'https://t.me/anabolicpharmacys';

  function paymentDetailsHtml(method) {
    if (method === 'bitcoin') {
      return '<div class="ap-pay-card"><div class="ap-pay-card-title">Send Bitcoin</div><p class="ap-muted">Transfer the order total to this wallet, then place your order.</p><code id="ap-btc-addr">' + BTC_WALLET + '</code><button type="button" class="ap-btn ap-btn-primary" id="ap-copy-btc">Copy wallet address</button></div>';
    }
    if (method === 'bank') {
      return '<div class="ap-pay-card"><div class="ap-pay-card-title">Bank transfer</div><p class="ap-muted">Place your order, then use the order ID as your payment reference. We will confirm bank details by email or Telegram.</p></div>';
    }
    if (method === 'payid') {
      return '<div class="ap-pay-card"><div class="ap-pay-card-title">PayID</div><p class="ap-muted">Place your order, then message us on Telegram with your order ID to receive PayID details.</p><a class="ap-btn" href="https://t.me/anabolicpharmacys" target="_blank" rel="noopener noreferrer">Open Telegram</a></div>';
    }
    return '';
  }

  function wirePaymentDetails(root) {
    var hidden = root.querySelector('#ap-pay-method');
    var box = root.querySelector('#ap-pay-details');
    var cards = root.querySelectorAll('[data-ap-pay]');
    if (!hidden || !box || !cards.length) return;

    function selectMethod(method) {
      hidden.value = method;
      cards.forEach(function (card) {
        var on = card.getAttribute('data-ap-pay') === method;
        card.classList.toggle('is-selected', on);
        card.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      box.innerHTML = paymentDetailsHtml(method);
      var copy = box.querySelector('#ap-copy-btc');
      if (copy) {
        copy.addEventListener('click', function () {
          navigator.clipboard.writeText(BTC_WALLET).then(function () {
            toast('Bitcoin address copied');
          }).catch(function () {
            toast(BTC_WALLET);
          });
        });
      }
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        selectMethod(card.getAttribute('data-ap-pay'));
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectMethod(card.getAttribute('data-ap-pay'));
        }
      });
    });
    selectMethod(hidden.value || 'bitcoin');
  }

  function injectTelegramChat() {
    if (document.getElementById('ap-tg-chat')) return;
    var a = document.createElement('a');
    a.id = 'ap-tg-chat';
    a.href = TELEGRAM_URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Chat on Telegram');
    a.innerHTML = '<span class="ap-tg-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 6.93-1.43 6.74c-.1.46-.39.57-.79.36l-2.18-1.61-1.05 1.01c-.12.12-.22.22-.44.22l.16-2.22 4.05-3.66c.18-.16-.04-.24-.27-.09l-5.01 3.15-2.16-.68c-.47-.14-.48-.47.1-.7l8.44-3.26c.39-.14.73.1.58.74z"/></svg></span><span class="ap-tg-label">Telegram</span>';
    document.body.appendChild(a);
  }

  function hideCheckoutChrome() {
    document.querySelectorAll('.sidebar-container, .woodmart-instagram, .widget_categories, aside.sidebar-right').forEach(function (el) {
      el.style.display = 'none';
    });
    document.querySelectorAll('.site-content, .content-layout-wrapper .main-page-wrapper, .main-page-wrapper > .container > .row > [class*="col-lg"]').forEach(function (el) {
      if (el.classList.contains('sidebar-container')) return;
      if (el.className && /col-lg-9|col-md-9|col-lg-12|site-content/.test(el.className)) {
        el.style.maxWidth = '100%';
        el.style.flex = '0 0 100%';
        el.style.width = '100%';
      }
    });
    var content = document.querySelector('.site-content');
    if (content) {
      content.classList.remove('col-lg-9', 'col-md-9');
      content.classList.add('col-lg-12', 'col-md-12');
    }
  }

  function mount(selectorFallback, html) {
    var existing = document.getElementById('ap-app-root');
    if (existing) existing.remove();

    var hosts = [
      document.querySelector('.site-content[role="main"] .entry-content'),
      document.querySelector('.site-content .entry-content'),
      document.querySelector('#main .entry-content'),
      document.querySelector('.site-content[role="main"]'),
      document.querySelector('#main .site-content'),
      document.querySelector('main .entry-content'),
      document.querySelector('main'),
    ].filter(Boolean);
    var host = hosts[0];
    if (!host) {
      host = document.body;
    }
    var wrap = document.createElement('div');
    wrap.id = 'ap-app-root';
    wrap.innerHTML = html;
    if (path().indexOf('/product/') !== 0) {
      Array.prototype.slice.call(host.children).forEach(function (ch) {
        if (ch.id === 'ap-app-root') return;
        ch.style.display = 'none';
      });
      document.querySelectorAll('.wpcf7, .woocommerce-checkout, .woocommerce-cart-form, .cart-empty, .wd-empty-page, .u-columns.col2-set').forEach(function (el) {
        el.style.display = 'none';
      });
    }
    host.insertBefore(wrap, host.firstChild);
    return wrap;
  }

  function renderAuth() {
    var user = currentUser();
    var params = new URLSearchParams(location.search);
    var next = params.get('next') || '/';
    var html;
    if (user) {
      var orders = (state().orders[user.email] || [])
        .map(function (o) {
          return (
            '<tr><td>' +
            o.id +
            '</td><td>' +
            new Date(o.createdAt).toLocaleString() +
            '</td><td>' +
            money(o.total) +
            '</td><td><span class="ap-badge">' +
            o.status +
            '</span></td></tr>'
          );
        })
        .join('');
      html =
        '<div class="ap-panel"><h2>Welcome, ' +
        escapeHtml(user.name) +
        '</h2><p class="ap-muted">' +
        escapeHtml(user.email) +
        '</p><div class="ap-actions"><a class="ap-btn ap-btn-primary" href="/shop/">Continue shopping</a><a class="ap-btn" href="/cart/">View cart</a><button type="button" class="ap-btn ap-btn-danger" id="ap-logout">Log out</button></div></div>' +
        '<div class="ap-panel"><h3>Your orders</h3>' +
        (orders
          ? '<table class="ap-table"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>' +
            orders +
            '</tbody></table>'
          : '<p class="ap-empty">No orders yet.</p>') +
        '</div>';
    } else {
      html =
        '<div class="ap-panel" id="ap-auth-panel"><h2>Sign in to continue</h2><p class="ap-muted">Create an account or log in to browse the catalog, cart, and checkout.</p>' +
        '<div class="ap-auth-tabs"><button type="button" class="ap-btn is-active" data-ap-tab="login">Log in</button><button type="button" class="ap-btn" data-ap-tab="register">Register</button></div>' +
        '<form id="ap-login-form"><div class="ap-field"><label>Email</label><input type="email" name="email" required autocomplete="username"></div><div class="ap-field"><label>Password</label><input type="password" name="password" required autocomplete="current-password"></div><p class="ap-error" id="ap-auth-error" hidden></p><div class="ap-actions"><button class="ap-btn ap-btn-primary" type="submit">Log in</button></div></form>' +
        '<form id="ap-register-form" hidden><div class="ap-field"><label>Full name</label><input type="text" name="name" required autocomplete="name"></div><div class="ap-field"><label>Email</label><input type="email" name="email" required autocomplete="email"></div><div class="ap-field"><label>Password (min 8 characters)</label><input type="password" name="password" required minlength="8" autocomplete="new-password"></div><p class="ap-error" id="ap-reg-error" hidden></p><div class="ap-actions"><button class="ap-btn ap-btn-primary" type="submit">Create account</button></div></form></div>';
    }
    var root = mount(null, html);
    if (!root) return;
    if (user) {
      root.querySelector('#ap-logout').addEventListener('click', logout);
      return;
    }
    var loginForm = root.querySelector('#ap-login-form');
    var regForm = root.querySelector('#ap-register-form');
    root.querySelectorAll('[data-ap-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        root.querySelectorAll('[data-ap-tab]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        var tab = btn.getAttribute('data-ap-tab');
        loginForm.hidden = tab !== 'login';
        regForm.hidden = tab !== 'register';
      });
    });
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var err = root.querySelector('#ap-auth-error');
      err.hidden = true;
      try {
        var fd = new FormData(loginForm);
        await login(fd.get('email'), fd.get('password'));
        toast('Welcome back');
        location.replace(next || '/');
      } catch (ex) {
        err.textContent = ex.message || 'Login failed';
        err.hidden = false;
      }
    });
    regForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var err = root.querySelector('#ap-reg-error');
      err.hidden = true;
      try {
        var fd = new FormData(regForm);
        await register(fd.get('email'), fd.get('password'), fd.get('name'));
        toast('Account created');
        location.replace(next || '/');
      } catch (ex) {
        err.textContent = ex.message || 'Registration failed';
        err.hidden = false;
      }
    });
  }

  function renderCart() {
    var items = state().cart;
    var sub = cartSubtotal();
    var ship = shippingFor(sub);
    var rows = items
      .map(function (i) {
        return (
          '<tr data-id="' +
          escapeAttr(i.id) +
          '"><td><img src="' +
          escapeAttr(i.image) +
          '" alt=""><div><a href="' +
          escapeAttr(i.url) +
          '">' +
          escapeHtml(i.name) +
          '</a></div></td><td>' +
          money(i.price) +
          '</td><td><input class="ap-qty" type="number" min="1" value="' +
          i.qty +
          '"></td><td>' +
          money(i.price * i.qty) +
          '</td><td><button type="button" class="ap-btn ap-btn-ghost ap-remove">Remove</button></td></tr>'
        );
      })
      .join('');
    var html =
      '<div class="ap-panel"><h2>Your cart</h2>' +
      (items.length
        ? '<table class="ap-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead><tbody>' +
          rows +
          '</tbody></table><div class="ap-total-row"><span>Subtotal</span><strong>' +
          money(sub) +
          '</strong></div><div class="ap-total-row"><span>Shipping</span><strong>' +
          (ship ? money(ship) : 'FREE') +
          '</strong></div><div class="ap-total-row"><span>Total</span><strong>' +
          money(sub + ship) +
          '</strong></div><p class="ap-inline-note">Free shipping on orders of ' +
          money(FREE_SHIPPING) +
          '+.</p><div class="ap-actions"><a class="ap-btn" href="/shop/">Continue shopping</a><a class="ap-btn ap-btn-primary" href="/checkout/">Checkout</a></div>'
        : '<div class="ap-empty"><p>Your cart is empty.</p><div class="ap-actions" style="justify-content:center"><a class="ap-btn ap-btn-primary" href="/shop/">Browse products</a></div></div>') +
      '</div>';
    var root = mount(null, html);
    if (!root || !items.length) return;
    root.querySelectorAll('tbody tr').forEach(function (tr) {
      var id = tr.getAttribute('data-id');
      tr.querySelector('.ap-qty').addEventListener('change', function (e) {
        updateQty(id, parseInt(e.target.value || '1', 10));
        renderCart();
      });
      tr.querySelector('.ap-remove').addEventListener('click', function () {
        removeItem(id);
        toast('Removed from cart');
        renderCart();
      });
    });
  }

  function renderCheckout() {
    var items = state().cart;
    if (!items.length) {
      mount(
        null,
        '<div class="ap-panel ap-empty"><h2>Checkout</h2><p>Your cart is empty.</p><div class="ap-actions" style="justify-content:center"><a class="ap-btn ap-btn-primary" href="/shop/">Browse products</a></div></div>'
      );
      return;
    }
    var user = currentUser();
    var sub = cartSubtotal();
    var ship = shippingFor(sub);
    var lines = items
      .map(function (i) {
        return '<div class="ap-total-row"><span>' + escapeHtml(i.name) + ' × ' + i.qty + '</span><span>' + money(i.price * i.qty) + '</span></div>';
      })
      .join('');
    var html =
      '<div class="ap-panel"><h2>Checkout</h2><form id="ap-checkout-form">' +
      '<div class="ap-grid-2"><div class="ap-field"><label>Full name</label><input name="name" required value="' +
      escapeAttr(user.name || '') +
      '"></div><div class="ap-field"><label>Email</label><input type="email" name="email" required value="' +
      escapeAttr(user.email || '') +
      '"></div></div>' +
      '<div class="ap-field"><label>Phone</label><input name="phone" required></div>' +
      '<div class="ap-field"><label>Address</label><input name="address" required></div>' +
      '<div class="ap-grid-2"><div class="ap-field"><label>City</label><input name="city" required></div><div class="ap-field"><label>State / Territory</label><input name="state" required></div></div>' +
      '<div class="ap-grid-2"><div class="ap-field"><label>Postcode</label><input name="postcode" required></div><div class="ap-field"><label>Country</label><input name="country" value="Australia" required></div></div>' +
      '<div class="ap-field"><span class="ap-label">Payment method</span>' +
      '<div class="ap-pay-toggle" role="radiogroup" aria-label="Payment method">' +
      '<button type="button" class="ap-pay-choice" data-ap-pay="bitcoin" role="radio" aria-checked="true"><span class="ap-pay-choice-icon" aria-hidden="true">BTC</span><span class="ap-pay-choice-text"><strong>Bitcoin</strong><small>Pay with BTC wallet</small></span></button>' +
      '<button type="button" class="ap-pay-choice" data-ap-pay="bank" role="radio" aria-checked="false"><span class="ap-pay-choice-icon" aria-hidden="true">BANK</span><span class="ap-pay-choice-text"><strong>Bank transfer</strong><small>Pay with bank reference</small></span></button>' +
      '<button type="button" class="ap-pay-choice" data-ap-pay="payid" role="radio" aria-checked="false"><span class="ap-pay-choice-icon" aria-hidden="true">ID</span><span class="ap-pay-choice-text"><strong>PayID</strong><small>Instant Australian PayID</small></span></button>' +
      '</div>' +
      '<input type="hidden" name="payment" id="ap-pay-method" value="bitcoin">' +
      '<div id="ap-pay-details" class="ap-pay-box"></div></div>' +
      '<div class="ap-panel" style="margin:1rem 0 0;padding:1rem"><h3>Order summary</h3>' +
      lines +
      '<div class="ap-total-row"><span>Shipping</span><strong>' +
      (ship ? money(ship) : 'FREE') +
      '</strong></div><div class="ap-total-row"><span>Total</span><strong>' +
      money(sub + ship) +
      '</strong></div></div>' +
      '<p class="ap-error" id="ap-checkout-error" hidden></p><div class="ap-actions"><button class="ap-btn ap-btn-primary" type="submit">Place order</button><a class="ap-btn" href="/cart/">Back to cart</a></div></form></div>';
    var root = mount(null, html);
    wirePaymentDetails(root);
    root.querySelector('#ap-checkout-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = root.querySelector('#ap-checkout-error');
      err.hidden = true;
      try {
        var fd = new FormData(e.target);
        var details = {};
        fd.forEach(function (v, k) {
          details[k] = String(v);
        });
        if (details.payment === 'bitcoin') details.bitcoinWallet = BTC_WALLET;
        var order = placeOrder(details);
        toast('Order ' + order.id + ' placed');
        location.href = '/my-account/?placed=' + encodeURIComponent(order.id);
      } catch (ex) {
        err.textContent = ex.message || 'Could not place order';
        err.hidden = false;
      }
    });
  }

  function renderContact() {
    var user = currentUser();
    var html =
      '<div class="ap-panel"><h2>Contact us</h2><p class="ap-muted">Send a message — it is saved to your account inbox on this device/browser.</p>' +
      '<form id="ap-contact-form"><div class="ap-grid-2"><div class="ap-field"><label>Name</label><input name="name" required value="' +
      escapeAttr((user && user.name) || '') +
      '"></div><div class="ap-field"><label>Email</label><input type="email" name="email" required value="' +
      escapeAttr((user && user.email) || '') +
      '"></div></div><div class="ap-field"><label>Subject</label><input name="subject" required></div><div class="ap-field"><label>Message</label><textarea name="message" required></textarea></div><p class="ap-error" id="ap-contact-error" hidden></p><p class="ap-ok" id="ap-contact-ok" hidden>Message sent. We will get back to you.</p><div class="ap-actions"><button class="ap-btn ap-btn-primary" type="submit">Send message</button></div></form></div>';
    var root = mount(null, html);
    root.querySelector('#ap-contact-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var err = root.querySelector('#ap-contact-error');
      var ok = root.querySelector('#ap-contact-ok');
      err.hidden = true;
      ok.hidden = true;
      try {
        var fd = new FormData(e.target);
        var message = String(fd.get('message') || '').trim();
        if (message.length < 5) throw new Error('Please write a longer message.');
        saveContact({
          name: fd.get('name'),
          email: fd.get('email'),
          subject: fd.get('subject'),
          message: message,
        });
        e.target.reset();
        ok.hidden = false;
        toast('Message sent');
      } catch (ex) {
        err.textContent = ex.message || 'Could not send';
        err.hidden = false;
      }
    });
  }


  function wireQuantityControls() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.quantity .plus, .quantity .minus, input.plus, input.minus');
      if (!btn) return;
      var wrap = btn.closest('.quantity');
      if (!wrap) return;
      var input = wrap.querySelector('input.qty');
      if (!input) return;
      e.preventDefault();
      var step = parseFloat(input.getAttribute('step') || '1') || 1;
      var min = parseFloat(input.getAttribute('min') || '1') || 1;
      var val = parseFloat(input.value || '1') || 1;
      if (btn.classList.contains('plus') || btn.value === '+') val += step;
      else val = Math.max(min, val - step);
      input.value = String(val);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, true);
  }

  function wireAddToCart() {
    var locking = false;
    function addItem(item) {
      if (!currentUser()) {
        location.href = '/my-account/?next=' + encodeURIComponent(location.pathname);
        return;
      }
      if (locking) return;
      locking = true;
      upsertCartItem(item);
      toast('Added to cart · ' + item.name);
      setTimeout(function () { locking = false; }, 400);
    }

    document.addEventListener(
      'click',
      function (e) {
        var btn = e.target.closest && e.target.closest('.single_add_to_cart_button, .add_to_cart_button, button[name="add-to-cart"], a.add_to_cart_button');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        var item;
        if (btn.classList.contains('add_to_cart_button') && btn.getAttribute('data-product_id')) {
          var card = btn.closest('li.product, .product');
          var title = card && card.querySelector('.wd-entities-title, .product-title, h3, h2');
          item = {
            id: btn.getAttribute('data-product_id'),
            name: title ? title.textContent.replace(/\s+/g, ' ').trim() : 'Product',
            price: parsePrice(card && card.querySelector('.price') && card.querySelector('.price').textContent),
            image: (card && card.querySelector('img') && card.querySelector('img').getAttribute('src')) || '/wp-content/uploads/anabolicpharmacyau-logo.svg',
            url: (card && card.querySelector('a.product-image-link, a') && card.querySelector('a.product-image-link, a').getAttribute('href')) || location.pathname,
            qty: 1,
          };
        } else {
          item = productFromDom(btn.closest('form') || document);
        }
        addItem(item);
      },
      true
    );

    document.querySelectorAll('form.cart').forEach(function (form) {
      form.removeAttribute('onsubmit');
      form.setAttribute('action', '#');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        addItem(productFromDom(form));
      });
    });
  }

  function fixLinks() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href === '#' || href.indexOf('javascript:') === 0) return;
      // broken absolute leftovers without protocol host
      if (/^https?:\/\/(dmtcartridges|dmtvapepen|austeroidshop)/i.test(href)) {
        a.setAttribute('href', '/shop/');
      }
    });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function boot() {
    document.documentElement.classList.add('ap-store-ready');
    document.querySelectorAll('#ap-cw, .ap-cw').forEach(function (el) { el.remove(); });
    injectTelegramChat();
    if (currentUser()) document.body.classList.add('ap-authed');
    refreshCartBadge();
    fixLinks();
    wireQuantityControls();
    wireAddToCart();

    if (!requireAuth() && !isAuthPage()) return;

    var p = path();
    if (isAuthPage()) renderAuth();
    else if (p === '/cart') { hideCheckoutChrome(); renderCart(); }
    else if (p === '/checkout') { hideCheckoutChrome(); renderCheckout(); }
    else if (p === '/contact-us') renderContact();

    var placed = new URLSearchParams(location.search).get('placed');
    if (placed && isAuthPage()) toast('Order ' + placed + ' placed successfully');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.APStore = {
    login: login,
    register: register,
    logout: logout,
    cartCount: cartCount,
    currentUser: currentUser,
  };
})();
