import { getDefaultChats } from "$lib/utils";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async () => {
  return {
    allDefaultChats: getDefaultChats(),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
