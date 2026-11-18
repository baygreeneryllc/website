import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* -----------------------------------------------------------------
   PROJECTS — one Markdown file per job (or per "collection" of
   similar small jobs). The upload page will create these files.

   Privacy rules (enforced by scripts/seo-check.mjs):
   - Never put a street address or client name in a title or text.
   - Location is the area (city/neighborhood) only.
   ----------------------------------------------------------------- */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /* One or two sentences: used on cards and as the meta description. */
      summary: z.string().min(50).max(170),
      /* "project" = a single job. "collection" = several similar small jobs. */
      kind: z.enum(['project', 'collection']).default('project'),
      services: z.array(reference('services')).min(1),
      areas: z.array(reference('areas')).min(1),
      /* Month the job was finished, e.g. "2026-05". Optional. */
      completed: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      /* Lower numbers list first. */
      order: z.number().default(100),
      /* Set to false to hide a project (e.g. client opted out). */
      published: z.boolean().default(true),
      photos: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(15),
            label: z.enum(['Before', 'During', 'After', 'Detail']).optional(),
            /* Area this photo was taken in, when a collection spans areas. */
            area: reference('areas').optional(),
          }),
        )
        .min(1),
      /* Which photo is used on cards and social previews (index into photos). */
      coverPhoto: z.number().int().min(0).default(0),
    }),
});

/* -----------------------------------------------------------------
   SERVICES — one Markdown file per service page.
   ----------------------------------------------------------------- */
const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /* Search-friendly page title (the <title> tag), ~60 chars. */
      seoTitle: z.string().max(65),
      /* Meta description, ~150 chars. */
      description: z.string().min(70).max(165),
      /* Homepage card text + three bullets. */
      cardText: z.string(),
      cardBullets: z.array(z.string()).length(3),
      tile: image(),
      tileAlt: z.string(),
      order: z.number(),
    }),
});

/* -----------------------------------------------------------------
   AREAS — cities and neighborhoods. A page is only published once at
   least one published project is tagged with the area (or one of
   its neighborhoods), so we never publish an empty "city page".
   ----------------------------------------------------------------- */
const areas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/areas' }),
  schema: z.object({
    name: z.string(),
    /* e.g. "San Jose, CA" — shown under the title and used in structured data. */
    locality: z.string(),
    /* Larger area this one sits inside (Almaden Valley → San Jose). */
    parent: reference('areas').optional(),
    seoTitle: z.string().max(65),
    description: z.string().min(70).max(165),
    order: z.number().default(100),
  }),
});

export const collections = { projects, services, areas };
