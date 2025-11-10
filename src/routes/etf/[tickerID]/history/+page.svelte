<script lang="ts">
  import { etfTicker, displayCompanyName } from "$lib/store";
  import History from "$lib/components/History.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) ETF Historical Price Data - Complete Trading History & Performance`}
  description={`Complete historical price data for ${$displayCompanyName} (${$etfTicker}) ETF from inception to present. Analyze daily open, high, low, close prices and trading volume. Track ETF performance trends, price movements, and volatility patterns for investment research and backtesting strategies.`}
  keywords={`${$etfTicker} historical prices, ${$displayCompanyName} price history, ETF historical data, ETF performance history, ETF price chart, historical ETF quotes, ETF backtesting data, investment analysis, price trends`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${$displayCompanyName} (${$etfTicker}) Historical Price Data`,
    description:
      "Complete historical trading data for ETF analysis and research",
    url: `https://stocknear.com/etf/${$etfTicker}/history`,
    about: {
      "@type": "FinancialProduct",
      name: `${$displayCompanyName}`,
      tickerSymbol: $etfTicker,
      category: "Exchange-Traded Fund",
    },
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<History {data} ticker={$etfTicker} />
