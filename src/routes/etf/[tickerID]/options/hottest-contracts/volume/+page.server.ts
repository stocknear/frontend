import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  let output = await postAPI(locals, "/hottest-contracts", { ticker: params.tickerID });
  output.openInterest = [];

  return { getData: output };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
