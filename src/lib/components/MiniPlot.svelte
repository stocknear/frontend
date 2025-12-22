<script lang="ts">
    import { mode } from "mode-watcher";
    import highcharts from "$lib/highcharts.ts";

    export let plotData = {};
    export let symbol = "";

    const nameDict = {
        SPY: "S&P 500",
        QQQ: "DOW",
        DIA: "NASDAQ",
        IWM: "RUSSELL",
    };
    let changesPercentage = plotData?.changesPercentage || 0;
    let priceData = plotData?.price || [];

    let config = null;

    // Format the date from the first data point
    function getFormattedDate() {
        if (!priceData?.length) return "";
        const date = new Date(priceData[0]?.time);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    }

    $: formattedDate = getFormattedDate();
    $: isPositive = changesPercentage >= 0;

    function chart(priceData) {
        const rawData = priceData || [];

        // Area chart data - just time and close price
        const seriesData = rawData?.map((item) => [
            Date.UTC(
                new Date(item?.time).getUTCFullYear(),
                new Date(item?.time).getUTCMonth(),
                new Date(item?.time).getUTCDate(),
                new Date(item?.time).getUTCHours(),
                new Date(item?.time).getUTCMinutes(),
                new Date(item?.time).getUTCSeconds(),
            ),
            item?.close,
        ]);

        // Find the lowest & highest values
        let minValue = Math?.min(
            ...rawData?.map((item) => item?.low ?? item?.close),
        );
        let maxValue = Math?.max(
            ...rawData?.map((item) => item?.high ?? item?.close),
        );

        let padding = 0.002;

        // Area colors based on positive/negative change (same as stocks page)
        const isNegative = changesPercentage < 0;

        const lineColor = isNegative
            ? "#CC261A"
            : $mode === "light"
              ? "#137547"
              : "#00FC50";

        const fillColorStart = isNegative
            ? "rgba(204, 38, 26, 0.6)"
            : "rgba(19, 117, 71, 0.6)";

        const fillColorEnd = isNegative
            ? "rgba(204, 38, 26, 0.01)"
            : "rgba(19, 117, 71, 0.01)";

        const baseDate =
            rawData && rawData?.length
                ? new Date(rawData?.at(0)?.time)
                : new Date();

        // Set the fixed start and end times (9:30 and 16:00)
        const startTime = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            9,
            30,
        ).getTime();
        const endTime = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            16,
            0,
        ).getTime();

        // Get the last close price for the price label
        const lastClose =
            rawData?.length > 0 ? rawData[rawData.length - 1]?.close : null;

        const options = {
            chart: {
                backgroundColor: "transparent",
                animation: false,
                height: null,
            },
            credits: { enabled: false },
            title: { text: null },
            xAxis: {
                type: "datetime",
                min: startTime,
                max: endTime,
                tickLength: 0,
                categories: null,
                crosshair: false,
                labels: {
                    style: {
                        color: $mode === "light" ? "#666" : "#999",
                        fontSize: "9px",
                    },
                    distance: 5,
                    formatter: function () {
                        const date = new Date(this?.value);
                        const timeString = date?.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            hour12: true,
                        });
                        return timeString.replace(/\s/g, "");
                    },
                },
                tickPositioner: function () {
                    const positions = [];
                    const info = this.getExtremes();
                    const tickCount = 3;
                    const interval = Math.floor(
                        (info.max - info.min) / tickCount,
                    );

                    for (let i = 0; i <= tickCount; i++) {
                        positions.push(info.min + i * interval);
                    }
                    return positions;
                },
            },
            tooltip: {
                enabled: false,
            },
            yAxis: [
                {
                    title: { text: null },
                    labels: {
                        style: {
                            color: $mode === "light" ? "#666" : "#999",
                            fontSize: "9px",
                        },
                        align: "left",
                        x: 3,
                    },

                    startOnTick: false,
                    endOnTick: false,
                    gridLineWidth: 1,
                    gridLineColor: $mode === "light" ? "#e5e7eb" : "#1f2937",
                    opposite: true,
                    offset: 0,
                },
            ],
            plotOptions: {
                series: {
                    animation: false,
                    marker: { enabled: false },
                    states: { hover: { enabled: false } },
                },
                area: {
                    animation: false,
                    lineWidth: 2,
                    threshold: null,
                    states: { hover: { enabled: false } },
                },
            },
            legend: { enabled: false },
            series: [
                {
                    name: "Price",
                    type: "area",
                    data: seriesData,
                    animation: false,
                    color: lineColor,
                    lineWidth: 1,
                    marker: { enabled: false },
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, fillColorStart],
                            [1, fillColorEnd],
                        ],
                    },
                },
            ],
        };

        return options;
    }

    config = chart(priceData);
</script>

{#if config}
    <div
        class="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#09090B] shadow overflow-hidden"
    >
        <!-- Header with ticker, date, and price change -->
        <div
            class="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 border-b border-gray-200 dark:border-gray-700"
        >
            <div class="flex items-center gap-1 sm:gap-2">
                <span class="font-bold text-xs sm:text-sm"
                    >{nameDict[symbol]}</span
                >
                <span
                    class="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs"
                    >{formattedDate}</span
                >
            </div>
            <div
                class="text-[10px] sm:text-xs font-semibold {isPositive
                    ? 'text-green-600 dark:text-[#00FC50]'
                    : 'text-red-600 dark:text-[#FF2F1F]'}"
            >
                ({isPositive ? "+" : ""}{changesPercentage?.toFixed(2)}%)
            </div>
        </div>
        <!-- Chart -->
        <div class="w-full h-[110px]" use:highcharts={config}></div>
    </div>
{/if}
