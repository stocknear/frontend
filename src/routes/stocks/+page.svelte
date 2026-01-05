<script lang="ts">
  import ArrowLogo from "lucide-svelte/icons/move-up-right";
  import Table from "$lib/components/Table/Table.svelte";
  import SEO from "$lib/components/SEO.svelte";

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
  title="Complete Stock Market Directory - All US Stock Tickers with Real-Time Analysis"
  description="Comprehensive directory of {rawData?.length ||
    5000}+ US stock ticker symbols with real-time quotes, financial analysis, and investment research tools. Search NYSE, NASDAQ, and all major exchanges including blue-chip stocks, growth stocks, and dividend stocks for complete market coverage."
  keywords="stock tickers list, US stock symbols directory, NYSE stocks, NASDAQ stocks, stock market database, real-time stock quotes, financial analysis tools, stock screener, investment research, market capitalization data, stock fundamentals, equity analysis, trading symbols"
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
  <div class="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300">
    <ul>
      <li>
        <a
          href="/"
          class="text-gray-800 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
          >Home</a
        >
      </li>
      <li class="text-gray-800 dark:text-zinc-300">All Stocks</li>
    </ul>
  </div>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-2 border-b-[2px]">
            <h1 class="mb-1 e text-2xl sm:text-3xl font-bold">
              All Stock Symbols
            </h1>
            <p
              class="mb-3 px-1 text-sm text-gray-600 dark:text-zinc-400 sm:px-0"
            >
              List of all {rawData?.length} stock symbols we support
            </p>
          </div>

          <div class="w-full">
            <!--Start Top Winners/Losers-->
            <Table
              {data}
              {rawData}
              {defaultList}
              {excludedRules}
              title={rawData?.length?.toLocaleString("en-US") + " Stocks"}
            />
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
