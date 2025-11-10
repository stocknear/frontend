<script lang="ts">
  import { stockTicker, etfTicker, indexTicker } from "$lib/store";
  import InfoModal from "$lib/components/InfoModal.svelte";
  import { get } from "svelte/store";
  import { formatDate } from "$lib/utils";

  export let data;

  let wiim = [];
  let showFullHistory = false;

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
    return differenceInDays <= 1;
  }

  $: {
    if (get(stockTicker) || get(etfTicker) || get(indexTicker)) {
      showFullHistory = false;
      wiim = data?.getWhyPriceMoved || [];
    }
  }
</script>

<section class="overflow-hidden text-muted dark:text-white h-full mt-5">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="whyPriceMovedInfo"
        class="mr-1 cursor-pointer flex flex-row items-center text-2xl font-bold"
      >
        <h2>Why Price Moved</h2>
      </label>
      <InfoModal
        title={"Why Price Moved"}
        content={"Why Price Moved is a one-sentence explanation of why a stock is moving higher or down. By removing noise and collecting signals from news, press releases and SEC filings, we can pinpoint the trigger for price movements."}
        id={"whyPriceMovedInfo"}
      />
    </div>

    {#if wiim?.length !== 0}
      <div class="mt-5">
        {#each showFullHistory ? wiim : wiim?.slice(0, 2) as item, index}
          <div
            class="w-full {index === 1 && !showFullHistory && wiim?.length > 2
              ? 'opacity-[0.5]'
              : ''} "
          >
            <div class="relative">
              <div class="">
                <div class="flex justify-center">
                  <!--Start Item-->
                  <div class="flex flex-row items-center w-full mb-8">
                    <!-- Vertical Line -->
                    <div
                      class="w-1 h-full mr-4 rounded {item?.changesPercentage ===
                      '-'
                        ? 'bg-black dark:bg-white'
                        : item?.changesPercentage >= 0
                          ? 'bg-black dark:bg-[#00FC50]'
                          : 'bg-black dark:bg-[#FF2F1F]'}"
                    ></div>
                    <!-- Item Content -->

                    <div class="w-full h-full">
                      <div class="flex flex-col items-start">
                        <div class="flex flex-row items-start w-full">
                          <span class=" text-[1rem]"
                            >{formatDate(item?.date)}
                            <!--
                            &#183;
                            <a
                              href={item?.url}
                              class="inline-block text-sm  sm:hover:underline sm:hover:underline-offset-4"
                            >
                              Source
                            </a>
                            -->
                          </span>
                          {#if latestInfoDate(item?.date)}
                            <label
                              class="bg-black text-white border border-gray-200 dark:border-0 dark:bg-[#fff] rounded dark:text-black font-semibold text-xs px-2 py-0.5 ml-3"
                              >New</label
                            >
                          {/if}
                          <div class=" text-sm sm:text-[1rem] ml-auto">
                            {#if item?.changesPercentage >= 0}
                              <span
                                class="text-green-800 dark:text-[#00FC50] inline-block"
                                >+{item?.changesPercentage}%</span
                              >
                            {:else if item?.changesPercentage < 0}
                              <span
                                class="text-red-800 dark:text-[#FF2F1F] inline-block"
                                >{item?.changesPercentage}%
                              </span>
                            {/if}
                          </div>
                        </div>

                        <div class="flex flex-col w-full pt-2">
                          {#if index === 0 && !["Pro", "Plus"]?.includes(data?.user?.tier)}
                            <span class="mt-3">
                              {item?.text?.slice(0, 50) + "..."}
                              Unlock content with
                              <a
                                class="inline-block ml-0.5 text-blue-800 sm:hover:text-muted dark:text-blue-400 dark:sm:hover:text-white"
                                href="/pricing"
                                >Pro Subscription <svg
                                  class="w-4 h-4 mb-1 inline-block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  ><path
                                    fill="currentColor"
                                    d="M17 9V7c0-2.8-2.2-5-5-5S7 4.2 7 7v2c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3M9 7c0-1.7 1.3-3 3-3s3 1.3 3 3v2H9z"
                                  /></svg
                                ></a
                              >
                            </span>
                          {:else}
                            <span class=" text-[1rem]">
                              {item?.text}
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>
                  <!--End Item-->
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if wiim?.length > 2}
        <label
          on:click={() => (showFullHistory = !showFullHistory)}
          class="cursor-pointer flex justify-center items-center mt-5"
        >
          <svg
            class="w-10 h-10 transform text-black dark:text-[#2A323C] {showFullHistory
              ? 'rotate-180'
              : ''} "
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"
            /></svg
          >
        </label>
      {/if}
    {/if}
  </main>
</section>
