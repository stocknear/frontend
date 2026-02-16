import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const [data, historicalPrice] = await Promise.all([
    postAPI(locals, "/hottest-contracts", { ticker: params.tickerID }),
    postAPI(locals, "/historical-price", { ticker: params.tickerID, timePeriod: "six-months" }),
  ]);

  data.openInterest = [];

  return {
    getData: data,
    getHistoricalPrice: historicalPrice,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
