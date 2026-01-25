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

    let changesPercentage = 0;
    let priceData: any[] = [];
    let relativeVolume = 0;
    let bullPercentage = 0;
    let bearPercentage = 0;
    let bullPrem = 0;
    let bearPrem = 0;
    let isPositive = true;

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
        return Date.UTC(year, month - 1, day, hour, minute, sec);
    };

    const buildMiniBars = (rawData: any[]): KLineData[] => {
        const list = Array.isArray(rawData) ? rawData : [];
        return list
            .map((item) => {
                const timestamp = parseTimestamp(item?.time ?? item?.date);
                const close = toNumber(item?.close);
                if (timestamp === null || close === null) return null;
                return {
                    timestamp,
                    open: close,
                    high: close,
                    low: close,
                    close,
                    volume: 0,
                };
            })
            .filter((bar): bar is KLineData => Boolean(bar))
            .sort((a, b) => a.timestamp - b.timestamp);
    };

    const applyMiniStyles = (isNegative: boolean, isLight: boolean) => {
        if (!chart) return;
        const lineColor = isNegative
            ? isLight
                ? "#dc2626"
                : "#f87171"
            : isLight
              ? "#16a34a"
              : "#34d399";

        const fillColorStart = isNegative
            ? "rgba(220, 38, 38, 0.18)"
            : "rgba(22, 163, 74, 0.16)";

        const fillColorEnd = isNegative
            ? "rgba(220, 38, 38, 0.02)"
            : "rgba(22, 163, 74, 0.02)";

        chart.setStyles({
            grid: { show: false },
            xAxis: { show: false },
            yAxis: { show: false },
            crosshair: { show: false },
            candle: {
                type: "area",
                area: {
                    lineColor,
                    lineSize: 1,
                    smooth: true,
                    value: "close",
                    backgroundColor: [
                        { offset: 0, color: fillColorStart },
                        { offset: 1, color: fillColorEnd },
                    ],
                    point: {
                        show: false,
                        radius: 0,
                        rippleRadius: 0,
                        animation: false,
                    },
                },
                priceMark: {
                    show: false,
                    high: { show: false },
                    low: { show: false },
                    last: { show: false },
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
        if (bars.length) {
            chart.scrollToRealTime();
        }
    };

    onMount(() => {
        if (!chartContainer) return;
        chart = init(chartContainer, { timezone: "America/New_York" });
        if (!chart) return;
        chart.setZoomEnabled(false);
        chart.setScrollEnabled(false);
        chart.setOffsetRightDistance(0);
        applyMiniStyles(changesPercentage < 0, $mode === "light");
        updateChartData(priceData, symbol);

        resizeObserver = new ResizeObserver(() => chart?.resize());
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
        applyMiniStyles(changesPercentage < 0, $mode === "light");
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

                <div class="flex-1 h-[90px]" bind:this={chartContainer}></div>
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
