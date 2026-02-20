import type { RequestHandler } from "./$types";

const allowedParams = [
  "page",
  "pageSize",
  "sortKey",
  "sortOrder",
  "search",
  "rules",
  "tab",
  "displayColumns",
] as const;

const MAX_PAGE_SIZE = 500;
const MIN_PAGE_SIZE = 1;
const allowedDisplayColumns = new Set([
  "symbol",
  "name",
  "expiration",
  "strike",
  "optionType",
  "iv",
  "ivRank",
  "close",
  "moneynessPercentage",
  "volume",
  "oi",
  "delta",
  "gamma",
  "theta",
  "vega",
  "totalPrem",
  "changesPercentageOI",
  "assetType",
  "optionSymbol",
  "dte",
  "indexMembership",
  "marketCap",
  "marketCapGroup",
  "earningsDate",
  "earningsTime",
  "earningsGap",
]);

export const GET: RequestHandler = async ({ url, locals }) => {
  const { apiURL, apiKey, user } = locals;
  const params = new URLSearchParams();

  for (const param of allowedParams) {
    if (param === "rules" && user?.tier !== "Pro") continue;
    const value = url.searchParams.get(param);
    if (value && value.trim().length > 0) {
      if (param === "pageSize") {
        const parsedPageSize = Number.parseInt(value, 10);
        const normalizedPageSize = Number.isFinite(parsedPageSize)
          ? Math.max(MIN_PAGE_SIZE, Math.min(parsedPageSize, MAX_PAGE_SIZE))
          : 20;
        params.set(param, String(normalizedPageSize));
        continue;
      }

      if (param === "displayColumns") {
        const safeColumns = value
          .split(",")
          .map((column) => column.trim())
          .filter((column) => allowedDisplayColumns.has(column))
          .slice(0, 50);

        if (safeColumns.length > 0) {
          params.set(param, safeColumns.join(","));
        }
        continue;
      }

      params.set(param, value);
    }
  }

  params.set("subscriber", user?.tier === "Pro" ? "Pro" : "Free");

  const endpoint = `${apiURL}/options-screener-feed${params.size ? `?${params.toString()}` : ""}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ message: "Failed to load screener data." }), {
      status: response.status,
    });
  }

  return new Response(response.body, {
    headers: { "Content-Type": "application/json" },
  });
};
