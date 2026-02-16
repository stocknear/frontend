import { postAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";

export const load = async ({ locals }) => {
  const { pb, user } = locals;

  const getAllStrategies = async () => {
    let output = [];

    if (user?.tier !== "Pro") {
      return [];
    }

    try {
      output = await pb.collection("coveredCallScreener").getFullList({
        filter: `user="${user?.id}"`,
      });
      output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));
    } catch(e) {
      output = [];
    }

    return output;
  };

  // Fetch strategies first, then use result for screener data
  const strategyList = await getAllStrategies();

  const strategy = strategyList?.at(0);
  const getRuleOfList = strategy?.rules?.map((item) => item?.name) || [];
  const subscriber = user?.tier ?? 'Free';

  return {
    getScreenerData: await postAPI(locals, "/covered-call-screener-data", { ruleOfList: getRuleOfList, subscriber }),
    getAllStrategies: strategyList,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
