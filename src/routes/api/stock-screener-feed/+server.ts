import type { RequestHandler } from "./$types";

const allowedParams = [
  "page", "pageSize", "sortKey", "sortOrder", "search", "rules", "tab", "displayColumns",
] as const;

export const GET: RequestHandler = async ({ url, locals }) => {
  const { apiURL, apiKey, user } = locals;

  const params = new URLSearchParams();

  for (const param of allowedParams) {
    if (param === "rules" && !['Plus','Pro'].includes(user?.tier)) continue;
    const value = url.searchParams.get(param);
    if (value && value.trim().length > 0) {
      params.set(param, value);
    }
  }

  params.set("subscriber", ['Plus','Pro'].includes(user?.tier) ? "Pro" : "Free");

  const endpoint = `${apiURL}/stock-screener-feed${params.size ? `?${params.toString()}` : ""}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ message: "Failed to load screener data." }),
      { status: response.status },
    );
  }

  return new Response(response.body, {
    headers: { "Content-Type": "application/json" },
  });
};
