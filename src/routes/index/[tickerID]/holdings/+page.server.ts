import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL } = locals;
  const getETFHoldings = async () => {


    let postData = {ticker: params.tickerID,}
    if (params.tickerID?.toLowerCase() === '^spx') {
      postData['ticker'] = 'spy';
    }
    if (params.tickerID?.toLowerCase() === '^dji') {
      postData['ticker'] = 'dia';
    }
    if (params.tickerID?.toLowerCase() === '^ixic') {
      postData['ticker'] = 'qqq';
    }

    if (params.tickerID?.toLowerCase() === '^rut') {
      postData['ticker'] = 'iwm';
    }

   
    
    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/etf-holdings", {
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

  // Make sure to return a promise
  return {
    getETFHoldings: await getETFHoldings(),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
