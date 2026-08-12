import { describe, expect, it, vi } from "vitest";

import {
  createPriceHistoryLoader,
  mergeLatestPricePoint,
  parsePriceTimestamp,
} from "../../src/lib/priceHistory";

describe("price history", () => {
  it("parses market timestamps independently of the browser timezone", () => {
    expect(parsePriceTimestamp(1_786_547_400)).toBe(1_786_547_400_000);
    expect(parsePriceTimestamp("1786547400000")).toBe(1_786_547_400_000);
    expect(parsePriceTimestamp("2026-08-12T09:30:00-04:00")).toBe(
      Date.parse("2026-08-12T13:30:00Z"),
    );
    expect(parsePriceTimestamp("2026-08-12 09:30:00")).toBe(
      Date.parse("2026-08-12T13:30:00Z"),
    );
    expect(parsePriceTimestamp("2026-02-30 09:30:00")).toBeNull();
    expect(parsePriceTimestamp("2026-08-12T25:30:00Z")).toBeNull();
    expect(parsePriceTimestamp("2026-03-08 02:30:00")).toBeNull();
    expect(parsePriceTimestamp("not-a-date")).toBeNull();
  });

  it("appends the current point only when it is newer", () => {
    const history = [{ time: 1_000_000_000, close: 10 }];
    expect(
      mergeLatestPricePoint(history, { time: 1_000_000_060, close: 11 }),
    ).toHaveLength(2);
    expect(
      mergeLatestPricePoint(history, { time: 999_999_999, close: 9 }),
    ).toEqual(history);
  });

  it("rejects coercive point values and sorts server history", async () => {
    expect(
      mergeLatestPricePoint(
        [
          { time: 1_000_000_060, close: 11 },
          { time: 1_000_000_000, close: 10 },
        ],
        null,
      ).map((point) => point.close),
    ).toEqual([10, 11]);

    await expect(
      createPriceHistoryLoader(
        async () =>
          new Response(JSON.stringify([{ time: 1_000_000_000, close: null }]), {
            status: 200,
          }),
      ).load("SPY", "one-week", null),
    ).rejects.toThrow("invalid");
  });

  it("validates responses and coalesces identical in-flight requests", async () => {
    let resolveResponse!: (response: Response) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );
    const loader = createPriceHistoryLoader(fetcher);
    const first = loader.load("SPY", "one-week", null);
    const second = loader.load("SPY", "one-week", null);
    expect(fetcher).toHaveBeenCalledTimes(1);
    resolveResponse(
      new Response(JSON.stringify([{ time: 1_786_547_400, close: 640 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(first).resolves.toHaveLength(1);
    await expect(second).resolves.toHaveLength(1);
  });

  it("rejects non-success and malformed responses", async () => {
    await expect(
      createPriceHistoryLoader(async () => new Response("no", { status: 503 })).load(
        "SPY",
        "one-week",
        null,
      ),
    ).rejects.toThrow("503");

    await expect(
      createPriceHistoryLoader(
        async () => new Response(JSON.stringify([{ close: 1 }]), { status: 200 }),
      ).load("SPY", "one-week", null),
    ).rejects.toThrow("invalid");
  });
});
