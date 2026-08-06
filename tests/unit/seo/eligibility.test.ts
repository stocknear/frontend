import { describe, expect, it } from "vitest";
import {
  canonicalizeSymbolInUrl,
  createDataPageSeoEligibility,
  createSeoEligibility,
  hasEntityIdentity,
  hasFiniteMarketPrice,
  hasMeaningfulSeoData,
  isUpstreamNotFound,
  resolveEntitySymbol,
} from "$lib/seo/eligibility";

describe("SEO eligibility", () => {
  it("normalizes valid symbols and rejects unsafe or oversized values", () => {
    expect(resolveEntitySymbol("aapl")).toEqual({
      valid: true,
      canonicalSymbol: "AAPL",
    });
    expect(resolveEntitySymbol("brk-b")).toEqual({
      valid: true,
      canonicalSymbol: "BRK-B",
    });
    expect(resolveEntitySymbol("../../admin")).toEqual({
      valid: false,
      canonicalSymbol: null,
    });
    expect(resolveEntitySymbol("A".repeat(21))).toEqual({
      valid: false,
      canonicalSymbol: null,
    });
  });

  it("preserves locale prefixes, child paths, and queries in symbol redirects", () => {
    const url = new URL(
      "https://stocknear.com/de/stocks/aapl/financials/ratios?period=annual",
    );

    expect(canonicalizeSymbolInUrl(url, "aapl", "AAPL")).toBe(
      "/de/stocks/AAPL/financials/ratios?period=annual",
    );
    expect(canonicalizeSymbolInUrl(url, "AAPL", "AAPL")).toBeNull();
  });

  it("deduplicates and validates content locales", () => {
    expect(
      createSeoEligibility({
        canonicalPath: "/stocks/AAPL#chart",
        availableLocales: ["en", "de", "de", "unsupported"],
      }),
    ).toMatchObject({
      canonicalPath: "/stocks/AAPL",
      availableLocales: ["en", "de"],
      indexable: true,
      reason: "eligible",
    });
  });

  it("never marks a non-200 eligibility result as indexable", () => {
    expect(
      createSeoEligibility({
        status: 404,
        indexable: true,
        reason: "unknown-entity",
        canonicalPath: "/stocks/UNKNOWN",
      }).indexable,
    ).toBe(false);
  });

  it("recognizes entity identities and finite partial quotes", () => {
    expect(hasEntityIdentity({ companyName: "Apple Inc." }, ["companyName"])).toBe(true);
    expect(hasEntityIdentity([{ name: "SPDR S&P 500 ETF" }], ["name"])).toBe(true);
    expect(hasEntityIdentity([{ name: "  " }], ["name"])).toBe(false);
    expect(hasFiniteMarketPrice({ price: 210.5 })).toBe(true);
    expect(hasFiniteMarketPrice({ price: Number.NaN })).toBe(false);
    expect(hasFiniteMarketPrice({ price: "210.5" })).toBe(false);
  });

  it("distinguishes upstream not-found responses from service failures", () => {
    expect(isUpstreamNotFound({ status: 404 })).toBe(true);
    expect(isUpstreamNotFound(new Error("POST /bulk-data failed: 404"))).toBe(true);
    expect(isUpstreamNotFound(new Error("POST /bulk-data failed: 503"))).toBe(false);
  });

  it("noindexes empty data pages while keeping populated datasets eligible", () => {
    expect(hasMeaningfulSeoData({ rows: [], summary: {} })).toBe(false);
    expect(hasMeaningfulSeoData({ rows: [{ expiration: "2026-09-18" }] })).toBe(true);
    expect(
      createDataPageSeoEligibility(
        "/stocks/AAPL/options/gex",
        { rows: [] },
      ),
    ).toMatchObject({
      indexable: false,
      reason: "insufficient-data",
      availableLocales: ["en"],
    });
  });
});
