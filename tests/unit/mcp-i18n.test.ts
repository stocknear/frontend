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
        "mcp_clients_title",
        "mcp_clients_description",
        "mcp_example_1",
        "mcp_profile_created",
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

  it("keeps Codex OAuth guidance without unsupported browser-client instructions", () => {
    const page = readFileSync(
      new URL("src/routes/mcp/+page.svelte", root),
      "utf8",
    );
    const guide = readFileSync(new URL("src/lib/mcpGuide.ts", root), "utf8");
    expect(guide).toContain("codex mcp add stocknear --url");
    expect(guide).toContain("codex mcp login stocknear");
    expect(page).toContain("data?.oauthAvailable");
    expect(page).toContain("getMcpClientCatalog");
    expect(page).toContain("$: visibleClients = MCP_CLIENTS;");
    expect(guide).toContain('authentication: "oauth"');
    expect(page).not.toContain("chatgpt.com/plugins");
    expect(page).not.toContain("claude.ai/customize/connectors");
    expect(page).not.toMatch(/mcp_(chatgpt|claude|browser_oauth)_/);
    expect(page).not.toContain("chatgpt-developer-mode.png");
    expect(page).not.toContain("chatgpt-plugin-form.png");
    expect(page).not.toContain('"Access token / API key"');
    expect(page).not.toMatch(/sn_mcp_[A-Za-z0-9]+/);
  });

  it("includes the shared Codex OAuth command in the client picker", () => {
    const guide = readFileSync(new URL("src/lib/mcpGuide.ts", root), "utf8");
    const page = readFileSync(
      new URL("src/routes/mcp/+page.svelte", root),
      "utf8",
    );
    expect(guide).toContain('id: "codex"');
    expect(guide).toContain("config: CODEX_MCP_COMMAND");
    expect(guide).toContain("codex mcp add stocknear --url");
    expect(guide).toContain("codex mcp login stocknear");
    expect(page).toContain("$: visibleClients = MCP_CLIENTS;");
    expect(page).not.toContain("mcp_codex_title");
  });

  it("presents personal MCP tokens as non-expiring", () => {
    const component = readFileSync(
      new URL("src/lib/components/McpAccessSection.svelte", root),
      "utf8",
    );
    expect(component).toContain("mcp_profile_created");
    expect(component).not.toContain("mcp_profile_status_expired");
    expect(component).not.toContain("account.token.expiresAt");
  });

  it("uses the existing Stocknear account and exposes session management", () => {
    const page = readFileSync(
      new URL("src/routes/oauth/authorize/+page.svelte", root),
      "utf8",
    );
    const profile = readFileSync(
      new URL("src/lib/components/McpAccessSection.svelte", root),
      "utf8",
    );
    expect(page).toContain("mcp_oauth_approve");
    expect(profile).toContain("account.oauth.sessions");
    expect(profile).toContain("?/revokeMcpOAuthSession");
    expect(profile).toContain("?/revokeAllMcpOAuthSessions");
    expect(profile).not.toContain("unlinkMcpOAuth");
    expect(profile).not.toContain("issuer");
  });
});
