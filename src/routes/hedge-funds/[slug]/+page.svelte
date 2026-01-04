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
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <div class="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-500">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition"
          >Home</a
        >
      </li>
      <li>
        <a
          href="/hedge-funds"
          class="text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition"
          >Hedge Fund</a
        >
      </li>

      <li class="text-gray-500 dark:text-zinc-500">
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
                class="flex space-x-3 border-b border-gray-200 dark:border-zinc-800/80 pb-3 lg:border-none lg:pb-0"
              >
                <div class="flex space-x-3 pb-3 lg:border-none lg:pb-0">
                  <div class="shrink-0">
                    <svg
                      class="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 dark:text-zinc-500"
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
                  <h1
                    class="mb-0 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
                  >
                    {formatString(companyName)}
                  </h1>
                  <p class="mb-0.5 text-sm text-gray-600 dark:text-zinc-400">
                    CIK Number: {data?.getHedgeFundsData?.cik}
                  </p>
                </div>
              </div>
              <div
                class="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40 py-2 text-center md:grid-cols-5 md:p-0 lg:mt-0"
              >
                <div class="flex flex-col px-4 py-2 bp:px-6 md:py-6">
                  <div
                    class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {abbreviateNumber(hedgeFundStats?.marketValue)}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
                  >
                    Market Value
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {data?.getHedgeFundsData?.holdings?.length?.toLocaleString(
                      "en-US",
                    )}
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
                  >
                    # of Holdings
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {hedgeFundStats?.averageHoldingPeriod} months
                  </div>
                  <div
                    class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
                  >
                    Avg. Holding Period
                  </div>
                </div>

                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <span
                        class={hedgeFundStats?.winRate >= 0
                          ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"}
                        >{hedgeFundStats?.winRate?.toFixed(2)}%</span
                      >
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-white"
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
                    class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
                  >
                    Win Rate
                  </div>
                </div>
                <div
                  class="flex flex-col px-4 py-2 bp:px-6 sm:border-l border-gray-200 dark:sm:border-zinc-800/80 md:py-6"
                >
                  <div
                    class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums"
                  >
                    {#if ["Plus", "Pro"]?.includes(data?.user?.tier)}
                      <span
                        class={hedgeFundStats?.performancePercentage3Year >= 0
                          ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"}
                        >{hedgeFundStats?.performancePercentage3Year?.toFixed(
                          2,
                        )}%</span
                      >
                    {:else}
                      <a href="/pricing" class="flex justify-center mb-2">
                        <svg
                          class="size-6 text-white"
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
                    class="text-xs uppercase tracking-wide text-gray-400 dark:text-zinc-500"
                  >
                    Peformance 3-Years
                  </div>
                </div>
              </div>
            </div>

            {#if data?.getHedgeFundsData?.mainSectors?.length > 0}
              <div class="mb-10 mt-10">
                <div
                  class="relative my-3 space-y-2 rounded-xl border border-gray-300 shadow dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/40 sm:my-6 p-4"
                >
                  <div class="flex flex-col sm:flex-row sm:items-center">
                    <div
                      class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-300 sm:mb-0 sm:mr-2 text-center sm:text-left"
                    >
                      Main Sectors:
                    </div>
                    <div
                      class="flex flex-wrap items-center gap-x-2 gap-y-3 justify-center sm:justify-start"
                    >
                      {#each data?.getHedgeFundsData?.mainSectors as item}
                        <a
                          href={sectorNavigation?.find(
                            (listItem) => listItem?.title === item,
                          )?.link}
                          class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                        >
                          {item}
                        </a>
                      {/each}
                    </div>
                  </div>
                  <div class="flex flex-col sm:flex-row sm:items-center">
                    <div
                      class="mb-2 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-300 sm:mb-0 sm:mr-2 text-center sm:text-left"
                    >
                      Top Industries:
                    </div>

                    <div
                      class="flex flex-wrap items-center gap-x-2 gap-y-3 justify-center sm:justify-start"
                    >
                      {#each data?.getHedgeFundsData?.mainIndustries as item}
                        <a
                          href={`/list/industry/${item?.replace(/ /g, "-")?.replace(/&/g, "and")?.replace(/-{2,}/g, "-")?.toLowerCase()}`}
                          class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
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
