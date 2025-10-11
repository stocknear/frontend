<script lang="ts">
  import {
    displayCompanyName,
    stockTicker,
    selectedTimePeriod,
  } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import BusinessMetricsTable from "$lib/components/Table/BusinessMetricsTable.svelte";

  export let data;

  $selectedTimePeriod = "ttm";
  let orderedCategories = [];
  let categorizedMetrics = {};

  // Cache processed data per period to avoid re-processing
  const cache = new Map();

  // Helper function for category sorting (defined once, not recreated)
  function getPrefixPriority(name: string): string {
    if (name.startsWith("Revenue")) return "1-Revenue";
    if (name.startsWith("Gross")) return "2-Gross";
    if (name.startsWith("Operating")) return "3-Operating";
    if (name.startsWith("Vehicles")) return "4-Vehicles";
    if (name.startsWith("Energy")) return "5-Energy";
    return "9-" + name.split(" ")[0];
  }

  function sortCategories(a: string, b: string): number {
    if (a === "Operating Metrics") return -1;
    if (b === "Operating Metrics") return 1;

    const aHasGeography = a.includes("Geography");
    const bHasGeography = b.includes("Geography");
    if (aHasGeography && !bHasGeography) return 1;
    if (!aHasGeography && bHasGeography) return -1;

    const prefixA = getPrefixPriority(a);
    const prefixB = getPrefixPriority(b);

    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB);
    }
    return a.localeCompare(b);
  }

  function processMetrics(metricsData) {
    // Categorize metrics in a single pass
    const tempCategorized = {};
    const operatingMetrics = [];

    for (const metric of metricsData) {
      const category = metric?.category || "Other";
      if (!tempCategorized[category]) {
        tempCategorized[category] = [];
      }
      tempCategorized[category].push(metric);
    }

    // Build final categorized metrics
    const result = {};
    for (const [category, metrics] of Object.entries(tempCategorized)) {
      if (metrics.length === 1) {
        operatingMetrics.push(...metrics);
      } else {
        result[category] = metrics;
      }
    }

    if (operatingMetrics.length > 0) {
      result["Operating Metrics"] = operatingMetrics;
    }

    return {
      categorized: result,
      ordered: Object.keys(result).sort(sortCategories),
    };
  }

  // Single reactive block with caching
  $: if ($stockTicker && data?.getData?.[$selectedTimePeriod]) {
    const cacheKey = `${$stockTicker}-${$selectedTimePeriod}`;

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      categorizedMetrics = cached.categorized;
      orderedCategories = cached.ordered;
    } else {
      const metricsData = data.getData[$selectedTimePeriod];
      const processed = processMetrics(metricsData);

      categorizedMetrics = processed.categorized;
      orderedCategories = processed.ordered;

      cache.set(cacheKey, processed);
    }
  } else {
    categorizedMetrics = {};
    orderedCategories = [];
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Business Metrics Overview`}
  description={`View comprehensive business metrics for ${$displayCompanyName} (${$stockTicker}) stock, including revenue breakdown, operating metrics, and performance indicators.`}
/>

<section class="overflow-hidden min-h-screen w-full">
  <div class="flex justify-center m-auto h-full overflow-hidden w-full">
    <div
      class="relative flex justify-center items-center overflow-hidden w-full"
    >
      <div class="sm:pl-7 sm:pb-7 w-full m-auto mt-2 sm:mt-0">
        {#if orderedCategories.length > 0}
          {#each orderedCategories as category, index (category)}
            <BusinessMetricsTable
              title={category}
              first={index === 0}
              metrics={categorizedMetrics[category]}
              showGrowth={true}
              {data}
            />
          {/each}
        {:else}
          <Infobox
            text={`Currently, there are no business metrics available for ${removeCompanyStrings($displayCompanyName)}.`}
          />
        {/if}
      </div>
    </div>
  </div>
</section>
