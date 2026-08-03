import { error } from "@sveltejs/kit";
import {
  buildPageFamilySitemap,
  isSitemapPageFamily,
  loadSitemapSecurities,
  sitemapUnavailableResponse,
} from "$lib/server/stockSitemap";

export async function GET({ locals, params }) {
  if (!isSitemapPageFamily(params.family)) error(404, "Unknown sitemap family");

  const shard = Number(params.shard);
  if (!Number.isSafeInteger(shard) || shard < 1)
    error(404, "Unknown sitemap shard");

  try {
    const securities = await loadSitemapSecurities(locals);
    return new Response(
      buildPageFamilySitemap(securities, params.family, shard),
      {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=7200",
        },
      },
    );
  } catch (cause) {
    if (cause instanceof RangeError) error(404, "Unknown sitemap shard");
    return sitemapUnavailableResponse(cause);
  }
}
