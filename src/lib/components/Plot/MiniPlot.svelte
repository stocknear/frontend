<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { mode } from "mode-watcher";
    import { init, dispose, type KLineData } from "klinecharts";
    import { abbreviateNumber } from "$lib/utils";

    export let plotData = {};
    export let symbol = "";

    const nameDict = {
        SPY: "S&P 500",
        QQQ: "NASDAQ",
        DIA: "DOW",
        IWM: "RUSSELL",
    };

    let chartContainer: HTMLDivElement | null = null;
    let chart: ReturnType<typeof init> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeRaf: number | null = null;
    let lastContainerWidth = 0;
    let lastContainerHeight = 0;

    let changesPercentage = 0;
    let priceData: any[] = [];
    let relativeVolume = 0;
    let bullPercentage = 0;
    let bearPercentage = 0;
    let bullPrem = 0;
    let bearPrem = 0;
    let isPositive = true;
    let currentBarCount = 0;

    $: changesPercentage = plotData?.changesPercentage || 0;
    $: priceData = plotData?.price || [];
    $: relativeVolume = plotData?.relativeVolume || 0;
    $: bullPercentage = plotData?.bullPercentage || 0;
    $: bearPercentage = plotData?.bearPercentage || 0;
    $: bullPrem = plotData?.bullPrem || 0;
    $: bearPrem = plotData?.bearPrem || 0;

    // Guarded once, here, so every consumer inherits it. With the market closed
    // both percentages are 0, and the bar's always-rose track then rendered a
    // solid pink fill that reads as unanimous bearish flow. It means "no data".
    $: hasFlow = bullPercentage + bearPercentage > 0 || bullPrem + bearPrem > 0;

    // Zero is flat, not up: `>= 0` painted a 0.00% session green with a + sign.
    $: isPositive = changesPercentage > 0;
    $: isFlat = changesPercentage === 0;

    // Hiding the chart axes also removed klinecharts' last-price pill, which was
    // the one number on the card worth reading. It belongs in the header anyway,
    // next to the change it explains. Explicit length-1, never [-1].
    $: lastPrice =
        priceData?.length > 0
            ? toNumber(priceData[priceData.length - 1]?.close)
            : null;

    const toNumber = (value: unknown): number | null => {
        const n =
            typeof value === "number"
                ? value
                : typeof value === "string"
                  ? Number(value)
                  : NaN;
        return Number.isFinite(n) ? n : null;
    };

    const parseTimestamp = (value: unknown): number | null => {
        if (typeof value === "number" && Number.isFinite(value)) {
            if (value > 1e12) return Math.floor(value);
            if (value > 1e9) return Math.floor(value * 1000);
            return null;
        }

        if (typeof value !== "string") return null;
        const [datePart, timePart] = value.trim().split(" ");
        if (!datePart || !timePart) return null;

        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);

        if (
            !Number.isFinite(year) ||
            !Number.isFinite(month) ||
            !Number.isFinite(day) ||
            !Number.isFinite(hour) ||
            !Number.isFinite(minute)
        ) {
            return null;
        }

        const sec = Number.isFinite(second) ? second : 0;
        const localDate = new Date(year, month - 1, day, hour, minute, sec);
        return Date.UTC(
            localDate.getUTCFullYear(),
            localDate.getUTCMonth(),
            localDate.getUTCDate(),
            localDate.getUTCHours(),
            localDate.getUTCMinutes(),
            localDate.getUTCSeconds(),
        );
    };

    const formatXAxisLabel = (timestamp: number): string => {
        const value = new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
        return value.replace(/\s/g, "").replace(":00", "");
    };

    const buildMiniBars = (rawData: any[]): KLineData[] => {
        const list = Array.isArray(rawData) ? rawData : [];
        const parsed = list
            .map((item) => {
                const timestamp = parseTimestamp(item?.time ?? item?.date);
                const close = toNumber(item?.close);
                if (timestamp === null || close === null) return null;
                return {
                    timestamp,
                    close,
                    open: toNumber(item?.open),
                    high: toNumber(item?.high),
                    low: toNumber(item?.low),
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.timestamp - b.timestamp);

        if (!parsed.length) return [];

        let prevClose: number | null = null;
        return parsed.map((item) => {
            const openValue = item.open ?? prevClose ?? item.close;
            const highValue = item.high ?? Math.max(openValue, item.close);
            const lowValue = item.low ?? Math.min(openValue, item.close);
            prevClose = item.close;
            return {
                timestamp: item.timestamp,
                open: openValue,
                high: Math.max(highValue, openValue, item.close),
                low: Math.min(lowValue, openValue, item.close),
                close: item.close,
                volume: 0,
            };
        });
    };

    const updateBarSpace = () => {
        if (!chart || !chartContainer || currentBarCount <= 0) return;
        const paneWidth = chart.getSize("candle_pane", "main")?.width;
        const containerWidth = chartContainer.clientWidth || undefined;
        const chartWidth = chart.getSize()?.width;
        const width = paneWidth ?? containerWidth ?? chartWidth ?? 0;
        if (!width) return;
        const desired = width / currentBarCount;
        const clamped = Math.max(1, desired);
        chart.setBarSpace(clamped);
    };

    // The chart used to hardcode #16a34a/#dc2626, so the green in the card
    // disagreed with the green in the table directly beneath it. Reading the
    // tokens keeps one definition of "up" for the whole product. Re-read on
    // every theme change, because the variables are redefined by `.dark`.
    // The chart only ever initialises in onMount, so the document is always
    // present and every token is declared in app.css. One shared fallback keeps
    // this from smuggling a second palette back into the codebase.
    const CHART_FALLBACK = "#808080";
    const cssVar = (name: string) => {
        if (typeof window === "undefined") return CHART_FALLBACK;
        const value = getComputedStyle(document.documentElement)
            ?.getPropertyValue(name)
            ?.trim();
        return value || CHART_FALLBACK;
    };

    const applyMiniStyles = (isLight: boolean, isNegative: boolean) => {
        if (!chart) return;
        const upColor = cssVar("--up");
        const downColor = cssVar("--down");
        const axisText = cssVar("--fg-subtle");
        const gridColor = cssVar("--line");
        const chartFont = "Space Grotesk";
        // With the axes hidden these three colours drive only the last-price
        // rule (the pill moved into the card header), so it should read as a
        // reference line, not as the loudest mark on the card. `line.color` on
        // its own is ignored by klinecharts — up/down/noChange win.
        const lastPriceMarker = cssVar("--line-strong");
        const lastPriceText = cssVar("--surface-card");
        const lineColor = isNegative ? downColor : upColor;
        const fillColorStart = `color-mix(in oklch, ${lineColor} 16%, transparent)`;
        const fillColorEnd = `color-mix(in oklch, ${lineColor} 2%, transparent)`;
        chart.setStyles({
            // A 96px card cannot carry two axes. The y ticks were colliding with
            // the last-price pill (RUSSELL drew 298.81 across 299.40/298.20) and
            // the first x label was clipped to "0AM". The pill is the only number
            // that matters here; the rest was chart furniture.
            grid: { show: false },
            xAxis: {
                show: false,
                size: 0,
                axisLine: { show: false, color: "transparent", size: 0 },
                tickLine: {
                    show: false,
                    color: "transparent",
                    size: 0,
                    length: 0,
                },
                tickText: { show: false },
            },
            yAxis: {
                show: false,
                size: 0,
                axisLine: { show: false, color: "transparent", size: 0 },
                tickLine: {
                    show: false,
                    color: "transparent",
                    size: 0,
                    length: 0,
                },
                tickText: {
                    show: true,
                    color: axisText,
                    size: 9,
                    family: chartFont,
                    weight: 500,
                    marginStart: 2,
                    marginEnd: 2,
                },
            },
            crosshair: {
                show: false,
                horizontal: {
                    line: { show: false },
                    text: { show: false },
                },
                vertical: {
                    line: { show: false },
                    text: { show: false },
                },
            },
            candle: {
                type: "area",
                bar: {
                    compareRule: "current_open",
                    upColor,
                    downColor,
                    noChangeColor: axisText,
                    upBorderColor: upColor,
                    downBorderColor: downColor,
                    noChangeBorderColor: axisText,
                    upWickColor: upColor,
                    downWickColor: downColor,
                    noChangeWickColor: axisText,
                },
                area: {
                    value: "close",
                    lineSize: 1,
                    lineColor,
                    smooth: false,
                    backgroundColor: [
                        { offset: 0, color: fillColorStart },
                        { offset: 1, color: fillColorEnd },
                    ],
                    point: {
                        show: false,
                        color: "transparent",
                        radius: 0,
                        rippleColor: "transparent",
                        rippleRadius: 0,
                        animation: false,
                        animationDuration: 0,
                    },
                },
                priceMark: {
                    show: true,
                    high: { show: false },
                    low: { show: false },
                    last: {
                        show: true,
                        compareRule: "current_open",
                        line: {
                            show: true,
                            style: "dashed",
                            size: 1,
                            dashedValue: [4, 4],
                            // Was klinecharts' default, which rendered a heavy
                            // black rule louder than the price series itself.
                            color: gridColor,
                        },
                        text: {
                            show: true,
                            color: lastPriceText,
                            size: 9,
                            family: chartFont,
                            weight: 600,
                            borderSize: 0,
                            borderColor: "transparent",
                            borderRadius: 4,
                            paddingLeft: 4,
                            paddingRight: 4,
                            paddingTop: 2,
                            paddingBottom: 2,
                        },
                        upColor: lastPriceMarker ?? upColor,
                        downColor: lastPriceMarker ?? downColor,
                        noChangeColor: lastPriceMarker ?? axisText,
                    },
                },
                tooltip: { showRule: "none" },
            },
            indicator: {
                lastValueMark: { show: false },
                tooltip: { showRule: "none" },
            },
            separator: {
                size: 0,
                color: "transparent",
                fill: false,
                activeBackgroundColor: "transparent",
            },
        });
    };

    const updateChartData = (rawData: any[], ticker: string) => {
        if (!chart) return;
        const bars = buildMiniBars(rawData);
        currentBarCount = bars.length;

        if (!bars.length) {
            chart.setOffsetRightDistance(0);
            chart.setDataLoader({
                getBars: async ({ type, callback }) => {
                    callback([], { backward: false, forward: false });
                },
            });
            return;
        }

        chart.setSymbol({
            ticker: ticker ? ticker.toUpperCase() : "",
            pricePrecision: 2,
            volumePrecision: 0,
        });
        chart.setPeriod({ type: "minute", span: 1 });
        chart.setDataLoader({
            getBars: async ({ type, callback }) => {
                if (type === "init") {
                    callback(bars, { backward: false, forward: false });
                    return;
                }
                callback([], { backward: false, forward: false });
            },
        });
        updateBarSpace();
    };

    onMount(() => {
        if (!chartContainer) return;
        chart = init(chartContainer);
        if (!chart) return;
        chart.setZoomEnabled(false);
        chart.setScrollEnabled(false);
        chart.setOffsetRightDistance(0);
        chart.setLeftMinVisibleBarCount(0);
        chart.setRightMinVisibleBarCount(0);
        chart.setPaneOptions({
            id: "candle_pane",
            axis: {
                gap: { top: 0.08, bottom: 0.08 },
                position: "right",
                // `inside: true` drew the price labels on top of the area fill,
                // where they collided with the last-price pill (DOW showed
                // 520.00 underneath 519.26). Outside, the gutter is theirs.
                inside: false,
                scrollZoomEnabled: false,
            },
        });
        chart.setFormatter({
            formatDate: ({ timestamp, type }) => {
                if (type === "xAxis") {
                    return formatXAxisLabel(timestamp);
                }
                return formatXAxisLabel(timestamp);
            },
        });
        applyMiniStyles($mode === "light", changesPercentage < 0);
        updateChartData(priceData, symbol);

        resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const { width, height } = entry.contentRect;
            if (
                Math.round(width) === Math.round(lastContainerWidth) &&
                Math.round(height) === Math.round(lastContainerHeight)
            ) {
                return;
            }
            lastContainerWidth = width;
            lastContainerHeight = height;
            if (resizeRaf !== null) {
                cancelAnimationFrame(resizeRaf);
            }
            resizeRaf = requestAnimationFrame(() => {
                resizeRaf = null;
                chart?.resize();
                updateBarSpace();
            });
        });
        resizeObserver.observe(chartContainer);
    });

    onDestroy(() => {
        if (resizeRaf !== null) {
            cancelAnimationFrame(resizeRaf);
            resizeRaf = null;
        }
        resizeObserver?.disconnect();
        resizeObserver = null;
        if (chart) {
            dispose(chart);
            chart = null;
        }
    });

    $: if (chart) {
        changesPercentage;
        applyMiniStyles($mode === "light", changesPercentage < 0);
    }

    $: if (chart) {
        updateChartData(priceData, symbol);
    }
