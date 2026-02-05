<script lang="ts">
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import SEO from "$lib/components/SEO.svelte";
  import { setCache, getCache } from "$lib/store";
  import { toast } from "svelte-sonner";
  import { mode } from "mode-watcher";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import HeatmapChart from "$lib/components/Plot/HeatmapChart.svelte";
  import { Download } from "lucide-svelte";
  import {
    common_home,
    heatmap_breadcrumb_label,
    heatmap_error_load,
    heatmap_feature_color,
    heatmap_feature_download,
    heatmap_feature_interactive,
    heatmap_feature_momentum,
    heatmap_feature_real_time,
    heatmap_feature_rotation,
    heatmap_feature_timeframes,
    heatmap_feature_trend,
    heatmap_heading,
    heatmap_no_data,
    heatmap_seo_description,
    heatmap_seo_keywords,
    heatmap_seo_title,
    heatmap_structured_breadcrumb_label,
    heatmap_structured_description,
    heatmap_structured_name,
    heatmap_time_period_label,
  } from "$lib/paraglide/messages.js";

  export let data;
  let isLoading = false;
  let heatmapChartRef: HeatmapChart;

  function handleDownload() {
    heatmapChartRef?.downloadChart();
  }

  // Use SSR data immediately
  let heatmapData: any = data?.getHeatMap?.data ? data.getHeatMap : null;
  let selectedTimePeriod = "1D";
  let selectedETF = "SPY";
  $: selectedIndexLabel =
    selectedETF === "SPY"
      ? "S&P 500"
      : selectedETF === "DIA"
        ? "Dow Jones"
        : selectedETF === "QQQ"
          ? "Nasdaq 100"
          : selectedETF;

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
      toast.error(heatmap_error_load(), {
        style: `border-radius: 5px; background: #fff; color: #000; border-color: ${$mode === "light" ? "#F9FAFB" : "#4B5563"}; font-size: 15px;`,
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<SEO
  title={heatmap_seo_title()}
  description={heatmap_seo_description()}
  keywords={heatmap_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: heatmap_structured_name(),
    description: heatmap_structured_description(),
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
          name: common_home(),
          item: "https://stocknear.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: heatmap_structured_breadcrumb_label(),
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
      heatmap_feature_real_time(),
      heatmap_feature_interactive(),
      heatmap_feature_timeframes(),
      heatmap_feature_color(),
      heatmap_feature_download(),
      heatmap_feature_trend(),
      heatmap_feature_rotation(),
      heatmap_feature_momentum(),
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
        >{common_home()}</a
      >
    </li>
    <li class="text-gray-800 dark:text-zinc-300">
      {heatmap_breadcrumb_label()}
    </li>
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
              {heatmap_heading({
                index: selectedIndexLabel,
                period: selectedTimePeriod,
              })}
            </h1>
          </div>

          <div class="flex flex-row items-center gap-2.5 w-fit">
            <div
              class="grid grid-cols-2 sm:grid-cols-2 gap-y-3 sm:gap-y-0 gap-x-2.5 lg:grid-cols-2 w-full"
            >
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    <span class="truncate">
                      {selectedIndexLabel}
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
                    <span class="truncate">{heatmap_time_period_label()}</span>
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

            <button
              on:click={handleDownload}
              disabled={isLoading || !heatmapData?.data}
              class="cursor-pointer transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center justify-center px-3 py-2 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
              title="Download heatmap as PNG"
            >
              <Download class="h-5 w-5" />
            </button>
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
              <HeatmapChart bind:this={heatmapChartRef} data={heatmapData} />
            {:else}
              <div class="flex justify-center items-center h-80">
                <p class="">{heatmap_no_data()}</p>
              </div>
            {/if}
          </div>
        </main>
      </div>
    </div>
  </div>
</section>
