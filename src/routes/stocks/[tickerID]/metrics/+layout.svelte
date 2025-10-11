<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { page } from "$app/stores";

  export let data;

  let categories = [];
  let subsectionTitles;
  let sectionMap;
  let displaySubSection;

  function convertToTitleCase(str) {
    return str
      ?.split("-") // Split the string by hyphen
      ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      ?.join(" ")
      ?.replace("Oem", "OEM");
  }

  function changeSubSection(state) {
    displaySubSection = state;
  }

  function getHref(section) {
    const path =
      section === "overview" ? "/metrics" : `/metrics/${sectionMap[section]}`;
    return `/stocks/${$stockTicker}${path}`;
  }

  $: {
    if ($page?.url?.pathname) {
      const parts = $page.url.pathname.split("/");

      // Filter out empty strings from URL parts and look for the section
      const foundSection = parts?.find(
        (part) => part && Object?.values(sectionMap)?.includes(part),
      );

      // If a valid section is found in the URL, update the displaySubSection
      displaySubSection =
        Object?.keys(sectionMap)?.find(
          (key) => sectionMap[key] === foundSection,
        ) || "overview";
    }
  }

  $: {
    if ($stockTicker && data?.getData) {
      const metricsData = Array.isArray(data.getData) ? data.getData : [];

      // Group metrics by category to determine which should be combined
      const tempCategorized = metricsData.reduce((acc, metric) => {
        const category = metric.category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(metric);
        return acc;
      }, {});

      // Determine final categories (combining single-metric categories)
      const finalCategories = [];
      let hasOperatingMetrics = false;

      for (const [category, metrics] of Object.entries(tempCategorized)) {
        if (metrics.length === 1) {
          hasOperatingMetrics = true;
        } else {
          finalCategories.push(category);
        }
      }

      if (hasOperatingMetrics) {
        finalCategories.push("Operating Metrics");
      }

      // Sort with Operating Metrics first, then alphabetically
      categories = finalCategories.sort((a, b) => {
        if (a === "Operating Metrics") return -1;
        if (b === "Operating Metrics") return 1;
        return a.localeCompare(b);
      });
      subsectionTitles = ["Overview", ...categories];

      sectionMap = Object?.fromEntries(
        subsectionTitles?.map((title) => {
          const key = title
            ?.toLowerCase()
            ?.replace(/&/g, "") // Remove & symbol
            ?.replace(/\s+/g, "-") // Replace spaces with dash
            ?.replace(/-{2,}/g, "-") // Replace multiple dashes with single dash
            ?.replace(/^-|-$/g, "") // Remove leading/trailing dashes
            ?.trim();
          return [key, key === "overview" ? "" : key];
        }),
      );

      displaySubSection = "overview";
    }
  }
</script>

<section class="w-full overflow-hidden h-full">
  <div class="m-auto h-full overflow-hidden">
    <main class="w-full">
      <div class="m-auto">
        {#if categories?.length > 0}
          <nav
            class="sm:ml-4 pt-1 text-sm sm:text-[1rem] whitespace-nowrap overflow-x-auto whitespace-nowrap"
          >
            <ul class="flex flex-row items-center w-full">
              {#each subsectionTitles as title}
                {@const sectionKey = title
                  ?.toLowerCase()
                  ?.replace(/&/g, "") // Remove & symbol
                  ?.replace(/\s+/g, "-") // Replace spaces with dash
                  ?.replace(/-{2,}/g, "-") // Replace multiple dashes with single dash
                  ?.replace(/^-|-$/g, "") // Remove leading/trailing dashes
                  ?.trim()}
                <a
                  href={getHref(sectionKey)}
                  on:click={() => changeSubSection(sectionKey)}
                  class="p-2 px-5 cursor-pointer {displaySubSection ===
                  sectionKey
                    ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                >
                  {convertToTitleCase(title)}
                </a>
              {/each}
            </ul>
          </nav>
        {/if}
      </div>
    </main>

    <slot />
  </div>
</section>

<style>
  .scrollbar {
    display: grid;
    grid-gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    grid-auto-flow: column;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }

  .scrollbar::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  .scrollbar::-webkit-scrollbar-thumb {
    background: transparent;
  }
</style>
