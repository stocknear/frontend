import type { RequestHandler } from "./$types";

const allowedParams = ["page", "pageSize", "search", "sortKey", "sortOrder"] as const;

export const GET: RequestHandler = async ({ url, locals, fetch }) => {
  const { apiURL, apiKey } = locals;

  const params = new URLSearchParams();

  for (const param of allowedParams) {
    const value = url.searchParams.get(param);
    if (value && value.trim().length > 0) {
      params.set(param, value);
    }
  }

  const endpoint = `${apiURL}/hedge-funds${params.size ? `?${params.toString()}` : ""}`;

  const response = await fetch(endpoint, {
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
