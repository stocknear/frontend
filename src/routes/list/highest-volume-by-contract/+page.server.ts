export const load = async ({ locals }) => {
  const getData = async () => {
    const { apiKey, apiURL } = locals;
    const postData = { filterList: "highest-volume-by-contract" };

    const response = await fetch(apiURL + "/list-category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();

    // If output is an array, reassign rank starting at 1
    if (Array.isArray(output)) {
      output = output.map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};
