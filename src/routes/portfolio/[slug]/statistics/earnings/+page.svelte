<script lang="ts">
    import { displayCompanyName, stockTicker } from "$lib/store";
    import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
    import SEO from "$lib/components/SEO.svelte";
    import Infobox from "$lib/components/Infobox.svelte";
    import TableHeader from "$lib/components/Table/TableHeader.svelte";
    import { onMount } from "svelte";
    import DownloadData from "$lib/components/DownloadData.svelte";
    import NextEarnings from "$lib/components/NextEarnings.svelte";
    import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
    import { Button } from "$lib/components/shadcn/button/index.js";
    import { goto } from "$app/navigation";

    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";

    export let data;

    // raw earnings & prices from backend
    let rawData: Array<any> = data?.getData?.historicalEarnings || [];

    // ensure data is sorted descending by earnings date (latest first)
    rawData = [...rawData].sort(
        (a, b) => new Date(b?.date).getTime() - new Date(a?.date).getTime(),
    );
    let rawTableData = [];
    // visible slice for table
    let tableList = [];

    const todayDateStr = new Date().toISOString().slice(0, 10);

    let timeFrame = "3Y";
    let timeIdx = 0;
    const plotTabs = [
        {
            title: "EPS Surprise",
        },
        {
            title: "Revenue Surprise",
        },
    ];

    function isFutureDate(dateStr: string) {
        if (!dateStr) return false;
        // dates are in 'YYYY-MM-DD' so lexicographic compare works
        return dateStr > todayDateStr;
    }

    async function handleScroll() {
        const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of page height
        const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
        if (isBottom && tableList?.length < rawTableData?.length) {
            const nextIndex = tableList.length;
            const newResults = rawTableData.slice(nextIndex, nextIndex + 20);
            tableList = [...tableList, ...newResults];
        }
    }

    function safeParseFloat(v: any, fallback = 0) {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : fallback;
    }

    // Function to change surprise type
    function changeSurprise(index: number) {
        timeIdx = index;
    }

    // Chart config
    let config = null;

    function plotData() {
        if (!rawData || rawData.length === 0) {
            return {};
        }

        // Filter data based on timeFrame
        const filterByTimeFrame = (data: Array<any>) => {
            const now = new Date();
            const cutoffDate = new Date();

            switch (timeFrame) {
                case "3Y":
                    cutoffDate.setFullYear(now.getFullYear() - 3);
                    break;
                case "5Y":
                    cutoffDate.setFullYear(now.getFullYear() - 5);
                    break;
                default:
                    return data; // Return all data if no filter
            }

            return data.filter((item) => new Date(item.date) >= cutoffDate);
        };

        // Apply time filter and sort ascending for plotting
        const filteredData = filterByTimeFrame(rawData);
        rawTableData = filteredData;
        const sortedEarnings = [...filteredData].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        tableList = rawTableData?.slice(0, 50);

        // Prepare categories with fiscal year format
        const categories = sortedEarnings.map((item) => {
            const shortYear = String(item.period_year).slice(-2);
            return `FY${shortYear} ${item.period}`;
        });

        // Prepare data based on selected tab
        let dataList: number[] = [];
        let seriesName = "";
        let seriesColor = "";

        if (timeIdx === 0) {
            // EPS Surprise selected
            dataList = sortedEarnings.map((item) => {
                const surprise = safeParseFloat(item.eps_surprise_percent, 0);
                return surprise;
            });
            seriesName = "EPS Surprise";
            seriesColor = $mode === "dark" ? "#60a5fa" : "#2C6288";
        } else {
            // Revenue Surprise selected
            dataList = sortedEarnings.map((item) => {
                const surprise =
                    safeParseFloat(item.revenue_surprise_percent, 0) * 100;
                return surprise;
            });
            seriesName = "Revenue Surprise";
            seriesColor = $mode === "dark" ? "#fbbf24" : "#ea580c";
        }

        const isDarkMode = $mode === "dark";
        const textColor = isDarkMode ? "#545454" : "#545454";
        const bgColor = isDarkMode ? "#09090B" : "#fff";
        const gridColor = isDarkMode ? "#111827" : "#e5e7eb";

        const options = {
            credits: {
                enabled: false,
            },
            chart: {
                type: "column",
                backgroundColor: bgColor,
                plotBackgroundColor: bgColor,
                height: 360,
                animation: false,
            },
            title: {
                text: `<h3 class="mt-3 mb-1">${seriesName}</h3>`,
                style: {
                    color: isDarkMode ? "white" : "black",
                },
                useHTML: true,
            },
            xAxis: {
                categories,
                gridLineWidth: 0,
                labels: {
                    style: {
                        color: isDarkMode ? "white" : "#545454",
                        fontSize: "11px",
                    },
                    rotation: -45,
                    align: "right",
                    step:
                        categories.length > 20
                            ? 2
                            : categories.length > 12
                              ? 1
                              : undefined,
                },
            },
            yAxis: {
                gridLineWidth: 1,
                gridLineColor: gridColor,
                labels: {
                    style: { color: isDarkMode ? "white" : "#545454" },
                    formatter: function () {
                        return this.value + "%";
                    },
                },
                title: { text: null },
                opposite: true,
                plotLines: [
                    {
                        value: 0,
                        color: isDarkMode ? "#374151" : "#9ca3af",
                        width: 1,
                        zIndex: 5,
                    },
                ],
            },
            tooltip: {
                shared: false,
                useHTML: true,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                style: {
                    color: "#fff",
                    fontSize: "16px",
                    padding: "10px",
                },
                borderRadius: 4,
                formatter: function () {
                    const categoryLabel = this.x;
                    const pointIndex = this.point.index;
                    const earnings = sortedEarnings[pointIndex];
                    const valueColor = this.y >= 0 ? "#22c55e" : "#ef4444";

                    let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${categoryLabel}</span><br>`;

                    tooltipContent += `
                        <span style="display:inline-block; width:10px; height:10px; background-color:${seriesColor}; border-radius:50%; margin-right:5px;"></span>
                        <span class="font-semibold text-sm">${seriesName}:</span> 
                        <span class="font-normal text-sm" style="color:${valueColor};">${this.y >= 0 ? "+" : ""}${this.y.toFixed(2)}%</span><br>`;

                    // Add actual vs estimate details
                    if (earnings) {
                        tooltipContent += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">`;

                        if (timeIdx === 0) {
                            // Show EPS details
                            tooltipContent += `<span class="text-xs opacity-80">EPS: ${earnings.eps} (Est: ${earnings.eps_est})</span><br>`;
                            if (earnings.eps_surprise) {
                                tooltipContent += `<span class="text-xs opacity-80">Surprise: ${earnings.eps_surprise}</span>`;
                            }
                        } else {
                            // Show Revenue details
                            if (earnings.revenue) {
                                tooltipContent += `<span class="text-xs opacity-80">Revenue: ${abbreviateNumber(earnings.revenue)}</span><br>`;
                                tooltipContent += `<span class="text-xs opacity-80">Estimate: ${abbreviateNumber(earnings.revenue_est || 0)}</span><br>`;
                                if (earnings.revenue_surprise) {
                                    tooltipContent += `<span class="text-xs opacity-80">Surprise: ${abbreviateNumber(earnings.revenue_surprise)}</span>`;
                                }
                            }
                        }
                        tooltipContent += `</div>`;
                    }

                    return tooltipContent;
                },
            },
            plotOptions: {
                column: {
                    grouping: false,
                    shadow: false,
                    borderWidth: 0,
                    animation: false,
                    colorByPoint: true,
                    colors: dataList.map((val) =>
                        val >= 0
                            ? isDarkMode
                                ? "#10b981"
                                : "#059669"
                            : isDarkMode
                              ? "#ef4444"
                              : "#dc2626",
                    ),
                    dataLabels: {
                        enabled: true,
                        color: isDarkMode ? "white" : "black",
                        style: {
                            fontSize: "11px",
                            fontWeight: "bold",
                            textOutline: isDarkMode ? "1px black" : "1px white",
                        },
                        formatter: function () {
                            if (Math.abs(this.y) < 0.5) return ""; // Hide very small values
                            return (
                                (this.y > 0 ? "+" : "") +
                                this.y.toFixed(1) +
                                "%"
                            );
                        },
                    },
                },
                series: {
                    animation: false,
                },
            },
            legend: {
                enabled: false,
            },
            series: [
                {
                    name: seriesName,
                    data: dataList,
                    color: seriesColor,
                },
            ],
        };

        return options;
    }

    // Table columns & sorting
    let columns = [
        { key: "period_year", label: "Period", align: "left" },
        { key: "date", label: "Date", align: "right" },
        { key: "eps", label: "EPS", align: "right" },
        { key: "eps_est", label: "EPS Est.", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "revenue_est", label: "Rev Est.", align: "right" },
    ];

    let sortOrders = {
        period_year: { order: "none", type: "string" },
        date: { order: "none", type: "date" },
        period: { order: "none", type: "string" },
        eps: { order: "none", type: "number" },
        eps_est: { order: "none", type: "number" },
        revenue: { order: "none", type: "number" },
        revenue_est: { order: "none", type: "number" },
    };

    const sortData = (key) => {
        // reset others
        for (const k in sortOrders) {
            if (k !== key) sortOrders[k].order = "none";
        }

        const orderCycle = ["none", "asc", "desc"];
        const currentIndex = orderCycle.indexOf(sortOrders[key].order);
        sortOrders[key].order =
            orderCycle[(currentIndex + 1) % orderCycle.length];
        const order = sortOrders[key].order;

        // original data is sorted descending by date already
        const originalData = [...rawData];

        if (order === "none") {
            tableList = originalData.slice(0, 20);
            return;
        }

        const compare = (a, b) => {
            const type = sortOrders[key].type;
            let va: any = a[key];
            let vb: any = b[key];

            if (key === "period") {
                // derived key
                va = `${a.period} ${a.period_year}`;
                vb = `${b.period} ${b.period_year}`;
            }

            if (type === "date") {
                va = new Date(va).getTime();
                vb = new Date(vb).getTime();
            } else if (type === "number") {
                va = safeParseFloat(va, 0);
                vb = safeParseFloat(vb, 0);
            } else {
                va = (va || "").toString().toUpperCase();
                vb = (vb || "").toString().toUpperCase();
            }

            if (order === "asc") return va < vb ? -1 : va > vb ? 1 : 0;
            return va > vb ? -1 : va < vb ? 1 : 0;
        };

        tableList = originalData.sort(compare).slice(0, 20);
    };

    onMount(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    });

    $: {
        if ($mode || timeFrame || timeIdx) {
            config = plotData();
        }
    }
