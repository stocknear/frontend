const cache = new Map();

const getStockData = async (ticker) => {
  if (cache.has(ticker)) {
    return cache.get(ticker);
  }

  const response = await fetch("/api/options-calculator", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ticker }),
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch options calculator data: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // Keep fallback error message.
    }
    throw new Error(errorMessage);
  }

  const output = (await response.json()) || {};
  cache.set(ticker, output);
  return output;
};

onmessage = async (event) => {
  const { ticker, requestId } = event.data;
  try {
    const output = await getStockData(ticker);
    postMessage({ requestId, message: "success", output });
  } catch (error) {
    postMessage({
      requestId,
      message: "error",
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch options calculator data.",
    });
  }
};

export {};
