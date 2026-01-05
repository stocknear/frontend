<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";
  import Infobox from "$lib/components/Infobox.svelte";
  import GreekExposure from "$lib/components/Options/GreekExposure.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Delta Exposure (DEX)`}
  description={`Track delta exposure for ${$displayCompanyName} (${$indexTicker}) to gauge dealer hedging pressure and trend risk.`}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <GreekExposure {data} title={`${$displayCompanyName} (${$indexTicker}) Delta Exposure (DEX)`} ticker={$indexTicker} />
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
