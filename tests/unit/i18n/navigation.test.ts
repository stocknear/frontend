import { describe, expect, it } from "vitest";
import {
  hrefForLanguageSwitch,
  hrefForLocale,
  localizedHref,
} from "$lib/i18n/navigation";

describe("localized navigation", () => {
  it.each([
    ["en", "/stocks/AAPL"],
    ["de", "/de/stocks/AAPL"],
    ["zh-CN", "/zh-cn/stocks/AAPL"],
    ["zh-TW", "/zh-tw/stocks/AAPL"],
    ["es", "/es/stocks/AAPL"],
    ["fr", "/fr/stocks/AAPL"],
  ] as const)("builds the %s public URL", (locale, expected) => {
    expect(hrefForLocale("/stocks/AAPL", locale)).toBe(expected);
  });

  it("switches locale without stacking prefixes and preserves query/hash", () => {
    expect(hrefForLocale("/de/stocks/AAPL?tab=profile#team", "zh-TW"))
      .toBe("/zh-tw/stocks/AAPL?tab=profile#team");
  });

  it("uses an explicit English marker for a no-JavaScript language switch", () => {
    expect(hrefForLanguageSwitch("/de/about?tab=team#people", "en"))
      .toBe("/en/about?tab=team#people");
    expect(hrefForLanguageSwitch("/de/about?tab=team#people", "fr"))
      .toBe("/fr/about?tab=team#people");
  });

  it("leaves query-only and path-relative values unchanged", () => {
    expect(localizedHref("?page=2", "de")).toBe("?page=2");
    expect(localizedHref("./child", "fr")).toBe("./child");
  });

  it("does not localize API, websocket, static, or external targets", () => {
    expect(localizedHref("/api/portfolio-summary", "fr")).toBe("/api/portfolio-summary");
    expect(localizedHref("/ws/quotes", "fr")).toBe("/ws/quotes");
    expect(localizedHref("/sitemap-stocks.xml", "fr")).toBe("/sitemap-stocks.xml");
    expect(localizedHref("/sitemap/", "fr")).toBe("/fr/sitemap/");
    expect(localizedHref("https://example.com/help", "fr")).toBe("https://example.com/help");
    expect(localizedHref("//example.com/phish", "fr")).toBe("//example.com/phish");
    expect(localizedHref("\\\\example.com\\phish", "fr")).toBe("\\\\example.com\\phish");
  });
});
