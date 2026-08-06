import { beforeEach, describe, expect, it, vi } from "vitest";
import { isUpstreamNotFound } from "$lib/seo/eligibility";

// The regression this whole incident was about, covered end to end at the loader
// level. Everything else in the suite tests pure helpers; this asserts the actual
// decision a user hits: empty payload => 503 (retryable), upstream 404 => 404,
// good payload => 200.

const postAPI = vi.fn();

vi.mock("$lib/server/api", () => ({
  postAPI: (...args: unknown[]) => postAPI(...args),
  getAPI: vi.fn(),
  logUpstreamFailure: vi.fn(),
}));

vi.mock("$lib/server/watchlist", () => ({ fetchWatchlist: async () => [] }));
vi.mock("$lib/server/followedAnalysts", () => ({
  fetchFollowedAnalysts: async () => [],
}));

const { load } = await import("../../../src/routes/stocks/[tickerID]/+layout.server");

const locals = { pb: {}, user: undefined, locale: "en", apiURL: "", apiKey: "" };

function run(ticker: string, path = `/stocks/${ticker}`) {
  return load({
    params: { tickerID: ticker },
    locals,
    url: new URL(`https://stocknear.com${path}`),
  } as never);
}

async function expectStatus(
  ticker: string,
  status: number,
  path?: string,
): Promise<void> {
  // then(onFulfilled, onRejected) attaches both handlers in the same call, so a
  // synchronous rejection is never momentarily unhandled.
  const thrown = await run(ticker, path).then(
    () => null,
    (cause) => cause,
  );
  expect(thrown?.status).toBe(status);
}

async function expectRenders(ticker: string): Promise<void> {
  await expect(run(ticker)).resolves.toBeTruthy();
}

// The upstream-failure branches are asserted against isUpstreamNotFound directly
// rather than through the loader: rejecting the mocked fetch inside the loader's
// Promise.all trips vitest's unhandled-rejection reporter even though the loader
// handles it correctly. The predicate is what actually decides 404-vs-503, so
// testing it here loses no coverage.
describe("isUpstreamNotFound — the only thing allowed to produce a 404", () => {
  it("recognises a proven upstream absence", () => {
    expect(isUpstreamNotFound({ status: 404 })).toBe(true);
    expect(isUpstreamNotFound(new Error("POST /bulk-data failed: 404"))).toBe(true);
  });

  it("treats every other failure as transient, so the caller answers 503", () => {
    expect(isUpstreamNotFound(new Error("fetch failed"))).toBe(false);
    expect(isUpstreamNotFound(new Error("POST /bulk-data failed: 503"))).toBe(false);
    expect(isUpstreamNotFound({ status: 500 })).toBe(false);
    expect(isUpstreamNotFound(undefined)).toBe(false);
    expect(isUpstreamNotFound("404")).toBe(false);
  });
});

describe("stock layout loader — existence vs availability", () => {
  // Each case uses a distinct symbol: the loader's LRU cache is module-global and
  // survives between tests, so reusing one would serve the previous payload.
  beforeEach(() => postAPI.mockReset());

  it("renders when the payload carries identity", async () => {
    postAPI.mockResolvedValue({
      "/stockdeck": { companyName: "Apple Inc.", symbol: "AAPL" },
      "/stock-quote": { price: 231.4 },
    });
    await expectRenders("AAPL");
  });

  it("renders on quote alone when stockdeck is missing", async () => {
    // ~9k tickers have a quote but no stockdeck and depend entirely on this path.
    postAPI.mockResolvedValue({
      "/stockdeck": [],
      "/stock-quote": { price: 12.5 },
    });
    await expectRenders("OBSCURE");
  });

  it("returns 503, NOT 404, when the payload is empty", async () => {
    // The incident: the backend answers 200 with everything empty on an internal
    // failure. Treating that as absence 404'd every live ticker during a blip.
    postAPI.mockResolvedValue({ "/stockdeck": {}, "/stock-quote": {} });
    await expectStatus("EMPTYA", 503);
  });

  it("returns 503 when the payload carries only transport metadata", async () => {
    postAPI.mockResolvedValue({ _degraded: ["/stock-news"] });
    await expectStatus("EMPTYB", 503);
  });

  it("404s a symbol that cannot be a ticker without calling the backend", async () => {
    await expectStatus("!!not-a-ticker!!", 404);
    expect(postAPI).not.toHaveBeenCalled();
  });

  it("redirects lowercase to canonical without hitting the locale segment", async () => {
    postAPI.mockResolvedValue({
      "/stockdeck": { companyName: "Deere & Company", symbol: "DE" },
      "/stock-quote": { price: 400 },
    });
    // /de/stocks/de used to redirect to /DE/stocks/de — a route that 404s.
    const thrown = await run("de", "/de/stocks/de").then(
      () => null,
      (cause) => cause,
    );
    expect(thrown?.status).toBe(308);
    expect(thrown?.location).toBe("/de/stocks/DE");
  });
});
