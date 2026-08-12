import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  CODEX_MCP_COMMAND,
  MCP_CLIENTS,
  MCP_QUICK_CONNECT_CLIENTS,
  getMcpClientCatalog,
  STOCKNEAR_MCP_ENDPOINT,
} from "../../src/lib/mcpGuide";

describe("public MCP client snippets", () => {
  it("covers OAuth Codex and every supported personal-token client", () => {
    expect(MCP_CLIENTS.map((client) => client.id)).toEqual([
      "codex",
      "claude-code",
      "cursor",
      "vscode",
      "windsurf",
      "gemini",
      "opencode",
      "hermes",
      "generic",
    ]);

    const codex = MCP_CLIENTS.find((client) => client.id === "codex")!;
    expect(codex.config).toBe(CODEX_MCP_COMMAND);
    expect(codex.config).toContain(STOCKNEAR_MCP_ENDPOINT);
    expect(codex.config).toContain("codex mcp login stocknear");
    expect(codex.config).not.toMatch(/authorization|bearer|token/i);

    for (const client of MCP_CLIENTS.filter(
      (client) => client.id !== "codex",
    )) {
      expect(client.config).toContain(STOCKNEAR_MCP_ENDPOINT);
      expect(client.config).toContain("Authorization");
      expect(client.config).not.toContain("sn_mcp_");
      if (client.format === "json")
        expect(() => JSON.parse(client.config)).not.toThrow();
    }
  });

  it("uses each client's own merge shape", () => {
    const byId = Object.fromEntries(
      MCP_CLIENTS.map((client) => [client.id, client]),
    );

    expect(JSON.parse(byId.cursor.mergeConfig!).mcpServers.stocknear.url).toBe(
      STOCKNEAR_MCP_ENDPOINT,
    );
    expect(JSON.parse(byId.vscode.mergeConfig!).servers.stocknear.type).toBe(
      "http",
    );
    expect(
      JSON.parse(byId.windsurf.mergeConfig!).mcpServers.stocknear.serverUrl,
    ).toBe(STOCKNEAR_MCP_ENDPOINT);
    expect(byId.gemini.config).toContain(
      `gemini mcp add stocknear ${STOCKNEAR_MCP_ENDPOINT} --transport http`,
    );
    expect(byId.gemini.mergeConfig).toBeUndefined();
    expect(
      JSON.parse(byId.opencode.mergeConfig!).mcp.servers.stocknear.oauth,
    ).toBe(false);
    expect(byId["claude-code"].mergeConfig).toBeUndefined();
    expect(byId.hermes.mergeConfig).toBeUndefined();
  });

  it("keeps secrets out of shell history and committed JSON examples", () => {
    const claude = MCP_CLIENTS.find((client) => client.id === "claude-code")!;
    const vscode = JSON.parse(
      MCP_CLIENTS.find((client) => client.id === "vscode")!.config,
    );
    const opencode = JSON.parse(
      MCP_CLIENTS.find((client) => client.id === "opencode")!.config,
    );

    expect(claude.config).toContain("read -rsp");
    expect(claude.config).toContain("$STOCKNEAR_MCP_TOKEN");
    expect(vscode.inputs[0]).toMatchObject({
      type: "promptString",
      password: true,
    });
    expect(opencode.mcp.servers.stocknear.headers.Authorization).toBe(
      "Bearer {env:STOCKNEAR_MCP_TOKEN}",
    );
  });

  it("provides honest quick-connect links without credentials", () => {
    expect(MCP_QUICK_CONNECT_CLIENTS.map((client) => client.id)).toEqual([
      "claude",
      "cursor",
      "vscode",
      "grok",
    ]);

    for (const client of MCP_QUICK_CONNECT_CLIENTS) {
      expect(client.href).toMatch(/^https:\/\//);
      expect(client.href).not.toMatch(
        /sn_mcp_|authorization|bearer|stocknear_mcp_token/i,
      );
    }

    expect(
      MCP_QUICK_CONNECT_CLIENTS.filter(
        (client) => client.behavior === "install",
      ).map((client) => client.id),
    ).toEqual(["cursor", "vscode"]);
    expect(
      MCP_QUICK_CONNECT_CLIENTS.filter(
        (client) => client.behavior === "settings",
      ).map((client) => client.id),
    ).toEqual(["claude", "grok"]);

    const claude = new URL(
      MCP_QUICK_CONNECT_CLIENTS.find((client) => client.id === "claude")!.href,
    );
    expect(claude.href).toBe("https://claude.ai/customize/connectors");
    expect(claude.search).toBe("");
    expect(claude.hash).toBe("");
  });

  it("derives every visible client surface from the same authentication capability", () => {
    const withoutOauth = getMcpClientCatalog({ oauth: false, pat: true });
    expect(withoutOauth.quickConnect).toEqual([]);
    expect(withoutOauth.guides.some((client) => client.id === "codex")).toBe(
      false,
    );
    expect(
      withoutOauth.guides.every((client) => client.authentication === "pat"),
    ).toBe(true);

    const withOauth = getMcpClientCatalog({ oauth: true, pat: true });
    expect(withOauth.quickConnect).toEqual(MCP_QUICK_CONNECT_CLIENTS);
    expect(withOauth.guides.some((client) => client.id === "codex")).toBe(true);
  });

  it("encodes only the public endpoint in install payloads", () => {
    const cursor = new URL(
      MCP_QUICK_CONNECT_CLIENTS.find((client) => client.id === "cursor")!.href,
    );
    const cursorConfig = JSON.parse(
      Buffer.from(cursor.searchParams.get("config")!, "base64").toString(
        "utf8",
      ),
    );
    expect(cursorConfig).toEqual({ url: STOCKNEAR_MCP_ENDPOINT });

    const vscode = new URL(
      MCP_QUICK_CONNECT_CLIENTS.find((client) => client.id === "vscode")!.href,
    );
    const vscodeRedirect = vscode.searchParams.get("url")!;
    expect(vscodeRedirect.startsWith("vscode:mcp/install?")).toBe(true);
    expect(
      JSON.parse(vscodeRedirect.slice("vscode:mcp/install?".length)),
    ).toEqual({ name: "stocknear", url: STOCKNEAR_MCP_ENDPOINT });
  });

  it("uses the requested footer call to action", () => {
    const footer = readFileSync(
      new URL("../../src/lib/components/Footer.svelte", import.meta.url),
      "utf8",
    );
    expect(footer).toContain("{mcp_footer_link()}");
  });
});
