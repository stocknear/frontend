<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { clearCache, screenWidth, getCache, setCache } from "$lib/store";
  import Copy from "lucide-svelte/icons/copy";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import InfoModal from "$lib/components/InfoModal.svelte";

  import {
    abbreviateNumber,
    sectorList,
    industryList,
    listOfRelevantCountries,
    groupScreenerRules,
  } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import Input from "$lib/components/Input.svelte";
  import SEO from "$lib/components/SEO.svelte";

  //const userConfirmation = confirm('Unsaved changes detected. Leaving now will discard your strategy. Continue?');

  import { writable } from "svelte/store";

  let shouldLoadWorker = writable(false);
  export let data;
  export let form;
  let showFilters = true;
  let isLoaded = false;
  let syncWorker: Worker | undefined;
  let downloadWorker: Worker | undefined;
  let searchWorker: Worker | undefined;
  let searchQuery = "";
  let inputValue = "";
  let originalFilteredData = [];
  let currentUnsortedData = []; // Current unsorted data (could be search results or screener results)
  let infoText = {};
  let tooltipTitle;
  let removeList = false;

  $: testList = [];

  // Update pagination when filteredData changes
  $: if (filteredData && filteredData.length >= 0) {
    updatePaginatedData();
  }

  let strategyList = data?.getAllStrategies;
  let selectedStrategy = strategyList?.at(0)?.id ?? "";
  let ruleOfList = strategyList?.at(0)?.rules ?? [];
  let groupedRules = {};
  let displayRules = [];
  let selectedPopularStrategy = "";
  const popularStrategyList = [
    { key: "earningsVolatility", label: "Earnings Volatility" },
    { key: "dividendGrowth", label: "Dividend Growth" },
    { key: "monthlyDividends", label: "Monthly Dividends" },
    { key: "topGainers1Y", label: "Top Gainers 1Y" },
    { key: "topShortedStocks", label: "Top Shorted Stocks" },
    { key: "momentumTAStocks", label: "Momentum TA Stocks" },
    { key: "underValuedStocks", label: "Undervalued Stocks" },
    { key: "strongCashFlow", label: "Strong Cash Flow" },
  ];

  const onlySubscriberRules = [
    "gexRatio",
    "ivRank",
    "iv30d",
    "totalOI",
    "changeOI",
    "netCallPrem",
    "netPutPrem",
    "callVolume",
    "putVolume",
    "pcRatio",
    "topAnalystRating",
    "topAnalystCounter",
    "topAnalystPriceTarget",
    "topAnalystUpside",
    "score",
  ];

  const checkedRules = [
    "sma20",
    "sma50",
    "sma100",
    "sma200",
    "ema20",
    "ema50",
    "ema100",
    "ema200",
    "grahamNumber",
    "lynchFairValue",
    "analystRating",
    "earningsTime",
    "earningsDate",
    "exDividendDate",
    "payoutFrequency",
    "topAnalystRating",
    "halalStocks",
    "score",
    "sector",
    "industry",
    "country",
  ];

  let displayTableTab = "general";
  let otherTabRules = [];

  // Preloading system for tab data
  let preloadedData = new Map(); // Cache for preloaded tab data
  let preloadingTabs = new Set(); // Track which tabs are currently preloading
  let hoverTimeout = null; // Debounce hover events

  let stockScreenerData = data?.getStockScreenerData?.filter((item) =>
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

  // Define all possible rules and their properties
  const allRules = {
    avgVolume: {
      label: "Average Volume",
      step: ["100M", "10M", "1M", "100K", "10K", "1K", "0"],
      defaultCondition: "over",
      defaultValue: "any",
      category: ["Most Popular", "Price & Volume"],
    },
    volume: {
      label: "Volume",
      step: ["100M", "10M", "1M", "100K", "10K", "1K", "0"],

      defaultCondition: "over",
      defaultValue: "any",
      category: "Price & Volume",
    },
    rsi: {
      label: "Relative Strength Index",
      step: [90, 80, 70, 60, 50, 40, 30, 20],
      category: "Technical Analysis",
      defaultCondition: "over",
      defaultValue: "any",
    },
    stochRSI: {
      label: "Stochastic RSI Fast",
      step: [90, 80, 70, 60, 50, 40, 30, 20],
      category: "Technical Analysis",
      defaultCondition: "over",
      defaultValue: "any",
    },
    mfi: {
      label: "Money Flow Index",
      step: [90, 80, 70, 60, 50, 40, 30, 20],
      category: "Technical Analysis",
      defaultCondition: "over",
      defaultValue: "any",
    },
    cci: {
      label: "Commodity Channel Index",
      step: [250, 200, 100, 50, 20, 0, -20, -50, -100, -200, -250],
      category: "Technical Analysis",
      defaultCondition: "over",
      defaultValue: "any",
    },
    atr: {
      label: "Average True Range",
      step: [20, 15, 10, 5, 3, 1],
      category: "Technical Analysis",
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
      category: "Technical Analysis",
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
      category: "Technical Analysis",
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
      category: "Technical Analysis",
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
      category: "Technical Analysis",
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
      category: "Technical Analysis",
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
      category: "Technical Analysis",
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
      category: "Technical Analysis",
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
      category: "Technical Analysis",
      defaultValue: "any",
    },
    grahamNumber: {
      label: "Graham Number",
      step: ["Price > Graham Number", "Price < Graham Number"],
      defaultValue: "any",
      category: "Fair Value",
    },
    grahamUpside: {
      label: "Graham Upside",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Fair Value",
    },
    lynchUpside: {
      label: "Lynch Upside",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Fair Value",
    },
    lynchFairValue: {
      label: "Lynch Fair Value",
      step: ["Price > Lynch Fair Value", "Price < Lynch Fair Value"],
      defaultValue: "any",
      category: "Fair Value",
    },
    price: {
      label: "Price",
      step: [1000, 500, 400, 300, 200, 150, 100, 80, 60, 50, 20, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Price & Volume",
    },
    changesPercentage: {
      label: "Price Change 1D",
      step: ["20%", "10%", "5%", "1%", "0%"],
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
    marketCap: {
      label: "Market Cap",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: ["Most Popular", "Valuation & Ratios"],
    },
    workingCapital: {
      label: "Working Capital",
      step: ["20B", "10B", "5B", "1B", "500M", "100M", "50M", "10M", "1M", "0"],

      defaultCondition: "over",
      defaultValue: "any",
    },
    totalAssets: {
      label: "Total Assets",
      step: ["500B", "200B", "100B", "50B", "10B", "1B", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Assets & Liabilities",
    },
    tangibleAssetValue: {
      label: "Tangible Assets",
      step: ["500B", "200B", "100B", "50B", "10B", "1B", "100M", "10M"],

      defaultCondition: "over",
      defaultValue: "any",
    },
    revenue: {
      label: "Revenue",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Revenue / Sales",
    },
    revenueGrowthYears: {
      label: "Revenue Growth Years",
      step: ["10", "5", "3", "1"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Revenue / Sales",
    },
    epsGrowthYears: {
      label: "EPS Growth Years",
      step: ["10", "5", "3", "1"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    netIncomeGrowthYears: {
      label: "Net Income Growth Years",
      step: ["10", "5", "3", "1"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Net Income",
    },
    grossProfitGrowthYears: {
      label: "Gross Profit Growth Years",
      step: ["10", "5", "3", "1"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Other Profits",
    },
    growthRevenue: {
      label: "Revenue Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: ["Most Popular", "Revenue / Sales"],
    },
    costOfRevenue: {
      label: "Cost of Revenue",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Expenses",
    },
    growthCostOfRevenue: {
      label: "Cost of Revenue Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Expenses",
    },
    costAndExpenses: {
      label: "Cost & Expenses",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Expenses",
    },
    growthCostAndExpenses: {
      label: "Cost & Expenses Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Expenses",
    },
    netIncome: {
      label: "Net Income",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Net Income",
    },
    growthNetIncome: {
      label: "Net Income Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Net Income",
    },
    grossProfit: {
      label: "Gross Profit",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Other Profits",
    },
    growthGrossProfit: {
      label: "Gross Profit Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Other Profits",
    },
    researchAndDevelopmentExpenses: {
      label: "Research & Development",
      step: ["10B", "1B", "100M", "10M", "1M", 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Expenses",
    },
    growthResearchAndDevelopmentExpenses: {
      label: "R&D Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Expenses",
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
      category: ["Most Popular", "Dividends"],
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
    eps: {
      label: "EPS",
      step: [20, 15, 10, 5, 3, 2, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    growthEPS: {
      label: "EPS Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Valuation & Ratios",
    },
    interestIncome: {
      label: "Interest Income",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
    },
    interestExpense: {
      label: "Interest Expenses",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Expenses",
    },
    growthInterestExpense: {
      label: "Interest Expenses Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Expenses",
    },
    operatingExpenses: {
      label: "Operating Expenses",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Expenses",
    },
    growthOperatingExpenses: {
      label: "Operating Expenses Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Expenses",
    },
    ebit: {
      label: "EBIT",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Other Profits",
    },
    operatingIncome: {
      label: "Operating Income",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Other Profits",
    },
    growthOperatingIncome: {
      label: "Operating Income Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Other Profits",
    },
    growthFreeCashFlow: {
      label: "FCF Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Cash Flow",
    },
    growthOperatingCashFlow: {
      label: "OCF Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Cash Flow",
    },
    growthStockBasedCompensation: {
      label: "SBC Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Expenses",
    },
    growthTotalLiabilities: {
      label: "Total Liabilities Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Assets & Liabilities",
    },
    growthTotalDebt: {
      label: "Total Debt Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Debt",
    },
    growthTotalStockholdersEquity: {
      label: "Shareholders Equity Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Shares Statistics",
    },
    researchDevelopmentRevenueRatio: {
      label: "R&D / Revenue",
      step: ["20%", "10%", "5%", "1%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Revenue / Sales",
    },

    cagr3YearRevenue: {
      label: "Revenue CAGR 3Y",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Revenue / Sales",
    },
    cagr5YearRevenue: {
      label: "Revenue CAGR 5Y",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Revenue / Sales",
    },
    cagr3YearEPS: {
      label: "EPS CAGR 3Y",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Valuation & Ratios",
    },
    cagr5YearEPS: {
      label: "EPS CAGR 5Y",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Valuation & Ratios",
    },
    cagrNext3YearEPS: {
      label: "EPS Growth Next 3Y",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Forecasts, Analysts & Price Targets",
    },
    cagrNext5YearEPS: {
      label: "EPS Growth Next 5Y",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Forecasts, Analysts & Price Targets",
    },
    cagrNext3YearRevenue: {
      label: "Revenue Growth Next 3Y",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Forecasts, Analysts & Price Targets",
    },
    cagrNext5YearRevenue: {
      label: "Revenue Growth Next 5Y",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Forecasts, Analysts & Price Targets",
    },
    returnOnInvestedCapital: {
      label: "Return On Invested Capital",
      step: ["80%", "50%", "20%", "10%", "5%", "0%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Financial Performance",
    },
    returnOnCapitalEmployed: {
      label: "Return On Capital Employed",
      step: ["100%", "50%", "20%", "10%", "5%", "0%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Financial Performance",
    },
    relativeVolume: {
      label: "Relative Volume",
      step: ["500%", "200%", "100%", "50%", "10%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Price & Volume",
    },
    institutionalOwnership: {
      label: "Institutional Ownership",
      step: ["90%", "80%", "70%", "60%", "50%", "40%", "30%", "20%", "10%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Shares Statistics",
    },

    priceToEarningsGrowthRatio: {
      label: "PEG Ratio",
      step: [100, 10, 5, 3, 1, 0.5, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    forwardPE: {
      label: "Forward PE",
      step: [50, 20, 10, 5, 1, 0, -1, -5, -10, -20, -50],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    forwardPS: {
      label: "Forward PS",
      step: [50, 20, 10, 5, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    priceToBookRatio: {
      label: "PB Ratio",
      step: [50, 40, 30, 20, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    priceToSalesRatio: {
      label: "PS Ratio",
      step: [50, 40, 30, 20, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    beta: {
      label: "Beta",
      step: [10, 5, 1, -5, -10],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Price & Volume",
    },
    ebitda: {
      label: "EBITDA",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Other Profits",
    },
    growthEBITDA: {
      label: "EBITDA Growth",
      step: ["200%", "100%", "50%", "20%", "10%", "5%", "1%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Other Profits",
    },
    var: {
      label: "Value-at-Risk",
      step: ["-1%", "-5%", "-10%", "-15%", "-20%"],
      defaultCondition: "over",
      defaultValue: "-5%",
      varType: "percentSign",
      category: "Performance",
    },
    currentRatio: {
      label: "Current Ratio",
      step: [50, 40, 30, 20, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    quickRatio: {
      label: "Quick Ratio",
      step: [50, 40, 30, 20, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    debtToEquityRatio: {
      label: "Debt / Equity",
      step: [50, 40, 30, 20, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Debt",
    },
    inventoryTurnover: {
      label: "Inventory Turnover",
      step: [200, 100, 50, 20, 10, 5, 3, 2, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
    },
    returnOnAssets: {
      label: "Return on Assets",
      step: ["80%", "50%", "20%", "10%", "5%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Financial Performance",
    },
    returnOnEquity: {
      label: "Return on Equity",
      step: ["80%", "50%", "20%", "10%", "5%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: ["Most Popular", "Financial Performance"],
    },
    returnOnTangibleAssets: {
      label: "Return on Tangible Assets",
      step: ["80%", "50%", "20%", "10%", "5%"],
      defaultCondition: "over",
      varType: "percentSign",
      defaultValue: "any",
      category: "Financial Performance",
    },
    enterpriseValue: {
      label: "Enterprise Value",
      step: ["100B", "50B", "10B", "1B", "300M", "100M", "10M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    evToSales: {
      label: "EV / Sales",
      step: [50, 20, 10, 5, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    evToEBITDA: {
      label: "EV / EBITDA",
      step: [50, 20, 10, 5, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    evToEBIT: {
      label: "EV / EBIT",
      step: [50, 20, 10, 5, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    evToFreeCashFlow: {
      label: "EV / FCF",
      step: [50, 20, 10, 5, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    freeCashFlowPerShare: {
      label: "FCF / Share",
      step: [10, 8, 6, 4, 2, 1, 0],

      defaultCondition: "over",
      defaultValue: "any",
      category: "Cash Flow",
    },
    cashPerShare: {
      label: "Cash / Share",
      step: [50, 20, 10, 5, 1, 0, -1, -5, -10, -20, -50],

      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    priceToFreeCashFlowRatio: {
      label: "Price / FCF",
      step: [50, 20, 10, 5, 1, 0, -1, -5, -10, -20, -50],

      defaultCondition: "over",
      defaultValue: "any",
      category: "Cash Flow",
    },
    interestCoverageRatio: {
      label: "Interest Coverage",
      step: [10, 5, 3, 2, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    sharesShort: {
      label: "Short Interest",
      step: ["50M", "20M", "10M", "5M", "1M", "500K"],

      defaultCondition: "over",
      defaultValue: "500K",
      category: "Short Selling Statistics",
    },
    shortRatio: {
      label: "Short Ratio",
      step: [10, 5, 3, 2, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Short Selling Statistics",
    },
    shortFloatPercent: {
      label: "Short % Float",
      step: ["50%", "30%", "20%", "10%", "5%", "1%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Short Selling Statistics",
    },
    shortOutstandingPercent: {
      label: "Short % Outstanding",
      step: ["50%", "30%", "20%", "10%", "5%", "1%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Short Selling Statistics",
    },
    failToDeliver: {
      label: "Fail to Deliver (FTD)",
      step: ["1M", "500K", "200K", "100K", "50K", "10K", "1K"],

      defaultCondition: "over",
      defaultValue: "any",
      category: "Short Selling Statistics",
    },
    relativeFTD: {
      label: "FTD / Avg. Volume",
      step: ["300%", "200%", "100%", "50%", "20%", "10%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Short Selling Statistics",
    },

    freeCashFlow: {
      label: "Free Cash Flow",
      step: ["50B", "10B", "1B", "100M", "10M", "1M", 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Cash Flow",
    },
    operatingCashFlow: {
      label: "Operating Cash Flow",
      step: ["50B", "10B", "1B", "100M", "10M", "1M", 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Cash Flow",
    },
    operatingCashFlowPerShare: {
      label: "Operating Cash Flow / Share",
      step: [50, 40, 30, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Cash Flow",
    },
    revenuePerShare: {
      label: "Revenue / Share",
      step: [50, 40, 30, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    netIncomePerShare: {
      label: "Net Income / Share",
      step: [50, 40, 30, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    shareholdersEquityPerShare: {
      label: "Shareholders Equity / Share",
      step: [50, 40, 30, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    interestDebtPerShare: {
      label: "Interest Debt / Share",
      step: [50, 40, 30, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Debt",
    },
    capexPerShare: {
      label: "CapEx / Share",
      step: [50, 40, 30, 10, 5, 1],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    freeCashFlowMargin: {
      label: "FCF Margin",
      step: ["80%", "50%", "20%", "10%", "5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Margins",
    },
    totalDebt: {
      label: "Total Debt",
      step: ["200B", "100B", "50B", "10B", "1B", "100M", "10M", "1M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Debt",
    },
    operatingCashFlowSalesRatio: {
      label: "Operating Cash Flow / Sales",
      step: [5, 3, 1, 0.5, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    priceToOperatingCashFlowRatio: {
      label: "Price / Cash Flow",
      step: [20, 15, 10, 5, 3, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Valuation & Ratios",
    },
    priceToEarningsRatio: {
      label: "PE Ratio",
      step: [100, 50, 20, 10, 5, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: ["Most Popular", "Valuation & Ratios"],
    },
    stockBasedCompensation: {
      label: "Stock-Based Compensation",
      step: ["10B", "1B", "100M", "10M", "1M", 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Expenses",
    },
    stockBasedCompensationToRevenue: {
      label: "SBC / Revenue",
      step: ["20%", "10%", "5%", "1%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Expenses",
    },
    totalStockholdersEquity: {
      label: "Shareholders Equity",
      step: ["100B", "50B", "10B", "1B", "100M", "50M", "10M", "1M", 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Shares Statistics",
    },
    sharesQoQ: {
      label: "Shares Change (QoQ)",
      step: ["80%", "60%", "50%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Shares Statistics",
    },
    sharesYoY: {
      label: "Shares Change (YoY)",
      step: ["80%", "60%", "50%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Shares Statistics",
    },
    grossProfitMargin: {
      label: "Gross Margin",
      step: ["80%", "60%", "50%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Margins",
    },
    netProfitMargin: {
      label: "Profit Margin",
      step: ["80%", "60%", "50%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Margins",
    },
    pretaxProfitMargin: {
      label: "Pretax Margin",
      step: ["80%", "60%", "50%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Margins",
    },
    ebitdaMargin: {
      label: "EBITDA Margin",
      step: ["80%", "60%", "50%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Margins",
    },
    ebitMargin: {
      label: "EBIT Margin",
      step: ["80%", "60%", "50%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Margins",
    },
    operatingMargin: {
      label: "Operating Margin",
      step: ["80%", "60%", "50%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Margins",
    },
    interestIncomeToCapitalization: {
      label: "Interest Income / Market Cap",
      step: ["80%", "60%", "50%", "30%", "20%", "10%", "5%", "1%", "0.5%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Valuation & Ratios",
    },
    assetTurnover: {
      label: "Asset Turnover",
      step: [5, 3, 2, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
    },
    earningsYield: {
      label: "Earnings Yield",
      step: ["20%", "15%", "10%", "5%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Valuation & Ratios",
    },
    freeCashFlowYield: {
      label: "FCF Yield",
      step: ["20%", "15%", "10%", "5%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percent",
      category: "Valuation & Ratios",
    },
    effectiveTaxRate: {
      label: "Effective Tax Rate",
      step: ["20%", "15%", "10%", "5%", "0%"],
      defaultCondition: "over",
      varType: "percent",
      defaultValue: "any",
      category: "Taxes",
    },
    fixedAssetTurnover: {
      label: "Fixed Asset Turnover",
      step: [10, 5, 3, 2, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
    },
    sharesOutStanding: {
      label: "Shares Outstanding",
      step: ["10B", "5B", "1B", "100M", "50M", "10M", "1M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Shares Statistics",
    },
    bookValuePerShare: {
      label: "Book Value Per Share",
      step: [100, 50, 10, 5, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Assets & Liabilities",
    },
    bookValue: {
      label: "Book Value",
      step: ["100B", "50B", "10B", "100M", "50M", "10M", "1M", 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Assets & Liabilities",
    },
    employees: {
      label: "Employees",
      step: ["500K", "300K", "200K", "100K", "10K", "1K", "100"],
      defaultCondition: "over",
      defaultValue: "100K",
      category: "Company Info",
    },
    revenuePerEmployee: {
      label: "Revenue Per Employee",
      step: ["5M", "3M", "2M", "1M", "500K", "100K", 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Company Info",
    },

    profitPerEmployee: {
      label: "Profit Per Employee",
      step: ["5M", "3M", "2M", "1M", "500K", "100K", 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Company Info",
    },
    totalLiabilities: {
      label: "Total Liabilities",
      step: ["500B", "200B", "100B", "50B", "10B", "1B", "100M", "10M", "1M"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Assets & Liabilities",
    },
    altmanZScore: {
      label: "Altman-Z-Score",
      step: [10, 5, 3, 1],
      defaultCondition: "over",
      defaultValue: "any",
    },
    piotroskiScore: {
      label: "Piotroski F-Score",
      step: [9, 8, 7, 6, 5, 4, 3, 2, 1],
      defaultCondition: "over",
      defaultValue: "any",
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
    analystRating: {
      label: "Analyst Rating",
      step: ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"],
      defaultCondition: "",
      defaultValue: "any",
      category: "Forecasts, Analysts & Price Targets",
    },
    analystCounter: {
      label: "Analyst Count",
      step: ["40", "30", "20", "10", "5", "0"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Forecasts, Analysts & Price Targets",
    },
    priceTarget: {
      label: "Price Target",
      step: ["1000", "500", "100", "10", "5", "1"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Forecasts, Analysts & Price Targets",
    },
    upside: {
      label: "Price Target Upside",
      step: ["100%", "50%", "20%", "10%", "5%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Forecasts, Analysts & Price Targets",
    },
    topAnalystRating: {
      label: "Top Analyst Rating",
      step: ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"],
      defaultCondition: "",
      defaultValue: "any",
      category: ["Most Popular", "Forecasts, Analysts & Price Targets"],
    },
    topAnalystCounter: {
      label: "Top Analyst Count",
      step: ["10", "5", "3", "1"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Forecasts, Analysts & Price Targets",
    },
    topAnalystUpside: {
      label: "Top Analyst Price Target Upside",
      step: ["100%", "50%", "20%", "10%", "5%", "0%"],
      defaultCondition: "over",
      defaultValue: "any",
      varType: "percentSign",
      category: "Forecasts, Analysts & Price Targets",
    },
    topAnalystPriceTarget: {
      label: "Top Analyst Price Target",
      step: ["1000", "500", "100", "10", "5", "1"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Forecasts, Analysts & Price Targets",
    },
    halalStocks: {
      label: "Halal Stocks",
      step: ["Compliant", "Non-Compliant"],
      defaultCondition: "",
      defaultValue: "any",
    },
    score: {
      label: "AI Score",
      step: ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"],
      defaultCondition: "",
      defaultValue: "any",
      category: ["Most Popular", "Forecasts, Analysts & Price Targets"],
    },
    sector: {
      label: "Sector",
      step: sectorList,
      defaultCondition: "",
      defaultValue: "any",
      category: "Company Info",
    },
    industry: {
      label: "Industry",
      step: industryList,
      defaultCondition: "",
      defaultValue: "any",
      category: ["Most Popular", "Company Info"],
    },
    country: {
      label: "Country",
      step: listOfRelevantCountries,
      defaultCondition: "",
      defaultValue: "any",
      category: "Company Info",
    },
    ivRank: {
      label: "IV Rank",
      step: [50, 30, 20, 10, 5, 1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
    iv30d: {
      label: "IV 30d",
      step: [1, 0.5, 0.3, 0.1, 0],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
    totalOI: {
      label: "Total OI",
      step: ["500K", "300K", "200K", "100K", "50K", "10K", "1K"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
    changeOI: {
      label: "Change OI",
      step: ["5K", "3K", "1K", "500", "300", "100"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
    callVolume: {
      label: "Call Volume",
      step: ["100K", "50K", "20K", "10K", "5K", "1K"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
    putVolume: {
      label: "Put Volume",
      step: ["100K", "50K", "20K", "10K", "5K", "1K"],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
    pcRatio: {
      label: "P/C Ratio",
      step: [10, 5, 3, 2, 1, 0.5],
      defaultCondition: "over",
      defaultValue: "any",
      category: "Options Activity",
    },
  };

  let filteredData = [];
  let displayResults = [];

  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 20; // Will be loaded from localStorage
  let rowsPerPageOptions = [20, 50, 100];
  let totalPages = 1;

  // Generate allRows from allRules
  $: allRows = Object?.entries(allRules)
    ?.sort(([, a], [, b]) => a.label.localeCompare(b.label)) // Sort by label
    ?.map(([ruleName, ruleProps]) => ({
      rule: ruleName,
      ...ruleProps,
    }));

  let filteredGroupedRules;
  let searchTerm = "";

  let ruleName = "";

  // Quick search functionality for unselected rules
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

  async function handleCreateStrategy() {
    if (["Pro", "Plus"]?.includes(data?.user?.tier)) {
      const closePopup = document.getElementById("addStrategy");
      closePopup?.dispatchEvent(new MouseEvent("click"));
    } else {
      toast.info("Available only to Plus or Pro Member", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    }
  }

  async function handleDeleteStrategy() {
    const deletePromise = (async () => {
      const postData = { strategyId: selectedStrategy, type: "stocksScreener" };

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
        currentPage = 1;
        totalPages = 1;
      }

      await updateStockScreenerData();

      checkedItems = new Map(
        ruleOfList
          ?.filter((rule) => checkedRules.includes(rule.name))
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
    const postData = { type: "stocksScreener" };
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

  async function resetTableSearch() {
    inputValue = "";
    search();
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

    await updateStockScreenerData();
    checkedItems = new Map(
      ruleOfList
        ?.filter((rule) => checkedRules?.includes(rule.name)) // Only include specific rules
        ?.map((rule) => [rule.name, new Set(rule.value)]), // Create Map from filtered rules
    );
  }

  function changeRule(state: string) {
    if (
      !["Pro", "Plus"]?.includes(data?.user?.tier) &&
      onlySubscriberRules?.includes(state)
    ) {
      goto("/pricing");
    } else {
      selectedPopularStrategy = "";
      ruleName = state;
      handleAddRule();
    }
  }

  const handleMessage = (event) => {
    displayRules = allRows?.filter((row) =>
      ruleOfList?.some((rule) => rule.name === row.rule),
    );

    filteredData = event.data?.filteredData ?? [];
    originalFilteredData = [...filteredData]; // Store original filtered data for search
    currentUnsortedData = [...filteredData]; // Store current unsorted data
    currentPage = 1; // Reset to first page
    updatePaginatedData();
  };

  const handleScreenerMessage = (event) => {
    stockScreenerData = event?.data?.stockScreenerData;
    shouldLoadWorker.set(true);
  };

  const loadWorker = async () => {
    syncWorker.postMessage({
      stockScreenerData,
      ruleOfList: [...ruleOfList, ...otherTabRules],
    });
  };

  const updateStockScreenerData = async () => {
    downloadWorker.postMessage({
      ruleOfList: [...ruleOfList, ...otherTabRules],
    });
  };

  // Search functionality similar to Table.svelte
  async function search() {
    inputValue = inputValue?.toLowerCase();

    setTimeout(async () => {
      if (inputValue?.length > 0) {
        await loadSearchWorker();
      } else {
        // Reset to original data if filter is empty
        filteredData = [...originalFilteredData];
        currentUnsortedData = [...originalFilteredData];
        currentPage = 1; // Reset to first page
        updatePaginatedData();
      }
    }, 100);
  }

  const loadSearchWorker = async () => {
    if (searchWorker && originalFilteredData?.length > 0) {
      searchWorker.postMessage({
        rawData: originalFilteredData,
        inputValue: inputValue,
      });
    }
  };

  const handleSearchMessage = (event) => {
    if (event.data?.message === "success") {
      filteredData = event.data?.output ?? [];
      currentUnsortedData = [...filteredData]; // Store unsorted search results
      currentPage = 1; // Reset to first page after search
      updatePaginatedData();
    }
  };

  // Preloading function for tab data using downloadWorker
  const preloadTabData = async (tabName) => {
    // Prevent multiple preloads of the same tab
    if (
      preloadingTabs.has(tabName) ||
      preloadedData.has(tabName) ||
      tabName === displayTableTab
    ) {
      return;
    }

    preloadingTabs.add(tabName);

    try {
      // Get rules for the specific tab
      let tabRules = [];
      switch (tabName) {
        case "performance":
          tabRules = [
            { name: "marketCap", value: "any" },
            { name: "change1W", value: "any" },
            { name: "change1M", value: "any" },
            { name: "change3M", value: "any" },
            { name: "change1Y", value: "any" },
          ];
          break;
        case "analysts":
          tabRules = [
            { name: "marketCap", value: "any" },
            { name: "analystRating", value: "any" },
            { name: "analystCounter", value: "any" },
            { name: "priceTarget", value: "any" },
            { name: "upside", value: "any" },
          ];
          break;
        case "dividends":
          tabRules = [
            { name: "marketCap", value: "any" },
            { name: "annualDividend", value: "any" },
            { name: "dividendYield", value: "any" },
            { name: "payoutRatio", value: "any" },
            { name: "dividendGrowth", value: "any" },
          ];
          break;
        case "financials":
          tabRules = [
            { name: "marketCap", value: "any" },
            { name: "revenue", value: "any" },
            { name: "operatingIncome", value: "any" },
            { name: "netIncome", value: "any" },
            { name: "freeCashFlow", value: "any" },
            { name: "eps", value: "any" },
          ];
          break;
      }

      if (tabRules.length > 0) {
        // Create a temporary worker for preloading
        const PreloadWorker = await import("./workers/downloadWorker?worker");
        const preloadWorker = new PreloadWorker.default();

        // Set up message handler for preloading
        preloadWorker.onmessage = (event) => {
          if (event.data.message === "success") {
            // Cache the preloaded data
            preloadedData.set(tabName, {
              data: event.data.stockScreenerData,
              rules: tabRules,
              timestamp: Date.now(),
            });
          }
          // Clean up the worker
          preloadWorker.terminate();
          preloadingTabs.delete(tabName);
        };

        // Send preload request to worker
        preloadWorker.postMessage({
          ruleOfList: [...ruleOfList, ...tabRules],
        });
      } else {
        preloadingTabs.delete(tabName);
      }
    } catch (error) {
      console.error(`Failed to preload data for ${tabName}:`, error);
      preloadingTabs.delete(tabName);
    }
  };

  // Debounced hover handler
  const handleTabHover = (tabName) => {
    // Clear existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Set new timeout for debouncing
    hoverTimeout = setTimeout(() => {
      preloadTabData(tabName);
    }, 50);
  };

  // Clear hover timeout
  const handleTabHoverLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  };

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
    quickSearchTerm = "";
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

    // Clear preloaded data when rules change
    preloadedData.clear();

    let newRule;

    switch (ruleName) {
      case "analystRating":
      case "payoutFrequency":
      case "topAnalystRating":
      case "earningsTime":
      case "earningsDate":
      case "halalStocks":
      case "score":
      case "sector":
      case "industry":
      case "country":
      case "ema20":
      case "ema50":
      case "ema100":
      case "ema200":
      case "sma20":
      case "grahamNumber":
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

      await updateStockScreenerData();
    }
  }

  async function handleResetAll() {
    selectedPopularStrategy = "";
    resetTableSearch();
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
    await updateStockScreenerData();
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
          displayResults = [];
          currentPage = 1;
          totalPages = 1;
          displayResults = [];
        } else if (state === ruleName) {
          ruleName = "";
        }
      }

      await updateStockScreenerData();
    }
  }

  // Pagination functions
  function updatePaginatedData() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    // Use filteredData for paginated results
    const dataSource = inputValue?.length > 0 ? filteredData : filteredData;
    displayResults = dataSource?.slice(startIndex, endIndex) || [];
    totalPages = Math.ceil((dataSource?.length || 0) / rowsPerPage);
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedData();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1; // Reset to first page when changing rows per page
    updatePaginatedData();
    saveRowsPerPage(); // Save to localStorage
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Save rows per page preference to localStorage
  function saveRowsPerPage() {
    if (typeof localStorage === "undefined") return;

    try {
      const paginationKey = `/stock-screener_rowsPerPage`;
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
      const paginationKey = `/stock-screener_rowsPerPage`;
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
    // Load pagination preference
    loadRowsPerPage();

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

    if (!searchWorker) {
      const SearchWorker = await import(
        "$lib/workers/tableSearchWorker?worker"
      );
      searchWorker = new SearchWorker.default();
      searchWorker.onmessage = handleSearchMessage;
    }

    if (!data?.user) {
      LoginPopup = (await import("$lib/components/LoginPopup.svelte")).default;
    }

    shouldLoadWorker.subscribe(async (value) => {
      if (value) {
        isLoaded = false;
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
    searchWorker?.terminate();
    searchWorker = undefined;
    clearCache();

    // Clean up hover timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
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
        type: "stocksScreener",
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
      searchQuery = "";
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
    resetTableSearch();
    const strategies = {
      earningsVolatility: {
        name: "Earnings Volatility",
        rules: [
          {
            condition: "",
            name: "sma20",
            value: ["Price above SMA20"],
          },
          {
            condition: "",
            name: "sma100",
            value: ["Price above SMA100"],
          },
          {
            condition: "",
            name: "sma200",
            value: ["Price above SMA200"],
          },
          {
            condition: "over",
            name: "returnOnEquity",
            value: "20%",
          },
          {
            condition: "under",
            name: "debtToEquityRatio",
            value: 1,
          },
          {
            condition: "over",
            name: "avgVolume",
            value: "1M",
          },
          {
            condition: "",
            name: "earningsDate",
            value: ["Next 30D"],
          },
        ],
      },

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
          { condition: "", name: "payoutFrequency", value: "Monthly" },
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
      // If clicking the same strategy again, don't clear the rules
      if (selectedPopularStrategy === strategy.name) {
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
        handleChangeValue(row?.value);
      });

      await updateStockScreenerData();
    }
  }

  function handleInput(event) {
    const searchQuery = event.target.value?.toLowerCase() || "";

    setTimeout(() => {
      testList = [];

      if (searchQuery.length > 0) {
        const rawList =
          ruleName === "country"
            ? listOfRelevantCountries
            : ruleName === "sector"
              ? sectorList
              : ruleName === "industry"
                ? industryList
                : ["analystRating", "topAnalystRating", "score"]?.includes(
                      ruleName,
                    )
                  ? ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"]
                  : []; //["Compliant", "Non-Compliant"];
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

    // Reset to original data when 'none' and stop further sorting
    if (sortOrder === "none") {
      filteredData = [...currentUnsortedData]; // Reset to current unsorted data
      currentPage = 1; // Reset to first page
      updatePaginatedData();
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

    // Sort using the generic comparison function and update filteredData
    filteredData = [...currentUnsortedData].sort(compareValues);
    currentPage = 1; // Reset to first page after sorting
    updatePaginatedData();
  };

  let columns;
  let sortOrders;

  // Initial columns and sort orders for the "general" tab
  const generalColumns = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "name", label: "Name", align: "left" },
    { key: "marketCap", label: "Market Cap", align: "right" },
    { key: "price", label: "Price", align: "right" },
    { key: "changesPercentage", label: "% Change", align: "right" },
    { key: "volume", label: "Volume", align: "right" },
    { key: "priceToEarningsRatio", label: "PE Ratio", align: "right" },
  ];

  const generalSortOrders = {
    symbol: { order: "none", type: "string" },
    name: { order: "none", type: "string" },
    marketCap: { order: "none", type: "number" },
    changesPercentage: { order: "none", type: "number" },
    price: { order: "none", type: "number" },
    volume: { order: "none", type: "number" },
    priceToEarningsRatio: { order: "none", type: "number" },
  };

  const stringTypeRules = [
    "country",
    "industry",
    "score",
    "sector",
    "analystRating",
    "earningsTime",
    "earningsDate",
    "topAnalystRating",
    "halalStocks",
    "payoutFrequency",
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
          { key: "marketCap", label: "Market Cap", align: "right" },
        ],
        analysts: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "marketCap", label: "Market Cap", align: "right" },
        ],
        filters: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "marketCap", label: "Market Cap", align: "right" },
        ],
        dividends: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "marketCap", label: "Market Cap", align: "right" },
        ],
        financials: [
          { key: "symbol", label: "Symbol", align: "left" },
          { key: "name", label: "Name", align: "left" },
          { key: "marketCap", label: "Market Cap", align: "right" },
        ],
      };

      const baseSortOrdersMap = {
        performance: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          marketCap: { order: "none", type: "number" },
        },
        analysts: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          marketCap: { order: "none", type: "number" },
        },
        dividends: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          marketCap: { order: "none", type: "number" },
        },
        financials: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          marketCap: { order: "none", type: "number" },
        },
        filters: {
          symbol: { order: "none", type: "string" },
          name: { order: "none", type: "string" },
          marketCap: { order: "none", type: "number" },
        },
      };

      if (displayTableTab === "general") {
        columns = [...generalColumns];
        sortOrders = { ...generalSortOrders };
      } else {
        columns = [...(baseColumnsMap[displayTableTab] || [])];
        sortOrders = { ...(baseSortOrdersMap[displayTableTab] || {}) };

        const rulesList = [
          "performance",
          "analysts",
          "dividends",
          "financials",
        ]?.includes(displayTableTab)
          ? tabRuleList
          : displayRules;
        rulesList?.forEach((rule) => {
          if (rule.rule !== "marketCap") {
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

  let tabRuleList = [];

  async function changeTab(state) {
    displayTableTab = state;
    if (inputValue?.length > 0) {
      search();
    }

    // Clear hover timeout when actually switching tabs
    handleTabHoverLeave();

    // Check if we have preloaded data for this tab
    const preloaded = preloadedData.get(state);

    if (displayTableTab === "performance") {
      otherTabRules = [
        { name: "marketCap", value: "any" },
        { name: "change1W", value: "any" },
        { name: "change1M", value: "any" },
        { name: "change3M", value: "any" },
        { name: "change1Y", value: "any" },
      ];
      tabRuleList = otherTabRules
        ?.map((rule) => allRows.find((row) => row.rule === rule.name))
        ?.filter(Boolean);

      // Use preloaded data if available and fresh (within 5 minutes)
      if (preloaded && Date.now() - preloaded.timestamp < 300000) {
        handleScreenerMessage({ data: { stockScreenerData: preloaded.data } });
        return;
      }
      await updateStockScreenerData();
    } else if (displayTableTab === "analysts") {
      otherTabRules = [
        { name: "marketCap", value: "any" },
        { name: "analystRating", value: "any" },
        { name: "analystCounter", value: "any" },
        { name: "priceTarget", value: "any" },
        { name: "upside", value: "any" },
      ];
      tabRuleList = otherTabRules
        ?.map((rule) => allRows?.find((row) => row?.rule === rule?.name))
        ?.filter(Boolean);

      // Use preloaded data if available and fresh
      if (preloaded && Date.now() - preloaded.timestamp < 300000) {
        handleScreenerMessage({ data: { stockScreenerData: preloaded.data } });
        return;
      }
      await updateStockScreenerData();
    } else if (displayTableTab === "dividends") {
      otherTabRules = [
        { name: "marketCap", value: "any" },
        { name: "annualDividend", value: "any" },
        { name: "dividendYield", value: "any" },
        { name: "payoutRatio", value: "any" },
        { name: "dividendGrowth", value: "any" },
      ];
      tabRuleList = otherTabRules
        ?.map((rule) => allRows?.find((row) => row?.rule === rule?.name))
        ?.filter(Boolean);

      // Use preloaded data if available and fresh
      if (preloaded && Date.now() - preloaded.timestamp < 300000) {
        handleScreenerMessage({ data: { stockScreenerData: preloaded.data } });
        return;
      }
      await updateStockScreenerData();
    } else if (displayTableTab === "financials") {
      otherTabRules = [
        { name: "marketCap", value: "any" },
        { name: "revenue", value: "any" },
        { name: "operatingIncome", value: "any" },
        { name: "netIncome", value: "any" },
        { name: "freeCashFlow", value: "any" },
        { name: "eps", value: "any" },
      ];
      tabRuleList = otherTabRules
        ?.map((rule) => allRows?.find((row) => row?.rule === rule?.name))
        ?.filter(Boolean);

      // Use preloaded data if available and fresh
      if (preloaded && Date.now() - preloaded.timestamp < 300000) {
        handleScreenerMessage({ data: { stockScreenerData: preloaded.data } });
        return;
      }
      await updateStockScreenerData();
    }
  }
  /*
  async function handleMouseOver() {
    if (displayTableTab !== "performance") {
      hoverStatus = true;
      otherTabRules = [
        { name: "marketCap", value: "any" },
        { name: "change1W", value: "any" },
        { name: "change1M", value: "any" },
        { name: "change3M", value: "any" },
        { name: "change1Y", value: "any" },
      ];
      tabRuleList = otherTabRules
        ?.map((rule) => allRows.find((row) => row.rule === rule.name))
        ?.filter(Boolean);

      await updateStockScreenerData();
    } else if (displayTableTab !== "analysts") {
      hoverStatus = true;
      otherTabRules = [
        { name: "marketCap", value: "any" },
        { name: "analystRating", value: "any" },
        { name: "analystCounter", value: "any" },
        { name: "priceTarget", value: "any" },
        { name: "upside", value: "any" },
      ];
      tabRuleList = otherTabRules
        ?.map((rule) => allRows.find((row) => row.rule === rule.name))
        ?.filter(Boolean);

      await updateStockScreenerData();
    }
  }
  */
</script>

<SEO
  title="Advanced Stock Screener - Free Stock Filter & Analysis Tool"
  description="Powerful stock screener with {allRows?.length ||
    'advanced'} filtering criteria. Screen stocks by fundamentals, technicals, valuation metrics, and performance indicators. Real-time data updated every minute for optimal stock discovery and analysis."
  keywords="stock screener, free stock screener, stock filter, stock scanner, fundamental screener, technical screener, value stocks screener, growth stocks screener, dividend stocks screener, stock analysis tool"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Stock Screener Tool",
    description:
      "Advanced stock screening and filtering platform with real-time market data",
    url: "https://stocknear.com/stock-screener",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Multi-criteria stock filtering",
      "Fundamental analysis screening",
      "Technical indicator filters",
      "Valuation metrics screening",
      "Real-time data updates",
      "Custom screening strategies",
      "Performance analytics",
      "Export capabilities",
    ],
    softwareRequirements: "Web Browser",
    provider: {
      "@type": "Organization",
      name: "Stocknear",
    },
  }}
/>

<!-- Removed scroll handler, using pagination instead -->

<section
  class="w-full max-w-3xl sm:max-w-(--breakpoint-xl) overflow-hidden min-h-screen pb-40 px-5"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li><span class="text-muted dark:text-gray-300">Stock Screener</span></li>
    </ul>
  </div>

  <!--Start Build Strategy-->
  <div class="sm:rounded">
    <div class="flex flex-col md:flex-row items-start md:items-center mb-5">
      <div class="w-full flex flex-row items-center sm:mt-4">
        <h1 class=" text-3xl font-semibold">Stock Screener</h1>
        <span class="inline-block text-xs sm:text-sm font-semibold ml-2 mt-3">
          {filteredData?.length?.toLocaleString("en-US")} Matches Found
        </span>
      </div>

      <div class="flex flex-row items-center w-full mt-5">
        <div class="flex w-full sm:w-[50%] md:block md:w-auto sm:ml-auto">
          <div
            class="hidden text-sm sm:text-[1rem] font-semibold md:block sm:mb-1"
          >
            Popular Screens
          </div>
          <div class="relative inline-block text-left grow">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="w-full  border-gray-300 dark:border-gray-600 border text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                >
                  <span class="truncate"
                    >{selectedPopularStrategy?.length !== 0
                      ? selectedPopularStrategy
                      : "Select popular"}</span
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
                class="w-56 h-fit max-h-72 overflow-y-auto scroller"
              >
                <DropdownMenu.Label
                  class="text-muted dark:text-gray-400 font-normal"
                >
                  Popular Strategies
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Group>
                  {#each popularStrategyList as item}
                    <DropdownMenu.Item
                      on:click={() => popularStrategy(item?.key)}
                      class="cursor-pointer sm:hover:bg-gray-100 dark:sm:hover:bg-primary"
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
            class="hidden text-sm sm:text-[1rem] font-semibold md:block sm:mb-1"
          >
            Saved Screens
          </div>
          <div class="relative inline-block text-left grow">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="min-w-[110px]  w-full border-gray-300 dark:border-gray-600 border text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out flex flex-row justify-between items-center px-3 py-2  rounded truncate"
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
                side="bottom"
                align="end"
                sideOffset={10}
                alignOffset={0}
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
                      class="p-0 -mb-2 -mt-2 text-sm inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap bg-[#0909B] focus:outline-hidden "
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
                        ? 'bg-gray-100 dark:bg-primary'
                        : ''} cursor-pointer sm:hover:bg-gray-100 dark:sm:hover:bg-primary"
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
        <div class="mt-3 flex flex-col gap-y-2.5 lg:flex-row lg:gap-y-2">
          <label
            for="ruleModal"
            class="text-[0.95rem] order-2 lg:order-0 text-white inline-flex cursor-pointer items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold bg-black text-white dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden"
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
                    {#if onlySubscriberRules?.includes(result?.rule) && !["Plus", "Pro"]?.includes(data?.user?.tier)}
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

          {#if data?.user}
            <label
              for={!data?.user ? "userLogin" : ""}
              on:click={() => handleSave(true)}
              class="text-[0.95rem] lg:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold text-white bg-black sm:hover:bg-default dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden"
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
                class="text-[0.95rem] lg:ml-3 cursor-pointer inline-flex items-center justify-center space-x-1 whitespace-nowrap rounded border border-gray-300 dark:border-none bg-blue-brand_light py-2 pl-3 pr-4 font-semibold text-white bg-black sm:hover:bg-default dark:bg-[#000] dark:sm:hover:bg-default/60 ease-out focus:outline-hidden"
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
              class="flex items-center justify-between space-x-2 px-1 py-1.5 text-sm sm:text-[0.95rem] leading-tight"
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
                          class="border-gray-300 dark:border-none  text-white bg-[#000] h-[35px] flex flex-row justify-between items-center w-[140px] xs:w-[130px] sm:w-[140px] px-3  rounded truncate"
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
                                'analystRating',
                                'topAnalystRating',
                                'halalStocks',
                                'score',
                                'sector',
                                'industry',
                                'country',
                              ]?.includes(row?.rule)
                                ? 'hidden'
                                : ''} text-sm p-2 absolute fixed sticky w-full border-0 bg-white dark:bg-default border-b border-gray-200 dark:border-gray-600
                                      focus:outline-none placeholder:text-gray-500 dark:placeholder:text-gray-300"
                              placeholder="Search..."
                            />
                          </div>
                        {/if}
                        <DropdownMenu.Group class="min-h-10 mt-2">
                          {#if !checkedRules?.includes(row?.rule)}
                            {#each row?.step as newValue, index}
                              {#if ruleCondition[row?.rule] === "between"}
                                {#if newValue && row?.step[index + 1]}
                                  <DropdownMenu.Item
                                    class="sm:hover:bg-gray-100 dark:sm:hover:bg-primary"
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
                                  class="sm:hover:bg-gray-100 dark:sm:hover:bg-primary"
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
                                class="sm:hover:bg-gray-100 dark:sm:hover:bg-primary"
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
                            {#each testList.length > 0 && searchQuery?.length > 0 ? testList : searchQuery?.length > 0 && testList?.length === 0 ? [] : row?.rule === "country" ? listOfRelevantCountries : row?.rule === "sector" ? sectorList : row?.rule === "industry" ? industryList : ["analystRating", "topAnalystRating", "score"]?.includes(ruleName) ? ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"] : [] as item}
                              <DropdownMenu.Item
                                class="sm:hover:bg-gray-100 dark:sm:hover:bg-primary"
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
      class=" whitespace-nowrap text-xl font-semibold py-1 bp:text-[1.3rem] border-t border-gray-300 dark:border-gray-800"
    >
      {filteredData?.length?.toLocaleString("en-US")} Stocks
    </h2>
    <div
      class="col-span-2 flex flex-col lg:flex-row items-center lg:order-2 lg:grow py-1.5 border-t border-b border-gray-300 dark:border-gray-800"
    >
      <div
        class="w-full flex flex-row lg:flex order-1 items-center ml-auto border-b border-gray-300 dark:border-gray-800 lg:border-none pb-2 sm:pt-0 lg:pb-0 w-full order-0 lg:order-1"
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
            placeholder="Find..."
            class=" py-[7px] text-[0.85rem] sm:text-sm border bg-white dark:bg-default shadow focus:outline-hidden border border-gray-300 dark:border-gray-600 rounded placeholder:text-gray-800 dark:placeholder:text-gray-300 px-3 focus:outline-none focus:ring-0 dark:focus:border-gray-800 grow w-full sm:min-w-56 lg:max-w-14"
          />
        </div>

        <div class=" ml-2">
          <DownloadData
            {data}
            rawData={filteredData}
            title={"stock_screener_data"}
          />
        </div>
      </div>
      <nav class="w-full flex flex-row items-center order-2 lg:order-0">
        <ul
          class="flex flex-row overflow-x-auto items-center space-x-2 whitespace-nowrap"
        >
          <li>
            <button
              on:click={() => (displayTableTab = "general")}
              class="cursor-pointer text-[1rem] block rounded px-2 py-0.5 focus:outline-hidden sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'general'
                ? 'font-semibold bg-gray-100 text-muted dark:text-white dark:bg-primary'
                : ''}"
            >
              General
            </button>
          </li>
          <li>
            <button
              on:click={() => (displayTableTab = "filters")}
              class="cursor-pointer text-[1rem] flex flex-row items-center relative block rounded px-2 py-1 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'filters'
                ? 'font-semibold bg-gray-100 text-muted dark:text-white dark:bg-primary'
                : ''} focus:outline-hidden"
            >
              <span class="">Filters</span>
              <span
                class="ml-2 rounded-full avatar w-5 h-5 text-xs font-semibold text-center shrink-0 flex items-center justify-center {ruleOfList?.length !==
                0
                  ? 'text-white bg-red-500'
                  : 'text-black dark:text-white bg-gray-200 dark:bg-gray-600'}"
              >
                {ruleOfList?.length}
              </span>
            </button>
          </li>
          <li>
            <button
              on:click={() => changeTab("performance")}
              on:mouseenter={() => handleTabHover("performance")}
              on:mouseleave={handleTabHoverLeave}
              class="cursor-pointer text-[1rem] block rounded px-2 py-0.5 focus:outline-hidden sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'performance'
                ? 'font-semibold bg-gray-100 text-muted dark:text-white dark:bg-primary'
                : ''}"
            >
              Performance
            </button>
          </li>
          <li>
            <button
              on:click={() => changeTab("analysts")}
              on:mouseenter={() => handleTabHover("analysts")}
              on:mouseleave={handleTabHoverLeave}
              class="cursor-pointer text-[1rem] block rounded px-2 py-0.5 focus:outline-hidden sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'analysts'
                ? 'font-semibold bg-gray-100 text-muted dark:text-white dark:bg-primary'
                : ''}"
            >
              Analysts
            </button>
          </li>
          <li>
            <button
              on:click={() => changeTab("dividends")}
              on:mouseenter={() => handleTabHover("dividends")}
              on:mouseleave={handleTabHoverLeave}
              class="cursor-pointer text-[1rem] block rounded px-2 py-0.5 focus:outline-hidden sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'dividends'
                ? 'font-semibold bg-gray-100 text-muted dark:text-white dark:bg-primary'
                : ''}"
            >
              Dividends
            </button>
          </li>
          <li>
            <button
              on:click={() => changeTab("financials")}
              on:mouseenter={() => handleTabHover("financials")}
              on:mouseleave={handleTabHoverLeave}
              class="cursor-pointer text-[1rem] block rounded px-2 py-0.5 focus:outline-hidden sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-gray-100 dark:sm:hover:bg-primary {displayTableTab ===
              'financials'
                ? 'font-semibold bg-gray-100 text-muted dark:text-white dark:bg-primary'
                : ''}"
            >
              Financials
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>

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
                      href={"/stocks/" + item?.symbol}
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
                    {item?.marketCap < 100
                      ? "< 100"
                      : abbreviateNumber(item?.marketCap)}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.price < 0.01 ? "< 0.01" : item?.price?.toFixed(2)}
                  </td>

                  <td class=" text-end text-sm sm:text-[1rem]">
                    {#if item?.changesPercentage >= 0}
                      <span class="text-green-800 dark:text-[#00FC50]"
                        >+{item?.changesPercentage >= 1000
                          ? abbreviateNumber(item?.changesPercentage)
                          : item?.changesPercentage?.toFixed(2)}%</span
                      >
                    {:else}
                      <span class="text-red-800 dark:text-[#FF2F1F]"
                        >{item?.changesPercentage <= -1000
                          ? abbreviateNumber(item?.changesPercentage)
                          : item?.changesPercentage?.toFixed(2)}%
                      </span>
                    {/if}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.volume ? abbreviateNumber(item?.volume) : "n/a"}
                  </td>

                  <td class=" text-sm sm:text-[1rem] text-end">
                    {item?.priceToEarningsRatio ?? "n/a"}
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
              {#each displayResults as item (item?.symbol)}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                >
                  <td class=" whitespace-nowrap">
                    <a
                      href={"/stocks/" + item?.symbol}
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
                    {abbreviateNumber(item?.marketCap)}
                  </td>
                  {#each displayRules as row (row?.rule)}
                    {#if row?.rule !== "marketCap"}
                      <td
                        class="whitespace-nowrap text-sm sm:text-[1rem] text-end"
                      >
                        {#if ["earningsTime", "halalStocks", "sector", "industry", "country", "payoutFrequency"]?.includes(row?.rule)}
                          {item[row?.rule]
                            ?.replace("After Market Close", "After Close")
                            ?.replace("Before Market Open", "Before Open")}
                        {:else if row?.varType && row?.varType === "date"}
                          {new Date(item[row?.rule]).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            },
                          )}
                        {:else if row?.varType && row?.varType === "percentSign"}
                          <span
                            class={item[row?.rule] >= 0
                              ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                              : "text-red-800 dark:text-[#FF2F1F]"}
                          >
                            {abbreviateNumber(item[row?.rule])}%
                          </span>
                        {:else if row?.varType && row?.varType === "percent"}
                          {abbreviateNumber(item[row?.rule])}%
                        {:else if ["score", "analystRating", "topAnalystRating"]?.includes(row?.rule)}
                          {#if ["Strong Buy", "Buy"].includes(item[row?.rule])}
                            <span class=" text-green-800 dark:text-[#00FC50]"
                              >{item[row?.rule]}</span
                            >
                          {:else if ["Strong Sell", "Sell"].includes(item[row?.rule])}
                            <span class=" text-red-800 dark:text-[#FF2F1F]"
                              >{item[row?.rule]}</span
                            >
                          {:else if item[row?.rule] === "Hold"}
                            <span class=" text-orange-800 dark:text-[#FFA838]"
                              >{item[row?.rule]}</span
                            >
                          {:else}
                            -
                          {/if}
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
      {:else if displayTableTab === "performance"}
        <div class="w-full rounded overflow-x-auto">
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
          >
            <thead>
              <TableHeader {columns} {sortOrders} {sortData} />
            </thead>
            <tbody>
              {#each displayResults as item (item?.symbol)}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                >
                  <td class=" whitespace-nowrap">
                    <a
                      href={"/stocks/" + item?.symbol}
                      class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem]"
                      >{item?.symbol}</a
                    >
                  </td>
                  <td class="whitespace-nowrap text-[1rem]">
                    {item?.name?.length > charNumber
                      ? item?.name?.slice(0, charNumber) + "..."
                      : item?.name}
                  </td>

                  {#each tabRuleList as row (row?.rule)}
                    <td
                      class="whitespace-nowrap text-sm sm:text-[1rem] text-end"
                    >
                      {#if row?.rule === "marketCap"}
                        {abbreviateNumber(item[row?.rule])}
                      {:else if item[row?.rule] > 0}
                        <span class="text-green-800 dark:text-[#00FC50]"
                          >+{abbreviateNumber(
                            item[row?.rule]?.toFixed(2),
                          )}%</span
                        >
                      {:else if item[row?.rule] < 0}
                        <span class="text-red-800 dark:text-[#FF2F1F]"
                          >{abbreviateNumber(
                            item[row?.rule]?.toFixed(2),
                          )}%</span
                        >
                      {:else}
                        <span class="">n/a</span>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if displayTableTab === "analysts"}
        <div class="w-full rounded overflow-x-auto">
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
          >
            <thead>
              <TableHeader {columns} {sortOrders} {sortData} />
            </thead>
            <tbody>
              {#each displayResults as item (item?.symbol)}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                >
                  <td class=" whitespace-nowrap">
                    <a
                      href={"/stocks/" + item?.symbol}
                      class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem]"
                      >{item?.symbol}</a
                    >
                  </td>
                  <td class="whitespace-nowrap text-[1rem]">
                    {item?.name?.length > charNumber
                      ? item?.name?.slice(0, charNumber) + "..."
                      : item?.name}
                  </td>

                  {#each tabRuleList as row (row?.rule)}
                    <td
                      class="whitespace-nowrap text-sm sm:text-[1rem] text-end"
                    >
                      {#if row?.rule === "marketCap"}
                        {abbreviateNumber(item[row?.rule])}
                      {:else if ["analystCounter", "priceTarget"]?.includes(row?.rule)}
                        <span class=""
                          >{item[row?.rule]
                            ? abbreviateNumber(item[row?.rule])
                            : "n/a"}</span
                        >
                      {:else if row?.rule === "upside"}
                        {#if item[row?.rule] > 0}
                          <span class="text-green-800 dark:text-[#00FC50]"
                            >+{item[row?.rule]?.toFixed(2)}%</span
                          >
                        {:else if item[row?.rule] < 0}
                          <span class="text-red-800 dark:text-[#FF2F1F]"
                            >{item[row?.rule]?.toFixed(2)}%</span
                          >
                        {:else}
                          <span class="">n/a</span>
                        {/if}
                      {:else if ["analystRating", "topAnalystRating"]?.includes(row?.rule)}
                        {#if ["Strong Buy", "Buy"].includes(item[row?.rule])}
                          <span class=" text-green-800 dark:text-[#00FC50]"
                            >{item[row?.rule]}</span
                          >
                        {:else if ["Strong Sell", "Sell"].includes(item[row?.rule])}
                          <span class=" text-red-800 dark:text-[#FF2F1F]"
                            >{item[row?.rule]}</span
                          >
                        {:else if item[row?.rule] === "Hold"}
                          <span class=" text-orange-800 dark:text-[#FFA838]"
                            >{item[row?.rule]}</span
                          >
                        {:else}
                          n/a
                        {/if}
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if ["dividends", "financials"]?.includes(displayTableTab)}
        <div class="w-full rounded overflow-x-auto">
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
          >
            <thead>
              <TableHeader {columns} {sortOrders} {sortData} />
            </thead>
            <tbody>
              {#each displayResults as item (item?.symbol)}
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                >
                  <td class=" whitespace-nowrap">
                    <a
                      href={"/stocks/" + item?.symbol}
                      class="text-blue-800 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem]"
                      >{item?.symbol}</a
                    >
                  </td>
                  <td class="whitespace-nowrap text-[1rem]">
                    {item?.name?.length > charNumber
                      ? item?.name?.slice(0, charNumber) + "..."
                      : item?.name}
                  </td>

                  {#each tabRuleList as row (row?.rule)}
                    <td
                      class="whitespace-nowrap text-sm sm:text-[1rem] text-end"
                    >
                      {#if row?.rule === "marketCap"}
                        {abbreviateNumber(item[row?.rule])}
                      {:else if row?.varType && row?.varType === "percent"}
                        {item[row?.rule]
                          ? abbreviateNumber(item[row?.rule]) + "%"
                          : "n/a"}
                      {:else}
                        {item[row?.rule]
                          ? abbreviateNumber(item[row?.rule])
                          : "n/a"}
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- Pagination controls -->
      {#if displayResults?.length > 0}
        <div class="flex flex-row items-center justify-between mt-8 sm:mt-5">
          <!-- Previous and Next buttons -->
          <div class="flex items-center gap-2">
            <Button
              on:click={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
              </svg> <span class="hidden sm:inline">Previous</span></Button
            >
          </div>

          <!-- Page info and rows selector in center -->
          <div class="flex flex-row items-center gap-4">
            <span class="text-sm sm:text-[1rem]">
              Page {currentPage} of {totalPages}
            </span>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild let:builder>
                <Button
                  builders={[builder]}
                  class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center sm:w-auto px-2 sm:px-3 rounded truncate"
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
                class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative"
              >
                <!-- Dropdown items -->
                <DropdownMenu.Group class="pb-2">
                  {#each rowsPerPageOptions as item}
                    <DropdownMenu.Item
                      class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
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

          <!-- Next button and Back to Top -->
          <div class="flex items-center gap-2">
            <Button
              on:click={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="w-fit transition-all flex flex-row items-center duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary flex flex-row justify-between items-center sm:w-auto px-1.5 sm:px-3 rounded truncate"
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
            class="cursor-pointer sm:hover:text-muted text-blue-800 dark:sm:hover:text-white dark:text-blue-400 text-sm sm:text-[1rem] font-medium"
          >
            Back to Top <svg
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
      <Infobox text="No Stocks found." />
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
                {#if onlySubscriberRules?.includes(row?.rule) && !["Pro", "Plus"]?.includes(data?.user?.tier)}
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
                    class="h-[18px] w-[18px] rounded-sm ring-offset-0 lg:h-4 lg:w-4"
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
        class="cursor-pointer mt-2 py-2.5 bg-black dark:bg-[#fff] dark:sm:hover:bg-gray-100 duration-100 w-full rounded m-auto text-white dark:text-black font-semibold text-md"
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

<input type="checkbox" id="mobileTooltip" class="modal-toggle" />

<dialog id="mobileTooltip" class="modal p-3">
  <label for="mobileTooltip" class="cursor-pointer modal-backdrop"></label>

  <!-- Desktop modal content -->
  <div
    class="modal-box rounded border border-gray-300 dark:border-gray-600 w-full bg-white dark:bg-secondary flex flex-col items-center"
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

    <div class="border-t border-gray-300 dark:border-gray-600 mt-2 w-full">
      <label
        for="mobileTooltip"
        class="cursor-pointer mt-4 font-semibold text-xl m-auto flex justify-center"
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
