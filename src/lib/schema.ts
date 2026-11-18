/* schema.org structured data helpers. */
import { site, absoluteUrl } from '../data/site';
import type { Area, Service } from './content';

export const businessId = `${site.url}/#business`;

export function businessSchema(services: Service[], areas: Area[]) {
  return {
    '@context': 'https://schema.org',
    '@type': ['HomeAndConstructionBusiness', 'LocalBusiness'],
    '@id': businessId,
    name: site.name,
    legalName: site.legalName,
    url: `${site.url}/`,
    image: absoluteUrl('/images/logo-baygreenery.png'),
    logo: absoluteUrl('/images/logo-baygreenery.png'),
    telephone: '+1-408-454-8078',
    email: site.email,
    priceRange: '$$',
    address: { '@type': 'PostalAddress', ...site.address },
    areaServed: [
      ...areas.map((a) => ({ '@type': 'Place', name: a.data.locality.includes(a.data.name) ? a.data.locality : `${a.data.name}, ${a.data.locality}`, url: absoluteUrl(`/areas/${a.id}/`) })),
      { '@type': 'Place', name: 'South Bay, CA' },
      { '@type': 'Place', name: 'Peninsula, CA' },
    ],
    description: 'Licensed landscape contractor serving the South Bay and Peninsula: landscape design and build, construction, irrigation repair, maintenance, cleanup, and consultations.',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Landscape Services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.data.title, url: absoluteUrl(`/services/${s.id}/`) },
      })),
    },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'license',
      name: `California State Contractor License C-27 #${site.licenseNumber}`,
    },
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
  };
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}
