<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import UnusualActivity from "$lib/components/Options/UnusualActivity.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) Unusual Options Activity`}
  description={`Spot unusual options activity, sweeps, and blocks in ${$displayCompanyName} (${$etfTicker}) for short-term setups.`}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <UnusualActivity {data} ticker={$etfTicker} assetType="etf" />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox
              text="No unusual options trading activity with a premium of at least $1 million was found."
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
