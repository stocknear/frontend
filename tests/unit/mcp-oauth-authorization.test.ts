import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  completeMcpAuthorization,
  getMcpAuthorizationRequest,
  parseMcpAuthorizationRequest,
  parseOpaqueOAuthRequest,
} from "$lib/server/mcpOAuth";
import { actions, load } from "../../src/routes/oauth/authorize/+page.server";

const requestId = "oauth_request_1234567890";
const authorization = {
  request: requestId,
  clientId: "stocknear-claude-web",
  clientName: "Claude",
  clientSource: "predefined",
  redirectHost: "claude.ai",
  scopes: ["mcp:tools"],
  resource: "https://mcp.stocknear.com/mcp",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("Stocknear OAuth consent bridge", () => {
  it("accepts only bounded opaque request ids and bounded provider metadata", () => {
    expect(parseOpaqueOAuthRequest(requestId)).toBe(requestId);
    expect(parseOpaqueOAuthRequest("../request")).toBeNull();
    expect(parseMcpAuthorizationRequest(authorization)).toEqual(authorization);
    expect(() =>
      parseMcpAuthorizationRequest({ ...authorization, scopes: "mcp:tools" }),
    ).toThrow();
    expect(() =>
      parseMcpAuthorizationRequest({
        ...authorization,
        clientName: "Trusted\u202eClient",
      }),
    ).toThrow();
    expect(() =>
      parseMcpAuthorizationRequest({
        ...authorization,
        clientSource: "verified",
      }),
    ).toThrow();
    expect(
      parseMcpAuthorizationRequest({
        ...authorization,
        clientName: "C".repeat(160),
      }).clientName,
    ).toHaveLength(160);
    expect(() =>
      parseMcpAuthorizationRequest({
        ...authorization,
        clientName: "C".repeat(161),
      }),
    ).toThrow();
  });

  it("validates the opaque request over loopback without credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(authorization));
    await expect(
      getMcpAuthorizationRequest(fetcher, requestId),
    ).resolves.toEqual(authorization);
    expect(fetcher).toHaveBeenCalledWith(
      `http://127.0.0.1:8001/oauth/request/${requestId}`,
      expect.objectContaining({ credentials: "omit", redirect: "error" }),
    );
    expect(fetcher.mock.calls[0][1].headers).toEqual({
      Accept: "application/json",
    });
  });

  it("sends the PB user token only in the server-to-server completion body", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        redirectUrl: "https://claude.ai/api/mcp/auth_callback?code=one",
      }),
    );
    await expect(
      completeMcpAuthorization(
        fetcher,
        requestId,
        "pb-secret-token",
        "approve",
      ),
    ).resolves.toBe("https://claude.ai/api/mcp/auth_callback?code=one");
    const options = fetcher.mock.calls[0][1];
    expect(JSON.parse(options.body)).toEqual({
      request: requestId,
      userToken: "pb-secret-token",
      decision: "approve",
    });
    expect(options.headers.Authorization).toBeUndefined();
  });

  it.each([
    "https://user:secret@client.example/callback",
    "https://client.example/callback#code=fragment",
    "http://client.example/callback",
    "javascript:alert(1)",
  ])("rejects an unsafe completion redirect: %s", async (redirectUrl) => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ redirectUrl }));
    await expect(
      completeMcpAuthorization(
        fetcher,
        requestId,
        "pb-secret-token",
        "approve",
      ),
    ).rejects.toThrow("Invalid MCP authorization redirect");
  });

  it("redirects a signed-out user to login with the exact internal continuation", async () => {
    const setHeaders = vi.fn();
    await expect(
      load({
        locals: { pb: { authStore: { isValid: false } }, user: undefined },
        url: new URL(
          `https://stocknear.com/oauth/authorize?request=${requestId}`,
        ),
        fetch: vi.fn().mockResolvedValue(jsonResponse(authorization)),
        setHeaders,
      } as any),
    ).rejects.toMatchObject({
      status: 303,
      location: `/login?returnUrl=${encodeURIComponent(`/oauth/authorize?request=${requestId}`)}`,
    });
    expect(setHeaders).toHaveBeenCalledWith(
      expect.objectContaining({
        "cache-control": "private, no-store, max-age=0",
        "referrer-policy": "no-referrer",
        "x-robots-tag": "noindex, nofollow",
      }),
    );
  });

  it("renders consent for the existing authenticated Stocknear user", async () => {
    await expect(
      load({
        locals: {
          pb: { authStore: { isValid: true } },
          user: { id: "user123", email: "pro@example.com", tier: "Pro" },
        },
        url: new URL(
          `https://stocknear.com/oauth/authorize?request=${requestId}`,
        ),
        fetch: vi.fn().mockResolvedValue(jsonResponse(authorization)),
        setHeaders: vi.fn(),
      } as any),
    ).resolves.toMatchObject({
      request: requestId,
      authorization,
      userEmail: "pro@example.com",
      canApprove: true,
    });
  });

  it.each(["approve", "deny"] as const)(
    "maps the %s action to a server-owned decision and redirects to the validated callback",
    async (decision) => {
      const fetcher = vi.fn().mockResolvedValue(
        jsonResponse({
          redirectUrl: "https://client.example/callback?state=safe",
        }),
      );
      await expect(
        actions[decision]({
          locals: {
            pb: { authStore: { isValid: true, token: "pb-user-token" } },
            user: { id: "user123", tier: "Pro" },
          },
          url: new URL(
            `https://stocknear.com/oauth/authorize?request=${requestId}`,
          ),
          fetch: fetcher,
          setHeaders: vi.fn(),
        } as any),
      ).rejects.toMatchObject({
        status: 303,
        location: "https://client.example/callback?state=safe",
      });
      expect(JSON.parse(fetcher.mock.calls[0][1].body).decision).toBe(decision);
    },
  );

  it("surfaces a typed transient completion failure without leaking backend text", async () => {
    const result = await actions.approve({
      locals: {
        pb: { authStore: { isValid: true, token: "pb-user-token" } },
        user: { id: "user123", tier: "Pro" },
      },
      url: new URL(
        `https://stocknear.com/oauth/authorize?request=${requestId}`,
      ),
      fetch: vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: "temporarily_unavailable",
            error_description: "internal detail that must not reach the page",
          },
          503,
        ),
      ),
      setHeaders: vi.fn(),
    } as any);
    expect(result).toMatchObject({
      status: 503,
      data: { oauthError: "unavailable" },
    });
  });

  it.each(["Free", "Plus"])(
    "does not permit a %s account to approve",
    async (tier) => {
      const fetcher = vi.fn();
      const result = await actions.approve({
        locals: {
          pb: { authStore: { isValid: true, token: "pb-user-token" } },
          user: { id: "user123", tier },
        },
        url: new URL(
          `https://stocknear.com/oauth/authorize?request=${requestId}`,
        ),
        fetch: fetcher,
        setHeaders: vi.fn(),
      } as any);
      expect(result).toMatchObject({
        status: 403,
        data: { oauthError: "pro_required" },
      });
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("never places the PocketBase token or decision in browser-controlled fields", () => {
    const source = readFileSync(
      new URL("../../src/routes/oauth/authorize/+page.svelte", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("userToken");
    expect(source).not.toContain('name="decision"');
    expect(source).not.toContain('type="hidden"');
    expect(source).toContain("?/approve&request=");
    expect(source).toContain("?/deny&request=");
    expect(source).toContain("data.authorization.clientId");
    expect(source).toContain("mcp_oauth_unverified_client");
  });

  it("keeps consent out of the product shell and analytics surfaces", () => {
    const layout = readFileSync(
      new URL("../../src/routes/+layout.svelte", import.meta.url),
      "utf8",
    );
    expect(layout).toContain(
      "!isChartRoute && !isLandingPage && !isSensitiveOAuthRoute",
    );
    expect(layout).toContain(
      "data?.cookieConsent?.marketing === true && !isSensitiveOAuthRoute",
    );
    expect(layout).toContain("isChartRoute || isSensitiveOAuthRoute");
  });
});
