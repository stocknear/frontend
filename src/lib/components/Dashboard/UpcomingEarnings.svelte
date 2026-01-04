<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import { compareTimes, abbreviateNumber } from "$lib/utils";

  export let upcomingEarnings = [];
</script>

<section>
  <a href="/earnings-calendar/" class="inline-flex items-center"
    ><h2
      class="mb-2 text-xl font-bold leading-tight bp:text-2xl bp:leading-tight sm:hover:underline sm:hover:underline-offset-4"
    >
      Upcoming Earnings
    </h2>
    <svg
      class="h-5 w-5"
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
      class="border-t border-gray-300 dark:border-gray-800 text-sm sm:text-[1rem]"
    >
      <tbody>
        {#each upcomingEarnings as item}
          <tr class="border-b border-gray-300 dark:border-gray-800">
            <td class="py-2 pl-2">
              <strong>{item?.name}</strong>
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
              {/if}Analysts estimate {abbreviateNumber(item?.revenueEst)} in revenue
              ({((item?.revenueEst / item?.revenuePrior - 1) * 100)?.toFixed(
                2,
              )}% YoY) and {item?.epsEst} in earnings per share
              {#if item?.epsPrior !== 0}
                ({((item?.epsEst / item?.epsPrior - 1) * 100)?.toFixed(2)}%
                YoY).
              {/if}

              <a
                href={`/stocks/${item?.symbol}`}
                class="inline-block rounded badge border border-gray-300 dark:border-gray-800 shadow duration-0 bg-blue-100 dark:bg-primary font-semibold dark:font-normal rounded-sm ml-1 px-2 m-auto text-violet-800 dark:text-violet-400 dark:sm:hover:text-white sm:hover:text-muted"
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
