<script lang="ts">
  import { stockTicker } from "$lib/store";
  import InfoModal from "$lib/components/InfoModal.svelte";

  export let stockDeck: Array<{ stockSplits: Array<any> }> | undefined;

  let showFullHistory = false;
  let stockSplits: Array<any> = [];

  $: {
    if (
      $stockTicker &&
      typeof window !== "undefined" &&
      stockDeck &&
      stockDeck.length > 0
    ) {
      stockSplits = stockDeck?.stockSplits || [];
      showFullHistory = false;
    }
  }
</script>

<section class="overflow-hidden text-white h-full">
  <main class="overflow-hidden">
    <div class="flex flex-row items-center">
      <label
        for="stockSplitsInfo"
        class="mr-1 cursor-pointer flex flex-row items-center text-white text-xl sm:text-3xl font-bold"
      >
        Stock Splits
      </label>
      <InfoModal
        title={"Stock Splits"}
        content={"A stock split is when a company increases the number of its shares and lowers the price per share. This makes the stock more accessible to investors but doesn't change the total value of your investment."}
        id={"stockSplitsInfo"}
      />
    </div>

    {#if stockSplits?.length !== 0}
      <div class="mt-16">
        {#each showFullHistory ? stockSplits : stockSplits?.slice(0, 3) as item, index}
          <div
            class="w-full -my-10 {index === 2 &&
            !showFullHistory &&
            stockSplits?.length > 3
              ? 'opacity-[0.5]'
              : ''} "
          >
            <div class="relative py-4 sm:pl-3">
              <div class="pl-1">
                <div class="flex justify-center">
                  <div
                    class="absolute left-0 h-20 px-px bg-gray-800 ml-4 sm:ml-5 transform -translate-x-1/2"
                  ></div>
                  <div
                    class="absolute left-0 w-4 h-4 bg-[#00FC50] border-4 box-content border-gray-900 rounded-full ml-4 sm:ml-5 transform -translate-x-1/2"
                  ></div>

                  <!--Start Item-->
                  <div class="flex flex-row items-center ml-5 w-full mb-6">
                    <div
                      class="w-full rounded bg-primary shadow-lg h-16 pl-3 ml-6 sm:ml-3 pt-2"
                    >
                      <div class="flex flex-row items-center">
                        <div class="flex flex-col">
                          <span
                            class="text-slate-400 text-sm sm:text-md mb-2 mr-auto"
                          >
                            Date
                          </span>
                          <span class="text-white text-sm sm:text-md">
                            {new Date(item?.date)?.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              daySuffix: "2-digit",
                            })}
                          </span>
                        </div>

                        <div class="flex flex-col ml-auto pr-3">
                          <div
                            class="text-slate-400 text-sm sm:text-md mb-2 ml-auto"
                          >
                            From
                            <span class="text-white">{item?.denominator}</span>
                          </div>
                          <div
                            class="text-slate-400 text-sm sm:text-md ml-auto"
                          >
                            To
                            <span class="text-white">{item?.numerator}</span>
                          </div>
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

      {#if stockSplits?.length > 3}
        <label
          on:click={() => (showFullHistory = !showFullHistory)}
          class="cursor-pointer flex justify-center items-center mt-5"
        >
          <svg
            class="w-10 h-10 transform {showFullHistory ? 'rotate-180' : ''} "
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            ><path
              fill="#2A323C"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 13.5L7.5 11l1.42-1.41L12 12.67l3.08-3.08L16.5 11L12 15.5z"
            /></svg
          >
        </label>
      {/if}
    {:else}
      <h2
        class="mt-10 mb-5 flex justify-center items-center text-3xl font-bold text-slate-700 m-auto"
      >
        No data available
        <svg
          class="w-10 sm:w-12 inline-block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          ><path
            fill="#334155"
            d="M18.68 12.32a4.49 4.49 0 0 0-6.36.01a4.49 4.49 0 0 0 0 6.36a4.508 4.508 0 0 0 5.57.63L21 22.39L22.39 21l-3.09-3.11c1.13-1.77.87-4.09-.62-5.57m-1.41 4.95c-.98.98-2.56.97-3.54 0c-.97-.98-.97-2.56.01-3.54c.97-.97 2.55-.97 3.53 0c.97.98.97 2.56 0 3.54M10.9 20.1a6.527 6.527 0 0 1-1.48-2.32C6.27 17.25 4 15.76 4 14v3c0 2.21 3.58 4 8 4c-.4-.26-.77-.56-1.1-.9M4 9v3c0 1.68 2.07 3.12 5 3.7v-.2c0-.93.2-1.85.58-2.69C6.34 12.3 4 10.79 4 9m8-6C7.58 3 4 4.79 4 7c0 2 3 3.68 6.85 4h.05c1.2-1.26 2.86-2 4.6-2c.91 0 1.81.19 2.64.56A3.215 3.215 0 0 0 20 7c0-2.21-3.58-4-8-4Z"
          /></svg
        >
      </h2>
    {/if}
  </main>
</section>
