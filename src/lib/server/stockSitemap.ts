import { hrefForLocale } from "$lib/i18n/navigation";
import { supportedLocales, type Locale } from "$lib/i18n/locales";
import { getAPI } from "$lib/server/api";

const WEBSITE = "https://stocknear.com";
const MAX_URLS_PER_SITEMAP = 25_000;

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function basePathForType(type: unknown): string {
  if (type === "Stock") return "/stocks/";
  if (type === "ETF") return "/etf/";
  return "/index/";
}

function priorityForType(type: unknown): number {
  if (type === "Stock") return 0.8;
  if (type === "ETF") return 0.75;
  return 0.7;
}

function validLastModified(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function buildStockSitemap(
  locals: App.Locals,
  locale: Locale,
): Promise<string> {
  let response: unknown = [];
  try {
    response = await getAPI(locals, "/full-searchbar");
  } catch {
    response = [];
  }

  const stocks = Array.isArray(response)
    ? response?.slice(0, MAX_URLS_PER_SITEMAP) ?? []
    : [];
  const urls = stocks
    ?.filter((item) => item?.symbol)
    ?.map((item) => {
      const basePath = basePathForType(item?.type);
      const canonicalPath = `${basePath}${encodeURIComponent(item.symbol)}`;
      const alternates = supportedLocales
        ?.map(
          (alternateLocale) =>
            `    <xhtml:link rel="alternate" hreflang="${alternateLocale}" href="${escapeXml(`${WEBSITE}${hrefForLocale(canonicalPath, alternateLocale)}`)}" />`,
        )
        ?.concat(
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${WEBSITE}${hrefForLocale(canonicalPath, "en")}`)}" />`,
        )
        ?.join("\n");
      const lastModified = validLastModified(item?.lastUpdated);

      return `  <url>
    <loc>${escapeXml(`${WEBSITE}${hrefForLocale(canonicalPath, locale)}`)}</loc>
${alternates}
${lastModified ? `    <lastmod>${lastModified}</lastmod>\n` : ""}    <changefreq>daily</changefreq>
    <priority>${priorityForType(item?.type)}</priority>
  </url>`;
    })
    ?.join("\n") ?? "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}
