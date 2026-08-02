<script lang="ts">
  import { stockTicker, displayCompanyName } from "$lib/store";
  import { abbreviateNumber } from "$lib/utils";
  import { formatDate } from "$lib/i18n/format";
  import * as m from "$lib/paraglide/messages";
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

  function marketTimingLabel(time) {
    if (compareTimes(time, "16:00") > 0) return m.blog_intro_timing_after();
    if (compareTimes(time, "09:30") < 0) return m.blog_intro_timing_before();
    return m.blog_intro_timing_during();
  }

  $: releaseDate = blogData?.date
    ? formatDate(
        new Date(blogData.date),
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "Europe/Berlin",
        },
      )
    : m.blog_not_available();
</script>

<div
  class="mb-6 rounded border-l-4 border-[#2C6288] bg-[#f3f4f6] dark:bg-table/60 px-5 py-3"
>
  <p class="mb-2">
    {m.blog_intro_release({
      company: $displayCompanyName,
      date: releaseDate,
      timing: marketTimingLabel(blogData?.time),
    })}
    <br />{m.blog_intro_analysts_project_revenue()}

    <span class=""
      >{@html abbreviateNumber(blogData?.revenueEst, true, true)}</span
    >, reflecting a
    <span
      class="{revenueRatio >= 0 && revenueRatio !== 'Infinity'
        ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
        : revenueRatio < 0 && revenueRatio !== 'Infinity'
          ? 'text-rose-800 dark:text-rose-400'
          : 'text-muted dark:text-white'} "
      >{revenueRatio !== "Infinity"
        ? abbreviateNumber(revenueRatio) + "%"
        : m.blog_not_available()}</span
    >
    {m.blog_intro_reflecting()}
    {revenueRatio > 0
      ? m.blog_intro_yoy_growth()
      : revenueRatio < 0
        ? m.blog_intro_yoy_contraction()
        : m.blog_intro_yoy_unchanged()}
    {#if epsRatio !== null}
      {m.blog_intro_and_eps()}
      <span class="">{blogData?.epsEst}</span>, {m.blog_intro_representing()}
      <span
        class="{epsRatio > 0
          ? "before:content-['+'] text-emerald-800 dark:text-emerald-400"
          : 'text-rose-800 dark:text-rose-400'} ">{epsRatio}%</span
      >
      {epsRatio > 0
        ? m.blog_intro_yoy_increase()
        : epsRatio < 0
          ? m.blog_intro_yoy_decrease()
          : m.blog_intro_yoy_no_change()}
    {:else}
      {m.blog_intro_and_eps()}
      <span class="">{blogData?.epsEst}</span>.
    {/if}
  </p>
</div>
