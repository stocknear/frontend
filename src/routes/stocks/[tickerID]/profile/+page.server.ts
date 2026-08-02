import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { getNativeContentLocales, resolveBackendLocale } from "$lib/i18n/backend-locales";

export const load = async ({ params, locals }) => {
  const localeResolution = resolveBackendLocale("stockProfile", locals.locale);

  return {
    getData: await postAPI(locals, "/profile", { ticker: params.tickerID, lang: localeResolution.effectiveLocale }),
    localeResolution,
    contentLocales: getNativeContentLocales("stockProfile"),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
