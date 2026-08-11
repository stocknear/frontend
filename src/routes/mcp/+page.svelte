<script lang="ts">
  import { page } from "$app/stores";
  import SEO from "$lib/components/SEO.svelte";
  import {
    MCP_CLIENTS,
    MCP_QUICK_CONNECT_CLIENTS,
    STOCKNEAR_MCP_ENDPOINT,
  } from "$lib/mcpGuide";
  import { localizedHref } from "$lib/i18n/navigation";
  import { baseLocale, extractLocaleFromUrl } from "$lib/paraglide/runtime.js";
  import claudeLogo from "$lib/images/mcp/claude.svg";
  import cursorLogo from "$lib/images/mcp/cursor.svg";
  import vscodeLogo from "$lib/images/mcp/vscode.svg";
  import grokLogo from "$lib/images/mcp/grok.svg";
  import type { PublicMcpTool } from "./+page.server";
  import {
    mcp_badge,
    mcp_category_analyst,
    mcp_category_company,
    mcp_category_financials,
    mcp_category_flow,
    mcp_category_lists,
    mcp_category_market,
    mcp_category_options,
    mcp_category_other,
    mcp_category_platform,
    mcp_category_quote,
    mcp_clients_description,
    mcp_clients_title,
    mcp_configuration,
    mcp_copied,
    mcp_copy,
    mcp_copy_failed,
    mcp_cta_button,
    mcp_cta_description,
    mcp_cta_title,
    mcp_example_1,
    mcp_example_2,
    mcp_example_3,
    mcp_example_4,
    mcp_example_5,
    mcp_example_6,
    mcp_examples_description,
    mcp_examples_title,
    mcp_existing_description,
    mcp_existing_title,
    mcp_get_token,
    mcp_hero_description,
    mcp_hero_title,
    mcp_install,
    mcp_merged_example,
    mcp_open_settings,
    mcp_other_clients,
    mcp_quick_description,
    mcp_quick_fallback,
    mcp_quick_title,
    mcp_security_description,
    mcp_security_title,
    mcp_seo_description,
    mcp_seo_title,
    mcp_setup_title,
    mcp_stat_concurrency,
    mcp_stat_rate,
    mcp_stat_setup,
    mcp_stat_tools,
    mcp_step_1_description,
    mcp_step_1_title,
    mcp_step_2_description,
    mcp_step_2_title,
    mcp_step_3_description,
    mcp_step_3_title,
    mcp_tools_count,
    mcp_tools_description,
    mcp_tools_title,
    mcp_tools_unavailable,
    mcp_uses,
    mcp_verify_description,
    mcp_verify_title,
  } from "$lib/paraglide/messages.js";

  export let data: { mcpTools: PublicMcpTool[] };

  const quickConnectLogos = {
    claude: claudeLogo,
    cursor: cursorLogo,
    vscode: vscodeLogo,
    grok: grokLogo,
  } as const;
  const categoryOrder = [
    "market",
    "quote",
    "company",
    "financials",
    "analyst",
    "options",
    "flow",
    "lists",
    "platform",
  ];
  const categoryLabels = {
    analyst: mcp_category_analyst,
    company: mcp_category_company,
    financials: mcp_category_financials,
    flow: mcp_category_flow,
    lists: mcp_category_lists,
    market: mcp_category_market,
    options: mcp_category_options,
    platform: mcp_category_platform,
    quote: mcp_category_quote,
  } as const;
  const examples = [
    {
      text: mcp_example_1,
      tools: ["get_ticker_income_statement", "get_ticker_ratios_statement"],
    },
    { text: mcp_example_2, tools: ["get_latest_options_flow_feed"] },
    {
      text: mcp_example_3,
      tools: [
        "get_ticker_earnings_call_transcripts",
        "get_ticker_analyst_rating",
      ],
    },
    { text: mcp_example_4, tools: ["get_earnings_releases"] },
    {
      text: mcp_example_5,
      tools: ["get_most_shorted_stocks", "get_ticker_financial_score"],
    },
    {
      text: mcp_example_6,
      tools: ["get_all_sector_overview", "get_fear_and_greed_index"],
    },
  ];

  let selectedId = MCP_CLIENTS[0].id;
  let copied = "";
  let copyFailed = false;

  $: selectedClient =
    MCP_CLIENTS.find((client) => client.id === selectedId) ?? MCP_CLIENTS[0];
  $: currentLocale = extractLocaleFromUrl($page.url) ?? baseLocale;
  $: profileHref = `${localizedHref("/profile", currentLocale)}#mcp-access`;
  $: toolGroups = Object.entries(
    (data?.mcpTools ?? []).reduce<Record<string, PublicMcpTool[]>>(
      (groups, tool) => {
        (groups[tool.category] ??= []).push(tool);
        return groups;
      },
      {},
    ),
  ).sort(
    ([left], [right]) =>
      (categoryOrder.indexOf(left) < 0 ? 999 : categoryOrder.indexOf(left)) -
        (categoryOrder.indexOf(right) < 0
          ? 999
          : categoryOrder.indexOf(right)) || left.localeCompare(right),
  );
  $: structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: mcp_hero_title(),
    description: mcp_seo_description(),
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: mcp_step_1_title(),
        text: mcp_step_1_description(),
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: mcp_step_2_title(),
        text: mcp_step_2_description(),
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: mcp_step_3_title(),
        text: mcp_step_3_description(),
      },
    ],
  };

  const categoryLabel = (category: string) =>
    categoryLabels[category as keyof typeof categoryLabels]?.() ??
    mcp_category_other();
  const clientName = (id: string, name: string) =>
    id === "generic" ? mcp_other_clients() : name;

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      copied = label;
      copyFailed = false;
      window.setTimeout(() => {
        if (copied === label) copied = "";
      }, 1800);
    } catch {
      copied = "";
      copyFailed = true;
    }
  }
