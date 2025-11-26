<script lang="ts">
  import notifySound from "$lib/audio/options-flow-reader.mp3";
  import { getCache, setCache, isOpen } from "$lib/store";

  import { onMount, onDestroy } from "svelte";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";

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

  import UnusualOrderFlowTable from "$lib/components/Table/UnusualOrderFlowTable.svelte";
  import { writable } from "svelte/store";

  export let data;
  let shouldLoadWorker = writable(false);

  let timeoutId = null;
  let isComponentDestroyed = false;
  let removeList = false;

  // WebSocket variables
  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectInterval: ReturnType<typeof setTimeout> | null = null;
  const maxReconnectAttempts = 5;
  let muted = false;
  let audio: HTMLAudioElement | null = null;

  // Auto-enable live mode when market is open and user is Pro
  $: modeStatus = $isOpen === true && data?.user?.tier === "Pro" ? true : false;

  let strategyList = data?.getAllStrategies || [];
  let selectedStrategy = strategyList?.at(0)?.id ?? "";

  let ruleOfList = strategyList?.at(0)?.rules ?? [];
  let displayRules = [];
  let filteredData = [];
  let filterQuery =
    data?.user?.tier === "Pro" ? $page.url.searchParams.get("query") || "" : "";
  let pagePathName = $page?.url?.pathname;

  let syncWorker: Worker | undefined;
  let ruleName = "";
  let searchTerm = "";
  let showFilters = true;
  let filteredRows = [];

  let quickSearchTerm = "";
  let quickSearchResults = [];
  let showQuickSearchDropdown = false;
  let selectedQuickSearchIndex = -1;
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
  };

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
      shouldLoadWorker.set(true);
    }
  }

  async function handleResetAll() {
    ruleOfList = [];
    filteredData = [];
    ruleOfList = [...ruleOfList];
    ruleName = "";
    filterQuery = "";
    checkedItems = new Set();
    Object?.keys(allRules).forEach((ruleName) => {
      ruleCondition[ruleName] = allRules[ruleName].defaultCondition;
      valueMappings[ruleName] = allRules[ruleName].defaultValue;
    });
    displayRules = allRows?.filter((row) =>
      ruleOfList.some((rule) => rule.name === row.rule),
    );
    displayedData = rawData;
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

    checkedItems = new Set(
      ruleOfList
        ?.filter((rule) => categoricalRules?.includes(rule.name))
        ?.flatMap((rule) => rule.value),
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

      checkedItems = new Set(
        ruleOfList
          ?.filter((rule) => categoricalRules?.includes(rule.name))
          ?.flatMap((rule) => rule.value),
      );

      // Trigger the filter system
      shouldLoadWorker.set(true);

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
        checkedItems = new Set();
      }
      // else: "Save" or "Save as New" - ruleOfList already matches what was saved

      // Update displayed rules
      displayRules = allRows?.filter((row) =>
        ruleOfList?.some((rule) => rule.name === row.rule),
      );

      // Update checkedItems
      checkedItems = new Set(
        ruleOfList
          ?.filter((rule) => categoricalRules?.includes(rule.name))
          ?.flatMap((rule) => rule.value),
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
    quickSearchTerm = "";
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
    syncWorker.postMessage({ rawData, ruleOfList, filterQuery });
  };

  const handleMessage = (event) => {
    displayRules = allRows?.filter((row) =>
      ruleOfList.some((rule) => rule.name === row.rule),
    );
    filteredData = event.data?.filteredData ?? [];
    displayedData = filteredData;
    console.log("handle Message");
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

  let checkedItems = new Set(
    ruleOfList
      ?.filter((rule) => categoricalRules?.includes(rule.name))
      ?.flatMap((rule) => rule.value),
  );

  function isChecked(item) {
    return checkedItems.has(item);
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
    // Toggle checkedItems logic
    if (checkedItems.has(value)) {
      checkedItems.delete(value);
    } else {
      checkedItems.add(value);
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

  const nyseDate = data?.getFlowData?.at(0)?.date
    ? new Date(data.getFlowData.at(0).date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
      })
    : null;

  let rawData = data?.getFlowData?.filter((item) =>
    Object?.values(item)?.every(
      (value) =>
        value !== null &&
        value !== undefined &&
        (typeof value !== "object" ||
          Object?.values(value)?.every(
            (subValue) => subValue !== null && subValue !== undefined,
          )),
    ),
  );

  let displayedData = [];

  // Stats variables
  let totalVolume = 0;
  let totalValue = 0;
  let darkPoolCount = 0;
  let blockOrderCount = 0;
  let darkPoolPercentage = 0;
  let blockOrderPercentage = 0;
  let stockCount = 0;
  let etfCount = 0;
  let stockPercentage = 0;
  let etfPercentage = 0;

  // Reactive stats calculation
  $: {
    const stats = displayedData?.reduce(
      (acc, item) => {
        const size = item?.size || 0;
        const premium = item?.premium || 0;

        acc.totalVolume += size;
        acc.totalValue += premium;

        if (item?.transactionType === "DP") {
          acc.darkPoolCount += 1;
        } else if (item?.transactionType === "B") {
          acc.blockOrderCount += 1;
        }

        if (item?.assetType === "Stock") {
          acc.stockCount += 1;
        } else if (item?.assetType === "ETF") {
          acc.etfCount += 1;
        }

        return acc;
      },
      {
        totalVolume: 0,
        totalValue: 0,
        darkPoolCount: 0,
        blockOrderCount: 0,
        stockCount: 0,
        etfCount: 0,
      },
    );

    totalVolume = stats?.totalVolume || 0;
    totalValue = stats?.totalValue || 0;
    darkPoolCount = stats?.darkPoolCount || 0;
    blockOrderCount = stats?.blockOrderCount || 0;
    stockCount = stats?.stockCount || 0;
    etfCount = stats?.etfCount || 0;

    const totalTransactions = darkPoolCount + blockOrderCount;
    darkPoolPercentage =
      totalTransactions !== 0
        ? Math.floor((darkPoolCount / totalTransactions) * 100)
        : 0;
    blockOrderPercentage =
      totalTransactions !== 0 ? 100 - darkPoolPercentage : 0;

    const totalAssets = stockCount + etfCount;
    stockPercentage =
      totalAssets !== 0 ? Math.floor((stockCount / totalAssets) * 100) : 0;
    etfPercentage = totalAssets !== 0 ? 100 - stockPercentage : 0;
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

  // WebSocket helper functions
  function buildFlowKey(item: any): string {
    if (item?.trackingID) {
      return String(item.trackingID);
    }
    const compositeKey = [
      item?.ticker ?? "",
      item?.date ?? "",
      item?.time ?? "",
      item?.size ?? "",
      item?.premium ?? "",
    ]
      .map((value) => String(value))
      .join("-");
    return compositeKey.length > 0 ? compositeKey : JSON.stringify(item);
  }

  function dedupeFlowEntries(entries: any[] = []): any[] {
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const entry of entries) {
      const key = buildFlowKey(entry);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(entry);
    }
    return deduped;
  }

  function sortFlowEntriesByTime(entries: any[] = []): any[] {
    return [...entries].sort((a, b) => {
      const dateA = a?.date ?? "";
      const dateB = b?.date ?? "";
      const timeA = a?.time ?? "00:00:00";
      const timeB = b?.time ?? "00:00:00";
      const dtA = `${dateA} ${timeA}`;
      const dtB = `${dateB} ${timeB}`;
      return dtB.localeCompare(dtA); // Descending order (newest first)
    });
  }

  async function mergeRawData(entries: any[] = []) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return rawData ?? [];
    }
    const combined = dedupeFlowEntries([
      ...entries,
      ...(Array.isArray(rawData) ? rawData : []),
    ]);
    rawData = sortFlowEntriesByTime(combined);
    return rawData;
  }

  function connectWebSocket() {
    if (data?.user?.tier !== "Pro" || !data?.wsURL || !data?.wsToken) {
      return;
    }

    if (
      socket &&
      (socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    try {
      // Include token in WebSocket URL for authentication
      const wsUrlWithToken = `${data.wsURL}/unusual-order?token=${encodeURIComponent(data.wsToken)}`;
      socket = new WebSocket(wsUrlWithToken);

      socket.addEventListener("open", () => {
        console.log("Unusual Order Flow WebSocket connection opened");
        reconnectAttempts = 0;

        const orderList = rawData?.map((item) => item?.trackingID) || [];
        const message = {
          type: "init",
          orderList: orderList,
        };
        socket?.send(JSON.stringify(message));
      });

      socket.addEventListener("message", async (event) => {
        try {
          const newData = JSON.parse(event.data);

          if (Array.isArray(newData) && newData.length > 0) {
            console.log(
              "Received new unusual order flow data, length:",
              newData.length,
            );

            rawData = await mergeRawData(newData);

            const updatedOrderList =
              rawData?.map((item) => item?.trackingID) || [];
            const updateMessage = {
              type: "update",
              orderList: updatedOrderList,
            };
            socket?.send(JSON.stringify(updateMessage));

            if (ruleOfList?.length > 0 || filterQuery?.length > 0) {
              shouldLoadWorker.set(true);
            } else {
              displayedData = [...rawData];
            }

            if (!muted && audio) {
              audio?.play()?.catch((error) => {
                console.log("Audio play failed:", error);
              });
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });

      socket.addEventListener("close", (event) => {
        console.log(
          "Unusual Order Flow WebSocket connection closed:",
          event.reason,
        );
        socket = null;

        if (
          $isOpen &&
          modeStatus &&
          !isComponentDestroyed &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect (${reconnectAttempts}/5)...`);

          reconnectInterval = setTimeout(() => {
            connectWebSocket();
          }, 5000 * reconnectAttempts);
        }
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
  $: if ($isOpen && data?.user?.tier === "Pro" && modeStatus) {
    console.log(
      "Market is open, user is Pro, and live mode is active. Connecting...",
    );
    connectWebSocket();
  } else {
    console.log("WebSocket disconnected...");
    disconnectWebSocket();
  }

  onMount(async () => {
    // Load muted state from localStorage
    const savedMutedState = localStorage.getItem("unusualOrderFlowMuted");
    if (savedMutedState !== null) {
      muted = JSON.parse(savedMutedState);
    }

    ruleOfList?.forEach((rule) => {
      ruleCondition[rule.name] =
        rule.condition || allRules[rule.name].defaultCondition;
      valueMappings[rule.name] = rule.value || allRules[rule.name].defaultValue;
    });

    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule?.name === row?.rule),
    );

    audio = new Audio(notifySound);

    if (!syncWorker) {
      const SyncWorker = await import("./workers/filterWorker?worker");
      syncWorker = new SyncWorker.default();
      syncWorker.onmessage = handleMessage;
    }

    if (filterQuery?.length > 0 || ruleOfList?.length !== 0) {
      // Use non-debounced version for immediate initial load
    } else {
      // If no initial filter, set displayedData directly and mark as loaded
      displayedData = [...rawData];
    }

    await loadWorker();

    shouldLoadWorker.subscribe(async (value) => {
      if (value) {
        isLoaded = false;
        await loadWorker();
        shouldLoadWorker.set(false); // Reset after worker is loaded
        isLoaded = true;
      }
    });

    isLoaded = true;
  });

  onDestroy(() => {
    isComponentDestroyed = true;
    disconnectWebSocket();

    if (syncWorker) {
      syncWorker.terminate();
      syncWorker = undefined;
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
        shouldLoadWorker.set(true);
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
  title="Unusual Order Flow | Dark Pool & Block Trade Tracker"
  description="Monitor real-time dark pool trades and block orders from institutional investors. Track unusual order flow, large hidden trades, and smart money activity across stocks and ETFs with advanced filtering."
  keywords="unusual order flow, dark pool trades, block trades, institutional trading, smart money flow, hidden trades, large block orders, institutional investors, hedge fund activity, dark pool scanner, real-time order flow, SIP data"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Unusual Order Flow Scanner",
    description:
      "Real-time dark pool and block trade monitoring tool for tracking institutional order flow and smart money activity",
    url: "https://stocknear.com/unusual-order-flow",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Real-time dark pool trade monitoring",
      "Block order tracking",
      "Institutional order flow analysis",
      "Exchange-level filtering",
      "Stock and ETF asset filtering",
      "Premium and volume analysis",
      "Size to volume ratio screening",
      "Historical order flow data",
      "Custom filter strategies",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<body class="overflow-y-auto">
  <section
    class="w-full max-w-screen sm:max-w-7xl sm:max-w-[1400px] flex justify-center items-center pb-20 mt-5 sm:mt-0 px-3 sm:px-0"
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
      <div class="flex flex-col md:flex-row items-start md:items-center mb-5">
        <div
          class="w-full flex flex-col sm:flex-row items-start sm:items-center sm:mt-4"
        >
          <h1 class="text-2xl sm:text-3xl font-semibold">Unusual Order Flow</h1>
          <span
            class="inline-block text-xs sm:text-sm font-semibold sm:ml-2 mt-3"
          >
            {displayedData?.length?.toLocaleString("en-US")} Orders Found
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
                    class="min-w-[110px] w-full border-gray-300 dark:border-gray-600 border bg-black dark:bg-default sm:hover:bg-default dark:sm:hover:bg-primary text-white ease-out flex flex-row justify-between items-center px-3 py-2 rounded truncate"
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
                        class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap bg-[#0909B] focus:outline-hidden"
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
                        class="whitespace-nowrap {item?.id === selectedStrategy
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
          class="flex flex-col sm:flex-row items-center pb-3 sm:border-b sm:border-gray-300 dark:border-gray-600"
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
              class="live-flow-driver inline-flex items-center cursor-pointer focus-none focus:outline-hidden"
            >
              <input
                on:click={(e) => {
                  toggleMode();
                }}
                type="checkbox"
                checked={modeStatus}
                value={modeStatus}
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
                class="search-driver relative w-full sm:w-fit pl-3 sm:mr-5 mb-4 sm:mb-0 flex-auto text-center shadow bg-white dark:bg-secondary rounded border border-gray-300 dark:border-gray-600"
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
              </div>

              <Popover.Root>
                <Popover.Trigger asChild let:builder>
                  <Button
                    on:click={() =>
                      toast?.info("Feature is coming soon 🔥", {
                        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
                      })}
                    class="date-picker-driver font-semibold w-full sm:w-[160px] truncate sm:mr-3 py-3 shadow bg-black text-white  justify-center sm:justify-start text-center sm:text-left  border-none rounded"
                    builders={[builder]}
                  >
                    <CalendarIcon class="mr-2 h-4 w-4 text-white" />
                    Pick a Date
                  </Button>
                </Popover.Trigger>
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
                15 Min Delayed
              </span>
              <InfoModal
                id="sip-data-info"
                title="15 min Delayed SIP Data"
                content="Intrinio’s SIP feed delivers high-quality, consolidated U.S. equity data from all major exchanges — including trades, quotes, and NBBO. The 15-minute delay provides rich market insight with full exchange coverage."
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
                class="mt-3 sm:mt-0 w-full sm:w-fit inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none py-2 pl-3 pr-4 font-semibold shadow bg-default text-white sm:hover:bg-black dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
              <div class="w-full sm:w-fit relative">
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
                    class="block w-full lg:w-64 py-2 shadow bg-white placeholder:text-muted pl-10 text-[1rem] border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-[#2A2E39] dark:border-gray-800 dark:placeholder-gray-200 dark:text-white dark:focus:outline-none dark:focus:border-none"
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
                  class="w-full sm:w-fit text-[0.95rem] cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold text-white bg-black sm:hover:bg-default dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden"
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
                    class="w-full sm:w-fit text-[0.95rem] cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold text-white bg-black sm:hover:bg-default dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden"
                  >
                    <Copy class="w-4 h-4 inline-block mr-2" />
                    <div>Save as New</div>
                  </label>
                {/if}
              {/if}

              {#if ruleOfList?.length !== 0}
                <label
                  on:click={handleResetAll}
                  class="w-full sm:w-fit text-[0.95rem] cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold text-white bg-black sm:hover:bg-default dark:bg-[#000] dark:sm:hover:text-red-500 ease-out focus:outline-hidden"
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
          </div>

          <div
            class="sm:grid sm:gap-x-2.5 md:grid-cols-2 lg:grid-cols-3 w-full mt-3 border-t border-b border-gray-300 dark:border-gray-600"
          >
            {#each displayRules as row (row?.rule)}
              <!--Start Added Rules-->
              <div
                class="flex items-center justify-between space-x-2 px-1 py-1.5 text-[0.95rem] leading-tight"
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
                            class="bg-[#000] text-white shadow h-[40px] flex flex-row justify-between items-center w-[150px] xs:w-[140px] sm:w-[150px] px-3  rounded truncate"
                          >
                            <span
                              class="truncate ml-2 text-sm font-semibold dark:font-normal"
                            >
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
                                        class="w-fit -mt-1 -ml-2 flex flex-row justify-between items-center "
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
                                      class="ios-zoom-fix block max-w-[3.5rem] rounded-sm placeholder:text-muted dark:placeholder:text-gray-300 dark:text-gray-200 font-normal p-1 text-sm shadow focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-primary"
                                    />
                                    <span class=" text-[1rem] font-normal mt-1">
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
                                      class="ios-zoom-fix block max-w-[3.5rem] rounded-sm placeholder:text-muted dark:placeholder:text-gray-300 dark:text-gray-200 font-normal p-1 text-sm shadow focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-primary"
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
                                    class="ios-zoom-fix block max-w-[4.8rem] rounded-sm placeholder:text-muted dark:placeholder:text-gray-200 font-normal p-1 text-sm shadow focus:border-blue-500 focus:ring-blue-500 bg-gray-100 dark:bg-primary"
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
                                      class="sm:hover:bg-gray-300 dark:sm:hover:bg-[#2A2E39]"
                                    >
                                      <button
                                        on:click={() => {
                                          handleChangeValue([
                                            row?.step[index],
                                            row?.step[index + 1],
                                          ]);
                                        }}
                                        class="cursor-pointer block w-full border-b border-gray-300 dark:border-gray-600 px-4 py-1.5 text-left text-sm rounded last:border-0 focus:outline-hidden"
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
                                    class="sm:hover:bg-gray-300 dark:sm:hover:bg-[#2A2E39]"
                                  >
                                    <button
                                      on:click={() => {
                                        handleChangeValue(newValue);
                                      }}
                                      class="cursor-pointer block w-full border-b border-gray-300 dark:border-gray-600 px-4 py-1.5 text-left text-sm rounded last:border-0 focus:outline-hidden"
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
                                  class="sm:hover:bg-gray-300 dark:sm:hover:bg-[#2A2E39]"
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
                                        checked={isChecked(item)}
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
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 mb-3">
          <!--Start Total Volume-->
          <div
            class="shadow flex flex-row items-center flex-wrap w-full px-5 bg-gray-100 dark:bg-primary border border-gray-300 dark:border-gray-600 rounded h-20"
          >
            <div class="flex flex-col items-start">
              <span
                class="font-semibold text-muted dark:text-gray-200 text-sm sm:text-[1rem]"
                >Total Volume</span
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
          </div>
          <!--End Total Volume-->
          <!--Start Total Value-->
          <div
            class="shadow flex flex-row items-center flex-wrap w-full px-5 bg-gray-100 dark:bg-primary border border-gray-300 dark:border-gray-600 rounded h-20"
          >
            <div class="flex flex-col items-start">
              <span
                class="font-semibold text-muted dark:text-gray-200 text-sm sm:text-[1rem]"
                >Total Value</span
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
          </div>
          <!--End Total Value-->
          <!--Start Transaction Type (Dark Pool vs Block Order)-->
          <div
            class="shadow flex flex-col w-full px-4 sm:px-5 py-3 bg-gray-100 dark:bg-primary border border-gray-300 dark:border-gray-600 rounded"
          >
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2"
            >
              <span
                class="font-semibold text-muted dark:text-gray-200 text-sm sm:text-[1rem]"
                >Transaction Type</span
              >
              {#if data?.user?.tier === "Pro"}
                <div class="flex items-center gap-3 text-[11px] sm:text-xs">
                  <div class="flex items-center gap-1">
                    <span
                      class="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400"
                    ></span>
                    <span class="text-muted dark:text-gray-300">Dark Pool</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span
                      class="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400"
                    ></span>
                    <span class="text-muted dark:text-gray-300">Block</span>
                  </div>
                </div>
              {/if}
            </div>
            {#if data?.user?.tier === "Pro"}
              <div class="flex flex-col w-full">
                <div
                  class="relative flex w-full h-6 rounded overflow-hidden bg-gray-300 dark:bg-gray-700/80"
                >
                  <div
                    class="bg-violet-500 dark:bg-violet-400 h-full transition-all duration-300 flex items-center justify-center"
                    style="width: {darkPoolPercentage}%"
                  >
                    {#if darkPoolPercentage >= 15}
                      <span
                        class="text-[10px] sm:text-xs font-semibold text-white dark:text-gray-900"
                        >{darkPoolPercentage}%</span
                      >
                    {/if}
                  </div>
                  <div
                    class="bg-sky-500 dark:bg-sky-400 h-full transition-all duration-300 flex items-center justify-center"
                    style="width: {blockOrderPercentage}%"
                  >
                    {#if blockOrderPercentage >= 15}
                      <span
                        class="text-[10px] sm:text-xs font-semibold text-white dark:text-gray-900"
                        >{blockOrderPercentage}%</span
                      >
                    {/if}
                  </div>
                </div>
              </div>
            {:else}
              <a href="/pricing" class="flex">
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
                  ></path>
                </svg>
              </a>
            {/if}
          </div>
          <!--End Transaction Type-->
          <!--Start Asset Type (Stocks vs ETFs)-->
          <div
            class="shadow flex flex-col w-full px-4 sm:px-5 py-3 bg-gray-100 dark:bg-primary border border-gray-300 dark:border-gray-600 rounded"
          >
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2"
            >
              <span
                class="font-semibold text-muted dark:text-gray-200 text-sm sm:text-[1rem]"
                >Asset Type</span
              >
              {#if data?.user?.tier === "Pro"}
                <div class="flex items-center gap-3 text-[11px] sm:text-xs">
                  <div class="flex items-center gap-1">
                    <span
                      class="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
                    ></span>
                    <span class="text-muted dark:text-gray-300">Stock</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span
                      class="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"
                    ></span>
                    <span class="text-muted dark:text-gray-300">ETF</span>
                  </div>
                </div>
              {/if}
            </div>
            {#if data?.user?.tier === "Pro"}
              <div class="flex flex-col w-full">
                <div
                  class="relative flex w-full h-6 rounded overflow-hidden bg-gray-300 dark:bg-gray-700/80"
                >
                  <div
                    class="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-300 flex items-center justify-center"
                    style="width: {stockPercentage}%"
                  >
                    {#if stockPercentage >= 15}
                      <span
                        class="text-[10px] sm:text-xs font-semibold text-white dark:text-gray-900"
                        >{stockPercentage}%</span
                      >
                    {/if}
                  </div>
                  <div
                    class="bg-amber-500 dark:bg-amber-400 h-full transition-all duration-300 flex items-center justify-center"
                    style="width: {etfPercentage}%"
                  >
                    {#if etfPercentage >= 15}
                      <span
                        class="text-[10px] sm:text-xs font-semibold text-white dark:text-gray-900"
                        >{etfPercentage}%</span
                      >
                    {/if}
                  </div>
                </div>
              </div>
            {:else}
              <a href="/pricing" class="flex">
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
                  ></path>
                </svg>
              </a>
            {/if}
          </div>
          <!--End Asset Type-->
        </div>
        <!-- End Stats Grid -->

        <!-- Page wrapper -->
        <div class="flex w-full m-auto h-full overflow-hidden">
          {#if displayedData?.length !== 0}
            <div class="mt-3 w-full overflow-x-auto h-[850px] overflow-hidden">
              <UnusualOrderFlowTable
                {data}
                {displayedData}
                {filteredData}
                {rawData}
              />
              <UpgradeToPro {data} display={true} />
            </div>
          {:else}
            <Infobox
              text="Looks like your taste is one-of-a-kind! No matches found... yet!"
            />
          {/if}
        </div>
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
  </section>
</body>

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
    class="modal-box relative bg-white dark:bg-primary z-20 mx-2 min-h-[30vh] h-[800px] rounded opacity-100 border border-gray-300 dark:border-gray-600 bp:mx-3 sm:mx-4 w-full max-w-6xl overflow-y-auto"
  >
    <div class="relative flex flex-col w-full">
      <!-- Sticky Header -->

      <div
        class="fixed w-full h-fit sticky -top-6 z-40 shadow opacity-100 pb-6 pt-5 border-gray-300 dark:border-gray-600 border-b"
      >
        <div class="flex flex-row items-center justify-between mb-2">
          <h2 class=" text-[1rem] sm:text-xl font-semibold">
            Select screener filters ({allRows?.length} total)
          </h2>
          <label
            for="ruleModal"
            class="inline-block cursor-pointer absolute right-0 top-3 text-[1.3rem] sm:text-[1.8rem]"
          >
            <svg
              class="w-6 h-6 sm:w-8 sm:h-8"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              ><path
                fill="white"
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

<!--Start Options Detail Desktop Modal-->

<input type="checkbox" id="mobileTooltip" class="modal-toggle" />

<dialog id="mobileTooltip" class="modal p-3">
  <label for="mobileTooltip" class="cursor-pointer modal-backdrop"></label>

  <!-- Desktop modal content -->
  <div
    class="modal-box rounded border border-gray-600 w-full bg-gray-100 dark:bg-secondary flex flex-col items-center"
  >
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

    <div class="border-t border-gray-600 mt-2 w-full">
      <label
        for="mobileTooltip"
        class="mt-4 font-semibold text-xl m-auto flex justify-center cursor-pointer"
      >
        Close
      </label>
    </div>
  </div>
</dialog>
