export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user, wsURL } = locals;

  const getAllStrategies = async () => {
    let output = [];
    try {
      output = await pb.collection("blockTradeFlow")?.getFullList({
        filter: `user="${user?.id}"`,
      });
      output?.sort(
        (a, b) => new Date(b?.updated) - new Date(a?.updated),
      );
    } catch (e) {
      output = [];
    }
    return output;
  };

  const getBlockTradeFlowFeed = async () => {
    const response = await fetch(apiURL + "/block-trade-flow-feed", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });
    let output = await response.json();
    output = user?.tier !== "Pro" ? output?.slice(-6) : output;
    return output;
  };

  return {
    getBlockTradeFlowFeed: await getBlockTradeFlowFeed(),
    getAllStrategies: await getAllStrategies(),
    wsURL: wsURL,
  };
};
