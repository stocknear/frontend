import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;
  const isPro = user?.tier === "Pro";

  const getData = async () => {
    const postData = {
      ticker: params.tickerID,
    };

    const response = await fetch(apiURL + "/options-expected-move", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();

    // For non-Pro users, keep all expiration dates visible but only include data for the first one
    if (!isPro && output?.expirations?.length > 0) {
      output.expirations = output.expirations?.map((item, index) => {
        if (index === 0) {
          return item; // First expiration keeps all data
        }
        // Other expirations only keep the expiration date for the dropdown list
        return { expiration: item?.expiration };
      });
    }

    return output;
  };

  return {
    getData: await getData(),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
