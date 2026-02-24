import type { RequestHandler } from "./$types";

const allowedParams = [
  "page", "pageSize", "sortKey", "sortOrder", "search", "rules", "tab", "displayColumns",
] as const;

const MAX_PAGE_SIZE = 50000;
const MIN_PAGE_SIZE = 1;

const allowedDisplayColumns = new Set([
  "symbol", "name", "totalAssets", "price", "changesPercentage", "volume",
  "avgVolume", "relativeVolume", "expenseRatio", "numberOfHoldings",
  "beta", "pe", "nav", "marketCap",
  "etfProvider", "assetClass", "topSector", "exchange", "aumGroup",
  "change1W", "change1M", "change3M", "change6M", "change1Y", "change3Y",
  "dividendYield", "annualDividend", "payoutFrequency",
  "rsi", "stochRSI", "mfi", "cci", "atr",
  "sma20", "sma50", "sma100", "sma200",
  "ema20", "ema50", "ema100", "ema200",
  "yearHigh", "yearLow", "fromHigh52W", "fromLow52W",
  "priceAvg50", "priceAvg200", "inceptionDate",
]);

export const GET: RequestHandler = async ({ url, locals }) => {
  const { apiURL, apiKey, user } = locals;

  const params = new URLSearchParams();

  for (const param of allowedParams) {
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
          ?.split(",")
          ?.map((column) => column.trim())
          ?.filter((column) => allowedDisplayColumns.has(column))
          ?.slice(0, 50);

        if (safeColumns.length > 0) {
          params.set(param, safeColumns.join(","));
        }
        continue;
      }

      params.set(param, value);
    }
  }

  params.set("subscriber", "Pro");

  const endpoint = `${apiURL}/etf-screener-feed${params.size ? `?${params.toString()}` : ""}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ message: "Failed to load ETF screener data." }),
      { status: response.status },
    );
  }

  return new Response(response.body, {
    headers: { "Content-Type": "application/json" },
  });
};
