import {
  deLocalizeHref,
  localizeHref,
  type Locale,
} from "$lib/paraglide/runtime.js";

const NON_LOCALIZED_PATHS = ["/api", "/ws", "/_app"];
const NON_LOCALIZED_PREFIXES = ["/favicon", "/robots.txt"];

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
