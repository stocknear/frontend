import {
  baseLocale,
  canonicalizeLocale,
  type Locale,
} from "$lib/i18n/locales";

export const seoEligibilityReasons = [
  "eligible",
  "unknown-entity",
  "unsupported-page",
  "insufficient-data",
  "stale-data",
  "untranslated-content",
  "private",
] as const;

export type SeoEligibilityReason = (typeof seoEligibilityReasons)[number];

export type SeoEligibility = {
  status: 200 | 404;
  indexable: boolean;
  reason: SeoEligibilityReason;
  canonicalPath: string;
  availableLocales: Locale[];
  lastModified: string | null;
  source: string | null;
  dataFreshness: string | null;
};

type CreateSeoEligibilityInput = Partial<
  Pick<
    SeoEligibility,
    "status" | "indexable" | "reason" | "lastModified" | "source" | "dataFreshness"
  >
> & {
  canonicalPath: string;
  availableLocales?: readonly (Locale | string)[];
};

export type EntitySymbolResolution =
  | { valid: true; canonicalSymbol: string }
  | { valid: false; canonicalSymbol: null };

const ENTITY_SYMBOL_PATTERN = /^\^?[A-Z0-9][A-Z0-9.\-]{0,19}$/;

export function createSeoEligibility({
  status = 200,
  indexable = true,
  reason = "eligible",
  canonicalPath,
  availableLocales = [baseLocale],
  lastModified = null,
  source = null,
  dataFreshness = null,
}: CreateSeoEligibilityInput): SeoEligibility {
  const normalizedLocales = [
    ...new Set(
      availableLocales
        ?.map((locale) => canonicalizeLocale(locale))
        ?.filter((locale): locale is Locale => locale !== null) ?? [],
    ),
  ];

  return {
    status,
    indexable: status === 200 && indexable,
    reason,
    canonicalPath: normalizeCanonicalPath(canonicalPath),
    availableLocales: normalizedLocales,
    lastModified,
    source,
    dataFreshness,
  };
}

export function resolveEntitySymbol(value: unknown): EntitySymbolResolution {
  if (typeof value !== "string") {
    return { valid: false, canonicalSymbol: null };
  }

  const canonicalSymbol = value.trim().toUpperCase();
  if (!ENTITY_SYMBOL_PATTERN.test(canonicalSymbol)) {
    return { valid: false, canonicalSymbol: null };
  }

  return { valid: true, canonicalSymbol };
}

export function canonicalizeSymbolInUrl(
  url: URL,
  requestedSymbol: string,
  canonicalSymbol: string,
): string | null {
  if (requestedSymbol === canonicalSymbol) return null;

  const segments = url.pathname.split("/");
  const symbolIndex = segments.findIndex((segment) => {
    try {
      return decodeURIComponent(segment) === requestedSymbol;
    } catch {
      return false;
    }
  });

  if (symbolIndex === -1) return null;

  segments[symbolIndex] = encodeURIComponent(canonicalSymbol);
  return `${segments.join("/")}${url.search}`;
}

export function hasEntityIdentity(
  value: unknown,
  fields: readonly string[],
): boolean {
  const record = Array.isArray(value) ? value?.at(0) : value;
  if (!record || typeof record !== "object") return false;

  return fields?.some((field) => {
    const candidate = (record as Record<string, unknown>)[field];
    return typeof candidate === "string" && candidate.trim().length > 0;
  });
}

export function hasFiniteMarketPrice(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const price = (value as Record<string, unknown>).price;
  return typeof price === "number" && Number.isFinite(price);
}

export function hasMeaningfulSeoData(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value?.some((item) => hasMeaningfulSeoData(item)) ?? false;
  }
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (!value || typeof value !== "object") return false;

  return Object.values(value)?.some((item) => hasMeaningfulSeoData(item)) ?? false;
}

export function createDataPageSeoEligibility(
  canonicalPath: string,
  data: unknown,
  availableLocales: readonly (Locale | string)[] = [baseLocale],
): SeoEligibility {
  const indexable = hasMeaningfulSeoData(data);
  return createSeoEligibility({
    canonicalPath,
    availableLocales,
    indexable,
    reason: indexable ? "eligible" : "insufficient-data",
  });
}

export function isUpstreamNotFound(cause: unknown): boolean {
  if (!cause || typeof cause !== "object") return false;

  if (
    "status" in cause &&
    typeof cause.status === "number" &&
    cause.status === 404
  ) {
    return true;
  }

  return cause instanceof Error && /failed:\s*404\s*$/i.test(cause.message);
}

function normalizeCanonicalPath(value: string): string {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path.split("#")?.at(0) || "/";
}
