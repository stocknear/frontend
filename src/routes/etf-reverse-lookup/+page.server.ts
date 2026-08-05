import { logUpstreamFailure, postAPI } from "$lib/server/api";

// Same shape the /api/etf-holdings proxy enforces. The symbol is interpolated
// into a file path upstream, so it is validated before any call is made.
const SYMBOL_PATTERN = /^\^?[A-Z0-9][A-Z0-9.\-]{0,19}$/;

export const load = async ({ locals, url }) => {
  const requested = url?.searchParams?.get("symbol")?.trim()?.toUpperCase() ?? "";

  // An unusable symbol is treated as no symbol at all: the landing state, with
  // nothing echoed back into the page.
  if (!requested || !SYMBOL_PATTERN?.test(requested)) {
    return { symbol: "", getExposure: [], unavailable: false };
  }

  try {
    const payload = await postAPI(locals, "/etf-holdings", {
      ticker: requested,
      assetType: "stocks",
    });

    return {
      symbol: requested,
      getExposure: Array.isArray(payload) ? payload : [],
      unavailable: false,
    };
  } catch (cause) {
    // postAPI throws on any non-2xx. The tool page itself is fine, so this is
    // never a 404 or 503 — but an empty list here would claim no ETF holds the
    // stock, which is a different and wrong statement.
    logUpstreamFailure("etf-reverse-lookup", requested, cause);
    return { symbol: requested, getExposure: [], unavailable: true };
  }
};
