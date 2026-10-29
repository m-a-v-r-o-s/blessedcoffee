// JSON-LD entity graph: one organisation, one CafeOrCoffeeShop per shop. Only facts from site.js.
import { SITE, SOCIAL } from './site.js';
import { url } from '../i18n.js';

const ORG_ID = `${SITE}/#org`;

const org = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Blessed Coffee & Spirits',
  url: `${SITE}/`,
  logo: `${SITE}/blessed-logo.webp`,
  sameAs: [SOCIAL.instagram, SOCIAL.facebook],
};

const cafe = (s, lang) => ({
  '@type': 'CafeOrCoffeeShop',
  '@id': `${SITE}/${s.id}#shop`,
  name: s.name,
  url: SITE + url(lang, s.id),
  parentOrganization: { '@id': ORG_ID },
  telephone: s.phones.map((p) => p.replace('+30', '+30 ')),
  address: {
    '@type': 'PostalAddress',
    streetAddress: s.street[lang],
    addressLocality: s.locality[lang],
    postalCode: s.postal,
    addressCountry: 'GR',
  },
  servesCuisine: ['Coffee', 'Pastries', 'Desserts'],
  priceRange: '€',
  knowsLanguage: ['el', 'en'],
  hasMenu: SITE + url(lang, 'menu'),
  ...(s.geo && { geo: { '@type': 'GeoCoordinates', latitude: s.geo.lat, longitude: s.geo.lng } }),
  ...(s.hours && {
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: s.hours.opens,
      closes: s.hours.closes,
    }],
  }),
  ...(s.delivery.length && { sameAs: s.delivery.map((d) => d.url) }),
});

export const graph = (lang, shops) => ({ '@context': 'https://schema.org', '@graph': [org, ...shops.map((s) => cafe(s, lang))] });
