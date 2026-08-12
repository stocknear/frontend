import { redirect } from "@sveltejs/kit";

export type PublicMcpTool = {
  name: string;
  category: string;
};

// The frontend and MCP process share one VPS. Keep this SSR-only request on
// loopback so a documentation page never depends on DNS, Cloudflare, or TLS.
const CATALOG_URL = "http://127.0.0.1:8001/catalog";
const CATALOG_TTL_MS = 5 * 60 * 1000;
const CATALOG_FAILURE_TTL_MS = 60 * 1000;
const TOOL_NAME = /^[a-z][a-z0-9_]{1,79}$/;
const CATEGORY = /^[a-z][a-z0-9_-]{1,31}$/;

let cache: { tools: PublicMcpTool[]; expiresAt: number } | null = null;

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

export const load = async ({ fetch, locals, url }) => {
  const now = Date.now();
  const isPro = locals?.user?.tier === "Pro";
  if (locals?.user && !isPro) {
    const pricingPath = url.pathname.replace(/\/mcp\/?$/, "/pricing");
    throw redirect(303, `${pricingPath}${url.search}`);
  }
  if (cache && cache.expiresAt > now)
    return { mcpTools: cache.tools, isPro };

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
    return { mcpTools: tools, isPro };
  } catch {
    cache = {
      tools: cache?.tools ?? [],
      expiresAt: now + CATALOG_FAILURE_TTL_MS,
    };
    return { mcpTools: cache.tools, isPro };
  }
};
