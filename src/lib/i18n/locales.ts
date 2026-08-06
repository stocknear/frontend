import { de, enUS, es, fr, ja, ko, ru, uk, zhCN, zhTW, type Locale as DateFnsLocale } from "date-fns/locale";
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
  countryCodes: readonly string[];
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
    countryCodes: [],
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
    countryCodes: ["DE", "AT", "LI"],
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
    countryCodes: ["CN", "SG"],
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
    countryCodes: ["TW", "HK", "MO"],
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
    countryCodes: [
      "ES",
      "AR",
      "BO",
      "CL",
      "CO",
      "CR",
      "CU",
      "DO",
      "EC",
      "SV",
      "GT",
      "HN",
      "MX",
      "NI",
      "PA",
      "PY",
      "PE",
      "PR",
      "UY",
      "VE",
    ],
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
    countryCodes: ["FR", "MC"],
  },
  ja: {
    locale: "ja",
    slug: "ja",
    name: "日本語",
    intlTag: "ja-JP",
    dateFns: ja,
    ogLocale: "ja_JP",
    direction: "ltr",
    browserAliases: ["ja"],
    countryCodes: ["JP"],
  },
  ko: {
    locale: "ko",
    slug: "ko",
    name: "한국어",
    intlTag: "ko-KR",
    dateFns: ko,
    ogLocale: "ko_KR",
    direction: "ltr",
    browserAliases: ["ko"],
    countryCodes: ["KR"],
  },
  ru: {
    locale: "ru",
    slug: "ru",
    name: "Русский",
    intlTag: "ru-RU",
    dateFns: ru,
    ogLocale: "ru_RU",
    direction: "ltr",
    browserAliases: ["ru"],
    // UA is deliberately excluded — it belongs to `uk`, never `ru`.
    countryCodes: ["RU", "BY", "KZ", "KG", "AM"],
  },
  uk: {
    locale: "uk",
    slug: "uk",
    name: "Українська",
    intlTag: "uk-UA",
    dateFns: uk,
    ogLocale: "uk_UA",
    direction: "ltr",
    browserAliases: ["uk"],
    countryCodes: ["UA"],
  },
} as const satisfies Record<Locale, LocaleDefinition>;

export const supportedLocales = locales;
export { baseLocale, isLocale, type Locale };
export const LANGUAGE_SUGGESTION_DISMISS_COOKIE = "STOCKNEAR_LANGUAGE_SUGGESTION_DISMISSED";
export const LANGUAGE_SUGGESTION_DISMISS_SECONDS = 60 * 60 * 24 * 30;

const LEGACY_LOCALE_ALIASES: Readonly<Record<string, Locale>> = {
  zh: "zh-CN",
  "zh-sg": "zh-CN",
  "zh-hans": "zh-CN",
  "zh-hk": "zh-TW",
  "zh-mo": "zh-TW",
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
    supportedLocales?.find((locale) => locale.toLowerCase() === normalized) ??
    null
  );
}

export function getLocaleDefinition(locale: Locale): LocaleDefinition {
  // Paraglide's extractLocaleFromUrl() hands back the URL's own casing, so a
  // request for /zh-cn/... yields "zh-cn" while this registry is keyed on the
  // canonical "zh-CN". The raw lookup returned undefined and every caller then
  // read .intlTag off it — a 500 on every page in both Chinese locales.
  return (
    localeRegistry[locale] ??
    localeRegistry[canonicalizeLocale(locale) ?? baseLocale]
  );
}

/**
 * Cloudflare Turnstile takes a lowercase BCP-47 tag, and every locale we ship lowercases
 * to one it supports (`zh-CN` -> `zh-cn`, `pt-BR` -> `pt-br`).
 *
 * Left unset the widget runs on `auto`, which follows the *browser* language — so a
 * visitor reading the site in Japanese could still get an English captcha. Passing the
 * site locale keeps the one third-party box on the page consistent with everything
 * around it.
 *
 * svelte-turnstile types this prop as `SupportedLanguages | "auto" | string`, so an
 * unsupported code is NOT a compile error. `tests/unit/i18n/turnstile-language.test.ts`
 * is what actually holds this contract — a locale Turnstile cannot render must never
 * reach the registry.
 */
export function getTurnstileLanguage(locale: Locale): string {
  return getLocaleDefinition(locale).locale.toLowerCase();
}

export function getLocaleFromSlug(slug: string): Locale | undefined {
  const normalized = slug.trim().toLowerCase().replaceAll("_", "-");
  return supportedLocales?.find(
    (locale) => localeRegistry[locale].slug === normalized,
  );
}

export function matchCountryLocale(
  countryCode: string | null | undefined,
): Locale | null {
  const normalized = countryCode?.trim()?.toUpperCase();
  if (!normalized) return null;

  return (
    supportedLocales?.find((locale) =>
      localeRegistry[locale].countryCodes?.includes(normalized),
    ) ?? null
  );
}

export function matchBrowserLocale(languageTags: readonly string[]): Locale | null {
  for (const languageTag of languageTags) {
    const normalized = languageTag.trim().toLowerCase().replaceAll("_", "-");
    if (!normalized) continue;

    for (const locale of supportedLocales) {
      const specificAliases = localeRegistry[locale]?.browserAliases?.filter((alias) => alias.includes("-")) ?? [];
      if (specificAliases?.some((alias) => normalized === alias || normalized.startsWith(`${alias}-`))) {
        return locale;
      }
    }

    for (const locale of supportedLocales) {
      const baseAliases = localeRegistry[locale]?.browserAliases?.filter((alias) => !alias.includes("-")) ?? [];
      if (baseAliases?.some((alias) => normalized === alias || normalized.startsWith(`${alias}-`))) {
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
    ?.map((entry, index) => {
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
