<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import Plus from "lucide-svelte/icons/plus";
  import RefreshCw from "lucide-svelte/icons/refresh-cw";

  export let currentSymbol: string | null = null;

  type WatchlistSummary = {
    id: string;
    title?: string;
    ticker?: unknown;
  };

  type WatchlistItem = {
    symbol?: string;
    name?: string;
    price?: number | string | null;
    changesPercentage?: number | string | null;
    type?: string;
  };

  type WatchlistGroup = {
    key: string;
    label: string;
    items: WatchlistItem[];
  };

  type SidebarTab = "watchlist" | "alerts";

  const WATCHLIST_STORAGE_KEY = "last-watchlist-id";
  const WATCHLIST_ID_REGEX = /^[a-zA-Z0-9]{15}$/;

  const groupOrder = [
    "indices",
    "stocks",
    "etfs",
    "crypto",
    "forex",
    "futures",
    "watchlist",
  ];

  const groupLabels: Record<string, string> = {
    indices: "Indices",
    stocks: "Stocks",
    etfs: "ETFs",
    crypto: "Crypto",
    forex: "Forex",
    futures: "Futures",
    watchlist: "Watchlist",
  };

  let watchlists: WatchlistSummary[] = [];
  let activeWatchlistId: string | null = null;
  let activeWatchlistTitle = "Watchlist";
  let watchlistItems: WatchlistItem[] = [];
  export let activeTab: SidebarTab = "watchlist";
  let isLoadingWatchlists = false;
  let isLoadingItems = false;
  let isLoading = false;
  let errorMessage = "";
  let headerTitle = "Watchlist";

  let watchlistsController: AbortController | null = null;
  let itemsController: AbortController | null = null;

  $: isLoading = isLoadingWatchlists || isLoadingItems;
  $: headerTitle =
    activeTab === "alerts" ? "Price alerts" : activeWatchlistTitle;

  const numberFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const percentFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const cleaned = value.replace(/[%,$]/g, "");
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const isValidWatchlistId = (value: unknown): value is string =>
    typeof value === "string" && WATCHLIST_ID_REGEX.test(value);

  const formatPrice = (value: unknown) => {
    const numeric = toNumber(value);
    return numeric === null ? "-" : numberFormatter.format(numeric);
  };

  const formatChange = (value: number | null) => {
    if (value === null) return "-";
    const sign = value > 0 ? "+" : "";
    return `${sign}${numberFormatter.format(value)}`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return "-";
    const sign = value > 0 ? "+" : "";
    return `${sign}${percentFormatter.format(value)}%`;
  };

  const getChangeValue = (item: WatchlistItem): number | null => {
    const price = toNumber(item?.price);
    const pct = toNumber(item?.changesPercentage);
    if (price === null || pct === null) return null;
    return (price * pct) / 100;
  };

  const getChangeClass = (value: number | null) => {
    if (value === null) return "text-gray-400 dark:text-zinc-500";
    return value >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";
  };

  const normalizeGroupKey = (type: unknown): string => {
    const key = String(type ?? "").toLowerCase();
    if (["index", "indices"].includes(key)) return "indices";
    if (["stock", "stocks"].includes(key)) return "stocks";
    if (["etf", "etfs"].includes(key)) return "etfs";
    if (["crypto", "cryptocurrency"].includes(key)) return "crypto";
    if (["forex", "fx"].includes(key)) return "forex";
    if (["future", "futures", "commodity", "commodities"].includes(key))
      return "futures";
    return "watchlist";
  };

  const buildGroups = (items: WatchlistItem[]): WatchlistGroup[] => {
    if (!items.length) return [];
    const grouped = new Map<string, WatchlistItem[]>();
    items.forEach((item) => {
      const key = normalizeGroupKey(item?.type);
      const bucket = grouped.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        grouped.set(key, [item]);
      }
    });

    const groups = groupOrder
      .filter((key) => grouped.has(key))
      .map((key) => ({
        key,
        label: groupLabels[key] ?? "Watchlist",
        items: grouped.get(key) ?? [],
      }));

    if (groups.length <= 1) {
      return [
        {
          key: "watchlist",
          label: "",
          items: items,
        },
      ];
    }

    return groups;
  };

  $: groupedItems = buildGroups(watchlistItems);

  const safeParse = (value: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const getActiveSymbol = () => currentSymbol?.toUpperCase() ?? "";

  const isActiveSymbol = (symbol: string | undefined) =>
    Boolean(symbol) && symbol?.toUpperCase() === getActiveSymbol();

  const navigateToSymbol = (symbol: string | undefined) => {
    if (!symbol || !/^[A-Za-z0-9.^-]{1,20}$/.test(symbol)) return;
    const normalized = symbol.toUpperCase();
    goto(`/chart/${encodeURIComponent(normalized)}`);
  };

  const updateLocalStorageWatchlist = (id: string) => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(id));
    } catch {
      // ignore
    }
  };

  const resetWatchlistsController = () => {
    if (watchlistsController) {
      watchlistsController.abort();
    }
    watchlistsController = new AbortController();
    return watchlistsController.signal;
  };

  const resetItemsController = () => {
    if (itemsController) {
      itemsController.abort();
    }
    itemsController = new AbortController();
    return itemsController.signal;
  };

  const loadWatchlistItems = async (watchListId: string) => {
    if (!isValidWatchlistId(watchListId)) {
      watchlistItems = [];
      return;
    }
    const signal = resetItemsController();
    isLoadingItems = true;
    errorMessage = "";

    try {
      const response = await fetch("/api/get-watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          watchListId,
          ruleOfList: ["price", "changesPercentage"],
        }),
        signal,
      });

      const output = await response.json();
      const rawList = Array.isArray(output?.data)
        ? output.data
        : Array.isArray(output)
          ? output?.[0]
          : [];

      watchlistItems = Array.isArray(rawList) ? rawList : [];
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        errorMessage = "Unable to load watchlist.";
        watchlistItems = [];
      }
    } finally {
      if (!signal.aborted) {
        isLoadingItems = false;
      }
    }
  };

  const loadWatchlists = async () => {
    const signal = resetWatchlistsController();
    isLoadingWatchlists = true;
    errorMessage = "";

    try {
      const response = await fetch("/api/all-watchlists", { signal });
      const output = await response.json();
      watchlists = Array.isArray(output) ? output : [];

      const savedId = safeParse(
        localStorage?.getItem(WATCHLIST_STORAGE_KEY),
      );
      const selected = watchlists.find((item) => item?.id === savedId);
      const fallback = selected ?? watchlists[0];

      activeWatchlistId = fallback?.id ?? null;
      activeWatchlistTitle = fallback?.title ?? "Watchlist";

      if (activeWatchlistId) {
        updateLocalStorageWatchlist(activeWatchlistId);
        await loadWatchlistItems(activeWatchlistId);
      } else {
        watchlistItems = [];
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") {
        errorMessage = "Unable to load watchlists.";
        watchlists = [];
        watchlistItems = [];
      }
    } finally {
      if (!signal.aborted) {
        isLoadingWatchlists = false;
      }
    }
  };

  const handleWatchlistChange = async () => {
    if (!activeWatchlistId) return;
    const selected = watchlists.find((item) => item?.id === activeWatchlistId);
    activeWatchlistTitle = selected?.title ?? "Watchlist";
    updateLocalStorageWatchlist(activeWatchlistId);
    await loadWatchlistItems(activeWatchlistId);
  };

  const refreshWatchlist = async () => {
    if (!activeWatchlistId) return;
    await loadWatchlistItems(activeWatchlistId);
  };

  onMount(() => {
    loadWatchlists();
  });

  onDestroy(() => {
    if (watchlistsController) {
      watchlistsController.abort();
      watchlistsController = null;
    }
    if (itemsController) {
      itemsController.abort();
      itemsController = null;
    }
  });
