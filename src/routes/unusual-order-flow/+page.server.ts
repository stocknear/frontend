import { getAPI } from "$lib/server/api";
import { issueWsToken } from "$lib/server/ws-token";

export const load = async ({ locals }) => {
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

      }
      catch(e) {
          output = [];
      }


      return output;
    };

  const getFlowData = async () => {
    const isSubscriber = user?.tier === "Pro";
    const params = new URLSearchParams({
      page: "1",
      pageSize: "50",
      sortKey: "date",
      sortOrder: "desc",
      subscriber: isSubscriber ? "Pro" : "Free",
    });

    return await getAPI(locals, `/unusual-order-feed?${params.toString()}`);
  };

  const getWsToken = async () => {
    return issueWsToken({
      locals,
      scope: "/unusual-order",
      requirePro: true,
    });
  };

  const [getFlowDataResult, getAllStrategiesResult, wsTokenResult] = await Promise.all([
    getFlowData(),
    getAllStrategies(),
    getWsToken(),
  ]);

  return {
    getFlowData: getFlowDataResult,
    getAllStrategies: getAllStrategiesResult,
    wsURL: wsURL,
    wsToken: wsTokenResult,
  };
};
