import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  return {
    getData: await postAPI(locals, "/options-gex-dex", { params: params.tickerID, category: "strike", type: "dex" }),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
