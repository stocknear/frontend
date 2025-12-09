<script lang="ts">
  import { formatString, sectorNavigation, abbreviateNumber } from "$lib/utils";
  import Table from "$lib/components/Table/Table.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  let hedgeFundStats = data?.getHedgeFundsData;
  let companyName = data?.getHedgeFundsData?.name ?? "Company Data";

  const excludedRules = new Set([
    "sharesNumber",
    "changeInSharesNumberPercentage",
    "marketValue",
    "avgPricePaid",
    "weightPercentage",
    "putCallShare",
    "price",
    "changesPercentage",
  ]);

  const defaultList = [
    { name: "Price", rule: "price" },
    { name: "% Change", rule: "changesPercentage" },
    { name: "Shares", rule: "sharesNumber" },
    { name: "% Change Shares", rule: "changeInSharesNumberPercentage" },
    { name: "Market Value", rule: "marketValue" },
    { name: "Avg. Price Paid", rule: "avgPricePaid" },
    { name: "% Weight", rule: "weightPercentage" },
    { name: "Asset Type", rule: "putCallShare" },
  ];

  const specificRows = [
    { name: "Shares", rule: "sharesNumber", type: "int" },
    {
      name: "% Change Shares",
      rule: "changeInSharesNumberPercentage",
      type: "percentSign",
    },
    { name: "% Weight", rule: "weightPercentage", type: "percent" },
    { name: "Asset Type", rule: "putCallShare", type: "string" },
    { name: "Filing Date", rule: "filingDate", type: "date" },
    { name: "Avg. Price Paid", rule: "avgPricePaid", type: "float" },
    { name: "Market Value", rule: "marketValue", type: "int" },
  ];
</script>

