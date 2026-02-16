import { formatString } from "$lib/utils";
import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const [insiderData, historicalPrice] = await Promise.all([
    postAPI(locals, "/insider-trading", { ticker: params.tickerID }),
    postAPI(locals, "/historical-price", { ticker: params.tickerID, timePeriod: "max" }).catch(() => []),
  ]);

  let insiderTrading = insiderData?.map(({ reportingName, ...rest }) => ({
    ...rest,
    name: formatString(rest.name ?? reportingName)?.replace("/de/", "")
  }));

  insiderTrading?.sort(
    (a, b) => new Date(b?.transactionDate) - new Date(a?.transactionDate),
  );

  return {
    getInsiderTrading: insiderTrading,
    getHistoricalPrice: historicalPrice,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
