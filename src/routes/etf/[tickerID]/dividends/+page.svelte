<script lang="ts">
  import { displayCompanyName, etfTicker } from "$lib/store";
  import SEO from "$lib/components/SEO.svelte";
  import Dividends from "$lib/components/Dividends.svelte";

  export let data;
</script>

<SEO
  title={`${$displayCompanyName} (${$etfTicker}) ETF Dividend Analysis - Yield, History & Distribution Dates`}
  description={`Complete dividend analysis for ${$displayCompanyName} (${$etfTicker}) ETF including dividend yield, payment history, distribution dates, and ex-dividend calendar. Track ETF dividend income potential, payout frequency, and yield trends for income-focused portfolio strategies.`}
  keywords={`${$etfTicker} dividend, ${$displayCompanyName} dividend yield, ETF distributions, ETF dividend history, dividend paying ETF, income ETF, ETF yield, distribution dates, ex-dividend date, dividend calendar, income investing, yield investing`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: `${$displayCompanyName} (${$etfTicker}) Dividend Analysis`,
    description: "ETF dividend yield analysis and distribution history",
    category: "Exchange-Traded Fund",
    url: `https://stocknear.com/etf/${$etfTicker}/dividends`,
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    about: {
      "@type": "InvestmentFund",
      name: `${$displayCompanyName}`,
      tickerSymbol: $etfTicker,
      category: "Exchange-Traded Fund",
    },
  }}
/>

<Dividends {data} ticker={$etfTicker} />
