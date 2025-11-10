import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const { apiURL, apiKey } = locals;

  const postData = { ticker: data?.ticker };

  // First API call: contract lookup summary
  const contractResponse = await fetch(apiURL + "/contract-lookup-summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  const contractOutput = await contractResponse.json();

  // Second API call: stock quote
  const stockResponse = await fetch(apiURL + "/stock-quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  const stockOutput = await stockResponse.json();

  // Combine both outputs into a single object
  const output = { getData: contractOutput, getStockQuote: stockOutput };


  return new Response(JSON.stringify(output));
};
