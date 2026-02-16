import { postAPI } from "$lib/server/api";

export const load = async ({ locals, params }) => {
  const output = await postAPI(locals, "/politician-stats", { politicianId: params.slug });

  let politicianDistrict;
  let politicianCongress;
  let politicianParty = "n/a";

  const history = output?.history;

  if (output && history?.length > 0) {
    const firstItem = history?.at(0);
    politicianParty = output?.party || "n/a";
    politicianDistrict = firstItem?.district;
    politicianCongress = firstItem?.congress;
  }

  // Filter premium performance data for non-Plus/Pro users
  if (!["Plus", "Pro"].includes(locals.user?.tier) && output?.performance) {
    output.performance = {
      ...output.performance,
      successRate: null,
      avgReturn: null,
    };
  }

  return {
    getData: { output, politicianParty, politicianDistrict, politicianCongress },
  };
};
