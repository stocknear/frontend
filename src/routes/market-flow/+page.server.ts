export const load = async ({ locals }) => {
    const { apiKey, apiURL } = locals;

  const getData = async () => {

    const response = await fetch(apiURL + "/market-flow", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

  const output = await response?.json();
    return output;
  };

  
    const getFearAndGreed = async () => {
        try {
            // Make the GET request to the fear-and-greed endpoint
            const response = await fetch(apiURL + "/fear-and-greed", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": apiKey,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const output = await response.json();

            // Python script now provides data in the correct format
            return output;
        } catch (error) {
            console.error("Error fetching fear and greed data:", error);
            
            // Return minimal fallback data
            return {
                current: {
                    value: 50,
                    category: "Neutral",
                    last_update: new Date().toISOString(),
                },
                historical: [],
                statistics: {
                    average: 50,
                    max: { value: 100, date: "" },
                    min: { value: 0, date: "" },
                    total_days: 0,
                    category_distribution: {},
                    monthly_averages: {},
                },
            };
        }
    };

  // Make sure to return a promise
  return {
    getData: await getData(),
    getFearAndGreed: await getFearAndGreed(),
  };
};
