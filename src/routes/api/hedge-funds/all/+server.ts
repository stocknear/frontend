import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, fetch }) => {
  const { apiURL, apiKey } = locals;

  const response = await fetch(`${apiURL}/all-hedge-funds`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ message: "Failed to load hedge fund data." }),
      { status: response.status }
    );
  }

  const output = await response.json();

  return new Response(JSON.stringify(output));
};
