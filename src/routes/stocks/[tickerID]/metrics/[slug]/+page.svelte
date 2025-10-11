<script lang="ts">
  import { displayCompanyName, stockTicker } from "$lib/store";
  import { removeCompanyStrings } from "$lib/utils";
  import SEO from "$lib/components/SEO.svelte";
  import BusinessMetricsTable from "$lib/components/Table/BusinessMetricsTable.svelte";
  import Infobox from "$lib/components/Infobox.svelte";

  export let data;

  let categorySlug = data?.getParams;
  let categoryMetrics = [];
  let categoryName = "";
  let selectedTimePeriod = "quarterly";

  function slugToCategory(slug: string): string {
    return slug
      ?.split("-")
      ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      ?.join(" ");
  }

  function normalizeSlug(category: string): string {
    return category?.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "");
  }

  $: if ($stockTicker && data?.getData?.[selectedTimePeriod] && categorySlug) {
    const metricsData = data.getData[selectedTimePeriod];
    const slugLower = categorySlug.toLowerCase();

    if (slugLower === "operating-metrics") {
      categoryName = "Operating Metrics";

      // Group metrics by category in single pass
      const tempCategorized = {};
      for (const metric of metricsData) {
        const category = metric.category || "Other";
        if (!tempCategorized[category]) {
          tempCategorized[category] = [];
        }
        tempCategorized[category].push(metric);
      }

      // Get all single-metric categories
      categoryMetrics = [];
      for (const metrics of Object.values(tempCategorized)) {
        if (metrics.length === 1) {
          categoryMetrics.push(...metrics);
        }
      }
    } else {
      // Regular category - filter in single pass
      categoryMetrics = [];
      let foundCategoryName = "";

      for (const metric of metricsData) {
        if (normalizeSlug(metric.category) === slugLower) {
          categoryMetrics.push(metric);
          if (!foundCategoryName) {
            foundCategoryName = metric.category;
          }
        }
      }

      categoryName = foundCategoryName || slugToCategory(categorySlug);
    }
  } else {
    categoryMetrics = [];
    categoryName = "";
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
