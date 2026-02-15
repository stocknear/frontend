import { error, redirect } from "@sveltejs/kit";
import { PREMIUM_TIERS, fetchAndProcessStatement } from "$lib/financials/statementHelpers";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;
  const canViewAllHistory = PREMIUM_TIERS.has(user?.tier);
  return fetchAndProcessStatement(apiURL, apiKey, params.tickerID, 'cash-flow-statement', canViewAllHistory);
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
