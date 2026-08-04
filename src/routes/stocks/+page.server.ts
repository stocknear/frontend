import { postAPI } from "$lib/server/api";
import { error, redirect } from "@sveltejs/kit";

export const load = async ({ locals, url }) => {
  const getStockList = await postAPI(locals, "/list-category", {
    filterList: "all-stock-tickers",
  });
  const pageValue = url?.searchParams?.get("page");

  if (pageValue !== null) {
    const requestedPage = Number(pageValue);
    const listLength = getStockList?.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(listLength / 20));

    // Only range-check against a list we actually received. When the API returns an
    // empty list, totalPages collapses to 1 and every /stocks?page=N 404s — including
    // the paginated URLs in the sitemap. An empty list is a backend problem, not a
    // missing page.
    const outOfRange = listLength > 0 && requestedPage > totalPages;
    if (!Number.isInteger(requestedPage) || requestedPage < 1 || outOfRange) {
      error(404, "Stock directory page not found");
    }

    if (requestedPage === 1) {
      const canonicalParams = new URLSearchParams(url?.searchParams);
      canonicalParams.delete("page");
      const query = canonicalParams.toString();
      redirect(308, `${url?.pathname}${query ? `?${query}` : ""}`);
    }
  }

  return {
    getStockList,
  };
};
