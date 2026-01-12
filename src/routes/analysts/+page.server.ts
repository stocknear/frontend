export const load = async ({ locals }) => {
  const getTopAnalyst = async () => {
    const { apiURL, apiKey, user } = locals;

    const response = await fetch(apiURL + "/top-analysts", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let output = await response?.json();

    output = !["Pro", "Plus"]?.includes(user?.tier) ? output?.reverse()?.slice(0, 6) : output;

    // Rename analystName to name for search worker compatibility
    output = output?.map(({ analystName, ...rest }) => ({
      ...rest,
      name: analystName,
    }));

    return output;
  };

  // Make sure to return a promise
  return {
    getTopAnalyst: await getTopAnalyst(),
  };
};
