<script lang="ts">
    import { mode } from "mode-watcher";
    import { screenWidth } from "$lib/store";
    import highcharts from "$lib/highcharts.ts";

    export let plotData = {};

    let changesPercentage = plotData?.changesPercentage || 0;
    let dayLow = plotData?.dayLow || 650;
    let previousClose = plotData?.previousClose || 600;
    let priceData = plotData?.price || [];

    let config = null;

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
        const avgVolume = volumes?.length > 0
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
        let minValue = Math?.min(...rawData?.map((item) => item?.low ?? item?.close));
        let maxValue = Math?.max(...rawData?.map((item) => item?.high ?? item?.close));

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
        const lastClose = rawData?.length > 0 ? rawData[rawData.length - 1]?.close : null;

        const options = {
            chart: {
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                animation: false,
                height: 320,
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
                    style: { color: $mode === "light" ? "black" : "white" },
                    distance: 10,
                    formatter: function () {
                        const date = new Date(this?.value);
                        const timeString = date?.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            hour12: true,
                        });
                        return `<span class="text-xs">${timeString.replace(/\s/g, " ")}</span>`;
                    },
                },
                tickPositioner: function () {
                    const positions = [];
                    const info = this.getExtremes();
                    const tickCount = $screenWidth < 640 ? 2 : 5;
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
                    // Volume axis (left)
                    title: {
                        text: "RELATIVE<br/>VOLUME",
                        style: {
                            color: $mode === "light" ? "#666" : "#888",
                            fontSize: "9px",
                        },
                        rotation: 0,
                        align: "high",
                        offset: 0,
                        y: 10,
                        x: 5,
                    },
                    labels: {
                        style: { color: $mode === "light" ? "#666" : "#888" },
                        x: -5,
                    },
                    min: 0,
                    max: 2.5,
                    gridLineWidth: 0,
                    height: "25%",
                    top: "75%",
                    offset: 0,
                },
                {
                    // Price axis (right)
                    title: { text: null },
                    labels: {
                        style: { color: $mode === "light" ? "black" : "white" },
                        align: "left",
                        x: 5,
                    },
                    min: yMin ?? null,
                    max: yMax ?? null,
                    startOnTick: false,
                    endOnTick: false,
                    gridLineWidth: 1,
                    gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
                    opposite: true,
                    height: "70%",
                    offset: 0,
                    plotLines: [
                        {
                            value: previousClose,
                            dashStyle: "Dash",
                            color: $mode === "light" ? "#999" : "#fff",
                            width: 0.8,
                        },
                        // Current price label
                        ...(lastClose ? [{
                            value: lastClose,
                            color: "transparent",
                            width: 0,
                            label: {
                                text: lastClose?.toFixed(1),
                                align: "right",
                                x: 50,
                                y: 4,
                                style: {
                                    color: "#000",
                                    backgroundColor: "#D4A017",
                                    padding: "4px 6px",
                                    borderRadius: "2px",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                },
                                useHTML: true,
                                formatter: function() {
                                    return `<span style="background-color: #D4A017; color: #000; padding: 2px 6px; border-radius: 2px; font-size: 11px; font-weight: bold;">${lastClose?.toFixed(1)}</span>`;
                                },
                            },
                        }] : []),
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
                    yAxis: 1,
                    animation: false,
                    ...candlestickColors,
                },
                {
                    name: "Relative Volume",
                    type: "column",
                    data: relativeVolumeData,
                    yAxis: 0,
                    color: "#2196F3",
                    animation: false,
                },
            ],
        };

        return options;
    }

    config = chart(priceData);
</script>

{#if config}
    <div
        class=" border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-secondary rounded-[5px] shadow"
    >
        <div use:highcharts={config}></div>
    </div>
{/if}