</script>

<SEO
    title={`${$displayCompanyName} (${$stockTicker}) Earnings Surprise Analysis | EPS & Revenue Impact`}
    description={`In-depth analysis of earnings surprises for ${$displayCompanyName} (${$stockTicker}), tracking EPS and revenue beats or misses. Explore historical earnings impact on stock price and performance trends.`}
    keywords={`${$stockTicker} earnings surprise, ${$displayCompanyName} EPS surprise, revenue surprise, earnings analysis, historical stock price, EPS beats, revenue beats`}
    type="website"
    url={`https://stocknear.com/stocks/${$stockTicker}/statistics/earnings`}
    structuredData={{
        "@context": "https://schema.org",
        "@type": ["FinancialProduct", "DataAnalysis"],
        name: `${$displayCompanyName} Earnings Surprise Analysis`,
        description: `Detailed tracking of EPS and revenue surprises for ${$displayCompanyName} (${$stockTicker}), with historical stock price reactions and performance insights.`,
        url: `https://stocknear.com/stocks/${$stockTicker}/statistics/earnings`,
        applicationCategory: "FinanceApplication",
        featureList: [
            "EPS surprise analysis",
            "Revenue surprise tracking",
            "Historical earnings data",
            "Stock price reaction to surprises",
            "Quarterly and annual performance trends",
            "Post-earnings impact visualization",
            "Data-driven investing insights",
            "Earnings beat/miss evaluation",
        ],
        provider: {
            "@type": "Organization",
            name: "Stocknear",
            url: "https://stocknear.com",
        },
        mainEntity: {
            "@type": "Corporation",
            name: $displayCompanyName,
            tickerSymbol: $stockTicker,
        },
        about: {
            "@type": "Thing",
            name: "Earnings Surprise Analysis",
            description:
                "Professional analysis of EPS and revenue surprises and their impact on stock price and performance.",
        },
    }}
