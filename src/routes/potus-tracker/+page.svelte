<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import highcharts from "$lib/highcharts.ts";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { sectorList } from "$lib/utils";
  import avatar from "$lib/images/trump-avatar.jpeg";
  import { mode } from "mode-watcher";
  import { goto } from "$app/navigation";
  //import html2canvas from "html2canvas-pro";
  import Tutorial from "$lib/components/Tutorial.svelte";

  export let data;

  let postContent = "n/a";
  let postDate = "n/a";
  let postUrl = "#";
  let postTitle = "n/a";
  let postSentiment = "n/a";

  const updatedSectorList = ["S&P500", ...sectorList];

  let rawData = data?.getData?.history || [];
  let posts = data?.getData?.posts || [];
  let executiveOrders = data?.getData?.executiveOrders || [];
  let selectedSector = "S&P500";
  const sectorDict = {
    "S&P500": "SPY",
    "Basic Materials": "XLB",
    "Communication Services": "XLC",
    Energy: "XLE",
    "Financial Services": "XLF",
    Industrials: "XLI",
    Technology: "XLK",
    "Consumer Defensive": "XLP",
    "Real Estate": "XLRE",
    Utilities: "XLU",
    Healthcare: "XLV",
    "Consumer Cyclical": "XLY",
  };

  const groupedByDate = rawData?.reduce((acc, item) => {
    const dateKey = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(item?.date));

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  let groupedOrders = executiveOrders?.reduce((acc, item) => {
    const dateKey = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(item.date));

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const tabs = [
    {
      title: "Presidential Schedule",
    },
    {
      title: "Executive Orders",
    },
    {
      title: "Truth Social Post",
    },
  ];

  let activeIdx = 0;

  function latestInfoDate(inputDate) {
    // Create a Date object for the input date and convert it to New York time zone
    const inputDateLocal = new Date(inputDate).toLocaleString("en-US", {
      timeZone: "America/New_York",
    });

    // Get the current date and time in New York timezone
    const todayLocal = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });

    // Convert the localized strings back to Date objects
    const inputDateMs = new Date(inputDateLocal).getTime();
    const todayMs = new Date(todayLocal).getTime();

    // Calculate the difference in milliseconds
    const differenceInMs = todayMs - inputDateMs;

    // Convert milliseconds to days
    const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));

    // Return whether the difference is less than or equal to 1 day
    return differenceInDays <= 2;
  }

  function plotData() {
    // Transform raw data into arrays for Highcharts
    const rawData =
      data?.getData?.marketPerformance[sectorDict[selectedSector]];

    // Convert data into arrays for Highcharts
    const categories = Object.keys(rawData);
    const values = Object.values(rawData);

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
        text: `<h3 class="mt-3 mb-1 text-[1rem] sm:text-xl">${selectedSector} - Performance</h3>`,
        style: {
          color: $mode === "light" ? "black" : "white",
        },
        useHTML: true,
      },
      xAxis: {
        categories: categories,
        gridLineWidth: 0,
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
        },
      },
      yAxis: {
        gridLineWidth: 1,
        gridLineColor: $mode === "light" ? "#e5e7eb" : "#111827",
        labels: {
          style: { color: $mode === "light" ? "black" : "white" },
          formatter: function () {
            return this.value + "%"; // Add percentage symbol
          },
        },
        title: { text: null },
        opposite: true,
      },
      tooltip: {
        enabled: false,
      },
      plotOptions: {
        series: {
          color: $mode === "light" ? "black" : "white",
          animation: false,
          dataLabels: {
            enabled: true,
            color: $mode === "light" ? "black" : "white",
            style: {
              fontSize: "14px",
              fontWeight: "normal",
            },
            formatter: function () {
              return this.y.toFixed(2) + "%"; // Add percentage symbol
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: "Performance",
          data: values,
          zones: [
            {
              value: 0, // Values below 0
              color: "#E02424", // Red
              borderRadius: "0px",
              borderColor: "#E02424", // Red border
            },
            {
              color: "#10B981", // Green for values 0 and above
              borderColor: "#10B981", // Green border
              borderRadius: "0px",
            },
          ],
        },
      ],
    };

    return options;
  }

  let config = null;
  /*
  async function captureScreenshot(index) {
    const postElement = document.querySelector(`#post-${index}`);

    // Clone the element to avoid modifying the original
    const clonedElement = postElement.cloneNode(true);

    // Create a temporary container for the clone with fixed dimensions and styling
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Force light mode styling explicitly
    clonedElement.style.cssText =
      "background-color: white !important; color: black !important;";

    // Process all elements recursively to ensure text visibility
    function forceVisibleText(element) {
      // Apply styles directly
      element.style.cssText +=
        "; color: black !important; background-color: white !important; border-color: #ccc !important;";

      // For SVG elements, ensure they're visible
      if (
        element.tagName.toLowerCase() === "svg" ||
        element.tagName.toLowerCase() === "path"
      ) {
        element.style.cssText +=
          "; fill: #333 !important; stroke: #333 !important;";
      }

      // Remove problematic classes completely instead of just removing dark: prefix
      if (element.classList) {
        const classesToRemove = [];
        element.classList.forEach((cls) => {
          if (
            cls.includes("dark:") ||
            cls.includes("text-gray") ||
            cls.includes("text-white")
          ) {
            classesToRemove.push(cls);
          }
        });
        classesToRemove.forEach((cls) => element.classList.remove(cls));

        // Add explicit light mode classes
        element.classList.add("text-black");
      }

      // Process all child elements
      if (element.children && element.children.length > 0) {
        Array.from(element.children).forEach((child) =>
          forceVisibleText(child),
        );
      }
    }

    // Apply the text visibility fix to all elements
    forceVisibleText(clonedElement);

    // Additional specific fixes for elements that might still have issues
    const allTextElements = clonedElement.querySelectorAll(
      "p, h1, h2, h3, h4, h5, span, a, div, label",
    );
    allTextElements.forEach((el) => {
      el.style.color = "black";
      el.setAttribute(
        "style",
        el.getAttribute("style") + "; color: black !important;",
      );
    });

    // Convert any CSS variables that might affect color
    const computed = window.getComputedStyle(postElement);
    const cssText =
      ":root { --text-color: black !important; --background-color: white !important; }";
    const style = document.createElement("style");
    style.textContent = cssText;
    clonedElement.appendChild(style);

    // Wait a bit to ensure styles are applied
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Capture screenshot
    try {
      const canvas = await html2canvas(clonedElement, {
        backgroundColor: "white",
        logging: true, // Enable logging to help debug
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        removeContainer: false, // Handle cleanup ourselves
      });

      // Convert to image
      const image = canvas.toDataURL("image/png");

      // Create a download link
      const link = document.createElement("a");
      link.href = image;
      link.download = `post-${index}.png`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      document.body.removeChild(tempContainer);

      return image;
    } catch (error) {
      console.error("Screenshot capture failed:", error);
      document.body.removeChild(tempContainer);
      throw error;
    }
  }
    */

  let steps = [
    {
      popover: {
        title: "POTUS Tracker",
        description: `This dashboard tracks the President of the United States in real-time. Get updates on the POTUS schedule, executive orders, signed legislation and official events.`,
        side: "center",
        align: "center",
      },
    },
    {
      element: ".chart-driver",
      popover: {
        title: "Economy Performance",
        description: `Since the inauguration of POTUS on January 20, 2025, the ${selectedSector} has ${data?.getData?.marketPerformance[sectorDict[selectedSector]]["Inauguration"] >= 0 ? "grown" : "declined"} by ${data?.getData?.marketPerformance[sectorDict[selectedSector]]["Inauguration"]}%.`,
        side: "left",
        align: "start",
      },
    },
    {
      element: ".sector-driver",
      popover: {
        title: "All Market Sectors",
        description: `Visual representation of all market sectors performance across multiple timeframes since POTUS inauguration to get a quick snapshot of the sector health.`,
        side: "right",
        align: "start",
      },
    },
    {
      element: ".navbar-driver ul > button:nth-child(1)",
      popover: {
        title: "Presidential Schedule",
        description: `View the President's daily agenda and upcoming events in real-time.`,
        side: "bottom",
        align: "start",
      },
    },
    {
      element: ".navbar-driver ul > button:nth-child(2)",
      popover: {
        title: "Executive Orders",
        description: `Track executive orders signed by President Trump and analyze their potential market impact.`,
        side: "bottom",
        align: "start",
      },
    },
    {
      element: ".navbar-driver ul > button:nth-child(3)",
      popover: {
        title: "Truth Social Posts",
        description: `Monitor the President's latest Truth Social communications that may influence market sentiment.`,
        side: "right",
        align: "start",
      },
    },
    {
      popover: {
        title: "You’re All Set!",
        description:
          "All dashboard panels refresh live—so you’re always on top of how presidential moves impact the market. You’re all set, happy exploring!",
        side: "center",
        align: "center",
      },
    },
  ];

  $: {
    if (selectedSector || $mode) {
      config = plotData() || null;
    }
  }
