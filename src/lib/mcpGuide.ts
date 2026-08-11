export const STOCKNEAR_MCP_ENDPOINT = "https://mcp.stocknear.com/mcp";

export type McpQuickConnectClient = {
  id: "claude" | "cursor" | "vscode" | "grok";
  name: string;
  href: string;
  action: string;
  behavior: "install" | "settings";
  note: string;
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
    name: "Claude",
    href: "https://claude.ai/settings/connectors",
    action: "Open connectors",
    behavior: "settings",
    note: "Choose Add custom connector, paste the endpoint, then sign in.",
  },
  {
    id: "cursor",
    name: "Cursor",
    href: `https://cursor.com/en/install-mcp?name=stocknear&config=${cursorRemoteConfig}`,
    action: "Add to Cursor",
    behavior: "install",
    note: "Review the hosted server and approve it in Cursor.",
  },
  {
    id: "vscode",
    name: "VS Code",
    href: `https://vscode.dev/redirect?url=vscode:mcp/install?${vscodeRemoteConfig}`,
    action: "Install in VS Code",
    behavior: "install",
    note: "Review the hosted server and approve it in VS Code.",
  },
  {
    id: "grok",
    name: "Grok",
    href: "https://grok.com/connectors",
    action: "Open connectors",
    behavior: "settings",
    note: "Create a Custom connector, paste the endpoint, then sign in.",
  },
] as const;

export type McpClientGuide = {
  id: string;
  name: string;
  location: string;
  format: "command" | "json" | "yaml";
  config: string;
  mergeConfig?: string;
  verify: string;
  secretNote: string;
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
    id: "claude-code",
    name: "Claude Code",
    location: "Terminal",
    format: "command",
    config: `bash -c 'read -rsp "Stocknear MCP token: " STOCKNEAR_MCP_TOKEN; echo; claude mcp add --transport http --scope user stocknear ${STOCKNEAR_MCP_ENDPOINT} --header "Authorization: Bearer $STOCKNEAR_MCP_TOKEN"; unset STOCKNEAR_MCP_TOKEN'`,
    verify:
      "Restart Claude Code, run /mcp, and confirm stocknear is connected.",
    secretNote:
      "The hidden prompt keeps the token out of shell history. Claude stores the resulting user-scoped server configuration locally.",
  },
  {
    id: "cursor",
    name: "Cursor",
    location: "~/.cursor/mcp.json",
    format: "json",
    config: json({ mcpServers: { stocknear: cursorEntry } }),
    mergeConfig: json({
      mcpServers: {
        existingServer: { url: "https://example.com/mcp" },
        stocknear: cursorEntry,
      },
    }),
    verify:
      "Set STOCKNEAR_MCP_TOKEN, restart Cursor, then rescan MCP servers in Settings.",
    secretNote:
      "Keep the token in an environment variable. Do not replace the placeholder with a secret in a committed workspace file.",
  },
  {
    id: "vscode",
    name: "VS Code",
    location: "User or workspace mcp.json",
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
    verify:
      "Run MCP: List Servers, start stocknear, and enter the token when prompted.",
    secretNote:
      "VS Code stores the value as a password input instead of placing it in the configuration file.",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    location: "~/.codeium/windsurf/mcp_config.json",
    format: "json",
    config: json({ mcpServers: { stocknear: windsurfEntry } }),
    mergeConfig: json({
      mcpServers: {
        existingServer: { serverUrl: "https://example.com/mcp" },
        stocknear: windsurfEntry,
      },
    }),
    verify:
      "Set STOCKNEAR_MCP_TOKEN, restart Windsurf, and refresh MCP servers.",
    secretNote:
      "Use the environment placeholder so the bearer token is not stored in the JSON file.",
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    location: "Terminal",
    format: "command",
    config: `bash -c 'read -rsp "Stocknear MCP token: " STOCKNEAR_MCP_TOKEN; echo; gemini mcp add stocknear ${STOCKNEAR_MCP_ENDPOINT} --transport http --scope user --header "Authorization: Bearer $STOCKNEAR_MCP_TOKEN"; unset STOCKNEAR_MCP_TOKEN'`,
    verify:
      "Run gemini mcp list, start Gemini CLI, then use /mcp to confirm stocknear is connected.",
    secretNote:
      "The hidden prompt keeps the token out of shell history and unsets the temporary shell variable afterward.",
  },
  {
    id: "opencode",
    name: "OpenCode",
    location: "opencode.json",
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
    verify:
      "Set STOCKNEAR_MCP_TOKEN, restart OpenCode, and confirm stocknear in the MCP server list.",
    secretNote:
      "OpenCode's {env:...} form reads the token from the process environment.",
  },
  {
    id: "hermes",
    name: "Hermes",
    location: "~/.hermes/config.yaml",
    format: "yaml",
    config: `mcp_servers:
  stocknear:
    url: ${STOCKNEAR_MCP_ENDPOINT}
    headers:
      Authorization: "Bearer YOUR_STOCKNEAR_MCP_TOKEN"
    ssl_verify: true`,
    verify:
      "Replace the token placeholder, restart Hermes, then run hermes mcp test stocknear.",
    secretNote:
      "Hermes stores this header in config.yaml. Replace the placeholder locally and protect the file with chmod 600.",
  },
  {
    id: "generic",
    name: "Other clients",
    location: "Remote MCP settings",
    format: "yaml",
    config: `transport: streamable-http
url: ${STOCKNEAR_MCP_ENDPOINT}
headers:
  Authorization: "Bearer YOUR_STOCKNEAR_MCP_TOKEN"`,
    verify:
      "Restart or rescan the client, then ask it to retrieve the latest AAPL quote.",
    secretNote:
      "Use the client's encrypted secret store or environment-variable support when available.",
  },
] as const;

export const PAT_CLIENTS = MCP_CLIENTS;

export const MCP_HOW_TO = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Connect an AI client to Stocknear MCP",
  description:
    "Generate a Stocknear MCP token, add the hosted endpoint to an AI client, and verify a market-research tool call.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Generate a token",
      text: "Pro users generate a personal MCP token from their Stocknear profile.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Configure the client",
      text: `Add ${STOCKNEAR_MCP_ENDPOINT} using the exact client-specific configuration.`,
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Verify the connection",
      text: "Restart or rescan the client, then request the latest AAPL quote.",
    },
  ],
} as const;
