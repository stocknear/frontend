import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_URLS_PER_SITEMAP,
  STOCK_PAGE_FAMILY_COHORT_SIZE,
  buildPageFamilySitemap,
  buildStockSitemap,
  getSitemapShardDescriptors,
  normalizeSitemapSecurities,
  securitiesForFamily,
  type SitemapSecurity,
} from "$lib/server/stockSitemap";
import { GET as getSitemapIndex } from "../../../src/routes/sitemap.xml/+server";
import { GET as getStaticSitemap } from "../../../src/routes/sitemap-static.xml/+server";
import { GET as getArticleSitemap } from "../../../src/routes/sitemap-articles.xml/+server";

const locals = {
  apiURL: "https://api.example.test",
  apiKey: "test-key",
} as App.Locals;

function security(
  symbol: string,
  overrides: Partial<SitemapSecurity> = {},
): SitemapSecurity {
  return {
    symbol,
    name: `${symbol} Inc.`,
    type: "Stock",
    marketCap: 1,
    lastModified: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("security sitemap eligibility", () => {
  it("keeps only named, canonical, known security types and deduplicates them", () => {
    const result = normalizeSitemapSecurities([
      { symbol: " aapl ", name: "Apple", type: "Stock", marketCap: 3_000 },
      { symbol: "AAPL", name: "Duplicate", type: "Stock", marketCap: 4_000 },
      { symbol: "SPY", name: "SPDR S&P 500", type: "ETF" },
      { symbol: "^GSPC", name: "S&P 500", type: "Index" },
      { symbol: "BAD", name: "Unknown", type: "Crypto" },
      { symbol: "bad/path", name: "Unsafe", type: "Stock", marketCap: 10 },
      { symbol: "", name: "Missing", type: "Stock", marketCap: 10 },
      { symbol: "NONAME", name: "", type: "Stock", marketCap: 10 },
    ]);

    expect(result.map(({ symbol, type }) => `${type}:${symbol}`)).toEqual([
      "ETF:SPY",
      "Index:^GSPC",
      "Stock:AAPL",
    ]);
    expect(result.find((item) => item.symbol === "AAPL")?.marketCap).toBe(4_000);
  });

  it("rejects a malformed upstream payload instead of producing an empty sitemap", () => {
    expect(() => normalizeSitemapSecurities({ items: [] })).toThrow(TypeError);
  });

  it("limits data-page families to the largest 500 eligible stocks", () => {
    const securities = Array.from(
      { length: STOCK_PAGE_FAMILY_COHORT_SIZE + 20 },
      (_, index) => security(`S${index}`, { marketCap: index + 1 }),
    );

    const family = securitiesForFamily(securities, "stock-financials");
    expect(family).toHaveLength(STOCK_PAGE_FAMILY_COHORT_SIZE);
    expect(family[0]?.symbol).toBe(`S${STOCK_PAGE_FAMILY_COHORT_SIZE + 19}`);
    expect(family.at(-1)?.symbol).toBe("S20");
  });

  it("emits canonical English URLs and only valid stable lastmod values", () => {
    const securities = normalizeSitemapSecurities([
      {
        symbol: "aapl",
        name: "Apple",
        type: "Stock",
        marketCap: 3_000,
        lastUpdated: "2026-07-01T12:00:00Z",
      },
    ]);
    const xml = buildPageFamilySitemap(securities, "stock-ratios", 1);

    expect(xml).toContain("https://stocknear.com/stocks/AAPL/financials/ratios");
    expect(xml).toContain("<lastmod>2026-07-01T12:00:00.000Z</lastmod>");
    expect(xml).not.toContain("hreflang");
    expect(xml).not.toContain("/es/");
  });

  it("shards overview URLs before the protocol limit", () => {
    const securities = Array.from(
      { length: MAX_URLS_PER_SITEMAP + 1 },
      (_, index) => security(`S${index}`),
    );
    const overviewShards = getSitemapShardDescriptors(securities).filter(
      ({ family }) => family === "security-overviews",
    );

    expect(overviewShards).toEqual([
      { family: "security-overviews", shard: 1 },
      { family: "security-overviews", shard: 2 },
    ]);
  });

  it("keeps the legacy endpoint safe by returning an index after one URL set fills", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify(
            Array.from({ length: MAX_URLS_PER_SITEMAP + 1 }, (_, index) => ({
              symbol: `S${index}`,
              name: `Security ${index}`,
              type: "Stock",
              marketCap: index + 1,
            })),
          ),
          { status: 200 },
        ),
      ),
    );

    const xml = await buildStockSitemap(locals);
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("/sitemaps/pages/security-overviews/1.xml");
    expect(xml).toContain("/sitemaps/pages/security-overviews/2.xml");
  });
});

describe("sitemap endpoints", () => {
  it("publishes English page-family shards without request-time lastmod values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            { symbol: "AAPL", name: "Apple", type: "Stock", marketCap: 3_000 },
            { symbol: "SPY", name: "SPDR S&P 500", type: "ETF" },
          ]),
          { status: 200 },
        ),
      ),
    );

    const response = await getSitemapIndex({
      locals,
      setHeaders: vi.fn(),
    } as never);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("/sitemaps/pages/security-overviews/1.xml");
    expect(body).toContain("/sitemaps/pages/stock-financials/1.xml");
    expect(body).not.toContain("/sitemaps/stocks/es");
    expect(body).not.toContain("<lastmod>");
  });

  it("returns 503 rather than an empty index when the security source fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("backend unavailable")));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await getSitemapIndex({
      locals,
      setHeaders: vi.fn(),
    } as never);

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("300");
    expect(await response.text()).toBe("Sitemap temporarily unavailable");
  });

  it("keeps the static sitemap English-only and excludes dead routes", async () => {
    const response = await getStaticSitemap({ setHeaders: vi.fn() } as never);
    const body = await response.text();

    expect(body).toContain("https://stocknear.com/covered-call-screener");
    expect(body).toContain("https://stocknear.com/options-screener</loc>");
    expect(body).toContain("https://stocknear.com/list/highest-call-volume");
    // The /options marketing hub was removed; the sitemap must not advertise a 404.
    expect(body).not.toContain("https://stocknear.com/options</loc>");
    expect(body).not.toContain("https://stocknear.com/backtesting");
    expect(body).not.toContain("hreflang");
    expect(body).not.toContain("https://stocknear.com/es/");
  });

  it("returns 503 rather than an empty article sitemap when PocketBase fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await getArticleSitemap({
      locals: {
        pb: {
          collection: () => ({
            getFullList: () => Promise.reject(new Error("PocketBase unavailable")),
          }),
        },
      },
      setHeaders: vi.fn(),
    } as never);

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
