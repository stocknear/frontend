
import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;

  const getData = async () => {
    const postData = {
      params: params.tickerID,
      category: "overview",
      type: "",
    };

    const response = await fetch(apiURL + "/options-gex-dex", {
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


   const getHistoricalPrice = async () => {
     const postData = { ticker: params.tickerID, timePeriod: "one-year" };
  const response = await fetch(apiURL + "/historical-price", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(postData),
  });

    const output = await response.json();
    return output;
  }; 

  

  // Fetch both in parallel
  const [data, historicalPrice] = await Promise.all([
    getData(),
    getHistoricalPrice(),
  ]);

  return {
    getData: data,
    getHistoricalPrice: historicalPrice,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
