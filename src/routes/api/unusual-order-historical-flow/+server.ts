import type { RequestHandler } from "./$types";

const MAX_PAGE_SIZE = 500;
const MIN_PAGE_SIZE = 1;

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const selectedDate = data?.selectedDate;
  const { apiURL, apiKey, user } = locals;

  if (user?.tier === "Pro") {
    try {
      const rawPageSize = Number(data?.pageSize) || 50;
      const safePageSize = Math.max(MIN_PAGE_SIZE, Math.min(rawPageSize, MAX_PAGE_SIZE));

      const postData = {
        date: selectedDate,
        rules: data?.rules || [],
        tickers: data?.tickers || "",
        page: data?.page || 1,
        pageSize: safePageSize,
        sortKey: data?.sortKey || "date",
        sortOrder: data?.sortOrder || "desc",
        subscriber: user?.tier === "Pro" ? "Pro" : "Free",
      };

      const response = await fetch(apiURL + "/unusual-order-historical-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      });

      return new Response(response.body, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error(e);
      return new Response(
        JSON.stringify({ items: [], total: 0, page: 1, pageSize: 50, stats: null }),
      );
    }
  }

  return new Response(
    JSON.stringify({ items: [], total: 0, page: 1, pageSize: 50, stats: null }),
  );
};
