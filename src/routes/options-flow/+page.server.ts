export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user, wsURL, fastifyURL } = locals;

  // Check if US stock market is currently open (for WebSocket availability)
  const isMarketOpen = () => {
    const now = new Date();
    const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = nyTime.getDay();
    const hours = nyTime.getHours();
    const minutes = nyTime.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // Market closed on weekends (Saturday=6, Sunday=0)
    if (day === 0 || day === 6) return false;

    // Market hours: 9:30 AM - 4:00 PM ET (570 - 960 minutes)
    return timeInMinutes >= 570 && timeInMinutes < 960;
  };

  const getAllStrategies = async () => {
      let output = [];

       try {
          output = await pb.collection("optionsFlow").getFullList({
          filter: `user="${user?.id}"`,
          });
              output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));

      }
      catch(e) {
          output = [];
      }


      return output;
    };

  const getOptionsFlowFeed = async () => {
    // Only use limit for Pro users when market is open (WebSocket will send historical data)
    // Otherwise, fetch all data since WebSocket won't be available
    const useLimit = user?.tier === "Pro" && isMarketOpen();
    const limitParam = useLimit ? "?limit=500" : "?limit=0";

    const response = await fetch(apiURL + "/options-flow-feed" + limitParam, {
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


  const getOptionsWatchlist = async () => {
    let output;
    try {
      output = (
        await pb?.collection("optionsWatchlist").getFullList({
          filter: `user="${user?.id}"`,
        })
      )?.at(0);
      if (output === undefined) {
        output = { optionsId: [] };
      }
    } catch (e) {
      //console.log(e)
      output = { optionsId: [] };
    }
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

  // Make sure to return a promise
  return {
    getOptionsFlowFeed: await getOptionsFlowFeed(),
    getOptionsWatchlist: await getOptionsWatchlist(),
    getAllStrategies: await getAllStrategies(),
    wsURL: wsURL,
    wsToken: await getWsToken(),
  };
};
