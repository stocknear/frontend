import type { RequestHandler } from "./$types";

const allowedParams = [
  "page", "pageSize", "sortKey", "sortOrder", "search", "rules", "tab", "optionContracts", "displayColumns",
] as const;

const MAX_PAGE_SIZE = 50000;
const MIN_PAGE_SIZE = 1;

const allowedDisplayColumns = new Set([
  "symbol", "stockPrice", "changesPercentage", "strike", "expiration",
  "optionSymbol", "assetType", "dte", "profitProb", "volume", "oi",
  "bid", "annualizedReturn", "returnVal", "breakeven", "pctBeBid",
  "ptnlRtn", "ifCalledReturn", "ifCalledAnnualized",
  "downsideProtection", "moneynessPercent",
  "delta", "gamma", "theta", "vega", "iv", "ivRank",
  "debit", "marketCap",
  "earningsRevenueEst", "earningsEPSEst",
  "earningsRevenueGrowthEst", "earningsEPSGrowthEst",
  "earningsGap", "payoutRatio", "dividendYield",
  "annualDividend", "dividendGrowth",
  "marketCapGroup", "earningsTime", "payoutFrequency",
  "earningsDate", "exDividendDate",
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

  const endpoint = `${apiURL}/covered-call-screener-feed${params.size ? `?${params.toString()}` : ""}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ message: "Failed to load screener data." }),
      { status: response.status },
    );
  }

  return new Response(response.body, {
    headers: { "Content-Type": "application/json" },
  });
};
