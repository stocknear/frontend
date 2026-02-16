import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const output = await postAPI(locals, "/historical-employees", { ticker: params.tickerID });

  const filteredData = output?.filter(item => {
    const year = new Date(item?.date)?.getFullYear();
    return year >= 2010;
  });

  return { getHistoryEmployee: filteredData };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
