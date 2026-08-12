import type PocketBase from "pocketbase";
import type {
  McpAccount,
  McpOAuthInfo,
  McpOAuthSession,
  McpTokenCreated,
  McpTokenInfo,
} from "$lib/mcpAccount";

export type {
  McpAccount,
  McpOAuthInfo,
  McpOAuthSession,
  McpTokenCreated,
  McpTokenInfo,
};

export const MCP_ACCOUNT_PATH = "/api/stocknear/mcp/account";
export const MCP_TOKEN_PATH = "/api/stocknear/mcp/token";
export const MCP_OAUTH_PATH = "/api/stocknear/mcp/oauth";
export const MCP_OAUTH_SESSION_PATH = "/api/stocknear/mcp/oauth/session";

type McpOwnerClient = Pick<PocketBase, "send">;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRfc3339 = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
    value,
  ) &&
  Number.isFinite(Date.parse(value));

const UNSAFE_DISPLAY_CHARACTERS =
  /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
const MCP_CLIENT_ID = /^[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]{1,512}$/;

const isSafeDisplayText = (value: unknown, max: number): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= max &&
  value.trim() === value &&
  !UNSAFE_DISPLAY_CHARACTERS.test(value);

const isClientSource = (
  value: unknown,
): value is McpOAuthSession["clientSource"] =>
  value === "predefined" || value === "dcr" || value === "cimd";

export function parseMcpTokenInfo(value: unknown): McpTokenInfo {
  if (!isObject(value)) throw new Error("Invalid MCP token metadata");
  if (
    typeof value.prefix !== "string" ||
    !/^sn_mcp_[A-Za-z0-9_-]{1,24}$/.test(value.prefix) ||
    !isRfc3339(value.createdAt) ||
    value.status !== "active"
  ) {
    throw new Error("Invalid MCP token metadata");
  }
  return {
    prefix: value.prefix,
    createdAt: value.createdAt,
    status: value.status,
  };
}

export function parseMcpAccount(value: unknown): McpAccount {
  if (!isObject(value) || typeof value.eligible !== "boolean") {
    throw new Error("Invalid MCP account response");
  }

  if (value.oauth === null) {
    return {
      eligible: value.eligible,
      token:
        value.token === null ||
        (isObject(value.token) && value.token.status === "expired")
          ? null
          : parseMcpTokenInfo(value.token),
      oauth: null,
    };
  }
  if (!isObject(value.oauth) || !Array.isArray(value.oauth.sessions))
    throw new Error("Invalid MCP OAuth metadata");
  if (value.oauth.sessions.length > 25)
    throw new Error("Invalid MCP OAuth metadata");
  const sessionIds = new Set<string>();
  const sessions: McpOAuthSession[] = value.oauth.sessions.map((session) => {
    if (
      !isObject(session) ||
      typeof session.sessionId !== "string" ||
      !/^[A-Za-z0-9_-]{15,64}$/.test(session.sessionId) ||
      sessionIds.has(session.sessionId) ||
      typeof session.clientId !== "string" ||
      !MCP_CLIENT_ID.test(session.clientId) ||
      UNSAFE_DISPLAY_CHARACTERS.test(session.clientId) ||
      !isSafeDisplayText(session.clientName, 128) ||
      !isClientSource(session.clientSource) ||
      !Array.isArray(session.scopes) ||
      session.scopes.length !== 1 ||
      session.scopes[0] !== "mcp:tools" ||
      !isSafeDisplayText(session.resource, 1024) ||
      !isRfc3339(session.createdAt) ||
      !isRfc3339(session.lastRefreshedAt) ||
      !isRfc3339(session.expiresAt)
    )
      throw new Error("Invalid MCP OAuth session metadata");
    sessionIds.add(session.sessionId);
    return {
      sessionId: session.sessionId,
      clientId: session.clientId,
      clientName: session.clientName,
      clientSource: session.clientSource,
      scopes: [...session.scopes] as string[],
      resource: session.resource,
      createdAt: session.createdAt,
      lastRefreshedAt: session.lastRefreshedAt,
      expiresAt: session.expiresAt,
    };
  });
  const oauth: McpOAuthInfo = { sessions };

  return {
    eligible: value.eligible,
    token:
      value.token === null ||
      (isObject(value.token) && value.token.status === "expired")
        ? null
        : parseMcpTokenInfo(value.token),
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

export async function revokeAllMcpOAuthSessions(
  pb: McpOwnerClient,
): Promise<void> {
  const response = await pb.send(MCP_OAUTH_PATH, {
    method: "DELETE",
    body: {},
  });
  if (!isObject(response) || response.revoked !== true) {
    throw new Error("Invalid MCP OAuth revoke response");
  }
}

export async function revokeMcpOAuthSession(
  pb: McpOwnerClient,
  sessionId: string,
): Promise<void> {
  if (!/^[A-Za-z0-9_-]{15,64}$/.test(sessionId))
    throw new Error("Invalid MCP OAuth session id");
  const response = await pb.send(MCP_OAUTH_SESSION_PATH, {
    method: "DELETE",
    body: { sessionId },
  });
  if (!isObject(response) || response.revoked !== true) {
    throw new Error("Invalid MCP OAuth session revoke response");
  }
}
