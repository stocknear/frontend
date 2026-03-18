<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { mode } from "mode-watcher";
    import { goto } from "$app/navigation";
    import { ensureHighcharts } from "$lib/highcharts";
    import { abbreviateNumber } from "$lib/utils";

    export let data: any = null;
    export let isETF = false;

    let container: HTMLDivElement;
    let chart: any = null;
    let isInitializing = false;
    let currentDataId = "";
    let pointIndex = new Map<string, any>();

    type HeatmapTheme = {
        background: string;
        cellBorder: string;
        groupBorder: string;
        text: string;
        subtleText: string;
        labelChipBackground: string;
        labelChipBorder: string;
        labelChipText: string;
        breadcrumbHoverFill: string;
        colorStops: Array<[number, string]>;
        minColor: string;
        maxColor: string;
    };

    type HeatmapPointUpdate = {
        symbol: string;
        colorValue: number;
        custom: Record<string, any>;
    };

    const SHARED_HEATMAP_COLORS = {
        minColor: "#f73539",
        maxColor: "#2ecc59",
        colorStops: [
            [0, "#f73539"],
            [0.5, "#414555"],
            [1, "#2ecc59"],
        ] as Array<[number, string]>,
    };

    function parseColor(color?: string) {
        if (!color) return null;

        const normalized = color.trim();
        if (normalized.startsWith("#")) {
            const hex = normalized.slice(1);
            if (hex.length === 3) {
                const [r, g, b] = hex.split("");
                return {
                    r: parseInt(`${r}${r}`, 16),
                    g: parseInt(`${g}${g}`, 16),
                    b: parseInt(`${b}${b}`, 16),
                };
            }

            if (hex.length === 6) {
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                };
            }
        }

        const rgbMatch = normalized.match(
            /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
        );
        if (!rgbMatch) return null;

        return {
            r: Number(rgbMatch[1]),
            g: Number(rgbMatch[2]),
            b: Number(rgbMatch[3]),
        };
    }

    function getRelativeLuminance(color?: string) {
        const rgb = parseColor(color);
        if (!rgb) return null;

        const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.03928
                ? normalized / 12.92
                : Math.pow((normalized + 0.055) / 1.055, 2.4);
        });

        return (
            channels[0] * 0.2126 +
            channels[1] * 0.7152 +
            channels[2] * 0.0722
        );
    }

    function getPointLabelColors(point: any, isDark: boolean) {
        if (isDark) {
            return {
                primary: "#ffffff",
                secondary: "rgba(255, 255, 255, 0.82)",
            };
        }

        const luminance = getRelativeLuminance(point?.color);
        if (luminance === null) {
            return {
                primary: "#0f172a",
                secondary: "rgba(15, 23, 42, 0.75)",
            };
        }

        return luminance > 0.42
            ? {
                  primary: "#0f172a",
                  secondary: "rgba(15, 23, 42, 0.76)",
              }
            : {
                  primary: "#f8fafc",
                  secondary: "rgba(248, 250, 252, 0.86)",
              };
    }

    function getHeatmapTheme(isDark: boolean): HeatmapTheme {
        if (isDark) {
            return {
                background: "#09090B",
                cellBorder: "#09090B",
                groupBorder: "#09090B",
                text: "#ffffff",
                subtleText: "#a1a1aa",
                labelChipBackground: "rgba(63, 63, 70, 0.92)",
                labelChipBorder: "#18181b",
                labelChipText: "#ffffff",
                breadcrumbHoverFill: "#333333",
                minColor: SHARED_HEATMAP_COLORS.minColor,
                maxColor: SHARED_HEATMAP_COLORS.maxColor,
                colorStops: SHARED_HEATMAP_COLORS.colorStops,
            };
        }

        return {
            background: "#f8fafc",
            cellBorder: "#e2e8f0",
            groupBorder: "#09090B",
            text: "#0f172a",
            subtleText: "#475569",
            labelChipBackground: "rgba(63, 63, 70, 0.92)",
            labelChipBorder: "#18181b",
            labelChipText: "#ffffff",
            breadcrumbHoverFill: "#e2e8f0",
            minColor: SHARED_HEATMAP_COLORS.minColor,
            maxColor: SHARED_HEATMAP_COLORS.maxColor,
            colorStops: SHARED_HEATMAP_COLORS.colorStops,
        };
    }

    export async function downloadChart() {
        if (!chart || !container) return;

        try {
            const svgEl = container.querySelector("svg");
            if (!svgEl) return;

            const rect = svgEl.getBoundingClientRect();
            const width = Math.round(rect.width);
            const height = Math.round(rect.height);

            // Clone SVG and strip foreignObject elements (browser blocks them in <img>)
            const clone = svgEl.cloneNode(true) as SVGSVGElement;
            clone.setAttribute("width", String(width));
            clone.setAttribute("height", String(height));
            clone.querySelectorAll("foreignObject").forEach((fo) => fo.remove());

            // Serialize cleaned SVG to blob
            const svgStr = new XMLSerializer().serializeToString(clone);
            const svgBlob = new Blob([svgStr], {
                type: "image/svg+xml;charset=utf-8",
            });
            const svgUrl = URL.createObjectURL(svgBlob);

            const scale = 2;
            const watermarkH = 52;

            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = width * scale;
            finalCanvas.height = (height + watermarkH) * scale;
            const ctx = finalCanvas.getContext("2d");
            if (!ctx) return;

            ctx.scale(scale, scale);

            const isDark = $mode === "dark";
            const bgColor = isDark ? "#09090B" : "#ffffff";

            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height + watermarkH);

            // Draw watermark bar at the top
            const logoSize = 28;
            const paddingLeft = 14;
            const gap = 8;
            const wmY = (watermarkH - logoSize) / 2;

            const logo = new Image();
            logo.crossOrigin = "anonymous";
            logo.src = "/pwa-192x192.png";

            await new Promise<void>((resolve) => {
                logo.onload = () => {
                    ctx.drawImage(logo, paddingLeft, wmY, logoSize, logoSize);
                    ctx.font = "600 15px 'Space Grotesk', sans-serif";
                    ctx.fillStyle = isDark
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(0, 0, 0, 0.45)";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        "stocknear.com",
                        paddingLeft + logoSize + gap,
                        wmY + logoSize / 2,
                    );
                    resolve();
                };
                logo.onerror = () => {
                    ctx.font = "600 15px 'Space Grotesk', sans-serif";
                    ctx.fillStyle = isDark
                        ? "rgba(255, 255, 255, 0.6)"
                        : "rgba(0, 0, 0, 0.45)";
                    ctx.textBaseline = "middle";
                    ctx.fillText(
                        "stocknear.com",
                        paddingLeft,
                        wmY + logoSize / 2,
                    );
                    resolve();
                };
            });

            // Draw the heatmap SVG (rectangles + level 1/2 labels) below watermark
            const svgImg = new Image();
            svgImg.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
                svgImg.onload = () => {
                    ctx.drawImage(svgImg, 0, watermarkH, width, height);
                    URL.revokeObjectURL(svgUrl);
                    resolve();
                };
                svgImg.onerror = () => {
                    URL.revokeObjectURL(svgUrl);
                    reject(new Error("Failed to render SVG"));
                };
                svgImg.src = svgUrl;
            });

            // Manually draw level 3 labels (ticker + perf) that were in foreignObject
            const series = chart.series?.[0];
            if (series?.points) {
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                for (const point of series.points) {
                    const s = point.shapeArgs;
                    if (!s || point.node?.level !== 3) continue;

                    const w = s.width || 0;
                    const h = s.height || 0;
                    if (w < 40 || h < 30) continue;

                    const cx = s.x + w / 2;
                    const cy = s.y + h / 2 + watermarkH;

                    const area = w * h;
                    const fontSize = Math.min(
                        24,
                        Math.max(10, 7 + Math.round(area * 0.0006)),
                    );
                    const labelColors = getPointLabelColors(point, isDark);

                    // Draw ticker name
                    ctx.font = `600 ${fontSize}px 'Space Grotesk', sans-serif`;
                    ctx.fillStyle = labelColors.primary;

                    const perf = point.custom?.performance || "";
                    const showPerf = w >= 60 && h >= 45 && perf;

                    if (showPerf) {
                        // Ticker above center, perf below
                        ctx.fillText(point.name, cx, cy - fontSize * 0.35);
                        const perfSize = Math.max(9, fontSize * 0.65);
                        ctx.font = `400 ${perfSize}px 'Space Grotesk', sans-serif`;
                        ctx.fillStyle = labelColors.secondary;
                        ctx.fillText(perf, cx, cy + fontSize * 0.55);
                    } else {
                        ctx.fillText(point.name, cx, cy);
                    }
                }
            }

            // Trigger download
            const url = finalCanvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = url;
            const ts = new Date().toISOString().slice(0, 10);
            const label = isETF
                ? `etf_heatmap_${data?.timePeriod || "1D"}`
                : `${(data?.etfName || "market").replace(/[^a-zA-Z0-9]/g, "_")}_heatmap_${data?.timePeriod || "1D"}`;
            link.download = `${label}_${ts}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Failed to download heatmap:", e);
        }
    }

    function destroyChart() {
        pointIndex = new Map();
        if (chart) {
            try {
                chart.destroy();
            } catch (e) {}
            chart = null;
        }
    }

    function rebuildPointIndex() {
        pointIndex = new Map();
        const points = chart?.series?.[0]?.points ?? [];
        for (const point of points) {
            const symbol = point?.custom?.symbol || point?.name;
            if (
                point?.node?.level === 3 &&
                typeof symbol === "string" &&
                symbol.length > 0
            ) {
                pointIndex.set(symbol.toUpperCase(), point);
            }
        }
    }

    export function applyRealtimeUpdates(updates: HeatmapPointUpdate[] = []) {
        if (!chart || !Array.isArray(updates) || updates.length === 0) {
            return;
        }

        let didUpdate = false;
        for (const update of updates) {
            const symbol = update?.symbol?.toUpperCase?.();
            if (!symbol) continue;

            const point = pointIndex.get(symbol);
            if (!point) continue;

            const nextCustom = {
                ...(point?.options?.custom ?? point?.custom ?? {}),
                ...(update.custom ?? {}),
            };

            point.update(
                {
                    colorValue: update.colorValue,
                    custom: nextCustom,
                },
                false,
            );
            didUpdate = true;
        }

        if (didUpdate) {
            chart.redraw();
        }
    }

    async function initChart() {
        if (!browser || !container || !data?.data) return;

        if (isInitializing) return;

        const dataId = `${data.etfName || "etf"}_${data.timePeriod}_${$mode}_${isETF}`;
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
        const theme = getHeatmapTheme(isDark);

        chart = Highcharts.chart(container, {
            chart: {
                backgroundColor: theme.background,
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
                minColor: theme.minColor,
                maxColor: theme.maxColor,
                stops: theme.colorStops,
                min: -colorRange,
                max: colorRange,
                gridLineWidth: 0,
                labels: {
                    overflow: "allow",
                    format: "{#gt value 0}+{value}{else}{value}{/gt}%",
                    style: { color: theme.text },
                },
            },
            legend: { enabled: false },
            tooltip: {
                animation: false,
                followPointer: true,
                outside: true,
                useHTML: true,
                shared: true,
                backgroundColor: "rgba(0, 0, 0, 1)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                borderRadius: 4,
                style: { color: "#fff", fontSize: "16px", padding: "10px" },
                formatter: function () {
                    const point = this.point as any;
                    if (!point.custom) return false;

                    const perf = point.custom.performance || "";
                    const value = point.value || 0;

                    let s = `<span class="text-white font-[501]">${point.name}</span><br>`;
                    const valueLabel = point.custom.aum !== undefined ? "AUM:" : "Market Cap:";
                    s += `<span class="text-white font-semibold text-sm">${valueLabel}</span> `;
                    s += `<span class="text-white font-normal text-sm">${abbreviateNumber(value)}</span><br>`;
                    if (perf) {
                        s += `<span class="text-white font-semibold text-sm">Change:</span> `;
                        s += `<span class="text-white font-normal text-sm">${perf}</span>`;
                    }
                    return s;
                },
            },
            series: [
                {
                    name: "All",
                    type: "treemap",
                    layoutAlgorithm: "squarified",
                    allowDrillToNode: true,
                    animationLimit: 0,
                    animation: false,
                    borderColor: theme.cellBorder,
                    color: theme.cellBorder,
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
                                    color: theme.text,
                                    textOutline: "none",
                                },
                                padding: 3,
                            },
                            borderWidth: 3,
                            borderColor: theme.groupBorder,
                            levelIsConstant: false,
                        },
                        {
                            level: 2,
                            dataLabels: {
                                enabled: true,
                                headers: true,
                                align: "center",
                                shape: "callout",
                                backgroundColor: theme.labelChipBackground,
                                borderWidth: 1,
                                borderColor: theme.labelChipBorder,
                                padding: 2,
                                style: {
                                    color: theme.labelChipText,
                                    fontWeight: "600",
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
                                formatter: function () {
                                    const point = this.point as any;
                                    const shapeArgs = point.shapeArgs;
                                    if (!shapeArgs) return "";

                                    const w = shapeArgs.width || 0;
                                    const h = shapeArgs.height || 0;

                                    // Hide label for very small cells
                                    if (w < 40 || h < 30) return "";

                                    const area = w * h;
                                    const fontSize = Math.min(
                                        24,
                                        Math.max(
                                            10,
                                            7 + Math.round(area * 0.0006),
                                        ),
                                    );
                                    const perf =
                                        point.custom?.performance || "";
                                    const labelColors = getPointLabelColors(
                                        point,
                                        isDark,
                                    );

                                    // Only show ticker for medium cells
                                    if (w < 60 || h < 45) {
                                        return `<span style="font-size:${fontSize}px;font-weight:600;color:${labelColors.primary}">${point.name}</span>`;
                                    }

                                    // Show ticker + performance for larger cells
                                    return `<div style="text-align:center;line-height:1.2">
                                    <div style="font-size:${fontSize}px;font-weight:600;color:${labelColors.primary}">${point.name}</div>
                                    <div style="font-size:${Math.max(9, fontSize * 0.65)}px;color:${labelColors.secondary}">${perf}</div>
                                </div>`;
                                },
                            },
                        },
                    ],
                    breadcrumbs: {
                        buttonTheme: {
                            style: { color: theme.subtleText },
                            states: {
                                hover: { fill: theme.breadcrumbHoverFill },
                                select: { style: { color: theme.text } },
                            },
                        },
                    },
                    states: {
                        hover: {
                            brightness: 0,
                            borderColor: isDark ? "#ffffff" : "#0f172a",
                            borderWidth: 2,
                        },
                        inactive: { enabled: false },
                    },
                    point: {
                        events: {
                            click: function (e: any) {
                                const point = this as any;
                                if (
                                    point.node?.level === 3 &&
                                    point.custom &&
                                    !e.point?.drillId
                                ) {
                                    goto(isETF ? `/etf/${point.name}` : `/stocks/${point.name}`);
                                }
                            },
                        },
                    },
                    data: data.data,
                },
            ],
        });

        rebuildPointIndex();

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
    class="w-full h-[500px] sm:h-[600px] lg:h-[900px] rounded-xl overflow-hidden border border-slate-200/90 bg-slate-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40"
></div>
