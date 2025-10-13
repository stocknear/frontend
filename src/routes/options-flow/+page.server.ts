export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user, wsURL } = locals;


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
    const response = await fetch(apiURL + "/options-flow-feed", {
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

  // Make sure to return a promise
  return {
    getOptionsFlowFeed: await getOptionsFlowFeed(),
    getOptionsWatchlist: await getOptionsWatchlist(),
    getAllStrategies: await getAllStrategies(),
    wsURL: wsURL,
  };
};
