import type { RequestHandler } from "./$types";

const allowedParams = ["page", "pageSize", "search", "sortKey", "sortOrder", "rules"] as const;

export const GET: RequestHandler = async ({ url, locals }) => {
  const { apiURL, apiKey, user } = locals;

  const params = new URLSearchParams();

  for (const param of allowedParams) {
    if (param === "rules" && user?.tier !== "Pro") continue;
    const value = url.searchParams.get(param);
    if (value && value.trim().length > 0) {
      params.set(param, value);
    }
  }

  params.set("subscriber", user?.tier === "Pro" ? "Pro" : "Free");

  const endpoint = `${apiURL}/options-flow-feed${params.size ? `?${params.toString()}` : ""}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return new Response(
      JSON.stringify({ message: "Failed to load options flow data." }),
      { status: response.status },
    );
  }

  // Stream the body through directly — avoids JSON.parse + JSON.stringify overhead
  // Note: fetch transparently decompresses gzip, so body is already decompressed
  return new Response(response.body, {
    headers: { "Content-Type": "application/json" },
  });
};
