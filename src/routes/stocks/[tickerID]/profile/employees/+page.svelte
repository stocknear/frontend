<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import DownloadData from "$lib/components/DownloadData.svelte";
  import TableHeader from "$lib/components/Table/TableHeader.svelte";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import * as m from "$lib/paraglide/messages";

  import { mode } from "mode-watcher";

  import highcharts from "$lib/highcharts.ts";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import { abbreviateNumber, removeCompanyStrings } from "$lib/utils";

  export let data;

  let config = null;

  let employeeHistory = data?.getHistoryEmployee ?? [];
  let historyList = sortByDate(employeeHistory);

  let employees = null;
  let changeRate = null;
  let growthRate = null;

  let dateDistance = false;

  $: columns = [
    { key: "date", label: m.stock_detail_employees_col_date(), align: "left" },
    {
      key: "employeeCount",
      label: m.stock_detail_employees_col_employees(),
      align: "right",
    },
    {
      key: "change",
      label: m.stock_detail_employees_col_change(),
      align: "right",
    },
    {
      key: "growth",
      label: m.stock_detail_employees_col_growth(),
      align: "right",
    },
  ];

  const rowsPerPageOptions = [20, 50, 100];

  function createDefaultSortOrders() {
    return {
      date: { order: "none", type: "date" },
      employeeCount: { order: "none", type: "number" },
      change: { order: "none", type: "number" },
      growth: { order: "none", type: "number" },
    };
  }

  let sortOrders = createDefaultSortOrders();

  let tableOriginal = [];
  let tableData = [];
  let paginatedRows = [];

  let currentPage = 1;
  let rowsPerPage = 20;
  let totalPages = 1;

  function formatWithDollarSign(value) {
    if (value == null) return "-";

    const negative = value < 0;
    const formattedValue = new Intl.NumberFormat("en").format(Math.abs(value));

    return negative ? `-$${formattedValue}` : `$${formattedValue}`;
  }

  function sortByDate(liste) {
    //Slice copies the list otherwise employeesHistory will reverse too
    return liste?.slice()?.sort(function (a, b) {
      return new Date(b?.date) - new Date(a?.date);
    });
  }

  function computeTableRows(list = []) {
    if (!Array.isArray(list)) return [];

    return list.map((item, index) => {
      const nextItem = list[index + 1];

      const currentRaw = item?.employeeCount;
      const nextRaw = nextItem?.employeeCount;

      const currentCount =
        currentRaw == null
          ? null
          : Number.isFinite(Number(currentRaw))
            ? Number(currentRaw)
            : null;

      const nextCount =
        nextRaw == null
          ? null
          : Number.isFinite(Number(nextRaw))
            ? Number(nextRaw)
            : null;

      const change =
        currentCount != null && nextCount != null
          ? currentCount - nextCount
          : null;

      let growth = null;

      if (
        currentCount != null &&
        nextCount != null &&
        nextCount !== 0 &&
        Number.isFinite(nextCount)
      ) {
        growth = Number(
          (((currentCount - nextCount) / nextCount) * 100).toFixed(2),
        );
      }

      return {
        date: item?.date ?? null,
        employeeCount: currentCount,
        change,
        growth,
      };
    });
  }

  function updatePaginatedRows() {
    const totalItems = tableData?.length ?? 0;
    totalPages = totalItems > 0 ? Math.ceil(totalItems / rowsPerPage) : 1;

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    paginatedRows = tableData.slice(startIndex, endIndex);
  }

  function rebuildTableData(list = []) {
    tableOriginal = computeTableRows(list);
    tableData = [...tableOriginal];
    sortOrders = createDefaultSortOrders();
    currentPage = 1;
    updatePaginatedRows();
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      updatePaginatedRows();
    }
  }

  function changeRowsPerPage(newRowsPerPage) {
    rowsPerPage = newRowsPerPage;
    currentPage = 1;
    updatePaginatedRows();
  }

  function sortData(key) {
    if (!sortOrders?.[key]) return;

    const orderCycle = ["none", "asc", "desc"];
    const currentOrder = sortOrders[key]?.order ?? "none";
    const nextOrder =
      orderCycle[(orderCycle.indexOf(currentOrder) + 1) % orderCycle.length];

    const updatedSortOrders = Object.keys(sortOrders).reduce((acc, itemKey) => {
      acc[itemKey] = {
        ...sortOrders[itemKey],
        order: itemKey === key ? nextOrder : "none",
      };
      return acc;
    }, {});

    sortOrders = updatedSortOrders;

    if (nextOrder === "none") {
      tableData = [...tableOriginal];
      currentPage = 1;
      updatePaginatedRows();
      return;
    }

    const { type } = sortOrders[key] ?? { type: "number" };

    const compareValues = (a, b) => {
      const valueA = a?.[key];
      const valueB = b?.[key];

      if (type === "date") {
        const dateA = valueA ? new Date(valueA).getTime() : null;
        const dateB = valueB ? new Date(valueB).getTime() : null;

        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return nextOrder === "asc" ? 1 : -1;
        if (dateB === null) return nextOrder === "asc" ? -1 : 1;

        return nextOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (type === "number") {
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return nextOrder === "asc" ? 1 : -1;
        if (valueB == null) return nextOrder === "asc" ? -1 : 1;

        const numberA = Number(valueA);
        const numberB = Number(valueB);

        return nextOrder === "asc" ? numberA - numberB : numberB - numberA;
      }

      const stringA = (valueA ?? "").toString().toUpperCase();
      const stringB = (valueB ?? "").toString().toUpperCase();

      return nextOrder === "asc"
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    };

    tableData = [...tableData].sort(compareValues);
    currentPage = 1;
    updatePaginatedRows();
  }

  function plotData() {
    let dateList = [];
    let totalList = [];
    let growthList = [];

    // Create a sorted copy of the employee history from oldest to newest
    const sortedHistory = [...employeeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    sortedHistory.forEach((record, index) => {
      const yearLabel = record?.date?.slice(0, 4) ?? "";
      dateList.push(yearLabel);
      totalList.push(record?.employeeCount ?? null);

      if (index === 0) {
        growthList.push(null);
        return;
      }

      const previousCount = sortedHistory[index - 1]?.employeeCount;
      const currentCount = record?.employeeCount;

      if (
        previousCount === null ||
        previousCount === undefined ||
        Number(previousCount) === 0 ||
        currentCount === null ||
        currentCount === undefined
      ) {
        growthList.push(null);
        return;
      }

      const growth = ((currentCount - previousCount) / previousCount) * 100;
      growthList.push(Number(growth.toFixed(2)));
    });

    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1 text-sm sm:text-lg">${m.stock_detail_employees_chart_title({ company: removeCompanyStrings($displayCompanyName) })}</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },
      xAxis: {
        categories: dateList,
        labels: {
          style: {
            color: $mode === "light" ? "black" : "white",
            fontSize: "12px",
          },
          rotation: 45,
          step: dateList.length > 12 ? 2 : 1,
        },
      },
      yAxis: [
        {
          gridLineWidth: 1,
          gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
          labels: {
            style: { color: $mode === "light" ? "black" : "white" },
            formatter: function () {
              return this.value?.toLocaleString?.() ?? this.value;
            },
          },
          title: { text: null },
          opposite: false,
        },
        {
          gridLineWidth: 0,
          labels: {
            style: { color: $mode === "light" ? "black" : "white" },
            formatter: function () {
              return this.value === null || this.value === undefined
                ? ""
                : `${this.value}%`;
            },
          },
          title: { text: null },
          opposite: true,
        },
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 1)", // Semi-transparent black
        borderColor: "rgba(255, 255, 255, 0.2)", // Slightly visible white border
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          // Format the x value to display time in a custom format
          const yearValue = this.points[0]?.key;
          let tooltipContent = `<span class="m-auto text-sm font-[501]">Year ${yearValue}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point, index) => {
            const label = point?.series?.name ?? "";
            const isGrowthSeries = index === 1;
            const value = isGrowthSeries
              ? point?.y === null || point?.y === undefined
                ? "n/a"
                : `${point.y.toFixed(2)}%`
              : point?.y === null || point?.y === undefined
                ? "n/a"
                : point.y.toLocaleString("en-US");
            tooltipContent += `
    <span class="font-normal text-sm mt-1">${label}: ${value}</span><br>`;
          });

          return tooltipContent;
        },
      },
      series: [
        {
          name: m.stock_detail_employees_label(),
          type: "column",
          data: totalList,
          color: $mode === "light" ? "#2C6288" : "#fff",
          animation: false,
          yAxis: 0,
        },
        {
          name: m.stock_detail_employees_col_growth(),
          type: "spline",
          data: growthList,
          color: $mode === "light" ? "#1D4ED8" : "#38BDF8",
          animation: false,
          yAxis: 1,
          marker: {
            enabled: true,
            radius: 3,
          },
        },
      ],
      plotOptions: {
        column: {
          borderRadius: 1,
        },
      },
      legend: {
        enabled: false,
      },
      navigation: {
        buttonOptions: {
          enabled: false,
        },
      },
    };

    return options;
  }

  function generateEmployeeInfoHTML() {
    if (employeeHistory?.length !== 0 && !dateDistance) {
      const formattedEmployees = new Intl.NumberFormat("en").format(employees);
      const latestdate = new Date(employeeHistory?.at(0)?.date).toLocaleString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      );
      const formattedChangeRate = new Intl.NumberFormat("en").format(
        Math.abs(changeRate),
      );
      const changeDirection =
        changeRate >= 0 && changeRate !== null
          ? m.stock_detail_employees_increased()
          : m.stock_detail_employees_decreased();
      const growthRateClass =
        changeRate >= 0 && changeRate !== null
          ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400";

      return `<span>${m.stock_detail_employees_info_has_data({
        company: $displayCompanyName,
        employees: formattedEmployees,
        date: latestdate,
        direction: changeDirection,
        change: formattedChangeRate,
        colorClass: growthRateClass,
        growth: growthRate,
      })}</span>`;
    } else if (employeeHistory?.length !== 0 && dateDistance) {
      const abbreviatedEmployees = abbreviateNumber(employees);
      const latestdate = new Date(employeeHistory?.at(0)?.date).toLocaleString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      );

      return `<span>${m.stock_detail_employees_info_old_data({
        company: $displayCompanyName,
        employees: abbreviatedEmployees,
        date: latestdate,
      })}</span>`;
    } else {
      return `<span>${m.stock_detail_employees_info_no_data({
        company: $displayCompanyName,
      })}</span>`;
    }
  }

  $: {
    if (employeeHistory?.length > 0 && $stockTicker) {
      employeeHistory = data?.getHistoryEmployee ?? [];
      historyList = sortByDate(employeeHistory);
      rebuildTableData(historyList);

      employees = employeeHistory?.at(0)?.employeeCount;

      changeRate = employees - employeeHistory?.at(1)?.employeeCount;

      dateDistance =
        new Date(employeeHistory?.at(0)["date"]) <
        new Date(new Date().setFullYear(new Date().getFullYear() - 1))
          ? true
          : false;

      growthRate =
        employeeHistory?.at(1)?.employeeCount > 0
          ? (
              (employeeHistory?.at(0)?.employeeCount /
                employeeHistory?.at(1)?.employeeCount -
                1) *
              100
            )?.toFixed(2)
          : 0;

      htmlOutput = generateEmployeeInfoHTML();
    } else {
      rebuildTableData([]);
      htmlOutput = generateEmployeeInfoHTML();
    }
  }

  let htmlOutput = generateEmployeeInfoHTML();

  $: {
    if ($mode !== undefined) {
      config = plotData() || null;
    }
  }
</script>

<SEO
  title={m.stock_detail_employees_seo_title({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  description={m.stock_detail_employees_seo_description({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  keywords={m.stock_detail_employees_seo_keywords({
    company: $displayCompanyName,
    ticker: $stockTicker,
  })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/profile/employees`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: m.stock_detail_employees_structured_name({
      company: $displayCompanyName,
    }),
    description: m.stock_detail_employees_structured_desc({
      company: $displayCompanyName,
      ticker: $stockTicker,
    }),
    url: `https://stocknear.com/stocks/${$stockTicker}/profile/employees`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Employee count tracking",
      "Workforce growth analysis",
      "Hiring trend monitoring",
      "Headcount change tracking",
      "Employment statistics",
      "Growth rate calculations",
      "Historical workforce data",
      "Company size analysis",
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
  }}
/>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex justify-center m-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
        <div class="mb-6">
          <h2 class="text-xl sm:text-2xl font-bold mb-4">
            {m.stock_detail_employees_title({
              company: removeCompanyStrings($displayCompanyName),
            })}
          </h2>

          <Infobox text={htmlOutput} />
        </div>

        <div
          class="my-5 grid grid-cols-2 gap-3 xs:mt-6 bp:mt-7 sm:grid-cols-3 sm:gap-6"
        >
          <div>
            {m.stock_detail_employees_label()}
            <div
              class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
            >
              {#if Number(employees)}
                {new Intl.NumberFormat("en")?.format(employees)}
              {:else}
                n/a
              {/if}
            </div>
          </div>
          <div>
            {m.stock_detail_employees_change_1y()}
            <div
              class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
            >
              {#if dateDistance}
                n/a
              {:else}
                {changeRate !== null
                  ? changeRate?.toLocaleString("en-US")
                  : "n/a"}
              {/if}
            </div>
          </div>
          <div>
            {m.stock_detail_employees_growth_1y()}
            <div
              class="mt-0.5 text-lg {growthRate && growthRate > 0
                ? "before:content-['+'] "
                : ''} font-semibold bp:text-xl sm:mt-1.5 sm:text-2xl"
            >
              {growthRate !== null ? growthRate + "%" : "n/a"}
            </div>
          </div>
          <div>
            {m.stock_detail_employees_revenue_per()}
            <div
              class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
            >
              {#if Number(data?.getStockDeck?.revenuePerEmployee)}
                ${new Intl.NumberFormat("en")?.format(
                  data?.getStockDeck?.revenuePerEmployee,
                )}
              {:else}
                n/a
              {/if}
            </div>
          </div>
          <div>
            {m.stock_detail_employees_profits_per()}
            <div
              class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
            >
              {#if Number(data?.getStockDeck?.profitPerEmployee)}
                {formatWithDollarSign(data?.getStockDeck?.profitPerEmployee)}
              {:else}
                n/a
              {/if}
            </div>
          </div>
          <div>
            {m.stock_detail_employees_market_cap()}
            <div
              class="mt-0.5 text-lg bp:text-xl sm:mt-1.5 sm:text-2xl font-semibold"
            >
              {@html abbreviateNumber(
                data?.getStockQuote?.marketCap,
                false,
                true,
              )}
            </div>
          </div>
        </div>

        {#if tableOriginal?.length !== 0}
          <div
            class="shadow-none border border-gray-300 shadow dark:border-zinc-700 rounded-2xl"
            use:highcharts={config}
          ></div>

          <div class="mt-5">
            <div class="items-center lg:overflow-visible px-1 py-1">
              <div
                class="flex flex-row items-start sm:items-center lg:order-2 lg:grow py-1 border-t border-b border-gray-300 dark:border-zinc-700"
              >
                <h3
                  class="text-start whitespace-nowrap text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white py-1 w-full"
                >
                  {m.stock_detail_employees_history()}
                </h3>

                <div class=" w-full flex order-1 items-center ml-auto">
                  <div class="ml-auto">
                    <DownloadData
                      {data}
                      rawData={historyList}
                      title={`employee_${$stockTicker}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class=" w-full overflow-x-auto">
              <table
                class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 text-gray-700 dark:text-zinc-200 tabular-nums m-auto mt-4"
              >
                <thead>
                  <TableHeader {columns} {sortOrders} {sortData} />
                </thead>
                <tbody>
                  {#each paginatedRows as row}
                    <tr class="transition-colors">
                      <td class="text-start text-sm whitespace-nowrap">
                        {#if row?.date}
                          {new Date(row.date).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            daySuffix: "2-digit",
                            timeZone: "UTC",
                          })}
                        {:else}
                          n/a
                        {/if}
                      </td>
                      <td class="text-end text-sm whitespace-nowrap">
                        {#if row?.employeeCount != null}
                          {new Intl.NumberFormat("en").format(
                            row.employeeCount,
                          )}
                        {:else}
                          n/a
                        {/if}
                      </td>
                      <td class="text-end text-sm whitespace-nowrap">
                        {#if row?.change != null}
                          {new Intl.NumberFormat("en").format(row.change)}
                        {:else}
                          n/a
                        {/if}
                      </td>
                      <td class="text-end text-sm whitespace-nowrap text-end">
                        {#if typeof row?.growth === "number" && row.growth > 0}
                          <span class="text-emerald-600 dark:text-emerald-400">
                            +{row.growth.toFixed(2)}%
                          </span>
                        {:else if typeof row?.growth === "number" && row.growth < 0}
                          <span class="text-rose-600 dark:text-rose-400">
                            {row.growth.toFixed(2)}%
                          </span>
                        {:else if row?.growth === 0}
                          0.00%
                        {:else}
                          n/a
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <div
              class="flex flex-row items-center justify-between mt-8 sm:mt-6 gap-4"
            >
              <div class="flex items-center gap-2">
                <Button
                  on:click={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                  <span class="hidden sm:inline"
                    >{m.stock_detail_previous()}</span
                  >
                </Button>
              </div>

              <div class="flex flex-row items-center gap-4">
                <span class="text-sm text-gray-600 dark:text-zinc-300">
                  {m.stock_detail_page_of({
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span class="truncate text-[0.85rem] sm:text-sm">
                        {m.stock_detail_rows({ count: rowsPerPage })}
                      </span>
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
                    class="w-auto min-w-40 max-h-[400px] overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <DropdownMenu.Group class="pb-2">
                      {#each rowsPerPageOptions as item}
                        <DropdownMenu.Item
                          class="text-gray-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          <label
                            on:click={() => changeRowsPerPage(item)}
                            class="inline-flex justify-between w-full items-center cursor-pointer text-sm"
                          >
                            {m.stock_detail_rows({ count: item })}
                          </label>
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>

              <div class="flex items-center gap-2">
                <Button
                  on:click={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="w-fit sm:w-auto transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span class="hidden sm:inline">{m.stock_detail_next()}</span>
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
          </div>
        {:else}
          <h1
            class="text-xl m-auto flex justify-center font-semibold mb-4 mt-10"
          >
            {m.stock_detail_employees_no_history()}
          </h1>
        {/if}
      </div>
    </div>
  </div>
</section>
