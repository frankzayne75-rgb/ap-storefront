Use the prepared `hostinger-upload/` folder or `hostinger-upload.zip` (contents extract to `public_html` root).

# Deploy ap-storefront on Hostinger

This site is **static HTML/CSS/JS**. No Node build and no PHP are required.

## What to upload

Upload **everything in this repo except** the `.git` folder (optional: skip `serve.py` too — `.htaccess` already blocks it).

Must land in the domain’s web root so these are true:

- `public_html/index.html`
- `public_html/.htaccess`
- `public_html/ap-store.js`
- `public_html/shop/index.html`
- …

## Option A — File Manager (simplest)

1. In hPanel → **Files** → **File Manager** → open `public_html`.
2. Delete default Hostinger placeholder files if present (`default.php`, stock `index.html`, etc.).
3. Upload a zip of the site (or upload folders), then **Extract** in `public_html`.
4. Confirm `index.html` and `.htaccess` are directly inside `public_html`, not nested like `public_html/ap-storefront/index.html`.

## Option B — Git (if your plan supports it)

1. hPanel → **Git**.
2. Clone `https://github.com/frankzayne75-rgb/ap-storefront` into `public_html` (or clone then move contents up one level).
3. Branch: `main`.

## Domain + SSL

1. hPanel → **Domains** — attach/buy your domain and point it at this hosting.
2. hPanel → **SSL** — enable free SSL.
3. After HTTPS works, edit `.htaccess` and uncomment the HTTPS redirect block.

## Smoke test after deploy

1. Open `https://your-domain/` → should redirect to login/register.
2. Register → browse `/shop/` → open a product → Add to cart.
3. `/cart/` → `/checkout/` → choose Bitcoin / Bank transfer / PayID → place order.
4. Telegram button opens `https://t.me/anabolicpharmacys`.
5. Hard-refresh once (Ctrl+Shift+R) if you still see an old cached page.

## Notes

- Auth, cart, and orders use **browser `localStorage`** (per device/browser), not a Hostinger database.
- Payments are **instructions only** (Bitcoin wallet / bank / PayID) — no card gateway on this static build.
- Local preview: `python3 serve.py 8765`
