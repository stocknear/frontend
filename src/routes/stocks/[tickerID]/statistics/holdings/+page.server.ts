import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "boolean") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export const load = async ({ locals, params }) => {
  const holdingsResponse = await postAPI(locals, "/etf-holdings", {
    ticker: params.tickerID,
    assetType: "stocks",
  });

  const getETFHoldings = Array.isArray(holdingsResponse)
    ? holdingsResponse
        .map((item) => ({
          symbol: typeof item?.symbol === "string" ? item.symbol : "",
          name:
            typeof item?.name === "string" && item.name.length > 0
              ? item.name
              : typeof item?.symbol === "string"
                ? item.symbol
                : "Unknown",
          weightPercentage: toFiniteNumber(item?.weightPercentage),
          marketValue: toFiniteNumber(item?.marketValue),
          sharesNumber: toFiniteNumber(item?.sharesNumber),
          price: toFiniteNumber(item?.price),
          changesPercentage: toFiniteNumber(item?.changesPercentage),
          marketCap: toFiniteNumber(item?.marketCap),
        }))
        .sort(
          (left, right) =>
            (right.marketValue ?? Number.NEGATIVE_INFINITY) -
              (left.marketValue ?? Number.NEGATIVE_INFINITY) ||
            (right.weightPercentage ?? Number.NEGATIVE_INFINITY) -
              (left.weightPercentage ?? Number.NEGATIVE_INFINITY),
        )
    : [];

  return {
    getETFHoldings,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
