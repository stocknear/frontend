import { describe, expect, it, vi } from "vitest";
import {
  _parsePublicMcpCatalog,
  load,
} from "../../src/routes/mcp/+page.server";

describe("public MCP catalog", () => {
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
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            tools: [{ name: "get_ticker_quote", category: "quote" }],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockRejectedValueOnce(new Error("offline"));
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
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });

  it.each(["Free", "Plus"])(
    "redirects an authenticated %s user to localized pricing",
    async (tier) => {
      const fetch = vi.fn();
      await expect(
        load({
          fetch,
          locals: { user: { tier } },
          url: new URL("https://stocknear.com/de/mcp?source=profile"),
        } as never),
      ).rejects.toMatchObject({
        status: 303,
        location: "/de/pricing?source=profile",
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
