<script lang="ts">
    import { mode } from "mode-watcher";
    import highcharts from "$lib/highcharts.ts";
    import { abbreviateNumber } from "$lib/utils";

    export let plotData = {};
    export let symbol = "";

    const nameDict = {
        SPY: "S&P 500",
        QQQ: "NASDAQ",
        DIA: "DOW",
        IWM: "RUSSELL",
    };
    let changesPercentage = plotData?.changesPercentage || 0;
    let priceData = plotData?.price || [];
    let relativeVolume = plotData?.relativeVolume || 0;
    let bullPercentage = plotData?.bullPercentage || 0;
    let bearPercentage = plotData?.bearPercentage || 0;
    let bullPrem = plotData?.bullPrem || 0;
    let bearPrem = plotData?.bearPrem || 0;
    let config = null;

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
        <div
            class="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 border-b border-gray-200 dark:border-gray-700"
        >
            <div class="flex items-center gap-1 sm:gap-2">
                <span class="font-bold text-xs sm:text-sm"
                    >{nameDict[symbol]}</span
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

        <div class="flex flex-col">
            <div class="flex flex-row items-stretch pt-2">
                <div class="flex flex-col items-center -mr-6">
                    <div class="-ml-5 flex flex-row items-stretch h-[90px]">
                        <div
                            class="flex flex-col justify-between pr-1 text-[0.55rem] text-gray-500 dark:text-gray-400 select-none text-right w-4"
                        >
                            <div>2</div>
                            <div>1</div>
                            <div>0</div>
                        </div>
                        <div
                            class="relative w-1.5 bg-slate-200 dark:bg-slate-700/60 overflow-hidden"
                        >
                            <div
                                class="absolute bottom-0 left-0 right-0 bg-black dark:bg-blue-500 transition-all duration-500"
                                style="height: {Math.min(
                                    relativeVolume * 50,
                                    100,
                                )}%;"
                            ></div>
                        </div>
                    </div>
                    <div
                        class="ml-1 mb-1 mt-1 text-[0.4rem] sm:text-[0.5rem] uppercase tracking-tighter text-gray-500 font-bold"
                    >
                        Relative Vol
                    </div>
                </div>

                <div class="flex-1 h-[90px]" use:highcharts={config}></div>
            </div>

            <div
                class="h-[40px] sm:h-[50px] px-2 pt-1 pb-2 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-white/5"
            >
                <!-- top row -->
                <div
                    class="grid grid-cols-3 items-start gap-2 w-full h-5 sm:h-6 mb-1.5"
                >
                    <!-- left -->
                    <div
                        class="min-w-0 text-[0.6rem] sm:text-[0.7rem] leading-none"
                    >
                        <span class="py-0.5 block uppercase font-bold"
                            >Bull</span
                        >
                        <span
                            class="font-semibold text-green-600 dark:text-[#00FC50] whitespace-nowrap"
                        >
                            {bullPercentage}%
                            <span class="hidden sm:inline-block"
                                >({abbreviateNumber(bullPrem)})</span
                            >
                        </span>
                    </div>

                    <!-- center -->
                    <div
                        class="min-w-0 text-center text-[0.6rem] font-bold uppercase text-gray-400 leading-tight whitespace-nowrap"
                    >
                        Option Flow
                    </div>

                    <!-- right -->
                    <div
                        class="min-w-0 text-[0.6rem] sm:text-[0.7rem] leading-none text-right"
                    >
                        <span class=" py-0.5 block uppercase font-bold"
                            >Bear</span
                        >
                        <span
                            class="font-semibold text-red-600 dark:text-[#fa5157] whitespace-nowrap sm:-ml-4"
                        >
                            <span class="hidden sm:inline-block"
                                >({abbreviateNumber(bearPrem)})</span
                            >
                            {bearPercentage}%
                        </span>
                    </div>
                </div>

                <!-- bar -->
                <div
                    class="relative w-full h-1.5 bg-red-500 dark:bg-[#fa5157] rounded-full overflow-hidden"
                >
                    <div
                        class="h-full bg-green-500 dark:bg-[#00FC50] transition-all duration-700"
                        style="width: {bullPercentage}%"
                    ></div>
                </div>
            </div>
        </div>
    </div>
{/if}
