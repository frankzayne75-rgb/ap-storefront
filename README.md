# ap-storefront

Static mirror of Anabolic Pharmacy AU for preview and static hosting.

Serve locally:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765/

**Preview only:** cart, checkout, account, payments, and contact form submit are disabled. This is not a live shop.

## Deploy on Hostinger (custom domain later)

This repo is plain static files (`index.html` at the root). On Hostinger:

1. Buy or connect your domain in Hostinger.
2. Create a **Web Hosting** site (or use existing hosting) and open **File Manager**.
3. Upload the contents of this repo into `public_html` (or the domain’s document root). Keep `index.html` at the root of that folder — do not nest an extra directory unless you want the site at a subpath.
4. In Hostinger DNS / Domains, point the domain at that hosting (or assign the domain to the site in hPanel).
5. Optional: enable HTTPS via Hostinger SSL.

You can also pull from GitHub if your Hostinger plan supports Git deploy; the branch to use is `main`.

No Node build step is required.


## Performance

This static build is optimized for Hostinger and local preview:

- Dead commerce/analytics scripts removed; remaining JS is deferred
- Images use `loading="lazy"` (above-the-fold logo stays eager)
- Non-critical CSS loads asynchronously
- Remote Google Fonts replaced with local/system stacks (no third-party font round-trips)
- `ap-perf.js` prefetches nav targets on hover for faster page-to-page navigation
- `.htaccess` enables gzip + browser caching on Hostinger Apache

Local gzip preview:

```bash
python3 serve.py 8765
```
