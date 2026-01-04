<script lang="ts">
  import { stockTicker } from "$lib/store";
  import { page } from "$app/stores";

  export let data;

  let subsectionTitles = [];
  let sectionMap = {};
  let displaySubSection = "overview";

  // Helper functions (defined once, not recreated)
  function convertToTitleCase(str: string): string {
    return str
      ?.split("-")
      ?.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      ?.join(" ")
      ?.replace("Oem", "OEM");
  }

  function changeSubSection(state: string) {
    displaySubSection = state;
  }

  function getHref(section: string): string {
    const path =
      section === "overview" ? "/metrics" : `/metrics/${sectionMap[section]}`;
    return `/stocks/${$stockTicker}${path}`;
  }

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

  function createSlug(title: string): string {
    return title
      ?.toLowerCase()
      ?.replace(/&/g, "")
      ?.replace(/\s+/g, "-")
      ?.replace(/-{2,}/g, "-")
      ?.replace(/^-|-$/g, "")
      ?.trim();
  }

  // Track current path for active section
  $: if ($page?.url?.pathname && sectionMap) {
    const parts = $page.url.pathname.split("/");
    const foundSection = parts?.find(
      (part) => part && Object?.values(sectionMap)?.includes(part),
    );
    displaySubSection =
      Object?.keys(sectionMap)?.find(
        (key) => sectionMap[key] === foundSection,
      ) || "overview";
  }

  // Process metrics data - use TTM as default for navigation
  $: if ($stockTicker && data?.getData?.ttm) {
    const metricsData = data.getData.ttm;

    // Categorize metrics in single pass
    const tempCategorized = {};
    const operatingMetrics = [];

    for (const metric of metricsData) {
      const category = metric?.category || "Other";
      if (!tempCategorized[category]) {
        tempCategorized[category] = [];
      }
      tempCategorized[category].push(metric);
    }

    // Build final categories
    const finalCategories = [];
    for (const [category, metrics] of Object.entries(tempCategorized)) {
      if (metrics?.length === 1) {
        operatingMetrics.push(...metrics);
      } else {
        finalCategories.push(category);
      }
    }

    if (operatingMetrics.length > 0) {
      finalCategories.push("Operating Metrics");
    }

    // Sort categories and filter out Operating Metrics
    const sortedCategories = finalCategories
      ?.sort(sortCategories)
      ?.filter((cat) => cat !== "Operating Metrics");

    subsectionTitles = ["Overview", ...sortedCategories];

    // Create section map
    sectionMap = Object.fromEntries(
      subsectionTitles.map((title) => {
        const key = createSlug(title);
        return [key, key === "overview" ? "" : key];
      }),
    );
  }
</script>

<section class="w-full overflow-hidden h-full">
  <div class="m-auto h-full overflow-hidden">
    <main class="w-full">
      <div class="m-auto">
        {#if subsectionTitles.length > 0}
          <nav
            class="sm:ml-4 pt-1 text-sm sm:text-[1rem] whitespace-nowrap overflow-x-auto scrollbar-thin"
          >
            <ul class="flex flex-row items-center w-full gap-1 pb-3 text-sm sm:text-base">
              {#each subsectionTitles as title (title)}
                {@const sectionKey = createSlug(title)}
                <a
                  href={getHref(sectionKey)}
                  on:click={() => changeSubSection(sectionKey)}
                  class="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {displaySubSection ===
                  sectionKey
                    ? 'border-gray-200/70 dark:border-zinc-800/80 bg-gray-100/70 dark:bg-zinc-900/60 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-200/70 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
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
