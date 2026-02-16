import { getAPI } from "$lib/server/api";

export const load = async ({ locals, url }) => {
  const { pb, user, wsURL, fastifyURL } = locals;

  const getAllStrategies = async () => {
    let output = [];

     if (user?.tier !== "Pro") {
      return [];
    }

    try {
      output = await pb.collection("optionsFlow").getFullList({
        filter: `user="${user?.id}"`,
      });
      output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));
    } catch (e) {
      output = [];
    }
    return output;
  };

  const getOptionsWatchlist = async () => {
    let output;
    try {
      output = (
        await pb?.collection("optionsWatchlist").getFullList({
          filter: `user="${user?.id}"`,
        })
      )?.at(0);
      if (output === undefined) {
        output = { optionsId: [] };
      }
    } catch (e) {
      output = { optionsId: [] };
    }
    return output;
  };

  const getWsToken = async () => {
    if (user?.tier !== "Pro") {
      return null;
    }
    try {
      const response = await fetch(fastifyURL + "/generate-ws-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          tier: user?.tier,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (e) {
      console.error("Failed to generate WS token:", e);
    }
    return null;
  };

  // Fetch strategies, watchlist, WS token in parallel
  const [getAllStrategiesData, getOptionsWatchlistData, wsTokenData] = await Promise.all([
    getAllStrategies(),
    getOptionsWatchlist(),
    getWsToken(),
  ]);

  // Build paginated request from URL params + saved strategy rules
  const isSubscriber = user?.tier === "Pro";
  const activeStrategy = getAllStrategiesData?.at(0);
  const rules = activeStrategy?.rules || [];
  const search = url.searchParams.get("query") || "";

  const params = new URLSearchParams({
    page: "1",
    pageSize: "50",
    sortKey: "time",
    sortOrder: "desc",
    subscriber: isSubscriber ? "Pro" : "Free",
  });

  if (search) {
    params.set("search", search);
  }

  // Pass saved strategy rules to backend for server-side filtering
  const activeRules = rules.filter((r: any) =>
    r.value !== "any" && !(Array.isArray(r.value) && r.value.length === 1 && r.value[0] === "any")
  );
  if (activeRules.length > 0) {
    params.set("rules", JSON.stringify(activeRules));
  }

  const getOptionsFlowFeed = async () => {
    try {
      return await getAPI(locals, `/options-flow-feed?${params.toString()}`);
    } catch (e) {
      console.error("Failed to fetch options flow feed:", e);
      return { items: [], total: 0, page: 1, pageSize: 50, sort: { key: "time", order: "desc" }, stats: null };
    }
  };

  const getOptionsFlowFeedData = await getOptionsFlowFeed();

  return {
    getOptionsFlowFeed: getOptionsFlowFeedData,
    getOptionsWatchlist: getOptionsWatchlistData,
    getAllStrategies: getAllStrategiesData,
    wsURL: wsURL,
    wsToken: wsTokenData,
  };
};
