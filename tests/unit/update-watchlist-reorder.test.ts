import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../../src/routes/api/update-watchlist/+server";

const WATCHLIST_ID = "abcdefghij12345";

const stored = () => [
  { symbol: "AAPL", note: "buy the dip", addedPrice: 191.13 },
  { symbol: "^SPX", note: "", addedPrice: 5200 },
  { symbol: "GTLB", note: "earnings 12/3", addedPrice: 34.98 },
];

let update: ReturnType<typeof vi.fn>;

function event(body: unknown) {
  update = vi.fn(async (_id: string, payload: any) => payload);
  const collection = vi.fn((name: string) => {
    if (name !== "watchlist") throw new Error(`Unexpected collection: ${name}`);
    return {
      getOne: vi.fn(async () => ({ user: "user-1", ticker: stored() })),
      update,
    };
  });
  return {
    request: new Request("https://stocknear.com/api/update-watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    locals: {
      user: { id: "user-1", tier: "Pro" },
      pb: { collection },
      apiURL: "https://api.test",
      apiKey: "key",
    },
  } as any;
}

describe("watchlist reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies the requested order and keeps every note and added price", async () => {
    const response = await POST(
      event({
        watchListId: WATCHLIST_ID,
        mode: "reorder",
        ticker: ["GTLB", "^SPX", "AAPL"],
      }),
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledOnce();
    expect(update.mock.calls[0][1].ticker).toEqual([
      { symbol: "GTLB", note: "earnings 12/3", addedPrice: 34.98 },
      { symbol: "^SPX", note: "", addedPrice: 5200 },
      { symbol: "AAPL", note: "buy the dip", addedPrice: 191.13 },
    ]);
  });

  it("keeps symbols the client did not list, at the end", async () => {
    await POST(
      event({
        watchListId: WATCHLIST_ID,
        mode: "reorder",
        ticker: ["GTLB", "AAPL"],
      }),
    );

    expect(update.mock.calls[0][1].ticker.map((t: any) => t.symbol)).toEqual([
      "GTLB",
      "AAPL",
      "^SPX",
    ]);
  });

  it("rejects anything that is not a list of valid symbols", async () => {
    for (const ticker of [
      [{ symbol: "AAPL" }],
      ["AAPL", "not a symbol"],
      "AAPL",
    ]) {
      const response = await POST(
        event({ watchListId: WATCHLIST_ID, mode: "reorder", ticker }),
      );
      expect(response.status).toBe(400);
      expect(update).not.toHaveBeenCalled();
    }
  });
});
