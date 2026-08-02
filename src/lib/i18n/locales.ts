import { de, enUS, es, fr, zhCN, zhTW, type Locale as DateFnsLocale } from "date-fns/locale";
import {
  baseLocale,
  isLocale,
  locales,
  type Locale,
} from "$lib/paraglide/runtime.js";

export type LocaleDefinition = {
  locale: Locale;
  slug: string | null;
  name: string;
  intlTag: string;
  dateFns: DateFnsLocale;
  ogLocale: string;
  direction: "ltr" | "rtl";
  browserAliases: readonly string[];
};

export const localeRegistry = {
  en: {
    locale: "en",
    slug: null,
    name: "English",
    intlTag: "en-US",
    dateFns: enUS,
    ogLocale: "en_US",
    direction: "ltr",
    browserAliases: ["en"],
  },
  de: {
    locale: "de",
    slug: "de",
    name: "Deutsch",
    intlTag: "de-DE",
    dateFns: de,
    ogLocale: "de_DE",
    direction: "ltr",
    browserAliases: ["de"],
  },
  "zh-CN": {
    locale: "zh-CN",
    slug: "zh-cn",
    name: "简体中文",
    intlTag: "zh-CN",
    dateFns: zhCN,
    ogLocale: "zh_CN",
    direction: "ltr",
    browserAliases: ["zh-cn", "zh-sg", "zh-hans", "zh"],
  },
  "zh-TW": {
    locale: "zh-TW",
    slug: "zh-tw",
    name: "繁體中文",
    intlTag: "zh-TW",
    dateFns: zhTW,
    ogLocale: "zh_TW",
    direction: "ltr",
    browserAliases: ["zh-tw", "zh-hk", "zh-mo", "zh-hant"],
  },
  es: {
    locale: "es",
    slug: "es",
    name: "Español",
    intlTag: "es-ES",
    dateFns: es,
    ogLocale: "es_ES",
    direction: "ltr",
    browserAliases: ["es"],
  },
  fr: {
    locale: "fr",
    slug: "fr",
    name: "Français",
    intlTag: "fr-FR",
    dateFns: fr,
    ogLocale: "fr_FR",
    direction: "ltr",
    browserAliases: ["fr"],
  },
} as const satisfies Record<Locale, LocaleDefinition>;

export const supportedLocales = locales;
export { baseLocale, isLocale, type Locale };
export const LANGUAGE_SUGGESTION_DISMISS_COOKIE = "STOCKNEAR_LANGUAGE_SUGGESTION_DISMISSED";
export const LANGUAGE_SUGGESTION_DISMISS_SECONDS = 60 * 60 * 24 * 30;

const LEGACY_LOCALE_ALIASES: Readonly<Record<string, Locale>> = {
  zh: "zh-CN",
  "zh-hans": "zh-CN",
  "zh-hant": "zh-TW",
};

/**
 * Convert untrusted locale input (cookies, API payloads, and legacy values) to
 * one of the project's canonical locale identifiers.
 */
export function canonicalizeLocale(value: unknown): Locale | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase().replaceAll("_", "-");
  if (!normalized) return null;

  const legacyLocale = LEGACY_LOCALE_ALIASES[normalized];
  if (legacyLocale) return legacyLocale;

  return (
    supportedLocales.find((locale) => locale.toLowerCase() === normalized) ??
    null
  );
}

export function getLocaleDefinition(locale: Locale): LocaleDefinition {
  return localeRegistry[locale];
}

export function getLocaleFromSlug(slug: string): Locale | undefined {
  const normalized = slug.trim().toLowerCase().replaceAll("_", "-");
  return supportedLocales.find(
    (locale) => localeRegistry[locale].slug === normalized,
  );
}

export function matchBrowserLocale(languageTags: readonly string[]): Locale | null {
  for (const languageTag of languageTags) {
    const normalized = languageTag.trim().toLowerCase().replaceAll("_", "-");
    if (!normalized) continue;

    for (const locale of supportedLocales) {
      const specificAliases = localeRegistry[locale]?.browserAliases?.filter((alias) => alias.includes("-")) ?? [];
      if (specificAliases.some((alias) => normalized === alias || normalized.startsWith(`${alias}-`))) {
        return locale;
      }
    }

    for (const locale of supportedLocales) {
      const baseAliases = localeRegistry[locale]?.browserAliases?.filter((alias) => !alias.includes("-")) ?? [];
      if (baseAliases.some((alias) => normalized === alias || normalized.startsWith(`${alias}-`))) {
        return locale;
      }
    }
  }
  return null;
}

export function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [];

  return header
    .split(",")
    .map((entry, index) => {
      const [tag, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter
        ? Number.parseFloat(qualityParameter.trim().slice(2))
        : 1;
      return { tag, quality: Number.isFinite(quality) ? quality : 0, index };
    })
    ?.filter(({ tag, quality }) => Boolean(tag) && tag !== "*" && quality > 0)
    ?.sort((a, b) => b.quality - a.quality || a.index - b.index)
    ?.map(({ tag }) => tag) ?? [];
}
