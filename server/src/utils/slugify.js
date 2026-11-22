import crypto from 'crypto';

export function slugifyText(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function generatePropertySlug(title, locality, city = 'Prayagraj') {
  const base = slugifyText(`${title} ${locality} ${city}`).slice(0, 72);
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}