<SEO
  title="{formatString(
    companyName,
  )} Holdings & Portfolio - 13F Filings Analysis"
  description="Detailed analysis of {formatString(
    companyName,
  )} hedge fund holdings, portfolio positions, and investment strategy. Track their latest 13F filings, top stock picks, sector allocation, and performance metrics."
  keywords="{formatString(companyName)?.toLowerCase()} holdings, {formatString(
    companyName,
  )?.toLowerCase()} portfolio, {formatString(
    companyName,
  )?.toLowerCase()} 13F filings, hedge fund positions, institutional investor holdings, {formatString(
    companyName,
  )?.toLowerCase()} stock picks, hedge fund analysis"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "{formatString(companyName)} Holdings & Portfolio Analysis",
    description:
      "Comprehensive analysis of {formatString(companyName)} hedge fund holdings and investment positions",
    url: "https://stocknear.com/hedge-funds/{data?.getHedgeFundsData?.cik}",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Hedge Funds",
          item: "https://stocknear.com/hedge-funds",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: formatString(companyName),
          item: "https://stocknear.com/hedge-funds/{data?.getHedgeFundsData?.cik}",
        },
      ],
    },
    mainEntity: {
      "@type": "Organization",
      name: formatString(companyName),
      identifier: data?.getHedgeFundsData?.cik,
      description: "Hedge fund and institutional investor portfolio analysis",
      hasCredential: {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "13F Filing",
      },
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pt-5 px-4 lg:px-3 pb-40"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li>
        <a href="/dashboard" class="text-muted dark:text-gray-300">Home</a>
      </li>
      <li>
        <a href="/hedge-funds" class="text-muted dark:text-gray-300"
          >Hedge Fund</a
        >
      </li>

      <li class="text-muted dark:text-gray-300">
        {formatString(companyName)}
      </li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="w-full m-auto mt-12">
            <div class="items-center justify-between lg:flex">
              <div
                class="flex space-x-3 border-b-[2px] pb-3 lg:border-none lg:pb-0"
              >
                <div class="flex space-x-3 pb-3 lg:border-none lg:pb-0">
                  <div class="shrink-0">
                    <svg
                      class="h-16 w-16 sm:h-20 sm:w-20 text-gray-500 dark:text-gray-200"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      style="max-width:100px"
                      ><path
                        fill-rule="evenodd"
                        d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                        clip-rule="evenodd"
                      ></path></svg
                    >
                  </div>
                </div>

                <div class="mt-0 pt-0.5 text-left">
                  <h1 class="mb-0 text-2xl font-bold">
                    {formatString(companyName)}
                  </h1>
                  <p
                    class="mb-0.5 text-sm font-semibold text-muted dark:text-gray-300"
                  >
                    CIK Number: {data?.getHedgeFundsData?.cik}
                  </p>
                </div>
              </div>
              <div
                class="mt-4 grid grid-cols-2 overflow-hidden rounded border border-gray-300 dark:border-gray-600 py-2 text-center md:grid-cols-5 md:p-0 lg:mt-0 lg:border-none"
              >
                <div class="flex flex-col px-4 py-2 bp:px-6 md:py-6">
                  <div class="text-2xl font-bold tracking-tight">
                    {abbreviateNumber(hedgeFundStats?.marketValue)}
                  </div>
                  <div
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Market Value
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l sm:border-gray-300 dark:sm:border-gray-600 md:py-6"
                >
                  <div class="text-2xl font-semibold tracking-tight">
                    {data?.getHedgeFundsData?.holdings?.length?.toLocaleString(
                      "en-US",
                    )}
                  </div>
                  <div
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    # of Holdings
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l sm:border-gray-300 dark:sm:border-gray-600 md:py-6"
                >
                  <div class="text-2xl font-bold tracking-tight">
                    {hedgeFundStats?.averageHoldingPeriod} months
                  </div>
                  <div
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Avg. Holding Period
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l sm:border-gray-300 dark:sm:border-gray-600 md:py-6"
                >
                  <div class="text-2xl font-bold tracking-tight">
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <span
                        class={hedgeFundStats?.winRate >= 0
                          ? "before:content-['+'] text-green-800 dark:text-[#36D984]"
                          : "text-red-800 dark:text-[#EF4444]"}
                        >{hedgeFundStats?.winRate?.toFixed(2)}%</span
                      >
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-muted dark:text-[#fff]"
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
                      </a>
                    {/if}
                  </div>
                  <div
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Win Rate
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l sm:border-gray-300 dark:sm:border-gray-600 md:py-6"
                >
                  <div class="text-2xl font-bold tracking-tight">
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <span
                        class={hedgeFundStats?.performancePercentage3Year >= 0
                          ? "before:content-['+'] text-green-800 dark:text-[#36D984]"
                          : "text-red-800 dark:text-[#EF4444]"}
                        >{hedgeFundStats?.performancePercentage3Year?.toFixed(
                          2,
                        )}%</span
                      >
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-muted dark:text-[#fff]"
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
                      </a>
                    {/if}
                  </div>
                  <div
                    class="text-sm font-semibold leading-6 text-muted dark:text-gray-300"
                  >
                    Peformance 3-Years
                  </div>
                </div>
              </div>
            </div>

            {#if data?.getHedgeFundsData?.mainSectors?.length > 0}
              <div class="mb-10 mt-10">
                <div
                  class="relative my-3 space-y-2 rounded border border-gray-300 dark:border-gray-600 sm:my-6 p-4"
                >
                  <div class="flex flex-col sm:flex-row">
                    <div class="mb-2 font-semibold sm:mb-0">Main Sectors:</div>
                    <div class="flex flex-wrap gap-x-2 gap-y-3 sm:ml-2">
                      {#each data?.getHedgeFundsData?.mainSectors as item}
                        <a
                          href={sectorNavigation?.find(
                            (listItem) => listItem?.title === item,
                          )?.link}
                          class="inline-block badge border-gray-300 dark:border-gray-800 rounded-[3px] bg-blue-100 dark:bg-primary duration-0 rounded-sm ml-1 px-3 m-auto text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted text-[1rem]"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                  <div class="flex flex-col sm:flex-row">
                    <div class="mb-2 whitespace-nowrap font-semibold sm:mb-0">
                      Top Industries:
                    </div>

                    <div class="flex flex-wrap gap-x-2 gap-y-3 sm:ml-2">
                      {#each data?.getHedgeFundsData?.mainIndustries as item}
                        <a
                          href={`/list/industry/${item?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
                          class="inline-block badge border-gray-300 dark:border-gray-800 rounded-[3px] bg-blue-100 dark:bg-primary duration-0 rounded-sm ml-1 px-3 m-auto text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted text-[1rem]"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>

              <div class="w-full m-auto mt-4">
                <Table
                  {data}
                  rawData={data?.getHedgeFundsData?.holdings}
                  {excludedRules}
                  {defaultList}
                  {specificRows}
                  title={`Filing Date: ${new Date(
                    data?.getHedgeFundsData?.filingDate,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`}
                />
              </div>
            {:else}
              <Infobox
                text={`The data of the hedge fund is currently not available.`}
              />
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
