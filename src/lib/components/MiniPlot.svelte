<script lang="ts">
    import { mode } from "mode-watcher";
    import highcharts from "$lib/highcharts.ts";

    export let plotData = {};
    export let symbol = "";

    let changesPercentage = plotData?.changesPercentage || 0;
    let change = plotData?.change || 0;
    let dayLow = plotData?.dayLow || 650;
    let previousClose = plotData?.previousClose || 600;
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

        // Candlestick OHLC data
        const seriesData = rawData?.map((item) => [
            Date.UTC(
                new Date(item?.time).getUTCFullYear(),
                new Date(item?.time).getUTCMonth(),
                new Date(item?.time).getUTCDate(),
                new Date(item?.time).getUTCHours(),
                new Date(item?.time).getUTCMinutes(),
                new Date(item?.time).getUTCSeconds(),
            ),
            item?.open ?? item?.close,
            item?.high ?? Math.max(item?.open ?? item?.close, item?.close),
            item?.low ?? Math.min(item?.open ?? item?.close, item?.close),
            item?.close,
        ]);

        // Volume data
        const volumeData = rawData?.map((item) => [
            Date.UTC(
                new Date(item?.time).getUTCFullYear(),
                new Date(item?.time).getUTCMonth(),
                new Date(item?.time).getUTCDate(),
                new Date(item?.time).getUTCHours(),
                new Date(item?.time).getUTCMinutes(),
                new Date(item?.time).getUTCSeconds(),
            ),
            item?.volume ?? 0,
        ]);

        // Calculate average volume for relative volume
        const volumes = rawData?.map((item) => item?.volume ?? 0);
        const avgVolume =
            volumes?.length > 0
                ? volumes.reduce((a, b) => a + b, 0) / volumes.length
                : 1;

        // Relative volume data (volume / average volume)
        const relativeVolumeData = rawData?.map((item) => [
            Date.UTC(
                new Date(item?.time).getUTCFullYear(),
                new Date(item?.time).getUTCMonth(),
                new Date(item?.time).getUTCDate(),
                new Date(item?.time).getUTCHours(),
                new Date(item?.time).getUTCMinutes(),
                new Date(item?.time).getUTCSeconds(),
            ),
            avgVolume > 0 ? (item?.volume ?? 0) / avgVolume : 0,
        ]);

        // Find the lowest & highest values
        let minValue = Math?.min(
            ...rawData?.map((item) => item?.low ?? item?.close),
        );
        let maxValue = Math?.max(
            ...rawData?.map((item) => item?.high ?? item?.close),
        );

        let padding = 0.002;
        let yMin =
            minValue * (1 - padding) === 0 ? null : minValue * (1 - padding);
        let yMax =
            maxValue * (1 + padding) === 0 ? null : maxValue * (1 + padding);

        // Candlestick colors based on mode
        const candlestickColors = {
            color: $mode === "light" ? "pink" : "#FF2F1F",
            lineColor: $mode === "light" ? "red" : "#FF2F1F",
            upColor: $mode === "light" ? "lightgreen" : "#00FC50",
            upLineColor: $mode === "light" ? "green" : "#00FC50",
        };

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
                crosshair: {
                    color: $mode === "light" ? "black" : "white",
                    width: 1,
                    dashStyle: "Solid",
                },
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
                    // Price axis (right)
                    title: { text: null },
                    labels: {
                        style: {
                            color: $mode === "light" ? "#666" : "#999",
                            fontSize: "9px",
                        },
                        align: "left",
                        x: 3,
                    },
                    min: yMin ?? null,
                    max: yMax ?? null,
                    startOnTick: false,
                    endOnTick: false,
                    gridLineWidth: 1,
                    gridLineColor: $mode === "light" ? "#e5e7eb" : "#1f2937",
                    opposite: true,
                    offset: 0,
                    plotLines: [
                        {
                            value: previousClose,
                            dashStyle: "Dash",
                            color: $mode === "light" ? "#999" : "#555",
                            width: 0.8,
                        },
                        // Current price label
                        ...(lastClose
                            ? [
                                  {
                                      value: lastClose,
                                      color: "transparent",
                                      width: 0,
                                      label: {
                                          text: `<span style="background-color: #D4A017; color: #000; padding: 1px 4px; border-radius: 2px; font-size: 9px; font-weight: bold;">${lastClose?.toFixed(1)}</span>`,
                                          align: "right",
                                          x: 45,
                                          y: 3,
                                          useHTML: true,
                                      },
                                  },
                              ]
                            : []),
                    ],
                },
            ],
            plotOptions: {
                series: {
                    animation: false,
                    marker: { enabled: false },
                    states: { hover: { enabled: false } },
                },
                candlestick: {
                    animation: false,
                    lineWidth: 1,
                    states: { hover: { enabled: false } },
                    ...candlestickColors,
                },
                column: {
                    animation: false,
                    borderWidth: 0,
                    groupPadding: 0.1,
                    pointPadding: 0.05,
                },
            },
            legend: { enabled: false },
            series: [
                {
                    name: "Price",
                    type: "candlestick",
                    data: seriesData,
                    animation: false,
                    ...candlestickColors,
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
                <span class="font-bold text-xs sm:text-sm">{symbol}</span>
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
                {isPositive ? "+" : ""}{change?.toFixed(2)} ({isPositive
                    ? "+"
                    : ""}{changesPercentage?.toFixed(2)}%)
            </div>
        </div>
        <!-- Chart -->
        <div class="w-full h-[160px]" use:highcharts={config}></div>
    </div>
{/if}
