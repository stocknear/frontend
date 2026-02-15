

import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params, url }) => {
  const { apiKey, apiURL, user } = locals;
  const contract = url.searchParams.get("contract");
  const legacyContract = url.searchParams.get("query");

  if (!contract && legacyContract) {
    const nextUrl = new URL(url.toString());
    nextUrl.searchParams.set("contract", legacyContract);
    nextUrl.searchParams.delete("query");
    throw redirect(301, `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }

  const getData = async () => {
    const postData = {
      ticker: params.tickerID,
    };

    const response = await fetch(apiURL + "/contract-lookup-summary", {
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

/*
   const getHistoricalPrice = async () => {
     const postData = { ticker: params.tickerID, timePeriod: "six-months" };
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
*/
  

  // Make sure to return a promise
  return {
    getData: await getData(),
    //getHistoricalPrice: await getHistoricalPrice(),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
