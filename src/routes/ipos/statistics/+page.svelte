<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import IPOChart from "$lib/components/IPOChart.svelte";

  import { deferFunction } from "$lib/utils";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  export let data;

  let ipoNews = data?.getNews;
  let isLoaded = false;
  let config = null;

  const startYear = 2019;
  const currentYear = new Date().getFullYear();
  const yearList = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => currentYear - i,
  );

  function findMinMax() {
    const rawData = data?.getIPOCalendar || [];
    const currentYear = new Date().getFullYear();

    // Count IPOs per year, excluding the current year
    const ipoCounts = rawData?.reduce((acc, { ipoDate }) => {
      const year = new Date(ipoDate).getFullYear();
      if (year !== currentYear) {
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {});

    // Find the years with the most and least IPOs
    const years = Object.keys(ipoCounts);
    if (years.length === 0) {
      console.log("No valid IPOs found (excluding current year).");
      return { maxYear: null, minYear: null, maxCount: 0, minCount: 0 };
    }

    const maxYear = years.reduce((a, b) =>
      ipoCounts[a] > ipoCounts[b] ? a : b,
    );
    const minYear = years.reduce((a, b) =>
      ipoCounts[a] < ipoCounts[b] ? a : b,
    );

    return {
      maxYear: Number(maxYear),
      minYear: Number(minYear),
      maxCount: ipoCounts[maxYear],
      minCount: ipoCounts[minYear],
    };
  }

  // Proper destructuring assignment
  const { maxYear, minYear, maxCount, minCount } = findMinMax();

  function plotData() {
    const rawData = data?.getIPOCalendar ?? [];
    // Group the IPOs by year
    const yearCounts = rawData.reduce((acc, ipo) => {
      const year = new Date(ipo?.ipoDate).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    // Sort the years and extract count values
    const years = Object.keys(yearCounts).sort((a, b) => a - b);
    const counts = years.map((year) => yearCounts[year]);

    // Build Highcharts options
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1">Annual IPOs, 2015-2025</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },
      xAxis: {
        categories: years,
        gridLineWidth: 0,
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        style: {
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
        borderRadius: 4,
        formatter: function () {
          let tooltipContent = `<span class="m-auto text-[1rem] font-[501]">${this.x}</span><br>`;
          this.points.forEach((point) => {
            tooltipContent += `
            <span style="display:inline-block; width:10px; height:10px; background-color:${point.color}; border-radius:50%; margin-right:5px;"></span>
            <span class="font-semibold text-sm">${point.series.name}:</span> 
            <span class="font-normal text-sm">${point.y?.toLocaleString("en-US")}</span><br>`;
          });
          return tooltipContent;
        },
      },
      plotOptions: {
        series: {
          color: $mode === "light" ? "black" : "white",
          animation: false,
          dataLabels: {
            enabled: true,
            color: $mode === "light" ? "black" : "white",
            style: {
              fontSize: "13px",
              fontWeight: "",
            },
            formatter: function () {
              return this.y;
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: "IPOs",
          data: counts,
          color: $mode === "light" ? "#2C6288" : "white",
        },
      ],
    };

    return options;
  }

  onMount(async () => {
    if (!browser) return;
    deferFunction(() => {
      config = plotData() || null;
    }, 600);

    isLoaded = true;
  });
</script>

<SEO
  title="IPO Statistics and Charts"
  description="Statistics and charts for initial public offerings (IPOs) on the US stock market. Annual data is available from 2015-2025 and monthly data for 2019-2025."
/>

<div class="w-full overflow-hidden m-auto">
  <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
    <div
      class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
    >
      <main class="w-full lg:w-3/4 lg:pr-10">
        <div class="w-full m-auto">
          <div class="grid grid-cols-1 gap-y-3">
            <div class="mt-5">
              This page provides statistics and charts on initial public
              offerings (IPOs) in the U.S. stock market. Annual data is
              available from 2015 to 2025, with monthly data starting from 2019.
            </div>

            <h1 class="text-xl sm:text-2xl font-bold mb-2 sm:mb-0 mt-2">
              Number of IPOs by Year
            </h1>

            <div class="mb-2">
              There have been {data?.getIPOCalendar?.length?.toLocaleString(
                "en-US",
              )} IPOs between 2015 and 2025. The least was in {minYear} with only
              {minCount}. The full year {maxYear} was an all-time record with {maxCount?.toLocaleString(
                "en-US",
              )} IPOs.
            </div>

            {#if isLoaded && config}
              <div
                class="shadow-xs border border-gray-300 dark:border-gray-800 rounded"
                use:highcharts={config}
              ></div>
            {:else}
              <div class="flex justify-center items-center h-80">
                <div class="relative">
                  <label
                    class="shadow-xs bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      class="loading loading-spinner loading-md text-white dark:text-white"
                    ></span>
                  </label>
                </div>
              </div>
            {/if}

            {#each yearList as year}
              <IPOChart {data} {year} />
            {/each}
          </div>
        </div>
      </main>
      <aside class="inline-block relative w-full lg:w-1/4 mt-3">
        {#if ipoNews?.length !== 0}
          <div
            class="w-full border border-gray-300 dark:border-gray-600 rounded h-fit pb-4 mt-4 cursor-pointer bg-inherit"
          >
            <div class="p-4 text-sm">
              <h3 class="text-xl font-bold mb-3">IPO News</h3>
              <ul class="">
                {#each ipoNews?.slice(0, 10) as item}
                  <li class="mb-3 last:mb-1">
                    {item?.timestamp}
                    <a
                      class="text-blue-700 sm:hover:text-muted dark:sm:hover:text-white dark:text-blue-400"
                      href={item?.link}
                      target="_blank"
                      rel="noopener noreferrer nofollow">{item?.title}</a
                    >
                  </li>
                {/each}
              </ul>
              <a
                href={`/ipos/news`}
                class="flex justify-center items-center rounded cursor-pointer w-full py-2 mt-3 text-[1rem] text-center font-semibold text-white dark:text-black m-auto sm:hover:bg-muted dark:sm:hover:bg-gray-300 bg-black dark:bg-[#fff] transition duration-100"
              >
                More IPO News
              </a>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</div>
