<script lang="ts">
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";
  import { localizedHref } from "$lib/i18n/navigation";
  import { STOCKNEAR_MCP_ENDPOINT } from "$lib/mcpGuide";
  import type { McpAccount, McpTokenInfo } from "$lib/mcpAccount";
  import { baseLocale, extractLocaleFromUrl } from "$lib/paraglide/runtime.js";
  import {
    mcp_copy,
    mcp_endpoint,
    mcp_profile_confirm_revoke,
    mcp_profile_confirm_rotate,
    mcp_profile_confirm_unlink,
    mcp_profile_copy_error,
    mcp_profile_copy_success,
    mcp_profile_copy_token,
    mcp_profile_description,
    mcp_profile_generate,
    mcp_profile_generate_error,
    mcp_profile_limit,
    mcp_profile_no_token,
    mcp_profile_oauth_linked,
    mcp_profile_oauth_title,
    mcp_profile_pro,
    mcp_profile_pro_required,
    mcp_profile_revoke,
    mcp_profile_revoke_error,
    mcp_profile_revoke_success,
    mcp_profile_revoking,
    mcp_profile_rotate,
    mcp_profile_sign_in,
    mcp_profile_status_active,
    mcp_profile_status_expired,
    mcp_profile_temporarily_unavailable,
    mcp_profile_title,
    mcp_profile_token_copy_description,
    mcp_profile_token_copy_title,
    mcp_profile_token_generated,
    mcp_profile_token_title,
    mcp_profile_unavailable,
    mcp_profile_unlink,
    mcp_profile_unlink_error,
    mcp_profile_unlink_success,
    mcp_profile_unlinking,
    mcp_profile_upgrade_button,
    mcp_profile_upgrade_description,
    mcp_profile_upgrade_title,
    mcp_profile_working,
    mcp_profile_created_expires,
  } from "$lib/paraglide/messages.js";
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

  $: currentLocale = extractLocaleFromUrl($page.url) ?? baseLocale;
  $: pricingHref = localizedHref("/pricing", currentLocale);
  $: if (initialAccount !== loadedAccount) {
    loadedAccount = initialAccount;
    account = initialAccount;
    rawToken =
      typeof actionData?.mcpRawToken === "string"
        ? actionData.mcpRawToken
        : null;
  }

  const displayDate = (value: string) =>
    new Intl.DateTimeFormat(currentLocale, { dateStyle: "medium" }).format(
      new Date(value),
    );

  const actionError = (code: unknown, fallback: () => string) => {
    if (code === "sign_in") return mcp_profile_sign_in();
    if (code === "pro_required") return mcp_profile_pro_required();
    if (code === "unavailable") return mcp_profile_temporarily_unavailable();
    return fallback();
  };

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(mcp_profile_copy_success({ label }));
    } catch {
      toast.error(mcp_profile_copy_error({ label }));
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
        toast.success(mcp_profile_token_generated());
      } else {
        toast.error(
          actionError(result.data?.mcpErrorCode, mcp_profile_generate_error),
        );
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
        toast.success(mcp_profile_revoke_success());
      } else {
        toast.error(
          actionError(result.data?.mcpErrorCode, mcp_profile_revoke_error),
        );
      }
    };
  };

  const enhanceUnlink = () => {
    busyAction = "unlink";
    return async ({ result }: { result: any }) => {
      busyAction = null;
      if (result.type === "success" && result.data?.mcpOAuthUnlinked) {
        if (account) account = { ...account, oauth: null };
        toast.success(mcp_profile_unlink_success());
      } else {
        toast.error(
          actionError(result.data?.mcpErrorCode, mcp_profile_unlink_error),
        );
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
  <div class="p-5 sm:p-6">
    <div class="flex items-center gap-2">
      <h2 class="type-h2 text-fg">{mcp_profile_title()}</h2>
      {#if isPro}
        <span
          class="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-300"
          >{mcp_profile_pro()}</span
        >
      {/if}
    </div>
    <p class="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
      {mcp_profile_description()}
    </p>
  </div>

  {#if !isPro}
    <div class="border-t border-line bg-surface-raised/40 p-5 sm:p-6">
      <p class="font-medium text-fg">{mcp_profile_upgrade_title()}</p>
      <p class="mt-1 max-w-2xl text-sm leading-6 text-fg-muted">
        {mcp_profile_upgrade_description()}
      </p>
      <a
        class="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
        href={pricingHref}>{mcp_profile_upgrade_button()}</a
      >
    </div>
  {:else if unavailable}
    <div class="border-t border-line p-5 sm:p-6">
      <p class="text-sm text-fg-muted">{mcp_profile_unavailable()}</p>
    </div>
  {:else if account}
    <div class="border-t border-line p-5 sm:p-6">
      <p class="text-xs font-semibold uppercase tracking-wide text-fg-muted">
        {mcp_endpoint()}
      </p>
      <div class="mt-2 flex min-w-0 items-center gap-2">
        <code
          class="min-w-0 flex-1 truncate rounded-lg bg-surface-raised px-3 py-2 text-xs sm:text-sm"
          >{STOCKNEAR_MCP_ENDPOINT}</code
        >
        <button
          class="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fg transition hover:border-violet-400 hover:text-violet-700 dark:hover:border-violet-600 dark:hover:text-violet-300"
          type="button"
          onclick={() => copy(STOCKNEAR_MCP_ENDPOINT, mcp_endpoint())}
          >{mcp_copy()}</button
        >
      </div>
      <p class="mt-3 text-xs text-fg-muted">{mcp_profile_limit()}</p>
    </div>

    {#if rawToken}
      <div
        class="border-t border-violet-200 bg-violet-50/70 p-5 dark:border-violet-800/60 dark:bg-violet-950/20 sm:p-6"
      >
        <p class="font-medium text-fg">{mcp_profile_token_copy_title()}</p>
        <p class="mt-1 text-sm text-fg-muted">
          {mcp_profile_token_copy_description()}
        </p>
        <div class="mt-3 flex flex-col gap-2 sm:flex-row">
          <code
            class="min-w-0 flex-1 break-all rounded-lg border border-violet-200 bg-surface-card px-3 py-2 text-sm dark:border-violet-800/60"
            >{rawToken}</code
          >
          <button
            class="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-line bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-300"
            type="button"
            onclick={() => copy(rawToken!, mcp_profile_token_title())}
            >{mcp_profile_copy_token()}</button
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
            <h3 class="font-semibold text-fg">{mcp_profile_token_title()}</h3>
            {#if account.token}
              <span
                class={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  account.token.status === "active"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
                }`}
              >
                {account.token.status === "active"
                  ? mcp_profile_status_active()
                  : mcp_profile_status_expired()}
              </span>
            {/if}
          </div>
          {#if account.token}
            <p class="mt-2 font-mono text-sm text-fg">
              {account.token.prefix}…
            </p>
            <p class="mt-1 text-xs text-fg-muted">
              {mcp_profile_created_expires({
                created: displayDate(account.token.createdAt),
                expires: displayDate(account.token.expiresAt),
              })}
            </p>
          {:else}
            <p class="mt-2 text-sm text-fg-muted">
              {mcp_profile_no_token()}
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
              confirmTokenChange(event, mcp_profile_confirm_rotate())}
          >
            <button
              class="inline-flex min-h-10 items-center justify-center rounded-full border border-line bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-300"
              type="submit"
              disabled={busyAction !== null}
            >
              {busyAction === "generate"
                ? mcp_profile_working()
                : account.token
                  ? mcp_profile_rotate()
                  : mcp_profile_generate()}
            </button>
          </form>
          {#if account.token}
            <form
              method="POST"
              action="?/revokeMcpToken"
              use:enhance={enhanceRevoke}
              onsubmit={(event) =>
                confirmTokenChange(event, mcp_profile_confirm_revoke())}
            >
              <button
                class="inline-flex min-h-10 items-center justify-center rounded-full border border-line bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25 dark:focus-visible:ring-red-500/50"
                type="submit"
                disabled={busyAction !== null}
                >{busyAction === "revoke"
                  ? mcp_profile_revoking()
                  : mcp_profile_revoke()}</button
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
          <h3 class="font-semibold text-fg">{mcp_profile_oauth_title()}</h3>
          <p class="mt-1 text-xs text-fg-muted">
            {mcp_profile_oauth_linked({
              date: displayDate(account.oauth.linkedAt),
              issuer: account.oauth.issuer,
            })}
          </p>
        </div>
        <form
          method="POST"
          action="?/unlinkMcpOAuth"
          use:enhance={enhanceUnlink}
          onsubmit={(event) =>
            confirmTokenChange(event, mcp_profile_confirm_unlink())}
        >
          <button
            class="inline-flex min-h-10 items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-fg transition hover:border-violet-400 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-violet-600 dark:hover:text-violet-300"
            type="submit"
            disabled={busyAction !== null}
            >{busyAction === "unlink"
              ? mcp_profile_unlinking()
              : mcp_profile_unlink()}</button
          >
        </form>
      </div>
    {/if}
  {/if}
</section>
