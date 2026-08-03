import {
  buildStockSitemap,
  sitemapUnavailableResponse,
} from "$lib/server/stockSitemap";

export async function GET({ locals, params }) {
  if (params.locale !== "en") {
    return new Response(null, {
      status: 308,
      headers: { Location: "/sitemaps/stocks/en" },
    });
  }

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
