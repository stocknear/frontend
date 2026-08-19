import { getAPI, logUpstreamFailure, postAPI } from "$lib/server/api";
import {
  DEFAULT_INDEX,
  canUseIndex,
  isEntitled,
  validMetric,
  validPeriod,
  type HeatmapIndex,
} from "$lib/heatmap";

export const load = async ({ locals, url }) => {
  // The catalog has to land first: it is what says whether the requested index exists
  // and which tier it needs. Both calls are redis-backed, so the wait is milliseconds.
  const indexes: HeatmapIndex[] = await getAPI(locals, "/heatmap-indexes")
    .then((payload) =>
      Array.isArray(payload?.indexes) ? payload.indexes : [],
    )
    .catch(() => []);

  const entitled = isEntitled(locals?.user?.tier);
  const requested = (url.searchParams.get("i") ?? DEFAULT_INDEX)?.toUpperCase();
  const match = indexes?.find((index) => index?.symbol === requested);

  // Fall back silently instead of redirecting. A redirect would confirm to an anonymous
  // crawler that the Pro symbol exists, and would keep bouncing anyone who bookmarked
  // the URL while subscribed; the client canonicalises the address on mount instead.
  const etf = canUseIndex(match, entitled) ? requested : DEFAULT_INDEX;
  const params = validPeriod(url.searchParams.get("t"));
  const metric = validMetric(url.searchParams.get("d"));

  let getHeatMap = {};
  try {
    getHeatMap = await postAPI(locals, "/heatmap", { params, etf });
  } catch (error) {
    // Without this the 10s postAPI timeout takes the whole route down instead of
    // landing in the page's own "no data" branch.
    logUpstreamFailure("heatmap", etf, error);
  }

  return { getHeatMap, indexes, entitled, etf, params, metric };
};
