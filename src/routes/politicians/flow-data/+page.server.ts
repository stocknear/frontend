import { getPartyForPoliticians } from "$lib/utils";

export const load = async ({ locals }) => {
  const getPoliticianRSS = async () => {
    let output;
    let rankingList = [];

    const { apiKey, apiURL } = locals;

    const response = await fetch(apiURL + "/congress-rss-feed", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    output = await response.json();

    try {
      const rankingResponse = await fetch(apiURL + "/all-politicians", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
      });
      rankingList = await rankingResponse.json();
    } catch (e) {
      rankingList = [];
    }

    const rankingMap = new Map(
      rankingList?.map((item) => [item?.id, item]) ?? [],
    );

    // Cache the data for this specific tickerID with a specific name 'getPoliticianRSS'

    output?.forEach((item) => {
      let representative = item?.representative || "";

      representative = representative
        ?.replace("Jr", "")
        ?.replace(/Dr./g, "")
        ?.replace(/Dr_/g, "");

      const fullName = representative
        ?.replace(/(\s(?:Dr\s)?\w(?:\.|(?=\s)))?\s/g, "_")
        ?.trim();
      item.representative = fullName?.replace(/_/g, " ");
    });

    output = output
      ?.map((item) => {
        const party = getPartyForPoliticians(item?.representative);
        const ranking = rankingMap.get(item?.id) || {};
        return {
          ...item,
          party: party,
          performanceScore: ranking?.performanceScore ?? null,
          performanceRank: ranking?.performanceRank ?? null,
        };
      })
      ?.filter((item) => item?.performanceScore != null);

    return output;
  };

  // Make sure to return a promise
  return {
    getPoliticianRSS: await getPoliticianRSS(),
  };
};
