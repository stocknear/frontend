import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const footer = readFileSync(
  new URL("../../src/lib/components/Footer.svelte", import.meta.url),
  "utf8",
);

describe("footer language disclosure", () => {
  it("closes before handling either the current or a different locale", () => {
    const switchLanguage = footer.match(
      /function switchLanguage\(locale: Locale\) \{([\s\S]*?)\n  \}/,
    )?.[1];

    expect(switchLanguage).toBeDefined();
    expect(switchLanguage!.indexOf("closeLanguageMenu();")).toBeLessThan(
      switchLanguage!.indexOf("if (locale === currentLocale) return;"),
    );
    expect(switchLanguage!.indexOf("closeLanguageMenu();")).toBeLessThan(
      switchLanguage!.indexOf("setLanguage("),
    );
  });

  it("routes every locale menu-item selection through the closing handler", () => {
    expect(footer).toContain("switchLanguage(lang);");
  });
});
