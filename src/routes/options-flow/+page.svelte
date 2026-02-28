<script lang="ts">
  import notifySound from "$lib/audio/options-flow-reader.mp3";
  import { isOpen } from "$lib/store";

  import { onMount, onDestroy } from "svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { goto } from "$app/navigation";
  import { scale, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  import {
    DateFormatter,
    type DateValue,
    today,
    getLocalTimeZone,
  } from "@internationalized/date";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import * as Popover from "$lib/components/shadcn/popover/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { Calendar } from "$lib/components/shadcn/calendar/index.js";
  import CalendarIcon from "lucide-svelte/icons/calendar";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Input from "$lib/components/Input.svelte";
  import Copy from "lucide-svelte/icons/copy";
  import Zap from "lucide-svelte/icons/zap";
  import {
    options_flow_add_filters,
    options_flow_call_flow,
    options_flow_filters_count,
    options_flow_full_width,
    options_flow_hide_filter_area,
    options_flow_live_flow,
    options_flow_main_title,
    options_flow_market_closed,
    options_flow_modal_delete_cancel,
    options_flow_modal_delete_confirm,
    options_flow_modal_delete_message,
    options_flow_modal_delete_title,
    options_flow_modal_new_create,
    options_flow_modal_new_name_label,
    options_flow_modal_new_title,
    options_flow_new_filter,
    options_flow_no_data_filters,
    options_flow_no_filters_found,
    options_flow_no_trades_query,
    options_flow_normal_width,
    options_flow_nothing_found,
    options_flow_paused,
    options_flow_pick_date,
    options_flow_popular_filters,
    options_flow_popular_strategies,
    options_flow_put_flow,
    options_flow_put_to_call,
    options_flow_realtime_data,
    options_flow_realtime_data_content,
    options_flow_realtime_data_title,
    options_flow_reset_all,
    options_flow_save,
    options_flow_save_as_new,
    options_flow_saved_filters,
    options_flow_search_filters,
    options_flow_search_input_placeholder,
    options_flow_search_placeholder,
    options_flow_select_filter,
    options_flow_select_filters_title,
    options_flow_select_popular,
    options_flow_seo_description,
    options_flow_seo_keywords,
    options_flow_seo_title,
    options_flow_show_filter_area,
    options_flow_strategy_bearish_sweeps,
    options_flow_strategy_bullish_sweeps,
    options_flow_strategy_etf_index_flow,
    options_flow_strategy_high_premium_blocks,
    options_flow_strategy_repeated_flow,
    options_flow_strategy_unusual_size_oi,
    options_flow_strategy_zero_dte_flow,
    options_flow_structured_description,
    options_flow_structured_name,
  } from "$lib/paraglide/messages";

  import { page } from "$app/stores";
  import { browser } from "$app/environment";

  import OptionsFlowTable from "$lib/components/Table/OptionsFlowTable.svelte";
  import ScreenerExport from "$lib/components/ScreenerExport.svelte";

  // Server-side pagination state (initialized after `export let data`)
  let currentPage;
  let rowsPerPage;
  let totalItems;
  let totalPages;
  let activeSortKey;
  let activeSortOrder;
  let requestId = 0;
  let isFetchingPage = false;

  function applyServerStats(stats) {
    if (!stats) return;
    displayCallVolume = stats.callVolumeSum || 0;
    displayPutVolume = stats.putVolumeSum || 0;
    displayCallPremium = stats.callPremiumSum || 0;
    displayPutPremium = stats.putPremiumSum || 0;
    displayBullishPremium = stats.bullishPremiumSum || 0;
    displayBearishPremium = stats.bearishPremiumSum || 0;

    const bCount = stats.bullishCount || 0;
    const beCount = stats.bearishCount || 0;
    const nCount = stats.neutralCount || 0;

    if (bCount > beCount) flowSentiment = "Bullish";
    else if (bCount < beCount) flowSentiment = "Bearish";
    else if (nCount > beCount && nCount > bCount) flowSentiment = "Neutral";
    else flowSentiment = "-";

    putCallRatio =
      displayCallVolume !== 0 ? displayPutVolume / displayCallVolume : 0;
    callPercentage =
      displayCallVolume + displayPutVolume !== 0
        ? Math.floor(
            (displayCallVolume / (displayCallVolume + displayPutVolume)) * 100,
          )
        : 0;
    putPercentage =
      displayCallVolume + displayPutVolume !== 0 ? 100 - callPercentage : 0;

    const totalSentimentPremium = displayBullishPremium + displayBearishPremium;
    bullishPercentage =
      totalSentimentPremium !== 0
        ? Math.round((displayBullishPremium / totalSentimentPremium) * 100)
        : 0;
    bearishPercentage =
      totalSentimentPremium !== 0 ? 100 - bullishPercentage : 0;
  }

  function buildActiveRules() {
    return ruleOfList.filter(
      (r) =>
        r.value !== "any" &&
        !(
          Array.isArray(r.value) &&
          r.value.length === 1 &&
          r.value[0] === "any"
        ),
    );
  }

  let currentAbortController: AbortController | null = null;

  function getFormattedSelectedDate() {
    if (!selectedDate) return null;
    const convertDate = new Date(df.format(selectedDate.toDate()));
    const year = convertDate.getFullYear();
    const month = String(convertDate.getMonth() + 1).padStart(2, "0");
    const day = String(convertDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function fetchTableData({
    page = currentPage,
    pageSize = rowsPerPage,
    sortKey = activeSortKey,
    sortOrder = activeSortOrder,
  } = {}) {
    // Cancel any in-flight request
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    const invocationId = ++requestId;
    const activeRules = buildActiveRules();

    isFetchingPage = true;
    try {
      let response;
      const formattedDate = getFormattedSelectedDate();

      if (formattedDate) {
        // Historical mode — fetch from historical endpoint
        const postData = {
          selectedDate: formattedDate,
          rules: activeRules,
          tickers: filterQuery || "",
          page,
          pageSize,
          sortKey,
          sortOrder,
        };
        response = await fetch("/api/options-historical-flow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
          signal,
        });
      } else {
        // Live mode — fetch from live feed endpoint
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          sortKey,
          sortOrder,
        });
        if (filterQuery) params.set("search", filterQuery);
        if (activeRules.length > 0)
          params.set("rules", JSON.stringify(activeRules));
        response = await fetch(`/api/options-flow-feed?${params}`, { signal });
      }

      if (signal.aborted) return;
      const result = await response.json();
      if (invocationId !== requestId) return;

      displayedData = prepareInitialFlowData(result.items || []);
      rawData = displayedData;
      totalItems = result.total ?? 0;
      currentPage = result.page ?? page;
      rowsPerPage = result.pageSize ?? pageSize;
      totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
      activeSortKey = sortKey;
      activeSortOrder = sortOrder;
      if (result.stats) applyServerStats(result.stats);
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error("fetchTableData error:", e);
      if (invocationId === requestId) {
        displayedData = [];
        totalItems = 0;
        totalPages = 1;
      }
    } finally {
      if (invocationId === requestId) isFetchingPage = false;
    }
    isLoaded = true;
  }

  async function fetchAllFlowData(): Promise<any[]> {
    try {
      const PAGE_SIZE = 500;
      const activeRules = buildActiveRules();
      const formattedDate = getFormattedSelectedDate();
      const allItems: any[] = [];
      let page = 1;
      let total = Infinity;

      while (allItems.length < total) {
        let response;

        if (formattedDate) {
          response = await fetch("/api/options-historical-flow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              selectedDate: formattedDate,
              rules: activeRules,
              tickers: filterQuery || "",
              page,
              pageSize: PAGE_SIZE,
              sortKey: activeSortKey,
              sortOrder: activeSortOrder,
            }),
          });
        } else {
          const params = new URLSearchParams({
            page: String(page),
            pageSize: String(PAGE_SIZE),
            sortKey: activeSortKey,
            sortOrder: activeSortOrder,
          });
          if (filterQuery) params.set("search", filterQuery);
          if (activeRules.length > 0)
            params.set("rules", JSON.stringify(activeRules));
          response = await fetch(`/api/options-flow-feed?${params}`);
        }

        if (!response.ok) break;
        const result = await response.json();
        const items = result.items || [];
        total = result.total ?? 0;
        allItems.push(...items);
        if (items.length < PAGE_SIZE) break;
        page++;
      }

      return prepareInitialFlowData(allItems);
    } catch (e) {
      console.error("fetchAllFlowData failed:", e);
      return [];
    }
  }

  // Debounced wrapper for filter changes — batches rapid clicks into one fetch
  let filterFetchTimeout: ReturnType<typeof setTimeout> | null = null;

  function debouncedFilterFetch() {
    if (filterFetchTimeout) clearTimeout(filterFetchTimeout);
    filterFetchTimeout = setTimeout(() => {
      fetchTableData({ page: 1 });
      sendFiltersToWebSocket();
    }, 200);
  }

  const rowsPerPageOptions = [20, 50, 100];

  function handleServerSort(key, order) {
    if (order === "none") {
      // Reset to default sort (newest first)
      fetchTableData({ page: 1, sortKey: "time", sortOrder: "desc" });
    } else {
      fetchTableData({ page: 1, sortKey: key, sortOrder: order });
    }
  }

  function goToPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalPages || isFetchingPage) return;
    fetchTableData({ page: pageNumber });
  }

  function changeRowsPerPage(newSize) {
    if (rowsPerPage === newSize || isFetchingPage) return;
    saveRowsPerPage(newSize);
    fetchTableData({ page: 1, pageSize: newSize });
  }

  function scrollToTop() {
    if (!browser) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveRowsPerPage(value) {
    if (!browser) return;
    try {
      localStorage.setItem("/options-flow_rowsPerPage", String(value));
    } catch (e) {
      /* ignore */
    }
  }

  function loadRowsPerPage() {
    if (!browser) return rowsPerPage;
    try {
      const saved = localStorage.getItem("/options-flow_rowsPerPage");
      const parsed = saved ? Number(saved) : NaN;
      if (rowsPerPageOptions.includes(parsed)) return parsed;
    } catch (e) {
      /* ignore */
    }
    return 50;
  }

  function parseWsNumeric(raw: any): number {
    const cleaned = String(raw).replace(/[%$,]/g, "").trim().toUpperCase();
    const multipliers: Record<string, number> = {
      K: 1_000,
      M: 1_000_000,
      B: 1_000_000_000,
    };
    const suffix = cleaned.slice(-1);
    return multipliers[suffix]
      ? parseFloat(cleaned.slice(0, -1)) * multipliers[suffix]
      : parseFloat(cleaned) || 0;
  }

  function buildWsFilters() {
    const filters: Record<string, any> = {};
    if (filterQuery) filters.tickers = filterQuery;

    for (const rule of ruleOfList || []) {
      if (!rule.value || rule.value === "any") continue;
      if (
        Array.isArray(rule.value) &&
        rule.value.length === 1 &&
        rule.value[0] === "any"
      )
        continue;

      // --- Categorical filters (set-membership on the server) ---
      if (
        [
          "put_call",
          "sentiment",
          "option_activity_type",
          "underlying_type",
          "trade_leg_type",
          "execution_estimate",
        ].includes(rule.name) &&
        Array.isArray(rule.value)
      ) {
        filters[rule.name] = rule.value;
      }

      // --- Moneyness (ITM / OTM) ---
      if (rule.name === "moneyness" && Array.isArray(rule.value)) {
        filters.moneyness = rule.value;
      }

      // --- Numeric filters (cost_basis, size, volume, open_interest) ---
      // Supports all conditions: over, under, between, exactly
      if (
        ["cost_basis", "size", "volume", "open_interest"].includes(rule.name) &&
        rule.condition &&
        rule.value
      ) {
        if (rule.condition === "between" && Array.isArray(rule.value)) {
          const lo =
            rule.value[0] != null ? parseWsNumeric(rule.value[0]) : null;
          const hi =
            rule.value[1] != null ? parseWsNumeric(rule.value[1]) : null;
          if (lo != null || hi != null) {
            filters[`${rule.name}_filter`] = {
              condition: "between",
              value: [lo, hi],
            };
          }
        } else {
          const v = parseWsNumeric(rule.value);
          filters[`${rule.name}_filter`] = {
            condition: rule.condition,
            value: v,
          };
        }
      }

      // --- Ratio filters: Vol/OI and Size/OI (percentage threshold) ---
      // Supports all conditions: over, under, between, exactly
      if (
        (rule.name === "volumeOIRatio" || rule.name === "sizeOIRatio") &&
        rule.condition &&
        rule.value
      ) {
        const key =
          rule.name === "volumeOIRatio"
            ? "volume_oi_ratio_filter"
            : "size_oi_ratio_filter";
        if (rule.condition === "between" && Array.isArray(rule.value)) {
          const lo =
            rule.value[0] != null
              ? parseFloat(String(rule.value[0]).replace(/[%$,]/g, ""))
              : null;
          const hi =
            rule.value[1] != null
              ? parseFloat(String(rule.value[1]).replace(/[%$,]/g, ""))
              : null;
          if (lo != null || hi != null) {
            filters[key] = { condition: "between", value: [lo, hi] };
          }
        } else {
          const v = parseFloat(String(rule.value).replace(/[%$,]/g, "")) || 0;
          filters[key] = { condition: rule.condition, value: v };
        }
      }

      // --- DTE (Days To Expiration) filter ---
      if (rule.name === "date_expiration" && rule.condition && rule.value) {
        if (rule.condition === "between" && Array.isArray(rule.value)) {
          const lo =
            rule.value[0] != null
              ? parseFloat(String(rule.value[0]).replace(/[%$,]/g, ""))
              : null;
          const hi =
            rule.value[1] != null
              ? parseFloat(String(rule.value[1]).replace(/[%$,]/g, ""))
              : null;
          if (lo != null || hi != null) {
            filters.dte_condition = "between";
            filters.dte_value = [lo, hi];
          }
        } else {
          const v = parseFloat(String(rule.value).replace(/[%$,]/g, ""));
          if (!isNaN(v)) {
            filters.dte_condition = rule.condition; // "over" | "under" | "exactly"
            filters.dte_value = v;
          }
        }
      }

      // --- Exclude tickers (blacklist) ---
      if (
        rule.name === "excludeTickers" &&
        typeof rule.value === "string" &&
        rule.value !== "any"
      ) {
        const excluded = rule.value
          .split(",")
          .map((t) => t.trim().toUpperCase())
          .filter(Boolean);
        if (excluded.length > 0) {
          filters.exclude_tickers = excluded;
        }
      }

      // --- Include tickers (whitelist) ---
      if (
        rule.name === "includeTickers" &&
        typeof rule.value === "string" &&
        rule.value !== "any"
      ) {
        const included = rule.value
          .split(",")
          .map((t) => t.trim().toUpperCase())
          .filter(Boolean);
        if (included.length > 0) {
          filters.include_tickers = included;
        }
      }
    }
    return filters;
  }

  function sendFiltersToWebSocket() {
    if (socket?.readyState === WebSocket.OPEN) {
      // Use "init" instead of "filters" so the server re-marks all cached
      // items as sent.  The user already has fresh data from the REST fetch,
      // so only genuinely new items arriving after this point should be
      // delivered — preventing a large backfill batch that triggers a
      // second table reload.
      socket.send(JSON.stringify({ type: "init", filters: buildWsFilters() }));
    }
  }

  // Column reordering bindings
  let optionsFlowResetColumnOrder: () => void;
  let customColumnOrder: string[] = [];
  let isFullWidth = false;

  // Table search timeout for debouncing
  let tableSearchTimeout: ReturnType<typeof setTimeout> | null = null;

  function debouncedServerSearch(event) {
    filterQuery = event.target.value;
    if (tableSearchTimeout) {
      clearTimeout(tableSearchTimeout);
    }
    tableSearchTimeout = setTimeout(() => {
      fetchTableData({ page: 1 });
      sendFiltersToWebSocket();
    }, 300);
  }

  function resetSearch() {
    filterQuery = "";
    fetchTableData({ page: 1 });
    sendFiltersToWebSocket();
  }

  export let data;

  // Initialize pagination state from SSR data
  currentPage = data?.getOptionsFlowFeed?.page ?? 1;
  rowsPerPage = data?.getOptionsFlowFeed?.pageSize ?? 50;
  totalItems = data?.getOptionsFlowFeed?.total ?? 0;
  totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  activeSortKey = data?.getOptionsFlowFeed?.sort?.key ?? "time";
  activeSortOrder = data?.getOptionsFlowFeed?.sort?.order ?? "desc";

  let timeoutId = null;
  let isComponentDestroyed = false;
  let removeList = false;
  let deleteTargetId = "";

  let optionsWatchlist = data?.getOptionsWatchlist;
  let strategyList = data?.getAllStrategies || [];
  let selectedStrategy = strategyList?.at(0)?.id ?? "";

  let ruleOfList = strategyList?.at(0)?.rules ?? [];
  let selectedPopularStrategy = "";
  $: popularStrategyList = [
    { key: "bullishSweeps", label: options_flow_strategy_bullish_sweeps() },
    { key: "bearishSweeps", label: options_flow_strategy_bearish_sweeps() },
    {
      key: "highPremiumBlocks",
      label: options_flow_strategy_high_premium_blocks(),
    },
    { key: "unusualSizeOI", label: options_flow_strategy_unusual_size_oi() },
    { key: "etfIndexFlow", label: options_flow_strategy_etf_index_flow() },
    { key: "zeroDteFlow", label: options_flow_strategy_zero_dte_flow() },
    { key: "repeatedFlow", label: options_flow_strategy_repeated_flow() },
  ];

  let displayRules = [];
  let filteredData = [];
  let filterQuery =
    data?.user?.tier === "Pro" ? $page.url.searchParams.get("query") || "" : "";

  let ruleName = "";
  let searchTerm = "";
  let showFilters = true;
  let filteredRows = [];

  // Quick search functionality for unselected rules
  let quickSearchTerm = "";
  let quickSearchResults = [];
  let showQuickSearchDropdown = false;
  let selectedQuickSearchIndex = -1;

  // Exclude tickers search state
  let excludeTickerInput = "";
  let excludeTickerResults = [];
  let excludeTickerTimeout: ReturnType<typeof setTimeout> | null = null;
  let showExcludeDropdown = false;

  $: excludeTickerList = (() => {
    const val = valueMappings["excludeTickers"];
    if (!val || val === "any") return [];
    if (typeof val === "string") return val.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
    return [];
  })();

  async function searchExcludeTicker() {
    if (excludeTickerTimeout) clearTimeout(excludeTickerTimeout);
    if (!excludeTickerInput.trim()) {
      excludeTickerResults = [];
      showExcludeDropdown = false;
      return;
    }
    excludeTickerTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(excludeTickerInput)}&limit=8`,
        );
        if (response.ok) {
          excludeTickerResults = await response.json();
          showExcludeDropdown = excludeTickerResults.length > 0;
        }
      } catch {
        excludeTickerResults = [];
        showExcludeDropdown = false;
      }
    }, 100);
  }

  function addExcludeTicker(symbol: string) {
    const ticker = symbol.trim().toUpperCase();
    if (!ticker) return;
    if (ticker.length >= 10) {
      toast.error("Ticker symbol is too long", {
        style: `border-radius: 5px; background: #fff; color: #000; font-size: 14px;`,
      });
      return;
    }
    const current = [...excludeTickerList];
    if (current.includes(ticker)) {
      toast.error(`${ticker} already excluded`, {
        style: `border-radius: 5px; background: #fff; color: #000; font-size: 14px;`,
      });
      return;
    }
    current.push(ticker);
    const newVal = current.length > 0 ? current.join(", ") : "any";
    valueMappings["excludeTickers"] = newVal;
    valueMappings = valueMappings;
    const ruleToUpdate = ruleOfList?.find((r) => r.name === "excludeTickers");
    if (ruleToUpdate) {
      ruleToUpdate.value = newVal;
      ruleOfList = [...ruleOfList];
    }
    excludeTickerInput = "";
    excludeTickerResults = [];
    showExcludeDropdown = false;
    debouncedFilterFetch();
  }

  function removeExcludeTicker(ticker: string) {
    const current = excludeTickerList.filter((t) => t !== ticker.toUpperCase());
    const newVal = current.length > 0 ? current.join(", ") : "any";
    valueMappings["excludeTickers"] = newVal;
    valueMappings = valueMappings;
    const ruleToUpdate = ruleOfList?.find((r) => r.name === "excludeTickers");
    if (ruleToUpdate) {
      ruleToUpdate.value = newVal;
      ruleOfList = [...ruleOfList];
    }
    debouncedFilterFetch();
  }

  // Include tickers search state
  let includeTickerInput = "";
  let includeTickerResults = [];
  let includeTickerTimeout: ReturnType<typeof setTimeout> | null = null;
  let showIncludeDropdown = false;

  $: includeTickerList = (() => {
    const val = valueMappings["includeTickers"];
    if (!val || val === "any") return [];
    if (typeof val === "string") return val.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
    return [];
  })();

  async function searchIncludeTicker() {
    if (includeTickerTimeout) clearTimeout(includeTickerTimeout);
    if (!includeTickerInput.trim()) {
      includeTickerResults = [];
      showIncludeDropdown = false;
      return;
    }
    includeTickerTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(includeTickerInput)}&limit=8`,
        );
        if (response.ok) {
          includeTickerResults = await response.json();
          showIncludeDropdown = includeTickerResults.length > 0;
        }
      } catch {
        includeTickerResults = [];
        showIncludeDropdown = false;
      }
    }, 100);
  }

  function addIncludeTicker(symbol: string) {
    const ticker = symbol.trim().toUpperCase();
    if (!ticker) return;
    if (ticker.length >= 10) {
      toast.error("Ticker symbol is too long", {
        style: `border-radius: 5px; background: #fff; color: #000; font-size: 14px;`,
      });
      return;
    }
    const current = [...includeTickerList];
    if (current.includes(ticker)) {
      toast.error(`${ticker} already included`, {
        style: `border-radius: 5px; background: #fff; color: #000; font-size: 14px;`,
      });
      return;
    }
    current.push(ticker);
    const newVal = current.length > 0 ? current.join(", ") : "any";
    valueMappings["includeTickers"] = newVal;
    valueMappings = valueMappings;
    const ruleToUpdate = ruleOfList?.find((r) => r.name === "includeTickers");
    if (ruleToUpdate) {
      ruleToUpdate.value = newVal;
      ruleOfList = [...ruleOfList];
    }
    includeTickerInput = "";
    includeTickerResults = [];
    showIncludeDropdown = false;
    debouncedFilterFetch();
  }

  function removeIncludeTicker(ticker: string) {
    const current = includeTickerList.filter((t) => t !== ticker.toUpperCase());
    const newVal = current.length > 0 ? current.join(", ") : "any";
    valueMappings["includeTickers"] = newVal;
    valueMappings = valueMappings;
    const ruleToUpdate = ruleOfList?.find((r) => r.name === "includeTickers");
    if (ruleToUpdate) {
      ruleToUpdate.value = newVal;
      ruleOfList = [...ruleOfList];
    }
    debouncedFilterFetch();
  }

  // WebSocket connection
  let socket = null;
  let reconnectInterval = null;
  let reconnectAttempts = 0;
  const df = new DateFormatter("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  let selectedDate: DateValue | undefined = undefined;

  // Calendar date range: last 365 days only (historical data retention period)
  const todayDate = today(getLocalTimeZone());
  const calendarMinDate = todayDate.subtract({ days: 365 });
  const calendarMaxDate = todayDate.subtract({ days: 1 }); // Exclude today (live data)

  const allRules = {
    size: {
      label: "Size",
      step: ["50K", "20K", "10K", "5K", "2K", "1K", "100", "0"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    volume: {
      label: "Volume",
      step: ["100K", "50K", "20K", "10K", "5K", "2K", "1K", "100", "0"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    open_interest: {
      label: "Open Interest",
      step: ["100K", "10K", "1K"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    volumeOIRatio: {
      label: "Volume / OI",
      step: ["100%", "80%", "60%", "50%", "30%", "15%", "10%", "5%"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    sizeOIRatio: {
      label: "Size / OI",
      step: ["100%", "80%", "60%", "50%", "30%", "15%", "10%", "5%"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    cost_basis: {
      label: "Premium",
      step: [
        "10M",
        "5M",
        "1M",
        "500K",
        "400K",
        "300K",
        "200K",
        "100K",
        "50K",
        "10K",
        "5K",
      ],
      defaultCondition: "over",
      defaultValue: "any",
    },
    moneyness: {
      label: "Moneyness",
      step: ["ITM", "OTM"],
      defaultValue: "any",
    },
    flowType: {
      label: "Flow Type",
      step: ["Repeated Flow"],
      defaultValue: "any",
    },
    put_call: {
      label: "Contract Type",
      step: ["Calls", "Puts"],
      defaultValue: "any",
    },
    sentiment: {
      label: "Sentiment",
      step: ["Bullish", "Neutral", "Bearish"],
      defaultValue: "any",
    },
    execution_estimate: {
      label: "Execution",
      step: [
        "Above Ask",
        "Below Bid",
        "At Ask",
        "At Bid",
        "At Midpoint",
        "Between",
      ],
      defaultValue: "any",
    },
    option_activity_type: {
      label: "Option Type",
      step: ["Sweep", "Trade", "Large", "Block", "Split"],
      defaultValue: "any",
    },
    date_expiration: {
      label: "Date Expiration",
      step: ["250", "180", "100", "80", "60", "50", "30", "20", "10", "5", "0"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    underlying_type: {
      label: "Asset Type",
      step: ["Stock", "ETF", "Index"],
      defaultValue: "any",
    },
    trade_leg_type: {
      label: "Leg Type",
      step: ["Single-Leg", "Multi-Leg"],
      defaultValue: "any",
    },
    excludeTickers: {
      label: "Exclude Tickers",
      step: [],
      defaultValue: "any",
    },
    includeTickers: {
      label: "Include Tickers",
      step: [],
      defaultValue: "any",
    },
  };

  const textInputRules = ["excludeTickers", "includeTickers"];

  const categoricalRules = [
    "moneyness",
    "flowType",
    "put_call",
    "sentiment",
    "execution_estimate",
    "option_activity_type",
    "underlying_type",
    "trade_leg_type",
  ];

  // Show Vol/OI and Size/OI columns when the user has added the rule to
  // their filter list — even if the value is still "any".  The column only
  // hides when the rule is removed from ruleOfList entirely.
  $: extraColumns = (() => {
    const cols: { key: string; label: string; align: string }[] = [];
    const ruleNames = new Set((ruleOfList || []).map((r: any) => r.name));
    if (ruleNames.has("volumeOIRatio"))
      cols.push({ key: "volOi", label: "Vol/OI", align: "right" });
    if (ruleNames.has("sizeOIRatio"))
      cols.push({ key: "sizeOi", label: "Size/OI", align: "right" });
    return cols;
  })();

  // Generate allRows from allRules
  $: allRows = Object?.entries(allRules)
    ?.sort(([, a], [, b]) => a.label.localeCompare(b.label)) // Sort by label
    ?.map(([ruleName, ruleProps]) => ({
      rule: ruleName,
      ...ruleProps,
    }));

  let ruleCondition = {};
  let valueMappings = {};

  Object.keys(allRules).forEach((ruleName) => {
    ruleCondition[ruleName] = allRules[ruleName].defaultCondition;

    // Check if the default condition is "between"
    if (allRules[ruleName].defaultCondition === "between") {
      valueMappings[ruleName] = allRules[ruleName].defaultValue || [null, null];
    } else {
      valueMappings[ruleName] = allRules[ruleName].defaultValue;
    }
  });

  // Quick search functions
  const updateQuickSearchResults = (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      quickSearchResults = [];
      showQuickSearchDropdown = false;
      return;
    }

    // Get currently selected rule names
    const selectedRuleNames = new Set(ruleOfList.map((rule) => rule.name));

    // Filter available rules that haven't been selected yet
    quickSearchResults = allRows
      .filter(
        (row) =>
          !selectedRuleNames.has(row.rule) &&
          row.label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice(0, 8); // Limit to 8 results for better UX

    showQuickSearchDropdown = quickSearchResults.length > 0;
    selectedQuickSearchIndex = -1;
  };

  const handleQuickSearchInput = (event) => {
    quickSearchTerm = event.target.value;
    updateQuickSearchResults(quickSearchTerm);
  };

  const handleQuickSearchKeydown = (event) => {
    if (!showQuickSearchDropdown) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        selectedQuickSearchIndex = Math.min(
          selectedQuickSearchIndex + 1,
          quickSearchResults.length - 1,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        selectedQuickSearchIndex = Math.max(selectedQuickSearchIndex - 1, -1);
        break;
      case "Enter":
        event.preventDefault();
        if (
          selectedQuickSearchIndex >= 0 &&
          quickSearchResults[selectedQuickSearchIndex]
        ) {
          selectQuickSearchRule(quickSearchResults[selectedQuickSearchIndex]);
        }
        break;
      case "Escape":
        showQuickSearchDropdown = false;
        selectedQuickSearchIndex = -1;
        break;
    }
  };

  const selectQuickSearchRule = (rule) => {
    changeRule(rule.rule);
    //quickSearchTerm = "";
    quickSearchResults = [];
    showQuickSearchDropdown = false;
    selectedQuickSearchIndex = -1;
  };

  // Reactive statement to update search results when ruleOfList changes
  $: if (quickSearchTerm) {
    updateQuickSearchResults(quickSearchTerm);
  }

  const closeQuickSearchDropdown = () => {
    setTimeout(() => {
      showQuickSearchDropdown = false;
      selectedQuickSearchIndex = -1;
    }, 150); // Small delay to allow click events
  };

  const sanitizeFlowEntries = (entries: any[] = []) => {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries.filter((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }
      return Object.values(item).every((value) => {
        if (value === null || value === undefined) {
          return false;
        }
        if (typeof value === "object") {
          return Object.values(value).every(
            (subValue) => subValue !== null && subValue !== undefined,
          );
        }
        return true;
      });
    });
  };

  const attachDerivedMetrics = (entries: any[] = []) => {
    entries?.forEach((item) => {
      if (!item) {
        return;
      }
      item.dte = daysLeft(item?.date_expiration);

      // Pre-compute ratio percentages so the table can display & sort them
      const vol = parseFloat(item?.volume) || 0;
      const size = parseFloat(item?.size) || 0;
      const oi = parseFloat(item?.open_interest) || 0;
      item.volOiRatio =
        oi > 0 ? Math.ceil((vol / oi) * 100) : vol > 0 ? Infinity : 0;
      item.sizeOiRatio =
        oi > 0 ? Math.ceil((size / oi) * 100) : size > 0 ? Infinity : 0;
    });
    return entries;
  };

  const buildFlowKey = (item: any) => {
    if (!item || typeof item !== "object") {
      return "";
    }
    if (item?.id) {
      return String(item.id);
    }
    const compositeKey = [
      item?.ticker ?? "",
      item?.date ?? "",
      item?.time ?? "",
      item?.strike_price ?? "",
      item?.cost_basis ?? "",
    ]
      .map((value) => String(value))
      .join("-");
    return compositeKey.length > 0 ? compositeKey : JSON.stringify(item);
  };

  const dedupeFlowEntries = (entries: any[] = []) => {
    if (!Array.isArray(entries)) {
      return [];
    }
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const entry of entries) {
      const key = buildFlowKey(entry);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      deduped.push(entry);
    }
    return deduped;
  };

  const prepareInitialFlowData = (entries: any[] = []) =>
    dedupeFlowEntries(attachDerivedMetrics(sanitizeFlowEntries(entries)));

  async function handleDeleteRule(state) {
    // Find the index of the rule to be deleted or updated
    const index = ruleOfList?.findIndex((rule) => rule.name === state);
    if (index !== -1) {
      // Get the rule and its default values
      const rule = ruleOfList[index];
      const defaultCondition = allRules[state].defaultCondition;
      const defaultValue = allRules[state].defaultValue;

      // Check if current values differ from defaults
      const isAtDefaultValues =
        ruleCondition[state] === defaultCondition &&
        (Array.isArray(valueMappings[state]) && Array.isArray(defaultValue)
          ? JSON.stringify(valueMappings[state]) ===
            JSON.stringify(defaultValue)
          : valueMappings[state] === defaultValue);

      if (!isAtDefaultValues) {
        // If not at defaults, reset to defaults
        ruleCondition[state] = defaultCondition;
        valueMappings[state] = defaultValue;

        // Update the rule in ruleOfList
        ruleOfList[index] = {
          ...rule,
          condition: defaultCondition,
          value: defaultValue,
        };
        ruleOfList = [...ruleOfList]; // Trigger reactivity

        // Clear checkedItems for categorical rules when resetting to defaults
        if (categoricalRules?.includes(state)) {
          checkedItems.delete(state);
        }
      } else {
        // If already at defaults, remove the rule
        ruleOfList.splice(index, 1);
        ruleOfList = [...ruleOfList];

        // Reset checkedItems for multi-select rules
        if (checkedItems.has(state)) {
          checkedItems.delete(state);
        }

        // Handle cases when the list is empty or matches the current rule name
        if (ruleOfList?.length === 0) {
          ruleName = "";
          filteredData = [];
        } else if (state === ruleName) {
          ruleName = "";
        }
      }

      displayRules = allRows?.filter((row) =>
        ruleOfList?.some((rule) => rule.name === row.rule),
      );
      debouncedFilterFetch();
    }
  }

  async function handleResetAll() {
    selectedPopularStrategy = "";
    ruleOfList = [];
    filteredData = [];
    ruleOfList = [...ruleOfList];
    ruleName = "";
    filterQuery = "";
    checkedItems = new Map();
    Object?.keys(allRules).forEach((ruleName) => {
      ruleCondition[ruleName] = allRules[ruleName].defaultCondition;
      valueMappings[ruleName] = allRules[ruleName].defaultValue;
    });
    displayRules = allRows?.filter((row) =>
      ruleOfList.some((rule) => rule.name === row.rule),
    );
    fetchTableData({ page: 1 });
    sendFiltersToWebSocket();
  }

  async function applyPopularStrategy(state: string) {
    const strategies = {
      bullishSweeps: {
        name: "Bullish Sweeps",
        rules: [
          { name: "option_activity_type", value: ["Sweep"] },
          { name: "sentiment", value: ["Bullish"] },
          { name: "put_call", value: ["Calls"] },
          { condition: "under", name: "date_expiration", value: "30" },
          { condition: "over", name: "cost_basis", value: "200K" },
        ],
      },
      bearishSweeps: {
        name: "Bearish Sweeps",
        rules: [
          { name: "option_activity_type", value: ["Sweep"] },
          { name: "sentiment", value: ["Bearish"] },
          { name: "put_call", value: ["Puts"] },
          { condition: "under", name: "date_expiration", value: "30" },
          { condition: "over", name: "cost_basis", value: "200K" },
        ],
      },
      highPremiumBlocks: {
        name: "High Premium Blocks",
        rules: [
          { name: "option_activity_type", value: ["Block"] },
          { condition: "over", name: "cost_basis", value: "1M" },
          { condition: "over", name: "size", value: "5K" },
          { condition: "over", name: "open_interest", value: "1K" },
        ],
      },
      unusualSizeOI: {
        name: "Unusual Size vs OI",
        rules: [
          { condition: "over", name: "sizeOIRatio", value: "50%" },
          { condition: "over", name: "size", value: "2K" },
          { condition: "over", name: "open_interest", value: "1K" },
        ],
      },
      etfIndexFlow: {
        name: "ETF & Index Flow",
        rules: [
          { name: "underlying_type", value: ["ETF", "Index"] },
          { name: "option_activity_type", value: ["Sweep", "Block"] },
          { condition: "over", name: "cost_basis", value: "300K" },
        ],
      },
      zeroDteFlow: {
        name: "0DTE Flow",
        rules: [
          { condition: "exactly", name: "date_expiration", value: "0" },
          { name: "option_activity_type", value: ["Sweep", "Block"] },
          { condition: "over", name: "cost_basis", value: "100K" },
        ],
      },
      repeatedFlow: {
        name: "Repeated Flow",
        rules: [
          { name: "flowType", value: ["Repeated Flow"] },
          { condition: "over", name: "volume", value: "10K" },
          { condition: "over", name: "cost_basis", value: "100K" },
        ],
      },
    };

    const strategy = strategies[state];
    if (!strategy || selectedPopularStrategy === strategy.name) {
      return;
    }

    selectedPopularStrategy = strategy.name;
    ruleName = "";
    searchTerm = "";
    filterQuery = "";
    quickSearchTerm = "";
    quickSearchResults = [];
    showQuickSearchDropdown = false;
    selectedQuickSearchIndex = -1;

    ruleOfList = [];
    checkedItems = new Map();
    Object.keys(allRules).forEach((ruleKey) => {
      ruleCondition[ruleKey] = allRules[ruleKey].defaultCondition;
      valueMappings[ruleKey] = allRules[ruleKey].defaultValue;
    });

    ruleOfList = strategy.rules.map((rule) => ({ ...rule }));
    ruleOfList.forEach((rule) => {
      ruleCondition[rule.name] =
        rule.condition ?? allRules[rule.name].defaultCondition;
      valueMappings[rule.name] = rule.value ?? allRules[rule.name].defaultValue;
    });

    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule.name === row.rule),
    );

    checkedItems = new Map(
      ruleOfList
        ?.filter((rule) => categoricalRules?.includes(rule.name))
        ?.map((rule) => [
          rule.name,
          new Set(Array.isArray(rule.value) ? rule.value : [rule.value]),
        ]),
    );

    fetchTableData({ page: 1 });
    sendFiltersToWebSocket();
  }

  function changeRule(state: string) {
    searchTerm = "";
    selectedPopularStrategy = "";
    ruleName = state;
    handleAddRule();

    //const closePopup = document.getElementById("ruleModal");
    //closePopup?.dispatchEvent(new MouseEvent('click'))
  }

  async function switchStrategy(item) {
    ruleName = "";
    selectedPopularStrategy = "";
    selectedStrategy = item?.id ?? "";

    ruleOfList =
      strategyList?.find((item) => item.id === selectedStrategy)?.rules ?? [];

    // Reset all mappings to defaults first, then apply new strategy's rules
    for (const key of Object.keys(valueMappings)) {
      valueMappings[key] = allRules[key]?.defaultValue ?? "any";
      ruleCondition[key] = allRules[key]?.defaultCondition ?? "";
    }
    ruleOfList.forEach((rule) => {
      ruleCondition[rule.name] =
        rule.condition ?? allRules[rule.name]?.defaultCondition ?? "";
      valueMappings[rule.name] =
        rule.value ?? allRules[rule.name]?.defaultValue ?? "any";
    });

    if (ruleOfList?.length === 0) {
      filteredData = [];
      displayedData = [];
    }

    // Update displayed rules
    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule.name === row.rule),
    );

    // Rebuild checkedItems BEFORE fetching
    checkedItems = new Map(
      ruleOfList
        ?.filter((rule) => categoricalRules?.includes(rule.name))
        ?.map((rule) => [rule.name, new Set(Array.isArray(rule.value) ? rule.value : [rule.value])]),
    );

    // Trigger server-side fetch with new rules
    fetchTableData({ page: 1 });
    sendFiltersToWebSocket();
  }

  async function handleCreateStrategy() {
    if (["Pro"]?.includes(data?.user?.tier)) {
      const modalCheckbox = document.getElementById("addStrategy");
      if (modalCheckbox instanceof HTMLInputElement) {
        modalCheckbox.checked = true;
      }
    } else {
      goto("/pricing");
    }
  }

  async function handleDeleteStrategy() {
    const idToDelete = deleteTargetId || selectedStrategy;
    deleteTargetId = "";

    const deletePromise = (async () => {
      const postData = {
        strategyId: idToDelete,
        type: "optionsFlow",
      };

      const response = await fetch("/api/delete-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }

      const output = await response.json();
      if (output !== "success") {
        throw new Error("Server returned failure");
      }

      strategyList =
        strategyList?.filter((item) => item.id !== idToDelete) ?? [];

      if (selectedStrategy === idToDelete) {
        selectedStrategy = strategyList?.at(0)?.id ?? "";
        ruleOfList =
          strategyList?.find((item) => item.id === selectedStrategy)?.rules ?? [];

        // Reset all mappings to defaults, then apply new strategy's rules
        for (const key of Object.keys(valueMappings)) {
          valueMappings[key] = allRules[key]?.defaultValue ?? "any";
          ruleCondition[key] = allRules[key]?.defaultCondition ?? "";
        }
        ruleOfList.forEach((rule) => {
          ruleCondition[rule.name] =
            rule.condition ?? allRules[rule.name]?.defaultCondition ?? "";
          valueMappings[rule.name] =
            rule.value ?? allRules[rule.name]?.defaultValue ?? "any";
        });

        checkedItems = new Map(
          ruleOfList
            ?.filter((rule) => categoricalRules?.includes(rule.name))
            ?.map((rule) => [rule.name, new Set(Array.isArray(rule.value) ? rule.value : [rule.value])]),
        );

        if (ruleOfList.length === 0) {
          filteredData = [];
          displayedData = [];
        }

        // Update displayed rules
        displayRules = allRows?.filter((row) =>
          ruleOfList?.some((rule) => rule.name === row.rule),
        );

        // Trigger server-side fetch with new rules
        fetchTableData({ page: 1 });
        sendFiltersToWebSocket();
      }

      return true;
    })();

    return toast?.promise(deletePromise, {
      loading: "Deleting filter",
      success: "Filter deleted successfully!",
      error: "Delete failed. Please try again.",
      style: `
          border-radius: 5px;
          background: #fff;
          color: #000;
          border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
          font-size: 15px;
        `,
    });
  }

  async function createStrategy(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    formData.append("user", data?.user?.id);

    // If removeList is true (New Filter), use empty rules
    // Otherwise (Save/Save as New), use current ruleOfList
    const rulesToSave = removeList ? [] : ruleOfList;

    formData.append("rules", JSON.stringify(rulesToSave));

    let title = formData.get("title");

    if (!title || title.length === 0) {
      title = "My Filter";
    }

    if (title?.length > 100) {
      toast.error("Title is too long. Please keep it under 100 characters.", {
        style: `
          border-radius: 5px;
          background: #fff;
          color: #000;
          border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
          font-size: 15px;
        `,
      });
      return;
    }

    // build postData object
    const postData = { type: "optionsFlow" };
    for (const [key, value] of formData.entries()) {
      postData[key] = value;
    }

    // wrap the fetch + response check + state updates in a promise
    const createPromise = (async () => {
      const response = await fetch("/api/create-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }

      const output = await response.json();
      if (!output?.id) {
        throw new Error("Server did not return a new strategy ID");
      }

      toast.success("Filter created successfully!", {
        style: `
          border-radius: 5px;
          background: #fff;
          color: #000;
          border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
          font-size: 15px;
        `,
      });

      // close modal
      const closePopup = document.getElementById("addStrategy");
      closePopup?.dispatchEvent(new MouseEvent("click"));

      selectedStrategy = output.id;
      selectedPopularStrategy = "";
      strategyList = [output, ...strategyList];

      // Sync ruleOfList with what was just created
      if (removeList) {
        // "New Filter" path: Set ruleOfList to empty (clean slate)
        removeList = false;

        ruleOfList = [];

        // Reset all rule conditions and values to defaults
        Object.keys(allRules).forEach((ruleName) => {
          ruleCondition[ruleName] = allRules[ruleName].defaultCondition;
          valueMappings[ruleName] = allRules[ruleName].defaultValue;
        });

        // Clear data
        filteredData = [];
        displayedData = [];
        checkedItems = new Map();
      }
      // else: "Save" or "Save as New" - ruleOfList already matches what was saved

      // Update displayed rules
      displayRules = allRows?.filter((row) =>
        ruleOfList?.some((rule) => rule.name === row.rule),
      );

      // Update checkedItems
      checkedItems = new Map(
        ruleOfList
          ?.filter((rule) => categoricalRules?.includes(rule.name))
          ?.map((rule) => [rule.name, new Set(Array.isArray(rule.value) ? rule.value : [rule.value])]),
      );

      // Trigger server-side fetch with new rules
      fetchTableData({ page: 1 });
      sendFiltersToWebSocket();

      return output;
    })();

    // show loading / success / error around the whole operation
    return toast.promise(createPromise, {
      loading: "Creating filter...",
      success: () => "", // we already show success inside the promise
      error: "Something went wrong. Please try again later!",
      style: `
          border-radius: 5px;
          background: #fff;
          color: #000;
          border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
          font-size: 15px;
        `,
    });
  }

  async function handleSave(showMessage) {
    if (!data?.user) return;

    if (strategyList?.length === 0) {
      handleCreateStrategy();
      return; // Don't continue, let createStrategy handle the save
    }

    if (strategyList?.length > 0) {
      const matchedStrategy = strategyList.find((item) => item.id === selectedStrategy);
      if (matchedStrategy) {
        matchedStrategy.rules = ruleOfList;
      }

      const postData = {
        strategyId: selectedStrategy,
        rules: ruleOfList,
        type: "optionsFlow",
      };

      const savePromise = (async () => {
        const response = await fetch("/api/save-strategy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        return response;
      })();

      if (showMessage) {
        return toast.promise(savePromise, {
          loading: "Saving filteres...",
          success: "Filters saved!",
          error: "Save failed. Please try again.",
          style: `
              border-radius: 5px;
              background: #fff;
              color: #000;
              border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
              font-size: 15px;
            `,
        });
      } else {
        // just await without toast
        await savePromise;
      }
    }
  }

  function handleAddRule() {
    if (ruleName === "") {
      toast.error("Please select a rule", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    let newRule;

    switch (ruleName) {
      case "moneyness":
      case "flowType":
      case "put_call":
      case "sentiment":
      case "execution_estimate":
      case "option_activity_type":
      case "underlying_type":
        newRule = {
          name: ruleName,
          value: Array.isArray(valueMappings[ruleName])
            ? valueMappings[ruleName]
            : [valueMappings[ruleName]],
        }; // Ensure value is an array
        break;
      case "excludeTickers":
        newRule = {
          name: ruleName,
          value: valueMappings[ruleName],
        };
        break;
      case "includeTickers":
        newRule = {
          name: ruleName,
          value: valueMappings[ruleName],
        };
        break;
      default:
        newRule = {
          name: ruleName,
          condition: ruleCondition[ruleName],
          value: valueMappings[ruleName],
        };
        break;
    }
    handleRule(newRule);
  }

  async function handleRule(newRule) {
    const existingRuleIndex = ruleOfList.findIndex(
      (rule) => rule.name === newRule.name,
    );

    if (existingRuleIndex !== -1) {
      const existingRule = ruleOfList[existingRuleIndex];
      if (existingRule.name === newRule.name) {
        // Remove the rule instead of showing an error
        ruleOfList.splice(existingRuleIndex, 1);
        ruleOfList = [...ruleOfList]; // Trigger reactivity
        Object.keys(allRules).forEach((ruleName) => {
          ruleCondition[ruleName] = allRules[ruleName].defaultCondition;
          valueMappings[ruleName] = allRules[ruleName].defaultValue;
        });
        displayRules = allRows?.filter((row) =>
          ruleOfList.some((rule) => rule.name === row.rule),
        );
        debouncedFilterFetch();
      } else {
        ruleOfList[existingRuleIndex] = newRule;
        ruleOfList = [...ruleOfList]; // Trigger reactivity
        debouncedFilterFetch();
      }
    } else {
      ruleOfList = [...ruleOfList, newRule];
      displayRules = allRows?.filter((row) =>
        ruleOfList.some((rule) => rule.name === row.rule),
      );
      debouncedFilterFetch();
    }
  }

  async function changeRuleCondition(name: string, state: string) {
    ruleName = name;
    if (
      ruleCondition[ruleName] === "between" &&
      ["over", "under"]?.includes(state?.toLowerCase())
    ) {
      valueMappings[ruleName] = "";
    }
    ruleCondition[ruleName] = state?.toLowerCase();

    await handleChangeValue(valueMappings[ruleName]);
  }

  let checkedItems = new Map(
    ruleOfList
      ?.filter((rule) => categoricalRules?.includes(rule.name))
      ?.map((rule) => [rule.name, new Set(Array.isArray(rule.value) ? rule.value : [rule.value])]),
  );

  function isChecked(item, ruleKey = ruleName) {
    const itemSet = checkedItems.get(ruleKey);
    return itemSet ? itemSet.has(item) : false;
  }

  function parseValue(val) {
    if (typeof val === "string") {
      // Handle percentage values
      if (val.endsWith("%")) {
        return parseFloat(val);
      }
      // Handle values with suffixes like K (thousand), M (million), B (billion)
      const suffixMap = {
        K: 1e3,
        M: 1e6,
        B: 1e9,
      };
      const suffix = val.slice(-1).toUpperCase();
      const numberPart = parseFloat(val);
      if (suffix in suffixMap) {
        return numberPart * suffixMap[suffix];
      }
    }
    return parseFloat(val);
  }

  // Format premium amounts (e.g., $186.6M)
  function formatPremium(value) {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  }

  // Custom sorting function
  function customSort(a, b) {
    return parseValue(a) - parseValue(b);
  }

  async function handleChangeValue(value, { shouldSort = true } = {}) {
    // Toggle checkedItems logic - handle Map structure
    if (!checkedItems.has(ruleName)) {
      checkedItems.set(ruleName, new Set());
    }
    const itemSet = checkedItems.get(ruleName);
    if (itemSet.has(value)) {
      itemSet.delete(value);
    } else {
      itemSet.add(value);
    }
    // Reassign to trigger Svelte reactivity (Svelte 4 doesn't track Map/Set mutations)
    checkedItems = new Map(checkedItems);

    // Specific rule handling for options-related rules
    if (categoricalRules?.includes(ruleName)) {
      // Ensure valueMappings[ruleName] is initialized as an array
      if (!Array.isArray(valueMappings[ruleName])) {
        valueMappings[ruleName] = [];
      }

      // Similar logic to the original function for adding/removing values
      const index = valueMappings[ruleName].indexOf(value);
      if (index === -1) {
        valueMappings[ruleName].push(value);

        // Sort the array when a new value is added, respecting shouldSort parameter
        if (shouldSort) {
          valueMappings[ruleName] = valueMappings[ruleName].sort(customSort);
        }
      } else {
        valueMappings[ruleName].splice(index, 1);
      }

      // Set to "any" if no values are selected
      if (valueMappings[ruleName].length === 0) {
        valueMappings[ruleName] = "any";
      }
    } else if (ruleName in valueMappings) {
      // For rules that require sorting (like range or numeric values)
      if (ruleCondition[ruleName] === "between" && Array.isArray(value)) {
        // Sort the array for between conditions, respecting shouldSort parameter
        valueMappings[ruleName] = shouldSort ? value.sort(customSort) : value;
      } else {
        // Handle non-specific rules as single values
        valueMappings[ruleName] = value;
      }
    } else {
      console.warn(`Unhandled rule: ${ruleName}`);
    }

    // Update ruleOfList (if applicable)
    const ruleToUpdate = ruleOfList?.find((rule) => rule.name === ruleName);
    if (ruleToUpdate) {
      ruleToUpdate.value = valueMappings[ruleToUpdate.name];
      ruleToUpdate.condition = ruleCondition[ruleToUpdate.name];
      ruleOfList = [...ruleOfList];
    }

    // Trigger server-side fetch (debounced to batch rapid changes)
    debouncedFilterFetch();
  }

  async function stepSizeValue(value, condition) {
    const match = value.toString().match(/^(-?[\d.]+)([KMB%]?)$/);
    if (!match) return value;

    let [_, number, suffix] = match;
    number = parseFloat(number);

    let step = 1;

    number += condition === "add" ? step : -step;

    // Round to 2 decimal places for consistency
    number = parseFloat(number?.toFixed(2));
    const newValue = suffix ? `${number}${suffix}` : Math?.round(number);
    await handleChangeValue(newValue);
  }

  async function handleValueInput(event, ruleName, index = null) {
    const newValue = event.target.value;

    if (ruleCondition[ruleName] === "between") {
      const currentValues = [...(valueMappings[ruleName] || ["", ""])];
      currentValues[index] = newValue;
      await handleChangeValue(currentValues, { shouldSort: false });
    } else {
      await handleChangeValue(newValue);
    }
  }

  const currentTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
  )?.getTime();

  const initialFeed = data?.getOptionsFlowFeed?.items ?? [];
  const initialStats = data?.getOptionsFlowFeed?.stats ?? null;

  let rawData = prepareInitialFlowData(initialFeed);

  let displayedData = [...rawData];

  let flowSentiment;
  let putCallRatio;
  let displayCallVolume;
  let displayPutVolume;
  let displayCallPremium;
  let displayPutPremium;
  let callPercentage;
  let putPercentage;
  let bullishPercentage = 0;
  let bearishPercentage = 0;
  let displayBullishPremium = 0;
  let displayBearishPremium = 0;

  let audio;
  let muted = false;
  let notFound = false;
  let isLoaded = false;

  // Pro users start with modeStatus=true to fetch historical data via WebSocket
  // When market is closed, WebSocket disconnects after historical data is received
  let modeStatus = data?.user?.tier === "Pro" ? true : false;

  async function toggleMode() {
    if ($isOpen) {
      // Check if user is trying to enable live mode and is not a Pro member
      if (!modeStatus && data?.user?.tier !== "Pro") {
        toast.error("Live Flow is available for Pro members only.", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
        return;
      }

      // Pro members can toggle freely
      if (data?.user?.tier === "Pro") {
        modeStatus = !modeStatus;
        if (modeStatus === true) {
          // Switching to live mode — re-fetch current page from server
          if (selectedDate !== undefined) {
            selectedDate = undefined;
            await fetchTableData({ page: 1 });
          }
          console.log("Switching to live mode - connecting WebSocket");
          connectWebSocket();
        } else {
          // Switching to historical mode - disconnect WebSocket
          console.log("Switching to historical mode - disconnecting WebSocket");
          disconnectWebSocket();
        }
      }
    }
  }

  // --- Function to clear the currently scheduled timeout ---
  function clearScheduledUpdate() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    } else {
      console.log("No scheduled update timeout to clear.");
    }
  }
  // -------------------------------------------------------

  // --- Function to schedule the *next* update ---
  function scheduleNextUpdate(delay = 6000) {
    // Only schedule if component is not destroyed and $isOpen is true
    if (!isComponentDestroyed && $isOpen) {
      //console.log(`Scheduling next update in ${delay}ms.`);
      // Clear any existing timeout before setting a new one (safety)
      clearScheduledUpdate();
      timeoutId = setTimeout(updateOptionsFlowData, delay);
    } else if (isComponentDestroyed) {
      //console.log("Not scheduling next update because component is destroyed.");
    } else if (!$isOpen) {
      console.log("Not scheduling next update because $isOpen is false.");
    }
  }
  // --------------------------------------------

  // WebSocket connection functions
  async function refreshWsToken() {
    try {
      const response = await fetch("/api/generate-ws-token", {
        method: "POST",
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.token) {
          data.wsToken = result.token;
          return true;
        }
      }
    } catch (e) {
      console.error("Failed to refresh WS token:", e);
    }
    return false;
  }

  function connectWebSocket() {
    if (data?.user?.tier !== "Pro" || !data?.wsURL || !data?.wsToken) {
      return;
    }

    // Prevent duplicate connections
    if (
      socket &&
      (socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN)
    ) {
      console.log("WebSocket already connected or connecting");
      return;
    }

    try {
      // Include token in WebSocket URL for authentication
      const wsUrlWithToken = `${data.wsURL}/options-flow?token=${encodeURIComponent(data.wsToken)}`;
      socket = new WebSocket(wsUrlWithToken);

      socket.addEventListener("open", () => {
        console.log("Options Flow WebSocket connection opened");
        reconnectAttempts = 0;

        // Send init with filters — server marks all current cache items as "already sent"
        const message = {
          type: "init",
          filters: buildWsFilters(),
        };
        socket.send(JSON.stringify(message));
      });

      socket.addEventListener("message", async (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle live updates only (array of new trades)
          const newData = Array.isArray(message) ? message : null;
          if (newData && newData.length > 0) {
            // Always play notification sound for new live trades, regardless
            // of current page, in-flight fetches, or batch size so the user
            // is always aware new trades arrived.
            if (!muted && audio) {
              audio?.play()?.catch((error) => {
                console.log("Audio play failed:", error);
              });
            }

            // Skip data/pagination updates while a REST fetch is in-flight
            // to avoid a data race — the REST response will set authoritative
            // counts and data when it completes.
            if (isFetchingPage) return;

            // Safety: if server accidentally sends a huge batch, refresh from API instead
            if (newData.length > 200) {
              console.warn(
                "WebSocket sent large batch (" +
                  newData.length +
                  " items), refreshing from API",
              );
              await fetchTableData();
              return;
            }

            console.log("Received new live trades:", newData.length);

            const prepared = prepareInitialFlowData(newData);

            // Deduplicate against items already on screen to prevent
            // the race where the WS poll delivers the same trades that
            // the REST fetch already loaded (e.g. after filter change
            // or server cold-start when sentIds is empty).
            const existingIds = new Set(
              displayedData.map((item) => item?.id).filter(Boolean),
            );
            const trulyNew = prepared.filter(
              (item) => !existingIds.has(item?.id),
            );

            if (trulyNew.length === 0) return;

            // Update pagination metadata so controls stay accurate
            totalItems = (totalItems || 0) + trulyNew.length;
            totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

            // Only update visible rows when on page 1 AND using the default
            // time-desc sort.  New trades sort to position 0 only in that
            // configuration.  For any other sort (e.g. premium, size) or
            // page 2+, prepending would displace items that legitimately
            // belong on the current page — so we just update the counts
            // above and leave the view untouched.
            const isDefaultSort =
              activeSortKey === "time" && activeSortOrder === "desc";

            if (currentPage === 1 && isDefaultSort) {
              displayedData = [...trulyNew, ...displayedData].slice(
                0,
                rowsPerPage,
              );
              rawData = displayedData;
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });

      socket.addEventListener("close", async (event) => {
        console.log("Options Flow WebSocket closed:", event.code, event.reason);
        socket = null;

        if (!$isOpen || !modeStatus || isComponentDestroyed) return;

        // Token expired — refresh before reconnecting
        if (event.code === 4001) {
          console.log("Token expired, refreshing...");
          const refreshed = await refreshWsToken();
          if (!refreshed) return;
          reconnectAttempts = 0;
        }

        reconnectAttempts++;
        const delay = Math.min(5000 * reconnectAttempts, 30000);
        console.log(
          `Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})...`,
        );
        reconnectInterval = setTimeout(() => {
          connectWebSocket();
        }, delay);
      });

      socket.addEventListener("error", (error) => {
        console.error("Options Flow WebSocket error:", error);
      });
    } catch (error) {
      console.error("Failed to establish WebSocket connection:", error);
    }
  }

  function disconnectWebSocket() {
    if (reconnectInterval) {
      clearTimeout(reconnectInterval);
      reconnectInterval = null;
    }

    if (socket) {
      socket.close();
      socket = null;
    }
  }

  // --- Reactive statement handles WebSocket connection based on market status and mode ---
  // Only connect when market is open — no live trades arrive when market is closed
  $: if (data?.user?.tier === "Pro" && modeStatus && $isOpen) {
    connectWebSocket();
  } else if (data?.user?.tier !== "Pro" || !modeStatus || !$isOpen) {
    disconnectWebSocket();
  }

  // Keep the old REST API function for non-Pro users
  async function updateOptionsFlowData() {
    // This function is now only used for non-Pro users
    // Pro users use WebSocket instead
    if (data?.user?.tier === "Pro") {
      return; // Pro users use WebSocket
    }

    // Non-Pro users continue to use the initial data from server-side load
    // No real-time updates for non-Pro users
  }

  function daysLeft(targetDate) {
    const targetTime = new Date(targetDate).getTime();
    const difference = targetTime - currentTime;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math?.ceil(difference / millisecondsPerDay);

    return daysLeft;
  }

  // Toggle full width mode
  function toggleFullWidth() {
    isFullWidth = !isFullWidth;
    try {
      localStorage.setItem("options-flow-full-width", String(isFullWidth));
    } catch (e) {
      console.warn("Failed to save full width preference:", e);
    }
  }

  onMount(async () => {
    // Load full width preference
    const savedFullWidth = localStorage.getItem("options-flow-full-width");
    if (savedFullWidth !== null) {
      isFullWidth = savedFullWidth === "true";
    }

    ruleOfList?.forEach((rule) => {
      ruleCondition[rule.name] =
        rule.condition ?? allRules[rule.name]?.defaultCondition ?? "";
      valueMappings[rule.name] =
        rule.value ?? allRules[rule.name]?.defaultValue ?? "any";
    });

    // Load muted state from localStorage
    const savedMutedState = localStorage.getItem("optionsFlowMuted");
    if (savedMutedState !== null) {
      muted = JSON.parse(savedMutedState);
    }

    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule?.name === row?.rule),
    );

    audio = new Audio(notifySound);

    // Apply server stats from SSR data
    if (initialStats) {
      applyServerStats(initialStats);
    }

    // Load saved rows per page preference
    const storedRows = loadRowsPerPage();
    if (storedRows !== rowsPerPage) {
      changeRowsPerPage(storedRows);
    }

    isLoaded = true;

    if (data?.watchlistFull) {
      toast.info("Your options watchlist is full (300 trades max). Remove some to add new ones.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  });

  onDestroy(async () => {
    isComponentDestroyed = true;
    clearScheduledUpdate();
    disconnectWebSocket();

    if (audio) {
      audio?.pause();
      audio = null;
    }
  });

  function calculateStats(data) {
    const {
      callVolumeSum,
      putVolumeSum,
      callPremiumSum,
      putPremiumSum,
      bullishCount,
      bearishCount,
      neutralCount,
      bullishPremiumSum,
      bearishPremiumSum,
    } = data?.reduce(
      (acc, item) => {
        const volume = parseInt(item?.size) || 0;
        const premium = parseFloat(item?.cost_basis) || 0;

        if (item?.put_call === "Calls") {
          acc.callVolumeSum += volume;
          acc.callPremiumSum += premium;
        } else if (item?.put_call === "Puts") {
          acc.putVolumeSum += volume;
          acc.putPremiumSum += premium;
        }

        if (item?.sentiment === "Bullish") {
          acc.bullishCount += 1;
          acc.bullishPremiumSum += premium;
        } else if (item?.sentiment === "Bearish") {
          acc.bearishCount += 1;
          acc.bearishPremiumSum += premium;
        } else if (item?.sentiment === "Neutral") {
          acc.neutralCount += 1;
        }

        return acc;
      },
      {
        callVolumeSum: 0,
        putVolumeSum: 0,
        callPremiumSum: 0,
        putPremiumSum: 0,
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        bullishPremiumSum: 0,
        bearishPremiumSum: 0,
      },
    );

    if (bullishCount > bearishCount) {
      flowSentiment = "Bullish";
    } else if (bullishCount < bearishCount) {
      flowSentiment = "Bearish";
    } else if (neutralCount > bearishCount && neutralCount > bullishCount) {
      flowSentiment = "Neutral";
    } else {
      flowSentiment = "-";
    }

    putCallRatio = callVolumeSum !== 0 ? putVolumeSum / callVolumeSum : 0;

    callPercentage =
      callVolumeSum + putVolumeSum !== 0
        ? Math.floor((callVolumeSum / (callVolumeSum + putVolumeSum)) * 100)
        : 0;
    putPercentage =
      callVolumeSum + putVolumeSum !== 0 ? 100 - callPercentage : 0;

    displayCallVolume = callVolumeSum;
    displayPutVolume = putVolumeSum;
    displayCallPremium = callPremiumSum;
    displayPutPremium = putPremiumSum;
    displayBullishPremium = bullishPremiumSum;
    displayBearishPremium = bearishPremiumSum;

    const totalSentimentPremium = bullishPremiumSum + bearishPremiumSum;
    bullishPercentage =
      totalSentimentPremium !== 0
        ? Math.round((bullishPremiumSum / totalSentimentPremium) * 100)
        : 0;
    bearishPercentage =
      totalSentimentPremium !== 0 ? 100 - bullishPercentage : 0;
  }

  const getHistoricalFlow = async () => {
    if (data?.user?.tier === "Pro") {
      modeStatus = false;
      isLoaded = false;

      // Disconnect WebSocket when viewing historical data
      disconnectWebSocket();

      displayRules = allRows?.filter((row) =>
        ruleOfList.some((rule) => rule.name === row.rule),
      );
      displayedData = [];

      await new Promise((resolve) => setTimeout(resolve, 300));

      // fetchTableData checks selectedDate and routes to historical endpoint
      await fetchTableData({ page: 1 });
    } else {
      goto("/pricing");
    }
  };

  $: {
    if (searchTerm) {
      filteredRows = allRows?.filter((row) =>
        row?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
      );
    }
  }
</script>

<SEO
  title={options_flow_seo_title()}
  description={options_flow_seo_description()}
  keywords={options_flow_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: options_flow_structured_name(),
    description: options_flow_structured_description(),
    url: "https://stocknear.com/options-flow",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Options Flow",
          item: "https://stocknear.com/options-flow",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free live options flow scanner",
    },
    featureList: [
      "Live sweeps & blocks",
      "Unusual options activity",
      "Call/put flow breakdown",
      "Premium & size filters",
      "Short-term setup discovery",
    ],
  }}
/>

<section class="overflow-y-auto mb-10 text-gray-700 dark:text-zinc-200">
  <div
    class="w-full flex justify-center items-center p-3 sm:p-0 transition-all duration-300 {isFullWidth
      ? 'max-w-full'
      : 'max-w-screen sm:max-w-[1400px]'}"
  >
    <div class="w-full m-auto min-h-screen">
      <!--
        <div class="text-sm sm:text-[1rem] breadcrumbs mb-5">
          <ul>
            <li><a href="/" class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition">Home</a></li>
            <li class="text-muted dark:text-gray-300">Options Flow</li>
          </ul>
        </div>
        -->
      <div class="sm:rounded">
        <div class="flex flex-col md:flex-row items-start md:items-center mb-3">
          <div
            class="w-full flex flex-row items-center sm:mt-4"
          >
            <h1
              class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {options_flow_main_title()}
            </h1>
            <a
              href="/watchlist/options"
              class="ml-2 sm:ml-3 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition whitespace-nowrap"
            >
              <svg
                class="w-3.5 h-3.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Watchlist
            </a>
          </div>

          <div class="flex flex-row items-center w-full mt-5">
            <div class="flex w-full sm:w-[50%] md:block md:w-auto sm:ml-auto">
              <div
                class="hidden text-xs uppercase tracking-wide font-semibold md:block sm:mb-1 text-gray-500 dark:text-zinc-400"
              >
                {options_flow_popular_filters()}
              </div>
              <div class="relative inline-block text-left grow">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="min-w-[110px]  w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="truncate"
                        >{selectedPopularStrategy?.length !== 0
                          ? selectedPopularStrategy
                          : options_flow_select_popular()}</span
                      >
                      <svg
                        class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    alignOffset={0}
                    class="w-fit  h-fit max-h-72 overflow-hidden overflow-y-auto scroller rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1.5 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <DropdownMenu.Label
                      class="text-gray-500 dark:text-zinc-400 font-normal"
                    >
                      {options_flow_popular_strategies()}
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Group>
                      {#each popularStrategyList as item}
                        <DropdownMenu.Item
                          on:click={() => {
                            if (data?.user?.tier !== "Pro") {
                              goto("/pricing");
                            } else {
                              applyPopularStrategy(item?.key);
                            }
                          }}
                          class="cursor-pointer sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                        >
                          {item?.label}
                          {#if data?.user?.tier !== "Pro"}
                            <svg
                              class="ml-1 size-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              style="max-width: 40px;"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clip-rule="evenodd"
                              >
                              </path>
                            </svg>
                          {/if}
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </div>

            <div class=" flex w-full sm:w-[50%] md:block md:w-auto ml-2">
              <div
                class="hidden text-xs uppercase tracking-wide font-semibold md:block sm:mb-1 text-gray-500 dark:text-zinc-400"
              >
                {options_flow_saved_filters()}
              </div>
              <div class="relative inline-block w-full">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="min-w-[110px]  w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="truncate max-w-48"
                        >{selectedStrategy?.length !== 0
                          ? strategyList?.find(
                              (item) => item.id === selectedStrategy,
                            )?.title
                          : options_flow_select_filter()}</span
                      >
                      <svg
                        class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    class="w-fit  h-fit max-h-72 overflow-hidden overflow-y-auto scroller rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1.5 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <DropdownMenu.Label
                      class="text-gray-500 dark:text-zinc-400 font-normal"
                    >
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          on:click={() => {
                            removeList = true;
                            handleCreateStrategy();
                          }}
                          builders={[builder]}
                          class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition focus:outline-hidden"
                        >
                          <svg
                            class="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            style="max-width:40px"
                            aria-hidden="true"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                              clip-rule="evenodd"
                            ></path>
                          </svg>
                          <div class="text-sm text-start">
                            {options_flow_new_filter()}
                          </div>
                        </Button>
                      </DropdownMenu.Trigger>
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Group>
                      {#each strategyList as item}
                        <DropdownMenu.Item
                          on:click={(e) => {
                            e.preventDefault();
                            switchStrategy(item);
                          }}
                          class="whitespace-nowrap {item?.id ===
                          selectedStrategy
                            ? 'text-violet-600 dark:text-violet-400'
                            : ''} cursor-pointer sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                        >
                          {item?.title?.length > 20
                            ? item?.title?.slice(0, 20) + "..."
                            : item?.title} ({item?.rules?.length})

                          <!-- svelte-ignore a11y-click-events-have-key-events -->
                          <label
                            for="deleteStrategy"
                            on:click|stopPropagation={() => { deleteTargetId = item?.id; }}
                            class="ml-auto inline-block cursor-pointer sm:hover:text-red-500"
                          >
                            <svg
                              class="size-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              stroke-width="2"
                              style="max-width:40px"
                              ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              ></path></svg
                            >
                          </label>
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>
        </div>

        <div
          class="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-3"
        >
          <div
            class="flex flex-col sm:flex-row items-center pt-3 sm:pt-1 pb-3 sm:border-b sm:border-gray-300 dark:border-zinc-700"
          >
            <div
              class="flex flex-row items-center justify-center sm:justify-start"
            >
              <label
                data-tip="Audio Preference"
                on:click={() => {
                  muted = !muted;
                  localStorage.setItem(
                    "optionsFlowMuted",
                    JSON.stringify(muted),
                  );
                }}
                class=" xl:tooltip xl:tooltip-bottom flex flex-col items-center mr-3 cursor-pointer"
              >
                <div
                  class="rounded-full w-10 h-10 relative border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 flex items-center justify-center"
                >
                  {#if !muted}
                    <svg
                      class="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      ><path
                        fill="currentColor"
                        d="M9 2.5a.5.5 0 0 0-.849-.358l-2.927 2.85H3.5a1.5 1.5 0 0 0-1.5 1.5v2.99a1.5 1.5 0 0 0 1.5 1.5h1.723l2.927 2.875A.5.5 0 0 0 9 13.5zm1.111 2.689a.5.5 0 0 1 .703-.08l.002.001l.002.002l.005.004l.015.013l.046.04c.036.034.085.08.142.142c.113.123.26.302.405.54c.291.48.573 1.193.573 2.148c0 .954-.282 1.668-.573 2.148a3.394 3.394 0 0 1-.405.541a2.495 2.495 0 0 1-.202.196l-.008.007h-.001s-.447.243-.703-.078a.5.5 0 0 1 .075-.7l.002-.002l-.001.001l.002-.001h-.001l.018-.016c.018-.017.048-.045.085-.085a2.4 2.4 0 0 0 .284-.382c.21-.345.428-.882.428-1.63c0-.747-.218-1.283-.428-1.627a2.382 2.382 0 0 0-.368-.465a.5.5 0 0 1-.096-.717m1.702-2.08a.5.5 0 1 0-.623.782l.011.01l.052.045c.047.042.116.107.201.195c.17.177.4.443.63.794c.46.701.92 1.733.92 3.069a5.522 5.522 0 0 1-.92 3.065c-.23.35-.46.614-.63.79a3.922 3.922 0 0 1-.252.24l-.011.01h-.001a.5.5 0 0 0 .623.782l.033-.027l.075-.065c.063-.057.15-.138.253-.245a6.44 6.44 0 0 0 .746-.936a6.522 6.522 0 0 0 1.083-3.614a6.542 6.542 0 0 0-1.083-3.618a6.517 6.517 0 0 0-.745-.938a4.935 4.935 0 0 0-.328-.311l-.023-.019l-.007-.006l-.002-.002zM10.19 5.89l-.002-.001Z"
                      /></svg
                    >
                  {:else}
                    <svg
                      class="w-4 h-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><path
                        fill="currentColor"
                        d="M3.28 2.22a.75.75 0 1 0-1.06 1.06L6.438 7.5H4.25A2.25 2.25 0 0 0 2 9.749v4.497a2.25 2.25 0 0 0 2.25 2.25h3.68a.75.75 0 0 1 .498.19l4.491 3.994c.806.716 2.081.144 2.081-.934V16.06l5.72 5.72a.75.75 0 0 0 1.06-1.061zm13.861 11.74l1.138 1.137A6.974 6.974 0 0 0 19 12a6.973 6.973 0 0 0-.84-3.328a.75.75 0 0 0-1.32.714c.42.777.66 1.666.66 2.614c0 .691-.127 1.351-.359 1.96m2.247 2.246l1.093 1.094A9.956 9.956 0 0 0 22 12a9.959 9.959 0 0 0-1.96-5.946a.75.75 0 0 0-1.205.892A8.459 8.459 0 0 1 20.5 12a8.458 8.458 0 0 1-1.112 4.206M9.52 6.338l5.48 5.48V4.25c0-1.079-1.274-1.65-2.08-.934z"
                      /></svg
                    >
                  {/if}
                </div>
              </label>

              <span
                class="text-xs sm:text-sm sm:text-lg text-gray-500 dark:text-zinc-400 mr-3"
              >
                {$isOpen ? options_flow_paused() : options_flow_market_closed()}
              </span>

              <label
                on:click={() => {
                  if (!$isOpen) {
                    toast?.error(`Market is closed`, {
                      style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                    });
                  }
                }}
                class="inline-flex items-center cursor-pointer focus-none focus:outline-hidden"
              >
                <input
                  on:click={(e) => {
                    toggleMode();
                  }}
                  type="checkbox"
                  checked={!$isOpen ? false : modeStatus}
                  value={!$isOpen ? false : modeStatus}
                  disabled={!$isOpen}
                  class="sr-only peer"
                />

                <div
                  class="relative w-11 h-6 focus:outline-hidden peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:rtl:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300/70 dark:after:border-zinc-700/80 after:border after:rounded-full after:h-5 after:w-5 after:transition-all {$isOpen &&
                  modeStatus
                    ? 'bg-emerald-500'
                    : 'bg-gray-200/80 dark:bg-zinc-800'}"
                ></div>
              </label>

              <div class=" ml-3 flex flex-col items-start">
                <span
                  class="text-xs sm:text-sm sm:text-lg {$isOpen && modeStatus
                    ? 'text-emerald-800 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-zinc-400'}"
                >
                  {options_flow_live_flow()}
                </span>
              </div>
            </div>

            <div class="sm:ml-auto w-full sm:w-fit mt-3 sm:mt-0">
              <div class="relative flex flex-col sm:flex-row items-center">
                <Popover.Root>
                  <Popover.Trigger asChild let:builder>
                    <Button
                      class="shadow w-full sm:w-[160px] truncate py-2.5 border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 justify-center sm:justify-start text-center sm:text-left rounded-full font-medium hover:text-violet-600 dark:hover:text-violet-400 transition"
                      builders={[builder]}
                    >
                      <CalendarIcon
                        class="mr-2 h-4 w-4 text-gray-500 dark:text-zinc-400"
                      />
                      <span class="text-sm font-medium tracking-tight">
                        {selectedDate
                          ? df.format(selectedDate?.toDate())
                          : options_flow_pick_date()}
                      </span>
                    </Button>
                  </Popover.Trigger>

                  <Popover.Content
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    alignOffset={0}
                    class="w-auto p-0 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 bg-white/95 dark:bg-zinc-950/95 rounded-2xl shadow-none"
                  >
                    <Calendar
                      class=" "
                      bind:value={selectedDate}
                      minValue={calendarMinDate}
                      maxValue={calendarMaxDate}
                      initialFocus
                      onValueChange={getHistoricalFlow}
                    />
                  </Popover.Content>
                </Popover.Root>
              </div>
            </div>
          </div>

          <div
            class="mr-1 flex items-center justify-between lg:mr-2 pb-1.5 border-b border-gray-300 dark:border-zinc-700 mt-1.5"
          >
            <button
              on:click={() => (showFilters = !showFilters)}
              class="flex cursor-pointer items-center text-base sm:text-lg font-semibold text-gray-900 dark:text-white"
              title={showFilters
                ? options_flow_hide_filter_area()
                : options_flow_show_filter_area()}
            >
              <svg
                class="-mb-0.5 h-6 w-6 {showFilters ? '' : '-rotate-90'} "
                viewBox="0 0 20 20"
                fill="currentColor"
                style="max-width:40px"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              {options_flow_filters_count({ count: ruleOfList?.length })}
            </button>
            <div class="flex flex-row items-center ml-auto justify-start">
              <div class="flex items-center gap-1">
                <span class="inline-flex items-center text-xs">
                  <Zap class="w-3 h-3 mr-1" />
                  {options_flow_realtime_data()}
                </span>
                <InfoModal
                  id="options-flow-info"
                  title={options_flow_realtime_data_title()}
                  content={options_flow_realtime_data_content()}
                />
              </div>
            </div>
          </div>

          {#if showFilters}
            <div
              class="mt-3 flex flex-col gap-y-2.5 sm:flex-row lg:gap-y-2 pb-1"
            >
              <label
                for="ruleModal"
                class="text-sm inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-900/90 dark:border-white/80 py-2 pl-3 pr-4 font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus:outline-hidden"
              >
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style="max-width:40px"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                <div>{options_flow_add_filters()}</div>
              </label>

              <!-- Quick Search Input -->
              <div class="relative lg:ml-3">
                <div class="relative">
                  <div
                    class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                  >
                    <svg
                      class="w-4 h-4 text-gray-400 dark:text-zinc-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 20"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={options_flow_search_filters({
                      count: allRows?.length,
                    })}
                    bind:value={quickSearchTerm}
                    on:input={handleQuickSearchInput}
                    on:keydown={handleQuickSearchKeydown}
                    on:focus={() => updateQuickSearchResults(quickSearchTerm)}
                    on:blur={closeQuickSearchDropdown}
                    class="block w-full lg:w-64 py-2.5 bg-white/80 dark:bg-zinc-950/60 placeholder:text-gray-800 dark:placeholder:text-zinc-300 pl-10 text-sm border border-gray-300 dark:border-zinc-700 rounded-full focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80"
                  />

                  <!-- Clear button -->
                  {#if quickSearchTerm.length > 0}
                    <button
                      type="button"
                      on:click={() => {
                        quickSearchTerm = "";
                        quickSearchResults = [];
                        showQuickSearchDropdown = false;
                      }}
                      class="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <svg
                        class="cursor-pointer w-4 h-4 text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  {/if}
                </div>

                <!-- Quick Search Dropdown -->
                {#if showQuickSearchDropdown && quickSearchResults.length > 0}
                  <div
                    class="absolute z-50 w-full mt-1 bg-white/95 dark:bg-zinc-950/95 border border-gray-300 dark:border-zinc-700 rounded-2xl shadow-none max-h-64 overflow-y-auto"
                    in:scale={{
                      start: 0.98,
                      duration: 140,
                      delay: 50,
                      easing: cubicOut,
                    }}
                    out:fade={{ duration: 90 }}
                  >
                    {#each quickSearchResults as result, index}
                      <button
                        class="cursor-pointer w-full px-2 py-2 flex flex-row items-center text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 {index ===
                        selectedQuickSearchIndex
                          ? 'text-violet-600 dark:text-violet-400'
                          : ''}"
                        type="button"
                        on:click={() => selectQuickSearchRule(result)}
                      >
                        <svg
                          class="w-4 h-4 text-icon inline-block ml-1 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width:40px"
                          ><path
                            fill-rule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clip-rule="evenodd"
                          ></path></svg
                        >

                        <label
                          class="cursor-pointer text-left text-sm sm:text-[0.9rem]"
                        >
                          <div class="font-medium">
                            {result.label}
                          </div>
                        </label>
                      </button>
                    {/each}
                  </div>
                {/if}

                <!-- No results message -->
                {#if showQuickSearchDropdown && quickSearchTerm.length > 0 && quickSearchResults.length === 0}
                  <div
                    class="absolute z-50 w-full mt-1 bg-white/95 dark:bg-zinc-950/95 border border-gray-300 dark:border-zinc-700 rounded-2xl shadow-none p-4 text-center text-sm text-gray-500 dark:text-zinc-400"
                  >
                    {options_flow_no_filters_found()}
                  </div>
                {/if}
              </div>

              {#if data?.user}
                <label
                  for={!data?.user ? "userLogin" : ""}
                  on:click={() => handleSave(true)}
                  class="text-sm sm:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-2 pl-3 pr-4 font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus:outline-hidden"
                >
                  <svg
                    class="w-4 h-4 mr-2 inline-block cursor-pointer shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    ><path
                      fill="currentColor"
                      d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327l4.898.696c.441.062.612.636.282.95l-3.522 3.356l.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
                    /></svg
                  >

                  <div>{options_flow_save()}</div>
                </label>

                {#if strategyList?.length > 0}
                  <label
                    for={!data?.user
                      ? "userLogin"
                      : ["Pro"]?.includes(data?.user?.tier)
                        ? "addStrategy"
                        : ""}
                    on:click={() => {
                      if (!["Pro"]?.includes(data?.user?.tier) && data?.user) {
                        goto("/pricing");
                      }
                    }}
                    class="text-sm sm:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 py-2 pl-3 pr-4 font-semibold transition hover:text-violet-600 dark:hover:text-violet-400 focus:outline-hidden"
                  >
                    <Copy class="w-4 h-4 inline-block mr-2" />
                    <div>{options_flow_save_as_new()}</div>
                  </label>
                {/if}
              {/if}

              {#if ruleOfList?.length !== 0}
                <label
                  on:click={handleResetAll}
                  class="text-sm lg:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 py-2 pl-3 pr-4 font-semibold transition hover:text-rose-800 dark:hover:text-rose-400 focus:outline-hidden"
                >
                  <svg
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 21 21"
                    ><g
                      fill="none"
                      fill-rule="evenodd"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      ><path d="M3.578 6.487A8 8 0 1 1 2.5 10.5" /><path
                        d="M7.5 6.5h-4v-4"
                      /></g
                    ></svg
                  >

                  <div>{options_flow_reset_all()}</div>
                </label>
              {/if}
            </div>

            <div
              class="sm:grid sm:gap-x-2.5 md:grid-cols-2 lg:grid-cols-3 w-full mt-3 border-t border-gray-300 dark:border-zinc-700"
            >
              {#each displayRules as row (row?.rule)}
                <!--Start Added Rules-->
                {#if textInputRules?.includes(row?.rule)}
                  <div
                    class="flex items-center justify-between space-x-2 px-1 py-1.5 text-[0.95rem] leading-tight"
                    in:scale={{
                      start: 0.98,
                      duration: 160,
                      delay: 50,
                      easing: cubicOut,
                    }}
                    out:fade={{ duration: 100 }}
                  >
                    <div class="flex flex-row items-start sm:items-end">
                      {row?.label?.length > 20
                        ? row?.label?.slice(0, 20)?.replace("[%]", "") + "..."
                        : row?.label?.replace("[%]", "")}
                      <InfoModal
                        id={row?.rule}
                        title={row?.label?.replace("[%]", "")}
                        callAPI={true}
                        parameter={row?.rule}
                      />
                    </div>

                    <div class="flex items-center">
                      <button
                        on:click={() => handleDeleteRule(row?.rule)}
                        class="mr-1.5 cursor-pointer text-gray-800 dark:text-zinc-300 hover:text-rose-800 dark:hover:text-rose-400 transition focus:outline-hidden"
                        title="Remove filter"
                      >
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="max-width:40px">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </button>
                      <div class="relative inline-block text-left">
                        <div on:click={() => (ruleName = row?.rule)}>
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild let:builder>
                              <Button
                                builders={[builder]}
                                class="h-[40px] border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 flex flex-row justify-between items-center w-[150px] xs:w-[140px] sm:w-[150px] px-3 rounded-full truncate hover:text-violet-600 dark:hover:text-violet-400 transition"
                              >
                                <span class="truncate ml-2 text-sm">
                                  {#if row?.rule === "excludeTickers"}
                                    {excludeTickerList.length === 0 ? "Any" : excludeTickerList.join(",")}
                                  {:else}
                                    {includeTickerList.length === 0 ? "Any" : includeTickerList.join(",")}
                                  {/if}
                                </span>
                                <svg
                                  class="ml-1 h-6 w-6 xs:ml-2 inline-block"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  style="max-width:40px"
                                  aria-hidden="true"
                                >
                                  <path
                                    fill-rule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                  ></path>
                                </svg>
                              </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content
                              side="bottom"
                              align="end"
                              sideOffset={10}
                              alignOffset={0}
                              class="w-64 h-fit max-h-80 overflow-hidden overflow-y-auto scroller rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1.5 text-gray-700 dark:text-zinc-200 shadow-none"
                            >
                              {#if row?.rule === "excludeTickers"}
                              <DropdownMenu.Label class="sticky -top-1 z-20 bg-white/95 dark:bg-zinc-950/95 pb-1.5">
                                <div class="relative">
                                  <div class="absolute inset-y-0 left-0 flex items-center pl-2.5">
                                    <svg class="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                  </div>
                                  <input
                                    type="text"
                                    bind:value={excludeTickerInput}
                                    on:input={searchExcludeTicker}
                                    on:keydown={(e) => {
                                      if (e.key === "Enter" && excludeTickerInput.trim()) {
                                        addExcludeTicker(excludeTickerInput);
                                      }
                                      e.stopPropagation();
                                    }}
                                    on:click|stopPropagation
                                    placeholder="Search ticker..."
                                    class="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 rounded-2xl text-gray-700 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 pl-8 pr-3 py-1.5 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500"
                                  />
                                </div>
                              </DropdownMenu.Label>
                              <DropdownMenu.Group class="min-h-10 mt-1">
                                {#if excludeTickerInput.trim().length > 0 && excludeTickerResults.length > 0}
                                  {#each excludeTickerResults as result}
                                    <DropdownMenu.Item
                                      class="sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                                    >
                                      <div
                                        class="flex items-center w-full px-2 py-0.5 text-sm cursor-pointer"
                                        on:click|capture={(event) => {
                                          event.preventDefault();
                                          addExcludeTicker(result?.symbol);
                                        }}
                                      >
                                        <span class="font-medium">{result?.symbol}</span>
                                        <span class="ml-2 text-xs text-gray-400 dark:text-zinc-500 truncate">{result?.name}</span>
                                      </div>
                                    </DropdownMenu.Item>
                                  {/each}
                                {:else if excludeTickerInput.trim().length > 0 && excludeTickerResults.length === 0}
                                  <div class="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500">
                                    No results
                                  </div>
                                {/if}
                                {#if excludeTickerList.length > 0}
                                  {#if excludeTickerInput.trim().length > 0}
                                    <div class="border-t border-gray-200 dark:border-zinc-700 my-1.5"></div>
                                  {/if}
                                  <div class="px-2 pb-1 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                                    Excluded
                                  </div>
                                  {#each excludeTickerList as ticker}
                                    <DropdownMenu.Item
                                      class="sm:hover:text-rose-700 dark:sm:hover:text-rose-400"
                                    >
                                      <div
                                        class="flex items-center justify-between w-full px-2 py-0.5 text-sm cursor-pointer"
                                        on:click|capture={(event) => {
                                          event.preventDefault();
                                          removeExcludeTicker(ticker);
                                        }}
                                      >
                                        <span class="font-medium">{ticker}</span>
                                        <svg class="w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </div>
                                    </DropdownMenu.Item>
                                  {/each}
                                {:else if excludeTickerInput.trim().length === 0}
                                  <div class="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500">
                                    Search and add tickers to exclude
                                  </div>
                                {/if}
                              </DropdownMenu.Group>
                              {:else if row?.rule === "includeTickers"}
                              <DropdownMenu.Label class="sticky -top-1 z-20 bg-white/95 dark:bg-zinc-950/95 pb-1.5">
                                <div class="relative">
                                  <div class="absolute inset-y-0 left-0 flex items-center pl-2.5">
                                    <svg class="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                  </div>
                                  <input
                                    type="text"
                                    bind:value={includeTickerInput}
                                    on:input={searchIncludeTicker}
                                    on:keydown={(e) => {
                                      if (e.key === "Enter" && includeTickerInput.trim()) {
                                        addIncludeTicker(includeTickerInput);
                                      }
                                      e.stopPropagation();
                                    }}
                                    on:click|stopPropagation
                                    placeholder="Search ticker..."
                                    class="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 rounded-2xl text-gray-700 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 pl-8 pr-3 py-1.5 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500"
                                  />
                                </div>
                              </DropdownMenu.Label>
                              <DropdownMenu.Group class="min-h-10 mt-1">
                                {#if includeTickerInput.trim().length > 0 && includeTickerResults.length > 0}
                                  {#each includeTickerResults as result}
                                    <DropdownMenu.Item
                                      class="sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                                    >
                                      <div
                                        class="flex items-center w-full px-2 py-0.5 text-sm cursor-pointer"
                                        on:click|capture={(event) => {
                                          event.preventDefault();
                                          addIncludeTicker(result?.symbol);
                                        }}
                                      >
                                        <span class="font-medium">{result?.symbol}</span>
                                        <span class="ml-2 text-xs text-gray-400 dark:text-zinc-500 truncate">{result?.name}</span>
                                      </div>
                                    </DropdownMenu.Item>
                                  {/each}
                                {:else if includeTickerInput.trim().length > 0 && includeTickerResults.length === 0}
                                  <div class="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500">
                                    No results
                                  </div>
                                {/if}
                                {#if includeTickerList.length > 0}
                                  {#if includeTickerInput.trim().length > 0}
                                    <div class="border-t border-gray-200 dark:border-zinc-700 my-1.5"></div>
                                  {/if}
                                  <div class="px-2 pb-1 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                                    Included
                                  </div>
                                  {#each includeTickerList as ticker}
                                    <DropdownMenu.Item
                                      class="sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                                    >
                                      <div
                                        class="flex items-center justify-between w-full px-2 py-0.5 text-sm cursor-pointer"
                                        on:click|capture={(event) => {
                                          event.preventDefault();
                                          removeIncludeTicker(ticker);
                                        }}
                                      >
                                        <span class="font-medium">{ticker}</span>
                                        <svg class="w-4 h-4 text-gray-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </div>
                                    </DropdownMenu.Item>
                                  {/each}
                                {:else if includeTickerInput.trim().length === 0}
                                  <div class="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500">
                                    Search and add tickers to include
                                  </div>
                                {/if}
                              </DropdownMenu.Group>
                              {/if}
                            </DropdownMenu.Content>
                          </DropdownMenu.Root>
                        </div>
                      </div>
                    </div>
                  </div>
                {:else}
                <div
                  class="flex items-center justify-between space-x-2 px-1 py-1.5 text-[0.95rem] leading-tight"
                  in:scale={{
                    start: 0.98,
                    duration: 160,
                    delay: 50,
                    easing: cubicOut,
                  }}
                  out:fade={{ duration: 100 }}
                >
                  <div class=" flex flex-row items-start sm:items-end">
                    {row?.label?.length > 20
                      ? row?.label?.slice(0, 20)?.replace("[%]", "") + "..."
                      : row?.label?.replace("[%]", "")}
                    <InfoModal
                      id={row?.rule}
                      title={row?.label?.replace("[%]", "")}
                      callAPI={true}
                      parameter={row?.rule}
                    />
                  </div>

                  <div class="flex items-center">
                    <button
                      on:click={() => handleDeleteRule(row?.rule)}
                      class="mr-1.5 cursor-pointer text-gray-800 dark:text-zinc-300 hover:text-rose-800 dark:hover:text-rose-400 transition focus:outline-hidden"
                      title="Remove filter"
                    >
                      <svg
                        class="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style="max-width:40px"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </button>
                    <div class="relative inline-block text-left">
                      <div on:click={() => (ruleName = row?.rule)}>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild let:builder>
                            <Button
                              builders={[builder]}
                              class="h-[40px] border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 flex flex-row justify-between items-center w-[150px] xs:w-[140px] sm:w-[150px] px-3 rounded-full truncate hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <span class="truncate ml-2 text-sm">
                                {#if valueMappings[row?.rule] === "any" || (Array.isArray(valueMappings[row?.rule]) && valueMappings[row?.rule].length === 1 && valueMappings[row?.rule][0] === "any")}
                                  Any
                                {:else if ruleCondition[row?.rule] === "between"}
                                  {Array.isArray(valueMappings[row?.rule])
                                    ? `${valueMappings[row?.rule][0]}-${valueMappings[row?.rule][1] ?? "Any"}`
                                    : "Any"}
                                {:else}
                                  {ruleCondition[row?.rule]
                                    ?.replace("under", "Under")
                                    ?.replace("over", "Over")
                                    ?.replace("exactly", "Exactly") ?? ""}
                                  {valueMappings[row?.rule]}
                                {/if}
                              </span>
                              <svg
                                class=" ml-1 h-6 w-6 xs:ml-2 inline-block"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                style="max-width:40px"
                                aria-hidden="true"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clip-rule="evenodd"
                                ></path>
                              </svg>
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content
                            side="bottom"
                            align="end"
                            sideOffset={10}
                            alignOffset={0}
                            class="w-fit  h-fit max-h-72 overflow-hidden overflow-y-auto scroller rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1.5 text-gray-700 dark:text-zinc-200 shadow-none"
                          >
                            {#if !categoricalRules?.includes(row?.rule) && !textInputRules?.includes(row?.rule)}
                              <DropdownMenu.Label
                                class="absolute mt-2 h-11 border-gray-300 dark:border-zinc-700 border-b -top-1 z-20 fixed sticky bg-white/95 dark:bg-zinc-950/95"
                              >
                                <div
                                  class="flex items-center justify-start gap-x-1"
                                >
                                  <!--Start Dropdown for Condition-->
                                  <div
                                    class="-ml-2 relative inline-block text-left"
                                  >
                                    <DropdownMenu.Root>
                                      <DropdownMenu.Trigger asChild let:builder
                                        ><Button
                                          builders={[builder]}
                                          class="w-fit -mt-1 -ml-2 flex flex-row justify-between items-center text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                                        >
                                          <span
                                            class="truncate ml-2 text-sm sm:text-[1rem]"
                                          >
                                            {ruleCondition[ruleName]
                                              ?.replace("under", "Under")
                                              ?.replace("over", "Over")
                                              ?.replace("between", "Between")
                                              ?.replace("exactly", "Exactly")}
                                          </span>
                                          <svg
                                            class="mt-1 -mr-1 ml-1 h-5 w-5 xs:ml-2 ml-0! sm:ml-0 inline-block"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            style="max-width:40px"
                                            aria-hidden="true"
                                            ><path
                                              fill-rule="evenodd"
                                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                              clip-rule="evenodd"
                                            ></path></svg
                                          >
                                        </Button>
                                      </DropdownMenu.Trigger>
                                      <DropdownMenu.Content
                                        class=" w-fit  h-fit overflow-hidden overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-2xl"
                                      >
                                        <DropdownMenu.Group>
                                          {#each ["Over", "Under", "Between", "Exactly"] as item}
                                            <DropdownMenu.Item
                                              on:click={() =>
                                                changeRuleCondition(
                                                  row?.rule,
                                                  item,
                                                )}
                                              class="cursor-pointer text-sm font-normal"
                                              >{item}</DropdownMenu.Item
                                            >
                                          {/each}
                                        </DropdownMenu.Group>
                                      </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                  </div>

                                  {#if ruleCondition[row?.rule] === "between"}
                                    <div class="flex gap-x-1 -ml-2 z-10 -mt-1">
                                      <input
                                        type="text"
                                        placeholder="Min"
                                        value={Array.isArray(
                                          valueMappings[row?.rule],
                                        )
                                          ? (valueMappings[row?.rule][0] ?? "")
                                          : ""}
                                        on:input={(e) =>
                                          handleValueInput(e, row?.rule, 0)}
                                        class="ios-zoom-fix block max-w-[3.5rem] rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 font-normal p-1 text-sm bg-white/80 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-700"
                                      />
                                      <span
                                        class=" text-[1rem] font-normal mt-1"
                                      >
                                        &
                                      </span>
                                      <input
                                        type="text"
                                        placeholder="Max"
                                        value={Array.isArray(
                                          valueMappings[row?.rule],
                                        )
                                          ? (valueMappings[row?.rule][1] ?? "")
                                          : ""}
                                        on:input={(e) =>
                                          handleValueInput(e, row?.rule, 1)}
                                        class="ios-zoom-fix block max-w-[3.5rem] rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 font-normal p-1 text-sm bg-white/80 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-700"
                                      />
                                    </div>
                                  {:else}
                                    <input
                                      type="text"
                                      placeholder="Value"
                                      value={valueMappings[row?.rule] === "any"
                                        ? ""
                                        : valueMappings[row?.rule]}
                                      on:input={(e) =>
                                        handleValueInput(e, row?.rule)}
                                      class="ios-zoom-fix block max-w-[4.8rem] rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 font-normal p-1 text-sm bg-white/80 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-700"
                                    />
                                  {/if}

                                  {#if ["over", "under", "exactly"]?.includes(ruleCondition[ruleName]?.toLowerCase())}
                                    <div
                                      class="ml-2 flex touch-manipulation flex-row items-center gap-x-1.5"
                                    >
                                      <button
                                        on:click={() =>
                                          stepSizeValue(
                                            valueMappings[row?.rule],
                                            "add",
                                          )}
                                        ><svg
                                          class="size-6 cursor-pointer text-gray-400 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          style="max-width:40px"
                                          ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                          ></path></svg
                                        >
                                      </button>
                                      <button
                                        on:click={() =>
                                          stepSizeValue(
                                            valueMappings[row?.rule],
                                            "minus",
                                          )}
                                        ><svg
                                          class="size-6 cursor-pointer text-gray-400 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          style="max-width:40px"
                                          ><path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                          ></path></svg
                                        >
                                      </button>
                                    </div>
                                  {/if}
                                  <!--End Dropdown for Condition-->
                                </div>
                              </DropdownMenu.Label>
                            {:else}
                              <div
                                class="relative sticky z-40 focus:outline-hidden -top-1"
                                tabindex="0"
                                role="menu"
                                style=""
                              ></div>
                            {/if}
                            <DropdownMenu.Group class="min-h-10 mt-2">
                              {#if !categoricalRules?.includes(row?.rule)}
                                {#each row?.step as newValue, index}
                                  {#if ruleCondition[row?.rule] === "between"}
                                    {#if newValue && row?.step[index + 1]}
                                      <DropdownMenu.Item
                                        class="sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                                      >
                                        <button
                                          on:click={() => {
                                            handleChangeValue([
                                              row?.step[index],
                                              row?.step[index + 1],
                                            ]);
                                          }}
                                          class="block w-full cursor-pointer border-b border-gray-300 dark:border-zinc-700 px-4 py-1.5 text-left text-sm rounded last:border-0 focus:outline-hidden"
                                        >
                                          {ruleCondition[row?.rule]?.replace(
                                            "between",
                                            "Between",
                                          )}
                                          {row?.step[index + 1]} - {row?.step[
                                            index
                                          ]}
                                        </button>
                                      </DropdownMenu.Item>
                                    {/if}
                                  {:else}
                                    <DropdownMenu.Item
                                      class="sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                                    >
                                      <button
                                        on:click={() => {
                                          handleChangeValue(newValue);
                                        }}
                                        class="block w-full cursor-pointer border-b border-gray-300 dark:border-zinc-700 px-4 py-1.5 text-left text-sm rounded last:border-0 focus:outline-hidden"
                                      >
                                        {ruleCondition[row?.rule]
                                          ?.replace("under", "Under")
                                          ?.replace("over", "Over")
                                          ?.replace("exactly", "Exactly")}
                                        {newValue}
                                      </button>
                                    </DropdownMenu.Item>
                                  {/if}
                                {/each}
                              {:else if categoricalRules?.includes(row?.rule)}
                                {#each row?.step as item}
                                  <DropdownMenu.Item
                                    class="sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                                  >
                                    <div
                                      class="flex items-center"
                                      on:click|capture={(event) =>
                                        event.preventDefault()}
                                    >
                                      <label
                                        on:click={() => {
                                          handleChangeValue(item);
                                        }}
                                        class="cursor-pointer"
                                        for={item}
                                      >
                                        <input
                                          type="checkbox"
                                          class="rounded"
                                          checked={checkedItems
                                            .get(row?.rule)
                                            ?.has(item) ?? false}
                                        />
                                        <span class="ml-2">{item}</span>
                                      </label>
                                    </div>
                                  </DropdownMenu.Item>
                                {/each}
                              {/if}
                            </DropdownMenu.Group>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      </div>
                    </div>
                  </div>
                </div>
                {/if}
                <!--End Added Rules-->
              {/each}
            </div>
          {/if}
        </div>

        {#if isLoaded}
          <div class="w-full mt-5 m-auto flex justify-center items-center">
            <div class="w-full grid grid-cols-1 lg:grid-cols-4 gap-y-3 gap-x-3">
              <!--Start Flow Sentiment-->
              <div
                class="flex flex-col w-full px-5 py-3 bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl h-20"
              >
                <div class="flex flex-col items-start justify-between mb-2">
                  {#if data?.user?.tier === "Pro"}
                    <div
                      class="flex items-center gap-4 text-[11px] sm:text-xs mb-1 mt-1"
                    >
                      <div class="flex items-center gap-1">
                        <span
                          class="w-2 h-2 rounded-full bg-emerald-500/70 dark:bg-emerald-400/70"
                        ></span>
                        <span class="text-gray-500 dark:text-zinc-400"
                          >Bullish</span
                        >
                        <span
                          class="font-semibold text-emerald-800 dark:text-emerald-400"
                          >{formatPremium(displayBullishPremium || 0)}</span
                        >
                      </div>
                      <div class="flex items-center gap-1">
                        <span
                          class="w-2 h-2 rounded-full bg-rose-500/70 dark:bg-rose-400/70"
                        ></span>
                        <span class="text-gray-500 dark:text-zinc-400"
                          >Bearish</span
                        >
                        <span
                          class="font-semibold text-rose-800 dark:text-rose-400"
                          >{formatPremium(displayBearishPremium || 0)}</span
                        >
                      </div>
                    </div>
                    <div class="flex flex-col w-full mt-2">
                      <div
                        class="relative flex w-full h-3.5 rounded-full overflow-hidden bg-gray-200/70 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-700"
                      >
                        <div
                          class="bg-emerald-500/70 dark:bg-emerald-400/70 h-full transition-all duration-300 flex items-center justify-center"
                          style="width: {bullishPercentage}%"
                        >
                          {#if bullishPercentage >= 15}
                            <span
                              class="text-[10px] sm:text-xs font-semibold text-gray-900/80 dark:text-zinc-900/90"
                              >{bullishPercentage}%</span
                            >
                          {/if}
                        </div>
                        <div
                          class="bg-rose-500/70 dark:bg-rose-400/70 h-full transition-all duration-300 flex items-center justify-center"
                          style="width: {bearishPercentage}%"
                        >
                          {#if bearishPercentage >= 15}
                            <span
                              class="text-[10px] sm:text-xs font-semibold text-white/90"
                              >{bearishPercentage}%</span
                            >
                          {/if}
                        </div>
                      </div>
                    </div>
                  {:else}
                    <div class="flex flex-col items-start">
                      <span
                        class="text-xs text-gray-500 dark:text-zinc-400 mt-1.5"
                        >Flow Sentiment</span
                      >
                      {#if data?.user?.tier === "Pro"}
                        <span class="text-start text-lg font-semibold mt-1">
                          {putCallRatio?.toFixed(3)}
                        </span>
                      {:else}
                        <a href="/pricing" class="flex mt-2">
                          <svg
                            class="size-5 text-gray-500 dark:text-white"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            style="max-width: 40px;"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clip-rule="evenodd"
                            >
                            </path>
                          </svg>
                        </a>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>

              <!--End Flow Sentiment-->
              <!--Start Put/Call-->
              <div
                class="flex flex-row items-center w-full px-5 py-3 bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl h-20"
              >
                <div class="flex flex-col items-start">
                  <span class="text-xs text-gray-500 dark:text-zinc-400"
                    >{options_flow_put_to_call()}</span
                  >
                  {#if data?.user?.tier === "Pro"}
                    <span class="text-start text-lg font-semibold mt-1">
                      {putCallRatio?.toFixed(3)}
                    </span>
                  {:else}
                    <a href="/pricing" class="flex mt-2">
                      <svg
                        class="size-5 text-gray-500 dark:text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width: 40px;"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        >
                        </path>
                      </svg>
                    </a>
                  {/if}
                </div>
                <!-- Circular Progress -->
                <div class="relative size-14 ml-auto">
                  <svg
                    class="size-full w-14 h-14"
                    viewBox="0 0 36 36"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <!-- Background Circle -->
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-gray-300 dark:text-[#3E3E3E]"
                      stroke-width="3"
                    ></circle>
                    <!-- Progress Circle inside a group with rotation -->
                    <g class="origin-center -rotate-90 transform">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        class="stroke-current text-[#00D4E4]"
                        stroke-width="3"
                        stroke-dasharray="100"
                        stroke-dashoffset={data?.user?.tier === "Pro"
                          ? putCallRatio >= 1
                            ? 0
                            : 100 - (putCallRatio * 100)?.toFixed(2)
                          : 100}
                      ></circle>
                    </g>
                  </svg>
                  <!-- Percentage Text -->
                  <div
                    class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                  >
                    {#if data?.user?.tier === "Pro"}
                      <span class="text-center text-sm"
                        >{putCallRatio?.toFixed(2)}</span
                      >
                    {:else}
                      <a href="/pricing" class="flex">
                        <svg
                          class="size-4 text-gray-500 dark:text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                </div>
                <!-- End Circular Progress -->
              </div>
              <!--End Put/Call-->
              <!--Start Call Flow-->
              <div
                class="flex flex-row items-center w-full px-5 py-3 bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl h-20"
              >
                <div class="flex flex-col items-start">
                  <div class="flex flex-row items-center gap-2">
                    <span class="text-xs text-gray-500 dark:text-zinc-400"
                      >{options_flow_call_flow()}</span
                    >
                    {#if data?.user?.tier === "Pro"}
                      <span
                        class="text-sm font-semibold text-emerald-800 dark:text-emerald-400"
                      >
                        {formatPremium(displayCallPremium || 0)}
                      </span>
                    {/if}
                  </div>
                  {#if data?.user?.tier === "Pro"}
                    <span class="text-start text-lg font-semibold mt-1">
                      {new Intl.NumberFormat("en", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(displayCallVolume)}
                    </span>
                  {:else}
                    <a href="/pricing" class="flex mt-2">
                      <svg
                        class="size-5 text-gray-500 dark:text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width: 40px;"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        >
                        </path>
                      </svg>
                    </a>
                  {/if}
                </div>
                <!-- Circular Progress -->
                <div class="relative size-14 ml-auto">
                  <svg
                    class="size-full w-14 h-14"
                    viewBox="0 0 36 36"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <!-- Background Circle -->
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-gray-300 dark:text-[#3E3E3E]"
                      stroke-width="3"
                    ></circle>
                    <!-- Progress Circle inside a group with rotation -->
                    <g class="origin-center -rotate-90 transform">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        class="stroke-current text-[#00FC50]"
                        stroke-width="3"
                        stroke-dasharray="100"
                        stroke-dashoffset={data?.user?.tier === "Pro"
                          ? 100 - callPercentage?.toFixed(2)
                          : 100}
                      ></circle>
                    </g>
                  </svg>
                  <!-- Percentage Text -->
                  <div
                    class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                  >
                    {#if data?.user?.tier === "Pro"}
                      <span class="text-center text-xs"
                        >{callPercentage}.0%</span
                      >
                    {:else}
                      <a href="/pricing" class="flex">
                        <svg
                          class="size-4 text-gray-500 dark:text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                </div>
                <!-- End Circular Progress -->
              </div>
              <!--End Call Flow-->
              <!--Start Put Flow-->
              <div
                class="flex flex-row items-center w-full px-5 py-3 bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl h-20"
              >
                <div class="flex flex-col items-start">
                  <div class="flex flex-row items-center gap-2">
                    <span class="text-xs text-gray-500 dark:text-zinc-400"
                      >{options_flow_put_flow()}</span
                    >
                    {#if data?.user?.tier === "Pro"}
                      <span
                        class="text-sm font-semibold text-rose-800 dark:text-rose-400"
                      >
                        {formatPremium(displayPutPremium || 0)}
                      </span>
                    {/if}
                  </div>
                  {#if data?.user?.tier === "Pro"}
                    <span class="text-start text-lg font-semibold mt-1">
                      {new Intl.NumberFormat("en", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(displayPutVolume)}
                    </span>
                  {:else}
                    <a href="/pricing" class="flex mt-2">
                      <svg
                        class="size-5 text-gray-500 dark:text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width: 40px;"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        >
                        </path>
                      </svg>
                    </a>
                  {/if}
                </div>
                <!-- Circular Progress -->
                <div class="relative size-14 ml-auto">
                  <svg
                    class="size-full w-14 h-14"
                    viewBox="0 0 36 36"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <!-- Background Circle -->
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      class="stroke-current text-gray-300 dark:text-[#3E3E3E]"
                      stroke-width="3"
                    ></circle>
                    <!-- Progress Circle inside a group with rotation -->
                    <g class="origin-center -rotate-90 transform">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        class="stroke-current text-[#FF2F1F]"
                        stroke-width="3"
                        stroke-dasharray="100"
                        stroke-dashoffset={data?.user?.tier === "Pro"
                          ? 100 - putPercentage?.toFixed(2)
                          : 100}
                      ></circle>
                    </g>
                  </svg>
                  <!-- Percentage Text -->
                  <div
                    class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2"
                  >
                    {#if data?.user?.tier === "Pro"}
                      <span class="text-center text-xs">{putPercentage}.0%</span
                      >
                    {:else}
                      <a href="/pricing" class="flex">
                        <svg
                          class="size-4 text-gray-500 dark:text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style="max-width: 40px;"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          >
                          </path>
                        </svg>
                      </a>
                    {/if}
                  </div>
                </div>
                <!-- End Circular Progress -->
              </div>
            </div>
          </div>

          <!-- Table toolbar: Find, Download, Reset Column Order -->

          <div
            class="w-full flex flex-col sm:flex-row items-center justify-start sm:justify-between mt-5 text-gray-700 dark:text-zinc-200 sm:pt-3 sm:pb-3 sm:border-t sm:border-b sm:border-gray-300 sm:dark:border-zinc-700"
          >
            <div
              class="flex flex-row items-center justify-between sm:justify-start w-full sm:w-fit whitespace-nowrap -mb-1 sm:mb-0"
            >
              <h2
                class="text-start w-full mb-2 sm:mb-0 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {totalItems?.toLocaleString("en-US")} Trades
              </h2>
            </div>
            <div
              class="flex flex-row items-center w-full border-t border-b border-gray-300 dark:border-zinc-700 sm:border-none pt-2 pb-2 sm:pt-0 sm:pb-0"
            >
              <!-- Find input -->
              <div
                class="relative w-full sm:w-fit ml-auto sm:flex-1 lg:flex-none"
              >
                <div
                  class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
                >
                  {#if filterQuery?.length > 0}
                    <label
                      class="cursor-pointer"
                      on:click={() => resetSearch()}
                    >
                      <svg
                        class="w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                        />
                      </svg>
                    </label>
                  {/if}
                </div>

                <input
                  bind:value={filterQuery}
                  on:input={debouncedServerSearch}
                  type="text"
                  placeholder={options_flow_search_placeholder()}
                  class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
                />
              </div>

              <!-- Download + Reset Column Order -->

              <div class="ml-2 w-fit flex items-center justify-end gap-2">
                <a
                  href="/watchlist/options"
                  title="Options Watchlist"
                  class="cursor-pointer p-2 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                >
                  <svg
                    class="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </a>
                <ScreenerExport
                  {data}
                  {displayedData}
                  screener="options-flow"
                  title="options_flow_data"
                  creditCost={3}
                  modalTitle="Export options flow data"
                  itemLabel="trades"
                />

                <button
                  on:click={toggleFullWidth}
                  title={isFullWidth
                    ? "Exit full width"
                    : "Expand to full width"}
                  class="hidden 3xl:flex cursor-pointer w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-violet-600 dark:hover:text-violet-400 flex-row items-center px-3 py-2 rounded-full gap-2 {isFullWidth
                    ? 'border-violet-400 dark:border-violet-500'
                    : ''}"
                >
                  {#if isFullWidth}
                    <svg
                      class="w-4 h-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  {:else}
                    <svg
                      class="w-4 h-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  {/if}
                  <span class="truncate text-[0.85rem] sm:text-sm"
                    >{isFullWidth
                      ? options_flow_normal_width()
                      : options_flow_full_width()}</span
                  >
                </button>

                {#if customColumnOrder?.length > 0}
                  <button
                    on:click={() => optionsFlowResetColumnOrder?.()}
                    title="Reset column order"
                    class="cursor-pointer p-2 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    <svg
                      class="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M3 7h14M3 12h10M3 17h6M17 10l4 4-4 4M21 14H11"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                {/if}
              </div>
            </div>
          </div>

          <!-- Page wrapper -->
          <div class="flex w-full m-auto h-full overflow-hidden">
            <div class="mt-3 w-full overflow-x-auto overflow-hidden">
              <OptionsFlowTable
                {data}
                {optionsWatchlist}
                {displayedData}
                {filteredData}
                {rawData}
                {extraColumns}
                isLoading={isFetchingPage}
                onSort={handleServerSort}
                bind:resetColumnOrder={optionsFlowResetColumnOrder}
                bind:customColumnOrder
              />

              <!-- Pagination Controls (hedge-funds style) -->
              {#if data?.user?.tier === "Pro" && totalItems > 0}
                <div
                  class="flex flex-row items-center justify-between mt-8 sm:mt-5"
                >
                  <!-- Previous button -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || isFetchingPage}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <svg
                        class="h-5 w-5 inline-block shrink-0 rotate-90"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                      <span class="hidden sm:inline">Previous</span>
                    </Button>
                  </div>

                  <!-- Page info and rows selector in center -->
                  <div class="flex flex-row items-center gap-4">
                    <span class="text-sm text-gray-600 dark:text-zinc-300">
                      Page {currentPage} of {totalPages}
                    </span>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span class="truncate text-[0.85rem] sm:text-sm"
                            >{rowsPerPage} Rows</span
                          >
                          <svg
                            class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            style="max-width:40px"
                            aria-hidden="true"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clip-rule="evenodd"
                            ></path>
                          </svg>
                        </Button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Content
                        side="bottom"
                        align="end"
                        sideOffset={10}
                        alignOffset={0}
                        class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                      >
                        <DropdownMenu.Group class="pb-2">
                          {#each rowsPerPageOptions as item}
                            <DropdownMenu.Item
                              class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                            >
                              <label
                                on:click={() => changeRowsPerPage(item)}
                                class="inline-flex justify-between w-full items-center cursor-pointer"
                              >
                                <span class="text-sm">{item} Rows</span>
                              </label>
                            </DropdownMenu.Item>
                          {/each}
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>

                  <!-- Next button -->
                  <div class="flex items-center gap-2">
                    <Button
                      on:click={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages || isFetchingPage}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="hidden sm:inline">Next</span>
                      <svg
                        class="h-5 w-5 inline-block shrink-0 -rotate-90"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                    </Button>
                  </div>
                </div>

                <!-- Back to Top button -->
                <div class="flex justify-center mt-4 mb-10">
                  <button
                    on:click={scrollToTop}
                    class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    Back to Top
                    <svg
                      class="h-5 w-5 inline-block shrink-0 rotate-180"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              {/if}

              <div class="-mt-3">
                <UpgradeToPro {data} display={true} />
              </div>
            </div>
          </div>
        {:else}
          <div class="flex justify-center items-center h-80">
            <div class="relative">
              <label
                class="bg-gray-900/80 dark:bg-zinc-900/70 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <span
                  class="loading loading-spinner loading-md text-white dark:text-white"
                ></span>
              </label>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<!--Start Choose Rule Modal-->
<input type="checkbox" id="ruleModal" class="modal-toggle" />

<dialog id="ruleModal" class="modal p-2 sm:p-0">
  <label
    id="ruleModal"
    for="ruleModal"
    on:click={() => (searchTerm = "")}
    class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box z-20 mx-2 min-h-[30vh] h-[800px] bp:mx-3 sm:mx-4 w-full max-w-6xl overflow-y-auto relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <div class="relative flex flex-col w-full">
      <!-- Sticky Header -->

      <div
        class="fixed w-full h-fit sticky -top-6 z-40 bg-white dark:bg-zinc-900 pb-6 pt-5 border-gray-300 dark:border-zinc-700 border-b"
      >
        <div class="flex flex-row items-center justify-between mb-2">
          <h1
            class=" text-[1rem] sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            {options_flow_select_filters_title({ count: allRows?.length })}
          </h1>
          <label
            for="ruleModal"
            class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
            aria-label="Close modal"
          >
            <svg
              class="w-6 h-6 sm:w-7 sm:h-7"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
              /></svg
            >
          </label>
        </div>

        <!-- Start Search bar -->
        <form
          class="w-full h-8"
          on:keydown={(e) => (e?.key === "Enter" ? e.preventDefault() : "")}
        >
          <label for="search" class="text-sm sr-only">Search</label>
          <div class="relative w-full max-w-sm">
            <div
              class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
            >
              <svg
                class="w-4 h-4 text-gray-400 dark:text-zinc-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>

            <div
              class="absolute inset-y-0 right-0 flex items-center pr-2 {searchTerm?.length >
              0
                ? ''
                : 'hidden'}"
            >
              <button
                on:click={() => (searchTerm = "")}
                class="cursor-pointer text-gray-400 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
                tabindex="0"
                ><svg
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style="max-width:40px"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path></svg
                >
              </button>
            </div>

            <input
              autocomplete="off"
              id="search"
              class="focus:outline-none placeholder-gray-500 dark:placeholder:text-zinc-400 block w-full p-2 ps-10 text-sm text-gray-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 rounded-full bg-white/80 dark:bg-zinc-950/60"
              placeholder={options_flow_search_input_placeholder()}
              bind:value={searchTerm}
            />
          </div>
        </form>
        <!-- End Search bar -->
      </div>

      <!-- Content -->
      <div class=" mt-5">
        <div class="flex flex-wrap">
          {#each searchTerm?.length !== 0 ? filteredRows : allRows as row}
            <div
              class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1"
            >
              {#if row?.rule === "score" && data?.user?.tier !== "Pro"}
                <label id={row?.rule} on:click={() => changeRule(row?.rule)}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block text-[#A3A3A3] sm:hover:text-white cursor-pointer"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    /></svg
                  >
                </label>
              {:else}
                <input
                  on:click={() => changeRule(row?.rule)}
                  id={row?.rule}
                  type="checkbox"
                  checked={ruleOfList?.find((rule) => rule?.name === row?.rule)}
                  class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 lg:h-4 lg:w-4"
                />
              {/if}
              <div class="-mt-0.5">
                <label for={row?.rule} class="cursor-pointer text-[1rem]"
                  >{row?.label}</label
                >
              </div>
            </div>
          {/each}
        </div>

        {#if searchTerm?.length > 0 && filteredRows?.length === 0}
          <div class=" mt-5 font-semibold text-[1rem] sm:text-lg">
            {options_flow_nothing_found()}
          </div>
        {/if}
      </div>
    </div>
  </div>
</dialog>
<!--End Choose Rule Modal-->

<!--Start Options Detail Desktop Modal-->

<!--Start Add Strategy Modal-->
<input type="checkbox" id="addStrategy" class="modal-toggle" />

<dialog id="addStrategy" class="modal modal-bottom sm:modal-middle">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <label for="addStrategy" on:click={() => { removeList = false; }} class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <label
      for="addStrategy"
      on:click={() => { removeList = false; }}
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg
      >
    </label>
    <h1
      class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
    >
      {options_flow_modal_new_title()}
    </h1>

    <form
      on:submit={createStrategy}
      method="POST"
      class="space-y-2 pt-5 pb-10 sm:pb-5"
    >
      <Input
        id="title"
        type="text"
        errors=""
        label={options_flow_modal_new_name_label()}
        required={true}
      />

      <button
        type="submit"
        class="cursor-pointer mt-2 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 duration-100 w-full rounded-full m-auto font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200"
      >
        {options_flow_modal_new_create()}
      </button>
    </form>
  </div>
</dialog>

<!--End Add Strategy Modal-->

<!--Start Delete Strategy Modal-->
<input type="checkbox" id="deleteStrategy" class="modal-toggle" />

<dialog id="deleteStrategy" class="modal modal-bottom sm:modal-middle">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <label for="deleteStrategy" on:click={() => { deleteTargetId = ""; }} class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <label
      for="deleteStrategy"
      on:click={() => { deleteTargetId = ""; }}
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg
      >
    </label>
    <h3 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">
      {options_flow_modal_delete_title()}
    </h3>
    <p class="text-sm mb-6 text-gray-800 dark:text-zinc-300">
      {options_flow_modal_delete_message()}
    </p>
    <div class="flex justify-end space-x-3">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <label
        for="deleteStrategy"
        on:click={() => { deleteTargetId = ""; }}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium
              transition-colors duration-100 border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
        tabindex="0">{options_flow_modal_delete_cancel()}</label
      ><label
        for="deleteStrategy"
        on:click={handleDeleteStrategy}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium
              transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30
              bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300"
        tabindex="0"
        ><svg
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-4 h-4 mr-2"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
          ><polyline points="3 6 5 6 21 6"></polyline><path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          ></path><line x1="10" y1="11" x2="10" y2="17"></line><line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
          ></line></svg
        >
        {options_flow_modal_delete_confirm()}</label
      >
    </div>
  </div>
</dialog>

<!--End Delete Strategy Modal-->
