import { postAPI } from "$lib/server/api";
import { error, redirect } from "@sveltejs/kit";

export const load = async ({ locals, url }) => {
  const getStockList = await postAPI(locals, "/list-category", {
    filterList: "all-stock-tickers",
  });
  const pageValue = url?.searchParams?.get("page");

  if (pageValue !== null) {
    const requestedPage = Number(pageValue);
    const totalPages = Math.max(1, Math.ceil((getStockList?.length ?? 0) / 20));

    if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > totalPages) {
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
