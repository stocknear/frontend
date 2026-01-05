<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import OpenInterestByExpiry from "$lib/components/Options/OpenInterestByExpiry.svelte";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) Open Interest by Expiry | Positioning`}
  description={`See open interest by expiry for ${$displayCompanyName} (${$etfTicker}) to gauge near-term positioning and roll risk.`}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if rawData?.length > 0}
        <OpenInterestByExpiry {data} ticker={$etfTicker?.toUpperCase()} />
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
