<script lang="ts">
    import {
        portfolio_overview_assets,
        portfolio_overview_best_strength,
        portfolio_overview_beta,
        portfolio_overview_biggest_risk,
        portfolio_overview_empty_perf,
        portfolio_overview_est_dividends,
        portfolio_overview_health_empty,
        portfolio_overview_health_fundamentals,
        portfolio_overview_health_growth,
        portfolio_overview_health_moat,
        portfolio_overview_health_trend,
        portfolio_overview_health_volatility,
        portfolio_overview_loading_health,
        portfolio_overview_out_of_100,
        portfolio_overview_overall,
        portfolio_overview_per_year,
        portfolio_overview_perf_title,
        portfolio_overview_portfolio,
        portfolio_overview_sp500,
        portfolio_overview_status,
        portfolio_overview_status_bad,
        portfolio_overview_status_excellent,
        portfolio_overview_status_healthy,
        portfolio_overview_status_needs_attention,
        portfolio_overview_status_neutral,
        portfolio_overview_total_value,
        portfolio_overview_unrealized_returns,
        portfolio_overview_yield,
    } from "$lib/paraglide/messages";
    import highcharts from "$lib/highcharts";
    import { screenWidth } from "$lib/store.ts";
    import { mode } from "mode-watcher";

    export let data;
    export let portfolioData = [];
    export let portfolioOverviewData = null; // Optional: pre-fetched overview data from parent

    let performanceData = [];
    let seriesPerformance = [];
    let perfCategories = [];
    let rawDates = [];
    let selectedTimePeriod = "1Y"; // Default time period

    const timePeriods = ["1W", "1M", "3M", "6M", "1Y"];

    // Format date to readable format (e.g., "Sep 22")
    function formatDate(dateString) {
        const date = new Date(dateString);
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        return `${month} ${day}`;
    }

    // Format date with year for tooltip (e.g., "Sep 22, '22")
    function formatDateWithYear(dateString) {
        const date = new Date(dateString);
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month} ${day}, '${year}`;
    }

    // Calculate period returns from price series
    function calculatePeriodReturns(prices) {
        const returns = [];
        for (let i = 1; i < prices?.length; i++) {
            const periodReturn =
                ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
            returns?.push(periodReturn);
        }
        return returns;
    }

    // Calculate cumulative returns from initial value
    function calculateCumulativeReturns(prices) {
        if (prices.length === 0) return [];
        const initial = prices[0];
        return prices.map((price) => ((price - initial) / initial) * 100);
    }

    // Calculate beta (portfolio vs benchmark)
    function calculateBeta(portfolioPrices, benchmarkPrices) {
        if (portfolioPrices.length < 2 || benchmarkPrices.length < 2) {
            return null;
        }

        const portfolioReturns = calculatePeriodReturns(portfolioPrices);
        const benchmarkReturns = calculatePeriodReturns(benchmarkPrices);

        // Calculate means
        const portfolioMean =
            portfolioReturns?.reduce((a, b) => a + b, 0) /
            portfolioReturns?.length;
        const benchmarkMean =
            benchmarkReturns?.reduce((a, b) => a + b, 0) /
            benchmarkReturns?.length;

        // Calculate covariance
        let covariance = 0;
        for (let i = 0; i < portfolioReturns.length; i++) {
            covariance +=
                (portfolioReturns[i] - portfolioMean) *
                (benchmarkReturns[i] - benchmarkMean);
        }
        covariance /= portfolioReturns?.length - 1;

        // Calculate variance of benchmark
        let variance = 0;
        for (let i = 0; i < benchmarkReturns?.length; i++) {
            variance += Math?.pow(benchmarkReturns[i] - benchmarkMean, 2);
        }
        variance /= benchmarkReturns?.length - 1;

        return variance !== 0 ? (covariance / variance)?.toFixed(2) : null;
    }

    let portfolioBeta = 0;
    let healthScores = {
        categories: [
            portfolio_overview_health_moat(),
            portfolio_overview_health_trend(),
            portfolio_overview_health_growth(),
            portfolio_overview_health_fundamentals(),
            portfolio_overview_health_volatility(),
        ],
        values: [50, 50, 50, 50, 50], // Default values
    };
    let annualDividends = 0;
    let dividendYield = 0;

    // Process performance data from API
    function processPerformanceData(data) {
        // Handle new structure with portfolio and benchmark
        if (!data || typeof data !== "object") {
            return {
                categories: [],
                series: [],
                dates: [],
            };
        }

        const portfolioData = data.portfolio || [];
        const benchmarkData = data.benchmark || [];

        if (portfolioData.length === 0) {
            return {
                categories: [],
                series: [],
                dates: [],
            };
        }

        // Extract raw prices
        const portfolioPrices = portfolioData.map(
            (item) => parseFloat(item.value) || 0,
        );
        const benchmarkPrices = benchmarkData.map(
            (item) => parseFloat(item.close) || 0,
        );

        // Calculate cumulative returns for display
        const portfolioCumulativeReturns =
            calculateCumulativeReturns(portfolioPrices);
        const benchmarkCumulativeReturns =
            calculateCumulativeReturns(benchmarkPrices);

        // Extract categories (formatted dates) from portfolio data
        const categories = portfolioData.map((item) => formatDate(item.date));
        const dates = portfolioData.map((item) => item.date);

        // Build series array with cumulative returns
        const series = [
            {
                name: portfolio_overview_portfolio(),
                data: portfolioCumulativeReturns,
                color: "#3B82F6",
            },
        ];

        // Add benchmark data if available
        if (benchmarkData.length > 0) {
            series.push({
                name: portfolio_overview_sp500(),
                data: benchmarkCumulativeReturns,
                color: "#10B981",
            });
        }

        // Calculate beta
        portfolioBeta = calculateBeta(portfolioPrices, benchmarkPrices);

        return {
            categories,
            series,
            dates,
        };
    }

    // Calculate portfolio metrics reactively
    $: totalValue =
        portfolioData?.reduce((sum, item) => {
            const price = parseFloat(item?.price) || 0;
            const shares = parseFloat(item?.shares) || 0;
            return sum + price * shares;
        }, 0) || 0;

    $: totalCost =
        portfolioData?.reduce((sum, item) => {
            const avgPrice = parseFloat(item?.avgPrice) || 0;
            const shares = parseFloat(item?.shares) || 0;
            return sum + avgPrice * shares;
        }, 0) || 0;

    $: unrealizedReturns = totalValue - totalCost;

    $: unrealizedReturnsPercentage =
        totalCost > 0
            ? ((unrealizedReturns / totalCost) * 100).toFixed(2)
            : "0.00";

    // Format currency
    function formatCurrency(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    // Process portfolio overview data (from API or parent component)
    function processOverviewData(output) {
        if (output && typeof output === "object") {
            // Handle performance data
            const performanceOutput = output.performance || output;
            performanceData = performanceOutput;
            const processed = processPerformanceData(performanceOutput);
            perfCategories = processed.categories;
            seriesPerformance = processed.series;
            rawDates = processed.dates || [];

            // Handle health score data
            if (output?.health) {
                healthScores = {
                    categories:
                        output.health.categories || healthScores.categories,
                    values: output.health.values || healthScores.values,
                };
                buildRadar(); // Rebuild radar chart with new health scores
            }

            if (performanceOutput?.dividends) {
                annualDividends =
                    performanceOutput?.dividends?.annualDividends || 0;
                dividendYield =
                    performanceOutput?.dividends?.dividendYield || 0;
            }

            // Rebuild the performance chart with new data
            buildPerf();
        }
    }

    // Fetch market data for portfolio holdings
    async function getPortfolioData() {
        // Filter portfolio to only include positions with both shares and avgPrice
        const validPositions = portfolioData.filter(
            (item) =>
                item?.symbol &&
                item?.shares != null &&
                item?.avgPrice != null &&
                parseFloat(item.shares) > 0 &&
                parseFloat(item.avgPrice) > 0,
        );

        if (validPositions.length === 0) {
            // Reset chart if no valid positions
            perfCategories = [];
            seriesPerformance = [];
            rawDates = [];
            buildPerf();
            return;
        }

        const postData = {
            portfolioData: validPositions,
            timePeriod: selectedTimePeriod,
        };

        try {
            const response = await fetch("/api/portfolio-overview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(postData),
            });

            const output = await response?.json();
            processOverviewData(output);
        } catch (error) {
            console.error("Error fetching portfolio data:", error);
        }
    }

    // Calculate portfolio health status dynamically
    $: bestStrength = (() => {
        if (!healthScores?.values?.length) return "Growth";
        const maxIndex = healthScores.values.indexOf(
            Math.max(...healthScores.values),
        );
        return healthScores.categories[maxIndex] || "Growth";
    })();

    $: biggestRisk = (() => {
        if (!healthScores?.values?.length) return "Fundamentals";
        const minIndex = healthScores.values.indexOf(
            Math.min(...healthScores.values),
        );
        return healthScores.categories[minIndex] || "Fundamentals";
    })();

    $: overallHealthStatus = (() => {
        if (!healthScores?.values?.length)
            return portfolio_overview_status_healthy();
        const avgScore =
            healthScores.values.reduce((a, b) => a + b, 0) /
            healthScores.values.length;
        if (avgScore >= 70) return portfolio_overview_status_excellent();
        if (avgScore >= 60) return portfolio_overview_status_healthy();
        if (avgScore >= 50) return portfolio_overview_status_neutral();
        if (avgScore >= 30) return portfolio_overview_status_bad();
        return portfolio_overview_status_needs_attention();
    })();

    $: healthStatusColor = (() => {
        if (overallHealthStatus === portfolio_overview_status_excellent())
            return "text-emerald-800 dark:text-emerald-400";
        if (overallHealthStatus === portfolio_overview_status_healthy())
            return "text-emerald-800 dark:text-emerald-400";
        if (overallHealthStatus === portfolio_overview_status_neutral())
            return "text-yellow-800 dark:text-yellow-400";
        if (overallHealthStatus === portfolio_overview_status_bad())
            return "text-rose-800 dark:text-rose-400";
        return "text-rose-800 dark:text-rose-400";
    })();

    // --- Charts (reactive configs) ---
    let perfConfig = null;
    let radarConfig = null;

    function buildPerf() {
        // Don't build chart if no categories or series data
        if (!perfCategories || perfCategories.length === 0) {
            perfConfig = null;
            return;
        }

        perfConfig = {
            credits: { enabled: false },
            chart: {
                type: "spline",
                backgroundColor: "transparent",
                height: 260,
                animation: false,
            },
            title: { text: undefined },
            xAxis: {
                categories: perfCategories,
                gridLineWidth: 0,
                labels: {
                    style: { color: $mode === "light" ? "#545454" : "white" },
                },
            },

            yAxis: {
                startOnTick: false,
                endOnTick: false,
                gridLineWidth: 1,
                gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
                labels: {
                    style: { color: $mode === "light" ? "#545454" : "white" },
                    formatter: function () {
                        return this.value + "%";
                    },
                },
                title: { text: null },
                opposite: true,
            },
            legend: {
                enabled: true,
                itemStyle: { color: $mode === "light" ? "#000" : "#E5E7EB" },
                itemHoverStyle: { color: "#FFF" },
            },
            tooltip: {
                shared: true,
                valueSuffix: "%",
                backgroundColor: "rgba(0,0,0,.85)",
                borderWidth: 0,
                style: { color: "#fff" },
                formatter: function () {
                    const pointIndex = this.points[0].point.index;
                    const dateStr = rawDates[pointIndex];
                    const formattedDate = dateStr
                        ? formatDateWithYear(dateStr)
                        : this.x;
                    let s = "<b>" + formattedDate + "</b>";
                    this.points.forEach((point) => {
                        s +=
                            '<br/><span style="color:' +
                            point.color +
                            '">●</span> ' +
                            point.series.name +
                            ": <b>" +
                            point.y.toFixed(2) +
                            "%</b>";
                    });
                    return s;
                },
            },
            plotOptions: {
                series: {
                    animation: false,
                    marker: { enabled: false },
                    lineWidth: 2,
                    states: { hover: { lineWidthPlus: 0 } },
                },
            },
            series: seriesPerformance?.map((s) => ({
                ...s,
                type: "line",
                color: s.color || "#3B82F6", // Ensure color is applied
            })),
        };
    }
    function buildRadar() {
        radarConfig = {
            credits: { enabled: false },
            chart: {
                polar: true,
                type: "areaspline",
                backgroundColor: "transparent",
                height: 300,
                spacing: [20, 20, 20, 20],
                animation: false,
                events: {
                    load: function () {
                        const chart = this;
                        const [cx, cy] = chart.series[0].center;

                        // Add center score value
                        const avgScore =
                            healthScores.values.reduce((a, b) => a + b, 0) /
                            healthScores.values.length;
                        chart.renderer
                            .text(Math.round(avgScore).toString(), cx, cy + 5)
                            .attr({
                                zIndex: 5,
                                "text-anchor": "middle",
                            })
                            .css({
                                fontSize: "28px",
                                fontWeight: "700",
                                fill: "#c4af25",
                            })
                            .add();

                        chart.renderer
                            .text(portfolio_overview_overall(), cx, cy + 22)
                            .attr({
                                zIndex: 5,
                                "text-anchor": "middle",
                            })
                            .css({
                                fontSize: "11px",
                                fontWeight: "500",
                                fill: "#9CA3AF",
                            })
                            .add();
                    },
                },
            },
            title: { text: undefined },

            // Improved gradient bands
            pane: {
                size: $screenWidth < 640 ? "60%" : "70%",
            },

            xAxis: {
                categories: healthScores.categories,
                tickmarkPlacement: "on",
                lineWidth: 0,
                labels: {
                    enabled: true,
                    style: {
                        color: $mode === "light" ? "#000" : "#E5E7EB",
                        fontSize: "12px",
                        fontWeight: "600",
                    },
                    distance: 15,
                },
                gridLineColor:
                    $mode === "light"
                        ? "rgba(0,0,0,0.4)"
                        : "rgba(255,255,255,0.2)",
                gridLineWidth: 1.5,
            },
            yAxis: {
                gridLineInterpolation: "circle",
                min: 0,
                max: 100,
                tickInterval: 20,
                labels: {
                    enabled: false,
                    style: {
                        color: $mode === "light" ? "#000" : "#6B7280",
                        fontSize: "10px",
                        fontWeight: "500",
                    },
                    y: 5,
                },
                gridLineColor:
                    $mode === "light"
                        ? "rgba(0,0,0,0.4)"
                        : "rgba(255,255,255,0.2)",
                gridLineWidth: 1,
                plotBands: [
                    {
                        from: 80,
                        to: 100,
                        color:
                            $mode === "light" ? "rgba(0,0,0,0.1)" : "#1e222d",
                    },
                    {
                        from: 0,
                        to: 20,
                        color:
                            $mode === "light" ? "rgba(0,0,0,0.1)" : "#1e222d",
                    },
                ],
            },
            legend: { enabled: false },
            tooltip: {
                enabled: true,
                backgroundColor: "rgba(0,0,0,0.9)",
                borderWidth: 0,
                borderRadius: 8,
                padding: 12,
                shadow: {
                    color: "rgba(0,0,0,0.3)",
                    offsetX: 0,
                    offsetY: 2,
                    opacity: 0.5,
                    width: 4,
                },
                style: {
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "500",
                },
                useHTML: true,
                formatter: function () {
                    const category = this.x;
                    const value = this.y;
                    let color = "#10B981"; // green
                    if (value < 40)
                        color = "#EF4444"; // red
                    else if (value < 60) color = "#F59E0B"; // yellow

                    return `
                        <div style="text-align: center;">
                            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${category}</div>
                            <div style="font-size: 20px; font-weight: 700; color: ${color};">${value.toFixed(1)}</div>
                            <div class="text-gray-300" style="font-size: 11px; margin-top: 2px;">${portfolio_overview_out_of_100()}</div>
                        </div>
                    `;
                },
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: true,
                        radius: 1,
                        fillColor: "#a000f7",
                        lineWidth: 1,
                        lineColor: "#FFF",
                        symbol: "circle",
                        states: {
                            hover: {
                                enabled: true,
                                radius: 4,
                                lineWidth: 1,
                            },
                        },
                    },
                    animation: false,
                    pointPlacement: "on",
                    linecap: "round",
                    states: {
                        inactive: { opacity: 1 },
                        hover: {
                            lineWidthPlus: 1,
                        },
                    },
                },
            },
            series: [
                {
                    type: "areaspline",
                    name: "Portfolio Health",
                    data: healthScores.values,
                    color: $mode === "light" ? "#3046e7" : "#c4af25",
                    lineColor: $mode === "light" ? "#3046e7" : "#c4af25",
                    lineWidth: 1,
                    fillOpacity: 1,
                },
            ],
        };
    }

    // React to portfolioOverviewData from parent
    $: if (portfolioOverviewData && typeof window !== "undefined") {
        processOverviewData(portfolioOverviewData);
    }

    // Combined reactive statement - only fetch if portfolioOverviewData is not provided
    $: {
        if (
            !portfolioOverviewData &&
            portfolioData &&
            portfolioData?.length > 0 &&
            selectedTimePeriod &&
            typeof window !== "undefined"
        ) {
            // Trigger fetch when portfolio, time period, or mode changes
            getPortfolioData();
        } else if (!portfolioOverviewData) {
            // Reset chart if no portfolio data
            perfCategories = [];
            seriesPerformance = [];
            rawDates = [];
            buildPerf();
        }
    }

    buildRadar();
