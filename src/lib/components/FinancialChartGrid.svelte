<script lang="ts">
  import FinancialChartCard from "$lib/components/FinancialChartCard.svelte";

  export let processedData: Record<string, { xList: string[]; valueList: number[]; labelName: string }> = {};
  export let statementConfig: Array<{ propertyName: string; label: string }> = [];
  export let onExpandChart: (metricKey: string, metricLabel: string) => void = () => {};

  // Set of margin/ratio keys that should be displayed as percentages
  const marginKeys = new Set([
    "freeCashFlowYield",
    "returnOnEquity",
    "returnOnAssets",
    "returnOnInvestedCapital",
    "returnOnCapitalEmployed",
    "grossProfitMargin",
    "operatingMargin",
    "netProfitMargin",
    "ebitdaMargin",
  ]);

  // Filter out metrics that have no data
  $: validMetrics = statementConfig.filter(config => {
    const data = processedData[config.propertyName];
    return data && data.valueList && data.valueList.length > 0 && 
           data.valueList.some(v => v !== 0 && v !== null && v !== undefined);
  });
</script>

<div class="w-full">
  {#if validMetrics.length === 0}
    <div class="flex items-center justify-center py-12 text-gray-500 dark:text-zinc-400">
      <p>No chart data available</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each validMetrics as config (config.propertyName)}
        {@const data = processedData[config.propertyName]}
        {#if data}
          <FinancialChartCard
            metricKey={config.propertyName}
            metricLabel={data.labelName || config.label}
            xList={data.xList}
            valueList={data.valueList}
            isMargin={marginKeys.has(config.propertyName)}
            onExpand={onExpandChart}
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>
