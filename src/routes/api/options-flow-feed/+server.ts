import type { RequestHandler } from "./$types";

const allowedParams = ["page", "pageSize", "search", "sortKey", "sortOrder", "rules"] as const;

const MAX_PAGE_SIZE = 500;
const MIN_PAGE_SIZE = 1;

export const GET: RequestHandler = async ({ url, locals }) => {
  const { apiURL, apiKey, user } = locals;

  const params = new URLSearchParams();

  for (const param of allowedParams) {
    if (param === "rules" && user?.tier !== "Pro") continue;
    const value = url.searchParams.get(param);
    if (value && value.trim().length > 0) {
      if (param === "pageSize") {
        const parsedPageSize = Number.parseInt(value, 10);
        const normalizedPageSize = Number.isFinite(parsedPageSize)
          ? Math.max(MIN_PAGE_SIZE, Math.min(parsedPageSize, MAX_PAGE_SIZE))
          : 50;
        params.set(param, String(normalizedPageSize));
        continue;
      }

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
