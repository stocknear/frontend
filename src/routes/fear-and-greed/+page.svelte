<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";
    import ArrowLogo from "lucide-svelte/icons/move-up-right";
    import { screenWidth } from "$lib/store";
    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";
    import Chevron from "lucide-svelte/icons/chevron-down";
    import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
    import { Button } from "$lib/components/shadcn/button/index.js";
    import DownloadData from "$lib/components/DownloadData.svelte";

    export let data;

    // Get data from server
    let currentValue = data?.getData?.current?.value || 50;
    let currentCategory = data?.getData?.current?.category || "Neutral";
    let lastUpdate = data?.getData?.current?.last_update;
    let historicalData = data?.getData?.historical || [];
    let insights = data?.getData?.insights || {};

    // Add timeframe selection
    let selectedTimeframe = "1Y"; // Default to 1 month
    let filteredHistoricalData = [];

    const safeValue = (daysAgo: number) => {
        const idx = historicalData.length - daysAgo;
        return idx >= 0 ? (historicalData[idx]?.value ?? null) : null;
    };

    const latestValue =
        historicalData?.[historicalData.length - 1]?.value ?? null;

    const changeFrom = (daysAgo: number) => {
        const past = safeValue(daysAgo);
        if (past == null || latestValue == null) return null;
        return latestValue - past;
    };

    function filterDataByTimeframe() {
        if (!historicalData || historicalData?.length === 0) {
            filteredHistoricalData = [];
            return;
        }

        const now = new Date();
        let cutoffDate = new Date();

        switch (selectedTimeframe) {
            case "1M":
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case "3M":
                cutoffDate.setMonth(now.getMonth() - 3);
                break;
            case "6M":
                cutoffDate.setMonth(now.getMonth() - 6);
                break;
            case "1Y":
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
            case "3Y":
                cutoffDate.setFullYear(now.getFullYear() - 3);
                break;
            default:
                cutoffDate.setMonth(now.getMonth() - 1); // Default to 1 month
        }

        filteredHistoricalData = historicalData?.filter(
            (item) => new Date(item?.date) >= cutoffDate,
        );
    }

    // Initial filter
    $: if (historicalData) {
        filterDataByTimeframe();
    }

    // Helper function to get color based on value
    function getColorForValue(value) {
        if (value <= 25) return "#8B0000"; // Extreme Fear - Dark Red
        if (value <= 45) return "#DC143C"; // Fear - Crimson
        if (value <= 55) return "#808080"; // Neutral - Gray
        if (value <= 75) return "#32CD32"; // Greed - Lime Green
        return "#006400"; // Extreme Greed - Dark Green
    }

    function createGaugeChart() {
        // Keep your existing helper (slightly extended to return border color as well)
        const inactiveColor = $mode === "light" ? "#EFEFEF" : "#2E2E2E";
        const getSegmentColor = (segmentName) => {
            if (currentValue <= 25 && segmentName === "extremeFear")
                return "#EA6A47";
            if (
                currentValue > 25 &&
                currentValue <= 45 &&
                segmentName === "fear"
            )
                return "#F89E4F";
            if (
                currentValue > 45 &&
                currentValue <= 55 &&
                segmentName === "neutral"
            )
                return "#FDDD5C";
            if (
                currentValue > 55 &&
                currentValue <= 75 &&
                segmentName === "greed"
            )
                return "#93D3C1";
            if (currentValue > 75 && segmentName === "extremeGreed")
                return "#5AC864";
            return inactiveColor;
        };

        // border color for the active band (mint outline shown on screenshot)
        const getBorderColor = (segmentName) => {
            // only return visible border for the currently active segment
            if (currentValue <= 25 && segmentName === "extremeFear")
                return "#D94A30";
            if (
                currentValue > 25 &&
                currentValue <= 45 &&
                segmentName === "fear"
            )
                return "#D87A2B";
            if (
                currentValue > 45 &&
                currentValue <= 55 &&
                segmentName === "neutral"
            )
                return "#CFAF2A";
            if (
                currentValue > 55 &&
                currentValue <= 75 &&
                segmentName === "greed"
            )
                return "#26A892"; // mint/teal border
            if (currentValue > 75 && segmentName === "extremeGreed")
                return "#47B84A";
            return "transparent";
        };

        const options = {
            credits: { enabled: false },
            chart: {
                type: "gauge",
                backgroundColor: $mode === "light" ? "#fff" : "#0f0f12",
                height: 360,
                animation: false, // disable chart-level animation
            },

            // Disable animations globally for series/gauge and disable hover states
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: { enabled: false },
                        inactive: { enabled: false },
                    },
                    dataLabels: {
                        animation: false,
                    },
                },
                gauge: {
                    animation: false,
                },
            },

            title: {
                text: `
    <div class="text-center mt-3 -mb-12">
        <!-- Circle wrapper -->
        <div
            class="w-[60px] h-[60px] sm:w-[100px] sm:h-[100px] rounded-full
                   ${
                       $mode === "light"
                           ? "bg-black shadow-[0_12px_20px_rgba(0,0,0,0.12)]"
                           : "bg-[#fff] shadow-[0_6px_16px_rgba(0,0,0,0.4)]"
                   }
                   flex items-center justify-center mx-auto"
        >
            <div class="text-2xl sm:text-3xl font-extrabold ${$mode === "light" ? "text-white" : "text-black"}">
                ${currentValue}
            </div>
        </div>

        <!-- Subtitle -->
        <div class="text-sm sm:hidden capitalize ${$mode === "light" ? "text-gray-800" : "text-gray-100"} mt-2">
            ${currentCategory}
        </div>
    </div>
    `,
                useHTML: true,
                verticalAlign: "middle",
                y: 70,
            },
            pane: {
                startAngle: -90,
                endAngle: 90,
                background: [
                    {
                        backgroundColor: "transparent",
                        borderWidth: 0,
                        outerRadius: "100%",
                    },
                    {
                        backgroundColor:
                            $mode === "light" ? "#ffffff" : "#18181b",
                        borderWidth: 0,
                        innerRadius: "60%",
                        outerRadius: "60%",
                        shape: "arc",
                    },
                ],
                center: ["50%", "75%"],
                size: "110%",
            },
            yAxis: {
                min: 0,
                max: 100,
                tickPositions: [0, 25, 50, 75, 100],
                minorTickInterval: null,
                tickLength: 0,
                tickWidth: 0,
                labels: {
                    distance: 20,
                    style: {
                        color: $mode === "light" ? "#6b7280" : "#d1d5db",
                        fontSize: "13px",
                        fontWeight: "600",
                    },
                    formatter: function () {
                        return [0, 25, 50, 75, 100].includes(this.value)
                            ? this.value
                            : "";
                    },
                },
                lineWidth: 0,
                plotBands: [
                    {
                        from: 0,
                        to: 25,
                        color: getSegmentColor("extremeFear"),
                        thickness: 36,
                        borderColor: getBorderColor("extremeFear"),
                        borderWidth:
                            getBorderColor("extremeFear") === "transparent"
                                ? 0
                                : 3,
                        label: {
                            text:
                                $screenWidth < 640 ? null : "EXTREME<br/>FEAR",
                            useHTML: true,
                            align: "center",
                            verticalAlign: "middle",
                            x: 40,
                            y: -22,
                            style: {
                                color:
                                    currentValue <= 25
                                        ? "#fff"
                                        : $mode === "light"
                                          ? "#000"
                                          : "#9ca3af",
                                fontSize: "16px",
                                fontWeight: "600",
                                textAlign: "center",
                            },
                        },
                    },
                    {
                        from: 25,
                        to: 45,
                        color: getSegmentColor("fear"),
                        thickness: 36,
                        borderColor: getBorderColor("fear"),
                        borderWidth:
                            getBorderColor("fear") === "transparent" ? 0 : 3,
                        label: {
                            text: $screenWidth < 640 ? null : "FEAR",
                            align: "center",
                            verticalAlign: "middle",
                            x: 55,
                            y: -44,
                            style: {
                                color:
                                    currentValue > 25 && currentValue <= 45
                                        ? "#fff"
                                        : $mode === "light"
                                          ? "#000"
                                          : "#9ca3af",
                                fontSize: "16px",
                                fontWeight: "600",
                            },
                        },
                    },
                    {
                        from: 45,
                        to: 55,
                        color: getSegmentColor("neutral"),
                        thickness: 36,
                        borderColor: getBorderColor("neutral"),
                        borderWidth:
                            getBorderColor("neutral") === "transparent" ? 0 : 3,
                        label: {
                            text: $screenWidth < 640 ? null : "NEUTRAL",
                            align: "center",
                            verticalAlign: "middle",
                            x: -200,
                            y: -40,
                            style: {
                                color:
                                    currentValue > 45 && currentValue <= 55
                                        ? $mode === "light"
                                            ? "#333"
                                            : "#e5e7eb"
                                        : $mode === "light"
                                          ? "#000"
                                          : "#9ca3af",
                                fontSize: "16px",
                                fontWeight: "600",
                            },
                        },
                    },
                    {
                        from: 55,
                        to: 75,
                        color: getSegmentColor("greed"),
                        thickness: 36,
                        borderColor: getBorderColor("greed"),
                        borderWidth:
                            getBorderColor("greed") === "transparent" ? 0 : 3,
                        label: {
                            text: $screenWidth < 640 ? null : "GREED",
                            align: "center",
                            verticalAlign: "middle",
                            x: -30,
                            y: -44,
                            style: {
                                color:
                                    currentValue > 55 && currentValue <= 75
                                        ? $mode === "light"
                                            ? "#333"
                                            : "#e5e7eb"
                                        : $mode === "light"
                                          ? "#000"
                                          : "#9ca3af",
                                fontSize: "16px",
                                fontWeight: "600",
                            },
                        },
                    },
                    {
                        from: 75,
                        to: 100,
                        color: getSegmentColor("extremeGreed"),
                        thickness: 36,
                        borderColor: getBorderColor("extremeGreed"),
                        borderWidth:
                            getBorderColor("extremeGreed") === "transparent"
                                ? 0
                                : 3,
                        label: {
                            text:
                                $screenWidth < 640 ? null : "EXTREME<br/>GREED",
                            useHTML: true,
                            align: "center",
                            verticalAlign: "middle",
                            x: -50,
                            y: -22,
                            style: {
                                color:
                                    currentValue > 75
                                        ? "#fff"
                                        : $mode === "light"
                                          ? "#000"
                                          : "#9ca3af",
                                fontSize: "16px",
                                fontWeight: "600",
                                textAlign: "center",
                            },
                        },
                    },
                ],
            },
            series: [
                {
                    name: "Fear & Greed",
                    data: [currentValue],
                    animation: false, // disable series-level animation
                    tooltip: { valueSuffix: "" },
                    dataLabels: { enabled: false, animation: false },
                    dial: {
                        radius: "80%",
                        backgroundColor: $mode === "light" ? "#161616" : "#fff", // black vs golden needle
                        baseWidth: 10,
                        baseLength: "10%",
                        rearLength: "-10%",
                        topWidth: 1,
                    },
                    pivot: {
                        backgroundColor: $mode === "light" ? "#fff" : "#1f2937",
                        radius: 6,
                        borderColor: $mode === "light" ? "#000" : "#e5e7eb",
                        borderWidth: 1,
                    },
                    states: {
                        hover: { enabled: false },
                    },
                },
            ],
            tooltip: { enabled: false },
        };

        return options;
    }

    // Historical Line Chart Configuration
    function createHistoricalChart() {
        // Prepare data for chart - use filtered data instead of all historical data
        const chartData = filteredHistoricalData?.map((item) => ({
            x: new Date(item.date).getTime(),
            y: item.value,
            color: getColorForValue(item.value),
        }));

        // Prepare SPY data for secondary axis - use filtered data
        const spyData = filteredHistoricalData
            ?.filter((item) => item?.spy_close)
            ?.map((item) => ({
                x: new Date(item.date).getTime(),
                y: item?.spy_close,
            }));

        const options = {
            credits: {
                enabled: false,
            },
            chart: {
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 360,
                animation: false,
            },
            title: {
                text: null,
                style: {
                    color: $mode === "light" ? "black" : "white",
                    // Using inline CSS for margin-top and margin-bottom
                },
                useHTML: true, // Enable HTML to apply custom class styling
            },

            xAxis: {
                type: "datetime",
                gridLineWidth: 0,
                lineWidth: 2,
                lineColor: $mode === "light" ? "#E5E7EB" : "#374151",
                tickLength: 8,
                tickColor: $mode === "light" ? "#E5E7EB" : "#374151",
                labels: {
                    style: {
                        color: $mode === "light" ? "#374151" : "#D1D5DB",
                        fontSize: "12px",
                        fontWeight: "500",
                    },
                    distance: 15,
                },
                title: {
                    text: "Date",
                    style: {
                        color: $mode === "light" ? "#374151" : "#D1D5DB",
                        fontSize: "12px",
                        fontWeight: "600",
                    },
                },
            },
            yAxis: [
                {
                    min: 0,
                    max: 100,
                    title: {
                        text: $screenWidth < 640 ? null : "Fear & Greed Index",
                        style: {
                            color: $mode === "light" ? "#374151" : "#D1D5DB",
                            fontSize: "12px",
                            fontWeight: "600",
                        },
                    },
                    gridLineWidth: 1,
                    gridLineColor: $mode === "light" ? "#F3F4F6" : "#1F2937",
                    lineWidth: 1,
                    lineColor: $mode === "light" ? "#E5E7EB" : "#374151",
                    tickLength: 8,
                    tickColor: $mode === "light" ? "#E5E7EB" : "#374151",
                    labels: {
                        style: {
                            color: $mode === "light" ? "#374151" : "#D1D5DB",
                            fontSize: $screenWidth < 640 ? "0px" : "12px",
                            fontWeight: "500",
                        },
                        distance: 15,
                    },
                    plotBands: [
                        {
                            from: 0,
                            to: 25,
                            color:
                                $mode === "light"
                                    ? "rgba(220, 38, 38, 0.08)"
                                    : "rgba(220, 38, 38, 0)",
                            label: {
                                text: "Extreme Fear",
                                align: "right",
                                x: -10,
                                style: {
                                    color:
                                        $mode === "light"
                                            ? "#DC2626"
                                            : "#EF4444",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                },
                            },
                        },
                        {
                            from: 25,
                            to: 45,
                            color:
                                $mode === "light"
                                    ? "rgba(251, 146, 60, 0.08)"
                                    : "rgba(251, 146, 60, 0)",
                            label: {
                                text: "Fear",
                                align: "right",
                                x: -10,
                                style: {
                                    color:
                                        $mode === "light"
                                            ? "#EA580C"
                                            : "#FB923C",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                },
                            },
                        },
                        {
                            from: 45,
                            to: 55,
                            color:
                                $mode === "light"
                                    ? "rgba(107, 114, 128, 0.08)"
                                    : "rgba(107, 114, 128, 0)",
                            label: {
                                text: "Neutral",
                                align: "right",
                                x: -10,
                                style: {
                                    color:
                                        $mode === "light"
                                            ? "#6B7280"
                                            : "#9CA3AF",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                },
                            },
                        },
                        {
                            from: 55,
                            to: 75,
                            color:
                                $mode === "light"
                                    ? "rgba(34, 197, 94, 0.08)"
                                    : "rgba(34, 197, 94, 0)",
                            label: {
                                text: "Greed",
                                align: "right",
                                x: -10,
                                style: {
                                    color:
                                        $mode === "light"
                                            ? "#16A34A"
                                            : "#22C55E",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                },
                            },
                        },
                        {
                            from: 75,
                            to: 100,
                            color:
                                $mode === "light"
                                    ? "rgba(21, 128, 61, 0.08)"
                                    : "rgba(21, 128, 61, 0)",
                            label: {
                                text: "Extreme Greed",
                                align: "right",
                                x: -10,
                                style: {
                                    color:
                                        $mode === "light"
                                            ? "#15803D"
                                            : "#16A34A",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                },
                            },
                        },
                    ],
                },
                {
                    title: {
                        text: $screenWidth < 640 ? null : "SPY Price",
                        style: {
                            color: $mode === "light" ? "#374151" : "#D1D5DB",
                            fontSize: "12px",
                            fontWeight: "600",
                        },
                    },
                    labels: {
                        style: {
                            color: $mode === "light" ? "#374151" : "#D1D5DB",
                            fontSize: $screenWidth < 640 ? "0px" : "12px",
                            fontWeight: "500",
                        },
                    },
                    opposite: true,
                    gridLineWidth: 0,
                },
            ],
            tooltip: {
                shared: true,
                useHTML: true,
                backgroundColor: "rgba(0, 0, 0, 1)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                style: {
                    color: "#fff",
                    fontSize: "16px",
                    padding: "10px",
                },
                borderRadius: 4,
                formatter: function () {
                    const date = new Date(this.x);
                    const dateStr = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                    });

                    let tooltipContent = `
                        <span class="m-auto text-[1rem] font-[501]">${dateStr}</span> <br>`;

                    this.points.forEach((point) => {
                        if (point.series.name === "Fear & Greed Index") {
                            const value = point.y;
                            let category = "Neutral";
                            let categoryColor = "#6B7280";

                            if (value <= 25) {
                                category = "Extreme Fear";
                                categoryColor = "#DC2626";
                            } else if (value <= 45) {
                                category = "Fear";
                                categoryColor = "#EA580C";
                            } else if (value <= 55) {
                                category = "Neutral";
                                categoryColor = "#6B7280";
                            } else if (value <= 75) {
                                category = "Greed";
                                categoryColor = "#16A34A";
                            } else {
                                category = "Extreme Greed";
                                categoryColor = "#15803D";
                            }

                            tooltipContent += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${categoryColor};"></div>
                                <span class="font-semibold text-sm">Fear & Greed: ${value}</span>
                            </div>`;
                        } else if (point.series.name === "SPY Price") {
                            tooltipContent += `<div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${$mode === "light" ? "#000000" : "#FFFFFF"};"></div>
                                <span class="font-semibold text-sm">SPY: $${point.y.toFixed(2)}</span>
                            </div>`;
                        }
                    });

                    tooltipContent += `</div>`;
                    return tooltipContent;
                },
            },
            plotOptions: {
                line: {
                    marker: {
                        enabled: false,
                        radius: 2,
                        fillColor: "#ffffff",
                        lineWidth: 2,
                    },
                    animation: false,
                },
            },
            series: [
                {
                    name: "Fear & Greed Index",
                    data: chartData,
                    yAxis: 0,
                    zIndex: 2,
                    zones: [
                        { value: 25, color: "#DC2626", opacity: 0.1 },
                        { value: 45, color: "#EA580C" },
                        { value: 55, color: "#6B7280" },
                        { value: 75, color: "#16A34A" },
                        { color: "#15803D" },
                    ],
                },
                {
                    name: "SPY Price",
                    data: spyData,
                    yAxis: 1,
                    type: "line",
                    color: $mode === "light" ? "#000000" : "#FFFFFF",
                    lineWidth: 1,
                    zIndex: 1,
                    marker: {
                        enabled: false,
                    },
                    tooltip: {
                        pointFormat:
                            '<span style="color: {series.color};">●</span> SPY: <b>${point.y:.2f}</b><br/>',
                    },
                },
            ],
            legend: {
                enabled: true,
                align: "center", // left side
                verticalAlign: "top", // top edge
                layout: "horizontal",
                squareSymbol: false, // use our rectangle shape
                symbolWidth: 20,
                symbolHeight: 12,
                symbolRadius: 0,

                itemStyle: {
                    color: $mode === "light" ? "black" : "white",
                },
            },
        };
        return options;
    }

    let gaugeConfig = null;
    let historicalConfig = null;

    $: {
        if ($mode && currentValue && typeof window !== "undefined") {
            gaugeConfig = createGaugeChart();
        }
    }

    // Update historical chart when timeframe or data changes
    $: {
        if ($mode && filteredHistoricalData && typeof window !== "undefined") {
            historicalConfig = createHistoricalChart();
        }
    }
</script>

<SEO
    title="Fear & Greed Index - Market Sentiment Indicator"
    description="Track the Fear & Greed Index in real-time. Monitor market sentiment with our comprehensive gauge showing extreme fear to extreme greed levels, historical trends, and detailed analytics."
    keywords="fear and greed index, market sentiment, investor sentiment, market psychology, CNN fear greed, stock market sentiment, market indicators, fear gauge, greed indicator"
    structuredData={{
        "@context": "https://schema.org",
        "@type": "FinancialProduct",
        name: "Fear & Greed Index",
        description: "Real-time Fear & Greed Index tracking market sentiment",
        provider: {
            "@type": "Organization",
            name: "Stocknear",
        },
    }}
/>
<section
    class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
    <div class="w-full overflow-hidden m-auto mt-5">
        <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
            <div
                class="relative flex justify-center items-start overflow-hidden w-full"
            >
                <main class="w-full lg:w-3/4 lg:pr-5">
                    <div class="mb-3">
                        <h1 class="mb-1 text-2xl sm:text-3xl font-bold">
                            Fear &amp; Greed Index
                        </h1>
                    </div>

                    <p class="mb-5">
                        Market sentiment indicator showing <strong
                            class="capitalize">{currentCategory}</strong
                        >
                        at
                        <strong>{currentValue}</strong> as of
                        <strong
                            >{new Date(lastUpdate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}</strong
                        >. Higher values suggest market euphoria and potential
                        selling opportunities, while lower values indicate
                        market panic and potential buying opportunities.
                    </p>

                    <div class="">
                        <div use:highcharts={gaugeConfig}></div>
                    </div>

                    <!-- Statistics Grid -->
                    <div
                        class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-8"
                    >
                        {#each [{ label: "1W ago", days: 7 }, { label: "1M ago", days: 30 }, { label: "3M ago", days: 90 }, { label: "1Y ago", days: 365 }] as period}
                            <div
                                class="shadow bg-gray-100 dark:bg-[#1C1E22] rounded p-4"
                            >
                                <div
                                    class="dark:text-[#c3c6d0] text-sm mb-2 flex items-center"
                                >
                                    <span>{period.label}</span>
                                </div>
                                <div class="flex flex-row items-center">
                                    {#if historicalData.length >= period.days}
                                        {@const pastValue = safeValue(
                                            period.days,
                                        )}
                                        {@const change = changeFrom(
                                            period.days,
                                        )}
                                        <span class="text-xl font-bold"
                                            >{pastValue.toFixed(0)}</span
                                        >
                                        <div class="ml-1">
                                            {#if change > 0}
                                                <Chevron
                                                    class="size-5 text-green-800 dark:text-green-400  rotate-180"
                                                />
                                            {:else if change < 0}
                                                <Chevron
                                                    class="size-5 mt-1 text-red-800 dark:text-red-400 "
                                                />
                                            {/if}
                                        </div>

                                        <span
                                            class="text-lg font-semibold {change >
                                            0
                                                ? "before:content-['+'] text-green-800 dark:text-green-400"
                                                : change < 0
                                                  ? 'text-red-800 dark:text-red-400'
                                                  : ''}"
                                        >
                                            {change?.toFixed(0)}
                                        </span>
                                    {:else}
                                        <span class="text-xl font-bold"
                                            >n/a</span
                                        >
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                    <!-- Historical Chart -->

                    <div
                        class="mb-3 mt-10 flex flex-col sm:flex-row items-start sm:items-center w-full border-t border-b border-gray-300 dark:border-gray-800 py-2"
                    >
                        <h2 class="mb-3 sm:mb-0 text-xl sm:text-2xl font-bold">
                            Historical Comparison
                        </h2>

                        <div
                            class="flex flex-row items-center w-fit sm:w-[50%] md:w-auto sm:ml-auto"
                        >
                            <div
                                class="timeframe-toggle-driver relative inline-block text-left grow mr-2"
                            >
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild let:builder>
                                        <Button
                                            builders={[builder]}
                                            class="w-full  border-gray-300 dark:border-gray-600 border bg-black text-white sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary ease-out  flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                                        >
                                            <span
                                                class="truncate text-xs sm:text-sm"
                                                >{selectedTimeframe}</span
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
                                            Select time frame
                                        </DropdownMenu.Label>
                                        <DropdownMenu.Separator />
                                        <DropdownMenu.Group>
                                            <DropdownMenu.Item
                                                on:click={() => {
                                                    selectedTimeframe = "1M";
                                                    filterDataByTimeframe();
                                                }}
                                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                            >
                                                1 Month
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                on:click={() => {
                                                    selectedTimeframe = "3M";
                                                    filterDataByTimeframe();
                                                }}
                                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                            >
                                                3 Months
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                on:click={() => {
                                                    selectedTimeframe = "6M";
                                                    filterDataByTimeframe();
                                                }}
                                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                            >
                                                6 Months
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                on:click={() => {
                                                    selectedTimeframe = "1Y";
                                                    filterDataByTimeframe();
                                                }}
                                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                            >
                                                1 Year
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                on:click={() => {
                                                    selectedTimeframe = "3Y";
                                                    filterDataByTimeframe();
                                                }}
                                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                            >
                                                3 Years
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Group>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </div>
                            <DownloadData
                                {data}
                                rawData={historicalData}
                                title={`fear_and_greed_index_data`}
                            />
                        </div>
                    </div>

                    <p class="mb-5 mt-6">
                        {#if filteredHistoricalData && filteredHistoricalData.length > 0}
                            Over the past <strong>{selectedTimeframe}</strong>,
                            the Fear & Greed Index averaged
                            <strong
                                >{(
                                    filteredHistoricalData.reduce(
                                        (sum, item) => sum + item.value,
                                        0,
                                    ) / filteredHistoricalData.length
                                ).toFixed(1)}</strong
                            >
                            with a high of
                            <strong
                                >{Math.max(
                                    ...filteredHistoricalData.map(
                                        (d) => d.value,
                                    ),
                                )}</strong
                            >
                            and a low of
                            <strong
                                >{Math.min(
                                    ...filteredHistoricalData.map(
                                        (d) => d.value,
                                    ),
                                )}</strong
                            >.
                            {#if insights?.correlation_percent}
                                Historical correlation with SPY is <strong
                                    >{insights?.correlation_percent}%</strong
                                >.
                            {/if}
                        {:else}
                            Historical data shows a <strong
                                >{insights?.correlation_percent}%</strong
                            >
                            correlation between
                            <strong>Fear & Greed Index</strong>
                            and <strong>SPY</strong>. Extreme fear readings
                            below 10 averaged
                            <strong>{insights?.extreme_fear_avg_return}%</strong
                            >
                            SPY gains over 30 days vs
                            <strong
                                >{insights?.extreme_greed_avg_return}%</strong
                            >
                            during extreme greed periods.
                        {/if}
                    </p>
                    <div class="mt-4">
                        <div use:highcharts={historicalConfig}></div>
                    </div>

                    <!-- end statistics grid -->
                </main>
                <!-- end main -->

                <!-- Right Column - Recent Readings & Info -->
                <aside class="hidden lg:block relative w-1/4 ml-4">
                    <div
                        class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
                    >
                        <a
                            href="/market-flow"
                            class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
                        >
                            <div
                                class="w-full flex justify-between items-center p-3 mt-3"
                            >
                                <h2 class="text-start text-xl font-bold ml-3">
                                    Market Flow
                                </h2>
                                <ArrowLogo
                                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                                />
                            </div>
                            <span class="p-3 ml-3 mr-3"
                                >Realtime Market Sentiment based on Options
                                Data.</span
                            >
                        </a>
                    </div>

                    <div
                        class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
                    >
                        <a
                            href="/heatmap"
                            class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
                        >
                            <div
                                class="w-full flex justify-between items-center p-3 mt-3"
                            >
                                <h2 class="text-start text-xl font-bold ml-3">
                                    Market Heatmap
                                </h2>
                                <ArrowLogo
                                    class="w-8 h-8 mr-3 shrink-0 text-gray-400 dark:text-white"
                                />
                            </div>
                            <span class="p-3 ml-3 mr-3"
                                >Realtime market performance overview.</span
                            >
                        </a>
                    </div>
                </aside>
            </div>
            <!-- end relative flex container -->
        </div>
        <!-- end center wrapper -->
    </div>
    <!-- end outer wrapper -->
</section>
