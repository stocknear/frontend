import { postAPI } from "$lib/server/api";
import { redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { getNativeContentLocales, resolveBackendLocale } from "$lib/i18n/backend-locales";
import { hrefForLocale } from "$lib/i18n/navigation";

export const load = async ({ params, locals, url }) => {
  const localeResolution = resolveBackendLocale("stockProfile", locals.locale);

  if (localeResolution.fallbackApplied) {
    redirect(307, hrefForLocale(`${url.pathname}${url.search}`, "en"));
  }

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
