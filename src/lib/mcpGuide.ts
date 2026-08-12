export const STOCKNEAR_MCP_ENDPOINT = "https://mcp.stocknear.com/mcp";
export const CODEX_MCP_COMMAND = `codex mcp add stocknear --url ${STOCKNEAR_MCP_ENDPOINT}
codex mcp login stocknear`;

export type McpAuthentication = "oauth" | "pat";

type McpClientCapability = {
  authentication: McpAuthentication;
};

export type McpQuickConnectClient = McpClientCapability & {
  id: "claude" | "cursor" | "vscode" | "grok";
  name: string;
  href: string;
  behavior: "install" | "settings";
};

const cursorRemoteConfig =
  "eyJ1cmwiOiJodHRwczovL21jcC5zdG9ja25lYXIuY29tL21jcCJ9";
const vscodeRemoteConfig =
  "%7B%22name%22%3A%22stocknear%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.stocknear.com%2Fmcp%22%7D";

/**
 * Public launch links only. Authentication happens inside the client after the
 * server is added, so credentials must never be added to these URLs.
 */
export const MCP_QUICK_CONNECT_CLIENTS: readonly McpQuickConnectClient[] = [
  {
    id: "claude",
    authentication: "oauth",
    name: "Claude",
    href: "https://claude.ai/customize/connectors",
    behavior: "settings",
  },
  {
    id: "cursor",
    authentication: "oauth",
    name: "Cursor",
    href: `https://cursor.com/en/install-mcp?name=stocknear&config=${cursorRemoteConfig}`,
    behavior: "install",
  },
  {
    id: "vscode",
    authentication: "oauth",
    name: "VS Code",
    href: `https://vscode.dev/redirect?url=vscode:mcp/install?${vscodeRemoteConfig}`,
    behavior: "install",
  },
  {
    id: "grok",
    authentication: "oauth",
    name: "Grok",
    href: "https://grok.com/connectors",
    behavior: "settings",
  },
] as const;

export type McpClientGuide = McpClientCapability & {
  id: string;
  name: string;
  format: "command" | "json" | "yaml";
  config: string;
  mergeConfig?: string;
};

const cursorEntry = {
  url: STOCKNEAR_MCP_ENDPOINT,
  headers: { Authorization: "Bearer ${env:STOCKNEAR_MCP_TOKEN}" },
};

const vscodeEntry = {
  type: "http",
  url: STOCKNEAR_MCP_ENDPOINT,
  headers: { Authorization: "Bearer ${input:stocknear-token}" },
};

const windsurfEntry = {
  serverUrl: STOCKNEAR_MCP_ENDPOINT,
  headers: { Authorization: "Bearer ${env:STOCKNEAR_MCP_TOKEN}" },
};

const opencodeEntry = {
  type: "remote",
  url: STOCKNEAR_MCP_ENDPOINT,
  oauth: false,
  headers: { Authorization: "Bearer {env:STOCKNEAR_MCP_TOKEN}" },
};

const json = (value: unknown) => JSON.stringify(value, null, 2);

export const MCP_CLIENTS: readonly McpClientGuide[] = [
  {
    id: "codex",
    authentication: "oauth",
    name: "Codex",
    format: "command",
    config: CODEX_MCP_COMMAND,
  },
  {
    id: "claude-code",
    authentication: "pat",
    name: "Claude Code",
    format: "command",
    config: `bash -c 'read -rsp "MCP token: " STOCKNEAR_MCP_TOKEN; echo; claude mcp add --transport http --scope user stocknear ${STOCKNEAR_MCP_ENDPOINT} --header "Authorization: Bearer $STOCKNEAR_MCP_TOKEN"; unset STOCKNEAR_MCP_TOKEN'`,
  },
  {
    id: "cursor",
    authentication: "pat",
    name: "Cursor",
    format: "json",
    config: json({ mcpServers: { stocknear: cursorEntry } }),
    mergeConfig: json({
      mcpServers: {
        existingServer: { url: "https://example.com/mcp" },
        stocknear: cursorEntry,
      },
    }),
  },
  {
    id: "vscode",
    authentication: "pat",
    name: "VS Code",
    format: "json",
    config: json({
      inputs: [
        {
          id: "stocknear-token",
          type: "promptString",
          description: "Stocknear MCP token",
          password: true,
        },
      ],
      servers: { stocknear: vscodeEntry },
    }),
    mergeConfig: json({
      inputs: [
        {
          id: "stocknear-token",
          type: "promptString",
          description: "Stocknear MCP token",
          password: true,
        },
      ],
      servers: {
        existingServer: { type: "http", url: "https://example.com/mcp" },
        stocknear: vscodeEntry,
      },
    }),
  },
  {
    id: "windsurf",
    authentication: "pat",
    name: "Windsurf",
    format: "json",
    config: json({ mcpServers: { stocknear: windsurfEntry } }),
    mergeConfig: json({
      mcpServers: {
        existingServer: { serverUrl: "https://example.com/mcp" },
        stocknear: windsurfEntry,
      },
    }),
  },
  {
    id: "gemini",
    authentication: "pat",
    name: "Gemini CLI",
    format: "command",
    config: `bash -c 'read -rsp "MCP token: " STOCKNEAR_MCP_TOKEN; echo; gemini mcp add stocknear ${STOCKNEAR_MCP_ENDPOINT} --transport http --scope user --header "Authorization: Bearer $STOCKNEAR_MCP_TOKEN"; unset STOCKNEAR_MCP_TOKEN'`,
  },
  {
    id: "opencode",
    authentication: "pat",
    name: "OpenCode",
    format: "json",
    config: json({
      $schema: "https://opencode.ai/config.json",
      mcp: { servers: { stocknear: opencodeEntry } },
    }),
    mergeConfig: json({
      $schema: "https://opencode.ai/config.json",
      mcp: {
        servers: {
          existingServer: { type: "remote", url: "https://example.com/mcp" },
          stocknear: opencodeEntry,
        },
      },
    }),
  },
  {
    id: "hermes",
    authentication: "pat",
    name: "Hermes",
    format: "yaml",
    config: `mcp_servers:
  stocknear:
    url: ${STOCKNEAR_MCP_ENDPOINT}
    headers:
      Authorization: "Bearer YOUR_STOCKNEAR_MCP_TOKEN"
    ssl_verify: true`,
  },
  {
    id: "generic",
    authentication: "pat",
    name: "Other clients",
    format: "yaml",
    config: `transport: streamable-http
url: ${STOCKNEAR_MCP_ENDPOINT}
headers:
  Authorization: "Bearer YOUR_STOCKNEAR_MCP_TOKEN"`,
  },
] as const;

export type McpClientCapabilities = {
  oauth: boolean;
  pat: boolean;
};

const supportsCapabilities = (
  client: McpClientCapability,
  capabilities: McpClientCapabilities,
) => capabilities[client.authentication];

export function getMcpClientCatalog(capabilities: McpClientCapabilities) {
  return {
    quickConnect: MCP_QUICK_CONNECT_CLIENTS.filter((client) =>
      supportsCapabilities(client, capabilities),
    ),
    guides: MCP_CLIENTS.filter((client) =>
      supportsCapabilities(client, capabilities),
    ),
  };
}

export const PAT_CLIENTS = MCP_CLIENTS.filter(
  (client) => client.authentication === "pat",
);
