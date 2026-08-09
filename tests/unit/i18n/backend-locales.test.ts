import { describe, expect, it } from "vitest";
import { getNativeContentLocales, resolveBackendLocale } from "$lib/i18n/backend-locales";
import { supportedLocales } from "$lib/i18n/locales";

describe("backend locale capabilities", () => {
  it.each(["stockProfile", "analystInsight"] as const)(
    "resolves %s to English for every supported UI locale",
    (capability) => {
      for (const locale of supportedLocales) {
        expect(resolveBackendLocale(capability, locale)).toMatchObject({
          effectiveLocale: "en",
          fallbackApplied: locale !== "en",
        });
      }
    },
  );

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
    expect(getNativeContentLocales("stockProfile")).toEqual(["en"]);
  });
});
