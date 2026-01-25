<script lang="ts">
  import Table from "$lib/components/Table/Table.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;

  let rawData = data?.getStockList;

  const defaultList = [
    { name: "Industry", rule: "industry" },
    { name: "Market Cap", rule: "marketCap" },
    { name: "Revenue", rule: "revenue" },
  ];

  const excludedRules = new Set(["industry", "revenue", "marketCap"]);
</script>

<SEO
  title={m.stocks_seo_title()}
  description={m.stocks_seo_description()}
  keywords={m.stocks_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Complete US Stock Market Directory",
    description:
      "Comprehensive database of all US stock ticker symbols with advanced analysis tools and real-time market data",
    url: "https://stocknear.com/stocks",
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
          name: "Stock Market Directory",
          item: "https://stocknear.com/stocks",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "US Stock Market Ticker Directory",
      description:
        "Complete database of US stock ticker symbols with financial analysis and market data",
      numberOfItems: rawData?.length || 0,
      itemListElement:
        rawData?.slice(0, 10)?.map((stock, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: stock.symbol,
          description: `${stock.name} (${stock.symbol}) - Market Cap: ${stock.marketCap ? "$" + (stock.marketCap / 1e9).toFixed(1) + "B" : "N/A"}`,
          url: `https://stocknear.com/stocks/${stock.symbol}`,
        })) || [],
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      description: "Advanced stock market analysis platform",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >{m.stocks_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-800 dark:text-zinc-300">{m.stocks_breadcrumb_current()}</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-2 border-b-[2px]">
            <h1 class="mb-1 e text-2xl sm:text-3xl font-bold">
              {m.stocks_title()}
            </h1>
            <p
              class="mb-3 px-1 text-sm text-gray-800 dark:text-zinc-300 sm:px-0"
            >
              {m.stocks_description({ count: rawData?.length })}
            </p>
          </div>

          <div class="w-full">
            <!--Start Top Winners/Losers-->
            <Table
              {data}
              {rawData}
              {defaultList}
              {excludedRules}
              title={rawData?.length?.toLocaleString("en-US") + " " + m.stocks_table_title()}
            />
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
