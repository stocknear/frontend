export const load = async ({ locals }) => {
  const getAllPolitician = async () => {
    const { apiKey, apiURL } = locals;

    const response = await fetch(apiURL + "/all-politicians", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    // Data is now pre-processed in the backend with party, filtered by performanceRank > 0, and sorted
    const output = await response.json();

    return output;
  };

  // Make sure to return a promise
  return {
    getAllPolitician: await getAllPolitician(),
  };
};
