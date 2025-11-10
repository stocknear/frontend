import { redirect, error } from "@sveltejs/kit";

/**
 * Load function that fetches ticker data and redirects based on type.
 */
export const load = async ({ params, locals }) => {
  const { apiURL, apiKey } = locals;

  // Fetch data from API
  const res = await fetch(`${apiURL}/full-searchbar`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

  if (!res.ok) {
    // Throw an error if the request failed
    throw error(res.status, `Failed to fetch tickers: ${res.statusText}`);
  }

  const data = await res.json();

  // Find the ticker matching the slug (case insensitive)
  const ticker = data?.find((item) => item.symbol?.toLowerCase() === params.slug?.toLowerCase());

  
  if (!ticker) {
    // Redirect to home if no match found
    throw redirect(301, "/");
  }

  // Redirect based on ticker type
  switch (ticker.type) {
    case 'Stock':
      throw redirect(301, `/stocks/${ticker.symbol}`);
    case 'ETF':
      throw redirect(301, `/etf/${ticker.symbol}`);
    case 'Index':
      throw redirect(301, `/index/${ticker.symbol}`);
    default:
      throw redirect(301, "/");
  }
};
