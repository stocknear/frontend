import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const { apiURL, apiKey } = locals;
    const postData = { ticker: data?.ticker };

    const [contractResponse, stockResponse] = await Promise.all([
      fetch(apiURL + "/contract-lookup-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      }),
      fetch(apiURL + "/stock-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      }),
    ]);

    if (!contractResponse.ok || !stockResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch upstream options calculator data.",
          details: {
            contractLookupSummary: {
              status: contractResponse.status,
              statusText: contractResponse.statusText,
            },
            stockQuote: {
              status: stockResponse.status,
              statusText: stockResponse.statusText,
            },
          },
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const [contractOutput, stockOutput] = await Promise.all([
      contractResponse.json(),
      stockResponse.json(),
    ]);

    return new Response(
      JSON.stringify({ getData: contractOutput, getStockQuote: stockOutput }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to process options calculator request." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
