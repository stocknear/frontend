<script lang="ts">
  import * as Card from "$lib/components/shadcn/card/index.ts";
  import Infobox from "$lib/components/Infobox.svelte";
  import { formatTime, abbreviateNumber } from "$lib/utils";

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
            Recent Earnings
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
              ></path></svg
            ></a
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
            class="text-blue-800 dark:text-blue-400 dark:sm:hover:text-white sm:hover:text-muted cursor-pointer"
            >{item?.symbol}</a
          >) has released its quarterly earnings at {formatTime(item?.time)}:

          <li
            class="text-sm sm:text-[1rem] text-muted dark:text-white"
            style="margin-top:10px; margin-left: 30px; margin-bottom: 10px; list-style-type: disc;"
          >
            Revenue of {abbreviateNumber(item?.revenue)}
            {item?.revenueSurprise > 0 ? "exceeds" : "misses"} estimates by {abbreviateNumber(
              Math.abs(item?.revenueSurprise),
            )}, with {((item?.revenue / item?.revenuePrior - 1) * 100)?.toFixed(
              2,
            )}% YoY {item?.revenue / item?.revenuePrior - 1 < 0
              ? "decline"
              : "growth"}.
          </li>
          <li
            class="text-muted dark:text-white"
            style="line-height: 22px; margin-top:0px; margin-left: 30px; margin-bottom: 30px; list-style-type: disc;"
          >
            EPS of {item?.eps}
            {item?.epsSurprise > 0 ? "exceeds" : "misses"} estimates by
            {item?.epsSurprise?.toFixed(2)}
            {#if item?.epsPrior}
              with {(
                ((item?.eps - item?.epsPrior) / Math.abs(item?.epsPrior)) *
                100
              )?.toFixed(2)}% YoY {(item?.eps - item?.epsPrior) /
                Math.abs(item?.epsPrior) <
              0
                ? "decline"
                : "growth"}.
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <Infobox
        text="There are no major recent earnings to report today but you can check the earnings calendar for a complete list."
      />
    {/if}
  </Card.Content>
</Card.Root>
