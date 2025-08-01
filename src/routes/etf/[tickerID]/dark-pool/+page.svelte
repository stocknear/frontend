<script lang="ts">
  import { displayCompanyName, etfTicker } from "$lib/store";
  import HistoricalVolume from "$lib/components/DarkPool/HistoricalVolume.svelte";
  import PriceLevel from "$lib/components/DarkPool/PriceLevel.svelte";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import HottestTrades from "$lib/components/DarkPool/HottestTrades.svelte";
  import UpgradeToPro from "$lib/components/UpgradeToPro.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
  let historicalDarkPool = data?.getHistoricalDarkPool || [];
  let priceLevel = data?.getPriceLevel?.priceLevel || [];

  let hottestTrades = data?.getPriceLevel?.hottestTrades || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) Dark Pool Trading Insights & Data`}
  description={`Explore exclusive dark pool trading data for ${$displayCompanyName} (${$etfTicker}). Get insights into hidden market activity, stock price movements, institutional trades, financials, and key statistics.`}
/>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 pt-4 w-full m-auto mt-2 sm:mt-0">
        <div class="w-full">
          {#if priceLevel?.length === 0 && hottestTrades?.length === 0 && historicalDarkPool?.length === 0}
            <Infobox
              text={`No Dark Pool activity are detected for ${$displayCompanyName}`}
            />
          {:else if priceLevel?.length === 0 && hottestTrades?.length === 0}{:else}
            <div class="flex flex-row items-center mb-4 sm:mb-0">
              <label
                for="darkPoolInfo"
                class="mr-1 cursor-pointer flex flex-row items-center text-xl sm:text-2xl font-bold"
              >
                {$etfTicker?.toUpperCase()} Dark Pool Overview
              </label>
              <InfoModal
                title={"Dark Pool Data"}
                content={"Dark pool data refers to information on trading activities that occur in private, non-public financial exchanges known as dark pools. These venues are used by hedge funds and major institutional traders to buy and sell large blocks of securities without exposing their orders to the public, minimizing market impact and price fluctuations. Currently, nearly 50% of all trades are executed in these dark pools, highlighting their significant role in the trading landscape."}
                id={"darkPoolInfo"}
              />
            </div>
          {/if}
        </div>
        {#if priceLevel?.length > 0}
          <PriceLevel
            {data}
            rawData={priceLevel}
            metrics={data?.getPriceLevel?.metrics}
          />
        {/if}
        {#if hottestTrades?.length > 0}
          <HottestTrades
            {data}
            rawData={hottestTrades}
            ticker={$etfTicker?.toUpperCase()}
          />
        {/if}

        {#if historicalDarkPool?.length > 10}
          <HistoricalVolume {data} rawData={historicalDarkPool} />
        {/if}
        {#if data?.user?.tier === "Pro"}
          <UpgradeToPro {data} />
        {/if}
      </div>
    </div>
  </div>
</section>
