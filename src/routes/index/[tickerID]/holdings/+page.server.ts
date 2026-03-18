import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { getIndexProxyTicker } from "$lib/server/indexTickers";

export const load = async ({ locals, params }) => {
  const ticker = getIndexProxyTicker(params.tickerID);

  return {
    getETFHoldings: await postAPI(locals, "/etf-holdings", {
      ticker,
      assetType: "etf",
    }),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
