export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user, wsURL, fastifyURL } = locals;


  const getAllStrategies = async () => {
      let output = [];

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
    // Always use limit for Pro users - WebSocket will send remaining historical data
    const isSubscriber = user?.tier === "Pro";
    const limitParam = isSubscriber
      ? "?limit=5000&subscriber=Pro"
      : "?limit=0&subscriber=Free";

    const response = await fetch(apiURL + "/unusual-order-feed" + limitParam, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });
    const output = await response.json();
    const totalOrders =
      Array.isArray(output) ? output?.length || 0 : output?.totalOrders || 0;
    const orders = Array.isArray(output) ? output : output?.orders || [];
    const data = isSubscriber ? orders : orders?.slice(-6);

    return { data, totalOrders };
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


  return {
    getFlowData: await getFlowData(),
    getAllStrategies: await getAllStrategies(),
    wsURL: wsURL,
    wsToken: await getWsToken(),
  };
};
