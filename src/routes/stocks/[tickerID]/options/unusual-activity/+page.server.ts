import { postAPI } from "$lib/server/api";
import { createDataPageSeoEligibility } from "$lib/seo/eligibility";

export const load = async ({ locals, params, url }) => {
  const [data, historicalPrice] = await Promise.all([
    postAPI(locals, "/unusual-activity", { ticker: params.tickerID }),
    postAPI(locals, "/historical-price", { ticker: params.tickerID, timePeriod: "max" }),
  ]);

  return {
    getData: data,
    getHistoricalPrice: historicalPrice,
    seoEligibility: createDataPageSeoEligibility(url?.pathname, data),
  };
};
