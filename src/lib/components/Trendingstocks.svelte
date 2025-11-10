<script lang="ts">
  import { stockTicker } from "$lib/store";
  import amdLogo from "$lib/images/stocks/logo/AMD.png";
  import tslaLogo from "$lib/images/stocks/logo/TSLA.png";
  import aaplLogo from "$lib/images/stocks/logo/AAPL.png";
  import nvdaLogo from "$lib/images/stocks/logo/NVDA.png";

  export let trendingList: List;
  export let color;

  async function stockSelector(state) {
    stockTicker.update((value) => state);
  }

  $: {
    if (trendingList) {
      for (const item of trendingList) {
        if (item?.symbol === "AMD") {
          item.image = amdLogo;
        } else if (item?.symbol === "TSLA") {
          item.image = tslaLogo;
        } else if (item?.symbol === "AAPL") {
          item.image = aaplLogo;
        } else if (item?.symbol === "NVDA") {
          item.image = nvdaLogo;
        }
      }
      trendingList = [...trendingList];
    }
  }
</script>

<section
  class="relative flex justify-between items-center bg-[{color}] rounded"
>
  <div class="max-w-3xl m-auto">
    <div
      class="flex flex-row justify-start items-cneter overflow-hidden w-full pb-2"
    >
      {#if trendingList?.length !== 0}
        {#each trendingList as item}
          <a
            href={"/stocks/" + item?.symbol}
            on:click={() => stockSelector(item?.symbol)}
            class="h-18 w-[90px] sm:w-28 mt-5 rounded-xl flex flex-col justify-center items-center"
          >
            <img class="relative mb-2 rounded w-5 h-5" src={item?.image} />
            <p class="text-center text-white text-sm whitespace-normal mb-0.5">
              {item?.symbol}
            </p>
            <div
              class="flex justify-center items-center m-auto text-xs sm:text-sm relative bottom-0"
            >
              {#if item?.changesPercentage >= 0}
                <svg
                  class="w-2.5 h-2.5 inline-block mt-0.5 mr-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  ><g
                    ><path
                      fill="#00FC50"
                      d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"
                    /></g
                  ></svg
                >
                <span class="items-center justify-start text-[#00FC50]"
                  >+{item?.changesPercentage?.toFixed(2)}%</span
                >
              {:else}
                <svg
                  class="w-2.5 h-2.5 inline-block mt-0.5 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  ><g transform="rotate(180 12 12)"
                    ><path
                      fill="#FF2F1F"
                      d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z"
                    /></g
                  ></svg
                >
                <span class="items-center justify-start text-[#FF2F1F]">
                  {item?.changesPercentage?.toFixed(2)}%
                </span>
              {/if}
            </div>
          </a>
        {/each}
      {:else}
        <div class="m-auto w-full mt-5">
          <div role="status" class="animate-pulse">
            <div class="w-full flex flex-row items-center">
              <div class="flex flex-col items-center mr-10 sm:mr-14">
                <div class="bg-slate-400 rounded-full w-12 h-12"></div>
                <div class="bg-slate-400 rounded w-12 h-4 mt-3"></div>
              </div>
              <div class="flex flex-col items-center mr-10 sm:mr-14">
                <div class="bg-slate-400 rounded-full w-12 h-12"></div>
                <div class="bg-slate-400 rounded w-12 h-4 mt-3"></div>
              </div>
              <div class="flex flex-col items-center mr-10 sm:mr-14">
                <div class="bg-slate-400 rounded-full w-12 h-12"></div>
                <div class="bg-slate-400 rounded w-12 h-4 mt-3"></div>
              </div>
              <div class="flex flex-col items-center">
                <div class="bg-slate-400 rounded-full w-12 h-12"></div>
                <div class="bg-slate-400 rounded w-12 h-4 mt-3"></div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  a:hover img {
    animation-name: shake;
    animation-duration: 0.5s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }

  @keyframes shake {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(10deg);
    }
    50% {
      transform: rotate(0deg);
    }
    75% {
      transform: rotate(-10deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  :root {
    --primary-color: mediumslateblue;
  }
</style>
