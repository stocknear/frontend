export const load = async ({ locals, params }) => {
  const { apiURL, apiKey, user } = locals;

  const getData = async () => {
    const postData = { analystId: params.slug };
    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/analyst-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json() || {};

    // Filter premium data for non-Plus/Pro users
    // The client-side shows lock icons for these values, but we must not leak actual data
    if (!["Plus", "Pro"].includes(user?.tier)) {
      return {
        ...output,
        // Pro/Plus-only fields - set to null so UI shows lock icons
        successRate: null,
        avgReturn: null,
      };
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
