<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    coolMode,
    timeFrame,
  } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  //import * as XLSX from 'xlsx';
  import FinancialTable from "$lib/components/FinancialTable.svelte";
  import FinancialChart from "$lib/components/FinancialChart.svelte";
  import { goto } from "$app/navigation";
  import SEO from "$lib/components/SEO.svelte";

  export let data;

  let tableList = [];
  let processedData = {};

  let financialData = [];
  let fullStatement = [];
  let filterRule = "annual";

  let activeIdx = 0;

  const tabs = [
    {
      title: "Annual",
    },
    {
      title: "Quarterly",
    },
  ];

  const statementConfig = [
    {
      propertyName: "revenue",
      label: "Revenue",
    },
    {
      propertyName: "costOfRevenue",
      label: "Cost of Revenue",
    },
    {
      propertyName: "grossProfit",
      label: "Gross Profit",
    },
    {
      propertyName: "operatingIncome",
      label: "Operating Income",
    },
    {
      propertyName: "interestIncome",
      label: "Interest Income",
    },
    {
      propertyName: "incomeBeforeTax",
      label: "Pretax Income",
    },
    {
      propertyName: "netIncome",
      label: "Net Income",
    },
    {
      propertyName: "sellingGeneralAndAdministrativeExpenses",
      label: "Selling & General & Admin",
    },
    {
      propertyName: "researchAndDevelopmentExpenses",
      label: "Research & Development",
    },
    {
      propertyName: "otherExpenses",
      label: "Other Expenses",
    },
    {
      propertyName: "operatingExpenses",
      label: "Operating Expenses",
    },
    {
      propertyName: "interestExpense",
      label: "Interest Expense",
    },
    {
      propertyName: "sellingAndMarketingExpenses",
      label: "Selling & Marketing Expenses",
    },
    {
      propertyName: "costAndExpenses",
      label: "Cost & Expenses",
    },
    {
      propertyName: "incomeTaxExpense",
      label: "Income Tax Expense",
    },
    {
      propertyName: "weightedAverageShsOut",
      label: "Shares Outstanding (Basic)",
    },
    {
      propertyName: "weightedAverageShsOutDil",
      label: "Shares Outstanding (Diluted)",
    },
    {
      propertyName: "eps",
      growthPropertyName: "growthEPS",
      label: "EPS (Basic)",
    },
    {
      propertyName: "epsDiluted",
      label: "EPS (Diluted)",
    },
    {
      propertyName: "ebitda",
      label: "EBITDA",
    },
    {
      propertyName: "ebit",
      label: "EBIT",
    },
    {
      propertyName: "depreciationAndAmortization",
      label: "Depreciation & Amortization",
    },
  ];

  const fields = statementConfig.map((item) => ({
    label: item.label,
    key: item.propertyName,
  }));
  function toggleMode() {
    $coolMode = !$coolMode;
  }

  const getCurrentYear = () => new Date()?.getFullYear();

  const filterStatement = (fullStatement, timeFrame) => {
    const currentYear = getCurrentYear();

    switch (timeFrame) {
      case "5Y":
        return fullStatement?.filter(
          (item) => currentYear - parseInt(item?.fiscalYear) < 5,
        );
      case "10Y":
        return fullStatement?.filter(
          (item) => currentYear - parseInt(item?.fiscalYear) < 10,
        );
      default:
        return fullStatement;
    }
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
          key: filterRule === "annual" ? "fiscalYear" : "date",
          label: filterRule === "annual" ? "Year" : "Quarter",
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
          `${filterRule === "annual" ? "_annual" : "_quarter"}_income_statement.csv`;
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
      const year = statement.fiscalYear.slice(-2);
      const quarter = statement.period;
      xList.push(
        filterRule === "annual" ? "FY" + year : "FY" + year + " " + quarter,
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
    tableList = financialData.map((statement) => ({
      date: statement.date,
      // Add more properties if needed
    }));

    tableList.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  $: {
    if ($timeFrame || activeIdx) {
      if (activeIdx === 0) {
        filterRule = "annual";
        fullStatement = data?.getData?.annual;
      } else {
        filterRule = "quarterly";
        fullStatement = data?.getData?.quarter;
      }
      financialData = filterStatement(fullStatement, $timeFrame);
      preprocessFinancialData();
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Financials - Income Statement`}
  description={`Detailed annual and quarterly income statement for ${$displayCompanyName} (${$stockTicker}). See many years of revenue, expenses and profits or losses.`}
/>

<section class=" w-full overflow-hidden h-full">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 m-auto mt-2 sm:mt-0">
          <div
            class="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between"
          >
            <h1 class="text-xl sm:text-2xl font-bold">
              {removeCompanyStrings($displayCompanyName)} Income Statement
            </h1>
            <div
              class="mt-3 sm:mt-0 mb-2 sm:mb-0 bg-gray-300 dark:bg-secondary w-full min-w-24 sm:w-fit relative flex flex-wrap items-center justify-center rounded-md p-1"
            >
              {#each tabs as item, i}
                {#if !["Pro", "Plus"]?.includes(data?.user?.tier) && i > 0}
                  <button
                    on:click={() => goto("/pricing")}
                    class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1"
                  >
                    <span class="relative text-sm block font-semibold">
                      {item.title}
                      <svg
                        class="inline-block ml-0.5 -mt-1 w-3.5 h-3.5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                        /></svg
                      >
                    </span>
                  </button>
                {:else}
                  <button
                    on:click={() => (activeIdx = i)}
                    class="cursor-pointer group relative z-1 rounded-full w-1/2 min-w-24 md:w-auto px-5 py-1 {activeIdx ===
                    i
                      ? 'z-0'
                      : ''} "
                  >
                    {#if activeIdx === i}
                      <div class="absolute inset-0 rounded-md bg-[#fff]"></div>
                    {/if}
                    <span
                      class="relative text-sm block font-semibold whitespace-nowrap {activeIdx ===
                      i
                        ? 'text-black'
                        : ''}"
                    >
                      {item.title}
                    </span>
                  </button>
                {/if}
              {/each}
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2">
            {#if financialData?.length > 0}
              <div
                class="flex flex-row items-center w-full justify-end sm:justify-center"
              >
                <label
                  class="inline-flex mt-2 sm:mt-0 cursor-pointer relative mr-auto"
                >
                  <input
                    on:click={toggleMode}
                    type="checkbox"
                    checked={$coolMode}
                    value={$coolMode}
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-gray-400 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1563F9]"
                  ></div>
                  {#if $coolMode}
                    <span class="ml-2 text-sm"> Table Mode </span>
                  {:else}
                    <span class="ml-2 text-sm"> Chart Mode </span>
                  {/if}
                </label>

                <div class="flex flex-row items-center w-fit sm:ml-auto">
                  <!--
                  <div class="ml-2 relative inline-block text-left">
                    <Button
                      class="shadow-sm w-full border-gray-300 dark:border-gray-600 border sm:hover:bg-gray-100 dark:sm:hover:bg-primary ease-out  flex flex-row justify-between items-center px-5 rounded-md truncate"
                    >
                      <svg
                        class="w-4 h-4 bp:w-5 bp:h-5 pointer-events-none"
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
                      >
                    </Button>
                  </div>

                  <div class="ml-2 relative inline-block text-left grow">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          class="shadow-sm w-full border-gray-300 dark:border-gray-600 border sm:hover:bg-gray-100 dark:sm:hover:bg-primary ease-out  flex flex-row justify-between items-center px-3 py-1.5  rounded-md truncate"
                        >
                          <span class="truncate">Raw</span>
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
                        class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                      >
                        <DropdownMenu.Group>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "5Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            Billions
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "10Y")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            Millions
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            on:click={() => ($timeFrame = "MAX")}
                            class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                          >
                            Raw
                          </DropdownMenu.Item>
                        </DropdownMenu.Group>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                  -->
                </div>
              </div>

              {#if $coolMode}
                <div class="grid gap-5 xs:gap-6 lg:grid-cols-3 lg:gap-3">
                  {#each fields as item, i}
                    <FinancialChart
                      data={financialData}
                      {statementConfig}
                      displayStatement={item?.key}
                      {filterRule}
                      {processedData}
                      color={["#ff00cc", "#37ff00", "#0c63e7", "#07c8f9"][
                        i % 4
                      ]}
                    />
                  {/each}
                </div>
              {:else}
                <div
                  class="flex flex-col sm:flex-row items-start sm:items-end sm:justify-between"
                >
                  <span
                    class="text-xs sm:text-sm order-1 sm:order-0 mt-5 sm:mt-0 text-gray-600 dark:text-gray-400 w-full"
                  >
                    Financials in {data?.getProfileData?.currency}. Fiscal year
                    is
                    {data?.getProfileData?.fiscalYearRange}.
                  </span>
                  <div class="flex flex-row items-center justify-end w-full">
                    <div class="sm:ml-auto relative inline-block">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild let:builder>
                          <Button
                            builders={[builder]}
                            class="shadow-sm w-full sm:w-fit border-gray-300 dark:border-gray-600 border sm:hover:bg-gray-100 dark:sm:hover:bg-primary ease-out  flex flex-row justify-between items-center px-3 py-1.5  rounded-md truncate"
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
                          class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                        >
                          <DropdownMenu.Label
                            class="text-muted dark:text-gray-400"
                          >
                            Select time frame
                          </DropdownMenu.Label>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Group>
                            <DropdownMenu.Item
                              on:click={() => ($timeFrame = "5Y")}
                              class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                            >
                              5 years
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              on:click={() => ($timeFrame = "10Y")}
                              class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                            >
                              10 years
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              on:click={() => ($timeFrame = "MAX")}
                              class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                            >
                              Max
                            </DropdownMenu.Item>
                          </DropdownMenu.Group>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </div>
                    <Button
                      on:click={() => exportFundamentalData("csv")}
                      class="shadow-sm ml-2 w-fit border-gray-300 dark:border-gray-600 border  sm:hover:bg-gray-100 dark:sm:hover:bg-primary ease-out flex flex-row justify-between items-center px-3 py-1.5  rounded-md truncate"
                    >
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
                    </Button>
                  </div>
                </div>
                <div
                  class="w-full rounded-none sm:rounded-md m-auto overflow-x-auto no-scrollbar"
                >
                  <table
                    class="table table-sm table-compact no-scrollbar rounded-none sm:rounded-md w-full border border-gray-300 dark:border-gray-800 m-auto"
                  >
                    <thead class="text-muted dark:text-white dark:bg-default">
                      <tr class="border min-w-[250px]">
                        <td class="text-start text-sm font-semibold pr-10"
                          >Fiscal Year</td
                        >
                        {#each financialData as item}
                          {#if filterRule === "annual"}
                            <td
                              class=" font-semibold text-sm text-end border-l border-gray-300 dark:border-gray-800"
                            >
                              {"FY" + " " + item?.fiscalYear}
                            </td>
                          {:else}
                            <td class=" font-semibold text-sm text-end">
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
              {/if}
            {/if}
          </div>
        </div>
      </main>
    </div>
  </div>
</section>
