import {
  baseLocale,
  deLocalizeHref,
  localizeHref,
  type Locale,
} from "$lib/paraglide/runtime.js";

const NON_LOCALIZED_PATHS = [
  "/api",
  "/ws",
  "/_app",
  "/oauth",
  "/i18n",
  "/service-worker.js",
  "/manifest.json",
  "/robots.txt",
  "/ads.txt",
  "/llms.txt",
];
const NON_LOCALIZED_PREFIXES = [
  "/favicon",
  "/apple-touch-icon",
  "/pwa-",
  "/audio/",
  "/fonts/",
  "/img/",
  "/video/",
];

function hasNonLocalizedPath(pathname: string): boolean {
  return (
    NON_LOCALIZED_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ) ||
    NON_LOCALIZED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function isLocalizableHref(href: string): boolean {
  const candidate = href?.trim();
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("#") ||
    /^[\\/]{2}/.test(candidate) ||
    /^(?:mailto|tel|javascript|data|blob):/i.test(candidate)
  ) {
    return false;
  }

  try {
    const url = new URL(candidate, "https://stocknear.local");
    if (url.origin !== "https://stocknear.local") return false;
    if (/^\/sitemap(?:-[^/]+)?\.xml$/.test(url.pathname)) return false;
    return !hasNonLocalizedPath(url.pathname);
  } catch {
    return false;
  }
}

export function localizedHref(href: string, locale?: Locale): string {
  if (!isLocalizableHref(href)) return href;
  const delocalized = deLocalizeHref(href);
  return localizeHref(delocalized, locale ? { locale } : undefined);
}

export function hrefForLocale(href: string, locale: Locale): string {
  if (!isLocalizableHref(href)) return href;
  return localizeHref(deLocalizeHref(href), { locale });
}

/**
 * Build a language-selector URL that still records an intentional English
 * choice when JavaScript is unavailable. The server strips the temporary
 * `/en` marker to the canonical unprefixed English URL after saving the cookie.
 */
export function hrefForLanguageSwitch(href: string, locale: Locale): string {
  const localized = hrefForLocale(href, locale);
  if (locale !== baseLocale || !isLocalizableHref(localized)) return localized;

  const url = new URL(localized, "https://stocknear.local");
  const pathname = url.pathname === "/" ? "/en/" : `/en${url.pathname}`;
  return `${pathname}${url.search}${url.hash}`;
}
