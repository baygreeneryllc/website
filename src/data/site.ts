/* =================================================================
   Bay Greenery — Site settings (replaces the old config.js)
   -----------------------------------------------------------------
   Change values here to update them across the whole site.
   ================================================================= */

export const site = {
  name: 'Bay Greenery',
  legalName: 'Bay Greenery, LLC',
  url: 'https://www.baygreenery.com',

  /* Booking form. Will be replaced by the on-site quote form. */
  bookingFormUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSfeggzXtM4JuPyvAyuPcIi4_ynukz8hmkh02rMgCoelk4eL6A/viewform',

  /* Google Business profile, reviews tab. Blank hides the button. */
  googleReviewsUrl:
    'https://www.google.com/maps/place/Bay+Greenery/@37.3287405,-121.9446305,10z/data=!4m8!3m7!1s0xaf1c14edcf7a2ae7:0x6fa2b80ed1d68967!8m2!3d37.3287405!4d-121.9446305!9m1!1b1!16s%2Fg%2F11ykh7mqjj',

  /* Direct "leave a review" link. Blank hides the button. */
  leaveReviewUrl: 'https://g.page/r/CWeJ1tEOuKJvEAI/review',

  instagramUrl: '',

  /* Google Analytics 4 measurement ID. Blank disables analytics. */
  googleAnalyticsId: 'G-DW0B255290',

  email: 'ops@baygreenery.com',
  phone: '(408) 454-8078',
  phoneTel: '+14084548078',
  serviceArea: ['South Bay', 'Peninsula'],

  mailingAddress: ['Bay Greenery, LLC', '10080 N Wolfe Ave', 'Suite SW3-200', 'Cupertino, CA 95014'],
  address: {
    streetAddress: '10080 N Wolfe Ave, Suite SW3-200',
    addressLocality: 'Cupertino',
    addressRegion: 'CA',
    postalCode: '95014',
    addressCountry: 'US',
  },

  license: 'CA License C-27 #1146610',
  licenseNumber: '1146610',
  bondedAndInsured: 'Bonded and Insured',

  /* Profiles that represent the business elsewhere (used in structured
     data so Google connects them to this site). */
  sameAs: [] as string[],
};

/* Config object handed to the browser script (carousel/lightbox/links). */
export const browserConfig = {
  bookingFormUrl: site.bookingFormUrl,
  googleReviewsUrl: site.googleReviewsUrl,
  leaveReviewUrl: site.leaveReviewUrl,
  instagramUrl: site.instagramUrl,
  googleAnalyticsId: site.googleAnalyticsId,
  email: site.email,
  phone: site.phone,
  phoneTel: site.phoneTel,
  serviceArea: site.serviceArea,
  mailingAddress: site.mailingAddress,
  license: site.license,
  bondedAndInsured: site.bondedAndInsured,
};

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();
