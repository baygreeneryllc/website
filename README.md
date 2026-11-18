# Bay Greenery — website

The source for [baygreenery.com](https://www.baygreenery.com). Built with [Astro](https://astro.build), which turns simple text files into a fast, static website. Hosted on Cloudflare Pages.

> This file is for collaborators. It is not published on the website.

## How the site is organized

| Where | What it is |
|---|---|
| `src/data/site.ts` | **Easy-edit settings**: phone, email, booking link, reviews links, Google Analytics ID, address, license. Change a value here and it updates everywhere. |
| `src/content/projects/` | **One file per project.** Each becomes a page at `/projects/<file-name>/`. |
| `src/content/services/` | One file per service page (`/services/<file-name>/`). |
| `src/content/areas/` | One file per city or neighborhood (`/areas/<file-name>/`). An area page only goes live once at least one project is tagged with it. |
| `src/assets/` | Photos. They're optimized automatically (resized, converted to WebP, metadata removed) when the site builds. |
| `src/data/gallery.ts` | The general photo gallery and the six homepage gallery tiles. |
| `src/pages/` | Page templates (homepage, project/service/area layouts). |
| `src/styles/global.css` | All colors, fonts, and layout. |
| `public/` | Files published as-is: logo, fonts, `robots.txt`, `llms.txt`, redirects. |
| `scripts/seo-check.mjs` | Automatic SEO and privacy checks (see below). |

## Adding a project

The upload page will do this automatically. By hand:

1. Put the photos in `src/assets/projects/<project-folder>/`. **Remove location data from photos first.** The checks will refuse photos that still have it.
2. Copy an existing file in `src/content/projects/` and edit it: title, summary, services, areas, and photos (each with a short description of what it shows).
3. Open a pull request. You'll get a preview link, and the checks run automatically.

**Privacy rules:** never put a street address or client name in a project. The location is the area only (e.g. "Ladera"). If a client opts out, set `published: false` in their project file.

## Automatic checks

Every pull request builds the site and runs `scripts/seo-check.mjs`. It fails if any page:

- is missing a title, a description, or a single main heading
- has a photo without a description (alt text)
- links to a page that doesn't exist
- shows a street address other than our business address
- includes a photo that still contains GPS/camera metadata

## Running it on your computer

You need [Node.js](https://nodejs.org) (version 22 or newer).

```
npm install        # first time only
npm run dev        # live preview at http://localhost:4321
npm test           # build the site and run all checks
```

## Making a change

1. Create a branch, make your edit, push it.
2. Open a pull request. Cloudflare posts a preview link, and the checks run.
3. Nathan reviews and merges. The live site updates within a couple of minutes.

Questions: **ops@baygreenery.com**
