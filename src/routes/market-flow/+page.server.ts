import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  // allSettled, not all: getAPI throws on any non-2xx and on its 10s timeout, so a slow
  // Fear & Greed or Seasonality response used to take the whole Market Flow page down with it.
  const [data, fearAndGreed, marketSeasonality] = await Promise.allSettled([
    getAPI(locals, "/market-flow"),
    getAPI(locals, "/fear-and-greed"),
    getAPI(locals, "/market-seasonality"),
  ]);

  const unwrap = (result: PromiseSettledResult<any>, endpoint: string) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`[upstream] ${endpoint} failed — ${result.reason}`);
    return {};
  };

  return {
    getData: unwrap(data, "/market-flow"),
    getFearAndGreed: unwrap(fearAndGreed, "/fear-and-greed"),
    getMarketSeasonality: unwrap(marketSeasonality, "/market-seasonality"),
  };
};
