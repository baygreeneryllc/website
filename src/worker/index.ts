/* =================================================================
   Bay Greenery — Cloudflare Worker
   -----------------------------------------------------------------
   The website itself is static files (built by Astro into dist/).
   This Worker only runs for /api/* requests:

     POST /api/quote   Quote request form → spam check (Turnstile)
                       → backup copy in R2 → email to ops@ (Resend)

   Secrets (set in Cloudflare, never in this repository):
     RESEND_API_KEY     send-only Resend key
     TURNSTILE_SECRET   Turnstile widget secret
   ================================================================= */

export interface Env {
  ASSETS: Fetcher;
  QUOTES: R2Bucket;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET: string;
  QUOTE_TO: string;
  QUOTE_FROM: string;
  /* Local development only: log the email instead of sending it, and
     skip the Turnstile check. Never set these in production. */
  DEV_DRY_RUN?: string;
}

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 12 * 1024 * 1024; // per photo, after in-browser resizing
const MAX_TOTAL_PHOTO_BYTES = 30 * 1024 * 1024; // Resend allows 40 MB per email
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const SERVICES = [
  'Landscape Design & Build',
  'Landscape Construction',
  'Irrigation Repair',
  'Landscape Repair',
  'Landscape Maintenance',
  'Cleanup & Restoration',
  'Consultation',
  'Not sure / Other',
];
const CONTACT_METHODS = ['Phone call', 'Text message', 'Email'];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/quote' || url.pathname === '/api/quote/') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
      try {
        return await handleQuote(request, env);
      } catch (err) {
        console.error('quote: unexpected error', err);
        return json({ ok: false, error: `Something went wrong sending your request. Please call us instead.` }, 500);
      }
    }
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};

async function handleQuote(request: Request, env: Env): Promise<Response> {
  const isLocal = env.DEV_DRY_RUN === '1' && ['localhost', '127.0.0.1'].includes(new URL(request.url).hostname);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'The form could not be read. Please try again.' }, 400);
  }

  // Honeypot: real visitors never see or fill this field.
  if (str(form.get('company_website'))) return json({ ok: true });

  // Spam check.
  if (!isLocal) {
    const token = str(form.get('cf-turnstile-response'));
    const ip = request.headers.get('CF-Connecting-IP') ?? '';
    if (!token || !(await verifyTurnstile(token, ip, env.TURNSTILE_SECRET))) {
      return json({ ok: false, error: 'Please complete the spam check and try again.' }, 400);
    }
  }

  // Fields.
  const data = {
    name: clean(form.get('name'), 100),
    phone: clean(form.get('phone'), 40),
    email: clean(form.get('email'), 200),
    city: clean(form.get('city'), 100),
    service: clean(form.get('service'), 60),
    description: clean(form.get('description'), 5000, true),
    contactMethod: clean(form.get('contact_method'), 30),
    heardAbout: clean(form.get('heard_about'), 100),
  };
  const missing: string[] = [];
  if (!data.name) missing.push('name');
  if (!data.phone && !data.email) missing.push('phone or email');
  if (!data.city) missing.push('city');
  if (!data.description) missing.push('project description');
  if (missing.length) return json({ ok: false, error: `Please fill in: ${missing.join(', ')}.` }, 400);
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return json({ ok: false, error: 'Please check your email address.' }, 400);
  }
  if (!SERVICES.includes(data.service)) data.service = 'Not sure / Other';
  if (!CONTACT_METHODS.includes(data.contactMethod)) data.contactMethod = '';

  // Photos.
  const files = form.getAll('photos').filter((f): f is File => typeof f !== 'string' && f.size > 0);
  if (files.length > MAX_PHOTOS) return json({ ok: false, error: `Please attach up to ${MAX_PHOTOS} photos.` }, 400);
  let total = 0;
  for (const f of files) {
    if (!ALLOWED_PHOTO_TYPES.has(f.type)) return json({ ok: false, error: `"${f.name}" isn't a photo we can accept (JPEG, PNG, WebP or HEIC).` }, 400);
    if (f.size > MAX_PHOTO_BYTES) return json({ ok: false, error: `"${f.name}" is too large. Please choose a smaller photo.` }, 400);
    total += f.size;
  }
  if (total > MAX_TOTAL_PHOTO_BYTES) return json({ ok: false, error: 'Those photos are too large together. Please attach fewer photos.' }, 400);

  // Backup copy in R2 (private), so no request is lost if email fails.
  const received = new Date();
  const id = `${received.toISOString().slice(0, 19).replace(/[:T]/g, '-')}-${crypto.randomUUID().slice(0, 8)}`;
  const photos: { filename: string; content: ArrayBuffer; type: string }[] = [];
  for (const [i, f] of files.entries()) {
    const ext = extensionFor(f.type);
    const filename = `photo-${String(i + 1).padStart(2, '0')}.${ext}`;
    const content = await f.arrayBuffer();
    photos.push({ filename, content, type: f.type });
    await env.QUOTES.put(`quotes/${id}/${filename}`, content, { httpMetadata: { contentType: f.type } });
  }
  await env.QUOTES.put(`quotes/${id}/request.json`, JSON.stringify({ id, received: received.toISOString(), ...data, photos: photos.map((p) => p.filename) }, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  // Email to ops@.
  const subject = `Quote request: ${data.service} in ${data.city} (${data.name})`;
  const email = {
    from: env.QUOTE_FROM,
    to: env.QUOTE_TO.split(',').map((s) => s.trim()).filter(Boolean),
    ...(data.email ? { reply_to: data.email } : {}),
    subject,
    text: emailText(data, id, photos.length),
    html: emailHtml(data, id, photos.length),
    attachments: photos.map((p) => ({ filename: p.filename, content: toBase64(p.content) })),
  };

  if (isLocal) {
    console.log('DEV_DRY_RUN email:', JSON.stringify({ ...email, attachments: email.attachments.map((a) => a.filename) }, null, 2));
  } else {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    });
    if (!res.ok) {
      console.error('quote: Resend error', res.status, await res.text());
      // The request is safely stored in R2; tell the visitor it was received.
      await env.QUOTES.put(`quotes/${id}/EMAIL-FAILED`, String(res.status));
    }
  }

  return json({ ok: true, id });
}

