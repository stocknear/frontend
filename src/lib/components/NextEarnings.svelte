<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import * as m from "$lib/paraglide/messages";
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
  <div class="space-y-3 overflow-hidden text-gray-700 dark:text-zinc-200">
    <!--Start Content-->
    <div class="w-auto lg:w-full flex flex-col m-auto">
      {#if !hideTitle}
        <div class="flex flex-col items-center w-full mb-3">
          <div class="flex flex-row justify-start mr-auto items-center">
            <!--<img class="h-10 inline-block mr-2" src={copilotIcon} />-->
            <a
              href="/stocks/{$stockTicker}/statistics/earnings"
              class="flex flex-row items-center hover:text-violet-600 dark:hover:text-violet-400 transition"
            >
              <h3
                class="mr-1 flex flex-row items-center text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                {m.stock_detail_next_earnings_release()}
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

      <div class="text-sm text-gray-800 dark:text-zinc-300">
        {m.stock_detail_earnings_scheduled({ company: $displayCompanyName })}
        <strong
          >{new Date(rawData?.date ?? null)?.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}</strong
        >,
        {#if compareTimes(rawData?.time, "16:00") >= 0}
          {m.stock_detail_after_market_closes()}
        {:else if compareTimes(rawData?.time, "09:30") <= 0}
          {m.stock_detail_before_market_opens()}
        {:else}
          {m.stock_detail_during_market_hours()}
        {/if}
        <br />{m.stock_detail_analysts_project_revenue()}
        {#if !["Pro", "Plus"]?.includes(data?.user?.tier)}
          ...
          <a
            class="inline-block ml-0.5 text-gray-800 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400"
            href="/pricing"
            >{m.stock_detail_upgrade()} <svg
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
          >, {m.stock_detail_reflecting_a()}
          <span
            class="{revenueRatio >= 0 && revenueRatio !== 'Infinity'
              ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
              : revenueRatio < 0 && revenueRatio !== 'Infinity'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-gray-500 dark:text-zinc-400'} font-semibold"
            >{revenueRatio !== "Infinity"
              ? abbreviateNumber(revenueRatio) + "%"
              : "n/a"}</span
          >
          {m.stock_detail_yoy()} {revenueRatio > 0
            ? m.stock_detail_yoy_growth()
            : revenueRatio < 0
              ? m.stock_detail_yoy_shrinking()
              : ""}
          {#if epsRatio !== null}
            {m.stock_detail_and_eps_of()}
            <span class="font-bold">{rawData?.epsEst}</span>, {m.stock_detail_making_a()}
            <span
              class="{epsRatio > 0
                ? "before:content-['+'] text-emerald-600 dark:text-emerald-400"
                : 'text-rose-600 dark:text-rose-400'} font-semibold"
              >{epsRatio}%</span
            >
            {epsRatio > 0 ? m.stock_detail_increase() : epsRatio < 0 ? m.stock_detail_decrease() : ""} {m.stock_detail_yoy()}.
          {:else}
            {m.stock_detail_and_eps_of()}
            <span class="font-semibold">{rawData?.epsEst}</span>.
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
