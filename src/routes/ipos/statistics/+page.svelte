<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import highcharts from "$lib/highcharts.ts";
  import { mode } from "mode-watcher";
  import IPOChart from "$lib/components/IPOChart.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    ipos_chart_series,
    ipos_statistics_chart_title,
    ipos_statistics_description,
    ipos_statistics_infobox,
    ipos_statistics_more_news,
    ipos_statistics_seo_description,
    ipos_statistics_seo_keywords,
    ipos_statistics_seo_title,
    ipos_statistics_stock_news,
    ipos_statistics_title,
  } from "$lib/paraglide/messages";
  import {
    market_news_time_minute,
    market_news_time_minutes,
    market_news_time_hour,
    market_news_time_hours,
    market_news_time_day,
    market_news_time_days,
    market_news_time_ago,
  } from "$lib/paraglide/messages";

  import { deferFunction } from "$lib/utils";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { getLocale } from "$lib/paraglide/runtime.js";

  export let data;

  const formatDate = (dateString) => {
    const inputDate = new Date(dateString);
    const nycTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const currentNYCDate = new Date(nycTime);
    const difference = inputDate.getTime() - currentNYCDate.getTime();
    const minutes = Math.abs(Math.round(difference / (1000 * 60)));

    if (minutes < 60) {
      return minutes === 1
        ? market_news_time_minute({ count: minutes })
        : market_news_time_minutes({ count: minutes });
    } else if (minutes < 1440) {
      const hours = Math.round(minutes / 60);
      return hours === 1
        ? market_news_time_hour({ count: hours })
        : market_news_time_hours({ count: hours });
    } else {
      const days = Math.round(minutes / 1440);
      return days === 1
        ? market_news_time_day({ count: days })
        : market_news_time_days({ count: days });
    }
  };

  let marketNews = data?.getNews;
  let isLoaded = false;
  let config = null;

  const currentYear = new Date().getFullYear();

  // ipoDate is a plain YYYY-MM-DD string. Reading the year back out of a Date
  // shifts a 1 January listing into the previous year for anyone west of
  // Greenwich, so slice the string instead.
  $: ipoYearCounts = (data?.getIPOCalendar ?? []).reduce((acc, ipo) => {
    const year = ipo?.ipoDate?.slice(0, 4);
    if (year) acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  // The year range comes from the data, not from a hardcoded floor that has to
  // be edited every January.
  $: coveredYears = Object.keys(ipoYearCounts)
    .map(Number)
    .sort((a, b) => a - b);
  $: startYear = coveredYears[0] ?? currentYear;
  $: endYear = coveredYears[coveredYears.length - 1] ?? currentYear;
  $: filteredYearList = [...coveredYears].reverse();

  // Busiest and quietest completed year — the current one is still running, so
  // comparing it against full years would be misleading.
  $: completedYears = coveredYears.filter((year) => year !== currentYear);
  $: maxYear = completedYears.reduce(
    (best, year) => (ipoYearCounts[year] > ipoYearCounts[best] ? year : best),
    completedYears[0],
  );
  $: minYear = completedYears.reduce(
    (worst, year) => (ipoYearCounts[year] < ipoYearCounts[worst] ? year : worst),
    completedYears[0],
  );
  $: maxCount = ipoYearCounts[maxYear] ?? 0;
  $: minCount = ipoYearCounts[minYear] ?? 0;

  function plotData() {
    const years = coveredYears.map(String);
    const counts = years.map((year) => ipoYearCounts[year]);

    // Build Highcharts options
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "column",
        backgroundColor: "transparent",
        plotBackgroundColor: "transparent",
        height: 360,
        animation: false,
      },
      title: {
        text: `<h3 class="mt-3 mb-1">${ipos_statistics_chart_title({ startYear, endYear })}</h3>`,
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
        backgroundColor: "rgba(0, 0, 0, 1)",
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
            <span class="font-semibold text-sm text-fg">${point.series.name}:</span> 
            <span class="font-normal text-sm text-fg">${point.y?.toLocaleString(getLocale())}</span><br>`;
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
          name: ipos_chart_series(),
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
  title={ipos_statistics_seo_title()}
  description={ipos_statistics_seo_description({ startYear, endYear })}
  keywords={ipos_statistics_seo_keywords()}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "IPO Statistics and Market Data",
    description:
      "Historical initial public offering statistics and performance data for US stock market",
    url: "https://stocknear.com/ipos/statistics",
    creator: {
      "@type": "Organization",
      name: "Stocknear",
    },
    temporalCoverage: `${startYear}/${endYear}`,
    spatialCoverage: "United States",
    variableMeasured: ["Number of IPOs", "IPO Performance", "Market Trends"],
    distribution: {
      "@type": "DataDownload",
      contentUrl: "https://stocknear.com/ipos/statistics",
      encodingFormat: "text/html",
    },
  }}
/>

<div class="w-full overflow-hidden m-auto">
  <div class="sm:p-0 flex justify-center w-full m-auto overflow-hidden">
    <div
      class="relative flex flex-col lg:flex-row justify-center items-start overflow-hidden w-full"
    >
      <main class="w-full lg:w-3/4 lg:pr-10">
        <div class="w-full m-auto">
          <div class="grid grid-cols-1 gap-y-3">
            <Infobox text={ipos_statistics_infobox({ startYear, endYear })} />

            <!-- The layout already renders the page's <h1>; this is its section. -->
            <h2
              class="type-h2 text-fg mb-2 sm:mb-0 mt-2"
            >
              {ipos_statistics_title()}
            </h2>

            <div
              class="mb-2 text-sm sm:text-base text-fg-muted"
            >
              {ipos_statistics_description({
                count: data?.getIPOCalendar?.length?.toLocaleString(getLocale()),
                startYear,
                endYear,
                minYear,
                minCount: minCount?.toLocaleString(getLocale()),
                maxYear,
                maxCount: maxCount?.toLocaleString(getLocale()),
              })}
            </div>

            {#if isLoaded && config}
              <div
                class="bg-surface-card border border-line rounded-container"
                use:highcharts={config}
              ></div>
            {:else}
              <div class="flex justify-center items-center h-80">
                <div class="relative">
                  <label
                    class="border border-line bg-surface-card rounded-full h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span
                      class="loading loading-spinner loading-md text-fg-muted"
                    ></span>
                  </label>
                </div>
              </div>
            {/if}

            {#each filteredYearList as year}
              <IPOChart {data} {year} />
            {/each}
          </div>
        </div>
      </main>
      <aside class="inline-block relative w-full lg:w-1/4 mt-3">
        {#if marketNews?.length !== 0}
          <div
            class="w-full bg-surface-card border border-line rounded-container pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
          >
            <div class="p-4 text-sm text-fg-muted">
              <h3 class="type-h3 text-fg text-fg mb-3">
                {ipos_statistics_stock_news()}
              </h3>
              <ul class="">
                {#each marketNews?.slice(0, 10) as item}
                  <li class="mb-3 last:mb-1">
                    {market_news_time_ago({
                      time: formatDate(item?.publishedDate),
                    })} -
                    <a
                      class="font-medium text-fg transition-colors hover:text-accent transition"
                      href={item?.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow">{item?.title}</a
                    >
                    - {item?.site}
                  </li>
                {/each}
              </ul>
              <a
                href={`/market-news`}
                class="flex justify-center items-center rounded-full cursor-pointer w-full py-2.5 mt-3 text-[0.95rem] text-center font-semibold text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition"
              >
                {ipos_statistics_more_news()}
              </a>
            </div>
          </div>
        {/if}
      </aside>
    </div>
  </div>
</div>
