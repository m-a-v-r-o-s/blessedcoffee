import { SITE } from '../data/site.js';
import { url } from '../i18n.js';

const SLUGS = ['', 'menu', 'patisia', 'kamatero', 'careers'];

export function GET() {
  const alt = (slug) => ['el', 'en'].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE + url(l, slug)}"/>`).join('');
  const urls = SLUGS.flatMap((slug) => ['el', 'en'].map((l) => `<url><loc>${SITE + url(l, slug)}</loc>${alt(slug)}</url>`));
  const legal = ['privacy-policy.html', 'terms-of-service.html'].map((p) => `<url><loc>${SITE}/${p}</loc></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${[...urls, ...legal].join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
