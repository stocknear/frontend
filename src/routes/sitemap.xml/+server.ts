import {
  getSitemapShardDescriptors,
  loadSitemapSecurities,
  sitemapUnavailableResponse,
} from "$lib/server/stockSitemap";

const WEBSITE = "https://stocknear.com";

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
  try {
    const securities = await loadSitemapSecurities(locals);
    if (securities.length === 0) {
      throw new Error(
        "The sitemap security source returned no eligible securities",
      );
    }

    const pageFamilySitemaps = getSitemapShardDescriptors(securities)
      .map(
        ({ family, shard }) => `  <sitemap>
    <loc>${WEBSITE}/sitemaps/pages/${family}/${shard}.xml</loc>
  </sitemap>`,
      )
      .join("\n");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${WEBSITE}/sitemap-static.xml</loc>
  </sitemap>
${pageFamilySitemaps}
  <sitemap>
    <loc>${WEBSITE}/sitemap-articles.xml</loc>
  </sitemap>
</sitemapindex>`;

    return new Response(body, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    });
  } catch (error) {
    return sitemapUnavailableResponse(error);
  }
}
