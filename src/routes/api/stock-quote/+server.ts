import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const { apiURL, apiKey } = locals;
  const data = await request.json();

  const response = await fetch(`${apiURL}/stock-quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(data),
  });

  const output = await response.json();
  return new Response(JSON.stringify(output));
};
