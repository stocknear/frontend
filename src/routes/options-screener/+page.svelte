<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { clearCache, screenWidth } from "$lib/store";
  import Copy from "lucide-svelte/icons/copy";

  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import { scale, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  import { abbreviateNumber, groupScreenerRules } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  //import DownloadData from "$lib/components/DownloadData.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import Input from "$lib/components/Input.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";

  //const userConfirmation = confirm('Unsaved changes detected. Leaving now will discard your strategy. Continue?');

  import { writable } from "svelte/store";

  let shouldLoadWorker = writable(false);
  export let data;
  export let form;

  let showFilters = true;
  let isLoaded = false;
  let syncWorker: Worker | undefined;
  let downloadWorker: Worker | undefined;
  let expirationList = data?.getScreenerData?.expirationList;
  let selectedDate = expirationList?.at(0)?.date;

  let indexDict = data?.getIndexDict ?? {};
  let removeList = false;

  let strategyList = data?.getAllStrategies || [];
  let selectedStrategy = strategyList?.at(0)?.id ?? "";
  let ruleOfList = strategyList?.at(0)?.rules ?? [];
  let groupedRules = {};
  let displayRules = [];

  const checkedRules = ["optionType", "assetType", "indexMembership"];

  let selectedPopularStrategy = "";
  const popularStrategyList = [
    { key: "dividendGrowth", label: "Dividend Growth" },
    { key: "monthlyDividends", label: "Monthly Dividends" },
    { key: "topGainers1Y", label: "Top Gainers 1Y" },
    { key: "topShortedStocks", label: "Top Shorted Stocks" },
    { key: "momentumTAStocks", label: "Momentum TA Stocks" },
    { key: "underValuedStocks", label: "Undervalued Stocks" },
    { key: "strongCashFlow", label: "Strong Cash Flow" },
  ];

  let displayTableTab = "general";

  let stockScreenerData = data?.getScreenerData?.data;

  // Define all possible rules and their properties
  const allRules = {
    moneynessPercentage: {
      label: "% Moneyness",
      step: ["20%", "10%", "5%", "0%", "-5%", "-10%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
    },

    totalPrem: {
      label: "Total Premium",
      step: ["20M", "10M", "1M", "500K", "100K", "10K"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    optionType: {
      label: "Option Type",
      step: ["Call", "Put"],
      defaultCondition: "",
      defaultValue: "any",
    },
    assetType: {
      label: "Asset Type",
      step: ["Stock", "ETF"],
      defaultCondition: "",
      defaultValue: "any",
    },
    indexMembership: {
      label: "Index Membership",
      step: ["S&P100", "S&P500"],
      defaultCondition: "",
      category: "Stock Data",
      defaultValue: "any",
    },
    ivRank: {
      label: "IV Rank",
      step: ["90%", "80%", "50%", "30%", "10%"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
      varType: "percent",
    },
    iv: {
      label: "Implied Volatility",
      step: ["100%", "80%", "50%", "30%", "10%"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
      varType: "percent",
    },
    oi: {
      label: "Open Interest",
      step: ["100K", "50K", "30K", "10K", "5K", "1K"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
      varType: "decimal",
    },
    changesPercentageOI: {
      label: "% Change OI",
      step: ["100%", "80%", "50%", "30%", "10%"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
      varType: "percentSign",
    },
    volume: {
      label: "Volume",
      step: ["50K", "20K", "10K", "5K", "1K"],
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
  };

  let filteredData = [];
  let displayResults = [];

  // Generate allRows from allRules
  $: allRows = Object?.entries(allRules)
    ?.sort(([, a], [, b]) => a?.label.localeCompare(b.label)) // Sort by label
    ?.map(([ruleName, ruleProps]) => ({
      rule: ruleName,
      ...ruleProps,
    }));

  let filteredGroupedRules;
  let searchTerm = "";

  let ruleName = "";

  // Quick Search state variables
  let quickSearchTerm = "";
  let quickSearchResults = [];
  let showQuickSearchDropdown = false;
  let selectedQuickSearchIndex = -1;

  // Define your default values

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
      rule.condition || allRules[rule.name].defaultCondition;
    valueMappings[rule.name] = rule.value || allRules[rule.name].defaultValue;
  });

  const formatDate = (dateString: string): string => {
    if (!dateString) return "n/a";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "n/a"
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        });
  };

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
        type: "optionsScreener",
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
        displayResults = [];
      }

      //await updateStockScreenerData();

      checkedItems = new Map(
        ruleOfList
          ?.filter((rule) =>
            [
              "analystRating",
              "topAnalystRating",
              "earningsTime",
              "earningsDate",
              "halalStocks",
              "sector",
              "payoutFrequency",
              "country",
              "score",
              "industry",
              "grahamNumber",
              "lynchFairValue",
            ].includes(rule.name),
          )
          ?.map((rule) => [rule.name, new Set(rule.value)]),
      );

      // return something if you need to chain further
      return true;
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
    const postData = { type: "optionsScreener" };
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
      strategyList?.unshift(output);
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

  async function switchStrategy(item) {
    displayTableTab = "general";
    ruleName = "";
    selectedPopularStrategy = "";
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
      displayResults = [];
    }
    //await updateStockScreenerData();
    checkedItems = new Map(
      ruleOfList
        ?.filter((rule) => checkedRules?.includes(rule.name)) // Only include specific rules
        ?.map((rule) => [rule.name, new Set(rule.value)]), // Create Map from filtered rules
    );
  }

  function changeRule(state: string) {
    selectedPopularStrategy = "";
    ruleName = state;
    handleAddRule();
  }

  const handleMessage = (event) => {
    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule.name === row.rule),
    );

    filteredData = event.data?.filteredData ?? [];
    displayResults = filteredData?.slice(0, 50);
  };

  const handleScreenerMessage = (event) => {
    stockScreenerData = event?.data?.stockScreenerData;
    shouldLoadWorker.set(true);
  };

  const loadWorker = async () => {
    syncWorker.postMessage({
      stockScreenerData,
      ruleOfList,
      indexDict,
    });
  };

  const updateStockScreenerData = async () => {
    isLoaded = false;

    downloadWorker.postMessage({ selectedDate: selectedDate });
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
      case "optionType":
      case "assetType":
      case "indexMembership":
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
      } else {
        ruleOfList[existingRuleIndex] = newRule;
        ruleOfList = [...ruleOfList]; // Trigger reactivity
      }
    } else {
      ruleOfList = [...ruleOfList, newRule];

      //await updateStockScreenerData();
    }
  }

  async function handleResetAll() {
    selectedPopularStrategy = "";
    displayTableTab = "general";
    ruleOfList = [];
    Object?.keys(allRules)?.forEach((ruleName) => {
      ruleCondition[ruleName] = allRules[ruleName].defaultCondition;
      valueMappings[ruleName] = allRules[ruleName].defaultValue;
    });
    ruleName = "";
    filteredData = [];
    displayResults = [];
    checkedItems = new Map();
    ruleOfList = [...ruleOfList];
    //await updateStockScreenerData();
    //await handleSave(false);
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

        // Update checkedItems for multi-select rules when resetting to defaults
        if (checkedRules.includes(state)) {
          checkedItems = new Map(
            ruleOfList
              ?.filter((rule) => checkedRules.includes(rule.name))
              ?.map((rule) => [rule.name, new Set(rule.value)]),
          );
        }
      } else {
        // If already at defaults, remove the rule
        ruleOfList.splice(index, 1);
        ruleOfList = [...ruleOfList];

        // Reset checkedItems for multi-select rules
        if (checkedItems?.has(state)) {
          checkedItems?.delete(state);
        }

        // Handle cases when the list is empty or matches the current rule name
        if (ruleOfList?.length === 0) {
          ruleName = "";
          filteredData = [];
          displayResults = [];
        } else if (state === ruleName) {
          ruleName = "";
        }
      }

      await updateStockScreenerData();
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

    // Clear search state
    //quickSearchTerm = "";
    quickSearchResults = [];
    showQuickSearchDropdown = false;
    selectedQuickSearchIndex = -1;
  }

  function closeQuickSearchDropdown() {
    // Delay to allow click events to register
    setTimeout(() => {
      showQuickSearchDropdown = false;
      selectedQuickSearchIndex = -1;
    }, 150);
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && displayResults?.length !== filteredData?.length) {
      const nextIndex = displayResults?.length;
      const filteredNewResults = filteredData?.slice(nextIndex, nextIndex + 30);
      displayResults = [...displayResults, ...filteredNewResults];
    }
  }

  /*
  const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // prevent the browser's default save action
        handleSave();
      }
    };
  
  */

  let LoginPopup;

  onMount(async () => {
    if (!syncWorker) {
      const SyncWorker = await import("./workers/filterWorker?worker");
      syncWorker = new SyncWorker.default();
      syncWorker.onmessage = handleMessage;
    }

    if (!downloadWorker) {
      const DownloadWorker = await import("./workers/downloadWorker?worker");
      downloadWorker = new DownloadWorker.default();
      downloadWorker.onmessage = handleScreenerMessage;
    }

    if (!data?.user) {
      LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
    }

    shouldLoadWorker.subscribe(async (value) => {
      if (value) {
        await loadWorker();
        shouldLoadWorker.set(false); // Reset after worker is loaded
        isLoaded = true;
      }
    });

    groupedRules = groupScreenerRules(allRows);
  });

  onDestroy(() => {
    syncWorker?.terminate();
    syncWorker = undefined;
    clearCache();
  });

  async function handleSave(showMessage) {
    if (!data?.user) return;

    if (strategyList?.length === 0) {
      handleCreateStrategy();
    }

    if (strategyList?.length > 0) {
      // update local strategyList
      strategyList.find((item) => item.id === selectedStrategy).rules =
        ruleOfList;

      const postData = {
        strategyId: selectedStrategy,
        rules: ruleOfList,
        type: "optionsScreener",
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
      shouldLoadWorker.set(true);
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

  $: charNumber = $screenWidth < 640 ? 20 : 20;

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
      ?.filter((rule) => checkedRules?.includes(rule.name)) // Only include specific rules
      ?.map((rule) => [rule.name, new Set(rule.value)]), // Create Map from filtered rules
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

  async function handleChangeValue(value, { shouldSort = true } = {}) {
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

    if (checkedRules?.includes(ruleName)) {
      if (!Array.isArray(valueMappings[ruleName])) {
        valueMappings[ruleName] = [];
      }

      // Apply sorting only if shouldSort is true
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

      await updateStockScreenerData();
    } else if (ruleName in valueMappings) {
      if (ruleCondition[ruleName] === "between" && Array?.isArray(value)) {
        // Apply sorting only if shouldSort is true
        valueMappings[ruleName] = shouldSort ? value?.sort(customSort) : value;
      } else {
        valueMappings[ruleName] = value;
      }
    } else {
      console.warn(`Unhandled rule: ${ruleName}`);
    }

    // Add this at the end of the function to ensure the filter is applied
    if (ruleCondition[ruleName] === "between" && value.some((v) => v !== "")) {
      await updateStockScreenerData();
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
    const newValue = suffix ? `${number}${suffix}` : Math?.round(number);
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
    ruleOfList = [];
    const strategies = {
      dividendGrowth: {
        name: "Dividend Growth",
        rules: [
          { condition: "over", name: "dividendGrowth", value: "5%" },
          { condition: "over", name: "dividendYield", value: "1%" },
          { condition: "under", name: "payoutRatio", value: "60%" },
          { condition: "over", name: "growthRevenue", value: "5%" },
        ],
      },
      monthlyDividends: {
        name: "Monthly Dividends",
        rules: [
          { name: "payoutFrequency", value: "Monthly" },
          { condition: "over", name: "dividendYield", value: "0%" },
        ],
      },
      topGainers1Y: {
        name: "Top Gainers 1Y",
        rules: [
          { condition: "over", name: "change1Y", value: "50%" },
          { condition: "over", name: "marketCap", value: "10B" },
          { condition: "over", name: "eps", value: 5 },
        ],
      },
      topShortedStocks: {
        name: "Top Shorted Stocks",
        rules: [
          { condition: "over", name: "shortFloatPercent", value: "20%" },
          { condition: "over", name: "shortRatio", value: 1 },
          { condition: "over", name: "shortOutstandingPercent", value: "10%" },
          { condition: "over", name: "sharesShort", value: "20M" },
          { condition: "over", name: "marketCap", value: "100M" },
        ],
      },

      momentumTAStocks: {
        name: "Momentum TA Stocks",
        rules: [
          { condition: "under", name: "rsi", value: 40 },
          { condition: "under", name: "stochRSI", value: 40 },
          { condition: "over", name: "marketCap", value: "1B" },
          { condition: "under", name: "mfi", value: 40 },
        ],
      },
      underValuedStocks: {
        name: "Undervalued Stocks",
        rules: [
          { condition: "between", name: "marketCap", value: ["100M", "500M"] },
          { condition: "over", name: "debtToEquityRatio", value: 1 },
          { condition: "under", name: "priceToEarningsRatio", value: 15 },
          { condition: "under", name: "priceToSalesRatio", value: 1.5 },
          { condition: "under", name: "priceToBookRatio", value: 1 },
          { condition: "over", name: "eps", value: 0 },
        ],
      },
      strongCashFlow: {
        // New Strategy Added
        name: "Strong Cash Flow",
        rules: [
          { condition: "over", name: "marketCap", value: "300M" },
          { condition: "over", name: "freeCashFlow", value: "100M" },
          { condition: "over", name: "growthFreeCashFlow", value: "10%" },
          { condition: "over", name: "operatingCashFlow", value: "100M" },
          { condition: "over", name: "freeCashFlowMargin", value: "10%" },
        ],
      },
    };

    const strategy = strategies[state];
    if (strategy) {
      selectedPopularStrategy = strategy.name;
      ruleOfList = strategy?.rules;
      ruleOfList?.forEach((row) => {
        ruleName = row?.name;
        ruleCondition[ruleName] = row?.condition;
        handleChangeValue(row?.value);
      });

      //await updateStockScreenerData();
    }
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

    let originalData = filteredData;

    const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
    sortOrders[key].order =
      orderCycle[(currentOrderIndex + 1) % orderCycle.length];
    const sortOrder = sortOrders[key].order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      displayResults = [...originalData]?.slice(0, 50); // Reset to original data (spread to avoid mutation)
      return;
    }

    // Define a generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      let valueA, valueB;

      switch (type) {
        case "date":
          valueA = new Date(a[key]);
          valueB = new Date(b[key]);
          break;
        case "string":
          valueA = a[key].toUpperCase();
          valueB = b[key].toUpperCase();
          return sortOrder === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "number":
        default:
          valueA = parseFloat(a[key]);
          valueB = parseFloat(b[key]);
          break;
      }

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    };

    // Sort using the generic comparison function
    displayResults = [...originalData].sort(compareValues)?.slice(0, 50);
  };

  let columns;
  let sortOrders;

  // Initial columns and sort orders for the "general" tab
  const generalColumns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "strike", label: "Strike", align: "right" },
    { key: "optionType", label: "P/C", align: "right" },
    { key: "iv", label: "IV", align: "right" },
    { key: "ivRank", label: "IV Rank", align: "right" },
    { key: "close", label: "Close Price", align: "right" },
    {
      key: "moneynessPercentage",
      label: "MoneynessPercentage",
      align: "right",
    },
    { key: "volume", label: "Volume", align: "right" },
    { key: "oi", label: "OI", align: "right" },
    { key: "changesPercentageOI", label: "% Change OI", align: "right" },
    { key: "totalPrem", label: "Total Prem", align: "right" },
  ];

  const generalSortOrders = {
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    optionType: { order: "none", type: "string" },
    strike: { order: "none", type: "number" },
    iv: { order: "none", type: "number" },
    ivRank: { order: "none", type: "number" },
    moneynessPercentage: { order: "none", type: "number" },
    close: { order: "none", type: "number" },
    volume: { order: "none", type: "number" },
    oi: { order: "none", type: "number" },
    changesPercentageOI: { order: "none", type: "number" },
    totalPrem: { order: "none", type: "number" },
  };

  const stringTypeRules = ["optionType"];

  // Helper to determine the type based on stringTypeRules
  const getType = (key) =>
    stringTypeRules.includes(key) ? "string" : "number";

  $: {
    if (displayTableTab) {
      const baseColumnsMap = {
        filters: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "strike", label: "Strike", align: "right" },
          { key: "optionType", label: "P/C", align: "right" },
        ],
        greeks: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "strike", label: "Strike", align: "right" },
          { key: "optionType", label: "P/C", align: "right" },
          { key: "delta", label: "Delta", align: "right" },
          { key: "gamma", label: "Gamma", align: "right" },
          { key: "theta", label: "Theta", align: "right" },
          { key: "vega", label: "Vega", align: "right" },
        ],
      };

      const baseSortOrdersMap = {
        filters: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          strike: { order: "none", type: "number" },
          optionType: { order: "none", type: "string" },
        },
        greeks: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          strike: { order: "none", type: "number" },
          optionType: { order: "none", type: "string" },
          delta: { order: "none", type: "number" },
          gamma: { order: "none", type: "number" },
          theta: { order: "none", type: "number" },
          vega: { order: "none", type: "number" },
        },
      };

      if (displayTableTab === "general") {
        columns = [...generalColumns];
        sortOrders = { ...generalSortOrders };
      } else {
        columns = [...(baseColumnsMap[displayTableTab] || [])];
        sortOrders = { ...(baseSortOrdersMap[displayTableTab] || {}) };

        const rulesList = displayTableTab === "greeks" ? [] : displayRules;
        console.log(rulesList);

        rulesList?.forEach((rule) => {
          if (!["optionType", "strike"]?.includes(rule.rule)) {
            columns.push({
              key: rule.rule,
              label: rule.label,
              align: "right",
            });
            sortOrders[rule.rule] = { order: "none", type: getType(rule.rule) };
          }
        });
      }
    }
  }
