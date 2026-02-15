import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
