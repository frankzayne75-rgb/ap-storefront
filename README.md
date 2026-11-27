# ap-storefront

Static Anabolic Pharmacy AU storefront (HTML/CSS/JS) with auth, cart, checkout, account, and contact.

## Local preview

```bash
python3 serve.py 8765
```

## Hostinger

See **[HOSTINGER-DEPLOY.md](./HOSTINGER-DEPLOY.md)**.

Important: Hostinger’s Create Site “one page” upload card will reject a full multi-page zip (and used to flag old `wp-content` folders as a WordPress backup). Use `hostinger-starter.zip` only for that card, then deploy the full site with **File Manager** (`hostinger-upload.zip`) or **Git** from `main`.

Asset folders are named `site-assets/` and `site-lib/` (not WordPress `wp-*` names).

## Features

- Auth gate, cart, checkout (Bitcoin / Bank transfer / PayID), account, contact  
- Telegram: https://t.me/anabolicpharmacys  
