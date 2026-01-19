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
  "market-cap": "/historical-market-cap",
  "analyst-target": "/analyst-summary-rating",
  "income-statement": "/financial-statement",
  "balance-sheet": "/financial-statement",
  "cash-flow": "/financial-statement",
  "ratios": "/financial-statement",
  "ftd": "/fail-to-deliver",
  "max-pain": "/max-pain",
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey, user } = locals;

  const category = data?.category;
  const endpoint = INDICATOR_ENDPOINTS[category];


  if (!endpoint) {
    return new Response(
      JSON.stringify({ error: `Unknown indicator category: ${category}` }),
      { status: 400 }
    );
  }

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
  } else if (category === "income-statement") {
    postData = {
      ticker: data?.ticker,
      statement: "income-statement",
    };
  } else if (category === "balance-sheet") {
    postData = {
      ticker: data?.ticker,
      statement: "balance-sheet-statement",
    };
  } else if (category === "cash-flow") {
    postData = {
      ticker: data?.ticker,
      statement: "cash-flow-statement",
    };
  } else if (category === "ratios") {
    postData = {
      ticker: data?.ticker,
      statement: "ratios",
    };
  } else {
    // Default payload for most fundamental indicators
    // revenue, eps, market-cap, analyst-target, ftd, max-pain
    postData = {
      ticker: data?.ticker,
    };
  }


  const response = await fetch(apiURL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });


  const output = await response.json();

  return new Response(JSON.stringify(output));
};
