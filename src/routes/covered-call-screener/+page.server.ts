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
  const subscriber = user?.tier ?? 'Free';

  // Build active rules from saved strategy (skip "any" values)
  const rules = (strategy?.rules || []).filter((r: any) =>
    r.value !== 'any' && !(Array.isArray(r.value) && r.value.includes('any'))
  );

  const params = new URLSearchParams({
    page: '1',
    pageSize: '20',
    sortKey: 'annualizedReturn',
    sortOrder: 'desc',
    tab: 'general',
    subscriber,
  });
  if (rules.length > 0) {
    params.set('rules', JSON.stringify(rules));
  }

  return {
    getScreenerFeed: await getAPI(locals, `/covered-call-screener-feed?${params}`),
    getAllStrategies: strategyList,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
