import { describe, expect, it } from "vitest";
import {
  canonicalizeLocale,
  getLocaleFromSlug,
  matchBrowserLocale,
  parseAcceptLanguage,
} from "$lib/i18n/locales";

describe("locale registry", () => {
  it.each([
    ["ZH_hant", "zh-TW"],
    ["zh", "zh-CN"],
    ["ES", "es"],
    [" fr ", "fr"],
  ] as const)("canonicalizes untrusted locale value %s", (value, locale) => {
    expect(canonicalizeLocale(value)).toBe(locale);
  });

  it("rejects unsupported locale values", () => {
    expect(canonicalizeLocale("pt-BR")).toBeNull();
    expect(canonicalizeLocale(null)).toBeNull();
  });

  it.each([
    ["de", "de"],
    ["zh-cn", "zh-CN"],
    ["zh-tw", "zh-TW"],
    ["es", "es"],
    ["fr", "fr"],
  ] as const)("maps the %s URL slug", (slug, locale) => {
    expect(getLocaleFromSlug(slug)).toBe(locale);
  });

  it.each([
    ["zh-TW", "zh-TW"],
    ["zh-HK", "zh-TW"],
    ["zh-Hant-HK", "zh-TW"],
    ["zh-CN", "zh-CN"],
    ["zh-SG", "zh-CN"],
    ["zh", "zh-CN"],
    ["es-MX", "es"],
    ["fr-CA", "fr"],
    ["de-AT", "de"],
  ] as const)("suggests %s as %s", (browserTag, locale) => {
    expect(matchBrowserLocale([browserTag])).toBe(locale);
  });

  it("respects browser preference order and ignores unsupported languages", () => {
    expect(matchBrowserLocale(["nl-NL", "fr-FR", "de-DE"])).toBe("fr");
    expect(matchBrowserLocale(["nl-NL"])).toBeNull();
  });

  it("orders Accept-Language tags by quality and excludes wildcards", () => {
    expect(parseAcceptLanguage("de-DE;q=0.7, es-MX, *;q=0.9, fr;q=0")).toEqual([
      "es-MX",
      "de-DE",
    ]);
  });
});
