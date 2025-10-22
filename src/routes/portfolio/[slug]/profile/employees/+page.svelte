<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import DownloadData from "$lib/components/DownloadData.svelte";

  import { Button } from "$lib/components/shadcn/button/index.js";
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

  function formatWithDollarSign(value) {
    if (value == null) return "-";

    const negative = value < 0;
    const formattedValue = new Intl.NumberFormat("en").format(Math.abs(value));

    return negative ? `-$${formattedValue}` : `$${formattedValue}`;
  }

  let sortBy = "Total";

  function sortByDate(liste) {
    //Slice copies the list otherwise employeesHistory will reverse too
    return liste?.slice()?.sort(function (a, b) {
      return new Date(b?.date) - new Date(a?.date);
    });
  }

  function plotData() {
    let dateList = [];
    let valueList = [];

    // Create a sorted copy of the employee history from oldest to newest
    const sortedHistory = [...employeeHistory].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    if (sortBy === "Total") {
      sortedHistory.forEach((record) => {
        dateList.push(record.date.slice(0, 4));
        valueList.push(record.employeeCount);
      });
    } else if (sortBy === "Change") {
      for (let i = 0; i < sortedHistory.length - 1; i++) {
        const current = sortedHistory[i].employeeCount;
        const next = sortedHistory[i + 1].employeeCount;
        const change = next - current;

        // Push the later date since the change happens between current and next
        dateList.push(sortedHistory[i + 1].date.slice(0, 4));
        valueList.push(change);
      }
    } else if (sortBy === "Growth") {
      for (let i = 0; i < sortedHistory.length - 1; i++) {
        const current = sortedHistory[i].employeeCount;
        const next = sortedHistory[i + 1].employeeCount;

        if (current !== null && current !== 0) {
          const growth = ((next - current) / current) * 100;
          valueList.push(Number(growth.toFixed(2)));
        } else {
          valueList.push(0);
        }
        dateList.push(sortedHistory[i + 1].date.slice(0, 4));
      }
    }

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
        text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-lg">${removeCompanyStrings($displayCompanyName)} Employees</h3>`,
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
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          formatter: function () {
            if (sortBy === "Growth") {
              return this.value + "%";
            }
            return this.value.toLocaleString();
          },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Semi-transparent black
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
          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">Year ${new Date(
            this?.x,
          ).toLocaleDateString("en-US", {
            year: "numeric",
          })}</span><br>`;

          // Loop through each point in the shared tooltip
          this.points.forEach((point) => {
            tooltipContent += `
        <span class="font-normal text-sm mt-1">${point?.y?.toLocaleString("en-US")}</span><br>`;
          });

          return tooltipContent;
        },
      },
      series: [
        {
          name: "Employees",
          data: valueList,
          color: $mode === "light" ? "#2C6288" : "#fff",
          animation: false,
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
        changeRate,
      );
      const changeDirection =
        changeRate >= 0 && changeRate !== null ? "increased" : "decreased";
      const growthRateClass =
        changeRate >= 0 && changeRate !== null
          ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
          : "text-red-800 dark:text-[#FF2F1F]";

      return `
      <span>
        ${$displayCompanyName} had ${formattedEmployees} employees on ${latestdate}. The number of employees ${changeDirection}
        by ${formattedChangeRate} or
        <span class="${growthRateClass}">
          ${growthRate}%
        </span>
        compared to the previous year.
      </span>
    `;
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

      return `
      <span>
        ${$displayCompanyName} had ${abbreviatedEmployees} employees on ${latestdate}. Since then, the company has not submitted any additional employee data for more than a year.
      </span>
    `;
    } else {
      return `
      <span>
        No employee history for ${$displayCompanyName}. Probably, no records of past employees.
      </span>
    `;
    }
  }

  $: {
    if (employeeHistory?.length > 0 && $stockTicker) {
      employeeHistory = data?.getHistoryEmployee ?? [];
      historyList = sortByDate(employeeHistory);

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
    }
  }

  let htmlOutput = generateEmployeeInfoHTML();

  $: {
    if (sortBy || $mode) {
      config = plotData() || null;
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Employee Count | Workforce Growth & Hiring Trends`}
  description={`Comprehensive employee count analysis for ${$displayCompanyName} (${$stockTicker}). Track workforce growth, hiring trends, headcount changes, and employment statistics with historical data and growth rate calculations.`}
  keywords={`${$stockTicker} employee count, ${$displayCompanyName} workforce, company headcount, ${$stockTicker} hiring trends, employee growth rate, workforce analysis, ${$stockTicker} employment statistics, company size employees`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/profile/employees`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Employee Analysis`,
    description: `Professional workforce analysis and employee count tracking for ${$displayCompanyName} (${$stockTicker})`,
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
            {removeCompanyStrings($displayCompanyName)} Employees
          </h2>

          <Infobox text={htmlOutput} />
        </div>

        <div
          class="my-5 grid grid-cols-2 gap-3 xs:mt-6 bp:mt-7 sm:grid-cols-3 sm:gap-6"
        >
          <div>
            Employees
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
            Change (1Y) <div
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
            Growth (1Y) <div
              class="mt-0.5 text-lg {growthRate && growthRate > 0
                ? "before:content-['+'] "
                : ''} font-semibold bp:text-xl sm:mt-1.5 sm:text-2xl"
            >
              {growthRate !== null ? growthRate + "%" : "n/a"}
            </div>
          </div>
          <div>
            Revenue / Employee
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
            Profits / Employee
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
            Market Cap
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

        <div
          class="flex flex-col sm:flex-row items-start sm:items-center w-full mt-10 mb-4"
        >
          <h1
            class="text-xl sm:text-2xl font-bold text-start mr-auto mb-4 sm:mb-0"
          >
            Employees Chart
          </h1>
          {#if historyList?.length > 0}
            <div class="flex flex-row items-center w-fit sm:ml-auto">
              <div class="relative inline-block text-left grow mr-2">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="w-full border-gray-300  dark:border-gray-600 border bg-black text-white sm:hover:bg-default dark:bg-default dark:sm:hover:bg-primary ease-out  flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                    >
                      <span class="truncate">{sortBy}</span>
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
                    class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                  >
                    <DropdownMenu.Label
                      class="text-muted dark:text-gray-400 font-normal"
                    >
                      Select Type
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Group>
                      <DropdownMenu.Item
                        on:click={() => (sortBy = "Total")}
                        class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                      >
                        Total
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        on:click={() => (sortBy = "Change")}
                        class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                      >
                        Change
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        on:click={() => (sortBy = "Growth")}
                        class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                      >
                        Growth
                      </DropdownMenu.Item>
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>

              <DownloadData
                {data}
                rawData={historyList}
                title={`employee_${$stockTicker}`}
              />
            </div>
          {/if}
        </div>

        {#if historyList?.length !== 0}
          <div
            class="shadow-xs border border-gray-300 dark:border-gray-800 rounded"
            use:highcharts={config}
          ></div>

          <div class="mt-5">
            <h3 class=" text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
              Employees History
            </h3>

            <div class=" w-full overflow-x-auto">
              <table
                class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto mt-4"
              >
                <thead class="text-white bg-default">
                  <tr>
                    <th
                      class="text-start text-sm sm:text-[1rem] whitespace-nowrap font-semibold"
                    >
                      Date
                    </th>
                    <th
                      class="text-end text-sm sm:text-[1rem] whitespace-nowrap font-semibold"
                    >
                      Employees
                    </th>
                    <th
                      class="text-end text-sm sm:text-[1rem] whitespace-nowrap font-semibold"
                    >
                      Change
                    </th>
                    <th
                      class="text-end text-sm sm:text-[1rem] whitespace-nowrap font-semibold"
                    >
                      Growth
                    </th>
                  </tr>
                </thead>
                <tbody class="">
                  {#each historyList as item, index}
                    <tr
                      class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd"
                    >
                      <td
                        class="text-start text-sm sm:text-[1rem] whitespace-nowrap"
                      >
                        {new Date(item?.date)?.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          daySuffix: "2-digit",
                          timeZone: "UTC",
                        })}
                      </td>
                      <td
                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                      >
                        {new Intl.NumberFormat("en").format(
                          item?.employeeCount,
                        )}
                      </td>
                      <td
                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap"
                      >
                        {#if Number(item?.employeeCount - historyList[index + 1]?.employeeCount)}
                          {new Intl.NumberFormat("en").format(
                            item?.employeeCount -
                              historyList[index + 1]?.employeeCount,
                          )}
                        {:else}
                          n/a
                        {/if}
                      </td>
                      <td
                        class="text-end text-sm sm:text-[1rem] whitespace-nowrap text-end"
                      >
                        {#if index === historyList?.length - 1}
                          n/a
                        {:else if item?.employeeCount > historyList[index + 1]?.employeeCount}
                          <span class="text-green-800 dark:text-[#00FC50]">
                            +{(
                              ((item?.employeeCount -
                                historyList[index + 1]?.employeeCount) /
                                historyList[index + 1]?.employeeCount) *
                              100
                            ).toFixed(2)}%
                          </span>
                        {:else if item?.employeeCount < historyList[index + 1]?.employeeCount}
                          <span class="text-red-800 dark:text-[#FF2F1F]">
                            -{(
                              (Math.abs(
                                item?.employeeCount -
                                  historyList[index + 1]?.employeeCount,
                              ) /
                                historyList[index + 1]?.employeeCount) *
                              100
                            ).toFixed(2)}%
                          </span>
                        {:else}
                          n/a
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {:else}
          <h1
            class="text-xl m-auto flex justify-center font-semibold mb-4 mt-10"
          >
            No history found
          </h1>
        {/if}
      </div>
    </div>
  </div>
</section>
