import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { createDataPageSeoEligibility } from "$lib/seo/eligibility";

export const load = async ({ locals, params, url }) => {
  const getOptionsChainStatistics = await postAPI(locals, "/options-chain-statistics", { ticker: params.tickerID });
  return {
    getOptionsChainStatistics,
    seoEligibility: createDataPageSeoEligibility(url?.pathname, getOptionsChainStatistics),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
