import { describe, expect, it } from "vitest";
import {
  accumulateFlowStats,
  createFlowStatTotals,
  deriveFlowStatDisplays,
} from "../../src/lib/flow-page-state";

// The summary cards on /options-flow are seeded from the server's compute_stats() and
// then advanced locally with each live WebSocket batch. That only stays honest while
// `seed + deltas === a full recompute`, so that identity is what these assertions pin.
// Field-for-field mirror of backend/app/utils/options_flow_filter.py::compute_stats.

const TRADES = [
  { size: 10, cost_basis: 1000, put_call: "Calls", sentiment: "Bullish" },
  { size: 5, cost_basis: 250, put_call: "Puts", sentiment: "Bearish" },
  { size: 7, cost_basis: 700, put_call: "Calls", sentiment: "Neutral" },
  { size: 3, cost_basis: 90, put_call: "Puts", sentiment: "Bullish" },
  { size: 2, cost_basis: 60, put_call: "Calls", sentiment: "Bearish" },
];

describe("accumulateFlowStats", () => {
  it("sums volume and premium onto the right side of the book", () => {
    const totals = accumulateFlowStats(createFlowStatTotals(), TRADES);
    expect(totals).toEqual({
      callVolumeSum: 19,
      putVolumeSum: 8,
      callPremiumSum: 1760,
      putPremiumSum: 340,
      bullishPremiumSum: 1090,
      bearishPremiumSum: 310,
    });
  });

  it("reaches the same totals however the trades are batched", () => {
    const oneShot = accumulateFlowStats(createFlowStatTotals(), TRADES);

    const batched = createFlowStatTotals();
    accumulateFlowStats(batched, TRADES.slice(0, 2));
    accumulateFlowStats(batched, []);
    accumulateFlowStats(batched, TRADES.slice(2));

    expect(batched).toEqual(oneShot);
  });

  it("ignores rows the server also ignores instead of poisoning the totals with NaN", () => {
    const totals = accumulateFlowStats(createFlowStatTotals(), [
      {
        size: null,
        cost_basis: undefined,
        put_call: "Calls",
        sentiment: "Bullish",
      },
      {
        size: "oops",
        cost_basis: "oops",
        put_call: "Puts",
        sentiment: "Bearish",
      },
      { put_call: "Warrant", sentiment: "Sideways", size: 9, cost_basis: 9 },
      null,
    ]);
    expect(totals).toEqual(createFlowStatTotals());
  });
});

describe("deriveFlowStatDisplays", () => {
  it("derives the ratios and complementary percentages the cards render", () => {
    const derived = deriveFlowStatDisplays(
      accumulateFlowStats(createFlowStatTotals(), TRADES),
    );
    expect(derived.putCallRatio).toBeCloseTo(8 / 19);
    expect(derived.callPercentage).toBe(70); // floor(19/27 * 100)
    expect(derived.putPercentage).toBe(30);
    expect(derived.bullishPercentage).toBe(78); // round(1090/1400 * 100)
    expect(derived.bearishPercentage).toBe(22);
  });

  it("returns zeros rather than NaN or Infinity on an empty book", () => {
    expect(deriveFlowStatDisplays(createFlowStatTotals())).toEqual({
      putCallRatio: 0,
      callPercentage: 0,
      putPercentage: 0,
      bullishPercentage: 0,
      bearishPercentage: 0,
    });
  });

  it("keeps put/call splits complementary when one side is empty", () => {
    const callsOnly = deriveFlowStatDisplays({
      ...createFlowStatTotals(),
      callVolumeSum: 100,
    });
    expect(callsOnly.callPercentage).toBe(100);
    expect(callsOnly.putPercentage).toBe(0);
    expect(callsOnly.putCallRatio).toBe(0);
  });
});
