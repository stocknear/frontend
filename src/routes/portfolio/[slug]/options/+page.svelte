<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import OptionsChainStatistics from "$lib/components/Options/OptionsChainStatistics.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Options Analysis - Options Chain, Volume & Implied Volatility`}
  description={`Comprehensive ${$displayCompanyName} (${$stockTicker}) options analysis with real-time options chain data, volume analysis, open interest, max pain levels, and implied volatility trends. Track ${$stockTicker} options flow, unusual activity, and institutional sentiment with professional-grade options trading tools and analytics.`}
  keywords={`${$stockTicker} options, ${$displayCompanyName} options chain, ${$stockTicker} options volume, implied volatility, options analysis, max pain, open interest, options flow, ${$stockTicker} calls, ${$stockTicker} puts, options trading, gamma exposure, unusual options activity`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "WebPage", "AnalysisNewsArticle"],
    name: `${$displayCompanyName} (${$stockTicker}) Options Analysis`,
    headline: `${$displayCompanyName} Options Trading Analysis - Comprehensive Options Chain Data`,
    description: `Professional options analysis for ${$displayCompanyName} (${$stockTicker}) including options chain, volume, implied volatility, and institutional options flow`,
    url: `https://stocknear.com/stocks/${$stockTicker}/options`,

    author: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
      logo: {
        "@type": "ImageObject",
        url: "https://stocknear.com/favicon.png",
      },
    },
    dateModified: new Date().toISOString(),
    datePublished: new Date().toISOString(),
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
    about: {
      "@type": "Thing",
      name: "Options Analysis",
      description:
        "Comprehensive analysis of options trading data, implied volatility, and derivatives market activity",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Stocks",
          item: "https://stocknear.com/stocks",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${$displayCompanyName} (${$stockTicker})`,
          item: `https://stocknear.com/stocks/${$stockTicker}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Options Analysis",
          item: `https://stocknear.com/stocks/${$stockTicker}/options`,
        },
      ],
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      {#if Object?.keys(data?.getOptionsChainStatistics)?.length > 0}
        <OptionsChainStatistics {data} ticker={$stockTicker?.toUpperCase()} />
      {:else}
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto">
          <div class="">
            <Infobox text="No Options Data available for the company." />
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<!--Start Options Detail Desktop Modal-->
