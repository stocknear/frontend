export const load = async ({ locals }) => {
  const getIndustryOverview = async () => {
    const { apiKey, apiURL } = locals;

    const response = await fetch(apiURL + "/industry-overview", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let output = await response.json();

    // delete industry field and replace with name field

    output = output.map(({ industry, ...rest }) => ({
      ...rest,
      name: industry,
    }));


    return output;
  };

  // Make sure to return a promise
  return {
    getIndustryOverview: await getIndustryOverview(),
  };
};
