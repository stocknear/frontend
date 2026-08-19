<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";
    import { mode } from "mode-watcher";
    import { goto } from "$app/navigation";
    import { ensureHighcharts } from "$lib/highcharts";
    import { abbreviateNumber } from "$lib/utils";
    import {
        DEFAULT_METRIC,
        formatMetric,
        metricLabel,
        metricValue,
    } from "$lib/heatmap";

    export let data: any = null;
    export let isETF = false;
    export let metric = DEFAULT_METRIC;

    // The group aggregates as they arrived, so switching back to price change can restore
    // bands that a fundamental metric blanked out.
    let groupColorValues = new Map<string, number | null>();

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
        groupFill: string;
        breadcrumbHoverFill: string;
        colorStops: Array<[number, string]>;
        minColor: string;
        maxColor: string;
    };

    type HeatmapPointUpdate = {
        symbol: string;
        custom: Record<string, any>;
    };

    const SHARED_HEATMAP_COLORS = {
        minColor: "#f73539",
        maxColor: "#2ecc59",
        // The neutral is a true grey. The old #414555 was blue-violet, which tinted every
        // near-flat tile purple and made the whole board read dusty rather than red/green.
        colorStops: [
            [0, "#f73539"],
            [0.5, "#3f4045"],
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
                groupFill: "#27272a",
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
            groupFill: "#cbd5e1",
            breadcrumbHoverFill: "#e2e8f0",
            minColor: SHARED_HEATMAP_COLORS.minColor,
            maxColor: SHARED_HEATMAP_COLORS.maxColor,
            colorStops: SHARED_HEATMAP_COLORS.colorStops,
        };
    }

    /**
     * The single owner of what a tile prints: the hide threshold, the two-line
     * threshold, the font ramp, and which number is shown. Both the live chart and the
     * PNG export call it, because the export has to redraw these labels by hand -- it
     * strips foreignObject, which browsers refuse to rasterise.
     */
    function getTileLabel(point: any, width: number, height: number) {
        if (width < 40 || height < 30) return null;

        const fontSize = Math.min(
            24,
            Math.max(10, 7 + Math.round(width * height * 0.0006)),
        );
        const secondary =
            width >= 60 && height >= 45
                ? formatMetric(point?.custom, point?.value, metric)
                : "";

        return { primary: point?.name ?? "", secondary, fontSize };
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
                    const label = getTileLabel(point, w, h);
                    if (!label) continue;

                    const cx = s.x + w / 2;
                    const cy = s.y + h / 2 + watermarkH;
                    const fontSize = label.fontSize;
                    const labelColors = getPointLabelColors(point, isDark);

                    // Draw ticker name
                    ctx.font = `600 ${fontSize}px 'Space Grotesk', sans-serif`;
                    ctx.fillStyle = labelColors.primary;

                    if (label.secondary) {
                        // Ticker above center, metric below
                        ctx.fillText(label.primary, cx, cy - fontSize * 0.35);
                        const secondarySize = Math.max(9, fontSize * 0.65);
                        ctx.font = `400 ${secondarySize}px 'Space Grotesk', sans-serif`;
                        ctx.fillStyle = labelColors.secondary;
                        ctx.fillText(label.secondary, cx, cy + fontSize * 0.55);
                    } else {
                        ctx.fillText(label.primary, cx, cy);
                    }
                }
            }

            // Trigger download
            const url = finalCanvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = url;
            const ts = new Date().toISOString().slice(0, 10);
            // Price change is the only metric a period applies to, so it is the only one
            // the filename carries one for; the rest would claim a window they do not have.
            const view =
                metric === DEFAULT_METRIC ? data?.timePeriod || "1D" : metric;
            const label = isETF
                ? `etf_heatmap_${data?.timePeriod || "1D"}`
                : `${(data?.etfName || "market").replace(/[^a-zA-Z0-9]/g, "_")}_heatmap_${view}`;
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
        groupColorValues = new Map(
            (data?.data ?? [])
                .filter((node: any) => node?.id && !("custom" in node))
                .map((node: any) => [node.id, node.colorValue]),
        );
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

            // Derived, never taken from the update: a live tick must not repaint tiles
            // with price colour while a fundamental metric is selected.
            point.update(
                {
                    colorValue: colorValueFor(nextCustom, point?.value),
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

                    const perf = formatMetric(
                        point.custom,
                        point.value,
                        DEFAULT_METRIC,
                    );
                    const value = point.value || 0;

                    let s = `<span class="text-white font-[501]">${point.name}</span><br>`;
                    const valueLabel = point.custom.aum !== undefined ? "AUM:" : "Market Cap:";
                    s += `<span class="text-white font-semibold text-sm">${valueLabel}</span> `;
                    s += `<span class="text-white font-normal text-sm">${abbreviateNumber(value)}</span><br>`;
                    if (perf) {
                        s += `<span class="text-white font-semibold text-sm">Change:</span> `;
                        s += `<span class="text-white font-normal text-sm">${perf}</span>`;
                    }
                    // Market cap is already the row above, so only add a row when the
                    // selected metric would say something new.
                    if (metric !== DEFAULT_METRIC && metric !== "market-cap") {
                        const selected = formatMetric(
                            point.custom,
                            point.value,
                            metric,
                        );
                        if (selected) {
                            s += `<br><span class="text-white font-semibold text-sm">${metricLabel(metric)}:</span> `;
                            s += `<span class="text-white font-normal text-sm">${selected}</span>`;
                        }
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
                    // Parents carry a cap-weighted colorValue, so they paint their own
                    // group frame and header band. The old `opacity: 0.01` was there to
                    // hide colourless parents and would now grey the whole thing out.
                    color: theme.groupFill,
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
                                align: "center",
                                style: {
                                    fontWeight: "600",
                                    fontSize: "0.8em",
                                    lineClamp: 1,
                                    // Band fills come from the colour axis and are identical
                                    // in both themes, so the header is too. The outline is
                                    // what keeps white legible on a bright green band --
                                    // Highcharts' own "contrast" washes out on mid-tones.
                                    color: "#ffffff",
                                    textOutline: "1px rgba(0, 0, 0, 0.55)",
                                },
                                padding: 4,
                            },
                            borderWidth: 3,
                            borderColor: theme.groupBorder,
                            groupPadding: 3,
                            levelIsConstant: false,
                        },
                        {
                            level: 2,
                            dataLabels: {
                                enabled: true,
                                headers: true,
                                align: "center",
                                padding: 3,
                                style: {
                                    color: "#ffffff",
                                    fontWeight: "600",
                                    fontSize: "0.7em",
                                    lineClamp: 1,
                                    textOutline: "1px rgba(0, 0, 0, 0.55)",
                                },
                            },
                            borderWidth: 2,
                            borderColor: theme.groupBorder,
                            groupPadding: 2,
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

                                    const label = getTileLabel(
                                        point,
                                        shapeArgs.width || 0,
                                        shapeArgs.height || 0,
                                    );
                                    if (!label) return "";

                                    const fontSize = label.fontSize;
                                    const labelColors = getPointLabelColors(
                                        point,
                                        isDark,
                                    );

                                    // Only show ticker for medium cells
                                    if (!label.secondary) {
                                        return `<span style="font-size:${fontSize}px;font-weight:600;color:${labelColors.primary}">${label.primary}</span>`;
                                    }

                                    // Show ticker + selected metric for larger cells
                                    return `<div style="text-align:center;line-height:1.2">
                                    <div style="font-size:${fontSize}px;font-weight:600;color:${labelColors.primary}">${label.primary}</div>
                                    <div style="font-size:${Math.max(9, fontSize * 0.65)}px;color:${labelColors.secondary}">${label.secondary}</div>
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

        // The payload is coloured by price change, so a chart built while a fundamental
        // metric is selected -- a ?d= deep link, or a rebuild on index/theme change -- has
        // to be recoloured before the first paint. For price change nothing moves and this
        // is a no-op scan.
        if (applyMetricColors()) {
            chart.redraw();
        }

        isInitializing = false;
    }

    $: if (browser && data?.data && container) {
        initChart();
    }

    // Redraw, not rebuild: a rebuild would reset any drill-down the user is inside.
    // No "previous metric" state to go stale -- applyMetricColors reports whether the
    // repaint was a no-op, which is what decides the redraw.
    $: if (chart && metric) {
        if (applyMetricColors()) chart.redraw();
    }

    /**
     * The single owner of metric -> tile colour.
     *
     * Price change keeps its gradient. Every other metric is scaled to the axis by SIGN
     * only: the axis spans +/- a few percent while a fundamental is in the billions, so
     * feeding the raw value would make colour depend on the selected period -- a P/E of 35
     * saturating on 1D (axis +/-2) and reading a third green on 3Y (axis +/-100). Sign
     * scaling is also exactly the product rule: positive green, negative red, market cap
     * always green because it is always positive.
     *
     * `data?.colorRange` is read here rather than captured, so it can never go stale.
     */
    function colorValueFor(custom: any, pointValue?: number) {
        const value = metricValue(custom, pointValue, metric);
        if (value === null || metric === DEFAULT_METRIC) return value;

        return Math.sign(value) * (data?.colorRange || 10);
    }

    /**
     * Repaints every point for the current metric and reports whether anything moved, so
     * callers can skip the redraw. Sector and industry bands only carry a price aggregate,
     * so they fall back to neutral for any other metric rather than contradicting the
     * tiles underneath them.
     */
    function applyMetricColors(): boolean {
        const isPerformance = metric === DEFAULT_METRIC;
        let changed = false;

        for (const point of chart?.series?.[0]?.points ?? []) {
            const colorValue =
                point?.node?.level === 3
                    ? colorValueFor(point?.custom, point?.value)
                    : isPerformance
                      ? (groupColorValues.get(point?.options?.id) ?? null)
                      : null;

            if (point?.colorValue === colorValue) continue;

            point.update({ colorValue }, false);
            changed = true;
        }

        return changed;
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
    class="w-full h-[500px] sm:h-[600px] lg:h-[900px] rounded-container overflow-hidden border border-slate-200/90 bg-slate-50 dark:border-zinc-800 dark:bg-surface-card"
></div>
