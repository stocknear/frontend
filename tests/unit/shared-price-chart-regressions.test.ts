import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  createPriceHistoryLoader,
  mergeLatestPricePoint,
  parsePriceTimestamp,
} from "$lib/priceHistory";
import {
  buildHoverSummary,
  downsampleChartPoints,
  nearestRealPointIndex,
  normalizeChartData,
  sessionPointCount,
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

describe("shared price history regressions", () => {
  it("distinguishes historical millisecond epochs from second epochs", () => {
    expect(parsePriceTimestamp(946_684_800_000)).toBe(946_684_800_000);
    expect(parsePriceTimestamp(946_684_800)).toBe(946_684_800_000);
  });

  it("uses Eastern market time in both standard and daylight time", () => {
    expect(parsePriceTimestamp("2026-01-12 09:30:00")).toBe(
      Date.parse("2026-01-12T14:30:00Z"),
    );
    expect(parsePriceTimestamp("2026-08-12 09:30:00.125")).toBe(
      Date.parse("2026-08-12T13:30:00.125Z"),
    );
  });

  it("does not mutate history while sorting and suppressing an equal latest point", () => {
    const history = [
      { time: 1_000_000_060, close: 11 },
      { time: 1_000_000_000, close: 10 },
    ];
    const result = mergeLatestPricePoint(history, {
      time: 1_000_000_060,
      close: 99,
    });

    expect(result.map((value) => value.close)).toEqual([10, 11]);
    expect(history.map((value) => value.close)).toEqual([11, 10]);
  });

  it("keeps request identities separate and retries after failure", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("failure", { status: 500 }))
      .mockImplementation(async () =>
        new Response(JSON.stringify([{ time: 1_786_547_400, close: 100 }]), {
          status: 200,
        }),
      );
    const loader = createPriceHistoryLoader(fetcher);

    await expect(loader.load("SPY", "one-day", null)).rejects.toThrow("500");
    await loader.load("SPY", "one-day", null);
    await Promise.all([
      loader.load("SPY", "one-week", null),
      loader.load("QQQ", "one-day", null),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(
      fetcher.mock.calls.map(([, init]) => JSON.parse(String(init?.body))),
    ).toEqual([
      { ticker: "SPY", timePeriod: "one-day" },
      { ticker: "SPY", timePeriod: "one-day" },
      { ticker: "SPY", timePeriod: "one-week" },
      { ticker: "QQQ", timePeriod: "one-day" },
    ]);
  });

  it("merges each caller's current point after an in-flight request is shared", async () => {
    let resolveResponse!: (response: Response) => void;
    const loader = createPriceHistoryLoader(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );
    const older = loader.load("SPY", "one-day", {
      time: 1_786_547_460,
      close: 101,
    });
    const newer = loader.load("SPY", "one-day", {
      time: 1_786_547_520,
      close: 102,
    });
    resolveResponse(
      new Response(JSON.stringify([{ time: 1_786_547_400, close: 100 }]), {
        status: 200,
      }),
    );

    await expect(older).resolves.toMatchObject([
      { close: 100 },
      { close: 101 },
    ]);
    await expect(newer).resolves.toMatchObject([
      { close: 100 },
      { close: 102 },
    ]);
  });
});

describe("shared chart data regressions", () => {
  it("rejects coercive prices and leaves the source array untouched", () => {
    const raw = [
      { time: 1_786_547_400, close: null },
      { time: 1_786_547_460, close: true },
      { time: 1_786_547_520, close: " " },
      { time: 1_786_547_580, close: "103" },
    ];
    const snapshot = structuredClone(raw);

    expect(normalizeChartData(raw, "1W").points).toMatchObject([
      { close: 103, sourceIndex: 3, isSynthetic: false },
    ]);
    expect(raw).toEqual(snapshot);
  });

  it("builds one-day sessions correctly on both sides of DST", () => {
    const winter = normalizeChartData(
      [{ time: "2026-01-12 09:30:00", close: 100 }],
      "1D",
    );
    const summer = normalizeChartData(
      [{ time: "2026-08-12 09:30:00", close: 100 }],
      "1D",
    );

    expect(winter.sessionStart).toBe(Date.parse("2026-01-12T14:30:00Z"));
    expect(winter.sessionEnd).toBe(Date.parse("2026-01-12T21:00:00Z"));
    expect(summer.sessionStart).toBe(Date.parse("2026-08-12T13:30:00Z"));
    expect(summer.sessionEnd).toBe(Date.parse("2026-08-12T20:00:00Z"));
    expect(
      sessionPointCount(summer.sessionStart, summer.sessionEnd, 60_000),
    ).toBe(391);
  });

  it("reports the interval of the minute grid it emits for one-day data", () => {
    const result = normalizeChartData(
      [
        { time: "2026-08-12 09:30:00", close: 100 },
        { time: "2026-08-12 09:35:00", close: 105 },
      ],
      "1D",
    );

    expect(result.points).toHaveLength(6);
    expect(result.intervalMs).toBe(60_000);
  });

  it("handles empty, all-synthetic, and out-of-range hover inputs", () => {
    const synthetic = [point(1_000, 10, 0, true)];
    expect(nearestRealPointIndex([], 0)).toBeNull();
    expect(nearestRealPointIndex(synthetic, 0)).toBeNull();
    expect(buildHoverSummary(synthetic, 0, "1D", 9)).toBeNull();

    const points = [point(1_000, 10, 0), point(2_000, 12, 1)];
    expect(buildHoverSummary(points, -100, "1W", null)?.pointIndex).toBe(0);
    expect(buildHoverSummary(points, 100, "1W", null)?.pointIndex).toBe(1);
  });

  it("returns a copy when downsampling is unnecessary", () => {
    const input = [point(1_000, 10, 0), point(2_000, 12, 1)];
    const result = downsampleChartPoints(input, 10);
    expect(result).toEqual(input);
    expect(result).not.toBe(input);
  });
});

describe("shared chart integration contracts", () => {
  const chartSource = readFileSync(
    new URL(
      "../../src/lib/components/Plot/StockPriceChart.svelte",
      import.meta.url,
    ),
    "utf8",
  );

  it("lets the page own wheel and touch scrolling", () => {
    expect(chartSource).toContain('class="w-full h-full touch-pan-y"');
    expect(chartSource).toContain('addEventListener("wheel", stopChartWheel');
    expect(chartSource).toContain("capture: true");
    expect(chartSource).toContain("passive: true");
    expect(chartSource).toContain("evt.stopPropagation()");
    expect(chartSource).not.toContain("evt.preventDefault();\n  };\n\n  const stopChartWheel");
    expect(chartSource).not.toContain('addEventListener("touchmove"');
    expect(chartSource).toContain("chart.setZoomEnabled(false)");
    expect(chartSource).toContain("chart.setScrollEnabled(false)");
  });

  it("cleans up chart subscriptions and scheduled work", () => {
    expect(chartSource).toContain("unsubscribeWheel?.()");
    expect(chartSource).toContain(
      'chart.unsubscribeAction("onCrosshairChange", onCrosshairChange)',
    );
    expect(chartSource).toContain("cancelAnimationFrame(resizeRaf)");
    expect(chartSource).toContain("cancelAnimationFrame(styleRaf)");
    expect(chartSource).toContain("cancelAnimationFrame(dataUpdateRaf)");
    expect(chartSource).toContain("clearTimeout(selectionTimer)");
    expect(chartSource).toContain("clearTimeout(rangeUpdateTimer)");
    expect(chartSource).toContain("clearLayoutWork()");
  });

  it("shows a clamped summary only while the crosshair is inspected", () => {
    expect(chartSource).toContain("const positionTooltip =");
    expect(chartSource).toContain("tooltipVisible = true");
    expect(chartSource).toContain("tooltipVisible = false");
    expect(chartSource).toContain("pointerX - width - TOOLTIP_GAP_PX");
    expect(chartSource).toContain("rect.height - height - TOOLTIP_MARGIN_PX");
    expect(chartSource).toContain("hoverSummary && tooltipVisible");
    expect(chartSource).toContain("bind:this={hoverTooltip}");
    expect(chartSource).toContain("on:blur={onChartBlur}");
  });

  it("keeps interval controls horizontally scrollable on every consumer", () => {
    for (const route of ["stocks", "etf", "index"]) {
      const source = readFileSync(
        new URL(
          `../../src/routes/${route}/[tickerID]/+page.svelte`,
          import.meta.url,
        ),
        "utf8",
      );
      expect(source).toContain("overflow-x-auto");
      expect(source).toContain("createPriceHistoryLoader");
      expect(source).toContain("errorMessage={chartErrorMessage}");
      expect(source).toContain("onRetry=");
    }
  });
});
