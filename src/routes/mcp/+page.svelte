<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import {
    MCP_CLIENTS,
    MCP_HOW_TO,
    MCP_QUICK_CONNECT_CLIENTS,
    STOCKNEAR_MCP_ENDPOINT,
  } from "$lib/mcpGuide";
  import stocknearLogo from "$lib/images/stocknear_logo.png";
  import claudeLogo from "$lib/images/mcp/claude.svg";
  import cursorLogo from "$lib/images/mcp/cursor.svg";
  import vscodeLogo from "$lib/images/mcp/vscode.svg";
  import grokLogo from "$lib/images/mcp/grok.svg";

  const quickConnectLogos = {
    claude: claudeLogo,
    cursor: cursorLogo,
    vscode: vscodeLogo,
    grok: grokLogo,
  } as const;

  let selectedId = MCP_CLIENTS[0].id;
  let copied = "";
  let copyFailed = false;

  $: selectedClient =
    MCP_CLIENTS.find((client) => client.id === selectedId) ?? MCP_CLIENTS[0];

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
  title="Stocknear MCP setup guide"
  description="Connect Stocknear market research tools to Claude Code, Cursor, VS Code, Gemini CLI, OpenCode, Hermes, and other MCP clients."
  canonicalPath="/mcp"
  contentLocales={["en"]}
  structuredData={MCP_HOW_TO}
/>