</script>

<SEO
  title={mcp_seo_title()}
  description={mcp_seo_description()}
  canonicalPath="/mcp"
  {structuredData}
/>

<main
  class="mx-auto w-full max-w-7xl px-4 py-10 text-fg sm:px-6 sm:py-14 lg:px-8"
>
  <section
    class="grid items-center gap-10 border-b border-line pb-14 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 lg:pb-20"
  >
    <div>
      <span
        class="inline-flex rounded-control bg-violet-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-800 dark:bg-violet-500/15 dark:text-violet-300"
      >
        {mcp_badge()}
      </span>
      <h1
        class="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
      >
        {mcp_hero_title()}
      </h1>
      <p class="mt-5 max-w-2xl text-base leading-7 text-fg-muted sm:text-lg">
        {mcp_hero_description()}
      </p>
      <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          class="inline-flex min-h-11 items-center justify-center rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:border dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:bg-violet-500/25"
          href={profileHref}
        >
          {mcp_get_token()}
        </a>
        <button
          class="inline-flex min-h-11 min-w-0 cursor-pointer items-center justify-between gap-3 rounded-full border border-line bg-surface-card px-4 py-2.5 text-left text-sm transition hover:border-violet-300 dark:hover:border-violet-700 sm:max-w-md"
          type="button"
          onclick={() => copy("endpoint", STOCKNEAR_MCP_ENDPOINT)}
        >
          <span class="truncate font-mono text-xs"
            >{STOCKNEAR_MCP_ENDPOINT}</span
          >
          <span class="shrink-0 font-semibold text-accent"
            >{copied === "endpoint" ? mcp_copied() : mcp_copy()}</span
          >
        </button>
      </div>
    </div>

    <dl class="grid grid-cols-2 gap-3">
      {#each [{ value: data?.mcpTools?.length || "—", label: mcp_stat_tools() }, { value: "120", label: mcp_stat_rate() }, { value: "4", label: mcp_stat_concurrency() }, { value: "<30s", label: mcp_stat_setup() }] as stat}
        <div
          class="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-line bg-surface-card p-5 text-center sm:min-h-40"
        >
          <dt
            class="order-2 mt-2 text-xs font-medium uppercase tracking-[0.1em] text-fg-muted"
          >
            {stat.label}
          </dt>
          <dd class="order-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {stat.value}
          </dd>
        </div>
      {/each}
    </dl>
  </section>

  <p class="sr-only" aria-live="polite">
    {copyFailed ? mcp_copy_failed() : copied ? mcp_copied() : ""}
  </p>
  {#if copyFailed}<p class="mt-3 text-sm text-error" role="alert">
      {mcp_copy_failed()}
    </p>{/if}

  <section
    class="border-b border-line py-14 lg:py-20"
    aria-labelledby="setup-heading"
  >
    <h2
      id="setup-heading"
      class="text-center text-3xl font-semibold tracking-tight sm:text-4xl"
    >
      {mcp_setup_title()}
    </h2>
    <ol class="mt-8 grid gap-4 md:grid-cols-3">
      {#each [{ title: mcp_step_1_title(), description: mcp_step_1_description() }, { title: mcp_step_2_title(), description: mcp_step_2_description() }, { title: mcp_step_3_title(), description: mcp_step_3_description() }] as step, index}
        <li class="rounded-2xl border border-line bg-surface-card p-6">
          <span
            class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white dark:border dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300"
            >{index + 1}</span
          >
          <h3 class="mt-5 text-lg font-semibold">{step.title}</h3>
          <p class="mt-2 text-sm leading-6 text-fg-muted">{step.description}</p>
        </li>
      {/each}
    </ol>
  </section>

  <section
    class="border-b border-line py-14 lg:py-20"
    aria-labelledby="quick-connect-heading"
  >
    <div class="max-w-2xl">
      <h2
        id="quick-connect-heading"
        class="text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {mcp_quick_title()}
      </h2>
      <p class="mt-3 text-sm leading-6 text-fg-muted sm:text-base">
        {mcp_quick_description()}
      </p>
    </div>
    <div class="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {#each MCP_QUICK_CONNECT_CLIENTS as client}
        <a
          class="group flex min-h-28 items-center gap-4 rounded-2xl border border-line bg-surface-card p-4 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:border-violet-700"
          href={client.href}
          target="_blank"
          rel="noreferrer"
        >
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-white p-2.5"
          >
            <img
              class="h-full w-full"
              src={quickConnectLogos[client.id]}
              alt=""
              aria-hidden="true"
            />
          </span>
          <span class="min-w-0">
            <span class="block truncate font-semibold">{client.name}</span>
            <span class="mt-1 block text-sm font-medium text-accent"
              >{client.behavior === "install"
                ? mcp_install()
                : mcp_open_settings()} <span aria-hidden="true">↗</span></span
            >
          </span>
        </a>
      {/each}
    </div>
    <p class="mt-4 max-w-3xl text-xs leading-5 text-fg-muted">
      {mcp_quick_fallback()}
    </p>
  </section>

  <section
    class="border-b border-line py-14 lg:py-20"
    aria-labelledby="client-heading"
  >
    <div class="max-w-2xl">
      <h2
        id="client-heading"
        class="text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {mcp_clients_title()}
      </h2>
      <p class="mt-3 text-sm leading-6 text-fg-muted sm:text-base">
        {mcp_clients_description()}
      </p>
    </div>
    <div
      class="mt-6 flex gap-2 overflow-x-auto pb-2"
      role="tablist"
      aria-label={mcp_clients_title()}
    >
      {#each MCP_CLIENTS as client}
        <button
          id={`client-tab-${client.id}`}
          class={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
            selectedId === client.id
              ? "border-violet-600 bg-violet-600 text-white dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300"
              : "border-line bg-surface-card"
          }`}
          type="button"
          role="tab"
          aria-selected={selectedId === client.id}
          aria-controls="client-panel"
          onclick={() => (selectedId = client.id)}
          >{clientName(client.id, client.name)}</button
        >
      {/each}
    </div>
    <div
      id="client-panel"
      class="mt-3 max-w-5xl overflow-hidden rounded-2xl border border-line bg-surface-card"
      role="tabpanel"
      aria-labelledby={`client-tab-${selectedClient.id}`}
      tabindex="0"
    >
      <div
        class="flex items-center justify-between gap-3 border-b border-line p-4 sm:p-5"
      >
        <h3 class="font-semibold">
          {clientName(selectedClient.id, selectedClient.name)}
        </h3>
        <span
          class="rounded-full border border-line px-2.5 py-1 text-xs font-semibold uppercase text-fg-muted"
          >{selectedClient.format}</span
        >
      </div>
      <div class="min-w-0 bg-zinc-950 p-4 text-zinc-100">
        <div class="mb-3 flex items-center justify-between">
          <span
            class="text-xs font-medium uppercase tracking-wide text-zinc-400"
            >{mcp_configuration()}</span
          >
          <button
            class="cursor-pointer rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
            type="button"
            onclick={() =>
              copy(`client-${selectedClient.id}`, selectedClient.config)}
            >{copied === `client-${selectedClient.id}`
              ? mcp_copied()
              : mcp_copy()}</button
          >
        </div>
        <pre
          class="max-h-80 min-w-0 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-6 [overflow-wrap:anywhere] sm:text-sm"><code
            >{selectedClient.config}</code
          ></pre>
      </div>
      <div class="grid gap-5 p-5 sm:grid-cols-2">
        <div>
          <h4 class="text-sm font-semibold">{mcp_security_title()}</h4>
          <p class="mt-2 text-sm leading-6 text-fg-muted">
            {mcp_security_description()}
          </p>
        </div>
        <div>
          <h4 class="text-sm font-semibold">{mcp_verify_title()}</h4>
          <p class="mt-2 text-sm leading-6 text-fg-muted">
            {mcp_verify_description()}
          </p>
        </div>
      </div>
    </div>
    {#if selectedClient.mergeConfig}
      <details
        class="mt-3 max-w-5xl rounded-2xl border border-line bg-surface-card p-5"
      >
        <summary class="cursor-pointer font-medium"
          >{mcp_existing_title()}</summary
        >
        <p class="mt-3 text-sm leading-6 text-fg-muted">
          {mcp_existing_description()}
        </p>
        <div class="mt-3 rounded-xl bg-zinc-950 p-4 text-zinc-100">
          <div class="mb-3 flex items-center justify-between">
            <span
              class="text-xs font-medium uppercase tracking-wide text-zinc-400"
              >{mcp_merged_example()}</span
            ><button
              class="cursor-pointer rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              type="button"
              onclick={() =>
                copy(`merge-${selectedClient.id}`, selectedClient.mergeConfig!)}
              >{mcp_copy()}</button
            >
          </div>
          <pre
            class="max-h-80 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-6 [overflow-wrap:anywhere]"><code
              >{selectedClient.mergeConfig}</code
            ></pre>
        </div>
      </details>
    {/if}
  </section>

  <section
    class="border-b border-line py-14 lg:py-20"
    aria-labelledby="tools-heading"
  >
    <div class="rounded-2xl border border-line bg-surface-card">
      <div
        class="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-end sm:p-7"
      >
        <div class="max-w-3xl">
          <h2
            id="tools-heading"
            class="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {mcp_tools_title()}
          </h2>
          <p class="mt-3 text-sm leading-6 text-fg-muted sm:text-base">
            {mcp_tools_description()}
          </p>
        </div>
        {#if data?.mcpTools?.length}<span
            class="shrink-0 text-sm font-medium text-fg-muted"
            >{mcp_tools_count({ count: data.mcpTools.length })}</span
          >{/if}
      </div>
      {#if toolGroups.length}
        <div class="grid gap-0 lg:grid-cols-2">
          {#each toolGroups as [category, tools], index}
            <div
              class="border-line p-5 sm:p-7"
              class:border-t={index > 0}
              class:lg:border-t={index > 1}
              class:lg:border-l={index % 2 === 1}
            >
              <div class="mb-4 flex items-center justify-between gap-3">
                <h3 class="font-semibold">{categoryLabel(category)}</h3>
                <span class="text-xs text-fg-muted">{tools.length}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                {#each tools as tool}<code
                    class="max-w-full break-all rounded-control bg-surface-raised px-2.5 py-1.5 text-xs text-accent"
                    >{tool.name}</code
                  >{/each}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="p-6 text-sm text-fg-muted sm:p-8">
          {mcp_tools_unavailable()}
        </p>
      {/if}
    </div>
  </section>

  <section class="py-14 lg:py-20" aria-labelledby="examples-heading">
    <div class="text-center">
      <h2
        id="examples-heading"
        class="text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {mcp_examples_title()}
      </h2>
      <p
        class="mx-auto mt-3 max-w-3xl text-sm leading-6 text-fg-muted sm:text-base"
      >
        {mcp_examples_description()}
      </p>
    </div>
    <div class="mt-8 grid gap-4 md:grid-cols-2">
      {#each examples as example}
        <article
          class="rounded-2xl border border-line bg-surface-card p-5 sm:p-6"
        >
          <p class="font-medium leading-6">“{example.text()}”</p>
          <p class="mt-4 break-words text-xs leading-5 text-fg-muted">
            <span class="font-semibold">{mcp_uses()}:</span>
            {example.tools.join(", ")}
          </p>
        </article>
      {/each}
    </div>
  </section>

  <section
    class="rounded-2xl border border-line bg-surface-card px-6 py-10 text-center sm:px-10 sm:py-12"
  >
    <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
      {mcp_cta_title()}
    </h2>
    <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-fg-muted">
      {mcp_cta_description()}
    </p>
    <a
      class="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 dark:border dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:bg-violet-500/25"
      href={profileHref}>{mcp_cta_button()}</a
    >
  </section>
</main>
