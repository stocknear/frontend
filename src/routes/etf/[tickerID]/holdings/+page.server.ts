import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  return {
    getETFHoldings: await postAPI(locals, "/etf-holdings", { ticker: params.tickerID }),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
