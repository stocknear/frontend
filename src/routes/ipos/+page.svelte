<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import Table from "$lib/components/Table/Table.svelte";
  import { formatDate } from "$lib/utils";
  import * as m from "$lib/paraglide/messages";
  export let data;

  let marketNews = data?.getNews;
  let rawData = data?.getIPOCalendar?.slice(0, 200) ?? [];
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
</script>

<SEO
  title={m.ipos_seo_title()}
  description={m.ipos_seo_description()}
  keywords={m.ipos_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "IPO Calendar",
    description:
      "Comprehensive tracking of recent and upcoming Initial Public Offerings",
    url: "https://stocknear.com/ipos",
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
          name: "IPOs",
          item: "https://stocknear.com/ipos",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "IPO List",
      description: "List of recent and upcoming Initial Public Offerings",
      numberOfItems: rawData?.length || 0,
    },
  }}
/>

<div class="w-full overflow-hidden m-auto">
  <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
    <div
      class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
    >
      <main class="w-full">
        <div class="w-full overflow-x-auto">
          <Table
            title={m.ipos_count({ count: rawData?.length?.toLocaleString("en-US") })}
            {data}
            {rawData}
            {excludedRules}
            {defaultList}
            {specificRows}
          />
        </div>
      </main>
    </div>
  </div>
</div>
