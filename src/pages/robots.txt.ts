import type { APIRoute } from 'astro';

// El sitemap solo se anuncia cuando hay dominio definitivo (SITE_URL o el de Vercel).
export const GET: APIRoute = ({ site }) => {
  const lineas = ['User-agent: *', 'Allow: /'];
  if (site) lineas.push('', `Sitemap: ${new URL('/sitemap.xml', site).href}`);
  return new Response(lineas.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
