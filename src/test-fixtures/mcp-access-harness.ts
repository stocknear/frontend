import { mount } from "svelte";
import McpAccessSection from "$lib/components/McpAccessSection.svelte";

export function mountMcpAccessHarness(target: HTMLElement) {
  return mount(McpAccessSection, {
    target,
    props: {
      initialAccount: {
        eligible: true,
        token: null,
        oauth: {
          sessions: [
            {
              sessionId: "session_abcd1234",
              clientId: "stocknear-claude-web",
              clientName: "Claude",
              clientSource: "predefined",
              scopes: ["mcp:tools"],
              resource: "https://mcp.stocknear.com/mcp",
              createdAt: "2026-08-11T12:00:00Z",
              lastRefreshedAt: "2026-08-12T12:00:00Z",
              expiresAt: "2026-09-11T12:00:00Z",
            },
          ],
        },
      },
      isPro: true,
    },
  });
}
