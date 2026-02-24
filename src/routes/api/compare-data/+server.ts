import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

const MAX_TICKERS = 10;
const TICKER_REGEX = /^[\^]?[A-Z0-9][A-Z0-9.\-]{0,19}$/;
const ALLOWED_ASSET_TYPES = new Set(["stocks", "etf"]);

function validateTickerList(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const tickers = [
    ...new Set(
      raw
        .filter((item): item is string => typeof item === "string")
        .map((t) => t.trim().toUpperCase()),
    ),
  ];
  if (tickers.length === 0 || tickers.length > MAX_TICKERS) return null;
  if (tickers.some((t) => !TICKER_REGEX.test(t))) return null;
  return tickers;
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const { clientIp } = locals;
  const rateLimit = checkRateLimit(clientIp, "compareData", RATE_LIMITS.compareData);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429 },
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const tickerList = validateTickerList(data?.tickerList);
  if (!tickerList) {
    return new Response(
      JSON.stringify({ error: "Invalid ticker list. Provide 1-10 valid tickers." }),
      { status: 400 },
    );
  }

  const rawAssetType =
    typeof data?.assetType === "string" ? data.assetType.trim().toLowerCase() : "stocks";
  const assetType = ALLOWED_ASSET_TYPES.has(rawAssetType) ? rawAssetType : "stocks";

  const category =
    data?.category != null &&
    typeof data.category === "object" &&
    !Array.isArray(data.category)
      ? data.category
      : undefined;

  const output = await postAPI(locals, "/compare-data", {
    tickerList,
    category,
    assetType,
  });
  return new Response(JSON.stringify(output));
};
