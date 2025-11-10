<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";

  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  import UnusualActivity from "$lib/components/Options/UnusualActivity.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Unusual Options Activity | Dark Pool & Smart Money Flow`}
  description={`Track unusual options activity for ${$displayCompanyName} (${$stockTicker}) with $1M+ premium trades. Identify smart money flows, institutional positioning, and high-conviction options trades with detailed analysis of unusual volume and open interest patterns.`}
  keywords={`${$stockTicker} unusual options activity, ${$displayCompanyName} smart money options, unusual options volume, institutional options flow, ${$stockTicker} dark pool options, smart money trades, unusual options alerts, big options trades`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/options/unusual-activity`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "DataFeed"],
    name: `${$displayCompanyName} Unusual Options Activity`,
    description: `Professional tracking of unusual options activity and smart money flows for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options/unusual-activity`,
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
      tickerSymbol: $stockTicker,
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
        <UnusualActivity
          {data}
          ticker={$stockTicker?.toUpperCase()}
          assetType={"stocks"}
        />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <Infobox
            text="No unusual options trading activity with a premium of at least $1 million was found."
          />
        </div>
      {/if}
    </div>
  </div>
</section>
