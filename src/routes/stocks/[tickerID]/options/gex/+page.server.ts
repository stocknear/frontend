import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { createDataPageSeoEligibility } from "$lib/seo/eligibility";

export const load = async ({ locals, params, url }) => {
  const [data, historicalPrice] = await Promise.all([
    postAPI(locals, "/options-gex-dex", { params: params.tickerID, category: "overview", type: "" }),
    postAPI(locals, "/historical-price", { ticker: params.tickerID, timePeriod: "one-year" }),
  ]);

  return {
    getData: data,
    getHistoricalPrice: historicalPrice,
    seoEligibility: createDataPageSeoEligibility(url?.pathname, data),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
