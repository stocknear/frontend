<script lang="ts">
  import { enhance } from "$app/forms";
  import { STOCKNEAR_MCP_ENDPOINT } from "$lib/mcpGuide";
  import type { McpAccount, McpTokenInfo } from "$lib/mcpAccount";
  import { toast } from "svelte-sonner";

  export let initialAccount: McpAccount | null;
  export let unavailable = false;
  export let isPro = false;
  export let actionData: Record<string, unknown> | null | undefined = null;

  let account = initialAccount;
  let loadedAccount = initialAccount;
  let rawToken =
    typeof actionData?.mcpRawToken === "string" ? actionData.mcpRawToken : null;
  let busyAction: "generate" | "revoke" | "unlink" | null = null;

  $: if (initialAccount !== loadedAccount) {
    loadedAccount = initialAccount;
    account = initialAccount;
    rawToken =
      typeof actionData?.mcpRawToken === "string"
        ? actionData.mcpRawToken
        : null;
  }

  const displayDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(value),
    );

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  const enhanceGenerate = () => {
    busyAction = "generate";
    return async ({ result }: { result: any }) => {
      busyAction = null;
      if (result.type === "success" && result.data?.mcpTokenGenerated) {
        rawToken = result.data.mcpRawToken;
        if (account)
          account = {
            ...account,
            token: result.data.mcpTokenInfo as McpTokenInfo,
          };
        toast.success("Token generated. Copy it now.");
      } else {
        toast.error(result.data?.mcpError ?? "Could not generate the token.");
      }
    };
  };

  const enhanceRevoke = () => {
    busyAction = "revoke";
    return async ({ result }: { result: any }) => {
      busyAction = null;
      if (result.type === "success" && result.data?.mcpTokenRevoked) {
        rawToken = null;
        if (account) account = { ...account, token: null };
        toast.success("Token revoked.");
      } else {
        toast.error(result.data?.mcpError ?? "Could not revoke the token.");
      }
    };
  };

  const enhanceUnlink = () => {
    busyAction = "unlink";
    return async ({ result }: { result: any }) => {
      busyAction = null;
      if (result.type === "success" && result.data?.mcpOAuthUnlinked) {
        if (account) account = { ...account, oauth: null };
        toast.success("OAuth identity unlinked.");
      } else {
        toast.error(result.data?.mcpError ?? "Could not unlink the identity.");
      }
    };
  };

  function confirmTokenChange(event: SubmitEvent, message: string) {
    if (!window.confirm(message)) event.preventDefault();
  }
</script>

<section
  id="mcp-access"
  class="mt-6 overflow-hidden rounded-container border border-line bg-surface-card"
