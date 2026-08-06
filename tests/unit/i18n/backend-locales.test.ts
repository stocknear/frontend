import { describe, expect, it } from "vitest";
import { getNativeContentLocales, resolveBackendLocale } from "$lib/i18n/backend-locales";
import { supportedLocales } from "$lib/i18n/locales";

describe("backend locale capabilities", () => {
  it.each([
    ["en", "en"],
    ["de", "de"],
    ["zh-CN", "zh"],
    ["zh-TW", "en"],
    ["es", "en"],
    ["fr", "en"],
    ["ja", "en"],
    ["ko", "en"],
    ["ru", "en"],
    ["uk", "en"],
  ] as const)("maps stock profile %s to %s", (requested, effective) => {
    expect(resolveBackendLocale("stockProfile", requested).effectiveLocale).toBe(effective);
  });

  it("keeps English-only capabilities on one shared effective cache language", () => {
    for (const locale of supportedLocales) {
      expect(resolveBackendLocale("dashboardInfo", locale).effectiveLocale).toBe("en");
    }
  });

  it("does not send Simplified Chinese to summary endpoints that only support en/de", () => {
    expect(resolveBackendLocale("transcriptSummary", "zh-CN")).toMatchObject({
      effectiveLocale: "en",
      fallbackApplied: true,
    });
  });

  it("exposes only genuinely localized profile prose to SEO", () => {
    expect(getNativeContentLocales("stockProfile")).toEqual(["en", "de", "zh-CN"]);
  });
});
