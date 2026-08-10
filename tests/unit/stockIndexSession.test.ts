import { describe, it, expect } from "vitest";
import { resolveStockIndexSession } from "$lib/utils";

const allFalse = {
  isOpen: false,
  isWeekend: false,
  isHoliday: false,
  isBeforeMarketOpen: false,
  isAfterMarketClose: false,
};

describe("resolveStockIndexSession", () => {
  it("returns null while the market is open", () => {
    expect(
      resolveStockIndexSession({ ...allFalse, isOpen: true }),
    ).toBeNull();
  });

  it("returns null on weekends even when outside regular hours", () => {
    expect(
      resolveStockIndexSession({
        ...allFalse,
        isWeekend: true,
        isBeforeMarketOpen: true,
      }),
    ).toBeNull();
    expect(
      resolveStockIndexSession({
        ...allFalse,
        isWeekend: true,
        isAfterMarketClose: true,
      }),
    ).toBeNull();
  });

  it("returns null on holidays even when outside regular hours", () => {
    expect(
      resolveStockIndexSession({
        ...allFalse,
        isHoliday: true,
        isAfterMarketClose: true,
      }),
    ).toBeNull();
  });

  it("returns 'pre' before the market opens", () => {
    expect(
      resolveStockIndexSession({ ...allFalse, isBeforeMarketOpen: true }),
    ).toBe("pre");
  });

  it("returns 'after' after the market closes", () => {
    expect(
      resolveStockIndexSession({ ...allFalse, isAfterMarketClose: true }),
    ).toBe("after");
  });

  it("precedes 'pre' over 'after' when both flags are set", () => {
    expect(
      resolveStockIndexSession({
        ...allFalse,
        isBeforeMarketOpen: true,
        isAfterMarketClose: true,
      }),
    ).toBe("pre");
  });

  it("returns null when closed for an unexpected reason (no flag set)", () => {
    expect(resolveStockIndexSession(allFalse)).toBeNull();
  });

  it("treats the gate flags as dominant regardless of order", () => {
    expect(
      resolveStockIndexSession({
        isOpen: false,
        isWeekend: true,
        isHoliday: true,
        isBeforeMarketOpen: true,
        isAfterMarketClose: true,
      }),
    ).toBeNull();
  });
});
