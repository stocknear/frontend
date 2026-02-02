import type { RequestHandler } from "./$types";

// Ticker validation: allows ^SPX, AAPL, BRK.A, BTC-USD formats
const TICKER_REGEX = /^[\^]?[A-Z0-9][A-Z0-9.\-]{0,19}$/;
const isValidTicker = (ticker: unknown): ticker is string =>
  typeof ticker === "string" && ticker.length >= 1 && ticker.length <= 20 && TICKER_REGEX.test(ticker.toUpperCase());

// Valid event types whitelist
const VALID_EVENT_TYPES = ["earnings", "dividends", "news"];

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey, user } = locals;

  // Only Pro users can access chart events
  if (user?.tier !== "Pro") {
    return new Response(JSON.stringify({ error: "Pro subscription required" }), {
      status: 403,
    });
  }

  const data = await request.json();

  // Validate ticker
  if (!isValidTicker(data?.ticker)) {
    return new Response(JSON.stringify({ error: "Invalid ticker format" }), {
      status: 400,
    });
  }
  const ticker = (data.ticker as string).toUpperCase();

  // Validate and filter types to whitelist only
  const rawTypes = Array.isArray(data?.types) ? data.types : [];
  const types = rawTypes.filter((t): t is string =>
    typeof t === "string" && VALID_EVENT_TYPES.includes(t)
  );

  if (!types.length) {
    return new Response(JSON.stringify({ error: "No valid event types specified" }), {
      status: 400,
    });
  }

  const payload = JSON.stringify({ ticker });
  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": apiKey,
  };

  const result: {
    earnings?: any[];
    nextEarnings?: any;
    dividends?: any[];
    news?: any[];
  } = {};

  // Build fetch promises based on requested types
  const fetchPromises: Promise<void>[] = [];

  if (types.includes("earnings")) {
    fetchPromises.push(
      (async () => {
        try {
          const [earningsRes, nextEarningsRes] = await Promise.all([
            fetch(apiURL + "/earnings-statistics", {
              method: "POST",
              headers,
              body: payload,
            }),
            fetch(apiURL + "/next-earnings", {
              method: "POST",
              headers,
              body: payload,
            }),
          ]);

          if (earningsRes.ok) {
            const earningsPayload = await earningsRes.json();
            result.earnings = earningsPayload?.historicalEarnings ?? [];
          }

          if (nextEarningsRes.ok) {
            result.nextEarnings = await nextEarningsRes.json();
          }
        } catch {
          result.earnings = [];
          result.nextEarnings = null;
        }
      })()
    );
  }

  if (types.includes("dividends")) {
    fetchPromises.push(
      (async () => {
        try {
          const dividendRes = await fetch(apiURL + "/stock-dividend", {
            method: "POST",
            headers,
            body: payload,
          });

          if (dividendRes.ok) {
            const dividendPayload = await dividendRes.json();
            result.dividends = dividendPayload?.history ?? [];
          }
        } catch {
          result.dividends = [];
        }
      })()
    );
  }

  if (types.includes("news")) {
    fetchPromises.push(
      (async () => {
        try {
          const wiimRes = await fetch(apiURL + "/wiim-full-history", {
            method: "POST",
            headers,
            body: payload,
          });

          if (wiimRes.ok) {
            result.news = await wiimRes.json();
          }
        } catch {
          result.news = [];
        }
      })()
    );
  }

  // Execute all fetches in parallel
  await Promise.all(fetchPromises);

  return new Response(JSON.stringify(result));
};
