import { error, redirect } from "@sveltejs/kit";
import { formatString } from "$lib/utils";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";


  
export const load = async ({ locals, params }) => {
  const { apiURL, apiKey, user } = locals;

  const getShareholderData = async () => {
    const postData = {
      ticker: params.tickerID,
    };

    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/shareholders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();

    //output.shareholders = !['Plus','Pro']?.includes(user?.tier) ? output.shareholders?.slice(0, 3) : output.shareholders;
      output.shareholders = output?.shareholders?.map(({ investorName, ...rest }) => ({
      ...rest,
      name: formatString(rest.name ?? investorName)
    }));
   
    return output;
  };


  // Make sure to return a promise
  return {
    getShareholderData: await getShareholderData(),
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
