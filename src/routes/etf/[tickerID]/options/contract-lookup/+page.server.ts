import { redirect } from "@sveltejs/kit";
import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params, url }) => {
  const contract = url.searchParams.get("contract");
  const legacyContract = url.searchParams.get("query");

  if (!contract && legacyContract) {
    const nextUrl = new URL(url.toString());
    nextUrl.searchParams.set("contract", legacyContract);
    nextUrl.searchParams.delete("query");
    throw redirect(301, `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }

  return {
    getData: await postAPI(locals, "/contract-lookup-summary", { ticker: params.tickerID }),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
