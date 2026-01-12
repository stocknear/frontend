  import { sectorList } from "$lib/utils";


export const load = async ({ locals }) => {
  const getSectorIndustryOverview = async () => {
    const { apiKey, apiURL } = locals;

    const response = await fetch(apiURL + "/sector-industry-overview", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    let output = await response?.json();

    // Transform each sector's industries to rename 'industry' to 'name'
    for (const sector of Object.keys(output)) {
      output[sector] = output[sector]?.map(({ industry, ...rest }) => ({
        ...rest,
        name: industry,
      }));
    }

    return output;
  };

  // Make sure to return a promise
  return {
    getSectorIndustryOverview: await getSectorIndustryOverview(),
  };
};
