<script lang="ts">
  import { mode } from "mode-watcher";
  import { onMount } from "svelte";
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;
  export let ticker;
  export let assetType;

  let overview = data?.getOptionsChainStatistics?.overview;
  let ivData = data?.getOptionsChainStatistics?.impliedVolatility;
  let oiData = data?.getOptionsChainStatistics?.openInterest;
  let volData = data?.getOptionsChainStatistics?.volume;

  let rawData = data?.getOptionsChainStatistics?.table;
  let optionList = rawData?.slice(0, 100);

  let isSubscribed = ["Plus", "Pro"].includes(data?.user?.tier) || false;
  const lockLinkClass =
    "mt-1 inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition";
  const lockLinkInlineClass =
    "inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition";

  let configIV;
  let configOI;
  let configOIPutCall;
  let configVolume;
  let configVolumePutCall;

  const formatDate = (dateString: string): string => {
    if (!dateString) return "n/a";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "n/a"
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        });
  };

  function plotIV() {
    const options = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false, // Disable initial animation
      },

      title: {
        text: `<h3 class="">${m.stock_detail_options_iv_30d()}</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            // Outer circle (black line)
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null, // keep existing null if needed
        ],
      },

      // the value axis
      yAxis: {
        min: 0,
        max: 100,
        tickPosition: "outside",
        tickLength: 0,
        tickWidth: 0,
        minorTickInterval: null,
        lineWidth: 0,
        tickPositions: [20, 50, 80],
        labels: {
          enabled: true,
          distance: 20,
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return this.value;
          },
          y: 0,
        },
        plotBands: [
          {
            from: 0,
            to: 19.5,
            color: "#55BF3B",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 19.5,
            to: 20,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 20,
            to: 39.5,
            color: "#55BF3B",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 39.5,
            to: 40,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 40,
            to: 59.5,
            color: "#DDDF0D",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 59.5,
            to: 60,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 60,
            to: 79.5,
            color: "#DF5353",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 79.5,
            to: 80,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 80,
            to: 100,
            color: "#DF5353",
            thickness: 20,
            borderRadius: "0px",
          },
        ],
      },

      series: [
        {
          name: "IV",
          data: [ivData?.current > 100 ? 100 : (ivData?.current ?? 0)],
          animation: false,
          dataLabels: {
            useHTML: true, // ensure HTML works if you keep custom markup
            backgroundColor: "none", // removes background
            borderWidth: 0, // removes border
            shadow: false, // removes shadow
            format: `<span class="text-lg font-bold">${ivData?.current}% IV</span>`,
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    return options;
  }

  function plotOI() {
    const currentOI = oiData?.total ?? 0;
    const benchmarkOI =
      oiData?.avgDaily * 2 > currentOI ? oiData?.avgDaily * 2 : currentOI;

    // Define band breakpoints as fractions of benchmarkOI
    const band1 = benchmarkOI * 0.2;
    const band2 = benchmarkOI * 0.4;
    const band3 = benchmarkOI * 0.6;
    const band4 = benchmarkOI * 0.8;

    const optionsOI = {
      credits: { enabled: false },

      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false,
      },

      title: {
        text: `<h3 class="">${m.stock_detail_options_open_interest()}</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null,
        ],
      },

      yAxis: {
        min: 0,
        max: benchmarkOI,
        tickPosition: "outside",
        tickLength: 0,
        tickWidth: 0,
        minorTickInterval: null,
        lineWidth: 0,
        labels: {
          enabled: true,
          distance: 20,
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
          y: 0,
        },
        plotBands: [
          { from: 0, to: band1, color: "#55BF3B", thickness: 20 },
          { from: band1, to: band2, color: "#55BF3B", thickness: 20 },
          { from: band2, to: band3, color: "#DDDF0D", thickness: 20 },
          { from: band3, to: band4, color: "#DF5353", thickness: 20 },
          { from: band4, to: benchmarkOI, color: "#DF5353", thickness: 20 },
        ],
      },

      series: [
        {
          name: "OI",
          data: [currentOI],
          animation: false,
          dataLabels: {
            useHTML: true,
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            formatter: function () {
              return `<span class="text-lg font-bold">${abbreviateNumber(this.y)}</span>`;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    const actualValue = oiData?.putCallRatio ?? 0;

    const optionsOIPutCall = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false, // Disable initial animation
      },

      title: {
        text: `<h3 class="">${m.stock_detail_options_put_call_ratio()}</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            // Outer circle (black line)
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null, // keep existing null if needed
        ],
      },

      // the value axis
      yAxis: {
        min: 0,
        max: 2,
        tickPosition: "outside",
        tickLength: 10,
        tickWidth: 0,
        tickPositions: [0, 1, 2],
        minorTickInterval: null,
        lineWidth: 0,
        labels: {
          enabled: true,
          distance: 20, // move closer to the center
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return this.value;
          },
          y: -0, // adjust vertical position upward
        },
        plotBands: [
          {
            from: 0,
            to: 0.49,
            color: "#55BF3B",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.49,
            to: 0.5,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.5,
            to: 0.99,
            color: "#DDDF0D",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.99,
            to: 1,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 1,
            to: 2,
            color: "#DF5353",
            thickness: 20,
            borderRadius: "0px",
          },
        ],
      },

      series: [
        {
          name: "OI P/C",
          data: [Math.min(actualValue, 2)], // dial limited to 2
          animation: false,
          dataLabels: {
            useHTML: true,
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            formatter: function () {
              // Show actual value even if >2
              return `<span class="text-lg font-bold">${actualValue}</span>`;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    return { optionsOI, optionsOIPutCall };
  }

  function plotVolume() {
    const currentVol = volData?.total ?? 0;
    const benchmarkVol =
      volData?.avgDaily * 2 > currentVol ? volData?.avgDaily * 2 : currentVol;

    const band1 = benchmarkVol * 0.2;
    const band2 = benchmarkVol * 0.4;
    const band3 = benchmarkVol * 0.6;
    const band4 = benchmarkVol * 0.8;

    const optionsVolume = {
      credits: { enabled: false },

      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false,
      },

      title: {
        text: `<h3 class="">${m.stock_detail_options_volume()}</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null,
        ],
      },

      yAxis: {
        min: 0,
        max: benchmarkVol,
        tickPosition: "outside",
        tickLength: 0,
        tickWidth: 0,
        minorTickInterval: null,
        lineWidth: 0,
        labels: {
          enabled: true,
          distance: 20,
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
          y: 0,
        },
        plotBands: [
          { from: 0, to: band1, color: "#55BF3B", thickness: 20 },
          { from: band1, to: band2, color: "#55BF3B", thickness: 20 },
          { from: band2, to: band3, color: "#DDDF0D", thickness: 20 },
          { from: band3, to: band4, color: "#DF5353", thickness: 20 },
          { from: band4, to: benchmarkVol, color: "#DF5353", thickness: 20 },
        ],
      },

      series: [
        {
          name: "Vol",
          data: [currentVol],
          animation: false,
          dataLabels: {
            useHTML: true,
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            formatter: function () {
              return `<span class="text-lg font-bold">${abbreviateNumber(this.y)}</span>`;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    const actualValue = volData?.putCallRatio ?? 0;

    const optionsVolumePutCall = {
      credits: {
        enabled: false,
      },
      chart: {
        type: "gauge",
        backgroundColor: $mode === "light" ? "#fff" : "#09090B",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#09090B",
        height: 280,
        animation: false, // Disable initial animation
      },

      title: {
        text: `<h3 class="">${m.stock_detail_options_put_call_ratio()}</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
          // Using inline CSS for margin-top and margin-bottom
        },
        useHTML: true, // Enable HTML to apply custom class styling
      },

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            // Outer circle (black line)
            outerRadius: "101%",
            innerRadius: "100%",
            backgroundColor: "#000",
            borderWidth: 0,
            shape: "arc",
          },
          null, // keep existing null if needed
        ],
      },

      // the value axis
      yAxis: {
        min: 0,
        max: 2,
        tickPosition: "outside",
        tickLength: 10,
        tickWidth: 0,
        tickPositions: [0, 1, 2],
        minorTickInterval: null,
        lineWidth: 0,
        labels: {
          enabled: true,
          distance: 20, // move closer to the center
          style: {
            color: $mode === "light" ? "#000" : "#fff",
            fontSize: "15px",
          },
          formatter: function () {
            return this.value;
          },
          y: -0, // adjust vertical position upward
        },
        plotBands: [
          {
            from: 0,
            to: 0.49,
            color: "#55BF3B",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.49,
            to: 0.5,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.5,
            to: 0.99,
            color: "#DDDF0D",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 0.99,
            to: 1,
            color: "#fff",
            thickness: 20,
            borderRadius: "0px",
          },
          {
            from: 1,
            to: 2,
            color: "#DF5353",
            thickness: 20,
            borderRadius: "0px",
          },
        ],
      },

      series: [
        {
          name: "Vol P/C",
          data: [Math.min(actualValue, 2)], // dial limited to 2
          animation: false,
          dataLabels: {
            useHTML: true,
            backgroundColor: "none",
            borderWidth: 0,
            shadow: false,
            formatter: function () {
              // Show actual value even if >2
              return `<span class="text-lg font-bold">${actualValue}</span>`;
            },
          },
          dial: {
            radius: "80%",
            backgroundColor: $mode === "light" ? "#000" : "#808080",
            baseWidth: 12,
            baseLength: "0%",
            rearLength: "0%",
          },
        },
      ],
    };

    return { optionsVolume, optionsVolumePutCall };
  }

  async function handleScroll() {
    const scrollThreshold = document.body.offsetHeight * 0.8; // 80% of the website height
    const isBottom = window.innerHeight + window.scrollY >= scrollThreshold;
    if (isBottom && optionList?.length !== rawData?.length) {
      const nextIndex = optionList?.length;
      const filteredNewResults = rawData?.slice(nextIndex, nextIndex + 25);
      optionList = [...optionList, ...filteredNewResults];
    }
  }

  onMount(async () => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  $: {
    if ($mode) {
      configIV = plotIV();
      const { optionsOI, optionsOIPutCall } = plotOI();
      const { optionsVolume, optionsVolumePutCall } = plotVolume();

      configOI = optionsOI;
      configOIPutCall = optionsOIPutCall;
      configVolume = optionsVolume;
      configVolumePutCall = optionsVolumePutCall;
    }
  }
</script>

<section class="w-full overflow-hidden min-h-screen">
  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div class="sm:pl-7 sm:pb-7 sm:pt-7 w-full m-auto mt-2 sm:mt-0">
        <!--
          {#if Object?.keys(dailyStats)?.length === 0 && rawData?.length === 0}
            <Infobox text="No Options data available" />
          {/if}
          -->

        <div class="w-full mb-10">
          <div class="flex flex-row items-center">
            <h2 class="mb-2 text-xl sm:text-2xl font-bold w-fit">
              {m.stock_detail_options_overview_title({ ticker })}
            </h2>
            <div class="ml-1 -mt-3">
              <InfoModal
                id="opra-data-info"
                title={m.stock_detail_options_opra_title()}
                content={m.stock_detail_options_opra_content()}
              />
            </div>
          </div>

          <p class="mt-4">
            {m.stock_detail_options_overview_intro()} <strong>{ticker}</strong>. {m.stock_detail_options_overview_as_of()}
            <strong>{overview?.date}</strong>, <strong>{ticker}</strong>
            {m.stock_detail_options_overview_have_iv()}
            {#if isSubscribed}
              <strong
                >{overview?.currentIV
                  ? overview?.currentIV + "%"
                  : "n/a"}</strong
              >
            {:else}
              <a href="/pricing" class={lockLinkInlineClass}>
                <svg
                  class="w-4 h-4 mb-1 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                  />
                </svg>
              </a>
            {/if}
            {m.stock_detail_options_overview_and_iv_rank()}
            {#if isSubscribed}
              <strong
                >{overview?.ivRank ? overview?.ivRank + "%" : "n/a"}</strong
              >
            {:else}
              <a href="/pricing" class={lockLinkInlineClass}>
                <svg
                  class="w-4 h-4 mb-1 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                  />
                </svg>
              </a>
            {/if}
            . {m.stock_detail_options_overview_volume_is()}
            {#if isSubscribed}
              <strong>{overview?.totalVolume?.toLocaleString("en-US")}</strong>
            {:else}
              <a href="/pricing" class={lockLinkInlineClass}>
                <svg
                  class="w-4 h-4 mb-1 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                  />
                </svg>
              </a>
            {/if}
            {m.stock_detail_options_overview_contracts_which_is()}
            {#if isSubscribed}
              <strong
                >{overview?.volumePercentage
                  ? overview?.volumePercentage + "%"
                  : "n/a"}</strong
              >
            {:else}
              <a href="/pricing" class={lockLinkInlineClass}>
                <svg
                  class="w-4 h-4 mb-1 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                  />
                </svg>
              </a>
            {/if}
            {m.stock_detail_options_overview_of_avg_volume()}
            {#if isSubscribed}
              <strong
                >{overview?.avgDailyVolume?.toLocaleString("en-US")}</strong
              >
            {:else}
              <a href="/pricing" class={lockLinkInlineClass}>
                <svg
                  class="w-4 h-4 mb-1 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                  />
                </svg>
              </a>
            {/if}
            {m.stock_detail_options_overview_contracts_pc_ratio()}
            {#if isSubscribed}
              <strong>{overview?.putCallRatio}</strong>
            {:else}
              <a href="/pricing" class={lockLinkInlineClass}>
                <svg
                  class="w-4 h-4 mb-1 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                  />
                </svg>
              </a>
            {/if}
            , {m.stock_detail_options_overview_indicating()}
            {#if isSubscribed}
              <strong>{overview?.sentiment}</strong>
            {:else}
              <a href="/pricing" class={lockLinkInlineClass}>
                <svg
                  class="w-4 h-4 mb-1 inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                  />
                </svg>
              </a>
            {/if}
            {m.stock_detail_options_overview_sentiment_market()}
          </p>
        </div>

        <!-- Apply the blur class to the chart -->
        <h2 class="mb-6 text-xl sm:text-2xl font-bold w-fit">
          {m.stock_detail_options_implied_volatility()}
        </h2>
        <div
          class="flex flex-col -mt-2 mb-8 md:flex-row gap-4 justify-between items-center w-full m-auto"
        >
          <!-- Gauge -->
          <div
            class="invisible max-w-56 max-h-56 mx-auto md:mx-0 ml-auto"
          ></div>

          <div
            class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 m-auto"
            use:highcharts={configIV}
          ></div>

          <!-- Stats -->
          <div
            class="grid grid-cols-2 gap-8 p-3 sm:p-0 text-[1rem] w-full sm:w-[50%]"
          >
            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_iv_30d_label()}</span>
                <InfoModal
                  id="iv-30d-info"
                  content={m.stock_detail_options_info_iv_30d()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{ivData?.current ? ivData?.current + "%" : "n/a"}</span
                >
              {:else}
                <a
                  href="/pricing"
                  class="mt-1 inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 transition"
                >
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_iv_rank()}</span>
                <InfoModal
                  id="iv-rank-info"
                  content={m.stock_detail_options_info_iv_rank()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]">
                  {ivData?.ivRank
                    ? `${Math?.min(ivData.ivRank, 100)}%`
                    : "< 0.01%"}
                </span>
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_historical_volatility()}</span>
                <InfoModal
                  id="historical-vol-info"
                  content={m.stock_detail_options_info_historical_vol()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{ivData?.historicalVolatility
                    ? ivData?.historicalVolatility + "%"
                    : "n/a"}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col whitespace-nowrap">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_iv_low()}</span>
                <InfoModal
                  id="iv-low-info"
                  content={m.stock_detail_options_info_iv_low()}
                />
              </div>
              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{ivData?.ivLow ? ivData?.ivLow + "%" : "n/a"} on {ivData?.ivLowDate}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col whitespace-nowrap">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_iv_high()}</span>
                <InfoModal
                  id="iv-high-info"
                  content={m.stock_detail_options_info_iv_high()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{ivData?.ivHigh ? ivData?.ivHigh + "%" : "n/a"} on {ivData?.ivHighDate}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>
          </div>
        </div>

        <a
          href={`/${assetType}/${ticker}/options/oi`}
          class="inline-flex items-center mb-6"
          ><h2
            class=" text-xl sm:text-2xl font-bold w-fit sm:hover:underline sm:hover:underline-offset-4"
          >
            {m.stock_detail_options_oi_heading()}
          </h2>
          <svg
            class="size-6 sm:size-7 mt-1"
            viewBox="0 0 20 20"
            fill="currentColor"
            style="max-width:40px"
            aria-hidden="true"
            ><path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            ></path></svg
          ></a
        >

        <div
          class="flex flex-col -mt-2 mb-8 md:flex-row gap-4 justify-between items-center w-full m-auto"
        >
          <!-- Gauge -->
          <div
            class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
            use:highcharts={configOI}
          ></div>

          <div
            class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
            use:highcharts={configOIPutCall}
          ></div>

          <!-- Stats -->
          <div
            class="grid grid-cols-2 gap-8 p-3 sm:p-0 text-[1rem] w-full sm:w-[50%]"
          >
            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_today_oi()}</span>
                <InfoModal
                  id="oi-today-info"
                  content={m.stock_detail_options_info_oi_today()}
                />
              </div>
              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{oiData?.total?.toLocaleString("en-US")}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_put_call_ratio()}</span>
                <InfoModal
                  id="oi-pc-ratio-info"
                  content={m.stock_detail_options_info_oi_pc_ratio()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{oiData?.putCallRatio}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_put_oi()}</span>
                <InfoModal
                  id="put-oi-info"
                  content={m.stock_detail_options_info_put_oi()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{oiData?.puts?.toLocaleString("en-US")}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_call_oi()}</span>
                <InfoModal
                  id="call-oi-info"
                  content={m.stock_detail_options_info_call_oi()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{oiData?.calls?.toLocaleString("en-US")}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_oi_avg_30d()}</span>
                <InfoModal
                  id="oi-avg-info"
                  content={m.stock_detail_options_info_oi_avg()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{oiData?.avgDaily?.toLocaleString("en-US")}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_today_vs_oi_avg()}</span>
                <InfoModal
                  id="oi-today-vs-avg-info"
                  content={m.stock_detail_options_info_oi_vs_avg()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{oiData?.todayVsAvg ? oiData?.todayVsAvg + "%" : "n/a"}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>
          </div>
        </div>

        <a
          href={`/${assetType}/${ticker}/options/hottest-contracts/volume`}
          class="inline-flex items-center mb-6"
          ><h2
            class=" text-xl sm:text-2xl font-bold w-fit sm:hover:underline sm:hover:underline-offset-4"
          >
            {m.stock_detail_options_volume_heading()}
          </h2>
          <svg
            class="size-6 sm:size-7 mt-1"
            viewBox="0 0 20 20"
            fill="currentColor"
            style="max-width:40px"
            aria-hidden="true"
            ><path
              fill-rule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            ></path></svg
          ></a
        >

        <div
          class="flex flex-col -mt-2 mb-8 md:flex-row gap-4 justify-between items-center w-full"
        >
          <!-- Gauge -->
          <div
            class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
            use:highcharts={configVolume}
          ></div>

          <div
            class="w-fit max-w-56 max-h-56 mx-auto md:mx-0 ml-auto flex-shrink-0"
            use:highcharts={configVolumePutCall}
          ></div>

          <!-- Stats -->
          <div
            class="grid grid-cols-2 gap-8 p-3 sm:p-0 text-[1rem] w-full sm:w-[50%]"
          >
            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_today_volume()}</span>
                <InfoModal
                  id="vol-today-info"
                  content={m.stock_detail_options_info_vol_today()}
                />
              </div>
              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{volData?.total?.toLocaleString("en-US")}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_put_call_ratio()}</span>
                <InfoModal
                  id="vol-pc-ratio-info"
                  content={m.stock_detail_options_info_vol_pc_ratio()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{volData?.putCallRatio}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_put_volume()}</span>
                <InfoModal
                  id="put-vol-info"
                  content={m.stock_detail_options_info_put_vol()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{volData?.puts?.toLocaleString("en-US")}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_call_volume()}</span>
                <InfoModal
                  id="call-vol-info"
                  content={m.stock_detail_options_info_call_vol()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{volData?.calls?.toLocaleString("en-US")}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_volume_avg_30d()}</span>
                <InfoModal
                  id="vol-avg-info"
                  content={m.stock_detail_options_info_vol_avg()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{volData?.avgDaily?.toLocaleString("en-US")}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>{m.stock_detail_options_today_vs_vol_avg()}</span>
                <InfoModal
                  id="vol-today-vs-avg-info"
                  content={m.stock_detail_options_info_vol_vs_avg()}
                />
              </div>

              {#if isSubscribed}
                <span class="font-semibold text-sm sm:text-[1rem]"
                  >{volData?.todayVsAvg
                    ? volData?.todayVsAvg + "%"
                    : "n/a"}</span
                >
              {:else}
                <a href="/pricing" class={lockLinkClass}>
                  <svg
                    class="w-4 h-4 mb-1 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                    />
                  </svg>
                </a>
              {/if}
            </div>
          </div>
        </div>

        {#if rawData?.length > 0}
          {#if optionList?.length !== 0}
            <h3
              class="mb-4 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
            >
              {m.stock_detail_options_chain_statistics()}
            </h3>

            <p class="text-sm text-gray-800 dark:text-zinc-300 leading-relaxed">
              {@html m.stock_detail_options_chain_desc({ ticker })}
            </p>

            <div
              class="flex justify-start items-center m-auto overflow-x-auto mt-1"
            >
              <div class="w-full overflow-x-auto">
                <table
                  class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mt-2"
                >
                  <thead
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    <tr>
                      <td class="text-start">{m.stock_detail_options_col_expiration()}</td>
                      <td class="text-end">{m.stock_detail_options_col_call_vol()}</td>
                      <td class="text-end">{m.stock_detail_options_col_put_vol()}</td>
                      <td class="text-end">{m.stock_detail_options_col_pc_vol()}</td>
                      <td class="text-end">{m.stock_detail_options_col_call_oi()}</td>
                      <td class="text-end">{m.stock_detail_options_col_put_oi()}</td>
                      <td class="text-end">{m.stock_detail_options_col_pc_oi()}</td>
                      <td class="text-end">{m.stock_detail_options_col_iv()}</td>
                      <td class="text-end">{m.stock_detail_options_col_max_pain()}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {#each optionList as item}
                      <tr class="transition-colors">
                        <td class="text-sm text-start whitespace-nowrap">
                          {formatDate(item?.expiration)}
                        </td>

                        <td class="text-sm text-end">
                          {item?.callVol?.toLocaleString("en-US")}
                        </td>

                        <td class="text-sm text-end">
                          {item?.putVol?.toLocaleString("en-US")}
                        </td>

                        <td class="text-sm text-end">
                          {item?.pcVol}
                        </td>

                        <td class="text-sm text-end">
                          {item?.callOI?.toLocaleString("en-US")}
                        </td>

                        <td class="text-sm text-end">
                          {item?.putOI?.toLocaleString("en-US")}
                        </td>

                        <td class="text-sm text-end">
                          {item?.pcOI}
                        </td>

                        <td class="text-sm text-end">
                          {item?.avgIV ? item?.avgIV + "%" : "n/a"}
                        </td>

                        <td class="text-sm text-end">
                          {item?.maxPain}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</section>
