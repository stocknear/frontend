export const load = async ({ locals }) => {
  const getData = async () => {
    const { apiURL, apiKey, user } = locals;

    const response = await fetch(apiURL + "/analyst-flow", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let output = await response.json();


    return output;
  };

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
