import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { redirect } from "@sveltejs/kit";

// Dashboard now renders at `/` — redirect here for backward compatibility
export async function load() {
  redirect(303, "/");
}

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
