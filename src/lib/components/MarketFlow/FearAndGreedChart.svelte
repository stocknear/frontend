<script lang="ts">
    import { screenWidth } from "$lib/store";
    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";
    import { onMount } from "svelte";

    export let fearAndGreedValue: number = 50;
    export let currentCategory: string = "Neutral";

    let mounted = false;

    onMount(() => {
        mounted = true;
    });

    // Get color based on value
    function getValueColor(value: number) {
        if (value <= 25) return "#EA6A47";
        if (value <= 45) return "#F89E4F";
        if (value <= 55) return "#FDDD5C";
        if (value <= 75) return "#93D3C1";
        return "#5AC864";
    }

    function plotFearAndGreed() {
        const inactiveColor = $mode === "light" ? "#E8E8E8" : "#27272A";

        const getSegmentColor = (segmentName) => {
            if (fearAndGreedValue <= 25 && segmentName === "extremeFear")
                return "#EA6A47";
            if (
                fearAndGreedValue > 25 &&
                fearAndGreedValue <= 45 &&
                segmentName === "fear"
            )
                return "#F89E4F";
            if (
                fearAndGreedValue > 45 &&
                fearAndGreedValue <= 55 &&
                segmentName === "neutral"
            )
                return "#FDDD5C";
            if (
                fearAndGreedValue > 55 &&
                fearAndGreedValue <= 75 &&
                segmentName === "greed"
            )
                return "#93D3C1";
            if (fearAndGreedValue > 75 && segmentName === "extremeGreed")
                return "#5AC864";
            return inactiveColor;
        };

        const options = {
            credits: { enabled: false },
            chart: {
                type: "gauge",
                backgroundColor: "transparent",
                plotBackgroundColor: "transparent",
                height: 200,
                animation: false,
                spacing: [0, 0, 0, 0],
                margin: [0, 0, 0, 0],
            },
            title: { text: null },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: { enabled: false },
                        inactive: { enabled: false },
                    },
                    dataLabels: { enabled: false },
                },
                gauge: { animation: false },
            },
            pane: {
                startAngle: -90,
                endAngle: 90,
                background: null,
                center: ["50%", "90%"],
                size: "160%",
            },
            yAxis: {
                min: 0,
                max: 100,
                tickPositions: [],
                minorTickInterval: null,
                tickLength: 0,
                tickWidth: 0,
                labels: { enabled: false },
                lineWidth: 0,
                plotBands: [
                    {
                        from: 0,
                        to: 25,
                        color: getSegmentColor("extremeFear"),
                        thickness: 28,
                        borderRadius: 4,
                    },
                    {
                        from: 25,
                        to: 45,
                        color: getSegmentColor("fear"),
                        thickness: 28,
                    },
                    {
                        from: 45,
                        to: 55,
                        color: getSegmentColor("neutral"),
                        thickness: 28,
                    },
                    {
                        from: 55,
                        to: 75,
                        color: getSegmentColor("greed"),
                        thickness: 28,
                    },
                    {
                        from: 75,
                        to: 100,
                        color: getSegmentColor("extremeGreed"),
                        thickness: 28,
                        borderRadius: 4,
                    },
                ],
            },
            series: [
                {
                    name: "Fear & Greed",
                    data: [fearAndGreedValue],
                    animation: false,
                    dataLabels: { enabled: false },
                    dial: {
                        radius: "75%",
                        backgroundColor:
                            $mode === "light" ? "#18181B" : "#FAFAFA",
                        baseWidth: 8,
                        baseLength: "0%",
                        rearLength: "0%",
                        topWidth: 2,
                    },
                    pivot: {
                        backgroundColor:
                            $mode === "light" ? "#18181B" : "#FAFAFA",
                        radius: 5,
                        borderWidth: 0,
                    },
                    states: { hover: { enabled: false } },
                },
            ],
            tooltip: { enabled: false },
        };

        return options;
    }

    let config: any = null;

    $: if (mounted && $mode !== undefined) {
        config = plotFearAndGreed();
    }

    $: valueColor = getValueColor(fearAndGreedValue);
</script>

<div
    class="relative border border-gray-300 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-950/40 p-4"
>
    <!-- Value display -->
    <div
        class="absolute inset-x-0 bottom-6 flex flex-col items-center justify-center z-10 pointer-events-none"
    >
        <div
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300"
            style="background: {valueColor}; box-shadow: 0 4px 20px {valueColor}40;"
        >
            <span
                class="text-lg sm:text-xl font-bold text-white drop-shadow-sm"
            >
                {fearAndGreedValue}
            </span>
        </div>
        <span
            class="text-xs font-semibold uppercase tracking-wider mt-2 transition-colors"
            style="color: {valueColor};"
        >
            {currentCategory}
        </span>
    </div>

    <!-- Highcharts gauge -->
    {#if config}
        <div use:highcharts={config}></div>
    {/if}
</div>
