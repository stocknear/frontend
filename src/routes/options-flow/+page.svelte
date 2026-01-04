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
  import Infobox from "$lib/components/Infobox.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Input from "$lib/components/Input.svelte";
  import Copy from "lucide-svelte/icons/copy";
  import Zap from "lucide-svelte/icons/zap";

  import { page } from "$app/stores";

  import OptionsFlowTable from "$lib/components/Table/OptionsFlowTable.svelte";
  import { writable } from "svelte/store";

  export let data;
  let shouldLoadWorker = writable(false);
  let workerSubscription: (() => void) | null = null;

  let timeoutId = null;
  let isComponentDestroyed = false;
  let removeList = false;

  let optionsWatchlist = data?.getOptionsWatchlist;
  let strategyList = data?.getAllStrategies || [];
  let selectedStrategy = strategyList?.at(0)?.id ?? "";

  let ruleOfList = strategyList?.at(0)?.rules ?? [];

  let displayRules = [];
  let filteredData = [];
  let filterQuery =
    data?.user?.tier === "Pro" ? $page.url.searchParams.get("query") || "" : "";

  let syncWorker: Worker | undefined;
  let ruleName = "";
  let searchTerm = "";
  let showFilters = true;
  let filteredRows = [];

  // Quick search functionality for unselected rules
  let quickSearchTerm = "";
  let quickSearchResults = [];
  let showQuickSearchDropdown = false;
  let selectedQuickSearchIndex = -1;

  // WebSocket connection
  let socket = null;
  let reconnectInterval = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
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
  };

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

  let sortWorker: Worker | undefined;
  let sortWorkerMessageId = 0;
  const sortWorkerJobs = new Map<
    number,
    { resolve: (value: any[]) => void; reject: (reason?: unknown) => void }
  >();

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

  const calculateTimeRank = (item: any) => {
    if (!item || typeof item !== "object") {
      return 0;
    }

    const dateValue =
      typeof item.date === "string"
        ? Number(item.date.replaceAll("-", "")) || 0
        : 0;
    const [hours = 0, minutes = 0, seconds = 0] =
      typeof item.time === "string"
        ? item.time.split(":").map((value) => Number(value) || 0)
        : [];
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    return dateValue * 100000 + totalSeconds;
  };

  const compareTimeDesc = (a: any, b: any) =>
    calculateTimeRank(b) - calculateTimeRank(a);

  const fallbackSort = (entries: any[] = []) =>
    Array.isArray(entries) ? entries.slice().sort(compareTimeDesc) : [];

  function enqueueSortJob(entries: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!sortWorker) {
        resolve(fallbackSort(entries));
        return;
      }
      const jobId = ++sortWorkerMessageId;
      sortWorkerJobs.set(jobId, { resolve, reject });
      sortWorker.postMessage({
        id: jobId,
        data: entries,
        key: "time",
        direction: "desc",
      });
    });
  }

  function rejectPendingSortJobs(reason: unknown) {
    sortWorkerJobs.forEach(({ reject }) => reject(reason));
    sortWorkerJobs.clear();
  }

  async function sortFlowEntries(entries: any[] = []) {
    if (!Array.isArray(entries) || entries.length <= 1) {
      return entries ?? [];
    }

    if (!sortWorker) {
      return fallbackSort(entries);
    }

    try {
      return await enqueueSortJob(entries);
    } catch (error) {
      console.error("Options flow sorting worker fallback:", error);
      return fallbackSort(entries);
    }
  }

  async function replaceRawData(entries: any[] = []) {
    if (!Array.isArray(entries) || entries.length === 0) {
      rawData = [];
      return rawData;
    }
    const prepared = dedupeFlowEntries(
      attachDerivedMetrics(sanitizeFlowEntries(entries)),
    );
    rawData = await sortFlowEntries(prepared);
    return rawData;
  }

  async function mergeRawData(entries: any[] = []) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return rawData ?? [];
    }
    const incoming = attachDerivedMetrics(sanitizeFlowEntries(entries));
    const combined = dedupeFlowEntries([
      ...incoming,
      ...(Array.isArray(rawData) ? rawData : []),
    ]);
    rawData = await sortFlowEntries(combined);
    return rawData;
  }

  const prepareInitialFlowData = (entries: any[] = []) =>
    fallbackSort(
      dedupeFlowEntries(attachDerivedMetrics(sanitizeFlowEntries(entries))),
    );

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
      shouldLoadWorker.set(true);
    }
  }

  async function handleResetAll() {
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
    displayedData = [...rawData];
  }

  function changeRule(state: string) {
    searchTerm = "";
    ruleName = state;
    handleAddRule();

    //const closePopup = document.getElementById("ruleModal");
    //closePopup?.dispatchEvent(new MouseEvent('click'))
  }

  async function switchStrategy(item) {
    ruleName = "";
    selectedStrategy = item?.id ?? "";

    ruleOfList =
      strategyList?.find((item) => item.id === selectedStrategy)?.rules ?? [];

    ruleOfList.forEach((rule) => {
      ruleCondition[rule.name] =
        rule.condition || allRules[rule.name].defaultCondition;
      valueMappings[rule.name] = rule.value || allRules[rule.name].defaultValue;
    });

    if (ruleOfList?.length === 0) {
      filteredData = [];
      displayedData = [];
    }

    // Update displayed rules
    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule.name === row.rule),
    );

    checkedItems = new Map(
      ruleOfList
        ?.filter((rule) => categoricalRules?.includes(rule.name)) // Only include specific rules
        ?.map((rule) => [rule.name, new Set(rule.value)]), // Create Map from filtered rules
    );

    // Trigger the filter system
    shouldLoadWorker.set(true);
  }

  async function handleCreateStrategy() {
    if (["Pro"]?.includes(data?.user?.tier)) {
      const modalCheckbox = document.getElementById("addStrategy");
      if (modalCheckbox instanceof HTMLInputElement) {
        modalCheckbox.checked = true;
      }
    } else {
      toast.info("Available only to Pro Member", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  async function handleDeleteStrategy() {
    const deletePromise = (async () => {
      const postData = {
        strategyId: selectedStrategy,
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

      // ——— SUCCESS: run your state‐update logic ———
      strategyList =
        strategyList?.filter((item) => item.id !== selectedStrategy) ?? [];
      selectedStrategy = strategyList?.at(0)?.id ?? "";
      ruleOfList =
        strategyList?.find((item) => item.id === selectedStrategy)?.rules ?? [];

      ruleOfList.forEach((rule) => {
        ruleCondition[rule.name] =
          rule.condition || allRules[rule.name].defaultCondition;
        valueMappings[rule.name] =
          rule.value || allRules[rule.name].defaultValue;
      });

      if (ruleOfList.length === 0) {
        filteredData = [];
        displayedData = [];
      }

      // Update displayed rules
      displayRules = allRows?.filter((row) =>
        ruleOfList?.some((rule) => rule.name === row.rule),
      );

      checkedItems = new Map(
        ruleOfList
          ?.filter((rule) => categoricalRules?.includes(rule.name))
          ?.map((rule) => [rule.name, new Set(rule.value)]),
      );

      // Trigger the filter system
      shouldLoadWorker.set(true);

      // return something if you need to chain further
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
      strategyList?.unshift(output);

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
          ?.map((rule) => [rule.name, new Set(rule.value)]),
      );

      // Trigger the filter system
      shouldLoadWorker.set(true);

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
      strategyList.find((item) => item.id === selectedStrategy).rules =
        ruleOfList;

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
      } else {
        ruleOfList[existingRuleIndex] = newRule;
        ruleOfList = [...ruleOfList]; // Trigger reactivity
      }
    } else {
      ruleOfList = [...ruleOfList, newRule];

      shouldLoadWorker.set(true);
    }
  }

  const loadWorker = async () => {
    if (!syncWorker) {
      return;
    }
    syncWorker.postMessage({ rawData, ruleOfList, filterQuery });
  };

  const handleMessage = (event) => {
    isLoaded = false;
    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule.name === row.rule),
    );
    filteredData = event.data?.filteredData || [];
    displayedData = [...filteredData];
    console.log("handle Message");
    calculateStats(displayedData);

    // Check if any pending new items passed the filters - only then play audio
    if (pendingNewItemIds.size > 0 && !muted && audio) {
      const hasNewFilteredItems = filteredData.some((item) =>
        pendingNewItemIds.has(item?.id),
      );

      if (hasNewFilteredItems) {
        console.log("New items passed filters - playing audio alert");
        audio?.play()?.catch((error) => {
          console.log("Audio play failed:", error);
        });
      } else {
        console.log("No new items passed filters - skipping audio");
      }

      // Clear pending IDs after processing
      pendingNewItemIds = new Set();
    }

    isLoaded = true;
  };

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
      ?.map((rule) => [rule.name, new Set(rule.value)]),
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

    // Trigger worker load
    shouldLoadWorker.set(true);
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

  const initialFeed = data?.getOptionsFlowFeed?.data ?? [];
  const totalOrders = data?.getOptionsFlowFeed?.totalOrders ?? 0;
  const dateString = initialFeed?.at(0)?.date;
  const nyseDate = new Date(`${dateString}T12:00:00Z`);
  const formattedNyseDate = nyseDate.toISOString().split("T")[0];

  let rawData = prepareInitialFlowData(initialFeed);

  let displayedData = [];

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
  let pendingNewItemIds: Set<string> = new Set(); // Track new item IDs from WebSocket for filtered audio alerts
  let notFound = false;
  let isLoaded = false;
  let historicalDataLoaded = false;

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
          // Switching to live mode
          if (selectedDate !== undefined) {
            selectedDate = undefined;
            await replaceRawData(data?.getOptionsFlowFeed?.data ?? []);
            displayedData = [...rawData];
            shouldLoadWorker.set(true);
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

        // Send initial orderList
        const orderList = rawData?.map((item) => item?.id) || [];
        const message = {
          type: "init",
          orderList: orderList,
        };
        socket.send(JSON.stringify(message));
      });

      socket.addEventListener("message", async (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle historical data batches (sent on init for fast load optimization)
          if (message?.type === "historical" && Array.isArray(message?.data)) {
            console.log(
              `Receiving historical data: ${message.progress}% complete, batch size: ${message.data.length}`,
            );

            rawData = await mergeRawData(message.data);

            // Only update UI on last batch or periodically to avoid jank
            if (message.isComplete) {
              console.log("Historical data loading complete");
              // Update the orderList to include all items
              const updatedOrderList = rawData?.map((item) => item?.id) || [];
              const updateMessage = {
                type: "update",
                orderList: updatedOrderList,
              };
              socket.send(JSON.stringify(updateMessage));

              // Process filters if needed
              if (ruleOfList?.length > 0 || filterQuery?.length > 0) {
                shouldLoadWorker.set(true);
              } else {
                displayedData = [...rawData];
                calculateStats(displayedData);
              }

              // Mark historical data as loaded
              historicalDataLoaded = true;

              // If market is closed, disconnect after getting historical data
              if (!$isOpen) {
                console.log(
                  "Market closed - disconnecting WebSocket after historical data",
                );
                modeStatus = false;
                disconnectWebSocket();
              }
            }
            return;
          }

          // Handle live updates (regular array format)
          const newData = Array.isArray(message) ? message : null;
          if (newData && newData.length > 0) {
            console.log(
              "Received new options flow data, length:",
              newData.length,
            );

            // Store new item IDs before merging (for filtered audio alerts)
            const newItemIds = new Set(
              newData.map((item) => item?.id).filter(Boolean),
            );

            rawData = await mergeRawData(newData);

            // Update the orderList to include new items
            const updatedOrderList = rawData?.map((item) => item?.id) || [];
            const updateMessage = {
              type: "update",
              orderList: updatedOrderList,
            };
            socket.send(JSON.stringify(updateMessage));

            // Process filters if needed
            if (ruleOfList?.length > 0 || filterQuery?.length > 0) {
              // Store pending new item IDs - audio will play in handleMessage if any pass filters
              pendingNewItemIds = newItemIds;
              shouldLoadWorker.set(true);
              console.log("Should load worker set to true");
            } else {
              // No filters active - play audio immediately for any new data
              displayedData = [...rawData];
              calculateStats(displayedData);
              console.log("Updating displayedData and calculating stats");

              // Play notification sound (no filters = all new data is relevant)
              if (!muted && audio) {
                console.log("Attempting to play audio (no filters active)...");
                audio?.play()?.catch((error) => {
                  console.log("Audio play failed:", error);
                });
              }
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });

      socket.addEventListener("close", (event) => {
        console.log("Options Flow WebSocket connection closed:", event.reason);
        socket = null;

        // Attempt to reconnect if market is open, live mode is on, and not destroyed
        if (
          $isOpen &&
          modeStatus &&
          !isComponentDestroyed &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          reconnectAttempts++;
          console.log(
            `Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`,
          );
          reconnectInterval = setTimeout(() => {
            connectWebSocket();
          }, 5000 * reconnectAttempts); // Exponential backoff
        }
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
  // For Pro users: connect to get historical data, stay connected if market is open
  $: if (data?.user?.tier === "Pro" && modeStatus) {
    connectWebSocket();
  } else if (data?.user?.tier !== "Pro" || !modeStatus) {
    console.log(
      "WebSocket disconnected: non-Pro user or historical mode selected.",
    );
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

  onMount(async () => {
    ruleOfList?.forEach((rule) => {
      ruleCondition[rule.name] =
        rule.condition || allRules[rule.name].defaultCondition;
      valueMappings[rule.name] = rule.value || allRules[rule.name].defaultValue;
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

    if (!sortWorker) {
      const SortingWorker = await import("./workers/sortingWorker?worker");
      sortWorker = new SortingWorker.default();
      sortWorker.onmessage = (event) => {
        const { id, sortedData } = event.data || {};
        if (typeof id === "number" && sortWorkerJobs.has(id)) {
          sortWorkerJobs.get(id)?.resolve(sortedData ?? []);
          sortWorkerJobs.delete(id);
        }
      };
      sortWorker.onerror = (error) => {
        console.error("Options Flow sorting worker error:", error);
        rejectPendingSortJobs(error);
      };
    }

    if (!syncWorker) {
      const SyncWorker = await import("./workers/filterWorker?worker");
      syncWorker = new SyncWorker.default();
      syncWorker.onmessage = handleMessage;
    }

    rawData = await sortFlowEntries(rawData);

    if (filterQuery?.length > 0 || ruleOfList?.length !== 0) {
      // Use non-debounced version for immediate initial load
    } else {
      // If no initial filter, set displayedData directly and mark as loaded
      displayedData = [...rawData];
      calculateStats(rawData);
    }

    await loadWorker();

    // Only schedule polling for non-Pro users
    if (data?.user?.tier !== "Pro") {
      scheduleNextUpdate(0); // Start polling immediately if market is open for non-Pro users
    }

    workerSubscription = shouldLoadWorker.subscribe(async (value) => {
      if (value) {
        await loadWorker();
        shouldLoadWorker.set(false); // Reset after worker is loaded
      }
    });

    isLoaded = true;
  });

  onDestroy(async () => {
    // --- Set the flag on destroy ---
    isComponentDestroyed = true;
    // --- Clear any pending timeout on destroy ---
    clearScheduledUpdate();
    // --- Disconnect WebSocket on destroy ---
    disconnectWebSocket();
    workerSubscription?.();
    workerSubscription = null;

    if (sortWorker) {
      sortWorker.terminate();
      rejectPendingSortJobs(new Error("Sorting worker terminated"));
      sortWorker = undefined;
    }

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
    // Create a delay using setTimeout wrapped in a Promise
    if (data?.user?.tier === "Pro") {
      modeStatus = false;
      isLoaded = false;

      // Disconnect WebSocket when viewing historical data
      console.log("Viewing historical data - disconnecting WebSocket");
      disconnectWebSocket();

      displayRules = allRows?.filter((row) =>
        ruleOfList.some((rule) => rule.name === row.rule),
      );
      displayedData = [];
      calculateStats(displayedData);

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Make the POST request after the delay
      const convertDate = new Date(df.format(selectedDate?.toDate()));
      const year = convertDate?.getFullYear();
      const month = String(convertDate?.getMonth() + 1).padStart(2, "0");
      const day = String(convertDate?.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      if (formattedDate === formattedNyseDate) {
        await replaceRawData(data?.getOptionsFlowFeed?.data ?? []);
        if (rawData?.length !== 0) {
          shouldLoadWorker.set(true);
        }
      } else {
        const postData = { selectedDate: formattedDate };

        try {
          const response = await fetch("/api/options-historical-flow", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(postData),
          });

          const historicalData = await response?.json();
          await replaceRawData(historicalData ?? []);
          if (rawData?.length !== 0) {
            shouldLoadWorker.set(true);
          }
        } catch (error) {
          console.error("Error fetching historical flow:", error);
          rawData = [];
        } finally {
          isLoaded = true;
        }
      }
    } else {
      goto("/pricing");
    }
  };

  function handleInput(event) {
    filterQuery = event.target.value;

    setTimeout(() => {
      shouldLoadWorker.set(true);
    }, 0);
  }

  function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }

  const debouncedHandleInput = debounce(handleInput, 300);

  $: {
    if (searchTerm) {
      filteredRows = allRows?.filter((row) =>
        row?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
      );
    }
  }

  $: {
    if (ruleOfList) {
      const ruleToUpdate = ruleOfList?.find((rule) => rule?.name === ruleName);
      if (ruleToUpdate) {
        ruleToUpdate.value = valueMappings[ruleToUpdate.name];
        ruleToUpdate.condition = ruleCondition[ruleToUpdate.name];
        ruleOfList = [...ruleOfList];
        //shouldLoadWorker.set(true);
      }
    }
  }
</script>

<SEO
  title="Options Flow - Real-Time  Options Activity & Smart Money Tracking "
  description="Track real-time options flow and  options activity from institutional traders. Monitor smart money movements, large block trades, and options sweeps for TSLA, NVDA, SPY and all US stocks. Free options flow scanner with live alerts."
  keywords="options flow,  options activity, smart money, options sweeps, institutional trading, options scanner, block trades, options alerts, dark pool options, call flow, put flow"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Options Flow Scanner",
    description: "Real-time options flow tracking and  activity scanner",
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
      description: "Free real-time options flow tracking",
    },
    featureList: [
      "Real-time options flow",
      "Smart money tracking",
      "Block trade monitoring",
      "Options sweep alerts",
      "Institutional flow analysis",
    ],
  }}
/>

<section class="overflow-y-auto mb-10 text-gray-700 dark:text-zinc-200">
  <div
    class="w-full max-w-screen sm:max-w-7xl sm:max-w-[1400px] flex justify-center items-center p-3 sm:p-0"
  >
    <div class="w-full m-auto min-h-screen">
      <!--
        <div class="text-sm sm:text-[1rem] breadcrumbs mb-5">
          <ul>
            <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
            <li class="text-muted dark:text-gray-300">Options Flow</li>
          </ul>
        </div>
        -->
      <div class="sm:rounded">
        <div class="flex flex-col md:flex-row items-start md:items-center mb-5">
          <div
            class="w-full flex flex-col sm:flex-row items-start sm:items-center sm:mt-4"
          >
            <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Options Flow
            </h1>
            <span
              class="inline-block text-xs sm:text-sm font-medium sm:ml-2 mt-3 text-gray-500 dark:text-zinc-400"
            >
              {(data?.user?.tier === "Pro"
                ? displayedData?.length
                : totalOrders
              )?.toLocaleString("en-US")} Contracts Found
            </span>
          </div>

          <div class="flex flex-row items-center w-full mt-5 justify-end">
            <div class="flex w-full sm:w-[50%] sm:ml-3 md:block md:w-auto">
              <div
                class="hidden text-sm sm:text-[1rem] font-semibold md:block sm:mb-1"
              >
                Saved Filters
              </div>
              <div class="relative inline-block text-left grow">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="min-w-[110px]  w-full border-gray-300 dark:border-gray-600 border bg-black dark:bg-default sm:hover:bg-default dark:sm:hover:bg-primary text-white ease-out flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                    >
                      <span class="truncate max-w-48"
                        >{selectedStrategy?.length !== 0
                          ? strategyList?.find(
                              (item) => item.id === selectedStrategy,
                            )?.title
                          : "Select Filter"}</span
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
                    class="w-full max-w-56 h-fit max-h-72 overflow-y-auto scroller"
                  >
                    <DropdownMenu.Label
                      class="text-muted dark:text-gray-400 font-normal"
                    >
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          on:click={() => {
                            removeList = true;
                            handleCreateStrategy();
                          }}
                          builders={[builder]}
                          class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap   bg-[#0909B] focus:outline-hidden "
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
                          <div class="text-sm text-start">New Filter</div>
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
                            ? 'bg-gray-300 dark:bg-primary'
                            : ''} cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                        >
                          {item?.title?.length > 20
                            ? item?.title?.slice(0, 20) + "..."
                            : item?.title} ({item?.rules?.length})

                          <label
                            for="deleteStrategy"
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
          class="rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-100 dark:bg-primary p-2"
        >
          <div
            class="flex flex-col sm:flex-row items-center pt-3 sm:pt-1 pb-3 sm:border-b sm:border-gray-300 dark:border-gray-600"
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
                  class="rounded-full w-10 h-10 relative text-white bg-[#000] flex items-center justify-center"
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
                class=" text-xs sm:text-sm sm:text-lg {!mode
                  ? ''
                  : 'text-muted dark:text-gray-400'} mr-3"
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
                  class="relative w-11 h-6 bg-gray-600 focus:outline-hidden peer-focus:outline-hidden peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:rtl:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A96E]"
                ></div>
              </label>

              <div class=" ml-3 flex flex-col items-start">
                <span
                  class="text-xs sm:text-sm sm:text-lg {modeStatus
                    ? ''
                    : 'text-muted dark:text-gray-400'}"
                >
                  Live Flow
                </span>
              </div>
            </div>

            <div class="sm:ml-auto w-full sm:w-fit pt-5">
              <div class="relative flex flex-col sm:flex-row items-center">
                <div
                  class="relative w-full sm:w-fit pl-3 sm:mr-5 mb-4 sm:mb-0 flex-auto text-center shadow bg-white dark:bg-secondary rounded border border-gray-300 dark:border-gray-600"
                >
                  <label class=" flex flex-row items-center">
                    <input
                      id="modal-search"
                      class="focus:outline-none sm:ml-2 text-[1rem] placeholder-gray-500 dark:placeholder-gray-300 border-transparent bg-white dark:bg-secondary focus:border-transparent focus:ring-0 flex items-center justify-center w-full px-0 py-1.5"
                      placeholder="Find..."
                      bind:value={filterQuery}
                      on:input={debouncedHandleInput}
                      autocomplete="off"
                    />
                    {#if filterQuery?.length > 0}
                      <label
                        class="cursor-pointer"
                        on:click={() => {
                          filterQuery = "";
                          shouldLoadWorker.set(true);
                        }}
                      >
                        <svg
                          class="ml-auto h-6 w-6 inline-block mr-3"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          ><path
                            fill="currentColor"
                            d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                          /></svg
                        >
                      </label>
                    {:else}
                      <svg
                        class="ml-auto h-7 w-7 sm:h-8 sm:w-8 inline-block mr-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="m19.485 20.154l-6.262-6.262q-.75.639-1.725.989t-1.96.35q-2.402 0-4.066-1.663T3.808 9.503T5.47 5.436t4.064-1.667t4.068 1.664T15.268 9.5q0 1.042-.369 2.017t-.97 1.668l6.262 6.261zM9.539 14.23q1.99 0 3.36-1.37t1.37-3.361t-1.37-3.36t-3.36-1.37t-3.361 1.37t-1.37 3.36t1.37 3.36t3.36 1.37"
                        /></svg
                      >
                    {/if}
                  </label>
                  {#if notFound === true}
                    <span
                      class="absolute left-1 -bottom-6 label-text text-error text-[0.65rem] mt-2"
                    >
                      No Results Found
                    </span>
                  {/if}
                </div>

                <Popover.Root>
                  <Popover.Trigger asChild let:builder>
                    <Button
                      class=" w-full sm:w-[160px] truncate sm:mr-3 py-3 shadow text-white bg-[#000] border-gray-300 justify-center sm:justify-start text-center sm:text-left  border-none rounded"
                      builders={[builder]}
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      <span class="text-[1rem] sm:text-sm font-semibold">
                        {selectedDate
                          ? df.format(selectedDate?.toDate())
                          : "Pick a date"}
                      </span>
                    </Button>
                  </Popover.Trigger>

                  <Popover.Content
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    alignOffset={0}
                    class="w-auto p-0 border-gray-500 text-muted dark:text-white bg-white dark:bg-[#000]"
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
            class="mr-1 flex items-center justify-between lg:mr-2 pb-1.5 border-b border-gray-300 dark:border-gray-600 mt-1.5"
          >
            <button
              on:click={() => (showFilters = !showFilters)}
              class="flex cursor-pointer items-center text-lg sm:text-xl font-semibold"
              title="Hide Filter Area"
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
              {ruleOfList?.length} Filters
            </button>
            <div class="flex flex-row items-center ml-auto justify-start">
              <div class="flex items-center gap-1">
                <span class="inline-flex items-center text-xs">
                  <Zap class="w-3 h-3 mr-1" />
                  Realtime Options Data
                </span>
                <InfoModal
                  id="options-flow-info"
                  title="Realtime Options Data from OPRA"
                  content="Our options flow is powered by realtime OPRA data, the official consolidated feed for all U.S. listed options trades. This ensures every print you see is delivered directly from OPRA in realtime, giving you institutional-grade visibility into large trades, sweeps, unusual activity, and premium flow as it happens. By relying on OPRA’s high-integrity trade stream, you gain faster insights, cleaner data, and a more accurate view of where smart money is moving in the options market."
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
                class=" inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none py-2 pl-3 pr-4 font-semibold shadow bg-default text-white sm:hover:bg-black dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
                      class="w-4 h-4 text-muted dark:text-gray-200"
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
                    class="block w-full lg:w-64 py-2.5 shadow bg-white placeholder:text-muted pl-10 text-[1rem] border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-[#2A2E39] dark:border-gray-800 dark:placeholder-gray-200 dark:text-white dark:focus:outline-none dark:focus:border-none"
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
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-[#2A2E39] border border-gray-300 dark:border-gray-800 rounded-md shadow-lg max-h-64 overflow-y-auto"
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
                        class="cursor-pointer w-full px-2 py-2 flex flex-row items-center sm:hover:bg-gray-100 dark:sm:hover:bg-gray-600 {index ===
                        selectedQuickSearchIndex
                          ? 'bg-gray-100 dark:bg-gray-600'
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

                        <label class="text-left text-sm sm:text-[0.9rem]">
                          <div
                            class="font-medium text-gray-900 dark:text-white"
                          >
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
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-[#2A2E39] border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No available filters found
                  </div>
                {/if}
              </div>

              {#if data?.user}
                <label
                  for={!data?.user ? "userLogin" : ""}
                  on:click={() => handleSave(true)}
                  class="text-[0.95rem] sm:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold text-white bg-black sm:hover:bg-default dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden"
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
                    for={!data?.user
                      ? "userLogin"
                      : ["Pro"]?.includes(data?.user?.tier)
                        ? "addStrategy"
                        : ""}
                    on:click={() => {
                      if (!["Pro"]?.includes(data?.user?.tier) && data?.user) {
                        toast.info("Available only to Pro Member", {
                          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                        });
                      }
                    }}
                    class="text-[0.95rem] sm:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold text-white bg-black sm:hover:bg-default dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden"
                  >
                    <Copy class="w-4 h-4 inline-block mr-2" />
                    <div>Save as New</div>
                  </label>
                {/if}
              {/if}

              {#if ruleOfList?.length !== 0}
                <label
                  on:click={handleResetAll}
                  class="text-[0.95rem] lg:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold text-white bg-black sm:hover:bg-default dark:bg-[#000] dark:sm:hover:text-red-500 ease-out focus:outline-hidden"
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
              class="sm:grid sm:gap-x-2.5 md:grid-cols-2 lg:grid-cols-3 w-full mt-3 border-t border-b border-gray-300 dark:border-gray-600"
            >
              {#each displayRules as row (row?.rule)}
                <!--Start Added Rules-->
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
                      class="mr-1.5 cursor-pointer text-muted dark:text-gray-300 sm:hover:text-red-800 dark:sm:hover:text-red-400 focus:outline-hidden"
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
                              class="shadow h-[40px] bg-default sm:hover:bg-black text-white flex flex-row justify-between items-center w-[150px] xs:w-[140px] sm:w-[150px] px-3 rounded truncate"
                            >
                              <span class="truncate ml-2 text-sm">
                                {#if valueMappings[row?.rule] === "any"}
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
                            class="w-64 min-h-auto max-h-72 overflow-y-auto scroller"
                          >
                            {#if !categoricalRules?.includes(row?.rule)}
                              <DropdownMenu.Label
                                class="absolute mt-2 h-11 border-gray-300 dark:border-gray-800 border-b -top-1 z-20 fixed sticky bg-white dark:bg-default"
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
                                          class="w-fit -mt-1 -ml-2  flex flex-row justify-between items-center "
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
                                      <DropdownMenu.Content>
                                        <DropdownMenu.Group>
                                          {#each ["Over", "Under", "Between", "Exactly"] as item}
                                            <DropdownMenu.Item
                                              on:click={() =>
                                                changeRuleCondition(
                                                  row?.rule,
                                                  item,
                                                )}
                                              class="cursor-pointer text-[1rem] font-normal"
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
                                        class="ios-zoom-fix block max-w-[3.5rem] rounded-sm placeholder:text-muted dark:placeholder:text-gray-400 dark:text-gray-200 font-normal p-1 text-sm shadow focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-primary"
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
                                        class="ios-zoom-fix block max-w-[3.5rem] rounded-sm placeholder:text-muted dark:placeholder:text-gray-400 dark:text-gray-200 font-normal p-1 text-sm shadow focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-primary"
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
                                      class="ios-zoom-fix block max-w-[4.8rem] rounded-sm placeholder:text-muted dark:placeholder:text-gray-400 dark:placeholder:text-gray-200 font-normal p-1 text-sm shadow focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-primary"
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
                                          class="size-6 cursor-pointer"
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
                                        ></button
                                      >
                                      <button
                                        on:click={() =>
                                          stepSizeValue(
                                            valueMappings[row?.rule],
                                            "minus",
                                          )}
                                        ><svg
                                          class="size-6 cursor-pointer"
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
                                        ></button
                                      >
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
                                        class="sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                      >
                                        <button
                                          on:click={() => {
                                            handleChangeValue([
                                              row?.step[index],
                                              row?.step[index + 1],
                                            ]);
                                          }}
                                          class="block w-full cursor-pointer border-b border-gray-300 dark:border-gray-600 px-4 py-1.5 text-left text-sm rounded last:border-0 focus:outline-hidden"
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
                                      class="sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                    >
                                      <button
                                        on:click={() => {
                                          handleChangeValue(newValue);
                                        }}
                                        class="block w-full cursor-pointer border-b border-gray-300 dark:border-gray-600 px-4 py-1.5 text-left text-sm rounded last:border-0 focus:outline-hidden"
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
                                    class="sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
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

        {#if isLoaded}
          {#if displayedData?.length > 0}
            <div class="w-full mt-5 m-auto flex justify-center items-center">
              <div
                class="w-full grid grid-cols-1 lg:grid-cols-4 gap-y-3 gap-x-3"
              >
                <!--Start Flow Sentiment-->
                <div
                  class=" shadow flex flex-col w-full px-5 py-3 bg-gray-100 dark:bg-primary border border-gray-300 dark:border-gray-600 rounded h-20"
                >
                  <div class="flex flex-col items-start justify-between mb-2">
                    {#if data?.user?.tier === "Pro"}
                      <div
                        class="flex items-center gap-3 text-[11px] sm:text-xs mb-1 mt-1"
                      >
                        <div class="flex items-center gap-1">
                          <span class="w-2 h-2 rounded-full bg-[#00FC50]"
                          ></span>
                          <span class="text-muted dark:text-gray-300"
                            >Bullish</span
                          >
                          <span
                            class="font-semibold text-emerald-600 dark:text-emerald-400"
                            >{formatPremium(displayBullishPremium || 0)}</span
                          >
                        </div>
                        <div class="flex items-center gap-1">
                          <span class="w-2 h-2 rounded-full bg-[#FF2F1F]"
                          ></span>
                          <span class="text-muted dark:text-gray-300"
                            >Bearish</span
                          >
                          <span
                            class="font-semibold text-rose-600 dark:text-rose-400"
                            >{formatPremium(displayBearishPremium || 0)}</span
                          >
                        </div>
                      </div>
                      <div class="flex flex-col w-full mt-2">
                        <div
                          class="relative flex w-full h-6 rounded overflow-hidden bg-gray-300 dark:bg-gray-700/80"
                        >
                          <div
                            class="bg-[#00FC50] h-full transition-all duration-300 flex items-center justify-center"
                            style="width: {bullishPercentage}%"
                          >
                            {#if bullishPercentage >= 15}
                              <span
                                class="text-[10px] sm:text-xs font-semibold text-gray-900"
                                >{bullishPercentage}%</span
                              >
                            {/if}
                          </div>
                          <div
                            class="bg-[#FF2F1F] h-full transition-all duration-300 flex items-center justify-center"
                            style="width: {bearishPercentage}%"
                          >
                            {#if bearishPercentage >= 15}
                              <span
                                class="text-[10px] sm:text-xs font-semibold text-white"
                                >{bearishPercentage}%</span
                              >
                            {/if}
                          </div>
                        </div>
                      </div>
                    {:else}
                      <div class="flex flex-col items-start">
                        <span
                          class="text-xs text-muted dark:text-gray-200 mt-1.5"
                          >Flow Sentiment</span
                        >
                        {#if data?.user?.tier === "Pro"}
                          <span class="text-start text-lg font-semibold mt-1">
                            {putCallRatio?.toFixed(3)}
                          </span>
                        {:else}
                          <a href="/pricing" class="flex mt-2">
                            <svg
                              class="size-5 text-muted dark:text-[#fff]"
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
                  class="shadow flex flex-row items-center w-full px-5 py-3 bg-gray-100 dark:bg-primary border border-gray-300 dark:border-gray-600 rounded h-20"
                >
                  <div class="flex flex-col items-start">
                    <span class="text-xs text-muted dark:text-gray-200"
                      >Put to call</span
                    >
                    {#if data?.user?.tier === "Pro"}
                      <span class="text-start text-lg font-semibold mt-1">
                        {putCallRatio?.toFixed(3)}
                      </span>
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-muted dark:text-[#fff]"
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
                            class="size-4 text-muted dark:text-[#fff]"
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
                  class=" shadow flex flex-row items-center w-full px-5 py-3 bg-gray-100 dark:bg-primary border border-gray-300 dark:border-gray-600 rounded h-20"
                >
                  <div class="flex flex-col items-start">
                    <div class="flex flex-row items-center gap-2">
                      <span class="text-xs text-muted dark:text-gray-200"
                        >Call flow</span
                      >
                      {#if data?.user?.tier === "Pro"}
                        <span
                          class="text-sm font-semibold text-emerald-600 dark:text-emerald-400"
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
                          class="size-5 text-muted dark:text-[#fff]"
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
                            class="size-4 text-muted dark:text-[#fff]"
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
                  class=" shadow flex flex-row items-center w-full px-5 py-3 bg-gray-100 dark:bg-primary border border-gray-300 dark:border-gray-600 rounded h-20"
                >
                  <div class="flex flex-col items-start">
                    <div class="flex flex-row items-center gap-2">
                      <span class="text-xs text-muted dark:text-gray-200"
                        >Put flow</span
                      >
                      {#if data?.user?.tier === "Pro"}
                        <span
                          class="text-sm font-semibold text-rose-600 dark:text-rose-400"
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
                          class="size-5 text-muted dark:text-[#fff]"
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
                        <span class="text-center text-xs"
                          >{putPercentage}.0%</span
                        >
                      {:else}
                        <a href="/pricing" class="flex">
                          <svg
                            class="size-4 text-muted dark:text-[#fff]"
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

            <!-- Page wrapper -->
            <div class="flex w-full m-auto h-full overflow-hidden">
              <div
                class="mt-8 w-full overflow-x-auto h-[900px] overflow-hidden"
              >
                <OptionsFlowTable
                  {data}
                  {optionsWatchlist}
                  {displayedData}
                  {filteredData}
                  {rawData}
                />
                <UpgradeToPro {data} display={true} />
              </div>
            </div>
          {:else}
            <Infobox
              text={`No data found based on filter(s) selected. Please adjust your filters and try again.`}
            />
          {/if}
        {:else}
          <div class="flex justify-center items-center h-80">
            <div class="relative">
              <label
                class="shadow bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
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
    class="modal-box text-muted dark:text-white relative bg-gray-100 dark:bg-primary z-20 mx-2 min-h-[30vh] h-[800px] rounded opacity-100 border border-gray-300 dark:border-gray-600 bp:mx-3 sm:mx-4 w-full max-w-6xl overflow-y-auto"
  >
    <div class="relative flex flex-col w-full">
      <!-- Sticky Header -->

      <div
        class="fixed w-full h-fit sticky -top-6 z-40 bg-gray-100 dark:bg-primary shadow opacity-100 pb-6 pt-5 border-gray-300 dark:border-gray-600 border-b"
      >
        <div class="flex flex-row items-center justify-between mb-2">
          <h1 class=" text-[1rem] sm:text-xl font-semibold">
            Select filters ({allRows?.length} total)
          </h1>
          <label
            for="ruleModal"
            class="inline-block cursor-pointer absolute right-0 top-3 text-[1.3rem] sm:text-[1.8rem]"
          >
            <svg
              class="w-6 h-6 sm:w-8 sm:h-8"
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
                class="w-4 h-4 text-muted dark:text-gray-200"
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
                class="cursor-pointer text-muted dark:text-gray-200 dark:sm:hover:text-white"
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
                ></button
              >
            </div>

            <input
              autocomplete="off"
              id="search"
              class="focus:outline-none placeholder-gray-500 dark:placeholder-gray-300 block w-full p-2 ps-10 text-sm text-muted dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-primary border border-blue-500"
              placeholder="Search"
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
            Nothing found
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
  <label for="addStrategy" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 rounded border
        bg-white dark:bg-secondary border border-gray-300 dark:border-gray-800"
  >
    <h1 class="text-2xl font-bold">New Filter</h1>

    <form
      on:submit={createStrategy}
      method="POST"
      class="space-y-2 pt-5 pb-10 sm:pb-5"
    >
      <Input
        id="title"
        type="text"
        errors=""
        label="Filter Name"
        required={true}
      />

      <button
        type="submit"
        class="cursor-pointer mt-2 py-2.5 bg-black dark:bg-[#fff] dark:sm:hover:bg-gray-300 duration-100 w-full rounded m-auto text-white dark:text-black font-semibold text-md"
      >
        Create Filter
      </button>
    </form>
  </div>
</dialog>

<!--End Add Strategy Modal-->

<!--Start Delete Strategy Modal-->
<input type="checkbox" id="deleteStrategy" class="modal-toggle" />

<dialog id="deleteStrategy" class="modal modal-bottom sm:modal-middle">
  <label for="deleteStrategy" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 rounded border
          bg-white dark:bg-secondary border border-gray-300 dark:border-gray-800"
  >
    <h3 class="text-lg font-medium mb-2">Delete Filter</h3>
    <p class="text-sm mb-6">
      Are you sure you want to delete this filter? This action cannot be undone.
    </p>
    <div class="flex justify-end space-x-3">
      <label
        for="deleteStrategy"
        class="cursor-pointer px-4 py-2 rounded text-sm font-medium
              transition-colors duration-100
              bg-gray-600 text-white dark:bg-white dark:text-black"
        tabindex="0">Cancel</label
      ><label
        for="deleteStrategy"
        on:click={handleDeleteStrategy}
        class="cursor-pointer px-4 py-2 rounded text-sm font-medium
              transition-colors duration-100 flex items-center
              bg-red-600 text-white sm:hover:bg-red-700
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
        >Delete Filter</label
      >
    </div>
  </div>
</dialog>

<!--End Delete Strategy Modal-->