</script>

<div class="tv-right-panel flex h-full flex-1 flex-col bg-white dark:bg-[#0b0b0d]">
  <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0b0b0d]">
    <div class="flex items-center gap-2 text-[12px] font-semibold text-gray-800 dark:text-zinc-200">
      {#if activeTab === "alerts"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-4"
          viewBox="0 0 24 24"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
          >
            <path d="M3 5.231L6.15 3M21 5.231L17.85 3" />
            <circle cx="12" cy="13" r="8" />
            <path d="M9.5 13h5M12 10.5v5" />
          </g>
        </svg>
      {:else}
        <svg
          class="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
          />
        </svg>
      {/if}
      <span>{headerTitle}</span>
    </div>
    {#if activeTab === "watchlist"}
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="p-1.5 rounded-md text-gray-500 dark:text-zinc-400 hover:text-blue-400 dark:hover:text-blue-400 hover:bg-gray-100/70 dark:hover:bg-zinc-800/70 transition"
          on:click={() => goto("/watchlist/stocks")}
          title="Manage watchlists"
          aria-label="Manage watchlists"
        >
          <Plus class="size-4" />
        </button>
        <button
          type="button"
          class="p-1.5 rounded-md text-gray-500 dark:text-zinc-400 hover:text-blue-400 dark:hover:text-blue-400 hover:bg-gray-100/70 dark:hover:bg-zinc-800/70 transition"
          on:click={refreshWatchlist}
          title="Refresh"
          aria-label="Refresh"
        >
          <RefreshCw class="size-4" />
        </button>
      </div>
    {/if}
  </div>

  {#if activeTab === "watchlist"}
    <div class="px-3 py-1.5">
      {#if watchlists.length > 0}
        <label class="sr-only" for="watchlist-select">Select watchlist</label>
        <div class="relative">
          <select
            id="watchlist-select"
            class="w-full appearance-none rounded-sm border border-gray-200/80 dark:border-zinc-800 bg-white/90 dark:bg-[#0f0f12] px-3 py-1 text-[11px] font-medium text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-0"
            bind:value={activeWatchlistId}
            on:change={handleWatchlistChange}
          >
            {#each watchlists as list}
              <option value={list?.id}>{list?.title ?? "Watchlist"}</option>
            {/each}
          </select>
          <ChevronDown class="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-gray-400" />
        </div>
      {:else}
        <div class="rounded-md border border-dashed border-gray-300 dark:border-zinc-800 px-3 py-2 text-xs text-gray-500 dark:text-zinc-400">
          No watchlists yet.
        </div>
      {/if}
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto">
    {#if activeTab === "alerts"}
      <div class="px-4 py-6 text-sm text-gray-500 dark:text-zinc-400">
        <div class="flex items-center gap-2 text-gray-700 dark:text-zinc-200 font-semibold">
          Price alerts
        </div>
        <p class="mt-2 text-xs leading-relaxed">
          Alerts are coming soon. You will be able to set triggers directly from
          the chart and watchlist.
        </p>
        <button
          type="button"
          class="mt-4 w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/70 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 cursor-not-allowed"
          disabled
        >
          Create alert
        </button>
      </div>
    {:else}
      {#if isLoading}
        <div class="px-4 py-6 text-sm text-gray-500 dark:text-zinc-400">
          Loading watchlist...
        </div>
      {:else if errorMessage}
        <div class="px-4 py-6 text-sm text-rose-600 dark:text-rose-400">
          {errorMessage}
        </div>
      {:else if watchlistItems.length === 0}
        <div class="px-4 py-6 text-sm text-gray-500 dark:text-zinc-400">
          Add tickers to see them here.
        </div>
      {:else}
        <div class="px-3 py-2 text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-400 grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-2">
          <span>Symbol</span>
          <span class="text-right">Last</span>
          <span class="text-right">Chg</span>
          <span class="text-right">Chg%</span>
        </div>

        <div class="pb-4 divide-y divide-gray-200/60 dark:divide-zinc-800/70">
          {#each groupedItems as group}
            {#if group.label}
              <div class="px-3 pt-3 text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-500">
                {group.label}
              </div>
            {/if}
            {#each group.items as item}
              {@const changeValue = getChangeValue(item)}
              <button
                type="button"
                class="w-full text-left grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-2 px-3 py-2 text-[11px] transition {isActiveSymbol(item?.symbol)
                  ? 'bg-blue-500/10 text-gray-900 dark:text-white'
                  : 'hover:bg-gray-100/60 dark:hover:bg-[#14161a] text-gray-700 dark:text-zinc-200'}"
                title={item?.name ?? item?.symbol}
                on:click={() => navigateToSymbol(item?.symbol)}
              >
                <span class="font-semibold truncate">{item?.symbol ?? "-"}</span>
                <span class="text-right">{formatPrice(item?.price)}</span>
                <span class={`text-right ${getChangeClass(changeValue)}`}>
                  {formatChange(changeValue)}
                </span>
                <span class={`text-right ${getChangeClass(toNumber(item?.changesPercentage))}`}>
                  {formatPercent(toNumber(item?.changesPercentage))}
                </span>
              </button>
            {/each}
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
