<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { mode } from "mode-watcher";
    import { goto } from "$app/navigation";
    import { ensureHighcharts } from "$lib/highcharts";

    export let data: any = null;

    let container: HTMLDivElement;
    let chart: any = null;
    let isInitializing = false;
    let currentDataId = "";

    function destroyChart() {
        if (chart) {
            try {
                chart.destroy();
            } catch (e) {}
            chart = null;
        }
    }

    async function initChart() {
        if (!browser || !container || !data?.data) return;

        if (isInitializing) return;

        const dataId = `${data.etfName}_${data.timePeriod}_${$mode}`;
        if (dataId === currentDataId && chart) return;

        isInitializing = true;
        currentDataId = dataId;

        const Highcharts = await ensureHighcharts();
        if (!Highcharts) {
            isInitializing = false;
            return;
        }

        destroyChart();

        const colorRange = data.colorRange || 10;
        const isDark = $mode === "dark";
        const bgColor = isDark ? "#09090B" : "#ffffff";
        const borderColor = isDark ? "#09090B" : "#ffffff";
        const textColor = isDark ? "#ffffff" : "#000000";
        const subtleTextColor = isDark ? "#a1a1aa" : "#6b7280";

        chart = Highcharts.chart(container, {
            chart: {
                backgroundColor: bgColor,
                animation: false,
                spacing: [0, 0, 0, 0],
            },
            plotOptions: {
                series: { animation: false },
                treemap: { animation: false },
            },
            accessibility: { enabled: false },
            credits: { enabled: false },
            title: { text: null },
            colorAxis: {
                minColor: "#f73539",
                maxColor: "#2ecc59",
                stops: [
                    [0, "#f73539"],
                    [0.5, isDark ? "#414555" : "#9ca3af"],
                    [1, "#2ecc59"],
                ],
                min: -colorRange,
                max: colorRange,
                gridLineWidth: 0,
                labels: {
                    overflow: "allow",
                    format: "{#gt value 0}+{value}{else}{value}{/gt}%",
                    style: { color: textColor },
                },
            },
            legend: { enabled: false },
            tooltip: {
                animation: false,
                followPointer: true,
                outside: true,
                headerFormat: '<span style="font-size: 0.9em">{point.custom.fullName}</span><br/>',
                pointFormat: "<b>Market Cap:</b> USD {(divide point.value 1000000000):.1f} bln<br/>" +
                    "{#if point.custom.performance}<b>Performance:</b> {point.custom.performance}{/if}",
            },
            series: [{
                name: "All",
                type: "treemap",
                layoutAlgorithm: "squarified",
                allowDrillToNode: true,
                animationLimit: 0,
                animation: false,
                borderColor: borderColor,
                color: borderColor,
                opacity: 0.01,
                nodeSizeBy: "leaf",
                turboThreshold: 0,
                dataLabels: {
                    enabled: false,
                    allowOverlap: true,
                    style: {
                        fontSize: "0.9em",
                        textOutline: "none",
                    },
                },
                levels: [
                    {
                        level: 1,
                        dataLabels: {
                            enabled: true,
                            headers: true,
                            align: "left",
                            style: {
                                fontWeight: "bold",
                                fontSize: "0.7em",
                                lineClamp: 1,
                                textTransform: "uppercase",
                                color: textColor,
                                textOutline: "none",
                            },
                            padding: 3,
                        },
                        borderWidth: 3,
                        levelIsConstant: false,
                    },
                    {
                        level: 2,
                        dataLabels: {
                            enabled: true,
                            headers: true,
                            align: "center",
                            shape: "callout",
                            backgroundColor: "gray",
                            borderWidth: 1,
                            borderColor: borderColor,
                            padding: 0,
                            style: {
                                color: "white",
                                fontWeight: "normal",
                                fontSize: "0.6em",
                                lineClamp: 1,
                                textOutline: "none",
                                textTransform: "uppercase",
                            },
                        },
                        groupPadding: 1,
                    },
                    {
                        level: 3,
                        dataLabels: {
                            enabled: true,
                            align: "center",
                            verticalAlign: "middle",
                            useHTML: true,
                            formatter: function() {
                                const point = this.point as any;
                                const shapeArgs = point.shapeArgs;
                                if (!shapeArgs) return "";

                                const w = shapeArgs.width || 0;
                                const h = shapeArgs.height || 0;

                                // Hide label for very small cells
                                if (w < 40 || h < 30) return "";

                                const area = w * h;
                                const fontSize = Math.min(24, Math.max(10, 7 + Math.round(area * 0.0006)));
                                const perf = point.custom?.performance || "";

                                // Only show ticker for medium cells
                                if (w < 60 || h < 45) {
                                    return `<span style="font-size:${fontSize}px;font-weight:600;color:white">${point.name}</span>`;
                                }

                                // Show ticker + performance for larger cells
                                return `<div style="text-align:center;line-height:1.2">
                                    <div style="font-size:${fontSize}px;font-weight:600;color:white">${point.name}</div>
                                    <div style="font-size:${Math.max(9, fontSize * 0.65)}px;color:rgba(255,255,255,0.85)">${perf}</div>
                                </div>`;
                            },
                        },
                    },
                ],
                breadcrumbs: {
                    buttonTheme: {
                        style: { color: subtleTextColor },
                        states: {
                            hover: { fill: isDark ? "#333" : "#e5e7eb" },
                            select: { style: { color: textColor } },
                        },
                    },
                },
                states: {
                    hover: { brightness: 0.05 },
                    inactive: { enabled: false },
                },
                point: {
                    events: {
                        click: function(e: any) {
                            const point = this as any;
                            if (point.node?.level === 3 && point.custom && !e.point?.drillId) {
                                goto(`/stocks/${point.name}`);
                            }
                        },
                    },
                },
                data: data.data,
            }],
        });

        isInitializing = false;
    }

    $: if (browser && data?.data && container) {
        initChart();
    }

    onMount(() => {
        if (data?.data) initChart();
    });

    onDestroy(() => {
        destroyChart();
    });
</script>

<div
    bind:this={container}
    class="w-full h-[500px] sm:h-[600px] lg:h-[900px] rounded-xl overflow-hidden"
></div>
