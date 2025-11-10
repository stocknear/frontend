export const load = async ({ locals }) => {
  const getData = async () => {
    const { apiKey, apiURL, user } = locals;
    const response = await fetch(apiURL + "/all-etf-providers", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let output = await response?.json();
    
    for (const item of output) {
      item.name = item?.etfProvider;
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
