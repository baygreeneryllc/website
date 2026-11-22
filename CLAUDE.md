# Bay Greenery website — instructions for Claude

The site for baygreenery.com. Astro static site served by a Cloudflare Worker with static assets (project `baygreenery`, config in `wrangler.jsonc`). The Worker in `src/worker/index.ts` handles `/api/*` (the quote form). Cloudflare builds from GitHub: pushes to any branch get a preview link; `main` is the live site. See README.md for the file layout.

## Owner and approvals
- Nathan (owner) approves every change. Work on a branch and open a pull request; never push to `main`.
- Keep changes reviewable: one topic per pull request, with a short plain-English summary of what changed on the site.
- Nathan is not a developer. Explain things in plain language, give step-by-step instructions for anything he must do, and keep options to a clear recommendation.

## Privacy rules (non-negotiable)
- Never publish a client's street address, name, or exact location. Location is the city or neighborhood only (e.g. "Ladera", "Almaden Valley").
- Photos must have all EXIF/GPS metadata stripped before they are committed. Photo GPS may be read privately to suggest the area, then discarded.
- Projects are published under the photo-use clause in client contracts. If a client opts out, set `published: false` in the project file.
- `npm run check:seo` enforces these rules; never bypass or weaken it to get a build passing.

## Content rules
- Projects: `src/content/projects/<area>-<project-type>.md`. Area pages publish automatically once a project is tagged with that area; never create an area page with no real work behind it.
- Only claim what is true. No invented statistics, years in business, prices, guarantees, or reviews.
- Every photo needs alt text describing what it actually shows and where (area only).
- Titles under ~65 characters, meta descriptions ~70–165 characters.
- Keep the existing look (colors, fonts, layout in `src/styles/global.css`) unless Nathan asks for a design change.

## Decisions already made
- Service pages: Landscape Construction, Landscape Design & Build, Irrigation Repair (its own page; very common service), Landscape Repair, Landscape Maintenance, Cleanup & Restoration, Consultations.
- URL structure: `/projects/`, `/services/`, `/areas/`. Main domain `www.baygreenery.com`.
- Areas with projects: San Jose, Almaden Valley (part of San Jose), Ladera, Portola Valley, Campbell. Waiting for projects: Menlo Park, Atherton, Los Altos Hills. Ladera is its own area (often addressed as Portola Valley or Menlo Park).
- Quote form (`/quote/`): Turnstile spam check, photos resized and stripped of metadata in the browser, backup copy in the private R2 bucket `baygreenery-quote-requests`, emailed to ops@baygreenery.com via Resend from website@baygreenery.com (Reply-To is the customer). Worker secrets: RESEND_API_KEY (send-only), TURNSTILE_SECRET. Local testing: `.dev.vars` with DEV_DRY_RUN=1 logs the email instead of sending.
- Upload page: `upload.baygreenery.com`, protected by Cloudflare Access (nathan@baygreenery.com). GPS pre-fills area and date, then is stripped; output is a draft project pull request.
- Domain registrar: Squarespace. DNS is on Cloudflare (switched Nov 18, 2026). `baygreenery.com` redirects to `www.baygreenery.com` (Cloudflare redirect rule). Email is Google Workspace; never change MX/SPF/DKIM records.

## Commands
- `npm run dev` — local preview at http://localhost:4321
- `npm test` — build plus all SEO and privacy checks (must pass before any pull request)