/>

<section class=" w-full overflow-hidden h-full">
    <div
        class="w-full flex justify-center w-full sm-auto h-full overflow-hidden"
    >
        <div
            class="w-full relative flex justify-center items-center overflow-hidden"
        >
            <main class="w-full">
                <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
                    <div
                        class="w-full flex flex-col sm:flex-row justify-between"
                    >
                        <h1 class="text-xl sm:text-2xl font-bold">
                            {removeCompanyStrings($displayCompanyName)} Earnings
                            Surprise
                        </h1>
                    </div>

                    {#if rawData?.length > 0}
                        <div class="grid grid-cols-1 gap-2">
                            {#if data?.getNextEarnings && Object.keys(data.getNextEarnings).length > 0 && data?.getEarningsSurprise?.date !== data.getNextEarnings?.date}
                                <div class="mt-3 mb-3">
                                    <NextEarnings {data} hideTitle={true} />
                                </div>
                            {/if}

                            <div
                                class=" flex flex-col sm:flex-row items-start sm:items-center w-full justify-between border-t border-b border-gray-300 dark:border-gray-800 py-2"
                            >
                                <h2 class="text-xl sm:text-2xl font-bold">
                                    Earnings Chart
                                </h2>
                                <div class="sm:ml-auto">
                                    <div class="inline-flex mt-2 sm:mt-0">
                                        <div
                                            class="inline-flex rounded-lg shadow-sm"
                                        >
                                            {#each plotTabs as item, i}
                                                <button
                                                    on:click={() =>
                                                        changeSurprise(i)}
                                                    class="cursor-pointer px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l border' : ''}
                          {i === plotTabs.length - 1
                                                        ? 'rounded-r border-t border-r border-b'
                                                        : ''}
                          {i !== 0 && i !== plotTabs.length - 1
                                                        ? 'border-t border-b'
                                                        : ''}
                          {timeIdx === i
                                                        ? 'bg-black dark:bg-white text-white dark:text-black'
                                                        : 'bg-white  border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
                                                >
                                                    {item.title}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>

                                    <div class="ml-1 relative inline-block">
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger
                                                asChild
                                                let:builder
                                            >
                                                <Button
                                                    builders={[builder]}
                                                    class="flex-shrink-0  w-full sm:w-fit border border-gray-300 dark:border-gray-800 bg-black sm:hover:bg-default text-white dark:bg-primary dark:sm:hover:bg-secondary ease-out  flex flex-row justify-between items-center px-3 py-1.5  rounded truncate"
                                                >
                                                    <span class="truncate"
                                                        >{timeFrame}</span
                                                    >
                                                    <svg
                                                        class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        style="max-width:40px"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            fill-rule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clip-rule="evenodd"
                                                        ></path>
                                                    </svg>
                                                </Button>
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Content
                                                side="bottom"
                                                align="end"
                                                sideOffset={10}
                                                alignOffset={0}
                                                class=" h-fit max-h-72 overflow-y-auto scroller"
                                            >
                                                <DropdownMenu.Group>
                                                    {#each ["3Y", "5Y", "MAX"] as item, index}
                                                        {#if ["Plus", "Pro"]?.includes(data?.user?.tier) || index === 0}
                                                            <DropdownMenu.Item
                                                                on:click={() =>
                                                                    (timeFrame =
                                                                        item)}
                                                                class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                                                            >
                                                                {item}
                                                            </DropdownMenu.Item>
                                                        {:else}
                                                            <DropdownMenu.Item
                                                                on:click={() =>
                                                                    goto(
                                                                        "/pricing",
                                                                    )}
                                                                class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                                                            >
                                                                {item}
                                                                <svg
                                                                    class="ml-1 size-4"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                    style="max-width: 40px;"
                                                                >
                                                                    <path
                                                                        fill-rule="evenodd"
                                                                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                                                        clip-rule="evenodd"
                                                                    >
                                                                    </path>
                                                                </svg>
                                                            </DropdownMenu.Item>
                                                        {/if}
                                                    {/each}
                                                </DropdownMenu.Group>
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Root>
                                    </div>
                                </div>
                            </div>

                            <div class="chart-driver">
                                <div class="grow">
                                    <div class="relative">
                                        <div
                                            class=" border border-gray-300 dark:border-gray-800 rounded"
                                            use:highcharts={config}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="flex flex-row items-center w-full justify-between mt-3 border-t border-b border-gray-300 dark:border-gray-800 py-2"
                            >
                                <h3
                                    class=" history-driver text-xl sm:text-2xl font-bold"
                                >
                                    History
                                </h3>

                                <div
                                    class="flex flex-row items-center w-fit w-[50%] ml-auto"
                                >
                                    <DownloadData
                                        {data}
                                        {rawData}
                                        title={`earnings_${$stockTicker}`}
                                    />
                                </div>
                            </div>

                            <div class="w-full overflow-x-auto">
                                <table
                                    class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-2"
                                >
                                    <thead>
                                        <TableHeader
                                            {columns}
                                            {sortOrders}
                                            {sortData}
                                        />
                                    </thead>
                                    <tbody>
                                        {#each tableList as item, index}
                                            {#if index !== 0 && !isFutureDate(item.date)}
                                                <tr
                                                    class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                                                >
                                                    <td
                                                        class=" text-sm sm:text-[1rem] text-start whitespace-nowrap"
                                                    >
                                                        FY{String(
                                                            item?.period_year,
                                                        )?.slice(-2)}
                                                        {item.period}
                                                    </td>

                                                    <td
                                                        class=" text-sm text-end sm:text-[1rem] whitespace-nowrap"
                                                    >
                                                        {new Date(
                                                            item.date,
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                                timeZone: "UTC",
                                                            },
                                                        )}
                                                    </td>

                                                    <td
                                                        class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                                                    >
                                                        {item?.eps ?? "n/a"}
                                                    </td>

                                                    <td
                                                        class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                                                    >
                                                        {item?.eps_est ?? "n/a"}
                                                    </td>

                                                    <td
                                                        class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                                                    >
                                                        {item.revenue
                                                            ? abbreviateNumber(
                                                                  item.revenue,
                                                              )
                                                            : "n/a"}
                                                    </td>

                                                    <td
                                                        class=" text-sm sm:text-[1rem] text-right whitespace-nowrap"
                                                    >
                                                        {item.revenue_est
                                                            ? abbreviateNumber(
                                                                  item.revenue_est,
                                                              )
                                                            : "n/a"}
                                                    </td>
                                                </tr>
                                            {/if}
                                        {/each}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    {:else}
                        <Infobox text="No data available" />
                    {/if}
                </div>
            </main>
        </div>
    </div>
</section>
