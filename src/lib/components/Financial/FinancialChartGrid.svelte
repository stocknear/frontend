<script lang="ts">
  import FinancialChartCard from "$lib/components/Financial/FinancialChartCard.svelte";
  import { MARGIN_KEYS as marginKeys } from "$lib/financials/constants";

  export let processedData: Record<string, { xList: string[]; valueList: number[]; labelName: string }> = {};
  export let statementConfig: Array<{ propertyName: string; label: string }> = [];
  export let ghostCount: number = 0;
  export let onExpandChart: (metricKey: string, metricLabel: string) => void = () => {};

  /** Build ghost placeholder values using a deterministic sine pattern */
  function buildGhostValues(realValues: number[], count: number): number[] {
    if (count <= 0) return [];
    const numeric = realValues.filter(v => v != null && v !== 0);
    const peak = numeric.length > 0 ? Math.max(...numeric.map(Math.abs)) : 100;
    return Array.from({ length: count }, (_, i) =>
      parseFloat((peak * (0.3 + 0.4 * Math.abs(Math.sin(i * 2.3)))).toFixed(2))
    );
  }

  $: effectiveGhostCount = Math.min(ghostCount, 4);

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
          {@const ghostLabels = Array.from({ length: effectiveGhostCount }, () => '')}
          {@const ghostVals = buildGhostValues(data.valueList, effectiveGhostCount)}
          <FinancialChartCard
            metricKey={config.propertyName}
            metricLabel={data.labelName || config.label}
            xList={[...ghostLabels, ...data.xList]}
            seriesData={[{ key: config.propertyName, label: config.label, values: [...ghostVals, ...data.valueList] }]}
            isMargin={marginKeys.has(config.propertyName)}
            ghostCount={effectiveGhostCount}
            onExpand={onExpandChart}
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>
