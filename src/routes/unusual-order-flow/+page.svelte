<script lang="ts">
  import notifySound from "$lib/audio/options-flow-reader.mp3";
  import { getCache, setCache, isOpen } from "$lib/store";

  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { onMount, onDestroy } from "svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { scale, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  import { DateFormatter, type DateValue } from "@internationalized/date";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import * as Popover from "$lib/components/shadcn/popover/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import CalendarIcon from "lucide-svelte/icons/calendar";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import Input from "$lib/components/Input.svelte";
  import Copy from "lucide-svelte/icons/copy";
  import InfoModal from "$lib/components/InfoModal.svelte";

  import { page } from "$app/stores";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    unusual_order_flow_add_filters,
    unusual_order_flow_asset_type,
    unusual_order_flow_block,
    unusual_order_flow_dark_pool,
    unusual_order_flow_delayed,
    unusual_order_flow_delayed_content,
    unusual_order_flow_delayed_title,
    unusual_order_flow_etf,
    unusual_order_flow_exit_full_width,
    unusual_order_flow_expand_full_width,
    unusual_order_flow_filters_count,
    unusual_order_flow_full_width,
    unusual_order_flow_hide_filter_area,
    unusual_order_flow_main_title,
    unusual_order_flow_max,
    unusual_order_flow_min,
    unusual_order_flow_modal_delete_cancel,
    unusual_order_flow_modal_delete_confirm,
    unusual_order_flow_modal_delete_message,
    unusual_order_flow_modal_delete_title,
    unusual_order_flow_modal_new_create,
    unusual_order_flow_modal_new_name_label,
    unusual_order_flow_modal_new_title,
    unusual_order_flow_new_filter,
    unusual_order_flow_no_data_filters,
    unusual_order_flow_no_filters_found,
    unusual_order_flow_no_trades_query,
    unusual_order_flow_normal_width,
    unusual_order_flow_nothing_found,
    unusual_order_flow_popular_filters,
    unusual_order_flow_remove_filter,
    unusual_order_flow_reset_all,
    unusual_order_flow_reset_column_order,
    unusual_order_flow_save,
    unusual_order_flow_save_as_new,
    unusual_order_flow_saved_filters,
    unusual_order_flow_search_filters,
    unusual_order_flow_search_input_placeholder,
    unusual_order_flow_search_placeholder,
    unusual_order_flow_select_filter,
    unusual_order_flow_select_popular,
    unusual_order_flow_seo_description,
    unusual_order_flow_seo_keywords,
    unusual_order_flow_seo_title,
    unusual_order_flow_show_filter_area,
    unusual_order_flow_stock,
    unusual_order_flow_strategy_block_orders,
    unusual_order_flow_strategy_dark_pool_prints,
    unusual_order_flow_strategy_etf_flow,
    unusual_order_flow_strategy_high_volume,
    unusual_order_flow_strategy_large_stock_flow,
    unusual_order_flow_strategy_mega_premium,
    unusual_order_flow_structured_description,
    unusual_order_flow_structured_name,
    unusual_order_flow_total_value,
    unusual_order_flow_total_volume,
    unusual_order_flow_transaction_type,
    unusual_order_flow_value,
  } from "$lib/paraglide/messages";

  import UnusualOrderFlowTable from "$lib/components/Table/UnusualOrderFlowTable.svelte";
  import ScreenerExport from "$lib/components/ScreenerExport.svelte";
  export let data;

  let isComponentDestroyed = false;
  let removeList = false;
  let deleteTargetId = "";
  let isFullWidth = false;

  // WebSocket variables
  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectInterval: ReturnType<typeof setTimeout> | null = null;
  let muted = false;
  let audio: HTMLAudioElement | null = null;

  let modeStatus = data?.user?.tier === "Pro" ? true : false;

  let strategyList = data?.getAllStrategies || [];
  let selectedStrategy = strategyList?.at(0)?.id ?? "";

  let ruleOfList = strategyList?.at(0)?.rules ?? [];
  let selectedPopularStrategy = "";
  $: popularStrategyList = [
    {
      key: "darkPoolPrints",
      label: unusual_order_flow_strategy_dark_pool_prints(),
    },
    { key: "blockOrders", label: unusual_order_flow_strategy_block_orders() },
    { key: "megaPremium", label: unusual_order_flow_strategy_mega_premium() },
    { key: "etfFlow", label: unusual_order_flow_strategy_etf_flow() },
    { key: "highVolume", label: unusual_order_flow_strategy_high_volume() },
    {
      key: "largeStockFlow",
      label: unusual_order_flow_strategy_large_stock_flow(),
    },
  ];
  let displayRules = [];
  let filteredData = [];
  let filterQuery =
    data?.user?.tier === "Pro" ? $page.url.searchParams.get("query") || "" : "";
  let pagePathName = $page?.url?.pathname;

  let ruleName = "";
  let searchTerm = "";
  let showFilters = true;
  let filteredRows = [];

  let quickSearchTerm = "";
  let quickSearchResults = [];
  let showQuickSearchDropdown = false;
  let selectedQuickSearchIndex = -1;

  // Exclude tickers search state
  let excludeTickerInput = "";
  let excludeTickerResults = [];
  let excludeTickerTimeout: ReturnType<typeof setTimeout> | null = null;

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
      return;
    }
    excludeTickerTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(excludeTickerInput)}&limit=8`,
        );
        if (response.ok) {
          excludeTickerResults = await response.json();
        }
      } catch {
        excludeTickerResults = [];
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
      return;
    }
    includeTickerTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(includeTickerInput)}&limit=8`,
        );
        if (response.ok) {
          includeTickerResults = await response.json();
        }
      } catch {
        includeTickerResults = [];
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

  const df = new DateFormatter("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  let selectedDate: DateValue | undefined = undefined;
  let infoText = {};
  let tooltipTitle;

  const allRules = {
    size: {
      label: "Size",
      step: ["50K", "20K", "10K", "5K", "2K", "1K", "100", "0"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    volume: {
      label: "Volume",
      step: ["100M", "50M", "20M", "10M", "1M", "500K", "200K", "100K", "50K"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    sizeVolRatio: {
      label: "Size / Volume",
      step: ["20%", "15%", "10%", "5%", "3%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    sizeAvgVolRatio: {
      label: "Size / Avg Volume",
      step: ["20%", "15%", "10%", "5%", "3%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    premium: {
      label: "Premium",
      step: ["100M", "50M", "10M", "5M", "1M"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    assetType: {
      label: "Asset Type",
      step: ["Stock", "ETF"],
      defaultValue: "any",
    },
    exchange: {
      label: "Exchange",
      step: [
        "NASDAQ",
        "NYSE",
        "NYSE Arca",
        "NYSE American",
        "IEX",
        "MEMX",
        "Cboe BZX",
        "Cboe EDGX",
        "Chicago",
      ],
      defaultValue: "any",
    },
    transactionType: {
      label: "Transaction Type",
      step: ["Dark Pool Order", "Block Order"],
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

  const categoricalRules = ["assetType", "exchange", "transactionType"];

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

        // Reset checkedItems for this rule
        checkedItems.delete(state);

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
    debouncedFilterFetch();
  }

  async function applyPopularStrategy(state: string) {
    const strategies = {
      darkPoolPrints: {
        name: "Dark Pool Prints",
        rules: [
          { name: "transactionType", value: ["Dark Pool Order"] },
          { condition: "over", name: "size", value: "10K" },
          { condition: "over", name: "premium", value: "5M" },
        ],
      },
      blockOrders: {
        name: "Block Orders",
        rules: [
          { name: "transactionType", value: ["Block Order"] },
          { condition: "over", name: "size", value: "5K" },
          { condition: "over", name: "premium", value: "1M" },
        ],
      },
      megaPremium: {
        name: "Mega Premium",
        rules: [
          { condition: "over", name: "premium", value: "500M" },
          { condition: "over", name: "size", value: "5K" },
        ],
      },
      etfFlow: {
        name: "ETF Flow",
        rules: [
          { name: "assetType", value: ["ETF"] },
          { condition: "over", name: "size", value: "2K" },
          { condition: "over", name: "premium", value: "1M" },
        ],
      },
      highVolume: {
        name: "High Volume",
        rules: [
          { condition: "over", name: "volume", value: "10M" },
          { condition: "over", name: "size", value: "5K" },
        ],
      },
      largeStockFlow: {
        name: "Large Stock Flow",
        rules: [
          { name: "assetType", value: ["Stock"] },
          { condition: "over", name: "size", value: "10K" },
          { condition: "over", name: "premium", value: "5M" },
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

    debouncedFilterFetch();
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

    // Trigger the filter system
    debouncedFilterFetch();
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
        type: "unusualOrderFlow",
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
        selectedPopularStrategy = "";
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

        // Trigger the filter system
        debouncedFilterFetch();
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
    const postData = { type: "unusualOrderFlow" };
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

      // Trigger the filter system
      debouncedFilterFetch();

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
        type: "unusualOrderFlow",
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
          loading: "Saving filters...",
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

  function updateQuickSearchResults(term) {
    if (term.length === 0) {
      quickSearchResults = [];
      showQuickSearchDropdown = false;
      selectedQuickSearchIndex = -1;
      return;
    }

    const lowerTerm = term.toLowerCase();
    const availableRules = allRows?.filter(
      (row) => !ruleOfList.some((rule) => rule.name === row.rule),
    );

    quickSearchResults = availableRules.filter((row) =>
      row.label.toLowerCase().includes(lowerTerm),
    );

    showQuickSearchDropdown = quickSearchResults.length > 0;
    selectedQuickSearchIndex = -1;
  }

  function handleQuickSearchInput(event) {
    quickSearchTerm = event.target.value;
    updateQuickSearchResults(quickSearchTerm);
  }

  function handleQuickSearchKeydown(event) {
    if (!showQuickSearchDropdown) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedQuickSearchIndex = Math.min(
        selectedQuickSearchIndex + 1,
        quickSearchResults.length - 1,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedQuickSearchIndex = Math.max(selectedQuickSearchIndex - 1, 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (
        selectedQuickSearchIndex >= 0 &&
        selectedQuickSearchIndex < quickSearchResults.length
      ) {
        selectQuickSearchRule(quickSearchResults[selectedQuickSearchIndex]);
      }
    } else if (event.key === "Escape") {
      closeQuickSearchDropdown();
    }
  }

  function selectQuickSearchRule(rule) {
    ruleName = rule.rule;
    handleAddRule();
    //quickSearchTerm = "";
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

  function changeRule(state: string) {
    searchTerm = "";
    selectedPopularStrategy = "";
    ruleName = state;
    handleAddRule();

    //const closePopup = document.getElementById("ruleModal");
    //closePopup?.dispatchEvent(new MouseEvent('click'))
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
          value: Array?.isArray(valueMappings[ruleName])
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

  // handleMessage is now unused since we moved to server-side filtering
  // New WS items are handled directly in the WS message handler

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

  async function getInfoText(parameter, title) {
    tooltipTitle = title;
    const cachedData = getCache(parameter, "getInfoText");
    if (cachedData) {
      infoText = cachedData;
    } else {
      const postData = { parameter };
      const response = await fetch("/api/info-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      infoText = await response.json();
      setCache(parameter, infoText, "getInfoText");
    }
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
    // Reassign to trigger Svelte reactivity (mutation alone doesn't)
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

  // SSR data now returns paginated response: { items, total, page, pageSize, totalPages, sort, stats }
  const ssrFlowData = data?.getFlowData ?? {};
  const ssrItems = ssrFlowData?.items ?? [];

  const nyseDate = ssrItems?.at(0)?.date
    ? new Date(ssrItems.at(0).date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
      })
    : null;

  let rawData = ssrItems;
  let displayedData = [...ssrItems];

  // Pagination state
  let currentPage = ssrFlowData?.page ?? 1;
  let totalItems = ssrFlowData?.total ?? 0;
  let totalPages = ssrFlowData?.totalPages ?? 1;
  let rowsPerPage = 50;

  // Sort state
  let activeSortKey = "date";
  let activeSortOrder = "desc";

  // Loading state for table
  let isFetchingPage = false;
  let requestId = 0;

  // AbortController for cancelling in-flight requests
  let currentAbortController: AbortController | null = null;

  // Column reordering
  let unusualOrderFlowResetColumnOrder: () => void;
  let customColumnOrder = false;

  // Table search (server-side, like options-flow)
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

  // Stats variables - populated from server-side stats
  let totalVolume = ssrFlowData?.stats?.totalVolume ?? 0;
  let totalValue = ssrFlowData?.stats?.totalValue ?? 0;
  let darkPoolCount = ssrFlowData?.stats?.darkPoolCount ?? 0;
  let blockOrderCount = ssrFlowData?.stats?.blockOrderCount ?? 0;
  let darkPoolPercentage = ssrFlowData?.stats?.darkPoolPercentage ?? 0;
  let blockOrderPercentage = ssrFlowData?.stats?.blockOrderPercentage ?? 0;
  let stockCount = ssrFlowData?.stats?.stockCount ?? 0;
  let etfCount = ssrFlowData?.stats?.etfCount ?? 0;
  let stockPercentage = ssrFlowData?.stats?.stockPercentage ?? 0;
  let etfPercentage = ssrFlowData?.stats?.etfPercentage ?? 0;

  function updateStatsFromResponse(stats: any) {
    if (!stats) return;
    totalVolume = stats.totalVolume ?? 0;
    totalValue = stats.totalValue ?? 0;
    darkPoolCount = stats.darkPoolCount ?? 0;
    blockOrderCount = stats.blockOrderCount ?? 0;
    darkPoolPercentage = stats.darkPoolPercentage ?? 0;
    blockOrderPercentage = stats.blockOrderPercentage ?? 0;
    stockCount = stats.stockCount ?? 0;
    etfCount = stats.etfCount ?? 0;
    stockPercentage = stats.stockPercentage ?? 0;
    etfPercentage = stats.etfPercentage ?? 0;
  }

  // Map display transaction type values to data values for WS filters
  const TRANSACTION_TYPE_MAP: Record<string, string> = {
    "Dark Pool Order": "DP",
    "Block Order": "B",
  };

  function buildActiveRules(): any[] {
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

  // Build simplified filter object for WebSocket
  function buildWsFilters(): Record<string, any> {
    const filters: Record<string, any> = {};

    if (filterQuery) {
      filters.tickers = filterQuery;
    }

    for (const rule of ruleOfList) {
      if (!rule.value || rule.value === "any") continue;
      if (
        Array.isArray(rule.value) &&
        rule.value.length === 1 &&
        rule.value[0] === "any"
      )
        continue;

      if (rule.name === "transactionType" && Array.isArray(rule.value)) {
        filters.transactionType = rule.value.map(
          (v: string) => TRANSACTION_TYPE_MAP[v] || v,
        );
      } else if (
        ["assetType", "exchange"].includes(rule.name) &&
        Array.isArray(rule.value)
      ) {
        filters[rule.name] = rule.value;
      } else if (
        ["size", "volume", "premium"].includes(rule.name) &&
        rule.condition &&
        rule.value
      ) {
        // Supports all conditions: over, under, between, exactly
        if (rule.condition === "between" && Array.isArray(rule.value)) {
          const lo = rule.value[0] != null ? parseValue(rule.value[0]) : null;
          const hi = rule.value[1] != null ? parseValue(rule.value[1]) : null;
          if (lo != null || hi != null) {
            filters[`${rule.name}_filter`] = {
              condition: "between",
              value: [lo, hi],
            };
          }
        } else {
          const parsed = parseValue(rule.value);
          if (!isNaN(parsed)) {
            filters[`${rule.name}_filter`] = {
              condition: rule.condition,
              value: parsed,
            };
          }
        }
      }
      // Ratio filters: Size/Volume and Size/Avg Volume (pre-computed % in data)
      // Supports all conditions: over, under, between, exactly
      if (
        (rule.name === "sizeVolRatio" || rule.name === "sizeAvgVolRatio") &&
        rule.condition &&
        rule.value
      ) {
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
            filters[`${rule.name}_filter`] = {
              condition: "between",
              value: [lo, hi],
            };
          }
        } else {
          const v = parseFloat(String(rule.value).replace(/[%$,]/g, "")) || 0;
          filters[`${rule.name}_filter`] = {
            condition: rule.condition,
            value: v,
          };
        }
      }

      // --- Exclude tickers ---
      if (rule.name === "excludeTickers" && typeof rule.value === "string" && rule.value !== "any") {
        const excluded = rule.value.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
        if (excluded.length > 0) {
          filters.exclude_tickers = excluded;
        }
      }

      // --- Include tickers ---
      if (rule.name === "includeTickers" && typeof rule.value === "string" && rule.value !== "any") {
        const included = rule.value.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
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

  // Debounced wrapper for filter changes — batches rapid clicks into one fetch
  let filterFetchTimeout: ReturnType<typeof setTimeout> | null = null;

  function debouncedFilterFetch() {
    if (filterFetchTimeout) clearTimeout(filterFetchTimeout);
    filterFetchTimeout = setTimeout(() => {
      fetchTableData({ page: 1 });
      sendFiltersToWebSocket();
    }, 200);
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
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortKey,
        sortOrder,
      });

      if (filterQuery) params.set("search", filterQuery);
      if (activeRules.length > 0)
        params.set("rules", JSON.stringify(activeRules));

      const response = await fetch(`/api/unusual-order-feed?${params}`, {
        signal,
      });

      if (signal.aborted) return;
      const result = await response.json();
      if (invocationId !== requestId) return;

      displayedData = result.items || [];
      rawData = displayedData;
      totalItems = result.total ?? 0;
      currentPage = result.page ?? page;
      rowsPerPage = result.pageSize ?? pageSize;
      totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
      activeSortKey = sortKey;
      activeSortOrder = sortOrder;

      // Update stats from server
      if (result.stats) updateStatsFromResponse(result.stats);
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

  function handleSort(key: string, order: string) {
    if (order === "none") {
      // Reset to default sort (newest first)
      fetchTableData({ page: 1, sortKey: "date", sortOrder: "desc" });
    } else {
      fetchTableData({ page: 1, sortKey: key, sortOrder: order });
    }
  }

  const rowsPerPageOptions = [20, 50, 100];

  function goToPage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > totalPages || isFetchingPage) return;
    fetchTableData({ page: pageNumber });
  }

  function changeRowsPerPage(newSize: number) {
    if (rowsPerPage === newSize || isFetchingPage) return;
    saveRowsPerPage(newSize);
    fetchTableData({ page: 1, pageSize: newSize });
  }

  function scrollToTop() {
    if (!browser) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveRowsPerPage(value: number) {
    if (!browser) return;
    try {
      localStorage.setItem("/unusual-order-flow_rowsPerPage", String(value));
    } catch (e) {
      /* ignore */
    }
  }

  function loadRowsPerPage(): number {
    if (!browser) return rowsPerPage;
    try {
      const saved = localStorage.getItem("/unusual-order-flow_rowsPerPage");
      const parsed = saved ? Number(saved) : NaN;
      if (rowsPerPageOptions.includes(parsed)) return parsed;
    } catch (e) {
      /* ignore */
    }
    return 50;
  }

  async function fetchAllFlowData(): Promise<any[]> {
    try {
      const PAGE_SIZE = 500;
      const activeRules = buildActiveRules();
      const allItems: any[] = [];
      let page = 1;
      let total = Infinity;

      while (allItems.length < total) {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
          sortKey: activeSortKey,
          sortOrder: activeSortOrder,
        });

        if (filterQuery) {
          params.set("search", filterQuery);
        }
        if (activeRules.length > 0) {
          params.set("rules", JSON.stringify(activeRules));
        }

        const response = await fetch(`/api/unusual-order-feed?${params}`);
        if (!response.ok) break;

        const result = await response.json();
        const items = result.items || [];
        total = result.total ?? 0;
        allItems.push(...items);
        if (items.length < PAGE_SIZE) break;
        page++;
      }

      return allItems;
    } catch (e) {
      console.error("fetchAllFlowData failed:", e);
      return [];
    }
  }

  let isLoaded = false;

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
          console.log("Switching to live mode - connecting WebSocket");
          connectWebSocket();
        } else {
          console.log("Switching to paused mode - disconnecting WebSocket");
          disconnectWebSocket();
        }
      }
    }
  }

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
      const wsUrlWithToken = `${data.wsURL}/unusual-order?token=${encodeURIComponent(data.wsToken)}`;
      socket = new WebSocket(wsUrlWithToken);

      socket.addEventListener("open", () => {
        console.log("Unusual Order Flow WebSocket connection opened");
        reconnectAttempts = 0;

        // Send init with filters
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

            // Deduplicate against items already on screen to prevent
            // the race where the WS poll delivers the same trades that
            // the REST fetch already loaded.
            const existingIds = new Set(
              displayedData.map((item) => item?.trackingID).filter(Boolean),
            );
            const trulyNew = newData.filter(
              (item) => !existingIds.has(item?.trackingID),
            );

            if (trulyNew.length === 0) return;

            // Update pagination metadata so controls stay accurate
            totalItems = (totalItems || 0) + trulyNew.length;
            totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

            // Only update visible rows when on page 1 AND using the default
            // date-desc sort.  New trades sort to position 0 only in that
            // configuration.  For any other sort (e.g. premium, size) or
            // page 2+, prepending would displace items that legitimately
            // belong on the current page — so we just update the counts
            // above and leave the view untouched.
            const isDefaultSort =
              activeSortKey === "date" && activeSortOrder === "desc";

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
        console.log(
          "Unusual Order Flow WebSocket closed:",
          event.code,
          event.reason,
        );
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
        console.error("Unusual Order Flow WebSocket error:", error);
      });
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
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

  // Reactive statement for automatic WebSocket connection
  // Only connect when market is open — no live trades arrive when market is closed
  $: if (data?.user?.tier === "Pro" && modeStatus && $isOpen) {
    connectWebSocket();
  } else if (data?.user?.tier !== "Pro" || !modeStatus || !$isOpen) {
    disconnectWebSocket();
  }

  // Toggle full width mode
  function toggleFullWidth() {
    isFullWidth = !isFullWidth;
    try {
      localStorage.setItem(
        "unusual-order-flow-full-width",
        String(isFullWidth),
      );
    } catch (e) {
      console.warn("Failed to save full width preference:", e);
    }
  }

  onMount(async () => {
    // Load full width preference
    const savedFullWidth = localStorage.getItem(
      "unusual-order-flow-full-width",
    );
    if (savedFullWidth !== null) {
      isFullWidth = savedFullWidth === "true";
    }

    // Load muted state from localStorage
    const savedMutedState = localStorage.getItem("unusualOrderFlowMuted");
    if (savedMutedState !== null) {
      muted = JSON.parse(savedMutedState);
    }

    ruleOfList?.forEach((rule) => {
      ruleCondition[rule.name] =
        rule.condition ?? allRules[rule.name]?.defaultCondition ?? "";
      valueMappings[rule.name] =
        rule.value ?? allRules[rule.name]?.defaultValue ?? "any";
    });

    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule?.name === row?.rule),
    );

    audio = new Audio(notifySound);

    const storedRows = loadRowsPerPage();
    if (storedRows !== rowsPerPage) {
      changeRowsPerPage(storedRows);
    }

    isLoaded = true;
  });

  onDestroy(() => {
    isComponentDestroyed = true;
    disconnectWebSocket();

    if (currentAbortController) {
      currentAbortController.abort();
    }

    if (audio) {
      audio.pause();
      audio = null;
    }
  });

  /*
  const getHistoricalFlow = async () => {
    // Create a delay using setTimeout wrapped in a Promise
    if (data?.user?.tier === "Pro") {
      mode = false;
      isLoaded = false;

      displayRules = allRows?.filter((row) =>
        ruleOfList.some((rule) => rule.name === row.rule),
      );
      displayedData = [];

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Make the POST request after the delay
      const convertDate = new Date(df.format(selectedDate?.toDate()));
      const year = convertDate?.getFullYear();
      const month = String(convertDate?.getMonth() + 1).padStart(2, "0");
      const day = String(convertDate?.getDate()).padStart(2, "0");

      const postData = { selectedDate: `${year}-${month}-${day}` };

      try {
        const response = await fetch("/api/options-historical-flow", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        });

        rawData = await response?.json();
        fetchTableData(1);
      } catch (error) {
        console.error("Error fetching historical flow:", error);
        rawData = [];
      } finally {
        isLoaded = true;
      }
    } else {
      toast.error("Only for Pro Members", {
                style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,

      });
    }
  };
  */

  $: {
    if (searchTerm) {
      filteredRows = allRows?.filter((row) =>
        row?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
      );
    }
  }
</script>

<SEO
  title={unusual_order_flow_seo_title()}
  description={unusual_order_flow_seo_description()}
  keywords={unusual_order_flow_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: unusual_order_flow_structured_name(),
    description: unusual_order_flow_structured_description(),
    url: "https://stocknear.com/unusual-order-flow",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time dark pool prints",
      "Block trade tracking",
      "Institutional order flow",
      "Exchange-level filters",
      "Stock and ETF coverage",
      "Historical order flow",
      "Custom flow strategies",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<div class="overflow-y-auto">
  <section
    class="w-full flex justify-center items-center p-3 sm:p-0 transition-all duration-300 {isFullWidth
      ? 'max-w-full'
      : 'max-w-screen sm:max-w-[1400px]'}"
  >
    <div class="w-full m-auto min-h-screen mb-20">
      <!--
        <div class="text-sm sm:text-[1rem] breadcrumbs mb-5">
          <ul>
            <li><a href="/" class="text-gray-500 dark:text-zinc-400">Home</a></li>
            <li class="text-gray-500 dark:text-zinc-400">Options Flow</li>
          </ul>
        </div>
        -->
      <div class="flex flex-col md:flex-row items-start md:items-center mb-5">
        <div
          class="w-full flex flex-col sm:flex-row items-start sm:items-center sm:mt-4"
        >
          <h1
            class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {unusual_order_flow_main_title()}
          </h1>
        </div>

        <div class="flex flex-row items-center w-full mt-3">
          <div class="flex w-full sm:w-[50%] md:block md:w-auto sm:ml-auto">
            <div
              class="hidden text-xs uppercase tracking-wide font-semibold md:block sm:mb-1 text-gray-500 dark:text-zinc-400"
            >
              {unusual_order_flow_popular_filters()}
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
                        : unusual_order_flow_select_popular()}</span
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
                    {unusual_order_flow_popular_filters()}
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
                        class="cursor-pointer sm:hover:text-violet-800 dark:sm:hover:text-violet-300"
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

          <div class="flex w-full sm:w-[50%] sm:ml-3 md:block md:w-auto ml-3">
            <div
              class="hidden text-xs uppercase tracking-wide font-semibold md:block sm:mb-1 text-gray-500 dark:text-zinc-400"
            >
              {unusual_order_flow_saved_filters()}
            </div>
            <div class="relative inline-block text-left grow">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="min-w-[110px] w-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-300 hover:border-gray-300/70 dark:hover:border-zinc-700/80 ease-out flex flex-row justify-between items-center px-3 py-2 rounded-full truncate"
                  >
                    <span class="truncate max-w-48"
                      >{selectedStrategy?.length !== 0
                        ? strategyList?.find(
                            (item) => item.id === selectedStrategy,
                          )?.title
                        : unusual_order_flow_select_filter()}</span
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
                        class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-300 focus:outline-hidden"
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
                          {unusual_order_flow_new_filter()}
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
                        class="whitespace-nowrap cursor-pointer rounded-xl px-2 py-1.5 {item?.id ===
                        selectedStrategy
                          ? 'bg-gray-100/70 dark:bg-zinc-900/60'
                          : ''} hover:text-violet-600 dark:hover:text-violet-300"
                      >
                        {item?.title?.length > 20
                          ? item?.title?.slice(0, 20) + "..."
                          : item?.title} ({item?.rules?.length})

                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <label
                          for="deleteStrategy"
                          on:click|stopPropagation={() => { deleteTargetId = item?.id; }}
                          class="ml-auto inline-block cursor-pointer text-gray-400 hover:text-rose-500"
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
        class="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 p-2"
      >
        <div
          class="flex flex-col sm:flex-row items-center pb-3 sm:border-b sm:border-gray-300 dark:border-zinc-700"
        >
          <div
            class="flex flex-row items-center justify-center sm:justify-start"
          >
            <label
              data-tip="Audio Preference"
              on:click={() => {
                muted = !muted;
                localStorage.setItem(
                  "unusualOrderFlowMuted",
                  JSON.stringify(muted),
                );
              }}
              class="mute-driver xl:tooltip xl:tooltip-bottom flex flex-col items-center mr-3 cursor-pointer"
            >
              <div
                class="rounded-full w-10 h-10 relative text-gray-600 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 flex items-center justify-center"
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
              class="text-xs sm:text-sm sm:text-lg {!mode
                ? ''
                : 'text-gray-500 dark:text-zinc-400'} mr-3"
            >
              {$isOpen ? "Paused" : "Market Closed"}
            </span>

            <label
              on:click={() => {
                if (!$isOpen) {
                  toast?.error(`Market is closed`, {
                    style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                  });
                }
              }}
              class="live-flow-driver inline-flex items-center cursor-pointer focus-none focus:outline-hidden"
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
                Live Flow
              </span>
            </div>
          </div>

          <div class="sm:ml-auto w-full sm:w-fit mt-3 sm:mt-0">
            <div class="relative flex flex-col sm:flex-row items-center">
              <Popover.Root>
                <Popover.Trigger asChild let:builder>
                  <Button
                    on:click={() =>
                      toast?.info("Feature is coming soon 🔥", {
                        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                      })}
                    class="date-picker-driver font-semibold w-full sm:w-[160px] truncate  py-2.5 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 justify-center sm:justify-start text-center sm:text-left border border-gray-300 dark:border-zinc-700 rounded-full hover:text-violet-600 dark:hover:text-violet-300"
                    builders={[builder]}
                  >
                    <CalendarIcon
                      class="mr-2 h-4 w-4 text-gray-500 dark:text-zinc-400"
                    />
                    Pick a Date
                  </Button>
                </Popover.Trigger>
              </Popover.Root>
            </div>
          </div>
        </div>

        <div
          class="mr-1 flex items-center justify-between lg:mr-2 pb-1.5 border-b border-gray-300 dark:border-zinc-700 mt-1.5"
        >
          <button
            on:click={() => (showFilters = !showFilters)}
            class="flex cursor-pointer items-center text-lg sm:text-xl font-semibold text-gray-900 dark:text-white"
            title={showFilters
              ? unusual_order_flow_hide_filter_area()
              : unusual_order_flow_show_filter_area()}
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
            {unusual_order_flow_filters_count({ count: ruleOfList?.length })}
          </button>
          <div class="flex flex-row items-center ml-auto justify-start">
            <div class="flex items-center gap-1">
              <span
                class="inline-flex items-center text-xs text-gray-500 dark:text-zinc-400"
              >
                <svg
                  class="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clip-rule="evenodd"
                  />
                </svg>
                {unusual_order_flow_delayed()}
              </span>
              <InfoModal
                id="sip-data-info"
                title={unusual_order_flow_delayed_title()}
                content={unusual_order_flow_delayed_content()}
              />
            </div>
          </div>
        </div>

        {#if showFilters}
          <div class="sm:mt-3 pb-1 w-full">
            <div class="flex flex-wrap items-center gap-2.5">
              <!-- Add Filters Button -->
              <label
                for="ruleModal"
                class="text-sm mt-3 sm:mt-0 w-full sm:w-fit inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-900/90 dark:border-white py-2 pl-3 pr-4 font-semibold bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 ease-out focus:outline-hidden focus:ring-0"
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
                <div>{unusual_order_flow_add_filters()}</div>
              </label>

              <!-- Quick Search Input -->
              <div class="w-full sm:w-fit relative">
                <div class="relative">
                  <div
                    class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                  >
                    <svg
                      class="w-4 h-4 text-gray-500 dark:text-zinc-400"
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
                    placeholder={unusual_order_flow_search_filters({
                      count: allRows?.length,
                    })}
                    bind:value={quickSearchTerm}
                    on:input={handleQuickSearchInput}
                    on:keydown={handleQuickSearchKeydown}
                    on:focus={() => updateQuickSearchResults(quickSearchTerm)}
                    on:blur={closeQuickSearchDropdown}
                    class="block w-full lg:w-64 py-2 bg-white/80 dark:bg-zinc-950/60 placeholder:text-gray-800 dark:placeholder:text-zinc-300 pl-10 text-sm border border-gray-300 dark:border-zinc-700 rounded-full focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 text-gray-700 dark:text-zinc-200"
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
                        class="cursor-pointer w-full px-2 py-2 flex flex-row items-center rounded-xl hover:text-violet-600 dark:hover:text-violet-300 {index ===
                        selectedQuickSearchIndex
                          ? 'bg-gray-100/70 dark:bg-zinc-900/60'
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
                            {result?.label}
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
                    {unusual_order_flow_no_filters_found()}
                  </div>
                {/if}
              </div>

              {#if data?.user}
                <label
                  for={!data?.user ? "userLogin" : ""}
                  on:click={() => handleSave(true)}
                  class="w-full sm:w-fit text-sm cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-900/90 dark:border-white bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-2 pl-3 pr-4 font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 ease-out focus:outline-hidden"
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

                  <div>{unusual_order_flow_save()}</div>
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
                    class="w-full sm:w-fit text-[0.95rem] cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 py-2 pl-3 pr-4 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-300 hover:border-gray-300/70 dark:hover:border-zinc-700/80 ease-out focus:outline-hidden"
                  >
                    <Copy class="w-4 h-4 inline-block mr-2" />
                    <div>{unusual_order_flow_save_as_new()}</div>
                  </label>
                {/if}
              {/if}

              {#if ruleOfList?.length !== 0}
                <label
                  on:click={handleResetAll}
                  class="w-full sm:w-fit text-[0.95rem] cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded-full border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 py-2 pl-3 pr-4 font-semibold text-gray-700 dark:text-zinc-200 hover:text-rose-500 dark:hover:text-rose-300 hover:border-gray-300/70 dark:hover:border-zinc-700/80 ease-out focus:outline-hidden"
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

                  <div>{unusual_order_flow_reset_all()}</div>
                </label>
              {/if}
            </div>
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
                    class="mr-1.5 cursor-pointer text-gray-400 hover:text-rose-500 focus:outline-hidden"
                    title={unusual_order_flow_remove_filter()}
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
                            class="bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 h-[40px] flex flex-row justify-between items-center w-[150px] xs:w-[140px] sm:w-[150px] px-3 rounded-full truncate"
                          >
                            <span
                              class="truncate ml-2 text-sm font-semibold dark:font-normal"
                            >
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
                          {#if !categoricalRules?.includes(row?.rule)}
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
                                        class="w-fit -mt-1 -ml-2 flex flex-row justify-between items-center text-gray-600 dark:text-zinc-300"
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
                                      placeholder={unusual_order_flow_min()}
                                      value={Array.isArray(
                                        valueMappings[row?.rule],
                                      )
                                        ? (valueMappings[row?.rule][0] ?? "")
                                        : ""}
                                      on:input={(e) =>
                                        handleValueInput(e, row?.rule, 0)}
                                      class="ios-zoom-fix block max-w-[3.5rem] rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 dark:text-zinc-200 font-normal p-1 text-sm border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 focus:outline-none focus:ring-0"
                                    />
                                    <span class=" text-[1rem] font-normal mt-1">
                                      &
                                    </span>
                                    <input
                                      type="text"
                                      placeholder={unusual_order_flow_max()}
                                      value={Array.isArray(
                                        valueMappings[row?.rule],
                                      )
                                        ? (valueMappings[row?.rule][1] ?? "")
                                        : ""}
                                      on:input={(e) =>
                                        handleValueInput(e, row?.rule, 1)}
                                      class="ios-zoom-fix block max-w-[3.5rem] rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 dark:text-zinc-200 font-normal p-1 text-sm border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 focus:outline-none focus:ring-0"
                                    />
                                  </div>
                                {:else}
                                  <input
                                    type="text"
                                    placeholder={unusual_order_flow_value()}
                                    value={valueMappings[row?.rule] === "any"
                                      ? ""
                                      : valueMappings[row?.rule]}
                                    on:input={(e) =>
                                      handleValueInput(e, row?.rule)}
                                    class="ios-zoom-fix block max-w-[4.8rem] rounded-full placeholder:text-gray-800 dark:placeholder:text-zinc-300 dark:text-zinc-200 font-normal p-1 text-sm border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 focus:outline-none focus:ring-0"
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
                                        class="size-6 cursor-pointer text-gray-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
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
                                        class="size-6 cursor-pointer text-gray-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
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
                                      class="hover:text-violet-600 dark:hover:text-violet-300 rounded-xl"
                                    >
                                      <button
                                        on:click={() => {
                                          handleChangeValue([
                                            row?.step[index],
                                            row?.step[index + 1],
                                          ]);
                                        }}
                                        class="cursor-pointer block w-full border-b border-gray-300 dark:border-zinc-700 px-4 py-1.5 text-left text-sm rounded last:border-0 focus:outline-hidden"
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
                                    class="hover:text-violet-600 dark:hover:text-violet-300 rounded-xl"
                                  >
                                    <button
                                      on:click={() => {
                                        handleChangeValue(newValue);
                                      }}
                                      class="cursor-pointer block w-full border-b border-gray-300 dark:border-zinc-700 px-4 py-1.5 text-left text-sm rounded last:border-0 focus:outline-hidden"
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
                                  class="hover:text-violet-600 dark:hover:text-violet-300 rounded-xl"
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
        <!-- Stats Grid -->
        <div class="w-full mt-3 m-auto flex justify-center items-center">
          <div class="w-full grid grid-cols-1 lg:grid-cols-4 gap-y-3 gap-x-3">
            <!--Start Total Volume-->
            <div
              class="flex flex-row items-center flex-wrap w-full px-5 bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl h-20"
            >
              <div class="flex flex-col items-start">
                <span
                  class="font-semibold text-gray-500 dark:text-zinc-400 text-sm sm:text-[1rem]"
                  >{unusual_order_flow_total_volume()}</span
                >
                {#if data?.user?.tier === "Pro"}
                  <span class="text-start text-[1rem] font-semibold">
                    {new Intl.NumberFormat("en", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(totalVolume)}
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
            </div>
            <!--End Total Volume-->
            <!--Start Total Value-->
            <div
              class="flex flex-row items-center flex-wrap w-full px-5 bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl h-20"
            >
              <div class="flex flex-col items-start">
                <span
                  class="font-semibold text-gray-500 dark:text-zinc-400 text-sm sm:text-[1rem]"
                  >{unusual_order_flow_total_value()}</span
                >
                {#if data?.user?.tier === "Pro"}
                  <span class="text-start text-[1rem] font-semibold">
                    ${new Intl.NumberFormat("en", {
                      notation: "compact",
                      compactDisplay: "short",
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }).format(totalValue)}
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
            </div>
            <!--End Total Value-->
            <!--Start Transaction Type (Dark Pool vs Block Order)-->
            <div
              class="flex flex-col w-full px-4 sm:px-5 py-3 bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl"
            >
              <div
                class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2"
              >
                <span
                  class="font-semibold text-gray-500 dark:text-zinc-400 text-sm sm:text-[1rem]"
                  >{unusual_order_flow_transaction_type()}</span
                >
                {#if data?.user?.tier === "Pro"}
                  <div class="flex items-center gap-3 text-[11px] sm:text-xs">
                    <div class="flex items-center gap-1">
                      <span
                        class="w-2 h-2 rounded-full bg-violet-500/70 dark:bg-violet-400/70"
                      ></span>
                      <span class="text-gray-500 dark:text-zinc-400"
                        >{unusual_order_flow_dark_pool()}</span
                      >
                    </div>
                    <div class="flex items-center gap-1">
                      <span
                        class="w-2 h-2 rounded-full bg-amber-500/70 dark:bg-amber-400/70"
                      ></span>
                      <span class="text-gray-500 dark:text-zinc-400"
                        >{unusual_order_flow_block()}</span
                      >
                    </div>
                  </div>
                {/if}
              </div>
              {#if data?.user?.tier === "Pro"}
                <div class="flex flex-col w-full">
                  <div
                    class="relative flex w-full h-3.5 rounded-full overflow-hidden bg-gray-200/70 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-700"
                  >
                    <div
                      class="bg-violet-500/70 dark:bg-violet-400/70 h-full transition-all duration-300 flex items-center justify-center"
                      style="width: {darkPoolPercentage}%"
                    >
                      {#if darkPoolPercentage >= 15}
                        <span
                          class="text-[10px] sm:text-xs font-semibold text-white/90 dark:text-zinc-900/90"
                          >{darkPoolPercentage}%</span
                        >
                      {/if}
                    </div>
                    <div
                      class="bg-amber-500/70 dark:bg-amber-400/70 h-full transition-all duration-300 flex items-center justify-center"
                      style="width: {blockOrderPercentage}%"
                    >
                      {#if blockOrderPercentage >= 15}
                        <span
                          class="text-[10px] sm:text-xs font-semibold text-white/90 dark:text-zinc-900/90"
                          >{blockOrderPercentage}%</span
                        >
                      {/if}
                    </div>
                  </div>
                </div>
              {:else}
                <a href="/pricing" class="flex">
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
                    ></path>
                  </svg>
                </a>
              {/if}
            </div>
            <!--End Transaction Type-->
            <!--Start Asset Type (Stocks vs ETFs)-->
            <div
              class="flex flex-col w-full px-4 sm:px-5 py-3 bg-white/70 dark:bg-zinc-950/40 border border-gray-300 dark:border-zinc-700 rounded-2xl"
            >
              <div
                class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2"
              >
                <span
                  class="font-semibold text-gray-500 dark:text-zinc-400 text-sm sm:text-[1rem]"
                  >{unusual_order_flow_asset_type()}</span
                >
                {#if data?.user?.tier === "Pro"}
                  <div class="flex items-center gap-3 text-[11px] sm:text-xs">
                    <div class="flex items-center gap-1">
                      <span
                        class="w-2 h-2 rounded-full bg-emerald-500/70 dark:bg-emerald-400/70"
                      ></span>
                      <span class="text-gray-500 dark:text-zinc-400"
                        >{unusual_order_flow_stock()}</span
                      >
                    </div>
                    <div class="flex items-center gap-1">
                      <span
                        class="w-2 h-2 rounded-full bg-amber-500/70 dark:bg-amber-400/70"
                      ></span>
                      <span class="text-gray-500 dark:text-zinc-400"
                        >{unusual_order_flow_etf()}</span
                      >
                    </div>
                  </div>
                {/if}
              </div>
              {#if data?.user?.tier === "Pro"}
                <div class="flex flex-col w-full">
                  <div
                    class="relative flex w-full h-3.5 rounded-full overflow-hidden bg-gray-200/70 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-700"
                  >
                    <div
                      class="bg-emerald-500/70 dark:bg-emerald-400/70 h-full transition-all duration-300 flex items-center justify-center"
                      style="width: {stockPercentage}%"
                    >
                      {#if stockPercentage >= 15}
                        <span
                          class="text-[10px] sm:text-xs font-semibold text-white/90 dark:text-zinc-900/90"
                          >{stockPercentage}%</span
                        >
                      {/if}
                    </div>
                    <div
                      class="bg-amber-500/70 dark:bg-amber-400/70 h-full transition-all duration-300 flex items-center justify-center"
                      style="width: {etfPercentage}%"
                    >
                      {#if etfPercentage >= 15}
                        <span
                          class="text-[10px] sm:text-xs font-semibold text-white/90 dark:text-zinc-900/90"
                          >{etfPercentage}%</span
                        >
                      {/if}
                    </div>
                  </div>
                </div>
              {:else}
                <a href="/pricing" class="flex">
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
                    ></path>
                  </svg>
                </a>
              {/if}
            </div>
            <!--End Asset Type-->
          </div>
        </div>
        <!-- End Stats Grid -->

        <!-- Page wrapper -->
        <div class="flex flex-col w-full m-auto h-full overflow-hidden">
          {#if displayedData?.length !== 0}
            <!-- Table toolbar: Find, Download, Reset Column Order -->
            <div
              class="w-full flex flex-col sm:flex-row items-center justify-start sm:justify-between mt-3 text-gray-700 dark:text-zinc-200 sm:pt-3 sm:pb-3 sm:border-t sm:border-b sm:border-gray-300 sm:dark:border-zinc-700"
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
                    placeholder={unusual_order_flow_search_placeholder()}
                    class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
                  />
                </div>

                <!-- Download + Reset Column Order -->
                <div class="ml-2 w-fit flex items-center justify-end gap-2">
                  <ScreenerExport
                    {data}
                    {displayedData}
                    screener="unusual-order-flow"
                    title="unusual_order_flow_data"
                    creditCost={3}
                    modalTitle="Export unusual order flow data"
                    itemLabel="trades"
                  />

                  <button
                    on:click={toggleFullWidth}
                    title={isFullWidth
                      ? unusual_order_flow_exit_full_width()
                      : unusual_order_flow_expand_full_width()}
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
                        ? unusual_order_flow_normal_width()
                        : unusual_order_flow_full_width()}</span
                    >
                  </button>

                  {#if customColumnOrder}
                    <button
                      on:click={() => unusualOrderFlowResetColumnOrder?.()}
                      title={unusual_order_flow_reset_column_order()}
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

            <div class="flex w-full m-auto h-full overflow-hidden">
              <div class="mt-3 w-full overflow-x-auto overflow-hidden">
                <UnusualOrderFlowTable
                  {data}
                  {displayedData}
                  {filteredData}
                  {rawData}
                  isLoading={isFetchingPage}
                  onSort={handleSort}
                  bind:resetColumnOrder={unusualOrderFlowResetColumnOrder}
                  bind:customColumnOrder
                />
                <div class="-mt-3">
                  <UpgradeToPro {data} display={true} />
                </div>
              </div>
            </div>

            <!-- Pagination Controls -->
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

                <!-- Page info and rows selector -->
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
          {:else}
            <Infobox text={unusual_order_flow_no_data_filters()} />
          {/if}
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
  </section>
</div>

<!--Start Choose Rule Modal-->
<input type="checkbox" id="ruleModal" class="modal-toggle" />

<dialog id="ruleModal" class="modal p-2 sm:p-0">
  <label
    id="ruleModal"
    for="ruleModal"
    on:click={() => (searchTerm = "")}
    class="cursor-pointer modal-backdrop bg-[#000]/50"
  ></label>

  <div
    class="modal-box z-20 mx-2 min-h-[30vh] h-[800px] opacity-100 bp:mx-3 sm:mx-4 w-full max-w-6xl overflow-y-auto relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <div class="relative flex flex-col w-full">
      <!-- Sticky Header -->

      <div
        class="fixed w-full h-fit sticky -top-6 z-40 opacity-100 pb-6 pt-5 border-gray-300 dark:border-zinc-700 border-b bg-white dark:bg-zinc-900"
      >
        <div class="flex flex-row items-center justify-between mb-2">
          <h2
            class="text-[1rem] sm:text-xl font-semibold text-gray-900 dark:text-white"
          >
            Select screener filters ({allRows?.length} total)
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
          <label for="search" class="text-sm text-gray-200 sr-only"
            >Search</label
          >
          <div class="relative w-full max-w-sm">
            <div
              class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
            >
              <svg
                class="w-4 h-4 text-gray-500 dark:text-zinc-400"
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
                class="cursor-pointer text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300"
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
              class="focus:outline-none placeholder:text-gray-800 dark:placeholder:text-zinc-300 block w-full p-2 ps-10 text-sm text-gray-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 rounded-full bg-white/80 dark:bg-zinc-950/60"
              placeholder={unusual_order_flow_search_input_placeholder()}
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
                    class="w-4 h-4 mb-1 inline-block text-[#A3A3A3] sm:hover: cursor-pointer"
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
                  class="h-[18px] w-[18px] rounded-sm ring-offset-0 lg:h-4 lg:w-4"
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
            {unusual_order_flow_nothing_found()}
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
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
      {unusual_order_flow_modal_new_title()}
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
        label={unusual_order_flow_modal_new_name_label()}
        required={true}
      />

      <button
        type="submit"
        class="cursor-pointer mt-2 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 duration-100 w-full rounded-full m-auto font-semibold text-md"
      >
        {unusual_order_flow_modal_new_create()}
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
    <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
      {unusual_order_flow_modal_delete_title()}
    </h3>
    <p class="text-sm mb-6 text-gray-600 dark:text-zinc-300">
      {unusual_order_flow_modal_delete_message()}
    </p>
    <div class="flex justify-end space-x-3">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <label
        for="deleteStrategy"
        on:click={() => { deleteTargetId = ""; }}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium
              transition-colors duration-100 border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/60 text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-300"
        tabindex="0">{unusual_order_flow_modal_delete_cancel()}</label
      ><label
        for="deleteStrategy"
        on:click={handleDeleteStrategy}
        class="cursor-pointer px-4 py-2 rounded-full text-sm font-medium
              transition-colors duration-100 flex items-center
              bg-rose-600 text-white hover:bg-rose-700
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
        {unusual_order_flow_modal_delete_confirm()}</label
      >
    </div>
  </div>
</dialog>

<!--End Delete Strategy Modal-->

<!--Start Options Detail Desktop Modal-->

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
      <h3 class="font-bold text-2xl mb-5">{tooltipTitle}</h3>
      <span class=" text-[1rem] font-normal">{infoText?.text ?? "n/a"}</span>
      {#if infoText?.equation !== undefined}
        <div class="w-5/6 m-auto mt-5"></div>
        <div class="text-[1rem] w-full pt-3 pb-3 m-auto">
          {infoText?.equation}
        </div>
      {/if}
    </div>

    <div class="border-t border-gray-300 dark:border-zinc-700 mt-2 w-full">
      <label
        for="mobileTooltip"
        class="mt-4 font-semibold text-xl m-auto flex justify-center cursor-pointer text-gray-700 dark:text-zinc-200"
      >
        Close
      </label>
    </div>
  </div>
</dialog>
