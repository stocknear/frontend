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
            console.log(output)
            return output;
        
    };

  // Make sure to return a promise
  return {
    getData: await getData(),
    getFearAndGreed: await getFearAndGreed(),
  };
};
