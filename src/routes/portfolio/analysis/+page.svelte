<script lang="ts">
    import highcharts from "$lib/highcharts";
    import { onMount } from "svelte";
    import { mode } from "mode-watcher";

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
        { symbol: "PLTR", sector: "Tech", industry: "Software", weight: 7.1 },
        { symbol: "CRWD", sector: "Tech", industry: "Software", weight: 7.1 },
        { symbol: "IREN", sector: "Tech", industry: "Software", weight: 7.1 },
    ];

    let sankeyConfig = null;

    function buildSankeyChart() {
        // Process portfolio data to create Sankey diagram
        const sectorMap = new Map();
        const industryMap = new Map();
        const sankeyData = [];
        const nodes = [];

        // Add Portfolio node
        nodes.push({
            id: "Portfolio",
            color: "#3B82F6",
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
                color: "#3B82F6",
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
                    color: "#3B82F6",
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
                color: "#3B82F6",
                column: 3,
            });
            sankeyData.push([industryKey, item.symbol, item.weight]);
        });

        sankeyConfig = {
            credits: { enabled: false },
            chart: {
                backgroundColor: "transparent",
                height: 700,
                spacing: [20, 20, 20, 20],
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
                backgroundColor: "rgba(0,0,0,0.9)",
                borderWidth: 0,
                borderRadius: 8,
                style: {
                    color: "#fff",
                    fontSize: "13px",
                },
                headerFormat: null,
                pointFormat:
                    "{point.fromNode.name} \u2192 {point.toNode.name}: {point.weight:.1f}%",
                nodeFormat: "{point.name}: {point.sum:.1f}%",
            },
            plotOptions: {
                sankey: {
                    animation: false,
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
                            color: $mode === "dark" ? "#E5E7EB" : "#1F2937",
                            fontSize: "12px",
                            fontWeight: "500",
                            textOutline: "none",
                        },
                        nodeFormat: "{point.name} {point.sum:.1f}%",
                        format: undefined,
                    },
                    linkOpacity: 0.5,
                    nodeWidth: 20,
                    nodePadding: 10,
                },
            ],
        };
    }

    onMount(() => {
        buildSankeyChart();
    });

    // Rebuild chart when mode changes
    $: if ($mode && typeof window !== "undefined") {
        buildSankeyChart();
    }
</script>

<section class="w-full overflow-hidden mt-5">
    <div class="mx-auto w-full">
        <div class="rounded-lg border border-zinc-800 p-5">
            <div class="mb-5">
                <h2 class="text-2xl font-bold mb-2">Diversification</h2>
                <h3 class="text-lg font-semibold flex items-center gap-2">
                    Diversification across Industries
                    <svg
                        class="w-4 h-4 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </h3>
            </div>

            <!-- Column headers -->
            <div
                class="grid grid-cols-4 gap-4 mb-3 text-sm font-medium text-gray-400"
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
                        class="flex items-center justify-center h-[700px] text-gray-500 dark:text-gray-400"
                    >
                        <p class="text-sm">Loading diversification chart...</p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</section>
