import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const tickerMap = { '^spx': 'spy', '^dji': 'dia', '^ixic': 'qqq', '^rut': 'iwm' };
  const ticker = tickerMap[params.tickerID?.toLowerCase()] ?? params.tickerID;

  return {
    getETFHoldings: await postAPI(locals, "/etf-holdings", { ticker }),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
