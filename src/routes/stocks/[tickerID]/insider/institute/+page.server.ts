import { formatString } from "$lib/utils";
import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  let output = await postAPI(locals, "/shareholders", { ticker: params.tickerID });

  output.shareholders = output?.shareholders?.map(({ investorName, ...rest }) => ({
    ...rest,
    name: formatString(rest.name ?? investorName)
  }));

  return { getShareholderData: output };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
