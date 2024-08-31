<script lang="ts">
  import { numberOfUnreadNotification, displayCompanyName, stockTicker, analystInsightComponent, sentimentComponent, trendAnalysisComponent, priceAnalysisComponent, fundamentalAnalysisComponent } from "$lib/store";
  import Lazy from "$lib/components/Lazy.svelte";

  export let data;
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>
    {$numberOfUnreadNotification > 0 ? `(${$numberOfUnreadNotification})` : ""}
    {$displayCompanyName} ({$stockTicker}) Forecast AI · stocknear
  </title>
  <meta name="description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />

  <!-- Other meta tags -->
  <meta property="og:title" content={`${$displayCompanyName} (${$stockTicker}) Forecast AI · stocknear`} />
  <meta property="og:description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />
  <meta property="og:type" content="website" />
  <!-- Add more Open Graph meta tags as needed -->

  <!-- Twitter specific meta tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={`${$displayCompanyName} (${$stockTicker}) Forecast AI · stocknear`} />
  <meta name="twitter:description" content={`A list of analyst ratings for Advanced Micro Devices (AMD) stock. See upgrades, downgrades, price targets and more from top Wall Street stock analysts.`} />
  <!-- Add more Twitter meta tags as needed -->
</svelte:head>

<section class="bg-[#09090B] overflow-hidden text-white h-full mb-40 sm:mb-0 w-full">
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div class="relative flex justify-center items-center overflow-hidden w-full">
      <div class="sm:p-7 w-full m-auto mt-2 sm:mt-0">
        <Lazy>
          <div class="w-full mt-10 sm:mt-0 m-auto sm:pt-6 {!$analystInsightComponent ? 'hidden' : ''}">
            {#await import("$lib/components/AnalystInsight.svelte") then { default: Comp }}
              <svelte:component this={Comp} {data} />
            {/await}
          </div>
        </Lazy>

        <Lazy>
          <div class="w-full mt-10 sm:mt-5 m-auto sm:pb-6 sm:pt-6 {!$priceAnalysisComponent ? 'hidden' : ''}">
            {#await import("$lib/components/PriceAnalysis.svelte") then { default: Comp }}
              <svelte:component this={Comp} {data} />
            {/await}
          </div>
        </Lazy>

        <Lazy>
          <div class="w-full mt-10 sm:mt-5 m-auto sm:pb-6 sm:pt-6 {!$trendAnalysisComponent ? 'hidden' : ''}">
            {#await import("$lib/components/TrendAnalysis.svelte") then { default: Comp }}
              <svelte:component this={Comp} {data} />
            {/await}
          </div>
        </Lazy>

        <Lazy>
          <div class="w-full mt-10 sm:mt-5 m-auto sm:pb-6 sm:pt-6 {!$fundamentalAnalysisComponent ? 'hidden' : ''}">
            {#await import("$lib/components/FundamentalAnalysis.svelte") then { default: Comp }}
              <svelte:component this={Comp} {data} />
            {/await}
          </div>
        </Lazy>

        <Lazy>
          <div class="w-full mt-10 sm:mt-5 m-auto sm:pb-6 sm:pt-6 {!$sentimentComponent ? 'hidden' : ''}">
            {#await import("$lib/components/SentimentAnalysis.svelte") then { default: Comp }}
              <svelte:component this={Comp} {data} />
            {/await}
          </div>
        </Lazy>
      </div>
    </div>
  </div>
</section>
