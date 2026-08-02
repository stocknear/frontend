import { format as formatDateFns, formatDistanceToNow, type FormatOptions } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getLocale } from "$lib/paraglide/runtime.js";
import { getLocaleDefinition, type Locale } from "$lib/i18n/locales";

type Numeric = number | bigint;

const formatterCache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function localeOrCurrent(locale?: Locale): Locale {
  return locale ?? getLocale();
}

export function getIntlLocale(locale?: Locale): string {
  return getLocaleDefinition(localeOrCurrent(locale)).intlTag;
}

function numberFormatter(locale: Locale, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `number:${locale}:${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key) as Intl.NumberFormat | undefined;
  if (!formatter) {
    formatter = new Intl.NumberFormat(getLocaleDefinition(locale).intlTag, options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export function formatNumber(value: Numeric, options: Intl.NumberFormatOptions = {}, locale?: Locale): string {
  const resolved = localeOrCurrent(locale);
  return numberFormatter(resolved, options).format(value);
}

export function formatInteger(value: Numeric, locale?: Locale): string {
  return formatNumber(value, { maximumFractionDigits: 0 }, locale);
}

export function formatPercent(value: number, options: Intl.NumberFormatOptions = {}, locale?: Locale): string {
  return formatNumber(value, { style: "percent", maximumFractionDigits: 2, ...options }, locale);
}

export function formatUsd(value: Numeric, options: Intl.NumberFormatOptions = {}, locale?: Locale): string {
  return formatNumber(value, { style: "currency", currency: "USD", ...options }, locale);
}

export function formatCompact(value: Numeric, options: Intl.NumberFormatOptions = {}, locale?: Locale): string {
  return formatNumber(value, { notation: "compact", maximumFractionDigits: 1, ...options }, locale);
}

export function formatDate(
  value: Date | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale?: Locale,
): string {
  const resolved = localeOrCurrent(locale);
  const key = `date:${resolved}:${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key) as Intl.DateTimeFormat | undefined;
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(getLocaleDefinition(resolved).intlTag, options);
    formatterCache.set(key, formatter);
  }
  return formatter.format(value);
}

export function formatDatePattern(
  value: Date | number,
  pattern: string,
  options: Omit<FormatOptions, "locale"> = {},
  locale?: Locale,
): string {
  const resolved = localeOrCurrent(locale);
  return formatDateFns(value, pattern, {
    ...options,
    locale: getLocaleDefinition(resolved).dateFns,
  });
}

export function formatRelativeTime(value: Date | number, locale?: Locale): string {
  const resolved = localeOrCurrent(locale);
  return formatDistanceToNow(value, {
    addSuffix: true,
    locale: getLocaleDefinition(resolved).dateFns,
  });
}

export function formatMarketTime(
  value: Date | number,
  pattern: string,
  locale?: Locale,
): string {
  const resolved = localeOrCurrent(locale);
  return formatInTimeZone(value, "America/New_York", pattern, {
    locale: getLocaleDefinition(resolved).dateFns,
  });
}
