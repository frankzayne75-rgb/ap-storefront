# Deploy on Hostinger (PHP/HTML site)

This project is a **plain HTML/CSS/JS** site (not WordPress, not a PHP app, not Node).

## Why the Create Site upload card rejected the zip

Hostinger’s **empty website → upload card** looks for WordPress layouts and also expects **exactly one page**. Our full shop is multi-page. Older packages also used `wp-content/` / `wp-includes/`, which Hostinger treats as a WordPress backup without a database.

Those folders are now renamed to `site-assets/` and `site-lib/`. Still: **do not upload the full shop on that one-page card.**

## Correct flow

### 1) Create the PHP/HTML site

1. hPanel → **Create Site** → **PHP/HTML website**.
2. On the “one page” upload card, either:
   - upload **`hostinger-starter.zip`** (single placeholder page), or
   - finish with an empty site if the UI allows.
3. Do **not** upload `hostinger-upload.zip` on that card.

### 2) Put the real site in `public_html`

**Best — Git (easy future updates)**  
1. hPanel → **Git** → connect GitHub.  
2. Repo: `frankzayne75-rgb/ap-storefront`, branch **`main`**.  
3. Deploy path: **`public_html`** (so `index.html` is at the root).  
4. Pull/deploy.  
5. After each Cursor/GitHub push to `main`, click **Pull / Deploy** again (same for temp or custom domain).

**Or — File Manager zip**  
1. File Manager → `public_html`.  
2. Upload **`hostinger-upload.zip`** and **Extract here**.  
3. Confirm: `public_html/index.html`, `public_html/.htaccess`, `public_html/site-assets/` (not nested under another folder).  
4. Remove Hostinger placeholders if they conflict.

### 3) Domain + SSL

1. Use the free temporary domain, or attach a bought domain to **this same site**.  
2. Enable SSL.  
3. After HTTPS works, uncomment the HTTPS redirect in `.htaccess`.

## Smoke test

1. `https://YOUR-DOMAIN/` → login/register  
2. Shop → product → cart → checkout (Bitcoin / Bank / PayID)  
3. Telegram button → https://t.me/anabolicpharmacys  

## Notes

- No database / no PHP extensions required.  
- Auth/cart/orders use browser `localStorage`.  
- Local preview: `python3 serve.py 8765`
