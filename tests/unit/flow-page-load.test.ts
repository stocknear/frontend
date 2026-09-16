import { beforeEach, describe, expect, it, vi } from "vitest";

const serverMocks = vi.hoisted(() => ({
  getAPI: vi.fn(),
  issueWsToken: vi.fn(),
}));

vi.mock("$lib/server/api", () => ({ getAPI: serverMocks.getAPI }));
vi.mock("$lib/server/ws-token", () => ({
  issueWsToken: serverMocks.issueWsToken,
}));

import { load as loadOptionsFlow } from "../../src/routes/options-flow/+page.server";
import { load as loadUnusualFlow } from "../../src/routes/unusual-order-flow/+page.server";

function noCookies() {
  return { get: () => undefined };
}

function requestPath(): URL {
  const path = serverMocks.getAPI.mock.calls.at(-1)?.[1];
  return new URL(path, "https://stocknear.com");
}

describe("flow page server loads", () => {
  beforeEach(() => {
    serverMocks.getAPI.mockReset().mockResolvedValue({ items: [] });
    serverMocks.issueWsToken.mockReset().mockResolvedValue("ws-token");
  });

  it("passes a saved 0DTE rule and search query to the initial options feed", async () => {
    const getFullList = vi.fn(async () => [
      {
        updated: "2026-08-12T12:00:00Z",
        rules: [
          { name: "date_expiration", condition: "exactly", value: 0 },
          { name: "size", condition: "exactly", value: "$1.5M" },
          { name: "cost_basis", condition: "between", value: ["", "5M"] },
          { name: "put_call", value: ["Calls", 5] },
          { name: "volume", condition: "exactly", value: "1garbage" },
        ],
      },
    ]);
    const locals = {
      user: { id: "user-1", tier: "Pro" },
      wsURL: "wss://example.test",
      pb: { collection: () => ({ getFullList }) },
    };

    await loadOptionsFlow({
      locals,
      url: new URL("https://stocknear.com/options-flow?query=AAPL"),
      cookies: noCookies(),
    } as any);

    const request = requestPath();
    expect(request.searchParams.get("search")).toBe("AAPL");
    expect(JSON.parse(request.searchParams.get("rules") ?? "[]")).toEqual([
      { name: "date_expiration", condition: "exactly", value: 0 },
      { name: "size", condition: "exactly", value: 1_500_000 },
      { name: "cost_basis", condition: "between", value: [null, 5_000_000] },
    ]);
  });

  it("passes saved zero-valued rules and search to the initial unusual flow", async () => {
    const getFullList = vi.fn(async () => [
      {
        updated: "2026-08-12T12:00:00Z",
        rules: [
          { name: "size", condition: "exactly", value: 0 },
          { name: "premium", condition: "exactly", value: "1,000" },
          { name: "transactionType", value: ["Dark Pool Order", 5] },
          { name: "volume", condition: "exactly", value: "bad" },
        ],
      },
    ]);
    const locals = {
      user: { id: "user-1", tier: "Pro" },
      wsURL: "wss://example.test",
      pb: { collection: () => ({ getFullList }) },
    };

    await loadUnusualFlow({
      locals,
      url: new URL("https://stocknear.com/unusual-order-flow?query=MSFT"),
      cookies: noCookies(),
    } as any);

    const request = requestPath();
    expect(request.searchParams.get("search")).toBe("MSFT");
    expect(JSON.parse(request.searchParams.get("rules") ?? "[]")).toEqual([
      { name: "size", condition: "exactly", value: 0 },
      { name: "premium", condition: "exactly", value: 1_000 },
    ]);
  });

  describe("remembered filter", () => {
    const strategies = [
      {
        id: "newest00000001",
        updated: "2026-08-12T12:00:00Z",
        rules: [{ name: "cost_basis", condition: "over", value: "500K" }],
      },
      {
        id: "older000000002",
        updated: "2026-01-01T12:00:00Z",
        rules: [{ name: "cost_basis", condition: "over", value: "1M" }],
      },
    ];

    function localsWith() {
      return {
        user: { id: "user-1", tier: "Pro" },
        wsURL: "wss://example.test",
        pb: {
          collection: () => ({ getFullList: async () => [...strategies] }),
        },
      };
    }

    async function loadWithCookie(value: string | undefined) {
      return (await loadOptionsFlow({
        locals: localsWith(),
        url: new URL("https://stocknear.com/options-flow"),
        cookies: { get: () => value },
      } as any)) as any;
    }

    it("loads the remembered filter instead of the most recently saved one", async () => {
      const result = await loadWithCookie("older000000002");

      expect(result.activeStrategyId).toBe("older000000002");
      expect(
        JSON.parse(requestPath().searchParams.get("rules") ?? "[]"),
      ).toEqual([{ name: "cost_basis", condition: "over", value: 1_000_000 }]);
    });

    it("falls back to the first filter when the remembered one is gone", async () => {
      const result = await loadWithCookie("deleted0000000");

      expect(result.activeStrategyId).toBe("newest00000001");
      expect(
        JSON.parse(requestPath().searchParams.get("rules") ?? "[]"),
      ).toEqual([{ name: "cost_basis", condition: "over", value: 500_000 }]);
    });

    it("falls back to the first filter when nothing is remembered", async () => {
      const result = await loadWithCookie(undefined);

      expect(result.activeStrategyId).toBe("newest00000001");
    });
  });
});
