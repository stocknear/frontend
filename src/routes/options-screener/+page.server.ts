import { error, redirect } from "@sveltejs/kit";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";


export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user } = locals;

  const getAllStrategies = async () => {
    let output = [];

    if (user?.tier !== "Pro") {
        return [];
      }

     try {
        output = await pb.collection("optionsScreener").getFullList({
        filter: `user="${user?.id}"`,
        });
            output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));

    }
    catch(e) {
        output = [];
    }

  
    return output;
  };


  const getScreenerData = async () => {

  
    const postData = { selectedDates: [] };
    const response = await fetch(apiURL + "/options-screener-data", {
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

    const getIndexDict = async () => {

  
 const response = await fetch(apiURL + "/index-symbols", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
  });

    const output = await response.json();


    return output;
  };


  const [screenerData, allStrategies, indexDict] = await Promise.all([
    getScreenerData(),
    getAllStrategies(),
    getIndexDict(),
  ]);

  return {
    getScreenerData: screenerData,
    getAllStrategies: allStrategies,
    getIndexDict: indexDict,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
