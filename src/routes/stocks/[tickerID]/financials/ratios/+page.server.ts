import { PREMIUM_TIERS, fetchAndProcessStatement } from "$lib/financials/statementHelpers";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { getLocaleDefinition } from "$lib/i18n/locales";
import { getFinancialRatiosCatalog } from "$lib/server/financial-ratios";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user, locale } = locals;
  const canViewAllHistory = PREMIUM_TIERS.has(user?.tier);
  const ticker = encodeURIComponent(params.tickerID);
  const localeSlug = getLocaleDefinition(locale).slug;
  const localePath = localeSlug ? `/${localeSlug}` : "";
  const stockPath = `${localePath}/stocks/${ticker}`;

  const [statementData, financialRatiosI18n] = await Promise.all([
    fetchAndProcessStatement(apiURL, apiKey, params.tickerID, "ratios", canViewAllHistory),
    getFinancialRatiosCatalog(locale),
  ]);

  return {
    ...statementData,
    financialRatiosTicker: params.tickerID,
    financialRatiosLanguage: getLocaleDefinition(locale).intlTag,
    financialRatiosI18n,
    financialRatiosUrls: {
      home: `https://stocknear.com${localePath || "/"}`,
      stocks: `https://stocknear.com${localePath}/stocks`,
      stock: `https://stocknear.com${stockPath}`,
      financials: `https://stocknear.com${stockPath}/financials`,
      ratios: `https://stocknear.com${stockPath}/financials/ratios`,
    },
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
