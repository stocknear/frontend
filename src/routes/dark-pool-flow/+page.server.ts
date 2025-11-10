export const load = async ({ locals }) => {
  const { apiURL, apiKey, pb, user } = locals;


  const getAllStrategies = async () => {
      let output = [];

       try {
          output = await pb.collection("darkPoolFlow")?.getFullList({
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
    const response = await fetch(apiURL + "/dark-pool-flow-feed", {
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
    getFlowData: await getFlowData(),
    getAllStrategies: await getAllStrategies(),
  };
};
