<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import BusinessMetricsTable from "$lib/components/Table/BusinessMetricsTable.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  let categorySlug = data?.getParams;
  let metricsData = [];
  let categoryMetrics = [];
  let categoryName = "";
  let selectedTimePeriod = "quarterly";

  function slugToCategory(slug) {
    return slug
      ?.split("-")
      ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      ?.join(" ");
  }

  $: {
    if ($stockTicker && data?.getData && categorySlug) {
      metricsData = Array?.isArray(data?.getData[selectedTimePeriod])
        ? data?.getData[selectedTimePeriod]
        : [];

      // Check if this is "Operating Metrics" (combined single-metric categories)
      if (categorySlug.toLowerCase() === "operating-metrics") {
        categoryName = "Operating Metrics";

        // Group metrics by category
        const tempCategorized = metricsData.reduce((acc, metric) => {
          const category = metric.category || "Other";
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(metric);
          return acc;
        }, {});

        // Get all single-metric categories
        categoryMetrics = [];
        for (const [category, metrics] of Object.entries(tempCategorized)) {
          if (metrics.length === 1) {
            categoryMetrics.push(...metrics);
          }
        }
      } else {
        // Regular category - find matching metrics
        const matchingMetric = metricsData.find(
          (metric) =>
            metric.category
              ?.toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/&/g, "") === categorySlug.toLowerCase(),
        );

        categoryName = matchingMetric?.category || slugToCategory(categorySlug);

        // Filter metrics by category
        categoryMetrics = metricsData.filter((metric) => {
          const metricSlug = metric.category
            ?.toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/&/g, "");
          return metricSlug === categorySlug.toLowerCase();
        });
      }
    }
  }
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) ${categoryName} - Business Metrics`}
  description={`Detailed ${categoryName} metrics for ${$displayCompanyName} (${$stockTicker}). Track historical trends and performance indicators.`}
/>

<section class="w-full overflow-hidden h-full">
  <div class="w-full flex justify-center w-full sm-auto h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <main class="w-full">
        <div class="sm:pl-7 sm:pb-7 sm:pt-7 pt-3 m-auto mt-2 sm:mt-0 w-full">
          <div class="mb-3">
            <h1 class="text-xl sm:text-2xl font-bold">
              {categoryName}
            </h1>
          </div>

          {#if categoryMetrics?.length > 0}
            <BusinessMetricsTable
              title={categoryName}
              first={true}
              {selectedTimePeriod}
              metrics={categoryMetrics}
              showGrowth={true}
              {data}
              on:periodChange={(e) => (selectedTimePeriod = e.detail)}
            />
          {:else}
            <Infobox
              text={`Currently, there are no metrics available for ${categoryName}.`}
            />
          {/if}
        </div>
      </main>
    </div>
  </div>
</section>