</script>

<!-- Page -->
<section class="w-full overflow-hidden">
    <div class="mx-auto w-full">
        <div
            class="flex flex-col sm:flex-row items-start w-full space-y-3 sm:space-x-3"
        >
            <!-- LEFT -->
            <div class="w-full">
                <!-- Header -->
                <div
                    class="rounded-2xl border border-gray-300 dark:border-zinc-700 p-5"
                >
                    <div class="w-full overflow-hidden">
                        <header class="relative">
                            <!-- soft top gradient -->

                            <div
                                class="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between"
                            >
                                <h2
                                    class="relative m-0 text-[1rem] font-semibold"
                                >
                                    {portfolio_overview_perf_title()}
                                </h2>

                                <!-- Time Period Selector -->
                                <div
                                    class="flex items-center gap-2 mt-3 sm:mt-0 mb-4 sm:mb-0"
                                >
                                    {#each timePeriods as period}
                                        <button
                                            on:click={() =>
                                                (selectedTimePeriod = period)}
                                            class="shadow cursor-pointer px-2 py-1 text-xs rounded transition-all duration-50 {selectedTimePeriod ===
                                            period
                                                ? 'bg-black dark:bg-white text-white dark:text-black '
                                                : ' bg-gray-100 dark:bg-table shadow'}"
                                        >
                                            {period}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </header>

                        <div class=" pt-3.5">
                            <!-- KPI strip -->
                            <div class="min-h-[45px] lg:min-h-[50px]">
                                <ul
                                    role="list"
                                    class="flex flex-row flex-wrap items-end gap-4 mb-3 sm:mb-0 sm:gap-6"
                                >
                                    <!-- Total Value -->
                                    <li class="flex items-start gap-3">
                                        <div>
                                            <p
                                                class="m-0 text-xl font-semibold tracking-tight"
                                                data-testid="total-value"
                                            >
                                                {formatCurrency(totalValue)}
                                            </p>
                                            <p class="m-0 text-xs">
                                                <span
                                                    class="underline decoration-dotted underline-offset-2"
                                                    title="The total current value of your portfolio"
                                                >
                                                    {portfolio_overview_total_value()}
                                                </span>
                                                • {portfolioData?.length?.toLocaleString(
                                                    "en-US",
                                                )}
                                                {portfolio_overview_assets()}
                                            </p>
                                        </div>
                                    </li>

                                    <!-- Unrealised Returns -->
                                    <li class="flex items-start gap-3">
                                        <div>
                                            <p
                                                class="m-0 text-xl font-semibold tracking-tight {unrealizedReturns >=
                                                0
                                                    ? 'text-emerald-800 dark:text-emerald-400'
                                                    : 'text-rose-800 dark:text-rose-400'}"
                                                data-testid="roi-value"
                                            >
                                                {formatCurrency(
                                                    unrealizedReturns,
                                                )}
                                            </p>
                                            <p class="m-0 text-xs">
                                                <span
                                                    class="underline decoration-dotted underline-offset-2"
                                                    title="Unrealised gains/losses on open positions"
                                                >
                                                    {portfolio_overview_unrealized_returns()}
                                                </span>
                                                <span aria-hidden="true">
                                                    •
                                                </span>
                                                <span
                                                    aria-label="Return percentage"
                                                    class={unrealizedReturns >=
                                                    0
                                                        ? "text-emerald-800 dark:text-emerald-400"
                                                        : "text-rose-800 dark:text-rose-400"}
                                                    >{unrealizedReturns >= 0
                                                        ? "+"
                                                        : ""}{unrealizedReturnsPercentage}%</span
                                                >
                                            </p>
                                        </div>
                                    </li>

                                    <!-- Dividends -->
                                    <li class="flex items-start gap-3">
                                        <div>
                                            <div
                                                class="flex items-baseline gap-2"
                                            >
                                                <p
                                                    class="m-0 text-xl font-semibold tracking-tight"
                                                    data-testid="dividend"
                                                >
                                                    {formatCurrency(
                                                        annualDividends,
                                                    )}
                                                </p>
                                                <p
                                                    class="m-0 text-sm font-medium text-slate-600 dark:text-slate-300"
                                                >
                                                    {portfolio_overview_per_year()}
                                                </p>
                                            </div>
                                            <p class="m-0 text-xs">
                                                <span
                                                    class="underline decoration-dotted underline-offset-2"
                                                    title="Estimated annual dividend income"
                                                >
                                                    {portfolio_overview_est_dividends()}
                                                </span>
                                                • {dividendYield?.toFixed(2)}%
                                                {portfolio_overview_yield()}
                                            </p>
                                        </div>
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <div>
                                            <div
                                                class="flex items-baseline gap-2"
                                            >
                                                <p
                                                    class="m-0 text-xl font-semibold tracking-tight"
                                                    data-testid="dividend"
                                                >
                                                    {portfolioBeta}
                                                </p>
                                            </div>
                                            <p class="m-0 text-xs">
                                                <span
                                                    class="underline decoration-dotted underline-offset-2"
                                                    title="Estimated annual dividend income"
                                                >
                                                    {portfolio_overview_beta()}
                                                </span>
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4">
                        {#if perfConfig}
                            <div use:highcharts={perfConfig}></div>
                        {:else}
                            <div
                                class="flex items-center justify-center h-[100px] sm:h-[235px] text-center"
                            >
                                <p class="text-sm">
                                    {portfolio_overview_empty_perf()}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- RIGHT -->
            <div class="w-full sm:w-[40%]">
                <!-- Health + Radar -->
                <div
                    class="rounded-2xl border border-gray-300 dark:border-zinc-700 p-5"
                >
                    {#if portfolioData.length > 0}
                        <h3 class="text-[1rem] font-semibold">
                            {portfolio_overview_status()}
                            <span class={healthStatusColor}
                                >{overallHealthStatus}</span
                            >
                        </h3>
                    {/if}
                    <p class="text-sm">
                        {#if portfolioData.length === 0 || bestStrength === biggestRisk}
                            {portfolio_overview_health_empty()}
                        {:else}
                            {portfolio_overview_best_strength()}
                            <span class=" font-semibold">{bestStrength}</span>
                            {portfolio_overview_biggest_risk()}
                            <span class="font-semibold">{biggestRisk}</span>.
                        {/if}
                    </p>
                    <div class="h-[250px] sm:h-[300px]">
                        {#if radarConfig}
                            <div use:highcharts={radarConfig}></div>
                        {:else}
                            <div
                                class=" flex items-center justify-center text-gray-500 dark:text-gray-400"
                            >
                                <p class="text-sm">
                                    {portfolio_overview_loading_health()}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Bull / Bear cases -->
                <!-- <Sector />-->
            </div>
        </div>
    </div>
</section>

<style>
    /* optional: smooth font rendering for dark UIs */
    :global(html) {
        color-scheme: dark;
    }
</style>
