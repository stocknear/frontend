<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { screenWidth } from "$lib/store";
  import Copy from "lucide-svelte/icons/copy";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { scale, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  import { abbreviateNumber, groupScreenerRules } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import Input from "$lib/components/Input.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import ScreenerExport from "$lib/components/ScreenerExport.svelte";
  export let data;
  export let form;
  let showFilters = true;
  let isLoaded = false;
  let isFullWidth = false;
  let searchQuery = "";
  let inputValue = "";
  let isDataLoading = false;
  let infoText = {};
  let tooltipTitle;
  let removeList = false;
  let deleteTargetId = "";

  // SSR-hydrated state
  let displayedData = data?.getScreenerFeed?.items ?? [];
  let totalItems = data?.getScreenerFeed?.total ?? 0;
  let currentPage = data?.getScreenerFeed?.page ?? 1;
  let rowsPerPage = data?.getScreenerFeed?.pageSize ?? 20;
  let totalPages = data?.getScreenerFeed?.totalPages ?? 1;
  let activeSortKey = data?.getScreenerFeed?.sort?.key ?? "totalAssets";
  let activeSortOrder = data?.getScreenerFeed?.sort?.order ?? "desc";

  // Fetch control
  let currentAbortController: AbortController | null = null;
  let requestId = 0;
  let isFetchingPage = false;

  $: testList = [];

  let strategyList = data?.getAllStrategies;
  let selectedStrategy = strategyList?.at(0)?.id ?? "";
  let ruleOfList = strategyList?.at(0)?.rules ?? [];
  let groupedRules = {};
  let displayRules = [];
  let selectedPopularStrategy = "";
  $: popularStrategyList = [
    { key: "lowCostIndex", label: "Low-Cost Index ETFs" },
    { key: "highDividend", label: "High Dividend ETFs" },
    { key: "topPerformers1Y", label: "Top Performers 1Y" },
    { key: "oversoldETFs", label: "Oversold ETFs" },
  ];

  const onlySubscriberRules = [];

  const checkedRules = [
    "sma20",
    "sma50",
    "sma100",
    "sma200",
    "ema20",
    "ema50",
    "ema100",
    "ema200",
    "payoutFrequency",
    "assetClass",
    "etfProvider",
    "topSector",
    "exchange",
    "aumGroup",
    "country",
  ];

  let displayTableTab = "general";

  // Define all possible rules and their properties
  const allRules = {
    totalAssets: {
      label: "AUM",
      step: ["100B", "50B", "10B", "5B", "1B", "500M", "100M", "10M", "1M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: ["Most Popular", "Fund Info"],
    },
    expenseRatio: {
      label: "Expense Ratio (%)",
      step: ["2", "1.5", "1", "0.5", "0.2", "0.1", "0.05", "0.03"],
      defaultCondition: "under",
      defaultValue: "any",
      varType: "percent",
      category: ["Most Popular", "Fund Info"],
    },
    numberOfHoldings: {
      label: "Holdings",
      step: [1000, 500, 250, 100, 50, 25, 10],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Most Popular",
    },
    dividendYield: {
      label: "Dividend Yield",
      step: ["10%", "7%", "5%", "4%", "3%", "2%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: ["Most Popular", "Dividends"],
    },
    beta: {
      label: "Beta",
      step: [2, 1.5, 1.25, 1, 0.75, 0.5, 0.25],
      defaultCondition: "under",
      defaultValue: "any",
      category: ["Most Popular", "Technicals"],
    },
    assetClass: {
      label: "Asset Class",
      step: [
        "Equity",
        "Bond",
        "Commodity",
        "Currency",
        "Multi-Asset",
        "Alternative",
        "Preferred Stock",
        "Money Market",
      ],
      defaultCondition: "",
      defaultValue: "any",
      category: ["Most Popular", "Fund Info"],
    },
    etfProvider: {
      label: "ETF Provider",
      step: [
        "state-street",
        "blackrock",
        "vanguard",
        "invesco",
        "charles-schwab",
        "jpmorgan-chase",
        "proshares",
        "vaneck",
        "first-trust",
        "wisdom-tree",
        "ark",
        "global-x",
        "fidelity",
        "goldman-sachs",
        "simplify",
        "direxion",
        "other",
      ],
      defaultCondition: "",
      defaultValue: "any",
      category: ["Most Popular", "Fund Info"],
    },
    price: {
      label: "Price",
      step: [500, 200, 100, 50, 25, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Price & Volume",
    },
    volume: {
      label: "Volume",
      step: ["10M", "5M", "1M", "500K", "100K", "50K", "10K"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Price & Volume",
    },
    avgVolume: {
      label: "Average Volume",
      step: ["10M", "5M", "1M", "500K", "100K", "50K", "10K"],
      defaultCondition: "over",
      defaultValue: "any",
      category: ["Most Popular", "Price & Volume"],
    },
    relativeVolume: {
      label: "Relative Volume",
      step: ["300", "200", "150", "125", "100", "75", "50"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Price & Volume",
    },
    changesPercentage: {
      label: "Price Change 1D",
      step: ["20%", "10%", "5%", "1%", "0%", "-1%", "-5%", "-10%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Performance",
    },
    change1W: {
      label: "Price Change 1W",
      step: ["20%", "10%", "5%", "1%", "-1%", "-5%", "-10%", "-20%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Performance",
    },
    change1M: {
      label: "Price Change 1M",
      step: [
        "100%",
        "50%",
        "20%",
        "10%",
        "5%",
        "1%",
        "-1%",
        "-5%",
        "-10%",
        "-20%",
        "-50%",
      ],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Performance",
    },
    change3M: {
      label: "Price Change 3M",
      step: [
        "100%",
        "50%",
        "20%",
        "10%",
        "5%",
        "1%",
        "-1%",
        "-5%",
        "-10%",
        "-20%",
        "-50%",
      ],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Performance",
    },
    change6M: {
      label: "Price Change 6M",
      step: [
        "100%",
        "50%",
        "20%",
        "10%",
        "5%",
        "1%",
        "-1%",
        "-5%",
        "-10%",
        "-20%",
        "-50%",
      ],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Performance",
    },
    change1Y: {
      label: "Price Change 1Y",
      step: [
        "100%",
        "50%",
        "20%",
        "10%",
        "5%",
        "1%",
        "-1%",
        "-5%",
        "-10%",
        "-20%",
        "-50%",
      ],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Performance",
    },
    change3Y: {
      label: "Price Change 3Y",
      step: [
        "100%",
        "50%",
        "20%",
        "10%",
        "5%",
        "1%",
        "-1%",
        "-5%",
        "-10%",
        "-20%",
        "-50%",
      ],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Performance",
    },
    rsi: {
      label: "Relative Strength Index",
      step: [90, 80, 70, 60, 50, 40, 30, 20],
      category: "Technicals",
      defaultCondition: "over",
      defaultValue: "any",
    },
    stochRSI: {
      label: "Stochastic RSI Fast",
      step: [90, 80, 70, 60, 50, 40, 30, 20],
      category: "Technicals",
      defaultCondition: "over",
      defaultValue: "any",
    },
    mfi: {
      label: "Money Flow Index",
      step: [90, 80, 70, 60, 50, 40, 30, 20],
      category: "Technicals",
      defaultCondition: "over",
      defaultValue: "any",
    },
    cci: {
      label: "Commodity Channel Index",
      step: [250, 200, 100, 50, 20, 0, -20, -50, -100, -200, -250],
      category: "Technicals",
      defaultCondition: "over",
      defaultValue: "any",
    },
    atr: {
      label: "Average True Range",
      step: [20, 15, 10, 5, 3, 1],
      category: "Technicals",
      defaultCondition: "over",
      defaultValue: "any",
    },
    sma20: {
      label: "20-Day Moving Average",
      step: [
        "Price above SMA20",
        "SMA20 above SMA50",
        "SMA20 above SMA100",
        "SMA20 above SMA200",
        "Price below SMA20",
        "SMA20 below SMA50",
        "SMA20 below SMA100",
        "SMA20 below SMA200",
      ],
      category: "Technicals",
      defaultValue: "any",
    },
    sma50: {
      label: "50-Day Moving Average",
      step: [
        "Price above SMA50",
        "SMA50 above SMA20",
        "SMA50 above SMA100",
        "SMA50 above SMA200",
        "Price below SMA50",
        "SMA50 below SMA20",
        "SMA50 below SMA100",
        "SMA50 below SMA200",
      ],
      category: "Technicals",
      defaultValue: "any",
    },
    sma100: {
      label: "100-Day Moving Average",
      step: [
        "Price above SMA100",
        "SMA100 above SMA20",
        "SMA100 above SMA50",
        "SMA100 above SMA200",
        "Price below SMA100",
        "SMA100 below SMA20",
        "SMA100 below SMA50",
        "SMA100 below SMA200",
      ],
      category: "Technicals",
      defaultValue: "any",
    },
    sma200: {
      label: "200-Day Moving Average",
      step: [
        "Price above SMA200",
        "SMA200 above SMA20",
        "SMA200 above SMA50",
        "SMA200 above SMA100",
        "Price below SMA200",
        "SMA200 below SMA20",
        "SMA200 below SMA50",
        "SMA200 below SMA100",
      ],
      category: "Technicals",
      defaultValue: "any",
    },
    ema20: {
      label: "20-Day Exp. Moving Average",
      step: [
        "Price above EMA20",
        "EMA20 above EMA50",
        "EMA20 above EMA100",
        "EMA20 above EMA200",
        "Price below EMA20",
        "EMA20 below EMA50",
        "EMA20 below EMA100",
        "EMA20 below EMA200",
      ],
      category: "Technicals",
      defaultValue: "any",
    },
    ema50: {
      label: "50-Day Exp. Moving Average",
      step: [
        "Price above EMA50",
        "EMA50 above EMA20",
        "EMA50 above EMA100",
        "EMA50 above EMA200",
        "Price below EMA50",
        "EMA50 below EMA20",
        "EMA50 below EMA100",
        "EMA50 below EMA200",
      ],
      category: "Technicals",
      defaultValue: "any",
    },
    ema100: {
      label: "100-Day Exp. Moving Average",
      step: [
        "Price above EMA100",
        "EMA100 above EMA20",
        "EMA100 above EMA50",
        "EMA100 above EMA200",
        "Price below EMA100",
        "EMA100 below EMA20",
        "EMA100 below EMA50",
        "EMA100 below EMA200",
      ],
      category: "Technicals",
      defaultValue: "any",
    },
    ema200: {
      label: "200-Day Exp. Moving Average",
      step: [
        "Price above EMA200",
        "EMA200 above EMA20",
        "EMA200 above EMA50",
        "EMA200 above EMA100",
        "Price below EMA200",
        "EMA200 below EMA20",
        "EMA200 below EMA50",
        "EMA200 below EMA100",
      ],
      category: "Technicals",
      defaultValue: "any",
    },
    annualDividend: {
      label: "Annual Dividend",
      step: [10, 5, 3, 2, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Dividends",
    },
    payoutFrequency: {
      label: "Dividend Payout Frequency",
      step: ["Monthly", "Quarterly", "Semi-Annual", "Annual"],
      defaultCondition: "",
      defaultValue: "any",
      category: "Dividends",
    },
    yearHigh: {
      label: "52W High",
      step: [500, 200, 100, 50, 25, 10],
      defaultCondition: "under",
      defaultValue: "any",
      category: "52-Week",
    },
    yearLow: {
      label: "52W Low",
      step: [100, 50, 25, 10, 5],
      defaultCondition: "over",
      defaultValue: "any",
      category: "52-Week",
    },
    fromHigh52W: {
      label: "From 52W High (%)",
      step: ["0%", "-5%", "-10%", "-20%", "-30%", "-50%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "52-Week",
    },
    fromLow52W: {
      label: "From 52W Low (%)",
      step: ["100%", "50%", "25%", "10%", "5%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "52-Week",
    },
    pe: {
      label: "PE Ratio",
      step: [50, 30, 20, 15, 10, 5, 0],
      defaultCondition: "under",
      defaultValue: "any",
      category: "Valuation",
    },
    nav: {
      label: "NAV",
      step: [500, 200, 100, 50, 25, 10],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation",
    },
    marketCap: {
      label: "Market Cap",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation",
    },
    topSector: {
      label: "Top Sector",
      step: [
        "Technology",
        "Healthcare",
        "Financial Services",
        "Energy",
        "Industrials",
        "Consumer Cyclical",
        "Consumer Defensive",
        "Real Estate",
        "Communication Services",
        "Basic Materials",
        "Utilities",
      ],
      defaultCondition: "",
      defaultValue: "any",
      category: "Fund Info",
    },
    exchange: {
      label: "Exchange",
      step: ["AMEX", "NASDAQ", "NYSE"],
      defaultCondition: "",
      defaultValue: "any",
      category: "Fund Info",
    },
    aumGroup: {
      label: "AUM Group",
      step: [
        "Mega (100B+)",
        "Large (10-100B)",
        "Mid (1-10B)",
        "Small (100M-1B)",
        "Micro (<100M)",
      ],
      defaultCondition: "",
      defaultValue: "any",
      category: "Fund Info",
    },
    country: {
      label: "Country",
      step: [
        "United States",
        "Ireland",
        "Canada",
        "Luxembourg",
        "Sweden",
        "Germany",
        "United Kingdom",
        "Switzerland",
        "Netherlands",
        "Japan",
        "Hong Kong",
        "Bermuda",
        "Taiwan, Province of China",
      ],
      defaultCondition: "",
      defaultValue: "any",
      category: "Fund Info",
    },
    excludeTickers: {
      label: "Exclude Tickers",
      step: [],
      defaultCondition: "",
      defaultValue: "any",
      category: "Ticker Filters",
      varType: "tickerList",
    },
    includeTickers: {
      label: "Include Tickers",
      step: [],
      defaultCondition: "",
      defaultValue: "any",
      category: "Ticker Filters",
      varType: "tickerList",
    },
  };

  let rowsPerPageOptions = [20, 50, 100];

  // Generate allRows from allRules
  $: allRows = Object.entries(allRules)
    ?.sort(([, a], [, b]) => a.label.localeCompare(b.label)) // Sort by label
    ?.map(([ruleName, ruleProps]) => ({
      rule: ruleName,
      ...ruleProps,
    }));

  $: excludeTickerList = (() => {
    const value = valueMappings["excludeTickers"];
    if (!value || value === "any") return [];
    if (typeof value === "string") {
      return value
        .split(",")
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean);
    }
    return [];
  })();

  $: includeTickerList = (() => {
    const value = valueMappings["includeTickers"];
    if (!value || value === "any") return [];
    if (typeof value === "string") {
      return value
        .split(",")
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean);
    }
    return [];
  })();

  let filteredGroupedRules;
  let searchTerm = "";

  let ruleName = "";

  // Quick search functionality for unselected rules
  let quickSearchTerm = "";
  let quickSearchResults = [];
  let showQuickSearchDropdown = false;
  let selectedQuickSearchIndex = -1;

  // Define your default values
  let excludeTickerInput = "";
  let excludeTickerResults = [];
  let excludeTickerTimeout: ReturnType<typeof setTimeout> | null = null;
  let excludeTickerList = [];

  let includeTickerInput = "";
  let includeTickerResults = [];
  let includeTickerTimeout: ReturnType<typeof setTimeout> | null = null;
  let includeTickerList = [];

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

  // Update ruleCondition and valueMappings based on existing rules
  ruleOfList?.forEach((rule) => {
    ruleCondition[rule.name] =
      rule.condition ?? allRules[rule.name]?.defaultCondition ?? "";
    valueMappings[rule.name] =
      rule.value ?? allRules[rule.name]?.defaultValue ?? "any";
  });

  async function handleCreateStrategy() {
    if (["Pro", "Plus"].includes(data?.user?.tier)) {
      const closePopup = document.getElementById("addStrategy");
      closePopup?.dispatchEvent(new MouseEvent("click"));
    } else {
      goto("/pricing");
    }
  }

  async function handleDeleteStrategy() {
    const idToDelete = deleteTargetId || selectedStrategy;
    deleteTargetId = "";

    const deletePromise = (async () => {
      const postData = { strategyId: idToDelete, type: "etfsScreener" };

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
          strategyList?.find((item) => item.id === selectedStrategy)?.rules ??
          [];

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
            ?.filter((rule) => checkedRules.includes(rule.name))
            ?.map((rule) => [
              rule.name,
              new Set(Array.isArray(rule.value) ? rule.value : [rule.value]),
            ]),
        );

        await fetchTableData({ page: 1 });
      }
    })();

    return toast?.promise(deletePromise, {
      loading: "Deleting screener…",
      success: "Screener deleted successfully!",
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
    formData.append("rules", "[]");
    let title = formData.get("title");

    if (!title || title.length === 0) {
      title = "My Screener";
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
    const postData = { type: "etfsScreener" };
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

      // ——— SUCCESS: run your existing post-create logic ———
      toast.success("Screener created successfully!", {
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
      strategyList = [output, ...strategyList];
      selectedPopularStrategy = "";

      if (removeList) {
        removeList = false;
        ruleOfList = [];
      }

      // trigger a save without toasting again
      await handleSave(false);

      return output;
    })();

    // show loading / success / error around the whole operation
    return toast.promise(createPromise, {
      loading: "Creating screener…",
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

  function resetTableSearch() {
    inputValue = "";
    fetchTableData({ page: 1 });
  }

  async function switchStrategy(item) {
    displayTableTab = "general";

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

    // Rebuild checkedItems BEFORE fetching so buildActiveRules uses correct state
    checkedItems = new Map(
      ruleOfList
        ?.filter((rule) => checkedRules.includes(rule.name))
        ?.map((rule) => [
          rule.name,
          new Set(Array.isArray(rule.value) ? rule.value : [rule.value]),
        ]),
    );

    fetchTableData({ page: 1 });
  }

  function changeRule(state: string) {
    if (
      !["Pro", "Plus"].includes(data?.user?.tier) &&
      onlySubscriberRules.includes(state)
    ) {
      goto("/pricing");
    } else {
      selectedPopularStrategy = "";
      ruleName = state;
      handleAddRule();
    }
  }

  // Build active rules from current UI state for API requests
  function buildActiveRules() {
    return ruleOfList
      .map((rule) => {
        const name = rule.name;
        const condition =
          ruleCondition[name] ?? allRules[name]?.defaultCondition ?? "";
        let value;
        if (checkedRules.includes(name) && checkedItems?.has(name)) {
          value = [...checkedItems.get(name)];
        } else {
          value = valueMappings[name] ?? allRules[name]?.defaultValue ?? "any";
        }
        return { name, condition, value };
      })
      .filter((r) => {
        if (r.value === "any") return false;
        if (
          Array.isArray(r.value) &&
          r.value.length === 1 &&
          r.value[0] === "any"
        )
          return false;
        if (Array.isArray(r.value) && r.value.includes("any")) return false;
        return true;
      });
  }

  // Core server-side fetch for paginated data
  async function fetchTableData({
    page = undefined,
    pageSize = undefined,
    sortKey = undefined,
    sortOrder = undefined,
  } = {}) {
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    const invocationId = ++requestId;

    // Update display rules so the UI shows the active filters
    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule.name === row.rule),
    );

    const activeRules = buildActiveRules();
    isFetchingPage = true;
    isDataLoading = true;

    try {
      const params = new URLSearchParams({
        page: String(page ?? currentPage),
        pageSize: String(pageSize ?? rowsPerPage),
        sortKey: sortKey ?? activeSortKey,
        sortOrder: sortOrder ?? activeSortOrder,
        tab: displayTableTab,
      });
      if (inputValue) params.set("search", inputValue);
      if (activeRules.length > 0)
        params.set("rules", JSON.stringify(activeRules));

      const allRuleNames = ruleOfList
        ?.map((r) => r.name)
        .filter(
          (name) =>
            name && name !== "excludeTickers" && name !== "includeTickers",
        )
        .join(",");
      if (allRuleNames) params.set("displayColumns", allRuleNames);

      const response = await fetch(`/api/etf-screener-feed?${params}`, {
        signal,
      });
      if (signal.aborted) return;
      const result = await response.json();
      if (invocationId !== requestId) return;

      displayedData = result.items ?? [];
      totalItems = result.total ?? 0;
      currentPage = result.page ?? page ?? currentPage;
      rowsPerPage = result.pageSize ?? pageSize ?? rowsPerPage;
      totalPages = result.totalPages ?? 1;
      activeSortKey = sortKey ?? activeSortKey;
      activeSortOrder = sortOrder ?? activeSortOrder;
    } catch (e) {
      if (e?.name === "AbortError") return;
      console.error("fetchTableData failed:", e);
      if (invocationId === requestId) {
        displayedData = [];
        totalItems = 0;
        totalPages = 1;
      }
    } finally {
      if (invocationId === requestId) {
        isFetchingPage = false;
        isDataLoading = false;
        isLoaded = true;
      }
    }
  }

  // Fetch all filtered data for export/download
  async function fetchAllFilteredData() {
    try {
      const activeRules = buildActiveRules();
      const params = new URLSearchParams({
        page: "1",
        pageSize: "50000",
        sortKey: activeSortKey,
        sortOrder: activeSortOrder,
        tab: displayTableTab,
      });
      if (inputValue) params.set("search", inputValue);
      if (activeRules.length > 0)
        params.set("rules", JSON.stringify(activeRules));
      const allRuleNames = ruleOfList
        ?.map((r) => r.name)
        .filter(Boolean)
        .join(",");
      if (allRuleNames) params.set("displayColumns", allRuleNames);
      const response = await fetch(`/api/etf-screener-feed?${params}`);
      const result = await response.json();
      return result?.items ?? [];
    } catch (e) {
      console.error("fetchAllFilteredData failed:", e);
      return [];
    }
  }

  // Debounced rule fetch
  let _ruleFetchTimeout: ReturnType<typeof setTimeout> | null = null;
  function debouncedRuleFetch() {
    if (_ruleFetchTimeout) clearTimeout(_ruleFetchTimeout);
    _ruleFetchTimeout = setTimeout(() => fetchTableData({ page: 1 }), 200);
  }

  async function searchExcludeTicker() {
    if (excludeTickerTimeout) clearTimeout(excludeTickerTimeout);
    if (!excludeTickerInput.trim()) {
      excludeTickerResults = [];
      return;
    }
    excludeTickerTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(excludeTickerInput)}&limit=8`,
        );
        if (response.ok) {
          excludeTickerResults = await response.json();
        } else {
          excludeTickerResults = [];
        }
      } catch {
        excludeTickerResults = [];
      }
    }, 100);
  }

  function addExcludeTicker(symbol: string) {
    const ticker = symbol.trim().toUpperCase();
    if (!ticker || ticker.length >= 10) return;
    const current = excludeTickerList.includes(ticker)
      ? excludeTickerList
      : [...excludeTickerList, ticker];
    const newValue = current.length > 0 ? current.join(", ") : "any";
    valueMappings["excludeTickers"] = newValue;
    valueMappings = valueMappings;
    const ruleToUpdate = ruleOfList?.find(
      (rule) => rule.name === "excludeTickers",
    );
    if (ruleToUpdate) {
      ruleToUpdate.value = newValue;
      ruleOfList = [...ruleOfList];
    }
    excludeTickerInput = "";
    excludeTickerResults = [];
    debouncedRuleFetch();
  }

  function removeExcludeTicker(ticker: string) {
    const current = excludeTickerList.filter(
      (item) => item !== ticker.toUpperCase(),
    );
    const newValue = current.length > 0 ? current.join(", ") : "any";
    valueMappings["excludeTickers"] = newValue;
    valueMappings = valueMappings;
    const ruleToUpdate = ruleOfList?.find(
      (rule) => rule.name === "excludeTickers",
    );
    if (ruleToUpdate) {
      ruleToUpdate.value = newValue;
      ruleOfList = [...ruleOfList];
    }
    debouncedRuleFetch();
  }

  async function searchIncludeTicker() {
    if (includeTickerTimeout) clearTimeout(includeTickerTimeout);
    if (!includeTickerInput.trim()) {
      includeTickerResults = [];
      return;
    }
    includeTickerTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(includeTickerInput)}&limit=8`,
        );
        if (response.ok) {
          includeTickerResults = await response.json();
        } else {
          includeTickerResults = [];
        }
      } catch {
        includeTickerResults = [];
      }
    }, 100);
  }

  function addIncludeTicker(symbol: string) {
    const ticker = symbol.trim().toUpperCase();
    if (!ticker || ticker.length >= 10) return;
    const current = includeTickerList.includes(ticker)
      ? includeTickerList
      : [...includeTickerList, ticker];
    const newValue = current.length > 0 ? current.join(", ") : "any";
    valueMappings["includeTickers"] = newValue;
    valueMappings = valueMappings;
    const ruleToUpdate = ruleOfList?.find(
      (rule) => rule.name === "includeTickers",
    );
    if (ruleToUpdate) {
      ruleToUpdate.value = newValue;
      ruleOfList = [...ruleOfList];
    }
    includeTickerInput = "";
    includeTickerResults = [];
    debouncedRuleFetch();
  }

  function removeIncludeTicker(ticker: string) {
    const current = includeTickerList.filter(
      (item) => item !== ticker.toUpperCase(),
    );
    const newValue = current.length > 0 ? current.join(", ") : "any";
    valueMappings["includeTickers"] = newValue;
    valueMappings = valueMappings;
    const ruleToUpdate = ruleOfList?.find(
      (rule) => rule.name === "includeTickers",
    );
    if (ruleToUpdate) {
      ruleToUpdate.value = newValue;
      ruleOfList = [...ruleOfList];
    }
    debouncedRuleFetch();
  }

  // Search functionality — server-side via fetchTableData (debounced)
  let _searchTimeout: ReturnType<typeof setTimeout> | null = null;
  async function search() {
    if (_searchTimeout) clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => fetchTableData({ page: 1 }), 200);
  }

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

  function handleAddRule() {
    if (ruleName === "") {
      toast.error("Please select a rule", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    let newRule;

    switch (ruleName) {
      case "payoutFrequency":
      case "assetClass":
      case "etfProvider":
      case "topSector":
      case "exchange":
      case "aumGroup":
      case "country":
      case "ema20":
      case "ema50":
      case "ema100":
      case "ema200":
      case "sma20":
      case "sma50":
      case "sma100":
      case "sma200":
        newRule = {
          name: ruleName,
          value: Array.isArray(valueMappings[ruleName])
            ? valueMappings[ruleName]
            : [valueMappings[ruleName]],
        }; // Ensure value is an array
        break;
      case "excludeTickers":
      case "includeTickers":
        newRule = { name: ruleName, value: valueMappings[ruleName] };
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
      ruleOfList.splice(existingRuleIndex, 1);
      ruleOfList = [...ruleOfList];
    } else {
      ruleOfList = [...ruleOfList, newRule];
      debouncedRuleFetch();
    }
  }

  async function handleResetAll() {
    selectedPopularStrategy = "";
    inputValue = "";
    displayTableTab = "general";
    ruleOfList = [];
    Object.keys(allRules).forEach((ruleName) => {
      ruleCondition[ruleName] = allRules[ruleName].defaultCondition;
      valueMappings[ruleName] = allRules[ruleName].defaultValue;
    });
    ruleName = "";
    checkedItems = new Map();
    fetchTableData({ page: 1 });
  }

  async function handleDeleteRule(state) {
    selectedPopularStrategy = "";

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

        // Clear checkedItems so checkboxes reflect the reset
        if (checkedItems.has(state)) {
          checkedItems.delete(state);
          checkedItems = checkedItems;
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
        } else if (state === ruleName) {
          ruleName = "";
        }
      }

      debouncedRuleFetch();
    }
  }

  // Pagination functions
  function goToPage(page) {
    if (page >= 1 && page <= totalPages && !isFetchingPage) {
      fetchTableData({ page });
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    saveRowsPerPage();
    fetchTableData({ page: 1, pageSize: newRowsPerPage });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Save rows per page preference to localStorage
  function saveRowsPerPage() {
    if (typeof localStorage === "undefined") return;

    try {
      const paginationKey = `/etf-screener_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  // Load rows per page preference from localStorage
  function loadRowsPerPage() {
    if (typeof localStorage === "undefined") {
      rowsPerPage = 20; // Default value
      return;
    }

    try {
      const paginationKey = `/etf-screener_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 20; // Default if invalid or not found
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 20; // Default on error
    }
  }

  // Toggle full width mode
  function toggleFullWidth() {
    isFullWidth = !isFullWidth;
    try {
      localStorage.setItem("etf-screener-full-width", String(isFullWidth));
    } catch (e) {
      console.warn("Failed to save full width preference:", e);
    }
  }

  let LoginPopup;

  onMount(async () => {
    loadRowsPerPage();

    const savedFullWidth = localStorage.getItem("etf-screener-full-width");
    if (savedFullWidth !== null) {
      isFullWidth = savedFullWidth === "true";
    }

    if (!data?.user) {
      LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
    }

    isLoaded = true;
    groupedRules = groupScreenerRules(allRows);
  });

  onDestroy(() => {
    if (currentAbortController) currentAbortController.abort();
    if (_ruleFetchTimeout) clearTimeout(_ruleFetchTimeout);
    if (_searchTimeout) clearTimeout(_searchTimeout);
    if (excludeTickerTimeout) clearTimeout(excludeTickerTimeout);
    if (includeTickerTimeout) clearTimeout(includeTickerTimeout);
  });

  async function handleSave(showMessage) {
    if (!data?.user) return;

    if (strategyList?.length === 0) {
      handleCreateStrategy();
    }

    if (strategyList?.length > 0) {
      // update local strategyList
      const matchedStrategy = strategyList.find(
        (item) => item.id === selectedStrategy,
      );
      if (matchedStrategy) {
        matchedStrategy.rules = ruleOfList;
      }
      strategyList = strategyList;

      const postData = {
        strategyId: selectedStrategy,
        rules: ruleOfList,
        type: "etfsScreener",
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
          loading: "Saving screener...",
          success: "Screener saved!",
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

  $: {
    if (ruleOfList) {
      const ruleToUpdate = ruleOfList?.find((rule) => rule.name === ruleName);
      if (ruleToUpdate) {
        ruleToUpdate.value = valueMappings[ruleToUpdate.name];
        ruleToUpdate.condition = ruleCondition[ruleToUpdate.name];
        ruleOfList = [...ruleOfList];
      }
      if (isLoaded) {
        debouncedRuleFetch();
      }
    }
  }

  $: {
    if (searchTerm?.length > 0) {
      // Filter rows by search term
      const filteredRows = allRows?.filter((row) =>
        row?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
      );

      // Group the filtered rows by category
      filteredGroupedRules = groupScreenerRules(filteredRows);
    } else {
      // If no search term, return all rows grouped by category
      filteredGroupedRules = groupScreenerRules(allRows);
    }
  }

  $: charNumber = $screenWidth < 640 ? 20 : 40;

  function changeRuleCondition(name: string, state: string) {
    ruleName = name;
    const newState = state?.toLowerCase();

    // Initialize array for "between" condition
    if (newState === "between") {
      valueMappings[ruleName] = ["", ""];
    } else if (
      ruleCondition[ruleName] === "between" &&
      ["over", "under", "exactly"].includes(newState)
    ) {
      valueMappings[ruleName] = "any";
    }

    ruleCondition[ruleName] = newState;
  }

  let checkedItems = new Map(
    ruleOfList
      ?.filter((rule) => checkedRules.includes(rule.name)) // Only include specific rules
      ?.map((rule) => [
        rule.name,
        new Set(Array.isArray(rule.value) ? rule.value : [rule.value]),
      ]),
  );

  function isChecked(item, ruleName) {
    return checkedItems?.has(ruleName) && checkedItems?.get(ruleName).has(item);
  }

  // Utility function to convert values to comparable numbers
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

  // Custom sorting function
  function customSort(a, b) {
    return parseValue(a) - parseValue(b);
  }

  async function handleChangeValue(
    value,
    { shouldSort = true, skipFetch = false } = {},
  ) {
    // Add this check at the beginning of the function
    if (ruleCondition[ruleName] === "between") {
      // Ensure valueMappings[ruleName] is always an array for "between" condition
      if (!Array.isArray(valueMappings[ruleName])) {
        valueMappings[ruleName] = ["", ""];
      }

      // If value is a single value (from input), update only the specified index
      if (!Array.isArray(value) && typeof currentIndex === "number") {
        valueMappings[ruleName][currentIndex] = value;
        value = valueMappings[ruleName];
      } else if (Array.isArray(value)) {
        // Only for preset ranges from dropdown
        valueMappings[ruleName] = value;
      }
    }

    if (checkedItems.has(ruleName)) {
      const itemsSet = checkedItems.get(ruleName);

      // Apply sorting only if shouldSort is true
      const sortedValue =
        shouldSort && Array.isArray(value) ? value.sort(customSort) : value;

      const valueKey = Array.isArray(sortedValue)
        ? sortedValue.join("-")
        : sortedValue;

      if (itemsSet?.has(valueKey)) {
        itemsSet?.delete(valueKey);
      } else {
        itemsSet?.add(valueKey);
      }
    } else {
      // Apply sorting only if shouldSort is true
      const sortedValue =
        shouldSort && Array.isArray(value) ? value.sort(customSort) : value;

      const valueKey = Array.isArray(sortedValue)
        ? sortedValue.join("-")
        : sortedValue;

      checkedItems?.set(ruleName, new Set([valueKey]));
    }

    if (checkedRules.includes(ruleName)) {
      searchQuery = "";
      if (!Array.isArray(valueMappings[ruleName])) {
        valueMappings[ruleName] = [];
      }

      // Apply sorting only if shouldSort is true
      const sortedValue =
        shouldSort && Array.isArray(value) ? value?.sort(customSort) : value;

      const valueKey = Array.isArray(sortedValue)
        ? sortedValue.join("-")
        : sortedValue;

      const index = valueMappings[ruleName].indexOf(valueKey);
      if (index === -1) {
        valueMappings[ruleName].push(valueKey);
      } else {
        valueMappings[ruleName].splice(index, 1);
      }

      if (valueMappings[ruleName].length === 0) {
        valueMappings[ruleName] = "any";
      }

      if (!skipFetch) debouncedRuleFetch();
    } else if (ruleName in valueMappings) {
      if (ruleCondition[ruleName] === "between" && Array.isArray(value)) {
        // Apply sorting only if shouldSort is true
        valueMappings[ruleName] = shouldSort ? value?.sort(customSort) : value;
      } else {
        valueMappings[ruleName] = value;
      }
    } else {
      console.warn(`Unhandled rule: ${ruleName}`);
    }

    // Ensure the filter is applied for "between" conditions
    if (
      !skipFetch &&
      ruleCondition[ruleName] === "between" &&
      value.some((v) => v !== "")
    ) {
      debouncedRuleFetch();
    }
  }

  async function stepSizeValue(value, condition) {
    if (value === "any") {
      value = 0;
    }
    const match = value.toString().match(/^(-?[\d.]+)([KMB%]?)$/);
    if (!match) return value;

    let [_, number, suffix] = match;
    number = parseFloat(number);

    let step = 1;

    number += condition === "add" ? step : -step;

    // Round to 2 decimal places for consistency
    number = parseFloat(number?.toFixed(2));
    const newValue = suffix ? `${number}${suffix}` : Math.round(number);
    await handleChangeValue(newValue);
  }

  let currentIndex = null;

  async function handleValueInput(event, ruleName, index = null) {
    const newValue = event.target.value;

    if (ruleCondition[ruleName] === "between") {
      // Ensure valueMappings[ruleName] is initialized as an array
      if (!Array.isArray(valueMappings[ruleName])) {
        valueMappings[ruleName] = ["", ""];
      }

      // Store the current index being modified
      currentIndex = index;

      if (newValue?.length === 0) {
        valueMappings[ruleName][index] = "";
      }

      await handleChangeValue(newValue, { shouldSort: false });

      // Reset currentIndex after handling the value
      currentIndex = null;
    } else {
      if (newValue?.length === 0) {
        const ruleIndex = ruleOfList?.findIndex(
          (rule) => rule.name === ruleName,
        );
        if (ruleIndex !== -1) {
          ruleOfList[ruleIndex].value = "any";
        }
      }
      await handleChangeValue(newValue);
    }
  }

  async function popularStrategy(state: string) {
    isDataLoading = true;
    inputValue = "";
    const strategies = {
      lowCostIndex: {
        name: "Low-Cost Index ETFs",
        rules: [
          { condition: "under", name: "expenseRatio", value: "0.1" },
          { condition: "over", name: "totalAssets", value: "10B" },
          { condition: "", name: "assetClass", value: ["Equity"] },
        ],
      },
      highDividend: {
        name: "High Dividend ETFs",
        rules: [
          { condition: "over", name: "dividendYield", value: "3%" },
          { condition: "over", name: "totalAssets", value: "1B" },
        ],
      },
      topPerformers1Y: {
        name: "Top Performers 1Y",
        rules: [
          { condition: "over", name: "change1Y", value: "20%" },
          { condition: "over", name: "totalAssets", value: "500M" },
        ],
      },
      oversoldETFs: {
        name: "Oversold ETFs",
        rules: [
          { condition: "under", name: "rsi", value: 30 },
          { condition: "over", name: "totalAssets", value: "1B" },
        ],
      },
    };

    const strategy = strategies[state];
    if (strategy) {
      // If clicking the same strategy again, don't clear the rules
      if (selectedPopularStrategy === strategy.name) {
        isDataLoading = false;
        return;
      }

      selectedPopularStrategy = strategy.name;
      ruleOfList = [];

      // Clear all previous checked items and value mappings to avoid toggle behavior
      checkedItems.clear();
      Object.keys(valueMappings).forEach((key) => {
        valueMappings[key] = "any";
      });

      ruleOfList = strategy?.rules;
      ruleOfList?.forEach((row) => {
        ruleName = row?.name;
        ruleCondition[ruleName] = row?.condition;
        handleChangeValue(row?.value, { skipFetch: true });
      });

      await fetchTableData({ page: 1 });
    } else {
      isDataLoading = false;
    }
  }

  function handleInput(event) {
    const searchQuery = event.target.value?.toLowerCase() || "";

    setTimeout(() => {
      testList = [];

      if (searchQuery.length > 0) {
        const rawList = allRules[ruleName]?.step ?? [];
        testList =
          rawList?.filter((item) => {
            const index = item?.toLowerCase();
            // Check if country starts with searchQuery
            return index?.startsWith(searchQuery);
          }) || [];
      }
    }, 50);
  }

  const sortData = (key) => {
    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    // Cycle through 'none', 'asc', 'desc' for the clicked key
    const orderCycle = ["none", "asc", "desc"];
    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    if (sortOrder === "none") {
      activeSortKey = "marketCap";
      activeSortOrder = "desc";
      fetchTableData({ page: 1, sortKey: "marketCap", sortOrder: "desc" });
    } else {
      activeSortKey = key;
      activeSortOrder = sortOrder;
      fetchTableData({ page: 1, sortKey: key, sortOrder });
    }
  };

  let columns;
  let sortOrders;

  // Column reordering state and functions
  let customColumnOrder: string[] = [];
  let lastAppliedColumnKeys: string = "";

  function getColumnOrderStorageKey(): string {
    // Include the current tab in the storage key for tab-specific column orders
    const basePath = "/etf-screener";
    return `${basePath}_${displayTableTab}_columnOrder`;
  }

  function loadColumnOrder(forceReapply: boolean = false): void {
    const storageKey = getColumnOrderStorageKey();
    if (!storageKey || typeof localStorage === "undefined") {
      customColumnOrder = [];
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customColumnOrder = parsed;
          if (forceReapply) {
            lastAppliedColumnKeys = "";
          }
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load column order:", e);
    }
    customColumnOrder = [];
  }

  function saveColumnOrder(order: string[]): void {
    const storageKey = getColumnOrderStorageKey();
    if (!storageKey || typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(order));
    } catch (e) {
      console.warn("Failed to save column order:", e);
    }
  }

  function applyColumnOrder(cols: typeof columns): typeof columns {
    if (!customColumnOrder || customColumnOrder.length === 0) {
      return cols;
    }

    const colMap = new Map(cols.map((col) => [col.key, col]));
    const orderedCols: typeof columns = [];
    const usedKeys = new Set<string>();

    for (const key of customColumnOrder) {
      const col = colMap.get(key);
      if (col) {
        orderedCols.push(col);
        usedKeys.add(key);
      }
    }

    for (const col of cols) {
      if (!usedKeys.has(col.key)) {
        orderedCols.push(col);
      }
    }

    return orderedCols;
  }

  function handleColumnReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;

    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);

    customColumnOrder = newColumns.map((col) => col.key);
    saveColumnOrder(customColumnOrder);
    lastAppliedColumnKeys = newColumns.map((col) => col.key).join("|");
    columns = newColumns;
  }

  function resetColumnOrder(): void {
    const storageKey = getColumnOrderStorageKey();
    if (storageKey && typeof localStorage !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    customColumnOrder = [];
    lastAppliedColumnKeys = "";
    // Trigger column regeneration by re-setting displayTableTab
    const currentTab = displayTableTab;
    displayTableTab = "";
    displayTableTab = currentTab;
  }

  // Initial columns and sort orders for the "general" tab
  const generalColumns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "totalAssets", label: "AUM", align: "right" },
    { key: "price", label: "Price", align: "right" },
    { key: "changesPercentage", label: "% Change", align: "right" },
    { key: "expenseRatio", label: "Expense Ratio", align: "right" },
    { key: "numberOfHoldings", label: "Holdings", align: "right" },
  ];

  const generalSortOrders = {
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    totalAssets: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    expenseRatio: { order: "none", type: "number" },
    numberOfHoldings: { order: "none", type: "number" },
  };

  const stringTypeRules = [
    "etfProvider",
    "assetClass",
    "topSector",
    "exchange",
    "aumGroup",
    "payoutFrequency",
    "inceptionDate",
    "country",
  ];

  // Helper to determine the type based on stringTypeRules
  const getType = (key) =>
    stringTypeRules.includes(key) ? "string" : "number";

  $: {
    if (displayTableTab) {
      const baseColumnsMap = {
        performance: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "totalAssets", label: "AUM", align: "right" },
        ],
        technicals: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "totalAssets", label: "AUM", align: "right" },
        ],
        filters: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "totalAssets", label: "AUM", align: "right" },
        ],
        dividends: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "totalAssets", label: "AUM", align: "right" },
        ],
      };

      const baseSortOrdersMap = {
        performance: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          totalAssets: { order: "none", type: "number" },
        },
        technicals: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          totalAssets: { order: "none", type: "number" },
        },
        dividends: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          totalAssets: { order: "none", type: "number" },
        },
        filters: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          totalAssets: { order: "none", type: "number" },
        },
      };

      if (displayTableTab === "general") {
        columns = [...generalColumns];
        sortOrders = { ...generalSortOrders };
      } else {
        columns = [...(baseColumnsMap[displayTableTab] || [])];
        sortOrders = { ...(baseSortOrdersMap[displayTableTab] || {}) };

        const rulesList = ["performance", "technicals", "dividends"].includes(
          displayTableTab,
        )
          ? tabRuleList
          : displayRules;
        rulesList?.forEach((rule) => {
          if (rule.rule !== "totalAssets") {
            columns.push({
              key: rule.rule,
              label: rule.label,
              align: "right",
            });
            sortOrders[rule.rule] = { order: "none", type: getType(rule.rule) };
          }
        });
      }

      // Load and apply custom column order for the current tab
      loadColumnOrder(true);
      if (customColumnOrder && customColumnOrder.length > 0) {
        columns = applyColumnOrder(columns);
      }
    }
  }

  let tabRuleList = [];

  const tabRuleMap = {
    performance: [
      { name: "totalAssets", value: "any" },
      { name: "change1W", value: "any" },
      { name: "change1M", value: "any" },
      { name: "change3M", value: "any" },
      { name: "change1Y", value: "any" },
    ],
    technicals: [
      { name: "totalAssets", value: "any" },
      { name: "rsi", value: "any" },
      { name: "sma50", value: "any" },
      { name: "sma200", value: "any" },
      { name: "beta", value: "any" },
    ],
    dividends: [
      { name: "totalAssets", value: "any" },
      { name: "annualDividend", value: "any" },
      { name: "dividendYield", value: "any" },
      { name: "payoutFrequency", value: "any" },
    ],
  };

  async function changeTab(state) {
    displayTableTab = state;
    isDataLoading = true;

    const rules = tabRuleMap[state];
    if (rules) {
      tabRuleList = rules
        ?.map((rule) => allRows?.find((row) => row?.rule === rule?.name))
        ?.filter(Boolean);
    }

    await fetchTableData({ page: 1 });
  }
