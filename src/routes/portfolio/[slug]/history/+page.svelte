<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import History from "$lib/components/History.svelte";
  import SEO from "$lib/components/SEO.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Historical Stock Price Data | Complete Trading History`}
  description={`Complete historical stock price data for ${$displayCompanyName} (${$stockTicker}) from inception. Access daily OHLCV data, historical charts, volume analysis, and price trends with comprehensive historical market data and trading statistics.`}
  keywords={`${$stockTicker} historical prices, ${$displayCompanyName} stock history, historical stock data, ${$stockTicker} price history, OHLC historical data, stock price charts, ${$stockTicker} trading history, historical market data`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/history`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Dataset"],
    name: `${$displayCompanyName} Historical Stock Data`,
    description: `Complete historical stock price and trading data for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/history`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Historical price data",
      "OHLCV data tracking",
      "Volume analysis",
      "Price trend analysis",
      "Historical charts",
      "Trading statistics",
      "Market data archive",
      "Price movement history",
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
      name: "Historical Stock Data",
      description:
        "Comprehensive historical stock price and trading data analysis",
    },
  }}
/>

<History {data} ticker={$stockTicker} />
