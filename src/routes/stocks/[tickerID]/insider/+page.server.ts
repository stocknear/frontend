import { error, redirect } from "@sveltejs/kit";
import { formatString } from "$lib/utils";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";


export const load = async ({ locals, params }) => {
  const { apiURL, apiKey, user } = locals;

  const getInsiderTrading = async () => {
    const postData = {
      ticker: params.tickerID,
    };

    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/insider-trading", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();

    //output = !['Pro','Plus']?.includes(user?.tier) ? output?.slice(0, 6) : output;
    output = output?.map(({ reportingName, ...rest }) => ({
      ...rest,
      name: formatString(rest.name ?? reportingName)?.replace("/de/", "")
    }));

    output?.sort(
    (a, b) => new Date(b?.transactionDate) - new Date(a?.transactionDate),
  );
  
    return output;
  };


  const getHistoricalPrice = async () => {
    const postData = {
      ticker: params.tickerID,
      timePeriod: "max", // Get 6 months of data for the chart
    };

    try {
      const response = await fetch(apiURL + "/historical-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const output = await response.json();
        return output;
      }
    } catch (error) {
      console.error("Failed to fetch historical price data:", error);
    }
    return [];
  };

  const [insiderTrading, historicalPrice] = await Promise.all([
    getInsiderTrading(),
    getHistoricalPrice(),
  ]);

  return {
    getInsiderTrading: insiderTrading,
    getHistoricalPrice: historicalPrice,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
