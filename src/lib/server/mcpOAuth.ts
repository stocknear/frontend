import { isIP } from "node:net";

const MCP_OAUTH_ORIGIN = "http://127.0.0.1:8001";
const OPAQUE_REQUEST = /^[A-Za-z0-9_-]{16,128}$/;
const CLIENT_ID = /^[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]{1,512}$/;
const UNSAFE_DISPLAY_CHARACTERS =
  /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;

export type McpOAuthClientSource = "predefined" | "dcr" | "cimd";
export type McpOAuthClientTrust = "verified" | "unverified";

export type McpOAuthErrorCode =
  | "access_denied"
  | "entitlement_ineligible"
  | "invalid_request"
  | "temporarily_unavailable"
  | "unknown";

export class McpOAuthRequestError extends Error {
  readonly status: number;
  readonly code: McpOAuthErrorCode;

  constructor(status: number, code: McpOAuthErrorCode) {
    super(`MCP OAuth returned ${status}`);
    this.name = "McpOAuthRequestError";
    this.status = status;
    this.code = code;
  }
}

export type McpAuthorizationRequest = {
  request: string;
  clientId: string;
  clientName: string;
  clientSource: McpOAuthClientSource;
  clientTrust: McpOAuthClientTrust;
  redirectHost: string;
  scopes: string[];
  resource: string;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isBoundedText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;

const isSafeDisplayText = (value: unknown, max: number): value is string =>
  isBoundedText(value, max) &&
  value.trim() === value &&
  !UNSAFE_DISPLAY_CHARACTERS.test(value);

const isClientSource = (value: unknown): value is McpOAuthClientSource =>
  value === "predefined" || value === "dcr" || value === "cimd";

const isClientTrust = (value: unknown): value is McpOAuthClientTrust =>
  value === "verified" || value === "unverified";

const isRedirectHost = (value: unknown): value is string =>
  isSafeDisplayText(value, 253) &&
  /^[A-Za-z0-9.:-]+$/.test(value) &&
  !value.includes("..") &&
  !value.startsWith(".") &&
  !value.endsWith(".");

export function parseOpaqueOAuthRequest(value: unknown): string | null {
  return typeof value === "string" && OPAQUE_REQUEST.test(value) ? value : null;
}

export function parseMcpAuthorizationRequest(
  value: unknown,
): McpAuthorizationRequest {
  if (
    !isObject(value) ||
    !isBoundedText(value.request, 128) ||
    !OPAQUE_REQUEST.test(value.request) ||
    typeof value.clientId !== "string" ||
    !CLIENT_ID.test(value.clientId) ||
    UNSAFE_DISPLAY_CHARACTERS.test(value.clientId) ||
    !isSafeDisplayText(value.clientName, 160) ||
    !isClientSource(value.clientSource) ||
    (value.clientTrust !== undefined && !isClientTrust(value.clientTrust)) ||
    !isRedirectHost(value.redirectHost) ||
    !Array.isArray(value.scopes) ||
    value.scopes.length === 0 ||
    value.scopes.length > 32 ||
    value.scopes.some((scope) => !isSafeDisplayText(scope, 128)) ||
    !isSafeDisplayText(value.resource, 1024)
  ) {
    throw new Error("Invalid MCP authorization request");
  }
  const clientTrust =
    value.clientTrust ??
    (value.clientSource === "predefined" ? "verified" : "unverified");
  return {
    request: value.request,
    clientId: value.clientId,
    clientName: value.clientName,
    clientSource: value.clientSource,
    clientTrust,
    redirectHost: value.redirectHost,
    scopes: [...value.scopes] as string[],
    resource: value.resource,
  };
}

function parseRedirectUrl(value: unknown): string {
  if (!isObject(value) || !isBoundedText(value.redirectUrl, 4096)) {
    throw new Error("Invalid MCP authorization completion");
  }
  const redirectUrl = new URL(value.redirectUrl);
  const hostname = redirectUrl.hostname.replace(/^\[|\]$/g, "");
  const isLoopbackHttp =
    redirectUrl.protocol === "http:" &&
    (hostname === "localhost" ||
      (isIP(hostname) === 4 && hostname.split(".")[0] === "127") ||
      (isIP(hostname) === 6 && hostname === "::1"));
  if (
    (redirectUrl.protocol !== "https:" && !isLoopbackHttp) ||
    redirectUrl.username ||
    redirectUrl.password ||
    redirectUrl.hash
  ) {
    throw new Error("Invalid MCP authorization redirect");
  }
  return redirectUrl.href;
}

async function readJson(response: Response): Promise<unknown> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const rawCode = isObject(payload)
      ? typeof payload.error === "string"
        ? payload.error
        : typeof payload.code === "string"
          ? payload.code
          : ""
      : "";
    const code: McpOAuthErrorCode = [
      "access_denied",
      "entitlement_ineligible",
      "invalid_request",
      "temporarily_unavailable",
    ].includes(rawCode)
      ? (rawCode as McpOAuthErrorCode)
      : "unknown";
    throw new McpOAuthRequestError(response.status, code);
  }
  if (payload === null) throw new Error("Invalid MCP OAuth response");
  return payload;
}

export async function getMcpAuthorizationRequest(
  fetcher: typeof globalThis.fetch,
  request: string,
): Promise<McpAuthorizationRequest> {
  const response = await fetcher(
    `${MCP_OAUTH_ORIGIN}/oauth/request/${encodeURIComponent(request)}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(3_000),
    },
  );
  const authorization = parseMcpAuthorizationRequest(await readJson(response));
  if (authorization.request !== request)
    throw new Error("Mismatched MCP authorization request");
  return authorization;
}

export async function completeMcpAuthorization(
  fetcher: typeof globalThis.fetch,
  request: string,
  userToken: string,
  decision: "approve" | "deny",
): Promise<string> {
  const response = await fetcher(`${MCP_OAUTH_ORIGIN}/oauth/complete`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ request, userToken, decision }),
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  return parseRedirectUrl(await readJson(response));
}
