<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    coolMode,
    timeFrame,
    selectedTimePeriod,
    screenWidth,
  } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  //import * as XLSX from 'xlsx';
  import FinancialTable from "$lib/components/FinancialTable.svelte";
  import FinancialChart from "$lib/components/FinancialChart.svelte";
  import TableMode from "lucide-svelte/icons/grid-2x2";
  import ChartMode from "lucide-svelte/icons/chart-column-increasing";
  import Download from "lucide-svelte/icons/download";
  import { mode } from "mode-watcher";
  import { toast } from "svelte-sonner";

  import { goto } from "$app/navigation";

  export let data;
  export let title;
  export let statementConfig;

  let seoDescription = "";
  if (title === "Income Statement") {
    seoDescription = `Detailed annual, quarterly and trailing income statement for ${$displayCompanyName} (${$stockTicker}). See many years of revenue, expenses and profits or losses.`;
  }

  let switchDate = false;
  let tableList = [];
  let processedData = {};

  let financialData = [];
  let fullStatement = [];

  const fields = statementConfig.map((item) => ({
    label: item.label,
    key: item.propertyName,
  }));
  function toggleMode() {
    $coolMode = !$coolMode;
  }

  const getCurrentYear = () => new Date()?.getFullYear();

  const filterStatement = (fullStatement, timeFrame, switchDate) => {
    const currentYear = getCurrentYear();

    let filtered = [...(fullStatement || [])];

    switch (timeFrame) {
      case "5Y":
        filtered = filtered.filter(
          (item) => currentYear - parseInt(item?.fiscalYear) < 5,
        );
        break;
      case "10Y":
        filtered = filtered.filter(
          (item) => currentYear - parseInt(item?.fiscalYear) < 10,
        );
        break;
    }

    // Sort by date depending on switchDate
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.fiscalDate || a.fiscalYear);
      const dateB = new Date(b.date || b.fiscalDate || b.fiscalYear);
      return switchDate
        ? dateA - dateB // earliest to latest
        : dateB - dateA; // latest to earliest
    });

    return filtered;
  };

  fullStatement = data?.getData;

  const exportFundamentalData = (format = "csv") => {
    if (["Pro", "Plus"]?.includes(data?.user?.tier)) {
      const data = fullStatement;
      if (!data || data.length === 0) {
        return;
      }

      let properties = [
        {
          key: $selectedTimePeriod === "annual" ? "fiscalYear" : "date",
          label: $selectedTimePeriod === "annual" ? "Year" : "Quarter",
        },
      ];

      for (let i = 0; i < statementConfig?.length; i++) {
        properties.push({
          key: statementConfig[i]?.propertyName,
          label: statementConfig[i]?.label,
        });
      }

      // Helper function to handle special cases

      // Create rows for CSV/Excel
      let rows = data.map((item) =>
        properties?.map((property) => item[property?.key] || 0),
      );

      // Include headers
      const headers = properties.map((prop) => prop.label);
      rows.unshift(headers);

      const fileTitle = title?.toLowerCase()?.trim()?.replace(/\s+/g, "_");
      // Check the format to export
      if (format.toLowerCase() === "csv") {
        const csvContent = rows.map((row) => row.join(",")).join("\n");
        const blob = new Blob([csvContent], {
          type: "data:text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          $stockTicker.toLowerCase() +
          `${$selectedTimePeriod === "annual" ? "_annual" : $selectedTimePeriod === "quarterly" ? "_quarter" : "_ttm"}_${fileTitle}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } else {
      goto("/pricing");
    }
  };

  // Pre-process all data once instead of in each component
  function preprocessFinancialData() {
    processedData = {};

    // Precompute mapping from propertyName to config for quick lookup
    const configMap = {};
    statementConfig.forEach((item) => {
      if (item && item.propertyName) {
        configMap[item.propertyName] = item;
      }
    });

    // Precompute xList from income (reverse order)
    const xList = [];
    for (let i = financialData.length - 1; i >= 0; i--) {
      const statement = financialData[i];
      const year = statement.fiscalYear?.slice(-2);
      const quarter = statement.period;
      xList.push(
        $selectedTimePeriod === "annual"
          ? "FY" + year
          : "FY" + year + " " + quarter,
      );
    }

    // Process each field using precomputed config and xList
    fields.forEach((field) => {
      const statementKey = field.key;
      const config = configMap[statementKey];
      if (!config) return;

      const valueList = [];
      // Loop through financialData in reverse to match xList order
      for (let i = financialData.length - 1; i >= 0; i--) {
        const statement = financialData[i];
        const rawValue = Number(statement[config.propertyName]);
        // Round to two decimals
        const value = parseFloat(rawValue.toFixed(2));
        valueList.push(value);
      }

      processedData[statementKey] = {
        xList, // re-use the precomputed labels
        valueList,
        labelName: config.label,
      };
    });

    // Build tableList once for all charts and sort by date (newest first)
    tableList = financialData?.map((statement) => ({
      date: statement.date,
      // Add more properties if needed
    }));

    tableList.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  $: {
    if ($timeFrame || $selectedTimePeriod) {
      if (
        ["MAX", "10Y"].includes($timeFrame) &&
        !["Pro", "Plus"].includes(data?.user?.tier)
      ) {
        $timeFrame = "5Y"; // Default to 5Y if user is not Pro/Plus
        toast.error("Only available for Plus and Pro users.", {
          style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
        });
      }
      if ($selectedTimePeriod === "annual") {
        fullStatement = data?.getData?.annual;
      } else if ($selectedTimePeriod === "quarterly") {
        fullStatement = data?.getData?.quarter;
      } else if ($selectedTimePeriod === "ttm") {
        fullStatement = data?.getData?.ttm;
      } else {
        fullStatement = data?.getData?.annual;
      }

      financialData = filterStatement(fullStatement, $timeFrame, switchDate);
      preprocessFinancialData();
    }
  }
</script>

<section class=" w-full overflow-hidden h-full">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div
            class="mb-3 sm:mb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between"
          >
            <h1 class="text-xl sm:text-2xl font-bold">
              {removeCompanyStrings($displayCompanyName)}
              {title}
            </h1>
          </div>

          <div class="grid grid-cols-1 gap-2">
            {#if financialData?.length > 0}
              <div class="flex flex-col md:flex-row items-end justify-between">
                <span
                  class="text-xs sm:text-sm order-1 sm:order-0 mt-5 sm:mt-0 text-gray-600 dark:text-gray-400 w-full"
                >
                  Financials in {financialData?.at(0)?.reportedCurrency}. Fiscal
                  year is
                  {data?.getProfileData?.fiscalYearRange}.
                </span>
                <div class="flex flex-row items-center justify-end w-full">
                  <Button
                    on:click={toggleMode}
                    class="  w-full max-w-36 sm:w-fit border-gray-300 bg-black sm:hover:bg-default text-white  dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out  flex flex-row justify-between items-center px-4 py-1.5  rounded truncate"
                  >
                    {#if $coolMode}
                      <TableMode class="w-4.5 h-4.5" />
                      <span class="ml-2 mr-auto text-sm"> Table Mode </span>
                    {:else}
                      <ChartMode class="w-4.5 h-4.5" />
                      <span class="ml-2 mr-auto text-sm"> Chart Mode </span>
                    {/if}</Button
                  >

                  <Button
                    on:click={() => (switchDate = !switchDate)}
                    class="ml-2  w-48 sm:w-fit border-gray-300 bg-black sm:hover:bg-default text-white  dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out  flex flex-row justify-between items-center px-4 py-1.5  rounded truncate"
                  >
                    <svg
                      class="shrink-0 w-5 h-5 pointer-events-none m-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style="max-width:40px"
                      ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      ></path></svg
                    ></Button
                  >
                  <div class="ml-2 relative inline-block">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="flex-shrink-0  w-full sm:w-fit border-gray-300 bg-black sm:hover:bg-default text-white  dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out  flex flex-row justify-between items-center px-3 py-1.5  rounded truncate"
                        >
                          <span class="truncate">{$timeFrame}</span>
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
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "5Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            5Y
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "10Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            10Y
                            <svg
                              class="{['Pro', 'Plus']?.includes(
                                data?.user?.tier,
                              )
                                ? 'hidden'
                                : ''} ml-2 w-3.5 h-3.5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              ><path
                                fill="currentColor"
                                d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                              /></svg
                            >
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "MAX")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary flex flex-row items-center"
                          >
                            Max
                            <svg
                              class="{['Pro', 'Plus']?.includes(
                                data?.user?.tier,
                              )
                                ? 'hidden'
                                : ''} ml-2 w-3.5 h-3.5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              ><path
                                fill="currentColor"
                                d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                              /></svg
                            >
                          </DropdownMenu.Item>
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>

                  <Button
                    on:click={() => exportFundamentalData("csv")}
                    class=" ml-2 w-20 sm:w-fit border-gray-300 bg-black sm:hover:bg-default text-white  dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out flex flex-row justify-between items-center px-3 py-1.5  rounded truncate"
                  >
                    {#if $screenWidth < 640}
                      <Download class="w-4.5 h-4.5 flex-shrink-0 m-auto" />
                    {:else}
                      <span class="truncate">Download</span>
                      <svg
                        class="{['Pro', 'Plus']?.includes(data?.user?.tier)
                          ? 'hidden'
                          : ''} ml-1 -mt-0.5 w-3.5 h-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        /></svg
                      >
                    {/if}
                  </Button>
                </div>
              </div>
              {#if $coolMode}
                <div class="grid gap-5 xs:gap-6 lg:grid-cols-3 lg:gap-3">
                  {#each fields as item, i}
                    <FinancialChart
                      data={financialData}
                      {statementConfig}
                      displayStatement={item?.key}
                      filterRule={$selectedTimePeriod}
                      {processedData}
                      color={["#ff00cc", "#37ff00", "#0c63e7", "#07c8f9"][
                        i % 4
                      ]}
                    />
                  {/each}
                </div>
              {:else}
                <div
                  class="w-full rounded-none sm:rounded m-auto overflow-x-auto"
                >
                  <table
                    class="table table-sm table-compact rounded-none sm:rounded w-full border border-gray-300 dark:border-gray-800 m-auto"
                  >
                    <thead class="text-white bg-default">
                      <tr class="border min-w-[250px]">
                        <td class="text-start text-sm font-semibold pr-10"
                          >Fiscal Year</td
                        >
                        {#each financialData as item}
                          {#if $selectedTimePeriod === "annual"}
                            <td
                              class="min-w-[130px] font-semibold text-sm text-end border-l border-gray-300 dark:border-gray-800"
                            >
                              {"FY" + " " + item?.fiscalYear}
                            </td>
                          {:else}
                            <td
                              class="min-w-[130px] font-semibold text-sm text-end border-l border-gray-300 dark:border-gray-800"
                            >
                              {item?.period + " " + item?.fiscalYear}
                            </td>
                          {/if}
                        {/each}
                      </tr>
                      <tr class="border min-w-[250px]">
                        <td class="text-start text-sm font-semibold"
                          >Period Ending</td
                        >
                        {#each financialData as item}
                          <td
                            class=" font-semibold text-sm text-end border-l border-gray-300 dark:border-gray-800"
                          >
                            {new Date(item?.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                        {/each}
                      </tr>
                    </thead>
                    <tbody>
                      <!-- row -->
                      <FinancialTable data={financialData} {fields} />
                    </tbody>
                  </table>
                </div>
                <div
                  class="sm:flex sm:justify-between text-sm text-gray-600 dark:text-gray-300"
                >
                  <div>
                    Source: Financial Modeling Prep. <a
                      class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                      href="/data-disclaimer/">Financial Sources.</a
                    >
                  </div>
                  <div class="mt-2 sm:-mt-2 flex items-center gap-x-2">
                    SEC Filings: <a
                      class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://www.sec.gov/cgi-bin/browse-edgar?CIK=${data?.getProfileData?.cik}&amp;type=10-K`}
                      >10-K <svg
                        class="size-3.5 ml-0.5 mt-px"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                        style="max-width:40px"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        ></path></svg
                      ></a
                    >
                    ·
                    <a
                      class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://www.sec.gov/cgi-bin/browse-edgar?CIK=${data?.getProfileData?.cik}&amp;type=10-Q`}
                      >10-Q <svg
                        class="size-3.5 ml-0.5 mt-px"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                        style="max-width:40px"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        ></path></svg
                      ></a
                    >
                  </div>
                </div>
              {/if}
            {/if}
          </div>
        </div>
      </main>
    </div>
  </div>
</section>
