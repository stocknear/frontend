import type { RequestHandler } from "./$types";
import { getAPI, postAPI } from "$lib/server/api";
import {
  DEFAULT_INDEX,
  canUseIndex,
  isEntitled,
  validPeriod,
  type HeatmapIndex,
} from "$lib/heatmap";

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
  const etf = String(data?.etf || DEFAULT_INDEX)?.toUpperCase();

  if (!/^[A-Z]{1,6}$/.test(etf)) {
    return new Response(null, { status: 400 });
  }

  // This is where entitlement is actually enforced -- the FastAPI layer only ever sees
  // the site's API key, never the session. The tier lives on the catalog rather than in
  // a second copy of the free list here.
  const indexes: HeatmapIndex[] = await getAPI(locals, "/heatmap-indexes")
    .then((payload) => payload?.indexes ?? [])
    .catch(() => []);

  // An unreachable catalog is not the same as an unentitled user -- answering 403 there
  // would lock every visitor out of SPY over a transient upstream blip.
  if (!indexes?.length) {
    return new Response(null, { status: 503 });
  }

  const match = indexes?.find((index) => index?.symbol === etf);
  if (!canUseIndex(match, isEntitled(locals?.user?.tier))) {
    return new Response(null, { status: 403 });
  }

  try {
    const output = await postAPI(locals, "/heatmap", {
      params: validPeriod(data?.params),
      etf,
    });
    return new Response(JSON.stringify(output), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
};
