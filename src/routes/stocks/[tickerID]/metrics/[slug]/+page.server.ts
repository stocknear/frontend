import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ params }) => {
  const getParams = async () => {
    return params.slug
  }
  // Make sure to return a promise
  return {
    getParams: await getParams(),
  }
}

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
