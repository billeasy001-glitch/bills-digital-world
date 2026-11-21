import type { APIRoute } from 'astro';
import { sectionKeys, entries } from '../lib/library';
export const GET: APIRoute = async ({ site }) => {
  const paths = ['/', '/about/', '/contact/'];
  for (const section of sectionKeys) {
    paths.push(`/${section}/`);
    for (const entry of await entries(section)) paths.push(`/${section}/${entry.id}/`);
  }
  const urls = paths.map(path => '<url><loc>' + new URL(path, site).href.replaceAll('&', '&amp;') + '</loc></url>');
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n', { headers: { 'Content-Type': 'application/xml' } });
};
