<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { mode } from "mode-watcher";
    import { init, dispose, registerXAxis, type KLineData } from "klinecharts";
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

    let changesPercentage = 0;
    let priceData: any[] = [];
    let relativeVolume = 0;
    let bullPercentage = 0;
    let bearPercentage = 0;
    let bullPrem = 0;
    let bearPrem = 0;
    let isPositive = true;
    let sessionStart: number | null = null;
    let sessionEnd: number | null = null;
    let miniAxisRegistered = false;

    const MINI_X_AXIS_NAME = "mini_x_axis";
    const MINI_AXIS_LABELS = [
        { label: "9:30 AM", minutes: 9 * 60 + 30 },
        { label: "11 AM", minutes: 11 * 60 },
        { label: "1 PM", minutes: 13 * 60 },
        { label: "4 PM", minutes: 16 * 60 },
    ];
    const MINI_AXIS_START_MIN = 9 * 60 + 30;
    const MINI_AXIS_END_MIN = 16 * 60;
    const MINI_AXIS_RANGE_MIN = MINI_AXIS_END_MIN - MINI_AXIS_START_MIN;

    const ensureMiniXAxis = () => {
        if (miniAxisRegistered) return;
        registerXAxis({
            name: MINI_X_AXIS_NAME,
            createTicks: ({ bounding }) => {
                const width = Math.max(bounding.width, 0);
                if (width <= 0) return [];
                const leftPad = 6;
                const rightPad = 10;
                const usableWidth = Math.max(width - leftPad - rightPad, 1);
                return MINI_AXIS_LABELS?.map((tick) => {
                    const ratio =
                        (tick.minutes - MINI_AXIS_START_MIN) /
                        MINI_AXIS_RANGE_MIN;
                    const coord = leftPad + usableWidth * ratio;
                    return {
                        coord,
                        value: tick.minutes,
                        text: tick.label,
                    };
                });
            },
        });
        miniAxisRegistered = true;
    };

    $: changesPercentage = plotData?.changesPercentage || 0;
    $: priceData = plotData?.price || [];
    $: relativeVolume = plotData?.relativeVolume || 0;
    $: bullPercentage = plotData?.bullPercentage || 0;
    $: bearPercentage = plotData?.bearPercentage || 0;
    $: bullPrem = plotData?.bullPrem || 0;
    $: bearPrem = plotData?.bearPrem || 0;

    $: isPositive = changesPercentage >= 0;

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
        const isBoundary =
            (sessionStart !== null && timestamp === sessionStart) ||
            (sessionEnd !== null && timestamp === sessionEnd);
        const value = new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            ...(isBoundary ? { minute: "2-digit" } : {}),
            hour12: true,
        });
        return value.replace(/\s/g, "").replace(":00", "");
    };

    const buildSessionTimestamp = (
        baseTimestamp: number,
        hours: number,
        minutes: number,
    ): number => {
        const baseDate = new Date(baseTimestamp);
        const localDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            hours,
            minutes,
            0,
            0,
        );
        return Date.UTC(
            localDate.getUTCFullYear(),
            localDate.getUTCMonth(),
            localDate.getUTCDate(),
            localDate.getUTCHours(),
            localDate.getUTCMinutes(),
            localDate.getUTCSeconds(),
            localDate.getUTCMilliseconds(),
        );
    };

    const makeFlatBar = (timestamp: number, close: number): KLineData => ({
        timestamp,
        open: close,
        high: close,
        low: close,
        close,
        volume: 0,
    });

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
        const bars = parsed.map((item) => {
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

        const sessionStart = buildSessionTimestamp(bars[0].timestamp, 9, 30);
        const sessionEnd = buildSessionTimestamp(bars[0].timestamp, 16, 0);
        let sessionBars = bars.filter(
            (bar) =>
                bar.timestamp >= sessionStart && bar.timestamp <= sessionEnd,
        );
        if (!sessionBars.length) {
            sessionBars = [...bars];
        }

        const output = [...sessionBars];
        const first = output[0];
        const last = output[output.length - 1];

        if (first && first.timestamp > sessionStart) {
            output.unshift(makeFlatBar(sessionStart, first.close));
        }
        if (last && last.timestamp < sessionEnd) {
            output.push(makeFlatBar(sessionEnd, last.close));
        }

        return output.sort((a, b) => a.timestamp - b.timestamp);
    };

    const updateBarSpace = (barCount: number) => {
        if (!chart || !chartContainer || barCount <= 0) return;
        const paneWidth = chart.getSize("candle_pane", "main")?.width;
        const containerWidth = chartContainer.clientWidth || undefined;
        const chartWidth = chart.getSize()?.width;
        const width = paneWidth ?? containerWidth ?? chartWidth ?? 0;
        if (!width) return;
        const desired = width / barCount;
        const clamped = Math.max(0.2, desired);
        chart.setBarSpace(clamped);
    };

    const applyMiniStyles = (isLight: boolean) => {
        if (!chart) return;
        const upColor = isLight ? "#16a34a" : "#22c55e";
        const downColor = isLight ? "#dc2626" : "#ef4444";
        const axisText = isLight ? "#64748b" : "#94a3b8";
        const gridColor = isLight
            ? "rgba(148, 163, 184, 0.35)"
            : "rgba(148, 163, 184, 0.25)";
        const chartFont = "Space Grotesk";
        const lastPriceMarker = "#111112";
        const lastPriceText = "#ffffff";
        chart.setStyles({
            grid: {
                show: true,
                horizontal: {
                    show: true,
                    style: "dashed",
                    size: 1,
                    color: gridColor,
                    dashedValue: [3, 3],
                },
                vertical: {
                    show: true,
                    style: "dashed",
                    size: 1,
                    color: gridColor,
                    dashedValue: [3, 3],
                },
            },
            xAxis: {
                show: true,
                size: "auto",
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
                    marginStart: 1,
                    marginEnd: 1,
                },
            },
            yAxis: {
                show: true,
                size: "auto",
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
                type: "candle_solid",
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
        sessionStart = bars[0]?.timestamp ?? null;
        sessionEnd = bars[bars.length - 1]?.timestamp ?? null;
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
        updateBarSpace(bars.length);
        if (bars.length) {
            chart.scrollToRealTime();
        }
    };

    onMount(() => {
        if (!chartContainer) return;
        ensureMiniXAxis();
        chart = init(chartContainer);
        if (!chart) return;
        chart.setZoomEnabled(false);
        chart.setScrollEnabled(false);
        chart.setOffsetRightDistance(0);
        chart.setMaxOffsetLeftDistance(0);
        chart.setMaxOffsetRightDistance(0);
        chart.setLeftMinVisibleBarCount(0);
        chart.setRightMinVisibleBarCount(0);
        chart.setPaneOptions({
            id: "candle_pane",
            axis: {
                gap: { top: 0.02, bottom: 0.02 },
                position: "right",
                inside: true,
                scrollZoomEnabled: false,
            },
        });
        chart.setPaneOptions({
            id: "x_axis_pane",
            axis: {
                name: MINI_X_AXIS_NAME,
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
        applyMiniStyles($mode === "light");
        updateChartData(priceData, symbol);

        resizeObserver = new ResizeObserver(() => {
            chart?.resize();
            updateBarSpace(chart?.getDataList()?.length ?? 0);
        });
        resizeObserver.observe(chartContainer);
    });

    onDestroy(() => {
        resizeObserver?.disconnect();
        resizeObserver = null;
        if (chart) {
            dispose(chart);
            chart = null;
        }
    });

    $: if (chart) {
        applyMiniStyles($mode === "light");
    }

    $: if (chart) {
        updateChartData(priceData, symbol);
    }
</script>

<div
    class=" bg-white/60 dark:bg-zinc-950/40 overflow-hidden text-gray-700 dark:text-zinc-200"
>
    <div
        class="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 border-b border-gray-300 dark:border-zinc-700"
    >
        <div class="flex items-center gap-1 sm:gap-2">
            <span
                class="text-xs sm:text-sm font-semibold tracking-tight text-gray-900 dark:text-white"
                >{nameDict[symbol]}</span
            >
        </div>
        <div
            class="text-[10px] sm:text-xs font-semibold tabular-nums {isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'}"
        >
            ({isPositive ? "+" : ""}{changesPercentage?.toFixed(2)}%)
        </div>
    </div>

    <div class="flex flex-col">
        <div class="flex flex-row items-stretch pt-2">
            <div class="flex flex-col items-center -mr-6">
                <div class="-ml-5 flex flex-row items-stretch h-[90px]">
                    <div
                        class="flex flex-col justify-between pr-1 text-[0.55rem] text-gray-800 dark:text-zinc-300 select-none text-right w-4"
                    >
                        <div>2</div>
                        <div>1</div>
                        <div>0</div>
                    </div>
                    <div
                        class="relative w-1.5 bg-gray-200/70 dark:bg-zinc-800/70 overflow-hidden"
                    >
                        <div
                            class="absolute bottom-0 left-0 right-0 bg-gray-800/70 dark:bg-zinc-200/30 transition-all duration-500"
                            style="height: {Math.min(
                                relativeVolume * 50,
                                100,
                            )}%;"
                        ></div>
                    </div>
                </div>
                <div
                    class="ml-1 mb-1 mt-1 text-[0.4rem] sm:text-[0.5rem] uppercase tracking-wide text-gray-800 dark:text-zinc-300 font-semibold"
                >
                    Relative Vol
                </div>
            </div>

            <div
                class="flex-1 h-[90px] pointer-events-none bg-gradient-to-b from-white/40 to-transparent dark:from-zinc-900/40"
                bind:this={chartContainer}
            ></div>
        </div>

        <div
            class="h-[40px] sm:h-[50px] px-2 pt-1 pb-2 border-t border-gray-300 dark:border-zinc-700 bg-gray-50/60 dark:bg-zinc-900/40"
        >
            <!-- top row -->
            <div
                class="grid grid-cols-3 items-start gap-2 w-full h-5 sm:h-6 mb-1.5"
            >
                <!-- left -->
                <div
                    class="min-w-0 text-[0.6rem] sm:text-[0.65rem] leading-none"
                >
                    <span
                        class="py-0.5 block uppercase font-semibold text-gray-800 dark:text-zinc-300 tracking-wide"
                        >Bull</span
                    >
                    <span
                        class="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums"
                    >
                        {bullPercentage}%
                        <span class="hidden sm:inline-block"
                            >({abbreviateNumber(bullPrem)})</span
                        >
                    </span>
                </div>

                <!-- center -->
                <div
                    class="min-w-0 text-center text-[0.6rem] font-semibold uppercase tracking-wide text-gray-800 dark:text-zinc-300 leading-tight whitespace-nowrap"
                >
                    Option Flow
                </div>

                <!-- right -->
                <div
                    class="min-w-0 text-[0.6rem] sm:text-[0.65rem] leading-none text-right"
                >
                    <span
                        class="py-0.5 block uppercase font-semibold text-gray-800 dark:text-zinc-300 tracking-wide"
                        >Bear</span
                    >
                    <span
                        class="font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap sm:-ml-4 tabular-nums"
                    >
                        <span class="hidden sm:inline-block"
                            >({abbreviateNumber(bearPrem)})</span
                        >
                        {bearPercentage}%
                    </span>
                </div>
            </div>

            <!-- bar -->
            <div
                class="relative w-full h-1.5 bg-rose-500/30 dark:bg-rose-500/25 rounded-full overflow-hidden"
            >
                <div
                    class="h-full bg-emerald-500/40 dark:bg-emerald-500/35 transition-all duration-700"
                    style="width: {bullPercentage}%"
                ></div>
            </div>
        </div>
    </div>
</div>
