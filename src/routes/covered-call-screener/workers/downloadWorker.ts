// Cache to store previous requests
let cache: any = null;

const getScreenerData = async () => {
  // Return cached data if available
  if (cache) {
    return cache;
  }

  // Fetch all data (no date filtering)
  const postData = { selectedDates: [] };
  const response = await fetch("/api/covered-call-screener-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  const output = await response.json();

  // Store in cache
  cache = output;

  return output;
};

onmessage = async (event) => {
  const { refresh } = event.data || {};
  if (refresh) {
    cache = null;
  }
  const result = await getScreenerData();

  postMessage({ message: "success", stockScreenerData: result?.data, totalContracts: result?.totalContracts });
};

export {};
