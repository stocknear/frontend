import { error } from "@sveltejs/kit";
import { buildStockSitemap } from "$lib/server/stockSitemap";
import { getLocaleFromSlug, type Locale } from "$lib/i18n/locales";

export async function GET({ locals, params, setHeaders }) {
  const locale: Locale | undefined =
    params.locale === "en" ? "en" : getLocaleFromSlug(params.locale);
  if (!locale) error(404, "Unknown sitemap locale");

  setHeaders({
    "Cache-Control": "public, max-age=3600, s-maxage=7200",
  });

  return new Response(await buildStockSitemap(locals, locale), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
