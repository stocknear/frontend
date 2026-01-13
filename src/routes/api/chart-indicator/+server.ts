import type { RequestHandler } from "./$types";

// Map of indicator categories to their backend endpoints
const INDICATOR_ENDPOINTS: Record<string, string> = {
  "options-gex": "/options-gex-dex",
  "options-dex": "/options-gex-dex",
  "options-oi": "/options-oi",
  "hottest-contracts": "/hottest-contracts",
  "short-interest": "/short-interest",
  "revenue": "/historical-revenue",
  "eps": "/historical-eps",
  "fcf": "/historical-cash-flow",
  "margin": "/historical-margins",
  "pe-ratio": "/historical-pe",
  "ev-ebitda": "/historical-ev-ebitda",
  "market-cap": "/historical-market-cap",
  "insider-activity": "/insider-trading-history",
  "institutional": "/institutional-ownership-history",
  "analyst-target": "/analyst-price-targets",
  "iv-rank": "/iv-rank-history",
  "put-call-ratio": "/put-call-ratio-history",
  "dark-pool": "/dark-pool-history",
  "ftd": "/fail-to-deliver-history",
  "max-pain": "/max-pain-history",
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey, user } = locals;

  const category = data?.category;
  const endpoint = INDICATOR_ENDPOINTS[category];

  console.log("[chart-indicator] Category:", category, "Endpoint:", endpoint, "Ticker:", data?.ticker);

  if (!endpoint) {
    console.log("[chart-indicator] Unknown category:", category);
    return new Response(
      JSON.stringify({ error: `Unknown indicator category: ${category}` }),
      { status: 400 }
    );
  }

  // Chart indicators require Pro tier
  if (user?.tier !== "Pro") {
    console.log("[chart-indicator] User tier:", user?.tier, "- Pro required");
    return new Response(
      JSON.stringify({ error: "Pro subscription required" }),
      { status: 403 }
    );
  }

  // Build the request payload based on category
  let postData: Record<string, unknown> = {};

  if (category === "options-gex" || category === "options-dex") {
    postData = {
      params: data?.ticker,
      category: "strike",
      type: category === "options-gex" ? "gex" : "dex",
    };
  } else if (category === "options-oi") {
    postData = {
      params: data?.ticker,
      category: "strike",
    };
  } else if (category === "hottest-contracts") {
    postData = {
      ticker: data?.ticker,
    };
  } else if (category === "short-interest") {
    postData = {
      ticker: data?.ticker,
    };
  } else {
    // Default payload for most fundamental indicators
    // revenue, eps, fcf, margin, pe-ratio, ev-ebitda, market-cap,
    // insider-activity, institutional, analyst-target, iv-rank,
    // put-call-ratio, dark-pool, ftd, max-pain
    postData = {
      ticker: data?.ticker,
    };
  }

  console.log("[chart-indicator] Fetching:", apiURL + endpoint, "with payload:", postData);

  const response = await fetch(apiURL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  console.log("[chart-indicator] Backend response status:", response.status);

  const output = await response.json();
  console.log("[chart-indicator] Output keys:", Object.keys(output || {}));

  return new Response(JSON.stringify(output));
};
