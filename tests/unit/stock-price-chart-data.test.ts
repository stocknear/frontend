import { describe, expect, it } from "vitest";
import {
  adjacentRealPointIndex,
  buildHoverSummary,
  chartSamplingTarget,
  downsampleChartPoints,
  formatEtTimestamp,
  nearestRealPointIndex,
  normalizeChartData,
  type ChartPoint,
} from "$lib/components/Plot/stockPriceChartData";

const point = (
  timestamp: number,
  close: number,
  sourceIndex: number,
  isSynthetic = false,
): ChartPoint => ({
  timestamp,
  open: close,
  high: close,
  low: close,
  close,
  volume: 0,
  sourceIndex,
  isSynthetic,
});

describe("normalizeChartData", () => {
  it("strictly parses, sorts, and deduplicates timestamps with the last source winning", () => {
    const timestamp = Date.parse("2026-08-12T13:30:00Z");
    const result = normalizeChartData(
      [
        { time: timestamp + 60_000, close: "102" },
        { time: "2026-08-12T13:30:00Z", close: 100 },
        { time: "2026-08-12 09:30:00", close: 101 },
        { time: "not-a-date", close: 999 },
        { time: timestamp / 1000 + 120, close: Number.NaN },
      ],
      "1W",
    );

    expect(
      result.points.map(({ timestamp, close, sourceIndex }) => ({
        timestamp,
        close,
        sourceIndex,
      })),
    ).toEqual([
      { timestamp, close: 101, sourceIndex: 2 },
      { timestamp: timestamp + 60_000, close: 102, sourceIndex: 0 },
    ]);
  });

  it("marks intraday gap fills synthetic while retaining real source indices", () => {
    const result = normalizeChartData(
      [
        { time: "2026-08-12 09:30:00", close: 100 },
        { time: "2026-08-12 09:32:00", close: 103 },
      ],
      "1D",
    );

    expect(result.realPointCount).toBe(2);
    expect(result.points).toHaveLength(3);
    expect(
      result.points.map((value) => [
        value.close,
        value.isSynthetic,
        value.sourceIndex,
      ]),
    ).toEqual([
      [100, false, 0],
      [100, true, 0],
      [103, false, 1],
    ]);
  });

  it("uses minute geometry after filling sparse one-day data", () => {
    const result = normalizeChartData(
      [
        { time: "2026-08-12 09:30:00", close: 100 },
        { time: "2026-08-12 09:35:00", close: 105 },
      ],
      "1D",
    );

    expect(result.intervalMs).toBe(60_000);
    expect(result.points).toHaveLength(6);
  });

  it("keeps non-session one-day input on its original geometry", () => {
    const result = normalizeChartData(
      [
        { time: "2026-08-12 18:00:00", close: 100 },
        { time: "2026-08-12 18:05:00", close: 105 },
      ],
      "1D",
    );

    expect(result.intervalMs).toBe(5 * 60_000);
    expect(result.sessionStart).toBeNull();
    expect(result.sessionEnd).toBeNull();
    expect(result.points).toHaveLength(2);
  });
});

describe("downsampleChartPoints", () => {
  it("keeps endpoints and the original source identity of selected points", () => {
    const input = [0, 1, 8, 2, 1, 12, 2, 1, 0].map((close, index) =>
      point(index * 60_000, close, 100 + index),
    );
    const sampled = downsampleChartPoints(input, 5);

    expect(sampled).toHaveLength(5);
    expect(sampled[0].sourceIndex).toBe(100);
    expect(sampled.at(-1)?.sourceIndex).toBe(108);
    expect(sampled.map((value) => value.sourceIndex)).toEqual(
      [...sampled.map((value) => value.sourceIndex)].sort(
        (left, right) => left - right,
      ),
    );
    expect(sampled.some((value) => value.sourceIndex === 105)).toBe(true);
  });
});

describe("hover summaries", () => {
  const points = [
    point(1_000, 100, 0),
    point(2_000, 100, 0, true),
    point(3_000, 110, 1),
  ];

  it("snaps synthetic positions to a stable real point", () => {
    expect(nearestRealPointIndex(points, 1)).toBe(0);
    expect(buildHoverSummary(points, 1, "1D", 80)).toMatchObject({
      pointIndex: 0,
      price: 100,
      absoluteChange: 20,
      percentChange: 25,
    });
  });

  it("moves keyboard focus past consecutive synthetic points", () => {
    const keyboardPoints = [
      point(1_000, 100, 0),
      point(2_000, 100, 0, true),
      point(3_000, 100, 0, true),
      point(4_000, 110, 1),
    ];

    expect(adjacentRealPointIndex(keyboardPoints, 0, 1)).toBe(3);
    expect(adjacentRealPointIndex(keyboardPoints, 3, -1)).toBe(0);
    expect(adjacentRealPointIndex(keyboardPoints, 3, 1)).toBeNull();
  });

  it("uses the first real point outside 1D and handles a zero baseline", () => {
    expect(buildHoverSummary(points, 2, "1M", 80)).toMatchObject({
      absoluteChange: 10,
      percentChange: 10,
    });
    expect(
      buildHoverSummary(
        [point(1_000, 0, 0), point(2_000, 5, 1)],
        1,
        "1M",
        null,
      ),
    ).toMatchObject({
      absoluteChange: 5,
      percentChange: null,
    });
  });

  it("formats the fixed summary in Eastern Time", () => {
    expect(formatEtTimestamp(Date.parse("2026-08-12T13:30:00Z"))).toEqual({
      date: "Aug 12, 2026",
      time: "9:30 AM EDT",
    });
  });
});

describe("chartSamplingTarget", () => {
  it("only changes the sampling density at material width boundaries", () => {
    expect(chartSamplingTarget(640)).toBe(600);
    expect(chartSamplingTarget(699)).toBe(600);
    expect(chartSamplingTarget(700)).toBe(700);
    expect(chartSamplingTarget(Number.NaN)).toBe(100);
  });
});
