import { error, redirect } from "@sveltejs/kit";
import { logUpstreamFailure } from "$lib/server/api";
import {
  canonicalizeSymbolInUrl,
  createSeoEligibility,
  hasEntityIdentity,
  hasFiniteMarketPrice,
  isUpstreamNotFound,
  resolveEntitySymbol,
} from "$lib/seo/eligibility";

/**
 * Shared machinery for the /stocks, /etf and /index ticker layouts.
 *
 * These three loaders were near-identical copies and drifted: the index one
 * swallowed the quote fetch its own 404 gate depended on, which 404'd live
 * indices. Every decision that is allowed to produce a 404, a 308 or a 503 now
 * lives here exactly once, so the entities can differ in data but never in
 * control flow.
 */

export const CACHE_DURATION = 30 * 1000;

/** Time-boxed LRU. One instance per entity, owned by its fetch strategy. */
export class TtlCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();

  constructor(private maxSize = 100) {}

  get(key: string): unknown {
    const item = this.cache?.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp >= CACHE_DURATION) {
      this.cache?.delete(key);
      return null;
    }
    return item.data;
  }

  set(key: string, data: unknown): void {
    if (this.cache?.size >= this.maxSize) {
      const oldestKey = this.cache?.keys()?.next()?.value;
      this.cache?.delete(oldestKey);
    }
    this.cache?.set(key, { data, timestamp: Date.now() });
  }
}

const REMOVE_PATTERN = new RegExp(
  `\\b(${[
    "Depositary",
    "Inc.",
    "Incorporated",
    "Holdings",
    "Corporations",
    "LLC",
    "Holdings plc American Depositary Shares",
    "Holding Corporation",
    "Oyj",
    "Company",
    "The",
    "plc",
  ].join("|")})\\b|,`,
  "gi",
);

/** Memoized issuer-suffix stripping, shared by all three entity types. */
export const cleanCompanyName = (() => {
  const cache = new Map<string, string>();
  return (input?: string): string => {
    if (!input) return "";
    if (cache?.has(input)) return cache.get(input) ?? "";
    const cleaned = input?.replace(REMOVE_PATTERN, "")?.trim() ?? "";
    cache?.set(input, cleaned);
    return cleaned;
  };
})();

interface EntityPageConfig {
  /** Short key used in logs, e.g. "stock". */
  entity: string;
  /** Human label used in error messages, e.g. "Stock". */
  label: string;
  /** Payload key holding the identity record. */
  identityKey: string;
  /** Fields on that record that count as proof of identity. */
  identityFields: readonly string[];
  /** Payload key holding the quote, used as the last-resort fallback. */
  quoteKey?: string;
  availableLocales: readonly string[];
  /** Returns the endpoint→data map. Owns its own caching and proxy rules. */
  fetchPayload: (locals: any, tickerID: string) => Promise<Record<string, any>>;
  /** Optional side data (watchlist, followed analysts). Must never reject. */
  extras?: (locals: any, tickerID: string) => Promise<Record<string, any>>;
  /** Maps the raw payload into the route's data shape. */
  shape: (
    payload: Record<string, any>,
    context: { tickerID: string; extras: Record<string, any> },
  ) => Record<string, any>;
}

export function createEntityPageLoader(config: EntityPageConfig) {
  const {
    entity,
    label,
    identityKey,
    identityFields,
    quoteKey = "/stock-quote",
    availableLocales,
    fetchPayload,
    extras,
    shape,
  } = config;

  const unavailable = `${label} data is temporarily unavailable`;

  return async ({ params, locals, url }: any) => {
    const requestedTicker = params?.tickerID;
    const resolution = resolveEntitySymbol(requestedTicker);
    if (!resolution.valid) error(404, `${label} not found`);

    const tickerID = resolution.canonicalSymbol;
    // Must stay outside the try: redirect() signals by throwing.
    const canonicalRedirect = canonicalizeSymbolInUrl(
      url,
      requestedTicker,
      tickerID,
    );
    if (canonicalRedirect) redirect(308, canonicalRedirect);

    let payload: Record<string, any>;
    let extraData: Record<string, any>;
    try {
      [payload, extraData] = await Promise.all([
        fetchPayload(locals, tickerID),
        extras ? extras(locals, tickerID) : Promise.resolve({}),
      ]);
    } catch (cause) {
      // A real upstream 404 is the ONLY thing allowed to become a 404 here.
      if (isUpstreamNotFound(cause)) error(404, `${label} not found`);
      logUpstreamFailure(entity, tickerID, cause);
      error(503, unavailable);
    }

    const hasIdentity = hasEntityIdentity(payload?.[identityKey], identityFields);
    const hasPartialQuote = hasFiniteMarketPrice(payload?.[quoteKey]);
    // An empty payload does not prove absence — the backend answers 200 with
    // everything empty when an internal fetch fails. Only the backend can prove
    // absence, and it does so above. Everything else is transient.
    if (!hasIdentity && !hasPartialQuote) {
      logUpstreamFailure(entity, tickerID, `empty payload for ${identityKey}`);
      error(503, unavailable);
    }

    return {
      ...shape(payload ?? {}, { tickerID, extras: extraData ?? {} }),
      getParams: tickerID,
      seoEligibility: createSeoEligibility({
        canonicalPath: url?.pathname,
        availableLocales,
        indexable: hasIdentity,
        reason: hasIdentity ? "eligible" : "insufficient-data",
      }),
    };
  };
}
