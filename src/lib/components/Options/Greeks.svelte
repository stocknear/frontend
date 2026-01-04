<script lang="ts">
    import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";
    import { displayCompanyName, screenWidth } from "$lib/store";

    import TableHeader from "$lib/components/Table/TableHeader.svelte";
    import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
    import DownloadData from "$lib/components/DownloadData.svelte";

    import { Button } from "$lib/components/shadcn/button/index.js";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import highcharts from "$lib/highcharts.ts";
    import { mode } from "mode-watcher";

    export let data;
    export let ticker = null;

    // original raw data from backend (per-expiration arrays)
    let rawData = data?.getData || [];

    // expiration selector
    let dateList = rawData?.map((item) => item?.expiration) || [];
    let selectedDate = dateList?.at(0) || null;

    // the per-strike rows built from the selected expiration
    let originalList = []; // full list for selected expiration
    // Track the currently sorted data separately
    let sortedData = [];
    // displayed with pagination
    let displayList = [];

    let currentPrice = Number(data?.getStockQuote?.price?.toFixed(2)) ?? null;

    let config = null;

    // Pagination state
    let currentPage = 1;
    let rowsPerPage = 20;
    let rowsPerPageOptions = [20, 50, 100];
    let totalPages = 1;
    let pagePathName = $page?.url?.pathname;

    const greekTabs = ["Delta", "Gamma", "Theta", "Vega"];
    const pcTabs = ["Calls & Puts", "Calls", "Puts"];

    // UI state
    let selectedGreek = "Delta";
    let selectedType = "Calls & Puts";
    let activeGreekIdx = 0;
    let activePCTabIdx = 0;

    function formatDate(dateStr) {
        try {
            let date = new Date(dateStr + "T00:00:00Z");
            let options = {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
                year: "numeric",
            };

            let formatter = new Intl.DateTimeFormat("en-US", options);
            return formatter?.format(date);
        } catch (e) {
            return "n/a";
        }
    }

    function computeDTE(dateStr) {
        try {
            const exp = new Date(dateStr + "T00:00:00Z");
            const now = new Date();
            const todayUTC = Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
            );
            const expUTC = Date.UTC(
                exp.getUTCFullYear(),
                exp.getUTCMonth(),
                exp.getUTCDate(),
            );
            const diffMs = expUTC - todayUTC;
            if (diffMs <= 0) return 0;
            const dayMs = 24 * 60 * 60 * 1000;
            return Math.ceil(diffMs / dayMs);
        } catch (e) {
            return null;
        }
    }

    // Pagination functions
    function updatePaginatedData() {
        const dataSource = sortedData?.length > 0 ? sortedData : originalList;
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        displayList = dataSource?.slice(startIndex, endIndex) || [];
        totalPages = Math.ceil((dataSource?.length || 0) / rowsPerPage);
    }

    function goToPage(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            updatePaginatedData();
        }
    }

    function changeRowsPerPage(newRowsPerPage) {
        rowsPerPage = newRowsPerPage;
        currentPage = 1; // Reset to first page when changing rows per page
        updatePaginatedData();
        saveRowsPerPage(); // Save to localStorage
    }

    // Save rows per page preference to localStorage
    function saveRowsPerPage() {
        if (!pagePathName || typeof localStorage === "undefined") return;

        try {
            const paginationKey = `${pagePathName}_rowsPerPage`;
            localStorage.setItem(paginationKey, String(rowsPerPage));
        } catch (e) {
            console.warn("Failed to save rows per page preference:", e);
        }
    }

    // Load rows per page preference from localStorage
    function loadRowsPerPage() {
        const currentPath = pagePathName || $page?.url?.pathname;

        if (!currentPath || typeof localStorage === "undefined") {
            rowsPerPage = 20; // Default value
            return;
        }

        try {
            const paginationKey = `${currentPath}_rowsPerPage`;
            const savedRows = localStorage.getItem(paginationKey);

            if (savedRows && rowsPerPageOptions.includes(Number(savedRows))) {
                rowsPerPage = Number(savedRows);
            } else {
                rowsPerPage = 20; // Default if invalid or not found
            }
        } catch (e) {
            console.warn("Failed to load rows per page preference:", e);
            rowsPerPage = 20; // Default on error
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // build per-strike rows for the selectedDate
    function rebuildRowsForSelectedDate() {
        const raw = rawData?.find((item) => item?.expiration === selectedDate);
        if (!raw) {
            originalList = [];
            sortedData = [];
            displayList = [];
            return;
        }

        const strikes = raw?.strikes || [];
        const rows = strikes?.map((strike, i) => {
            // raw arrays might have undefined or null entries
            const callDelta = raw?.callDelta?.[i] ?? 0;
            const putDelta = raw?.putDelta?.[i] ?? 0;
            const callGamma = raw?.callGamma?.[i] ?? 0;
            const putGamma = raw?.putGamma?.[i] ?? 0;
            const callTheta = raw?.callTheta?.[i] ?? 0;
            const putTheta = raw?.putTheta?.[i] ?? 0;
            const callVega = raw?.callVega?.[i] ?? 0;
            const putVega = raw?.putVega?.[i] ?? 0;

            const totalDelta = ((callDelta ?? 0) + (putDelta ?? 0))?.toFixed(4);
            const totalGamma = ((callGamma ?? 0) + (putGamma ?? 0))?.toFixed(4);
            const totalTheta = ((callTheta ?? 0) + (putTheta ?? 0))?.toFixed(4);
            const totalVega = ((callVega ?? 0) + (putVega ?? 0))?.toFixed(4);

            return {
                strike,
                callDelta,
                putDelta,
                callGamma,
                putGamma,
                callTheta,
                putTheta,
                callVega,
                putVega,
                totalDelta,
                totalGamma,
                totalTheta,
                totalVega,
            };
        });

        // compute putCallRatio similar to your snippet: if selectedGreek is Gamma use gammas else use deltas
        const rowsWithRatio = rows.map((r) => {
            const ratio =
                selectedGreek === "Gamma"
                    ? r.callGamma > 0
                        ? Math.abs(r.putGamma / r.callGamma)
                        : null
                    : r.callDelta > 0
                      ? Math.abs(r.putDelta / r.callDelta)
                      : null;
            return { ...r, putCallRatio: ratio };
        });

        // default sort by strike ascending
        originalList = rowsWithRatio.sort(
            (a, b) => (a.strike ?? 0) - (b.strike ?? 0),
        );

        // Initialize sortedData with originalList
        sortedData = [...originalList];

        // Load pagination preference
        loadRowsPerPage();

        // Reset to first page and update pagination
        currentPage = 1;
        updatePaginatedData();
    }

    // build highcharts config using selectedGreek and selectedType
    function plotData() {
        const raw = rawData?.find((item) => item?.expiration === selectedDate);
        if (!raw) return {};

        const strikes = raw?.strikes || [];

        // dynamic keys: e.g. "callDelta" / "putDelta" / "callGamma" ...
        const callKey = `call${selectedGreek}`;
        const putKey = `put${selectedGreek}`;

        const callData = raw?.[callKey] || [];
        const putData = raw?.[putKey] || [];

        // include current price so it shows on x-axis
        const extras = [currentPrice]?.filter((s) => typeof s === "number");
        const allStrikes = Array.from(new Set([...strikes, ...extras])).sort(
            (a, b) => a - b,
        );

        // Helper function to interpolate a value for a given strike
        const interpolateValue = (strike, strikesArr, dataArr) => {
            const idx = strikesArr.indexOf(strike);
            if (idx > -1) {
                return dataArr[idx] ?? null;
            }
            // Find surrounding strikes for interpolation
            let lowerIdx = -1;
            let upperIdx = -1;
            for (let i = 0; i < strikesArr.length; i++) {
                if (strikesArr[i] < strike) {
                    lowerIdx = i;
                } else if (strikesArr[i] > strike && upperIdx === -1) {
                    upperIdx = i;
                    break;
                }
            }
            // If we have both bounds, interpolate linearly
            if (lowerIdx > -1 && upperIdx > -1) {
                const lowerStrike = strikesArr[lowerIdx];
                const upperStrike = strikesArr[upperIdx];
                const lowerVal = dataArr[lowerIdx];
                const upperVal = dataArr[upperIdx];
                if (lowerVal != null && upperVal != null) {
                    const ratio =
                        (strike - lowerStrike) / (upperStrike - lowerStrike);
                    return lowerVal + ratio * (upperVal - lowerVal);
                }
            }
            return null;
        };

        // map to arrays aligned with allStrikes, interpolating for current price
        const callSeries = allStrikes.map((s) =>
            interpolateValue(s, strikes, callData),
        );
        const putSeries = allStrikes.map((s) =>
            interpolateValue(s, strikes, putData),
        );

        // build series conditionally based on selectedType
        const series = [];
        if (selectedType === "Calls & Puts" || selectedType === "Calls") {
            series?.push({
                name: "Call",
                type: "spline",
                data: callSeries,
                color: "#06988A",
                borderColor: "#06988A",
                marker: { enabled: true },
                visible: true,
                animation: false,
            });
        }
        if (selectedType === "Calls & Puts" || selectedType === "Puts") {
            series?.push({
                name: "Put",
                type: "spline",
                data: putSeries,
                color: "#FF0808",
                borderColor: "#FF0808",
                marker: { enabled: true },
                visible: true,
                animation: false,
            });
        }

        return {
            credits: { enabled: false },

            chart: {
                backgroundColor: $mode === "light" ? "#fff" : "#09090B",
                plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
                height: 360,
                animation: false,
            },

            title: {
                text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-lg">${selectedGreek}</h3>`,
                useHTML: true,
                style: { color: $mode === "light" ? "black" : "white" },
            },

            xAxis: {
                categories: allStrikes,
                plotLines: [
                    {
                        value:
                            $screenWidth < 640
                                ? null
                                : allStrikes?.findIndex(
                                      (s) => s === currentPrice,
                                  ),
                        color: $mode === "light" ? "#000" : "#fff",
                        dashStyle: "Dash",
                        width: 1.5,
                        label: {
                            text: `Current Price ${currentPrice}`,
                            style: {
                                color: $mode === "light" ? "#000" : "#fff",
                            },
                        },
                        zIndex: 5,
                    },
                ],
                gridLineWidth: 0,
                crosshair: {
                    color: $mode === "light" ? "black" : "white",
                    width: 1,
                    dashStyle: "Solid",
                    snap: true,
                },
                labels: {
                    style: { color: $mode === "light" ? "#545454" : "white" },
                    formatter() {
                        return this.pos % 1 === 0 ? this.value : "";
                    },
                },
                tickAmount: 12,
            },

            yAxis: [
                {
                    gridLineWidth: 1,
                    gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
                    labels: {
                        style: {
                            color: $mode === "light" ? "#545454" : "white",
                        },
                    },
                    title: { text: null },
                    opposite: true,
                },
                {
                    gridLineWidth: 0,
                    labels: { enabled: false },
                    title: { text: null },
                },
            ],

            plotOptions: {
                series: {
                    legendSymbol: "rectangle",
                    animation: false,
                    states: { hover: { enabled: false } },
                },
                spline: {
                    marker: {
                        enabled: false,
                        states: { hover: { enabled: false } },
                    },
                },
            },

            tooltip: {
                shared: true,
                useHTML: true,
                animation: false,
                backgroundColor: "rgba(0, 0, 0, 1)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                borderRadius: 4,
                style: { color: "#fff", fontSize: "16px", padding: "10px" },
                formatter() {
                    let s = `<span class="text-white font-[501]">Strike ${this.x}</span><br>`;
                    this.points.forEach((point) => {
                        s +=
                            `<span style="display:inline-block;width:10px;height:10px;background-color:${point.color};border-radius:50%;margin-right:5px;"></span>` +
                            `<span class="text-white font-semibold text-sm">${point.series.name}:</span>` +
                            `<span class="text-white font-normal text-sm">${abbreviateNumber(point.y)}</span><br>`;
                    });
                    return s;
                },
            },

            series,

            legend: {
                enabled: true,
                align: "center",
                verticalAlign: "top",
                layout: "horizontal",
                itemStyle: { color: $mode === "light" ? "black" : "white" },
                symbolWidth: 14,
                symbolRadius: 1,
                squareSymbol: true,
            },
        };
    }

    // Columns and sorting state (compatible with your TableHeader)
    $: columns = [
        { key: "strike", label: "Strike Price", align: "left" },
        { key: "totalDelta", label: "Delta", align: "right" },
        { key: "totalGamma", label: "Gamma", align: "right" },
        { key: "totalTheta", label: "Theta", align: "right" },
        { key: "totalVega", label: "Vega", align: "right" },
    ];

    $: sortOrders = {
        strike: { order: "none", type: "number" },
        totalDelta: { order: "none", type: "number" },
        totalGamma: { order: "none", type: "number" },
        totalTheta: { order: "none", type: "number" },
        totalVega: { order: "none", type: "number" },
    };

    const sortData = (key) => {
        // reset other keys
        for (const k in sortOrders) {
            if (k !== key) sortOrders[k].order = "none";
        }

        const orderCycle = ["none", "asc", "desc"];
        const currentOrderIndex = orderCycle.indexOf(sortOrders[key].order);
        sortOrders[key].order =
            orderCycle[(currentOrderIndex + 1) % orderCycle.length];
        const sortOrder = sortOrders[key].order;

        // Reset to original data when 'none' and stop further sorting
        if (sortOrder === "none") {
            sortedData = [...originalList];
            currentPage = 1; // Reset to first page
            updatePaginatedData();
            return;
        }

        // generic comparator
        const compareValues = (a, b) => {
            const { type } = sortOrders[key];
            let valueA, valueB;

            switch (type) {
                case "date":
                    valueA = new Date(a[key]);
                    valueB = new Date(b[key]);
                    break;
                case "string":
                    valueA = (a[key] || "").toString().toUpperCase();
                    valueB = (b[key] || "").toString().toUpperCase();
                    return sortOrder === "asc"
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                case "number":
                default:
                    valueA = Number(a[key] ?? 0);
                    valueB = Number(b[key] ?? 0);
                    break;
            }

            if (sortOrder === "asc") {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            }
        };

        // Sort all data and store it
        sortedData = [...originalList].sort(compareValues);
        // Reset to first page and update pagination
        currentPage = 1;
        updatePaginatedData();
    };

    // watchers: rebuild rows when rawData or selectedDate or selectedGreek changes
    $: if (rawData && selectedDate) {
        rebuildRowsForSelectedDate();
        config = plotData() || null;
    }

    // update config when greek/type/size mode changes
    $: if ($mode || selectedGreek || selectedType) {
        config = plotData() || null;
    }

    // Reactive statement to load pagination settings when page changes
    $: if ($page?.url?.pathname && $page?.url?.pathname !== pagePathName) {
        pagePathName = $page?.url?.pathname;
        loadRowsPerPage(); // Load pagination preference for new page
        updatePaginatedData(); // Update display with loaded preference
    }

    // UI handlers for tab clicks
    function onGreekTabClick(item, idx) {
        selectedGreek = item;
        activeGreekIdx = idx;
        // recompute putCallRatio using the new greek
        rebuildRowsForSelectedDate();
        config = plotData();
    }

    function onPCTabClick(item, idx) {
        selectedType = item;
        activePCTabIdx = idx;
        config = plotData();
    }
</script>

<section class="w-full overflow-hidden min-h-screen sm:pb-20">
    <div class="w-full flex h-full overflow-hidden">
        <div
            class="w-full relative flex justify-center items-center overflow-hidden"
        >
            <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
                <h2
                    class="flex flex-row items-center text-xl sm:text-2xl font-bold w-fit mb-2 sm:mb-0"
                >
                    {removeCompanyStrings($displayCompanyName)} Greeks
                </h2>

                <div class="w-full mt-4 mb-6">
                    Delta, Gamma, Theta, and Vega Greek Charts for <strong
                        >{ticker}</strong
                    > options.
                </div>

                <div>
                    <div
                        class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2"
                    >
                        <div
                            class="text-sm inline-flex justify-center w-full rounded sm:w-auto"
                        >
                            <div
                                class="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
                            >
                                <div class="">
                                    <div class="inline-flex">
                                        <div
                                            class="inline-flex rounded-lg shadow-sm"
                                        >
                                            {#each greekTabs as item, i}
                                                <button
                                                    on:click={() =>
                                                        onGreekTabClick(
                                                            item,
                                                            i,
                                                        )}
                                                    class="cursor-pointer border-r border-gray-300 dark:border-gray-600 px-4 py-2 font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l border' : ''}
                          {i === greekTabs?.length - 1
                                                        ? 'rounded-r border-t border-r border-b'
                                                        : ''}
                          {i !== 0 && i !== greekTabs?.length - 1
                                                        ? 'border-t border-b'
                                                        : ''}
                          {activeGreekIdx === i
                                                        ? 'bg-black dark:bg-white text-white dark:text-black'
                                                        : 'bg-white border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
                                                >
                                                    {item}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            class="text-sm inline-flex justify-center w-full rounded sm:w-auto"
                        >
                            <div
                                class="flex flex-col sm:flex-row items-start sm:items-center w-full justify-between"
                            >
                                <div class="">
                                    <div class="inline-flex">
                                        <div
                                            class="inline-flex rounded-lg shadow-sm"
                                        >
                                            {#each pcTabs as item, i}
                                                <button
                                                    on:click={() =>
                                                        onPCTabClick(item, i)}
                                                    class="cursor-pointer border-r border-gray-300 dark:border-gray-600 px-4 py-2 font-medium focus:z-10 focus:outline-none transition-colors duration-50
                          {i === 0 ? 'rounded-l border' : ''}
                          {i === pcTabs?.length - 1
                                                        ? 'rounded-r border-t border-r border-b'
                                                        : ''}
                          {i !== 0 && i !== pcTabs?.length - 1
                                                        ? 'border-t border-b'
                                                        : ''}
                          {activePCTabIdx === i
                                                        ? 'bg-black dark:bg-white text-white dark:text-black'
                                                        : 'bg-white border-gray-300 sm:hover:bg-gray-100 dark:bg-primary dark:border-gray-800'}"
                                                >
                                                    {item}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 mb-4">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild let:builder>
                                <Button
                                    builders={[builder]}
                                    class="min-w-[130px] max-w-[240px] sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <span class=" text-sm"
                                        >Date Expiration | {formatDate(
                                            selectedDate,
                                        )}</span
                                    >
                                    <svg
                                        class="-mr-1 ml-2 h-5 w-5 inline-block"
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
                                class="min-w-56 w-auto max-w-60 max-h-[400px] overflow-y-auto scroller relative"
                            >
                                <DropdownMenu.Group class="pb-2">
                                    {#each dateList as item, index}
                                        {#if data?.user?.tier === "Pro" || index === 0}
                                            <DropdownMenu.Item
                                                on:click={() => {
                                                    selectedDate = item;
                                                }}
                                                class="{selectedDate === item
                                                    ? 'bg-gray-200 dark:bg-primary'
                                                    : ''} sm:hover:bg-gray-200 dark:sm:hover:bg-primary cursor-pointer"
                                            >
                                                <span>{formatDate(item)}</span>
                                                <span
                                                    class="ml-2 text-xs text-gray-500 dark:text-gray-300"
                                                    >({computeDTE(item)} day{computeDTE(
                                                        item,
                                                    ) === 1
                                                        ? ""
                                                        : "s"})</span
                                                >
                                            </DropdownMenu.Item>
                                        {:else}
                                            <DropdownMenu.Item
                                                on:click={() =>
                                                    goto("/pricing")}
                                                class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                                            >
                                                <span>{formatDate(item)}</span>
                                                <span
                                                    class="ml-2 text-xs text-gray-500 dark:text-gray-300"
                                                    >({computeDTE(item)} day{computeDTE(
                                                        item,
                                                    ) === 1
                                                        ? ""
                                                        : "s"})</span
                                                >
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
                                                    ></path>
                                                </svg>
                                            </DropdownMenu.Item>
                                        {/if}
                                    {/each}
                                </DropdownMenu.Group>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </div>

                    <div>
                        <div class="grow mt-3">
                            <div class="relative">
                                <div
                                    class="mt-5 shadow sm:mt-0 sm:border sm:border-gray-300 dark:border-gray-800 rounded"
                                    use:highcharts={config}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="mb-3 mt-10 flex flex-row items-center w-full border-t border-b border-gray-300 dark:border-gray-800 py-2"
                >
                    <h2 class=" text-xl sm:text-2xl font-bold">
                        {selectedGreek} Table
                    </h2>

                    <div
                        class="flex flex-row items-center w-[50%] w-auto ml-auto"
                    >
                        <DownloadData
                            {data}
                            rawData={originalList}
                            title={`${selectedDate}_greek_data`}
                        />
                    </div>
                </div>

                <div class="w-full overflow-x-auto mt-3">
                    <table
                        class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                    >
                        <thead>
                            <TableHeader {columns} {sortOrders} {sortData} />
                        </thead>
                        <tbody>
                            {#each displayList as item}
                                <tr
                                    class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                                >
                                    <td
                                        class="text-sm sm:text-[1rem] text-start whitespace-nowrap"
                                    >
                                        {item?.strike?.toFixed(2)}
                                    </td>
                                    <td
                                        class="text-sm sm:text-[1rem] text-end whitespace-nowrap"
                                    >
                                        {item?.totalDelta != null
                                            ? abbreviateNumber(item.totalDelta)
                                            : "-"}
                                    </td>
                                    <td
                                        class="text-sm sm:text-[1rem] text-end whitespace-nowrap"
                                    >
                                        {item?.totalGamma != null
                                            ? abbreviateNumber(item.totalGamma)
                                            : "-"}
                                    </td>
                                    <td
                                        class="text-sm sm:text-[1rem] text-end whitespace-nowrap"
                                    >
                                        {item?.totalTheta != null
                                            ? abbreviateNumber(item.totalTheta)
                                            : "-"}
                                    </td>
                                    <td
                                        class="text-sm sm:text-[1rem] text-end whitespace-nowrap"
                                    >
                                        {item?.totalVega != null
                                            ? abbreviateNumber(item.totalVega)
                                            : "-"}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Pagination controls -->
                {#if displayList?.length > 0 && totalPages > 0}
                    <div
                        class="flex flex-row items-center justify-between mt-8 sm:mt-5"
                    >
                        <!-- Previous button -->
                        <div class="flex items-center gap-2">
                            <Button
                                on:click={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <svg
                                    class="h-5 w-5 inline-block shrink-0 rotate-90"
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
                                <span class="hidden sm:inline">Previous</span>
                            </Button>
                        </div>

                        <!-- Page info and rows selector in center -->
                        <div class="flex flex-row items-center gap-4">
                            <span class="text-sm text-gray-600 dark:text-zinc-300">
                                Page {currentPage} of {totalPages}
                            </span>

                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild let:builder>
                                    <Button
                                        builders={[builder]}
                                        class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <span
                                            class="truncate text-[0.85rem] sm:text-sm"
                                            >{rowsPerPage} Rows</span
                                        >
                                        <svg
                                            class="ml-0.5 mt-1 h-5 w-5 inline-block shrink-0"
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
                                    class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-200/70 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                                >
                                    <!-- Dropdown items -->
                                    <DropdownMenu.Group class="pb-2">
                                        {#each rowsPerPageOptions as item}
                                            <DropdownMenu.Item
                                                class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-600 dark:sm:hover:text-violet-400 transition"
                                            >
                                                <label
                                                    on:click={() =>
                                                        changeRowsPerPage(item)}
                                                    class="inline-flex justify-between w-full items-center cursor-pointer"
                                                >
                                                    <span class="text-sm"
                                                        >{item} Rows</span
                                                    >
                                                </label>
                                            </DropdownMenu.Item>
                                        {/each}
                                    </DropdownMenu.Group>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>

                        <!-- Next button -->
                        <div class="flex items-center gap-2">
                            <Button
                                on:click={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                class="w-fit sm:w-auto transition-all duration-150 border border-gray-200/70 dark:border-zinc-800/80 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <span class="hidden sm:inline">Next</span>
                                <svg
                                    class="h-5 w-5 inline-block shrink-0 -rotate-90"
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
                        </div>
                    </div>

                    <!-- Back to Top button -->
                    <div class="flex justify-center mt-4">
                        <button
                            on:click={scrollToTop}
                            class="cursor-pointer text-sm font-medium text-gray-600 dark:text-zinc-400 transition hover:text-violet-600 dark:hover:text-violet-400"
                        >
                            Back to Top <svg
                                class="h-5 w-5 inline-block shrink-0 rotate-180"
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
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</section>