/* ---------------- helpers ---------------- */

async function verifyTurnstile(token: string, ip: string, secret: string): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = (await res.json()) as { success?: boolean };
  return out.success === true;
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v : '';
}

function clean(v: FormDataEntryValue | null, max: number, multiline = false): string {
  let s = str(v).replace(/\r\n?/g, '\n').trim();
  s = multiline ? s.replace(/[^\S\n]+/g, ' ') : s.replace(/\s+/g, ' ');
  return s.slice(0, max);
}

function extensionFor(type: string): string {
  return ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' } as Record<string, string>)[type] ?? 'jpg';
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type QuoteData = { name: string; phone: string; email: string; city: string; service: string; description: string; contactMethod: string; heardAbout: string };

function rows(d: QuoteData): [string, string][] {
  return [
    ['Name', d.name],
    ['Phone', d.phone],
    ['Email', d.email],
    ['City / area', d.city],
    ['Service', d.service],
    ['Best way to reach', d.contactMethod],
    ['Heard about us', d.heardAbout],
  ].filter(([, v]) => v) as [string, string][];
}

function emailText(d: QuoteData, id: string, photoCount: number): string {
  return [
    'New quote request from baygreenery.com',
    '',
    ...rows(d).map(([k, v]) => `${k}: ${v}`),
    '',
    'Project description:',
    d.description,
    '',
    `Photos attached: ${photoCount}`,
    `Reference: ${id}`,
    d.email ? '\nReply to this email to respond to the customer directly.' : '',
  ].join('\n');
}

function emailHtml(d: QuoteData, id: string, photoCount: number): string {
  const tel = d.phone.replace(/[^\d+]/g, '');
  const cell = (k: string, v: string) => {
    let value = escapeHtml(v);
    if (k === 'Phone' && tel) value = `<a href="tel:${escapeHtml(tel)}">${value}</a>`;
    if (k === 'Email') value = `<a href="mailto:${escapeHtml(v)}">${value}</a>`;
    return `<tr><td style="padding:4px 12px 4px 0;color:#5a5a5a;vertical-align:top">${k}</td><td style="padding:4px 0;font-weight:600">${value}</td></tr>`;
  };
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a1a;max-width:600px">
  <h2 style="color:#3c4a55;margin:0 0 12px">New quote request</h2>
  <table style="border-collapse:collapse">${rows(d).map(([k, v]) => cell(k, v)).join('')}</table>
  <h3 style="color:#3c4a55;margin:20px 0 6px">Project description</h3>
  <p style="white-space:pre-wrap;margin:0">${escapeHtml(d.description)}</p>
  <p style="color:#5a5a5a;font-size:13px;margin-top:20px">Photos attached: ${photoCount} · Reference: ${escapeHtml(id)}${d.email ? '<br>Reply to this email to respond to the customer directly.' : ''}</p>
</div>`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
