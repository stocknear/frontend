export const load = async ({ locals }) => {
  const getData = async () => {

    const { apiKey, apiURL, user } = locals;

    const response = await fetch(apiURL + "/news-flow", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let output = await response.json();
    let totalItems = output?.length;
    output = user?.tier === 'Pro' ? output : output?.slice(0,5);
    return {output, totalItems};
  };

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
