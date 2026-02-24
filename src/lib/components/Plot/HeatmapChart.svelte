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

                    // Draw ticker name
                    ctx.font = `600 ${fontSize}px 'Space Grotesk', sans-serif`;
                    ctx.fillStyle = "white";

                    const perf = point.custom?.performance || "";
                    const showPerf = w >= 60 && h >= 45 && perf;

                    if (showPerf) {
                        // Ticker above center, perf below
                        ctx.fillText(point.name, cx, cy - fontSize * 0.35);
                        const perfSize = Math.max(9, fontSize * 0.65);
                        ctx.font = `400 ${perfSize}px 'Space Grotesk', sans-serif`;
                        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
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

                    const fullName = point.custom.fullName || point.name;
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
