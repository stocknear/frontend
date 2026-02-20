import { getAPI } from "$lib/server/api";
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

  const strategyList = await getAllStrategies();
  const strategy = strategyList?.at(0);
  const subscriber = user?.tier ?? "Free";

  const rules = (strategy?.rules ?? []).filter((r: any) => {
    const v = r.value;
    if (v == null || v === "any") return false;
    if (Array.isArray(v) && (v.length === 0 || v.includes("any"))) return false;
    return true;
  });

  const params = new URLSearchParams({
    page: "1",
    pageSize: "20",
    sortKey: "totalPrem",
    sortOrder: "desc",
    tab: "general",
    subscriber,
  });
  if (rules.length > 0) {
    params.set("rules", JSON.stringify(rules));
  }

  return {
    getScreenerFeed: await getAPI(locals, `/options-screener-feed?${params}`),
    getAllStrategies: strategyList,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
