import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const watchlist = read("src/lib/components/WatchlistButton.svelte");
const stockPriceExport = read("src/lib/components/StockPriceExport.svelte");

describe("shared ticker action surfaces", () => {
  it("uses the Price Alert surface for Watchlist on desktop", () => {
    expect(watchlist).toContain("sm:border sm:border-line sm:bg-surface-card");
    expect(watchlist).toContain("sm:hover:bg-[#f8fbfb]");
    expect(watchlist).toContain("sm:dark:hover:bg-zinc-900/70");
    expect(watchlist).not.toContain("sm:bg-white/90");
    expect(watchlist).not.toContain("sm:dark:bg-zinc-950/70");
  });

  it("prevents the shared Button default from overriding Export in dark mode", () => {
    expect(stockPriceExport).toContain(
      "border border-line text-fg bg-surface-card dark:bg-surface-card hover:bg-[#f8fbfb] dark:hover:bg-zinc-900/70",
    );
  });

  it("keeps all three ticker families on the shared action components", () => {
    for (const route of [
      "src/routes/stocks/[tickerID]/+layout.svelte",
      "src/routes/etf/[tickerID]/+layout.svelte",
      "src/routes/index/[tickerID]/+layout.svelte",
    ]) {
      const source = read(route);
      expect(source, route).toContain("<WatchlistButton");
      expect(source, route).toContain("<StockPriceExport");
      expect(source, route).toContain("bg-surface-card");
    }
  });
});
