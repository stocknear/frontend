import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { createDataPageSeoEligibility } from "$lib/seo/eligibility";

export const load = async ({ locals, params, url }) => {
  const getData = await postAPI(locals, "/options-expected-move", { ticker: params.tickerID });
  return {
    getData,
    seoEligibility: createDataPageSeoEligibility(url?.pathname, getData),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
