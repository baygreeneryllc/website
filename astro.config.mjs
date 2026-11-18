// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.baygreenery.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
  image: {
    // Strip all metadata (GPS, camera) from every generated image.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
