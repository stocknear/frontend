import type { RequestHandler } from "./$types";

// Ticker validation: allows ^SPX, AAPL, BRK.A, BTC-USD formats
const TICKER_REGEX = /^[\^]?[A-Z0-9][A-Z0-9.\-]{0,19}$/;
const isValidTicker = (ticker: unknown): ticker is string =>
  typeof ticker === "string" && ticker.length >= 1 && ticker.length <= 20 && TICKER_REGEX.test(ticker.toUpperCase());

// Date format validation: YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (date: unknown): date is string =>
  typeof date === "string" && DATE_REGEX.test(date);

// Valid intervals whitelist
const VALID_INTERVALS = ["1min", "5min", "15min", "30min", "1hour", "4hour"];
const isValidInterval = (interval: unknown): interval is string =>
  typeof interval === "string" && VALID_INTERVALS.includes(interval);

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey } = locals;

  // Validate ticker
  if (!isValidTicker(data?.ticker)) {
    return new Response(
      JSON.stringify({ error: "Invalid ticker format" }),
      { status: 400 }
    );
  }

  // Validate endDate
  if (!isValidDate(data?.endDate)) {
    return new Response(
      JSON.stringify({ error: "Invalid date format" }),
      { status: 400 }
    );
  }

  // Validate interval
  if (!isValidInterval(data?.interval)) {
    return new Response(
      JSON.stringify({ error: "Invalid interval" }),
      { status: 400 }
    );
  }

  const postData = {
    ticker: (data.ticker as string).toUpperCase(),
    endDate: data.endDate,
    interval: data.interval,
    userTier: locals.user?.tier ?? null,
  };

  const response = await fetch(apiURL + "/chart-intraday-price", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch intraday data" }),
      { status: response.status }
    );
  }

  try {
    const output = await response.json();
    return new Response(JSON.stringify(output));
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid response from server" }),
      { status: 500 }
    );
  }
};
