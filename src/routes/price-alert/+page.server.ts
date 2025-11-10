export const load = async ({ locals }) => {
  const { apiKey, apiURL, user } = locals;

  const getPriceAlert = async () => {
    const postData = { userId: user?.id };
    const response = await fetch(apiURL + "/get-price-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();
    output.data = output?.data?.sort((a, b) => a?.symbol?.localeCompare(b?.symbol));
    return output;
  };

  
  // Make sure to return a promise
  return {
    getPriceAlert: await getPriceAlert(),
  };
};
