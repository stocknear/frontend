<script lang="ts">
    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";

    function plotHeatmap() {
        // 1. Define Categories based on the image
        const xCategories = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        const yCategories = [
            "SPY",
            "IWM",
            "QQQ",
            "XLB",
            "XLC",
            "XLE",
            "XLF",
            "XLI",
            "XLK",
            "XLP",
            "XLRE",
            "XLU",
            "XLV",
            "XLY",
        ];

        const generateData = () => {
            const data = [];
            for (let y = 0; y < yCategories.length; y++) {
                for (let x = 0; x < xCategories?.length; x++) {
                    const randomValue = Math.random() * 7 - 2.5;
                    data.push([x, y, parseFloat(randomValue.toFixed(2))]);
                }
            }
            return data;
        };

        const options = {
            credits: { enabled: false },
            chart: {
                type: "heatmap",
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 360,
                animation: false,
            },

            title: { text: "" },

            xAxis: {
                categories: xCategories,
                opposite: true,
                labels: {
                    enabled: true,
                    style: {
                        color: $mode === "light" ? "#333" : "#ccc",
                        fontWeight: "bold",
                    },
                },
                tickLength: 0,
                lineWidth: 0,
                gridLineWidth: 0,
            },

            yAxis: {
                categories: yCategories,
                title: null,
                reversed: true,
                labels: {
                    useHTML: true, // Essential to render the link
                    style: {
                        cursor: "pointer",
                    },
                    // We use a formatter to inject the <a> tag
                    formatter: function () {
                        // 'this.value' contains the label text (e.g., "SPY")
                        // We apply the blue color (#3b82f6) directly to the <a> tag
                        return `<a href="/etf/${this.value}" class="sm:hover:text-muted dark:sm:hover:text-white text-blue-800 dark:text-blue-400">${this.value}</a>`;
                    },
                },
            },
            // -----------------------

            colorAxis: {
                min: -1,
                max: 1,
                stops: [
                    [0, "#c10007"],
                    [1, "#008236"],
                ],
                visible: false,
            },

            legend: { enabled: false },

            tooltip: {
                backgroundColor: $mode === "light" ? "#fff" : "#000",
                borderColor: "#333",
                style: {
                    color: $mode === "light" ? "#000" : "#fff",
                },
                format:
                    "<b>{series.yAxis.categories.(point.y)}</b> in <b>{series.xAxis.categories.(point.x)}</b><br>" +
                    "Return: <b>{point.value:.2f}%</b>",
            },

            series: [
                {
                    name: "Monthly Return",
                    borderWidth: 1,
                    borderColor: $mode === "light" ? "#fff" : "#18181b",
                    data: generateData(),
                    dataLabels: {
                        enabled: true,
                        color: "#ffffff",
                        textOutline: "none",
                        style: {
                            fontWeight: "normal",
                            textOutline: "none",
                            fontSize: "11px",
                        },
                        format: "{point.value:.2f}%",
                    },
                },
            ],
        };

        return options;
    }

    let config: any = null;

    $: if ($mode) {
        config = plotHeatmap();
    }
</script>

<div
    class="border border-gray-300 dark:border-gray-800 rounded"
    use:highcharts={config}
></div>
