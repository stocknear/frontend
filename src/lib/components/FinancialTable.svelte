<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import { stockTicker, getCache, setCache } from "$lib/store";
  import { goto } from "$app/navigation";
  import {
    stock_detail_close,
    stock_detail_financials_bar_chart,
    stock_detail_financials_error_loading,
    stock_detail_financials_growth_yoy,
    stock_detail_financials_line_chart,
    stock_detail_financials_loading,
    stock_detail_financials_peaked_at,
  } from "$lib/paraglide/messages";

  import { mode } from "mode-watcher";
  import { onMount } from "svelte";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import highcharts from "$lib/highcharts.ts";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import BarChart from "lucide-svelte/icons/chart-column-increasing";
  import LineChart from "lucide-svelte/icons/chart-spline";
  import GrowthRate from "lucide-svelte/icons/percent";

  export let data: any[];
  export let fields: { label: string; key: string; growthOf?: string }[];
  export let enableFavorites = false;
  export let favoriteStorageKey = "";
  export let showUpgradeColumn = false;
  export let upgradeHref = "/pricing";
  export let upgradeLabel = "Upgrade";
  export let periodType: "annual" | "quarterly" | "ttm" = "annual";

  type RangeOption = {
    value: string;
    label: string;
    locked?: boolean;
  };

  const RANGE_OPTIONS: RangeOption[] = [
    { value: "5Y", label: "5Y" },
    { value: "10Y", label: "10Y", locked: true },
    { value: "MAX", label: "MAX", locked: true },
  ];

  let selectedRange = "5Y";
  let config = null;

  let chartMode = "bar";

  let modalLabel;
  let highestValue;
  let highestValueDate;
  let lowestValueDate;
  let lowestValue;

  let currentLabel;
  let currentKey;
  let isCurrentMargin = false;
  const isBrowser = typeof window !== "undefined";
  const DEFAULT_STORAGE_PREFIX = "financial_metrics";
  let localStorageKey = "";
  let favoriteMetrics: string[] = [];
  let favoriteSet: Set<string> = new Set();
  let computedFields = [];
  let animationKey: string | null = null;
  let rangeMenuOpen = false;
  let rangeDropdownRef: HTMLDivElement | null = null;

  // Store references to info icon elements
  let infoElements: { [key: string]: HTMLElement } = {};

  const marginKeys = new Set([
    "freeCashFlowYield",
    "returnOnEquity",
    "returnOnAssets",
    "returnOnInvestedCapital",
    "returnOnCapitalEmployed",
  ]);

  const isGrowthField = (field?: { key?: string; growthOf?: string }) => {
    if (!field) return false;
    if (field.growthOf) {
      return true;
    }
    return /^growth/i.test(field.key ?? "");
  };

  const isPercentMetricKey = (key?: string | null) => {
    if (!key) return false;
    if (marginKeys.has(key)) {
      return true;
    }
    return /^growth/i.test(key);
  };

  const YOY_REGEX = /\bYoY\b/i;

  const appendYoYSuffix = (label: string) => {
    const normalized = label.trim();
    if (!normalized) {
      return stock_detail_financials_growth_yoy();
    }
    return YOY_REGEX.test(normalized) ? normalized : `${normalized} (YoY)`;
  };

  const getDisplayLabel = (field?: {
    label?: string;
    key?: string;
    isGrowth?: boolean;
    growthOf?: string;
  }) => {
    if (!field) return "";
    const baseLabel = (field.label ?? field.key ?? "").toString().trim();
    if (!baseLabel) {
      return "";
    }
    const treatAsGrowth = field.isGrowth ?? isGrowthField(field);
    return treatAsGrowth ? appendYoYSuffix(baseLabel) : baseLabel;
  };

  let growthFieldKeys: Set<string> = new Set();
  let visibleGrowthKeys: Set<string> = new Set();

  const sanitizeFavoriteList = (keys: string[] = []) => {
    if (!Array.isArray(keys)) return [];
    const availableKeys = new Set(fields.map((field) => field.key));
    return keys.filter(
      (key) => availableKeys.has(key) && !growthFieldKeys.has(key),
    );
  };

  const createGrowthMapping = (
    fieldList: { key: string; growthOf?: string }[] = [],
  ) => {
    const mapping = new Map<string, string[]>();
    fieldList.forEach((field) => {
      if (!field?.growthOf) return;
      if (!mapping.has(field.growthOf)) {
        mapping.set(field.growthOf, []);
      }
      mapping.get(field.growthOf)?.push(field.key);
    });
    return mapping;
  };

  let growthMapping: Map<string, string[]> = new Map();

  const hasGrowthChildren = (baseKey: string) =>
    Boolean(growthMapping.get(baseKey)?.length);

  const isGrowthActive = (baseKey: string) => {
    const keys = growthMapping.get(baseKey);
    if (!keys?.length) {
      return false;
    }
    return keys.every((key) => visibleGrowthKeys.has(key));
  };

  function toggleGrowthVisibility(baseKey: string) {
    const growthKeys = growthMapping.get(baseKey);
    if (!growthKeys?.length) {
      return;
    }
    const shouldShow = !growthKeys.every((key) => visibleGrowthKeys.has(key));
    const updated = new Set(visibleGrowthKeys);
    growthKeys.forEach((key) => {
      if (shouldShow) {
        updated.add(key);
      } else {
        updated.delete(key);
      }
    });
    visibleGrowthKeys = updated;
  }

  const sanitizeKey = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9/_-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  function buildStorageKey() {
    const base =
      favoriteStorageKey?.toString().trim() ||
      (isBrowser ? window.location.pathname : "") ||
      DEFAULT_STORAGE_PREFIX;
    const pathNormalized = base.startsWith("/")
      ? base.replace(/\/stocks\/[^/]+/i, "/stocks/_")
      : base;
    return `favorite_${sanitizeKey(pathNormalized)}`;
  }

  function persistFavorites(updatedList: string[]) {
    if (!enableFavorites || !isBrowser) return;
    localStorageKey = buildStorageKey();
    try {
      window.localStorage.setItem(localStorageKey, JSON.stringify(updatedList));
    } catch (error) {
      console.warn("Failed to save favorite metrics:", error);
    }
  }

  function loadFavorites() {
    if (!enableFavorites || !isBrowser) return;
    localStorageKey = buildStorageKey();
    try {
      const stored = window.localStorage.getItem(localStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const sanitized = sanitizeFavoriteList(parsed);
        favoriteMetrics = sanitized;
        if (sanitized.length !== parsed.length) {
          persistFavorites(sanitized);
        }
      }
    } catch (error) {
      console.warn("Failed to load favorite metrics:", error);
    }
  }

  function toggleFavorite(metricKey: string) {
    if (!enableFavorites || growthFieldKeys.has(metricKey)) return;
    const isFavorite = favoriteSet.has(metricKey);
    const updatedList = isFavorite
      ? favoriteMetrics.filter((key) => key !== metricKey)
      : [...favoriteMetrics, metricKey];
    favoriteMetrics = updatedList;
    persistFavorites(updatedList);
    if (!isFavorite) {
      animationKey = null;
      animationKey = metricKey;
    }
  }

  function handleAnimationEnd(metricKey: string) {
    if (animationKey === metricKey) {
      animationKey = null;
    }
  }

  const buildFieldGroups = (fieldList) => {
    const groups = [];
    let index = 0;
    while (index < fieldList.length) {
      const field = fieldList[index];
      if (field.isGrowth) {
        groups.push({
          base: field,
          items: [field],
          originalIndex: field.originalIndex,
        });
        index += 1;
        continue;
      }

      const items = [field];
      let nextIndex = index + 1;
      while (
        nextIndex < fieldList.length &&
        fieldList[nextIndex].isGrowth &&
        fieldList[nextIndex].growthOf === field.key
      ) {
        items.push(fieldList[nextIndex]);
        nextIndex += 1;
      }

      groups.push({
        base: field,
        items,
        originalIndex: field.originalIndex,
      });
      index = nextIndex;
    }

    return groups;
  };

  const flattenGroups = (groups) =>
    groups.flatMap((group) => (group?.items ? group.items : []));

  $: growthMapping = createGrowthMapping(fields);

  $: growthFieldKeys = new Set(
    fields.filter((field) => isGrowthField(field)).map((field) => field.key),
  );

  $: {
    const validKeys = new Set(fields.map((field) => field.key));
    const filtered = Array.from(visibleGrowthKeys).filter((key) =>
      validKeys.has(key),
    );
    if (filtered.length !== visibleGrowthKeys.size) {
      visibleGrowthKeys = new Set(filtered);
    }
  }

  $: {
    const baseFields = fields.map((field, index) => {
      const normalizedField = {
        ...field,
        isMargin: isPercentMetricKey(field.key),
        isGrowth: isGrowthField(field),
        originalIndex: index,
      };
      return {
        ...normalizedField,
        displayLabel: getDisplayLabel(normalizedField),
      };
    });

    const groups = buildFieldGroups(baseFields);

    if (enableFavorites) {
      const sorted = [...groups].sort((a, b) => {
        const aFavorite = !a.base.isGrowth && favoriteSet.has(a.base.key);
        const bFavorite = !b.base.isGrowth && favoriteSet.has(b.base.key);
        if (aFavorite !== bFavorite) {
          return aFavorite ? -1 : 1;
        }
        return a.originalIndex - b.originalIndex;
      });
      computedFields = flattenGroups(sorted);
    } else {
      computedFields = flattenGroups(groups);
    }
  }

  $: if (enableFavorites) {
    const filteredFavorites = sanitizeFavoriteList(favoriteMetrics);
    if (filteredFavorites.length !== favoriteMetrics.length) {
      favoriteMetrics = filteredFavorites;
      persistFavorites(filteredFavorites);
    }
  }

  $: if (enableFavorites) {
    favoriteSet = new Set(sanitizeFavoriteList(favoriteMetrics));
  } else {
    favoriteSet = new Set();
  }

  $: isCurrentMargin = currentKey ? isPercentMetricKey(currentKey) : false;

  // Helper to format the cell value
  function formatValue(
    value: number | null | undefined,
    isMargin: boolean,
  ): string {
    if (value === null || value === undefined) {
      return "-";
    }
    if (isMargin) {
      const percentValue = Number((value * 100).toFixed(2));
      const formattedPercent = abbreviateNumber(percentValue);
      return `${formattedPercent}%`;
    }
    const normalizedValue = Number(value.toFixed(2));
    return abbreviateNumber(normalizedValue);
  }

  const getGrowthDeltaClass = (value: unknown) => {
    const numericValue = Number(value);
    if (!Number?.isFinite(numericValue) || numericValue === 0) {
      return "";
    }
    return numericValue > 0
      ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
      : numericValue < 0
        ? "text-rose-800 dark:text-rose-400"
        : "text-gray-600 dark:text-zinc-300";
  };

  function formatModalMetricValue(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return "-";
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "-";
    }

    const roundedValue = Number(numericValue.toFixed(2));
    const formattedValue = abbreviateNumber(roundedValue);
    return isCurrentMargin ? `${formattedValue}%` : formattedValue;
  }

  function getEntryTimestamp(entry: Record<string, any> | undefined) {
    if (!entry?.date) return null;
    const timestamp = Date.parse(entry.date);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  function getPeriodSortValue(period: string | undefined) {
    if (!period) return 0;
    const normalized = period.toUpperCase();
    if (normalized === "FY") return 5;
    if (normalized === "TTM" || normalized === "LTM") return 6;
    const quarterMatch = normalized.match(/^Q([1-4])$/);
    if (quarterMatch) {
      return Number(quarterMatch[1]);
    }
    return 0;
  }

  function sortStatementsChronologically(list: any[] = []) {
    return [...list].sort((a, b) => {
      const timeA = getEntryTimestamp(a);
      const timeB = getEntryTimestamp(b);
      if (timeA !== null && timeB !== null && timeA !== timeB) {
        return timeA - timeB;
      }
      if (timeA !== null && timeB === null) {
        return -1;
      }
      if (timeA === null && timeB !== null) {
        return 1;
      }

      const yearA = Number(a?.fiscalYear) || 0;
      const yearB = Number(b?.fiscalYear) || 0;
      if (yearA !== yearB) {
        return yearA - yearB;
      }

      const periodValueA = getPeriodSortValue(a?.period);
      const periodValueB = getPeriodSortValue(b?.period);
      return periodValueA - periodValueB;
    });
  }

  function goToUpgrade(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!upgradeHref) return;
    goto(upgradeHref);
  }

  function extractFiscalYear(entry: Record<string, any>) {
    if (entry?.fiscalYear) {
      return entry.fiscalYear;
    }
    if (entry?.date) {
      const parsed = Date.parse(entry.date);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed).getFullYear();
      }
    }
    return "";
  }

  function formatDateLabel(
    entry: Record<string, any>,
    currentPeriod: typeof periodType,
  ) {
    const fiscalYear = extractFiscalYear(entry);
    if (currentPeriod === "quarterly" || currentPeriod === "ttm") {
      const periodLabel =
        entry?.period ?? (currentPeriod === "ttm" ? "TTM" : "");
      if (periodLabel && fiscalYear) {
        return `${periodLabel} FY ${fiscalYear}`;
      }
      return periodLabel || fiscalYear || "-";
    }

    // Annual view falls back to fiscal year (or date-derived year)
    return fiscalYear || "-";
  }

  function getRangeYears(rangeValue: string): number | null {
    if (rangeValue === "5Y") return 5;
    if (rangeValue === "10Y") return 10;
    return null;
  }

  function getComparableTimestamp(entry: Record<string, any>): number | null {
    const timestamp = getEntryTimestamp(entry);
    if (timestamp !== null) {
      return timestamp;
    }
    const fiscalYear = Number(extractFiscalYear(entry));
    if (Number.isFinite(fiscalYear)) {
      return Date.UTC(fiscalYear, 0, 1);
    }
    return null;
  }

  // Limit the statements to the selected lookback window while preserving order.
  function filterDataByRange(
    entries: Record<string, any>[] = [],
    rangeValue: string,
  ) {
    if (!entries.length || rangeValue === "MAX") {
      return entries;
    }

    const yearsToFilter = getRangeYears(rangeValue);
    if (!yearsToFilter) {
      return entries;
    }

    const enrichedEntries = entries.map((entry) => ({
      entry,
      timestamp: getComparableTimestamp(entry),
    }));

    const validTimestamps = enrichedEntries
      .map(({ timestamp }) => timestamp)
      .filter((timestamp): timestamp is number => timestamp !== null);

    if (!validTimestamps.length) {
      return entries;
    }

    const latestTimestamp = Math.max(...validTimestamps);
    const thresholdDate = new Date(latestTimestamp);
    thresholdDate.setFullYear(thresholdDate.getFullYear() - yearsToFilter);
    const thresholdTimestamp = thresholdDate.getTime();

    const filteredEntries = enrichedEntries
      .filter(({ timestamp }) => {
        if (timestamp === null) {
          return true;
        }
        return timestamp >= thresholdTimestamp;
      })
      .map(({ entry }) => entry);

    return filteredEntries.length > 0 ? filteredEntries : entries;
  }

  function plotData(label, key) {
    const rawData = sortStatementsChronologically(data);
    const rangedData = filterDataByRange(rawData, selectedRange);

    // Filter out entries with undefined/null values
    const filteredData = rangedData.filter(
      (item) => item?.[key] !== undefined && item?.[key] !== null,
    );

    const isMarginMetric = isPercentMetricKey(key);

    const normalizedData = filteredData
      .map((item) => {
        const rawValue = Number(item[key]);
        if (Number.isNaN(rawValue)) {
          return null;
        }

        const value = isMarginMetric ? rawValue * 100 : rawValue;
        const dateLabel = formatDateLabel(item, periodType);

        return { value, dateLabel };
      })
      .filter(Boolean);

    const dateList = normalizedData.map((entry) => entry.dateLabel);
    const valueList = normalizedData.map((entry) => entry.value);

    // Calculate highest and lowest value
    highestValue = null;
    lowestValue = null;
    highestValueDate = null;
    lowestValueDate = null;

    if (valueList?.length > 0) {
      highestValue = Math.max(...valueList);
      lowestValue = Math.min(...valueList);

      const highestValueIndex = valueList.indexOf(highestValue);
      const lowestValueIndex = valueList.indexOf(lowestValue);

      highestValueDate = dateList[highestValueIndex] || null;
      lowestValueDate = dateList[lowestValueIndex] || null;
    }

    const options = {
      chart: {
        type: chartMode === "bar" ? "column" : "spline",
        backgroundColor: $mode === "light" ? "#fff" : "#09090b",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090b",
        height: 360,
        animation: false,
      },
      credits: { enabled: false },
      legend: { enabled: false },
      plotOptions: {
        series: {
          color: "white",
          animation: false,
          dataLabels: {
            enabled: false,
            color: "white",
            style: { fontSize: "13px", fontWeight: "bold" },
            formatter: function () {
              const value =
                typeof this.y === "number" ? this.y : Number(this.y ?? NaN);
              if (!Number.isFinite(value)) {
                return "-";
              }
              const roundedValue = Number(value.toFixed(2));
              const formatted = abbreviateNumber(roundedValue);
              return isMarginMetric ? `${formatted}%` : formatted;
            },
          },
        },
      },
      title: {
        text: `<h3 class="mt-3 mb-1 sm:text-lg">${$stockTicker} ${label}</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      xAxis: {
        categories: dateList,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          rotation: -45,
          distance: 10,
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#404657",
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          formatter: function () {
            const formattedValue = abbreviateNumber(this.value);
            return isMarginMetric ? `${formattedValue}%` : formattedValue;
          },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "16px", padding: "10px" },
        borderRadius: 4,
        formatter: function () {
          let tooltipContent = `<span class="text-white text-[1rem] font-[501]">${this.points[0]?.key}</span><br>`;
          this.points.forEach((point) => {
            const value =
              typeof point.y === "number" ? point.y : Number(point.y ?? NaN);
            let formattedValue = "-";
            if (Number.isFinite(value)) {
              const roundedValue = Number(value.toFixed(2));
              formattedValue = abbreviateNumber(roundedValue);
            }
            const suffix = isMarginMetric && formattedValue !== "-" ? "%" : "";
            tooltipContent += `<span class="text-white font-semibold text-sm">${point.series.name}:</span>
          <span class="text-white font-normal text-sm">${formattedValue}${suffix}</span><br>`;
          });
          return tooltipContent;
        },
      },
      series: [
        {
          name: label,
          data: valueList,
          color: $mode === "light" ? "#2C6288" : "white",
          borderColor: $mode === "light" ? "#2C6288" : "white",
          borderRadius: "1px",
          animation: false,
        },
      ],
    };

    return options;
  }

  async function handleChart(label, key) {
    modalLabel = label;
    currentLabel = label; // Add this
    currentKey = key; // Add this
    config = plotData(label, key);
  }

  async function getInfoText(parameter) {
    const cachedData = getCache(parameter, "getInfoText");
    if (cachedData) {
      return cachedData;
    }

    const postData = { parameter };
    const response = await fetch("/api/info-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const infoText = await response.json();
    setCache(parameter, infoText, "getInfoText");
    return infoText;
  }

  function toggleRangeMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    rangeMenuOpen = !rangeMenuOpen;
  }

  function closeRangeMenu() {
    rangeMenuOpen = false;
  }

  function handleRangeSelection(option: RangeOption, event?: Event) {
    event?.stopPropagation();
    event?.preventDefault();

    const requiresUpgrade = option.locked && showUpgradeColumn;
    if (requiresUpgrade) {
      closeRangeMenu();
      goToUpgrade();
      return;
    }
    if (selectedRange !== option.value) {
      selectedRange = option.value;
      if (currentLabel && currentKey) {
        config = plotData(currentLabel, currentKey);
      }
    }
    closeRangeMenu();
  }

  function handleGlobalPointerDown(event: PointerEvent) {
    if (!rangeMenuOpen) return;
    const target = event.target as Node;
    if (!rangeDropdownRef?.contains(target)) {
      closeRangeMenu();
    }
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeRangeMenu();
    }
  }

  onMount(() => {
    if (enableFavorites) {
      loadFavorites();
    }

    // Initialize tippy for all info elements
    Object.entries(infoElements).forEach(([key, element]) => {
      if (!element) return;

      const field = fields.find((f) => f.key === key);
      if (!field) return;
      const infoLabel = getDisplayLabel(field);

      tippy(element, {
        trigger: "mouseenter focus",
        placement: "bottom",
        theme: "minimal",
        allowHTML: true,
        appendTo: () => document.body,
        zIndex: 9999,
        interactive: true,
        delay: [200, 100],
        onShow: async (instance) => {
          instance.setContent(`
            <div class="info-tooltip">
              <div class="info-tooltip__title">${infoLabel}</div>
              <div class="info-tooltip__body">${stock_detail_financials_loading()}</div>
            </div>
          `);
          try {
            const content = await getInfoText(key);
            instance.setContent(`
              <div class="info-tooltip">
                <div class="info-tooltip__title">${infoLabel}</div>
                <div class="info-tooltip__body">${content?.text || "n/a"}</div>
                ${
                  content?.equation
                    ? `<div class="info-tooltip__equation">${content?.equation}</div>`
                    : ""
                }
              </div>
            `);
          } catch (error) {
            instance.setContent(`
              <div class="info-tooltip">
                <div class="info-tooltip__title">${infoLabel}</div>
                <div class="info-tooltip__body">${stock_detail_financials_error_loading()}</div>
              </div>
            `);
          }
        },
      });
    });

    if (isBrowser) {
      document.addEventListener("pointerdown", handleGlobalPointerDown);
      document.addEventListener("keydown", handleGlobalKeydown);
    }

    return () => {
      if (isBrowser) {
        document.removeEventListener("pointerdown", handleGlobalPointerDown);
        document.removeEventListener("keydown", handleGlobalKeydown);
      }
    };
  });

  function toggleMode() {
    if (chartMode === "bar") {
      chartMode = "line";
    } else {
      chartMode = "bar";
    }
    // Re-render the chart with the new mode
    if (currentLabel && currentKey) {
      config = plotData(currentLabel, currentKey);
    }
  }
</script>

{#each computedFields as field (field.key)}
  {#if !field.isGrowth || visibleGrowthKeys.has(field.key)}
    <tr
      class="whitespace-nowrap transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50"
    >
      <td
        class="text-start min-w-72 max-w-72 sm:min-w-96 sm:max-w-96 text-sm sm:text-[0.95rem] border-r border-gray-300 dark:border-zinc-700 w-full flex flex-row items-center justify-between text-gray-700 dark:text-zinc-200"
      >
        <div class="flex items-center gap-2">
          {#if enableFavorites && !field.isGrowth}
            <button
              type="button"
              aria-label={`${favoriteSet.has(field.key) ? "Remove" : "Add"} ${field.displayLabel ?? field.label} favorite`}
              aria-pressed={favoriteSet.has(field.key)}
              class={`cursor-pointer favorite-toggle w-5 h-5 inline-flex items-center justify-center transition-colors ${favoriteSet.has(field.key) ? "text-yellow-500 dark:text-[#FFA500]" : "text-gray-400 dark:text-gray-300"}`}
              on:click|stopPropagation={() => toggleFavorite(field.key)}
              title={`${favoriteSet.has(field.key) ? "Remove" : "Add"} ${field.displayLabel ?? field.label} favorite`}
            >
              <svg
                class={`w-4 h-4 shrink-0 ${animationKey === field.key ? "heartbeat" : ""}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                on:animationend={() => handleAnimationEnd(field.key)}
              >
                <path
                  fill="currentColor"
                  d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327l4.898.696c.441.062.612.636.282.95l-3.522 3.356l.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
                />
              </svg>
            </button>
          {/if}

          <div
            bind:this={infoElements[field.key]}
            class="truncate w-fit max-w-40 sm:max-w-64 cursor-text flex items-center"
          >
            <span
              class="truncate"
              class:ml-7={field?.displayLabel?.includes("Growth (YoY)")}
              >{field.displayLabel ?? field.label}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          {#if !field.isGrowth && hasGrowthChildren(field.key)}
            <button
              type="button"
              class="cursor-pointer w-5 h-5 inline-flex items-center justify-center rounded border border-transparent transition-colors"
              aria-label={`${isGrowthActive(field.key) ? "Hide" : "Show"} ${field.displayLabel ?? field.label} growth`}
              aria-pressed={isGrowthActive(field.key)}
              on:click|stopPropagation={() => toggleGrowthVisibility(field.key)}
              title={`${isGrowthActive(field.key) ? "Hide" : "Show"} ${field.displayLabel ?? field.label} growth`}
            >
              <GrowthRate class="w-4 h-4 text-gray-500 dark:text-zinc-300" />
            </button>
          {/if}

          <label
            for="financialPlotModal"
            on:click={() =>
              handleChart(field.displayLabel ?? field.label, field.key)}
            class="cursor-pointer inline-block"
          >
            <svg
              class="w-5 h-5 text-gray-500 dark:text-zinc-300"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g><g id="SVGRepo_iconCarrier">
                <path
                  d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </g></svg>

          </label>
        </div>
      </td>
      {#each data as item}
        <td
          class={`text-sm sm:text-[0.95rem] text-end border-r border-gray-300 dark:border-zinc-700  tabular-nums ${field.isGrowth ? getGrowthDeltaClass(item[field.key]) : ""}`}
        >
          {formatValue(item[field.key], field.isMargin)}
        </td>
      {/each}
      {#if showUpgradeColumn}
        <td
          class="text-xs sm:text-sm text-end border-r border-gray-300 dark:border-zinc-700"
        >
          <a
            class="inline-flex w-full items-center justify-end gap-1 font-semibold text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            href={upgradeHref}
            on:click|preventDefault={goToUpgrade}
          >
            {upgradeLabel}
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
          </a>
        </td>
      {/if}
    </tr>
  {/if}
{/each}

<input type="checkbox" id="financialPlotModal" class="modal-toggle" />
<dialog id="financialPlotModal" class="modal px-3">
  <label for="financialPlotModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="financial-modal modal-box w-full max-w-3xl p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="financialPlotModal"
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
        /></svg>
    </label>
    {#if config}
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full"
      >
        <div class="relative w-full sm:w-auto" bind:this={rangeDropdownRef}>
          <button
            type="button"
            class="cursor-pointer w-auto transition-all duration-50 border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 flex items-center justify-between px-3 py-2 rounded-full text-sm text-gray-900 dark:text-white"
            aria-haspopup="menu"
            aria-expanded={rangeMenuOpen}
            on:click={toggleRangeMenu}
          >
            <span class="truncate text-[0.85rem] sm:text-sm"
              >{selectedRange}</span
            >
            <svg
              class="ml-2 h-4 w-4 inline-block shrink-0"
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

          {#if rangeMenuOpen}
            <div
              tabindex="0"
              role="menu"
              class="absolute z-40 rounded-xl bg-white/95 dark:bg-zinc-950/95 py-1 focus:outline-none min-w-[90px] left-0 right-0 origin-top-right border border-gray-300 shadow dark:border-zinc-700 text-gray-700 dark:text-zinc-200 shadow-none"
            >
              {#each RANGE_OPTIONS as option}
                <button
                  type="button"
                  class={`cursor-pointer dd flex w-full items-center justify-between whitespace-nowrap px-4 py-2 text-sm sm:hover:text-violet-800 dark:sm:hover:text-violet-400 sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60`}
                  title={option.label}
                  on:click={(event) => handleRangeSelection(option, event)}
                >
                  <span>{option.label}</span>
                  {#if option.locked && showUpgradeColumn}
                    <svg
                      class="h-4 w-4 text-gray-500 dark:text-zinc-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <Button
          on:click={toggleMode}
          class="w-fit transition-all duration-50 border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white flex flex-row justify-between items-center w-full sm:w-auto px-3 py-2 rounded-full truncate"
        >
          {#if chartMode === "bar"}
            <LineChart class="w-4.5 h-4.5" />
            <span class="ml-1 mr-auto text-sm">
              {stock_detail_financials_line_chart()}
            </span>
          {:else}
            <BarChart class="w-4.5 h-4.5" />
            <span class="ml-1 mr-auto text-sm">
              {stock_detail_financials_bar_chart()}
            </span>
          {/if}</Button
        >
      </div>

      <div class="" use:highcharts={config}></div>
    {/if}
    <p class="text-sm mb-6 mt-3">
      {stock_detail_financials_peaked_at({
        label: modalLabel,
        highest: formatModalMetricValue(highestValue),
        highDate: highestValueDate,
        lowest: formatModalMetricValue(lowestValue),
        lowDate: lowestValueDate,
      })}
    </p>

    <div class="border-t border-gray-300 dark:border-zinc-700 mt-2 w-full">
      <label
        for="financialPlotModal"
        class="mt-4 font-semibold text-base text-gray-700 dark:text-zinc-200 m-auto flex justify-center cursor-pointer"
      >
        {stock_detail_close()}
      </label>
    </div>
  </div>
</dialog>

<style>
  .heartbeat {
    animation: heartbeat-animation 0.3s;
    animation-timing-function: ease-in-out;
  }

  @keyframes heartbeat-animation {
    0% {
      transform: rotate(0deg) scale(0.95);
    }
    25% {
      transform: rotate(10deg) scale(1.05);
    }
    50% {
      transform: rotate(0deg) scale(1.2);
    }
    75% {
      transform: rotate(-10deg) scale(1.05);
    }
    100% {
      transform: rotate(0deg) scale(0.95);
    }
  }

  :global(.financial-modal .highcharts-background) {
    fill: #ffffff;
  }

  :global(.dark .financial-modal .highcharts-background) {
    fill: #09090b;
  }
</style>