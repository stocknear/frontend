<script lang="ts">
  import { mode } from "mode-watcher";
  import { onMount } from "svelte";
  import highcharts from "$lib/highcharts.ts";
  import { abbreviateNumber } from "$lib/utils";
  import InfoModal from "$lib/components/InfoModal.svelte";

  export let data;
  export let ticker;
  export let assetType;

  let overview = data?.getOptionsChainStatistics?.overview;
  let ivData = data?.getOptionsChainStatistics?.impliedVolatility;
  let oiData = data?.getOptionsChainStatistics?.openInterest;
  let volData = data?.getOptionsChainStatistics?.volume;

  let rawData = data?.getOptionsChainStatistics?.table;
  let optionList = rawData?.slice(0, 100);

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
        text: `<h3 class="">IV (30d)</h3>`,
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
        text: `<h3 class="">Open Interest</h3>`,
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
        text: `<h3 class="">Put-Call Ratio</h3>`,
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
        text: `<h3 class="">Volume</h3>`,
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
        text: `<h3 class="">Put-Call Ratio</h3>`,
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
              {ticker} Option Overview
            </h2>
            <div class="ml-1 -mt-3">
              <InfoModal
                id="opra-data-info"
                title="Realtime OPRA Options Data"
                content="Unlock realtime options flow, trades, and market insights for this stock — sourced directly from the Options Price Reporting Authority (OPRA)."
              />
            </div>
          </div>

          <p class="mt-4">
            Overview for all option chains of <strong>{ticker}</strong>. As of
            <strong>{overview?.date}</strong>, <strong>{ticker}</strong>
            options have an IV of
            <strong
              >{overview?.currentIV ? overview?.currentIV + "%" : "n/a"}</strong
            >
            and an IV rank of
            <strong>{overview?.ivRank ? overview?.ivRank + "%" : "n/a"}</strong
            >. The volume is
            <strong>{overview?.totalVolume?.toLocaleString("en-US")}</strong>
            contracts, which is
            <strong
              >{overview?.volumePercentage
                ? overview?.volumePercentage + "%"
                : "n/a"}</strong
            >
            of average daily volume of
            <strong>{overview?.avgDailyVolume?.toLocaleString("en-US")}</strong>
            contracts. The volume put-call ratio is
            <strong>{overview?.putCallRatio}</strong>, indicating a
            <strong>{overview?.sentiment}</strong> sentiment in the market.
          </p>
        </div>

        <!-- Apply the blur class to the chart -->
        <h2 class="mb-6 text-xl sm:text-2xl font-bold w-fit">
          Implied Volatility
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
                <span>Implied Volatility (30d)</span>
                <InfoModal
                  id="iv-30d-info"
                  content="Implied Volatility (IV) estimates how much the market expects a stock to move over the next 30 days. 
              A higher IV suggests more expected movement (often bearish fear or bullish excitement), while a lower IV suggests less expected movement."
                />
              </div>
              <span class="font-semibold text-sm sm:text-[1rem]"
                >{ivData?.current ? ivData?.current + "%" : "n/a"}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>IV Rank</span>
                <InfoModal
                  id="iv-rank-info"
                  content="IV Rank shows how current Implied Volatility (IV) compares to its past levels.  
High IV Rank means IV is high compared to the past — often seen as bearish (fear) or an opportunity to sell options.  
Low IV Rank means IV is low — often seen as bullish (calm) or an opportunity to buy options."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]">
                {ivData?.ivRank
                  ? `${Math?.min(ivData.ivRank, 100)}%`
                  : "< 0.01%"}
              </span>
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Historical Volatility</span>
                <InfoModal
                  id="historical-vol-info"
                  content="Historical Volatility shows how much a stock’s price fluctuated over the past 30 days.  
              High volatility means the stock experienced large price swings — often considered riskier.  
              Low volatility means the stock moved more steadily — often considered less risky."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{ivData?.historicalVolatility
                  ? ivData?.historicalVolatility + "%"
                  : "n/a"}</span
              >
            </div>

            <div class="flex flex-col whitespace-nowrap">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>IV Low</span>
                <InfoModal
                  id="iv-low-info"
                  content="IV Low shows the lowest Implied Volatility (IV) level reached in the past 12 months.  
              A very low IV can signal calm markets or complacency — often seen as bullish for the stock but may indicate limited option premiums."
                />
              </div>
              <span class="font-semibold text-sm sm:text-[1rem]"
                >{ivData?.ivLow ? ivData?.ivLow + "%" : "n/a"} on {ivData?.ivLowDate}</span
              >
            </div>

            <div class="flex flex-col whitespace-nowrap">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>IV High</span>
                <InfoModal
                  id="iv-high-info"
                  content="IV High shows the highest Implied Volatility (IV) level reached in the past 12 months.  
            A very high IV can signal fear or uncertainty — often seen as bearish for the stock but may offer higher option premiums."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{ivData?.ivHigh ? ivData?.ivHigh + "%" : "n/a"} on {ivData?.ivHighDate}</span
              >
            </div>
          </div>
        </div>

        <a
          href={`/${assetType}/${ticker}/options/oi`}
          class="inline-flex items-center mb-6"
          ><h2
            class=" text-xl sm:text-2xl font-bold w-fit sm:hover:underline sm:hover:underline-offset-4"
          >
            Open Interest (OI)
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
                <span>Today's Open Interest</span>
                <InfoModal
                  id="oi-today-info"
                  content="Open Interest (OI) is the total number of outstanding options contracts (both calls and puts) that are still open.  
              High OI means more market activity and liquidity.  
              Low OI means less interest and lower liquidity."
                />
              </div>
              <span class="font-semibold text-sm sm:text-[1rem]"
                >{oiData?.total?.toLocaleString("en-US")}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Put-Call Ratio</span>
                <InfoModal
                  id="oi-pc-ratio-info"
                  content="The Open Interest (OI) Put-Call Ratio compares the number of open put contracts to open call contracts.  
