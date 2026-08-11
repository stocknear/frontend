import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { createBillingAccountProof } from "$lib/server/billingAccountProof";

export const load = async ({ locals }) => {
  return {
    checkoutBinding: createBillingAccountProof(locals.user),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
