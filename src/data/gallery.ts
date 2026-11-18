/* General project photos shown in the "All Photos" gallery and the
   homepage teaser. `project` links a photo to its project page. */
import type { ImageMetadata } from 'astro';

const img = import.meta.glob<{ default: ImageMetadata }>('../assets/photos/*.jpg', { eager: true });
const photo = (name: string) => img[`../assets/photos/${name}.jpg`].default;

export interface GalleryPhoto {
  src: ImageMetadata;
  alt: string;
  area?: string;
  project?: string;
}

export const gallery: GalleryPhoto[] = [
  { src: photo('gallery-01'), alt: 'Front entry with flagstone stepping stones, fountain, and new plantings in Almaden Valley', area: 'almaden-valley', project: 'almaden-valley-landscape-remodel' },
  { src: photo('gallery-02'), alt: 'Remodeled front yard with layered plantings and Japanese maple in Almaden Valley', area: 'almaden-valley', project: 'almaden-valley-landscape-remodel' },
  { src: photo('gallery-03'), alt: 'Artificial turf side yard in Almaden Valley', area: 'almaden-valley', project: 'almaden-valley-artificial-turf' },
  { src: photo('gallery-04'), alt: 'Artificial turf lawn with curved path in Almaden Valley', area: 'almaden-valley', project: 'almaden-valley-artificial-turf' },
  { src: photo('gallery-05'), alt: 'Decomposed granite driveway extension in Almaden Valley', area: 'almaden-valley', project: 'almaden-valley-dg-driveway' },
  { src: photo('gallery-06'), alt: 'New wood board fence in Campbell', area: 'campbell', project: 'campbell-fence-replacement' },
  { src: photo('gallery-07'), alt: 'Fine-graded hillside lot in Ladera', area: 'ladera', project: 'ladera-fine-grading' },
  { src: photo('gallery-08'), alt: 'Smoothly graded slope ready for planting in Ladera', area: 'ladera', project: 'ladera-fine-grading' },
  { src: photo('gallery-09'), alt: 'New irrigation valve box and wiring in San Jose', area: 'san-jose', project: 'drip-sprinkler-installs' },
  { src: photo('gallery-10'), alt: 'Drip irrigation line along a planting bed in Almaden Valley', area: 'almaden-valley', project: 'drip-sprinkler-installs' },
  { src: photo('gallery-11'), alt: 'Low-voltage step lights along a hillside stairway in Portola Valley', area: 'portola-valley', project: 'portola-valley-landscape-lighting' },
  { src: photo('gallery-12'), alt: 'Stone entry column with accent lighting in Portola Valley', area: 'portola-valley', project: 'portola-valley-landscape-lighting' },
  { src: photo('gallery-13'), alt: 'Path lights along a brick walkway in Ladera', area: 'ladera', project: 'ladera-landscape-lighting' },
  { src: photo('gallery-14'), alt: 'Drought-tolerant front yard landscaping with olive trees in Almaden Valley', area: 'almaden-valley' },
  { src: photo('gallery-15'), alt: 'Lawn and garden borders with landscape lighting in Ladera', area: 'ladera', project: 'ladera-landscape-lighting' },
  { src: photo('gallery-16'), alt: 'Brick garden steps through a planted slope in Ladera', area: 'ladera' },
  { src: photo('gallery-17'), alt: 'Full green front lawn after overseeding in San Jose', area: 'san-jose', project: 'san-jose-lawn-overseeding' },
  { src: photo('gallery-18'), alt: 'Dry hillside slope before landscaping in Almaden Valley', area: 'almaden-valley' },
  { src: photo('gallery-19'), alt: 'Dry hillside beside a curved driveway before landscaping in Almaden Valley', area: 'almaden-valley' },
  { src: photo('gallery-20'), alt: 'New timber retaining wall with built-in steps in Ladera', area: 'ladera', project: 'ladera-retaining-wall' },
  { src: photo('gallery-21'), alt: 'Rebuilt timber retaining wall and stairs in Ladera', area: 'ladera', project: 'ladera-retaining-wall' },
  { src: photo('gallery-22'), alt: 'Timber retaining wall planter with gravel terrace in Ladera', area: 'ladera', project: 'ladera-retaining-wall' },
  { src: photo('gallery-23'), alt: 'Backyard soil prepared for new sod in Almaden Valley', area: 'almaden-valley', project: 'sod-replacement' },
  { src: photo('gallery-24'), alt: 'New sod lawn beside a pool in Almaden Valley', area: 'almaden-valley', project: 'sod-replacement' },
  { src: photo('gallery-25'), alt: 'Graded drive and planting area in Portola Valley', area: 'portola-valley' },
];

/* Homepage "Project Gallery" teaser: six tiles. */
export const homeTeaser = [
  { src: photo('gallery-02'), alt: 'Remodeled front yard in Almaden Valley', label: 'Design & Build', href: '/projects/almaden-valley-landscape-remodel/' },
  { src: photo('gallery-11'), alt: 'Step lighting on a hillside stairway in Portola Valley', label: 'Landscape Lighting', href: '/projects/portola-valley-landscape-lighting/' },
  { src: photo('gallery-20'), alt: 'Timber retaining wall and steps in Ladera', label: 'Retaining Wall', href: '/projects/ladera-retaining-wall/' },
  { src: photo('featured-04'), alt: 'Garden with lawn, boulders, and flagstone path in Ladera', label: 'Design & Build', href: '/projects/' },
  { src: photo('featured-05'), alt: 'New sod lawn beside a pool in Almaden Valley', label: 'Sod Replacement', href: '/projects/sod-replacement/' },
  { src: photo('featured-06'), alt: 'Lawn with landscape lighting at dusk in Ladera', label: 'Landscape Lighting', href: '/projects/ladera-landscape-lighting/' },
];

export const heroPhoto = photo('gallery-01');
export const aboutPhoto = photo('about-nathan');
