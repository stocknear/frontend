import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

// Define the EMA parameters to check
const emaParameters = [
  "sma20",
  "sma50",
  "sma100",
  "sma200",
  "ema20",
  "ema50",
  "ema100",
  "ema200",
];
// Function to check and add missing EMA parameters
const ensureAllEmaParameters = (params) => {
  const includedEmaParameters = params.filter((param) =>
    emaParameters.includes(param)
  );
  if (includedEmaParameters.length > 0) {
    emaParameters.forEach((param) => {
      if (!params.includes(param)) {
        params.push(param);
      }
    });
  }
};

export const load = async ({ locals }) => {
  const { apiURL, apiKey,  user, pb } = locals;

  const getAllStrategies = async () => {
    let output = [];

     try {
        output = await pb.collection("stocksScreener").getFullList({
        filter: `user="${user?.id}"`,
        });
            output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));

    }
    catch(e) {
        output = [];
    }

   

    return output;
  };

  const getStockScreenerData = async (strategyList) => {
    const strategy = strategyList?.at(0);
    let getRuleOfList = strategy?.rules?.map((item) => item?.name) || [];
    // Ensure all required EMA parameters are included
    ensureAllEmaParameters(getRuleOfList);

    const postData = { ruleOfList: getRuleOfList };
    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/stock-screener-data", {
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

  // Fetch strategies once, then use result for screener data
  const strategyList = await getAllStrategies();

  return {
    getStockScreenerData: await getStockScreenerData(strategyList),
    getAllStrategies: strategyList,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
