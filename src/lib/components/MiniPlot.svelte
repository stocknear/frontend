<script lang="ts">
    import { mode } from "mode-watcher";
    import highcharts from "$lib/highcharts.ts";

    export let data;

    let config = null;

    function plotData(priceData) {
        const rawData = priceData || [];

        const change =
            (rawData?.at(-1)?.close / rawData?.at(0)?.close - 1) * 100;

        const priceList = rawData?.map((item) => item?.close);
        const dateList = rawData?.map((item) =>
            Date.UTC(
                new Date(item?.time).getUTCFullYear(),
                new Date(item?.time).getUTCMonth(),
                new Date(item?.time).getUTCDate(),
                new Date(item?.time).getUTCHours(),
                new Date(item?.time).getUTCMinutes(),
            ),
        );

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

        // Find the lowest & highest close values
        let minValue = Math?.min(...rawData?.map((item) => item?.close));
        let maxValue = Math?.max(...rawData?.map((item) => item?.close));

        if (minValue - 0 < 1 && displayData === "1D") {
            //don't delete this sometimes 1D can't find minValue
            minValue = data?.getStockQuote?.dayLow;
        }

        let padding = 0.002;
        let yMin =
            minValue * (1 - padding) === 0 ? null : minValue * (1 - padding);
        let yMax =
            maxValue * (1 + padding) === 0 ? null : maxValue * (1 + padding);

        const isNegative =
            displayData === "1D"
                ? data?.getStockQuote?.changesPercentage < 0
                : change < 0;

        // Use the same green for line and gradient, but slightly darker line, lighter gradient
        const lineColor = isNegative
            ? "#CC261A" // keep red if negative if needed
            : $mode === "light"
              ? "#137547" // darker green line (adjusted from #047857)
              : "#00FC50"; // bright green for dark mode

        const fillColorStart = isNegative
            ? "rgba(204, 38, 26, 0.6)" // red fill if negative
            : "rgba(19, 117, 71, 0.6)"; // green fill start, same tone as lineColor but transparent

        const fillColorEnd = isNegative
            ? "rgba(204, 38, 26, 0.01)"
            : "rgba(19, 117, 71, 0.01)"; // fade out transparent to near 0 opacity

        const baseDate =
            rawData && rawData?.length
                ? new Date(rawData?.at(0)?.time)
                : new Date();

        // Set the fixed start and end times (9:30 and 16:10)
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

        const options = {
            chart: {
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                animation: false,
                height: 320,
                events: {
                    destroy: function () {
                        const chart: any = this;
                        chart.__rangeSelector?.destroy?.();
                        chart.__rangeSelector = null;
                    },
                    // Add touch event handling to hide tooltip on mobile
                    load: function () {
                        const chart = this;
                        let isTouching = false;

                        // Track touch start
                        chart.container.addEventListener("touchstart", () => {
                            isTouching = true;
                        });

                        // Track touch end
                        chart.container.addEventListener("touchend", () => {
                            isTouching = false;
                            chart.tooltip.hide();
                        });

                        // Track touch cancel
                        chart.container.addEventListener("touchcancel", () => {
                            isTouching = false;
                            chart.tooltip.hide();
                        });
                    },
                },
            },
            credits: { enabled: false },
            title: { text: null },
            tooltip: {
                shared: true,
                useHTML: true,
                backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
                borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
                borderWidth: 1,
                style: {
                    color: $mode === "light" ? "black" : "white",
                    fontSize: "16px",
                    padding: "10px",
                },
                borderRadius: 4,
                formatter: function () {
                    if (this.chart?.__rangeSelector?.selecting) {
                        return false;
                    }
                    const date = new Date(this?.x);
                    let formattedDate = date?.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    let tooltipContent = "";

                    // Loop through each point in the shared tooltip
                    this.points?.forEach((point) => {
                        tooltipContent += `<span class="text-white text-[1rem] font-[501]">${point.series.name}: ${point.y}</span><br>`;
                    });

                    // Append the formatted date at the end
                    tooltipContent += `<span class="text-white m-auto text-black text-sm font-normal">${formattedDate}</span><br>`;

                    return tooltipContent;
                },
            },

            xAxis: {
                type: "datetime",
                min: displayData === "1D" ? startTime : null,
                max: displayData === "1D" ? endTime : null,
                tickLength: 0,
                categories: displayData === "1D" ? null : dateList,
                crosshair: {
                    color: $mode === "light" ? "black" : "white",
                    width: 1,
                    dashStyle: "Solid",
                },
                labels: {
                    style: { color: $mode === "light" ? "black" : "white" },
                    distance: 10,
                    formatter: function () {
                        const date = new Date(this?.value);
                        if (displayData === "1D") {
                            const timeString = date?.toLocaleTimeString(
                                "en-US",
                                {
                                    hour: "numeric",
                                    hour12: true,
                                },
                            );
                            return `<span class=" text-xs">${timeString.replace(/\s/g, " ")}</span>`;
                        } else if (["1W", "1M"].includes(displayData)) {
                            const timeString = date?.toLocaleDateString(
                                "en-US",
                                {
                                    month: "short",
                                    day: "numeric",
                                    timeZone: "UTC",
                                },
                            );
                            return `<span class=" text-xs">${timeString}</span>`;
                        } else {
                            const timeString = date?.toLocaleDateString(
                                "en-US",
                                {
                                    year: "2-digit",
                                    month: "short",
                                    timeZone: "UTC",
                                },
                            );
                            return `<span class=" text-xs">${timeString}</span>`;
                        }
                    },
                },
                tickPositioner: function () {
                    // Create custom tick positions with wider spacing
                    const positions = [];
                    const info = this.getExtremes();
                    const tickCount = $screenWidth < 640 ? 2 : 5; // Reduce number of ticks displayed
                    const interval = Math.floor(
                        (info.max - info.min) / tickCount,
                    );

                    for (let i = 0; i <= tickCount; i++) {
                        positions.push(info.min + i * interval);
                    }
                    return positions;
                },
            },

            yAxis: {
                // Force y‑axis to stay near the actual data range
                min: yMin ?? null,
                max: yMax ?? null,
                startOnTick: false,
                endOnTick: false,
                gridLineWidth: 1,
                gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
                title: { text: null },
                labels: {
                    style: { color: $mode === "light" ? "black" : "white" },
                },
                opposite: true,
                // Add a dashed plot line at the previous close value
                plotLines: [
                    {
                        value:
                            displayData === "1D"
                                ? data?.getStockQuote?.previousClose
                                : priceData?.at(0)?.close,
                        dashStyle: "Dash",
                        color: "#fff", // Choose a contrasting color if needed
                        width: 0.8,
                    },
                ],
            },
            plotOptions: {
                series: {
                    animation: false,
                    marker: { enabled: false },
                    states: { hover: { enabled: false } },
                },
            },
            legend: { enabled: false },
            series: [
                {
                    name: "Price",
                    type: "area",
                    data: displayData === "1D" ? seriesData : priceList,
                    animation: false,
                    color: lineColor,
                    lineWidth: 2,
                    marker: {
                        enabled: false,
                    },
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
</script>

{#if config}
    <div use:highcharts={config}></div>
{/if}
