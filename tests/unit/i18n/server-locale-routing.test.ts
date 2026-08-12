import { describe, expect, it } from "vitest";
import { matchCountryLocale } from "$lib/i18n/locales";
import {
  localizeInternalRedirect,
  resolveLocaleRequest,
} from "$lib/server/locale-routing";

function route(
  path: string,
  cookieLocale?: string | null,
  countryCode?: string | null,
  method?: string,
) {
  return resolveLocaleRequest({
    url: new URL(path, "https://stocknear.com"),
    cookieLocale,
    countryCode,
    method,
  });
}

describe("server locale routing", () => {
  it("gives an explicit canonical URL priority and synchronizes the cookie", () => {
    expect(route("/de/stocks/AAPL?tab=profile", "fr", "ES")).toMatchObject({
      locale: "de",
      source: "url",
      persistLocale: true,
      redirect: null,
    });
  });

  it("canonicalizes URL aliases with a deterministic 308", () => {
    expect(route("/ZH_hant/stocks/AAPL?tab=profile", "es")).toMatchObject({
      locale: "zh-TW",
      source: "url",
      persistLocale: true,
      redirect: {
        status: 308,
        location: "/zh-tw/stocks/AAPL?tab=profile",
        variesByVisitor: false,
      },
    });
  });

  it("treats /en as explicit English before removing its prefix", () => {
    expect(route("/en/stocks/AAPL?tab=profile", "de")).toMatchObject({
      locale: "en",
      source: "url",
      persistLocale: true,
      redirect: {
        status: 308,
        location: "/stocks/AAPL?tab=profile",
      },
    });
  });

  it("redirects a bare URL using a durable saved preference", () => {
    expect(route("/stocks/AAPL?tab=profile", "fr", "DE")).toMatchObject({
      locale: "fr",
      source: "cookie",
      persistLocale: false,
      redirect: {
        status: 307,
        location: "/fr/stocks/AAPL?tab=profile",
        variesByVisitor: true,
      },
    });
  });

  it.each([
    ["DE", "de", "/de/stocks/AAPL"],
    ["AT", "de", "/de/stocks/AAPL"],
    ["ES", "es", "/es/stocks/AAPL"],
    ["MX", "es", "/es/stocks/AAPL"],
    ["AR", "es", "/es/stocks/AAPL"],
    ["FR", "fr", "/fr/stocks/AAPL"],
    ["MC", "fr", "/fr/stocks/AAPL"],
    ["CN", "zh-CN", "/zh-cn/stocks/AAPL"],
    ["SG", "zh-CN", "/zh-cn/stocks/AAPL"],
    ["TW", "zh-TW", "/zh-tw/stocks/AAPL"],
    ["HK", "zh-TW", "/zh-tw/stocks/AAPL"],
    ["MO", "zh-TW", "/zh-tw/stocks/AAPL"],
  ] as const)("maps first-visit country %s to %s", (country, locale, location) => {
    expect(matchCountryLocale(country)).toBe(locale);
    expect(route("/stocks/AAPL", null, country)).toMatchObject({
      locale,
      source: "country",
      persistLocale: true,
      redirect: { status: 307, location, variesByVisitor: true },
    });
  });

  it("persists English when neither preference nor country mapping exists", () => {
    expect(route("/stocks/AAPL", null, "NL")).toEqual({
      locale: "en",
      source: "fallback",
      excluded: false,
      persistLocale: true,
      redirect: null,
    });
  });

  it("replaces an invalid preference using country detection", () => {
    expect(route("/stocks/AAPL", "pt-BR", "FR")).toMatchObject({
      locale: "fr",
      source: "country",
      persistLocale: true,
      redirect: { location: "/fr/stocks/AAPL" },
    });
  });

  it("never geo-redirects an unsafe bare endpoint request", () => {
    expect(route("/payment", null, "FR", "POST")).toEqual({
      locale: "en",
      source: "fallback",
      excluded: false,
      persistLocale: false,
      redirect: null,
    });
  });

  it.each(["/api/quote", "/ws", "/oauth?code=x", "/img/profile.jpg"])(
    "does not geo-localize excluded route %s",
    (path) => {
      expect(route(path, null, "FR")).toMatchObject({
        locale: "en",
        source: "fallback",
        excluded: true,
        persistLocale: false,
        redirect: null,
      });
    },
  );

  it("uses the saved locale for the fixed OAuth callback", () => {
    expect(route("/oauth?code=x", "fr", "DE")).toMatchObject({
      locale: "fr",
      source: "cookie",
      excluded: true,
      redirect: null,
    });
  });

  it("uses the saved locale without prefixing the fixed consent endpoint", () => {
    expect(
      route("/oauth/authorize?request=opaque_request_123456", "fr", "DE"),
    ).toMatchObject({
      locale: "fr",
      source: "cookie",
      excluded: true,
      redirect: null,
    });
  });

  it("keeps SvelteKit data requests attached to their localized page", () => {
    expect(route("/fr/stocks/AAPL/__data.json?x-sveltekit-invalidated=1", "de"))
      .toMatchObject({
        locale: "fr",
        source: "url",
        excluded: false,
        redirect: null,
      });
  });

  it("removes a locale prefix from an excluded route exactly once", () => {
    expect(route("/de/oauth?code=x", "fr")).toMatchObject({
      excluded: true,
      persistLocale: false,
      redirect: { status: 308, location: "/oauth?code=x" },
    });
  });
});

describe("server redirect localization", () => {
  it("localizes a bare internal target", () => {
    expect(localizeInternalRedirect("/register?step=2", "fr")).toBe(
      "/fr/register?step=2",
    );
  });

  it("preserves an explicitly localized target even when the request differs", () => {
    expect(localizeInternalRedirect("/de/profile", "fr")).toBe("/de/profile");
  });

  it("canonicalizes an explicit alias without changing its locale", () => {
    expect(localizeInternalRedirect("/zh-hant/profile#billing", "fr")).toBe(
      "/zh-tw/profile#billing",
    );
  });

  it.each([
    "https://accounts.google.com/oauth",
    "//accounts.google.com/oauth",
    "/api/quote",
    "/oauth?code=x",
    "/oauth/authorize?request=opaque_request_123456",
  ])("leaves external and excluded target %s unchanged", (target) => {
    expect(localizeInternalRedirect(target, "es")).toBe(target);
  });
});
