<script>
  import { ColorType } from "lightweight-charts";
  import { Chart, BaselineSeries, PriceLine } from "svelte-lightweight-charts";
  import { screenWidth, etfTicker } from "$lib/store";
  import { goto } from "$app/navigation";

  export let title;
  export let priceData;
  export let changesPercentage;
  export let previousClose;

  const topLineColor = "#71CA96";
  const topFillColor1 = "rgba( 38, 166, 154, 0.2)";
  const bottomLineColor = "#FF7070";
  const bottomFillColor1 = "rgba(239, 83, 80, 0.2)";

  let width = $screenWidth < 640 ? 80 : $screenWidth < 1500 ? 150 : 220; //= ($screenWidth <= 1200 && $screenWidth > 900) ? 360 : ($screenWidth <= 900 && $screenWidth > 700) ? 260 : ($screenWidth <= 700 && $screenWidth >=600 ) ? 200 : ($screenWidth < 600 && $screenWidth >=500 ) ? 150 : 80;

  //Initial height of graph
  let height = $screenWidth < 640 ? 50 : 60;

  let observer;
  let ref;
  let chart;

  ref = (element) => {
    if (observer) {
      observer?.disconnect();
    }
    if (!element) {
      return;
    }

    observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    });
    observer.observe(element);
  };

  const THEMES = {
    Dark: {
      chart: {
        layout: {
          background: {
            type: ColorType.Solid,
            color: "#09090B",
          },
          lineColor: "#2B2B43",
          textColor: "#D9D9D9",
        },
        crosshair: {
          mode: 2,
        },
        grid: {
          vertLines: {
            visible: false,
          },
          horzLines: {
            visible: false,
          },
        },
      },

      series: {
        baseValue: { type: "price", price: priceData?.at(0)?.value },
        priceLineVisible: false,
        baseLineVisible: true,
        baseLineColor: "#B2B5BE",
        baseLineWidth: 1,
        baseLineStyle: 1,
        lineWidth: 1.5,
      },
    },
  };

  const AVAILABLE_THEMES = Object?.keys(THEMES);

  let selected = AVAILABLE_THEMES[0];
  $: theme = THEMES[selected];

  const options = {
    width: width,
    height: height,
    rightPriceScale: {
      visible: false,
    },
    timeScale: {
      borderColor: "#FFFFFF",
      textColor: "#FFFFFF",
      visible: false,
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    handleScale: {
      mouseWheel: false,
    },
    handleScroll: {
      mouseWheel: false,
      horzTouchDrag: false,
      vertTouchDrag: false,
      pressedMouseMove: false,
    },
  };

  function etfSelector() {
    if (title === "S&P500") {
      etfTicker.update((value) => "SPY");
      goto("/etf/SPY");
    } else if (title === "Nasdaq") {
      etfTicker.update((value) => "QQQ");
      goto("/etf/QQQ");
    } else if (title === "Dow") {
      etfTicker.update((value) => "DIA");
      goto("/etf/DIA");
    } else if (title === "Russel") {
      etfTicker.update((value) => "IWM");
      goto("/etf/IWM");
    }
  }

  $: {
    if (chart && typeof window !== "undefined") {
      chart?.timeScale()?.fitContent();
    }
  }
</script>

<label
  on:click={etfSelector}
  class="sm:hover:border-[#3C74D4] duration-100 transition ease-in-out cursor-pointer flex flex-row items-center rounded-md shadow-lg border border-gray-600 bg-default"
>
  <div class="flex flex-col items-center lg:mr-5">
    <span
      class="text-white font-semibold text-xs w-20 text-start pl-3 uppercase"
      >{title}</span
    >
    <div class="flex flex-row mt-1 items-center">
      {#if changesPercentage >= 0}
        <svg
          class="w-4 h-4 -mr-0.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><g id="evaArrowUpFill0"
            ><g id="evaArrowUpFill1"
              ><path
                id="evaArrowUpFill2"
                fill="#00FC50"
                d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"
              /></g
            ></g
          ></svg
        >
        <span class="text-[#00FC50] text-xs"
          >+{changesPercentage?.toFixed(2)}%</span
        >
      {:else}
        <svg
          class="w-4 h-4 -mr-0.5 rotate-180"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><g id="evaArrowUpFill0"
            ><g id="evaArrowUpFill1"
              ><path
                id="evaArrowUpFill2"
                fill="#FF2F1F"
                d="M16.21 16H7.79a1.76 1.76 0 0 1-1.59-1a2.1 2.1 0 0 1 .26-2.21l4.21-5.1a1.76 1.76 0 0 1 2.66 0l4.21 5.1A2.1 2.1 0 0 1 17.8 15a1.76 1.76 0 0 1-1.59 1Z"
              /></g
            ></g
          ></svg
        >
        <span class="text-[#FF2F1F] text-xs"
          >{changesPercentage?.toFixed(2)}%
        </span>
      {/if}
    </div>
  </div>
  <Chart
    {...options}
    {...theme.chart}
    autoSize={true}
    ref={(ref) => (chart = ref)}
  >
    <BaselineSeries
      data={priceData}
      {...theme.series}
      {topLineColor}
      {topFillColor1}
      {bottomLineColor}
      {bottomFillColor1}
    >
      <PriceLine price={priceData?.at(0)?.value} lineWidth={1} color="#fff" />
    </BaselineSeries>
  </Chart>
</label>
