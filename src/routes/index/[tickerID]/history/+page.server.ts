import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;
  const getData = async () => {
     const postData = { ticker: params.tickerID };

   
  const response = await fetch(apiURL + "/historical-adj-price", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

  let output = await response.json();

    return output;
  };

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
