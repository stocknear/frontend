

import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;
  const isPro = user?.tier === "Pro";

  const getData = async () => {
    const postData = {
      ticker: params.tickerID,
    };

    const response = await fetch(apiURL + "/greeks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();
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
