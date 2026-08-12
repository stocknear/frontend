import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

/*
export const load = async ({ locals }) => {
  const { pb } = locals;

  // Get `page` from query parameters, default to 1

  const getLTDCount = async () => {
    const output = (await pb.collection("users").getFullList({
      filter: "lifetime = true"
    }))?.length || 0;

    const count = 70 - output;
    if (count < 0) {
      return 0;
    }
    return count;
  };

  return {
    getLTDCount: await getLTDCount(),
  };
};
*/

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
