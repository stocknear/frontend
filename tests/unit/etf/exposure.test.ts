import { describe, expect, it, vi } from "vitest";

// Column labels come from paraglide, which the vite plugin compiles at
// dev/build time. Stub it so the pure row-shaping logic is testable on its own.
vi.mock("$lib/paraglide/messages", () => {
  const label = (key: string) => () => key;
  return new Proxy(
    {},
    {
      get: (_target, property: string) => label(property),
    },
  );
});

const {
  EXPOSURE_DEFAULT_LIST,
  EXPOSURE_SPECIFIC_ROWS,
  fundAssets,
  prepareExposureRows,
  summarize,
} = await import("$lib/components/ETF/exposure");

const row = (over: Record<string, unknown> = {}) => ({
  symbol: "VOO",
  name: "Vanguard S&P 500 ETF",
  weightPercentage: 7.04,
  marketValue: 119_941_560_105,
  sharesNumber: 384_354_163,
  price: 640.1,
  changesPercentage: 0.4,
  marketCap: 1_701_236_248_229,
  assetsUnderManagement: 1_700_000_000_000,
  expenseRatio: 0.03,
  ...over,
});

describe("column metadata for Table.svelte", () => {
  it("uses unique rule keys", () => {
    const rules = EXPOSURE_SPECIFIC_ROWS()?.map((column) => column?.rule);
    expect(new Set(rules)?.size).toBe(rules?.length);
  });

  it("keeps every default column backed by metadata the table understands", () => {
    // price/changesPercentage come from Table.svelte's own indicator rows, so
    // they are deliberately absent from specificRows.
    const known = new Set([
      ...(EXPOSURE_SPECIFIC_ROWS()?.map((column) => column?.rule) ?? []),
      "price",
      "changesPercentage",
    ]);
    for (const column of EXPOSURE_DEFAULT_LIST() ?? []) {
      expect(known.has(column?.rule)).toBe(true);
    }
  });

  it("keeps the live-quote columns visible by default", () => {
    const rules = EXPOSURE_DEFAULT_LIST()?.map((column) => column?.rule);
    expect(rules).toContain("price");
    expect(rules).toContain("changesPercentage");
  });
});

describe("fundAssets", () => {
  it("prefers the fund's own reported assets over the quote marketCap", () => {
    // VTI: the quote disagrees with the fund's filing for share-class families.
    expect(fundAssets(row({ assetsUnderManagement: 2.3e12, marketCap: 623_076_473_656 }))).toBe(
      2.3e12,
    );
  });

  it("falls back to marketCap only when assets are absent", () => {
    expect(fundAssets(row({ assetsUnderManagement: null }))).toBe(1_701_236_248_229);
    expect(fundAssets(row({ assetsUnderManagement: null, marketCap: null }))).toBeNull();
    expect(fundAssets(undefined)).toBeNull();
  });
});

describe("prepareExposureRows", () => {
  it("ranks by shares held, 1 = most", () => {
    const rows = [
      row({ symbol: "SMALL", sharesNumber: 10 }),
      row({ symbol: "BIG", sharesNumber: 1_000 }),
      row({ symbol: "MID", sharesNumber: 100 }),
    ];
    expect(
      prepareExposureRows(rows)?.map((item) => [item?.symbol, item?.rank]),
    ).toEqual([
      ["SMALL", 3],
      ["BIG", 1],
      ["MID", 2],
    ]);
  });

  it("preserves the incoming row order — rank is a field, not a sort", () => {
    const rows = [row({ symbol: "A", sharesNumber: 1 }), row({ symbol: "B", sharesNumber: 9 })];
    expect(prepareExposureRows(rows)?.map((item) => item?.symbol)).toEqual(["A", "B"]);
  });

  it("leaves rank null when the share count is missing", () => {
    const rows = [row({ symbol: "NONE", sharesNumber: null }), row({ symbol: "OK" })];
    const prepared = prepareExposureRows(rows);
    expect(prepared?.find((item) => item?.symbol === "NONE")?.rank).toBeNull();
    expect(prepared?.find((item) => item?.symbol === "OK")?.rank).toBe(1);
  });

  it("resolves fundAssets once so column, sort and card agree", () => {
    const prepared = prepareExposureRows([
      row({ symbol: "QUOTE_ONLY", assetsUnderManagement: null, marketCap: 5e8 }),
    ]);
    expect(prepared?.[0]?.fundAssets).toBe(5e8);
  });

  it("tags rows as ETFs so the symbol cell links to /etf/", () => {
    expect(prepareExposureRows([row()])?.[0]?.assetType).toBe("etf");
  });

  it("does not mutate the input rows", () => {
    const rows = [row()];
    prepareExposureRows(rows);
    expect(rows?.[0]).not.toHaveProperty("rank");
  });

  it("is safe on an empty set", () => {
    expect(prepareExposureRows([])).toEqual([]);
  });
});

describe("summarize", () => {
  it("is safe on an empty set", () => {
    expect(summarize([])).toEqual({
      fundCount: 0,
      totalExposure: null,
      averageWeight: null,
      combinedAssets: null,
    });
  });

  it("handles the single-fund case without dividing by zero", () => {
    const summary = summarize([
      row({ weightPercentage: 0.01, marketValue: 134_684, assetsUnderManagement: 1e9 }),
    ]);
    expect(summary?.fundCount).toBe(1);
    expect(summary?.averageWeight).toBeCloseTo(0.01, 10);
    expect(summary?.totalExposure).toBe(134_684);
  });

  it("sums reported position values and averages the weights", () => {
    const summary = summarize([
      row({ marketValue: 100, weightPercentage: 5, assetsUnderManagement: 1_000 }),
      row({ marketValue: 300, weightPercentage: 15, assetsUnderManagement: 2_000 }),
    ]);
    expect(summary?.totalExposure).toBe(400);
    expect(summary?.averageWeight).toBe(10);
    expect(summary?.combinedAssets).toBe(3_000);
  });

  it("skips missing values rather than counting them as zero", () => {
    const summary = summarize([
      row({ marketValue: 100, weightPercentage: 10, assetsUnderManagement: 1_000, marketCap: null }),
      row({ marketValue: null, weightPercentage: null, assetsUnderManagement: null, marketCap: null }),
    ]);
    expect(summary?.fundCount).toBe(2);
    expect(summary?.totalExposure).toBe(100);
    // Averaged over the one fund that reported, not halved by the one that did not.
    expect(summary?.averageWeight).toBe(10);
    expect(summary?.combinedAssets).toBe(1_000);
  });
});
