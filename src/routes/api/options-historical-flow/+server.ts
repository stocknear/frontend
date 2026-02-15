import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const selectedDate = data?.selectedDate;
  const { apiURL, apiKey, user } = locals;
  let output;

  if (user?.tier === "Pro") {
    try {
      const postData = {
        date: selectedDate,
        rules: data?.rules || [],
        tickers: data?.tickers || "",
        page: data?.page || 1,
        pageSize: data?.pageSize || 50,
        sortKey: data?.sortKey || "time",
        sortOrder: data?.sortOrder || "desc",
      };
      const response = await fetch(apiURL + "/options-historical-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();
    } catch (e) {
      console.error(e);
      output = { items: [], total: 0, page: 1, pageSize: 50, stats: null };
    }
  } else {
    output = { items: [], total: 0, page: 1, pageSize: 50, stats: null };
  }

  return new Response(JSON.stringify(output));
};
