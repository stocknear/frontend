<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";

  import ShareHolders from "$lib/components/ShareHolders.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import {
  stock_detail_institute_seo_description,
  stock_detail_institute_seo_keywords,
  stock_detail_institute_seo_title,
  stock_detail_institute_structured_desc,
  stock_detail_institute_structured_name,
  stock_detail_institute_title,
} from "$lib/paraglide/messages";

  export let data;
</script>

<SEO
  title={stock_detail_institute_seo_title({ company: $displayCompanyName, ticker: $stockTicker })}
  description={stock_detail_institute_seo_description({ company: $displayCompanyName, ticker: $stockTicker })}
  keywords={stock_detail_institute_seo_keywords({ ticker: $stockTicker, company: $displayCompanyName })}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/insider/institute`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: stock_detail_institute_structured_name({ company: $displayCompanyName }),
    description: stock_detail_institute_structured_desc({ company: $displayCompanyName, ticker: $stockTicker }),
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
          <h1
            class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
          >
            {stock_detail_institute_title()}
          </h1>
        </div>

        <ShareHolders {data} />
      </div>
    </div>
  </div>
</section>
