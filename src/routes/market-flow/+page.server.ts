import { getAPI } from "$lib/server/api";

export const load = async ({ locals }) => {
  const [data, fearAndGreed, marketSeasonality] = await Promise.all([
    getAPI(locals, "/market-flow"),
    getAPI(locals, "/fear-and-greed"),
    getAPI(locals, "/market-seasonality"),
  ]);

  return {
    getData: data,
    getFearAndGreed: fearAndGreed,
    getMarketSeasonality: marketSeasonality,
  };
};
