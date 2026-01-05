<script lang="ts">
    import highcharts from "$lib/highcharts";
    import { onMount } from "svelte";
    import { mode } from "mode-watcher";
    import { screenWidth } from "$lib/store.ts";
    import InfoModal from "$lib/components/InfoModal.svelte";

    export let title: string = "Valuation";
    export let data: any = null;

    // Default stats template based on title
    function getDefaultStats(title: string) {
        if (title === "Valuation") {
            return [
                { label: "Dividend Yield", value: "n/a" },
                { label: "PEG Ratio", value: "n/a" },
                { label: "Price/Sales Ratio", value: "n/a" },
                { label: "Price/Cash Flow", value: "n/a" },
                { label: "Forward P/E", value: "n/a" },
                { label: "EV/EBITDA", value: "n/a" },
            ];
        } else if (title === "Growth") {
            return [
                { label: "Revenue Growth (YoY)", value: "n/a" },
                { label: "EPS Growth (YoY)", value: "n/a" },
                { label: "Revenue Growth (5Y CAGR)", value: "n/a" },
                { label: "Operating Income Growth", value: "n/a" },
                { label: "Net Income Growth", value: "n/a" },
                { label: "FCF Growth", value: "n/a" },
            ];
        } else if (title === "Efficiency") {
            return [
                { label: "Return on Equity (ROE)", value: "n/a" },
                { label: "Return on Assets (ROA)", value: "n/a" },
                { label: "Asset Turnover", value: "n/a" },
                { label: "Return on Invested Capital", value: "n/a" },
                { label: "Inventory Turnover", value: "n/a" },
                { label: "Return on Tangible Assets", value: "n/a" },
                { label: "Working Capital Ratio", value: "n/a" },
                { label: "Return On Capital Employed", value: "n/a" },
            ];
        } else {
            // Margins
            return [
                { label: "Gross Margin", value: "n/a" },
                { label: "Operating Margin", value: "n/a" },
                { label: "Profit Margin", value: "n/a" },
                { label: "EBITDA Margin", value: "n/a" },
                { label: "FCF Margin", value: "n/a" },
                { label: "Pretax Margin", value: "n/a" },
            ];
        }
    }

    // Add info content to stats if not already present
    $: gaugeData = data
        ? {
              ...data,
              stats: data.stats?.map((stat) => ({
                  ...stat,
                  infoId: getInfoId(stat.label),
              })),
          }
        : {
              gauge1: {
                  value: null,
                  label: "Portfolio",
                  compareValue: 0,
                  compareLabel: "US Market",
              },
              gauge2: {
                  value: null,
                  label: "Portfolio",
                  compareValue: 0,
                  compareLabel: "US Market",
              },
              stats: getDefaultStats(title).map((stat) => ({
                  ...stat,
                  infoId: getInfoId(stat.label),
              })),
          };

    function getInfoId(label: string): string {
        const idMap = {
            "Dividend Yield": "dividendYield",
            "PEG Ratio": "priceToEarningsGrowthRatio",
            "Price/Sales Ratio": "priceToSalesRatio",
            "Price/Cash Flow": "priceToOperatingCashFlowRatio",
            "Forward P/E": "forwardPE",
            "EV/EBITDA": "evToEBITDA",

            "Return on Equity (ROE)": "returnOnEquity",
            "Return on Assets (ROA)": "returnOnAssets",
            "Asset Turnover": "assetTurnover",
            "Return on Invested Capital": "returnOnInvestedCapital",
            "Inventory Turnover": "inventoryTurnover",
            "Working Capital Ratio": "currentRatio",
            "Return on Tangible Assets": "returnOnTangibleAssets",
            "Return On Capital Employed": "returnOnCapitalEmployed",

            "Revenue Growth (YoY)": "growthRevenue",
            "EPS Growth (YoY)": "growthEPS",
            "Revenue Growth (5Y CAGR)": "cagr5YearRevenue",
            "Operating Income Growth": "growthOperatingIncome",
            "Net Income Growth": "growthNetIncome",
            "FCF Growth": "growthFreeCashFlow",
            "Gross Margin": "grossProfitMargin",
            "Operating Margin": "operatingMargin",
            "Profit Margin": "netProfitMargin",
            "EBITDA Margin": "ebitdaMargin",
            "FCF Margin": "freeCashFlowMargin",
            "Pretax Margin": "pretaxProfitMargin",
        };

        return idMap[label] || label.toLowerCase().replace(/\s+/g, "");
    }

    let gauge1Config = null;
    let gauge2Config = null;
    let componentElement: HTMLElement;
    let isVisible = false;
    let hasLoaded = false;

    function buildGaugeChart(gaugeData: any, isFirstGauge: boolean) {
        // Calculate maxValue: at least 60, or portfolio value * 4
        const portfolioValueRaw =
            gaugeData.value !== null && gaugeData.value !== undefined
                ? gaugeData.value
                : null;

        const maxValue =
            portfolioValueRaw !== null
                ? Math.max(60, portfolioValueRaw * 4)
                : 60;

        const band1 = maxValue * 0.1;
        const band2 = maxValue * 0.3;
        const band3 = maxValue * 0.5;
        const band4 = maxValue * 0.7;
        const band5 = maxValue * 0.9;

        // Set gauge titles based on section
        let gaugeTitle = "";
        if (title === "Valuation") {
            gaugeTitle = isFirstGauge ? "PE Ratio" : "P/B Ratio";
        } else if (title === "Efficiency") {
            gaugeTitle = isFirstGauge ? "ROE" : "ROA";
        } else if (title === "Growth") {
            gaugeTitle = isFirstGauge ? "Revenue Growth" : "EPS Growth";
        } else if (title === "Margins") {
            gaugeTitle = isFirstGauge ? "Gross Margin" : "Profit Margin";
        }

        // Handle null portfolio value - center the arrow
        // Clamp negative values to 0 so needle doesn't go below zero
        const portfolioValue =
            portfolioValueRaw !== null
                ? Math.max(0, portfolioValueRaw)
                : maxValue / 2;

        // Also clamp compare value to 0 if negative
        const compareValue = Math.max(0, gaugeData.compareValue || 0);

        return {
            credits: { enabled: false },

            chart: {
                type: "gauge",
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 320,
                animation: false,
            },

            plotOptions: {
                gauge: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                        inactive: {
                            enabled: false,
                        },
                    },
                },
                series: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                        inactive: {
                            enabled: false,
                        },
                    },
                },
            },

            title: {
                text: `<h3 class="text-black dark:text-white text-[1rem]">${gaugeTitle}</h3>`,
                style: {
                    color: $mode === "light" ? "#000" : "#fff",
                },
                useHTML: true,
                y: 30,
            },

            pane: {
                startAngle: -90,
                endAngle: 90,
                background: [
                    {
                        outerRadius: "101%",
                        innerRadius: "100%",
                        backgroundColor: "#000",
                        borderWidth: 0,
                        shape: "arc",
                    },
                    null,
                ],
            },

            yAxis: {
                min: 0,
                max: maxValue,
                tickPosition: "outside",
                tickLength: 0,
                tickWidth: 0,
                minorTickInterval: null,
                lineWidth: 0,
                labels: {
                    enabled: true,
                    distance: 20,
                    style: {
                        color: $mode === "light" ? "#000" : "#fff",
                        fontSize: "14px",
                        fontWeight: "500",
                    },
                    formatter: function () {
                        const suffix = title === "Valuation" ? "x" : "%";
                        return this.value + suffix;
                    },
                    y: 0,
                },

                plotBands: [
                    { from: 0, to: band1, color: "#22C55E", thickness: 20 },
                    { from: band1, to: band2, color: "#84CC16", thickness: 20 },
                    { from: band2, to: band3, color: "#EAB308", thickness: 20 },
                    { from: band3, to: band4, color: "#F97316", thickness: 20 },
                    { from: band4, to: band5, color: "#EF4444", thickness: 20 },
                    {
                        from: band5,
                        to: maxValue,
                        color: "#DC2626",
                        thickness: 20,
                    },
                ],
            },

            series: [
                {
                    name: gaugeData.label,
                    data: [portfolioValue],
                    animation: false,
                    enableMouseTracking: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                        inactive: {
                            enabled: false,
                        },
                    },
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        backgroundColor: "none",
                        borderWidth: 0,
                        shadow: false,
                        y: 40,
                        formatter: function () {
                            const suffix = title === "Valuation" ? "x" : "%";
                            const displayValue =
                                gaugeData.value !== null &&
                                gaugeData.value !== undefined
                                    ? `${gaugeData.value}${suffix}`
                                    : "n/a";
                            return `<div class="flex justify-center space-x-8 text-xs sm:text-sm">
                        <div class="flex flex-col items-center">
                            <span class="text-gray-800 dark:text-zinc-300 font-semibold">${gaugeData.label}</span>
                            <span class="text-gray-900 dark:text-white text-base sm:text-lg font-bold">${displayValue}</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <span class="text-gray-800 dark:text-zinc-300 font-semibold">${gaugeData.compareLabel}</span>
                            <span class="text-gray-700 dark:text-zinc-200 text-base sm:text-lg font-bold">${gaugeData.compareValue}${suffix}</span>
                        </div>
                    </div>`;
                        },
                    },
                    dial: {
                        radius: "80%",
                        backgroundColor: $mode === "light" ? "#000" : "#fff",
                        baseWidth: 8,
                        baseLength: "0%",
                        rearLength: "0%",
                    },
                    pivot: {
                        backgroundColor: $mode === "light" ? "#000" : "#fff",
                        radius: 6,
                    },
                },
                {
                    name: gaugeData.compareLabel,
                    data: [compareValue],
                    animation: false,
                    enableMouseTracking: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                        inactive: {
                            enabled: false,
                        },
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    dial: {
                        radius: "70%",
                        backgroundColor:
                            $mode === "light" ? "#52525b" : "#d4d4d8",
                        baseWidth: 6,
                        baseLength: "0%",
                        rearLength: "0%",
                    },
                    pivot: {
                        backgroundColor:
                            $mode === "light" ? "#52525b" : "#d4d4d8",
                        radius: 4,
                    },
                },
            ],

            tooltip: {
                enabled: false,
            },
        };
    }

    function updateCharts() {
        if (gaugeData && isVisible) {
            gauge1Config = buildGaugeChart(gaugeData.gauge1, true);
            gauge2Config = buildGaugeChart(gaugeData.gauge2, false);
            hasLoaded = true;
        }
    }

    onMount(() => {
        // Use Intersection Observer for lazy loading
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasLoaded) {
                        isVisible = true;
                        updateCharts();
                    }
                });
            },
            {
                rootMargin: "100px", // Load 100px before entering viewport
                threshold: 0.1,
            },
        );

        if (componentElement) {
            observer.observe(componentElement);
        }

        return () => {
            if (componentElement) {
                observer.unobserve(componentElement);
            }
        };
    });

    // Rebuild charts when mode or screenWidth changes (only if already loaded)
    $: if (
        ($mode || $screenWidth) &&
        typeof window !== "undefined" &&
        hasLoaded
    ) {
        updateCharts();
    }
