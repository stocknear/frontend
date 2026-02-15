import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ params, locals }) => {
  const getStockDividend = async () => {
    let newsList;

    const { apiURL, apiKey } = locals;

    const postData = {
      ticker: params.tickerID,
    };

    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/stock-dividend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    newsList = await response.json();

    return newsList;
  };

  // Make sure to return a promise
  return {
    getStockDividend: await getStockDividend(),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
