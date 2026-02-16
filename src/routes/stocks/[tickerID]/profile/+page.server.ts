import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ params, locals }) => {
  return {
    getData: await postAPI(locals, "/profile", { ticker: params.tickerID, lang: locals.locale ?? 'en' }),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