</script>

<div class="w-full" bind:this={componentElement}>
    <h2
        class="mb-6 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
    >
        {title}
    </h2>
    {#if hasLoaded}
        <div
            class="flex flex-col -mt-2 mb-8 md:flex-row gap-4 justify-between items-center w-full m-auto"
        >
            <!-- Gauge 1 -->
            <div
                class="w-fit max-w-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
                use:highcharts={gauge1Config}
            ></div>

            <!-- Gauge 2 -->
            <div
                class="w-fit max-w-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
                use:highcharts={gauge2Config}
            ></div>

            <!-- Stats -->
            <div
                class="grid grid-cols-2 gap-8 p-3 sm:p-0 text-sm w-full sm:w-[50%]"
            >
                {#each gaugeData.stats as stat}
                    <div class="flex flex-col">
                        <div
                            class="text-gray-800 dark:text-zinc-300 text-sm flex flex-row items-center gap-x-2"
                        >
                            <span>{stat.label}</span>
                            <InfoModal
                                id={stat.infoId}
                                title={stat?.label?.replace("[%]", "")}
                                callAPI={true}
                                parameter={stat?.infoId}
                            />
                        </div>
                        <span
                            class="font-semibold text-sm text-gray-900 dark:text-white"
                        >
                            {stat?.value}
                        </span>
                    </div>
                {/each}
            </div>
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
