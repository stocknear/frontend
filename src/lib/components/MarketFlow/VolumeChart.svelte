<script lang="ts">
    import { abbreviateNumber } from "$lib/utils";
    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";

    export let overview: any = {};

    function plotVolume() {
        const currentVol = overview?.putVol + overview?.callVol ?? 0;
        const benchmarkVol =
            overview?.avg30Vol * 2 > currentVol
                ? overview?.avg30Vol * 2
                : currentVol;

        const band1 = benchmarkVol * 0.2;
        const band2 = benchmarkVol * 0.4;
        const band3 = benchmarkVol * 0.6;
        const band4 = benchmarkVol * 0.8;

        const optionsVolume = {
            credits: { enabled: false },

            chart: {
                type: "gauge",
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 280,
                animation: false,
            },

            title: {
                text: `<h3 class="">Volume</h3>`,
                style: {
                    color: $mode === "light" ? "black" : "white",
                },
                useHTML: true,
            },

            pane: {
                startAngle: -90,
                endAngle: 90,
                background: [
                    {
                        outerRadius: "101%",
                        innerRadius: "100%",
                        backgroundColor: "#000",
                        borderWidth: 0,
                        shape: "arc",
                    },
                    null,
                ],
            },

            yAxis: {
                min: 0,
                max: benchmarkVol,
                tickPosition: "outside",
                tickLength: 0,
                tickWidth: 0,
                minorTickInterval: null,
                lineWidth: 0,
                labels: {
                    enabled: true,
                    distance: 20,
                    style: {
                        color: $mode === "light" ? "#000" : "#fff",
                        fontSize: "15px",
                    },
                    formatter: function () {
                        return abbreviateNumber(this.value);
                    },
                    y: 0,
                },
                plotBands: [
                    { from: 0, to: band1, color: "#55BF3B", thickness: 20 },
                    { from: band1, to: band2, color: "#55BF3B", thickness: 20 },
                    { from: band2, to: band3, color: "#DDDF0D", thickness: 20 },
                    { from: band3, to: band4, color: "#DF5353", thickness: 20 },
                    {
                        from: band4,
                        to: benchmarkVol,
                        color: "#DF5353",
                        thickness: 20,
                    },
                ],
            },

            series: [
                {
                    name: "Vol",
                    data: [currentVol],
                    animation: false,
                    dataLabels: {
                        useHTML: true,
                        backgroundColor: "none",
                        borderWidth: 0,
                        shadow: false,
                        formatter: function () {
                            return `<span class="text-lg font-bold">${abbreviateNumber(this.y)}</span>`;
                        },
                    },
                    dial: {
                        radius: "80%",
                        backgroundColor: $mode === "light" ? "#000" : "#808080",
                        baseWidth: 12,
                        baseLength: "0%",
                        rearLength: "0%",
                    },
                },
            ],
        };

        const actualValue = overview?.pcVol ?? 0;

        const optionsVolumePutCall = {
            credits: {
                enabled: false,
            },
            chart: {
                type: "gauge",
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 280,
                animation: false, // Disable initial animation
            },

            title: {
                text: `<h3 class="">Put-Call Ratio</h3>`,
                style: {
                    color: $mode === "light" ? "black" : "white",
                    // Using inline CSS for margin-top and margin-bottom
                },
                useHTML: true, // Enable HTML to apply custom class styling
            },

            pane: {
                startAngle: -90,
                endAngle: 90,
                background: [
                    {
                        // Outer circle (black line)
                        outerRadius: "101%",
                        innerRadius: "100%",
                        backgroundColor: "#000",
                        borderWidth: 0,
                        shape: "arc",
                    },
                    null, // keep existing null if needed
                ],
            },

            // the value axis
            yAxis: {
                min: 0,
                max: 2,
                tickPosition: "outside",
                tickLength: 10,
                tickWidth: 0,
                tickPositions: [0, 1, 2],
                minorTickInterval: null,
                lineWidth: 0,
                labels: {
                    enabled: true,
                    distance: 20, // move closer to the center
                    style: {
                        color: $mode === "light" ? "#000" : "#fff",
                        fontSize: "15px",
                    },
                    formatter: function () {
                        return this.value;
                    },
                    y: -0, // adjust vertical position upward
                },
                plotBands: [
                    {
                        from: 0,
                        to: 0.49,
                        color: "#55BF3B",
                        thickness: 20,
                        borderRadius: "0px",
                    },
                    {
                        from: 0.49,
                        to: 0.5,
                        color: "#fff",
                        thickness: 20,
                        borderRadius: "0px",
                    },
                    {
                        from: 0.5,
                        to: 0.99,
                        color: "#DDDF0D",
                        thickness: 20,
                        borderRadius: "0px",
                    },
                    {
                        from: 0.99,
                        to: 1,
                        color: "#fff",
                        thickness: 20,
                        borderRadius: "0px",
                    },
                    {
                        from: 1,
                        to: 2,
                        color: "#DF5353",
                        thickness: 20,
                        borderRadius: "0px",
                    },
                ],
            },

            series: [
                {
                    name: "Vol P/C",
                    data: [Math.min(actualValue, 2)], // dial limited to 2
                    animation: false,
                    dataLabels: {
                        useHTML: true,
                        backgroundColor: "none",
                        borderWidth: 0,
                        shadow: false,
                        formatter: function () {
                            // Show actual value even if >2
                            return `<span class="text-lg font-bold">${actualValue}</span>`;
                        },
                    },
                    dial: {
                        radius: "80%",
                        backgroundColor: $mode === "light" ? "#000" : "#808080",
                        baseWidth: 12,
                        baseLength: "0%",
                        rearLength: "0%",
                    },
                },
            ],
        };

        return { optionsVolume, optionsVolumePutCall };
    }

    let configVolume: any = null;
    let configVolumePutCall: any = null;

    $: if ($mode && overview) {
        const {
            optionsVolume,
            optionsVolumePutCall: optionsVolumePutCallData,
        } = plotVolume();
        configVolume = optionsVolume;
        configVolumePutCall = optionsVolumePutCallData;
    }
</script>

<div
    class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
    use:highcharts={configVolume}
></div>

<div
    class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
    use:highcharts={configVolumePutCall}
></div>
