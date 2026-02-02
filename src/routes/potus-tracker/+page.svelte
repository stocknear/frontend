<script lang="ts">
  import SEO from "$lib/components/SEO.svelte";
  import Infobox from "$lib/components/Infobox.svelte";
  import highcharts from "$lib/highcharts.ts";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import { sectorList } from "$lib/utils";
  import { mode } from "mode-watcher";
  import { goto } from "$app/navigation";
  import BreadCrumb from "$lib/components/BreadCrumb.svelte";
  import {
    potus_tracker_breadcrumb_current,
    potus_tracker_breadcrumb_home,
    potus_tracker_close,
    potus_tracker_donald_trump,
    potus_tracker_executive_actions,
    potus_tracker_infobox_declined,
    potus_tracker_infobox_grown,
    potus_tracker_new,
    potus_tracker_official_schedule,
    potus_tracker_open_link,
    potus_tracker_read_more,
    potus_tracker_read_source,
    potus_tracker_select_sector,
    potus_tracker_seo_description,
    potus_tracker_seo_keywords,
    potus_tracker_seo_title,
    market_news_upgrade_description,
    market_news_upgrade_label,
    market_news_pro_subscription_title,
    potus_tracker_sidebar_screener,
    potus_tracker_sidebar_screener_desc,
    potus_tracker_sidebar_watchlist,
    potus_tracker_sidebar_watchlist_desc,
    potus_tracker_tab_executive_orders,
    potus_tracker_tab_schedule,
    potus_tracker_tab_truth_social,
    potus_tracker_title,
    potus_tracker_title_label,
    potus_tracker_truth_social_posts,
  } from "$lib/paraglide/messages";
  //import html2canvas from "html2canvas-pro";

  export let data;

  let postContent = "n/a";
  let postDate = "n/a";
  let postUrl = "#";
  let postTitle = "n/a";
  let postSentiment = "n/a";
  let postMedia: string[] = [];
  let postReplies = 0;
  let postReblogs = 0;
  let postFavourites = 0;

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

  const toArray = <T,>(input: T[] | undefined | null): T[] =>
    Array.isArray(input) ? input : [];

  const parseDate = (input?: string | Date | null) => {
    if (!input) return null;
    const dateObj = input instanceof Date ? input : new Date(input);
    return Number.isNaN(dateObj.getTime()) ? null : dateObj;
  };

  const sortByDateDesc = (entries: Array<Record<string, any>>, key = "date") =>
    [...entries].sort((a, b) => {
      const dateA = parseDate(a?.[key]);
      const dateB = parseDate(b?.[key]);
      return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    });

  const formatDateLabel = (
    date: Date | null,
    options: Intl.DateTimeFormatOptions,
  ) => {
    if (!date) return null;
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  const formatFootnote = (isoString?: string | null) => {
    if (!isoString) return null;
    return formatDateLabel(new Date(isoString), {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  };

  const formatPercent = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const truncate = (value?: string | null, maxLength = 160) => {
    if (!value) return "";
    return value.length > maxLength
      ? `${value.slice(0, maxLength - 3)}...`
      : value;
  };

  const formatEngagement = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num?.toString();
  };

  const formatPostDate = (isoString?: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }).format(date);
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "note";

  const scheduleEntries = toArray(rawData);
  const executiveOrderEntries = toArray(executiveOrders);
  const truthSocialEntries = toArray(posts);

  const scheduleSorted = sortByDateDesc(scheduleEntries);
  const ordersSorted = sortByDateDesc(executiveOrderEntries);
  const postsSorted = sortByDateDesc(truthSocialEntries, "created_at");

  const latestScheduleEntry = scheduleSorted[0] ?? null;
  const latestOrder = ordersSorted[0] ?? null;
  const latestPost = postsSorted[0] ?? null;

  const latestScheduleDate = parseDate(latestScheduleEntry?.date);
  const latestOrderDate = parseDate(latestOrder?.date);
  const latestPostDate = parseDate(latestPost?.created_at);
  const latestScheduleDateISO = latestScheduleDate?.toISOString() ?? null;
  const latestOrderDateISO = latestOrderDate?.toISOString() ?? null;
  const latestPostDateISO = latestPostDate?.toISOString() ?? null;

  const MS_IN_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const ordersLast30Days = ordersSorted.filter((order) => {
    const date = parseDate(order?.date);
    return date && now.getTime() - date.getTime() <= 30 * MS_IN_DAY;
  }).length;
  const scheduleEventsLast48h = scheduleSorted.filter((entry) => {
    const date = parseDate(entry?.date);
    return date && now.getTime() - date.getTime() <= 2 * MS_IN_DAY;
  }).length;
  const postsLast7Days = postsSorted.filter((post) => {
    const date = parseDate(post?.created_at);
    return date && now.getTime() - date.getTime() <= 7 * MS_IN_DAY;
  }).length;

  const sp500TickerSymbol = sectorDict["S&P500"];
  const sp500Performance =
    data?.getData?.marketPerformance?.[sp500TickerSymbol]?.Inauguration ?? null;
  const sp500PerformanceDisplay = formatPercent(sp500Performance);

  const candidateDates = [
    latestScheduleDate,
    latestOrderDate,
    latestPostDate,
  ].filter((date): date is Date => Boolean(date));
  const datasetUpdatedISO =
    candidateDates.length > 0
      ? new Date(
          Math.max(...candidateDates.map((date) => date.getTime())),
        ).toISOString()
      : new Date().toISOString();
  const datasetUpdatedLabel = formatFootnote(datasetUpdatedISO);
  const latestOrderDateLabel = formatFootnote(latestOrderDateISO);
  const latestScheduleDateLabel = formatFootnote(latestScheduleDateISO);
  const latestPostDateLabel = formatFootnote(latestPostDateISO);
  const latestOrderTitle =
    truncate(latestOrder?.title, 90) || "Untitled executive action";
  const latestScheduleSummary =
    truncate(latestScheduleEntry?.details, 140) || "Details pending.";
  const latestScheduleLocation = latestScheduleEntry?.location ?? null;

  type ResearchNoteBase = {
    id: string;
    title: string;
    value: string;
    description: string;
    category: string;
    updatedISO: string | null;
    footnote?: string;
  };

  const researchNoteCandidates: ResearchNoteBase[] = [];

  if (sp500PerformanceDisplay) {
    researchNoteCandidates.push({
      id: "sp500-inauguration-performance",
      title: "S&P 500 since Inauguration Day",
      value: sp500PerformanceDisplay,
      description:
        "Percent change in SPY (S&P 500 proxy) since Jan 20, 2025 using Stocknear POTUS market-performance data.",
      category: "Market Pulse",
      updatedISO: datasetUpdatedISO,
      footnote: datasetUpdatedLabel
        ? `Compared through ${datasetUpdatedLabel}`
        : undefined,
    });
  }

  researchNoteCandidates.push({
    id: "executive-orders-last-30-days",
    title: "Executive orders in the last 30 days",
    value: ordersLast30Days.toString(),
    description:
      ordersLast30Days > 0 && latestOrder
        ? `Latest order ("${latestOrderTitle}") filed ${latestOrderDateLabel ?? "recently"}.`
        : "No executive orders recorded in the last 30 days within Stocknear's executive-orders dataset.",
    category: "Policy Tracker",
    updatedISO: latestOrderDateISO,
    footnote: latestOrderDateLabel
      ? `Last filing recorded ${latestOrderDateLabel}`
      : undefined,
  });

  researchNoteCandidates.push({
    id: "schedule-items-last-48-hours",
    title: "Schedule items logged in 48 hours",
    value: scheduleEventsLast48h.toString(),
    description:
      scheduleEventsLast48h > 0 && latestScheduleEntry
        ? `Most recent entry on ${latestScheduleDateLabel ?? "the latest update"} – ${latestScheduleSummary}`
        : "No West Wing schedule items captured in the last 48 hours.",
    category: "Schedule Intel",
    updatedISO: latestScheduleDateISO,
    footnote:
      latestScheduleLocation && scheduleEventsLast48h > 0
        ? `Location: ${latestScheduleLocation}`
        : undefined,
  });

  researchNoteCandidates.push({
    id: "truth-social-posts-last-week",
    title: "Truth Social posts captured (7D)",
    value: postsLast7Days.toString(),
    description:
      postsLast7Days > 0 && latestPostDateLabel
        ? `Latest capture on ${latestPostDateLabel} from @realDonaldTrump.`
        : "No Truth Social posts ingested in the last 7 days.",
    category: "Messaging",
    updatedISO: latestPostDateISO,
  });

  type ResearchNote = ResearchNoteBase & { anchor: string };
  const researchNotes: ResearchNote[] = researchNoteCandidates.map((note) => {
    const slug = slugify(note.id || note.title);
    return {
      ...note,
      anchor: `research-${slug}`,
    };
  });

  const baseUrl = "https://stocknear.com";
  const potusPageUrl = `${baseUrl}/potus-tracker`;
  const webAppStructuredData = {
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
  };

  const researchNotesDatasetDescription =
    "Citation-ready facts sourced from Stocknear's POTUS schedule, executive order, Truth Social, and market-performance datasets.";

  const datasetStructuredData =
    researchNotes.length > 0
      ? {
          "@type": "Dataset",
          name: "Stocknear POTUS Tracker Research Notes",
          description: researchNotesDatasetDescription,
          url: potusPageUrl,
          inLanguage: "en",
          dateModified: datasetUpdatedISO,
          creator: {
            "@type": "Organization",
            name: "Stocknear",
            url: baseUrl,
          },
          distribution: researchNotes.map((note) => ({
            "@type": "DataDownload",
            encodingFormat: "text/html",
            contentUrl: `${potusPageUrl}#${note.anchor}`,
            name: note.title,
            description: note.description,
          })),
          variableMeasured: researchNotes.map((note) => ({
            "@type": "PropertyValue",
            name: note.title,
            value: note.value,
            description: note.description,
          })),
        }
      : null;

  const structuredDataGraph = {
    "@context": "https://schema.org",
    "@graph": datasetStructuredData
      ? [webAppStructuredData, datasetStructuredData]
      : [webAppStructuredData],
  };

  $: tabs = [
    {
      title: potus_tracker_tab_schedule(),
    },
    {
      title: potus_tracker_tab_executive_orders(),
    },
    {
      title: potus_tracker_tab_truth_social(),
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

  $: {
    if (selectedSector || $mode) {
      config = plotData() || null;
    }
  }
</script>

<SEO
  title={potus_tracker_seo_title()}
  description={potus_tracker_seo_description()}
  keywords={potus_tracker_seo_keywords()}
  structuredData={structuredDataGraph}
/>

<section
  class="w-full max-w-3xl sm:max-w-[1400px] overflow-hidden min-h-screen pb-20 pt-5 px-4 lg:px-3 text-gray-700 dark:text-zinc-200"
>
  <BreadCrumb
    containerClass="text-xs sm:text-sm breadcrumbs text-gray-500 dark:text-zinc-400"
  >
    <li>
      <a
        href="/"
        class="text-gray-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400"
        >{potus_tracker_breadcrumb_home()}</a
      >
    </li>
    <li class="text-gray-500 dark:text-zinc-400">
      {potus_tracker_breadcrumb_current()}
    </li>
  </BreadCrumb>

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
              class="border-b border-gray-300 dark:border-zinc-700 flex flex-row justify-between"
            >
              <h1
                class="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {potus_tracker_title()}
              </h1>
            </div>
          </div>

          <div class=" lg:float-left lg:w-[calc(100%-336px-40px)]">
            <div class="mt-5 mb-5">
              <Infobox
                text={`${data?.getData?.marketPerformance[sectorDict[selectedSector]]["Inauguration"] >= 0 ? potus_tracker_infobox_grown({ sector: selectedSector }) : potus_tracker_infobox_declined({ sector: selectedSector })} <span class="${data?.getData?.marketPerformance[sectorDict[selectedSector]]["Inauguration"] >= 0 ? "text-emerald-800 dark:text-emerald-400 before:content-['+']" : "text-rose-800 dark:text-rose-400"}">
  ${data?.getData?.marketPerformance[sectorDict[selectedSector]]["Inauguration"] ?? "n/a"}%</span>.`}
              />
            </div>

            <div class="flex flex-row items-center w-fit ml-auto mt-2 sm:mt-0">
              <div class="sector-driver relative inline-block text-left grow">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild let:builder>
                    <Button
                      builders={[builder]}
                      class="w-full transition-all duration-150 border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 flex flex-row justify-between items-center px-2 sm:px-3 py-2 rounded-full truncate disabled:opacity-60 disabled:cursor-not-allowed"
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
                    class="w-56 h-fit max-h-72 overflow-y-auto scroller relative rounded-xl border border-gray-300 shadow dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 p-2 text-gray-700 dark:text-zinc-200 shadow-none"
                  >
                    <DropdownMenu.Label
                      class="text-xs text-gray-500 dark:text-zinc-400 font-semibold"
                    >
                      {potus_tracker_select_sector()}
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Group>
                      {#each updatedSectorList as sector}
                        {#if sector === "S&P500" || ["Pro", "Plus"]?.includes(data?.user?.tier)}
                          <DropdownMenu.Item
                            on:click={() => (selectedSector = sector)}
                            class="cursor-pointer rounded-lg sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
                          >
                            {sector}
                          </DropdownMenu.Item>
                        {:else}
                          <DropdownMenu.Item
                            on:click={() => goto("/pricing")}
                            class="cursor-pointer rounded-lg sm:hover:bg-gray-100/70 dark:sm:hover:bg-zinc-900/60 sm:hover:text-violet-800 dark:sm:hover:text-violet-400 transition"
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
              class="chart-driver mt-5 border border-gray-300 shadow dark:border-zinc-700 rounded-lg bg-white/70 dark:bg-zinc-950/40"
              use:highcharts={config}
            ></div>

            <nav class="overflow-x-auto whitespace-nowrap mt-4">
              <ul
                class="flex flex-row items-center w-full gap-1 pb-2 text-sm sm:text-base"
              >
                {#each tabs as item, i}
                  <button
                    on:click={() => (activeIdx = i)}
                    class="cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border text-sm font-medium transition {activeIdx ===
                    i
                      ? 'border-gray-300 dark:border-zinc-700 bg-gray-100/70 dark:bg-zinc-900/60 text-violet-800 dark:text-violet-400'
                      : 'border-transparent text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:border-gray-300 dark:hover:border-zinc-800/80 hover:bg-gray-100/60 dark:hover:bg-zinc-900/50'}"
                  >
                    {item.title}
                  </button>
                {/each}
              </ul>
            </nav>

            {#if activeIdx === 0}
              <h3
                class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2 mt-2 border-y border-gray-300 dark:border-zinc-700 py-2"
              >
                {potus_tracker_official_schedule()}
              </h3>
              <div class="">
                <div class="space-y-4">
                  {#each Object?.entries(groupedByDate) as [date, items], indexA}
                    <div class="my-4">
                      <div
                        class="border-b border-gray-300 dark:border-zinc-700 pb-2 w-full flex flex-row items-center justify-between"
                      >
                        <span class="text-[1rem] sm:text-lg font-semibold">
                          {date}</span
                        >
                        {#if items?.at(0)?.changesPercentage}
                          <div class="ml-auto text-sm">
                            <span class="inline-block">S&P500</span>
                            <span
                              class="{items?.at(0)?.changesPercentage > 0
                                ? "text-emerald-800 dark:text-emerald-400 before:content-['+']"
                                : 'text-rose-800 dark:text-rose-400'} "
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
                              class="text-sm sm:text-[1rem] text-gray-800 dark:text-zinc-300"
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
                class="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2 mt-2 border-y border-gray-300 dark:border-zinc-700 py-2"
              >
                {potus_tracker_executive_actions()}
              </h3>
              <div class="">
                <div class="space-y-4">
                  {#each Object.entries(groupedOrders) as [date, items], indexA}
                    <div class="my-4">
                      <div
                        class="border-b border-gray-300 dark:border-zinc-700 pb-2 flex flex-row items-center"
                      >
                        <span class="text-[1rem] font-semibold">{date}</span>
                        {#if latestInfoDate(date)}
                          <label
                            class="rounded-full border border-gray-300 shadow dark:border-zinc-700/80 bg-white/80 dark:bg-zinc-900/50 text-gray-700 dark:text-zinc-200 font-semibold text-xs px-2 py-0.5 ml-3 inline-block"
                            >{potus_tracker_new()}</label
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
                                class="rounded-full border border-red-800 dark:border-red-400"
                                src="/img/potus.png"
                                alt="Trump Image"
                                loading="lazy"
                              />
                            </a>

                            <div class="flex flex-col items-start w-full">
                              <h3 class="font-semibold">
                                <span>{potus_tracker_donald_trump()}</span>
                              </h3>
                              <h4
                                class="text-sm text-gray-800 dark:text-zinc-300"
                              >
                                <div>
                                  {potus_tracker_title_label()}
                                  {item?.title}
                                  <!-- Sentiment badge -->
                                  <div
                                    class={`mt-2 px-3 py-1 rounded-full text-xs sm:text-sm w-fit border
                ${
                  item?.sentiment === "Bullish"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : item?.sentiment === "Bearish"
                      ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                      : "border-gray-300 bg-gray-50 text-gray-700 dark:border-zinc-700/80 dark:bg-zinc-900/40 dark:text-zinc-300"
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
                              class="text-sm text-gray-800 dark:text-zinc-300"
                            >
                              {item?.description?.length > 500
                                ? item?.description?.slice(0, 500) + "..."
                                : item?.description}
                            </span>
                          </div>

                          <div
                            class="border-b border-gray-300 dark:border-zinc-700 mt-4 mb-4"
                          ></div>

                          <!-- Source link -->
                          <div
                            class="flex flex-row items-center justify-end w-full"
                          >
                            <a
                              href={item?.link}
                              rel="noopener noreferrer"
                              target="_blank"
                              class="mr-3 cursor-pointer border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition rounded-full px-3 py-1.5 text-sm font-semibold ml-auto"
                            >
                              {potus_tracker_open_link()}
                              <svg
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
                              class="cursor-pointer border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition rounded-full px-3 py-1.5 text-sm font-semibold"
                            >
                              {potus_tracker_read_more()}
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
                class="flex flex-row items-center mb-2 mt-2 border-y border-gray-300 dark:border-zinc-700 py-2"
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

                <h3
                  class="ml-2 text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
                >
                  {potus_tracker_truth_social_posts()}
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
                            class="rounded-full border border-red-800 dark:border-red-400"
                            src="/img/potus.png"
                            alt="Trump Image"
                            loading="lazy"
                          />
                        </a>

                        <div class="flex flex-col items-start w-full">
                          <div
                            class="flex flex-row items-center gap-2 flex-wrap"
                          >
                            <h3 class="font-semibold">
                              <a
                                href="https://truthsocial.com/@realDonaldTrump"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="hover:text-violet-600 dark:hover:text-violet-400"
                              >
                                Donald J. Trump
                              </a>
                            </h3>
                            <span
                              class="text-sm text-gray-500 dark:text-zinc-400"
                            >
                              <a
                                href="https://truthsocial.com/@realDonaldTrump"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="hover:text-violet-600 dark:hover:text-violet-400"
                              >
                                @realDonaldTrump
                              </a>
                            </span>
                            <span class="text-gray-400 dark:text-zinc-500"
                              >·</span
                            >
                            <span
                              class="text-sm text-gray-500 dark:text-zinc-400"
                            >
                              {formatPostDate(item?.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p class="mt-2 text-sm text-gray-800 dark:text-zinc-300">
                        {item?.content?.length > 500
                          ? item?.content?.slice(0, 500) + "..."
                          : item?.content}
                      </p>

                      <!-- Media display -->
                      {#if item?.media && item.media.length > 0}
                        <div
                          class="mt-3 grid gap-2 {item.media.length === 1
                            ? 'grid-cols-1'
                            : 'grid-cols-2'}"
                        >
                          {#each item.media as mediaUrl, mediaIndex}
                            {#if mediaUrl.includes(".mp4") || mediaUrl.includes(".webm")}
                              <video
                                src={mediaUrl}
                                controls
                                class="w-full rounded-lg border border-gray-300 dark:border-zinc-700"
                                preload="metadata"
                              >
                                <track kind="captions" />
                              </video>
                            {:else}
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={mediaUrl}
                                  alt="Post media {mediaIndex + 1}"
                                  class="w-full h-auto max-h-80 object-cover rounded-lg border border-gray-300 dark:border-zinc-700 hover:opacity-90 transition"
                                  loading="lazy"
                                />
                              </a>
                            {/if}
                          {/each}
                        </div>
                      {/if}

                      <!-- Engagement stats -->
                      {#if item?.replies_count > 0 && item?.reblogs_count > 0 && item?.favourites_count > 0}
                        <div
                          class="flex flex-row items-center gap-4 mt-3 text-sm text-gray-500 dark:text-zinc-400"
                        >
                          <span class="flex items-center gap-1" title="Replies">
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            {formatEngagement(item?.replies_count || 0)}
                          </span>
                          <span class="flex items-center gap-1" title="Reblogs">
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            {formatEngagement(item?.reblogs_count || 0)}
                          </span>
                          <span class="flex items-center gap-1" title="Likes">
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            {formatEngagement(item?.favourites_count || 0)}
                          </span>
                        </div>
                      {/if}

                      <div
                        class="flex flex-row items-center justify-end mt-4 w-full border-b border-gray-300 dark:border-zinc-700 pb-2"
                      >
                        <button
                          on:click={() =>
                            window.open(
                              item?.url,
                              "_blank",
                              "noopener,noreferrer",
                            )}
                          class="cursor-pointer border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition rounded-full px-3 py-1.5 text-sm font-semibold mr-2"
                        >
                          {potus_tracker_open_link()}
                          <svg
                            class="size-4 inline-block ml-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
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
                        </button>

                        <label
                          for="socialPostModal"
                          on:click={() => {
                            postContent = item?.content;
                            postDate = item?.created_at;
                            postUrl = item?.url;
                            postMedia = item?.media || [];
                            postReplies = item?.replies_count || 0;
                            postReblogs = item?.reblogs_count || 0;
                            postFavourites = item?.favourites_count || 0;
                          }}
                          class="cursor-pointer border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition rounded-full px-3 py-1.5 text-sm font-semibold"
                        >
                          {potus_tracker_read_more()}
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
                class="w-full border border-gray-300 shadow dark:border-zinc-700 rounded-2xl bg-white/70 dark:bg-zinc-950/40 p-4 mt-4 sm:mt-0"
              >
                <a href="/pricing" class="group flex flex-col gap-2">
                  <span
                    class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400"
                  >
                    {market_news_upgrade_label()}
                  </span>
                  <h2
                    class="text-lg font-semibold tracking-tight text-gray-900 dark:text-white transition group-hover:text-violet-600 dark:group-hover:text-violet-400"
                  >
                    {market_news_pro_subscription_title()}
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-zinc-300">
                    {market_news_upgrade_description()}
                  </p>
                </a>
              </div>
            {/if}

            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/stock-screener"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {potus_tracker_sidebar_screener()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  {potus_tracker_sidebar_screener_desc()}
                </span>
              </a>
            </div>

            <div
              class="w-full rounded-2xl border border-gray-300 shadow dark:border-zinc-700 bg-white/70 dark:bg-zinc-950/40 pb-4 mt-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/70 dark:hover:bg-zinc-900/60 transition"
            >
              <a
                href="/watchlist/stocks"
                class="group w-auto lg:w-full p-1 flex flex-col m-auto px-2 sm:px-0"
              >
                <div class="w-full flex justify-between items-center p-3 mt-3">
                  <h2 class="text-start text-lg font-semibold ml-3">
                    {potus_tracker_sidebar_watchlist()}
                  </h2>
                </div>
                <span
                  class="p-3 ml-3 mr-3 text-sm text-gray-800 dark:text-zinc-300"
                >
                  {potus_tracker_sidebar_watchlist_desc()}
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
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="executivePostModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg
      >
    </label>
    <div class="flex items-start space-x-3">
      <span class="w-10 h-10 rounded-full shrink-0">
        <img
          class="rounded-full border border-red-800 dark:border-red-400"
          src="/img/potus.png"
          alt="Trump Image"
          loading="lazy"
        />
      </span>

      <div class="flex flex-col items-start w-full">
        <h3 class="font-semibold">
          <span> Donald J. Trump </span>
        </h3>
        <h4 class="text-sm text-gray-800 dark:text-zinc-300">{postTitle}</h4>
        <div
          class={`mt-2 px-3 py-1 rounded-full  text-xs sm:text-sm w-fit
                ${
                  postSentiment === "Bullish"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : postSentiment === "Bearish"
                      ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                      : "border-gray-300 bg-gray-50 text-gray-700 dark:border-zinc-700/80 dark:bg-zinc-900/40 dark:text-zinc-300"
                }`}
        >
          {postSentiment}
        </div>
      </div>
    </div>

    <p class="text-sm sm:text-[1rem] mb-4 mt-4">
      {@html postContent}
    </p>

    <div class="border-b border-gray-300 dark:border-zinc-700">
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
        class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-semibold border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition"
        tabindex="0">{potus_tracker_close()}</label
      >
      <button
        on:click={() => window.open(postUrl, "_blank", "noopener,noreferrer")}
        class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-semibold border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition"
        tabindex="0">{potus_tracker_read_source()}</button
      >
    </div>
  </div>
</dialog>

<input type="checkbox" id="socialPostModal" class="modal-toggle" />

<dialog id="socialPostModal" class="modal modal-bottom sm:modal-middle">
  <label for="socialPostModal" class="cursor-pointer modal-backdrop"></label>

  <div
    class="modal-box w-full p-6 relative bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
  >
    <label
      for="socialPostModal"
      class="inline-block cursor-pointer absolute right-4 top-4 text-[1.3rem] sm:text-[1.6rem] text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition"
      aria-label="Close modal"
    >
      <svg
        class="w-6 h-6 sm:w-7 sm:h-7"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
        /></svg
      >
    </label>
    <div class="flex items-start space-x-3">
      <a
        href="https://truthsocial.com/@realDonaldTrump"
        target="_blank"
        rel="noopener noreferrer"
        class="w-10 h-10 rounded-full shrink-0"
      >
        <img
          class="rounded-full border border-red-800 dark:border-red-400"
          src="/img/potus.png"
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
            class="hover:text-violet-600 dark:hover:text-violet-400"
          >
            Donald J. Trump
          </a>
        </h3>
        <h4 class="text-sm text-gray-500 dark:text-zinc-400">
          <a
            href="https://truthsocial.com/@realDonaldTrump"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-violet-600 dark:hover:text-violet-400"
          >
            @realDonaldTrump
          </a>
        </h4>
      </div>
    </div>

    <p class="text-sm text-gray-800 dark:text-zinc-300 mb-4 mt-4">
      {postContent}
    </p>

    <!-- Media display in modal -->
    {#if postMedia && postMedia.length > 0}
      <div
        class="mb-4 grid gap-2 {postMedia.length === 1
          ? 'grid-cols-1'
          : 'grid-cols-2'}"
      >
        {#each postMedia as mediaUrl, mediaIndex}
          {#if mediaUrl.includes(".mp4") || mediaUrl.includes(".webm")}
            <video
              src={mediaUrl}
              controls
              class="w-full rounded-lg border border-gray-300 dark:border-zinc-700"
              preload="metadata"
            >
              <track kind="captions" />
            </video>
          {:else}
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={mediaUrl}
                alt="Post media {mediaIndex + 1}"
                class="w-full h-auto max-h-96 object-cover rounded-lg border border-gray-300 dark:border-zinc-700 hover:opacity-90 transition"
                loading="lazy"
              />
            </a>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- Engagement stats in modal -->
    <div
      class="flex flex-row items-center gap-4 mb-4 text-sm text-gray-500 dark:text-zinc-400"
    >
      <span class="flex items-center gap-1" title="Replies">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {formatEngagement(postReplies)}
      </span>
      <span class="flex items-center gap-1" title="Reblogs">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {formatEngagement(postReblogs)}
      </span>
      <span class="flex items-center gap-1" title="Likes">
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {formatEngagement(postFavourites)}
      </span>
    </div>

    <div class="border-b border-gray-300 dark:border-zinc-700 pb-2">
      <span class="text-sm text-gray-500 dark:text-zinc-400"
        >{formatPostDate(postDate)}</span
      >
    </div>

    <div class="flex justify-end space-x-3 mt-5">
      <label
        for="socialPostModal"
        class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-semibold border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition"
        tabindex="0">{potus_tracker_close()}</label
      >
      <button
        on:click={() => window.open(postUrl, "_blank", "noopener,noreferrer")}
        class="cursor-pointer px-4 py-1.5 rounded-full text-sm font-semibold border border-gray-300 shadow dark:border-zinc-700 text-gray-900 dark:text-white bg-white/90 dark:bg-zinc-950/70 hover:bg-white dark:hover:bg-zinc-900 transition"
        tabindex="0">{potus_tracker_read_source()}</button
      >
    </div>
  </div>
</dialog>
