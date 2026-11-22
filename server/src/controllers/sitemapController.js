import { Property } from '../models/Property.js';
import { Locality } from '../models/Locality.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/apiResponse.js';

export const getSitemapXml = asyncHandler(async (_req, res) => {
  const baseUrl = env.clientUrl.replace(/\/$/, '');

  const [properties, localities] = await Promise.all([
    Property.find({ status: 'approved', availability: 'available' })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean(),
    Locality.find({ active: true }).select('city localityName updatedAt').lean(),
  ]);

  const staticUrls = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/rooms`, changefreq: 'hourly', priority: '0.9' },
    { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.6' },
  ];

  const localityUrls = localities.map((l) => ({
    loc: `${baseUrl}/rooms?city=${encodeURIComponent(l.city)}&locality=${encodeURIComponent(
      l.localityName
    )}`,
    lastmod: l.updatedAt ? new Date(l.updatedAt).toISOString() : undefined,
    changefreq: 'daily',
    priority: '0.8',
  }));

  const propertyUrls = properties.map((p) => ({
    loc: `${baseUrl}/rooms/${p.slug}`,
    lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString() : undefined,
    changefreq: 'weekly',
    priority: '0.8',
  }));

  const allUrls = [...staticUrls, ...localityUrls, ...propertyUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc.replace(/&/g, '&amp;')}</loc>${
      u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
    }
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  return res.status(200).send(xml);
});
