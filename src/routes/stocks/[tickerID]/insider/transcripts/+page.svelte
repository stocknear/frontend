<script lang="ts">
  import {
    stockTicker,
    getCache,
    setCache,
    displayCompanyName,
  } from "$lib/store";
  import * as DropdownMenu from "$lib/components/shadcn/dropdown-menu/index.js";
  import { Button } from "$lib/components/shadcn/button/index.js";
  import Infobox from "$lib/components/Infobox.svelte";
  import { onMount } from "svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { goto } from "$app/navigation";

  export let data;

  let chats = [];
  let date;

  // Use dateList from page data
  let dateList = data?.getData ?? [];

  // Extract unique years from dateList, sorted descending
  $: yearRange =
    dateList?.length > 0
      ? [...new Set(dateList.map((d) => d.fiscalYear))].sort((a, b) => b - a)
      : [new Date().getFullYear()];

  // Get available quarters for selected year, sorted descending
  $: quarterRange = (() => {
    const filtered = dateList
      ?.filter((d) => d.fiscalYear === year)
      ?.map((d) => d.quarter)
      ?.sort((a, b) => b - a);
    return filtered?.length > 0 ? filtered : [1, 2, 3, 4];
  })();

  // Initialize year and quarter from first available entry
  let year = dateList?.[0]?.fiscalYear ?? new Date().getFullYear();
  let quarter =
    dateList?.[0]?.quarter ?? Math.floor(new Date().getMonth() / 3) + 1;

  let displayQuarter = quarter;
  let displayYear = year;
  let isLoaded = false;

  // AI Summarize feature states
  let showSummary = false;
  let isGeneratingSummary = false;
  let summaryGenerated = false;
  let summaryError = false;

  // Summary data from API
  let summaryData: {
    sentiment: string;
    sentimentScore: number;
    keyHighlights: string[];
    risks: string[];
    outlook: string;
    error?: string;
  } | null = null;

  async function generateSummary() {
    if (summaryGenerated && !summaryError) {
      showSummary = !showSummary;
      return;
    }

    isGeneratingSummary = true;
    showSummary = true;
    summaryError = false;

    try {
      const response = await fetch("/api/transcript-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: $stockTicker,
          year: displayYear,
          quarter: displayQuarter,
          transcriptData: chats,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      summaryData = await response.json();

      if (summaryData?.error) {
        summaryError = true;
      }

      summaryGenerated = true;
    } catch (e) {
      console.error("Summary generation error:", e);
      summaryError = true;
      summaryData = {
        sentiment: "Neutral",
        sentimentScore: 50,
        keyHighlights: ["Unable to generate summary. Please try again."],
        risks: [],
        outlook: "Summary generation failed.",
      };
      summaryGenerated = true;
    } finally {
      isGeneratingSummary = false;
    }
  }

  function backToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Helper function for sentiment colors
  function getSentimentColors(sentiment: string) {
    switch (sentiment?.toLowerCase()) {
      case "bullish":
        return {
          text: "text-green-700 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-900/40",
          bar: "bg-green-500",
        };
      case "bearish":
        return {
          text: "text-red-700 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-900/40",
          bar: "bg-red-500",
        };
      default:
        return {
          text: "text-yellow-700 dark:text-yellow-400",
          bg: "bg-yellow-100 dark:bg-yellow-900/40",
          bar: "bg-yellow-500",
        };
    }
  }

  $: sentimentColors = getSentimentColors(summaryData?.sentiment ?? "Neutral");

  const getTranscripts = async () => {
    isLoaded = false;
    chats = [];
    // Reset AI summary when loading new transcript
    showSummary = false;
    summaryGenerated = false;
    summaryError = false;
    summaryData = null;
    let output;
    // Get cached data for the specific tickerID
    const cachedData = getCache(
      `${$stockTicker}-Q-${quarter}-${year}`,
      "getTranscripts",
    );
    if (cachedData) {
      output = cachedData;
    } else {
      const postData = {
        ticker: $stockTicker,
        quarter: quarter,
        year: year,
      };
      // make the POST request to the endpoint
      const response = await fetch("/api/earnings-call-transcripts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      output = await response.json();
      // Cache the data for this specific tickerID with a specific name 'getTranscripts'
      setCache(
        `${$stockTicker}-Q-${quarter}-${year}`,
        output,
        "getTranscripts",
      );
    }

    chats = output?.chat ?? [];
    date = output?.date ?? "-";
    displayQuarter = quarter;
    displayYear = year;
    isLoaded = true;
  };

  onMount(async () => {
    await getTranscripts();
  });
</script>

<SEO
  title={`${$displayCompanyName} (${$stockTicker}) Earnings Call Transcripts | Quarterly Conference Call Analysis`}
  description={`Complete earnings call transcripts for ${$displayCompanyName} (${$stockTicker}). Access quarterly conference call recordings, management commentary, Q&A sessions, and analyst discussions with searchable transcript analysis and key insights.`}
  keywords={`${$stockTicker} earnings call transcript, ${$displayCompanyName} conference call, quarterly earnings transcript, ${$stockTicker} management commentary, earnings call analysis, conference call recording, quarterly results discussion`}
  type="website"
  url={`https://stocknear.com/stocks/${$stockTicker}/insider/transcripts`}
  structuredData={{
    "@context": "https://schema.org",
    "@type": ["FinancialProduct", "Article"],
    name: `${$displayCompanyName} Earnings Call Transcripts`,
    description: `Professional earnings call transcript analysis for ${$displayCompanyName} (${$stockTicker})`,
    url: `https://stocknear.com/stocks/${$stockTicker}/insider/transcripts`,
    applicationCategory: "FinanceApplication",
    featureList: [
      "Earnings call transcripts",
      "Conference call analysis",
      "Management commentary",
      "Q&A session coverage",
      "Analyst discussion tracking",
      "Quarterly results analysis",
      "Searchable transcript text",
      "Key insights extraction",
    ],
    provider: {
      "@type": "Organization",
      name: "Stocknear",
      url: "https://stocknear.com",
    },
    mainEntity: {
      "@type": "Corporation",
      name: $displayCompanyName,
      tickerSymbol: $stockTicker,
    },
  }}
/>

<section class="w-full overflow-hidden min-h-screen mb-40 sm:mb-0">
  <div class="h-full overflow-hidden">
    <div class="relative flex justify-center items-center overflow-hidden">
      <div class="sm:p-7 w-full mt-2 sm:mt-0">
        <div class="mb-6">
          <h1 class="text-xl sm:text-2xl font-bold mb-4">Transcripts</h1>

          <div class="flex w-fit sm:w-[50%] md:block md:w-auto ml-auto">
            <div class="relative inline-block text-left grow mr-2">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center  w-full sm:w-auto px-3 rounded truncate"
                  >
                    <span class="truncate">Year: {year}</span>
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
                  class="min-w-40 h-fit max-h-72 overflow-y-auto scroller"
                >
                  <DropdownMenu.Group>
                    {#each yearRange as yr, index}
                      {#if ["Plus", "Pro"]?.includes(data?.user?.tier) || index === 0}
                        <DropdownMenu.Item
                          on:click={() => {
                            year = yr;
                            // Reset quarter to first available for this year
                            const availableQuarters = dateList
                              ?.filter((d) => d.fiscalYear === yr)
                              ?.map((d) => d.quarter)
                              ?.sort((a, b) => b - a);
                            quarter = availableQuarters[0] ?? 1;
                            getTranscripts();
                          }}
                          class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                        >
                          FY {yr}
                        </DropdownMenu.Item>
                      {:else}
                        <DropdownMenu.Item
                          on:click={() => goto("/pricing")}
                          class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                        >
                          <div class="flex flex-row items-center gap-x-2">
                            <span>FY {yr}</span>
                            <svg
                              class="size-4"
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
                          </div>
                        </DropdownMenu.Item>
                      {/if}
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
            <div class="relative inline-block text-left grow">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="w-fit transition-all duration-50 border border-gray-300 dark:border-gray-700 text-white bg-black sm:hover:bg-default dark:bg-primary dark:sm:hover:bg-secondary  flex flex-row justify-between items-center  w-full sm:w-auto px-3 rounded truncate"
                  >
                    <span class="truncate">Quarter: Q{quarter}</span>
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
                  class="min-w-40 h-fit max-h-72 overflow-y-auto scroller"
                >
                  <DropdownMenu.Group>
                    {#each quarterRange as q, index}
                      {#if ["Plus", "Pro"]?.includes(data?.user?.tier) || index === 0}
                        <DropdownMenu.Item
                          on:click={() => {
                            quarter = q;
                            getTranscripts();
                          }}
                          class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                        >
                          Q{q}
                        </DropdownMenu.Item>
                      {:else}
                        <DropdownMenu.Item
                          on:click={() => goto("/pricing")}
                          class="cursor-pointer sm:hover:bg-gray-200 dark:sm:hover:bg-primary"
                        >
                          <div class="flex flex-row items-center gap-x-2">
                            <span>Q{q}</span>
                            <svg
                              class="size-4"
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
                          </div>
                        </DropdownMenu.Item>
                      {/if}
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>

        {#if isLoaded}
          {#if chats?.length !== 0}
            <!-- Header Card -->
            <div
              class="border border-gray-300 dark:border-gray-700 rounded p-4 sm:p-6 mb-6 bg-gray-50 dark:bg-default"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <h2 class="text-lg sm:text-xl font-semibold">
                    Q{displayQuarter}
                    {displayYear} Earnings Call
                  </h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {$displayCompanyName} ({$stockTicker})
                  </p>
                </div>
                <div class="flex flex-col items-start sm:items-end gap-3">
                  <div
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <!-- AI Summarize Button -->
                  <button
                    on:click={generateSummary}
                    disabled={isGeneratingSummary}
                    class="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded transition-colors"
                  >
                    {#if isGeneratingSummary}
                      <span class="loading loading-spinner loading-xs"></span>
                    {:else}
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
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    {/if}
                    {summaryGenerated
                      ? showSummary
                        ? "Hide Summary"
                        : "Show Summary"
                      : "AI Summarize"}
                  </button>
                </div>
              </div>
            </div>

            <!-- AI Summary Panel -->
            {#if showSummary}
              <div
                class="border border-purple-300 dark:border-purple-800 rounded p-4 sm:p-6 mb-6 bg-purple-50 dark:bg-purple-950/30"
              >
                {#if isGeneratingSummary}
                  <!-- Loading State -->
                  <div class="flex flex-col items-center justify-center py-8">
                    <div class="relative">
                      <div
                        class="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 rounded-full"
                      ></div>
                      <div
                        class="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"
                      ></div>
                    </div>
                    <p
                      class="mt-4 text-sm text-purple-700 dark:text-purple-300 font-medium"
                    >
                      Analyzing transcript with AI...
                    </p>
                    <p
                      class="mt-1 text-xs text-purple-500 dark:text-purple-400"
                    >
                      Extracting key insights and financial metrics
                    </p>
                  </div>
                {:else}
                  <!-- Summary Content -->
                  <div class="space-y-6">
                    <!-- Header with Sentiment -->
                    <div
                      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div class="flex items-center gap-2">
                        <svg
                          class="w-5 h-5 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <h3
                          class="text-lg font-semibold text-purple-900 dark:text-purple-100"
                        >
                          AI-Generated Summary
                        </h3>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-sm text-gray-600 dark:text-gray-400"
                          >Overall Sentiment:</span
                        >
                        <div class="flex items-center gap-2">
                          <span
                            class="px-2.5 py-1 text-sm font-semibold {sentimentColors.text} {sentimentColors.bg} rounded-full"
                          >
                            {summaryData?.sentiment ?? "Neutral"}
                          </span>
                          <div class="flex items-center gap-1">
                            <div
                              class="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                            >
                              <div
                                class="h-full {sentimentColors.bar} rounded-full"
                                style="width: {summaryData?.sentimentScore ??
                                  50}%"
                              ></div>
                            </div>
                            <span
                              class="text-xs text-gray-500 dark:text-gray-400"
                              >{summaryData?.sentimentScore ?? 50}%</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Key Highlights -->
                    <div>
                      <h4
                        class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                          />
                        </svg>
                        Key Highlights
                      </h4>
                      <ul class="space-y-2">
                        {#each summaryData?.keyHighlights ?? [] as highlight}
                          <li
                            class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <svg
                              class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd"
                              />
                            </svg>
                            {highlight}
                          </li>
                        {/each}
                      </ul>
                    </div>

                    <!-- Risks Section -->
                    <div>
                      <h4
                        class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Risk Factors Mentioned
                      </h4>
                      <ul class="space-y-2">
                        {#each summaryData?.risks ?? [] as risk}
                          <li
                            class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <svg
                              class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                              />
                            </svg>
                            {risk}
                          </li>
                        {/each}
                      </ul>
                    </div>

                    <!-- Management Outlook -->
                    <div>
                      <h4
                        class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4 text-purple-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Management Outlook
                      </h4>
                      <p
                        class="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700"
                      >
                        {summaryData?.outlook ?? "No outlook available."}
                      </p>
                    </div>

                    <!-- Disclaimer -->
                    <p
                      class="text-xs text-gray-500 dark:text-gray-500 italic border-t border-purple-200 dark:border-purple-800 pt-4"
                    >
                      This summary was generated by AI and may not capture all
                      nuances from the earnings call. Please read the full
                      transcript for complete information.
                    </p>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- Transcript Content -->
            <div class="space-y-1">
              {#each chats as item, i}
                <div
                  class="group py-4 {i !== chats.length - 1
                    ? 'border-b border-gray-200 dark:border-gray-800'
                    : ''}"
                >
                  <!-- Speaker Header -->
                  <div class="flex items-center gap-3 mb-2">
                    {#if item?.name === "Operator"}
                      <div
                        class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"
                      >
                        <svg
                          class="w-4 h-4 text-gray-600 dark:text-gray-300"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.538T12 16q2.075 0 3.538-1.463T17 11h2q0 2.625-1.7 4.6T13 17.925V21z"
                          />
                        </svg>
                      </div>
                      <span
                        class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                      >
                        {item?.name}
                      </span>
                    {:else}
                      <div
                        class="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center flex-shrink-0 text-white text-sm font-medium"
                      >
                        {item?.name?.slice(0, 1)}
                      </div>
                      <span class="text-sm font-semibold">
                        {item?.name}
                      </span>
                    {/if}
                  </div>

                  <!-- Speech Content -->
                  <div class="pl-11">
                    <p
                      class="text-sm sm:text-[15px] leading-relaxed text-gray-700 dark:text-gray-300"
                    >
                      {@html item?.description}
                    </p>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Back to Top Button -->
            <div class="flex justify-center mt-10 mb-6">
              <button
                on:click={backToTop}
                class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#202020] border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
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
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                Back to top
              </button>
            </div>
          {:else}
            <Infobox
              text={`No transcript available for ${$displayCompanyName} for Q${displayQuarter} of ${displayYear}`}
            />
          {/if}
        {:else}
          <div class="flex justify-center items-center h-80">
            <div class="relative">
              <label
                class="bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <span class="loading loading-spinner loading-md text-white"
                ></span>
              </label>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>
