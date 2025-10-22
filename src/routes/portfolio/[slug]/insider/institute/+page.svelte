<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";

  import ShareHolders from "$lib/components/ShareHolders.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) 13F Institutional Ownership | Holdings & Changes Analysis`}
  description={`Comprehensive 13F institutional ownership analysis for ${$displayCompanyName} (${$stockTicker}). Track hedge fund holdings, institutional investor positions, ownership changes, and smart money movements with detailed quarterly filings analysis.`}
  keywords={`${$stockTicker} institutional ownership, ${$displayCompanyName} 13F filings, hedge fund holdings, institutional investors, ${$stockTicker} ownership changes, smart money tracking, institutional positions, 13F analysis`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/insider/institute`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} 13F Institutional Ownership`,
    description: `Professional 13F filing analysis and institutional ownership tracking for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/insider/institute`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "13F filing analysis",
      "Institutional ownership tracking",
      "Hedge fund holdings",
      "Position size changes",
      "Smart money analysis",
      "Quarterly filing updates",
      "Ownership concentration",
      "Institutional investor profiles",
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
      name: "13F Institutional Analysis",
      description:
        "Professional analysis of institutional ownership and 13F SEC filings",
    },
  }}
/>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-5 w-full m-auto mt-2 sm:mt-0">
        <div class="w-full">
          <h1 class="text-xl sm:text-2xl font-bold">13F Institute Ownership</h1>
        </div>

        <ShareHolders {data} />
      </div>
    </div>
  </div>
</section>
