<script lang="ts">
    import highcharts from "$lib/highcharts";
    import { onMount } from "svelte";

    export let data;
    export let portfolioData = [];

    let performanceData = [];
    let seriesPerformance = [];
    let perfCategories = [];

    // Format date to readable format (e.g., "Oct 15")
    function formatDate(dateString) {
        const date = new Date(dateString);
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        return `${month} ${day}`;
    }

    // Process performance data from API
    function processPerformanceData(data) {
        // Handle new structure with portfolio and benchmark
        if (!data || typeof data !== "object") {
            return {
                categories: [],
                series: [],
            };
        }

        const portfolioData = data.portfolio || [];
        const benchmarkData = data.benchmark || [];

        if (portfolioData.length === 0) {
            return {
                categories: [],
                series: [],
            };
        }

        // Extract categories (formatted dates) from portfolio data
        const categories = portfolioData.map((item) => formatDate(item.date));
        const portfolioValues = portfolioData.map(
            (item) => parseFloat(item.totalReturnPercentage) || 0,
        );

        // Build series array
        const series = [
            { name: "Portfolio", data: portfolioValues, color: "#3B82F6" },
        ];

        // Add benchmark data if available
        if (benchmarkData.length > 0) {
            const benchmarkValues = benchmarkData.map(
                (item) => parseFloat(item.totalReturnPercentage) || 0,
            );
            series.push({
                name: "S&P 500",
                data: benchmarkValues,
                color: "#10B981",
            });
        }

        return {
            categories,
            series,
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
            buildPerf();
            return;
        }

        const postData = {
            portfolioData: validPositions,
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

            // Process the performance data
            if (output && typeof output === "object") {
                performanceData = output;
                const processed = processPerformanceData(output);
                perfCategories = processed.categories;
                seriesPerformance = processed.series;

                // Rebuild the chart with new data
                buildPerf();
            }
        } catch (error) {
            console.error("Error fetching portfolio data:", error);
        }
    }

    // Radar values (0-100)
    const radar = {
        categories: ["Moat", "Trend", "Growth", "Fundamentals", "Volatility"],
        values: [62, 70, 60, 40, 58],
    };

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
                type: "line",
                backgroundColor: "transparent",
                height: 260,
                spacing: [10, 10, 10, 10],
            },
            title: { text: undefined },
            xAxis: {
                categories: perfCategories,
                lineColor: "#222",
                tickColor: "#333",
                labels: { style: { color: "#9CA3AF" } },
            },
            yAxis: {
                title: { text: undefined },
                gridLineColor: "#1f2937",
                labels: {
                    style: { color: "#9CA3AF" },
                    formatter: function () {
                        return this.value + "%";
                    },
                },
            },
            legend: {
                enabled: true,
                itemStyle: { color: "#E5E7EB" },
                itemHoverStyle: { color: "#FFF" },
            },
            tooltip: {
                shared: true,
                valueSuffix: "%",
                backgroundColor: "rgba(0,0,0,.85)",
                borderWidth: 0,
                style: { color: "#fff" },
                formatter: function () {
                    let s = "<b>" + this.x + "</b>";
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
            series: seriesPerformance.map((s) => ({
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
                height: 240,
                spacing: [0, 0, 0, 0],
                events: {
                    load: function () {
                        // ---- draw circular (arced) text labels ----
                        const chart = this;
                        const ax = chart.xAxis[0];
                        const cats = ax.categories;
                        const n = cats.length;

                        // polar center & radius
                        const [cx, cy, r] = chart.series[0].center; // [x, y, radius, innerR]
                        const radius = r * 1.02; // just outside the grid
                        const sweepFrac = 0.6; // how wide each arc is (0..1 of its sector)

                        // ensure a <defs/> exists
                        const defs =
                            chart.renderer.defs ||
                            chart.renderer.createElement("defs").add();

                        // hide default labels
                        if (ax.labelGroup) ax.labelGroup.attr({ opacity: 0 });

                        for (let i = 0; i < n; i++) {
                            const mid = (i / n) * 2 * Math.PI; // center angle of the sector
                            const halfSweep =
                                ((Math.PI * 2) / n) * (sweepFrac / 2);
                            const start = mid - halfSweep;
                            const end = mid + halfSweep;

                            const x1 = cx + radius * Math.cos(start);
                            const y1 = cy + radius * Math.sin(start);
                            const x2 = cx + radius * Math.cos(end);
                            const y2 = cy + radius * Math.sin(end);

                            // SVG arc path
                            const d = [
                                "M",
                                x1,
                                y1,
                                "A",
                                radius,
                                radius,
                                0,
                                end - start > Math.PI ? 1 : 0,
                                1,
                                x2,
                                y2,
                            ];

                            const id = `arc-${i}-${Date.now()}`;
                            chart.renderer
                                .createElement("path")
                                .attr({ id, d })
                                .add(defs);

                            const text = chart.renderer.text("").add(); // container for textPath
                            chart.renderer
                                .createElement("textPath")
                                .attr({
                                    href: `#${id}`,
                                    startOffset: "50%",
                                    "text-anchor": "middle",
                                })
                                .add(text)
                                .element.appendChild(
                                    document.createTextNode(cats[i]),
                                );

                            // style the text
                            text.css({
                                fontSize: "11px",
                                fontWeight: "600",
                                letterSpacing: "1px",
                                fill: "#E5E7EB",
                            });
                        }
                    },
                },
            },
            title: { text: undefined },

            // faint bands; keep or remove as you like
            pane: {
                size: "80%",
                background: [
                    {
                        outerRadius: "100%",
                        backgroundColor: "rgba(255,255,255,0.02)",
                    },
                    {
                        outerRadius: "80%",
                        backgroundColor: "rgba(255,255,255,0.00)",
                    },
                    {
                        outerRadius: "60%",
                        backgroundColor: "rgba(255,255,255,0.02)",
                    },
                    {
                        outerRadius: "40%",
                        backgroundColor: "rgba(255,255,255,0.00)",
                    },
                    {
                        outerRadius: "20%",
                        backgroundColor: "rgba(255,255,255,0.02)",
                    },
                ],
            },

            xAxis: {
                categories: radar.categories,
                tickmarkPlacement: "on",
                lineWidth: 0,
                labels: { enabled: false }, // hide; we draw custom arced labels
                gridLineColor: "#2b323b",
                gridLineWidth: 1,
            },
            yAxis: {
                gridLineInterpolation: "circle",
                min: 0,
                max: 100,
                tickInterval: 20,
                labels: { enabled: false },
                gridLineColor: "#2b323b",
                gridLineWidth: 1,
            },
            legend: { enabled: false },
            tooltip: { enabled: false },
            plotOptions: {
                series: {
                    marker: { enabled: false },
                    animation: false,
                    pointPlacement: "on",
                    linecap: "round",
                    states: { inactive: { opacity: 1 } },
                },
            },
            series: [
                {
                    type: "areaspline",
                    data: radar.values,
                    color: "#F0E000",
                    lineColor: "#FFE84A",
                    lineWidth: 2,
                    fillOpacity: 0.45,
                },
            ],
        };
    }

    onMount(async () => {
        await getPortfolioData();
    });
    buildRadar();
</script>

<!-- Page -->
<section class="w-full overflow-hidden">
    <div class="mx-auto w-full">
        <!-- Top Nav Mimic -->
        <div class="flex items-center gap-2 text-sm">
            <span
                class="px-3 py-1 rounded-full transition-all duration-50 ease-out border border-zinc-800 cursor-pointer bg-[#EEEEEE] dark:bg-secondary font-semibol"
                >Overview</span
            >
            <span
                class="cursor-pointer px-3 py-1 rounded-full transition-all duration-50 ease-out border border-zinc-800 text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary"
                >Returns</span
            >
            <span
                class="cursor-pointer px-3 py-1 rounded-full transition-all duration-50 ease-out border border-zinc-800 text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary"
                >Analysis</span
            >
            <span
                class="cursor-pointer px-3 py-1 rounded-full transition-all duration-50 ease-out border border-zinc-800 text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary"
                >Updates</span
            >
            <span
                class="cursor-pointer px-3 py-1 rounded-full transition-all duration-50 ease-out border border-zinc-800 text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary"
                >Dividends</span
            >
            <span
                class="cursor-pointer px-3 py-1 rounded-full transition-all duration-50 ease-out border border-zinc-800 text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-secondary"
                >Analysis</span
            >
        </div>

        <div class="flex flex-row items-start w-full space-x-3 mt-6">
            <!-- LEFT -->
            <div class="w-full">
                <!-- Header -->
                <div class="rounded-lg border border-zinc-800 p-5">
                    <div class="w-full overflow-hidden">
                        <header class="relative">
                            <!-- soft top gradient -->

                            <h2 class="relative m-0 text-[1rem] font-semibold">
                                Performance vs US Market
                            </h2>
                        </header>

                        <div class=" pt-3.5">
                            <!-- KPI strip -->
                            <div class="min-h-[45px] lg:min-h-[50px]">
                                <ul
                                    role="list"
                                    class="flex flex-row flex-wrap items-end gap-6 text-slate-900 dark:text-slate-100"
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
                                            <p
                                                class="m-0 text-xs text-slate-500 dark:text-slate-400"
                                            >
                                                <span
                                                    class="underline decoration-dotted underline-offset-2"
                                                    title="The total current value of your portfolio"
                                                >
                                                    Total Value
                                                </span>
                                                • {portfolioData?.length?.toLocaleString(
                                                    "en-US",
                                                )} assets
                                            </p>
                                        </div>
                                    </li>

                                    <!-- Unrealised Returns -->
                                    <li class="flex items-start gap-3">
                                        <div>
                                            <p
                                                class="m-0 text-xl font-semibold tracking-tight {unrealizedReturns >=
                                                0
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'}"
                                                data-testid="roi-value"
                                            >
                                                {formatCurrency(
                                                    unrealizedReturns,
                                                )}
                                            </p>
                                            <p
                                                class="m-0 text-xs text-slate-500 dark:text-slate-400"
                                            >
                                                <span
                                                    class="underline decoration-dotted underline-offset-2"
                                                    title="Unrealised gains/losses on open positions"
                                                >
                                                    Unrealised Returns
                                                </span>
                                                <span aria-hidden="true">
                                                    •
                                                </span>
                                                <span
                                                    aria-label="Return percentage"
                                                    class={unrealizedReturns >=
                                                    0
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-red-600 dark:text-red-400"}
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
                                                    $0
                                                </p>
                                                <p
                                                    class="m-0 text-sm font-medium text-slate-600 dark:text-slate-300"
                                                >
                                                    /yr
                                                </p>
                                            </div>
                                            <p
                                                class="m-0 text-xs text-slate-500 dark:text-slate-400"
                                            >
                                                <span
                                                    class="underline decoration-dotted underline-offset-2"
                                                    title="Estimated annual dividend income"
                                                >
                                                    Est. Dividends
                                                </span>
                                                • 0% Yield
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
                                class="flex items-center justify-center h-[260px] text-gray-500 dark:text-gray-400"
                            >
                                <p class="text-sm">
                                    Add shares and average price to view
                                    performance chart
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- RIGHT -->
            <div class="w-fit">
                <!-- Health + Radar -->
                <div class="rounded-lg border border-zinc-800 p-5">
                    <h3 class="text-[1rem] font-semibold">
                        Status: <span class="dark:text-green-400">Healthy</span>
                    </h3>
                    <p class="text-sm">
                        Your best strength is <span class=" font-semibold"
                            >Growth</span
                        >
                        and your biggest risk is
                        <span class="font-semibold">Fundamentals</span>.
                    </p>
                    <div class="">
                        <div use:highcharts={radarConfig}></div>
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
