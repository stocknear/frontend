<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import SEO from "$lib/components/SEO.svelte";
  import { setCache, getCache } from "$lib/store";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import HeatmapChart from "$lib/components/Plot/HeatmapChart.svelte";

  export let data;
  let isLoading = false;

  // Use SSR data immediately
  let heatmapData: any = data?.getHeatMap?.data ? data.getHeatMap : null;
  let selectedTimePeriod = "1D";
  let selectedETF = "SPY";

  async function getHeatMap(timePeriod: string, etf: string = selectedETF) {
    // Skip if same selection
    if (
      timePeriod === selectedTimePeriod &&
      etf === selectedETF &&
      heatmapData?.data
    ) {
      return;
    }

    selectedTimePeriod = timePeriod;
    selectedETF = etf;
    isLoading = true;

    try {
      const cacheKey = `heatmap_${etf}_${timePeriod}_v2`;
      const cachedData = getCache(cacheKey, "getHeatmap");

      if (cachedData?.data) {
        heatmapData = cachedData;
      } else {
        const postData = { params: timePeriod, etf: etf };
        const response = await fetch("/api/heatmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        heatmapData = await response.json();
        if (heatmapData?.data) {
          setCache(cacheKey, heatmapData, "getHeatmap");
        }
      }
    } catch (error) {
      console.error("Error loading heatmap:", error);
      toast.error("Failed to load heatmap. Please try again.", {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<SEO
  title="US Stock Market Heatmap - Real-Time Performance Visualization"
  description="Advanced stock market heatmap with real-time performance data, sector analysis, and market trend visualization. Track stock performance, sector rotation, and market momentum with our interactive color-coded heatmap tool. Features multiple timeframes and downloadable charts for professional analysis."
  keywords="S&P 500 heatmap, stock market heatmap, real-time market visualization, sector performance heatmap, stock performance tracker, market trends analysis, sector rotation visualization, interactive stock heatmap, market momentum tracker, financial data visualization, trading heatmap, investment analysis tool"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Stock Market Heatmap",
    description:
      "Interactive US market heatmap for real-time visualization of stock and sector performance with advanced filtering and analysis tools",
    url: "https://stocknear.com/heatmap",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Modern web browser with JavaScript enabled",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Market Heatmap",
          item: "https://stocknear.com/heatmap",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Real-time S&P 500 performance visualization",
      "Interactive sector and industry heatmap",
      "Multiple timeframe analysis (1D, 1W, 1M, 3M, 6M, 1Y, 3Y)",
      "Color-coded performance indicators",
      "Downloadable charts (PNG, JPG, SVG)",
      "Professional market trend analysis",
      "Sector rotation tracking",
      "Market momentum visualization",
    ],
    creator: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-6 px-4 lg:px-6 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-800 dark:text-zinc-300"
  >
    <li>
      <a
        href="/"
        class="text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 transition"
        >Home</a
      >
    </li>
    <li class="text-gray-800 dark:text-zinc-300">Heatmap</li>
  </BreadCrumb>

  <div class="w-full overflow-hidden m-auto mt-5">
    <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
      <div
        class="relative flex justify-center items-start overflow-hidden w-full"
      >
        <main class="w-full">
          <div class="mb-6 border-b border-gray-300 dark:border-zinc-700">
            <h1
              class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
            >
              {#if selectedETF === "SPY"}
                S&P 500
              {:else if selectedETF === "DIA"}
                Dow Jones
              {:else if selectedETF === "QQQ"}
                Nasdaq 100
              {:else}
                {selectedETF}
              {/if} - {selectedTimePeriod} Performance
            </h1>
          </div>

          <div class="flex flex-row items-center w-fit">
            <div
              class="grid grid-cols-2 sm:grid-cols-2 gap-y-3 sm:gap-y-0 gap-x-2.5 lg:grid-cols-2 w-full mt-5"
            >
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    <span class="truncate">
                      {#if selectedETF === "SPY"}
                        S&P 500
                      {:else if selectedETF === "DIA"}
                        Dow Jones
                      {:else if selectedETF === "QQQ"}
                        Nasdaq 100
                      {:else}
                        {selectedETF}
                      {/if}
                    </span>
                    <svg
                      class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  sideOffset={10}
                  alignOffset={0}
                  class="w-auto h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                >
                  <div
                    class="relative sticky z-40 focus:outline-hidden -top-1"
                    tabindex="0"
                    role="menu"
                    style=""
                  ></div>
                  <DropdownMenu.Group>
                    {#each [{ value: "SPY", label: "S&P 500" }, { value: "DIA", label: "Dow Jones" }, { value: "QQQ", label: "Nasdaq 100" }] as item}
                      <DropdownMenu.Item
                        on:click={() =>
                          getHeatMap(selectedTimePeriod, item.value)}
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition cursor-pointer"
                      >
                        <span class="mr-8">{item.label}</span>
                      </DropdownMenu.Item>
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    <span class="truncate">Time Period</span>
                    <svg
                      class="-mr-1 ml-1 h-5 w-5 xs:ml-2 inline-block"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style="max-width:40px"
                      aria-hidden="true"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  sideOffset={10}
                  alignOffset={0}
                  class="w-auto h-fit max-h-72 overflow-y-auto scroller rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                >
                  <div
                    class="relative sticky z-40 focus:outline-hidden -top-1"
                    tabindex="0"
                    role="menu"
                    style=""
                  ></div>
                  <DropdownMenu.Group>
                    {#each ["1D", "1W", "1M", "3M", "6M", "1Y", "3Y"] as item}
                      <DropdownMenu.Item
                        on:click={() => getHeatMap(item, selectedETF)}
                        class="sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition cursor-pointer"
                      >
                        <span class="mr-8">{item}</span>
                      </DropdownMenu.Item>
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>

          <div class="w-full mt-6">
            {#if isLoading}
              <div
                class="flex justify-center items-center h-[500px] sm:h-[600px] lg:h-[750px]"
              >
                <div class="relative">
                  <label
                    class="border border-gray-300 shadow dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/70 rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      class="loading loading-spinner loading-md text-gray-600 dark:text-zinc-300"
                    ></span>
                  </label>
                </div>
              </div>
            {:else if heatmapData?.data}
              <HeatmapChart data={heatmapData} />
            {:else}
              <div class="flex justify-center items-center h-80">
                <p class="">No data available</p>
              </div>
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
