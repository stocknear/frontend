

export const load = async ({ locals, params }) => {
  const { apiURL, apiKey } = locals;
  const postData = {
    ticker: params.tickerID,
  };


  const getPriceAnalysis = async () => {
    const response = await fetch(apiURL + "/price-analysis", {
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

   const getAIScore = async () => {
    const response = await fetch(apiURL + "/ai-score", {
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

   const getHistoricalPrice = async () => {
       const postData = { ticker: params.tickerID, timePeriod: "max" };
    const response = await fetch(apiURL + "/historical-price", {
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


  const [priceAnalysis, historicalPrice, aiScore] = await Promise.all([
    getPriceAnalysis(),
    getHistoricalPrice(),
    getAIScore(),
  ]);

  return {
    getPriceAnalysis: priceAnalysis,
    getHistoricalPrice: historicalPrice,
    getAIScore: aiScore,
  };
};




