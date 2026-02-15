import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";


export const load = async ({ params, locals }) => {
  const getData = async () => {

    const { apiURL, apiKey, locale } = locals;

    const postData = {
      ticker: params.tickerID,
      lang: locale ?? 'en',
    };

    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json();

    return  output;
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
