import { describe, expect, it, vi } from "vitest";
import {
  MCP_ACCOUNT_PATH,
  MCP_OAUTH_PATH,
  MCP_OAUTH_SESSION_PATH,
  MCP_TOKEN_PATH,
  getMcpAccount,
  parseMcpAccount,
  revokeMcpToken,
  rotateMcpToken,
  revokeAllMcpOAuthSessions,
  revokeMcpOAuthSession,
} from "../../src/lib/server/mcpAccount";

const now = "2026-08-11T12:00:00Z";
const accountResponse = {
  eligible: true,
  token: {
    prefix: "sn_mcp_abcd1234",
    createdAt: now,
    status: "active",
  },
  oauth: {
    sessions: [
      {
        sessionId: "session_abcd1234",
        clientId: "stocknear-claude-web",
        clientName: "Claude",
        clientSource: "predefined",
        scopes: ["mcp:tools"],
        resource: "https://mcp.stocknear.com/mcp",
        createdAt: now,
        lastRefreshedAt: now,
        expiresAt: "2026-09-11T12:00:00Z",
      },
    ],
  },
};

describe("MCP owner account client", () => {
  it("uses only the authenticated owner status route and parses bounded metadata", async () => {
    const send = vi.fn().mockResolvedValue(accountResponse);
    const account = await getMcpAccount({ send } as any);

    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(MCP_ACCOUNT_PATH, { method: "GET" });
    expect(account.token?.prefix).toBe("sn_mcp_abcd1234");
    expect(account.token?.status).toBe("active");
  });

  it("rotates through the exact empty-body owner route and returns the secret once", async () => {
    // This matches the real PocketBase 0.39.3 hook fixture boundary.
    const rawToken = `sn_mcp_${"a".repeat(43)}`;
    const send = vi.fn().mockResolvedValue({
      token: rawToken,
      tokenInfo: accountResponse.token,
    });

    const created = await rotateMcpToken({ send } as any);

    expect(send).toHaveBeenCalledWith(MCP_TOKEN_PATH, {
      method: "POST",
      body: {},
    });
    expect(created.token).toBe(rawToken);
  });

  it("rejects a malformed one-time secret", async () => {
    const send = vi.fn().mockResolvedValue({
      token: "sn_mcp_too-short",
      tokenInfo: accountResponse.token,
    });
    await expect(rotateMcpToken({ send } as any)).rejects.toThrow();
  });

  it("revokes idempotently through the owner route without a request body", async () => {
    const send = vi.fn().mockResolvedValue({ revoked: true });
    await revokeMcpToken({ send } as any);
    expect(send).toHaveBeenCalledWith(MCP_TOKEN_PATH, { method: "DELETE" });
  });

  it("revokes one OAuth session by opaque owner-scoped id", async () => {
    const send = vi.fn().mockResolvedValue({ revoked: true });
    await revokeMcpOAuthSession({ send } as any, "session_abcd1234");
    expect(send).toHaveBeenCalledWith(MCP_OAUTH_SESSION_PATH, {
      method: "DELETE",
      body: { sessionId: "session_abcd1234" },
    });
  });

  it("revokes all OAuth sessions without changing the personal token", async () => {
    const send = vi.fn().mockResolvedValue({ revoked: true });
    await revokeAllMcpOAuthSessions({ send } as any);
    expect(send).toHaveBeenCalledWith(MCP_OAUTH_PATH, {
      method: "DELETE",
      body: {},
    });
  });

  it.each([
    { ...accountResponse, eligible: "yes" },
    {
      ...accountResponse,
      token: { ...accountResponse.token, createdAt: "yesterday" },
    },
    {
      ...accountResponse,
      token: { ...accountResponse.token, status: "revoked" },
    },
  ])("fails closed on malformed owner metadata", (value) => {
    expect(() => parseMcpAccount(value)).toThrow();
  });

  it("ignores additive response metadata while validating the known contract", () => {
    expect(
      parseMcpAccount({
        ...accountResponse,
        serverVersion: 2,
        token: { ...accountResponse.token, expiresAt: "2027-08-11T12:00:00Z" },
        oauth: { ...accountResponse.oauth, provider: "stocknear" },
      }),
    ).toEqual(accountResponse);
  });

  it("accepts null OAuth metadata for an ineligible account", () => {
    expect(
      parseMcpAccount({ eligible: false, token: null, oauth: null }),
    ).toEqual({
      eligible: false,
      token: null,
      oauth: null,
    });
  });

  it("rejects duplicate or malformed OAuth sessions", () => {
    const session = accountResponse.oauth.sessions[0];
    expect(() =>
      parseMcpAccount({
        ...accountResponse,
        oauth: { sessions: [session, session] },
      }),
    ).toThrow();
    expect(() =>
      parseMcpAccount({
        ...accountResponse,
        oauth: { sessions: [{ ...session, scopes: "mcp" }] },
      }),
    ).toThrow();
    expect(() =>
      parseMcpAccount({
        ...accountResponse,
        oauth: {
          sessions: Array.from({ length: 26 }, (_, index) => ({
            ...session,
            sessionId: `session_${String(index).padStart(8, "0")}`,
          })),
        },
      }),
    ).toThrow();
  });

  it("treats legacy expired metadata as no active token during rollout", () => {
    expect(
      parseMcpAccount({
        ...accountResponse,
        token: {
          ...accountResponse.token,
          expiresAt: "2026-08-10T12:00:00Z",
          status: "expired",
        },
      }).token,
    ).toBeNull();
  });
});
