<script lang="ts">
  import * as Card from "$lib/components/shadcn/card/index.ts";
  import Infobox from "$lib/components/Infobox.svelte";
  import { formatTime, abbreviateNumber } from "$lib/utils";
  import {
    dashboard_recent_earnings_after_time,
    dashboard_recent_earnings_decline,
    dashboard_recent_earnings_empty,
    dashboard_recent_earnings_eps,
    dashboard_recent_earnings_eps_yoy,
    dashboard_recent_earnings_exceeds,
    dashboard_recent_earnings_growth,
    dashboard_recent_earnings_misses,
    dashboard_recent_earnings_revenue,
    dashboard_recent_earnings_title,
  } from "$lib/paraglide/messages.js";

  export let recentEarnings;
</script>

<Card.Root
  class=" bg-gray-50 dark:bg-default overflow-x-auto overflow-hidden overflow-y-auto  h-fit"
>
  <Card.Header class="flex flex-row items-center">
    <div class="flex flex-col items-start w-full">
      <div class="flex flex-row w-full items-center">
        <Card.Title
          class="text-xl sm:text-2xl text-muted dark:text-white font-semibold"
          ><a
            href="/earnings-calendar"
            class="text-xl sm:text-2xl text-muted dark:text-white font-semibold cursor-pointer sm:hover:underline sm:hover:underline-offset-4"
          >
            {dashboard_recent_earnings_title()}
            <svg
              class="h-5 w-5 inline-block"
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
          ></Card.Title
        >
      </div>
    </div>
  </Card.Header>
  <Card.Content>
    {#if recentEarnings?.length !== 0}
      <ul style="padding-left: 5px;">
        {#each recentEarnings as item}
          <strong>{item?.name}</strong> (<a
            href={`/stocks/${item?.symbol}`}
            class="text-violet-800 dark:text-violet-400 dark:sm:hover:text-white sm:hover:text-muted cursor-pointer"
            >{item?.symbol}</a
          >) {dashboard_recent_earnings_after_time({ time: formatTime(item?.time) })}

          <li
            class="text-sm sm:text-[1rem] text-muted dark:text-white"
            style="margin-top:10px; margin-left: 30px; margin-bottom: 10px; list-style-type: disc;"
          >
            {dashboard_recent_earnings_revenue({
              revenue: abbreviateNumber(item?.revenue),
              direction:
                item?.revenueSurprise > 0
                  ? dashboard_recent_earnings_exceeds()
                  : dashboard_recent_earnings_misses(),
              surprise: abbreviateNumber(Math.abs(item?.revenueSurprise)),
              yoy: ((item?.revenue / item?.revenuePrior - 1) * 100)?.toFixed(2),
              trend:
                item?.revenue / item?.revenuePrior - 1 < 0
                  ? dashboard_recent_earnings_decline()
                  : dashboard_recent_earnings_growth(),
            })}
          </li>
          <li
            class="text-muted dark:text-white"
            style="line-height: 22px; margin-top:0px; margin-left: 30px; margin-bottom: 30px; list-style-type: disc;"
          >
            {dashboard_recent_earnings_eps({
              eps: item?.eps,
              direction:
                item?.epsSurprise > 0
                  ? dashboard_recent_earnings_exceeds()
                  : dashboard_recent_earnings_misses(),
              surprise: item?.epsSurprise?.toFixed(2),
            })}
            {#if item?.epsPrior}
              {dashboard_recent_earnings_eps_yoy({
                yoy: (
                  ((item?.eps - item?.epsPrior) / Math.abs(item?.epsPrior)) *
                  100
                )?.toFixed(2),
                trend:
                  (item?.eps - item?.epsPrior) / Math.abs(item?.epsPrior) < 0
                    ? dashboard_recent_earnings_decline()
                    : dashboard_recent_earnings_growth(),
              })}
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <Infobox
        text={dashboard_recent_earnings_empty()}
      />
    {/if}
  </Card.Content>
</Card.Root>
