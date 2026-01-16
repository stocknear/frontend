export const load = async ({ locals, params }) => {
  const { apiURL, apiKey, user } = locals;

  let politicianDistrict;
  let politicianCongress;
  let politicianParty = "n/a";

  const getData = async () => {
    const postData = { politicianId: params.slug };

    const response = await fetch(apiURL + "/politician-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response?.json();
    const history = output?.history;

    if (output && history?.length > 0) {
      const firstItem = history?.at(0);

      politicianParty = output?.party || "n/a";
      politicianDistrict = firstItem?.district;
      politicianCongress = firstItem?.congress;
    }

    // Filter premium performance data for non-Plus/Pro users
    // The client-side will show lock icons for these values
    if (!["Plus", "Pro"].includes(user?.tier) && output?.performance) {
      output.performance = {
        ...output.performance,
        // Pro/Plus-only fields - set to null so UI shows lock icons
        successRate: null,
        avgReturn: null,
      };
    }

    return { output, politicianParty, politicianDistrict, politicianCongress };
  };

  // Make sure to return a promise
  return {
    getData: await getData(),
  };
};