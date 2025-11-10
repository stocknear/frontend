export const load = async ({ locals }) => {
  const { apiKey, apiURL } = locals;
   const getNews = async () => {
      const postData = { newsType: "stock-news" };
      // make the POST request to the endpoint
      const response = await fetch(apiURL + "/market-news", {
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
  

  const getIPOCalendar = async () => {
    // make the POST request to the endpoint
    const postData = { year: "all" };

    const response = await fetch(apiURL + "/ipo-calendar", {
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

  // Make sure to return a promise
  return {
    getNews: await getNews(),
    getIPOCalendar: await getIPOCalendar(),
  };
};
