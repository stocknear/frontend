<script lang="ts">
    import { screenWidth } from "$lib/store";
    import { abbreviateNumber } from "$lib/utils";
    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";

    export let sectorFlow: any[] = [];

    function plotBarChart() {
        const categories = sectorFlow?.map((item) => item?.sector);

        // Prepare callPrem and putPrem data separately
        const callData = sectorFlow?.map((item) => ({
            y: item.callPrem,
            originalData: item,
            color: "#34d399", // green
        }));

        const putData = sectorFlow?.map((item) => ({
            y: item.putPrem,
            originalData: item,
            color: "#f87171", // red
        }));

        const options = {
            credits: { enabled: false },

            chart: {
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                type: "bar",
                height: 360,
                animation: false,
            },
            title: { text: null },
            xAxis: {
                categories,
                labels: {
                    style: {
                        color: $mode === "light" ? "#09090B" : "white",
                        fontSize: "12px",
                        fontWeight: "400",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                    },
                    useHTML: true,
                },
                lineWidth: 0,
                tickLength: 0,
            },
            yAxis: {
                min: 0,
                title: null,
                labels: {
                    enabled: false,
                },
                gridLineWidth: 0,
                lineWidth: 0,
                tickLength: 0,
            },
            plotOptions: {
                series: { pointWidth: 10 },
                legendSymbol: "rectangle",
                bar: {
                    stacking: "normal", // <-- enables stacking
                    dataLabels: {
                        enabled: true,
                        inside: false,
                        align: "right",
                        style: {
                            color: "#000",
                            fontSize: "12.5px",
                            fontWeight: "550",
                            textOutline: "none",
                        },
                        formatter: function () {
                            if (this.series.name === "Total") {
                                return this.y?.toLocaleString("en-US");
                            }
                            return null;
                        },
                    },
                    borderWidth: 0,
                    pointPadding: $screenWidth < 640 ? 0.02 : 0.18,
                    groupPadding: $screenWidth < 640 ? 0.4 : -0.1,
                    animation: false,
                    states: {
                        hover: { enabled: false },
                        inactive: { enabled: false },
                    },
                },
            },
            tooltip: {
                shared: true,
                useHTML: true,
                backgroundColor: "rgba(0, 0, 0, 1)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                style: {
                    color: "#fff",
                    fontSize: "14px",
                    padding: "8px",
                    zIndex: 9999,
                },
                borderRadius: 4,
                outside: true,
                formatter: function () {
                    const sector = categories[this.x] || this.x;
                    const call =
                        this.points.find((p) => p.series.name === "Call Prem")
                            ?.y || 0;
                    const put =
                        this.points.find((p) => p.series.name === "Put Prem")
                            ?.y || 0;
                    const total = call + put;

                    return `
          <span class="m-auto text-xs font-semibold">${sector}</span><br>
          <span class="text-green-400">Call Prem: ${abbreviateNumber(call)}</span><br>
          <span class="text-red-400">Put Prem: ${abbreviateNumber(put)}</span><br>
          <span class="text-white font-bold">Total Prem: ${abbreviateNumber(total)}</span>
        `;
                },
            },
            series: [
                {
                    name: "Call Prem",
                    data: callData,
                    color: "#34d399",
                    animation: false,
                },
                {
                    name: "Put Prem",
                    data: putData,
                    color: "#f87171", // red
                    animation: false,
                },
            ],
            legend: {
                enabled: true,
                align: "center", // left side
                verticalAlign: "top", // top edge
                layout: "horizontal",
                squareSymbol: false, // use our rectangle shape
                symbolWidth: 20,
                symbolHeight: 12,
                symbolRadius: 0,

                itemStyle: {
                    color: $mode === "light" ? "black" : "white",
                },
            },
        };

        return options;
    }

    let config: any = null;

    $: if ($mode && sectorFlow) {
        config = plotBarChart();
    }
</script>

<div
    class="border border-gray-300 dark:border-zinc-700 rounded-2xl h-[360px]"
    use:highcharts={config}
></div>