</script>

<SEO
  title="Free ETF Screener - Filter & Find ETFs"
  description="Screen and filter {allRows?.length ||
    'thousands of'} ETFs by AUM, expense ratio, dividends, performance, technicals and more. Free ETF screener with advanced filters."
  keywords="etf screener, etf filter, etf search, find etfs, etf screening tool, expense ratio filter, aum filter, dividend etf screener"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "stocknear ETF Screener",
    description:
      "Advanced ETF screening tool with filters for AUM, expense ratio, performance, technicals, dividends and more.",
    url: "https://stocknear.com/etf-screener",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Multi-criteria ETF filtering",
      "Expense ratio and AUM screening",
      "Technical indicator filters",
      "Dividend screening",
      "Performance analytics",
      "Custom screening strategies",
      "Real-time data updates",
      "Export capabilities",
    ],
    softwareRequirements: "Web Browser",
    provider: {
      "@type": "Organization",
      name: "Stocknear",
    },
  }}
/>

<section
  class="w-full overflow-hidden min-h-screen pt-5 pb-40 px-3 text-gray-700 dark:text-zinc-200 transition-all duration-300 {isFullWidth
    ? 'max-w-full'
    : 'max-w-3xl sm:max-w-(--breakpoint-xl)'}"
>
  <BreadCrumb containerClass="text-sm sm:text-[1rem] breadcrumbs">
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >Home</a
      >
    </li>
    <li>
      <span class="text-gray-500 dark:text-zinc-400">ETF Screener</span>
    </li>
  </BreadCrumb>

  <!--Start Build Strategy-->
  <div class="sm:rounded">
    <div class="flex flex-col md:flex-row items-start md:items-center mb-5">
      <div class="w-full flex flex-row items-center sm:mt-4">
        <h1
          class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          ETF Screener
        </h1>
        <span
          class="inline-block text-xs sm:text-sm font-medium ml-2 mt-3 text-gray-500 dark:text-zinc-400"
        >
          {totalItems?.toLocaleString("en-US")} matches found
        </span>
      </div>

      <div class="flex flex-row items-center w-full mt-5">
        <div class="flex w-full sm:w-[50%] md:block md:w-auto sm:ml-auto">
          <div
            class="hidden text-xs uppercase tracking-wide font-semibold md:block sm:mb-1 text-gray-500 dark:text-zinc-400"
          >
            Popular Screens
          </div>
          <div class="relative inline-block text-left grow">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="truncate"
                    >{selectedPopularStrategy?.length !== 0
                      ? selectedPopularStrategy
                      : "Select Popular"}</span
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
                  Popular Strategies
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                  {#each popularStrategyList as item}
                    <DropdownMenu.Item
                      on:click={() => popularStrategy(item?.key)}
                      class="cursor-pointer sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                    >
                      {item?.label}
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>

        <div class="flex w-full sm:w-[50%] sm:ml-3 md:block md:w-auto ml-3">
          <div
            class="hidden text-xs uppercase tracking-wide font-semibold md:block sm:mb-1 text-gray-500 dark:text-zinc-400"
          >
            Saved Screens
          </div>
          <div class="relative inline-block text-left grow">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="min-w-[110px] w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="truncate max-w-48"
                    >{selectedStrategy?.length !== 0
                      ? strategyList?.find(
                          (item) => item.id === selectedStrategy,
                        )?.title
                      : "Select Screen"}</span
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
                      <div class="text-sm text-start">New Screen</div>
                    </Button>
                  </DropdownMenu.Trigger>
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                  {#each strategyList as item}
                    <DropdownMenu.Item
                      on:click={() => {
                        switchStrategy(item);
                      }}
                      class=" {item?.id === selectedStrategy
                        ? 'text-violet-600 dark:text-violet-400'
                        : ''} cursor-pointer sm:hover:text-violet-800 dark:sm:hover:text-violet-400"
                    >
                      {item?.title?.length > 20
                        ? item?.title?.slice(0, 20) + "..."
                        : item?.title} ({item?.id === selectedStrategy
                        ? ruleOfList?.length
                        : item?.rules?.length})

                      <!-- svelte-ignore a11y-click-events-have-key-events -->
                      <label
                        for="deleteStrategy"
                        on:click|stopPropagation={() => {
                          deleteTargetId = item?.id;
                        }}
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
      <div class="items-end border-b border-gray-300 dark:border-zinc-700">
        <div
          class="mr-1 flex items-center justify-between lg:mr-2 pb-1.5 border-b border-gray-300 dark:border-zinc-700 mt-1.5"
        >
          <button
            on:click={() => (showFilters = !showFilters)}
            class="flex cursor-pointer items-center text-base font-semibold text-gray-900 dark:text-white"
            title="Hide Filter Area"
          >
            <svg
              class="-mb-0.5 h-5 w-5 {showFilters ? '' : '-rotate-90'} "
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
            {ruleOfList?.length} Filters
          </button>
        </div>
      </div>
      {#if showFilters}
        <div class="mt-3 flex flex-col gap-y-2.5 lg:flex-row lg:gap-y-2">
          <label
            for="ruleModal"
            class="text-sm order-2 lg:order-0 inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-2 pl-3 pr-4 font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus:outline-hidden"
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
            <div>Add Filters</div>
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
                placeholder={`Search ${allRows?.length} filters...`}
                bind:value={quickSearchTerm}
                on:input={handleQuickSearchInput}
                on:keydown={handleQuickSearchKeydown}
                on:focus={() => updateQuickSearchResults(quickSearchTerm)}
                on:blur={closeQuickSearchDropdown}
                class="block w-full lg:w-64 py-2.5 bg-white/80 dark:bg-zinc-950/60 placeholder:text-gray-800 dark:placeholder:text-zinc-300 pl-10 text-sm border border-gray-300 dark:border-zinc-700 rounded-full focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80"
              />

              <!-- Clear button -->
              {#if quickSearchTerm?.length > 0}
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
                    class="cursor-pointer w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
            {#if showQuickSearchDropdown && quickSearchResults?.length > 0}
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
                    class="cursor-pointer w-full px-2 py-2 flex flex-row items-center text-gray-700 dark:text-zinc-200 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 {index ===
                    selectedQuickSearchIndex
                      ? 'text-violet-600 dark:text-violet-400'
                      : ''}"
                    type="button"
                    on:click={() => selectQuickSearchRule(result)}
                  >
                    {#if onlySubscriberRules.includes(result?.rule) && !["Plus", "Pro"].includes(data?.user?.tier)}
                      <svg
                        class="w-4 h-4 text-icon inline-block ml-1 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        /></svg
                      >
                    {:else}
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
                    {/if}

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
                No available filters found
              </div>
            {/if}
          </div>

          {#if data?.user}
            <label
              for={!data?.user ? "userLogin" : ""}
              on:click={() => handleSave(true)}
              class="text-sm lg:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-2 pl-3 pr-4 font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus:outline-hidden"
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

              <div>Save</div>
            </label>

            {#if strategyList?.length > 0}
              <label
                for={!data?.user ? "userLogin" : ""}
                on:click={() => {
                  handleCreateStrategy();
                }}
                class="text-sm lg:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 py-2 pl-3 pr-4 font-semibold transition hover:text-violet-600 dark:hover:text-violet-400 focus:outline-hidden"
              >
                <Copy class="w-4 h-4 inline-block mr-2" />
                <div>Save as New</div>
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

              <div>Reset All</div>
            </label>
          {/if}
        </div>

        <div
          class="sm:grid sm:gap-x-2.5 md:grid-cols-2 lg:grid-cols-3 w-full mt-3 border-t border-b border-gray-300 dark:border-zinc-700"
        >
          {#each displayRules as row (row?.rule)}
            <!--Start Added Rules-->
            <div
              class="flex items-center justify-between space-x-2 px-1 py-1.5 text-xs sm:text-[0.95rem] leading-tight"
              in:scale={{
                start: 0.98,
                duration: 160,
                delay: 50,
                easing: cubicOut,
              }}
              out:fade={{ duration: 100 }}
            >
              <div class=" flex flex-row items-start sm:items-end">
                {row?.label?.length > 30
                  ? row?.label?.slice(0, 30)?.replace("[%]", "") + "..."
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
                  >{#if ruleOfList?.find((item) => item.name === row?.rule)?.value !== "any"}
                    <svg
                      class="w-6 h-6"
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
                  {:else}
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
                    </svg>{/if}
                </button>
                <div class="relative inline-block text-left">
                  <div on:click={() => (ruleName = row?.rule)}>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 h-[35px] flex flex-row justify-between items-center w-[140px] xs:w-[130px] sm:w-[140px] px-3 rounded-full truncate hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <span class="truncate ml-2 text-sm">
                            {#if row?.rule === "excludeTickers"}
                              {excludeTickerList.length === 0
                                ? "Any"
                                : excludeTickerList.join(",")}
                            {:else if row?.rule === "includeTickers"}
                              {includeTickerList.length === 0
                                ? "Any"
                                : includeTickerList.join(",")}
                            {:else if valueMappings[row?.rule] === "any"}
                              Any
                            {:else if ruleCondition[row?.rule] === "between"}
                              {Array.isArray(valueMappings[row?.rule])
                                ? `${valueMappings[row?.rule][0]}-${valueMappings[row?.rule][1] ?? "Any"}`
                                : "Any"}
                            {:else if row?.rule === "aumGroup"}
                              {Array.isArray(valueMappings[row?.rule])
                                ? valueMappings[row?.rule]
                                    ?.map((v) => v?.replace(/\s*\(.*?\)/, ""))
                                    ?.join(", ")
                                : String(valueMappings[row?.rule])?.replace(
                                    /\s*\(.*?\)/,
                                    "",
                                  )}
                            {:else}
                              {ruleCondition[row?.rule]
                                ?.replace("under", "Under")
                                ?.replace("over", "Over")
                                ?.replace("exactly", "Exactly") ?? ""}
                              {valueMappings[row?.rule]}
                            {/if}
                          </span>
                          <svg
                            class=" ml-1 h-5 w-5 xs:ml-2 inline-block"
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
                        class="h-fit max-h-72 overflow-hidden overflow-y-auto scroller rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1.5 text-gray-700 dark:text-zinc-200 shadow-none {row?.rule ===
                          'excludeTickers' || row?.rule === 'includeTickers'
                          ? 'w-64 max-w-64'
                          : 'w-fit'}"
                      >
                        {#if row?.rule === "excludeTickers"}
                          <DropdownMenu.Label
                            class="sticky -top-1 z-20 bg-white/95 dark:bg-zinc-950/95 pb-1.5"
                          >
                            <div class="relative">
                              <div
                                class="absolute inset-y-0 left-0 flex items-center pl-2.5"
                              >
                                <svg
                                  class="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500"
                                  fill="none"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2.5"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  ></path>
                                </svg>
                              </div>
                              <input
                                type="text"
                                bind:value={excludeTickerInput}
                                on:input={searchExcludeTicker}
                                on:keydown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    excludeTickerInput.trim()
                                  ) {
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
                        {:else if row?.rule === "includeTickers"}
                          <DropdownMenu.Label
                            class="sticky -top-1 z-20 bg-white/95 dark:bg-zinc-950/95 pb-1.5"
                          >
                            <div class="relative">
                              <div
                                class="absolute inset-y-0 left-0 flex items-center pl-2.5"
                              >
                                <svg
                                  class="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500"
                                  fill="none"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2.5"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                  ></path>
                                </svg>
                              </div>
                              <input
                                type="text"
                                bind:value={includeTickerInput}
                                on:input={searchIncludeTicker}
                                on:keydown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    includeTickerInput.trim()
                                  ) {
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
                        {:else if !checkedRules.includes(row?.rule)}
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
                                      <span class="truncate ml-2 text-sm">
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
                                    placeholder={"Min"}
                                    value={Array.isArray(
                                      valueMappings[row?.rule],
                                    )
                                      ? valueMappings[row?.rule]?.at(0)
                                      : ""}
                                    on:input={(e) =>
                                      handleValueInput(e, row?.rule, 0)}
                                    class="ios-zoom-fix block max-w-[3.5rem] rounded-full placeholder-gray-500 dark:placeholder:text-zinc-400 font-normal p-1 text-sm bg-white/80 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-700"
                                  />
                                  <span class=" text-[1rem] font-normal mt-1">
                                    &
                                  </span>
                                  <input
                                    type="text"
                                    placeholder={"Max"}
                                    value={Array.isArray(
                                      valueMappings[row?.rule],
                                    )
                                      ? valueMappings[row?.rule]?.at(1)
                                      : ""}
                                    on:input={(e) =>
                                      handleValueInput(e, row?.rule, 1)}
                                    class="ios-zoom-fix block max-w-[3.5rem] rounded-full placeholder-gray-500 dark:placeholder:text-zinc-400 font-normal p-1 text-sm bg-white/80 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-700"
                                  />
                                </div>
                              {:else}
                                <input
                                  type="text"
                                  placeholder={"Value"}
                                  value={valueMappings[row?.rule] !== "any"
                                    ? valueMappings[row?.rule]
                                    : ""}
                                  on:input={(e) =>
                                    handleValueInput(e, row?.rule)}
                                  class="ios-zoom-fix block max-w-[4.8rem] rounded-full placeholder-gray-500 dark:placeholder:text-zinc-400 font-normal p-1 text-sm bg-white/80 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-700"
                                />
                              {/if}

                              {#if ["over", "under", "exactly"].includes(ruleCondition[ruleName]?.toLowerCase())}
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
                          >
                            <input
                              bind:value={searchQuery}
                              on:input={handleInput}
                              autocomplete="off"
                              class="{![
                                'etfProvider',
                                'topSector',
                                'assetClass',
                                'country',
                              ].includes(row?.rule)
                                ? 'hidden'
                                : ''} text-sm p-2 absolute fixed sticky w-full border-0 bg-white/80 dark:bg-zinc-950/60 border-b border-gray-300 dark:border-zinc-700
                                      focus:outline-none placeholder:text-gray-800 dark:placeholder:text-zinc-300"
                              placeholder={"Search..."}
                            />
                          </div>
                        {/if}
                        <DropdownMenu.Group class="min-h-10 mt-2">
                          {#if row?.rule === "excludeTickers"}
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
                                    <span class="font-medium"
                                      >{result?.symbol}</span
                                    >
                                    <span
                                      class="ml-2 text-xs text-gray-400 dark:text-zinc-500 truncate"
                                      >{result?.name}</span
                                    >
                                  </div>
                                </DropdownMenu.Item>
                              {/each}
                            {:else if excludeTickerInput.trim().length > 0 && excludeTickerResults.length === 0}
                              <div
                                class="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500"
                              >
                                No results
                              </div>
                            {/if}
                            {#if excludeTickerList.length > 0}
                              {#if excludeTickerInput.trim().length > 0}
                                <div
                                  class="border-t border-gray-200 dark:border-zinc-700 my-1.5"
                                ></div>
                              {/if}
                              <div
                                class="px-2 py-1 text-[0.7rem] tracking-wide font-semibold text-gray-500 dark:text-zinc-400 uppercase"
                              >
                                Excluded Tickers
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
                                    <svg
                                      class="w-4 h-4 text-gray-400 dark:text-zinc-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12"
                                      /></svg
                                    >
                                  </div>
                                </DropdownMenu.Item>
                              {/each}
                            {:else if excludeTickerInput.trim().length === 0}
                              <div
                                class="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500"
                              >
                                Search and add tickers to exclude
                              </div>
                            {/if}
                          {:else if row?.rule === "includeTickers"}
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
                                    <span class="font-medium"
                                      >{result?.symbol}</span
                                    >
                                    <span
                                      class="ml-2 text-xs text-gray-400 dark:text-zinc-500 truncate"
                                      >{result?.name}</span
                                    >
                                  </div>
                                </DropdownMenu.Item>
                              {/each}
                            {:else if includeTickerInput.trim().length > 0 && includeTickerResults.length === 0}
                              <div
                                class="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500"
                              >
                                No results
                              </div>
                            {/if}
                            {#if includeTickerList.length > 0}
                              {#if includeTickerInput.trim().length > 0}
                                <div
                                  class="border-t border-gray-200 dark:border-zinc-700 my-1.5"
                                ></div>
                              {/if}
                              <div
                                class="px-2 py-1 text-[0.7rem] tracking-wide font-semibold text-gray-500 dark:text-zinc-400 uppercase"
                              >
                                Included Tickers
                              </div>
                              {#each includeTickerList as ticker}
                                <DropdownMenu.Item
                                  class="sm:hover:text-rose-700 dark:sm:hover:text-rose-400"
                                >
                                  <div
                                    class="flex items-center justify-between w-full px-2 py-0.5 text-sm cursor-pointer"
                                    on:click|capture={(event) => {
                                      event.preventDefault();
                                      removeIncludeTicker(ticker);
                                    }}
                                  >
                                    <span class="font-medium">{ticker}</span>
                                    <svg
                                      class="w-4 h-4 text-gray-400 dark:text-zinc-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12"
                                      /></svg
                                    >
                                  </div>
                                </DropdownMenu.Item>
                              {/each}
                            {:else if includeTickerInput.trim().length === 0}
                              <div
                                class="px-3 py-2 text-xs text-gray-400 dark:text-zinc-500"
                              >
                                Search and add tickers to include
                              </div>
                            {/if}
                          {:else if !checkedRules.includes(row?.rule)}
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
                                      class="cursor-pointer block w-full border-b border-gray-300 dark:border-zinc-700 px-4 py-1.5 text-left text-sm rounded last:border-0"
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
                                    class="cursor-pointer block w-full border-b border-gray-300 dark:border-zinc-700 px-4 py-1.5 text-left text-sm rounded last:border-0"
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
                          {:else if checkedRules.includes(row?.rule)}
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
                                      checked={isChecked(item, row?.rule)}
                                    />
                                    <span class="ml-2">{item}</span>
                                  </label>
                                </div>
                              </DropdownMenu.Item>
                            {/each}
                          {:else}
                            {#each testList.length > 0 && searchQuery?.length > 0 ? testList : searchQuery?.length > 0 && testList?.length === 0 ? [] : (allRules[row?.rule]?.step ?? []) as item}
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
                                      checked={isChecked(item, row?.rule)}
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
            <!--End Added Rules-->
          {/each}
        </div>
      {/if}
    </div>

    <!--End Adding Rules-->
  </div>
  <!--End Build Strategy-->

  <div
    class="mt-4 grid-cols-2 items-center lg:overflow-visible lg:px-1 py-1.5 mb-2"
  >
    <h2
      class=" whitespace-nowrap text-xl font-semibold py-1 bp:text-[1.3rem] border-t border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
    >
      {#if isDataLoading && totalItems === 0}
        <span
          class="inline-block h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
        ></span>
      {:else}
        {totalItems?.toLocaleString("en-US")} ETFs
      {/if}
    </h2>
    <div
      class="col-span-2 flex flex-col lg:flex-row items-center lg:order-2 lg:grow py-1.5 border-t border-b border-gray-300 dark:border-zinc-700"
    >
      <div
        class="w-full flex flex-row lg:flex order-1 items-center ml-auto border-b border-gray-300 dark:border-zinc-700 lg:border-none pb-2 sm:pt-0 lg:pb-0 w-full order-0 lg:order-1"
      >
        <div class="relative lg:ml-auto w-full lg:w-fit">
          <div
            class="inline-block cursor-pointer absolute right-2 top-2 text-sm"
          >
            {#if inputValue?.length > 0}
              <label class="cursor-pointer" on:click={() => resetTableSearch()}>
                <svg
                  class="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                  /></svg
                >
              </label>
            {/if}
          </div>

          <input
            bind:value={inputValue}
            on:input={search}
            type="text"
            placeholder={"Search ETFs..."}
            class="shadow-sm py-2 text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
          />
        </div>

        <div class=" ml-2">
          <ScreenerExport
            {data}
            {displayedData}
            fetchAllData={fetchAllFilteredData}
            screener="etf"
            title="etf_screener_data"
            creditCost={0}
            modalTitle="Export ETF screener data"
            itemLabel="ETFs"
            allowedTiers={["Pro", "Plus"]}
          />
        </div>

        <button
          on:click={toggleFullWidth}
          title={isFullWidth ? "Exit full width" : "Expand to full width"}
          class="ml-2 hidden 3xl:flex cursor-pointer w-fit transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-violet-600 dark:hover:text-violet-400 flex-row items-center px-3 py-2 rounded-full gap-2 {isFullWidth
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
            >{isFullWidth ? "Normal Width" : "Full Width"}</span
          >
        </button>

        {#if customColumnOrder?.length > 0}
          <button
            on:click={resetColumnOrder}
            title="Reset column order"
            class="ml-2 shrink-0 cursor-pointer p-2 rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
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
      <nav
        class="w-full flex flex-row items-center mt-2 sm:mt-0 order-2 lg:order-0"
      >
        <ul
          class="flex flex-row overflow-x-auto items-center space-x-2 whitespace-nowrap"
        >
          <li>
            <button
              on:click={() => (displayTableTab = "general")}
              class="cursor-pointer text-sm sm:text-[0.95rem] block rounded-full px-3 py-1 rounded-full border text-sm font-medium transition {displayTableTab ===
              'general'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              General
            </button>
          </li>
          <li>
            <button
              on:click={() => (displayTableTab = "filters")}
              class="cursor-pointer text-sm sm:text-[0.95rem] flex flex-row items-center block rounded-full px-3 py-1 border text-sm font-medium transition {displayTableTab ===
              'filters'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              <span>Filters</span>
              {#if ruleOfList?.length > 0}
                <div
                  class="ml-2 flex items-center justify-center h-4 w-4 bg-gray-200/70 dark:bg-zinc-800/80 border border-gray-300 shadow dark:border-zinc-700/80 text-gray-700 dark:text-zinc-200 rounded-full text-xs font-semibold"
                >
                  {ruleOfList?.length}
                </div>
              {/if}
            </button>
          </li>
          <li>
            <button
              on:click={() => changeTab("performance")}
              class="cursor-pointer text-sm sm:text-[0.95rem] block rounded-full px-3 py-1 border text-sm font-medium transition {displayTableTab ===
              'performance'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Performance
            </button>
          </li>
          <li>
            <button
              on:click={() => changeTab("technicals")}
              class="cursor-pointer text-sm sm:text-[0.95rem] block rounded-full px-3 py-1 border text-sm font-medium transition {displayTableTab ===
              'technicals'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Technicals
            </button>
          </li>
          <li>
            <button
              on:click={() => changeTab("dividends")}
              class="cursor-pointer text-sm sm:text-[0.95rem] block rounded-full px-3 py-1 border text-sm font-medium transition {displayTableTab ===
              'dividends'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              Dividends
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>

  <!--Start Matching Preview-->
  {#if isLoaded}
    {#if totalItems !== 0 || isDataLoading}
      {#if displayTableTab === "general"}
        <div
          class="w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
        >
          <table
            class="table table-sm table-compact w-full m-auto text-sm sm:text-[0.95rem] text-gray-700 dark:text-zinc-200 tabular-nums"
          >
            <thead>
              <TableHeader
                {columns}
                {sortOrders}
                {sortData}
                onColumnReorder={handleColumnReorder}
              />
            </thead>
            <tbody>
              {#if isDataLoading && displayedData?.length === 0}
                {#each Array(10) as _}
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                  >
                    {#each columns as column}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] {column.align ===
                        'left'
                          ? 'text-start'
                          : 'text-end'}"
                      >
                        <span
                          class="inline-block h-4 {column.key === 'name'
                            ? 'w-24'
                            : column.key === 'symbol'
                              ? 'w-12'
                              : 'w-14'} animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                        ></span>
                      </td>
                    {/each}
                  </tr>
                {/each}
              {/if}
              {#each displayedData as item}
                <tr
                  class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                >
                  {#each columns as column}
                    {#if column.key === "symbol"}
                      <td class=" whitespace-nowrap">
                        <a
                          href={"/etf/" + item?.symbol}
                          class="text-violet-800 dark:text-violet-400 sm:hover:text-muted dark:sm:hover:text-white text-sm sm:text-[0.95rem]"
                          >{item?.symbol}</a
                        >
                      </td>
                    {:else if column.key === "name"}
                      <td class="whitespace-nowrap text-sm sm:text-[0.95rem]">
                        {item?.name?.length > charNumber
                          ? item?.name?.slice(0, charNumber) + "..."
                          : item?.name}
                      </td>
                    {:else if column.key === "totalAssets"}
                      <td class=" text-sm sm:text-[0.95rem] text-end">
                        {item?.totalAssets < 100
                          ? "< 100"
                          : abbreviateNumber(item?.totalAssets)}
                      </td>
                    {:else if column.key === "price"}
                      <td class=" text-sm sm:text-[0.95rem] text-end">
                        {item?.price < 0.01
                          ? "< 0.01"
                          : item?.price?.toFixed(2)}
                      </td>
                    {:else if column.key === "changesPercentage"}
                      <td class=" text-end text-sm sm:text-[0.95rem]">
                        {#if item?.changesPercentage >= 0}
                          <span class="text-emerald-800 dark:text-emerald-400"
                            >+{item?.changesPercentage >= 1000
                              ? abbreviateNumber(item?.changesPercentage)
                              : item?.changesPercentage?.toFixed(2)}%</span
                          >
                        {:else}
                          <span class="text-rose-800 dark:text-rose-400"
                            >{item?.changesPercentage <= -1000
                              ? abbreviateNumber(item?.changesPercentage)
                              : item?.changesPercentage?.toFixed(2)}%
                          </span>
                        {/if}
                      </td>
                    {:else if column.key === "expenseRatio"}
                      <td class=" text-sm sm:text-[0.95rem] text-end">
                        {#if item?.expenseRatio != null}
                          {item?.expenseRatio?.toFixed(2)}%
                        {:else}
                          n/a
                        {/if}
                      </td>
                    {:else if column.key === "numberOfHoldings"}
                      <td class=" text-sm sm:text-[0.95rem] text-end">
                        {#if item?.numberOfHoldings != null}
                          {item?.numberOfHoldings?.toLocaleString("en-US")}
                        {:else}
                          n/a
                        {/if}
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if displayTableTab === "filters"}
        <div
          class="w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
        >
          <table
            class="table table-sm table-compact w-full m-auto text-sm sm:text-[0.95rem] text-gray-700 dark:text-zinc-200 tabular-nums"
          >
            <thead>
              <TableHeader
                {columns}
                {sortOrders}
                {sortData}
                onColumnReorder={handleColumnReorder}
              />
            </thead>
            <tbody>
              {#if isDataLoading && displayedData?.length === 0}
                {#each Array(10) as _}
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                  >
                    {#each columns as column}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] {column.align ===
                        'left'
                          ? 'text-start'
                          : 'text-end'}"
                      >
                        <span
                          class="inline-block h-4 {column.key === 'name'
                            ? 'w-24'
                            : column.key === 'symbol'
                              ? 'w-12'
                              : 'w-14'} animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                        ></span>
                      </td>
                    {/each}
                  </tr>
                {/each}
              {/if}
              {#each displayedData as item (item?.symbol)}
                <tr
                  class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                >
                  {#each columns as column}
                    {#if column.key === "symbol"}
                      <td class=" whitespace-nowrap">
                        <a
                          href={"/etf/" + item?.symbol}
                          class="text-violet-800 dark:text-violet-400 sm:hover:text-muted dark:sm:hover:text-white text-sm sm:text-[0.95rem]"
                          >{item?.symbol}</a
                        >
                      </td>
                    {:else if column.key === "name"}
                      <td class=" whitespace-nowrap text-sm sm:text-[0.95rem]">
                        {item?.name?.length > charNumber
                          ? item?.name?.slice(0, charNumber) + "..."
                          : item?.name}
                      </td>
                    {:else if column.key === "totalAssets"}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] text-end"
                      >
                        {abbreviateNumber(item?.totalAssets)}
                      </td>
                    {:else}
                      {@const row = displayRules?.find(
                        (r) => r.rule === column.key,
                      )}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] text-end"
                      >
                        {#if ["etfProvider", "assetClass", "topSector", "exchange", "aumGroup", "payoutFrequency", "country"].includes(column.key)}
                          {#if item[column.key]}
                            {item[column.key]}
                          {:else if !(column.key in item)}
                            <span
                              class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                            ></span>
                          {:else}
                            n/a
                          {/if}
                        {:else if row?.varType && row?.varType === "date"}
                          {#if item[column.key]}
                            {new Date(item[column.key]).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                timeZone: "UTC",
                              },
                            )}
                          {:else if !(column.key in item)}
                            <span
                              class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                            ></span>
                          {:else}
                            n/a
                          {/if}
                        {:else if row?.varType && row?.varType === "percentSign"}
                          {#if column.key in item}
                            <span
                              class={item[column.key] >= 0
                                ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                                : "text-rose-800 dark:text-rose-400"}
                            >
                              {abbreviateNumber(item[column.key])}%
                            </span>
                          {:else}
                            <span
                              class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                            ></span>
                          {/if}
                        {:else if row?.varType && row?.varType === "percent"}
                          {#if column.key in item}
                            {abbreviateNumber(item[column.key])}%
                          {:else}
                            <span
                              class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                            ></span>
                          {/if}
                        {:else if column.key in item}
                          {abbreviateNumber(item[column.key])}
                        {:else}
                          <span
                            class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                          ></span>
                        {/if}
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if displayTableTab === "performance"}
        <div
          class="w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
        >
          <table
            class="table table-sm table-compact w-full m-auto text-sm sm:text-[0.95rem] text-gray-700 dark:text-zinc-200 tabular-nums"
          >
            <thead>
              <TableHeader
                {columns}
                {sortOrders}
                {sortData}
                onColumnReorder={handleColumnReorder}
              />
            </thead>
            <tbody>
              {#if isDataLoading && displayedData?.length === 0}
                {#each Array(10) as _}
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                  >
                    {#each columns as column}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] {column.align ===
                        'left'
                          ? 'text-start'
                          : 'text-end'}"
                      >
                        <span
                          class="inline-block h-4 {column.key === 'name'
                            ? 'w-24'
                            : column.key === 'symbol'
                              ? 'w-12'
                              : 'w-14'} animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                        ></span>
                      </td>
                    {/each}
                  </tr>
                {/each}
              {/if}
              {#each displayedData as item (item?.symbol)}
                <tr
                  class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                >
                  {#each columns as column}
                    {#if column.key === "symbol"}
                      <td class=" whitespace-nowrap">
                        <a
                          href={"/etf/" + item?.symbol}
                          class="text-violet-800 dark:text-violet-400 sm:hover:text-muted dark:sm:hover:text-white text-sm sm:text-[0.95rem]"
                          >{item?.symbol}</a
                        >
                      </td>
                    {:else if column.key === "name"}
                      <td class="whitespace-nowrap text-sm sm:text-[0.95rem]">
                        {item?.name?.length > charNumber
                          ? item?.name?.slice(0, charNumber) + "..."
                          : item?.name}
                      </td>
                    {:else if column.key === "totalAssets"}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] text-end"
                      >
                        {abbreviateNumber(item?.totalAssets)}
                      </td>
                    {:else}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] text-end"
                      >
                        {#if item[column.key] > 0}
                          <span class="text-emerald-800 dark:text-emerald-400"
                            >+{abbreviateNumber(
                              item[column.key]?.toFixed(2),
                            )}%</span
                          >
                        {:else if item[column.key] < 0}
                          <span class="text-rose-800 dark:text-rose-400"
                            >{abbreviateNumber(
                              item[column.key]?.toFixed(2),
                            )}%</span
                          >
                        {:else if !(column.key in item)}
                          <span
                            class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                          ></span>
                        {:else}
                          <span class="">n/a</span>
                        {/if}
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if ["technicals", "dividends"].includes(displayTableTab)}
        <div
          class="w-full rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 overflow-x-auto"
        >
          <table
            class="table table-sm table-compact w-full m-auto text-sm sm:text-[0.95rem] text-gray-700 dark:text-zinc-200 tabular-nums"
          >
            <thead>
              <TableHeader
                {columns}
                {sortOrders}
                {sortData}
                onColumnReorder={handleColumnReorder}
              />
            </thead>
            <tbody>
              {#if isDataLoading && displayedData?.length === 0}
                {#each Array(10) as _}
                  <tr
                    class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                  >
                    {#each columns as column}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] {column.align ===
                        'left'
                          ? 'text-start'
                          : 'text-end'}"
                      >
                        <span
                          class="inline-block h-4 {column.key === 'name'
                            ? 'w-24'
                            : column.key === 'symbol'
                              ? 'w-12'
                              : 'w-14'} animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                        ></span>
                      </td>
                    {/each}
                  </tr>
                {/each}
              {/if}
              {#each displayedData as item (item?.symbol)}
                <tr
                  class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                >
                  {#each columns as column}
                    {#if column.key === "symbol"}
                      <td class=" whitespace-nowrap">
                        <a
                          href={"/etf/" + item?.symbol}
                          class="text-violet-800 dark:text-violet-400 sm:hover:text-muted dark:sm:hover:text-white text-sm sm:text-[0.95rem]"
                          >{item?.symbol}</a
                        >
                      </td>
                    {:else if column.key === "name"}
                      <td class="whitespace-nowrap text-sm sm:text-[0.95rem]">
                        {item?.name?.length > charNumber
                          ? item?.name?.slice(0, charNumber) + "..."
                          : item?.name}
                      </td>
                    {:else if column.key === "totalAssets"}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] text-end"
                      >
                        {abbreviateNumber(item?.totalAssets)}
                      </td>
                    {:else}
                      {@const row = tabRuleList?.find(
                        (r) => r.rule === column.key,
                      )}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[0.95rem] text-end"
                      >
                        {#if row?.varType && row?.varType === "percent"}
                          {#if item[column.key]}
                            {abbreviateNumber(item[column.key]) + "%"}
                          {:else if !(column.key in item)}
                            <span
                              class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                            ></span>
                          {:else}
                            n/a
                          {/if}
                        {:else if item[column.key]}
                          {abbreviateNumber(item[column.key])}
                        {:else if !(column.key in item)}
                          <span
                            class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                          ></span>
                        {:else}
                          n/a
                        {/if}
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- Pagination controls -->
      {#if totalItems > 0}
        <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
          <!-- Previous and Next buttons -->
          <div class="flex items-center gap-2">
            <Button
              on:click={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
              <span class="hidden sm:inline">Previous</span></Button
            >
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
                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="truncate text-[0.85rem] sm:text-sm"
                    >{rowsPerPage} rows</span
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
                class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
              >
                <!-- Dropdown items -->
                <DropdownMenu.Group class="pb-2">
                  {#each rowsPerPageOptions as item}
                    <DropdownMenu.Item
                      class="sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                    >
                      <label
                        on:click={() => changeRowsPerPage(item)}
                        class="inline-flex justify-between w-full items-center cursor-pointer"
                      >
                        <span class="text-sm">{item} rows</span>
                      </label>
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <!-- Next button and Back to Top -->
          <div class="flex items-center gap-2">
            <Button
              on:click={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div class="flex justify-center mt-4">
          <button
            on:click={scrollToTop}
            class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
          >
            Back to top
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
    {:else}
      <Infobox
        text={inputValue?.length > 0
          ? `No ETFs found for "${inputValue}"`
          : "No ETFs found"}
      />
    {/if}
  {:else}
    <div class="flex justify-center items-center h-80">
      <div class="relative">
        <label
          class=" bg-gray-900/80 dark:bg-zinc-900/70 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <span
            class="loading loading-spinner loading-md text-white dark:text-white"
          ></span>
        </label>
      </div>
    </div>
  {/if}

  <!--End Matching Preview-->
</section>

<!--
  <div class="tabs w-screen mb-5 ">
    <label on:click={() => handleRuleTab('all')} class="tab mr-2   transition duration-150 ease-out hover:ease-out rounded hover:bg-[#333333] {displayTab === 'all' ? 'bg-[#333333]' : ''}">
      All
    </label> 
    <label on:click={() => handleRuleTab('ta')} class="tab mr-2   transition duration-150 ease-out hover:ease-out rounded hover:bg-[#333333] {displayTab === 'ta' ? 'bg-[#333333]' : ''}">
      Technical Indicators
    </label> 
    <label on:click={() => handleRuleTab('fund')} class="tab mr-2   transition duration-150 ease-out hover:ease-out rounded hover:bg-[#333333] {displayTab === 'fund' ? 'bg-[#333333]' : ''}">
      Fundamental Data
    </label> 
  </div>
-->

<!--Start Choose Rule Modal-->
<input type="checkbox" id="ruleModal" class="modal-toggle" />
<dialog id="ruleModal" class="modal p-2 lg:p-0">
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
          <h2
            class=" text-[1rem] sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            Select Filters ({allRows?.length})
          </h2>
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
          <label for="search" class="sr-only">Search</label>
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
              class="focus:outline-none placeholder-gray-500 dark:placeholder:text-zinc-400 block w-full p-2 ps-10 text-sm border border-gray-300 dark:border-zinc-700 rounded-full bg-white/80 dark:bg-zinc-950/60"
              placeholder={"Search..."}
              bind:value={searchTerm}
            />
          </div>
        </form>
        <!-- End Search bar -->
      </div>

      <!-- Content -->
      <div class="">
        {#each searchTerm?.length !== 0 ? Object.entries(filteredGroupedRules) : Object.entries(groupedRules) as [category, rules]}
          <h4
            class="mb-1 font-semibold text-lg mt-5 text-gray-900 dark:text-white"
          >
            {category}
          </h4>
          <div class="flex flex-wrap">
            {#each rules as row}
              <div
                class="flex w-full items-center space-x-1.5 py-1.5 md:w-1/2 lg:w-1/3 lg:py-1"
              >
                {#if onlySubscriberRules.includes(row?.rule) && !["Pro", "Plus"].includes(data?.user?.tier)}
                  <label
                    id={row?.rule}
                    on:click={() => changeRule(row?.rule)}
                    class="flex flex-row items-center"
                  >
                    <svg
                      class="w-4 h-4 mr-1 inline-block cursor-pointer"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      ><path
                        fill="currentColor"
                        d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                      /></svg
                    >

                    <div class="">
                      <label for={row?.rule} class="cursor-pointer text-[1rem]"
                        >{row?.label}</label
                      >
                    </div>
                  </label>
                {:else}
                  <input
                    on:click={() => changeRule(row?.rule)}
                    id={row?.rule}
                    type="checkbox"
                    checked={ruleOfList?.find(
                      (rule) => rule?.name === row?.rule,
                    )}
                    class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 lg:h-4 lg:w-4"
                  />
                  <div class="-mt-0.5">
                    <label for={row?.rule} class="cursor-pointer text-[1rem]"
                      >{row?.label}</label
                    >
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
        {#if searchTerm?.length > 0 && Object.entries(filteredGroupedRules)?.length === 0}
          <div class=" mt-5 font-semibold text-[1rem] sm:text-lg">
            Nothing found
          </div>
        {/if}
      </div>
    </div>
  </div>
</dialog>

<!--End Choose Rule Modal-->

<!--Start Add Strategy Modal-->
<input type="checkbox" id="addStrategy" class="modal-toggle" />

<dialog id="addStrategy" class="modal modal-bottom sm:modal-middle">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <label
    for="addStrategy"
    on:click={() => {
      removeList = false;
    }}
    class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <label
      for="addStrategy"
      on:click={() => {
        removeList = false;
      }}
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
      New Screen
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
        label={"Screen Name"}
        required={true}
      />

      <button
        type="submit"
        class="cursor-pointer mt-2 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 duration-100 w-full rounded-full m-auto font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200"
      >
        Create
      </button>
    </form>
  </div>
</dialog>

<!--End Add Strategy Modal-->

<!--Start Delete Strategy Modal-->
<input type="checkbox" id="deleteStrategy" class="modal-toggle" />

<dialog id="deleteStrategy" class="modal modal-bottom sm:modal-middle">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <label
    for="deleteStrategy"
    on:click={() => {
      deleteTargetId = "";
    }}
    class="cursor-pointer modal-backdrop"
  ></label>

  <div
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <label
      for="deleteStrategy"
      on:click={() => {
        deleteTargetId = "";
      }}
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
      Delete Screen
    </h3>
    <p class="text-sm mb-6 text-gray-800 dark:text-zinc-300">
      Are you sure you want to delete this screen?
    </p>
    <div class="flex justify-end space-x-3">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <label
        for="deleteStrategy"
        on:click={() => {
          deleteTargetId = "";
        }}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium
            transition-colors duration-100 border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400"
        tabindex="0">Cancel</label
      ><label
        for="deleteStrategy"
        on:click={handleDeleteStrategy}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium
            transition-colors duration-100 flex items-center border border-rose-200/70 dark:border-rose-500/30
            bg-rose-50/80 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300
            "
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
        Delete</label
      >
    </div>
  </div>
</dialog>

<!--End Delete Strategy Modal-->

<input type="checkbox" id="mobileTooltip" class="modal-toggle" />

<dialog id="mobileTooltip" class="modal p-3">
  <label for="mobileTooltip" class="cursor-pointer modal-backdrop"></label>

  <!-- Desktop modal content -->
  <div
    class="modal-box w-full flex flex-col items-center relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="mobileTooltip"
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
    <div class=" mb-5 text-center">
      <h3 class="font-semibold text-2xl mb-5 text-gray-900 dark:text-white">
        {tooltipTitle}
      </h3>
      <span class=" text-[1rem] font-normal text-gray-800 dark:text-zinc-300"
        >{infoText?.text ?? "n/a"}</span
      >
      {#if infoText?.equation !== undefined}
        <div class="w-5/6 m-auto mt-5"></div>
        <div
          class="text-[1rem] w-full pt-3 pb-3 m-auto text-gray-800 dark:text-zinc-300"
        >
          {infoText?.equation}
        </div>
      {/if}
    </div>

    <div class="border-t border-gray-300 dark:border-zinc-700 mt-2 w-full">
      <label
        for="mobileTooltip"
        class="cursor-pointer mt-4 font-semibold text-xl m-auto flex justify-center text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
      >
        Close
      </label>
    </div>
  </div>
</dialog>

<!--Start Login Modal-->
{#if LoginPopup}
  <LoginPopup {form} />
{/if}

<!--End Login Modal-->

<style>
  .scroller {
    scrollbar-width: thin;
  }

  .scrollbar {
    display: grid;
    grid-gap: 90px;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin; /* Hide the default scrollbar in Firefox */
    scrollbar-color: transparent transparent; /* Hide the default scrollbar in Firefox */
  }

  /* Custom scrollbar for Webkit (Chrome, Safari) */
  .scrollbar::-webkit-scrollbar {
    width: 0; /* Hide the width of the scrollbar */
    height: 0; /* Hide the height of the scrollbar */
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent; /* Make the thumb transparent */
  }
</style>