</script>

<SEO
  title="POTUS Tracker: Real-Time Presidential Schedule, Executive Orders & Market Impact"
  description="Track President Trump's daily schedule, executive orders, and Truth Social posts. Monitor real-time market reactions to presidential actions with S&P 500 and sector performance analytics."
  keywords="POTUS tracker, Trump schedule, executive orders, presidential actions, market impact, Truth Social posts, S&P 500 performance, sector analysis, Trump administration, presidential calendar"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "POTUS Tracker - Stocknear",
    description:
      "Real-time tracking of presidential activities and their market impact",
    applicationCategory: "FinanceApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Presidential schedule tracking",
      "Executive order monitoring",
      "Truth Social post analysis",
      "Market performance correlation",
      "Sector impact analysis",
      "Real-time updates",
    ],
  }}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-muted dark:text-white"
>
  <div class="text-sm sm:text-[1rem] breadcrumbs">
    <ul>
      <li><a href="/" class="text-muted dark:text-gray-300">Home</a></li>
      <li class="text-muted dark:text-gray-300">POTUS Tracker</li>
    </ul>
  </div>

  <div class="w-full flex h-full overflow-hidden">
    <div
      class="w-full relative flex justify-center items-center overflow-hidden"
    >
      <div
        class="relative flex flex-row justify-center items-start overflow-hidden w-full"
      >
        <div class="w-full mt-5">
          <div class="lg:float-left lg:w-[calc(100%-336px-20px)]">
            <div
              class="border-b-[2px] border-[#2C6288] dark:border-white flex flex-row justify-between"
            >
              <h1 class="mb-1 text-2xl sm:text-3xl font-bold">POTUS Tracker</h1>
              <Tutorial {steps} />
            </div>
          </div>

          <div class=" lg:float-left lg:w-[calc(100%-336px-40px)]">
            <div class="mt-5 mb-5">
              <Infobox
                text={`Since the inauguration of Donald J. Trump on January 20, 2025, the 
  ${selectedSector} has ${data?.getData?.marketPerformance[sectorDict[selectedSector]]["Inauguration"] >= 0 ? "grown" : "declined"} by <span class="${data?.getData?.marketPerformance[sectorDict[selectedSector]]["Inauguration"] >= 0 ? "text-green-800 dark:text-[#00FC50] before:content-['+']" : "text-red-800 dark:text-[#FF2F1F]"}">
  ${data?.getData?.marketPerformance[sectorDict[selectedSector]]["Inauguration"] ?? "n/a"}%</span>.`}
              />
            </div>

            <div class="flex flex-row items-center w-fit ml-auto mt-2 sm:mt-0">
              <div class="sector-driver relative inline-block text-left grow">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="shadow w-full border-gray-300 bg-black sm:hover:bg-default text-white  dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out ease-out  flex flex-row justify-between items-center px-3 py-2  rounded truncate"
                    >
                      <span class="truncate">{selectedSector}</span>
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
                    class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                  >
                    <DropdownMenu.Label
                      class="text-muted dark:text-muted dark:text-gray-300"
                    >
                      Select Sector
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Group>
                      {#each updatedSectorList as sector}
                        {#if sector === "S&P500" || ["Pro", "Plus"]?.includes(data?.user?.tier)}
                          <DropdownMenu.Item
                            on:click={() => (selectedSector = sector)}
                            class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                          >
                            {sector}
                          </DropdownMenu.Item>
                        {:else}
                          <DropdownMenu.Item
                            on:click={() => goto("/pricing")}
                            class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                          >
                            {sector}
                            <svg
                              class="ml-1 size-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              style="max-width: 40px;"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clip-rule="evenodd"
                              >
                              </path>
                            </svg>
                          </DropdownMenu.Item>
                        {/if}
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
            </div>

            <div
              class="chart-driver shadow mt-5 border border-gray-300 dark:border-gray-800 rounded"
              use:highcharts={config}
            ></div>

            <nav
              class="navbar-driver border-[#2C6288] dark:border-white border-b-[2px] overflow-x-auto whitespace-nowrap mt-4"
            >
              <ul class="flex flex-row items-center w-full text-[1rem]">
                {#each tabs as item, i}
                  <button
                    on:click={() => (activeIdx = i)}
                    class="p-2 px-5 cursor-pointer {activeIdx === i
                      ? 'text-muted dark:text-white bg-[#EEEEEE] dark:bg-primary/90 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 sm:hover:text-muted dark:sm:hover:text-white sm:hover:bg-[#EEEEEE] dark:sm:hover:bg-primary/90'}"
                  >
                    {item.title}
                  </button>
                {/each}
              </ul>
            </nav>

            {#if activeIdx === 0}
              <h3
                class=" text-lg sm:text-xl font-semibold mb-2 mt-6 border-y border-gray-300 dark:border-gray-800 pt-2 pb-2"
              >
                Official Presidential Schedule
              </h3>
              <div class="">
                <div class="space-y-4">
                  {#each Object?.entries(groupedByDate) as [date, items], indexA}
                    <div class="my-4">
                      <div
                        class="border-b border-gray-300 dark:border-gray-800 pb-2 w-full flex flex-row items-center justify-between"
                      >
                        <span class="text-[1rem] sm:text-lg font-semibold">
                          {date}</span
                        >
                        {#if items?.at(0)?.changesPercentage}
                          <div class="ml-auto text-sm">
                            <span class="inline-block">S&P500</span>
                            <span
                              class="{items?.at(0)?.changesPercentage > 0
                                ? "text-green-800 dark:text-[#00FC50] before:content-['+']"
                                : 'text-red-800 dark:text-[#FF2F1F]'} "
                              >{items.length > 0
                                ? items?.at(0)?.changesPercentage
                                : "n/a"}%</span
                            >
                          </div>
                        {/if}
                      </div>
                      <!-- Display date -->
                      <br />
                      {#each items as item, indexB}
                        <div class="flex flex-col items-start space-y-1 mb-6">
                          <div class="flex flex-row items-center space-x-2">
                            <div class="relative">
                              <svg
                                fill={indexA === 0 && indexB === 0
                                  ? "#2E86DE"
                                  : "#808080"}
                                class="w-5 h-5 relative z-10"
                                viewBox="-51.2 -51.2 614.40 614.40"
                                id="_78_Circle-Full"
                                xmlns="http://www.w3.org/2000/svg"
                                stroke={indexA === 0 && indexB === 0
                                  ? "#2E86DE"
                                  : "#808080"}
                                stroke-width="0.00512"
                              >
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g
                                  id="SVGRepo_tracerCarrier"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke="#CCCCCC"
                                  stroke-width="24.576"
                                ></g>
                                <g id="SVGRepo_iconCarrier">
                                  <path
                                    id="Path_111"
                                    data-name="Path 111"
                                    d="M256,512C114.625,512,0,397.375,0,256S114.625,0,256,0,512,114.625,512,256,397.375,512,256,512Zm0-448C149.969,64,64,149.969,64,256s85.969,192,192,192,192-85.969,192-192S362.031,64,256,64Zm0,320A128,128,0,1,1,384,256,128.006,128.006,0,0,1,256,384Z"
                                    fill-rule="evenodd"
                                  ></path>
                                </g>
                              </svg>

                              {#if indexA === 0 && indexB === 0}
                                <span
                                  class="absolute -inset-1 rounded-full animate-ping w-3 h-3 m-auto bg-blue-400/75"
                                ></span>
                              {/if}
                            </div>

                            <span
                              class="text-sm sm:text-[1rem] text-muted dark:text-gray-400"
                            >
                              {item.time_formatted}
                              {item.location !== null
                                ? `- ${item?.location}`
                                : ""}
                            </span>
                          </div>

                          <span class="text-sm sm:text-[1rem] ml-7">
                            {item.details}
                          </span>
                        </div>
                      {/each}
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeIdx === 1}
              <h3
                class=" text-lg sm:text-xl font-semibold mb-2 mt-6 border-y border-gray-300 dark:border-gray-800 pt-2 pb-2"
              >
                Executive Actions
              </h3>
              <div class="">
                <div class="space-y-4">
                  {#each Object.entries(groupedOrders) as [date, items], indexA}
                    <div class="my-4">
                      <div
                        class="border-b border-gray-300 dark:border-gray-800 pb-2 flex flex-row items-center"
                      >
                        <span class="text-[1rem] font-semibold">{date}</span>
                        {#if latestInfoDate(date)}
                          <label
                            class="bg-black dark:bg-[#fff] rounded text-white dark:text-black font-semibold text-xs px-2 py-0.5 ml-3 inline-block"
                            >New</label
                          >
                        {/if}
                      </div>
                      <br />

                      {#each items as item, indexB}
                        <!-- Card container -->
                        <div class="{indexB > 0 ? 'my-4' : 'my-1'} ">
                          <!-- Top row: avatar + user info -->
                          <div class="flex items-start space-x-3">
                            <a
                              href="https://truthsocial.com/@realDonaldTrump"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="w-10 h-10 rounded-full shrink-0"
                            >
                              <img
                                class="rounded-full"
                                src={avatar}
                                alt="Trump Image"
                                loading="lazy"
                              />
                            </a>

                            <div class="flex flex-col items-start w-full">
                              <h3 class="font-semibold">
                                <span>Donald J. Trump</span>
                              </h3>
                              <h4 class="text-sm">
                                <div>
                                  Title: {item?.title}
                                  <!-- Sentiment badge -->
                                  <div
                                    class={`mt-2 px-3 py-1 rounded  text-xs sm:text-sm w-fit
                ${
                  item?.sentiment === "Bullish"
                    ? "bg-emerald-500 text-white"
                    : item?.sentiment === "Bearish"
                      ? "bg-red-600 text-white"
                      : "bg-gray-300 text-black"
                }`}
                                  >
                                    {item?.sentiment}
                                  </div>
                                </div>
                              </h4>
                            </div>
                          </div>

                          <!-- Description -->
                          <div class="mt-2 w-full">
                            <span
                              class="text-md text-gray-800 dark:text-gray-300"
                            >
                              {item?.description?.length > 500
                                ? item?.description?.slice(0, 500) + "..."
                                : item?.description}
                            </span>
                          </div>

                          <div
                            class="border-b border-gray-300 dark:border-gray-800 mt-4 mb-4"
                          ></div>

                          <!-- Source link -->
                          <div
                            class="flex flex-row items-center justify-end w-full"
                          >
                            <a
                              href={item?.link}
                              rel="noopener noreferrer"
                              target="_blank"
                              class="mr-3 cursor-pointer border-gray-300 bg-black sm:hover:bg-default text-white dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded px-3 py-1.5 text-sm font-semibold ml-auto"
                            >
                              Open link <svg
                                class="size-5 inline-block"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                ><g id="SVGRepo_bgCarrier" stroke-width="0"
                                ></g><g
                                  id="SVGRepo_tracerCarrier"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                ></g><g id="SVGRepo_iconCarrier">
                                  <path
                                    d="M14 12C14 14.7614 11.7614 17 9 17H7C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7H7.5M10 12C10 9.23858 12.2386 7 15 7H17C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17H16.5"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                  ></path>
                                </g></svg
                              >
                            </a>

                            <label
                              for="executivePostModal"
                              on:click={() => {
                                postTitle = item?.title;
                                postContent = item?.description;
                                postSentiment = item?.sentiment;
                                postDate = item?.date;
                                postUrl = item?.link;
                              }}
                              class=" cursor-pointer border-gray-300 bg-black sm:hover:bg-default text-white dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded px-3 py-1.5 text-sm font-semibold"
                            >
                              Read More
                            </label>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/each}
                </div>
              </div>
            {:else if activeIdx === 2}
              <div
                class=" flex flex-row items-center mb-2 mt-6 border-y border-gray-300 dark:border-gray-800 pt-2 pb-2"
              >
                <svg
                  class="w-7 h-7 rounded-full inline-block"
                  fill="none"
                  viewBox="0 0 92 92"
                  xmlns="http://www.w3.org/2000/svg"
                  ><path d="m0 .438202h91.56v91.56h-91.56z" fill="#5448ee" /><g
                    fill="#fff"
                    ><path d="m67.9385 54.0751h-11.5057v9.3631h11.5057z" /><path
                      d="m63.4377 37.8944v-9.4562h-23.4446v34.9084h11.9665v-25.4522z"
                    /><path d="m24 28.4382h11.4878v9.4539h-11.4878z" /></g
                  ></svg
                >
                <h3 class="ml-2 text-lg sm:text-xl font-semibold">
                  Truth Social Posts
                </h3>
              </div>

              <div class="mt-6">
                <div class="">
                  {#each posts as item, index}
                    <div
                      id="post-{index}"
                      class="{index >= 1 ? 'my-4' : 'my-1'} "
                    >
                      <div class="flex items-start space-x-3">
                        <a
                          href="https://truthsocial.com/@realDonaldTrump"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="w-10 h-10 rounded-full shrink-0"
                        >
                          <img
                            class="rounded-full"
                            src={avatar}
                            alt="Trump Image"
                            loading="lazy"
                          />
                        </a>

                        <div class="flex flex-col items-start w-full">
                          <h3 class="font-semibold">
                            <a
                              href="https://truthsocial.com/@realDonaldTrump"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="sm:hover:text-blue-800 dark:sm:hover:text-blue-400"
                            >
                              Donald J. Trump
                            </a>
                          </h3>
                          <h4 class="text-sm">
                            <a
                              href="https://truthsocial.com/@realDonaldTrump"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="sm:hover:text-blue-800 dark:sm:hover:text-blue-400"
                            >
                              @realDonaldTrump
                            </a>
                          </h4>
                        </div>
                      </div>

                      <p class=" mt-2">
                        {item?.content?.length > 500
                          ? item?.content?.slice(0, 500) + "..."
                          : item?.content}
                      </p>

                      <div
                        class="flex flex-row items-center mt-6 w-full border-b border-gray-300 dark:border-gray-800 pb-2"
                      >
                        <span class=" text-sm">{item?.date}</span>

                        <label
                          for="socialPostModal"
                          on:click={() => {
                            postContent = item?.content;
                            postDate = item?.date;
                          }}
                          class="cursor-pointer border-gray-300 bg-black sm:hover:bg-default text-white dark:border-gray-600 border dark:bg-primary dark:sm:hover:bg-secondary ease-out rounded px-3 py-1.5 text-sm font-semibold ml-auto"
                        >
                          Read More
                        </label>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <div class="order-4 shrink-0 lg:float-right lg:w-[336px]">
            {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
              <div
                class="w-full border border-gray-300 dark:border-gray-800 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
              >
                <a
                  href="/pricing"
                  class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
                >
                  <div
                    class="w-full flex justify-between items-center p-3 mt-3"
                  >
                    <h2 class="text-start text-xl font-semibold sm:ml-3">
                      Pro Subscription
                    </h2>
                  </div>
                  <span class=" p-3 sm:ml-3 sm:mr-3 -mt-4">
                    Upgrade now for unlimited access to all data, tools and no
                    ads.
                  </span>
                </a>
              </div>
            {/if}

            <div
              class="w-full border border-gray-300 dark:border-gray-800 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href={"/stock-screener"}
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">
                    Stock Screener
                  </h2>
                </div>
                <span class=" p-3 ml-3 mr-3">
                  Build your Stock Screener to find profitable stocks.
                </span>
              </a>
            </div>
            <div
              class="w-full border border-gray-300 dark:border-gray-800 rounded h-fit pb-4 mt-4 cursor-pointer sm:hover:shadow-lg dark:sm:hover:bg-secondary transition ease-out duration-100"
            >
              <a
                href={"/watchlist/stocks"}
                class="w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-xl font-bold ml-3">Watchlist</h2>
                </div>
                <span class=" p-3 ml-3 mr-3">
                  Keep track of your favorite stocks in real-time.
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<input type="checkbox" id="executivePostModal" class="modal-toggle" />

<dialog id="executivePostModal" class="modal modal-bottom sm:modal-middle">
  <label for="executivePostModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 rounded shadow-lg border
        bg-white dark:bg-secondary border border-gray-600 dark:border-gray-800"
  >
    <div class="flex items-start space-x-3">
      <span class="w-10 h-10 rounded-full shrink-0">
        <img
          class="rounded-full"
          src={avatar}
          alt="Trump Image"
          loading="lazy"
        />
      </span>

      <div class="flex flex-col items-start w-full">
        <h3 class="font-semibold">
          <span> Donald J. Trump </span>
        </h3>
        <h4 class="text-sm text-gray-800 dark:text-gray-400">{postTitle}</h4>
        <div
          class={`mt-2 px-3 py-1 rounded  text-xs sm:text-sm w-fit
                ${
                  postSentiment === "Bullish"
                    ? "bg-emerald-500 text-white"
                    : postSentiment === "Bearish"
                      ? "bg-red-600 text-white"
                      : "bg-gray-300 text-black"
                }`}
        >
          {postSentiment}
        </div>
      </div>
    </div>

    <p class="text-sm sm:text-[1rem] mb-4 mt-4">
      {@html postContent}
    </p>

    <div class="border-b border-gray-300 dark:border-gray-800">
      <span class=" mb-4 text-sm"
        >{new Date(postDate ?? null)?.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}</span
      >
    </div>

    <div class="flex justify-end space-x-3 mt-5">
      <label
        for="executivePostModal"
        class="cursor-pointer px-4 py-1.5 rounded text-sm font-medium
            bg-black sm:hover:bg-default dark:bg-white dark:text-muted text-white dark:sm:hover:bg-gray-100"
        tabindex="0">Close</label
      >
      <a
        href={postUrl}
        rel="noopener noreferrer"
        target="_blank"
        class="cursor-pointer px-4 py-1.5 rounded text-sm font-medium
            bg-black sm:hover:bg-default dark:bg-white dark:text-muted text-white dark:sm:hover:bg-gray-100"
        tabindex="0">Read Source</a
      >
    </div>
  </div>
</dialog>

<input type="checkbox" id="socialPostModal" class="modal-toggle" />

<dialog id="socialPostModal" class="modal modal-bottom sm:modal-middle">
  <label for="socialPostModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 rounded shadow-lg border
        bg-white dark:bg-secondary border border-gray-600 dark:border-gray-800"
    style="opacity: 1; transform: none;"
  >
    <div class="flex items-start space-x-3">
      <a
        href="https://truthsocial.com/@realDonaldTrump"
        target="_blank"
        rel="noopener noreferrer"
        class="w-10 h-10 rounded-full shrink-0"
      >
        <img
          class="rounded-full"
          src={avatar}
          alt="Trump Image"
          loading="lazy"
        />
      </a>

      <div class="flex flex-col items-start w-full">
        <h3 class="font-semibold">
          <a
            href="https://truthsocial.com/@realDonaldTrump"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-blue-800"
          >
            Donald J. Trump
          </a>
        </h3>
        <h4 class="text-sm text-gray-500 dark:text-gray-400">
          <a
            href="https://truthsocial.com/@realDonaldTrump"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-blue-800"
          >
            @realDonaldTrump
          </a>
        </h4>
      </div>
    </div>

    <p class="text-sm sm:text-[1rem] mb-4 mt-4">
      {postContent}
    </p>

    <div class="border-b border-gray-300 dark:border-gray-800">
      <span class=" mb-4 text-sm">{postDate}</span>
    </div>

    <div class="flex justify-end space-x-3 mt-5">
      <label
        for="socialPostModal"
        class="cursor-pointer px-4 py-1.5 rounded text-sm font-medium
            bg-black sm:hover:bg-default dark:bg-white dark:text-muted text-white dark:sm:hover:bg-gray-100"
        tabindex="0">Close</label
      >
    </div>
  </div>
</dialog>
