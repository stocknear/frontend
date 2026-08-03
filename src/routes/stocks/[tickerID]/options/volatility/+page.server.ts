import { postAPI } from "$lib/server/api";
import { createDataPageSeoEligibility } from "$lib/seo/eligibility";

export const load = async ({ locals, params, url }) => {
  const getData = await postAPI(locals, "/implied-volatility", { ticker: params.tickerID });
  return {
    getData,
    seoEligibility: createDataPageSeoEligibility(url?.pathname, getData),
  };
};
