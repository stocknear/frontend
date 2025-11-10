<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  export let data;

  export let blogData = {};
  let epsRatio =
    blogData?.epsPrior !== 0
      ? ((blogData?.epsEst / blogData?.epsPrior - 1) * 100)?.toFixed(2)
      : null;

  let revenueRatio = (
    (blogData?.revenueEst / blogData?.revenuePrior - 1) *
    100
  )?.toFixed(2);

  function compareTimes(time1, time2) {
    const [hours1, minutes1] = time1?.split(":").map(Number);
    const [hours2, minutes2] = time2?.split(":").map(Number);

    if (hours1 > hours2) return 1;
    if (hours1 < hours2) return -1;
    if (minutes1 > minutes2) return 1;
    if (minutes1 < minutes2) return -1;
    return 0;
  }
</script>

<div
  class="mb-6 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3"
>
  <p class="mb-2">
    {$displayCompanyName} is scheduled to release its earnings on {new Date(
      blogData?.date ?? null,
    )?.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Europe/Berlin",
    })},
    {#if compareTimes(blogData?.time, "16:00") > 0}
      after market closes.
    {:else if compareTimes(blogData?.time, "09:30") < 0}
      before market opens.
    {:else}
      during market hours.
    {/if}
    <br />Analysts project revenue of

    <span class=""
      >{@html abbreviateNumber(blogData?.revenueEst, true, true)}</span
    >, reflecting a
    <span
      class="{revenueRatio >= 0 && revenueRatio !== 'Infinity'
        ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
        : revenueRatio < 0 && revenueRatio !== 'Infinity'
          ? 'text-red-800 dark:text-[#FF2F1F]'
          : 'text-muted dark:text-white'} "
      >{revenueRatio !== "Infinity"
        ? abbreviateNumber(revenueRatio) + "%"
        : "n/a"}</span
    >
    YoY {revenueRatio > 0 ? "growth" : revenueRatio < 0 ? "shrinking" : ""}
    {#if epsRatio !== null}
      and earnings per share of
      <span class="">{blogData?.epsEst}</span>, making a
      <span
        class="{epsRatio > 0
          ? "before:content-['+'] text-green-800 dark:text-[#00FC50]"
          : 'text-red-800 dark:text-[#FF2F1F]'} ">{epsRatio}%</span
      >
      {epsRatio > 0 ? "increase" : epsRatio < 0 ? "decrease" : ""} YoY.
    {:else}
      and earnings per share of
      <span class="">{blogData?.epsEst}</span>.
    {/if}
  </p>
</div>
