import { getAPI } from "$lib/server/api";

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

  const [getFlowDataResult, getAllStrategiesResult] = await Promise.all([
    getFlowData(),
    getAllStrategies(),
  ]);

  return {
    getFlowData: getFlowDataResult,
    getAllStrategies: getAllStrategiesResult,
    wsURL: wsURL,
  };
};
