import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const isPro = locals.user?.tier === "Pro";

  let output = await postAPI(locals, "/max-pain", { ticker: params.tickerID });
  output.volume = [];

  // For non-Pro users, keep all expiration dates visible but only include data for the first one
  if (!isPro && Array?.isArray(output) && output?.length > 0) {
    output = output?.map((item, index) => {
      if (index === 0) {
        return item; // First expiration keeps all data
      }
      // Other expirations only keep the expiration date for the dropdown list
      return { expiration: item?.expiration };
    });
  }

  return { getData: output };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