<main class="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
  <section
    class="overflow-hidden rounded-3xl border border-line bg-surface-card"
  >
    <div class="p-7 sm:p-10">
      <div
        class="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent"
      >
        <span>Stocknear MCP</span>
        <span aria-hidden="true" class="h-1 w-1 rounded-full bg-accent"></span>
        <span>Pro</span>
      </div>
      <h1
        class="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-fg sm:text-5xl"
      >
        Stock market data in your AI client
      </h1>
      <p class="mt-4 max-w-2xl text-base leading-7 text-fg-muted sm:text-lg">
        Connect once and use Stocknear's research tools from Claude Code,
        Cursor, VS Code, Gemini CLI, OpenCode, Hermes, or any Streamable HTTP
        MCP client.
      </p>

      <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a class="btn btn-primary" href="/profile#mcp-access"
          >Get your MCP token</a
        >
        <button
          class="btn btn-outline justify-between gap-3 font-mono text-xs normal-case sm:max-w-md"
          type="button"
          onclick={() => copy("endpoint", STOCKNEAR_MCP_ENDPOINT)}
        >
          <span class="truncate">{STOCKNEAR_MCP_ENDPOINT}</span>
          <span class="font-sans font-medium"
            >{copied === "endpoint" ? "Copied" : "Copy"}</span
          >
        </button>
      </div>
    </div>
    <div
      class="grid border-t border-line bg-surface-raised/50 sm:grid-cols-3 sm:divide-x sm:divide-line"
    >
      <div class="p-4 sm:px-6">
        <p class="text-xs text-fg-muted">Transport</p>
        <p class="mt-1 text-sm font-medium">Streamable HTTP</p>
      </div>
      <div class="border-t border-line p-4 sm:border-t-0 sm:px-6">
        <p class="text-xs text-fg-muted">Rate limit</p>
        <p class="mt-1 text-sm font-medium">120 tool calls / rolling minute</p>
      </div>
      <div class="border-t border-line p-4 sm:border-t-0 sm:px-6">
        <p class="text-xs text-fg-muted">Concurrency</p>
        <p class="mt-1 text-sm font-medium">4 active calls per user</p>
      </div>
    </div>
  </section>

  <p class="sr-only" aria-live="polite">
    {copyFailed
      ? "Copy failed. Select and copy the text manually."
      : copied
        ? "Copied to clipboard."
        : ""}
  </p>
  {#if copyFailed}
    <p class="mt-3 text-sm text-error" role="alert">
      Copy failed. Select and copy the text manually.
    </p>
  {/if}

  <section class="mt-12" aria-labelledby="quick-connect-heading">
    <div
      class="relative overflow-hidden rounded-3xl border border-line bg-zinc-950 text-white shadow-2xl shadow-black/10"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,194,164,0.24),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_38%)]"
        aria-hidden="true"
      ></div>

      <div class="relative p-6 sm:p-8">
        <div
          class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <span
              class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white"
            >
              <img
                class="h-11 w-11 object-contain"
                src={stocknearLogo}
                alt="Stocknear"
              />
            </span>
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300"
              >
                One-click setup
              </p>
              <h2
                id="quick-connect-heading"
                class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                Open Stocknear in your client
              </h2>
            </div>
          </div>
          <p class="max-w-sm text-sm leading-6 text-zinc-300">
            Install links include only the public server address. Your client
            handles authentication securely after you approve the connection.
          </p>
        </div>

        <div class="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {#each MCP_QUICK_CONNECT_CLIENTS as client}
            <a
              class="group flex min-h-36 flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              href={client.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${client.action} (${client.name}, opens in a new tab or app)`}
            >
              <div class="flex items-center justify-between gap-3">
                <img
                  class="h-10 w-10 rounded-xl"
                  src={quickConnectLogos[client.id]}
                  alt=""
                  aria-hidden="true"
                />
                <span
                  class="rounded-full border border-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300"
                >
                  {client.behavior === "install" ? "Install" : "Settings"}
                </span>
              </div>
              <span class="mt-4 font-semibold">{client.name}</span>
              <span class="mt-1 text-xs leading-5 text-zinc-400"
                >{client.note}</span
              >
              <span
                class="mt-auto pt-3 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200"
              >
                {client.action} <span aria-hidden="true">↗</span>
              </span>
            </a>
          {/each}
        </div>
      </div>

      <div
        class="relative border-t border-white/10 bg-black/20 px-6 py-5 sm:px-8"
      >
        <h3 class="text-sm font-semibold">If the link does not open</h3>
        <p class="mt-1 text-sm leading-6 text-zinc-300">
          Choose the matching manual guide below and copy
          <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white"
            >{STOCKNEAR_MCP_ENDPOINT}</code
          >. Sign in with OAuth when the client offers it, or generate a PAT in
          your Profile and keep it in the client's secret store. Never put a
          token in an install URL.
        </p>
      </div>
    </div>
  </section>

  <section class="mt-12" aria-labelledby="setup-heading">
    <div class="max-w-2xl">
      <p class="text-sm font-semibold text-accent">Three steps</p>
      <h2
        id="setup-heading"
        class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
      >
        Connect in under 30 seconds
      </h2>
    </div>

    <ol class="mt-6 grid gap-3 md:grid-cols-3">
      <li class="rounded-2xl border border-line bg-surface-card p-5">
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent"
          >1</span
        >
        <h3 class="mt-4 font-semibold">Generate a token</h3>
        <p class="mt-2 text-sm leading-6 text-fg-muted">
          Open your Profile, generate a personal MCP token, and copy it when it
          appears. It is shown once.
        </p>
      </li>
      <li class="rounded-2xl border border-line bg-surface-card p-5">
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent"
          >2</span
        >
        <h3 class="mt-4 font-semibold">Add Stocknear</h3>
        <p class="mt-2 text-sm leading-6 text-fg-muted">
          Choose your client below and use its exact command or configuration.
          Existing MCP servers stay untouched.
        </p>
      </li>
      <li class="rounded-2xl border border-line bg-surface-card p-5">
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent"
          >3</span
        >
        <h3 class="mt-4 font-semibold">Ask a market question</h3>
        <p class="mt-2 text-sm leading-6 text-fg-muted">
          Restart or refresh the client, then ask it to retrieve the latest AAPL
          quote.
        </p>
      </li>
    </ol>
  </section>

  <section class="mt-12" aria-labelledby="client-heading">
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p class="text-sm font-semibold text-accent">Client setup</p>
        <h2
          id="client-heading"
          class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Choose your client
        </h2>
      </div>
      <p class="text-sm text-fg-muted">
        Endpoint: <code>{STOCKNEAR_MCP_ENDPOINT}</code>
      </p>
    </div>

    <div
      class="mt-5 flex gap-2 overflow-x-auto pb-2"
      role="tablist"
      aria-label="MCP clients"
    >
      {#each MCP_CLIENTS as client}
        <button
          class="btn btn-sm shrink-0"
          class:btn-primary={selectedId === client.id}
          class:btn-outline={selectedId !== client.id}
          type="button"
          role="tab"
          aria-selected={selectedId === client.id}
          aria-controls="client-panel"
          onclick={() => (selectedId = client.id)}>{client.name}</button
        >
      {/each}
    </div>

    <div
      id="client-panel"
      class="mt-3 overflow-hidden rounded-2xl border border-line bg-surface-card"
      role="tabpanel"
    >
      <div
        class="flex flex-col justify-between gap-2 border-b border-line p-5 sm:flex-row sm:items-center"
      >
        <div>
          <h3 class="font-semibold">{selectedClient.name}</h3>
          <p class="mt-1 text-sm text-fg-muted">
            Add to <code>{selectedClient.location}</code>
          </p>
        </div>
        <span class="badge badge-outline uppercase"
          >{selectedClient.format}</span
        >
      </div>

      <div class="bg-zinc-950 p-4 text-zinc-100 sm:p-5">
        <div class="mb-3 flex items-center justify-between">
          <span
            class="text-xs font-medium uppercase tracking-wide text-zinc-400"
            >Configuration</span
          >
          <button
            class="btn btn-xs"
            type="button"
            aria-label={`Copy ${selectedClient.name} configuration`}
            onclick={() =>
              copy(`client-${selectedClient.id}`, selectedClient.config)}
            >{copied === `client-${selectedClient.id}`
              ? "Copied"
              : "Copy"}</button
          >
        </div>
        <pre
          class="overflow-x-auto whitespace-pre text-xs leading-6 sm:text-sm"><code
            >{selectedClient.config}</code
          ></pre>
      </div>

      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-wide text-fg-muted"
          >
            Keep the token safe
          </p>
          <p class="mt-2 text-sm leading-6 text-fg-muted">
            {selectedClient.secretNote}
          </p>
        </div>
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-wide text-fg-muted"
          >
            Verify
          </p>
          <p class="mt-2 text-sm leading-6 text-fg-muted">
            {selectedClient.verify}
          </p>
        </div>
      </div>
    </div>

    {#if selectedClient.mergeConfig}
      <details class="mt-3 rounded-2xl border border-line bg-surface-card p-5">
        <summary class="cursor-pointer font-medium"
          >I already have MCP servers configured</summary
        >
        <p class="mt-3 text-sm leading-6 text-fg-muted">
          Merge the <code>stocknear</code> entry into the existing object. Do not
          replace the whole file.
        </p>
        <div class="mt-3 rounded-xl bg-zinc-950 p-4 text-zinc-100">
          <div class="mb-3 flex items-center justify-between">
            <span
              class="text-xs font-medium uppercase tracking-wide text-zinc-400"
              >Merged example</span
            >
            <button
              class="btn btn-xs"
              type="button"
              onclick={() =>
                copy(`merge-${selectedClient.id}`, selectedClient.mergeConfig!)}
              >Copy</button
            >
          </div>
          <pre class="overflow-x-auto text-xs leading-6"><code
              >{selectedClient.mergeConfig}</code
            ></pre>
        </div>
      </details>
    {/if}
  </section>

  <section class="mt-12 grid gap-8 border-t border-line pt-10 lg:grid-cols-2">
    <div>
      <p class="text-sm font-semibold text-accent">Try it</p>
      <h2 class="mt-1 text-2xl font-bold tracking-tight">Example prompts</h2>
      <div class="mt-5 space-y-3">
        {#each ["Compare AAPL and MSFT revenue growth and margins.", "Show unusual options activity for NVDA.", "Summarize COST's latest earnings call and analyst ratings."] as prompt}
          <blockquote
            class="rounded-xl border border-line bg-surface-card p-4 text-sm leading-6"
          >
            “{prompt}”
          </blockquote>
        {/each}
      </div>
    </div>
    <div>
      <p class="text-sm font-semibold text-accent">Troubleshooting</p>
      <h2 class="mt-1 text-2xl font-bold tracking-tight">Common fixes</h2>
      <div
        class="mt-5 divide-y divide-line rounded-xl border border-line bg-surface-card"
      >
        <div class="p-4">
          <p class="font-medium">401 · Token rejected</p>
          <p class="mt-1 text-sm leading-6 text-fg-muted">
            Generate a new token in Profile. Tokens expire after 90 days and
            stop immediately when your account is no longer Pro.
          </p>
        </div>
        <div class="p-4">
          <p class="font-medium">429 · Too many requests</p>
          <p class="mt-1 text-sm leading-6 text-fg-muted">
            Wait for the rolling window to free capacity. The limit is 120
            admitted tool calls per user in any 60 seconds.
          </p>
        </div>
        <div class="p-4">
          <p class="font-medium">Client cannot connect</p>
          <p class="mt-1 text-sm leading-6 text-fg-muted">
            Use <code>{STOCKNEAR_MCP_ENDPOINT}</code>, not this documentation
            URL, then restart or rescan your client.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section
    class="mt-12 rounded-3xl border border-line bg-surface-card p-7 text-center sm:p-10"
  >
    <h2 class="text-2xl font-bold tracking-tight">Ready to connect?</h2>
    <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-fg-muted">
      MCP access is included with Stocknear Pro. Generate one token and use the
      same account across supported clients.
    </p>
    <a class="btn btn-primary mt-5" href="/profile#mcp-access"
      >Manage MCP access</a
    >
  </section>
</main>
