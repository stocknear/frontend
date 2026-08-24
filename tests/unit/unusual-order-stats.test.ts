import { describe, expect, it } from "vitest";
import {
  accumulateUnusualStats,
  createUnusualStatTotals,
  deriveUnusualStatDisplays,
} from "../../src/lib/flow-page-state";

// Same contract as options-flow-stats: the /unusual-order-flow cards are seeded from
// the server's compute_stats() and advanced locally with each live WebSocket batch, so
// `seed + deltas` must equal a full recompute. Field-for-field mirror of
// backend/app/utils/unusual_order_filter.py::compute_stats — note it compares the
// stored "DP" / "B" and "Stock" / "ETF" values exactly, with no case folding.

const ORDERS = [
  { size: 1000, premium: 50_000, transactionType: "DP", assetType: "Stock" },
  { size: 400, premium: 20_000, transactionType: "B", assetType: "ETF" },
  { size: 250, premium: 12_500, transactionType: "DP", assetType: "ETF" },
  { size: 350, premium: 17_500, transactionType: "DP", assetType: "Stock" },
];

describe("accumulateUnusualStats", () => {
  it("sums size and premium and counts each transaction and asset type", () => {
    expect(accumulateUnusualStats(createUnusualStatTotals(), ORDERS)).toEqual({
      totalVolume: 2000,
      totalValue: 100_000,
      darkPoolCount: 3,
      blockOrderCount: 1,
      stockCount: 2,
      etfCount: 2,
    });
  });

  it("reaches the same totals however the orders are batched", () => {
    const oneShot = accumulateUnusualStats(createUnusualStatTotals(), ORDERS);

    const batched = createUnusualStatTotals();
    accumulateUnusualStats(batched, ORDERS.slice(0, 1));
    accumulateUnusualStats(batched, []);
    accumulateUnusualStats(batched, ORDERS.slice(1));

    expect(batched).toEqual(oneShot);
  });

  it("counts only the exact stored labels, and never turns a bad row into NaN", () => {
    const totals = accumulateUnusualStats(createUnusualStatTotals(), [
      // Display labels and lowercase variants are not what the data holds.
      {
        size: 10,
        premium: 1,
        transactionType: "Dark Pool Order",
        assetType: "stock",
      },
      {
        size: null,
        premium: undefined,
        transactionType: "DP",
        assetType: "ETF",
      },
      null,
    ]);
    expect(totals).toEqual({
      ...createUnusualStatTotals(),
      totalVolume: 10,
      totalValue: 1,
      darkPoolCount: 1,
      etfCount: 1,
    });
  });
});

describe("deriveUnusualStatDisplays", () => {
  it("floors each leading share and gives the other side the remainder", () => {
    const derived = deriveUnusualStatDisplays(
      accumulateUnusualStats(createUnusualStatTotals(), ORDERS),
    );
    expect(derived).toEqual({
      darkPoolPercentage: 75,
      blockOrderPercentage: 25,
      stockPercentage: 50,
      etfPercentage: 50,
    });
  });

  it("never leaves a split summing past 100 when the share does not divide evenly", () => {
    const derived = deriveUnusualStatDisplays({
      ...createUnusualStatTotals(),
      darkPoolCount: 2,
      blockOrderCount: 1,
      stockCount: 1,
      etfCount: 2,
    });
    expect(derived.darkPoolPercentage).toBe(66); // floor(2/3 * 100)
    expect(derived.blockOrderPercentage).toBe(34);
    expect(derived.stockPercentage).toBe(33);
    expect(derived.etfPercentage).toBe(67);
  });

  it("returns zeros rather than NaN on an empty book", () => {
    expect(deriveUnusualStatDisplays(createUnusualStatTotals())).toEqual({
      darkPoolPercentage: 0,
      blockOrderPercentage: 0,
      stockPercentage: 0,
      etfPercentage: 0,
    });
  });
});
