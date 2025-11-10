export const load = async ({ locals, setHeaders }) => {
  const getSentimentTracker = async () => {
    const { apiKey, apiURL, user } = locals;

    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/sentiment-tracker", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let output = await response.json();
    output = user?.tier !== "Pro" ? output?.reverse()?.slice(0, 6) : output;
    setHeaders({ "cache-control": "public, max-age=60*5" });

    return output;
  };

  // Make sure to return a promise
  return {
    getSentimentTracker: await getSentimentTracker(),
  };
};
