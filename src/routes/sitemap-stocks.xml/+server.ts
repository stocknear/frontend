import { buildStockSitemap } from "$lib/server/stockSitemap";

/** Backward-compatible English stock sitemap. */
export async function GET({ locals, setHeaders }) {
  setHeaders({
    "Cache-Control": "public, max-age=3600, s-maxage=7200",
  });

  return new Response(await buildStockSitemap(locals, "en"), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
