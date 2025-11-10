export const load = async ({ locals }) => {

  const getAllREITS = async () => {
    const { apiKey, apiURL } = locals;
    const postData = { filterList: 'reits' };

    const response = await fetch(apiURL + "/list-category", {
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

  // Make sure to return a promise
  return {
    getAllREITS: await getAllREITS(),
  };
};
