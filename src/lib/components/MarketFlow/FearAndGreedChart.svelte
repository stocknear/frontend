<script lang="ts">
    import { screenWidth } from "$lib/store";
    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";

    export let fearAndGreedValue: number = 50;
    export let currentCategory: string = "Neutral";

    function plotFearAndGreed() {
        const inactiveColor = $mode === "light" ? "#EFEFEF" : "#2E2E2E";
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

        // border color for the active band (mint outline shown on screenshot)
        const getBorderColor = (segmentName) => {
            // only return visible border for the currently active segment
            if (fearAndGreedValue <= 25 && segmentName === "extremeFear")
                return "#D94A30";
            if (
                fearAndGreedValue > 25 &&
                fearAndGreedValue <= 45 &&
                segmentName === "fear"
            )
                return "#D87A2B";
            if (
                fearAndGreedValue > 45 &&
                fearAndGreedValue <= 55 &&
                segmentName === "neutral"
            )
                return "#CFAF2A";
            if (
                fearAndGreedValue > 55 &&
                fearAndGreedValue <= 75 &&
                segmentName === "greed"
            )
                return "#26A892"; // mint/teal border
            if (fearAndGreedValue > 75 && segmentName === "extremeGreed")
                return "#47B84A";
            return "transparent";
        };

        // helper to check whether a segment is currently active
        const isActive = (segmentName) => {
            if (segmentName === "extremeFear") return fearAndGreedValue <= 25;
            if (segmentName === "fear")
                return fearAndGreedValue > 25 && fearAndGreedValue <= 45;
            if (segmentName === "neutral")
                return fearAndGreedValue > 45 && fearAndGreedValue <= 55;
            if (segmentName === "greed")
                return fearAndGreedValue > 55 && fearAndGreedValue <= 75;
            if (segmentName === "extremeGreed") return fearAndGreedValue > 75;
            return false;
        };

        // helper to return label text (or null when inactive). Accepts an optional HTML label for multi-line labels.
        const getLabelText = (segmentName, labelHtml) => {
            // hide label entirely on small screens as before
            if ($screenWidth < 640) return null;
            return isActive(segmentName) ? labelHtml : null;
        };

        const options = {
            credits: { enabled: false },
            chart: {
                type: "gauge",
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 360,
                animation: false, // disable chart-level animation
            },

            // Disable animations globally for series/gauge and disable hover states
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: { enabled: false },
                        inactive: { enabled: false },
                    },
                    dataLabels: {
                        animation: false,
                    },
                },
                gauge: {
                    animation: false,
                },
            },

            title: {
                text: `
    <div class="text-center mt-3 -mb-12">
        <!-- Circle wrapper -->
        <div
            class="w-[55px] h-[55px] sm:w-[70px] sm:h-[70px] rounded-full
                   ${
                       $mode === "light"
                           ? "bg-black shadow-[0_12px_20px_rgba(0,0,0,0.12)]"
                           : "bg-[#fff] shadow-[0_6px_16px_rgba(0,0,0,0.4)]"
                   }
                   flex items-center justify-center mx-auto"
        >
            <div class="text-xl font-extrabold ${$mode === "light" ? "text-white" : "text-black"}">
                ${fearAndGreedValue}
            </div>
        </div>

        <!-- Subtitle -->
        <div class="text-sm sm:hidden capitalize ${$mode === "light" ? "text-gray-800" : "text-gray-100"} mt-2">
            ${currentCategory}
        </div>
    </div>
    `,
                useHTML: true,
                verticalAlign: "middle",
                y: 70,
            },
            pane: {
                startAngle: -90,
                endAngle: 90,
                background: [
                    {
                        backgroundColor: "transparent",
                        borderWidth: 0,
                        outerRadius: "100%",
                    },
                    {
                        backgroundColor:
                            $mode === "light" ? "#ffffff" : "#18181b",
                        borderWidth: 0,
                        innerRadius: "60%",
                        outerRadius: "60%",
                        shape: "arc",
                    },
                ],
                center: ["50%", "75%"],
                size: "100%",
            },
            yAxis: {
                min: 0,
                max: 100,
                tickPositions: [0, 25, 50, 75, 100],
                minorTickInterval: null,
                tickLength: 0,
                tickWidth: 0,
                labels: {
                    distance: 20,
                    style: {
                        color: $mode === "light" ? "#6b7280" : "#d1d5db",
                        fontSize: "13px",
                        fontWeight: "600",
                    },
                    formatter: function () {
                        return [0, 25, 50, 75, 100].includes(this.value)
                            ? this.value
                            : "";
                    },
                },
                lineWidth: 0,
                plotBands: [
                    {
                        from: 0,
                        to: 25,
                        color: getSegmentColor("extremeFear"),
                        thickness: 36,
                        borderColor: getBorderColor("extremeFear"),
                        borderWidth:
                            getBorderColor("extremeFear") === "transparent"
                                ? 0
                                : 3,
                        label: {
                            text: getLabelText(
                                "extremeFear",
                                "EXTREME<br/>FEAR",
                            ),
                            useHTML: true,
                            align: "center",
                            verticalAlign: "middle",
                            x: 40,
                            y: -22,
                            style: {
                                color: isActive("extremeFear")
                                    ? "#fff"
                                    : $mode === "light"
                                      ? "#000"
                                      : "#9ca3af",
                                fontSize: "14px",
                                fontWeight: "600",
                                textAlign: "center",
                            },
                        },
                    },
                    {
                        from: 25,
                        to: 45,
                        color: getSegmentColor("fear"),
                        thickness: 36,
                        borderColor: getBorderColor("fear"),
                        borderWidth:
                            getBorderColor("fear") === "transparent" ? 0 : 3,
                        label: {
                            text: getLabelText("fear", "FEAR"),
                            align: "center",
                            verticalAlign: "middle",
                            x: 55,
                            y: -44,
                            style: {
                                color: isActive("fear")
                                    ? "#fff"
                                    : $mode === "light"
                                      ? "#000"
                                      : "#9ca3af",
                                fontSize: "14px",
                                fontWeight: "600",
                            },
                        },
                    },
                    {
                        from: 45,
                        to: 55,
                        color: getSegmentColor("neutral"),
                        thickness: 36,
                        borderColor: getBorderColor("neutral"),
                        borderWidth:
                            getBorderColor("neutral") === "transparent" ? 0 : 3,
                        label: {
                            text: getLabelText("neutral", "NEUTRAL"),
                            align: "center",
                            verticalAlign: "middle",
                            x: -200,
                            y: -40,
                            style: {
                                color: isActive("neutral")
                                    ? $mode === "light"
                                        ? "#333"
                                        : "#e5e7eb"
                                    : $mode === "light"
                                      ? "#000"
                                      : "#9ca3af",
                                fontSize: "14px",
                                fontWeight: "600",
                            },
                        },
                    },
                    {
                        from: 55,
                        to: 75,
                        color: getSegmentColor("greed"),
                        thickness: 36,
                        borderColor: getBorderColor("greed"),
                        borderWidth:
                            getBorderColor("greed") === "transparent" ? 0 : 3,
                        label: {
                            text: getLabelText("greed", "GREED"),
                            align: "center",
                            verticalAlign: "middle",
                            x: -30,
                            y: -44,
                            style: {
                                color: isActive("greed")
                                    ? $mode === "light"
                                        ? "#333"
                                        : "#e5e7eb"
                                    : $mode === "light"
                                      ? "#000"
                                      : "#9ca3af",
                                fontSize: "14px",
                                fontWeight: "600",
                            },
                        },
                    },
                    {
                        from: 75,
                        to: 100,
                        color: getSegmentColor("extremeGreed"),
                        thickness: 36,
                        borderColor: getBorderColor("extremeGreed"),
                        borderWidth:
                            getBorderColor("extremeGreed") === "transparent"
                                ? 0
                                : 3,
                        label: {
                            text: getLabelText(
                                "extremeGreed",
                                "EXTREME<br/>GREED",
                            ),
                            useHTML: true,
                            align: "center",
                            verticalAlign: "middle",
                            x: -50,
                            y: -22,
                            style: {
                                color: isActive("extremeGreed")
                                    ? "#fff"
                                    : $mode === "light"
                                      ? "#000"
                                      : "#9ca3af",
                                fontSize: "14px",
                                fontWeight: "600",
                                textAlign: "center",
                            },
                        },
                    },
                ],
            },
            series: [
                {
                    name: "Fear & Greed",
                    data: [fearAndGreedValue],
                    animation: false, // disable series-level animation
                    tooltip: { valueSuffix: "" },
                    dataLabels: { enabled: false, animation: false },
                    dial: {
                        radius: "80%",
                        backgroundColor: $mode === "light" ? "#161616" : "#fff", // black vs golden needle
                        baseWidth: 10,
                        baseLength: "10%",
                        rearLength: "-10%",
                        topWidth: 1,
                    },
                    pivot: {
                        backgroundColor: $mode === "light" ? "#fff" : "#1f2937",
                        radius: 6,
                        borderColor: $mode === "light" ? "#000" : "#e5e7eb",
                        borderWidth: 1,
                    },
                    states: {
                        hover: { enabled: false },
                    },
                },
            ],
            tooltip: { enabled: false },
        };

        return options;
    }

    let config: any = null;

    $: if ($mode) {
        config = plotFearAndGreed();
    }
</script>

<div
    class="border border-gray-300 dark:border-zinc-700 rounded-2xl"
    use:highcharts={config}
></div>
