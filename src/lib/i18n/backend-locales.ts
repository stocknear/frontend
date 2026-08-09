import {
  baseLocale,
  canonicalizeLocale,
  supportedLocales,
  type Locale,
} from "$lib/i18n/locales";

export const backendLocaleCapabilities = {
  dashboardInfo: ["en"],
  stockBulkData: ["en", "de", "zh"],
  stockProfile: ["en"],
  analystInsight: ["en"],
  insiderSummary: ["en", "de"],
  transcriptSummary: ["en", "de"],
  portfolioSummary: ["en", "de"],
  financialSummary: ["en"],
  optionsInsight: ["en"],
} as const;

export type BackendLocaleCapability = keyof typeof backendLocaleCapabilities;
export type BackendLocale = "en" | "de" | "zh";

export type BackendLocaleResolution = {
  requestedLocale: Locale;
  effectiveLocale: BackendLocale;
  fallbackApplied: boolean;
};

const candidateByUiLocale: Record<Locale, BackendLocale> = {
  en: "en",
  de: "de",
  "zh-CN": "zh",
  "zh-TW": "en",
  es: "en",
  fr: "en",
  ja: "en",
  ko: "en",
  ru: "en",
  uk: "en",
};

const hasNativeBackendContent: Record<Locale, boolean> = {
  en: true,
  de: true,
  "zh-CN": true,
  "zh-TW": false,
  es: false,
  fr: false,
  ja: false,
  ko: false,
  ru: false,
  uk: false,
};

export function resolveBackendLocale(
  capability: BackendLocaleCapability,
  requestedLocale: Locale | string,
): BackendLocaleResolution {
  const canonicalRequestedLocale =
    canonicalizeLocale(requestedLocale) ?? baseLocale;
  const supported = backendLocaleCapabilities[capability] as readonly BackendLocale[];
  const candidate = candidateByUiLocale[canonicalRequestedLocale];
  const effectiveLocale = supported?.includes(candidate) ? candidate : "en";
  return {
    requestedLocale: canonicalRequestedLocale,
    effectiveLocale,
    fallbackApplied:
      effectiveLocale !== candidate ||
      !hasNativeBackendContent[canonicalRequestedLocale],
  };
}

export function parseRequestedLocale(value: unknown): Locale {
  return canonicalizeLocale(value) ?? baseLocale;
}

export function getNativeContentLocales(capability: BackendLocaleCapability): Locale[] {
  return supportedLocales?.filter(
    (locale) => !resolveBackendLocale(capability, locale).fallbackApplied,
  ) ?? [];
}