>
  <div
    class="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start sm:p-6"
  >
    <div class="max-w-2xl">
      <div class="flex items-center gap-2">
        <h2 class="type-h2 text-fg">MCP access</h2>
        {#if isPro}<span class="badge badge-primary badge-sm">Pro</span>{/if}
      </div>
      <p class="mt-2 text-sm leading-6 text-fg-muted">
        Use Stocknear's market research tools in Claude Code, Cursor, VS Code,
        Gemini CLI, OpenCode, Hermes, and other MCP clients.
      </p>
    </div>
    <a class="btn btn-sm btn-outline shrink-0" href="/mcp">Setup guide</a>
  </div>

  {#if !isPro}
    <div class="border-t border-line bg-surface-raised/40 p-5 sm:p-6">
      <p class="font-medium text-fg">MCP is included with Pro.</p>
      <p class="mt-1 max-w-2xl text-sm leading-6 text-fg-muted">
        Upgrade to generate a personal token. If a Pro subscription ends, all
        MCP credentials stop working immediately.
      </p>
      <a class="btn btn-sm btn-primary mt-4" href="/pricing">View Pro</a>
    </div>
  {:else if unavailable}
    <div class="border-t border-line p-5 sm:p-6">
      <p class="text-sm text-fg-muted">
        MCP account details are temporarily unavailable. Refresh this page
        before changing access.
      </p>
    </div>
  {:else if account}
    <div class="grid border-t border-line sm:grid-cols-[minmax(0,1fr)_auto]">
      <div class="min-w-0 p-5 sm:p-6">
        <p class="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Endpoint
        </p>
        <div class="mt-2 flex min-w-0 items-center gap-2">
          <code
            class="min-w-0 flex-1 truncate rounded-lg bg-surface-raised px-3 py-2 text-xs sm:text-sm"
            >{STOCKNEAR_MCP_ENDPOINT}</code
          >
          <button
            class="btn btn-sm btn-outline"
            type="button"
            onclick={() => copy(STOCKNEAR_MCP_ENDPOINT, "Endpoint")}
            >Copy</button
          >
        </div>
        <p class="mt-3 text-xs text-fg-muted">
          120 tool calls per rolling minute · 4 concurrent calls
        </p>
      </div>

      <div
        class="flex items-center border-t border-line px-5 py-4 sm:border-l sm:border-t-0 sm:px-6"
      >
        <a class="text-sm font-medium text-accent hover:underline" href="/mcp"
          >Client instructions →</a
        >
      </div>
    </div>

    {#if rawToken}
      <div class="border-t border-warning/30 bg-warning/10 p-5 sm:p-6">
        <p class="font-medium text-fg">Copy your token now</p>
        <p class="mt-1 text-sm text-fg-muted">
          For security, Stocknear will not show this token again.
        </p>
        <div class="mt-3 flex flex-col gap-2 sm:flex-row">
          <code
            class="min-w-0 flex-1 break-all rounded-lg border border-warning/30 bg-surface-card px-3 py-2 text-sm"
            >{rawToken}</code
          >
          <button
            class="btn btn-sm btn-primary"
            type="button"
            onclick={() => copy(rawToken!, "Token")}>Copy token</button
          >
        </div>
      </div>
    {/if}

    <div class="border-t border-line p-5 sm:p-6">
      <div
        class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"
      >
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-fg">Personal token</h3>
            {#if account.token}
              <span
                class:badge-success={account.token.status === "active"}
                class:badge-error={account.token.status === "expired"}
                class="badge badge-sm"
              >
                {account.token.status === "active" ? "Active" : "Expired"}
              </span>
            {/if}
          </div>
          {#if account.token}
            <p class="mt-2 font-mono text-sm text-fg">
              {account.token.prefix}…
            </p>
            <p class="mt-1 text-xs text-fg-muted">
              Created {displayDate(account.token.createdAt)} · Expires {displayDate(
                account.token.expiresAt,
              )}
            </p>
          {:else}
            <p class="mt-2 text-sm text-fg-muted">
              No token has been generated.
            </p>
          {/if}
        </div>

        <div class="flex flex-wrap gap-2">
          <form
            method="POST"
            action="?/generateMcpToken"
            use:enhance={enhanceGenerate}
            onsubmit={(event) =>
              account?.token &&
              confirmTokenChange(
                event,
                "Generate a new token? Your current token will stop working immediately.",
              )}
          >
            <button
              class="btn btn-sm btn-primary"
              type="submit"
              disabled={busyAction !== null}
            >
              {busyAction === "generate"
                ? "Working…"
                : account.token
                  ? "Rotate token"
                  : "Generate token"}
            </button>
          </form>
          {#if account.token}
            <form
              method="POST"
              action="?/revokeMcpToken"
              use:enhance={enhanceRevoke}
              onsubmit={(event) =>
                confirmTokenChange(
                  event,
                  "Revoke this token? Connected clients will stop working immediately.",
                )}
            >
              <button
                class="btn btn-sm btn-outline"
                type="submit"
                disabled={busyAction !== null}
                >{busyAction === "revoke" ? "Revoking…" : "Revoke"}</button
              >
            </form>
          {/if}
        </div>
      </div>
    </div>

    {#if account.oauth}
      <div
        class="flex flex-col justify-between gap-3 border-t border-line p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <div>
          <h3 class="font-semibold text-fg">Linked OAuth identity</h3>
          <p class="mt-1 text-xs text-fg-muted">
            Linked {displayDate(account.oauth.linkedAt)} through {account.oauth
              .issuer}
          </p>
        </div>
        <form
          method="POST"
          action="?/unlinkMcpOAuth"
          use:enhance={enhanceUnlink}
          onsubmit={(event) =>
            confirmTokenChange(event, "Unlink this OAuth identity?")}
        >
          <button
            class="btn btn-sm btn-outline"
            type="submit"
            disabled={busyAction !== null}
            >{busyAction === "unlink" ? "Unlinking…" : "Unlink"}</button
          >
        </form>
      </div>
    {/if}
  {/if}
</section>
