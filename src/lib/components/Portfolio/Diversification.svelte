<script lang="ts">
    import highcharts from "$lib/highcharts";
    import { onMount } from "svelte";
    import { mode } from "mode-watcher";
    import { screenWidth } from "$lib/store.ts";
    import InfoModal from "$lib/components/InfoModal.svelte";

    export let data: any = null;

    // Use provided data
    $: portfolioData = data || [];

    // Calculate diversification metrics
    $: diversificationMetrics = calculateDiversificationMetrics(portfolioData);

    function calculateDiversificationMetrics(portfolio) {
        // Handle empty portfolio
        if (!portfolio || portfolio.length === 0) {
            return {
                hhi: 0,
                hhiScore: "good",
                numSectors: 0,
                numIndustries: 0,
                largestPosition: "0.0",
                largestPositionScore: "good",
                top3Concentration: "0.0",
                top5Concentration: "0.0",
                top5Score: "good",
            };
        }

        // Calculate HHI (Herfindahl-Hirschman Index)
        const hhi = portfolio.reduce((sum, item) => {
            return sum + Math?.pow(item.weight, 2);
        }, 0);

        // Count unique sectors and industries
        const sectors = new Set(portfolio.map((item) => item.sector));
        const industries = new Set(portfolio.map((item) => item.industry));

        // Find largest single position
        const largestPosition = Math.max(
            ...portfolio.map((item) => item.weight),
        );

        // Calculate top 3 and top 5 concentration
        const sortedWeights = [...portfolio]
            .map((item) => item.weight)
            .sort((a, b) => b - a);
        const top3 = sortedWeights.slice(0, 3).reduce((sum, w) => sum + w, 0);
        const top5 = sortedWeights.slice(0, 5).reduce((sum, w) => sum + w, 0);

        return {
            hhi: Math.round(hhi),
            hhiScore: getHHIScore(hhi),
            numSectors: sectors.size,
            numIndustries: industries.size,
            largestPosition: largestPosition.toFixed(1),
            largestPositionScore: getLargestPositionScore(largestPosition),
            top3Concentration: top3.toFixed(1),
            top5Concentration: top5.toFixed(1),
            top5Score: getTop5Score(top5),
        };
    }

    function getHHIScore(hhi: number) {
        if (hhi < 1500) return "good";
        if (hhi < 2500) return "moderate";
        return "poor";
    }

    function getLargestPositionScore(largest: number) {
        if (largest < 15) return "good";
        if (largest < 25) return "moderate";
        return "poor";
    }

    function getTop5Score(top5: number) {
        if (top5 < 50) return "good";
        if (top5 < 70) return "moderate";
        return "poor";
    }

    function getScoreColor(score: string) {
        if (score === "good") return "text-green-800 dark:text-green-400";
        if (score === "moderate") return "text-yellow-800 dark:text-yellow-400";
        return "text-red-800 dark:text-red-400";
    }

    function getScoreLabel(score: string) {
        if (score === "good") return "Well Diversified";
        if (score === "moderate") return "Moderately Concentrated";
        return "Highly Concentrated";
    }

    let sankeyConfig = null;

    function buildSankeyChart() {
        // Handle empty portfolio data
        if (!portfolioData || portfolioData.length === 0) {
            sankeyConfig = null;
            return;
        }

        // Process portfolio data to create Sankey diagram
        const sectorMap = new Map();
        const industryMap = new Map();
        const sankeyData = [];
        const nodes = [];

        // Define colors based on mode
        const nodeColor =
            $mode === "light"
                ? "rgba(59, 130, 246, 0.6)"
                : "rgba(59, 130, 246, 0.4)";
        const linkColor =
            $mode === "light"
                ? "rgba(59, 130, 246, 0.5)"
                : "rgba(59, 130, 246, 0.4)";

        // Add Portfolio node
        nodes.push({
            id: "Portfolio",
            color: nodeColor,
            column: 0,
        });

        let totalWeight = 0;
        portfolioData.forEach((item) => (totalWeight += item.weight));

        // Group by sector
        portfolioData.forEach((item) => {
            const sector = item.sector;
            if (!sectorMap.has(sector)) {
                sectorMap.set(sector, 0);
            }
            sectorMap.set(sector, sectorMap.get(sector) + item.weight);
        });

        // Group by industry
        portfolioData.forEach((item) => {
            const industry = item.industry;
            if (!industryMap.has(industry)) {
                industryMap.set(industry, 0);
            }
            industryMap.set(industry, industryMap.get(industry) + item.weight);
        });

        // Add sector nodes
        sectorMap.forEach((weight, sector) => {
            nodes.push({
                id: sector,
                color: nodeColor,
                column: 1,
            });
            sankeyData.push(["Portfolio", sector, weight]);
        });

        // Add industry nodes and connections
        portfolioData.forEach((item) => {
            const industryKey = `${item.sector}-${item.industry}`;
            if (!nodes.find((n) => n.id === industryKey)) {
                nodes.push({
                    id: industryKey,
                    name: item.industry,
                    color: "transparent",
                    column: 2,
                });
            }
            sankeyData.push([item.sector, industryKey, item.weight]);
        });

        // Add ticker nodes and connections
        portfolioData.forEach((item) => {
            const industryKey = `${item.sector}-${item.industry}`;
            nodes.push({
                id: item.symbol,
                color: nodeColor,
                column: 3,
            });
            sankeyData.push({
                from: industryKey,
                to: item.symbol,
                weight: item.weight,
                color: linkColor,
            });
        });

        const isMobile = $screenWidth < 768;
        const chartHeight = isMobile ? 500 : 650;
        const fontSize = isMobile ? "10px" : "12px";
        const nodePadding = isMobile ? 20 : 35;
        const spacing = isMobile ? [20, 10, 20, 10] : [30, 20, 30, 20];

        sankeyConfig = {
            credits: { enabled: false },
            chart: {
                backgroundColor: "transparent",
                height: chartHeight,
                spacing: spacing,
                animation: false,
            },
            title: {
                text: undefined,
            },
            accessibility: {
                point: {
                    valueDescriptionFormat:
                        "{index}. {point.from} to {point.to}, {point.weight}.",
                },
            },
            tooltip: {
                enabled: false,
            },
            plotOptions: {
                sankey: {
                    animation: false,
                    curveFactor: 0.6,
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
            series: [
                {
                    keys: ["from", "to", "weight"],
                    nodes: nodes,
                    data: sankeyData,
                    type: "sankey",
                    name: "Portfolio Diversification",
                    dataLabels: {
                        enabled: true,
                        style: {
                            color: $mode === "light" ? "#000" : "#fff",
                            fontSize: fontSize,
                            fontWeight: "500",
                            textOutline: "none",
                        },
                        nodeFormat: "{point.name} {point.sum:.1f}%",
                        format: undefined,
                    },
                    linkOpacity: 0.4,
                    nodeWidth: 0,
                    nodePadding: nodePadding,
                    minLinkWidth: 0,
                    states: {
                        hover: {
                            enabled: false,
                        },
                        inactive: {
                            enabled: false,
                        },
                    },
                    enableMouseTracking: true,
                },
            ],
        };
    }

    onMount(() => {
        buildSankeyChart();
    });

    // Rebuild chart when mode or screenWidth changes
    $: if (($mode || $screenWidth) && typeof window !== "undefined") {
        buildSankeyChart();
    }
</script>

<div class="w-full">
    <div class="mb-3 sm:mb-5">
        <h2 class="text-xl sm:text-2xl font-bold mb-2">Diversification</h2>
    </div>

    <!-- Diversification Metrics Panel -->
    <div class="mb-6">
        <div
            class="flex flex-col sm:flex-row sm:items-center justify-between mb-4"
        >
            <div class="flex items-center gap-3 mb-3 sm:mb-0">
                <h3 class="text-lg font-semibold">Portfolio Concentration</h3>
                {#if portfolioData?.length > 0}
                    <span
                        class="px-3 py-1 rounded-full text-sm font-medium {getScoreColor(
                            diversificationMetrics?.hhiScore,
                        )} border border-gray-300 dark:border-gray-600"
                    >
                        {getScoreLabel(diversificationMetrics.hhiScore)}
                    </span>
                {/if}
            </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- HHI Score -->
            <div class="shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4">
                <div class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center">
                    <span>HHI Score</span>
                    <InfoModal
                        id="hhi"
                        content="Herfindahl-Hirschman Index measures portfolio concentration. Lower scores indicate better diversification. HHI < 1500: Well diversified, 1500-2500: Moderate concentration, > 2500: High concentration."
                    />
                </div>
                <div class="flex items-baseline">
                    <span
                        class="text-xl font-semibold {portfolioData?.length !==
                        0
                            ? getScoreColor(diversificationMetrics.hhiScore)
                            : ''}"
                    >
                        {portfolioData?.length !== 0
                            ? diversificationMetrics?.hhi?.toLocaleString(
                                  "en-US",
                              )
                            : "n/a"}
                    </span>
                </div>
            </div>

            <!-- Sectors & Industries -->
            <div class="shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4">
                <div class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center">
                    <span>Sectors / Industries</span>
                    <InfoModal
                        id="sectors"
                        content="Number of unique sectors and industries in your portfolio. More sectors and industries generally indicate better diversification across different market segments."
                    />
                </div>
                <div class="flex items-baseline">
                    <span class="text-xl font-semibold">
                        {portfolioData?.length !== 0
                            ? diversificationMetrics.numSectors +
                              "/" +
                              diversificationMetrics.numIndustries
                            : "n/a"}
                    </span>
                </div>
            </div>

            <!-- Largest Position -->
            <div class="shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4">
                <div class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center">
                    <span>Largest Position</span>
                    <InfoModal
                        id="largest"
                        content="Percentage of your portfolio in the single largest holding. Generally, no single position should exceed 15-20% to maintain proper diversification and risk management."
                    />
                </div>
                <div class="flex items-baseline">
                    <span
                        class="text-xl font-semibold {portfolioData?.length !==
                        0
                            ? getScoreColor(
                                  diversificationMetrics.largestPositionScore,
                              )
                            : ''}"
                    >
                        {portfolioData?.length !== 0
                            ? diversificationMetrics?.largestPosition + "%"
                            : "n/a"}
                    </span>
                </div>
            </div>

            <!-- Top 5 Concentration -->
            <div class="shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4">
                <div class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center">
                    <span>Top 5 Holdings</span>
                    <InfoModal
                        id="top5"
                        content="Percentage of your portfolio in the top 5 largest holdings. Top 5 < 50%: Well diversified, 50-70%: Moderate concentration, > 70%: High concentration risk."
                    />
                </div>
                <div class="flex items-baseline">
                    <span
                        class="text-xl font-semibold {portfolioData?.length !==
                        0
                            ? getScoreColor(diversificationMetrics?.top5Score)
                            : ''}"
                    >
                        {portfolioData?.length !== 0
                            ? diversificationMetrics?.top5Concentration + "%"
                            : "n/a"}
                    </span>
                </div>
            </div>
        </div>
    </div>

    <!-- Column headers -->
    <div
        class="grid grid-cols-4 gap-2 sm:gap-4 mb-3 text-xs sm:text-sm font-medium text-muted dark:text-gray-400"
    >
        <div class="text-left">Portfolio</div>
        <div class="text-center">Sector</div>
        <div class="text-center">Industry</div>
        <div class="text-right">Ticker</div>
    </div>

    <!-- Sankey Chart -->
    <div class="w-full">
        {#if portfolioData?.length === 0}
            <div
                class="flex items-center justify-center h-[300px] text-muted dark:text-gray-400"
            >
                <div class="text-center">
                    <p class="text-lg font-medium mb-2">
                        No Portfolio Holdings
                    </p>
                    <p class="text-sm">
                        Add stocks to your portfolio to see diversification
                        analysis
                    </p>
                </div>
            </div>
        {:else if sankeyConfig}
            <div use:highcharts={sankeyConfig}></div>
        {:else}
            <div
                class="flex items-center justify-center h-[500px] sm:h-[650px] text-muted dark:text-gray-400"
            >
                <p class="text-sm">Loading diversification chart...</p>
            </div>
        {/if}
    </div>
</div>