</script>

<SEO
  title="Advanced Options Screener - Free Options Filter & Analysis Tool"
  description="Powerful options screener with {allRows?.length ||
    'comprehensive'} filtering criteria. Screen options by implied volatility, open interest, volume, Greeks, and expiration dates. Find high-probability options trades with real-time options chain data."
  keywords="options screener, free options screener, options filter, options scanner, implied volatility screener, options chain analysis, high volume options, options trading tool, Greeks screener, open interest analysis"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Options Screener Tool",
    description:
      "Advanced options screening and filtering platform with real-time options market data",
    url: "https://stocknear.com/options-screener",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Multi-criteria options filtering",
      "Implied volatility screening",
      "Open interest analysis",
      "Options volume filtering",
      "Greeks-based screening",
      "Expiration date filtering",
      "Real-time options data",
      "Custom screening strategies",
    ],
    softwareRequirements: "Web Browser",
    provider: {
      "@type": "Organization",
      name: "Stocknear",
    },
  }}
/>

<svelte:window on:scroll={handleScroll} />

<section
  class="w-full max-w-3xl sm:max-w-(--breakpoint-xl) overflow-hidden min-h-screen pb-40 px-5 mt-5"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/" class="text-muted dark:text-gray-300">Home</a>
      </li>
      <li>
        <span class="text-muted dark:text-gray-300">Options Screener</span>
      </li>
    </ul>
  </div>

  <!--Start Build Strategy-->
  <div class="sm:rounded">
    <div class="flex flex-col md:flex-row items-start md:items-center mb-5">
      <div class="w-full flex flex-row items-center sm:mt-4">
        <h1 class="text-2xl sm:text-3xl font-semibold">Options Screener</h1>
        <span class="inline-block text-xs sm:text-sm font-semibold ml-2 mt-3">
          {filteredData?.length?.toLocaleString("en-US")} Contracts Found
        </span>
      </div>

      <div class="flex flex-row items-center w-full mt-5 justify-end">
        <div class="flex w-full sm:w-[50%] sm:ml-3 md:block md:w-auto">
          <div
            class="hidden text-sm sm:text-[1rem] font-semibold md:block sm:mb-1"
          >
            Saved Screens
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
                      : "Select screen"}</span
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
                      <div class="text-sm text-start">New Screen</div>
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
      class="rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-primary p-2"
    >
      <div class="items-end border-b border-gray-300 dark:border-gray-600">
        <div
          class="mr-1 flex items-center justify-between lg:mr-2 pb-1.5 border-b border-gray-300 dark:border-gray-600 mt-1.5"
        >
          <button
            on:click={() => (showFilters = !showFilters)}
            class="flex cursor-pointer items-center text-lg font-semibold"
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
        <div class="mt-3 pb-1 w-full">
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Add Filters Button -->
            <label
              for="ruleModal"
              class="w-full sm:w-fit text-[0.95rem] text-white inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold bg-default sm:hover:bg-black dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden"
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
                        <div class="font-medium text-gray-900 dark:text-white">
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

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class=" h-10 w-full sm:w-fit border-none text-[0.95rem] text-white inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold  bg-default sm:hover:bg-black dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out"
                >
                  <span class="truncate text-sm"
                    >{formatDate(selectedDate)}</span
                  >
                  <svg
                    class="-mr-1 ml-2 h-5 w-5 inline-block rotate-270 sm:rotate-0"
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
                class="min-w-48 w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
              >
                <!-- Dropdown items -->
                <DropdownMenu.Group class="pb-2"
                  >{#each expirationList as item, index}
                    {#if data?.user?.tier === "Pro" || index == 0}
                      <DropdownMenu.Item
                        on:click={() => {
                          selectedDate = item?.date;
                          updateStockScreenerData();
                        }}
                        class="{selectedDate === item?.date
                          ? 'bg-gray-200 dark:bg-primary'
                          : ''}  sm:hover:bg-gray-200 dark:sm:hover:bg-primary cursor-pointer "
                      >
                        {formatDate(item?.date)}
                        ({item?.contractLength?.toLocaleString("en-US")})
                      </DropdownMenu.Item>
                    {:else}
                      <DropdownMenu.Item
                        on:click={() => goto("/pricing")}
                        class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                      >
                        <div class="flex flex-row items-center gap-x-2">
                          <span>
                            {formatDate(item?.date)}
                            ({item?.contractLength?.toLocaleString("en-US")})
                          </span>
                          <svg
                            class="size-4"
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
                        </div>
                      </DropdownMenu.Item>
                    {/if}
                  {/each}</DropdownMenu.Group
                >
              </DropdownMenu.Content>
            </DropdownMenu.Root>

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

            <!--
          {#if data?.user}
            <label
              for={!data?.user ? "userLogin" : ""}
              on:click={() => handleSave(true)}
              class="text-[0.95rem] sm:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold  bg-white sm:hover:bg-gray-100 dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden "
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                ><path
                  fill="currentColor"
                  d="M5 5v22h22V9.594l-.281-.313l-4-4L22.406 5zm2 2h3v6h12V7.437l3 3V25h-2v-9H9v9H7zm5 0h4v2h2V7h2v4h-8zm-1 11h10v7H11z"
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
                class="text-[0.95rem] sm:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold  bg-white sm:hover:bg-gray-100 dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden "
              >
                <Copy class="w-4 h-4 inline-block mr-2" />
                <div>Save as New</div>
              </label>
            {/if}
          {/if}
          -->

            {#if ruleOfList?.length !== 0}
              <label
                on:click={handleResetAll}
                class="w-full sm:w-fit text-white text-[0.95rem] cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold bg-black sm:hover:bg-default dark:bg-[#000] ease-out focus:outline-hidden"
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
                  class="mr-1.5 cursor-pointer text-muted dark:text-gray-300 sm:hover:text-red-800 dark:sm:hover:text-red-400 focus:outline-hidden"
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
                          class="border-gray-300 dark:border-none  bg-default sm:hover:bg-black text-white dark:bg-[#000] h-[35px] flex flex-row justify-between items-center w-[140px] xs:w-[130px] sm:w-[140px] px-3  rounded truncate"
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
                        class="w-64 min-h-auto max-h-72 overflow-y-auto scroller"
                      >
                        {#if !checkedRules?.includes(row?.rule)}
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
                                  <DropdownMenu.Content>
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
                                    value={Array?.isArray(
                                      valueMappings[row?.rule],
                                    )
                                      ? valueMappings[row?.rule]?.at(0)
                                      : ""}
                                    on:input={(e) =>
                                      handleValueInput(e, row?.rule, 0)}
                                    class="ios-zoom-fix block max-w-[3.5rem] rounded-sm placeholder-gray-500 dark:placeholder:text-gray-200 font-normal p-1 text-sm bg-white dark:bg-secondary border border-gray-300 dark:border-gray-800"
                                  />
                                  <span class=" text-[1rem] font-normal mt-1">
                                    &
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="Max"
                                    value={Array?.isArray(
                                      valueMappings[row?.rule],
                                    )
                                      ? valueMappings[row?.rule]?.at(1)
                                      : ""}
                                    on:input={(e) =>
                                      handleValueInput(e, row?.rule, 1)}
                                    class="ios-zoom-fix block max-w-[3.5rem] rounded-sm placeholder-gray-500 dark:placeholder:text-gray-200 font-normal p-1 text-sm bg-white dark:bg-secondary border border-gray-300 dark:border-gray-800"
                                  />
                                </div>
                              {:else}
                                <input
                                  type="text"
                                  placeholder="Value"
                                  value={valueMappings[row?.rule] !== "any"
                                    ? valueMappings[row?.rule]
                                    : ""}
                                  on:input={(e) =>
                                    handleValueInput(e, row?.rule)}
                                  class="ios-zoom-fix block max-w-[4.8rem] rounded-sm placeholder-gray-500 dark:placeholder:text-gray-200 font-normal p-1 text-sm bg-white dark:bg-secondary border border-gray-300 dark:border-gray-800"
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
                                      class="size-6 cursor-pointer text-gray-500 dark:text-gray-300"
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
                                      class="size-6 cursor-pointer text-gray-500 dark:text-gray-300"
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
                        {/if}
                        <DropdownMenu.Group class="min-h-10 mt-2">
                          {#if !checkedRules?.includes(row?.rule)}
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
                                      class="cursor-pointer block w-full border-b border-gray-300 dark:border-gray-600 px-4 py-1.5 text-left text-sm rounded last:border-0 dark:sm:hover:bg-primary"
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
                                    class="cursor-pointer block w-full border-b border-gray-300 dark:border-gray-600 px-4 py-1.5 text-left text-sm rounded last:border-0"
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
                          {:else if checkedRules?.includes(row?.rule)}
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

    <!--End Adding Rules-->
  </div>
  <!--End Build Strategy-->

  <div
    class="mt-6 grid-cols-2 items-center sm:grid lg:flex lg:space-x-1 lg:overflow-visible lg:px-1 py-1.5 border-t border-b border-gray-300 dark:border-gray-800 mb-2"
  >
    <h2 class=" whitespace-nowrap text-xl font-semibold bp:text-[1.3rem]">
      {filteredData?.length?.toLocaleString("en-US")} Contracts
    </h2>
    <div
      class="col-span-2 flex flex-row items-center lg:order-2 lg:grow lg:border-0 lg:pl-1 xl:pl-3"
    >
      <nav class="w-full flex flex-row items-center">
        <ul
          class="flex flex-row overflow-x-auto items-center space-x-2 whitespace-nowrap"
        >
          <li>
            <button
              on:click={() => (displayTableTab = "general")}
              class="cursor-pointer text-[1rem] block rounded px-2 py-1 focus:outline-hidden sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'general'
                ? 'font-semibold bg-gray-100 dark:bg-primary'
                : ''}"
            >
              General
            </button>
          </li>
          <li>
            <button
              on:click={() => (displayTableTab = "filters")}
              class="cursor-pointer text-[1rem] flex flex-row items-center relative block rounded px-2 py-1 sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'filters'
                ? 'font-semibold bg-gray-100 dark:bg-primary'
                : ''} focus:outline-hidden"
            >
              <span class="">Filters</span>
              <span
                class="ml-2 rounded-full avatar w-5 h-5 text-xs font-semibold text-center shrink-0 flex items-center justify-center {ruleOfList?.length !==
                0
                  ? 'text-white bg-red-500'
                  : 'bg-gray-200 dark:bg-gray-600'}"
              >
                {ruleOfList?.length}
              </span>
            </button>
          </li>
          <li>
            <button
              on:click={() => (displayTableTab = "greeks")}
              class="cursor-pointer text-[1rem] flex flex-row items-center relative block rounded px-2 py-1 sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'greeks'
                ? 'font-semibold bg-gray-100 dark:bg-primary'
                : ''} focus:outline-hidden"
            >
              <span class="">Greeks</span>
            </button>
          </li>
        </ul>
        <!--
        <div class="w-fit ml-auto hidden sm:inline-block">
          <DownloadData
            {data}
            rawData={filteredData}
            title={"stock_screener_data"}
          />
        </div>
        -->
      </nav>
    </div>
  </div>

  <h3 class="text-[1rem] font-semibold mb-2 whitespace-nowrap">
    All option contracts expire on {formatDate(selectedDate)}
  </h3>

  <!--Start Matching Preview-->
  {#if isLoaded}
    {#if filteredData?.length !== 0}
      {#if displayTableTab === "general"}
        <div class="w-full rounded overflow-x-auto">
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
          >
            <thead>
              <TableHeader {columns} {sortOrders} {sortData} />
            </thead>
            <tbody>
              {#each displayResults as item}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                >
                  <td class=" whitespace-nowrap">
                    <a
                      href={`/${item?.assetType === "Stock" ? "stocks" : item?.assetType === "ETF" ? "etf" : "index"}/` +
                        item?.symbol +
                        `/options/contract-lookup?query=${item?.optionSymbol}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem]"
                      >{item?.symbol}</a
                    >
                  </td>

                  <td class="whitespace-nowrap text-[1rem]">
                    {item?.name?.length > charNumber
                      ? item?.name?.slice(0, charNumber) + "..."
                      : item?.name}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.strike ?? "n/a"}
                  </td>

                  <td
                    class=" text-sm sm:text-[1rem] text-end
                  {item?.optionType === 'Call'
                      ? 'text-green-800 dark:text-[#00FC50]'
                      : 'text-rose-600 dark:text-rose-400'} "
                  >
                    {item?.optionType}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.iv ? item?.iv + "%" : "n/a"}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.ivRank ? item?.ivRank + "%" : "n/a"}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.close < 0.01 ? "< 0.01" : item?.close?.toFixed(2)}
                  </td>

                  <td class=" text-end text-sm sm:text-[1rem]">
                    {#if item?.moneynessPercentage >= 0}
                      <span class="text-green-800 dark:text-[#00FC50]"
                        >+{item?.moneynessPercentage >= 1000
                          ? abbreviateNumber(item?.moneynessPercentage)
                          : item?.moneynessPercentage?.toFixed(2)}%</span
                      >
                    {:else}
                      <span class="text-rose-600 dark:text-rose-400"
                        >{item?.moneynessPercentage <= -1000
                          ? abbreviateNumber(item?.moneynessPercentage)
                          : item?.moneynessPercentage?.toFixed(2)}%
                      </span>
                    {/if}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.volume
                      ? item?.volume?.toLocaleString("en-US")
                      : "n/a"}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.oi ? item?.oi?.toLocaleString("en-US") : "n/a"}
                  </td>

                  <td class=" text-end text-sm sm:text-[1rem]">
                    {#if item?.changesPercentageOI > 0}
                      <span class="text-green-800 dark:text-[#00FC50]"
                        >+{item?.changesPercentageOI >= 1000
                          ? abbreviateNumber(item?.changesPercentageOI)
                          : item?.changesPercentageOI?.toFixed(1)}%</span
                      >
                    {:else if item?.changesPercentageOI < 0}
                      <span class="text-rose-600 dark:text-rose-400"
                        >{item?.changesPercentageOI <= -1000
                          ? abbreviateNumber(item?.changesPercentageOI)
                          : item?.changesPercentageOI?.toFixed(1)}%
                      </span>
                    {:else}
                      <span class=""
                        >{item?.changesPercentageOI?.toFixed(1)}%
                      </span>
                    {/if}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.totalPrem
                      ? abbreviateNumber(item?.totalPrem)
                      : "n/a"}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if displayTableTab === "filters"}
        <div class="w-full rounded overflow-x-auto">
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
          >
            <thead>
              <TableHeader {columns} {sortOrders} {sortData} />
            </thead>
            <tbody>
              {#each displayResults as item}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                >
                  <td class=" whitespace-nowrap">
                    <a
                      href={`/${item?.assetType === "Stock" ? "stocks" : item?.assetType === "ETF" ? "etf" : "index"}/` +
                        item?.symbol +
                        `/options/contract-lookup?query=${item?.optionSymbol}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem]"
                      >{item?.symbol}</a
                    >
                  </td>
                  <td class=" whitespace-nowrap text-[1rem]">
                    {item?.name?.length > charNumber
                      ? item?.name?.slice(0, charNumber) + "..."
                      : item?.name}
                  </td>
                  <td class="whitespace-nowrap text-sm sm:text-[1rem] text-end">
                    {item?.strike}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end
                {item?.optionType === 'Call'
                      ? 'text-green-800 dark:text-[#00FC50]'
                      : 'text-rose-600 dark:text-rose-400'} "
                  >
                    {item?.optionType}
                  </td>

                  {#each displayRules as row (row?.rule)}
                    {#if !["strike", "optionType"]?.includes(row?.rule)}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[1rem] text-end"
                      >
                        {#if row?.varType && row?.varType === "percentSign"}
                          <span
                            class={item[row?.rule] > 0
                              ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                              : item[row?.rule] < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : ""}
                          >
                            {abbreviateNumber(item[row?.rule])}%
                          </span>
                        {:else if row?.varType && row?.varType === "percent"}
                          {abbreviateNumber(item[row?.rule])}%
                        {:else if row?.varType && row?.varType === "decimal"}
                          {item[row?.rule]?.toLocaleString("en-US")}
                        {:else if ["optionType"]?.includes(row?.rule)}
                          {#if "Call" === item[row?.rule]}
                            <span class=" text-green-800 dark:text-[#00FC50]"
                              >{item[row?.rule]}</span
                            >
                          {:else if "Put" === item[row?.rule]}
                            <span class=" text-rose-600 dark:text-rose-400"
                              >{item[row?.rule]}</span
                            >
                          {/if}
                        {:else if row?.rule === "indexMembership"}
                          {valueMappings[row?.rule] === "any"
                            ? "Any"
                            : valueMappings[row?.rule]}
                        {:else}
                          {abbreviateNumber(item[row?.rule])}
                        {/if}
                      </td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if displayTableTab === "greeks"}
        <div class="w-full rounded overflow-x-auto">
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
          >
            <thead>
              <TableHeader {columns} {sortOrders} {sortData} />
            </thead>
            <tbody>
              {#each displayResults as item}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                >
                  <td class=" whitespace-nowrap">
                    <a
                      href={`/${item?.assetType}/` +
                        item?.symbol +
                        `/options/contract-lookup?query=${item?.optionSymbol}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem]"
                      >{item?.symbol}</a
                    >
                  </td>
                  <td class=" whitespace-nowrap text-[1rem]">
                    {item?.name?.length > charNumber
                      ? item?.name?.slice(0, charNumber) + "..."
                      : item?.name}
                  </td>
                  <td class="whitespace-nowrap text-sm sm:text-[1rem] text-end">
                    {item?.strike}
                  </td>
                  <td
                    class=" text-sm sm:text-[1rem] text-end
                {item?.optionType === 'Call'
                      ? 'text-green-800 dark:text-[#00FC50]'
                      : 'text-rose-600 dark:text-rose-400'} "
                  >
                    {item?.optionType}
                  </td>

                  <td class="whitespace-nowrap text-sm sm:text-[1rem] text-end">
                    {item?.delta}
                  </td>
                  <td class="whitespace-nowrap text-sm sm:text-[1rem] text-end">
                    {item?.gamma}
                  </td>
                  <td class="whitespace-nowrap text-sm sm:text-[1rem] text-end">
                    {item?.theta}
                  </td>
                  <td class="whitespace-nowrap text-sm sm:text-[1rem] text-end">
                    {item?.vega}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {:else}
      <Infobox
        text="Looks like your taste is one-of-a-kind! No matches found... yet!"
      />
    {/if}
  {:else}
    <div class="flex justify-center items-center h-80">
      <div class="relative">
        <label
          class=" bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
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
    class="modal-box relative bg-white dark:bg-primary z-20 mx-2 min-h-[30vh] h-[800px] rounded bg-default opacity-100 border border-gray-300 dark:border-gray-600 bp:mx-3 sm:mx-4 w-full max-w-6xl overflow-y-auto"
  >
    <div class="relative flex flex-col w-full">
      <!-- Sticky Header -->

      <div
        class="fixed w-full h-fit sticky -top-6 z-40 bg-white dark:bg-primary opacity-100 pb-6 pt-5 border-gray-300 dark:border-gray-600 border-b"
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
                class="w-4 h-4 text-gray-600 dark:text-gray-300"
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
                class="cursor-pointer text-gray-600 dark:text-gray-300"
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
              class="focus:outline-none placeholder-gray-800 dark:placeholder-gray-300 block w-full p-2 ps-10 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-secondary border border-blue-500"
              placeholder="Search..."
              bind:value={searchTerm}
            />
          </div>
        </form>
        <!-- End Search bar -->
      </div>

      <!-- Content -->
      <div class="">
        {#each searchTerm?.length !== 0 ? Object?.entries(filteredGroupedRules) : Object?.entries(groupedRules) as [category, rules]}
          <h4 class="mb-1 font-semibold text-lg mt-5">{category}</h4>
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
                  class="h-[18px] w-[18px] rounded-sm ring-offset-0 lg:h-4 lg:w-4"
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
    <h1 class="text-2xl font-bold">New Screener</h1>

    <form
      on:submit={createStrategy}
      method="POST"
      class="space-y-2 pt-5 pb-10 sm:pb-5"
    >
      <Input
        id="title"
        type="text"
        errors=""
        label="Screener Name"
        required={true}
      />

      <button
        type="submit"
        class="cursor-pointer mt-2 py-2.5 bg-black dark:bg-[#fff] dark:sm:hover:bg-gray-300 duration-100 w-full rounded m-auto text-white dark:text-black font-semibold text-md"
      >
        Create Screener
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
    <h3 class="text-lg font-medium mb-2">Delete Screener</h3>
    <p class="text-sm mb-6">
      Are you sure you want to delete this screener? This action cannot be
      undone.
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
        >Delete Screener</label
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
