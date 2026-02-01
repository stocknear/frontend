<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import { compareTimes, abbreviateNumber } from "$lib/utils";
  import {
    dashboard_upcoming_earnings_after_market,
    dashboard_upcoming_earnings_before_market,
    dashboard_upcoming_earnings_during_market,
    dashboard_upcoming_earnings_empty,
    dashboard_upcoming_earnings_eps_yoy,
    dashboard_upcoming_earnings_estimate,
    dashboard_upcoming_earnings_monday,
    dashboard_upcoming_earnings_title,
    dashboard_upcoming_earnings_today,
    dashboard_upcoming_earnings_tomorrow,
  } from "$lib/paraglide/messages.js";

  export let upcomingEarnings = [];
</script>

<section class="mx-auto w-full text-gray-700 dark:text-zinc-200">
  <a
    href="/earnings-calendar/"
    class="inline-flex items-center gap-1 text-left w-full text-gray-900 dark:text-white group"
    ><h2
      class="mb-2 text-lg sm:text-xl font-semibold tracking-tight sm:group-hover:underline sm:group-hover:underline-offset-4"
    >
      {dashboard_upcoming_earnings_title()}
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
      ></path></svg>
</a
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
                ? dashboard_upcoming_earnings_today()
                : ["Monday", "Tuesday", "Wednesday", "Thursday"].includes(
                      new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                      }),
                    )
                  ? dashboard_upcoming_earnings_tomorrow()
                  : dashboard_upcoming_earnings_monday()}
              {#if item?.time}
                {#if compareTimes(item?.time, "16:00") >= 0}
                  {dashboard_upcoming_earnings_after_market()}
                {:else if compareTimes(item?.time, "09:30") <= 0}
                  {dashboard_upcoming_earnings_before_market()}
                {:else}
                  {dashboard_upcoming_earnings_during_market()}
                {/if}
              {/if}
              {dashboard_upcoming_earnings_estimate({
                revenue: abbreviateNumber(item?.revenueEst),
                revenueYoy: ((item?.revenueEst / item?.revenuePrior - 1) * 100)?.toFixed(2),
                eps: item?.epsEst,
              })}
              {#if item?.epsPrior !== 0}
                {dashboard_upcoming_earnings_eps_yoy({
                  epsYoy: ((item?.epsEst / item?.epsPrior - 1) * 100)?.toFixed(2),
                })}
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
    <Infobox text={dashboard_upcoming_earnings_empty()} />
  {/if}
</section>
