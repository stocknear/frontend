<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import HottestContracts from "$lib/components/Options/HottestContracts.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) | Explore the Hottest Options Contracts`}
  description={`Analyze historical volume, open interest, and trends in option chains for ${$displayCompanyName} (${$indexTicker}). Discover actionable insights for trading decisions.`}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.openInterest?.length > 0}
        <HottestContracts
          {data}
          ticker={$indexTicker?.toUpperCase()}
          type="oi"
          title="Highest Open Interest Options"
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No data is available" />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
