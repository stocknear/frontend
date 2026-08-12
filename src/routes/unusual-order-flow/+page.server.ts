import { getAPI } from "$lib/server/api";
import { issueWsToken } from "$lib/server/ws-token";
import {
  UNUSUAL_FLOW_CATEGORICAL_RULES,
  UNUSUAL_FLOW_NUMERIC_RULES,
  normalizeFlowRules,
} from "$lib/flow-page-state";

export const load = async ({ locals, url }) => {
  const { pb, user, wsURL } = locals;

  const getAllStrategies = async () => {
    let output = [];

    if (user?.tier !== "Pro") {
      return [];
    }

    try {
      output = await pb.collection("unusualOrderFlow")?.getFullList({
        filter: `user="${user?.id}"`,
      });
      output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));
    } catch (e) {
      output = [];
    }

    return output;
  };

  const getFlowData = async (rules: any[], search: string) => {
    const isSubscriber = user?.tier === "Pro";
    const params = new URLSearchParams({
      page: "1",
      pageSize: "50",
      sortKey: "date",
      sortOrder: "desc",
      subscriber: isSubscriber ? "Pro" : "Free",
    });
    if (search) params.set("search", search);
    if (rules.length > 0) params.set("rules", JSON.stringify(rules));

    return await getAPI(locals, `/unusual-order-feed?${params.toString()}`);
  };

  const getWsToken = async () => {
    return issueWsToken({
      locals,
      scope: "/unusual-order",
      requirePro: true,
    });
  };

  const getAllStrategiesResult = await getAllStrategies();
  const savedRules = Array.isArray(getAllStrategiesResult?.[0]?.rules)
    ? normalizeFlowRules(
        getAllStrategiesResult[0].rules,
        UNUSUAL_FLOW_NUMERIC_RULES,
        UNUSUAL_FLOW_CATEGORICAL_RULES,
      )
    : [];
  const search =
    user?.tier === "Pro" ? url.searchParams.get("query") || "" : "";
  const [getFlowDataResult, wsTokenResult] = await Promise.all([
    getFlowData(savedRules, search),
    getWsToken(),
  ]);

  return {
    getFlowData: getFlowDataResult,
    getAllStrategies: getAllStrategiesResult,
    wsURL: wsURL,
    wsToken: wsTokenResult,
  };
};
