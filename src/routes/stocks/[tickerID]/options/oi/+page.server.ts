import { postAPI } from "$lib/server/api";
import { createDataPageSeoEligibility } from "$lib/seo/eligibility";

export const load = async ({ locals, params, url }) => {
  const getData = await postAPI(locals, "/options-oi", { params: params.tickerID, category: "strike" });
  return {
    getData,
    seoEligibility: createDataPageSeoEligibility(url?.pathname, getData),
  };
};
