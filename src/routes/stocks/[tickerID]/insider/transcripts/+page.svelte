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

  let chats = [];
  let date;

  const now = new Date();
  let year = now.getFullYear();
  let quarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = new Date().getFullYear();
  let yearRange = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  let displayQuarter = quarter;
  let displayYear = year;
  let isLoaded = false;

  function backToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const getTranscripts = async () => {
    isLoaded = false;
    chats = [];
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
            <div class="relative inline-block text-left grow">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    builders={[builder]}
                    class="w-full  border-gray-300 dark:border-gray-600 border bg-black sm:hover:bg-default text-white dark:sm:hover:bg-primary ease-out  flex flex-row justify-between items-center px-3 py-2  rounded truncate"
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
                  class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                >
                  <DropdownMenu.Label class="text-gray-400">
                    Select Year
                  </DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Group>
                    {#each yearRange as index}
                      <DropdownMenu.Item
                        on:click={() => {
                          year = index;
                          getTranscripts();
                        }}
                        class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                      >
                        {index}
                      </DropdownMenu.Item>
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
                    class="w-full  border-gray-300 dark:border-gray-600 border  bg-black sm:hover:bg-default text-white dark:sm:hover:bg-primary ease-out  flex flex-row justify-between items-center px-3 py-2  rounded truncate"
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
                  class="w-56 h-fit max-h-72 overflow-y-auto scroller"
                >
                  <DropdownMenu.Label class="text-gray-400">
                    Select Quarter
                  </DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Group>
                    {#each [1, 2, 3, 4] as index}
                      <DropdownMenu.Item
                        on:click={() => {
                          quarter = index;
                          getTranscripts();
                        }}
                        class="cursor-pointer sm:hover:bg-gray-300 dark:sm:hover:bg-primary"
                      >
                        Q{index}
                      </DropdownMenu.Item>
                    {/each}
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>

        {#if isLoaded}
          {#if chats?.length !== 0}
            <div class="flex flex-col sm:flex-row items-center pt-5 pb-5">
              <span class=" text-md">
                Q{displayQuarter}
                {displayYear} · Earnings Call Transcript
              </span>
              <span class=" text-opacity-80 text-md mt-2 sm:mt-0 sm:ml-auto">
                {new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {#each chats as item}
              {#if item?.name === "Operator"}
                <div class="flex flex-col items-start gap-2.5 mt-5">
                  <div class="flex flex-row items-center ml-auto mr-2">
                    <div
                      class="flex items-center space-x-2 rtl:space-x-reverse"
                    >
                      <span class="text-sm">
                        {item?.name}
                      </span>
                    </div>
                    <div
                      class="ml-2 avatar rounded-full w-8 h-8 sm:w-10 sm:h-10 relative border border-gray-300 dark:border-gray-600 bg-opacity-[0.6] flex items-center justify-center"
                    >
                      <svg
                        class="w-6 h-6 sm:w-7 sm:h-7"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        ><path
                          fill="currentColor"
                          d="M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14m-1 7v-3.075q-2.6-.35-4.3-2.325T5 11h2q0 2.075 1.463 3.538T12 16q2.075 0 3.538-1.463T17 11h2q0 2.625-1.7 4.6T13 17.925V21z"
                        /></svg
                      >
                    </div>
                  </div>
                  <div
                    class=" flex flex-col w-full leading-1.5 p-4 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-primary rounded-l-xl rounded-tr-xl"
                  >
                    <p class="text-sm font-normal py-2.5">
                      {@html item?.description}
                    </p>
                  </div>
                </div>
              {:else}
                <div class="flex flex-col items-start gap-2.5 mt-8">
                  <div class="flex flex-row items-center">
                    <div
                      class="avatar rounded-full w-8 h-8 sm:w-10 sm:h-10 relative bg-red-600 bg-opacity-[0.6] flex items-center justify-center text-sm sm:"
                    >
                      <span
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        {item?.name?.slice(0, 1)}
                      </span>
                    </div>
                    <div
                      class="ml-2 flex items-center space-x-2 rtl:space-x-reverse"
                    >
                      <span class="text-sm">
                        {item?.name}
                      </span>
                    </div>
                  </div>
                  <div
                    class="flex flex-col w-full leading-1.5 p-4 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-secondary rounded-r-xl rounded-tl-xl"
                  >
                    <p class="text-sm font-normal py-2.5">
                      {@html item?.description}
                    </p>
                  </div>
                </div>
              {/if}
            {/each}

            <label
              on:click={backToTop}
              class="w-32 py-1.5 mt-10 dark:sm:hover:bg-white hover:bg-opacity-[0.05] cursor-pointer m-auto flex justify-center items-center border border-gray-600 rounded-full"
            >
              Back to top
            </label>
          {:else}
            <Infobox
              text={`No transcript available for ${$displayCompanyName} for the Q${displayQuarter} of ${displayYear}`}
            />
          {/if}
        {:else}
          <div class="flex justify-center items-center h-80">
            <div class="relative">
              <label
                class=" bg-default dark:bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <span
                  class="loading loading-spinner loading-md text-white dark:text-white"
                ></span>
              </label>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>
