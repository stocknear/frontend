import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";


export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user } = locals;

  const getAllStrategies = async () => {
    let output = [];
    if (user?.tier === 'Pro') {

   
     try {
        output = await pb.collection("coveredCallScreener").getFullList({
        filter: `user="${user?.id}"`,
        });
            output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));

    }
    catch(e) {
        output = [];
    }
     }
     else {
      output = []
     }


    return output;
  };


  const getScreenerData = async (strategyList) => {
    const subscriber = user?.tier ?? 'Free';
    const strategy = strategyList?.at(0);
    const getRuleOfList = strategy?.rules?.map((item) => item?.name) || [];

    const postData = { ruleOfList: getRuleOfList, subscriber };
    const response = await fetch(apiURL + "/covered-call-screener-data", {
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


  // Fetch strategies first, then use result for screener data
  const strategyList = await getAllStrategies();

  return {
    getScreenerData: await getScreenerData(strategyList),
    getAllStrategies: strategyList,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
