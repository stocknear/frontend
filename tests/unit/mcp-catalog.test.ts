import { describe, expect, it, vi } from "vitest";
import {
  _parseMcpOAuthReadiness,
  _parsePublicMcpCatalog,
  load,
} from "../../src/routes/mcp/+page.server";

describe("public MCP catalog", () => {
  it("advertises browser OAuth only for the complete ready contract", () => {
    expect(
      _parseMcpOAuthReadiness({
        status: "ready",
        authentication: "oauth-and-pat",
        oauth_jwks: true,
      }),
    ).toBe(true);
    for (const value of [
      null,
      {},
      { status: "ready", authentication: "pat" },
      {
        status: "not_ready",
        authentication: "oauth-and-pat",
        oauth_jwks: true,
      },
      {
        status: "ready",
        authentication: "oauth-and-pat",
        oauth_jwks: false,
      },
    ]) {
      expect(_parseMcpOAuthReadiness(value)).toBe(false);
    }
  });

  it("accepts the narrow metadata contract", () => {
    expect(
      _parsePublicMcpCatalog({
        version: "0.1.0",
        tools: [
          { name: "get_ticker_quote", category: "quote" },
          { name: "get_market_news", category: "market" },
        ],
      }),
    ).toEqual([
      { name: "get_ticker_quote", category: "quote" },
      { name: "get_market_news", category: "market" },
    ]);
  });

  it.each([
    null,
    {},
    { tools: [{ name: "../secret", category: "market" }] },
    { tools: [{ name: "get_quote", category: "../market" }] },
    {
      tools: [
        { name: "get_quote", category: "quote" },
        { name: "get_quote", category: "quote" },
      ],
    },
  ])("rejects malformed or duplicate tools", (payload) => {
    expect(() => _parsePublicMcpCatalog(payload)).toThrow();
  });

  it("serves the last validated catalog during a temporary outage", async () => {
    let online = true;
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (!online) throw new Error("offline");
      if (String(input).endsWith("/readyz")) {
        return new Response(
          JSON.stringify({
            status: "ready",
            authentication: "oauth-and-pat",
            oauth_jwks: true,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      online = false;
      return new Response(
        JSON.stringify({
          tools: [{ name: "get_ticker_quote", category: "quote" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const now = vi
      .spyOn(Date, "now")
      .mockReturnValue(300_003)
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(300_002);

    await expect(
      load({
        fetch,
        locals: { user: null },
        url: new URL("https://stocknear.com/mcp"),
      } as never),
    ).resolves.toEqual({
      mcpTools: [{ name: "get_ticker_quote", category: "quote" }],
      isPro: false,
      oauthAvailable: true,
    });
    await expect(
      load({
        fetch,
        locals: { user: { tier: "Pro" } },
        url: new URL("https://stocknear.com/mcp"),
      } as never),
    ).resolves.toEqual({
      mcpTools: [{ name: "get_ticker_quote", category: "quote" }],
      isPro: true,
      oauthAvailable: false,
    });
    expect(fetch).toHaveBeenCalledTimes(4);
    now.mockRestore();
  });

  it.each(["Free", "Plus"])(
    "shows the MCP guide to an authenticated %s user",
    async (tier) => {
      const fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ tools: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      await expect(
        load({
          fetch,
          locals: { user: { tier } },
          url: new URL("https://stocknear.com/de/mcp?source=profile"),
        } as never),
      ).resolves.toMatchObject({
        isPro: false,
        oauthAvailable: false,
      });
    },
  );
});
