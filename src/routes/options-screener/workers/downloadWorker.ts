// Cache to store previous requests
let cache = new Map();

const getScreenerData = async (selectedDate) => {
  console.log("Checking cache and fetching new data if needed");



  // Convert the rule set into a string key for the cache
  const ruleKey = JSON.stringify(selectedDate);

  // Check if data for this rule set is already in the cache
  if (cache.has(ruleKey)) {
    console.log("Returning cached data");
    return cache.get(ruleKey);
  }

  // Fetch new data if it's not in the cache
  const postData = { selectedDates: [selectedDate] };
  const response = await fetch("/api/options-screener-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const output = (await response.json())?.data;

  // Store the new data in the cache
  cache.set(ruleKey, output);

  return output;
};

onmessage = async (event) => {
  const { selectedDate } = event.data || {};
  const stockScreenerData = await getScreenerData(selectedDate);
  
  postMessage({ message: "success", stockScreenerData });
};

export {};
