<script lang="ts">
  import { indexTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import UnusualActivity from "$lib/components/Options/UnusualActivity.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$indexTicker}) Unusual Options Activity`}
  description={`Spot unusual options activity, sweeps, and blocks in ${$displayCompanyName} (${$indexTicker}) for short-term setups.`}
  keywords={`${$indexTicker} unusual options activity, sweeps, block trades, options flow`}
  type="website"
  url={`https://stocknear.com/index/${$indexTicker}/options/unusual-activity`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataFeed"],
    name: `${$displayCompanyName} Unusual Options Activity`,
    description: `Unusual options activity for ${$displayCompanyName} (${$indexTicker})`,
    url: `https://stocknear.com/index/${$indexTicker}/options/unusual-activity`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Unusual options activity detection",
      "$1M+ premium trade alerts",
      "Smart money flow analysis",
      "Institutional options tracking",
      "Unusual volume identification",
      "High-conviction trade detection",
      "Dark pool options activity",
      "Professional flow analysis",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $indexTicker,
    },
    about: {
      "@type": "Thing",
      name: "Unusual Options Activity",
      description:
        "Professional detection and analysis of unusual options trading activity and institutional flows",
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen pb-40">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if data?.getData?.length > 0}
        <UnusualActivity {data} ticker={$indexTicker} assetType="index" />
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
