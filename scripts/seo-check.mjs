#!/usr/bin/env node
/* =================================================================
   SEO + privacy checks for the built site (run after `astro build`).
   Fails (exit 1) when a page would hurt search visibility or leak
   private information. Runs on every pull request in GitHub Actions.

   Checks every page in dist/:
   - <title> and meta description present, sensible length, unique
   - exactly one <h1>
   - canonical URL matches the page
   - every <img> has alt text
   - structured data (JSON-LD) is valid JSON
   - internal links point to pages that exist
   - no street addresses in page text (client privacy)
   - listed in the sitemap (unless noindex)
   And every image (source and published):
   - no EXIF/GPS metadata
   ================================================================= */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const SITE = 'https://www.baygreenery.com';
/* Our own business address is the only street address allowed on the site. */
const ALLOWED_ADDRESSES = [/10080 N Wolfe Ave/i];
const STREET_RE = /\b\d{2,6}\s+(?:[NSEW]\.?\s+)?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?\s+(?:Ave|Avenue|St|Street|Rd|Road|Dr|Drive|Ct|Court|Ln|Lane|Way|Blvd|Boulevard|Pl|Place|Cir|Circle|Ter|Terrace|Creek|Hwy)\b\.?/g;

const errors = [];
const warnings = [];
const fail = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const fileSet = new Set(files.map((f) => '/' + relative(DIST, f).split(sep).join('/')));

/* Redirect sources count as valid link targets. */
const redirectSources = new Set();
if (existsSync(join(DIST, '_redirects'))) {
  for (const line of readFileSync(join(DIST, '_redirects'), 'utf8').split('\n')) {
    const t = line.trim();
    if (t && !t.startsWith('#')) redirectSources.add(t.split(/\s+/)[0]);
  }
}

const sitemapUrls = new Set();
for (const f of files.filter((f) => /sitemap-\d+\.xml$/.test(f))) {
  for (const m of readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.add(m[1]);
}

const pathOf = (file) => {
  const rel = '/' + relative(DIST, file).split(sep).join('/');
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
};
const linkExists = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return true;
  if (redirectSources.has(clean)) return true;
  if (fileSet.has(clean)) return true;
  if (clean.endsWith('/') && fileSet.has(clean + 'index.html')) return true;
  return false;
};
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : undefined;
};
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const titles = new Map();
const descriptions = new Map();

for (const file of htmlFiles) {
  const page = pathOf(file);
  const html = readFileSync(file, 'utf8');
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);

  // Title
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '').trim();
  if (!title) fail(page, 'missing <title>');
  else if (/&(amp|lt|gt|quot|#\d+);/.test(title)) fail(page, `title is double-escaped: "${title}"`);
  else {
    if (title.length < 15 || title.length > 70) warn(page, `title is ${title.length} chars (aim for 15-70): "${title}"`);
    if (!noindex) titles.set(title, [...(titles.get(title) || []), page]);
  }

  // Meta description
  const descTag = html.match(/<meta[^>]+name="description"[^>]*>/i);
  const desc = descTag ? decode(attr(descTag[0], 'content') || '').trim() : '';
  if (!desc) fail(page, 'missing meta description');
  else if (/&(amp|lt|gt|quot|#\d+);/.test(desc)) fail(page, 'meta description is double-escaped');
  else {
    if (desc.length < 50 || desc.length > 170) warn(page, `meta description is ${desc.length} chars (aim for 50-170)`);
    if (!noindex) descriptions.set(desc, [...(descriptions.get(desc) || []), page]);
  }

  // H1
  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length !== 1) fail(page, `has ${h1s.length} <h1> tags (need exactly 1)`);

  // Canonical
  const canonTag = html.match(/<link[^>]+rel="canonical"[^>]*>/i);
  const canon = canonTag ? attr(canonTag[0], 'href') : undefined;
  if (!canon) fail(page, 'missing canonical link');
  else if (!noindex && canon !== SITE + page) fail(page, `canonical "${canon}" does not match page URL "${SITE + page}"`);

  // Images need alt text
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const alt = attr(m[0], 'alt');
    if (alt === undefined || alt.trim() === '') fail(page, `image without alt text: ${attr(m[0], 'src')}`);
  }

  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch (e) { fail(page, `invalid JSON-LD: ${e.message}`); }
  }

  // Internal links
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)) {
    let href = decode(m[1]);
    if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    if (!linkExists(href)) fail(page, `broken internal link: ${href}`);
  }

  // Privacy: no street addresses in visible text
  const text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
  for (const m of text.matchAll(STREET_RE)) {
    if (!ALLOWED_ADDRESSES.some((re) => re.test(m[0]))) fail(page, `possible street address in page text: "${m[0]}"`);
  }

  // Sitemap
  if (!noindex && page !== '/404.html' && !sitemapUrls.has(SITE + page)) fail(page, 'not listed in the sitemap');
}

for (const [t, pages] of titles) if (pages.length > 1) fail(pages.join(', '), `duplicate title "${t}"`);
for (const [d, pages] of descriptions) if (pages.length > 1) warn(pages.join(', '), 'duplicate meta description');

/* ---------- Image metadata (GPS / EXIF) ---------- */
function jpegHasExif(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return false;
  let i = 2;
  while (i + 4 < buf.length) {
    if (buf[i] !== 0xff) return false;
    const marker = buf[i + 1];
    if (marker === 0xda) return false; // start of image data
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xe1 && buf.slice(i + 4, i + 10).toString('latin1').startsWith('Exif')) return true;
    i += 2 + len;
  }
  return false;
}
function webpHasExif(buf) {
  if (buf.slice(0, 4).toString() !== 'RIFF' || buf.slice(8, 12).toString() !== 'WEBP') return false;
  let i = 12;
  while (i + 8 <= buf.length) {
    const id = buf.slice(i, i + 4).toString();
    if (id === 'EXIF' || id === 'XMP ') return true;
    i += 8 + buf.readUInt32LE(i + 4) + (buf.readUInt32LE(i + 4) % 2);
  }
  return false;
}
const imageFiles = [...files, ...(existsSync('src/assets') ? walk('src/assets') : [])].filter((f) => /\.(jpe?g|webp)$/i.test(f));
for (const f of imageFiles) {
  const buf = readFileSync(f);
  const hasMeta = /\.webp$/i.test(f) ? webpHasExif(buf) : jpegHasExif(buf);
  if (hasMeta) fail(f, 'image contains EXIF metadata (may include GPS location). Strip it before committing.');
}

/* ---------- Report ---------- */
console.log(`Checked ${htmlFiles.length} pages and ${imageFiles.length} images.`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n✓ All SEO and privacy checks passed.');
