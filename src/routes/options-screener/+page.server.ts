import { getAPI } from "$lib/server/api";
import { loginAction, registerAction, oauth2Action } from "$lib/server/authActions";
import { sanitizeDisplayColumns } from "$lib/server/optionsScreenerColumns";

const ROWS_COOKIE_NAME = "options_screener_rows";
const ALLOWED_PAGE_SIZES = new Set(["20", "50", "100"]);
const DEFAULT_PAGE_SIZE = "20";

export const load = async ({ locals, cookies }) => {
  const { pb, user } = locals;
  const isPro = user?.tier === "Pro";

  const getAllStrategies = async () => {
    let output = [];

    if (!isPro) {
      return [];
    }

    try {
      output = await pb.collection("optionsScreener").getFullList({
        filter: `user="${user?.id}"`,
      });
      output?.sort((a, b) => new Date(b?.updated) - new Date(a?.updated));
    } catch(e) {
      output = [];
    }

    return output;
  };

  const strategyList = await getAllStrategies();
  const strategy = strategyList?.at(0);
  // Normalise exactly like the client proxy (api/options-screener-feed) so the
  // first paint and the first client fetch can never disagree for e.g. "Plus".
  const subscriber = isPro ? "Pro" : "Free";

  const savedRules = strategy?.rules ?? [];
  // Same key order as buildActiveRules() in +page.svelte so the query string
  // below has a chance of matching what the client would build.
  const rules = savedRules
    .map((r: any) => ({
      name: r?.name,
      condition: r?.condition ?? "",
      value: r?.value,
    }))
    .filter((r: any) => {
      const v = r.value;
      if (!r.name) return false;
      if (v == null || v === "any") return false;
      if (Array.isArray(v) && (v.length === 0 || v.includes("any"))) return false;
      return true;
    });

  // The cookie only remembers the page size; it must not decide *whether* we
  // pre-fetch, otherwise a first-time visitor gets an empty page until they
  // reload (which is when the cookie finally exists).
  const savedRows = cookies.get(ROWS_COOKIE_NAME);
  const pageSize =
    savedRows && ALLOWED_PAGE_SIZES.has(savedRows) ? savedRows : DEFAULT_PAGE_SIZE;

  // Key order must mirror buildFeedParams() in +page.svelte: the client compares
  // this query string verbatim to decide whether it still needs to fetch. Parity
  // is best effort — the server cannot evaluate the client's allRules defaults,
  // so a mismatch is possible. It fails safe: the client refetches once, and it
  // can never wrongly conclude it already has data it does not.
  const params = new URLSearchParams({
    page: "1",
    pageSize,
    sortKey: "totalPrem",
    sortOrder: "desc",
    tab: "general",
  });
  if (isPro && rules.length > 0) {
    params.set("rules", JSON.stringify(rules));
  }
  // Sanitised through the same helper the proxy uses.
  const displayColumns = sanitizeDisplayColumns(
    savedRules.map((r: any) => r?.name),
  ).join(",");
  if (displayColumns) {
    params.set("displayColumns", displayColumns);
  }

  const feedQuery = params.toString();
  const requestParams = new URLSearchParams(feedQuery);
  requestParams.set("subscriber", subscriber);

  let initialFeed = null;
  try {
    initialFeed = await getAPI(locals, `/options-screener-feed?${requestParams}`);
  } catch {
    initialFeed = null;
  }

  return {
    getScreenerFeed: initialFeed,
    // The exact query this payload came from, so the client dedupes against what
    // was really requested instead of a locally reconstructed guess.
    getScreenerFeedQuery: initialFeed ? feedQuery : null,
    getAllStrategies: strategyList,
  };
};

export const actions = {
  login: loginAction,
  register: registerAction,
  oauth2: oauth2Action,
};
