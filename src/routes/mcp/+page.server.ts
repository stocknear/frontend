export type PublicMcpTool = {
  name: string;
  category: string;
};

// The frontend and MCP process share one VPS. Keep this SSR-only request on
// loopback so a documentation page never depends on DNS, Cloudflare, or TLS.
const CATALOG_URL = "http://127.0.0.1:8001/catalog";
const READINESS_URL = "http://127.0.0.1:8001/readyz";
const CATALOG_TTL_MS = 5 * 60 * 1000;
const CATALOG_FAILURE_TTL_MS = 60 * 1000;
const READINESS_TTL_MS = 60 * 1000;
const READINESS_TIMEOUT_MS = 1_000;
const TOOL_NAME = /^[a-z][a-z0-9_]{1,79}$/;
const CATEGORY = /^[a-z][a-z0-9_-]{1,31}$/;

let cache: { tools: PublicMcpTool[]; expiresAt: number } | null = null;
let readinessCache: { oauthAvailable: boolean; expiresAt: number } | null = null;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function _parsePublicMcpCatalog(value: unknown): PublicMcpTool[] {
  if (
    !isObject(value) ||
    !Array.isArray(value.tools) ||
    value.tools.length > 250
  )
    throw new Error("Invalid MCP catalog");

  const names = new Set<string>();
  return value.tools.map((item) => {
    if (
      !isObject(item) ||
      typeof item.name !== "string" ||
      !TOOL_NAME.test(item.name) ||
      names.has(item.name) ||
      typeof item.category !== "string" ||
      !CATEGORY.test(item.category)
    ) {
      throw new Error("Invalid MCP catalog tool");
    }
    names.add(item.name);
    return { name: item.name, category: item.category };
  });
}

export function _parseMcpOAuthReadiness(value: unknown): boolean {
  return (
    isObject(value) &&
    value.status === "ready" &&
    value.authentication === "oauth-and-pat"
  );
}

async function mcpOAuthAvailable(fetch: typeof globalThis.fetch, now: number) {
  if (readinessCache && readinessCache.expiresAt > now)
    return readinessCache.oauthAvailable;

  let oauthAvailable = false;
  try {
    const response = await fetch(READINESS_URL, {
      headers: { Accept: "application/json" },
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(READINESS_TIMEOUT_MS),
    });
    oauthAvailable =
      response.ok && _parseMcpOAuthReadiness(await response.json());
  } catch {
    // Never advertise a browser OAuth flow that the MCP process cannot prove ready.
  }
  readinessCache = { oauthAvailable, expiresAt: now + READINESS_TTL_MS };
  return oauthAvailable;
}

export const load = async ({ fetch, locals }) => {
  const now = Date.now();
  const isPro = locals?.user?.tier === "Pro";
  const oauthAvailable = await mcpOAuthAvailable(fetch, now);
  if (cache && cache.expiresAt > now)
    return { mcpTools: cache.tools, isPro, oauthAvailable };

  try {
    const response = await fetch(CATALOG_URL, {
      headers: { Accept: "application/json" },
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok)
      throw new Error(`MCP catalog returned ${response.status}`);
    const tools = _parsePublicMcpCatalog(await response.json());
    cache = { tools, expiresAt: now + CATALOG_TTL_MS };
    return { mcpTools: tools, isPro, oauthAvailable };
  } catch {
    cache = {
      tools: cache?.tools ?? [],
      expiresAt: now + CATALOG_FAILURE_TTL_MS,
    };
    return { mcpTools: cache.tools, isPro, oauthAvailable };
  }
};
