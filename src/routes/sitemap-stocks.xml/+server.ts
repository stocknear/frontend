import {
  buildStockSitemap,
  sitemapUnavailableResponse,
} from "$lib/server/stockSitemap";

/** Backward-compatible English stock sitemap. */
export async function GET({ locals }) {
  try {
    return new Response(await buildStockSitemap(locals), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    });
  } catch (error) {
    return sitemapUnavailableResponse(error);
  }
}
