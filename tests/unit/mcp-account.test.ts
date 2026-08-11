import { describe, expect, it, vi } from "vitest";
import {
  MCP_ACCOUNT_PATH,
  MCP_OAUTH_PATH,
  MCP_TOKEN_PATH,
  getMcpAccount,
  parseMcpAccount,
  revokeMcpToken,
  rotateMcpToken,
  unlinkMcpOAuth,
} from "../../src/lib/server/mcpAccount";

const now = "2026-08-11T12:00:00Z";
const later = "2027-08-11T12:00:00Z";

const accountResponse = {
  eligible: true,
  token: {
    prefix: "sn_mcp_abcd1234",
    createdAt: now,
    expiresAt: later,
    status: "active",
  },
  oauth: {
    issuer: "https://auth.stocknear.com/realms/stocknear",
    linkedAt: now,
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

  it("unlinks OAuth idempotently without adding a linking workflow", async () => {
    const send = vi.fn().mockResolvedValue({ unlinked: true });
    await unlinkMcpOAuth({ send } as any);
    expect(send).toHaveBeenCalledWith(MCP_OAUTH_PATH, { method: "DELETE" });
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
    expect(parseMcpAccount({
      ...accountResponse,
      serverVersion: 2,
      oauth: { ...accountResponse.oauth, provider: "keycloak" },
    })).toEqual(accountResponse);
  });
});
