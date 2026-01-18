<script lang="ts">
  import { page } from "$app/stores";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Table from "$lib/components/Table/Table.svelte";
  import { formatDate } from "$lib/utils";

  export let data;

  let rawData = data?.getIPOCalendar?.filter(
    (item) => new Date(item?.ipoDate).getFullYear() >= data?.getYear,
  );

  let year = data?.getYear;
  let marketNews = data?.getNews;

  const excludedRules = new Set([
    "volume",
    "price",
    "ipoPrice",
    "return",
    "eps",
    "ipoDate",
    "marketCap",
  ]);

  const defaultList = [
    { name: "IPO Date", rule: "ipoDate" },
    { name: "IPO Price", rule: "ipoPrice" },
    { name: "Current Price", rule: "currentPrice" },
    { name: "Return Since", rule: "return" },
  ];

  const specificRows = [
    { name: "Return Since", rule: "return", type: "percentSign" },
    { name: "IPO Date", rule: "ipoDate", type: "date" },
    { name: "IPO Price", rule: "ipoPrice", type: "float" },
    { name: "Current Price", rule: "currentPrice", type: "float" },
  ];

  $: {
    if ($page?.url?.pathname) {
      rawData = data?.getIPOCalendar?.filter(
        (item) => new Date(item?.ipoDate).getFullYear() == data?.getYear,
      );
      year = data?.getYear;
    }
  }
</script>

<SEO
  title="{data?.getYear} IPOs List - Complete Initial Public Offering Directory"
  description="Comprehensive list of all {data?.getYear} initial public offerings (IPOs) on the US stock market. Track IPO performance, pricing, returns since listing, and market debuts with detailed company information and historical data."
  keywords="{data?.getYear} IPOs, initial public offerings {data?.getYear}, IPO list {data?.getYear}, {data?.getYear} IPO performance, recent IPOs, IPO calendar {data?.getYear}, new public companies {data?.getYear}"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "{data?.getYear} IPOs Directory",
    description: "Complete list of initial public offerings in {data?.getYear}",
    url: "https://stocknear.com/ipos/{data?.getYear}",
    about: {
      "@type": "Thing",
      name: "Initial Public Offerings {data?.getYear}",
    },
    mainEntity: {
      "@type": "ItemList",
      name: "{data?.getYear} IPO List",
      description: "List of companies that went public in {data?.getYear}",
      numberOfItems: rawData?.length || 0,
    },
    temporalCoverage: "{data?.getYear}",
    spatialCoverage: "United States",
  }}
/>

{#key $page?.url?.pathname}
  <div class="w-full overflow-hidden m-auto">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          {#if rawData?.length !== 0}
            <div class="w-full overflow-x-auto">
              <Table
                {data}
                {rawData}
                {excludedRules}
                {defaultList}
                {specificRows}
                title={rawData?.length?.toLocaleString("en-US") + " Stocks"}
              />
            </div>
          {:else}
            <div class="w-full">
              <Infobox
                text={`No IPOs found. Please adjust your search timeframe for the latest ${year}
          IPOs.`}
              />
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
{/key}
