import { describe, expect, it } from "vitest";
import { getTurnstileLanguage, supportedLocales } from "$lib/i18n/locales";

/**
 * Cloudflare Turnstile's supported-language list, from
 * https://developers.cloudflare.com/turnstile/reference/supported-languages/
 *
 * svelte-turnstile types the `language` prop as `SupportedLanguages | "auto" | string`,
 * so passing a code Turnstile cannot render is not a compile error — it just silently
 * falls back to English inside the widget while the rest of the page is translated.
 * This test is the only thing standing between a new locale and that.
 *
 * If a locale you want fails here, it does not get added: the captcha on login,
 * register, contact and support would be the one English box on an otherwise
 * translated page.
 */
const TURNSTILE_SUPPORTED = new Set([
  "ar-eg", "ar", "bg-bg", "bg", "zh-cn", "zh", "zh-tw", "hr-hr", "hr",
  "cs-cz", "cs", "da-dk", "da", "nl-nl", "nl", "en-us", "en", "fa-ir", "fa",
  "fi-fi", "fi", "fr-fr", "fr", "de-de", "de", "el-gr", "el", "he-il", "he",
  "hi-in", "hi", "hu-hu", "hu", "id-id", "id", "it-it", "it", "ja-jp", "ja",
  "tlh", "ko-kr", "ko", "lt-lt", "lt", "ms-my", "ms", "nb-no", "nb",
  "pl-pl", "pl", "pt-br", "pt", "ro-ro", "ro", "ru-ru", "ru", "sr-ba", "sr",
  "sk-sk", "sk", "sl-si", "sl", "es-es", "es", "sv-se", "sv", "tl-ph", "tl",
  "th-th", "th", "tr-tr", "tr", "uk-ua", "uk", "vi-vn", "vi",
]);

describe("Turnstile language", () => {
  it("renders every shipped locale", () => {
    const unsupported = supportedLocales.filter(
      (locale) => !TURNSTILE_SUPPORTED.has(getTurnstileLanguage(locale)),
    );
    expect(unsupported).toEqual([]);
  });

  it("lowercases region subtags the way Turnstile expects", () => {
    expect(getTurnstileLanguage("zh-CN")).toBe("zh-cn");
    expect(getTurnstileLanguage("zh-TW")).toBe("zh-tw");
    expect(getTurnstileLanguage("en")).toBe("en");
  });

  it("falls back to the base locale rather than emitting a bogus code", () => {
    // getLocaleDefinition() canonicalizes, so URL casing like "zh-cn" and unknown
    // input both resolve to something Turnstile can actually render.
    expect(TURNSTILE_SUPPORTED.has(getTurnstileLanguage("zh-cn" as never))).toBe(true);
    expect(TURNSTILE_SUPPORTED.has(getTurnstileLanguage("kl" as never))).toBe(true);
  });
});
