<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import SEO from "$lib/components/SEO.svelte";
  import { onMount, onDestroy } from "svelte";
  import { abbreviateNumber, buildOptionSymbol } from "$lib/utils";
  import { setCache, getCache, screenWidth } from "$lib/store";
  import { Combobox } from "bits-ui";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Link from "lucide-svelte/icons/square-arrow-out-up-right";
  import Trash from "lucide-svelte/icons/trash";
  import { toast } from "svelte-sonner";

  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";

  export let data;

  let isPro = data?.user?.tier === "Pro" ? true : false;
  // State variables with proper types
  let isLoaded = false;
  let shouldUpdate = false;
  let config: any = null;
  let downloadWorker: Worker | undefined;
  let plotWorker: Worker | undefined;
  let strategyWorker: Worker | undefined;

  // Strategy selection
  let selectedStrategy = "Long Call";
  let selectedOptionType = "Call";
  let selectedTicker = "TSLA";
  let assetType = "stocks";
  let selectedAction = "Buy";
  let selectedOptionPrice: number;
  let selectedQuantity = 1;
  let debounceTimeout: ReturnType<typeof setTimeout>;

  // Market data
  let currentStockPrice: number;
  let optionData: Record<string, any> = {};
  let dateList: string[] = [];
  let selectedDate: string;
  let strikeList: number[] = [];
  let selectedStrike: number;

  // Option information
  let optionSymbol: string;
  let breakEvenPrice: number | null = null;
  let totalPremium: number;
  let metrics: Record<string, string> = {};
  let rawData: Record<string, any> = {};
  let probabilities: { pop: number; popMaxProfit: number; popMaxLoss: number } =
    {
      pop: 0,
      popMaxProfit: 0,
      popMaxLoss: 0,
    };
  let riskRewardMetrics: {
    expectedValue: number;
    expectedReturn: number | null;
    rewardRisk: number | null;
  } = {
    expectedValue: 0,
    expectedReturn: null,
    rewardRisk: null,
  };
  let positionGreeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  } = {
    delta: 0,
    gamma: 0,
    theta: 0,
    vega: 0,
  };

  // Search variables
  let searchBarData = [];
  let timeoutId: ReturnType<typeof setTimeout>;
  let inputValue = "";
  let touchedInput = false;

  // Strategy definitions
  const prebuiltStrategy = [
    {
      name: "Long Call",
      sentiment: "Bullish",
      description:
        "In a long call strategy, an investor buys a call option, anticipating that the price of the underlying asset will increase and generate a profit from the option's higher value. Investors typically use a long call strategy when they have a bullish outlook on the stock.",
    },
    {
      name: "Long Put",
      sentiment: "Bearish",
      description:
        "In a long put strategy, an investor purchases a put option, expecting that the price of the underlying asset will decrease and generate a profit from the option's increased value. Investors typically use a long put strategy when they have a bearish outlook on the stock.",
    },
    {
      name: "Short Call",
      sentiment: "Bearish",
      description:
        "In this strategy, an investor sells a call option, anticipating that the price of the underlying asset will remain stable or decrease, allowing the investor to keep the premium received from selling the option. Investors typically use a short call strategy when they have a neutral to bearish outlook on the stock and to generate potential income.",
    },
    {
      name: "Short Put",
      sentiment: "Bullish",
      description:
        "In this strategy, an investor sells a put option, expecting that the price of the underlying asset will remain stable or increase, allowing the investor to keep the premium received from selling the option. Investors typically use a short put strategy when they have a neutral to bullish outlook on the stock and and views a potential assignment as an opportunity to buy the asset at a desirable price.",
    },
    {
      name: "Cash Secured Put",
      sentiment: "Bullish",
      description:
        "In this strategy, an investor sells a put option and simultaneously sets aside enough cash to buy the stock. The goal is to be assigned the stock at a desirable price and generate income from the option premium. Investors typically use a cash secured put strategy when they have a neutral to bullish outlook on the stock and view a potential assignment as an opportunity to buy the asset at a desirable price.",
    },
    {
      name: "Bull Call Spread",
      sentiment: "Bullish",
      description:
        "In this strategy, an investor simultaneously purchases call options at a specific strike price and sells the same number of calls at a higher strike price. Both call options have the same expiration date. This strategy is used when the investor is bullish and expects a moderate rise in the price of the underlying asset. The investor limits their upside profit potential but reduces the net premium spent compared to buying a single call option outright. The strategy is also known as a 'debit call spread' because the investor pays a net debit to establish the position.",
    },
    {
      name: "Bull Put Spread",
      sentiment: "Bullish",
      description:
        "In this strategy, an investor simultaneously sells put options at a specific strike price and purchases the same number of puts at a lower strike price. Both put options have the same expiration date. This strategy is used when the investor is bullish and expects the price of the underlying asset to remain above the higher strike price at expiration. The investor limits their profit potential but also limits their risk compared to selling puts outright. The strategy is also known as a 'credit put spread' because the investor receives a net credit for establishing the position.",
    },
    {
      name: "Bear Call Spread",
      sentiment: "Bearish",
      description:
        "A bear call spread consists of one short call with a lower strike price and one long call with a higher strike price. This strategy is used when the investor is bearish. The investor limits their downside risk but reduces the net premium spent compared to buying a single put option outright.",
    },
    {
      name: "Bear Put Spread",
      sentiment: "Bearish",
      description:
        "A bear put spread consists of one long put with a higher strike price and one short put with a lower strike price. This strategy is used when the investor is bearish and expects a moderate decline in the price of the underlying asset. The investor limits their downside risk but reduces the net premium spent compared to buying a single put option outright.",
    },
    {
      name: "Long Straddle",
      sentiment: "Neutral",
      description:
        "A long straddle is a volatility strategy which consists of one long call and one long put of the same strike and expiration. This strategy is used when the investor is unsure of the direction of the underlying asset's price, but expects a significant move. The goal of a long straddle is to profit from a very strong move in either direction.",
    },
    {
      name: "Short Straddle",
      sentiment: "Neutral",
      description:
        "A short straddle is a volatility strategy which consists of one short call and one short put of the same strike and expiration. This strategy is used when the investor believes there will be little or no price movement in the underlying asset's price.",
    },
    {
      name: "Long Call Butterfly",
      sentiment: "Neutral",
      description:
        "A long call butterfly is an options strategy that is created by purchasing a call option at a lower strike price, selling two call options at a middle strike price, and purchasing another call option at a higher strike price, all with the same expiration date. This strategy is used when an investor believes that the underlying asset will stay within a certain price range until the options expire.",
    },
  ];

  let userStrategy = [];
  let description = prebuiltStrategy[0]?.description;

  const handleDownloadMessage = async (event) => {
    rawData = event?.data?.output;

    currentStockPrice = rawData?.getStockQuote?.price || 0;
    await loadData();
  };

  const handlePlotMessage = async (event) => {
    const output = event?.data?.output;
    metrics = output?.metrics;
    config = output?.options;
    breakEvenPrice = output?.breakEvenPrice;
    totalPremium = output?.totalPremium;
    probabilities = output?.probabilities || {
      pop: 0,
      popMaxProfit: 0,
      popMaxLoss: 0,
    };
    riskRewardMetrics = output?.riskRewardMetrics || {
      expectedValue: 0,
      expectedReturn: null,
      rewardRisk: null,
    };
    positionGreeks = output?.positionGreeks || {
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
    };

    const xMax = output?.xMax;
    const xMin = output?.xMin;
    const dataPoints = output?.dataPoints;

    config = {
      credits: { enabled: false },
      chart: {
        type: "area",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 400,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-1"></h3>`,
        useHTML: true,
      },
      xAxis: {
        min: xMin,
        max: xMax,
        tickInterval: 50,
        title: {
          text: `${selectedTicker} Price at Expiration ($)`,
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        labels: { style: { color: $mode === "light" ? "#545454" : "white" } },
        plotLines: [
          // Underlying Price line
          {
            value: currentStockPrice,
            color: $mode === "light" ? "black" : "white",
            dashStyle: "Dash",
            width: 1.5,
            label: {
              text: `<span class="text-black dark:text-white text-sm">Underlying Price $${currentStockPrice}</span>`,
              style: { color: $mode === "light" ? "black" : "white" },
            },
            zIndex: 5,
          },
          // Only add a breakeven line if there is a single leg
          breakEvenPrice !== null
            ? {
                value: breakEvenPrice,
                color: "#10B981",
                dashStyle: "Dash",
                width: $screenWidth < 640 ? 0 : 1.5,
                label: {
                  text: `<span class="hidden sm:block text-black dark:text-white text-sm">Breakeven $${
                    typeof breakEvenPrice === "number"
                      ? breakEvenPrice?.toFixed(2)
                      : ""
                  }</span>`,
                  style: { color: $mode === "light" ? "black" : "white" },
                },
                zIndex: 5,
              }
            : null,
        ]?.filter((line) => line !== null),
      },
      yAxis: {
        title: {
          text: "<span class='hidden sm:block'>Expected Profit/Loss ($)</span>",
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          formatter: function () {
            return abbreviateNumber(this.value.toFixed(2));
          },
        },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: { color: "#fff", fontSize: "16px", padding: "10px" },
        borderRadius: 2,
        formatter: function () {
          const underlyingPrice = this.x;
          const profitLoss = this.y;
          const underlyingPctChange =
            ((underlyingPrice - currentStockPrice) / currentStockPrice) * 100;
          const profitLossPctChange =
            totalPremium !== 0 ? (profitLoss / totalPremium) * 100 : 0;
          return `
          <div class="flex flex-col items-start text-sm">
            <div>
              <span class="text-start font-semibold">Underlying Price:</span> 
              $${underlyingPrice} 
              (<span>${underlyingPctChange.toFixed(2)}%</span>)
            </div>
            <div class="">
              <span class="text-start font-semibold">Profit or Loss:</span> 
              ${profitLoss < 0 ? "-$" : "$"}${Math.abs(profitLoss).toLocaleString("en-US")} 
              (<span>${profitLossPctChange.toFixed(2)}%</span>)
            </div>
          </div>
        `;
        },
      },
      plotOptions: {
        area: {
          fillOpacity: 0.2,
          marker: { enabled: false },
          animation: false,
        },
        series: {
          zoneAxis: "y",
          zones: [
            {
              value: 0,
              color: "#E02424",
              fillColor: "rgba(224,36,36,0.5)",
            },
            {
              color: "#10B981",
              fillColor: "rgba(16,185,129,0.5)",
            },
          ],
        },
      },
      legend: { enabled: false },
      series: [
        {
          name: "Payoff",
          data: dataPoints,
        },
      ],
    };
  };

  const handleStrategyMessage = async (event) => {
    userStrategy = event?.data?.output;

    userStrategy = [...userStrategy];
    await loadData();
    shouldUpdate = true;
  };

  async function changeStrategy(strategy) {
    selectedStrategy = strategy?.name;
    description = strategy?.description;

    strategyWorker.postMessage({
      userStrategy,
      strikeList,
      selectedStrategy,
      selectedAction,
      selectedDate,
      selectedOptionPrice,
      selectedOptionType,
      selectedQuantity,
      selectedStrike,
    });
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  function plotData() {
    // Determine x-axis range based on current stock price and max leg strike
    if (!userStrategy || userStrategy.length === 0) {
      return null;
    }
    try {
      // Get the expiration date from the first leg (or use a default)
      const expirationDate = userStrategy[0]?.date || selectedDate;
      plotWorker.postMessage({
        userStrategy: userStrategy,
        currentStockPrice: currentStockPrice,
        expirationDate: expirationDate,
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }

  const getContractHistory = async (contractId: string) => {
    const cacheKey = contractId;
    const cachedData = getCache(cacheKey, "getContractHistory");

    if (cachedData) {
      return cachedData;
    }

    try {
      const postData = {
        ticker: selectedTicker,
        contract: contractId,
      };

      const response = await fetch("/api/options-contract-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch contract history: ${response.statusText}`,
        );
      }

      const output = await response.json();
      setCache(cacheKey, output, "getContractHistory");
      return output;
    } catch (error) {
      console.error("Error fetching contract history:", error);
      return { history: [{ mark: 0 }] };
    }
  };

  async function loadData() {
    if (!rawData?.getData) {
      console.error("rawData is undefined or invalid in loadData");
      return;
    }

    try {
      if (userStrategy?.length > 0) {
        for (const item of userStrategy) {
          optionData = rawData?.getData[item?.optionType] || {};
          selectedOptionType = item?.optionType || "Call";
          selectedQuantity = item?.quantity || 1;
          dateList = Object.keys(optionData);
          item.dateList = dateList;

          // Make sure selectedDate exists in the data
          if (!dateList.includes(item?.date) && dateList.length > 0) {
            selectedDate = dateList[0];
            item.date = selectedDate;
          }

          strikeList = optionData[item.date] || [];
          item.strikeList = strikeList;

          // Find closest strike to current stock price
          if (
            !item.strikeList?.includes(item?.strike) &&
            item.strikeList?.length > 0
          ) {
            selectedStrike = item?.strikeList?.reduce((closest, strike) => {
              return Math.abs(strike - currentStockPrice) <
                Math.abs(closest - currentStockPrice)
                ? strike
                : closest;
            }, item.strikeList[0]);
            item.strike = selectedStrike;
          }

          // Get option price
          optionSymbol = buildOptionSymbol(
            selectedTicker,
            item?.date,
            item?.optionType,
            item?.strike,
          );

          const output = await getContractHistory(optionSymbol);

          selectedOptionPrice = output?.history?.at(-1)?.mark
            ? output?.history?.at(-1)?.mark
            : output?.history?.at(-1)?.close || 0;
          item.optionPrice = selectedOptionPrice;
          item.optionSymbol = optionSymbol;
          item.optionType = selectedOptionType;
        }
      } else {
        optionData = rawData?.getData[selectedOptionType] || {};
        dateList = Object.keys(optionData);

        // Make sure selectedDate exists in the data
        if (!dateList.includes(selectedDate) && dateList.length > 0) {
          selectedDate = dateList[0];
        }

        strikeList = optionData[selectedDate] || [];

        // Find closest strike to current stock price
        if (!strikeList.includes(selectedStrike) && strikeList.length > 0) {
          selectedStrike = strikeList.reduce((closest, strike) => {
            return Math.abs(strike - currentStockPrice) <
              Math.abs(closest - currentStockPrice)
              ? strike
              : closest;
          }, strikeList[0]);
        }

        // Get option price
        optionSymbol = buildOptionSymbol(
          selectedTicker,
          selectedDate,
          selectedOptionType,
          selectedStrike,
        );

        const output = await getContractHistory(optionSymbol);
        selectedOptionPrice = output?.history?.at(-1)?.mark
          ? output?.history?.at(-1)?.mark
          : output?.history?.at(-1)?.close || 0;

        // Update user strategy if necessary
        userStrategy = [
          {
            date: selectedDate,
            strike: selectedStrike,
            optionType: selectedOptionType,
            optionPrice: selectedOptionPrice,
            action: selectedAction,
            quantity: selectedQuantity,
            strikeList: strikeList,
            dateList: dateList,
            optionSymbol: optionSymbol,
          },
        ];
      }
      shouldUpdate = true;
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function getStockData() {
    try {
      downloadWorker.postMessage({
        ticker: selectedTicker,
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }

  async function handleAddOptionLeg() {
    if (userStrategy?.length >= 5) {
      toast.error("You've reached the maximum number of option legs.", {
        style: `border-radius: 5px; background: #fff; color: #000; border: 1px solid ${$mode === "light" ? "#F3F4F6" : "#4B5563"}; font-size: 15px; padding: 10px;`,
      });

      return;
    }

    if (userStrategy.length === 0) {
      userStrategy = [
        {
          action: selectedAction,
          quantity: selectedQuantity,
          date: selectedDate,
          strike: selectedStrike,
          optionType: selectedOptionType,
          optionPrice: selectedOptionPrice,
        },
      ];
    } else {
      const lastLeg = userStrategy[userStrategy.length - 1];
      const newLeg = { ...lastLeg }; // Create a shallow copy
      userStrategy = [...userStrategy, newLeg];
    }
    await loadData();
    shouldUpdate = true;
  }

  function handleDeleteOptionLeg(index) {
    if (userStrategy?.length === 1) {
      toast.error("At least one option leg is required!", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } else {
      userStrategy = [
        ...userStrategy.slice(0, index),
        ...userStrategy.slice(index + 1),
      ];
      if (userStrategy?.length === 0) {
        changeStrategy(prebuiltStrategy?.at(0));
      }
      shouldUpdate = true;
    }
  }

  async function handleOptionType(index) {
    if (index !== undefined && userStrategy[index]) {
      // Update the specific leg in userStrategy
      const updatedStrategy = [...userStrategy];
      updatedStrategy[index].optionType =
        updatedStrategy[index].optionType === "Call" ? "Put" : "Call";
      userStrategy = updatedStrategy;
    } else {
      // Update the selectedAction (for new legs)
      selectedOptionType = selectedOptionType === "Call" ? "Put" : "Call";
    }
    await loadData();
    shouldUpdate = true;
  }

  async function handleAction(index: number) {
    if (index !== undefined && userStrategy[index]) {
      // Update the specific leg in userStrategy
      const updatedStrategy = [...userStrategy];
      updatedStrategy[index].action =
        updatedStrategy[index].action === "Buy" ? "Sell" : "Buy";
      userStrategy = updatedStrategy;
    } else {
      // Update the selectedAction (for new legs)
      selectedAction = selectedAction === "Buy" ? "Sell" : "Buy";
    }
    shouldUpdate = true;
  }

  async function handleExpirationDate(date, index) {
    selectedDate = date;
    if (index !== undefined && userStrategy[index]) {
      // Update the specific leg in userStrategy
      const updatedStrategy = [...userStrategy];
      updatedStrategy[index].date = selectedDate;
      userStrategy = updatedStrategy;
      await loadData();
      shouldUpdate = true;
    }
  }
  async function handleStrikePrice(strikePrice, index: number) {
    selectedStrike = strikePrice;
    if (index !== undefined && userStrategy[index]) {
      // Update the specific leg in userStrategy
      const updatedStrategy = [...userStrategy];
      updatedStrategy[index].strike = selectedStrike;
      userStrategy = updatedStrategy;
      await loadData();
      shouldUpdate = true;
    }
  }

  async function handleOptionPriceInput(event: Event, index) {
    const value = (event.target as HTMLInputElement).value;

    selectedOptionPrice = value === "" ? null : +value;
    const updatedStrategy = [...userStrategy];
    updatedStrategy[index].optionPrice = selectedOptionPrice;
    userStrategy = updatedStrategy;

    // Clear any existing debounce timeout
    if (debounceTimeout) clearTimeout(debounceTimeout);

    // Set a new debounce timeout
    debounceTimeout = setTimeout(async () => {
      shouldUpdate = true;
    }, 300);
  }

  async function handleQuantityInput(event, index) {
    if (index !== undefined && userStrategy[index]) {
      const value = (event.target as HTMLInputElement).value;

      selectedQuantity = value === "" ? null : +value;
      const updatedStrategy = [...userStrategy];
      updatedStrategy[index].quantity = selectedQuantity;
      userStrategy = updatedStrategy;
      if (debounceTimeout) clearTimeout(debounceTimeout);

      // Set a new debounce timeout
      debounceTimeout = setTimeout(async () => {
        shouldUpdate = true;
      }, 300);
    }
  }

  async function search() {
    clearTimeout(timeoutId); // Clear any existing timeout

    if (!inputValue.trim()) {
      // Skip if query is empty or just whitespace
      searchBarData = []; // Clear previous results
      return;
    }

    timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10`,
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        searchBarData = await response.json();
      } catch (error) {
        console.error("Error during search:", error);
        searchBarData = [];
      }
    }, 50); // delay
  }

  async function changeTicker(data) {
    if (!data?.symbol) return;

    selectedTicker = data.symbol;
    assetType = data?.type?.toLowerCase() || "stocks";

    await getStockData();
    await loadData();
    inputValue = "";
    shouldUpdate = true;
  }

  async function handleSaveStrategy() {
    if (data?.user?.tier !== "Pro") {
      toast.error("Upgrade to Pro to unlock this feature!", {
        style: `border-radius: 5px; background: #fff; color: #000; border: 1px solid ${$mode === "light" ? "#F3F4F6" : "#4B5563"}; font-size: 15px; padding: 10px;`,
      });
      return;
    }
    try {
      // Create filtered strategies without strikeList and dateList
      const strategiesToSave = userStrategy.map(
        ({ strikeList, dateList, ...rest }) => rest,
      );

      // Save the filtered version
      localStorage?.setItem(
        "options-calculator-strategy",
        JSON?.stringify({
          userStrategy: strategiesToSave,
          ticker: selectedTicker,
        }),
      );

      toast.success("Options Strategy saved!", {
        style: `border-radius: 5px; background: #fff; color: #000; border: 1px solid ${$mode === "light" ? "#F3F4F6" : "#4B5563"}; font-size: 15px; padding: 10px;`,
      });
    } catch (e) {
      console.log("Failed saving indicator rules: ", e);
    }
  }

  onMount(async () => {
    if (isPro) {
      try {
        const savedStrategy = localStorage?.getItem(
          "options-calculator-strategy",
        );

        if (savedStrategy) {
          const parsedData = JSON.parse(savedStrategy);
          userStrategy = parsedData?.userStrategy;
          selectedTicker = parsedData?.ticker;
        }
      } catch (e) {
        console.log(e);
      }
    }

    if (!downloadWorker) {
      const DownloadWorker = await import("./workers/downloadWorker?worker");
      downloadWorker = new DownloadWorker.default();
      downloadWorker.onmessage = handleDownloadMessage;
    }

    if (!plotWorker) {
      const PlotWorker = await import("./workers/plotWorker?worker");
      plotWorker = new PlotWorker.default();
      plotWorker.onmessage = handlePlotMessage;
    }

    if (!strategyWorker) {
      const StrategyWorker = await import("./workers/strategyWorker?worker");
      strategyWorker = new StrategyWorker.default();
      strategyWorker.onmessage = handleStrategyMessage;
    }

    await getStockData();

    shouldUpdate = true;
  });

  onDestroy(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    if (timeoutId) clearTimeout(timeoutId);
  });

  // REACTIVE STATEMENTS

  $: {
    if (shouldUpdate) {
      isLoaded = false;
      shouldUpdate = false;

      config = plotData();
      userStrategy = [...userStrategy];
      isLoaded = true;
    }
  }

  $: {
    if ($mode) {
      config = plotData();
    }
  }

  // Watch for changes to inputValue and trigger search
  $: {
    if (inputValue) {
      search();
    }
  }
</script>

<SEO
  title="Options Calculator - Free Options Profit & Loss Calculator "
  description="Free options calculator to calculate profit/loss, breakeven prices, Greeks, and risk-reward for calls and puts. Analyze option strategies, max profit, max loss, and probability of profit. Perfect for options trading."
  keywords="options calculator, options profit calculator, options P&L calculator, breakeven calculator, options Greeks calculator, call calculator, put calculator, options strategy calculator, free options calculator"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Options Calculator",
    description:
      "Free options profit and loss calculator with Greeks and strategy analysis",
    url: "https://stocknear.com/options-calculator",
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
          name: "Options Calculator",
          item: "https://stocknear.com/options-calculator",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Options profit/loss calculator",
      "Breakeven price calculator",
      "Greeks calculator (Delta, Gamma, Theta, Vega)",
      "Risk-reward analysis",
      "Multiple options strategies",
      "Real-time calculations",
    ],
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/" class="text-muted dark:text-gray-300">Home</a>
      </li>
      <li class="text-muted dark:text-gray-300">Options Calculator</li>
    </ul>
  </div>

  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div
        class="relative flex flex-row justify-center items-start overflow-hidden w-full"
      >
        <div class="w-full mt-5">
          <div class="w-full">
            <div class="border-b-[2px] border-[#2C6288] dark:border-white">
              <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
                Options Calculator
              </h1>
            </div>
          </div>

          <div class="mt-5 mb-5 w-full">
            <h2 class="mt-5 mb-1 text-xl sm:text-2xl font-bold">
              {selectedStrategy}
            </h2>
            <p class="mt-3">
              {description}
            </p>

            <div class="mt-4">
              <div
                class="{$screenWidth < 640 && $screenWidth
                  ? 'grid grid-cols-1'
                  : 'flex flex-row'} items-center w-full mt-3 mb-3"
              >
                <Combobox.Root
                  items={searchBarData}
                  bind:inputValue
                  bind:touchedInput
                >
                  <div class="relative w-full">
                    <div
                      class="absolute inset-y-0 left-0 flex items-center pl-2.5"
                    >
                      <svg
                        class="h-4 w-4 text-icon xs:h-5 xs:w-5"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="3"
                        stroke="currentcolor"
                        viewBox="0 0 24 24"
                        style="max-width: 40px"
                        aria-hidden="true"
                      >
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                    </div>

                    <Combobox.Input
                      on:input={search}
                      class="text-sm  controls-input shadow focus:outline-hidden border border-gray-300 dark:border-gray-600 rounded placeholder:text-gray-600 dark:placeholder:text-gray-200 px-3 py-2 pl-8 xs:pl-10 grow w-full "
                      placeholder="Find..."
                      aria-label="Find..."
                    />
                  </div>
                  <Combobox.Content
                    class="z-10 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-default px-1 py-2 shadow outline-hidden"
                    sideOffset={8}
                  >
                    {#if inputValue?.length !== 0 && inputValue !== selectedTicker}
                      {#each searchBarData as searchItem}
                        <Combobox.Item
                          class="py-2.5 cursor-pointer border-b border-gray-300 dark:border-gray-500 last:border-none flex h-fit w-auto select-none items-center rounded-button  px-2  text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-gray-200 dark:data-highlighted:bg-primary"
                          value={searchItem?.symbol}
                          label={searchItem?.symbol}
                          on:click={(e) => changeTicker(searchItem)}
                        >
                          <div
                            class="flex flex-col sm:flex-row items-start sm:items-center"
                          >
                            <span
                              class="text-sm text-blue-800 dark:text-blue-400"
                              >{searchItem?.symbol}</span
                            >
                            <span
                              class="ml-0 sm:ml-2 text-xs sm:text-sm text-muted dark:text-white"
                              >{searchItem?.name}</span
                            >
                          </div>
                        </Combobox.Item>
                      {:else}
                        <span
                          class="block px-5 py-2 text-sm text-muted dark:text-white"
                        >
                          No results found
                        </span>
                      {/each}
                    {:else}
                      <Combobox.Item
                        class="cursor-pointer border-b border-gray-300 dark:border-gray-600 last:border-none flex h-fit w-auto select-none items-center rounded-button py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                      >
                        <span class=" text-sm text-muted dark:text-white">
                          {inputValue?.length > 0
                            ? "No results found"
                            : "Start searching..."}
                        </span>
                      </Combobox.Item>
                    {/if}
                  </Combobox.Content>
                </Combobox.Root>

                <button
                  type="button"
                  on:click={() => handleAddOptionLeg()}
                  class="cursor-pointer mt-3 sm:mt-0 sm:ml-3 align-middle inline-flex items-center gap-x-1.5 rounded px-2.5 py-2 text-sm shadow text-white border-gray-300 bg-black sm:hover:bg-default text-white dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-none transition duration-150 ease-in-out whitespace-nowrap"
                >
                  Add Option Leg
                </button>
                <button
                  type="button"
                  on:click={handleSaveStrategy}
                  class="cursor-pointer mt-3 sm:mt-0 sm:ml-3 align-middle inline-flex items-center gap-x-1.5 rounded px-2.5 py-2 text-sm shadow border-gray-300 bg-black sm:hover:bg-default text-white dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-none transition duration-150 ease-in-out whitespace-nowrap"
                >
                  Save Strategy
                </button>
                <div
                  class="order-last relative inline-block text-left cursor-pointer mt-3 sm:mt-0 sm:ml-3 shadow"
                >
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-full transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span class="truncate">Custom Strategy</span>
                        <svg
                          class="-mr-1 ml-3 h-5 w-5 xs:ml-2 inline-block"
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
                      <DropdownMenu.Group>
                        {#each prebuiltStrategy as strategy}
                          <DropdownMenu.Item
                            on:click={() => changeStrategy(strategy)}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            <span>{strategy.name}</span>
                            {#if strategy?.sentiment}
                              <span
                                class="ml-3 border-inherit shadow badge px-2 text-xs rounded-full {strategy.sentiment ===
                                'Bullish'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-300 dark:text-black'
                                  : strategy?.sentiment === 'Bearish'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-300 dark:text-black'
                                    : 'bg-orange-100 text-orange-800 dark:bg-yellow-300/80 dark:text-black'}"
                                >{strategy.sentiment}</span
                              >
                            {/if}
                          </DropdownMenu.Item>
                        {/each}
                      </DropdownMenu.Group>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
              </div>

              <!-- Table container -->
              <div
                class="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded bg-[#F8F9FA] dark:bg-secondary"
              >
                <table
                  class="min-w-full divide-y divide-gray-200 dark:divide-gray-600"
                >
                  <!-- Table head -->
                  <thead class="bg-gray-50 dark:bg-secondary">
                    <tr class="">
                      <th
                        scope="col"
                        class="px-4 py-1.5 text-left text-sm font-semibold"
                      >
                        Symbol
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-1.5 text-left text-sm font-semibold"
                      >
                        Action
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-1.5 text-left text-sm font-semibold"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-1.5 text-left text-sm font-semibold"
                      >
                        Expiration Date
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-1.5 text-left text-sm font-semibold"
                      >
                        Strike
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-1.5 text-left text-sm font-semibold"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-1.5 text-left text-sm font-semibold"
                      >
                        Price
                      </th>
                      <th scope="col" class="px-4 py-1.5 text-sm font-semibold"
                      ></th>
                    </tr>
                  </thead>

                  <!-- Table body -->
                  <tbody
                    class="bg-[#F8F9FA] dark:bg-secondary divide-y divide-gray-200 dark:divide-gray-600 text-sm"
                  >
                    {#each userStrategy as item, index}
                      <tr class="">
                        <td class="px-4 whitespace-nowrap font-semibold">
                          {selectedTicker}
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <label
                            on:click={() => handleAction(index)}
                            class="badge px-2 border-none select-none rounded {item?.action ===
                            'Buy'
                              ? 'bg-green-100 text-green-800 dark:bg-green-300 dark:text-muted'
                              : 'bg-red-100 text-red-800 dark:bg-red-300 dark:text-muted'} font-semibold cursor-pointer"
                            >{item?.action}</label
                          >
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <input
                            type="number"
                            value={userStrategy[index]?.quantity}
                            min="0"
                            on:input={(e) => handleQuantityInput(e, index)}
                            class="border border-gray-300 dark:border-gray-500 rounded px-2 py-1 w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild let:builder>
                              <Button
                                builders={[builder]}
                                class="mb-1 border border-gray-300 dark:border-none  bg-white dark:bg-[#000] h-[35px] flex flex-row justify-between items-center min-w-[130px] w-[140px] sm:w-auto  px-3  rounded truncate"
                              >
                                <span class="truncate text-sm"
                                  >{formatDate(userStrategy[index]?.date)}</span
                                >
                                <svg
                                  class="-mr-1 ml-2 h-5 w-5 inline-block"
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
                              class="w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
                            >
                              <!-- Dropdown items -->
                              <DropdownMenu.Group class="pb-2"
                                >{#each userStrategy[index]?.dateList as item}
                                  <DropdownMenu.Item
                                    on:click={() => {
                                      handleExpirationDate(item, index);
                                    }}
                                    class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary cursor-pointer "
                                  >
                                    {formatDate(item)}
                                  </DropdownMenu.Item>
                                {/each}</DropdownMenu.Group
                              >
                            </DropdownMenu.Content>
                          </DropdownMenu.Root>
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild let:builder>
                              <Button
                                builders={[builder]}
                                class="mb-1 border border-gray-300 dark:border-none  bg-white dark:bg-[#000] h-[35px] flex flex-row justify-between items-center min-w-[130px] w-[140px] sm:w-auto  px-3  rounded truncate"
                              >
                                <span class="truncate text-sm"
                                  >{userStrategy[index]?.strike}</span
                                >
                                <svg
                                  class="-mr-1 ml-2 h-5 w-5 inline-block"
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
                              class="w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
                            >
                              <!-- Dropdown items -->
                              <DropdownMenu.Group class="pb-2">
                                <!-- Added padding to avoid overlapping with Reset button -->
                                {#each userStrategy[index]?.strikeList as item}
                                  <DropdownMenu.Item
                                    on:click={() => {
                                      handleStrikePrice(item, index);
                                    }}
                                    class="sm:hover:bg-gray-200 dark:sm:hover:bg-primary cursor-pointer "
                                  >
                                    {item}
                                  </DropdownMenu.Item>
                                {/each}
                              </DropdownMenu.Group>
                            </DropdownMenu.Content>
                          </DropdownMenu.Root>
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <label
                            on:click={() => handleOptionType(index)}
                            class="select-none badge px-2 rounded border-none bg-blue-100 text-blue-800 dark:bg-blue-300 dark:text-muted font-semibold cursor-pointer"
                            >{item?.optionType}</label
                          >
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={userStrategy[index]?.optionPrice}
                            on:input={(e) => handleOptionPriceInput(e, index)}
                            class="border border-gray-300 dark:border-gray-500 rounded px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td class="px-4 whitespace-nowrap py-2 select-none">
                          <div
                            class="flex flex-row items-center m-auto text-center justify-center"
                          >
                            <a
                              class="inline-block"
                              href={`/${["stocks", "stock"]?.includes(assetType) ? "stocks" : assetType === "etf" ? "etf" : "index"}/${selectedTicker}/options/contract-lookup?query=${userStrategy[index]?.optionSymbol}`}
                            >
                              <Link
                                class="w-4 h-4 text-gray-800 dark:text-gray-100 mt-0.5"
                              />
                            </a>
                            <label
                              on:click={() => handleDeleteOptionLeg(index)}
                              class="ml-3 inline-block cursor-pointer"
                            >
                              <Trash
                                class="w-4 h-4 text-gray-800 dark:text-gray-100"
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              {#if isLoaded && config}
                <h2
                  class="mt-5 mb-1 text-lg sm:text-xl font-bold text-gray-800 dark:text-white"
                >
                  Profit/Loss Chart
                </h2>

                <div
                  class="shadow border border-gray-300 dark:border-gray-800 rounded"
                  use:highcharts={config}
                ></div>
              {:else}
                <div
                  class="flex justify-center items-center h-[300px] sm:h-[350px]"
                >
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

              <div class="mt-10">
                <h2
                  class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-3"
                >
                  Trade Information
                </h2>

                <!-- Trade Information Card -->
                <div
                  class="border border-gray-300 dark:border-gray-800 rounded p-3 sm:p-4 mb-6 shadow max-w-sm"
                >
                  {#each userStrategy as item, index}
                    <div>
                      {"Option-Leg" + " " + (index + 1)}
                    </div>
                    <div
                      class="{item?.action === 'Buy'
                        ? 'text-green-800'
                        : 'text-red-800'} dark:text-white font-semibold"
                    >
                      {item?.action?.toUpperCase()} +{item?.quantity}
                      {selectedTicker}
                      {formatDate(item?.date)}
                      {item?.strike}
                      {item?.optionType} @${item?.optionPrice}
                    </div>
                  {/each}
                </div>

                <!-- Stock Section -->
                <h2
                  class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4"
                >
                  Stock
                </h2>
                <div class="grid grid-cols-2 sm:grid-cols-4 mb-6">
                  <div>
                    <div class="text-gray-600 dark:text-white">
                      {selectedTicker} Current Price
                    </div>
                    <div class="flex items-baseline">
                      <span class="text-lg font-semibold"
                        >${currentStockPrice
                          ? currentStockPrice?.toFixed(2)
                          : "n/a"}</span
                      >
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      {selectedTicker} Breakeven Price
                      <InfoModal
                        title="Breakeven Price"
                        id="breakevenModal"
                        content="The stock price at which an options position will neither make nor lose money."
                      />
                    </div>
                    <div class="flex items-baseline">
                      <span class="text-lg font-semibold"
                        >{typeof breakEvenPrice === "number"
                          ? "$" + breakEvenPrice?.toFixed(2)
                          : "n/a"}</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Trade Details Section -->
                <h2
                  class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4"
                >
                  Trade Details
                </h2>
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 mb-6"
                >
                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Cost of Trade
                      <InfoModal
                        title="Cost of Trade"
                        id="premModal"
                        content="The Cost of Trade refers to the total amount needed to open a position. For options, buying a contract creates a net debit (positive cost), while selling a contract creates a net credit (negative cost)."
                      />
                    </div>
                    <div class="flex items-baseline">
                      <span class="text-lg font-semibold"
                        >${totalPremium?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Maximum Profit
                      <InfoModal
                        title="Maximum Profit"
                        id="maxProfitModal"
                        content="Maximum Profit is the highest possible gain from an options position or strategy. For long positions, profit is unlimited for calls and capped for puts (if the stock drops to zero). For short positions, profit is limited to the premium received, achieved if the option expires worthless or is repurchased at a lower price."
                      />
                    </div>
                    <div
                      class="text-lg font-semibold text-green-800 dark:text-green-400"
                    >
                      {metrics?.maxProfit}
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Maximum Loss
                      <InfoModal
                        title="Maximum Loss"
                        id="maxLossModal"
                        content="Maximum Loss is the worst possible financial outcome of an options position. For long calls or puts, it's limited to the premium paid. For naked calls, losses can be unlimited due to unlimited upside risk. For naked puts, the maximum loss is the strike price minus the premium if the stock drops to zero. In defined-risk spreads, it's the difference between strike prices minus net premium received or paid."
                      />
                    </div>
                    <div
                      class="text-lg font-semibold text-red-600 dark:text-red-400"
                    >
                      {metrics?.maxLoss}
                    </div>
                  </div>
                </div>

                <!-- Probability Analysis Section -->
                <h2
                  class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 mt-6"
                >
                  Probability Analysis
                </h2>
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 mb-6"
                >
                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Probability of Profit
                      <InfoModal
                        title="Probability of Profit (PoP)"
                        id="popModal"
                        content="The Probability of Profit (PoP) measures the likelihood that a trade will result in a profit at expiration. It is calculated using the Black-Scholes model and implied volatility derived from option prices. This metric provides an estimate of the success rate for a given strategy under current market conditions."
                      />
                    </div>
                    <div
                      class="text-lg font-semibold {probabilities?.pop >= 0.5
                        ? 'text-green-800 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'}"
                    >
                      {(probabilities?.pop * 100)?.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Prob. of Max Profit
                      <InfoModal
                        title="Probability of Maximum Profit"
                        id="popMaxProfitModal"
                        content="The Probability of Maximum Profit represents the likelihood that a trade will achieve its highest possible profit at expiration. This metric considers factors such as the behavior of the underlying asset, time to expiration, and market volatility (implied volatility derived from option prices)."
                      />
                    </div>
                    <div
                      class="text-lg font-semibold text-green-800 dark:text-green-400"
                    >
                      {(probabilities?.popMaxProfit * 100)?.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Prob. of Max Loss
                      <InfoModal
                        title="Probability of Maximum Loss"
                        id="popMaxLossModal"
                        content="The Probability of Maximum Loss represents the likelihood that a trade will incur its worst possible outcome at expiration. This metric helps traders understand the risk of losing their entire investment or facing maximum exposure based on the strategy. It is calculated using the Black-Scholes model."
                      />
                    </div>
                    <div
                      class="text-lg font-semibold text-red-600 dark:text-red-400"
                    >
                      {(probabilities?.popMaxLoss * 100)?.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <!-- Risk Reward Analysis Section -->
                <h2
                  class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 mt-6"
                >
                  Risk Reward Analysis
                </h2>
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 mb-6"
                >
                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Expected Value (EV)
                      <InfoModal
                        title="Expected Value (EV)"
                        id="evModal"
                        content="The Expected Value (EV) is the weighted average of all possible outcomes of an options trade, where each payoff at a possible ending price is multiplied by its probability of occurring, and then each resulting value is summed together. It is based on the probability distribution of the security's prices at a future date. This statistical measure helps traders assess the theoretical profitability of a strategy if it were to be repeated many times."
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold {riskRewardMetrics?.expectedValue >=
                        0
                          ? 'text-green-800 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'}"
                      >
                        {riskRewardMetrics?.expectedValue >= 0
                          ? ""
                          : "-"}${Math.abs(
                          riskRewardMetrics?.expectedValue,
                        )?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
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

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Expected Return
                      <InfoModal
                        title="Expected Return (EV/Risk)"
                        id="expectedReturnModal"
                        content="The ratio of Expected Value (EV) divided by Maximum Risk, expressed as a percentage. This metric shows the expected profit or loss relative to the maximum potential loss of the trade. For example, if a trade has an Expected Value of $100 and a Maximum Risk of $1,000, the Expected Return would be 10%. This standardized measurement helps traders compare different strategies regardless of position size or structure, providing a risk-adjusted way to evaluate trading opportunities."
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold {riskRewardMetrics?.expectedReturn !==
                          null && riskRewardMetrics?.expectedReturn >= 0
                          ? 'text-green-800 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'}"
                      >
                        {riskRewardMetrics?.expectedReturn !== null
                          ? `${riskRewardMetrics?.expectedReturn >= 0 ? "" : ""}${riskRewardMetrics?.expectedReturn?.toFixed(1)}%`
                          : "n/a"}
                      </div>
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

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Reward/Risk
                      <InfoModal
                        title="Reward/Risk Ratio"
                        id="rewardRiskModal"
                        content="The Reward/Risk Percentage measures the potential profit of a trade relative to its potential loss, expressed as a percentage. It is calculated as Maximum Profit divided by Maximum Loss. For example, if a trade has a max profit of $500 and max loss of $200, the Reward/Risk is 250%. This helps traders evaluate whether the potential rewards justify the risks taken on a particular trade. A higher percentage indicates more favorable risk-reward."
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold text-gray-800 dark:text-white"
                      >
                        {riskRewardMetrics?.rewardRisk !== null
                          ? `${riskRewardMetrics?.rewardRisk?.toFixed(1)}%`
                          : "n/a"}
                      </div>
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

                <!-- Position Greeks Section -->
                <h2
                  class="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 mt-6"
                >
                  Position Greeks
                </h2>
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 mb-6"
                >
                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Delta (Δ)
                      <InfoModal
                        title="Delta (Δ)"
                        id="deltaModal"
                        content="Delta measures how much the value of your trade position will change for every $1 move in the underlying stock. For example, a delta of 50 means your position will gain $50 if the stock rises $1, or lose $50 if it falls $1. Positive delta = bullish exposure, negative delta = bearish exposure."
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold text-gray-800 dark:text-white"
                      >
                        {positionGreeks?.delta?.toFixed(2)}
                      </div>
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

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Gamma (Γ)
                      <InfoModal
                        title="Gamma (Γ)"
                        id="gammaModal"
                        content="Gamma indicates how quickly Delta changes with each $1 move in the underlying asset. High gamma means your delta will change rapidly as the stock moves. Gamma is highest for at-the-money options near expiration. Positive gamma benefits from large moves, negative gamma is hurt by them."
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold text-gray-800 dark:text-white"
                      >
                        {positionGreeks?.gamma?.toFixed(4)}
                      </div>
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

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Theta (Θ)
                      <InfoModal
                        title="Theta (Θ)"
                        id="thetaModal"
                        content="Theta measures your position's daily loss in value due to time decay. A theta of -$50 means your position loses $50 per day just from the passage of time, assuming all else stays constant. Option buyers have negative theta (time works against them), while sellers have positive theta."
                      />
                    </div>
                    {#if isPro}
                      <div
                        class="text-lg font-semibold {positionGreeks?.theta >= 0
                          ? 'text-green-800 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'}"
                      >
                        {positionGreeks?.theta >= 0 ? "" : "-"}${Math.abs(
                          positionGreeks?.theta?.toFixed(2),
                        )?.toLocaleString("en-US")}/day
                      </div>
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

                  <div>
                    <div
                      class="flex items-center text-gray-600 dark:text-white"
                    >
                      Vega (ν)
                      <InfoModal
                        title="Vega (ν)"
                        id="vegaModal"
                        content="Vega measures the amount the position will change for every 1% change in implied volatility. A vega of $100 means your position will gain $100 if IV rises by 1%, or lose $100 if IV falls by 1%. Long options have positive vega, short options have negative vega."
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold text-gray-800 dark:text-white"
                      >
                        {positionGreeks?.vega >= 0 ? "" : "-"}${Math.abs(
                          positionGreeks?.vega,
                        )?.toFixed(2)}
                      </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
