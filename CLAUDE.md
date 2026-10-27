# Blessed Coffee

Static Astro site (see README). Facts live in `src/data/site.js`; social and review automations copy
from there. Kamatero gaps are `TODO`s in that file.

## Launch checklist (Akos DS)

- [x] Custom 404 (`src/pages/404.astro`, served by Caddy `handle_errors`)
- [x] Title and description per page, both languages (`src/i18n.js` `meta`)
- [x] robots.txt, sitemap.xml with hreflang (`src/pages/sitemap.xml.js`)
- [x] Alt text (decorative photos `alt=""`)
- [x] Favicon and apple-touch-icon from the logo
- [x] Mobile first, checked at 390px and 1440px, no horizontal scroll
- [x] Mobile feel: press states, spring tokens, popover drawer and sheet, 3D cup drag with momentum
- [ ] Real-phone pass (cup drag, order sheet, shutter scroll)
- [x] Internal links: nav, footer, shop pages link each other and the menu
- [x] Open Graph with a real 1200x630 image
- [x] Above-the-fold CTA and floating round call button on phones (order is in the header)
- [x] Privacy policy and terms (`public/*.html`, cover both shops)
- [x] Cookie banner (Accept all / Reject all / Preferences, footer "Cookie settings"); only governs the Google map, fonts are self-hosted, no analytics
- [x] Contact info per shop
- [x] Health check: `/health` (Caddy)
- [x] Lighthouse mobile, local: home perf 96, a11y 100, CLS 0, LCP 2.5s; menu/shop pages 100 perf
- [ ] PageSpeed Insights on the live site after deploy
- [ ] Search Console: resubmit `https://www.blessed.cafe/sitemap.xml` (new URLs, manual step)
- [ ] Kamatero: hours, delivery links, menu, photos, Google Business Profile
