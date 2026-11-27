# ap-storefront

Static Anabolic Pharmacy AU storefront with browser-side auth, cart, checkout, account, and contact.

## Local preview

```bash
python3 serve.py 8765
```

Open http://127.0.0.1:8765/ — register/log in before browsing.

## Hostinger

This project is ready for Hostinger static hosting. Follow **[HOSTINGER-DEPLOY.md](./HOSTINGER-DEPLOY.md)**.

Short version: upload the site contents into `public_html` (keep `index.html` + `.htaccess` at the root), attach your domain, enable SSL.

## Features

- Auth gate (login/register required)
- Cart, checkout (Bitcoin / Bank transfer / PayID), account orders, contact
- Telegram chat: https://t.me/anabolicpharmacys
- Gzip + cache headers via `.htaccess` for Hostinger Apache/LiteSpeed

**Note:** Auth/cart/orders are stored in the visitor’s browser (`localStorage`). Card payments are not processed on this static build.
