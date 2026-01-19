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
    let pendingInit = false;
    let currentDataId = "";
    let eventRegistered = false;

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

        // Register the drawDataLabels event handler once for dynamic styling
        if (!eventRegistered) {
            Highcharts.addEvent(Highcharts.Series, 'drawDataLabels', function () {
                const series = this as any;
                if (series.type !== 'treemap') return;

                const points = series.points || [];

                for (const point of points) {
                    if (!point.dataLabel || !point.node) continue;

                    const level = point.node.level;
                    const shapeArgs = point.shapeArgs;

                    if (!shapeArgs) continue;

                    const area = shapeArgs.width * shapeArgs.height;

                    // Level 2: Color the header based on children's weighted performance
                    if (level === 2 && point.dataLabel.element) {
                        const children = point.node.children || [];
                        let totalValue = 0;
                        let totalColorValue = 0;

                        for (const child of children) {
                            const childPoint = child.point;
                            if (childPoint && typeof childPoint.value === 'number' && typeof childPoint.colorValue === 'number') {
                                totalValue += childPoint.value;
                                totalColorValue += childPoint.colorValue * childPoint.value;
                            }
                        }

                        const avgColorValue = totalValue > 0 ? totalColorValue / totalValue : 0;
                        const colorAxis = series.colorAxis;

                        if (colorAxis) {
                            const color = colorAxis.toColor(avgColorValue, point);
                            point.dataLabel.css({ backgroundColor: color });
                        }
                    }

                    // Level 3: Dynamic font sizing based on area
                    if (level === 3 && point.dataLabel.element) {
                        const fontSize = Math.min(32, 7 + Math.round(area * 0.0008));
                        point.dataLabel.css({ fontSize: fontSize + 'px' });
                    }
                }
            });
            eventRegistered = true;
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
                animation: { duration: 0 },
                spacing: [0, 0, 0, 0],
            },
            plotOptions: {
                series: {
                    animation: false,
                },
                treemap: {
                    animation: false,
                },
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
                followPointer: true,
                outside: true,
                headerFormat: '<span style="font-size: 0.9em">{point.custom.fullName}</span><br/>',
                pointFormat: '<b>Market Cap:</b> USD {(divide point.value 1000000000):.1f} bln<br/>' +
                    '{#if point.custom.performance}<b>Performance:</b> {point.custom.performance}{/if}',
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
                            format: '{point.name}<br><span style="font-size: 0.7em">{point.custom.performance}</span>',
                            style: {
                                color: "white",
                                textOutline: "none",
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
