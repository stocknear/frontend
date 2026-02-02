import type { RequestHandler } from "./$types";

// Map of indicator categories to their backend endpoints
const INDICATOR_ENDPOINTS: Record<string, string> = {
  "options-gex": "/options-gex-dex",
  "options-dex": "/options-gex-dex",
  "options-oi": "/options-oi",
  "hottest-contracts": "/hottest-contracts",
  "short-interest": "/short-interest",
  "revenue": "/historical-revenue",
  "market-cap": "/historical-market-cap",
  "analyst-target": "/analyst-summary-rating",
  "income-statement": "/financial-statement",
  "balance-sheet": "/financial-statement",
  "cash-flow": "/financial-statement",
  "ratios": "/financial-statement",
  "ftd": "/fail-to-deliver",
  "max-pain": "/max-pain",
};

// Ticker validation: allows ^SPX, AAPL, BRK.A, BTC-USD formats
const TICKER_REGEX = /^[\^]?[A-Z0-9][A-Z0-9.\-]{0,19}$/;
const isValidTicker = (ticker: unknown): ticker is string =>
  typeof ticker === "string" && ticker.length >= 1 && ticker.length <= 20 && TICKER_REGEX.test(ticker.toUpperCase());

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey, user } = locals;

  const category = data?.category;
  const endpoint = INDICATOR_ENDPOINTS[category];

  if (!endpoint) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400 }
    );
  }

  // Validate ticker
  if (!isValidTicker(data?.ticker)) {
    return new Response(
      JSON.stringify({ error: "Invalid ticker format" }),
      { status: 400 }
    );
  }
  const ticker = (data.ticker as string).toUpperCase();

  // Chart indicators require Pro tier
  if (user?.tier !== "Pro") {
    return new Response(
      JSON.stringify({ error: "Pro subscription required" }),
      { status: 403 }
    );
  }

  // Build the request payload based on category
  let postData: Record<string, unknown> = {};

  if (category === "options-gex" || category === "options-dex") {
    postData = {
      params: ticker,
      category: "strike",
      type: category === "options-gex" ? "gex" : "dex",
    };
  } else if (category === "options-oi") {
    postData = {
      params: ticker,
      category: "strike",
    };
  } else if (category === "hottest-contracts") {
    postData = { ticker };
  } else if (category === "short-interest") {
    postData = { ticker };
  } else if (category === "income-statement") {
    postData = { ticker, statement: "income-statement" };
  } else if (category === "balance-sheet") {
    postData = { ticker, statement: "balance-sheet-statement" };
  } else if (category === "cash-flow") {
    postData = { ticker, statement: "cash-flow-statement" };
  } else if (category === "ratios") {
    postData = { ticker, statement: "ratios" };
  } else {
    // Default payload for most fundamental indicators
    // revenue, market-cap, analyst-target, ftd, max-pain
    postData = { ticker };
  }


  const response = await fetch(apiURL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch indicator data" }),
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
