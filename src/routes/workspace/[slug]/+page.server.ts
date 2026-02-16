import { redirect, error } from "@sveltejs/kit";
import { getAPI } from "$lib/server/api";

export const load = async ({ params, locals }) => {
  const data = await getAPI(locals, "/full-searchbar");

  // Find the ticker matching the slug (case insensitive)
  const ticker = data?.find((item) => item.symbol?.toLowerCase() === params.slug?.toLowerCase());

  if (!ticker) {
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
