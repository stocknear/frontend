import { browser } from "$app/environment";
import {
  cookieMaxAge,
  cookieName,
  getLocale,
  isLocale,
  locales,
  baseLocale,
  type Locale,
} from "$lib/paraglide/runtime.js";
import { hrefForLocale } from "$lib/i18n/navigation";
import { canonicalizeLocale, localeRegistry } from "$lib/i18n/locales";

export { locales, baseLocale, isLocale, type Locale };

export const languageNames: Record<Locale, string> = Object.fromEntries(
  locales.map((locale) => [locale, localeRegistry[locale].name]),
) as Record<Locale, string>;

export function rememberLanguage(locale: Locale): void {
  const canonicalLocale = canonicalizeLocale(locale);
  if (!canonicalLocale || !browser) return;
  document.cookie = `${cookieName}=${encodeURIComponent(canonicalLocale)}; Path=/; SameSite=Lax; Max-Age=${cookieMaxAge}${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function setLanguage(newLocale: Locale, currentHref?: string): void {
  const canonicalLocale = canonicalizeLocale(newLocale);
  if (!canonicalLocale || !browser) return;

  rememberLanguage(canonicalLocale);

  const currentLocation =
    currentHref ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const destination = hrefForLocale(currentLocation, canonicalLocale);
  window.location.assign(destination);
}

export function getLanguage(): Locale {
  return getLocale();
}
