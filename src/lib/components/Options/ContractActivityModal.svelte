<script context="module" lang="ts">
  // Module-level cache: survives component destroy/recreate cycles
  const activityCache = new Map<string, { contractStats: any; trades: any[] }>();
  const MAX_CACHE_SIZE = 20;
</script>

<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";

  export let item: any = null;
  export let isOpen = false;
  export let onClose: () => void = () => {};

  let isLoading = false;
  let hasError = false;
  let contractStats: any = null;
  let recentTrades: any[] = [];

  $: contractKey =
    item?.ticker && item?.put_call && item?.strike_price != null && item?.date_expiration
      ? `${item.ticker}|${item.put_call}|${item.strike_price}|${item.date_expiration}`
      : "";

  $: if (isOpen && contractKey) {
    loadActivity();
  }

  $: if (!isOpen) {
    hasError = false;
  }

  $: totalSentiment =
    (contractStats?.bullishCount || 0) +
    (contractStats?.bearishCount || 0) +
    (contractStats?.neutralCount || 0);
  $: bullPct = totalSentiment > 0 ? ((contractStats?.bullishCount || 0) / totalSentiment) * 100 : 0;
  $: bearPct = totalSentiment > 0 ? ((contractStats?.bearishCount || 0) / totalSentiment) * 100 : 0;
  $: neutralPct = totalSentiment > 0 ? ((contractStats?.neutralCount || 0) / totalSentiment) * 100 : 0;

  function loadActivity() {
    if (activityCache.has(contractKey)) {
      const cached = activityCache.get(contractKey)!;
      contractStats = cached.contractStats;
      recentTrades = cached.trades;
      return;
    }
    fetchActivity();
  }

  async function fetchActivity() {
    isLoading = true;
    hasError = false;
    contractStats = null;
    recentTrades = [];

    try {
      const rules = JSON.stringify([{ name: "trackContract", value: [contractKey] }]);
      const params = new URLSearchParams({ rules, pageSize: "50" });
      const res = await fetch(`/api/options-flow-feed?${params}`);

      if (!res.ok) {
        hasError = true;
        return;
      }

      const result = await res.json();
      contractStats = result?.contractStats?.[contractKey] || null;
      recentTrades = (result?.items || []).slice(0, 10);

      if (!contractStats || contractStats.tradeCount === 0) {
        hasError = true;
        return;
      }

      // Cache with FIFO eviction
      if (activityCache.size >= MAX_CACHE_SIZE) {
        const firstKey = activityCache.keys().next().value;
        activityCache.delete(firstKey);
      }
      activityCache.set(contractKey, { contractStats, trades: recentTrades });
    } catch {
      hasError = true;
    } finally {
      isLoading = false;
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "n/a";
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) return "n/a";
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const yy = String(date.getUTCFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  }

  function formatTradeTime(timeString: string): string {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  function sentimentColor(sentiment: string): string {
    if (sentiment === "Bullish") return "text-emerald-600 dark:text-emerald-400";
    if (sentiment === "Bearish") return "text-rose-600 dark:text-rose-400";
    return "text-gray-500 dark:text-zinc-400";
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen && item}
  <div
    class="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/40 animate-[fadeIn_200ms_ease-out]"
    on:click|self={onClose}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="relative w-full max-w-lg max-h-[100vh] sm:max-h-[90vh] overflow-auto bg-white dark:bg-zinc-900 sm:rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl animate-[slideUp_200ms_ease-out]"
      on:click|stopPropagation
    >
      <!-- Header -->
      <div
        class="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 sm:px-6 py-4 flex items-start justify-between"
      >
        <div>
          <h3
            class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            {item.ticker}
            <span
              class="text-sm font-normal {item.put_call === 'Calls'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'}"
            >
              {item.put_call}
            </span>
          </h3>
          <span class="text-sm text-gray-600 dark:text-zinc-400">
            ${item.strike_price} Strike · Exp {formatDate(item.date_expiration)}
          </span>
        </div>
        <button
          on:click={onClose}
          class="cursor-pointer p-1 rounded-full text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
        >
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {#if isLoading}
        <!-- Loading skeleton -->
        <div class="px-4 sm:px-6 py-6">
          <div class="grid grid-cols-3 gap-4">
            {#each Array(3) as _}
              <div class="space-y-2">
                <div class="h-4 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
                <div class="h-5 w-12 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse"></div>
              </div>
            {/each}
          </div>
          <div class="mt-4 h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full animate-pulse"></div>
          <div class="mt-6 space-y-3">
            {#each Array(5) as _}
              <div class="h-4 w-full bg-gray-100 dark:bg-zinc-800 rounded animate-pulse"></div>
            {/each}
          </div>
        </div>
      {:else if hasError || !contractStats}
        <!-- Empty state -->
        <div class="px-4 sm:px-6 py-12 text-center">
          <svg
            class="w-12 h-12 mx-auto text-gray-300 dark:text-zinc-600 mb-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p class="text-gray-500 dark:text-zinc-400 text-sm">
            No flow activity found for this contract today.
          </p>
        </div>
      {:else}
        <!-- Stats Grid -->
        <div class="px-4 sm:px-6 py-4">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <span class="text-xs font-medium text-gray-500 dark:text-zinc-400">Trades</span>
              <div class="text-sm font-semibold text-gray-900 dark:text-white">
                {contractStats.tradeCount?.toLocaleString("en-US") ?? "0"}
              </div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-500 dark:text-zinc-400">Total Premium</span>
              <div class="text-sm font-semibold text-gray-900 dark:text-white">
                ${abbreviateNumber(contractStats.totalPremium, false, true)}
              </div>
            </div>
            <div>
              <span class="text-xs font-medium text-gray-500 dark:text-zinc-400">Volume</span>
              <div class="text-sm font-semibold text-gray-900 dark:text-white">
                {contractStats.totalSize?.toLocaleString("en-US") ?? "0"}
              </div>
            </div>
          </div>
        </div>

        <!-- Sentiment Breakdown -->
        <div class="px-4 sm:px-6 pb-4">
          <div class="flex items-center gap-4 text-xs">
            <span class="text-emerald-600 dark:text-emerald-400">
              Bullish: {contractStats.bullishCount ?? 0}
            </span>
            <span class="text-rose-600 dark:text-rose-400">
              Bearish: {contractStats.bearishCount ?? 0}
            </span>
            <span class="text-gray-500 dark:text-zinc-400">
              Neutral: {contractStats.neutralCount ?? 0}
            </span>
          </div>
          {#if totalSentiment > 0}
            <div class="flex h-2 rounded-full overflow-hidden mt-1.5 bg-gray-100 dark:bg-zinc-800">
              {#if bullPct > 0}
                <div class="bg-emerald-500" style="width: {bullPct}%"></div>
              {/if}
              {#if bearPct > 0}
                <div class="bg-rose-500" style="width: {bearPct}%"></div>
              {/if}
              {#if neutralPct > 0}
                <div class="bg-gray-400 dark:bg-zinc-500" style="width: {neutralPct}%"></div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Recent Trades -->
        {#if recentTrades.length > 0}
          <div class="px-4 sm:px-6 pb-4 border-t border-gray-200 dark:border-zinc-800 pt-4">
            <span class="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 block">
              Recent Trades
            </span>
            <div class="overflow-x-auto max-h-64">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
                    <th class="text-left py-1.5 pr-2 font-medium">Time</th>
                    <th class="text-right py-1.5 px-2 font-medium">Size</th>
                    <th class="text-right py-1.5 px-2 font-medium">Price</th>
                    <th class="text-right py-1.5 px-2 font-medium">Premium</th>
                    <th class="text-left py-1.5 px-2 font-medium">Sentiment</th>
                    <th class="text-left py-1.5 pl-2 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-zinc-800/50">
                  {#each recentTrades as trade}
                    <tr>
                      <td class="py-1.5 pr-2 text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatTradeTime(trade.time)}
                      </td>
                      <td class="py-1.5 px-2 text-right text-gray-900 dark:text-white">
                        {trade.size?.toLocaleString("en-US")}
                      </td>
                      <td class="py-1.5 px-2 text-right text-gray-900 dark:text-white whitespace-nowrap">
                        ${trade.price?.toFixed(2)}
                      </td>
                      <td class="py-1.5 px-2 text-right text-gray-900 dark:text-white whitespace-nowrap">
                        ${abbreviateNumber(trade.cost_basis, false, true)}
                      </td>
                      <td class="py-1.5 px-2 {sentimentColor(trade.sentiment)} whitespace-nowrap">
                        {trade.sentiment}
                      </td>
                      <td class="py-1.5 pl-2 text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                        {trade.option_activity_type}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
