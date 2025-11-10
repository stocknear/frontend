<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import OpenInterestByExpiry from "$lib/components/Options/OpenInterestByExpiry.svelte";

  export let data;
  let rawData = data?.getData || [];
</script>

<SEO
  title="Open Interest by Expiry"
  description={`Analyze Gamma Exposure by expiry for ${$displayCompanyName} (${$indexTicker}). Access historical volume, open interest trends, and save options contracts for detailed analysis and insights.`}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if rawData?.length > 0}
        <OpenInterestByExpiry {data} ticker={$indexTicker} />
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