</script>

<div class="overflow-hidden text-fg">
    <div class="flex items-baseline justify-between gap-2 px-3 pt-2.5 pb-1">
        <span class="type-h3 text-fg">{nameDict[symbol]}</span>
        <span
            class="type-data-em {isFlat
                ? 'text-fg-muted'
                : isPositive
                  ? 'text-up'
                  : 'text-down'}"
        >
            {isPositive ? "+" : ""}{changesPercentage?.toFixed(2)}%
        </span>
    </div>
    <div class="px-3 pb-1">
        <span class="type-num text-fg">
            {lastPrice !== null
                ? lastPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                  })
                : "—"}
        </span>
    </div>

    <div class="flex flex-col">
        <!-- The relative-volume 2/1/0 axis used to sit immediately left of the
             price chart, where it read as the price axis. It is a number, not a
             chart, so it now lives in the footer as a labelled value. -->
        <div
            class="h-[96px] pointer-events-none"
            bind:this={chartContainer}
        ></div>

        <div class="border-t border-line bg-surface-sunken px-3 py-2.5">
            <div class="mb-1.5 flex items-baseline justify-between gap-2">
                <span class="type-th">Option Flow</span>
                <span class="type-meta text-fg-subtle tabular-nums">
                    RVOL {relativeVolume ? relativeVolume.toFixed(2) : "\u2014"}
                </span>
            </div>

            {#if hasFlow}
                <div class="flex items-baseline justify-between gap-2">
                    <span class="type-data-em text-up tabular-nums">
                        {bullPercentage}%
                        <span class="type-meta text-fg-subtle"
                            >({abbreviateNumber(bullPrem)})</span
                        >
                    </span>
                    <span class="type-data-em text-down tabular-nums">
                        <span class="type-meta text-fg-subtle"
                            >({abbreviateNumber(bearPrem)})</span
                        >
                        {bearPercentage}%
                    </span>
                </div>

                <div
                    class="mt-1.5 flex h-1 w-full overflow-hidden rounded-full"
                >
                    <div
                        class="h-full bg-up transition-all duration-700"
                        style="width: {bullPercentage}%"
                    ></div>
                    <div
                        class="h-full flex-1 bg-down transition-all duration-700"
                    ></div>
                </div>
            {:else}
                <!-- No flow is not the same as 100% bearish. The old markup had
                     an always-rose track, so a closed market painted every card
                     solid pink. Neutral hairline plus an explicit label. -->
                <div class="flex items-baseline justify-between gap-2">
                    <span class="type-data-em text-fg-subtle">&mdash;</span>
                    <span class="type-meta text-fg-subtle">No flow</span>
                </div>
                <div class="mt-1.5 h-1 w-full rounded-full bg-line"></div>
            {/if}
        </div>
    </div>
</div>
