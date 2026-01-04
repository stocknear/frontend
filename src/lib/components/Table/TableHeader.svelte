<script lang="ts">
  export let columns = [];
  export let sortOrders = {};
  export let sortData;

  const SortIcon = ({ sortOrder }) => `
    <svg class="shrink-0 w-4 h-4 ${
      sortOrder === "asc"
        ? "rotate-180 inline-block"
        : sortOrder === "desc"
          ? "inline-block"
          : "hidden"
    }" viewBox="0 0 20 20" fill="currentColor" style="max-width:50px">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
    </svg>
  `;

  const labelReplacements = {
    "Dividend Payout Frequency": "Payout Freq.",
    "Dividend Yield": "Div. Yield",
    "Analyst Rating": "Rating",
    "Top Analyst Rating": "Top Rating",
    "Enterprise Value": "Ent. Value",
    "20-Day Moving Average": "MA 20",
    "50-Day Moving Average": "MA 50",
    "100-Day Moving Average": "MA 100",
    "200-Day Moving Average": "MA 200",
    "20-Day Exp. Moving Average": "EMA 20",
    "50-Day Exp. Moving Average": "EMA 50",
    "100-Day Exp. Moving Average": "EMA 100",
    "200-Day Exp. Moving Average": "EMA 200",
    "Average True Range": "ATR",
    "Relative Strength Index": "RSI",
    "Stochastic RSI Fast": "STOCH RSI",
    "Money Flow Index": "MFI",
    "Commodity Channel Index": "CCI",
    "Operating Cash Flow": "Op CF",
    "Return on Invested Capital": "ROIC",
    "Average Volume": "Avg Vol",
    "Relative Volume": "Rel Vol",
    "Revenue Per Employee": "Rev / Employee",
    "Value-at-Risk": "VaR",
    "Price Target Upside": "PT Upside",
    "Top Price Target Upside": "Top PT Upside",
    "Revenue Growth Years": "Rev Growth Yrs",
    "Net Income Growth Years": "NetInc Growth Yrs",
    "Gross Profit Growth Years": "GP Growth Yrs",
    "Call Volume": "Call Vol",
    "Put Volume": "Put Vol",
    "Cost of Revenue": "Cost of Rev",
    "Fail to Deliver (FTD)": "FTD",
    "Altman-Z-Score": "Z-Score",
    "Piotroski F-Score": "F-Score",
    "Shares Change (QoQ)": "Shares Ch. (QoQ)",
    "Shares Change (YoY)": "Shares Ch. (YoY)",
    "Shares Outstanding": "Shares Out.",
    "Shareholders Equity": "Equity",
    "Institutional Ownership": "Inst. Owned",
    "Research & Development": "R&D",
    "R&D / Revenue": "R&D / Rev",
    "Graham Number": "Graham Num",
    "Stock-Based Compensation": "SBC",
    "Stock-Based Compensation Growth": "SBC Growth",
    "SBC / Revenue": "SBC / Rev",
    "Price Change 1W": "Change 1W",
    "Price Change 1M": "Change 1M",
    "Price Change 3M": "Change 3M",
    "Price Change 6M": "Change 6M",
    "Price Change 1Y": "Change 1Y",
    "Price Change 3Y": "Change 3Y",
    "Short % Outstanding": "Short % Out",
    "Total Liabilities": "Liabilities",
    "Total Liabilities Growth": "Liab. Growth",
    "Price Target": "PT",
    "Dividend Growth": "Div. Growth",
    "Annual Dividend": "Annual Div.",
    "Operating Income": "Op. Income",
    Revenue: "Rev",
    "Net Income": "NetInc",
    "Free Cash Flow": "FCF",
    "Return on Equity": "ROE",
    "Return on Assets": "ROA",
    "Return on Capital Employed": "ROCE",
    "Return on Tangible Assets": "ROTA",
    "Earnings Revenue Estimate": "Est. Rev.",
    "Revenue Estimated Growth": "Est. Rev. Growth",
    "Earnings EPS Estimate": "Est. EPS",
    "EPS Estimated Growth": "Est. EPS Growth",
    "Open Interest": "OI",
    "Total Premium": "Total Prem",
    MoneynessPercentage: "% Moneyness",
    "EPS Growth Next 3Y": "EPS Gr. Next 3Y",
    "EPS Growth Next 5Y": "EPS Gr. Next 5Y",
    "Revenue Growth Next 3Y": "Rev Gr. Next 3Y",
    "Revenue Growth Next 5Y": "Rev Gr. Next 5Y",
    "Price Change 1D": "% Change",
  };

  function formatLabel(label: string): string {
    if (!label) return "";
    return labelReplacements[label] || label;
  }
</script>

<tr
  class="bg-white/60 dark:bg-zinc-950/40 border-b border-gray-200/70 dark:border-zinc-800/80 text-gray-500 dark:text-zinc-400 z-20"
>
  {#each columns as column}
    <th
      on:click={() => sortData(column.key)}
      class="cursor-pointer select-none font-semibold text-[0.7rem] sm:text-xs uppercase tracking-wide whitespace-nowrap {column.align ===
      'right'
        ? 'text-end'
        : column.align === 'left'
          ? 'text-start'
          : 'text-center'}"
    >
      {formatLabel(column?.label)}
      {@html SortIcon({ sortOrder: sortOrders[column.key]?.order })}
    </th>
  {/each}
</tr>
