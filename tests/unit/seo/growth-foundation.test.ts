import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GTM_EVENT_TICKER_SEARCH,
  trackProductEvent,
} from "$lib/constants/tracking";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("consent-aware growth measurement", () => {
  it("does not create a tracking queue before the consent-gated loader initializes it", () => {
    const browserWindow = {} as Window & { dataLayer?: unknown[] };
    vi.stubGlobal("window", browserWindow);

    trackProductEvent(GTM_EVENT_TICKER_SEARCH, { symbol: "AAPL" });
    expect(browserWindow.dataLayer).toBeUndefined();
  });

  it("pushes non-personal product events into an existing consented queue", () => {
    const browserWindow = { dataLayer: [] } as unknown as Window;
    vi.stubGlobal("window", browserWindow);

    trackProductEvent(GTM_EVENT_TICKER_SEARCH, {
      symbol: "AAPL",
      asset_type: "stock",
    });

    expect(browserWindow.dataLayer).toEqual([
      {
        event: "ticker_search",
        symbol: "AAPL",
        asset_type: "stock",
      },
    ]);
  });
});
