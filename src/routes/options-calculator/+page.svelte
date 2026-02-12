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
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    options_calculator_add_option_leg,
    options_calculator_breadcrumb_current,
    options_calculator_breadcrumb_home,
    options_calculator_breakeven_info,
    options_calculator_breakeven_price,
    options_calculator_cost_of_trade,
    options_calculator_cost_of_trade_info,
    options_calculator_current_price,
    options_calculator_custom_strategy,
    options_calculator_delta,
    options_calculator_delta_info,
    options_calculator_ev,
    options_calculator_ev_info,
    options_calculator_expected_return,
    options_calculator_expected_return_info,
    options_calculator_gamma,
    options_calculator_gamma_info,
    options_calculator_greeks,
    options_calculator_max_loss,
    options_calculator_max_loss_info,
    options_calculator_max_profit,
    options_calculator_max_profit_info,
    options_calculator_no_results,
    options_calculator_option_leg,
    options_calculator_per_day,
    options_calculator_pop,
    options_calculator_pop_info,
    options_calculator_pop_max_loss,
    options_calculator_pop_max_loss_info,
    options_calculator_pop_max_profit,
    options_calculator_pop_max_profit_info,
    options_calculator_probability_analysis,
    options_calculator_profit_loss_chart,
    options_calculator_reward_risk,
    options_calculator_reward_risk_info,
    options_calculator_risk_reward,
    options_calculator_save_strategy,
    options_calculator_search_placeholder,
    options_calculator_seo_description,
    options_calculator_seo_keywords,
    options_calculator_seo_title,
    options_calculator_start_searching,
    options_calculator_stock,
    options_calculator_table_action,
    options_calculator_table_expiration,
    options_calculator_table_price,
    options_calculator_table_quantity,
    options_calculator_table_strike,
    options_calculator_table_symbol,
    options_calculator_table_type,
    options_calculator_theta,
    options_calculator_theta_info,
    options_calculator_title,
    options_calculator_toast_max_legs,
    options_calculator_toast_one_leg_required,
    options_calculator_toast_saved,
    options_calculator_toast_upgrade_pro,
    options_calculator_trade_details,
    options_calculator_trade_information,
    options_calculator_vega,
    options_calculator_vega_info,
  } from "$lib/paraglide/messages";

  import { mode } from "mode-watcher";
  import highcharts from "$lib/highcharts.ts";

  export let data;

  let isPro = data?.user?.tier === "Pro" ? true : false;
  // State variables
  let isLoaded = false;
  let shouldUpdate = false;
  let config: any = null;
  let downloadWorker: Worker | undefined;
  let plotWorker: Worker | undefined;
  let strategyWorker: Worker | undefined;
  let latestDownloadRequestId = 0;
  let latestPlotRequestId = 0;
  let latestStrategyRequestId = 0;
  let latestLoadRequestId = 0;
  let activeSearchRequestId = 0;
  let searchAbortController: AbortController | null = null;
  let contractDataWarning = "";
  let workerError = "";

  // Strategy selection
  let selectedStrategy = "Long Call";
  let selectedOptionType = "Call";
  let selectedTicker = "TSLA";
  let assetType = "stocks";
  let selectedAction = "Buy";
  let selectedOptionPrice: number | null = null;
  let selectedQuantity: number | null = 1;
  let debounceTimeout: ReturnType<typeof setTimeout>;

  // Market data
  let currentStockPrice = 0;
  let optionData: Record<string, any> = {};
  let dateList: string[] = [];
  let selectedDate = "";
  let strikeList: number[] = [];
  let selectedStrike = 0;

  // Option information
  let optionSymbol = "";
  let breakEvenPrices: number[] = [];
  let totalPremium = 0;
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
  let shareStrategy = [];
  let description = prebuiltStrategy[0]?.description;

  const handleDownloadMessage = async (event) => {
    const { requestId, message, output, error } = event?.data || {};

    if (requestId !== latestDownloadRequestId) {
      return;
    }

    if (message === "error") {
      workerError = error || "Failed to load options data.";
      isLoaded = false;
      return;
    }

    workerError = "";
    rawData = output || {};
    currentStockPrice = rawData?.getStockQuote?.price || 0;
    await loadData();
  };

  const handlePlotMessage = async (event) => {
    const { requestId, message, output, error } = event?.data || {};

    if (requestId !== latestPlotRequestId) {
      return;
    }

    if (message === "error") {
      workerError = error || "Failed to calculate strategy metrics.";
      isLoaded = false;
      return;
    }

    workerError = "";
    metrics = output?.metrics || {};
    breakEvenPrices = output?.breakEvenPrices || [];
    totalPremium = output?.totalPremium || 0;
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
          ...breakEvenPrices.map((price) => ({
            value: price,
            color: "#10B981",
            dashStyle: "Dash",
            width: $screenWidth < 640 ? 0 : 1.5,
            label: {
              text: `<span class="hidden sm:block text-black dark:text-white text-sm">Breakeven $${price.toFixed(2)}</span>`,
              style: { color: $mode === "light" ? "black" : "white" },
            },
            zIndex: 5,
          })),
        ],
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
          const premiumBase = Math.abs(totalPremium);
          const profitLossPctChange =
            premiumBase > 0 ? (profitLoss / premiumBase) * 100 : 0;
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
    isLoaded = true;
  };

  const handleStrategyMessage = async (event) => {
    const { requestId, message, output, error } = event?.data || {};

    if (requestId !== latestStrategyRequestId) {
      return;
    }

    if (message === "error") {
      workerError = error || "Failed to update strategy.";
      return;
    }

    workerError = "";
    userStrategy = output;

    userStrategy = [...userStrategy];
    await loadData();
    shouldUpdate = true;
  };

  async function changeStrategy(strategy) {
    selectedStrategy = strategy?.name;
    description = strategy?.description;
    latestStrategyRequestId += 1;

    strategyWorker?.postMessage({
      userStrategy,
      strikeList,
      selectedStrategy,
      selectedAction,
      selectedDate,
      selectedOptionPrice,
      selectedOptionType,
      selectedQuantity,
      selectedStrike,
      requestId: latestStrategyRequestId,
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

  const getTickerBasePath = () =>
    `/${["stocks", "stock"].includes(assetType) ? "stocks" : assetType === "etf" ? "etf" : "index"}/${selectedTicker}`;

  function plotData() {
    // Determine x-axis range based on current stock price and max leg strike
    const combinedStrategy = [
      ...(userStrategy || []),
      ...(shareStrategy || []),
    ];

    if (!combinedStrategy || combinedStrategy.length === 0) {
      return null;
    }
    try {
      // Get the expiration date from the first leg (or use a default)
      const expirationDate =
        userStrategy[0]?.date ||
        selectedDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
      latestPlotRequestId += 1;
      plotWorker?.postMessage({
        userStrategy: combinedStrategy,
        currentStockPrice: currentStockPrice,
        expirationDate: expirationDate,
        requestId: latestPlotRequestId,
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }

  const getContractHistory = async (ticker: string, contractId: string) => {
    const cacheKey = `${ticker}-${contractId}`;
    const cachedData = getCache(cacheKey, "getContractHistory");

    if (cachedData) {
      return cachedData;
    }

    try {
      const postData = {
        ticker,
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
        const errorBody = await response.json().catch(() => ({
          error: `Failed to fetch contract history: ${response.statusText}`,
        }));
        return {
          history: [],
          error: true,
          status: response.status,
          message:
            errorBody?.error ||
            `Failed to fetch contract history: ${response.statusText}`,
        };
      }

      const output = await response.json();
      setCache(cacheKey, output, "getContractHistory");
      return output;
    } catch (error) {
      console.error("Error fetching contract history:", error);
      return {
        history: [],
        error: true,
        status: 500,
        message: "Error fetching contract history.",
      };
    }
  };

  async function loadData() {
    const loadRequestId = ++latestLoadRequestId;

    if (!rawData?.getData) {
      console.error("rawData is undefined or invalid in loadData");
      return;
    }

    try {
      const tickerAtLoadStart = selectedTicker;
      contractDataWarning = "";

      if (userStrategy?.length > 0) {
        for (const item of userStrategy) {
          if (
            loadRequestId !== latestLoadRequestId ||
            tickerAtLoadStart !== selectedTicker
          ) {
            return;
          }

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
            tickerAtLoadStart,
            item?.date,
            item?.optionType,
            item?.strike,
          );

          const output = await getContractHistory(
            tickerAtLoadStart,
            optionSymbol,
          );
          if (
            loadRequestId !== latestLoadRequestId ||
            tickerAtLoadStart !== selectedTicker
          ) {
            return;
          }
          if (output?.error && !contractDataWarning) {
            contractDataWarning =
              output?.message || "Contract data unavailable.";
          }

          selectedOptionPrice = output?.history?.at(-1)?.mark
            ? output?.history?.at(-1)?.mark
            : output?.history?.at(-1)?.close || item.optionPrice || 0;
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
          tickerAtLoadStart,
          selectedDate,
          selectedOptionType,
          selectedStrike,
        );

        const output = await getContractHistory(
          tickerAtLoadStart,
          optionSymbol,
        );
        if (
          loadRequestId !== latestLoadRequestId ||
          tickerAtLoadStart !== selectedTicker
        ) {
          return;
        }
        if (output?.error && !contractDataWarning) {
          contractDataWarning = output?.message || "Contract data unavailable.";
        }
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
      if (
        loadRequestId === latestLoadRequestId &&
        tickerAtLoadStart === selectedTicker
      ) {
        shouldUpdate = true;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  async function getStockData() {
    try {
      isLoaded = false;
      latestDownloadRequestId += 1;
      downloadWorker?.postMessage({
        ticker: selectedTicker,
        requestId: latestDownloadRequestId,
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  }

  async function handleAddOptionLeg() {
    if (userStrategy?.length >= 5) {
      toast.error(options_calculator_toast_max_legs(), {
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

  function handleAddShareLeg() {
    if (shareStrategy?.length >= 5) {
      toast.error(options_calculator_toast_max_legs(), {
        style: `border-radius: 5px; background: #fff; color: #000; border: 1px solid ${$mode === "light" ? "#F3F4F6" : "#4B5563"}; font-size: 15px; padding: 10px;`,
      });
      return;
    }

    const defaultPrice = currentStockPrice ? +currentStockPrice.toFixed(2) : 0;
    shareStrategy = [
      ...shareStrategy,
      {
        legType: "Share",
        action: "Buy",
        quantity: 100,
        sharePrice: defaultPrice,
      },
    ];
    shouldUpdate = true;
  }

  function handleDeleteOptionLeg(index) {
    if (userStrategy?.length === 1) {
      toast.error(options_calculator_toast_one_leg_required(), {
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

  function handleShareAction(index: number) {
    const updatedShares = [...shareStrategy];
    updatedShares[index].action =
      updatedShares[index].action === "Buy" ? "Sell" : "Buy";
    shareStrategy = updatedShares;
    shouldUpdate = true;
  }

  function handleDeleteShareLeg(index: number) {
    shareStrategy = [
      ...shareStrategy.slice(0, index),
      ...shareStrategy.slice(index + 1),
    ];
    shouldUpdate = true;
  }

  function handleShareQuantityInput(event: Event, index: number) {
    const value = (event.target as HTMLInputElement).value;
    const updatedShares = [...shareStrategy];
    updatedShares[index].quantity = value === "" ? 0 : +value;
    shareStrategy = updatedShares;

    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      shouldUpdate = true;
    }, 300);
  }

  function handleSharePriceInput(event: Event, index: number) {
    const value = (event.target as HTMLInputElement).value;
    const updatedShares = [...shareStrategy];
    updatedShares[index].sharePrice = value === "" ? 0 : +value;
    shareStrategy = updatedShares;

    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      shouldUpdate = true;
    }, 300);
  }

  async function search() {
    clearTimeout(timeoutId);

    if (!inputValue.trim()) {
      searchBarData = [];
      if (searchAbortController) {
        searchAbortController.abort();
        searchAbortController = null;
      }
      return;
    }

    const requestId = ++activeSearchRequestId;

    timeoutId = setTimeout(async () => {
      try {
        if (searchAbortController) {
          searchAbortController.abort();
        }
        searchAbortController = new AbortController();

        const response = await fetch(
          `/api/searchbar?query=${encodeURIComponent(inputValue)}&limit=10`,
          { signal: searchAbortController.signal },
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const searchOutput = await response.json();
        if (requestId === activeSearchRequestId) {
          searchBarData = searchOutput;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Error during search:", error);
        searchBarData = [];
      }
    }, 250);
  }

  async function changeTicker(data) {
    if (!data?.symbol) return;

    selectedTicker = data.symbol;
    assetType = data?.type?.toLowerCase() || "stocks";
    contractDataWarning = "";
    shareStrategy = [];

    getStockData();
    inputValue = "";
    searchBarData = [];
  }

  async function handleSaveStrategy() {
    if (data?.user?.tier !== "Pro") {
      toast.error(options_calculator_toast_upgrade_pro(), {
        style: `border-radius: 5px; background: #fff; color: #000; border: 1px solid ${$mode === "light" ? "#F3F4F6" : "#4B5563"}; font-size: 15px; padding: 10px;`,
      });
      return;
    }
    try {
      // Create filtered strategies without strikeList and dateList
      const strategiesToSave = userStrategy.map(
        ({ strikeList, dateList, ...rest }) => rest,
      );
      const sharesToSave = shareStrategy.map((shareLeg) => ({
        legType: "Share",
        action: shareLeg?.action,
        quantity: shareLeg?.quantity,
        sharePrice: shareLeg?.sharePrice,
      }));

      // Save the filtered version
      localStorage?.setItem(
        "options-calculator-strategy",
        JSON?.stringify({
          userStrategy: strategiesToSave,
          shareStrategy: sharesToSave,
          ticker: selectedTicker,
        }),
      );

      toast.success(options_calculator_toast_saved(), {
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
          shareStrategy = parsedData?.shareStrategy || [];
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
      downloadWorker.onerror = (error) => {
        workerError = `Download worker error: ${error.message}`;
      };
    }

    if (!plotWorker) {
      const PlotWorker = await import("./workers/plotWorker?worker");
      plotWorker = new PlotWorker.default();
      plotWorker.onmessage = handlePlotMessage;
      plotWorker.onerror = (error) => {
        workerError = `Plot worker error: ${error.message}`;
      };
    }

    if (!strategyWorker) {
      const StrategyWorker = await import("./workers/strategyWorker?worker");
      strategyWorker = new StrategyWorker.default();
      strategyWorker.onmessage = handleStrategyMessage;
      strategyWorker.onerror = (error) => {
        workerError = `Strategy worker error: ${error.message}`;
      };
    }

    await getStockData();
  });

  onDestroy(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    if (timeoutId) clearTimeout(timeoutId);
    if (searchAbortController) {
      searchAbortController.abort();
      searchAbortController = null;
    }
    if (downloadWorker) {
      downloadWorker.terminate();
      downloadWorker = undefined;
    }
    if (plotWorker) {
      plotWorker.terminate();
      plotWorker = undefined;
    }
    if (strategyWorker) {
      strategyWorker.terminate();
      strategyWorker = undefined;
    }
  });

  // REACTIVE STATEMENTS

  $: {
    if (shouldUpdate) {
      isLoaded = false;
      shouldUpdate = false;

      plotData();
      userStrategy = [...userStrategy];
    }
  }

  $: {
    if ($mode && (userStrategy?.length > 0 || shareStrategy?.length > 0)) {
      plotData();
    }
  }
</script>

<SEO
  title={options_calculator_seo_title()}
  description={options_calculator_seo_description()}
  keywords={options_calculator_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Options Calculator",
    description:
      "Options P/L, breakeven, and Greeks calculator for fast trade planning",
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
      "Greeks (Delta, Gamma, Theta, Vega)",
      "Risk-reward analysis",
      "Probability of profit",
      "Fast scenario testing",
    ],
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
        >{options_calculator_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-500 dark:text-zinc-400">
      {options_calculator_breadcrumb_current()}
    </li>
  </BreadCrumb>

  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div
        class="relative flex flex-row justify-center items-start overflow-hidden w-full"
      >
        <div class="w-full mt-5">
          <div class="w-full">
            <div class="border-b border-gray-300 dark:border-zinc-700">
              <h1
                class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {options_calculator_title()}
              </h1>
            </div>
          </div>

          <div class="mt-5 mb-5 w-full">
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
                      class="text-[0.85rem] sm:text-sm border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full text-gray-700 dark:text-zinc-200 placeholder:text-gray-800 dark:placeholder:text-zinc-300 px-3 py-2 pl-8 xs:pl-10 grow w-full focus:outline-none focus:ring-0 focus:border-gray-300/80 dark:focus:border-zinc-700/80"
                      placeholder={options_calculator_search_placeholder()}
                      aria-label={options_calculator_search_placeholder()}
                    />
                  </div>
                  <Combobox.Content
                    class="z-10 rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none outline-hidden"
                    sideOffset={8}
                  >
                    {#if inputValue?.length !== 0 && inputValue !== selectedTicker}
                      {#each searchBarData as searchItem}
                        <Combobox.Item
                          class="py-2.5 cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-2xl px-2 text-sm capitalize outline-hidden transition-all duration-75 data-highlighted:bg-gray-100/70 dark:data-highlighted:bg-zinc-900/60"
                          value={searchItem?.symbol}
                          label={searchItem?.symbol}
                          on:click={(e) => changeTicker(searchItem)}
                        >
                          <div
                            class="flex flex-col sm:flex-row items-start sm:items-center"
                          >
                            <span class="text-sm text-gray-900 dark:text-white"
                              >{searchItem?.symbol}</span
                            >
                            <span
                              class="ml-0 sm:ml-2 text-xs sm:text-sm text-gray-500 dark:text-zinc-400"
                              >{searchItem?.name}</span
                            >
                          </div>
                        </Combobox.Item>
                      {:else}
                        <span
                          class="block px-5 py-2 text-sm text-gray-500 dark:text-zinc-400"
                        >
                          {options_calculator_no_results()}
                        </span>
                      {/each}
                    {:else}
                      <Combobox.Item
                        class="cursor-pointer border-b border-gray-300 dark:border-zinc-700 last:border-none flex h-fit w-auto select-none items-center rounded-2xl py-1.5 pl-5 pr-1.5 text-sm capitalize outline-hidden"
                      >
                        <span class="text-sm text-gray-500 dark:text-zinc-400">
                          {inputValue?.length > 0
                            ? options_calculator_no_results()
                            : options_calculator_start_searching()}
                        </span>
                      </Combobox.Item>
                    {/if}
                  </Combobox.Content>
                </Combobox.Root>

                <button
                  type="button"
                  on:click={() => handleAddOptionLeg()}
                  class="cursor-pointer mt-3 sm:mt-0 sm:ml-3 align-middle inline-flex items-center gap-x-1.5 rounded-full px-3 py-2 text-sm font-semibold border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition whitespace-nowrap"
                >
                  {options_calculator_add_option_leg()}
                </button>
                <button
                  type="button"
                  on:click={handleAddShareLeg}
                  class="cursor-pointer mt-3 sm:mt-0 sm:ml-3 align-middle inline-flex items-center gap-x-1.5 rounded-full px-3 py-2 text-sm font-semibold border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition whitespace-nowrap"
                >
                  Add Shares
                </button>
                <button
                  type="button"
                  on:click={handleSaveStrategy}
                  class="cursor-pointer mt-3 sm:mt-0 sm:ml-3 align-middle inline-flex items-center gap-x-1.5 rounded-full px-3 py-2 text-sm font-semibold border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition whitespace-nowrap"
                >
                  {options_calculator_save_strategy()}
                </button>
                <div
                  class="order-last relative inline-block text-left cursor-pointer mt-3 sm:mt-0 sm:ml-3"
                >
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button
                        builders={[builder]}
                        class="w-full transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span class="truncate"
                          >{options_calculator_custom_strategy()}</span
                        >
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
                      class="w-56 h-fit max-h-72 overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                    >
                      <DropdownMenu.Group>
                        {#each prebuiltStrategy as strategy}
                          <DropdownMenu.Item
                            on:click={() => changeStrategy(strategy)}
                            class="cursor-pointer rounded-2xl sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                          >
                            <span>{strategy.name}</span>
                            {#if strategy?.sentiment}
                              <span
                                class="ml-3 inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-[0.7rem] font-semibold text-gray-600 dark:text-zinc-300"
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

              {#if data?.user?.tier !== "Pro"}
                <a
                  href="/pricing"
                  class="mt-3 mb-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-violet-200 dark:border-violet-800/50 bg-violet-50/80 dark:bg-violet-950/30 transition-colors hover:bg-violet-100/80 dark:hover:bg-violet-900/30"
                >
                  <div
                    class="flex items-center gap-2.5 text-violet-900 dark:text-violet-200"
                  >
                    <svg
                      class="w-4 h-4 shrink-0 text-violet-500 dark:text-violet-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <span>
                      Upgrade to Pro to unlock advanced probability and risk
                      metrics.
                    </span>
                  </div>
                  <span
                    class="text-xs font-semibold text-violet-700 dark:text-violet-300 whitespace-nowrap"
                  >
                    Upgrade &rarr;
                  </span>
                </a>
              {/if}

              {#if workerError}
                <div
                  class="mb-3 rounded-2xl border border-rose-300/70 bg-rose-50/70 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  {workerError}
                </div>
              {/if}

              {#if contractDataWarning}
                <div
                  class="mb-3 rounded-2xl border border-amber-300/70 bg-amber-50/70 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  {contractDataWarning}
                </div>
              {/if}

              <!-- Table container -->
              <div
                class="overflow-x-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40"
              >
                <table
                  class="min-w-full divide-y divide-gray-200/70 dark:divide-zinc-800/80 text-gray-700 dark:text-zinc-200 tabular-nums"
                >
                  <!-- Table head -->
                  <thead class="bg-gray-50/80 dark:bg-zinc-900/60">
                    <tr class="">
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                      >
                        {options_calculator_table_symbol()}
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                      >
                        {options_calculator_table_action()}
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                      >
                        {options_calculator_table_quantity()}
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                      >
                        {options_calculator_table_expiration()}
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                      >
                        {options_calculator_table_strike()}
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                      >
                        {options_calculator_table_type()}
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                      >
                        {options_calculator_table_price()}
                      </th>
                      <th scope="col" class="px-4 py-2 text-sm font-semibold"
                      ></th>
                    </tr>
                  </thead>

                  <!-- Table body -->
                  <tbody
                    class="divide-y divide-gray-200/70 dark:divide-zinc-800/80 text-sm"
                  >
                    {#each userStrategy as item, index}
                      <tr
                        class="transition-colors hover:bg-gray-50/80 dark:hover:bg-zinc-900/60"
                      >
                        <td
                          class="px-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white"
                        >
                          {selectedTicker}
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <label
                            on:click={() => handleAction(index)}
                            class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 cursor-pointer select-none"
                            >{item?.action}</label
                          >
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <input
                            type="number"
                            value={userStrategy[index]?.quantity}
                            min="0"
                            on:input={(e) => handleQuantityInput(e, index)}
                            class=" border border-gray-300 shadow dark:border-zinc-700 rounded-2xl px-2 py-1 w-20 bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-0"
                          />
                        </td>
                        <td class="px-4 whitespace-nowrap py-2">
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild let:builder>
                              <Button
                                builders={[builder]}
                                class="mb-1 border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 h-[35px] flex flex-row justify-between items-center min-w-[130px] w-[140px] sm:w-auto px-3 rounded-full truncate text-gray-700 dark:text-zinc-200"
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
                              class="w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                            >
                              <!-- Dropdown items -->
                              <DropdownMenu.Group class="pb-2"
                                >{#each userStrategy[index]?.dateList as item}
                                  <DropdownMenu.Item
                                    on:click={() => {
                                      handleExpirationDate(item, index);
                                    }}
                                    class="cursor-pointer rounded-2xl sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
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
                                class="mb-1 border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 h-[35px] flex flex-row justify-between items-center min-w-[130px] w-[140px] sm:w-auto px-3 rounded-full truncate text-gray-700 dark:text-zinc-200"
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
                              class="w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                            >
                              <!-- Dropdown items -->
                              <DropdownMenu.Group class="pb-2">
                                <!-- Added padding to avoid overlapping with Reset button -->
                                {#each userStrategy[index]?.strikeList as item}
                                  <DropdownMenu.Item
                                    on:click={() => {
                                      handleStrikePrice(item, index);
                                    }}
                                    class="cursor-pointer rounded-2xl sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
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
                            class="select-none inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 cursor-pointer"
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
                            class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl px-2 py-1 w-24 bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-0"
                          />
                        </td>
                        <td class="px-4 whitespace-nowrap py-2 select-none">
                          <div
                            class="flex flex-row items-center m-auto text-center justify-center"
                          >
                            <a
                              class="inline-flex items-center text-gray-500 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                              href={`${getTickerBasePath()}/options/contract-lookup?contract=${userStrategy[index]?.optionSymbol}`}
                            >
                              <Link class="w-4 h-4 mt-0.5" />
                            </a>
                            <label
                              on:click={() => handleDeleteOptionLeg(index)}
                              class="ml-3 inline-flex items-center cursor-pointer text-gray-500 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                            >
                              <Trash class="w-4 h-4" />
                            </label>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              {#if shareStrategy?.length > 0}
                <h3
                  class="mt-6 mb-2 text-base sm:text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  Shares
                </h3>
                <div
                  class="overflow-x-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mb-4"
                >
                  <table
                    class="min-w-full divide-y divide-gray-200/70 dark:divide-zinc-800/80 text-gray-700 dark:text-zinc-200 tabular-nums"
                  >
                    <thead class="bg-gray-50/80 dark:bg-zinc-900/60">
                      <tr>
                        <th
                          scope="col"
                          class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                        >
                          {options_calculator_table_symbol()}
                        </th>
                        <th
                          scope="col"
                          class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                        >
                          {options_calculator_table_action()}
                        </th>
                        <th
                          scope="col"
                          class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                        >
                          {options_calculator_table_quantity()}
                        </th>
                        <th
                          scope="col"
                          class="px-4 py-2 text-left text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-300"
                        >
                          {options_calculator_table_price()}
                        </th>
                        <th scope="col" class="px-4 py-2 text-sm font-semibold"
                        ></th>
                      </tr>
                    </thead>
                    <tbody
                      class="divide-y divide-gray-200/70 dark:divide-zinc-800/80 text-sm"
                    >
                      {#each shareStrategy as shareItem, shareIndex}
                        <tr
                          class="transition-colors hover:bg-gray-50/80 dark:hover:bg-zinc-900/60"
                        >
                          <td
                            class="px-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white"
                          >
                            {selectedTicker}
                          </td>
                          <td class="px-4 whitespace-nowrap py-2">
                            <label
                              on:click={() => handleShareAction(shareIndex)}
                              class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-sm font-semibold text-gray-600 dark:text-zinc-300 cursor-pointer select-none"
                              >{shareItem?.action}</label
                            >
                          </td>
                          <td class="px-4 whitespace-nowrap py-2">
                            <input
                              type="number"
                              min="0"
                              value={shareItem?.quantity}
                              on:input={(e) =>
                                handleShareQuantityInput(e, shareIndex)}
                              class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl px-2 py-1 w-24 bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-0"
                            />
                          </td>
                          <td class="px-4 whitespace-nowrap py-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={shareItem?.sharePrice}
                              on:input={(e) =>
                                handleSharePriceInput(e, shareIndex)}
                              class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl px-2 py-1 w-28 bg-white/90 dark:bg-zinc-950/70 text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-0"
                            />
                          </td>
                          <td class="px-4 whitespace-nowrap py-2 select-none">
                            <div class="flex flex-row items-center">
                              <a
                                class="inline-flex items-center text-gray-500 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                                href={getTickerBasePath()}
                              >
                                <Link class="w-4 h-4 mt-0.5" />
                              </a>
                              <label
                                on:click={() =>
                                  handleDeleteShareLeg(shareIndex)}
                                class="ml-3 inline-flex items-center cursor-pointer text-gray-500 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                              >
                                <Trash class="w-4 h-4" />
                              </label>
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}

              {#if isLoaded && config}
                <h2
                  class="mt-5 mb-1 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  {options_calculator_profit_loss_chart()}
                </h2>

                <div
                  class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40"
                  use:highcharts={config}
                ></div>
              {:else}
                <div
                  class="flex justify-center items-center h-[300px] sm:h-[350px]"
                >
                  <div class="relative">
                    <label
                      class="bg-white/90 dark:bg-zinc-950/70 border border-gray-300 shadow dark:border-zinc-700 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    >
                      <span
                        class="loading loading-spinner loading-md text-gray-700 dark:text-zinc-200"
                      ></span>
                    </label>
                  </div>
                </div>
              {/if}

              <div class="mt-10">
                <h2
                  class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3"
                >
                  {options_calculator_trade_information()}
                </h2>

                <!-- Trade Information Card -->
                <div
                  class="border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-3 sm:p-4 mb-6 max-w-sm"
                >
                  {#each userStrategy as item, index}
                    <div>
                      {options_calculator_option_leg() + " " + (index + 1)}
                    </div>
                    <div
                      class="{item?.action === 'Buy'
                        ? 'text-emerald-800 dark:text-emerald-400'
                        : 'text-rose-800 dark:text-rose-400'} font-semibold"
                    >
                      {item?.action?.toUpperCase()} +{item?.quantity}
                      {selectedTicker}
                      {formatDate(item?.date)}
                      {item?.strike}
                      {item?.optionType} @${item?.optionPrice}
                    </div>
                  {/each}
                  {#each shareStrategy as shareItem, shareIndex}
                    <div>
                      Share Leg {shareIndex + 1}
                    </div>
                    <div
                      class="{shareItem?.action === 'Buy'
                        ? 'text-emerald-800 dark:text-emerald-400'
                        : 'text-rose-800 dark:text-rose-400'} font-semibold"
                    >
                      {shareItem?.action?.toUpperCase()} +{shareItem?.quantity}
                      {selectedTicker}
                      Shares @{shareItem?.sharePrice}
                    </div>
                  {/each}
                </div>

                <!-- Stock Section -->
                <h2
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4"
                >
                  {options_calculator_stock()}
                </h2>
                <div class="grid grid-cols-2 sm:grid-cols-4 mb-6">
                  <div>
                    <div class="text-gray-800 dark:text-zinc-300 text-sm">
                      {selectedTicker}
                      {options_calculator_current_price()}
                    </div>
                    <div class="flex items-baseline">
                      <span
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                        >${currentStockPrice
                          ? currentStockPrice?.toFixed(2)
                          : "n/a"}</span
                      >
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {selectedTicker}
                      {options_calculator_breakeven_price()}
                      <InfoModal
                        title={options_calculator_breakeven_price()}
                        id="breakevenModal"
                        content={options_calculator_breakeven_info()}
                      />
                    </div>
                    <div class="flex items-baseline">
                      <span
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                        >{breakEvenPrices?.length > 0
                          ? breakEvenPrices
                              .map((price) => `$${price.toFixed(2)}`)
                              .join(" / ")
                          : "n/a"}</span
                      >
                    </div>
                  </div>
                </div>

                <!-- Trade Details Section -->
                <h2
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4"
                >
                  {options_calculator_trade_details()}
                </h2>
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 mb-6"
                >
                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_cost_of_trade()}
                      <InfoModal
                        title={options_calculator_cost_of_trade()}
                        id="premModal"
                        content={options_calculator_cost_of_trade_info()}
                      />
                    </div>
                    <div class="flex items-baseline">
                      <span
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                        >{totalPremium >= 0 ? "$" : "-$"}{Math.abs(
                          totalPremium,
                        )?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_max_profit()}
                      <InfoModal
                        title={options_calculator_max_profit()}
                        id="maxProfitModal"
                        content={options_calculator_max_profit_info()}
                      />
                    </div>
                    <div
                      class="text-lg font-semibold text-emerald-800 dark:text-emerald-400"
                    >
                      {metrics?.maxProfit}
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_max_loss()}
                      <InfoModal
                        title={options_calculator_max_loss()}
                        id="maxLossModal"
                        content={options_calculator_max_loss_info()}
                      />
                    </div>
                    <div
                      class="text-lg font-semibold text-rose-800 dark:text-rose-400"
                    >
                      {metrics?.maxLoss}
                    </div>
                  </div>
                </div>

                <!-- Probability Analysis Section -->
                <h2
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4 mt-6"
                >
                  {options_calculator_probability_analysis()}
                </h2>
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 mb-6"
                >
                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_pop()}
                      <InfoModal
                        title={options_calculator_pop()}
                        id="popModal"
                        content={options_calculator_pop_info()}
                      />
                    </div>
                    <div
                      class="text-lg font-semibold {probabilities?.pop >= 0.5
                        ? 'text-emerald-800 dark:text-emerald-400'
                        : 'text-rose-800 dark:text-rose-400'}"
                    >
                      {(probabilities?.pop * 100)?.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_pop_max_profit()}
                      <InfoModal
                        title={options_calculator_pop_max_profit()}
                        id="popMaxProfitModal"
                        content={options_calculator_pop_max_profit_info()}
                      />
                    </div>
                    <div
                      class="text-lg font-semibold text-emerald-800 dark:text-emerald-400"
                    >
                      {(probabilities?.popMaxProfit * 100)?.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_pop_max_loss()}
                      <InfoModal
                        title={options_calculator_pop_max_loss()}
                        id="popMaxLossModal"
                        content={options_calculator_pop_max_loss_info()}
                      />
                    </div>
                    <div
                      class="text-lg font-semibold text-rose-800 dark:text-rose-400"
                    >
                      {(probabilities?.popMaxLoss * 100)?.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <!-- Risk Reward Analysis Section -->
                <h2
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4 mt-6"
                >
                  {options_calculator_risk_reward()}
                </h2>
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 mb-6"
                >
                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_ev()}
                      <InfoModal
                        title={options_calculator_ev()}
                        id="evModal"
                        content={options_calculator_ev_info()}
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold {riskRewardMetrics?.expectedValue >=
                        0
                          ? 'text-emerald-800 dark:text-emerald-400'
                          : 'text-rose-800 dark:text-rose-400'}"
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
                          class="size-5 text-gray-400 dark:text-zinc-300"
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
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_expected_return()}
                      <InfoModal
                        title={options_calculator_expected_return()}
                        id="expectedReturnModal"
                        content={options_calculator_expected_return_info()}
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold {riskRewardMetrics?.expectedReturn !==
                          null && riskRewardMetrics?.expectedReturn >= 0
                          ? 'text-emerald-800 dark:text-emerald-400'
                          : 'text-rose-800 dark:text-rose-400'}"
                      >
                        {riskRewardMetrics?.expectedReturn !== null
                          ? `${riskRewardMetrics?.expectedReturn >= 0 ? "" : ""}${riskRewardMetrics?.expectedReturn?.toFixed(1)}%`
                          : "n/a"}
                      </div>
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-gray-400 dark:text-zinc-300"
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
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_reward_risk()}
                      <InfoModal
                        title={options_calculator_reward_risk()}
                        id="rewardRiskModal"
                        content={options_calculator_reward_risk_info()}
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {riskRewardMetrics?.rewardRisk !== null
                          ? `${riskRewardMetrics?.rewardRisk?.toFixed(1)}%`
                          : "n/a"}
                      </div>
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-gray-400 dark:text-zinc-300"
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
                  class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4 mt-6"
                >
                  {options_calculator_greeks()}
                </h2>
                <div
                  class="grid grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-0 mb-6"
                >
                  <div>
                    <div
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_delta()}
                      <InfoModal
                        title={options_calculator_delta()}
                        id="deltaModal"
                        content={options_calculator_delta_info()}
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {positionGreeks?.delta?.toFixed(2)}
                      </div>
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-gray-400 dark:text-zinc-300"
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
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_gamma()}
                      <InfoModal
                        title={options_calculator_gamma()}
                        id="gammaModal"
                        content={options_calculator_gamma_info()}
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {positionGreeks?.gamma?.toFixed(4)}
                      </div>
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-gray-400 dark:text-zinc-300"
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
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_theta()}
                      <InfoModal
                        title={options_calculator_theta()}
                        id="thetaModal"
                        content={options_calculator_theta_info()}
                      />
                    </div>
                    {#if isPro}
                      <div
                        class="text-lg font-semibold {positionGreeks?.theta >= 0
                          ? 'text-emerald-800 dark:text-emerald-400'
                          : 'text-rose-800 dark:text-rose-400'}"
                      >
                        {positionGreeks?.theta >= 0 ? "" : "-"}${Math.abs(
                          positionGreeks?.theta?.toFixed(2),
                        )?.toLocaleString(
                          "en-US",
                        )}{options_calculator_per_day()}
                      </div>
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-gray-400 dark:text-zinc-300"
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
                      class="flex items-center text-gray-800 dark:text-zinc-300 text-sm"
                    >
                      {options_calculator_vega()}
                      <InfoModal
                        title={options_calculator_vega()}
                        id="vegaModal"
                        content={options_calculator_vega_info()}
                      />
                    </div>

                    {#if isPro}
                      <div
                        class="text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {positionGreeks?.vega >= 0 ? "" : "-"}${Math.abs(
                          positionGreeks?.vega,
                        )?.toFixed(2)}
                      </div>
                    {:else}
                      <a href="/pricing" class="flex mt-2">
                        <svg
                          class="size-5 text-gray-400 dark:text-zinc-300"
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
