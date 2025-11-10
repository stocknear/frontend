export const load = async ({ locals, setHeaders }) => {
  const getDividendCalendar = async () => {
    const { apiKey, apiURL } = locals;
    const response = await fetch(apiURL + "/dividends-calendar", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    const output = await response.json();

    setHeaders({ "cache-control": "public, max-age=3000" });

    return output;
  };

  // Make sure to return a promise
  return {
    getDividendCalendar: await getDividendCalendar(),
  };
};
