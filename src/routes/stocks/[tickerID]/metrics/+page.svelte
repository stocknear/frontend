<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import Infobox from "$lib/components/Infobox.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import BusinessMetricsTable from "$lib/components/Table/BusinessMetricsTable.svelte";

  export let data;

  let metricsData = [];
  let categorizedMetrics = {};

  $: {
    if ($stockTicker && data?.getData) {
      metricsData = Array.isArray(data.getData) ? data.getData : [];

      // Group metrics by category
      const tempCategorized = metricsData.reduce((acc, metric) => {
        const category = metric.category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(metric);
        return acc;
      }, {});

      // Combine single-metric categories into "Operating Metrics"
      categorizedMetrics = {};
      const operatingMetrics = [];

      for (const [category, metrics] of Object.entries(tempCategorized)) {
        if (metrics.length === 1) {
          // Single metric - add to Operating Metrics
          operatingMetrics.push(...metrics);
        } else {
          // Multiple metrics - keep as separate category
          categorizedMetrics[category] = metrics;
        }
      }

      // Add Operating Metrics category if there are any single-metric categories
      if (operatingMetrics.length > 0) {
        categorizedMetrics["Operating Metrics"] = operatingMetrics;
      }
    }
  }

  // Get all available categories with smart ordering
  $: orderedCategories = Object.keys(categorizedMetrics).sort((a, b) => {
    // Operating Metrics always first
    if (a === "Operating Metrics") return -1;
    if (b === "Operating Metrics") return 1;

    // Geography categories always last
    const aHasGeography = a.includes("Geography");
    const bHasGeography = b.includes("Geography");
    if (aHasGeography && !bHasGeography) return 1;
    if (!aHasGeography && bHasGeography) return -1;

    // Extract the main category prefix (first significant words)
    const getPrefixPriority = (name) => {
      if (name.startsWith("Revenue")) return "1-Revenue";
      if (name.startsWith("Gross")) return "2-Gross";
      if (name.startsWith("Operating")) return "3-Operating";
      if (name.startsWith("Vehicles")) return "4-Vehicles";
      if (name.startsWith("Energy")) return "5-Energy";
      return "9-" + name.split(" ")[0]; // Use first word for others
    };

    const prefixA = getPrefixPriority(a);
    const prefixB = getPrefixPriority(b);

    // First sort by prefix, then by full name
    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB);
    }
    return a.localeCompare(b);
  });
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
        {#if metricsData?.length > 0}
          {#each orderedCategories as category}
            <BusinessMetricsTable
              title={category}
              metrics={categorizedMetrics[category]}
              showGrowth={true}
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
