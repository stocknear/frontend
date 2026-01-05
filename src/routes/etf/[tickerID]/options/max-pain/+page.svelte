<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import MaxPain from "$lib/components/Options/MaxPain.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) Max Pain & Pin Levels`}
  description={`Find max pain levels and potential pin zones for ${$displayCompanyName} (${$etfTicker}) options into expiration.`}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <MaxPain {data} ticker={$etfTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No Max Pain data available for the company." />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>
