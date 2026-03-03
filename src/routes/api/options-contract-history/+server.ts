import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
  const data = await request.json();
  const { apiURL, apiKey } = locals;

  const ticker = data?.ticker;
  const contract = data?.contract;

  if (!ticker || !contract) {
    return new Response(
      JSON.stringify({ error: "Missing ticker or contract parameter." }),
      { status: 400 }
    );
  }

  const postData = { ticker, contract };
  const response = await fetch(apiURL + "/options-contract-history", {
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
