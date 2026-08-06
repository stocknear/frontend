import { beforeEach, describe, expect, it, vi } from "vitest";

// Locks in the ETF and index loader behaviour before they are collapsed into a
// shared factory. Each case uses a distinct symbol because the loaders' LRU cache
// is module-global and survives between tests.

const postAPI = vi.fn();

vi.mock("$lib/server/api", () => ({
  postAPI: (...args: unknown[]) => postAPI(...args),
  getAPI: vi.fn(),
  logUpstreamFailure: vi.fn(),
}));
vi.mock("$lib/server/watchlist", () => ({ fetchWatchlist: async () => [] }));

const etf = await import("../../../src/routes/etf/[tickerID]/+layout.server");
const index = await import("../../../src/routes/index/[tickerID]/+layout.server");

const locals = { pb: {}, user: undefined, locale: "en", apiURL: "", apiKey: "" };

function run(
  load: (event: never) => Promise<unknown>,
  base: string,
  ticker: string,
  path?: string,
) {
  return load({
    params: { tickerID: ticker },
    locals,
    url: new URL(`https://stocknear.com${path ?? `${base}/${ticker}`}`),
  } as never);
}

async function statusOf(promise: Promise<unknown>) {
  const thrown = await promise.then(
    () => null,
    (cause) => cause,
  );
  return thrown?.status ?? 200;
}

describe("etf layout loader", () => {
  beforeEach(() => postAPI.mockReset());

  it("renders when the profile carries identity", async () => {
    postAPI.mockResolvedValue({
      "/etf-profile": [{ name: "SPDR S&P 500 ETF", symbol: "SPY" }],
      "/stock-quote": { price: 612.4 },
    });
    expect(await statusOf(run(etf.load, "/etf", "SPY"))).toBe(200);
  });

  it("renders on quote alone when the profile is empty", async () => {
    postAPI.mockResolvedValue({
      "/etf-profile": [],
      "/stock-quote": { price: 41.2 },
    });
    expect(await statusOf(run(etf.load, "/etf", "THINETF"))).toBe(200);
  });

  it("returns 503, NOT 404, on an empty payload", async () => {
    postAPI.mockResolvedValue({ "/etf-profile": [], "/stock-quote": [] });
    expect(await statusOf(run(etf.load, "/etf", "EMPTYETF"))).toBe(503);
  });

  it("404s an unusable symbol without calling the backend", async () => {
    expect(await statusOf(run(etf.load, "/etf", "!!bad!!"))).toBe(404);
    expect(postAPI).not.toHaveBeenCalled();
  });

  it("canonicalizes the ticker segment, not the locale prefix", async () => {
    const thrown = await run(etf.load, "/etf", "es", "/es/etf/es").then(
      () => null,
      (cause) => cause,
    );
    expect(thrown?.status).toBe(308);
    expect(thrown?.location).toBe("/es/etf/ES");
  });
});

describe("index layout loader", () => {
  beforeEach(() => postAPI.mockReset());

  // The index loader fetches each endpoint separately rather than via /bulk-data.
  const byEndpoint = (data: Record<string, unknown>) =>
    postAPI.mockImplementation(async (_locals, endpoint) => data[endpoint] ?? []);

  it("renders when the profile carries identity", async () => {
    byEndpoint({
      "/index-profile": [{ name: "S&P 500", symbol: "^SPX" }],
      "/stock-quote": { price: 6100 },
    });
    expect(await statusOf(run(index.load, "/index", "^SPX"))).toBe(200);
  });

  it("renders on quote alone when the profile is missing", async () => {
    // ^SP500-15 and friends have a quote but no index profile.
    byEndpoint({ "/index-profile": [], "/stock-quote": { price: 576.3 } });
    expect(await statusOf(run(index.load, "/index", "^SECTOR"))).toBe(200);
  });

  it("returns 503, NOT 404, when profile and quote are both empty", async () => {
    byEndpoint({ "/index-profile": [], "/stock-quote": [] });
    expect(await statusOf(run(index.load, "/index", "^EMPTYIDX"))).toBe(503);
  });

  it("does not let an optional endpoint failure take the page down", async () => {
    // /stock-news is decoration; only profile and quote gate the page.
    postAPI.mockImplementation(async (_locals, endpoint) => {
      if (endpoint === "/stock-news") throw new Error("news upstream down");
      if (endpoint === "/index-profile") return [{ name: "Dow", symbol: "^DJI" }];
      if (endpoint === "/stock-quote") return { price: 44000 };
      return [];
    });
    expect(await statusOf(run(index.load, "/index", "^DJITEST"))).toBe(200);
  });
});
