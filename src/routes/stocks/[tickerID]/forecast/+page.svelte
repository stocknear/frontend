<script lang="ts">
  import { numberOfUnreadNotification, displayCompanyName, stockTicker, analystEstimateComponent } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import Lazy from "$lib/components/Lazy.svelte";

  export let data;

function findIndex(data) {
    const currentYear = new Date().getFullYear();
    return data.findIndex(item => item.date >= currentYear && item.revenue === null);
}
const index = findIndex(data?.getAnalystEstimate);
const changeRevenue = abbreviateNumber(((data?.getAnalystEstimate[index-1]?.estimatedRevenueAvg/data?.getAnalystEstimate[index-2]?.revenue-1)*100))?.toFixed(1)
const changeNetIncome = abbreviateNumber(((data?.getAnalystEstimate[index-1]?.estimatedNetIncomeAvg/data?.getAnalystEstimate[index-2]?.netIncome-1)*100))?.toFixed(1)
const changeEBITDA = abbreviateNumber(((data?.getAnalystEstimate[index-1]?.estimatedEbitdaAvg/data?.getAnalystEstimate[index-2]?.ebitda-1)*100)?.toFixed(1))
const changeEPS = abbreviateNumber(((data?.getAnalystEstimate[index-1]?.estimatedEpsAvg/data?.getAnalystEstimate[index-2]?.eps-1)*100))?.toFixed(1)

</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ""}
    {$displayCompanyName} ({$stockTicker}) Forecast Overview · stocknear
  </title>
  <meta name="description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />

  <!-- Other meta tags -->
  <meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Forecast Overview · stocknear`} />
  <meta property="og:description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />
  <meta property="og:type" content="website" />
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Forecast Overview · stocknear`} />
  <meta name="twitter:description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>

<section class="bg-[#09090B] overflow-hidden text-white h-full mb-40 sm:mb-0 w-full">
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div class="relative flex justify-center items-center overflow-hidden w-full">
      <div class="sm:p-7 w-full m-auto mt-2 sm:mt-0">

        <h2 class="mt-5 text-xl sm:text-2xl text-gray-200 font-bold mb-4">
            Financial Forecast this Year
        </h2>
        
        <div class="mb-4 grid grid-cols-2 grid-rows-1 divide-gray-500 rounded-lg border border-gray-600 bg-[#272727] shadow md:grid-cols-4 md:grid-rows-1 md:divide-x">
                  <div class="p-4 bp:p-5 sm:p-6">
                    <label class="mr-1 cursor-pointer flex flex-row items-center text-white text-[1rem]  font-semibold">
                      Revenue 
                    </label>   
                      <div class="mt-1 flex flex-col items-baseline justify-start space-y-2 bp:space-y-0">
                        <div class="flex items-baseline text-2xl font-semibold text-white">
                          {abbreviateNumber(data?.getAnalystEstimate[index-1]?.estimatedRevenueAvg,true)}
                        </div>
                        <div class="inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 bg-green-100 text-green-800 dark:bg-green-700 dark:text-dark-100">
                          <svg class="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center {changeRevenue > 0 ? 'text-green-500' : 'text-red-500 rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="max-width:40px" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>
                          {changeRevenue}%
                        </div>
                      </div>
                    <div class="ml-0.5 mt-1.5 text-sm font-semibold text-white/60 lg:block">
                      from {abbreviateNumber(data?.getAnalystEstimate[index-2]?.revenue)}
                    </div>
                  </div>
                  <div class="p-4 bp:p-5 sm:p-6 border-l border-contrast md:border-0">
                    <label class="mr-1 cursor-pointer flex flex-row items-center text-white text-[1rem]  font-semibold">
                      Net Income 
                    </label>   
                      <div class="mt-1 flex flex-col items-baseline justify-start space-y-2 bp:space-y-0">
                        <div class="flex items-baseline text-2xl font-semibold text-white">
                          {abbreviateNumber(data?.getAnalystEstimate[index-1]?.estimatedNetIncomeAvg,true)}
                        </div>
                        <div class="inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 bg-green-100 text-green-800 dark:bg-green-700 dark:text-dark-100">
                          <svg class="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center {changeNetIncome > 0 ? 'text-green-500' : 'text-red-500 rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="max-width:40px" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>
                          {changeNetIncome}%
                        </div>
                      </div>
                    <div class="ml-0.5 mt-1.5 text-sm font-semibold text-white/60 lg:block">
                      from {abbreviateNumber(data?.getAnalystEstimate[index-2]?.netIncome,true)}
                    </div>
                  </div>
                  <div class="p-4 bp:p-5 sm:p-6 border-t border-contrast md:border-0">
                    <label class="mr-1 cursor-pointer flex flex-row items-center text-white text-[1rem]  font-semibold">
                      EBITDA 
                    </label>   
                      <div class="mt-1 flex flex-col items-baseline justify-start space-y-2 bp:space-y-0">
                        <div class="flex items-baseline text-2xl font-semibold text-white">
                          {abbreviateNumber(data?.getAnalystEstimate[index-1]?.estimatedEbitdaAvg,true)}
                        </div>
                        <div class="inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 bg-green-100 text-green-800 dark:bg-green-700 dark:text-dark-100">
                          <svg class="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center {changeEBITDA > 0 ? 'text-green-500' : 'text-red-500 rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="max-width:40px" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>
                          {changeEBITDA}%
                        </div>
                      </div>
                    <div class="ml-0.5 mt-1.5 text-sm font-semibold text-white/60 lg:block">
                      from {abbreviateNumber(data?.getAnalystEstimate[index-2]?.ebitda,true)}
                    </div>
                  </div>
                  <div class="p-4 bp:p-5 sm:p-6 border-t border-contrast md:border-0 border-l border-contrast md:border-0">
                    <label class="mr-1 cursor-pointer flex flex-row items-center text-white text-[1rem]  font-semibold">
                      EPS 
                    </label>   
                      <div class="mt-1 flex flex-col items-baseline justify-start space-y-2 bp:space-y-0">
                        <div class="flex items-baseline text-2xl font-semibold text-white">
                          {data?.getAnalystEstimate[index-1]?.estimatedEpsAvg}
                        </div>
                        <div class="inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-semibold md:mt-2 lg:mt-0 bg-green-100 text-green-800 dark:bg-green-700 dark:text-dark-100">
                          <svg class="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center {changeEPS > 0 ? 'text-green-500' : 'text-red-500 rotate-180'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="max-width:40px" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path></svg>
                          {changeEPS}%
                        </div>
                      </div>
                    <div class="ml-0.5 mt-1.5 text-sm font-semibold text-white/60 lg:block">
                      from {data?.getAnalystEstimate[index-2]?.eps}
                    </div>
                  </div>
                </div>



        <Lazy>
          <div class="w-full m-auto sm:pb-6 sm:pt-6 {!$analystEstimateComponent ? 'hidden' : ''}">
            {#await import("$lib/components/AnalystEstimate.svelte") then { default: Comp }}
              <svelte:component this={Comp} {data} />
            {/await}
          </div>
        </Lazy>
      </div>
    </div>
  </div>
</section>
