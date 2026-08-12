import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const settings = JSON.parse(
  readFileSync(new URL("project.inlang/settings.json", root), "utf8"),
);
const catalogs = Object.fromEntries(
  settings.locales.map((locale: string) => [
    locale,
    JSON.parse(
      readFileSync(new URL(`messages/${locale}/mcp.json`, root), "utf8"),
    ),
  ]),
);
const messageKeys = (catalog: Record<string, string>) =>
  Object.keys(catalog)
    .filter((key) => key !== "$schema")
    .sort();
const placeholders = (value: string) =>
  [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)]
    .map((match) => match[1])
    .sort();

describe("MCP localization", () => {
  it("uses the requested footer CTA", () => {
    expect(catalogs.en.mcp_footer_link).toBe("Get MCP Server");
  });

  it("uses the requested non-Pro MCP CTA", () => {
    expect(catalogs.en.mcp_profile_upgrade_button).toBe("Get Pro");
  });

  it("ships a complete catalog for every supported locale", () => {
    const baseKeys = messageKeys(catalogs.en);
    expect(baseKeys.length).toBeGreaterThan(100);
    for (const locale of settings.locales) {
      expect(messageKeys(catalogs[locale]), locale).toEqual(baseKeys);
      for (const key of baseKeys) {
        expect(catalogs[locale][key].trim(), `${locale}:${key}`).not.toBe("");
        expect(placeholders(catalogs[locale][key]), `${locale}:${key}`).toEqual(
          placeholders(catalogs.en[key]),
        );
      }
    }
  });

  it("localizes financial examples, profile actions, and the footer CTA", () => {
    for (const locale of settings.locales.filter(
      (value: string) => value !== "en",
    )) {
      for (const key of [
        "mcp_hero_title",
        "mcp_example_1",
        "mcp_profile_revoke",
        "mcp_profile_upgrade_button",
        "mcp_footer_link",
      ]) {
        expect(catalogs[locale][key], `${locale}:${key}`).not.toBe(
          catalogs.en[key],
        );
      }
    }
  });

  it("keeps the Profile actions on the requested visual system", () => {
    const component = readFileSync(
      new URL("src/lib/components/McpAccessSection.svelte", root),
      "utf8",
    );
    expect(component).not.toContain('href="/mcp"');
    expect(component).not.toContain("Setup guide");
    expect(component).toContain("Intl.DateTimeFormat(currentLocale");
    expect(component.match(/bg-gray-900/g)?.length).toBeGreaterThanOrEqual(2);
    expect(component.match(/dark:bg-white/g)?.length).toBeGreaterThanOrEqual(2);
    expect(component).toContain("dark:bg-red-500/15");
  });

  it("keeps the always-dark footer readable in either page theme", () => {
    const footer = readFileSync(
      new URL("src/lib/components/Footer.svelte", root),
      "utf8",
    );
    expect(footer).not.toContain(
      "text-sm text-fg-muted hover:text-white dark:text-zinc-200",
    );
    expect(footer.match(/text-sm text-zinc-300/g)?.length).toBeGreaterThan(10);
  });

  it("keeps MCP copy controls interactive and dark accents restrained", () => {
    const page = readFileSync(
      new URL("src/routes/mcp/+page.svelte", root),
      "utf8",
    );
    const profile = readFileSync(
      new URL("src/lib/components/McpAccessSection.svelte", root),
      "utf8",
    );
    expect(page.match(/cursor-pointer/g)?.length).toBeGreaterThanOrEqual(5);
    expect(profile.match(/cursor-pointer/g)?.length).toBeGreaterThanOrEqual(2);
    expect(page).toContain("dark:bg-violet-500/15");
    expect(page).not.toContain("dark:bg-violet-500 dark:hover:bg-violet-600");
  });

  it("routes non-Pro MCP conversion actions to localized Pricing", () => {
    const page = readFileSync(
      new URL("src/routes/mcp/+page.svelte", root),
      "utf8",
    );
    expect(page).toContain('localizedHref("/pricing", currentLocale)');
    expect(page).toContain(
      "data?.isPro ? mcp_get_token() : mcp_profile_upgrade_button()",
    );
    expect(page).toContain(
      "data?.isPro ? mcp_cta_button() : mcp_profile_upgrade_button()",
    );
  });
});
