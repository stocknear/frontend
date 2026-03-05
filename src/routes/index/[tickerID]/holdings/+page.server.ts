import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
const tickerMap = {
  '^spx': 'spy',   // S&P 500
  '^gspc': 'spy',  // S&P 500 (Yahoo symbol)
  '^dji': 'dia',   // Dow Jones Industrial Average
  '^ndx': 'qqq',   // Nasdaq-100
  '^ixic': 'qqq',  // Nasdaq Composite (closest ETF proxy)
  '^rut': 'iwm',   // Russell 2000
  '^vix': 'vxx',   // VIX proxy (volatility ETN)
  '^nyA': 'vti',   // NYSE Composite proxy
};
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
