import { describe, expect, it } from "vitest";
import {
  canonicalizeSymbolInUrl,
  hasFiniteMarketPrice,
  isUsableEntityPayload,
} from "../../../src/lib/seo/eligibility";

// Regression guard for the production "Page Not Found" incident.
// canonicalizeSymbolInUrl used to locate the ticker segment with findIndex, which
// matched the FIRST segment equal to the symbol. On a localized URL the locale slug
// matched first, so /de/stocks/de (DE = Deere) redirected to /DE/stocks/de — a route
// that does not exist — and the user got a hard 404.
describe("canonicalizeSymbolInUrl", () => {
  it("rewrites the ticker segment, not a locale prefix that equals the ticker", () => {
    for (const [locale, symbol] of [
      ["de", "DE"],
      ["es", "ES"],
      ["fr", "FR"],
    ]) {
      const lower = symbol.toLowerCase();
      const url = new URL(`https://stocknear.com/${locale}/stocks/${lower}`);
      expect(canonicalizeSymbolInUrl(url, lower, symbol)).toBe(
        `/${locale}/stocks/${symbol}`,
      );
    }
  });

  it("still canonicalizes on unprefixed URLs", () => {
    const url = new URL("https://stocknear.com/stocks/aapl");
    expect(canonicalizeSymbolInUrl(url, "aapl", "AAPL")).toBe("/stocks/AAPL");
  });

  it("handles etf and index routes and preserves the query string", () => {
    expect(
      canonicalizeSymbolInUrl(
        new URL("https://stocknear.com/de/etf/spy?tab=holdings"),
        "spy",
        "SPY",
      ),
    ).toBe("/de/etf/SPY?tab=holdings");
    expect(
      canonicalizeSymbolInUrl(
        new URL("https://stocknear.com/index/%5Espx"),
        "^spx",
        "^SPX",
      ),
    ).toBe("/index/%5ESPX");
  });

  it("canonicalizes deeper sub-pages, not just the overview", () => {
    expect(
      canonicalizeSymbolInUrl(
        new URL("https://stocknear.com/de/stocks/de/options/gex"),
        "de",
        "DE",
      ),
    ).toBe("/de/stocks/DE/options/gex");
  });

  it("returns null when nothing needs changing", () => {
    const url = new URL("https://stocknear.com/stocks/AAPL");
    expect(canonicalizeSymbolInUrl(url, "AAPL", "AAPL")).toBeNull();
  });
});

// The last-resort fallback that keeps a page alive when stockdeck data is missing.
// It read .price without unwrapping arrays, unlike hasEntityIdentity, so an
// array-wrapped quote silently failed and the page 404'd.
describe("hasFiniteMarketPrice", () => {
  it("accepts a bare quote object", () => {
    expect(hasFiniteMarketPrice({ price: 231.4 })).toBe(true);
  });

  it("accepts an array-wrapped quote", () => {
    expect(hasFiniteMarketPrice([{ price: 231.4 }])).toBe(true);
  });

  it("rejects empty, missing and non-finite prices", () => {
    expect(hasFiniteMarketPrice([])).toBe(false);
    expect(hasFiniteMarketPrice({})).toBe(false);
    expect(hasFiniteMarketPrice(null)).toBe(false);
    expect(hasFiniteMarketPrice({ price: Number.NaN })).toBe(false);
    expect(hasFiniteMarketPrice({ price: "231.4" })).toBe(false);
  });
});

// The signal that separates "backend hiccup" from "ticker does not exist".
// The backend answers 200 with every endpoint empty when an internal fetch fails,
// so an empty payload must never be treated as proof of absence — and must never
// be written into the 30s response cache, which used to serve one failure to every
// visitor of that ticker.
describe("isUsableEntityPayload", () => {
  it("accepts a payload carrying real data", () => {
    expect(
      isUsableEntityPayload({
        "/stockdeck": { companyName: "Apple Inc." },
        "/stock-quote": {},
      }),
    ).toBe(true);
    expect(isUsableEntityPayload({ "/stock-quote": { price: 231.4 } })).toBe(true);
  });

  it("rejects the shapes the backend returns on internal failure", () => {
    expect(isUsableEntityPayload({})).toBe(false);
    expect(isUsableEntityPayload({ "/stockdeck": {}, "/stock-quote": {} })).toBe(false);
    expect(isUsableEntityPayload({ "/stockdeck": [], "/stock-quote": [] })).toBe(false);
    expect(isUsableEntityPayload(null)).toBe(false);
    expect(isUsableEntityPayload(undefined)).toBe(false);
  });
});

// Transport metadata must not masquerade as page data. The backend now returns a
// _degraded list when an optional endpoint fails; a payload carrying only that is
// still empty and must neither be cached nor treated as proof the page exists.
describe("isUsableEntityPayload with transport metadata", () => {
  it("ignores underscore-prefixed keys", () => {
    expect(isUsableEntityPayload({ _degraded: ["/stock-news"] })).toBe(false);
    expect(
      isUsableEntityPayload({ "/stockdeck": {}, _degraded: ["/wiim"] }),
    ).toBe(false);
  });

  it("still accepts a degraded payload that carries real data", () => {
    expect(
      isUsableEntityPayload({
        "/stockdeck": { companyName: "Apple Inc." },
        _degraded: ["/stock-news"],
      }),
    ).toBe(true);
  });
});
