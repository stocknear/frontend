<script lang="ts">
  import {
    screenWidth,
    isOpen,
    isHoliday,
    isBeforeMarketOpen,
    isAfterMarketClose,
    isWeekend,
  } from "$lib/store";
  import {
    abbreviateNumber,
    calculateChange,
    updateStockList,
  } from "$lib/utils";
  import { onMount, onDestroy, tick } from "svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import HoverStockChart from "$lib/components/HoverStockChart.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import Pagination from "$lib/components/Table/Pagination.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import { page } from "$app/stores";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import Infobox from "$lib/components/Infobox.svelte";
  import Pencil from "lucide-svelte/icons/pencil";
  import {
    list_add_label,
    list_clear,
    list_indicators_label,
    list_reset_column_order,
    list_search_indicators_placeholder,
    list_search_placeholder,
    list_toast_unlock_pro,
    common_tab_general,
    common_tab_performance,
    common_tab_financials,
    common_tab_analysts,
    common_tab_dividends,
    common_tab_indicators,
  } from "$lib/paraglide/messages.js";

  export let data;
  export let rawData;
  export let title = null;
  export let date = null;
  export let bulkDownload = false;
  export let includePrePostData = false;
  export let excludedRules = new Set([
    "volume",
    "price",
    "changesPercentage",
    "revenue",
    "eps",
    "marketCap",
  ]);
  type ColumnRule = {
    name: string;
    rule: string;
    type?: string;
    sessionOnly?: boolean;
  };

  type TableTab = {
    key: string;
    label: string;
    showCount?: boolean;
  };

  const DEFAULT_INDICATOR_ROWS: ColumnRule[] = [];
  const DEFAULT_TAB_RULE_SETS: Record<string, ColumnRule[]> = {
    performance: [
      { name: "Price Change 1W", rule: "change1W", type: "percentSign" },
      { name: "Price Change 1M", rule: "change1M", type: "percentSign" },
      { name: "Price Change 3M", rule: "change3M", type: "percentSign" },
      { name: "Price Change 6M", rule: "change6M", type: "percentSign" },
      { name: "Price Change 1Y", rule: "change1Y", type: "percentSign" },
    ],
    financials: [
      { name: "Revenue", rule: "revenue", type: "int" },
      { name: "EBITDA", rule: "ebitda", type: "int" },
      { name: "Net Income", rule: "netIncome", type: "int" },
      { name: "FCF", rule: "freeCashFlow", type: "int" },
      { name: "EPS", rule: "eps", type: "float" },
      { name: "PE Ratio", rule: "priceToEarningsRatio", type: "float" },
      { name: "PB Ratio", rule: "priceToBookRatio", type: "float" },
    ],
    analysts: [
      { name: "Price", rule: "price", type: "float" },
      { name: "Analyst Rating", rule: "analystRating", type: "rating" },
      { name: "Analyst Count", rule: "analystCounter", type: "int" },
      { name: "Price Target", rule: "priceTarget", type: "float" },
      { name: "Upside", rule: "upside", type: "percentSign" },
    ],
    dividends: [
      { name: "Dividend Yield", rule: "dividendYield", type: "percent" },
      { name: "Dividend Growth", rule: "dividendGrowth", type: "percentSign" },
      { name: "Payout Ratio", rule: "payoutRatio", type: "percent" },
      { name: "Payout Frequency", rule: "payoutFrequency", type: "str" },
    ],
  };

  let defaultTableTabs: TableTab[] = [
    { key: "general", label: common_tab_general() },
    { key: "performance", label: common_tab_performance() },
    { key: "financials", label: common_tab_financials() },
    { key: "analysts", label: common_tab_analysts() },
    { key: "dividends", label: common_tab_dividends() },
    {
      key: "indicators",
      label: common_tab_indicators(),
      showCount: true,
    },
  ];

  export let tableTabs: TableTab[] = [];
  export let tabRuleSets: Record<string, ColumnRule[]> = DEFAULT_TAB_RULE_SETS;
  export let indicatorRowsOverride: ColumnRule[] = [];
  export let indicatorDefaultRows: ColumnRule[] = DEFAULT_INDICATOR_ROWS;
  export let specificRows: ColumnRule[] = [];

  const SESSION_ONLY_RULES = new Set([
    "preMarketPrice",
    "preMarketChangesPercentage",
    "afterMarketPrice",
    "afterMarketChangesPercentage",
  ]);

  // Rules hidden from dropdown but can still be displayed in table
  const DROPDOWN_HIDDEN_RULES = new Set([
    ...SESSION_ONLY_RULES,
    "addedPrice",
    "sinceAdded",
  ]);

  const PREMARKET_SESSION_COLUMNS: ColumnRule[] = [
    {
      name: "Premkt Price",
      rule: "preMarketPrice",
      type: "float",
      sessionOnly: true,
    },
    {
      name: "% Premkt Change",
      rule: "preMarketChangesPercentage",
      type: "percentSign",
      sessionOnly: true,
    },
  ];

  const AFTERMARKET_SESSION_COLUMNS: ColumnRule[] = [
    {
      name: "Aftermkt Price",
      rule: "afterMarketPrice",
      type: "float",
      sessionOnly: true,
    },
    {
      name: "% Aftermkt Change",
      rule: "afterMarketChangesPercentage",
      type: "percentSign",
      sessionOnly: true,
    },
  ];

  export let defaultList: ColumnRule[] = [
    { name: "Market Cap", rule: "marketCap" },
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Revenue", rule: "revenue" },
  ];

  const isNonEmptyRule = (rule: string | undefined): rule is string =>
    typeof rule === "string" && rule.length > 0;

  const defaultRules =
    defaultList?.map((item) => item?.rule)?.filter(isNonEmptyRule) ?? [];
  let tableDefaultRuleSet: Set<string> = new Set(defaultRules);
  let activeIndicatorDefaultRows: ColumnRule[] = [...DEFAULT_INDICATOR_ROWS];
  $: activeIndicatorDefaultRows =
    indicatorDefaultRows?.length > 0
      ? indicatorDefaultRows.filter((item) => item?.rule)
      : [...DEFAULT_INDICATOR_ROWS];
  let indicatorDefaultRuleSet = new Set(
    activeIndicatorDefaultRows.map((item) => item.rule),
  );
  $: indicatorDefaultRuleSet = new Set(
    activeIndicatorDefaultRows.map((item) => item.rule),
  );

  // Navigation tabs and predefined rule sets
  let displayTableTab = "general";
  let resolvedTableTabs: TableTab[] = [...defaultTableTabs];
  $: defaultTableTabs = [
    { key: "general", label: common_tab_general() },
    { key: "performance", label: common_tab_performance() },
    { key: "financials", label: common_tab_financials() },
    { key: "analysts", label: common_tab_analysts() },
    { key: "dividends", label: common_tab_dividends() },
    {
      key: "indicators",
      label: common_tab_indicators(),
      showCount: true,
    },
  ];
  $: resolvedTableTabs =
    tableTabs?.length > 0 ? tableTabs : [...defaultTableTabs];
  $: {
    const fallbackTab = resolvedTableTabs?.[0]?.key ?? "general";
    if (!resolvedTableTabs?.some((tab) => tab?.key === displayTableTab)) {
      displayTableTab = fallbackTab;
    }
  }

  $: if (displayTableTab !== "indicators") {
    const baseRules =
      displayTableTab === "general"
        ? defaultList
        : (tabRuleSets[displayTableTab] ?? defaultList);

    tableDefaultRuleSet = new Set(
      baseRules?.map((item) => item?.rule)?.filter(isNonEmptyRule) ?? [],
    );
  }

  export let hideLastRow = false;
  export let editMode = false;
  export let deleteTickerList = [];
  export let onToggleDeleteTicker = null;
  export let onPortfolioUpdate = null; // Callback for portfolio data changes
  export let onNoteClick: ((symbol: string, hasNote: boolean) => void) | null =
    null; // Callback for note editing (watchlist)
  export let onNoteHover: ((symbol: string, hasNote: boolean) => void) | null =
    null; // Callback for prefetching note on hover

  let originalData = [...rawData]; // Unaltered copy of raw data
  let initialRawData = [...rawData]; // Store the truly initial data
  let ruleOfList: ColumnRule[] = mergeSessionColumns(defaultList, {
    includeSessionColumns: true,
  });
  let socket;
  let sortMode = false;
  let inputValue = "";

  // Initialize portfolio calculations on data load using worker
  async function initializePortfolioCalculations(
    data: DataRow[],
  ): Promise<void> {
    if (!Array?.isArray(data) || data?.length === 0) return;

    // Check if data has portfolio-specific fields (shares, avgPrice)
    const hasPortfolioFields = data.some(
      (item) =>
        item?.hasOwnProperty("shares") || item?.hasOwnProperty("avgPrice"),
    );

    if (!hasPortfolioFields || !portfolioWorker) {
      // Not a portfolio context or worker not ready, skip calculation
      return;
    }

    // Use the worker to calculate portfolio metrics
    portfolioWorker.postMessage({ data });
  }

  let searchWorker: Worker | undefined;
  let portfolioWorker: Worker | undefined;

  let pagePathName = $page?.url?.pathname;

  let testList = [];
  let searchQuery = "";
  let activeSortKey = null;

  let downloadWorker: Worker | undefined;
  let checkedItems;

  type DataRow = {
    [key: string]: unknown;
    symbol?: string;
    ticker?: string;
    id?: string;
    name?: string;
    slug?: string;
    code?: string;
  };

  const inlineEditableColumns = new Set(["avgPrice", "shares"]);
  let activeInlineCells = new Set<string>();
  let editingValues = new Map<string, string>();

  function formatEditableValue(value: unknown, key: string): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "number" && Number?.isFinite(value)) {
      if (key === "avgPrice") {
        return value?.toFixed(2);
      } else {
        const rounded = Math?.round(value * 100) / 100;
        return rounded % 1 === 0
          ? String(Math?.round(rounded))
          : rounded?.toFixed(2);
      }
    }

    if (typeof value === "string") {
      const num = parseFloat(value);
      if (!isNaN(num) && Number?.isFinite(num)) {
        if (key === "avgPrice") {
          return num?.toFixed(2);
        } else {
          const rounded = Math?.round(num * 100) / 100;
          return rounded % 1 === 0
            ? String(Math?.round(rounded))
            : rounded?.toFixed(2);
        }
      }
      return value;
    }

    return "";
  }

  let rowKeyWeakMap = new WeakMap<object, string>();
  let initialOrderMap = new Map<string, number>();
  let initialOrderCounter = 0;
  let generatedRowKeyCounter = 0;

  function getRowIdentifier(
    item: DataRow | undefined,
    fallbackIndex = 0,
  ): string {
    if (!item || typeof item !== "object") {
      return `__primitive_${fallbackIndex}`;
    }

    const stableKey =
      (typeof item.symbol === "string" && item.symbol) ||
      (typeof item.ticker === "string" && item.ticker) ||
      (typeof item.id === "string" && item.id) ||
      (typeof item.slug === "string" && item.slug) ||
      (typeof item.name === "string" && item.name) ||
      (typeof item.code === "string" && item.code);

    if (stableKey) {
      return stableKey;
    }

    if (!rowKeyWeakMap?.has(item)) {
      rowKeyWeakMap?.set(item, `__row_${generatedRowKeyCounter++}`);
    }

    return rowKeyWeakMap?.get(item) ?? `__row_${generatedRowKeyCounter++}`;
  }

  function registerInitialOrder(
    data: DataRow[] | undefined,
    reset = false,
  ): void {
    if (!data) return;

    if (reset) {
      initialOrderMap = new Map();
      initialOrderCounter = 0;
      generatedRowKeyCounter = 0;
      rowKeyWeakMap = new WeakMap<object, string>();
    }

    data.forEach((item, index) => {
      const key = getRowIdentifier(item, index);
      if (!initialOrderMap.has(key)) {
        initialOrderMap.set(key, initialOrderCounter++);
      }
    });
  }

  function getInitialOrderIndex(
    item: DataRow | undefined,
    fallbackIndex = 0,
  ): number {
    const key = getRowIdentifier(item, fallbackIndex);
    if (!initialOrderMap.has(key)) {
      initialOrderMap.set(key, initialOrderCounter++);
    }
    return initialOrderMap.get(key) ?? initialOrderCounter;
  }

  function sortByInitialOrder(data: DataRow[] | undefined): DataRow[] {
    if (!data) return [];
    return [...data].sort(
      (a, b) => getInitialOrderIndex(a) - getInitialOrderIndex(b),
    );
  }

  function getInlineRowKey(row: DataRow | undefined, rowIndex: number): string {
    if (row && typeof row === "object") {
      const stable =
        (typeof row.symbol === "string" && row.symbol) ||
        (typeof row.ticker === "string" && row.ticker) ||
        (typeof row.id === "string" && row.id) ||
        (typeof row.slug === "string" && row.slug) ||
        (typeof row.name === "string" && row.name) ||
        (typeof row.code === "string" && row.code);
      if (stable) {
        return stable;
      }
    }
    return `row-${rowIndex}`;
  }

  function getInlineCellKey(
    row: DataRow | undefined,
    rowIndex: number,
    columnKey: string,
  ): string {
    return `${getInlineRowKey(row, rowIndex)}::${columnKey}`;
  }

  function isCellInEditMode(
    row: DataRow | undefined,
    rowIndex: number,
    columnKey: string,
  ): boolean {
    return activeInlineCells.has(getInlineCellKey(row, rowIndex, columnKey));
  }

  async function enableCellEditing(
    row: DataRow | undefined,
    rowIndex: number,
    columnKey: string,
  ): Promise<void> {
    const key = getInlineCellKey(row, rowIndex, columnKey);
    // Initialize with current display value so it persists across re-renders
    const displayValue = formatEditableValue(row?.[columnKey], columnKey);
    editingValues.set(key, displayValue);
    const next = new Set(activeInlineCells);
    next.add(key);
    activeInlineCells = next;
    await tick();
    const el = inlineInputRefs.get(key);
    if (el) {
      el.focus();
      el.select?.();
    }
  }

  function disableCellEditing(
    row: DataRow | undefined,
    rowIndex: number,
    columnKey: string,
  ): void {
    const key = getInlineCellKey(row, rowIndex, columnKey);
    // Clear the editing value when done
    editingValues.delete(key);
    if (activeInlineCells.has(key)) {
      const next = new Set(activeInlineCells);
      next.delete(key);
      activeInlineCells = next;
    }
  }

  let inlineInputRefs: Map<string, HTMLInputElement> = new Map();
  let skipBlurValidation = false;

  function inlineInputAction(node: HTMLInputElement, key: string) {
    let currentKey = key;

    if (currentKey) {
      inlineInputRefs.set(currentKey, node);
    }

    return {
      update(newKey: string) {
        if (currentKey && currentKey !== newKey) {
          inlineInputRefs.delete(currentKey);
        }
        currentKey = newKey;
        if (currentKey) {
          inlineInputRefs.set(currentKey, node);
        }
      },
      destroy() {
        if (currentKey) {
          inlineInputRefs.delete(currentKey);
        }
      },
    };
  }

  function handleInlineInputKeydown(
    event: KeyboardEvent,
    row: DataRow | undefined,
    rowIndex: number,
    columnKey: string,
  ): void {
    const inputElement = event.target as HTMLInputElement;
    if (event.key === "Enter") {
      skipBlurValidation = true;
      validateAndApplyEditableValue(row, columnKey, inputElement);
      inputElement.blur();
      disableCellEditing(row, rowIndex, columnKey);
      setTimeout(() => {
        skipBlurValidation = false;
      }, 0);
    } else if (event.key === "Escape") {
      skipBlurValidation = true;
      inputElement.blur();
      disableCellEditing(row, rowIndex, columnKey);
      setTimeout(() => {
        skipBlurValidation = false;
      }, 0);
    }
  }

  function handleInlineCellBlur(
    row: DataRow | undefined,
    rowIndex: number,
    columnKey: string,
    event: FocusEvent,
  ): void {
    if (skipBlurValidation) {
      return;
    }
    const inputElement = event.target as HTMLInputElement;
    validateAndApplyEditableValue(row, columnKey, inputElement);
    disableCellEditing(row, rowIndex, columnKey);
  }

  const defaultStringKeys = new Set([
    "symbol",
    "name",
    "ticker",
    "slug",
    "industry",
    "sector",
    "country",
    "payoutFrequency",
    "exchange",
    "assetType",
    "type",
    "rankLabel",
  ]);

  function mapRowTypeToSortType(
    rowType?: string,
  ): "string" | "number" | "date" | "rating" {
    switch (rowType) {
      case "str":
      case "string":
        return "string";
      case "rating":
        return "rating";
      case "date":
        return "date";
      default:
        return "number";
    }
  }

  function isPlaceholderDash(value: unknown): boolean {
    return typeof value === "string" && value.trim() === "-";
  }

  function isMissingValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === "number") return Number.isNaN(value);
    if (value instanceof Date) return Number.isNaN(value.getTime());
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) return true;
      if (trimmed === "-") return true;
      const lower = trimmed.toLowerCase();
      return lower === "n/a" || lower === "na" || lower === "none";
    }
    return false;
  }

  function normalizeNumber(value: unknown): number {
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }

    if (typeof value === "string") {
      const cleaned = value.replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      return Number.isNaN(parsed) ? 0 : parsed;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.getTime();
    }

    const converted = Number(value);
    return Number.isNaN(converted) ? 0 : converted;
  }

  function normalizeString(value: unknown): string {
    if (typeof value === "string") {
      return value.trim();
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    return value != null ? String(value) : "";
  }

  function pickSampleValue(data: DataRow[] | undefined, key: string): unknown {
    if (!data) return undefined;
    for (const row of data) {
      if (!row) continue;
      const value = row[key];
      if (!isMissingValue(value)) {
        return value;
      }
    }
    return undefined;
  }

  function applyEditableValue(
    row: DataRow | undefined,
    key: string,
    value: string | null,
  ): void {
    if (!row) return;

    const incoming = value === null ? null : value;
    const targetIdentifier = getRowIdentifier(row, 0);
    let hasChanges = false;

    const syncDataset = (
      dataset: DataRow[] | undefined,
    ): DataRow[] | undefined => {
      if (!Array?.isArray(dataset) || dataset?.length === 0) {
        return dataset;
      }

      let datasetChanged = false;
      const nextDataset = dataset?.map((item, index) => {
        const isTargetRow =
          item === row || getRowIdentifier(item, index) === targetIdentifier;

        if (!isTargetRow) return item;
        if (item?.[key] === incoming) return item;

        datasetChanged = true;
        return { ...item, [key]: incoming };
      });

      if (datasetChanged) {
        hasChanges = true;
        return nextDataset;
      }

      return dataset;
    };

    originalData = syncDataset(originalData);
    rawData = syncDataset(rawData);
    stockList = syncDataset(stockList);
    initialRawData = syncDataset(initialRawData);

    if (!hasChanges && row?.[key] !== incoming) {
      row[key] = incoming;
      hasChanges = true;
    }

    if (!hasChanges) {
      return;
    }

    // Recalculate derived portfolio metrics when avgPrice or shares are edited
    if (key === "avgPrice" || key === "shares") {
      recalculatePortfolioMetrics(row);
    }
  }

  function recalculatePortfolioMetrics(row: DataRow | undefined): void {
    if (!row) return;

    // Trigger worker to recalculate all portfolio metrics for all data
    if (
      portfolioWorker &&
      Array?.isArray(originalData) &&
      originalData.length > 0
    ) {
      portfolioWorker.postMessage({ data: originalData });
    }
  }

  function handleEditableInput(
    event: Event,
    row: DataRow | undefined,
    key: string,
  ): void {
    const inputElement = event.target as HTMLInputElement;
    const cellKey = getInlineCellKey(row, undefined, key);
    editingValues.set(cellKey, inputElement.value);
    // Trigger reactivity so input keeps the typed value
    editingValues = new Map(editingValues);
  }

  function validateAndApplyEditableValue(
    row: DataRow | undefined,
    key: string,
    inputElement: HTMLInputElement | null,
  ): void {
    if (!inputElement || !row) return;

    // Use the stored editing value (persists across re-renders) or fall back to input value
    const cellKey = getInlineCellKey(row, undefined, key);
    const rawValue = editingValues.get(cellKey) ?? inputElement.value;
    const trimmed = rawValue.trim();

    if (trimmed.length === 0) {
      applyEditableValue(row, key, null);
      if (onPortfolioUpdate && (key === "avgPrice" || key === "shares")) {
        onPortfolioUpdate(originalData);
      }
      return;
    }

    const isValidNumber = /^[0-9]+\.?[0-9]*$/.test(trimmed);

    if (isValidNumber) {
      const numValue = parseFloat(trimmed);
      if (numValue > 0) {
        const roundedValue = Math.round(numValue * 100) / 100;
        applyEditableValue(row, key, String(roundedValue));
        if (onPortfolioUpdate && (key === "avgPrice" || key === "shares")) {
          onPortfolioUpdate(originalData);
        }
        return;
      }
    }

    applyEditableValue(row, key, null);
    inputElement.value = "";
    if (onPortfolioUpdate && (key === "avgPrice" || key === "shares")) {
      onPortfolioUpdate(originalData);
    }
  }

  type MergeSessionOptions = {
    includeSessionColumns?: boolean;
  };

  function mergeSessionColumns(
    nonSessionRules: ColumnRule[] = [],
    options: MergeSessionOptions = {},
  ) {
    const mergedMap = new Map<string, ColumnRule>();
    const shouldAddSessionColumns =
      includePrePostData && options?.includeSessionColumns;

    for (const item of nonSessionRules ?? []) {
      if (!item?.rule) continue;
      if (shouldAddSessionColumns && SESSION_ONLY_RULES.has(item.rule)) {
        continue;
      }
      mergedMap.set(item.rule, item);
    }

    if (!shouldAddSessionColumns) {
      return Array.from(mergedMap.values());
    }

    const showPremarket =
      !$isHoliday && !$isWeekend && !$isOpen && $isBeforeMarketOpen;
    const showAftermarket =
      (!$isOpen && $isAfterMarketClose && !$isHoliday) || $isWeekend;

    const appendSessionColumns = (columns: ColumnRule[]) => {
      for (const column of columns) {
        if (!column?.rule || mergedMap.has(column.rule)) continue;
        mergedMap.set(column.rule, column);
      }
    };

    if (showPremarket) {
      appendSessionColumns(PREMARKET_SESSION_COLUMNS);
    }

    if (showAftermarket) {
      appendSessionColumns(AFTERMARKET_SESSION_COLUMNS);
    }

    return Array.from(mergedMap.values());
  }

  function areRuleListsEqual(
    first: ColumnRule[] = [],
    second: ColumnRule[] = [],
  ): boolean {
    if (first.length !== second.length) {
      return false;
    }

    for (let i = 0; i < first.length; i += 1) {
      if (first[i]?.rule !== second[i]?.rule) {
        return false;
      }
    }

    return true;
  }

  function isRuleLocked(rule: string | undefined) {
    if (!rule) return false;
    if (displayTableTab === "indicators") {
      return indicatorDefaultRuleSet.has(rule);
    }
    return tableDefaultRuleSet.has(rule);
  }

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20;
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  // Initialize stockList with pagination
  let stockList = [];
  let scrollPosition = 0;
  //$: stockList = originalData.slice(0, 150);

  let prePostSocket: WebSocket | null = null;
  let prePostReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let lastPrePostSubscriptionKey: string | null = null;
  const PRE_POST_RECONNECT_DELAY = 5000;

  const STOCK_INDICATOR_ROWS: ColumnRule[] = [
    { name: "Volume", rule: "volume", type: "decimal" },
    { name: "Relative Volume", rule: "relativeVolume", type: "percent" },
    { name: "Call Volume", rule: "callVolume", type: "int" },
    { name: "Put Volume", rule: "putVolume", type: "int" },
    { name: "Avg. Volume", rule: "avgVolume", type: "decimal" },
    { name: "Market Cap", rule: "marketCap", type: "int" },
    { name: "Price", rule: "price", type: "float" },
    { name: "% Change", rule: "changesPercentage", type: "percentSign" },
    { name: "Added Price", rule: "addedPrice", type: "float" },
    { name: "% Since Added", rule: "sinceAdded", type: "percentSign" },
    ...PREMARKET_SESSION_COLUMNS,
    ...AFTERMARKET_SESSION_COLUMNS,
    { name: "EPS", rule: "eps", type: "float" },
    { name: "PE Ratio", rule: "priceToEarningsRatio", type: "float" },
    { name: "PB Ratio", rule: "priceToBookRatio", type: "float" },
    { name: "PS Ratio", rule: "priceToSalesRatio", type: "float" },
    { name: "AI Score", rule: "score", type: "rating" },
    { name: "Revenue", rule: "revenue", type: "int" },
    { name: "EBITDA", rule: "ebitda", type: "int" },
    { name: "Net Income", rule: "netIncome", type: "int" },
    { name: "FCF", rule: "freeCashFlow", type: "int" },
    { name: "Industry", rule: "industry", type: "str" },
    { name: "Sector", rule: "sector", type: "str" },
    { name: "Price Change 1W", rule: "change1W", type: "percentSign" },
    { name: "Price Change 1M", rule: "change1M", type: "percentSign" },
    { name: "Price Change 3M", rule: "change3M", type: "percentSign" },
    { name: "Price Change 6M", rule: "change6M", type: "percentSign" },
    { name: "Price Change 1Y", rule: "change1Y", type: "percentSign" },
    { name: "Enterprise Value", rule: "enterpriseValue", type: "int" },
    { name: "Forward PE", rule: "forwardPE", type: "float" },
    { name: "Forward PS", rule: "forwardPS", type: "float" },
    { name: "Dividend Yield", rule: "dividendYield", type: "percent" },
    { name: "Dividend Growth", rule: "dividendGrowth", type: "percentSign" },
    { name: "Payout Ratio", rule: "payoutRatio", type: "percent" },
    { name: "Current Ratio", rule: "currentRatio", type: "float" },
    { name: "Quick Ratio", rule: "quickRatio", type: "float" },
    { name: "Analyst Rating", rule: "analystRating", type: "rating" },
    { name: "Analyst Count", rule: "analystCounter", type: "int" },
    { name: "Price Target", rule: "priceTarget", type: "float" },
    { name: "Upside", rule: "upside", type: "percentSign" },
    { name: "Country", rule: "country", type: "str" },
    { name: "Gross Profit", rule: "grossProfit", type: "int" },
    { name: "Income Tax", rule: "incomeTaxExpense", type: "int" },
    { name: "Revenue Growth", rule: "growthRevenue", type: "percentSign" },
    {
      name: "Gross Profit Growth",
      rule: "growthGrossProfit",
      type: "percentSign",
    },
    {
      name: "Net Income Growth",
      rule: "growthNetIncome",
      type: "percentSign",
    },
    { name: "EBITDA Growth", rule: "growthEBITDA", type: "percentSign" },
    { name: "EPS Growth", rule: "growthEPS", type: "percentSign" },
    { name: "Total Debt", rule: "totalDebt", type: "int" },
    { name: "Return on Assets", rule: "returnOnAssets", type: "percentSign" },
    {
      name: "Return on Tangible Assets",
      rule: "returnOnTangibleAssets",
      type: "percentSign",
    },
    {
      name: "Return on Invested Capital",
      rule: "returnOnInvestedCapital",
      type: "percentSign",
    },
    {
      name: "Return on Capital Employed",
      rule: "returnOnCapitalEmployed",
      type: "percentSign",
    },
    { name: "Return on Equity", rule: "returnOnEquity", type: "percentSign" },
    { name: "Value-at-Risk", rule: "var", type: "percentSign" },
    { name: "Asset Turnover", rule: "assetTurnover", type: "int" },
    { name: "Earnings Yield", rule: "earningsYield", type: "percent" },
    { name: "Altman-Z-Score", rule: "altmanZScore", type: "float" },
    { name: "Piotroski F-Score", rule: "piotroskiScore", type: "float" },
    { name: "Total Liabilities", rule: "totalLiabilities", type: "int" },
    { name: "RSI", rule: "rsi", type: "float" },
    { name: "Stock Buybacks", rule: "commonStockRepurchased", type: "int" },
    { name: "Short Ratio", rule: "shortRatio", type: "int" },
    { name: "Short Interest", rule: "sharesShort", type: "int" },
    { name: "Short % Float", rule: "shortFloatPercent", type: "percent" },
    {
      name: "Short % Shares",
      rule: "shortOutstandingPercent",
      type: "percent",
    },
    { name: "FCF Yield", rule: "freeCashFlowYield", type: "percent" },
    { name: "Employees", rule: "employees", type: "decimal" },
    { name: "Debt / Equity", rule: "debtToEquityRatio", type: "int" },
    { name: "Profit Margin", rule: "netProfitMargin", type: "percent" },
    { name: "FTD Shares", rule: "failToDeliver", type: "decimal" },
    { name: "Relative FTD", rule: "relativeFTD", type: "percent" },
    { name: "Interest Income", rule: "interestIncome", type: "int" },
    { name: "Operating Income", rule: "operatingIncome", type: "int" },
    {
      name: "Operating Income Growth",
      rule: "growthOperatingIncome",
      type: "percentSign",
    },
    {
      name: "Research & Development",
      rule: "researchAndDevelopmentExpenses",
      type: "int",
    },
    { name: "Shares Outstanding", rule: "sharesOutStanding", type: "int" },
    { name: "Profit Per Employee", rule: "profitPerEmployee", type: "int" },
    { name: "Revenue Per Employee", rule: "revenuePerEmployee", type: "int" },
    {
      name: "Institutional Ownership",
      rule: "institutionalOwnership",
      type: "percent",
    },
    { name: "Top Analyst Rating", rule: "topAnalystRating", type: "rating" },
    { name: "Top Analyst Count", rule: "topAnalystCounter", type: "int" },
    {
      name: "Top Analyst Price Target",
      rule: "topAnalystPriceTarget",
      type: "float",
    },
    {
      name: "Top Analyst PT Upside",
      rule: "topAnalystUpside",
      type: "percentSign",
    },
    { name: "Change OI", rule: "changeOI", type: "decimalSign" },
    { name: "Total OI", rule: "totalOI", type: "decimal" },
    { name: "IV Rank", rule: "ivRank", type: "float" },
    { name: "Total Prem", rule: "totalPrem", type: "decimal" },
  ];

  let allRows: ColumnRule[] = [];
  $: {
    const baseRows =
      indicatorRowsOverride?.length > 0
        ? indicatorRowsOverride
        : STOCK_INDICATOR_ROWS;
    const mergedRows = new Map<string, ColumnRule>();
    for (const row of [
      ...activeIndicatorDefaultRows,
      ...baseRows,
      ...(specificRows ?? []),
    ]) {
      if (!row?.rule) continue;
      mergedRows.set(row.rule, row);
    }
    allRows = Array.from(mergedRows.values());
  }

  let indicatorRows: ColumnRule[] = [];
  let proOnlyItems = new Set<string>();

  $: indicatorRows =
    allRows?.filter((item) => !DROPDOWN_HIDDEN_RULES.has(item?.rule)) ?? [];

  $: proOnlyItems = new Set(
    indicatorRows
      ?.filter((item) => !excludedRules?.has(item?.rule))
      ?.map((item) => item?.name),
  );

  // Initialize with just defaultList items checked
  checkedItems = new Set(defaultList.map((item) => item.name));

  // Store indicators tab rules separately from display tab rules - loaded from localStorage
  let indicatorsTabRules: ColumnRule[] = [];
  let indicatorsTabCheckedItems = new Set<string>();

  $: if (displayTableTab === "general") {
    const mergedDefaults = mergeSessionColumns(defaultList, {
      includeSessionColumns: true,
    });
    if (!areRuleListsEqual(ruleOfList, mergedDefaults)) {
      ruleOfList = mergedDefaults;
    }
  } else if (displayTableTab === "indicators") {
    const mergedIndicators = mergeSessionColumns(indicatorsTabRules);
    if (!areRuleListsEqual(ruleOfList, mergedIndicators)) {
      ruleOfList = mergedIndicators;
    }
  }

  function sanitizeIndicatorRules(rules: ColumnRule[] = []): ColumnRule[] {
    const merged = new Map<string, ColumnRule>();
    for (const item of activeIndicatorDefaultRows) {
      merged.set(item.rule, item);
    }
    for (const item of rules ?? []) {
      if (item && item.rule && !SESSION_ONLY_RULES.has(item.rule)) {
        merged.set(item.rule, item);
      }
    }
    return Array.from(merged.values());
  }

  // Function to load indicators tab rules from localStorage
  function loadIndicatorsTabRules() {
    // Get current page path
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      indicatorsTabRules = [...activeIndicatorDefaultRows];
      indicatorsTabCheckedItems = new Set(
        activeIndicatorDefaultRows.map((item) => item.name),
      );
      return;
    }

    const indicatorsTabKey = `${currentPath}_indicators`;
    const savedRules = localStorage?.getItem(indicatorsTabKey);

    if (savedRules) {
      try {
        const parsedRules = JSON.parse(savedRules);
        if (
          parsedRules &&
          Array.isArray(parsedRules) &&
          parsedRules.length > 0
        ) {
          const sanitized = sanitizeIndicatorRules(parsedRules);
          indicatorsTabRules = [...sanitized];
          indicatorsTabCheckedItems = new Set(
            sanitized.map((rule) => rule.name),
          );
          return;
        }
      } catch (e) {
        console.warn("Error parsing saved indicators rules:", e);
      }
    }

    // If no saved rules or parsing failed, use defaultList
    indicatorsTabRules = [...activeIndicatorDefaultRows];
    indicatorsTabCheckedItems = new Set(
      activeIndicatorDefaultRows.map((item) => item.name),
    );
  }

  // Load indicators rules and pagination preference immediately when component initializes
  loadIndicatorsTabRules();
  loadRowsPerPage();

  allRows = sortIndicatorCheckMarks(allRows);

  // Handle portfolio worker messages
  const handlePortfolioMessage = (event) => {
    if (event.data?.message === "success" && event.data?.data) {
      const calculatedData = Array?.isArray(event.data.data)
        ? event.data.data
        : [];

      if (calculatedData.length === 0) return;

      const calculatedBySymbol = new Map(
        calculatedData
          .filter((item) => typeof item?.symbol === "string")
          .map((item) => [item.symbol, item]),
      );

      if (Array?.isArray(originalData) && originalData.length > 0) {
        originalData = originalData.map((item) => {
          const symbol = item?.symbol;
          if (typeof symbol !== "string") return item;
          const calcItem = calculatedBySymbol.get(symbol);
          return calcItem ? { ...item, ...calcItem } : item;
        });
      } else {
        originalData = [...calculatedData];
      }

      const originalBySymbol = new Map(
        (originalData ?? [])
          .filter((item) => typeof item?.symbol === "string")
          .map((item) => [item.symbol, item]),
      );

      if (Array?.isArray(rawData) && rawData.length > 0) {
        rawData = rawData.map((item) => {
          const symbol = item?.symbol;
          if (typeof symbol !== "string") return item;
          return originalBySymbol.get(symbol) ?? item;
        });
      } else {
        rawData = [...originalData];
      }

      if (Array?.isArray(initialRawData) && initialRawData.length > 0) {
        initialRawData = initialRawData.map((item) => {
          const symbol = item?.symbol;
          if (typeof symbol !== "string") return item;
          return originalBySymbol.get(symbol) ?? item;
        });
      }

      updatePaginatedData();
    }
  };

  const handleDownloadMessage = (event) => {
    let updateData = event?.data?.rawData ?? [];
    if (!updateData?.length || !rawData?.length) return;

    // Create a map for faster symbol lookup
    const updateDataMap = new Map(
      updateData.map((item) => [item.symbol, item]),
    );

    // Create a new array to ensure reactivity
    const updatedRawData = rawData.map((item) => {
      const updatedItem = updateDataMap.get(item.symbol);
      if (!updatedItem) return item;

      let newData = { ...updatedItem };

      // Merge fields from defaultRules that are missing in updatedItem
      defaultRules.forEach((rule) => {
        if (!(rule in updatedItem) && rule in item) {
          newData[rule] = item[rule];
        }
      });

      ruleOfList?.forEach(({ rule: ruleKey }) => {
        if (ruleKey && !(ruleKey in updatedItem) && ruleKey in item) {
          newData[ruleKey] = item[ruleKey];
        }
      });

      // Preserve original values from rawData if present
      for (let rule of defaultRules) {
        if (rule in item) {
          newData[rule] = item[rule];
        }
      }

      // Ensure 'rank' and 'years' are added if missing
      if (!("rank" in updatedItem) && "rank" in item) {
        newData.rank = item.rank;
      }
      if (!("years" in updatedItem) && "years" in item) {
        newData.years = item.years;
      }

      // Preserve 'hasNote' field for watchlist functionality
      if ("hasNote" in item) {
        newData.hasNote = item.hasNote;
      }

      return newData;
    });

    // Trigger reactivity by creating a new reference
    originalData = [...updatedRawData];
    rawData = originalData;

    // Recalculate portfolio metrics with updated data
    initializePortfolioCalculations(originalData);

    updatePaginatedData();

    // Validate and clean rules after updating data
    validateAndCleanRules();

    columns = generateColumns(rawData);
    // Preserve custom column order after regenerating columns
    if (customColumnOrder && customColumnOrder.length > 0) {
      columns = applyColumnOrder(columns);
    }
    sortOrders = generateSortOrders(rawData);
  };

  function collectIndicatorTickers(): string[] {
    const source =
      Array.isArray(rawData) && rawData.length > 0
        ? rawData
        : Array.isArray(originalData)
          ? originalData
          : [];
    const symbols = new Set<string>();
    for (const item of source) {
      const symbol = item?.symbol ?? item?.ticker ?? item?.code;
      if (typeof symbol === "string" && symbol.length > 0) {
        symbols.add(symbol.toUpperCase());
      }
    }
    return Array.from(symbols.values());
  }

  function datasetHasAllRules(
    dataset: DataRow[] | undefined,
    rules: string[],
  ): boolean {
    if (!Array.isArray(dataset) || dataset.length === 0 || rules.length === 0) {
      return false;
    }
    return dataset.every((row) =>
      rules.every((rule) =>
        Object.prototype.hasOwnProperty.call(row ?? {}, rule),
      ),
    );
  }

  const updateStockScreenerData = async () => {
    if (!downloadWorker) return;

    const requiredRules = Array.from(
      new Set(
        (ruleOfList ?? [])
          .map((item) => item?.rule)
          .filter(isNonEmptyRule),
      ),
    );

    if (
      requiredRules.length > 0 &&
      (datasetHasAllRules(rawData, requiredRules) ||
        datasetHasAllRules(originalData, requiredRules))
    ) {
      return;
    }

    const tickerList = collectIndicatorTickers();
    if (tickerList.length === 0) return;

    downloadWorker.postMessage({
      ruleOfList,
      tickerList,
    });
  };

  function cleanupPrePostSocket() {
    if (prePostReconnectTimer) {
      clearTimeout(prePostReconnectTimer);
      prePostReconnectTimer = null;
    }

    if (prePostSocket) {
      try {
        if (
          prePostSocket.readyState === WebSocket.OPEN ||
          prePostSocket.readyState === WebSocket.CONNECTING
        ) {
          prePostSocket.close();
        }
      } catch (error) {
        console.error("Error closing pre/post socket:", error);
      }
    }

    prePostSocket = null;
    lastPrePostSubscriptionKey = null;
  }

  function collectPrePostSymbols(): string[] {
    const source =
      Array.isArray(originalData) && originalData.length > 0
        ? originalData
        : Array.isArray(rawData)
          ? rawData
          : [];

    const unique = new Set<string>();
    for (const item of source) {
      const symbol = item?.symbol ?? item?.ticker ?? item?.code;
      if (typeof symbol === "string" && symbol?.length > 0) {
        unique.add(symbol.toUpperCase());
      }
    }
    return Array.from(unique.values());
  }

  function shouldListenForSessionQuotes(): boolean {
    return (
      !$isOpen && ($isBeforeMarketOpen || $isAfterMarketClose || $isWeekend)
    );
  }

  function applySessionQuoteUpdate(symbol: string, payload: any) {
    if (!symbol) return;

    const upper = symbol?.toUpperCase();
    if (!upper) return;

    const updateDataset = (dataset: any[]) => {
      if (!Array.isArray(dataset) || dataset.length === 0) {
        return dataset;
      }

      const index = dataset.findIndex((item) => {
        const current = item?.symbol ?? item?.ticker ?? item?.code;
        return typeof current === "string" && current.toUpperCase() === upper;
      });

      if (index === -1) {
        return dataset;
      }

      const sessionTime = payload?.time;
      const sessionUpper =
        typeof sessionTime === "string" ? sessionTime.toUpperCase() : "";

      const updatedRow = { ...dataset[index] };

      const getNumeric = (value: unknown) =>
        typeof value === "number" && Number.isFinite(value) ? value : null;

      const treatAsAftermarket = $isWeekend || sessionUpper.includes("PM");
      const treatAsPremarket = !$isWeekend && sessionUpper.includes("AM");

      if (treatAsPremarket) {
        updatedRow.preMarketPrice = getNumeric(payload?.price);
        updatedRow.preMarketChangesPercentage = getNumeric(
          payload?.changesPercentage,
        );
        updatedRow.afterMarketPrice = null;
        updatedRow.afterMarketChangesPercentage = null;
      } else if (treatAsAftermarket) {
        updatedRow.afterMarketPrice = getNumeric(payload?.price);
        updatedRow.afterMarketChangesPercentage = getNumeric(
          payload?.changesPercentage,
        );
        updatedRow.preMarketPrice = null;
        updatedRow.preMarketChangesPercentage = null;
      }

      const nextDataset = [...dataset];
      nextDataset[index] = updatedRow;
      return nextDataset;
    };

    const updatedOriginal = updateDataset(originalData);
    if (updatedOriginal !== originalData) {
      originalData = updatedOriginal;
    }

    const updatedRaw = updateDataset(rawData);
    if (updatedRaw !== rawData) {
      rawData = updatedRaw;
    }

    if (Array.isArray(initialRawData) && initialRawData.length > 0) {
      const updatedInitial = updateDataset(initialRawData);
      if (updatedInitial !== initialRawData) {
        initialRawData = updatedInitial;
      }
    }

    if (Array.isArray(stockList) && stockList.length > 0) {
      const updatedStockList = updateDataset(stockList);
      if (updatedStockList !== stockList) {
        stockList = updatedStockList;
      }
    }
  }

  function syncPrePostSubscription() {
    if (!includePrePostData) return;
    if (!prePostSocket || prePostSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const symbols = collectPrePostSymbols();
    if (symbols.length === 0) {
      if (lastPrePostSubscriptionKey !== null) {
        lastPrePostSubscriptionKey = null;
      }
      return;
    }

    const sortedKey = symbols.slice().sort().join("|");

    if (sortedKey === lastPrePostSubscriptionKey) {
      return;
    }

    try {
      prePostSocket.send(
        JSON.stringify({
          type: "sync",
          tickers: symbols,
        }),
      );
      lastPrePostSubscriptionKey = sortedKey;
    } catch (error) {
      console.error("Failed to sync pre/post subscription:", error);
    }
  }

  function schedulePrePostReconnect() {
    if (prePostReconnectTimer) {
      return;
    }
    prePostReconnectTimer = setTimeout(() => {
      prePostReconnectTimer = null;
      connectPrePostSocket();
    }, PRE_POST_RECONNECT_DELAY);
  }

  function handlePrePostMessage(raw: unknown) {
    if (!includePrePostData) return;
    if (typeof raw !== "string") {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      console.error("Error parsing pre/post quote payload:", error);
      return;
    }

    const updates = Array.isArray(payload) ? payload : [payload];

    for (const item of updates) {
      const currentSymbol = item?.symbol;
      if (!currentSymbol) {
        continue;
      }
      applySessionQuoteUpdate(currentSymbol, item);
    }
  }

  function connectPrePostSocket() {
    const sessionWindowActive = shouldListenForSessionQuotes();
    if (
      typeof window === "undefined" ||
      !includePrePostData ||
      !data?.wsURL ||
      !sessionWindowActive ||
      collectPrePostSymbols().length === 0
    ) {
      return;
    }

    if (
      prePostSocket &&
      (prePostSocket.readyState === WebSocket.CONNECTING ||
        prePostSocket.readyState === WebSocket.OPEN)
    ) {
      syncPrePostSubscription();
      return;
    }

    cleanupPrePostSocket();

    try {
      prePostSocket = new WebSocket(`${data?.wsURL}/pre-post-quote`);
    } catch (error) {
      console.error("Failed establishing pre/post socket:", error);
      schedulePrePostReconnect();
      return;
    }

    prePostSocket.addEventListener("open", () => {
      if (prePostReconnectTimer) {
        clearTimeout(prePostReconnectTimer);
        prePostReconnectTimer = null;
      }
      syncPrePostSubscription();
    });

    prePostSocket.addEventListener("message", (event) => {
      handlePrePostMessage(event?.data);
    });

    prePostSocket.addEventListener("close", () => {
      cleanupPrePostSocket();
      if (
        includePrePostData &&
        shouldListenForSessionQuotes() &&
        collectPrePostSymbols().length > 0
      ) {
        schedulePrePostReconnect();
      }
    });

    prePostSocket.addEventListener("error", (error) => {
      console.error("Pre/post socket error:", error);
      if (prePostSocket) {
        try {
          prePostSocket.close();
        } catch (closeError) {
          console.error("Failed closing errored pre/post socket:", closeError);
        }
      }
    });
  }

  function validateAndCleanRules(skipAutoSave = false) {
    // DISABLED - This function was causing indicators to reset
    // Only validate if there are actual missing data fields, not just because data changed
    return false;
  }

  function saveRules() {
    // Only save rules for the indicators tab - other tabs are fixed
    if (displayTableTab !== "indicators") {
      return;
    }

    // Check if localStorage is available and pagePathName is valid
    if (!pagePathName || typeof localStorage === "undefined" || !localStorage) {
      console.warn(
        "Cannot save rules: localStorage unavailable or invalid path",
      );
      return;
    }

    try {
      // Validate ruleOfList before serializing
      if (!ruleOfList || !Array.isArray(ruleOfList)) {
        console.warn("Cannot save rules: invalid ruleOfList data");
        return;
      }

      // Save the rules to localStorage for indicators tab only
      const sanitizedRules = sanitizeIndicatorRules(ruleOfList);
      const indicatorsTabKey = `${pagePathName}_indicators`;
      const serializedRules = JSON.stringify(sanitizedRules);
      localStorage.setItem(indicatorsTabKey, serializedRules);

      // Also update in-memory indicators tab state
      indicatorsTabRules = [...sanitizedRules];
      indicatorsTabCheckedItems = new Set(
        sanitizedRules.map((rule) => rule.name),
      );
    } catch (e) {
      console.error("Failed saving indicator rules:", e);

      // If JSON.stringify failed, try to save a simplified version
      try {
        const simplifiedRules = sanitizeIndicatorRules(ruleOfList).map(
          (rule) => ({
            name: rule.name,
            rule: rule.rule,
            type: rule.type || "string",
          }),
        );
        const indicatorsTabKey = `${pagePathName}_indicators`;
        localStorage.setItem(indicatorsTabKey, JSON.stringify(simplifiedRules));

        // Also update in-memory indicators tab state with simplified rules
        indicatorsTabRules = [...simplifiedRules];
        indicatorsTabCheckedItems = new Set(
          simplifiedRules.map((rule) => rule.name),
        );
        console.info("Saved simplified rules as fallback");
      } catch (fallbackError) {
        console.error("Failed saving even simplified rules:", fallbackError);
      }
    }
  }

  async function handleResetAll() {
    searchQuery = "";

    // Reset indicators tab rules to defaults (keep default indicators checked)
    indicatorsTabRules = [...activeIndicatorDefaultRows];
    indicatorsTabCheckedItems = new Set(
      activeIndicatorDefaultRows.map((item) => item.name),
    );

    // If we're currently on indicators tab, update display to show defaults
    if (displayTableTab === "indicators") {
      ruleOfList = [...activeIndicatorDefaultRows];
      checkedItems = new Set(activeIndicatorDefaultRows.map((item) => item.name));
      columns = generateColumns(rawData);
      if (customColumnOrder && customColumnOrder.length > 0) {
        columns = applyColumnOrder(columns);
      }
      await updateStockScreenerData();
    }

    allRows = sortIndicatorCheckMarks(allRows);

    // Save the default rules to localStorage
    if (pagePathName && typeof localStorage !== "undefined") {
      const indicatorsTabKey = `${pagePathName}_indicators`;
      localStorage.setItem(
        indicatorsTabKey,
        JSON.stringify(activeIndicatorDefaultRows),
      );
    }

    console.log("Resetting all rules to default");
  }

  async function handleSelectAll() {
    if (["Pro", "Plus"]?.includes(data?.user?.tier)) {
      searchQuery = "";

      // Select all indicators for indicators tab
      indicatorsTabRules = [...indicatorRows];
      indicatorsTabCheckedItems = new Set(
        indicatorRows.map((item) => item.name),
      );

      // If we're currently on indicators tab, also update the display
      if (displayTableTab === "indicators") {
        const merged = mergeSessionColumns(indicatorRows);
        ruleOfList = [...merged];
        checkedItems = new Set([...indicatorsTabCheckedItems]);
        columns = generateColumns(rawData);
        if (customColumnOrder && customColumnOrder.length > 0) {
          columns = applyColumnOrder(columns);
        }
        await updateStockScreenerData();
      }

      allRows = sortIndicatorCheckMarks(allRows);

      // Save the selected rules to localStorage
      if (pagePathName && typeof localStorage !== "undefined") {
        const indicatorsTabKey = `${pagePathName}_indicators`;
        localStorage.setItem(indicatorsTabKey, JSON.stringify(indicatorRows));
      }
    } else {
      toast.error(list_toast_unlock_pro(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  function handleInput(event) {
    searchQuery = event.target.value?.toLowerCase() || "";

    setTimeout(() => {
      testList = [];

      if (searchQuery.length > 0) {
        const rawList = indicatorRows;
        testList =
          rawList?.filter((item) => {
            const index = item?.name?.toLowerCase();
            // Check if country starts with searchQuery
            return index?.startsWith(searchQuery);
          }) || [];
      }
    }, 50);
  }

  function isChecked(item) {
    return checkedItems?.has(item);
  }

  function sortIndicatorCheckMarks(allRows) {
    const selectedRuleSet =
      displayTableTab === "indicators"
        ? new Set(ruleOfList.map((item) => item.rule))
        : tableDefaultRuleSet;

    return allRows?.sort((a, b) => {
      const isAChecked = selectedRuleSet.has(a?.rule);
      const isBChecked = selectedRuleSet.has(b?.rule);

      // Sort checked items first
      if (isAChecked !== isBChecked) return isAChecked ? -1 : 1;

      // Prioritize items based on default rules
      const isADefaultRule = isRuleLocked(a?.rule);
      const isBDefaultRule = isRuleLocked(b?.rule);
      if (isADefaultRule !== isBDefaultRule) {
        return isADefaultRule ? -1 : 1;
      }

      // Check if the user is not Pro
      if (!["Pro", "Plus"]?.includes(data?.user?.tier)) {
        const isAPriority = proOnlyItems.has(a?.name);
        const isBPriority = proOnlyItems.has(b?.name);

        // If both are priority items or both are not, sort alphabetically
        if (isAPriority === isBPriority) return a.name.localeCompare(b.name);

        // Move priority items to the bottom for non-Pro users
        return isAPriority ? 1 : -1;
      }

      // If the user is Pro, sort alphabetically
      return a?.name?.localeCompare(b.name);
    });
  }

  async function changeTab(tabName, { skipFetch = false } = {}) {
    // Save current indicators ONLY if we're on the indicators tab
    if (
      pagePathName &&
      displayTableTab === "indicators" &&
      ruleOfList?.length > 0
    ) {
      const sanitizedRules = sanitizeIndicatorRules(ruleOfList);
      const indicatorsTabKey = `${pagePathName}_indicators`;
      localStorage?.setItem(indicatorsTabKey, JSON.stringify(sanitizedRules));
      // Also update our in-memory copy
      indicatorsTabRules = [...sanitizedRules];
      indicatorsTabCheckedItems = new Set(
        sanitizedRules.map((rule) => rule.name),
      );
    }

    displayTableTab = tabName;

    if (tabName === "general") {
      // General tab always uses defaultList only
      ruleOfList = mergeSessionColumns(defaultList, {
        includeSessionColumns: true,
      });
      checkedItems = new Set(defaultList.map((item) => item.name));
    } else if (tabName === "indicators") {
      // For indicators tab, load saved custom indicators or defaults
      const normalizedRules =
        indicatorsTabRules?.length > 0
          ? indicatorsTabRules
          : activeIndicatorDefaultRows;

      ruleOfList = mergeSessionColumns(normalizedRules);

      checkedItems =
        indicatorsTabRules?.length > 0
          ? new Set([...indicatorsTabCheckedItems])
          : new Set(activeIndicatorDefaultRows.map((item) => item.name));
    } else {
      // For all other tabs, always use their hardcoded predefined rules
      if (tabRuleSets[tabName]) {
        ruleOfList = [...tabRuleSets[tabName]];
        checkedItems = new Set(ruleOfList.map((item) => item.name));
      }
    }

    allRows = sortIndicatorCheckMarks(allRows);

    if (downloadWorker && !skipFetch) {
      await updateStockScreenerData();
    }
  }

  async function handleChangeValue(itemName) {
    // Find the item object from allRows
    const item = allRows.find((row) => row.name === itemName);
    if (!item) return;

    // Don't allow toggling default rules
    if (isRuleLocked(item?.rule)) {
      return;
    }

    // If not on indicators tab, switch to it first
    if (displayTableTab !== "indicators") {
      await changeTab("indicators", { skipFetch: true });
    }

    // Check if item is already in indicatorsTabRules by rule
    const existingIndex = indicatorsTabRules.findIndex(
      (tabItem) => tabItem.rule === item.rule,
    );

    if (existingIndex >= 0) {
      // Remove the item (but not if it's a default rule)
      indicatorsTabRules = indicatorsTabRules.filter((_, i) => i !== existingIndex);
      indicatorsTabCheckedItems.delete(itemName);
    } else {
      // Add the item
      indicatorsTabRules = [...indicatorsTabRules, item];
      indicatorsTabCheckedItems.add(itemName);
    }

    // Update the display since we're now on indicators tab
    checkedItems = new Set([...indicatorsTabCheckedItems]);
    ruleOfList = mergeSessionColumns(indicatorsTabRules);

    // Immediately regenerate columns so the new column appears with skeleton loader
    columns = generateColumns(rawData);
    if (customColumnOrder && customColumnOrder.length > 0) {
      columns = applyColumnOrder(columns);
    }

    allRows = sortIndicatorCheckMarks(allRows);

    await updateStockScreenerData();
    saveRules();
  }

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    // Use rawData for filtered results, originalData is the unfiltered full dataset
    const dataSource = inputValue?.length > 0 ? rawData : originalData;
    stockList = dataSource?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((dataSource?.length || 0) / rowsPerPage);
  }

  function handlePageChange(event) {
    currentPage = event.detail.page;
    updatePaginatedData();
  }

  function handleRowsPerPageChange(event) {
    rowsPerPage = event.detail.rowsPerPage;
    currentPage = 1; // Reset to first page when changing rows per page
    updatePaginatedData();
    saveRowsPerPage(); // Save to localStorage
  }

  // Save rows per page preference to localStorage
  function saveRowsPerPage() {
    if (!pagePathName || typeof localStorage === "undefined") return;

    try {
      const paginationKey = `${pagePathName}_rowsPerPage`;
      localStorage.setItem(paginationKey, String(rowsPerPage));
    } catch (e) {
      console.warn("Failed to save rows per page preference:", e);
    }
  }

  // Load rows per page preference from localStorage
  function loadRowsPerPage() {
    const currentPath = pagePathName || $page?.url?.pathname;

    if (!currentPath || typeof localStorage === "undefined") {
      rowsPerPage = 20; // Default value
      return;
    }

    try {
      const paginationKey = `${currentPath}_rowsPerPage`;
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

  // Save scroll position before data changes
  function saveScrollPosition() {
    scrollPosition = window.scrollY;
  }

  // Restore scroll position after data changes
  function restoreScrollPosition() {
    window.scrollTo(0, scrollPosition);
  }

  function sendMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON?.stringify(message));
    } else {
      console.error("WebSocket is not open. Unable to send message.");
    }
  }

  async function websocketRealtimeData() {
    try {
      socket = new WebSocket(data?.wsURL + "/price-data");

      socket.addEventListener("open", () => {
        console.log("WebSocket connection opened");
        // Send only current watchlist symbols
        //Only update 200 tickers because of a bug. The previous price is getting changed for tickers. To-do list.
        const tickerList = rawData?.map((item) => item?.symbol) || [];
        sendMessage(tickerList);
      });

      socket.addEventListener("message", (event) => {
        const data = event.data;
        try {
          const newList = JSON?.parse(data);
          if (newList?.length > 0) {
            if (originalData?.some((item) => "changesPercentage" in item)) {
              originalData = calculateChange(originalData, newList);

              // Recalculate portfolio metrics with updated prices
              initializePortfolioCalculations(originalData);

              if (!inputValue?.length) {
                rawData = [...originalData];
              }
              stockList = updateStockList(stockList, originalData);
              setTimeout(() => {
                stockList = stockList?.map((item) => ({
                  ...item,
                  previous: null,
                }));
              }, 800);
              saveScrollPosition();
              sortMode = true;
            }
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e);
        }
      });

      socket.addEventListener("close", (event) => {
        console.log("WebSocket connection closed:", event.reason);
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }

  // Update pagination when originalData or rawData changes
  $: if (
    (originalData && originalData.length > 0) ||
    (rawData && inputValue?.length > 0)
  ) {
    updatePaginatedData();
  }

  // Reactive statement to load indicators and pagination settings when page changes
  $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
    pagePathName = $page?.url?.pathname;
    loadIndicatorsTabRules();
    loadRowsPerPage(); // Load pagination preference for new page
    loadColumnOrder(undefined, true); // Load column order preference for new page
    updatePaginatedData(); // Update display with loaded preference
  }

  let isInitialLoad = true;
  let isSorting = false;

  // Reactive statement to validate and clean rules when rawData changes
  $: if (rawData && rawData.length > 0 && !isSorting) {
    registerInitialOrder(rawData, isInitialLoad);

    // Validate indicator rules but don't let it reset everything
    const wasCleanedUp = validateAndCleanRules(isInitialLoad);

    // Always regenerate columns when data changes
    columns = generateColumns(rawData);
    // Preserve custom column order after regenerating columns
    if (customColumnOrder && customColumnOrder.length > 0) {
      columns = applyColumnOrder(columns);
    }
    if (isInitialLoad) {
      // Initialize portfolio calculations on first load
      initializePortfolioCalculations(rawData);

      sortOrders = generateSortOrders(rawData);
      // Preserve the initial unsorted data on first load
      const initialOrdered = sortByInitialOrder(rawData);
      initialRawData = [...initialOrdered];
      originalData = [...initialOrdered];
    }

    // After the first reactive run, allow auto-saving
    isInitialLoad = false;
  }

  $: if ($isOpen) {
    websocketRealtimeData();
    console.log("WebSocket restarted");
  }
  const loadSearchWorker = async () => {
    if (searchWorker && originalData?.length > 0) {
      searchWorker.postMessage({
        rawData: originalData,
        inputValue: inputValue,
      });
    }
  };

  async function resetTableSearch() {
    inputValue = "";
    rawData = originalData;
    currentPage = 1; // Reset to first page
    updatePaginatedData();
    changeTab(displayTableTab || "general");
  }

  async function search() {
    inputValue = inputValue?.toLowerCase();

    setTimeout(async () => {
      if (inputValue?.length > 0) {
        await loadSearchWorker();
      } else {
        // Reset to original data if filter is empty
        rawData = originalData;
        currentPage = 1; // Reset to first page
        updatePaginatedData();
      }
    }, 100);
  }

  const handleSearchMessage = (event) => {
    if (event.data?.message === "success") {
      rawData = event.data?.output ?? [];
      currentPage = 1; // Reset to first page after search
      updatePaginatedData();
    }
  };

  $: {
    const sessionWindowActive = shouldListenForSessionQuotes();
    if (
      includePrePostData &&
      sessionWindowActive &&
      data?.wsURL &&
      collectPrePostSymbols().length > 0
    ) {
      connectPrePostSocket();
      syncPrePostSubscription();
    } else if (prePostSocket) {
      cleanupPrePostSocket();
    }
  }

  onMount(async () => {
    try {
      // derive pagePathName and storageKey from the page store

      // Load indicators tab rules first - this is critical!
      loadIndicatorsTabRules();

      // Load pagination preference
      loadRowsPerPage();

      // Load column order preference (forceReapply to ensure order is applied after mount)
      loadColumnOrder(undefined, true);

      // Set current tab rules based on the active tab
      if (displayTableTab === "general") {
        // General tab always uses defaultList
        ruleOfList = mergeSessionColumns(defaultList, {
          includeSessionColumns: true,
        });
        checkedItems = new Set(defaultList.map((item) => item.name));
      } else if (displayTableTab === "indicators") {
        // Use the loaded indicators tab rules
        ruleOfList = mergeSessionColumns(indicatorsTabRules);
        checkedItems = new Set([...indicatorsTabCheckedItems]);
      } else {
        // For all other tabs, always use their hardcoded predefined rules
        if (tabRuleSets[displayTableTab]) {
          ruleOfList = [...tabRuleSets[displayTableTab]];
          checkedItems = new Set(ruleOfList.map((item) => item.name));
        }
      }

      // Sort the indicators (checkedItems already set above)
      allRows = sortIndicatorCheckMarks(allRows);

      if (!downloadWorker) {
        const DownloadWorker =
          await import("$lib/workers/downloadWorker?worker");
        downloadWorker = new DownloadWorker.default();
        downloadWorker.onmessage = handleDownloadMessage;
      }

      if (!searchWorker) {
        const SearchWorker =
          await import("$lib/workers/tableSearchWorker?worker");
        searchWorker = new SearchWorker.default();
        searchWorker.onmessage = handleSearchMessage;
      }

      if (!portfolioWorker) {
        const PortfolioWorker =
          await import("$lib/workers/portfolioWorker?worker");
        portfolioWorker = new PortfolioWorker.default();
        portfolioWorker.onmessage = handlePortfolioMessage;
      }

      await updateStockScreenerData();

      // Initialize pagination
      updatePaginatedData();
    } catch (e) {
      console.log(e);
    }
  });

  let previousSymbolKey = '';
  let reconnectionTimeout;

  async function reconnectForNewSymbols() {
    try {
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket?.close();
      }

      await new Promise((resolve) => {
        socket?.addEventListener("close", resolve, { once: true });
      });

      if ($isOpen) {
        await websocketRealtimeData();
        console.log("WebSocket restarted due to watchlist changes");
      }
    } catch (error) {
      console.error("Error restarting WebSocket:", error);
    }
  }

  function handleRawDataChange(data) {
    const symbolKey = (data?.map((item) => item?.symbol) || []).sort().join(',');

    if (symbolKey === previousSymbolKey) return;
    previousSymbolKey = symbolKey;

    if (typeof socket !== 'undefined') {
      reconnectForNewSymbols();
    }

    if (includePrePostData) {
      syncPrePostSubscription();
    }
  }

  $: handleRawDataChange(rawData);

  onDestroy(() => {
    try {
      // Clear any pending reconnection timeout
      if (reconnectionTimeout) {
        clearTimeout(reconnectionTimeout);
      }

      cleanupPrePostSocket();

      // Close the WebSocket connection
      if (socket) {
        socket.close(1000, "Page unloaded");
      }

      // Terminate workers
      if (portfolioWorker) {
        portfolioWorker.terminate();
      }
      if (searchWorker) {
        searchWorker.terminate();
      }
      if (downloadWorker) {
        downloadWorker.terminate();
      }
    } catch (e) {
      console.log(e);
    }
  });

  // Function to generate columns based on keys in rawData
  function generateColumns(data) {
    if (!data || data.length === 0) return [];

    const leftAlignKeys = new Set(["rank", "symbol", "name"]);

    // Custom labels for specific keys
    const customLabels = {
      changesPercentage: "% Change",
      score: "AI Score",
      researchAndDevelopmentExpenses: "R&D",
      counter: "Ratings Count",
      // Add more key-label mappings here as needed
    };

    // Define preferred order for columns
    const preferredOrder = ["rank", "symbol", "name"];

    // Create a mapping of rule to name and type from allRows
    const ruleToMetadataMap = Object?.fromEntries(
      allRows?.map((row) => [row.rule, { name: row.name, type: row.type }]),
    );

    // Collect available keys from the entire dataset (preserve encounter order)
    const availableKeys: string[] = [];
    const seenKeys = new Set<string>();
    data?.forEach((row) => {
      if (!row) return;
      Object.keys(row).forEach((key) => {
        if (key === "type" || seenKeys.has(key)) {
          return;
        }
        seenKeys.add(key);
        availableKeys.push(key);
      });
    });

    // Include all rules so columns render immediately with skeleton loaders
    // while data is still being fetched
    const validRulesList = ruleOfList;

    // Only use columns from ruleOfList and preferred order that exist in data
    const orderedKeys = [
      ...preferredOrder?.filter((key) => availableKeys?.includes(key)),
      ...validRulesList
        ?.map((item) => item.rule)
        .filter((key) => {
          if (preferredOrder.includes(key)) {
            return availableKeys?.includes(key);
          }

          if (includePrePostData && SESSION_ONLY_RULES.has(key)) {
            return true;
          }

          return true;
        }),
    ];

    return orderedKeys?.map((key) => ({
      key,
      label:
        customLabels[key] ||
        ruleToMetadataMap[key]?.name || // Check allRows mapping first
        key?.charAt(0)?.toUpperCase() +
          key?.slice(1).replace(/([A-Z])/g, " $1"),
      type: ruleToMetadataMap[key]?.type || "string", // Add type from allRows or default to 'string'
      align: leftAlignKeys.has(key) ? "left" : "right",
    }));
  }

  // Function to generate sortOrders based on keys in rawData
  function generateSortOrders(data) {
    const stringKeys = new Set([
      "symbol",
      "name",
      "industry",
      "score",
      "sector",
      "analystRating",
      "putCallShare",
    ]);

    const collectedKeys: string[] = [];
    const seenKeys = new Set<string>();
    data?.forEach((row) => {
      if (!row) return;
      Object.keys(row).forEach((key) => {
        if (key === "type" || seenKeys.has(key)) {
          return;
        }
        seenKeys.add(key);
        collectedKeys.push(key);
      });
    });

    const orders: Record<string, { order: string; type: string }> = {};
    collectedKeys.forEach((key) => {
      const metadataType = allRows?.find((row) => row.rule === key)?.type;
      let resolvedType = mapRowTypeToSortType(metadataType);

      if (defaultStringKeys.has(key) || stringKeys.has(key)) {
        resolvedType = "string";
      } else if (resolvedType === "number") {
        const sample = pickSampleValue(data, key);
        if (sample instanceof Date) {
          resolvedType = "date";
        } else if (typeof sample === "string") {
          const trimmed = sample.trim();
          const parsed = parseFloat(trimmed.replace(/,/g, ""));
          if (
            trimmed.length > 0 &&
            !isPlaceholderDash(trimmed) &&
            Number.isNaN(parsed)
          ) {
            resolvedType = "string";
          }
        }
      }

      orders[key] = {
        order: "none",
        type: resolvedType,
      };
    });

    return orders;
  }

  // Generate columns and sortOrders
  let columns = generateColumns(rawData);
  let sortOrders = generateSortOrders(rawData);

  // Column reordering state and functions
  let customColumnOrder: string[] = [];
  let lastColumnOrderTab: string = displayTableTab;

  function getColumnOrderStorageKey(tab?: string): string {
    const currentPath = pagePathName || $page?.url?.pathname;
    const currentTab = tab || displayTableTab;
    return currentPath ? `${currentPath}_${currentTab}_columnOrder` : "";
  }

  function loadColumnOrder(tab?: string, forceReapply: boolean = false): void {
    const storageKey = getColumnOrderStorageKey(tab);
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
          lastColumnOrderTab = tab || displayTableTab;
          // Reset tracking to force reapplication of order
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
    lastColumnOrderTab = tab || displayTableTab;
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

    // Create a map for quick lookup
    const colMap = new Map(cols.map((col) => [col.key, col]));
    const orderedCols: typeof columns = [];
    const usedKeys = new Set<string>();

    // First, add columns in the saved order
    for (const key of customColumnOrder) {
      const col = colMap.get(key);
      if (col) {
        orderedCols.push(col);
        usedKeys.add(key);
      }
    }

    // Then, add any remaining columns that weren't in the saved order
    for (const col of cols) {
      if (!usedKeys.has(col.key)) {
        orderedCols.push(col);
      }
    }

    return orderedCols;
  }

  function handleColumnReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;

    // Create a new order from current columns
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);

    // Update the custom order (only save keys that currently exist)
    customColumnOrder = newColumns.map((col) => col.key);
    saveColumnOrder(customColumnOrder);

    // Update tracking to prevent reactive from re-applying
    lastAppliedColumnKeys = newColumns.map((col) => col.key).join("|");

    // Apply the new order
    columns = newColumns;
  }

  function resetColumnOrder(): void {
    const storageKey = getColumnOrderStorageKey();
    if (storageKey && typeof localStorage !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    customColumnOrder = [];
    lastAppliedColumnKeys = "";
    columns = generateColumns(rawData);
  }

  // Track if column order has been applied to prevent infinite loops
  let lastAppliedColumnKeys: string = "";

  // Load column order on initialization (with forceReapply for page refresh)
  loadColumnOrder(undefined, true);

  // Load column order when tab changes
  $: if (displayTableTab !== lastColumnOrderTab) {
    loadColumnOrder(displayTableTab, true);
  }

  // Apply custom column order when columns are regenerated
  $: if (columns && columns.length > 0 && customColumnOrder.length > 0) {
    const currentKeys = columns.map((c) => c.key).join("|");
    const orderedKeys = customColumnOrder.join("|");
    // Only reorder if the current order doesn't match custom order
    if (currentKeys !== orderedKeys && lastAppliedColumnKeys !== currentKeys) {
      // Check compatibility: at least 50% of saved order keys must exist in current columns
      // This prevents applying wrong tab's order during tab transitions
      const currentKeySet = new Set(columns.map((c) => c.key));
      const matchingKeys = customColumnOrder.filter((key) =>
        currentKeySet.has(key),
      );
      const compatibilityRatio = matchingKeys.length / customColumnOrder.length;

      if (compatibilityRatio >= 0.5) {
        lastAppliedColumnKeys = currentKeys;
        const reordered = applyColumnOrder(columns);
        const reorderedKeys = reordered.map((c) => c.key).join("|");
        if (reorderedKeys !== currentKeys) {
          columns = reordered;
        }
      }
    }
  }

  const sortData = (key, input = false) => {
    isSorting = true; // Prevent reactive statement from interfering

    // Reset all other keys to 'none' except the current key
    for (const k in sortOrders) {
      if (k !== key) {
        sortOrders[k].order = "none";
      }
    }

    // If input is false, cycle through 'none', 'asc', 'desc' for the clicked key
    if (!input) {
      const orderCycle = ["none", "asc", "desc"];
      const currentOrderIndex = orderCycle.indexOf(
        sortOrders[key]?.order || "none",
      );
      sortOrders[key] = {
        ...(sortOrders[key] || {}),
        order: orderCycle[(currentOrderIndex + 1) % orderCycle.length],
      };
    }

    const sortOrder = sortOrders[key]?.order;

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      if (inputValue?.length > 0) {
        // Restore the initial ordering, then re-run the search filter
        const reordered = sortByInitialOrder(originalData);
        originalData = [...reordered];
        initialRawData = [...reordered];
        search();
      } else {
        const reordered = sortByInitialOrder(originalData);
        originalData = [...reordered];
        initialRawData = [...reordered];
        rawData = [...reordered];
        currentPage = 1; // Reset to first page
        updatePaginatedData(); // Reset displayed data
      }
      isSorting = false; // Allow reactive statements again
      return;
    }

    // Generic comparison function
    const compareValues = (a, b) => {
      const { type } = sortOrders[key];
      const rawA = a?.[key];
      const rawB = b?.[key];

      const missingA = isMissingValue(rawA);
      const missingB = isMissingValue(rawB);

      if (missingA && missingB) return 0;
      if (missingA) return 1;
      if (missingB) return -1;

      let valueA;
      let valueB;

      switch (type) {
        case "date": {
          valueA = new Date(rawA).getTime();
          valueB = new Date(rawB).getTime();
          break;
        }
        case "rating":
        case "string": {
          valueA = normalizeString(rawA).toUpperCase();
          valueB = normalizeString(rawB).toUpperCase();
          const comparison =
            sortOrder === "asc"
              ? valueA.localeCompare(valueB)
              : valueB.localeCompare(valueA);
          return comparison;
        }
        case "number":
        default: {
          valueA = normalizeNumber(rawA);
          valueB = normalizeNumber(rawB);
          break;
        }
      }

      if (valueA === valueB) return 0;

      if (sortOrder === "asc") {
        return valueA < valueB ? -1 : 1;
      }

      return valueA > valueB ? -1 : 1;
    };

    // Get the data to sort and sort it
    const dataToSort = inputValue?.length > 0 ? rawData : originalData;
    const sortedData = [...dataToSort].sort(compareValues);

    // Update the appropriate data source based on whether we're filtering or not
    if (inputValue?.length > 0) {
      rawData = sortedData;
    } else {
      // When not filtering, update originalData to preserve sort and update rawData for display
      originalData = sortedData;
      rawData = sortedData;
    }

    currentPage = 1; // Reset to first page when sorting
    updatePaginatedData(); // Update the displayed data

    // Force reactivity by triggering the sortOrders reactivity
    sortOrders = { ...sortOrders };

    isSorting = false; // Allow reactive statements again
  };

  $: charNumber = $screenWidth < 640 ? 15 : 20;
</script>

<!-- Content area -->

<div
  class="w-full flex flex-col sm:flex-row items-center justify-start sm:justify-between mt-5 text-gray-700 dark:text-zinc-200 sm:pt-3 sm:pb-3 sm:border-t sm:border-b sm:border-gray-300 sm:dark:border-zinc-700"
>
  {#if title}
    <div
      class="flex flex-row items-center justify-between sm:justify-start w-full sm:w-fit whitespace-nowrap -mb-1 sm:mb-0"
    >
      <h2
        class="text-start w-full mb-2 sm:mb-0 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
      >
        {title}
      </h2>
      {#if date}
        <span
          class="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 font-medium ml-5 mt-1"
        >
          {date ? `Updated ${date}` : ""}
        </span>
      {/if}
    </div>
  {/if}
  <div
    class="flex {customColumnOrder?.length > 0
      ? 'flex-col sm:flex-row sm:items-center'
      : 'flex-row items-center'}  w-full border-t border-b border-gray-300 dark:border-zinc-700 sm:border-none pt-2 pb-2 sm:pt-0 sm:pb-0"
  >
    <!-- Row 1 on mobile: Find... (full width) -->
    <div class="relative w-full sm:w-fit ml-auto sm:flex-1 lg:flex-none">
      <div class="inline-block cursor-pointer absolute right-2 top-2 text-sm">
        {#if inputValue?.length > 0}
          <label class="cursor-pointer" on:click={() => resetTableSearch()}>
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
        bind:value={inputValue}
        on:input={search}
        type="text"
        placeholder={list_search_placeholder()}
        class="py-2 text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80 grow w-full sm:min-w-56 lg:max-w-14"
      />
    </div>

    <!-- Row 2 on mobile: Download + Reset + Indicators -->
    <div
      class="{customColumnOrder?.length > 0
        ? 'mt-2 sm:mt-0 sm:ml-2 w-full sm:w-fit'
        : ' ml-2 w-fit'}  flex items-center justify-end gap-2"
    >
      <DownloadData
        {data}
        {rawData}
        title={data?.getParams ?? "data"}
        {bulkDownload}
      />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild let:builder>
          <Button
            builders={[builder]}
            on:click={() => (allRows = sortIndicatorCheckMarks(allRows))}
            class="min-w-fit w-full transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span class="w-fit text-[0.85rem] sm:text-sm"
              >{list_indicators_label()}</span
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
              />
            </svg>
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={10}
          alignOffset={0}
          class="w-60 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
        >
          <!-- Search Input -->
          <div
            class="sticky fixed -top-1 z-40 bg-white/95 dark:bg-zinc-950/95 p-2 border-b border-gray-300 dark:border-zinc-700"
          >
            <div class="relative w-full">
              <!-- Input Field -->
              <input
                bind:value={searchQuery}
                on:input={handleInput}
                autocomplete="off"
                autofocus=""
                class="text-sm w-full border-0 bg-white/95 dark:bg-zinc-950/95 focus:border-gray-300 focus:ring-0 focus:outline-none placeholder:text-gray-600 dark:placeholder:text-zinc-400 text-gray-700 dark:text-zinc-200 pr-8"
                type="text"
                placeholder={list_search_indicators_placeholder()}
              />

              <!-- Clear Button - Shown only when searchQuery has input -->
              {#if searchQuery?.length > 0}
                <button
                  on:click={() => (searchQuery = "")}
                  aria-label={list_clear()}
                  title={list_clear()}
                  tabindex="0"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <svg
                    class="h-5 w-5 text-gray-500 dark:text-zinc-400 cursor-pointer"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
          </div>
          <!-- Dropdown items -->
          <DropdownMenu.Group class="pb-2">
            {#if searchQuery?.length !== 0 && testList?.length === 0}
              <div class="px-2 py-1 text-xs text-gray-500 dark:text-zinc-400">
                No indicators found
              </div>
            {/if}
            <!-- Added padding to avoid overlapping with Reset button -->
            {#each searchQuery?.length !== 0 ? testList : indicatorRows as item}
              <DropdownMenu.Item
                class="hover:bg-gray-100 dark:hover:bg-zinc-800/80 rounded-lg"
              >
                <div class="flex items-center">
                  {#if isRuleLocked(item?.rule)}
                    <label
                      on:click|capture={(event) => {
                        event.preventDefault();
                      }}
                      class="cursor-pointer"
                    >
                      <input
                        disabled={true}
                        type="checkbox"
                        class="cursor-pointer rounded checked:bg-gray-700 dark:checked:bg-zinc-600"
                        checked={ruleOfList.some(
                          (listItem) => listItem.rule === item?.rule,
                        )}
                      />
                      <span class="ml-2">{item?.name}</span>
                    </label>
                  {:else if ["Pro", "Plus"]?.includes(data?.user?.tier) || excludedRules?.has(item?.rule)}
                    <label
                      on:click|capture={(event) => {
                        event.preventDefault();
                        handleChangeValue(item?.name);
                      }}
                      class="cursor-pointer"
                      for={item?.name}
                    >
                      <input
                        disabled={isRuleLocked(item?.rule)}
                        type="checkbox"
                        class="rounded {isRuleLocked(item?.rule)
                          ? 'checked:bg-gray-800 dark:checked:bg-zinc-600'
                          : 'checked:bg-blue-700 dark:checked:bg-blue-600'}"
                        checked={ruleOfList.some(
                          (listItem) => listItem.rule === item?.rule,
                        )}
                      />
                      <span class="ml-2">{item?.name}</span>
                    </label>
                  {:else}
                    <a href="/pricing" class="cursor-pointer">
                      <svg
                        class="h-[18px] w-[18px] inline-block text-gray-500 dark:text-zinc-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style="max-width:40px"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clip-rule="evenodd"
                        ></path>
                      </svg>
                      <span class="ml-2">{item?.name}</span>
                    </a>
                  {/if}
                </div>
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
          <!-- Reset Selection button -->
          <div
            class="sticky -bottom-1 bg-white/95 dark:bg-zinc-950/95 z-50 p-2 border-t border-gray-300 dark:border-zinc-700 w-full flex justify-between items-center"
          >
            <label
              on:click={handleResetAll}
              class="w-full hover:text-violet-600 dark:hover:text-violet-400 text-gray-600 dark:text-zinc-300 bg-white/95 dark:bg-zinc-950/95 text-start text-sm cursor-pointer"
            >
              Reset Selection
            </label>
            <label
              on:click={handleSelectAll}
              class="w-full flex justify-end hover:text-violet-600 dark:hover:text-violet-400 text-gray-600 dark:text-zinc-300 bg-white/95 dark:bg-zinc-950/95 text-start text-sm cursor-pointer"
            >
              Select All
            </label>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {#if customColumnOrder?.length > 0}
        <button
          on:click={resetColumnOrder}
          title={list_reset_column_order()}
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

<!-- Navigation Tabs -->
<nav class="w-full flex flex-row items-center mt-3">
  <ul
    class="flex flex-row overflow-x-auto items-center space-x-2 whitespace-nowrap"
  >
    {#each resolvedTableTabs as tab (tab?.key)}
      <li>
        <button
          on:click={() => changeTab(tab?.key)}
          class="cursor-pointer text-sm sm:text-[0.95rem] flex flex-row items-center rounded-full px-3 py-1 border font-medium transition {displayTableTab ===
          tab?.key
            ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
            : 'border-transparent text-gray-600 dark:text-zinc-300 hover:text-violet-800 dark:hover:text-violet-400 hover:border-gray-300/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
        >
          <span>{tab?.label}</span>
          {#if (tab?.showCount || tab?.key === "indicators") &&
          tab?.key === "indicators" &&
          indicatorsTabRules?.length > activeIndicatorDefaultRows.length}
            <div
              class="ml-2 flex items-center justify-center h-4 w-4 bg-gray-200/70 dark:bg-zinc-800/80 border border-gray-300 shadow dark:border-zinc-700/80 text-gray-700 dark:text-zinc-200 rounded-full text-xs font-semibold"
            >
              {indicatorsTabRules.length - activeIndicatorDefaultRows.length}
            </div>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</nav>

{#if stockList?.length > 0}
  <div
    class="w-full overflow-x-auto rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200 mt-2"
  >
    <table
      class="table table-sm table-compact w-full m-auto mt-0 text-gray-700 dark:text-zinc-200 tabular-nums"
    >
      <thead>
        <TableHeader
          {columns}
          {sortOrders}
          {sortData}
          onColumnReorder={handleColumnReorder}
        />
      </thead>
      <tbody class="divide-y divide-gray-200/70 dark:divide-zinc-800/80">
        {#each stockList as item, index}
          <tr
            class="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-900/50 {index +
              1 ===
              rawData?.length &&
            !['Pro', 'Plus']?.includes(data?.user?.tier) &&
            hideLastRow
              ? 'opacity-[0.1]'
              : ''}"
          >
            {#each columns as column}
              <td
                class="text-[0.85rem] sm:text-sm text-gray-700 dark:text-zinc-200 whitespace-nowrap"
                class:text-left={column.align === "left"}
                class:text-right={column.align === "right"}
              >
                {#if inlineEditableColumns.has(column.key)}
                  {@const displayValue = formatEditableValue(
                    item[column.key],
                    column.key,
                  )}
                  {@const cellKey = getInlineCellKey(item, index, column.key)}
                  {#if activeInlineCells.has(cellKey)}
                    <input
                      type="text"
                      placeholder=""
                      value={editingValues.get(cellKey) ?? displayValue}
                      on:input={(event) =>
                        handleEditableInput(event, item, column.key)}
                      on:keydown={(event) =>
                        handleInlineInputKeydown(
                          event,
                          item,
                          index,
                          column.key,
                        )}
                      on:blur={(event) =>
                        handleInlineCellBlur(item, index, column.key, event)}
                      use:inlineInputAction={cellKey}
                      class="border border-gray-300 shadow dark:border-zinc-700 rounded-md px-2 py-1 w-auto max-w-20 text-right bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 focus:outline-none focus:ring-0"
                    />
                  {:else}
                    <button
                      type="button"
                      class="flex h-full w-full items-center justify-end gap-1 cursor-pointer focus:outline-hidden"
                      on:click={() =>
                        enableCellEditing(item, index, column.key)}
                    >
                      {#if displayValue?.trim()?.length > 0}
                        <span class="min-w-[6rem] text-right">
                          {displayValue}
                        </span>
                      {:else}
                        <svg
                          class="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="2"
                          style="max-width:40px"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          ></path>
                        </svg>
                        <span class="text-sm">{list_add_label()}</span>
                      {/if}
                    </button>
                  {/if}
                {:else if item[column.key] === null || item[column.key] === undefined}
                  {#if !(column.key in item)}
                    <span class="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 dark:bg-zinc-700"></span>
                  {:else}
                    -
                  {/if}
                {:else if column.key === "symbol"}
                  {#if editMode}
                    <div class="flex flex-row items-center">
                      <input
                        type="checkbox"
                        checked={deleteTickerList?.includes(item[column.key]) ??
                          false}
                        on:click={() =>
                          onToggleDeleteTicker &&
                          onToggleDeleteTicker(item[column.key])}
                        class="h-4 w-4 rounded border border-gray-300/70 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-950/70 text-gray-900 dark:text-white accent-gray-900 dark:accent-white mr-3"
                      />
                      <label
                        class="text-gray-800 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer"
                      >
                        {item[column.key]}
                      </label>
                    </div>
                  {:else}
                    <div class="flex items-center gap-1.5">
                      <HoverStockChart
                        symbol={item[column.key]}
                        assetType={item?.type || item?.assetType}
                      />
                      {#if onNoteClick}
                        <button
                          on:click|stopPropagation={() =>
                            onNoteClick(
                              item[column.key],
                              item?.hasNote || false,
                            )}
                          on:mouseenter={() =>
                            onNoteHover?.(
                              item[column.key],
                              item?.hasNote || false,
                            )}
                          class="cursor-pointer ml-auto transition-colors"
                          title={item?.hasNote ? "Edit note" : "Add note"}
                        >
                          <Pencil
                            class="h-3.5 w-3.5  {item?.hasNote
                              ? 'text-violet-500 dark:text-violet-400'
                              : 'text-gray-400 dark:text-zinc-500'}"
                          />
                        </button>
                      {/if}
                    </div>
                  {/if}
                {:else if column.key === "name"}
                  {#if item[column.key]?.length > charNumber}
                    {item[column.key]?.slice(0, charNumber) + "..."}
                  {:else}
                    {item[column.key]}
                  {/if}
                {:else if column?.type === "date"}
                  {new Date(item[column.key]).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                {:else if column?.type === "int"}
                  {@html ["marketCap", "totalAssets"]?.includes(column.key) &&
                  item[column.key] === 0
                    ? "-"
                    : abbreviateNumber(item[column.key], false, true)}
                {:else if column?.type === "float"}
                  {item[column.key]?.toFixed(2)}
                {:else if column?.type === "decimal"}
                  {typeof item[column.key] === "number"
                    ? item[column.key]?.toLocaleString("en-US")
                    : "-"}
                {:else if column?.type === "decimalSign"}
                  {#if item[column.key] >= 0}
                    <span class="text-emerald-800 dark:text-emerald-400"
                      >+{item[column.key]?.toLocaleString("en-US")}</span
                    >
                  {:else if item[column.key] < 0}
                    <span class="text-rose-800 dark:text-rose-400"
                      >{item[column.key]?.toLocaleString("en-US")}</span
                    >
                  {/if}
                {:else if column.key === "price"}
                  <div class="relative flex items-center justify-end">
                    {#if item?.previous != null && Math.abs(item.previous - item[column?.key]) >= 0.01}
                      <span
                        class="absolute h-1 w-1 {item[column?.key] < 10
                          ? 'right-[35px] sm:right-[40px]'
                          : item[column?.key] < 100
                            ? 'right-[40px] sm:right-[45px]'
                            : 'right-[45px] sm:right-[55px]'} bottom-0 -top-0.5 sm:-top-1"
                      >
                        <span
                          class="inline-flex rounded-full h-1 w-1 {item.previous >
                          item[column?.key]
                            ? 'bg-red-600 dark:bg-[#FF2F1F]'
                            : 'bg-emerald-500 dark:bg-emerald-400'} pulse-animation"
                        ></span>
                      </span>
                      <span
                        class="tabular-nums transition-colors duration-300 {item[
                          column?.key
                        ] > item.previous
                          ? 'text-emerald-800 dark:text-emerald-400'
                          : 'text-rose-800 dark:text-rose-400'}"
                        >{item[column.key] != null
                          ? item[column.key].toFixed(2)
                          : "-"}</span
                      >
                    {:else}
                      <span class="tabular-nums"
                        >{item[column.key] != null
                          ? item[column.key].toFixed(2)
                          : "-"}</span
                      >
                    {/if}
                  </div>
                {:else if column.type === "percent"}
                  {item[column.key] > 0.01
                    ? item[column.key]?.toFixed(2) + "%"
                    : "< 0.01%"}
                {:else if column.type === "percentSign"}
                  {#if item[column.key] == null}
                    <span>-</span>
                  {:else if item[column.key] > 0}
                    <span
                      class="tabular-nums text-emerald-800 dark:text-emerald-400"
                      >+{abbreviateNumber(item[column.key].toFixed(2))}%</span
                    >
                  {:else if item[column.key] < 0}
                    <span class="tabular-nums text-rose-800 dark:text-rose-400"
                      >{abbreviateNumber(item[column.key].toFixed(2))}%</span
                    >
                  {:else}
                    <span class="tabular-nums"
                      >{item[column.key].toFixed(2)}%</span
                    >
                  {/if}
                {:else if column.type === "sentiment" || column?.type === "rating"}
                  <div
                    class={["Bullish", "Buy", "Strong Buy"]?.includes(
                      item[column.key],
                    )
                      ? "text-emerald-800 dark:text-emerald-400"
                      : ["Neutral", "Hold"]?.includes(item[column.key])
                        ? "text-[#E57C34] dark:text-yellow-500"
                        : ["Bearish", "Sell", "Strong Sell"]?.includes(
                              item[column.key],
                            )
                          ? "text-rose-800 dark:text-rose-400"
                          : ""}
                  >
                    {item[column.key]}
                  </div>
                {:else}
                  {item[column.key]}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div class="w-full flex items-center justify-start text-start">
    <Infobox text={`No results found for "${inputValue}" `} />
  </div>
{/if}

{#if (inputValue?.length > 0 ? rawData?.length : originalData?.length) >= 19}
  <Pagination
    {currentPage}
    {totalPages}
    {rowsPerPage}
    {rowsPerPageOptions}
    on:pageChange={handlePageChange}
    on:rowsPerPageChange={handleRowsPerPageChange}
  />
{/if}

<style>
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    70% {
      transform: scale(1.1); /* Adjust scale as needed for pulse effect */
      opacity: 0.8;
    }
    100% {
      transform: scale(1); /* End scale */
      opacity: 0;
    }
  }

  /* Apply the animation styles to the element */
  .pulse-animation {
    animation: pulse 500ms ease-out forwards; /* 300ms duration */
  }
</style>
