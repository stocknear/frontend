<script lang="ts">
  import { abbreviateNumber } from "$lib/utils";
  import { stockTicker, getCache, setCache } from "$lib/store";

  import { mode } from "mode-watcher";
  import { onMount } from "svelte";
  import tippy from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import highcharts from "$lib/highcharts.ts";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import BarChart from "lucide-svelte/icons/chart-column-increasing";
  import LineChart from "lucide-svelte/icons/chart-spline";

  export let data: any[];
  export let fields: { label: string; key: string }[];

  let config = null;

  let chartMode = "bar";

  let modalLabel;
  let highestValue;
  let highestValueDate;
  let lowestValueDate;
  let lowestValue;

  let currentLabel;
  let currentKey;

  // Store references to info icon elements
  let infoElements: { [key: string]: HTMLElement } = {};

  const marginKeys = new Set([
    /*
    "pretaxProfitMargin",
    "freeCashFlowMargin",
    "grossProfitMargin",
    "netProfitMargin",
    "operatingProfitMargin",
    "ebitdaMargin",
    */
  ]);

  // Precompute fields with an additional flag
  $: computedFields = fields.map((field) => ({
    ...field,
    isMargin: marginKeys.has(field.key),
  }));

  // Helper to format the cell value
  function formatValue(
    value: number | null | undefined,
    isMargin: boolean,
  ): string {
    if (value === null || value === undefined || value === 0) {
      return "n/a";
    }
    const formatted = abbreviateNumber(value.toFixed(2));
    return isMargin ? formatted + "%" : formatted;
  }

  function plotData(label, key) {
    // Sort by fiscalYear
    const rawData = [...data]?.sort((a, b) => a?.fiscalYear - b?.fiscalYear);

    // Filter out entries with undefined/null values
    const filteredData = rawData.filter(
      (item) => item?.[key] !== undefined && item?.[key] !== null,
    );

    const dateList = filteredData.map((item) =>
      item?.period === "FY"
        ? item?.fiscalYear
        : `${item?.period} FY ${item?.fiscalYear}`,
    );

    const valueList = filteredData.map((item) => item[key]);

    // Calculate highest and lowest value
    highestValue = null;
    lowestValue = null;
    highestValueDate = null;
    lowestValueDate = null;

    if (valueList?.length > 0) {
      highestValue = Math.max(...valueList);
      lowestValue = Math.min(...valueList);

      const highestValueIndex = valueList.indexOf(highestValue);
      const lowestValueIndex = valueList.indexOf(lowestValue);

      highestValueDate = dateList[highestValueIndex] || null;
      lowestValueDate = dateList[lowestValueIndex] || null;
    }

    if (valueList?.length >= 5) {
      const firstValue = valueList[valueList.length - 5];
      const lastValue = valueList[valueList.length - 1];
    }

    const options = {
      chart: {
        type: chartMode === "bar" ? "column" : "spline",
        backgroundColor: $mode === "light" ? "#fff" : "#2A2E39",
        plotBackgroundColor: $mode === "light" ? "#fff" : "#2A2E39",
        height: 360,
        animation: false,
      },
      credits: { enabled: false },
      legend: { enabled: false },
      plotOptions: {
        series: {
          color: "white",
          animation: false,
          dataLabels: {
            enabled: false,
            color: "white",
            style: { fontSize: "13px", fontWeight: "bold" },
            formatter: function () {
              return abbreviateNumber(this?.y);
            },
          },
        },
      },
      title: {
        text: `<h3 class="mt-3 mb-1 sm:text-lg">${$stockTicker} ${label}</h3>`,
        useHTML: true,
        style: { color: $mode === "light" ? "black" : "white" },
      },
      xAxis: {
        categories: dateList,
        crosshair: {
          color: $mode === "light" ? "black" : "white",
          width: 1,
          dashStyle: "Solid",
        },
        labels: {
          style: { color: $mode === "light" ? "#545454" : "white" },
          rotation: -45,
          distance: 10,
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#404657",
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          formatter: function () {
            return abbreviateNumber(this.value);
          },
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
        style: { color: "#fff", fontSize: "16px", padding: "10px" },
        borderRadius: 4,
        formatter: function () {
          let tooltipContent = `<span class="text-white text-[1rem] font-[501]">${this?.x}</span><br>`;
          this.points.forEach((point) => {
            tooltipContent += `<span class="text-white font-semibold text-sm">${point.series.name}:</span>
          <span class="text-white font-normal text-sm">${abbreviateNumber(
            point.y?.toFixed(2),
          )}</span><br>`;
          });
          return tooltipContent;
        },
      },
      series: [
        {
          name: label,
          data: valueList,
          color: $mode === "light" ? "#2C6288" : "white",
          borderColor: $mode === "light" ? "#2C6288" : "white",
          borderRadius: "1px",
          animation: false,
        },
      ],
    };

    return options;
  }

  async function handleChart(label, key) {
    modalLabel = label;
    currentLabel = label; // Add this
    currentKey = key; // Add this
    config = plotData(label, key);
  }

  async function getInfoText(parameter) {
    const cachedData = getCache(parameter, "getInfoText");
    if (cachedData) {
      return cachedData;
    }

    const postData = { parameter };
    const response = await fetch("/api/info-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const infoText = await response.json();
    setCache(parameter, infoText, "getInfoText");
    return infoText;
  }

  onMount(() => {
    // Initialize tippy for all info elements
    Object.entries(infoElements).forEach(([key, element]) => {
      if (!element) return;

      const field = fields.find((f) => f.key === key);
      if (!field) return;

      tippy(element, {
        trigger: "mouseenter focus",
        placement: "bottom",
        theme: "light-border",
        allowHTML: true,
        interactive: true,
        delay: [200, 100],
        onShow: async (instance) => {
          instance.setContent("Loading…");
          try {
            const content = await getInfoText(key);
            instance.setContent(`
              <div class="text-white w-full mb-3">
                <h4 class="font-bold mb-1 text-[1rem] w-full">${field.label}</h4>
                <p>${content?.text || "n/a"}</p>
                ${
                  content?.equation
                    ? `<div class="mt-4 pt-2 text-sm border-t border-gray-600 w-fit">${content?.equation}</div>`
                    : ""
                }
              </div>
            `);
          } catch (error) {
            instance.setContent(`
              <div class="text-white w-full mb-3">
                <h4 class="font-bold mb-1 text-[1rem] w-full">${field.label}</h4>
                <p>Error loading information</p>
              </div>
            `);
          }
        },
      });
    });
  });

  function toggleMode() {
    if (chartMode === "bar") {
      chartMode = "line";
    } else {
      chartMode = "bar";
    }
    // Re-render the chart with the new mode
    if (currentLabel && currentKey) {
      config = plotData(currentLabel, currentKey);
    }
  }
</script>

{#each computedFields as { label, key, isMargin } (key)}
  <tr
    class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-odd whitespace-nowrap border"
  >
    <td
      class="text-start min-w-[220px] sm:min-w-[320px] text-sm sm:text-[1rem] border-r border-gray-300 dark:border-gray-800 w-full flex flex-row items-center justify-between"
    >
      <div
        bind:this={infoElements[key]}
        class="truncate w-fit max-w-40 sm:max-w-64 cursor-text flex items-center"
      >
        <span class="truncate">{label}</span>
      </div>

      <label
        for="financialPlotModal"
        on:click={() => handleChart(label, key)}
        class="cursor-pointer inline-block"
      >
        <svg
          class="w-5 h-5 text-gray-500 dark:text-gray-300"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
            id="SVGRepo_tracerCarrier"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></g><g id="SVGRepo_iconCarrier">
            <path
              d="M9 12H4.6C4.03995 12 3.75992 12 3.54601 12.109C3.35785 12.2049 3.20487 12.3578 3.10899 12.546C3 12.7599 3 13.0399 3 13.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H9M9 21H15M9 21L9 8.6C9 8.03995 9 7.75992 9.10899 7.54601C9.20487 7.35785 9.35785 7.20487 9.54601 7.10899C9.75992 7 10.0399 7 10.6 7H13.4C13.9601 7 14.2401 7 14.454 7.10899C14.6422 7.20487 14.7951 7.35785 14.891 7.54601C15 7.75992 15 8.03995 15 8.6V21M15 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3H16.6C16.0399 3 15.7599 3 15.546 3.10899C15.3578 3.20487 15.2049 3.35785 15.109 3.54601C15 3.75992 15 4.03995 15 4.6V8"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </g></svg
        >
      </label>
    </td>
    {#each data as item}
      <td
        class="text-sm sm:text-[1rem] text-end border-r border-gray-300 dark:border-gray-800"
      >
        {formatValue(item[key], isMargin)}
      </td>
    {/each}
  </tr>
{/each}

<input type="checkbox" id="financialPlotModal" class="modal-toggle" />
<dialog id="financialPlotModal" class="modal px-3">
  <label for="financialPlotModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full max-w-3xl p-6 rounded shadow-lg border
        bg-white dark:bg-secondary border border-gray-600 dark:border-gray-800"
  >
    {#if config}
      <div class="flex justify-end items-center w-full">
        <Button
          on:click={toggleMode}
          class="w-fit border-gray-300 dark:border-gray-600 border bg-black sm:hover:bg-default text-white dark:text-black dark:bg-white dark:sm:hover:bg-gray-100 ease-out  flex flex-row justify-between items-center px-3 py-1.5  rounded truncate"
        >
          {#if chartMode === "bar"}
            <LineChart class="w-4.5 h-4.5" />
            <span class="ml-1 mr-auto text-sm"> Line Chart </span>
          {:else}
            <BarChart class="w-4.5 h-4.5" />
            <span class="ml-1 mr-auto text-sm"> Bar Chart </span>
          {/if}</Button
        >
      </div>

      <div class="mt-2" use:highcharts={config}></div>
    {/if}
    <p class="text-sm mb-6">
      {modalLabel} peaked at
      <strong>{abbreviateNumber(highestValue?.toFixed(2))}</strong>
      in <strong>{highestValueDate}</strong>
      and hit its lowest at
      <strong>{abbreviateNumber(lowestValue?.toFixed(2))}</strong>
      in <strong>{lowestValueDate}</strong>.
    </p>

    <div class="border-t border-gray-300 dark:border-gray-600 mt-2 w-full">
      <label
        for="financialPlotModal"
        class="mt-4 font-semibold text-xl m-auto flex justify-center cursor-pointer"
      >
        Close
      </label>
    </div>
  </div>
</dialog>
