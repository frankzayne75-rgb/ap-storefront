# ap-storefront

Static Anabolic Pharmacy AU storefront with browser-side auth, cart, checkout, account, and contact.

## Local preview

```bash
python3 serve.py 8765
```

Open http://127.0.0.1:8765/ — you will be asked to register/log in before browsing.

## Features

- **Auth gate:** every page requires login/register (`/my-account/`)
- **Cart / checkout / account / contact:** functional via `ap-store.js` (data stored in the browser)
- **Fast navigation:** deferred JS, lazy images, async CSS, hover prefetch (`ap-perf.js`), Hostinger `.htaccess` caching

## Hostinger deploy

Upload this repo into `public_html` (keep `index.html` at the root), attach your domain, enable SSL. No Node build step.

**Note:** Auth, cart, and orders are stored in the visitor’s browser (`localStorage`). They are not a shared server database. Card payments are not processed on this static build — checkout supports bank transfer / arrange payment and saves the order to the account on-device.
