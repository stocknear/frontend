<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  export let data;
  export let hideTitle = false;

  let rawData = {};
  let revenueRatio = 0;
  let epsRatio = 0;

  function compareTimes(time1, time2) {
    const [hours1, minutes1] = time1?.split(":").map(Number);
    const [hours2, minutes2] = time2?.split(":").map(Number);

    if (hours1 > hours2) return 1;
    if (hours1 < hours2) return -1;
    if (minutes1 > minutes2) return 1;
    if (minutes1 < minutes2) return -1;
    return 0;
  }

  $: {
    if ($stockTicker) {
      rawData = data?.getNextEarnings;
      epsRatio =
        rawData?.epsPrior !== 0
          ? ((rawData?.epsEst / rawData?.epsPrior - 1) * 100)?.toFixed(2)
          : null;

      revenueRatio = (
        (rawData?.revenueEst / rawData?.revenuePrior - 1) *
        100
      )?.toFixed(2);
    }
  }
</script>

{#if Object?.keys(rawData)?.length !== 0}
  <div class="space-y-3 overflow-hidden text-muted dark:text-white">
    <!--Start Content-->
    <div class="w-auto lg:w-full flex flex-col m-auto">
      {#if !hideTitle}
        <div class="flex flex-col items-center w-full mb-3">
          <div class="flex flex-row justify-start mr-auto items-center">
            <!--<img class="h-10 inline-block mr-2" src={copilotIcon} />-->
            <a
              href="/stocks/{$stockTicker}/statistics/earnings"
              class="flex flex-row items-center sm:hover:underline sm:hover:underline-offset-4"
            >
              <h3 class="mr-1 flex flex-row items-center text-2xl font-bold">
                Next Earnings Release
              </h3>
              <svg
                class="size-6 inline-block mt-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                style="max-width:40px"
                aria-hidden="true"
                ><path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                ></path></svg
              >
            </a>
          </div>
        </div>
      {/if}

      <div class=" text-[1rem]">
        {$displayCompanyName} is scheduled to release its earnings on
        <strong
          >{new Date(rawData?.date ?? null)?.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}</strong
        >,
        {#if compareTimes(rawData?.time, "16:00") >= 0}
          after market closes.
        {:else if compareTimes(rawData?.time, "09:30") <= 0}
          before market opens.
        {:else}
          during market hours.
        {/if}
        <br />Analysts project revenue of
        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
          ... Unlock content with
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
        {:else}
          <span class="font-bold"
            >{@html abbreviateNumber(rawData?.revenueEst, true, true)}</span
          >, reflecting a
          <span
            class="{revenueRatio >= 0 && revenueRatio !== 'Infinity'
              ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
              : revenueRatio < 0 && revenueRatio !== 'Infinity'
                ? 'text-red-800 dark:text-[#FF2F1F]'
                : 'text-muted dark:text-white'} font-semibold"
            >{revenueRatio !== "Infinity"
              ? abbreviateNumber(revenueRatio) + "%"
              : "n/a"}</span
          >
          YoY {revenueRatio > 0
            ? "growth"
            : revenueRatio < 0
              ? "shrinking"
              : ""}
          {#if epsRatio !== null}
            and earnings per share of
            <span class="font-bold">{rawData?.epsEst}</span>, making a
            <span
              class="{epsRatio > 0
                ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
                : 'text-red-800 dark:text-[#FF2F1F]'} font-semibold"
              >{epsRatio}%</span
            >
            {epsRatio > 0 ? "increase" : epsRatio < 0 ? "decrease" : ""} YoY.
          {:else}
            and earnings per share of
            <span class="font-semibold">{rawData?.epsEst}</span>.
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
