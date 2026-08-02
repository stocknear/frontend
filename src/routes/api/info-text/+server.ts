import type { RequestHandler } from "./$types";
import { postAPI } from "$lib/server/api";
import { canonicalizeLocale } from "$lib/i18n/locales";
import { baseLocale } from "$lib/paraglide/runtime.js";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const locale =
    data?.locale === undefined
      ? canonicalizeLocale(locals.locale) ?? baseLocale
      : canonicalizeLocale(data.locale) ?? baseLocale;
  const output = await postAPI(locals, "/info-text", {
    parameter: data?.parameter,
    locale,
  });
  return Response.json(output);
};
