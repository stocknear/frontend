import { postAPI, getAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals }) => {
  const { pb, user } = locals;

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
    } catch(e) {
      output = [];
    }

    return output;
  };

  const [screenerData, allStrategies, indexDict] = await Promise.all([
    postAPI(locals, "/options-screener-data", { selectedDates: [] }),
    getAllStrategies(),
    getAPI(locals, "/index-symbols"),
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
