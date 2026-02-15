export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user, wsURL, fastifyURL } = locals;


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

    const response = await fetch(apiURL + "/unusual-order-feed?" + params.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });
    const output = await response.json();

    return output;
  };

  // Generate WebSocket token for Pro users
  const getWsToken = async () => {
    if (user?.tier !== "Pro") {
      return null;
    }
    try {
      const response = await fetch(fastifyURL + "/generate-ws-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          tier: user?.tier,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (e) {
      console.error("Failed to generate WS token:", e);
    }
    return null;
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
