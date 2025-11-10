// Cache to store previous requests
let cache = new Map();

const getStockData = async (ticker) => {


  // Check if data for this rule set is already in the cache
  if (cache.has(ticker)) {
    console.log("Returning cached data");
    return cache.get(ticker);
  }

  const postData = { ticker: ticker };
      const response = await fetch("/api/options-calculator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });


    const output = (await response.json()) || {};

  cache.set(ticker, output);

  return output;
};

onmessage = async (event) => {
  const { ticker } = event.data;
  const output = await getStockData(ticker);

   
  postMessage({ message: "success", output });
};

export {};
