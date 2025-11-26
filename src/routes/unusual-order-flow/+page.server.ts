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
    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/unusual-order-feed", {
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
