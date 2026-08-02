import {
  baseLocale,
  canonicalizeLocale,
  getLocaleDefinition,
  matchCountryLocale,
  type Locale,
} from "$lib/i18n/locales";

export type LocaleSource = "url" | "cookie" | "country" | "fallback";

export type LocaleRedirect = {
  location: string;
  status: 307 | 308;
  variesByVisitor: boolean;
};

export type LocaleRoutingDecision = {
  locale: Locale;
  source: LocaleSource;
  excluded: boolean;
  persistLocale: boolean;
  redirect: LocaleRedirect | null;
};

type LocalePath = {
  locale: Locale;
  unlocalizedPathname: string;
  canonicalPathname: string;
  isCanonical: boolean;
};

const NON_LOCALIZED_SEGMENTS = [
  "/api",
  "/ws",
  "/_app",
  "/oauth",
  "/i18n",
  "/audio",
  "/fonts",
  "/img",
  "/video",
  "/sitemaps",
  "/.well-known",
] as const;

const NON_LOCALIZED_FILES = new Set([
  "/service-worker.js",
  "/manifest.json",
  "/robots.txt",
  "/ads.txt",
  "/llms.txt",
  "/favicon.ico",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/maskable-icon-512x512.png",
  "/pwa-64x64.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/229201bdbab4411db0055729c2add007.txt",
]);

const STATIC_FILE_EXTENSION =
  /\.(?:avif|css|gif|ico|jpe?g|js|json|map|mp3|mp4|png|svg|txt|webmanifest|webp|woff2?|xml)$/i;

function joinLocalePath(locale: Locale, pathname: string): string {
  const slug = getLocaleDefinition(locale).slug;
  if (!slug) return pathname;

  const suffix = pathname.replace(/^[\\/]+/, "");
  return suffix ? `/${slug}/${suffix}` : `/${slug}/`;
}

function getLocalePath(pathname: string): LocalePath | null {
  const firstSegment = pathname.split("/")?.[1];
  if (!firstSegment) return null;

  const locale = canonicalizeLocale(firstSegment);
  if (!locale) return null;

  const suffix = pathname.slice(firstSegment.length + 1).replace(/^[\\/]+/, "");
  const unlocalizedPathname = suffix ? `/${suffix}` : "/";
  const canonicalPathname = joinLocalePath(locale, unlocalizedPathname);
  const canonicalSlug = getLocaleDefinition(locale).slug;

  return {
    locale,
    unlocalizedPathname,
    canonicalPathname,
    isCanonical: canonicalSlug !== null && firstSegment === canonicalSlug,
  };
}

export function isLocaleRoutingExcluded(pathname: string): boolean {
  // SvelteKit's route data endpoint belongs to the localized page even though
  // its generated pathname has a JSON extension.
  if (pathname === "/__data.json" || pathname.endsWith("/__data.json")) {
    return false;
  }
  if (NON_LOCALIZED_FILES.has(pathname)) return true;
  if (/^\/favicon(?:[./-]|$)/i.test(pathname)) return true;
  if (/^\/sitemap(?:-[^/]+)?\.xml$/i.test(pathname)) return true;
  if (STATIC_FILE_EXTENSION.test(pathname)) return true;

  return (
    NON_LOCALIZED_SEGMENTS?.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ) ?? false
  );
}

function canonicalRedirect(location: string): LocaleRedirect {
  return { location, status: 308, variesByVisitor: false };
}

function preferenceRedirect(location: string): LocaleRedirect {
  return { location, status: 307, variesByVisitor: true };
}

export function resolveLocaleRequest({
  url,
  cookieLocale,
  countryCode,
  method = "GET",
}: {
  url: URL;
  cookieLocale?: string | null;
  countryCode?: string | null;
  method?: string;
}): LocaleRoutingDecision {
  const localePath = getLocalePath(url.pathname);
  const unlocalizedPathname = localePath?.unlocalizedPathname ?? url.pathname;
  const excluded = isLocaleRoutingExcluded(unlocalizedPathname);
  const savedLocale = canonicalizeLocale(cookieLocale);

  if (excluded) {
    return {
      locale: savedLocale ?? baseLocale,
      source: savedLocale ? "cookie" : "fallback",
      excluded: true,
      persistLocale: false,
      redirect: localePath
        ? canonicalRedirect(`${unlocalizedPathname}${url.search}`)
        : null,
    };
  }

  if (localePath) {
    return {
      locale: localePath.locale,
      source: "url",
      excluded: false,
      persistLocale: cookieLocale !== localePath.locale,
      redirect: localePath.isCanonical
        ? null
        : canonicalRedirect(`${localePath.canonicalPathname}${url.search}`),
    };
  }

  // Geo and preference redirects are navigation policy, not endpoint policy.
  // Never redirect a bare webhook/form/API-like unsafe request based on
  // visitor metadata, even though 307 would technically preserve its body.
  if (method !== "GET" && method !== "HEAD") {
    return {
      locale: baseLocale,
      source: "fallback",
      excluded: false,
      persistLocale: false,
      redirect: null,
    };
  }

  if (savedLocale) {
    return {
      locale: savedLocale,
      source: "cookie",
      excluded: false,
      persistLocale: cookieLocale !== savedLocale,
      redirect:
        savedLocale === baseLocale
          ? null
          : preferenceRedirect(
              `${joinLocalePath(savedLocale, url.pathname)}${url.search}`,
            ),
    };
  }

  const countryLocale = matchCountryLocale(countryCode);
  const locale = countryLocale ?? baseLocale;

  return {
    locale,
    source: countryLocale ? "country" : "fallback",
    excluded: false,
    persistLocale: true,
    redirect:
      locale === baseLocale
        ? null
        : preferenceRedirect(
            `${joinLocalePath(locale, url.pathname)}${url.search}`,
          ),
  };
}

/**
 * Localize only bare, same-origin redirect targets. A target that already
 * names a locale is an explicit choice and must not be rewritten to the
 * request locale (OAuth callbacks are the important case).
 */
export function localizeInternalRedirect(
  location: string,
  locale: Locale,
): string {
  const candidate = location?.trim();
  if (!candidate?.startsWith("/") || /^[\\/]{2}/.test(candidate)) {
    return location;
  }

  try {
    const target = new URL(candidate, "https://stocknear.local");
    if (target.origin !== "https://stocknear.local") return location;

    const localePath = getLocalePath(target.pathname);
    const unlocalizedPathname =
      localePath?.unlocalizedPathname ?? target.pathname;

    if (isLocaleRoutingExcluded(unlocalizedPathname)) {
      return localePath
        ? `${unlocalizedPathname}${target.search}${target.hash}`
        : location;
    }

    if (localePath) {
      return localePath.isCanonical
        ? location
        : `${localePath.canonicalPathname}${target.search}${target.hash}`;
    }

    if (locale === baseLocale) return location;
    return `${joinLocalePath(locale, target.pathname)}${target.search}${target.hash}`;
  } catch {
    return location;
  }
}
