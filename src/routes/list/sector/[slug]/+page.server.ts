export const load = async ({ locals, params }) => {
  const { apiKey, apiURL } = locals;

  const getParams = async () => {
    return params.slug;
  };
  const getSectorCategory = async () => {
    const postData = { filterList: params.slug };

    const response = await fetch(apiURL + "/list-category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json();
    return output;
  };
  /*
  const getHistoricalSector = async () => {
    const postData = { filterList: "financial" };

    const response = await fetch(apiURL + "/historical-sector-price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json();

    return output;
  };
  */

  // Make sure to return a promise
  return {
    getParams: await getParams(),
    getSectorCategory: await getSectorCategory(),
    //getHistoricalSector: await getHistoricalSector(),
  };
};
