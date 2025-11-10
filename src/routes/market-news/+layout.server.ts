export const load = async ({ locals }) => {
    const { apiURL, apiKey } = locals;

  const getStockNews = async () => {
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


   const getMarketNews = async () => {
    const postData = { newsType: "general-news" };

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

  const getPressNews = async () => {
    const postData = { newsType: "press-news" };

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



  
  return {
    getStockNews: await getStockNews(),
    getMarketNews: await getMarketNews(),
    getPressNews: await getPressNews(),
  };
};
