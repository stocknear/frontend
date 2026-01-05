<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import { compareTimes, abbreviateNumber } from "$lib/utils";

  export let upcomingEarnings = [];
</script>

<section class="mx-auto w-full text-gray-700 dark:text-zinc-200">
  <a
    href="/earnings-calendar/"
    class="inline-flex items-center gap-1 text-left w-full text-gray-900 dark:text-white group"
    ><h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight sm:group-hover:underline sm:group-hover:underline-offset-4"
    >
      Upcoming Earnings
    </h2>
    <svg
      class="h-5 w-5 text-gray-800 dark:text-zinc-300 transition group-hover:text-gray-700 dark:group-hover:text-zinc-200"
      viewBox="0 0 20 20"
      fill="currentColor"
      style="max-width:40px"
      aria-hidden="true"
      ><path
        fill-rule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clip-rule="evenodd"
      ></path></svg
    ></a
  >
  {#if upcomingEarnings?.length !== 0}
    <table
      class="w-full border-t border-gray-300 dark:border-zinc-700 text-sm sm:text-[0.95rem]"
    >
      <tbody>
        {#each upcomingEarnings as item}
          <tr class="border-b border-gray-300 dark:border-zinc-700">
            <td class="py-3 sm:pl-2 leading-6 text-gray-700 dark:text-zinc-200">
              <strong class="font-semibold text-gray-900 dark:text-white"
                >{item?.name}</strong
              >
              {item?.isToday === true
                ? "will report today"
                : ["Monday", "Tuesday", "Wednesday", "Thursday"].includes(
                      new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                      }),
                    )
                  ? "will report tomorrow"
                  : "will report monday"}
              {#if item?.time}
                {#if compareTimes(item?.time, "16:00") >= 0}
                  after market closes.
                {:else if compareTimes(item?.time, "09:30") <= 0}
                  before market opens.
                {:else}
                  during market.
                {/if}
              {/if}
              Analysts estimate {abbreviateNumber(item?.revenueEst)} in revenue ({(
                (item?.revenueEst / item?.revenuePrior - 1) *
                100
              )?.toFixed(2)}% YoY) and {item?.epsEst} in earnings per share
              {#if item?.epsPrior !== 0}
                ({((item?.epsEst / item?.epsPrior - 1) * 100)?.toFixed(2)}%
                YoY).
              {/if}

              <a
                href={`/stocks/${item?.symbol}`}
                class="inline-flex items-center rounded-full border border-gray-300 shadow dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/50 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:text-violet-400 transition sm:hover:text-muted dark:sm:hover:text-white ml-1.5"
                >{item?.symbol}</a
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <Infobox text="There are no major upcoming earnings to report today." />
  {/if}
</section>
