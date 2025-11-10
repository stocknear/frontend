<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
</script>

<SEO
  title="Stock Lists & Screeners - Stock Rankings by Market Cap, Dividend & More "
  description="Comprehensive stock lists and screeners organized by market cap, dividends, sectors, exchanges, and special categories. Find FAANG, Magnificent Seven, dividend aristocrats, penny stocks and more. Free stock screening and filtering tool."
  keywords="stock lists, stock screener, stock rankings, market cap stocks, dividend stocks, FAANG stocks, magnificent seven, penny stocks, dividend aristocrats, sector stocks, S&P 500 list, NASDAQ 100"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Stock Lists and Screeners",
    description:
      "Comprehensive collection of stock lists organized by various criteria",
    url: "https://stocknear.com/list",
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
          name: "Stock Lists",
          item: "https://stocknear.com/list",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Stock List Categories",
      description:
        "Various stock list categories including market cap, dividends, sectors, and special lists",
      numberOfItems: 50,
    },
  }}
/>

<!--Start Market Cap Group-->

<section class="w-full overflow-hidden m-auto">
  <div class="mt-5">
    <h2 class="mb-2 text-xl font-bold">Popular Lists</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/highest-revenue">U.S. Companies With The Most Revenue</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/highest-income-tax"
          >U.S. Companies That Pay The Highest Taxes</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/most-employees">U.S. Companies With The Most Employees</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/most-ftd-shares"
          >U.S. Companies With The Most Fail-to-Deliver Shares</a
        >
      </li>
    </ul>
  </div>

  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">Market Cap Groups</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/market-cap/mega-cap-stocks">Mega-Cap Stocks</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/market-cap/large-cap-stocks">Large-Cap Stocks</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/market-cap/mid-cap-stocks">Mid-Cap Stocks</a
        >
      </li>
      <li class="">
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/market-cap/small-cap-stocks">Small-Cap Stocks</a
        >
      </li>
      <li class="">
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/market-cap/micro-cap-stocks">Micro-Cap Stocks</a
        >
      </li>
      <li class="">
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/market-cap/nano-cap-stocks">Nano-Cap Stocks</a
        >
      </li>
    </ul>
  </div>

  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">Dividends Lists</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/top-rated-dividend-stocks">Top-Rated Dividend Stocks</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/monthly-dividend-stocks"
          >Stocks That Pay Monthly Dividends</a
        >
      </li>

      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/dividend/dividend-kings">Dividend Kings</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/dividend/dividend-aristocrats">Dividend Aristocrats</a
        >
      </li>
    </ul>
  </div>
  <!--End Market Cap Group-->

  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">Exchange Groups</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/exchange/nasdaq">Listed on NASDAQ</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/exchange/nyse">Listed on NYSE</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/exchange/amex">Listed on AMEX</a
        >
      </li>
    </ul>
  </div>

  <!--Start Index Group-->

  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">Index Groups</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/index/dowjones">Listed on Dow Jones</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/index/nasdaq100">Listed on NASDAQ 100</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/index/sp500">Listed on S&P 500</a
        >
      </li>
    </ul>
  </div>

  <!--End Index Group-->

  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">Options Lists</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/highest-open-interest">Companies with Highest OI</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/highest-open-interest-change"
          >Companies with Highest OI Change</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/highest-option-iv-rank">Companies with Highest IV Rank</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/highest-option-premium">Companies with Highest Premium</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/highest-call-volume">Companies with Highest Call Volume</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/highest-put-volume">Companies with Highest Put Volume</a
        >
      </li>
    </ul>
  </div>

  <!--Start Other Lists-->
  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">Other Lists</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/faang">FAANG</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/magnificent-seven">Magnificent Seven</a
        >
      </li>

      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/penny-stocks">Penny Stocks</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/most-shorted-stocks">Most Shorted Stocks</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/oversold-stocks/">Oversold Stocks</a
        >
      </li>

      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/overbought-stocks/">Overbought Stocks</a
        >
      </li>

      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/most-buybacks/">Biggest Buybacks</a
        >
      </li>

      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/reit-stocks">All REITs</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/spacs-stocks">All SPACs</a
        >
      </li>
    </ul>
  </div>

  <!--Start ETF Lists-->

  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">ETF Lists</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/etf/new-launches">New Launches</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/etf/etf-providers">ETF Providers</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/bitcoin-etfs">Bitcoin ETFs</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/ethereum-etfs">Ethereum ETFs</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/crypto-etfs">Crypto ETFs</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/covered-call-etfs">Covered Call ETFs</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/monthly-dividend-etfs">Monthly Dividend ETFs</a
        >
      </li>
    </ul>
  </div>

  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">
      Category of Stocks Ranked by Market Cap
    </h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/mobile-games/">Mobile Games</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/social-media-stocks/">Social Media</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/clean-energy/">Clean Energy</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/esports/">E-Sports</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/car-company-stocks/">Car Companies</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/ai-stocks/">Artificial Intelligence</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/electric-vehicles/">Electric Vehicles</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/online-gambling/">Online Gambling</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/augmented-reality/">Augmented Reality</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/gaming-stocks/">Gaming</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/pharmaceutical-stocks/">Pharmaceuticals</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/online-dating/">Online Dating</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/virtual-reality/">Virtual Reality</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sports-betting/">Sports Betting</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/metaverse/">Metaverse</a
        >
      </li>
    </ul>
  </div>

  <!--Start Non-US Stocks Listed on US Exchanges-->
  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">
      Non-US Stocks Listed on US Exchanges
    </h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/country/ca">Canada</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/country/cn">China</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/country/in">India</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/country/jp">Japan</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/country/de">Germany</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/country/il">Israel</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/country/gb">United Kingdom</a
        >
      </li>
    </ul>
  </div>

  <!--End Non-US Stocks Listed on US Exchanges-->

  <!--Start Sector Group-->
  <div>
    <h2 class="mb-2 text-xl font-bold pt-10">Sector Groups</h2>
    <ul
      class="list-outside list-disc space-y-1 p-1 pl-6 md:columns-2 md:gap-x-8 md:text-lg"
    >
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/financial">Financials</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/healthcare">Healthcare</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/technology">Technology</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/industrials">Industrials</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/energy">Energy</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/utilities">Utilities</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/consumer-cyclical">Consumer Cyclical</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/real-estate">Real Estate</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/basic-materials">Basic Materials</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/communication-services">Communication Services</a
        >
      </li>
      <li>
        <a
          class="text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
          href="/list/sector/consumer-defensive">Consumer Defensive</a
        >
      </li>
    </ul>
  </div>

  <!--End Sector Group-->
</section>
