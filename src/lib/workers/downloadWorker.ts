// Cache to store previous requests
let cache = new Map();

const getIndicatorData = async (rules, tickerList) => {
  console.log("Checking cache and fetching new data if needed");

  // Extract the rule names
  let getRuleOfList = rules?.map((rule) => rule.rule) || [];
  // Convert the rule set into a string key for the cache
  const ruleKey = JSON.stringify(getRuleOfList);

  // Check if data for this rule set is already in the cache
  if (cache.has(ruleKey)) {
    console.log("Returning cached data");
    return cache.get(ruleKey);
  }

  // Fetch new data if it's not in the cache
  const postData = { ruleOfList: getRuleOfList, tickerList: tickerList };
  const response = await fetch("/api/indicator-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const output = await response.json();
  // Store the new data in the cache
  cache.set(ruleKey, output);

  return output;
};

onmessage = async (event) => {
  const { ruleOfList, tickerList } = event.data || {};
  const rawData = await getIndicatorData(ruleOfList, tickerList);

  
    
  postMessage({ message: "success", rawData });
};

export {};
