<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { screenWidth } from "$lib/store";
    import { mode } from "mode-watcher";
    import { goto } from "$app/navigation";
    import { ensureHighcharts } from "$lib/highcharts";

    export let data: any = null;

    let container: HTMLDivElement;
    let chart: any = null;
    let isInitializing = false;
    let pendingInit = false;
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

        if (isInitializing) {
            pendingInit = true;
            return;
        }

        const dataId = `${data.etfName}_${data.timePeriod}_${$mode}`;
        if (dataId === currentDataId && chart) return;

        isInitializing = true;
        currentDataId = dataId;

        await new Promise(resolve => requestAnimationFrame(resolve));

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
            accessibility: { enabled: false },
            chart: {
                backgroundColor: bgColor,
                animation: false,
                spacing: [0, 0, 0, 0],
            },
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
                useHTML: true,
                followPointer: true,
                outside: true,
                backgroundColor: "rgba(0,0,0,0.9)",
                borderColor: "rgba(255,255,255,0.2)",
                borderWidth: 1,
                style: { color: "#fff", fontSize: "13px" },
                headerFormat: '<span style="font-size:0.9em">{point.custom.fullName}</span><br/>',
                pointFormat: '<b>Market Cap:</b> USD {(divide point.value 1000000000):.1f} bln<br/>' +
                    '{#if point.custom.performance}<b>Performance:</b> {point.custom.performance}{/if}',
            },
            series: [{
                type: "treemap",
                layoutAlgorithm: "squarified",
                allowDrillToNode: true,
                animationLimit: 0,
                animation: false,
                borderColor: borderColor,
                borderWidth: 1,
                opacity: 1,
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
                            align: "left",
                            verticalAlign: "top",
                            style: {
                                fontWeight: "bold",
                                fontSize: "0.75em",
                                color: textColor,
                                textOutline: "none",
                                textTransform: "uppercase",
                            },
                            padding: 5,
                        },
                        borderWidth: 3,
                        borderColor: borderColor,
                        levelIsConstant: false,
                    },
                    {
                        level: 2,
                        dataLabels: {
                            enabled: true,
                            align: "center",
                            verticalAlign: "top",
                            padding: 2,
                            style: {
                                color: "white",
                                fontWeight: "normal",
                                fontSize: "0.65em",
                                textOutline: "none",
                                textTransform: "uppercase",
                            },
                        },
                        borderWidth: 1,
                        borderColor: borderColor,
                    },
                    {
                        level: 3,
                        dataLabels: {
                            enabled: true,
                            align: "center",
                            verticalAlign: "middle",
                            useHTML: true,
                            formatter: function () {
                                const point = this.point as any;
                                if (!point.shapeArgs) return "";
                                const w = point.shapeArgs.width || 0;
                                const h = point.shapeArgs.height || 0;
                                const area = w * h;

                                if (area < 800) return "";

                                const fontSize = Math.min(28, Math.max(8, 7 + Math.round(area * 0.0008)));
                                const perf = point.custom?.performance || "";

                                if (area < 2000) {
                                    return `<span style="font-size:${fontSize}px;color:white;font-weight:600">${point.name}</span>`;
                                }

                                return `<div style="text-align:center;color:white">
                                    <span style="font-size:${fontSize}px;font-weight:600">${point.name}</span><br>
                                    <span style="font-size:${Math.max(8, fontSize * 0.7)}px">${perf}</span>
                                </div>`;
                            },
                        },
                    },
                ],
                breadcrumbs: {
                    buttonTheme: {
                        style: { color: subtleTextColor },
                        states: {
                            hover: {
                                fill: isDark ? "#333" : "#e5e7eb",
                            },
                            select: {
                                style: { color: textColor },
                            },
                        },
                    },
                },
                states: {
                    hover: { brightness: 0.1 },
                    inactive: { opacity: 1 },
                },
                point: {
                    events: {
                        click: function (e: any) {
                            const point = this as any;
                            // Only navigate for level 3 (stocks), not when drilling
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

        if (pendingInit) {
            pendingInit = false;
            setTimeout(() => initChart(), 100);
        }
    }

    let initTimeout: ReturnType<typeof setTimeout>;
    $: if (browser && data?.data && container) {
        clearTimeout(initTimeout);
        initTimeout = setTimeout(() => initChart(), 50);
    }

    onMount(() => {
        if (data?.data) {
            initChart();
        }
    });

    onDestroy(() => {
        clearTimeout(initTimeout);
        destroyChart();
    });
</script>

<div
    bind:this={container}
    class="w-full h-[500px] sm:h-[600px] lg:h-[700px] rounded-xl overflow-hidden border border-gray-300 dark:border-zinc-700"
></div>
