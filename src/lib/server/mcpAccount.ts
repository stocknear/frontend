import type PocketBase from "pocketbase";
import type {
  McpAccount,
  McpOAuthInfo,
  McpTokenCreated,
  McpTokenInfo,
} from "$lib/mcpAccount";

export type { McpAccount, McpOAuthInfo, McpTokenCreated, McpTokenInfo };

export const MCP_ACCOUNT_PATH = "/api/stocknear/mcp/account";
export const MCP_TOKEN_PATH = "/api/stocknear/mcp/token";
export const MCP_OAUTH_PATH = "/api/stocknear/mcp/oauth";

type McpOwnerClient = Pick<PocketBase, "send">;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRfc3339 = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
    value,
  ) &&
  Number.isFinite(Date.parse(value));

export function parseMcpTokenInfo(value: unknown): McpTokenInfo {
  if (!isObject(value)) throw new Error("Invalid MCP token metadata");
  if (
    typeof value.prefix !== "string" ||
    !/^sn_mcp_[A-Za-z0-9_-]{1,24}$/.test(value.prefix) ||
    !isRfc3339(value.createdAt) ||
    !isRfc3339(value.expiresAt) ||
    (value.status !== "active" && value.status !== "expired")
  ) {
    throw new Error("Invalid MCP token metadata");
  }
  return {
    prefix: value.prefix,
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
    status: value.status,
  };
}

export function parseMcpAccount(value: unknown): McpAccount {
  if (
    !isObject(value) ||
    typeof value.eligible !== "boolean"
  ) {
    throw new Error("Invalid MCP account response");
  }

  let oauth: McpOAuthInfo | null = null;
  if (value.oauth !== null) {
    if (
      !isObject(value.oauth) ||
      typeof value.oauth.issuer !== "string" ||
      value.oauth.issuer.length === 0 ||
      !isRfc3339(value.oauth.linkedAt)
    ) {
      throw new Error("Invalid MCP OAuth metadata");
    }
    oauth = {
      issuer: value.oauth.issuer,
      linkedAt: value.oauth.linkedAt,
    };
  }

  return {
    eligible: value.eligible,
    token: value.token === null ? null : parseMcpTokenInfo(value.token),
    oauth,
  };
}

export function parseMcpTokenCreated(value: unknown): McpTokenCreated {
  if (
    !isObject(value) ||
    typeof value.token !== "string" ||
    !/^sn_mcp_[A-Za-z0-9_-]{43}$/.test(value.token)
  ) {
    throw new Error("Invalid MCP token response");
  }
  return { token: value.token, tokenInfo: parseMcpTokenInfo(value.tokenInfo) };
}

export async function getMcpAccount(pb: McpOwnerClient): Promise<McpAccount> {
  return parseMcpAccount(await pb.send(MCP_ACCOUNT_PATH, { method: "GET" }));
}

export async function rotateMcpToken(
  pb: McpOwnerClient,
): Promise<McpTokenCreated> {
  return parseMcpTokenCreated(
    await pb.send(MCP_TOKEN_PATH, { method: "POST", body: {} }),
  );
}

export async function revokeMcpToken(pb: McpOwnerClient): Promise<void> {
  const response = await pb.send(MCP_TOKEN_PATH, { method: "DELETE" });
  if (!isObject(response) || response.revoked !== true) {
    throw new Error("Invalid MCP revoke response");
  }
}

export async function unlinkMcpOAuth(pb: McpOwnerClient): Promise<void> {
  const response = await pb.send(MCP_OAUTH_PATH, { method: "DELETE" });
  if (!isObject(response) || response.unlinked !== true) {
    throw new Error("Invalid MCP OAuth unlink response");
  }
}
