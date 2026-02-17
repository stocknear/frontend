import { getDefaultChats } from "$lib/utils";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async () => {
  return {
    randomChats: getDefaultChats()
      ?.sort(() => 0.5 - Math.random())
      ?.slice(0, 4),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
