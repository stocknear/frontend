<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ChevronDown from "lucide-svelte/icons/chevron-down";
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import Plus from "lucide-svelte/icons/plus";
  import RefreshCw from "lucide-svelte/icons/refresh-cw";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import Ellipsis from "lucide-svelte/icons/ellipsis";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import * as Popover from "$lib/components/shadcn/popover/index.js";
  import { Combobox } from "bits-ui";
  import { toast } from "svelte-sonner";
  import { mode, setMode } from "mode-watcher";
  import Sun from "lucide-svelte/icons/sun";
  import Moon from "lucide-svelte/icons/moon";

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

  // Search state
  let searchInputValue = "";
  let searchBarData: Array<{ symbol: string; name: string; type: string }> = [];
  let searchTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let isAddingTicker = false;
  let showAddStockPopover = false;

  // Collapsible groups state
  let collapsedGroups: Set<string> = new Set();
  const COLLAPSED_GROUPS_KEY = "watchlist-collapsed-groups";

  // Delete ticker state
  let hoveredRowSymbol: string | null = null;

  // Create watchlist modal state
  let isCreateModalOpen = false;
  let newWatchlistTitle = "";
  let isCreatingWatchlist = false;

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

  // Search stocks function
  const searchStocks = async () => {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    if (!searchInputValue.trim()) {
      searchBarData = [];
      return;
    }

    searchTimeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(searchInputValue)}&limit=10`,
        );
        searchBarData = await response.json();
      } catch {
        searchBarData = [];
      }
    }, 50);
  };

  // Add ticker function
  const handleAddTicker = async (ticker: string) => {
    if (isAddingTicker || !activeWatchlistId) return;
    if (watchlistItems.some((item) => item?.symbol === ticker)) {
      toast.error("Already in watchlist", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      searchInputValue = "";
      searchBarData = [];
      return;
    }

    isAddingTicker = true;
    searchInputValue = "";
    searchBarData = [];
    showAddStockPopover = false;

    try {
      const promise = fetch("/api/update-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, watchListId: activeWatchlistId }),
      }).then(async (res) => {
        const output = await res.json();
        if (!res.ok) throw new Error(output.error || "Failed to add ticker");
        return output;
      });

      toast.promise(promise, {
        loading: "Adding...",
        success: "Added!",
        error: (e: Error) => e.message || "Failed to add ticker",
      });

      await promise;
      await loadWatchlistItems(activeWatchlistId);
    } finally {
      isAddingTicker = false;
    }
  };

  // Delete ticker function
  const handleDeleteTicker = async (symbol: string) => {
    if (!activeWatchlistId) return;

    const remaining = watchlistItems
      .filter((i) => i?.symbol !== symbol)
      .map((i) => i?.symbol);

    try {
      const promise = fetch("/api/update-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: remaining,
          watchListId: activeWatchlistId,
          mode: "delete",
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error("Failed to remove ticker");
        return res.json();
      });

      toast.promise(promise, {
        loading: "Removing...",
        success: "Removed!",
        error: "Failed to remove ticker",
      });

      await promise;
      await loadWatchlistItems(activeWatchlistId);
    } catch {
      // Error handled by toast
    }
  };

  // Collapsible groups functions
  const toggleGroupCollapse = (groupKey: string) => {
    if (collapsedGroups.has(groupKey)) {
      collapsedGroups.delete(groupKey);
    } else {
      collapsedGroups.add(groupKey);
    }
    collapsedGroups = new Set(collapsedGroups);
    try {
      localStorage.setItem(
        COLLAPSED_GROUPS_KEY,
        JSON.stringify([...collapsedGroups]),
      );
    } catch {
      // ignore
    }
  };

  const loadCollapsedGroups = () => {
    try {
      const saved = localStorage.getItem(COLLAPSED_GROUPS_KEY);
      if (saved) {
        collapsedGroups = new Set(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  };

  // Create watchlist function
  const handleCreateWatchlist = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!newWatchlistTitle.trim()) {
      toast.error("Please enter a watchlist name");
      return;
    }
    if (newWatchlistTitle.length > 100) {
      toast.error("Watchlist name is too long");
      return;
    }

    isCreatingWatchlist = true;

    try {
      const promise = fetch("/api/create-watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newWatchlistTitle }),
      }).then(async (res) => {
        const output = await res.json();
        if (!res.ok)
          throw new Error(output.error || "Failed to create watchlist");
        return output;
      });

      toast.promise(promise, {
        loading: "Creating...",
        success: "Watchlist created!",
        error: (e: Error) => e.message || "Failed to create watchlist",
      });

      const output = await promise;

      watchlists = [...watchlists, output];
      activeWatchlistId = output.id;
      activeWatchlistTitle = output.title;
      updateLocalStorageWatchlist(output.id);
      watchlistItems = [];
      isCreateModalOpen = false;
      newWatchlistTitle = "";
    } finally {
      isCreatingWatchlist = false;
    }
  };

  // Logo URL helper
  const getLogoUrl = (symbol: string | undefined): string =>
    symbol
      ? `https://financialmodelingprep.com/image-stock/${symbol.toUpperCase()}.png`
      : "";

  // Theme toggle handler
  const handleThemeToggle = async () => {
    const newMode = $mode === "light" ? "dark" : "light";
    setMode(newMode);
    try {
      await fetch("/api/theme-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch {
      // Ignore theme persistence errors
    }
  };

  onMount(() => {
    loadCollapsedGroups();
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
  <!-- Header with watchlist dropdown and action buttons -->
  <div class="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0b0b0d]">
    <!-- Left: Watchlist Dropdown or Alerts Title -->
    {#if activeTab === "alerts"}
      <div class="flex items-center gap-1.5 text-[11px] font-semibold text-gray-800 dark:text-zinc-200">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-3.5"
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
        <span>Price alerts</span>
      </div>
    {:else}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <button
            use:builder.action
            {...builder}
            class="flex items-center gap-1 px-1.5 py-1 text-[11px] font-semibold text-gray-800 dark:text-zinc-200 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60 rounded transition"
          >
            <svg
              class="size-3.5"
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
            <span class="truncate max-w-[80px]">{activeWatchlistTitle}</span>
            <ChevronDown class="size-3 text-gray-500 dark:text-zinc-400" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          class="w-48 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50"
          sideOffset={4}
        >
          <!-- Create New Watchlist -->
          <DropdownMenu.Item
            on:click={() => (isCreateModalOpen = true)}
            class="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-t-lg"
          >
            <Plus class="size-3" />
            Create new watchlist
          </DropdownMenu.Item>
          <DropdownMenu.Separator class="h-px bg-gray-200 dark:bg-zinc-700" />
          <!-- Watchlist List -->
          {#each watchlists as list}
            <DropdownMenu.Item
              on:click={() => {
                activeWatchlistId = list.id;
                handleWatchlistChange();
              }}
              class="px-3 py-2 text-xs cursor-pointer {list.id === activeWatchlistId
                ? 'text-violet-600 dark:text-violet-400'
                : 'text-gray-700 dark:text-zinc-200'} hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              {list.title ?? "Watchlist"}
            </DropdownMenu.Item>
          {/each}
          {#if watchlists.length === 0}
            <div class="px-3 py-2 text-xs text-gray-500 dark:text-zinc-400">
              No watchlists yet
            </div>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}

    <!-- Right: Action Buttons -->
    {#if activeTab === "watchlist"}
      <div class="flex items-center gap-0.5">
        <!-- Add Stock Button with Popover -->
        <Popover.Root bind:open={showAddStockPopover}>
          <Popover.Trigger asChild let:builder>
            <button
              use:builder.action
              {...builder}
              class="p-1.5 rounded text-gray-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60 transition"
              title="Add stock"
            >
              <Plus class="size-4" />
            </button>
          </Popover.Trigger>
          <Popover.Content
            class="w-64 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50"
            sideOffset={4}
          >
            <Combobox.Root items={searchBarData} bind:inputValue={searchInputValue}>
              <div class="relative">
                <Combobox.Input
                  on:input={searchStocks}
                  class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search symbol..."
                />
              </div>
              {#if searchBarData.length > 0 || searchInputValue.length > 0}
                <Combobox.Content
                  class="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  sideOffset={0}
                >
                  {#if searchBarData.length > 0}
                    {#each searchBarData as item}
                      <Combobox.Item
                        value={item.symbol}
                        on:click={() => handleAddTicker(item.symbol)}
                        class="px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 flex justify-between items-center text-gray-900 dark:text-white"
                      >
                        <span class="font-semibold">{item.symbol}</span>
                        <span class="text-gray-500 dark:text-zinc-400 truncate ml-2 text-[10px]"
                          >{item.name}</span
                        >
                      </Combobox.Item>
                    {/each}
                  {:else if searchInputValue.length > 0}
                    <div class="px-3 py-2 text-xs text-gray-500 dark:text-zinc-400">
                      No results found
                    </div>
                  {/if}
                </Combobox.Content>
              {/if}
            </Combobox.Root>
          </Popover.Content>
        </Popover.Root>

        <!-- Refresh Button -->
        <button
          type="button"
          class="p-1.5 rounded text-gray-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60 transition"
          on:click={refreshWatchlist}
          title="Refresh"
        >
          <RefreshCw class="size-4" />
        </button>

        <!-- Settings Menu -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild let:builder>
            <button
              use:builder.action
              {...builder}
              class="p-1.5 rounded text-gray-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/60 dark:hover:bg-zinc-800/60 transition"
              title="Options"
            >
              <Ellipsis class="size-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            class="w-44 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-50"
            sideOffset={4}
          >
            <DropdownMenu.Item
              on:click={() => goto("/watchlist/stocks")}
              class="px-3 py-2 text-xs cursor-pointer text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-t-lg"
            >
              Manage watchlists
            </DropdownMenu.Item>
            <DropdownMenu.Separator class="h-px bg-gray-200 dark:bg-zinc-700" />
            <DropdownMenu.Item
              on:click={handleThemeToggle}
              class="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-b-lg"
            >
              {#if $mode === "light"}
                <Moon class="size-3.5" />
                <span>Dark mode</span>
              {:else}
                <Sun class="size-3.5" />
                <span>Light mode</span>
              {/if}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    {/if}
  </div>

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

        <div class="pb-4">
          {#each groupedItems as group}
            <!-- Group Header (Collapsible) -->
            {#if group.label}
              <button
                type="button"
                class="w-full flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-wide text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition border-b border-gray-200/60 dark:border-zinc-800/70"
                on:click={() => toggleGroupCollapse(group.key)}
              >
                <ChevronRight
                  class="size-3 transition-transform {collapsedGroups.has(group.key)
                    ? ''
                    : 'rotate-90'}"
                />
                <span>{group.label}</span>
                <span class="ml-auto text-[9px] text-gray-400 dark:text-zinc-600"
                  >({group.items.length})</span
                >
              </button>
            {/if}

            <!-- Group Items -->
            {#if !collapsedGroups.has(group.key)}
              {#each group.items as item}
                {@const changeValue = getChangeValue(item)}
                {@const isActive = isActiveSymbol(item?.symbol)}
                <button
                  type="button"
                  class="group w-full text-left grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-1 px-3 py-1.5 text-[11px] transition relative border-b border-gray-200/40 dark:border-zinc-800/50 {isActive
                    ? 'bg-blue-500/10 text-gray-900 dark:text-white'
                    : 'hover:bg-gray-50/80 dark:hover:bg-[#14161a] text-gray-700 dark:text-zinc-200'}"
                  title={item?.name ?? item?.symbol}
                  on:click={() => navigateToSymbol(item?.symbol)}
                  on:mouseenter={() => (hoveredRowSymbol = item?.symbol ?? null)}
                  on:mouseleave={() => (hoveredRowSymbol = null)}
                >
                  <!-- Symbol with Logo and Status Dot -->
                  <span class="flex items-center gap-1.5 truncate">
                    <img
                      src={getLogoUrl(item?.symbol)}
                      alt=""
                      class="size-4 rounded-full object-cover flex-shrink-0"
                      style="clip-path: circle(50%);"
                      loading="lazy"
                      on:error={(e) => {
                        const target = e.target;
                        if (target instanceof HTMLImageElement) {
                          target.style.display = "none";
                        }
                      }}
                    />
                    <span class="text-emerald-500 text-[6px]">●</span>
                    <span class="font-semibold truncate"
                      >{item?.symbol ?? "-"}</span
                    >
                  </span>

                  <!-- Last Price -->
                  <span class="text-right tabular-nums"
                    >{formatPrice(item?.price)}</span
                  >

                  <!-- Change -->
                  <span class={`text-right tabular-nums ${getChangeClass(changeValue)}`}>
                    {formatChange(changeValue)}
                  </span>

                  <!-- Change % -->
                  <span
                    class={`text-right tabular-nums ${getChangeClass(toNumber(item?.changesPercentage))}`}
                  >
                    {formatPercent(toNumber(item?.changesPercentage))}
                  </span>

                  <!-- Delete Button (appears on hover) -->
                  {#if hoveredRowSymbol === item?.symbol}
                    <button
                      type="button"
                      class="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                      on:click|stopPropagation={() =>
                        handleDeleteTicker(item?.symbol ?? "")}
                      title="Remove from watchlist"
                    >
                      <Trash2 class="size-3" />
                    </button>
                  {/if}
                </button>
              {/each}
            {/if}
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Create Watchlist Modal -->
<input
  type="checkbox"
  id="createWatchlistModal"
  class="modal-toggle"
  bind:checked={isCreateModalOpen}
/>

<dialog id="createWatchlistModal" class="modal modal-bottom sm:modal-middle">
  <label for="createWatchlistModal" class="cursor-pointer modal-backdrop" aria-label="Close"></label>

  <div
    class="modal-box w-full max-w-md relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="createWatchlistModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
    >
      <svg
        class="w-6 h-6"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        />
      </svg>
    </label>

    <h3 class="font-bold text-xl mb-5">Create New Watchlist</h3>

    <form on:submit={handleCreateWatchlist} class="space-y-4">
      <div>
        <label for="watchlistTitle" class="block text-sm font-medium mb-1">
          Watchlist Name
        </label>
        <input
          id="watchlistTitle"
          type="text"
          bind:value={newWatchlistTitle}
          class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-full bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="My Watchlist"
          required
          maxlength="100"
        />
      </div>

      <button
        type="submit"
        disabled={isCreatingWatchlist}
        class="w-full py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-zinc-200 transition disabled:opacity-60"
      >
        {isCreatingWatchlist ? "Creating..." : "Create Watchlist"}
      </button>
    </form>
  </div>
</dialog>
