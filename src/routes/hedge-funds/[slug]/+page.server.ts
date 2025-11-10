
export const load = async ({ params, locals }) => {


      
  const getCIKNumber = async () => {
    return params.slug;
  };

  const getHedgeFundsData = async () => {
    const { apiURL, apiKey } = locals;
    const response = await fetch(apiURL + "/cik-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ cik: params.slug }),
    });

    const output = await response.json();
    /*
    if (output?.holdings) {
      output.holdings = output?.holdings?.filter(
        (item) =>  item?.symbol
      );
    }
      */

    return output;
  };

  return {
    getHedgeFundsData: await getHedgeFundsData(),
    getCIKNumber: await getCIKNumber(),
  };
};