A high ratio (>1) suggests more puts than calls — often seen as bearish.  
A low ratio (<1) suggests more calls than puts — often seen as bullish."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{oiData?.putCallRatio}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Put Open Interest</span>
                <InfoModal
                  id="put-oi-info"
                  content="Put Open Interest is the total number of open put option contracts on a stock.  
            High put OI suggests more traders are buying protection or betting on a decline — often seen as bearish.  
            Low put OI suggests less demand for downside protection — often seen as bullish or neutral."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{oiData?.puts?.toLocaleString("en-US")}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Call Open Interest</span>
                <InfoModal
                  id="call-oi-info"
                  content="Call Open Interest is the total number of open call option contracts on a stock.  
            High call OI suggests more traders expect the stock to rise or are speculating — often seen as bullish.  
            Low call OI suggests less demand for upside bets — often seen as bearish or neutral."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{oiData?.calls?.toLocaleString("en-US")}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Open Interest Avg (30-day)</span>
                <InfoModal
                  id="oi-avg-info"
                  content="The average Open Interest over the past 30 days shows typical market activity in options contracts."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{oiData?.avgDaily?.toLocaleString("en-US")}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Today vs Open Interest Avg (30-day)</span>
                <InfoModal
                  id="oi-today-vs-avg-info"
                  content="This compares today's Open Interest to the 30-day average.  
            Higher today’s OI than average suggests increased trader interest or unusual activity — possibly signaling a bigger move.  
            Lower today’s OI than average suggests less activity or fading interest."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{oiData?.todayVsAvg ? oiData?.todayVsAvg + "%" : "n/a"}</span
              >
            </div>
          </div>
        </div>

        <a
          href={`/${assetType}/${ticker}/options/hottest-contracts/volume`}
          class="inline-flex items-center mb-6"
          ><h2
            class=" text-xl sm:text-2xl font-bold w-fit sm:hover:underline sm:hover:underline-offset-4"
          >
            Option Volume
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
                <span>Today's Volume</span>
                <InfoModal
                  id="vol-today-info"
                  content="Today's Volume is the total number of options contracts (calls and puts) traded during the current trading day.  
              High volume shows strong market activity and interest.  
              Low volume suggests less trading and lower interest."
                />
              </div>
              <span class="font-semibold text-sm sm:text-[1rem]"
                >{volData?.total?.toLocaleString("en-US")}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Put-Call Ratio</span>
                <InfoModal
                  id="vol-pc-ratio-info"
                  content="The Put-Call Ratio compares the volume of traded put options to call options during a period.  
A high ratio (>1) means more puts traded — often seen as bearish sentiment.  
A low ratio (<1) means more calls traded — often seen as bullish sentiment."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{volData?.putCallRatio}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Put Volume</span>
                <InfoModal
                  id="put-vol-info"
                  content="Put Volume is the total number of put option contracts traded today.  
              High put volume suggests many traders are buying protection or betting on a decline — often seen as bearish.  
              Low put volume suggests less demand for downside protection — often seen as bullish or neutral."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{volData?.puts?.toLocaleString("en-US")}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Call Volume</span>
                <InfoModal
                  id="call-vol-info"
                  content="Call Volume is the total number of call option contracts traded today.  
              High call volume suggests many traders expect the stock to rise or are speculating — often seen as bullish.  
              Low call volume suggests less demand for upside bets — often seen as bearish or neutral."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{volData?.calls?.toLocaleString("en-US")}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Volume Avg (30-day)</span>
                <InfoModal
                  id="vol-avg-info"
                  content="The average Volume over the past 30 days shows typical market activity in options contracts."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{volData?.avgDaily?.toLocaleString("en-US")}</span
              >
            </div>

            <div class="flex flex-col">
              <div
                class="text-gray-500 dark:text-gray-300 text-sm sm:text-[1rem] flex flex-row items-center gap-x-2"
              >
                <span>Today vs Volume Avg (30-day)</span>
                <InfoModal
                  id="vol-today-vs-avg-info"
                  content="This compares today's trading volume to the 30-day average volume.  
Higher volume today than average suggests increased trader interest or unusual activity — possibly signaling a bigger move.  
Lower volume today than average suggests less activity or fading interest."
                />
              </div>

              <span class="font-semibold text-sm sm:text-[1rem]"
                >{volData?.todayVsAvg ? volData?.todayVsAvg + "%" : "n/a"}</span
              >
            </div>
          </div>
        </div>

        {#if rawData?.length > 0}
          {#if optionList?.length !== 0}
            <h3
              class="mb-4 text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white w-fit"
            >
              Option Chain Statistics
            </h3>

            <p class="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              This table provides a comprehensive overview of all <strong
                >{ticker}</strong
              >
              options grouped by their expiration dates.
            </p>

            <div
              class="flex justify-start items-center m-auto overflow-x-auto mt-1"
            >
              <div
                class="w-full overflow-hidden rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 mt-3"
              >
                <table
                  class="table table-sm table-compact w-full text-gray-700 dark:text-zinc-200 tabular-nums m-auto"
                >
                  <thead
                    class="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    <tr>
                      <td class="text-start">Expiration</td>
                      <td class="text-end">Call Vol</td>
                      <td class="text-end">Put Vol</td>
                      <td class="text-end">P/C Vol</td>
                      <td class="text-end">Call OI</td>
                      <td class="text-end">Put OI</td>
                      <td class="text-end">P/C OI</td>
                      <td class="text-end">Implied Volatility</td>
                      <td class="text-end">Max Pain</td>
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
