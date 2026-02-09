<script lang="ts">
    import { abbreviateNumber } from "$lib/utils";
    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";

    export let marketTideData: any[] = [];

    function plotDataFlow() {
        // Determine the base date (using the first data point, or fallback to today)
        const baseDate =
            marketTideData && marketTideData.length
                ? new Date(marketTideData[0]?.time)
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
            10,
        ).getTime();

        // Create series arrays with x (timestamp) and y values.
        const priceSeries =
            marketTideData?.map((item) => ({
                x: new Date(item.time).getTime(),
                y: item.close,
            })) || [];

        const netCallPremSeries =
            marketTideData?.map((item) => ({
                x: new Date(item.time).getTime(),
                y: item.net_call_premium,
            })) || [];

        const netPutPremSeries =
            marketTideData?.map((item) => ({
                x: new Date(item.time).getTime(),
                y: item.net_put_premium,
            })) || [];

        // Function to detect crossing points between two series
        function findCrossingPoints(series1, series2, priceSeries) {
            const crossingPoints = [];

            for (let i = 1; i < series1.length && i < series2.length; i++) {
                const prev1 = series1[i - 1]?.y;
                const curr1 = series1[i]?.y;
                const prev2 = series2[i - 1]?.y;
                const curr2 = series2[i]?.y;

                // Check if lines crossed
                const prevDiff = prev1 - prev2;
                const currDiff = curr1 - curr2;

                // If the sign changed, there was a crossing
                if (prevDiff * currDiff < 0 || currDiff === 0) {
                    // Calculate the intersection point using linear interpolation
                    let intersectionY;
                    if (currDiff === 0) {
                        // Lines meet exactly at this point
                        intersectionY = curr1;
                    } else {
                        // Interpolate to find the exact crossing point
                        const t =
                            Math.abs(prevDiff) /
                            (Math.abs(prevDiff) + Math.abs(currDiff));
                        intersectionY = prev1 + t * (curr1 - prev1);
                    }

                    // Find corresponding price at this time for the tooltip
                    const pricePoint = priceSeries.find(
                        (p) => p.x === series1[i].x,
                    );

                    crossingPoints.push({
                        x: series1[i].x,
                        y: intersectionY, // Use the actual intersection point
                        z: Math.abs(intersectionY), // Use crossing level for bubble size
                        crossType: curr1 > curr2 ? "bullish" : "bearish", // Bullish if calls cross above puts
                        callValue: curr1,
                        putValue: curr2,
                        spyPrice: pricePoint?.y || 0, // Store SPY price for tooltip
                    });
                }
            }

            return crossingPoints;
        }

        // Find crossing points
        const crossingBubbles = findCrossingPoints(
            netCallPremSeries,
            netPutPremSeries,
            priceSeries,
        );

        // Calculate min/max for bubble sizing based on crossing levels
        const crossingLevels = crossingBubbles.map((p) => p.z);
        const maxCrossingLevel = Math.max(...crossingLevels, 1);
        const minCrossingLevel = Math.min(...crossingLevels, 0);

        const options = {
            chart: {
                type: "column",
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 360,
                animation: false,
            },

            title: {
                text: `<h3 class=""></h3>`,
                style: {
                    color: $mode === "light" ? "black" : "white",
                },
                useHTML: true,
            },

            legend: {
                enabled: true,
                align: "center",
                verticalAlign: "top",
                layout: "horizontal",
                squareSymbol: false,
                symbolWidth: 20,
                symbolHeight: 12,
                symbolRadius: 0,
                itemStyle: {
                    color: $mode === "light" ? "black" : "white",
                },
            },

            credits: {
                enabled: false,
            },

            tooltip: {
                shared: true, // show all series for the hovered x
                useHTML: true,
                backgroundColor: "rgba(0, 0, 0, 1)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                style: {
                    color: "#fff",
                    fontSize: "14px",
                    padding: "10px",
                },
                borderRadius: 4,
                formatter: function () {
                    // Determine the timestamp (this.x for shared tooltip)
                    const ts =
                        this.x ??
                        (this.points &&
                            this.points[0] &&
                            this.points[0].point.x) ??
                        null;
                    const timeString = ts
                        ? new Date(ts).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                          })
                        : "";

                    let tooltipContent = `<div style="min-width:180px;">
      <div style="font-weight:600; margin-bottom:6px;">${timeString}</div>`;

                    // For shared tooltips Highcharts provides this.points (array). Fall back to this.point if not present.
                    const points =
                        this.points || (this.point ? [this.point] : []);

                    // Sort points so SPY appears first (optional)
                    points.sort((a, b) => {
                        if (a.series.name === "SPY Price") return -1;
                        if (b.series.name === "SPY Price") return 1;
                        return 0;
                    });

                    points.forEach((p) => {
                        // If series is bubble, show crossing details
                        if (
                            p.series.type === "bubble" ||
                            (p.point && p.point.crossType)
                        ) {
                            const pt = p.point;
                            tooltipContent += `
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.06);">
            <div style="font-weight:600;">Premium Crossings</div>
            <div style="font-size:13px;">Crossing Level: ${abbreviateNumber(pt.y)}</div>
            <div style="font-size:13px;">SPY Price: ${(pt.spyPrice ?? 0).toFixed(2)}</div>
            <div style="font-size:13px;">Type: ${pt.crossType === "bullish" ? "🟢 Bullish" : "🔴 Bearish"}</div>
            <div style="font-size:13px;">Call Prem: ${abbreviateNumber(pt.callValue)}</div>
            <div style="font-size:13px;">Put Prem: ${abbreviateNumber(pt.putValue)}</div>
          </div>`;
                        } else {
                            // Regular series (SPY, Net Call Prem, Net Put Prem)
                            const displayVal =
                                p.series.name === "SPY Price"
                                    ? "$" + Number(p.y).toFixed(2)
                                    : abbreviateNumber(p.y);
                            tooltipContent += `
          <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
            <span style="display:inline-block; width:10px; height:10px; background-color:${p.color}; border-radius:50%;"></span>
            <div style="font-weight:600; width:110px;">${p.series.name}:</div>
            <div style="font-weight:400;">${displayVal}</div>
          </div>`;
                        }
                    });

                    tooltipContent += `</div>`;
                    return tooltipContent;
                },
                // optional: make tooltip follow cursor horizontally
                shared: true,
                outside: false,
            },

            xAxis: {
                type: "datetime",
                min: startTime,
                max: endTime,
                crosshair: {
                    color: $mode === "light" ? "black" : "white",
                    width: 1,
                    dashStyle: "Solid",
                },
                labels: {
                    style: { color: $mode === "light" ? "#545454" : "white" },
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
                    const tickCount = 5;
                    const interval = (info.max - info.min) / tickCount;

                    for (let i = 0; i <= tickCount; i++) {
                        positions.push(info.min + i * interval);
                    }
                    return positions;
                },
            },

            yAxis: [
                {
                    startOnTick: false,
                    endOnTick: false,
                    title: {
                        text: null,
                    },
                    labels: {
                        enabled: false,
                    },
                    gridLineWidth: 0,
                    opposite: false,
                },
                {
                    gridLineWidth: 1,
                    gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
                    labels: {
                        style: {
                            color: $mode === "light" ? "#545454" : "white",
                        },
                    },
                    title: { text: null },
                    opposite: true,
                },
            ],

            plotOptions: {
                series: {
                    legendSymbol: "rectangle",
                    animation: false,
                    states: {
                        hover: {
                            enabled: false,
                        },
                    },
                },
                spline: {
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: false,
                            },
                        },
                    },
                },
                bubble: {
                    minSize: 5,
                    maxSize: 20,
                    opacity: 0.85,
                    marker: {
                        enabled: true,
                        fillOpacity: 0.85,
                        lineWidth: 2,
                        lineColor:
                            $mode === "light"
                                ? "rgba(0,0,0,0.3)"
                                : "rgba(255,255,255,0.3)",
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    sizeBy: "z",
                    zMin: minCrossingLevel,
                    zMax: maxCrossingLevel,
                    sizeByAbsoluteValue: false,
                },
            },

            series: [
                {
                    name: "SPY Price",
                    type: "spline",
                    data: priceSeries,
                    yAxis: 0,
                    color: $mode === "light" ? "#000" : "#fff",
                    lineWidth: 2,
                    zIndex: 10,
                },
                {
                    name: "Net Call Prem",
                    type: "spline",
                    data: netCallPremSeries,
                    yAxis: 1,
                    color: $mode === "light" ? "#208646" : "#90EE90",
                },
                {
                    name: "Net Put Prem",
                    type: "spline",
                    data: netPutPremSeries,
                    yAxis: 1,
                    color: $mode === "light" ? "#DC2626" : "#FF6B6B",
                },
                {
                    name: "Premium Crossings",
                    type: "bubble",
                    data: crossingBubbles.map((point) => ({
                        x: point.x,
                        y: point.y,
                        z: point.z,
                        crossType: point.crossType,
                        callValue: point.callValue,
                        putValue: point.putValue,
                        spyPrice: point.spyPrice,
                        marker: {
                            fillColor:
                                point.crossType === "bullish"
                                    ? $mode === "light"
                                        ? "#10b981"
                                        : "#34d399"
                                    : $mode === "light"
                                      ? "#ef4444"
                                      : "#f87171",
                        },
                    })),
                    color: $mode === "light" ? "#6366f1" : "#818cf8",
                    yAxis: 1, // Place bubbles on the premium axis
                    animation: false,
                    zIndex: 15, // Highest z-index to appear on top
                    showInLegend: false,
                },
            ],
        };

        return options;
    }

    let config: any = null;

    $: if ($mode && marketTideData) {
        config = plotDataFlow();
    }
</script>

<div
    class="border border-gray-300 dark:border-zinc-700 rounded-2xl"
    use:highcharts={config}
></div>
