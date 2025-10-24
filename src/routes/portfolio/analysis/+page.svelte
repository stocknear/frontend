<script lang="ts">
    import highcharts from "$lib/highcharts";
    import { onMount } from "svelte";
    import { mode } from "mode-watcher";
    import { screenWidth } from "$lib/store.ts";

    export let data;

    // Mock portfolio data for demonstration
    let portfolioData = [
        {
            symbol: "PLS",
            sector: "Materials",
            industry: "Metals and Mining",
            weight: 0.6,
        },
        {
            symbol: "GEV",
            sector: "Industrials",
            industry: "Electrical",
            weight: 4.4,
        },
        {
            symbol: "UNH",
            sector: "Healthcare",
            industry: "Healthcare Services",
            weight: 2.1,
        },
        {
            symbol: "JNJ",
            sector: "Healthcare",
            industry: "Pharma",
            weight: 2.8,
        },
        {
            symbol: "XOM",
            sector: "Energy",
            industry: "Oil and Gas",
            weight: 7.0,
        },
        {
            symbol: "BATS",
            sector: "Consumer Staples",
            industry: "Tobacco",
            weight: 10.6,
        },
        { symbol: "JPM", sector: "Financials", industry: "Banks", weight: 6.8 },
        { symbol: "BAC", sector: "Financials", industry: "Banks", weight: 6.7 },
        {
            symbol: "AMZN",
            sector: "Consumer Discretionary",
            industry: "General Merchandise and Department Stores",
            weight: 3.7,
        },
        {
            symbol: "TSLA",
            sector: "Consumer Discretionary",
            industry: "Auto",
            weight: 13.3,
        },
        {
            symbol: "META",
            sector: "Telecom",
            industry: "Interactive Media and Services",
            weight: 18.4,
        },
        {
            symbol: "NVDA",
            sector: "Telecom",
            industry: "Semiconductors",
            weight: 2.2,
        },
    ];

    let sankeyConfig = null;

    function buildSankeyChart() {
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

<section class="w-full overflow-hidden mt-5">
    <div class="mx-auto w-full">
        <div
            class="rounded-lg border border-gray-300 dark:border-gray-800 p-3 sm:p-5"
        >
            <div class="mb-3 sm:mb-5">
                <h2 class="text-xl sm:text-2xl font-bold mb-2">
                    Diversification
                </h2>
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
                {#if sankeyConfig}
                    <div use:highcharts={sankeyConfig}></div>
                {:else}
                    <div
                        class="flex items-center justify-center h-[500px] sm:h-[650px] text-gray-500 dark:text-gray-400"
                    >
                        <p class="text-sm">Loading diversification chart...</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</section>
