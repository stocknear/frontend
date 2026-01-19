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

        const getBorderColor = (segmentName) => {
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
                return "#26A892";
            if (fearAndGreedValue > 75 && segmentName === "extremeGreed")
                return "#47B84A";
            return "transparent";
        };

        // Responsive settings
        const isMobile = $screenWidth < 640;
        const bgColor = $mode === "light" ? "#000" : "#fff";
        const textColor = $mode === "light" ? "#fff" : "#000";
        const categoryColor = $mode === "light" ? "#374151" : "#e5e7eb";
        const circleSize = isMobile ? 50 : 70;
        const fontSize = isMobile ? 16 : 22;
        const paneSize = isMobile ? "110%" : "140%";
        const paneCenter = isMobile ? ["50%", "80%"] : ["50%", "85%"];
        const dataLabelY = isMobile ? 55 : 80;
        const chartHeight = isMobile ? 280 : 360;
        const bandThickness = isMobile ? 28 : 36;

        const options = {
            credits: { enabled: false },
            chart: {
                type: "gauge",
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: chartHeight,
                animation: false,
            },
            title: null,
            pane: {
                center: paneCenter,
                size: paneSize,
                startAngle: -90,
                endAngle: 90,
                background: [
                    {
                        backgroundColor: "transparent",
                        borderWidth: 0,
                        outerRadius: "100%",
                        innerRadius: "60%",
                        shape: "arc",
                    },
                ],
            },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: { enabled: false },
                        inactive: { enabled: false },
                    },
                },
                gauge: {
                    animation: false,
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        borderWidth: 0,
                        y: dataLabelY,
                    },
                },
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
                    y: 16,
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
                        thickness: bandThickness,
                        borderColor: getBorderColor("extremeFear"),
                        borderWidth:
                            getBorderColor("extremeFear") === "transparent"
                                ? 0
                                : 3,
                    },
                    {
                        from: 25,
                        to: 45,
                        color: getSegmentColor("fear"),
                        thickness: bandThickness,
                        borderColor: getBorderColor("fear"),
                        borderWidth:
                            getBorderColor("fear") === "transparent" ? 0 : 3,
                    },
                    {
                        from: 45,
                        to: 55,
                        color: getSegmentColor("neutral"),
                        thickness: bandThickness,
                        borderColor: getBorderColor("neutral"),
                        borderWidth:
                            getBorderColor("neutral") === "transparent" ? 0 : 3,
                    },
                    {
                        from: 55,
                        to: 75,
                        color: getSegmentColor("greed"),
                        thickness: bandThickness,
                        borderColor: getBorderColor("greed"),
                        borderWidth:
                            getBorderColor("greed") === "transparent" ? 0 : 3,
                    },
                    {
                        from: 75,
                        to: 100,
                        color: getSegmentColor("extremeGreed"),
                        thickness: bandThickness,
                        borderColor: getBorderColor("extremeGreed"),
                        borderWidth:
                            getBorderColor("extremeGreed") === "transparent"
                                ? 0
                                : 3,
                    },
                ],
            },
            series: [
                {
                    name: "Fear & Greed",
                    data: [fearAndGreedValue],
                    animation: false,
                    dataLabels: {
                        formatter: function () {
                            return `<div style="text-align:center">
                                <div style="width:${circleSize}px;height:${circleSize}px;border-radius:50%;background:${bgColor};display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 6px 16px rgba(0,0,0,0.3)">
                                    <span style="font-size:${fontSize}px;font-weight:800;color:${textColor}">${this.y}</span>
                                </div>
                                <div style="font-size:14px;color:${categoryColor};margin-top:8px;text-transform:capitalize;font-weight:500">${currentCategory}</div>
                            </div>`;
                        },
                    },
                    dial: {
                        radius: "80%",
                        backgroundColor: $mode === "light" ? "#161616" : "#fff",
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

    $: if ($mode || $screenWidth) {
        config = plotFearAndGreed();
    }
</script>

<div
    class="border border-gray-300 dark:border-zinc-700 rounded-2xl h-[280px] sm:h-[360px] overflow-hidden"
    use:highcharts={config}
></div>
