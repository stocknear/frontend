<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { clearCache } from "$lib/store";
  import Copy from "lucide-svelte/icons/copy";
  import ChartNoAxesCombined from "lucide-svelte/icons/chart-no-axes-combined";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { scale, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  import { abbreviateNumber, groupScreenerRules } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import ScreenerExport from "$lib/components/ScreenerExport.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import Input from "$lib/components/Input.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import ChartModal from "$lib/components/CoveredCall/ChartModal.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";

  import {
    covered_call_screener_breadcrumb_home,
    covered_call_screener_breadcrumb_title,
    covered_call_screener_seo_title,
    covered_call_screener_seo_description,
    covered_call_screener_seo_keywords,
    covered_call_screener_structured_name,
    covered_call_screener_structured_description,
    covered_call_screener_main_title,
    covered_call_screener_contracts_count,
    covered_call_screener_popular_screens,
    covered_call_screener_popular_strategies,
    covered_call_screener_select_popular,
    covered_call_screener_saved_screens,
    covered_call_screener_select_screen,
    covered_call_screener_new_screen,
    covered_call_screener_strategy_high_yield,
    covered_call_screener_strategy_conservative,
    covered_call_screener_strategy_weekly_income,
    covered_call_screener_strategy_high_protection,
    covered_call_screener_strategy_bluechip_cc,
    covered_call_screener_filters_count,
    covered_call_screener_add_filters,
    covered_call_screener_search_filters,
    covered_call_screener_select_filters_title,
    covered_call_screener_nothing_found,
    covered_call_screener_save,
    covered_call_screener_save_as_new,
    covered_call_screener_reset_all,
    covered_call_screener_condition_over,
    covered_call_screener_condition_under,
    covered_call_screener_condition_between,
    covered_call_screener_condition_exactly,
    covered_call_screener_condition_any,
    covered_call_screener_input_min,
    covered_call_screener_input_max,
    covered_call_screener_input_value,
    covered_call_screener_search_placeholder,
    covered_call_screener_search_modal_placeholder,
    covered_call_screener_normal_width,
    covered_call_screener_full_width,
    covered_call_screener_tab_general,
    covered_call_screener_tab_income,
    covered_call_screener_tab_filters,
    covered_call_screener_tab_greeks,
    covered_call_screener_pagination_previous,
    covered_call_screener_pagination_next,
    covered_call_screener_pagination_page_of,
    covered_call_screener_rows_label,
    covered_call_screener_back_to_top,
    covered_call_screener_no_results_query,
    covered_call_screener_no_contracts,
    covered_call_screener_modal_new_title,
    covered_call_screener_modal_new_name_label,
    covered_call_screener_modal_new_create,
    covered_call_screener_modal_delete_title,
    covered_call_screener_modal_delete_message,
    covered_call_screener_modal_delete_cancel,
    covered_call_screener_modal_delete_confirm,
    covered_call_screener_toast_deleting,
    covered_call_screener_toast_deleted,
    covered_call_screener_toast_delete_failed,
    covered_call_screener_toast_title_too_long,
    covered_call_screener_toast_created,
    covered_call_screener_toast_creating,
    covered_call_screener_toast_create_failed,
    covered_call_screener_toast_select_rule,
    covered_call_screener_toast_saving,
    covered_call_screener_toast_saved,
    covered_call_screener_toast_save_failed,
  } from "$lib/paraglide/messages";

  export let data;
  export let form;

  let showFilters = true;
  let isLoaded = false;
  let isFullWidth = false;
  let isDataLoading = false;
  let removeList = false;
  let deleteTargetId = "";

  let displayedData = data?.getScreenerFeed?.items ?? [];
  let totalItems = data?.getScreenerFeed?.total ?? 0;
  let totalContracts = data?.getScreenerFeed?.totalContracts ?? 0;
  let currentPage = data?.getScreenerFeed?.page ?? 1;
  let rowsPerPage = data?.getScreenerFeed?.pageSize ?? 20;
  let totalPages = data?.getScreenerFeed?.totalPages ?? 1;
  let activeSortKey = data?.getScreenerFeed?.sort?.key ?? "annualizedReturn";
  let activeSortOrder = data?.getScreenerFeed?.sort?.order ?? "desc";
  let isFetchingPage = false;
  let currentAbortController: AbortController | null = null;
  let requestId = 0;

  let isChartModalOpen = false;
  let isChartLoading = false;
  let modalItem: any = null;

  let chartDataCache = new Map<string, any>();

  let strategyList = data?.getAllStrategies || [];
  let selectedStrategy = strategyList?.at(0)?.id ?? "";
  let ruleOfList = strategyList?.at(0)?.rules ?? [];
  let groupedRules = {};
  let displayRules = [];
  let inputValue = "";

  const checkedRules = [
    "assetType",
    "marketCapGroup",
    "earningsTime",
    "earningsDate",
    "payoutFrequency",
    "exDividendDate",
  ];

  let selectedPopularStrategy = "";
  const popularStrategyList = [
    { key: "highYield", label: covered_call_screener_strategy_high_yield() },
    {
      key: "conservative",
      label: covered_call_screener_strategy_conservative(),
    },
    {
      key: "weeklyIncome",
      label: covered_call_screener_strategy_weekly_income(),
    },
    {
      key: "highProtection",
      label: covered_call_screener_strategy_high_protection(),
    },
    { key: "bluechipCC", label: covered_call_screener_strategy_bluechip_cc() },
  ];

  function conditionLabel(condition) {
    switch (condition) {
      case "over":
        return covered_call_screener_condition_over();
      case "under":
        return covered_call_screener_condition_under();
      case "between":
        return covered_call_screener_condition_between();
      case "exactly":
        return covered_call_screener_condition_exactly();
      default:
        return condition ?? "";
    }
  }

  let displayTableTab = "general";

  // Define all possible rules and their properties
  const allRules = {
    annualizedReturn: {
      label: "Annualized Return",
      step: ["100%", "50%", "30%", "20%", "10%", "5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Statistics",
    },
    ifCalledReturn: {
      label: "If Called Return",
      step: ["20%", "15%", "10%", "5%", "3%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Statistics",
    },
    ifCalledAnnualized: {
      label: "If Called Annualized",
      step: ["100%", "50%", "30%", "20%", "10%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Statistics",
    },
    downsideProtection: {
      label: "Downside Protection",
      step: ["10%", "5%", "3%", "2%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Statistics",
    },
    moneynessPercent: {
      label: "% Moneyness",
      step: ["20%", "10%", "5%", "0%", "-2%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Options Activity",
    },
    dte: {
      label: "Days to Expiration",
      step: ["90", "60", "45", "30", "14", "7"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "decimal",
      category: "Options Activity",
    },
    stockPrice: {
      label: "Stock Price",
      step: ["500", "200", "100", "50", "20", "10"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Company Info",
    },
    strike: {
      label: "Strike",
      step: ["500", "200", "100", "50", "20"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
    assetType: {
      label: "Asset Type",
      step: ["Stock", "ETF"],
      defaultCondition: "",
      defaultValue: "any",
      category: "Company Info",
    },
    marketCap: {
      label: "Market Cap",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Company Info",
    },
    marketCapGroup: {
      label: "Market Cap Group",
      step: [
        "Mega-Cap (200B+)",
        "Large-Cap (10-200B)",
        "Mid-Cap (2-10B)",
        "Small-Cap (300M-2B)",
        "Micro-Cap (Under 300M)",
        "Nano-Cap (Under 50M)",
      ],
      defaultCondition: "",
      defaultValue: "any",
      category: "Company Info",
    },
    iv: {
      label: "Implied Volatility",
      step: ["100%", "80%", "50%", "30%", "10%"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
      varType: "percent",
    },
    ivRank: {
      label: "IV Rank",
      step: ["90%", "80%", "50%", "30%", "10%"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
      varType: "percent",
    },
    volume: {
      label: "Volume",
      step: ["50K", "20K", "10K", "5K", "1K"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
      varType: "decimal",
    },
    oi: {
      label: "Open Interest",
      step: ["100K", "50K", "30K", "10K", "5K", "1K"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
      varType: "decimal",
    },
    delta: {
      label: "Delta",
      step: ["0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Greeks",
      varType: "decimal",
    },
    gamma: {
      label: "Gamma",
      step: ["0.1", "0.05", "0.03", "0.02", "0.01", "0.005"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Greeks",
      varType: "decimal",
    },
    theta: {
      label: "Theta",
      step: ["-0.01", "-0.02", "-0.05", "-0.1", "-0.2", "-0.5"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Greeks",
      varType: "decimal",
    },
    vega: {
      label: "Vega",
      step: ["0.5", "0.3", "0.2", "0.1", "0.05", "0.01"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Greeks",
      varType: "decimal",
    },
    breakeven: {
      label: "BE Bid",
      step: ["500", "200", "100", "50", "20", "10"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
    pctBeBid: {
      label: "% BE",
      step: ["-1%", "-2%", "-3%", "-5%", "-10%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Options Activity",
    },
    returnVal: {
      label: "Return",
      step: ["20%", "10%", "5%", "3%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Statistics",
    },
    ptnlRtn: {
      label: "Potential Return",
      step: ["20%", "15%", "10%", "5%", "3%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Statistics",
    },
    profitProb: {
      label: "Profit Prob",
      step: ["90%", "80%", "70%", "60%", "50%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Statistics",
    },
    debit: {
      label: "Debit (Cost)",
      step: ["50K", "30K", "20K", "10K", "5K", "3K", "1K"],
      defaultCondition: "under",
      defaultValue: "any",
      varType: "dollar",
      category: "Statistics",
    },
    earningsTime: {
      label: "Earnings Time",
      step: ["Before Market Open", "After Market Close"],
      defaultCondition: "",
      defaultValue: "any",
      category: "Earnings Report",
    },
    earningsDate: {
      label: "Earnings Date",
      step: [
        "Today",
        "Tomorrow",
        "Next 7D",
        "Next 30D",
        "This Month",
        "Next Month",
      ],
      defaultCondition: "",
      defaultValue: "any",
      varType: "date",
      category: "Earnings Report",
    },
    earningsRevenueEst: {
      label: "Earnings Revenue Estimate",
      step: ["100B", "50B", "10B", "1B", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Earnings Report",
    },
    earningsEPSEst: {
      label: "Earnings EPS Estimate",
      step: ["10", "5", "3", "2", "1", "0"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Earnings Report",
    },
    earningsRevenueGrowthEst: {
      label: "Revenue Estimated Growth",
      step: ["100%", "50%", "20%", "10%", "5%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Earnings Report",
    },
    earningsEPSGrowthEst: {
      label: "EPS Estimated Growth",
      step: ["100%", "50%", "20%", "10%", "5%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Earnings Report",
    },
    earningsGap: {
      label: "Earnings Gap (Days)",
      step: [60, 30, 14, 7, 3, 0, -7, -14, -30],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Earnings Report",
    },
    payoutRatio: {
      label: "Payout Ratio",
      step: ["100%", "80%", "60%", "40%", "20%", "0%", "-20%", "-40%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Dividends",
    },
    dividendYield: {
      label: "Dividend Yield",
      step: ["50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Dividends",
    },
    payoutFrequency: {
      label: "Dividend Payout Frequency",
      step: ["Monthly", "Quarterly", "Semi-Annual", "Annual"],
      defaultCondition: "",
      defaultValue: "any",
      category: "Dividends",
    },
    annualDividend: {
      label: "Annual Dividend",
      step: [10, 5, 3, 2, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Dividends",
    },
    dividendGrowth: {
      label: "Dividend Growth",
      step: ["50%", "20%", "10%", "5%", "3%", "2%", "1%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Dividends",
    },
    exDividendDate: {
      label: "Ex-Dividend Date",
      step: [
        "Today",
        "Tomorrow",
        "Next 7D",
        "Next 30D",
        "This Month",
        "Next Month",
      ],
      defaultCondition: "",
      defaultValue: "any",
      varType: "date",
      category: "Dividends",
    },
    excludeTickers: {
      label: "Exclude Tickers",
      step: [],
      defaultCondition: "",
      defaultValue: "any",
      category: "Stock Data",
    },
    includeTickers: {
      label: "Include Tickers",
      step: [],
      defaultCondition: "",
      defaultValue: "any",
      category: "Stock Data",
    },
  };

  let rowsPerPageOptions = [20, 50, 100];

  // Generate allRows from allRules
  $: allRows = Object?.entries(allRules)
    ?.sort(([, a], [, b]) => a?.label.localeCompare(b.label))
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

  // Quick Search state variables
  let quickSearchTerm = "";
  let quickSearchResults = [];
  let showQuickSearchDropdown = false;
  let selectedQuickSearchIndex = -1;

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

  const formatDate = (dateString: string): string => {
    if (!dateString) return "n/a";
    const date = new Date(dateString + "T00:00:00Z");
    if (isNaN(date.getTime())) return "n/a";
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const yy = String(date.getUTCFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  async function openChartModal(item) {
    // If item already has chart fields (e.g. income tab), use directly
    if (item.bid != null && item.breakeven != null) {
      modalItem = item;
      isChartLoading = false;
      isChartModalOpen = true;
      return;
    }

    // Check cache
    const key = item.optionSymbol;
    if (chartDataCache.has(key)) {
      modalItem = { ...item, ...chartDataCache.get(key) };
      isChartLoading = false;
      isChartModalOpen = true;
      return;
    }

    // Show modal immediately with loading state
    modalItem = item;
    isChartLoading = true;
    isChartModalOpen = true;

    // Fetch contract's chart fields from the feed API
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "1",
        tab: "income",
        optionContracts: item.optionSymbol,
      });
      const response = await fetch(`/api/covered-call-screener-feed?${params}`);
      const output = await response.json();
      const contract = output?.items?.[0];
      if (contract) {
        chartDataCache.set(key, contract);
        modalItem = { ...item, ...contract };
      }
    } catch {
      // Keep modal with available data
    } finally {
      isChartLoading = false;
    }
  }

  function closeChartModal() {
    isChartModalOpen = false;
    modalItem = null;
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
        type: "coveredCallScreener",
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

      // If we deleted the currently selected strategy, switch to the first remaining one
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

        if (ruleOfList.length === 0) {
          displayedData = [];
          totalItems = 0;
          currentPage = 1;
          totalPages = 1;
        }
      }

      return true;
    })();

    return toast?.promise(deletePromise, {
      loading: covered_call_screener_toast_deleting(),
      success: covered_call_screener_toast_deleted(),
      error: covered_call_screener_toast_delete_failed(),
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
      toast.error(covered_call_screener_toast_title_too_long(), {
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

    const postData = { type: "coveredCallScreener" };
    for (const [key, value] of formData.entries()) {
      postData[key] = value;
    }

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

      toast.success(covered_call_screener_toast_created(), {
        style: `
          border-radius: 5px;
          background: #fff;
          color: #000;
          border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
          font-size: 15px;
        `,
      });

      const closePopup = document.getElementById("addStrategy");
      closePopup?.dispatchEvent(new MouseEvent("click"));

      selectedStrategy = output.id;
      strategyList = [output, ...strategyList];
      selectedPopularStrategy = "";

      if (removeList) {
        removeList = false;
        ruleOfList = [];
      }

      await handleSave(false);

      return output;
    })();

    return toast.promise(createPromise, {
      loading: covered_call_screener_toast_creating(),
      success: () => "",
      error: covered_call_screener_toast_create_failed(),
      style: `
          border-radius: 5px;
          background: #fff;
          color: #000;
          border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
          font-size: 15px;
        `,
    });
  }

  async function switchStrategy(item) {
    isDataLoading = true;
    displayedData = [];
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

    await fetchTableData({ page: 1 });
  }

  async function popularStrategy(state: string) {
    isDataLoading = true;
    displayedData = [];
    resetTableSearch();
    const strategies = {
      highYield: {
        name: "High Yield",
        rules: [
          { condition: "over", name: "annualizedReturn", value: "20%" },
          { condition: "over", name: "volume", value: "100" },
          { condition: "over", name: "oi", value: "500" },
        ],
      },
      conservative: {
        name: "Conservative",
        rules: [
          { condition: "over", name: "moneynessPercent", value: "2%" },
          { condition: "between", name: "dte", value: ["30", "180"] },
        ],
      },
      weeklyIncome: {
        name: "Weekly Income",
        rules: [
          { condition: "under", name: "dte", value: "14" },
          { condition: "over", name: "returnVal", value: "1%" },
          { condition: "over", name: "volume", value: "500" },
        ],
      },
      highProtection: {
        name: "High Protection",
        rules: [
          { condition: "over", name: "downsideProtection", value: "3%" },
          { condition: "over", name: "volume", value: "100" },
          { condition: "over", name: "ivRank", value: "30%" },
        ],
      },
      bluechipCC: {
        name: "Blue-Chip Covered Calls",
        rules: [
          { condition: "over", name: "stockPrice", value: "50" },
          { condition: "over", name: "volume", value: "500" },
          { condition: "over", name: "oi", value: "1K" },
          { condition: "over", name: "annualizedReturn", value: "10%" },
        ],
      },
    };

    const strategy = strategies[state];
    if (strategy) {
      if (selectedPopularStrategy === state) {
        isDataLoading = false;
        return;
      }

      selectedPopularStrategy = state;
      ruleOfList = [];

      checkedItems.clear();
      Object.keys(valueMappings).forEach((key) => {
        valueMappings[key] = "any";
      });

      ruleOfList = strategy?.rules;
      ruleOfList?.forEach((row) => {
        ruleCondition[row.name] =
          row.condition ?? allRules[row.name]?.defaultCondition ?? "";
        valueMappings[row.name] =
          row.value ?? allRules[row.name]?.defaultValue ?? "any";

        if (checkedRules.includes(row.name)) {
          checkedItems.set(
            row.name,
            new Set(Array.isArray(row.value) ? row.value : [row.value]),
          );
        }
      });

      displayRules = ruleOfList?.map((row) => ({
        rule: row.name,
        label: allRules[row.name]?.label,
        varType: allRules[row.name]?.varType,
      }));

      await fetchTableData({ page: 1 });
    } else {
      isDataLoading = false;
    }
  }

  function changeRule(state: string) {
    selectedPopularStrategy = "";
    ruleName = state;
    handleAddRule();
  }

  // Build rules array from current state for the server
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

  async function fetchTableData({
    page = currentPage,
    pageSize = rowsPerPage,
    sortKey = activeSortKey,
    sortOrder = activeSortOrder,
  } = {}) {
    if (currentAbortController) currentAbortController.abort();
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;
    const invocationId = ++requestId;

    const activeRules = buildActiveRules();

    isFetchingPage = true;
    isDataLoading = true;
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortKey,
        sortOrder,
        tab: displayTableTab,
      });
      if (inputValue) params.set("search", inputValue);
      if (activeRules.length > 0)
        params.set("rules", JSON.stringify(activeRules));
      // Send all rule column names so backend projects them even if filter value is "any"
      const allRuleNames = ruleOfList
        ?.map((r) => r.name)
        .filter(
          (name) =>
            name && name !== "excludeTickers" && name !== "includeTickers",
        )
        .join(",");
      if (allRuleNames) params.set("displayColumns", allRuleNames);

      const response = await fetch(
        `/api/covered-call-screener-feed?${params}`,
        { signal },
      );
      if (signal.aborted) return;
      const result = await response.json();
      if (invocationId !== requestId) return;

      displayedData = result.items ?? [];
      totalItems = result.total ?? 0;
      currentPage = result.page ?? page;
      rowsPerPage = result.pageSize ?? pageSize;
      totalPages = result.totalPages ?? 1;
      totalContracts = result.totalContracts ?? totalContracts;
      activeSortKey = sortKey;
      activeSortOrder = sortOrder;
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
      const response = await fetch(`/api/covered-call-screener-feed?${params}`);
      const result = await response.json();
      return result?.items ?? [];
    } catch (e) {
      console.error("fetchAllFilteredData failed:", e);
      return [];
    }
  }

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

  async function resetTableSearch() {
    inputValue = "";
    fetchTableData({ page: 1 });
  }

  async function search() {
    fetchTableData({ page: 1 });
  }

  function handleAddRule() {
    if (ruleName === "") {
      toast.error(covered_call_screener_toast_select_rule(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
      return;
    }

    let newRule;

    switch (ruleName) {
      case "assetType":
      case "marketCapGroup":
      case "earningsTime":
      case "earningsDate":
      case "payoutFrequency":
      case "exDividendDate":
        newRule = {
          name: ruleName,
          value: Array.isArray(valueMappings[ruleName])
            ? valueMappings[ruleName]
            : [valueMappings[ruleName]],
        };
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
      const existingRule = ruleOfList[existingRuleIndex];
      if (existingRule.name === newRule.name) {
        ruleOfList.splice(existingRuleIndex, 1);
        ruleOfList = [...ruleOfList];
      } else {
        ruleOfList[existingRuleIndex] = newRule;
        ruleOfList = [...ruleOfList];
      }
    } else {
      ruleOfList = [...ruleOfList, newRule];
    }
  }

  async function handleResetAll() {
    selectedPopularStrategy = "";
    displayTableTab = "general";
    inputValue = "";
    ruleOfList = [];
    Object.keys(allRules).forEach((ruleName) => {
      ruleCondition[ruleName] = allRules[ruleName].defaultCondition;
      valueMappings[ruleName] = allRules[ruleName].defaultValue;
    });
    ruleName = "";
    displayedData = [];
    totalItems = 0;
    currentPage = 1;
    totalPages = 1;
    checkedItems = new Map();
  }

  async function handleDeleteRule(state) {
    selectedPopularStrategy = "";

    const index = ruleOfList?.findIndex((rule) => rule.name === state);
    if (index !== -1) {
      const rule = ruleOfList[index];
      const defaultCondition = allRules[state].defaultCondition;
      const defaultValue = allRules[state].defaultValue;

      const isAtDefaultValues =
        ruleCondition[state] === defaultCondition &&
        (Array.isArray(valueMappings[state]) && Array.isArray(defaultValue)
          ? JSON.stringify(valueMappings[state]) ===
            JSON.stringify(defaultValue)
          : valueMappings[state] === defaultValue);

      if (!isAtDefaultValues) {
        ruleCondition[state] = defaultCondition;
        valueMappings[state] = defaultValue;

        ruleOfList[index] = {
          ...rule,
          condition: defaultCondition,
          value: defaultValue,
        };
        ruleOfList = [...ruleOfList];

        // Clear checkedItems so checkboxes reflect the reset
        if (checkedItems.has(state)) {
          checkedItems.delete(state);
          checkedItems = checkedItems;
        }
      } else {
        ruleOfList.splice(index, 1);
        ruleOfList = [...ruleOfList];

        if (checkedItems?.has(state)) {
          checkedItems?.delete(state);
        }

        if (ruleOfList?.length === 0) {
          ruleName = "";
          displayedData = [];
          totalItems = 0;
          currentPage = 1;
          totalPages = 1;
        } else if (state === ruleName) {
          ruleName = "";
        }
      }
    }
  }

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

  function saveRowsPerPage() {
    if (typeof localStorage === "undefined") return;

    try {
      const paginationKey = `covered-call-screener_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  function loadRowsPerPage() {
    if (typeof localStorage === "undefined") {
      rowsPerPage = 20;
      return;
    }

    try {
      const paginationKey = `covered-call-screener_rowsPerPage`;
      const savedRows = localStorage.getItem(paginationKey);

      if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
        rowsPerPage = Number(savedRows);
      } else {
        rowsPerPage = 20;
      }
    } catch (e) {
      console.warn("Failed to load rows per page preference:", e);
      rowsPerPage = 20;
    }
  }

  // Quick Search functions
  function updateQuickSearchResults(term) {
    if (!term.trim()) {
      quickSearchResults = [];
      showQuickSearchDropdown = false;
      return;
    }

    const lowerTerm = term.toLowerCase();
    const availableRules = allRows?.filter(
      (row) => !ruleOfList.some((rule) => rule.name === row.rule),
    );

    quickSearchResults = availableRules.filter((row) =>
      row.label.toLowerCase().includes(lowerTerm),
    );
    showQuickSearchDropdown = quickSearchResults.length > 0 || term.length > 0;
    selectedQuickSearchIndex = -1;
  }

  function handleQuickSearchInput(event) {
    quickSearchTerm = event.target.value;
    updateQuickSearchResults(quickSearchTerm);
  }

  function handleQuickSearchKeydown(event) {
    if (!showQuickSearchDropdown || quickSearchResults.length === 0) {
      if (event.key === "Escape") {
        closeQuickSearchDropdown();
      }
      return;
    }

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
          selectedQuickSearchIndex < quickSearchResults.length
        ) {
          selectQuickSearchRule(quickSearchResults[selectedQuickSearchIndex]);
        }
        break;
      case "Escape":
        closeQuickSearchDropdown();
        break;
    }
  }

  function selectQuickSearchRule(rule) {
    ruleName = rule.rule;
    handleAddRule();

    quickSearchResults = [];
    showQuickSearchDropdown = false;
    selectedQuickSearchIndex = -1;
  }

  function closeQuickSearchDropdown() {
    setTimeout(() => {
      showQuickSearchDropdown = false;
      selectedQuickSearchIndex = -1;
    }, 150);
  }

  let LoginPopup;

  // Toggle full width mode
  function toggleFullWidth() {
    isFullWidth = !isFullWidth;
    try {
      localStorage.setItem(
        "covered-call-screener-full-width",
        String(isFullWidth),
      );
    } catch (e) {
      console.warn("Failed to save full width preference:", e);
    }
  }

  onMount(async () => {
    loadRowsPerPage();

    // Load full width preference
    const savedFullWidth = localStorage.getItem(
      "covered-call-screener-full-width",
    );
    if (savedFullWidth !== null) {
      isFullWidth = savedFullWidth === "true";
    }

    if (!data?.user) {
      LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
    }

    groupedRules = groupScreenerRules(allRows);
    isLoaded = true;
  });

  onDestroy(() => {
    if (currentAbortController) currentAbortController.abort();
    if (_ruleFetchTimeout) clearTimeout(_ruleFetchTimeout);
    if (excludeTickerTimeout) clearTimeout(excludeTickerTimeout);
    if (includeTickerTimeout) clearTimeout(includeTickerTimeout);
    clearCache();
  });

  async function handleSave(showMessage) {
    if (!data?.user) return;

    if (strategyList?.length === 0) {
      handleCreateStrategy();
    }

    if (strategyList?.length > 0) {
      // Build a fresh rules array from the authoritative UI state
      // so saved data always matches what buildActiveRules/fetchTableData use
      const currentRules = ruleOfList.map((rule) => {
        const name = rule.name;
        const condition =
          ruleCondition[name] ?? allRules[name]?.defaultCondition ?? "";
        let value;
        if (checkedRules.includes(name) && checkedItems?.has(name)) {
          const items = [...checkedItems.get(name)];
          value = items.length > 0 ? items : "any";
        } else {
          value = valueMappings[name] ?? allRules[name]?.defaultValue ?? "any";
        }
        return { name, condition, value };
      });

      ruleOfList = currentRules;
      const matchedStrategy = strategyList.find(
        (item) => item.id === selectedStrategy,
      );
      if (matchedStrategy) {
        matchedStrategy.rules = currentRules;
      }
      strategyList = strategyList;

      const postData = {
        strategyId: selectedStrategy,
        rules: currentRules,
        type: "coveredCallScreener",
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
          loading: covered_call_screener_toast_saving(),
          success: covered_call_screener_toast_saved(),
          error: covered_call_screener_toast_save_failed(),
          style: `
              border-radius: 5px;
              background: #fff;
              color: #000;
              border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"};
              font-size: 15px;
            `,
        });
      } else {
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
      // Update displayRules immediately so filter chips appear instantly
      displayRules = allRows?.filter((row) =>
        ruleOfList?.some((rule) => rule.name === row.rule),
      );

      if (isLoaded) {
        debouncedRuleFetch();
      }
    }
  }

  // When the display tab changes, re-fetch from server with the new tab
  $: if (displayTableTab && isLoaded) {
    fetchTableData({ page: 1 });
  }

  $: {
    if (searchTerm?.length > 0) {
      const filteredRows = allRows?.filter((row) =>
        row?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
      );

      filteredGroupedRules = groupScreenerRules(filteredRows);
    } else {
      filteredGroupedRules = groupScreenerRules(allRows);
    }
  }

  function changeRuleCondition(name: string, state: string) {
    ruleName = name;
    const newState = state?.toLowerCase();

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
      ?.filter((rule) => checkedRules?.includes(rule.name))
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
      if (val.endsWith("%")) {
        return parseFloat(val);
      }

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

  async function handleChangeValue(value, { shouldSort = true } = {}) {
    if (ruleCondition[ruleName] === "between") {
      if (!Array.isArray(valueMappings[ruleName])) {
        valueMappings[ruleName] = ["", ""];
      }

      if (!Array.isArray(value) && typeof currentIndex === "number") {
        valueMappings[ruleName][currentIndex] = value;
        value = valueMappings[ruleName];
      } else if (Array.isArray(value)) {
        valueMappings[ruleName] = value;
      }
    }

    if (checkedItems.has(ruleName)) {
      const itemsSet = checkedItems.get(ruleName);

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
      const sortedValue =
        shouldSort && Array.isArray(value) ? value.sort(customSort) : value;

      const valueKey = Array.isArray(sortedValue)
        ? sortedValue.join("-")
        : sortedValue;

      checkedItems?.set(ruleName, new Set([valueKey]));
    }

    if (checkedRules?.includes(ruleName)) {
      if (!Array.isArray(valueMappings[ruleName])) {
        valueMappings[ruleName] = [];
      }

      const sortedValue =
        shouldSort && Array?.isArray(value) ? value?.sort(customSort) : value;

      const valueKey = Array?.isArray(sortedValue)
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

      // Trigger Svelte reactivity so the $: block syncs into ruleOfList and fires the worker
      valueMappings = valueMappings;
    } else if (ruleName in valueMappings) {
      if (ruleCondition[ruleName] === "between" && Array?.isArray(value)) {
        valueMappings[ruleName] = shouldSort ? value?.sort(customSort) : value;
      } else {
        valueMappings[ruleName] = value;
      }
    } else {
      console.warn(`Unhandled rule: ${ruleName}`);
    }

    if (ruleCondition[ruleName] === "between" && value.some((v) => v !== "")) {
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

    number = parseFloat(number?.toFixed(2));
    const newValue = suffix ? `${number}${suffix}` : Math?.round(number);
    await handleChangeValue(newValue);
  }

  let currentIndex = null;

  async function handleValueInput(event, ruleName, index = null) {
    const newValue = event.target.value;

    if (ruleCondition[ruleName] === "between") {
      if (!Array.isArray(valueMappings[ruleName])) {
        valueMappings[ruleName] = ["", ""];
      }

      currentIndex = index;

      if (newValue?.length === 0) {
        valueMappings[ruleName][index] = "";
      }

      await handleChangeValue(newValue, { shouldSort: false });

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

  const sortData = (key) => {
    // Cycle: none -> desc -> asc -> none
    const newOrder =
      activeSortKey === key
        ? activeSortOrder === "desc"
          ? "asc"
          : activeSortOrder === "asc"
            ? "none"
            : "desc"
        : "desc";

    // Update local sortOrders state for TableHeader visual indicators
    Object.keys(sortOrders).forEach((k) => {
      if (k !== key) sortOrders[k].order = "none";
    });
    if (sortOrders[key]) sortOrders[key].order = newOrder;

    if (newOrder === "none") {
      activeSortKey = "annualizedReturn";
      activeSortOrder = "desc";
      fetchTableData({
        page: 1,
        sortKey: "annualizedReturn",
        sortOrder: "desc",
      });
    } else {
      activeSortKey = key;
      activeSortOrder = newOrder;
      fetchTableData({ page: 1, sortKey: key, sortOrder: newOrder });
    }
  };

  let columns;
  let sortOrders;

  // Column reordering state
  let customColumnOrder: string[] = [];
  let lastAppliedColumnKeys: string = "";

  function getColumnOrderStorageKey(): string {
    return `covered-call-screener_${displayTableTab}_columnOrder`;
  }

  function loadColumnOrder(): string[] {
    if (typeof localStorage === "undefined") return [];
    try {
      const saved = localStorage.getItem(getColumnOrderStorageKey());
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  function saveColumnOrder(order: string[]): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(getColumnOrderStorageKey(), JSON.stringify(order));
    } catch {
      // Ignore storage errors
    }
  }

  function applyColumnOrder(
    currentColumns: { key: string; label: string; align: string }[],
  ): { key: string; label: string; align: string }[] {
    if (customColumnOrder.length === 0) return currentColumns;
    const columnMap = new Map(currentColumns.map((col) => [col.key, col]));
    const orderedColumns: { key: string; label: string; align: string }[] = [];
    for (const key of customColumnOrder) {
      const col = columnMap.get(key);
      if (col) {
        orderedColumns.push(col);
        columnMap.delete(key);
      }
    }
    for (const col of columnMap.values()) {
      orderedColumns.push(col);
    }
    return orderedColumns;
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
    customColumnOrder = [];
    lastAppliedColumnKeys = "";
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(getColumnOrderStorageKey());
      } catch {
        // Ignore storage errors
      }
    }
    displayTableTab = displayTableTab;
  }

  // Initial columns and sort orders for the "general" tab
  const generalColumns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "stockPrice", label: "Price", align: "right" },
    { key: "changesPercentage", label: "% Change", align: "right" },
    { key: "strike", label: "Strike", align: "right" },
    { key: "expiration", label: "Exp Date", align: "right" },
    { key: "profitProb", label: "Profit Prob", align: "right" },
    { key: "volume", label: "Vol", align: "right" },
    { key: "oi", label: "OI", align: "right" },
  ];

  const generalSortOrders = {
    symbol: { order: "none", type: "string" },
    stockPrice: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    strike: { order: "none", type: "number" },
    expiration: { order: "none", type: "date" },
    profitProb: { order: "none", type: "number" },
    volume: { order: "none", type: "number" },
    oi: { order: "none", type: "number" },
  };

  const stringTypeRules = [
    "earningsDate",
    "earningsTime",
    "exDividendDate",
    "payoutFrequency",
    "marketCapGroup",
  ];

  const getType = (key) =>
    stringTypeRules.includes(key) ? "string" : "number";

  $: {
    if (displayTableTab) {
      const baseColumnsMap = {
        income: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "strike", label: "Strike", align: "right" },
          { key: "bid", label: "Bid", align: "right" },
          { key: "annualizedReturn", label: "Ann. Return", align: "right" },
          { key: "returnVal", label: "Return", align: "right" },
          { key: "ptnlRtn", label: "Ptnl Rtn", align: "right" },
          { key: "ifCalledReturn", label: "If Called Return", align: "right" },
          {
            key: "ifCalledAnnualized",
            label: "If Called Ann.",
            align: "right",
          },
          {
            key: "downsideProtection",
            label: "Downside Prot.",
            align: "right",
          },
          { key: "breakeven", label: "BE Bid", align: "right" },
          { key: "pctBeBid", label: "% BE", align: "right" },
          { key: "profitProb", label: "Profit Prob", align: "right" },
        ],
        greeks: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "strike", label: "Strike", align: "right" },
          { key: "delta", label: "Delta", align: "right" },
          { key: "gamma", label: "Gamma", align: "right" },
          { key: "theta", label: "Theta", align: "right" },
          { key: "vega", label: "Vega", align: "right" },
          { key: "iv", label: "IV", align: "right" },
          { key: "ivRank", label: "IV Rank", align: "right" },
        ],
        filters: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "strike", label: "Strike", align: "right" },
        ],
      };

      const baseSortOrdersMap = {
        income: {
          symbol: { order: "none", type: "string" },
          strike: { order: "none", type: "number" },
          bid: { order: "none", type: "number" },
          annualizedReturn: { order: "none", type: "number" },
          returnVal: { order: "none", type: "number" },
          ptnlRtn: { order: "none", type: "number" },
          ifCalledReturn: { order: "none", type: "number" },
          ifCalledAnnualized: { order: "none", type: "number" },
          downsideProtection: { order: "none", type: "number" },
          breakeven: { order: "none", type: "number" },
          pctBeBid: { order: "none", type: "number" },
          profitProb: { order: "none", type: "number" },
        },
        greeks: {
          symbol: { order: "none", type: "string" },
          strike: { order: "none", type: "number" },
          delta: { order: "none", type: "number" },
          gamma: { order: "none", type: "number" },
          theta: { order: "none", type: "number" },
          vega: { order: "none", type: "number" },
          iv: { order: "none", type: "number" },
          ivRank: { order: "none", type: "number" },
        },
        filters: {
          symbol: { order: "none", type: "string" },
          strike: { order: "none", type: "number" },
        },
      };

      let newColumns;
      if (displayTableTab === "general") {
        newColumns = [...generalColumns];
        sortOrders = { ...generalSortOrders };
      } else {
        newColumns = [...(baseColumnsMap[displayTableTab] || [])];
        sortOrders = { ...(baseSortOrdersMap[displayTableTab] || {}) };

        const rulesList =
          displayTableTab === "greeks" || displayTableTab === "income"
            ? []
            : displayRules;

        rulesList?.forEach((rule) => {
          if (
            !["strike", "excludeTickers", "includeTickers"]?.includes(rule.rule)
          ) {
            newColumns.push({
              key: rule.rule,
              label: rule.label,
              align: "right",
            });
            sortOrders[rule.rule] = { order: "none", type: getType(rule.rule) };
          }
        });
      }

      // Load saved column order and apply if columns changed
      const newColumnKeys = newColumns.map((col) => col.key).join("|");
      if (newColumnKeys !== lastAppliedColumnKeys) {
        customColumnOrder = loadColumnOrder();
        newColumns = applyColumnOrder(newColumns);
        lastAppliedColumnKeys = newColumns.map((col) => col.key).join("|");
      }
      columns = newColumns;
    }
  }
</script>

<SEO
  title={covered_call_screener_seo_title()}
  description={covered_call_screener_seo_description()}
  keywords={covered_call_screener_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: covered_call_screener_structured_name(),
    description: covered_call_screener_structured_description(),
    url: "https://stocknear.com/covered-call-screener",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Premium yield screening",
      "Annualized return calculation",
      "If-called return analysis",
      "Downside protection metrics",
      "Greeks-based filtering",
      "Custom screening strategies",
    ],
    softwareRequirements: "Web Browser",
    provider: { "@type": "Organization", name: "Stocknear" },
  }}
/>

<section
  class="w-full overflow-hidden min-h-screen pb-40 px-5 mt-5 text-gray-700 dark:text-zinc-200 transition-all duration-300 {isFullWidth
    ? 'max-w-full'
    : 'max-w-3xl sm:max-w-(--breakpoint-xl)'}"
>
  <BreadCrumb
    containerClass="text-sm sm:text-[0.95rem] breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{covered_call_screener_breadcrumb_home()}</a
      >
    </li>
    <li>
      <span class="text-gray-500 dark:text-zinc-400"
        >{covered_call_screener_breadcrumb_title()}</span
      >
    </li>
  </BreadCrumb>

  <!--Start Build Strategy-->
  <div class="sm:rounded">
    <div class="flex flex-col md:flex-row items-start md:items-center mb-5">
      <div class="w-full flex flex-row items-center sm:mt-4">
        <h1
          class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
        >
          {covered_call_screener_main_title()}
        </h1>
      </div>

      <div class="flex flex-row items-center w-full mt-5 justify-end">
        <div class="flex w-full sm:w-[50%] md:block md:w-auto sm:ml-auto">
          <div
            class="hidden text-xs uppercase tracking-wide font-semibold md:block sm:mb-1 text-gray-500 dark:text-zinc-400"
          >
            {covered_call_screener_popular_screens()}
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
                      ? (popularStrategyList.find(
                          (s) => s.key === selectedPopularStrategy,
                        )?.label ?? covered_call_screener_select_popular())
                      : covered_call_screener_select_popular()}</span
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
                  {covered_call_screener_popular_strategies()}
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
            {covered_call_screener_saved_screens()}
          </div>
          <div class="relative inline-block text-left grow">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="min-w-[110px] w-full transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="truncate max-w-48"
                    >{selectedStrategy?.length !== 0
                      ? strategyList?.find(
                          (item) => item.id === selectedStrategy,
                        )?.title
                      : covered_call_screener_select_screen()}</span
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
                class="w-fit max-w-56 h-fit max-h-72 overflow-y-auto scroller rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-1.5 text-gray-700 dark:text-zinc-200 shadow-none"
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
                        {covered_call_screener_new_screen()}
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
                      class="whitespace-nowrap {item?.id === selectedStrategy
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
            {covered_call_screener_filters_count({ count: ruleOfList?.length })}
          </button>
        </div>
      </div>
      {#if showFilters}
        <div class="mt-3 pb-1 w-full">
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Add Filters Button -->
            <label
              for="ruleModal"
              class="w-full sm:w-fit text-sm inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-2 pl-3 pr-4 font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus:outline-hidden"
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
              <div>{covered_call_screener_add_filters()}</div>
            </label>

            <!-- Quick Search Input -->
            <div class="w-full sm:w-fit relative">
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
                  placeholder={covered_call_screener_search_filters({
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
                  {covered_call_screener_nothing_found()}
                </div>
              {/if}
            </div>

            {#if data?.user}
              <label
                for={!data?.user ? "userLogin" : ""}
                on:click={() => handleSave(true)}
                class="w-full sm:w-fit text-sm cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-900/90 dark:border-white/80 bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-2 pl-3 pr-4 font-semibold transition hover:bg-gray-800 dark:hover:bg-zinc-200 focus:outline-hidden"
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

                <div>{covered_call_screener_save()}</div>
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
                  class="w-full sm:w-fit text-sm cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 py-2 pl-3 pr-4 font-semibold transition hover:text-violet-600 dark:hover:text-violet-400 focus:outline-hidden"
                >
                  <Copy class="w-4 h-4 inline-block mr-2" />
                  <div>{covered_call_screener_save_as_new()}</div>
                </label>
              {/if}
            {/if}

            {#if ruleOfList?.length !== 0}
              <label
                on:click={handleResetAll}
                class="w-full sm:w-fit text-sm cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 py-2 pl-3 pr-4 font-semibold transition hover:text-rose-800 dark:hover:text-rose-400 focus:outline-hidden"
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

                <div>{covered_call_screener_reset_all()}</div>
              </label>
            {/if}
          </div>
        </div>

        <div
          class="sm:grid sm:gap-x-2.5 md:grid-cols-2 lg:grid-cols-3 w-full mt-3 border-t border-b border-gray-300 dark:border-zinc-700"
        >
          {#each displayRules as row (row?.rule)}
            <!--Start Added Rules-->
            <div
              class="flex items-center justify-between space-x-2 px-1 py-1.5 text-sm sm:text-[0.95rem] leading-tight"
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
                          class="border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 h-[35px] flex flex-row justify-between items-center w-[140px] xs:w-[130px] sm:w-[140px] px-3 rounded-full truncate hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <span class="truncate ml-2 text-sm">
                            {#if row?.rule === "excludeTickers"}
                              {excludeTickerList.length === 0
                                ? covered_call_screener_condition_any()
                                : excludeTickerList.join(",")}
                            {:else if row?.rule === "includeTickers"}
                              {includeTickerList.length === 0
                                ? covered_call_screener_condition_any()
                                : includeTickerList.join(",")}
                            {:else if valueMappings[row?.rule] === "any"}
                              {covered_call_screener_condition_any()}
                            {:else if ruleCondition[row?.rule] === "between"}
                              {Array.isArray(valueMappings[row?.rule])
                                ? `${valueMappings[row?.rule][0]}-${valueMappings[row?.rule][1] ?? covered_call_screener_condition_any()}`
                                : covered_call_screener_condition_any()}
                            {:else if row?.rule === "marketCapGroup"}
                              {Array.isArray(valueMappings[row?.rule])
                                ? valueMappings[row?.rule]
                                    ?.map((v) => v?.replace(/\s*\(.*?\)/, ""))
                                    ?.join(", ")
                                : String(valueMappings[row?.rule])?.replace(
                                    /\s*\(.*?\)/,
                                    "",
                                  )}
                            {:else}
                              {conditionLabel(ruleCondition[row?.rule])}
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
                        {:else if !checkedRules?.includes(row?.rule)}
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
                                        {conditionLabel(
                                          ruleCondition[ruleName],
                                        )}
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
                                      {#each [{ value: "Over", label: covered_call_screener_condition_over() }, { value: "Under", label: covered_call_screener_condition_under() }, { value: "Between", label: covered_call_screener_condition_between() }, { value: "Exactly", label: covered_call_screener_condition_exactly() }] as item}
                                        <DropdownMenu.Item
                                          on:click={() =>
                                            changeRuleCondition(
                                              row?.rule,
                                              item.value,
                                            )}
                                          class="cursor-pointer text-sm font-normal"
                                          >{item.label}</DropdownMenu.Item
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
                                    placeholder={covered_call_screener_input_min()}
                                    value={Array?.isArray(
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
                                    placeholder={covered_call_screener_input_max()}
                                    value={Array?.isArray(
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
                                  placeholder={covered_call_screener_input_value()}
                                  value={valueMappings[row?.rule] !== "any"
                                    ? valueMappings[row?.rule]
                                    : ""}
                                  on:input={(e) =>
                                    handleValueInput(e, row?.rule)}
                                  class="ios-zoom-fix block max-w-[4.8rem] rounded-full placeholder-gray-500 dark:placeholder:text-zinc-400 font-normal p-1 text-sm bg-white/80 dark:bg-zinc-950/60 border border-gray-300 dark:border-zinc-700"
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
                          {:else if !checkedRules?.includes(row?.rule)}
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
                                      {conditionLabel(ruleCondition[row?.rule])}
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
                                    {conditionLabel(ruleCondition[row?.rule])}
                                    {newValue}
                                  </button>
                                </DropdownMenu.Item>
                              {/if}
                            {/each}
                          {:else if checkedRules?.includes(row?.rule)}
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
      class=" whitespace-nowrap text-xl font-semibold py-1 bp:text-[1.3rem] border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white"
    >
      {#if isDataLoading && displayedData?.length === 0}
        <span
          class="inline-block h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
        ></span>
      {:else}
        {covered_call_screener_contracts_count({
          count: (data?.user?.tier === "Pro"
            ? totalItems
            : totalContracts
          )?.toLocaleString("en-US"),
        })}
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
              <label class="cursor-pointer" on:click={resetTableSearch}>
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
            placeholder={covered_call_screener_search_placeholder()}
            class="shadow-sm py-2 text-[0.85rem] sm:text-sm border bg-white/80 dark:bg-zinc-950/60 border-gray-300 dark:border-zinc-700 rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
          />
        </div>

        <div class=" ml-2">
          <ScreenerExport
            {data}
            {displayedData}
            screener="covered-call"
            title="covered_call_screener_data"
            creditCost={3}
            modalTitle="Export covered call screener data"
            itemLabel="options"
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
              <polyline points="4 14 10 14 10 20" /><polyline
                points="20 10 14 10 14 4"
              />
              <line x1="14" y1="10" x2="21" y2="3" /><line
                x1="3"
                y1="21"
                x2="10"
                y2="14"
              />
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
              <polyline points="15 3 21 3 21 9" /><polyline
                points="9 21 3 21 3 15"
              />
              <line x1="21" y1="3" x2="14" y2="10" /><line
                x1="3"
                y1="21"
                x2="10"
                y2="14"
              />
            </svg>
          {/if}
          <span class="truncate text-[0.85rem] sm:text-sm"
            >{isFullWidth
              ? covered_call_screener_normal_width()
              : covered_call_screener_full_width()}</span
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
      <nav class="w-full flex flex-row items-center order-2 lg:order-0">
        <ul
          class="flex flex-row overflow-x-auto items-center space-x-2 whitespace-nowrap"
        >
          <li>
            <button
              on:click={() => (displayTableTab = "general")}
              class="cursor-pointer text-sm sm:text-[0.95rem] block rounded-full border px-3 py-1 text-sm font-medium transition {displayTableTab ===
              'general'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {covered_call_screener_tab_general()}
            </button>
          </li>
          <li>
            <button
              on:click={() => (displayTableTab = "income")}
              class="cursor-pointer text-sm sm:text-[0.95rem] block rounded-full border px-3 py-1 text-sm font-medium transition {displayTableTab ===
              'income'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              {covered_call_screener_tab_income()}
            </button>
          </li>
          <li>
            <button
              on:click={() => (displayTableTab = "filters")}
              class="cursor-pointer text-sm sm:text-[0.95rem] flex flex-row items-center rounded-full border px-3 py-1 text-sm font-medium transition {displayTableTab ===
              'filters'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              <span>{covered_call_screener_tab_filters()}</span>
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
              on:click={() => (displayTableTab = "greeks")}
              class="cursor-pointer text-sm sm:text-[0.95rem] flex flex-row items-center rounded-full border px-3 py-1 text-sm font-medium transition {displayTableTab ===
              'greeks'
                ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
            >
              <span>{covered_call_screener_tab_greeks()}</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>

  <!--Start Matching Preview-->
  {#if isLoaded}
    {#if displayedData?.length !== 0 || isDataLoading}
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
                        class="inline-block h-4 {column.key === 'symbol'
                          ? 'w-12'
                          : 'w-14'} animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                      ></span>
                    </td>
                  {/each}
                </tr>
              {/each}
            {/if}
            {#each displayedData as item, i}
              <tr
                class="border-b border-gray-300 dark:border-zinc-700 last:border-none"
                class:opacity-30={i + 1 === displayedData?.length &&
                  data?.user?.tier !== "Pro"}
              >
                {#each columns as column}
                  {#if column.key === "symbol"}
                    <td class="whitespace-nowrap text-start">
                      <div class="flex flex-row items-center gap-2">
                        <a
                          href={`/${["stock", "stocks"]?.includes(item?.assetType?.toLowerCase()) ? "stocks" : ["etf", "etfs"]?.includes(item?.assetType?.toLowerCase()) ? "etf" : "index"}/` +
                            item?.symbol +
                            `/options/contract-lookup?contract=${item?.optionSymbol}`}
                          rel="noopener noreferrer"
                          target="_blank"
                          class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400 text-sm inline-block w-[3.5rem]"
                          >{item?.symbol}</a
                        >
                        <button
                          on:click|stopPropagation={() => openChartModal(item)}
                          class="cursor-pointer text-gray-500 dark:text-zinc-400 sm:hover:text-violet-600 dark:sm:hover:text-violet-400"
                        >
                          <ChartNoAxesCombined class="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  {:else if column.key === "changesPercentage" || column.key === "moneynessPercent"}
                    <td class="text-end text-sm whitespace-nowrap">
                      {#if item[column.key] >= 0}
                        <span class="text-emerald-800 dark:text-emerald-400"
                          >+{item[column.key] >= 1000
                            ? abbreviateNumber(item[column.key])
                            : item[column.key]?.toFixed(2)}%</span
                        >
                      {:else}
                        <span class="text-rose-800 dark:text-rose-400"
                          >{item[column.key] <= -1000
                            ? abbreviateNumber(item[column.key])
                            : item[column.key]?.toFixed(2)}%</span
                        >
                      {/if}
                    </td>
                  {:else if column.key === "annualizedReturn" || column.key === "ifCalledReturn" || column.key === "ifCalledAnnualized" || column.key === "downsideProtection" || column.key === "iv" || column.key === "ivRank" || column.key === "pctBeBid" || column.key === "returnVal" || column.key === "ptnlRtn" || column.key === "profitProb"}
                    <td class="text-end text-sm whitespace-nowrap">
                      {#if item[column.key] != null}
                        {item[column.key] + "%"}
                      {:else if !(column.key in item)}
                        <span
                          class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                        ></span>
                      {:else}
                        n/a
                      {/if}
                    </td>
                  {:else if column.key === "volume" || column.key === "oi" || column.key === "dte"}
                    <td class="text-end text-sm whitespace-nowrap">
                      {#if item[column.key] != null}
                        {item[column.key]?.toLocaleString("en-US")}
                      {:else if !(column.key in item)}
                        <span
                          class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                        ></span>
                      {:else}
                        n/a
                      {/if}
                    </td>
                  {:else if column.key === "stockPrice" || column.key === "strike" || column.key === "bid" || column.key === "breakeven"}
                    <td class="text-end text-sm whitespace-nowrap">
                      {#if item[column.key] != null}
                        {item[column.key]?.toFixed(2)}
                      {:else if !(column.key in item)}
                        <span
                          class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                        ></span>
                      {:else}
                        n/a
                      {/if}
                    </td>
                  {:else if column.key === "expiration"}
                    <td class="text-end text-sm whitespace-nowrap">
                      {formatDate(item[column.key])} ({item.dte})
                    </td>
                  {:else if column.key === "delta" || column.key === "gamma" || column.key === "theta" || column.key === "vega"}
                    <td class="text-end text-sm whitespace-nowrap">
                      {#if item[column.key] != null}
                        {item[column.key]}
                      {:else if !(column.key in item)}
                        <span
                          class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                        ></span>
                      {:else}
                        n/a
                      {/if}
                    </td>
                  {:else}
                    {@const rule = displayRules?.find(
                      (r) => r.rule === column.key,
                    )}
                    <td class="whitespace-nowrap text-sm text-end">
                      {#if ["earningsTime", "payoutFrequency", "marketCapGroup"]?.includes(column.key)}
                        {#if item[column.key]}
                          {item[column.key]
                            ?.replace("After Market Close", "After Close")
                            ?.replace("Before Market Open", "Before Open")
                            ?.replace(/\s*\(.*?\)/, "")}
                        {:else if !(column.key in item)}
                          <span
                            class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"
                          ></span>
                        {:else}
                          n/a
                        {/if}
                      {:else if rule?.varType === "date"}
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
                      {:else if rule?.varType === "percentSign"}
                        <span
                          class={item[column.key] > 0
                            ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
                            : item[column.key] < 0
                              ? "text-rose-800 dark:text-rose-400"
                              : ""}
                        >
                          {abbreviateNumber(item[column.key])}%
                        </span>
                      {:else if rule?.varType === "percent"}
                        {abbreviateNumber(item[column.key])}%
                      {:else if rule?.varType === "decimal"}
                        {item[column.key]?.toLocaleString("en-US")}
                      {:else if rule?.varType === "dollar"}
                        ${abbreviateNumber(item[column.key])}
                      {:else}
                        {abbreviateNumber(item[column.key])}
                      {/if}
                    </td>
                  {/if}
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="-mt-3">
        <UpgradeToPro {data} display={true} />
      </div>

      {#if totalItems > 0 && data?.user?.tier === "Pro"}
        <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
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
              <span class="hidden sm:inline"
                >{covered_call_screener_pagination_previous()}</span
              >
            </Button>
          </div>

          <div class="flex flex-row items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-zinc-300">
              {covered_call_screener_pagination_page_of({
                current: currentPage,
                total: totalPages,
              })}
            </span>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="truncate text-[0.85rem] sm:text-sm"
                    >{covered_call_screener_rows_label({
                      rows: rowsPerPage,
                    })}</span
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
                <DropdownMenu.Group class="pb-2">
                  {#each rowsPerPageOptions as item}
                    <DropdownMenu.Item
                      class="sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                    >
                      <label
                        on:click={() => changeRowsPerPage(item)}
                        class="inline-flex justify-between w-full items-center cursor-pointer"
                      >
                        <span class="text-sm"
                          >{covered_call_screener_rows_label({
                            rows: item,
                          })}</span
                        >
                      </label>
                    </DropdownMenu.Item>
                  {/each}
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <div class="flex items-center gap-2">
            <Button
              on:click={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 bg-white/80 dark:bg-zinc-950/60 hover:text-violet-600 dark:hover:text-violet-400 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span class="hidden sm:inline"
                >{covered_call_screener_pagination_next()}</span
              >
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

        <div class="flex justify-center mt-4">
          <button
            on:click={scrollToTop}
            class="cursor-pointer text-sm font-medium text-gray-800 dark:text-zinc-300 transition hover:text-violet-600 dark:hover:text-violet-400"
          >
            {covered_call_screener_back_to_top()}
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
          ? covered_call_screener_no_results_query({ query: inputValue })
          : covered_call_screener_no_contracts()}
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
      <div
        class="fixed w-full h-fit sticky -top-6 z-40 bg-white dark:bg-zinc-900 pb-6 pt-5 border-gray-300 dark:border-zinc-700 border-b"
      >
        <div class="flex flex-row items-center justify-between mb-2">
          <h2
            class=" text-[1rem] sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            {covered_call_screener_select_filters_title({
              count: allRows?.length,
            })}
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
              placeholder={covered_call_screener_search_modal_placeholder()}
              bind:value={searchTerm}
            />
          </div>
        </form>
      </div>

      <div class="">
        {#each searchTerm?.length !== 0 ? Object?.entries(filteredGroupedRules) : Object?.entries(groupedRules) as [category, rules]}
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
                <input
                  on:click={() => changeRule(row?.rule)}
                  id={row?.rule}
                  type="checkbox"
                  checked={ruleOfList?.find((rule) => rule?.name === row?.rule)}
                  class="h-[18px] w-[18px] rounded-sm ring-offset-0 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 lg:h-4 lg:w-4"
                />
                <div class="-mt-0.5">
                  <label for={row?.rule} class="cursor-pointer text-[1rem]"
                    >{row?.label}</label
                  >
                </div>
              </div>
            {/each}
          </div>
        {/each}
        {#if searchTerm?.length > 0 && Object?.entries(filteredGroupedRules)?.length === 0}
          <div class=" mt-5 font-semibold text-[1rem] sm:text-lg">
            {covered_call_screener_nothing_found()}
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
      {covered_call_screener_modal_new_title()}
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
        label={covered_call_screener_modal_new_name_label()}
        required={true}
      />
      <button
        type="submit"
        class="cursor-pointer mt-2 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 duration-100 w-full rounded-full m-auto font-semibold text-md transition hover:bg-gray-800 dark:hover:bg-zinc-200"
      >
        {covered_call_screener_modal_new_create()}
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
      {covered_call_screener_modal_delete_title()}
    </h3>
    <p class="text-sm mb-6 text-gray-800 dark:text-zinc-300">
      {covered_call_screener_modal_delete_message()}
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
        tabindex="0">{covered_call_screener_modal_delete_cancel()}</label
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
        {covered_call_screener_modal_delete_confirm()}</label
      >
    </div>
  </div>
</dialog>
<!--End Delete Strategy Modal-->

<!--Start Login Modal-->
{#if LoginPopup}
  <LoginPopup {form} />
{/if}

<!--End Login Modal-->

<ChartModal
  item={modalItem}
  isOpen={isChartModalOpen}
  isLoading={isChartLoading}
  onClose={closeChartModal}
/>

<style>
  .scroller {
    scrollbar-width: thin;
  }
</style>
