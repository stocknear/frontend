import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals }) => {
  const { apiURL, apiKey } = locals;
  const query = url.searchParams.get("query") || "";

  const response = await fetch(`${apiURL}/searchbar?query=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  const output = await response.json();
  return new Response(JSON.stringify(output));
};
