<script lang="ts">
  import { enhance } from "$app/forms";
  import {
    mcp_oauth_approve,
    mcp_oauth_approving,
    mcp_oauth_brand,
    mcp_oauth_callback_host,
    mcp_oauth_cancel,
    mcp_oauth_client_details,
    mcp_oauth_client_id,
    mcp_oauth_client_source,
    mcp_oauth_description,
    mcp_oauth_error_invalid,
    mcp_oauth_error_pro,
    mcp_oauth_error_unavailable,
    mcp_oauth_permissions,
    mcp_oauth_signed_in_as,
    mcp_oauth_source_cimd,
    mcp_oauth_source_dcr,
    mcp_oauth_source_predefined,
    mcp_oauth_title,
    mcp_oauth_unverified_client,
    mcp_oauth_unverified_description,
    mcp_profile_upgrade_button,
  } from "$lib/paraglide/messages.js";

  export let data;
  export let form;
  let busy: "approve" | "deny" | null = null;
  $: approveAction = data.request
    ? `?/approve&request=${encodeURIComponent(data.request)}`
    : "";
  $: denyAction = data.request
    ? `?/deny&request=${encodeURIComponent(data.request)}`
    : "";
  $: oauthError =
    form?.oauthError ??
    data.oauthPageError ??
    (data.authorization && !data.canApprove ? "pro_required" : null);
  $: errorMessage =
    oauthError === "pro_required"
      ? mcp_oauth_error_pro()
      : oauthError === "invalid_request"
        ? mcp_oauth_error_invalid()
        : oauthError
          ? mcp_oauth_error_unavailable()
          : "";
  $: isUnverifiedClient =
    data.authorization?.clientSource === "dcr" ||
    data.authorization?.clientSource === "cimd";
  $: clientSourceLabel =
    data.authorization?.clientSource === "predefined"
      ? mcp_oauth_source_predefined()
      : data.authorization?.clientSource === "dcr"
        ? mcp_oauth_source_dcr()
        : mcp_oauth_source_cimd();

  const enhanceDecision = (decision: "approve" | "deny") => () => {
    busy = decision;
    return async ({ result, update }) => {
      if (result.type === "redirect") {
        window.location.assign(result.location);
        return;
      }
      busy = null;
      await update({ reset: false });
    };
  };
</script>

<svelte:head>
  <title
    >{mcp_oauth_title({
      client: data.authorization?.clientName ?? mcp_oauth_brand(),
    })} | {mcp_oauth_brand()}</title
  >
  <meta name="robots" content="noindex,nofollow" />
  <meta name="referrer" content="no-referrer" />
</svelte:head>

<div
  class="flex min-h-screen items-center justify-center bg-surface-page px-4 py-10 text-fg"
>
  <section
    class="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface-card shadow-lg"
  >
    <div class="border-b border-line p-6 text-center sm:p-8">
      <a
        href="/"
        data-sveltekit-reload
        aria-label={mcp_oauth_brand()}
        class="inline-flex items-center gap-3"
      >
        <img class="h-11 w-11 rounded-full" src="/pwa-192x192.png" alt="" />
        <span class="text-xl font-semibold">{mcp_oauth_brand()}</span>
      </a>
      <h1 class="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        {mcp_oauth_title({
          client: data.authorization?.clientName ?? mcp_oauth_brand(),
        })}
      </h1>
      {#if data.authorization}
        <p class="mt-3 text-sm leading-6 text-fg-muted">
          {mcp_oauth_description({ client: data.authorization.clientName })}
        </p>
      {/if}
    </div>
    <div class="p-6 sm:p-8">
      {#if data.authorization}
        {#if isUnverifiedClient}
          <div
            class="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
          >
            <p class="text-sm font-semibold">
              {mcp_oauth_unverified_client()}
            </p>
            <p class="mt-1 text-xs leading-5">
              {mcp_oauth_unverified_description()}
            </p>
          </div>
        {/if}
        <div class="rounded-xl border border-line bg-surface-raised p-4">
          <p
            class="text-xs font-semibold uppercase tracking-wide text-fg-muted"
          >
            {mcp_oauth_client_details()}
          </p>
          <dl class="mt-3 grid gap-3 text-sm">
            <div>
              <dt class="text-xs text-fg-muted">
                {mcp_oauth_callback_host()}
              </dt>
              <dd class="mt-1 break-all font-mono">
                {data.authorization.redirectHost}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-fg-muted">
                {mcp_oauth_client_id()}
              </dt>
              <dd class="mt-1 break-all font-mono text-xs">
                {data.authorization.clientId}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-fg-muted">
                {mcp_oauth_client_source()}
              </dt>
              <dd class="mt-1" class:font-semibold={isUnverifiedClient}>
                {clientSourceLabel}
              </dd>
            </div>
          </dl>
        </div>
        <div class="rounded-xl bg-surface-raised p-4">
          <p
            class="text-xs font-semibold uppercase tracking-wide text-fg-muted"
          >
            {mcp_oauth_permissions()}
          </p>
          <p class="mt-2 text-sm leading-6 text-fg">
            {data.authorization.scopes.join(", ")}
          </p>
        </div>
        <p class="mt-4 text-xs text-fg-muted">
          {mcp_oauth_signed_in_as({ email: data.userEmail })}
        </p>
      {/if}
      {#if errorMessage}
        <p
          class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
          role="alert"
        >
          {errorMessage}
        </p>
      {/if}
      {#if data.authorization}
        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <form
            method="POST"
            action={denyAction}
            use:enhance={enhanceDecision("deny")}
            class="flex-1"
          >
            <button
              type="submit"
              disabled={busy !== null}
              class="min-h-11 w-full cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
              >{mcp_oauth_cancel()}</button
            >
          </form>
          {#if data.canApprove}
            <form
              method="POST"
              action={approveAction}
              use:enhance={enhanceDecision("approve")}
              class="flex-1"
            >
              <button
                type="submit"
                disabled={busy !== null}
                class="min-h-11 w-full cursor-pointer rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200"
                >{busy === "approve"
                  ? mcp_oauth_approving()
                  : mcp_oauth_approve()}</button
              >
            </form>
          {:else}
            <a
              href="/pricing"
              data-sveltekit-reload
              class="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200"
            >
              {mcp_profile_upgrade_button()}
            </a>
          {/if}
        </div>
      {/if}
    </div>
  </section>
</div>
