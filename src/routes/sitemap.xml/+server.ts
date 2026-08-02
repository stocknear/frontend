import {
  localeRegistry,
  supportedLocales,
} from "$lib/i18n/locales";

/** @type {import('./$types').RequestHandler} */
export async function GET({ setHeaders }) {
  setHeaders({
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=7200",
  });

  const website = "https://stocknear.com";
  const now = new Date().toISOString();
  const stockSitemaps = supportedLocales
    ?.map((locale) => localeRegistry[locale].slug ?? locale)
    ?.map(
      (slug) => `  <sitemap>
    <loc>${website}/sitemaps/stocks/${slug}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`,
    )
    ?.join("\n") ?? "";

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${website}/sitemap-static.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
${stockSitemaps}
  <sitemap>
    <loc>${website}/sitemap-articles.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
