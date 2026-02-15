import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { redirect } from "@sveltejs/kit";

export async function load({ locals }) {
  const { pb} = locals;

  if (pb.authStore.isValid) {
        redirect(303, "/dashboard");
    }
  };

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
