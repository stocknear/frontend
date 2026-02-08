<script lang="ts">
  import { onMount } from "svelte";
  import { displayCompanyName, stockTicker } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import FinancialOverviewSection from "$lib/components/FinancialOverviewSection.svelte";
  import FinancialMetricPicker from "$lib/components/FinancialMetricPicker.svelte";
  import FinancialPopularMetrics from "$lib/components/FinancialPopularMetrics.svelte";
  import {
    STATEMENT_INDICATORS,
    type StatementIndicatorConfig,
  } from "$lib/financials/statementIndicators";

  export let data;

  const STORAGE_KEY = "financials_custom_metrics";

  // Preset configs (composite multi-series + special single-metric charts)
  const COMPOSITE_PRESETS: Record<string, any> = {
    stockPrice: {
      key: "stockPrice",
      label: "Stock Price",
      chartType: "line" as const,
      metrics: [{ key: "stockPrice", label: "Price", color: "#10B981" }],
    },
    cashAndDebt: {
      key: "cashAndDebt",
      label: "Cash & Debt",
      chartType: "grouped-stacked" as const,
      metrics: [
        { key: "cashAndCashEquivalents", label: "Cash", color: "#10B981", stack: "cash" },
        { key: "longTermDebt", label: "Long-Term Debt", color: "#B91C1C", stack: "debt" },
        { key: "capitalLeaseObligations", label: "Lease Obligations", color: "#F87171", stack: "debt" },
      ],
    },
    margins: {
      key: "margins",
      label: "Margins",
      chartType: "grouped" as const,
      isMargin: true,
      metrics: [
        { key: "returnOnCapitalEmployed", label: "ROCE" },
        { key: "grossProfitMargin", label: "Gross" },
        { key: "operatingProfitMargin", label: "Operating" },
        { key: "netProfitMargin", label: "Net" },
      ],
    },
    expenses: {
      key: "expenses",
      label: "Expenses",
      chartType: "stacked" as const,
      metrics: [
        { key: "capitalExpenditure", label: "CapEx", negate: true },
        { key: "sellingAndMarketingExpenses", label: "S&M" },
        { key: "sellingGeneralAndAdministrativeExpenses", label: "SG&A" },
        { key: "researchAndDevelopmentExpenses", label: "R&D" },
      ],
    },
    revenueToProfit: {
      key: "revenueToProfit",
      label: "Revenue to Profit",
      chartType: "grouped" as const,
      metrics: [
        { key: "revenue", label: "Revenue", color: "#10B981" },
        { key: "grossProfit", label: "Gross Profit", color: "#3B82F6" },
        { key: "operatingIncome", label: "Operating Income", color: "#8B5CF6" },
        { key: "netIncome", label: "Net Income", color: "#F59E0B" },
      ],
    },
    cashFlowBreakdown: {
      key: "cashFlowBreakdown",
      label: "Cash Flow Breakdown",
      chartType: "grouped" as const,
      metrics: [
        { key: "netCashProvidedByOperatingActivities", label: "Operating", color: "#10B981" },
        { key: "netCashProvidedByInvestingActivities", label: "Investing", color: "#F59E0B" },
        { key: "netCashProvidedByFinancingActivities", label: "Financing", color: "#3B82F6" },
      ],
    },
    assetsVsLiabilities: {
      key: "assetsVsLiabilities",
      label: "Assets vs Liabilities",
      chartType: "grouped" as const,
      metrics: [
        { key: "totalAssets", label: "Assets", color: "#10B981" },
        { key: "totalLiabilities", label: "Liabilities", color: "#EF4444" },
        { key: "totalStockholdersEquity", label: "Equity", color: "#3B82F6" },
      ],
    },
    capitalAllocation: {
      key: "capitalAllocation",
      label: "Capital Allocation",
      chartType: "stacked" as const,
      metrics: [
        { key: "capitalExpenditure", label: "CapEx", color: "#3B82F6", negate: true },
        { key: "researchAndDevelopmentExpenses", label: "R&D", color: "#8B5CF6" },
        { key: "acquisitionsNet", label: "Acquisitions", color: "#F59E0B", negate: true },
      ],
    },
    debtStructure: {
      key: "debtStructure",
      label: "Debt Structure",
      chartType: "stacked" as const,
      metrics: [
        { key: "shortTermDebt", label: "Short-Term Debt", color: "#F87171" },
        { key: "longTermDebt", label: "Long-Term Debt", color: "#B91C1C" },
        { key: "capitalLeaseObligations", label: "Lease Obligations", color: "#F59E0B" },
      ],
    },
    shareDilution: {
      key: "shareDilution",
      label: "Share Dilution",
      chartType: "grouped" as const,
      metrics: [
        { key: "weightedAverageShsOut", label: "Basic Shares", color: "#3B82F6" },
        { key: "weightedAverageShsOutDil", label: "Diluted Shares", color: "#8B5CF6" },
      ],
    },
    workingCapital: {
      key: "workingCapital",
      label: "Working Capital",
      chartType: "grouped" as const,
      metrics: [
        { key: "totalCurrentAssets", label: "Current Assets", color: "#10B981" },
        { key: "totalCurrentLiabilities", label: "Current Liabilities", color: "#EF4444" },
      ],
    },
    cashGeneration: {
      key: "cashGeneration",
      label: "Cash Generation",
      chartType: "grouped" as const,
      metrics: [
        { key: "operatingCashFlow", label: "Operating CF", color: "#10B981" },
        { key: "capitalExpenditure", label: "CapEx", color: "#EF4444" },
        { key: "freeCashFlow", label: "FCF", color: "#3B82F6" },
      ],
    },
  };

  const PRESET_LIST = Object.entries(COMPOSITE_PRESETS).map(([key, cfg]) => ({
    key,
    label: cfg.label,
  }));

  // Default selection: same 12 charts as the original hardcoded config
  const DEFAULT_INDICATOR_IDS = new Set<string>();

  // Verify these IDs exist in STATEMENT_INDICATORS
  const VALID_IDS = new Set(STATEMENT_INDICATORS.map((i) => i.id));

  const DEFAULT_PRESET_KEYS = new Set([
    "stockPrice",
    "cashAndDebt",
    "margins",
    "expenses",
  ]);

  // Indicator lookup map
  const indicatorMap = new Map<string, StatementIndicatorConfig>();
  for (const ind of STATEMENT_INDICATORS) {
    indicatorMap.set(ind.id, ind);
  }

  // State
  let selectedIds: Set<string> = new Set(DEFAULT_INDICATOR_IDS);
  let selectedPresetKeys: Set<string> = new Set(DEFAULT_PRESET_KEYS);
  let loaded = false;

  // Build chartConfig from selections
  function buildChartConfig(_ids?: Set<string>, _presets?: Set<string>): any[] {
    const configs: any[] = [];
    const usedKeys = new Set<string>();

    // Add preset charts first
    for (const key of selectedPresetKeys) {
      const preset = COMPOSITE_PRESETS[key];
      if (preset) {
        configs.push(preset);
        usedKeys.add(key);
      }
    }

    // Add individual indicator charts, skip if key already used by a preset
    for (const id of selectedIds) {
      if (usedKeys.has(id)) continue;
      const ind = indicatorMap.get(id);
      if (!ind) continue;
      usedKeys.add(ind.id);
      configs.push({
        key: ind.id,
        label: ind.label,
        chartType: "bar" as const,
        isMargin: ind.format === "percent",
        metrics: [{ key: ind.property, label: ind.label }],
      });
    }

    return configs;
  }

  // Reactive: rebuild when either set changes (Svelte tracks top-level refs)
  $: chartConfig = buildChartConfig(selectedIds, selectedPresetKeys);

  // Persist to localStorage
  function saveSelection() {
    if (!loaded) return;
    try {
      const payload = {
        indicatorIds: [...selectedIds],
        presetKeys: [...selectedPresetKeys],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // silent
    }
  }

  function loadSelection() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.indicatorIds)) {
        selectedIds = new Set(
          parsed.indicatorIds.filter((id: string) => VALID_IDS.has(id)),
        );
      }
      if (Array.isArray(parsed?.presetKeys)) {
        selectedPresetKeys = new Set(
          parsed.presetKeys.filter((k: string) => k in COMPOSITE_PRESETS),
        );
      }
    } catch (e) {
      // use defaults
    }
  }

  function handleToggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedIds = next;
    saveSelection();
  }

  function handleTogglePreset(key: string) {
    const next = new Set(selectedPresetKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    selectedPresetKeys = next;
    saveSelection();
  }

  function handleReset() {
    selectedIds = new Set();
    selectedPresetKeys = new Set();
    saveSelection();
  }

  function handleApplyPopular(presetKeys: string[], indicatorIds: string[]) {
    selectedPresetKeys = new Set(presetKeys);
    selectedIds = new Set(indicatorIds.filter((id) => VALID_IDS.has(id)));
    saveSelection();
  }

  function handleSelectAll() {
    selectedIds = new Set(STATEMENT_INDICATORS.map((i) => i.id));
    selectedPresetKeys = new Set(Object.keys(COMPOSITE_PRESETS));
    saveSelection();
  }

  onMount(() => {
    loadSelection();
    loaded = true;
  });
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Custom Financials - Key Metrics & Charts`}
  description={`Custom financial dashboard for ${$displayCompanyName} (${$stockTicker}) with customizable metrics including revenue, earnings, cash flow, margins, and valuation ratios.`}
  keywords={`${$stockTicker} financials, ${$displayCompanyName} custom financials, ${$stockTicker} revenue, earnings, cash flow, margins, financial charts`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage"],
    name: `${$displayCompanyName} (${$stockTicker}) Custom Financials`,
    description: `Custom financial charts for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/financials/custom`,
    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/favicon.png",
      },
    },
    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString(),
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
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
          name: "Stocks",
          item: "https://stocknear.com/stocks",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${$displayCompanyName} (${$stockTicker})`,
          item: `https://stocknear.com/stocks/${$stockTicker}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Custom Financials",
          item: `https://stocknear.com/stocks/${$stockTicker}/financials/custom`,
        },
      ],
    },
  }}
/>

<FinancialOverviewSection
  {data}
  {chartConfig}
  currentPrice={data?.getStockQuote?.price}
>
  <svelte:fragment slot="picker">
    <FinancialMetricPicker
      {selectedIds}
      {selectedPresetKeys}
      presets={PRESET_LIST}
      onToggle={handleToggle}
      onTogglePreset={handleTogglePreset}
      onReset={handleReset}
      onSelectAll={handleSelectAll}
    />
    <FinancialPopularMetrics onApply={handleApplyPopular} />
  </svelte:fragment>
</FinancialOverviewSection>
