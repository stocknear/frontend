import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);
const locales = [
  "en",
  "de",
  "es",
  "fr",
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "ru",
  "uk",
];
const catalogs = Object.fromEntries(
  locales.map((locale) => [
    locale,
    JSON.parse(
      readFileSync(new URL(`messages/${locale}/pricing.json`, root), "utf8"),
    ),
  ]),
);

describe("Pro MCP pricing copy", () => {
  it("renders MCP Support once and only inside the Pro feature card", () => {
    const page = readFileSync(
      new URL("src/routes/pricing/+page.svelte", root),
      "utf8",
    );
    const feature = "{pricing_feature_mcp_support()}";
    const featureIndex = page.indexOf(feature);

    expect(page.split(feature)).toHaveLength(2);
    expect(featureIndex).toBeGreaterThan(page.lastIndexOf("{pricing_pro_title()}"));
    expect(page).toContain("{pricing_faq_q5_title()}");
    expect(page).toContain("{pricing_faq_q5_answer()}");
  });

  it("translates the Pro feature and FAQ in every supported locale", () => {
    for (const locale of locales) {
      for (const key of [
        "pricing_feature_mcp_support",
        "pricing_faq_q5_title",
        "pricing_faq_q5_answer",
      ]) {
        expect(catalogs[locale][key]?.trim(), `${locale}:${key}`).toBeTruthy();
        if (locale !== "en") {
          expect(catalogs[locale][key], `${locale}:${key}`).not.toBe(
            catalogs.en[key],
          );
        }
      }
    }
  });
});
