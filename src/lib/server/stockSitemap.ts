import { getAPI } from "$lib/server/api";

const WEBSITE = "https://stocknear.com";

export const MAX_URLS_PER_SITEMAP = 45_000;
export const STOCK_PAGE_FAMILY_COHORT_SIZE = 500;

type SecurityType = "Stock" | "ETF" | "Index";

export type SitemapSecurity = {
  symbol: string;
  name: string;
  type: SecurityType;
  marketCap: number | null;
  lastModified: string | null;
};

type SitemapFamilyDefinition = {
  path: (security: SitemapSecurity) => string;
  accepts: (security: SitemapSecurity) => boolean;
  cohort: "all" | "largest-stocks";
};

export const sitemapPageFamilies = {
  "security-overviews": {
    path: (security) =>
      `${basePathForType(security.type)}${encodeURIComponent(security.symbol)}`,
    accepts: () => true,
    cohort: "all",
  },
  "stock-profiles": stockFamily("/profile"),
  "stock-financials": stockFamily("/financials"),
  "stock-balance-sheets": stockFamily("/financials/balance-sheet"),
  "stock-cash-flows": stockFamily("/financials/cash-flow"),
  "stock-ratios": stockFamily("/financials/ratios"),
  "stock-dividends": stockFamily("/dividends"),
  "stock-forecasts": stockFamily("/forecast"),
  "stock-analyst-forecasts": stockFamily("/forecast/analyst"),
  "stock-statistics": stockFamily("/statistics"),
  "stock-market-caps": stockFamily("/statistics/market-cap"),
  "stock-revenues": stockFamily("/statistics/revenue"),
  "stock-earnings": stockFamily("/statistics/earnings"),
  "stock-histories": stockFamily("/history"),
} satisfies Record<string, SitemapFamilyDefinition>;

export type SitemapPageFamily = keyof typeof sitemapPageFamilies;

export type SitemapShardDescriptor = {
  family: SitemapPageFamily;
  shard: number;
};

function stockFamily(suffix: string): SitemapFamilyDefinition {
  return {
    path: (security) =>
      `/stocks/${encodeURIComponent(security.symbol)}${suffix}`,
    accepts: (security) => security.type === "Stock",
    cohort: "largest-stocks",
  };
}

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function basePathForType(type: SecurityType): string {
  if (type === "Stock") return "/stocks/";
  if (type === "ETF") return "/etf/";
  return "/index/";
}

function validLastModified(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function securityType(value: unknown): SecurityType | null {
  if (value === "Stock" || value === "ETF" || value === "Index") return value;
  return null;
}

function canonicalSymbol(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const symbol = value.trim().toUpperCase();
  if (!symbol || /[\s/\\?#\u0000-\u001f]/.test(symbol)) return null;
  return symbol;
}

function positiveMarketCap(value: unknown): number | null {
  const marketCap = typeof value === "number" ? value : Number(value);
  return Number.isFinite(marketCap) && marketCap > 0 ? marketCap : null;
}

export function normalizeSitemapSecurities(
  response: unknown,
): SitemapSecurity[] {
  if (!Array.isArray(response)) {
    throw new TypeError("The sitemap security source did not return an array");
  }

  const securities = new Map<string, SitemapSecurity>();
  for (const item of response) {
    if (!item || typeof item !== "object") continue;

    const candidate = item as Record<string, unknown>;
    const type = securityType(candidate?.type);
    const symbol = canonicalSymbol(candidate?.symbol);
    const name =
      typeof candidate?.name === "string" ? candidate.name.trim() : "";
    if (!type || !symbol || !name) continue;

    const security: SitemapSecurity = {
      symbol,
      name,
      type,
      marketCap: positiveMarketCap(candidate?.marketCap),
      lastModified: validLastModified(
        candidate?.lastUpdated ?? candidate?.updated,
      ),
    };
    securities.set(`${type}:${symbol}`, security);
  }

  return [...securities.values()].sort(
    (left, right) =>
      left.type.localeCompare(right.type) ||
      left.symbol.localeCompare(right.symbol),
  );
}

export async function loadSitemapSecurities(
  locals: App.Locals,
): Promise<SitemapSecurity[]> {
  const response = await getAPI(locals, "/full-searchbar");
  return normalizeSitemapSecurities(response);
}

export function securitiesForFamily(
  securities: SitemapSecurity[],
  family: SitemapPageFamily,
): SitemapSecurity[] {
  const definition = sitemapPageFamilies[family];
  const eligible =
    securities?.filter((security) => definition.accepts(security)) ?? [];

  if (definition.cohort === "largest-stocks") {
    return eligible
      .filter((security) => security.marketCap !== null)
      .sort(
        (left, right) =>
          (right.marketCap ?? 0) - (left.marketCap ?? 0) ||
          left.symbol.localeCompare(right.symbol),
      )
      .slice(0, STOCK_PAGE_FAMILY_COHORT_SIZE);
  }

  return eligible;
}

export function getSitemapShardDescriptors(
  securities: SitemapSecurity[],
): SitemapShardDescriptor[] {
  return (Object.keys(sitemapPageFamilies) as SitemapPageFamily[]).flatMap(
    (family) => {
      const count = securitiesForFamily(securities, family).length;
      return Array.from(
        { length: Math.ceil(count / MAX_URLS_PER_SITEMAP) },
        (_, index) => ({ family, shard: index + 1 }),
      );
    },
  );
}

export function buildPageFamilySitemap(
  securities: SitemapSecurity[],
  family: SitemapPageFamily,
  shard: number,
): string {
  if (!Number.isSafeInteger(shard) || shard < 1) {
    throw new RangeError("Sitemap shard must be a positive integer");
  }

  const definition = sitemapPageFamilies[family];
  const eligible = securitiesForFamily(securities, family);
  const start = (shard - 1) * MAX_URLS_PER_SITEMAP;
  if (start >= eligible.length) {
    throw new RangeError("Unknown sitemap shard");
  }

  const urls = eligible
    .slice(start, start + MAX_URLS_PER_SITEMAP)
    .map((security) => {
      const lastModified = security.lastModified;
      return `  <url>
    <loc>${escapeXml(`${WEBSITE}${definition.path(security)}`)}</loc>
${lastModified ? `    <lastmod>${lastModified}</lastmod>\n` : ""}  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/** Backward-compatible English overview sitemap used by the legacy endpoints. */
export async function buildStockSitemap(locals: App.Locals): Promise<string> {
  const securities = await loadSitemapSecurities(locals);
  if (securities.length === 0) {
    throw new Error(
      "The sitemap security source returned no eligible securities",
    );
  }

  if (securities.length > MAX_URLS_PER_SITEMAP) {
    const sitemaps = getSitemapShardDescriptors(securities)
      .filter(({ family }) => family === "security-overviews")
      .map(
        ({ family, shard }) => `  <sitemap>
    <loc>${WEBSITE}/sitemaps/pages/${family}/${shard}.xml</loc>
  </sitemap>`,
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
  }

  return buildPageFamilySitemap(securities, "security-overviews", 1);
}

export function isSitemapPageFamily(value: string): value is SitemapPageFamily {
  return Object.hasOwn(sitemapPageFamilies, value);
}

export function sitemapUnavailableResponse(error: unknown): Response {
  console.error("Sitemap generation failed:", error);
  return new Response("Sitemap temporarily unavailable", {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": "300",
    },
  });
}
