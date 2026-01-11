import type { RequestHandler } from "./$types";

// Map of indicator categories to their backend endpoints
const INDICATOR_ENDPOINTS: Record<string, string> = {
  "options-gex": "/options-gex-dex",
  "options-dex": "/options-gex-dex",
  "options-oi": "/options-oi",
  "hottest-contracts": "/hottest-contracts",
  // Add more indicator categories here as needed:
  // "dark-pool": "/dark-pool-data",
  // "institutional": "/institutional-flow",
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey } = locals;

  const category = data?.category;
  const endpoint = INDICATOR_ENDPOINTS[category];

  if (!endpoint) {
    return new Response(
      JSON.stringify({ error: `Unknown indicator category: ${category}` }),
      { status: 400 }
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
  }
  // Add more category-specific payload builders here as needed

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
