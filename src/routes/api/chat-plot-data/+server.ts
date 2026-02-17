import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";
import { checkRateLimit, RATE_LIMITS } from "$lib/server/rateLimit";

const DEFAULT_TICKERS = ["AAPL", "GOOGL", "MSFT"] as const;
const MAX_TICKERS_PER_REQUEST = 5;
const TICKER_REGEX = /^[A-Z][A-Z0-9.-]{0,9}$/;
const ALLOWED_TIME_PERIODS = new Set([
  "one-day",
  "one-week",
  "one-month",
  "three-month",
  "six-month",
  "ytd",
  "one-year",
  "three-year",
  "five-year",
  "max",
]);

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeTickerList(rawTickerList: unknown): string[] | null {
  if (!Array.isArray(rawTickerList) || rawTickerList.length === 0) return null;

  const uniqueTickers = Array.from(
    new Set(
      rawTickerList
        .filter((item): item is string => typeof item === "string")
        .map((ticker) => ticker.trim().toUpperCase()),
    ),
  );

  if (
    uniqueTickers.length === 0 ||
    uniqueTickers.length > MAX_TICKERS_PER_REQUEST ||
    uniqueTickers.some((ticker) => !TICKER_REGEX.test(ticker))
  ) {
    return null;
  }

  return uniqueTickers;
}

function normalizeTimePeriod(rawTimePeriod: unknown): string | null {
  if (rawTimePeriod === undefined) return "one-day";
  if (typeof rawTimePeriod !== "string") return null;

  const normalized = rawTimePeriod.trim().toLowerCase();
  return ALLOWED_TIME_PERIODS.has(normalized) ? normalized : null;
}

async function fetchTickerData(locals: App.Locals, tickerList: string[], timePeriod: string) {
  const fetchPromises = tickerList.map(async (ticker: string) => {
    const [quote, priceData] = await Promise.all([
      postAPI(locals, "/stock-quote", { ticker }),
      timePeriod === "one-day"
        ? postAPI(locals, "/one-day-price", { ticker })
        : postAPI(locals, "/historical-price", { ticker, timePeriod }),
    ]);

    return {
      ticker,
      quote,
      priceData,
      timePeriod,
    };
  });

  return Promise.all(fetchPromises);
}

function requireAuthAndRateLimit(locals: App.Locals): Response | null {
  const { user, clientIp } = locals;

  if (!user) {
    return jsonResponse({ error: "Authentication required" }, 401);
  }

  const rateLimit = checkRateLimit(clientIp, "chatPlotData", RATE_LIMITS.chatPlotData);
  if (!rateLimit.allowed) {
    return jsonResponse({ error: "Too many requests. Please try again later." }, 429);
  }

  return null;
}

export const GET: RequestHandler = async ({ locals }) => {
  const authError = requireAuthAndRateLimit(locals);
  if (authError) return authError;

  try {
    const results = await fetchTickerData(locals, [...DEFAULT_TICKERS], "one-day");
    return jsonResponse(results);
  } catch (error) {
    console.error("Error fetching chat plot data:", error);
    return jsonResponse({ error: "Failed to fetch data" }, 500);
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const authError = requireAuthAndRateLimit(locals);
  if (authError) return authError;

  let data: { tickerList?: unknown; timePeriod?: unknown } = {};
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request format" }, 400);
  }

  const tickerList = normalizeTickerList(data?.tickerList);
  const timePeriod = normalizeTimePeriod(data?.timePeriod);

  if (!tickerList) {
    return jsonResponse(
      {
        error:
          "Invalid ticker list. Provide 1-5 unique tickers using letters, numbers, dots, or hyphens.",
      },
      400,
    );
  }

  if (!timePeriod) {
    return jsonResponse({ error: "Invalid time period" }, 400);
  }

  try {
    const results = await fetchTickerData(locals, tickerList, timePeriod);
    return jsonResponse(results);
  } catch (error) {
    console.error("Error fetching chat plot data:", error);
    return jsonResponse({ error: "Failed to fetch data" }, 500);
  }
};
