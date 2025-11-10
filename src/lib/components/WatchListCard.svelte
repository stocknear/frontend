<script lang="ts">
  import { onMount } from "svelte";
  import { switchWatchList, screenWidth } from "$lib/store";
  import { formatDate, abbreviateNumber } from "$lib/utils";

  export let watchListId;
  export let indicatorList;

  let isLoaded = false;

  let watchList: any[] = [];
  let news = [];

  async function getWatchlistData() {
    const postData = { watchListId: watchListId };

    const response = await fetch("/api/get-watchlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const output = await response?.json();

    watchList = output?.at(0);
    news = output[1];
  }

  onMount(async () => {
    await getWatchlistData();
    isLoaded = true;
  });

  $: charNumber = $screenWidth < 640 ? 15 : 20;

  $: {
    if ($switchWatchList && typeof window !== "undefined") {
      isLoaded = false;
      getWatchlistData();

      isLoaded = true;
      $switchWatchList = false;
    }
  }
</script>

<section
  class="w-full overflow-hidden m-auto min-h-screen pt-10 mb-40 px-1 sm:px-0"
>
  {#if isLoaded}
    <!--Start Tickersinfo Length-->
    {#if watchList.length !== 0}
      <div class="w-screen sm:w-full">
        <div class="w-full overflow-x-auto">
          <table
            class="table table-sm table-compact rounded-none sm:rounded w-full bg-table border border-gray-800 m-auto mt-4"
          >
            <!-- head -->
            <thead>
              <tr class="border-b-[#09090B]">
                <th class="text-white font-semibold text-sm">Symbol</th>
                <th class="text-white font-semibold text-sm">Company</th>
                {#each indicatorList as item}
                  <th class="text-white font-semibold text-end text-sm"
                    >{item}</th
                  >
                {/each}
              </tr>
            </thead>
            <tbody class="p-0">
              {#each watchList as item}
                <!-- row -->
                <tr
                  class="dark:sm:hover:bg-[#245073]/10 odd:bg-[#F6F7F8] dark:odd:bg-oddborder-b-[#09090B]"
                >
                  <td
                    class="text-sm sm:text-[1rem] text-start border-b-[#09090B]"
                  >
                    <a
                      href={`/${item?.type === "stock" ? "stocks" : item?.type === "etf" ? "etf" : "crypto"}/${item?.symbol}`}
                      class="text-blue-400 sm:hover:text-white"
                    >
                      {item?.symbol}
                    </a>
                  </td>

                  <td
                    class="text-white text-sm sm:text-[1rem] border-b-[#09090B] whitespace-nowrap"
                  >
                    {item?.name?.length > charNumber
                      ? item?.name?.slice(0, charNumber) + "..."
                      : item?.name}
                  </td>

                  <td
                    class="text-white text-sm sm:text-[1rem] text-end border-b-[#09090B]"
                  >
                    {item?.eps !== null ? item?.eps?.toFixed(2) : "-"}
                  </td>

                  <td
                    class="text-white text-sm sm:text-[1rem] text-end border-b-[#09090B]"
                  >
                    {item?.pe !== null ? item?.pe?.toFixed(2) : "-"}
                  </td>

                  <td
                    class="text-white text-sm sm:text-[1rem] whitespace-nowrap text-end border-b-[#09090B]"
                  >
                    {abbreviateNumber(item?.volume)}
                  </td>

                  <td
                    class="text-white text-sm sm:text-[1rem] whitespace-nowrap text-end border-b-[#09090B]"
                  >
                    {abbreviateNumber(item?.marketCap, true)}
                  </td>

                  <td
                    class="border-b-[#09090B] text-sm sm:text-[1rem] text-end text-white whitespace-nowrap"
                  >
                    ${item.price?.toFixed(2)}
                  </td>

                  <td
                    class="border-b-[#09090B] text-end text-sm sm:text-[1rem] whitespace-nowrap"
                  >
                    {#if item?.changesPercentage >= 0}
                      <span class="text-green-800 dark:text-[#00FC50]"
                        >+{item?.changesPercentage?.toFixed(2)}%</span
                      >
                    {:else}
                      <span class="text-red-800 dark:text-[#FF2F1F]"
                        >{item?.changesPercentage?.toFixed(2)}%
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="w-full m-auto border-b border-gray-600 mt-16 mb-16"></div>

        <h2
          class="text-start text-white ml-2 text-xl font-bold text-black mb-3"
        >
          Latest News
        </h2>
        <div class="relative text-gray-800 m-auto">
          <div class="flex flex-wrap md:flex-row">
            {#each news as item}
              <a
                href={item.url}
                target="_blank"
                class="cursor-pointer mb-10 w-full"
              >
                <div class="shrink-0 float-left">
                  <img
                    src={item?.image}
                    class="float-left w-36 sm:w-40 rounded-xl ml-2 mr-4 mb-2"
                    alt="news image"
                    loading="lazy"
                  />
                  <div
                    class="absolute w-36 sm:w-40 ml-2 mr-4 mb-2 h-6 bg-[#0C0F17] bg-opacity-80 flex justify-center items-center"
                  >
                    <p class="text-white italic text-xs">
                      {new URL(item?.url).hostname.replace("www.", "")}
                    </p>
                  </div>
                </div>
                <div class="grow">
                  <div class="text-sm text-white flex flex-row">
                    <div
                      class="rounded-full w-6 h-6 relative bg-gray-800 mr-1.5 mb-0.5"
                    >
                      <img
                        class="rounded-full w-4 h-4 absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        src={`https://financialmodelingprep.com/image-stock/${item.symbol}.png`}
                        loading="lazy"
                      />
                    </div>
                    {item?.symbol} &centerdot; {formatDate(item?.publishedDate)}
                    ago
                  </div>
                  <h2
                    class="text-start text-sm sm:text-md mb-2 shrink text-white"
                  >
                    {item.title}
                  </h2>
                  <p class="text-white text-sm sm:text-md p-2">
                    {item?.text?.length > 250
                      ? item?.text?.slice(0, 250) + "..."
                      : item?.text}
                  </p>
                </div>
              </a>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="flex flex-col justify-center items-center m-auto pt-5">
        <span class="text-white font-bold text-white text-xl sm:text-3xl">
          Empty Watchlist
        </span>

        <span class="text-white text-sm sm:text-lg pt-5 m-auto p-4 text-center">
          Fill it up with your favorite stocks and get realtime data and the
          latest news in one place!
        </span>
      </div>
    {/if}
    <!--End Tickersinfo Length-->
  {:else}
    <div class="flex justify-center items-center h-80">
      <div class="relative">
        <label
          class="bg-secondary rounded h-14 w-14 flex justify-center items-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <span class="loading loading-spinner loading-md"></span>
        </label>
      </div>
    </div>
  {/if}
</section>
