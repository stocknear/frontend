<script lang="ts">
  import Infobox from "$lib/components/Infobox.svelte";
  import {
    dashboard_analyst_report_change_prefix,
    dashboard_analyst_report_change_suffix,
    dashboard_analyst_report_empty,
    dashboard_analyst_report_forecast_prefix,
    dashboard_analyst_report_prefix,
    dashboard_analyst_report_rating,
    dashboard_analyst_report_row_change,
    dashboard_analyst_report_row_price,
    dashboard_analyst_report_table_avg,
    dashboard_analyst_report_table_high,
    dashboard_analyst_report_table_low,
    dashboard_analyst_report_table_median,
    dashboard_analyst_report_table_target,
    dashboard_analyst_report_title,
    dashboard_direction_decrease,
    dashboard_direction_increase,
  } from "$lib/paraglide/messages.js";

  export let analystReport;

  $: changeDirection =
    analystReport?.highPriceChange > 0
      ? dashboard_direction_increase()
      : dashboard_direction_decrease();
</script>

<section class="mx-auto lg:col-span-2 w-full text-gray-700 dark:text-zinc-200">
  <h2
    class="mb-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-white"
  >
    {dashboard_analyst_report_title()}
  </h2>

  {#if Object?.keys(analystReport)?.length > 0}
    <div
      class="text-sm sm:text-base leading-6 text-gray-600 dark:text-zinc-300"
    >
      {analystReport?.insight}
    </div>

    <div class="mt-4 text-sm text-gray-700 dark:text-zinc-200">
      {dashboard_analyst_report_prefix({
        count: analystReport?.numOfAnalyst,
      })}
      <a
        href={`/stocks/${analystReport?.symbol}/forecast`}
        class="sm:hover:text-muted dark:sm:hover:text-white text-violet-800 dark:text-violet-400"
        >{analystReport?.symbol}</a
      >
      {dashboard_analyst_report_rating({
        rating: analystReport?.consensusRating,
      })}
      {dashboard_analyst_report_forecast_prefix()}
      <strong class="text-gray-900 dark:text-white"
        >${analystReport?.highPriceTarget}</strong
      >, {dashboard_analyst_report_change_prefix({
        direction: changeDirection,
      })}
      <strong
        class={analystReport?.highPriceChange > 0
          ? "text-emerald-800 dark:text-emerald-400"
          : "text-rose-800 dark:text-rose-400"}
        >{Math.abs(analystReport?.highPriceChange ?? 0)}%</strong
      >
      {dashboard_analyst_report_change_suffix()}
    </div>

    <table class="w-full text-right text-sm mt-5">
      <thead class="">
        <tr
          class="border-b border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-zinc-300"
        >
          <th class="py-2 text-left uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_target()}
          </th>
          <th class=" uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_low()}
          </th>
          <th class=" uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_avg()}
          </th>
          <th class=" uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_median()}
          </th>
          <th class=" uppercase tracking-widest text-xs">
            {dashboard_analyst_report_table_high()}
          </th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr class="border-b border-gray-300 dark:border-zinc-700">
          <td class="py-2 text-left text-gray-700 dark:text-zinc-200">
            {dashboard_analyst_report_row_price()}
          </td>
          <td class="text-gray-600 dark:text-zinc-300"
            >${analystReport?.lowPriceTarget}</td
          >
          <td class="text-gray-600 dark:text-zinc-300"
            >${analystReport?.avgPriceTarget}</td
          >
          <td class="text-gray-600 dark:text-zinc-300"
            >${analystReport?.medianPriceTarget}</td
          >
          <td class="text-gray-600 dark:text-zinc-300"
            >${analystReport?.highPriceTarget}</td
          >
        </tr>
        <tr>
          <td class="py-2 text-left text-gray-700 dark:text-zinc-200">
            {dashboard_analyst_report_row_change()}
          </td>
          <td
            class={analystReport?.lowPriceChange > 0
              ? "before:content-['+'] text-emerald-800 dark:text-emerald-400 "
              : "text-rose-800 dark:text-rose-400 "}
          >
            {analystReport?.lowPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.avgPriceChange > 0
              ? "before:content-['+'] text-emerald-800 dark:text-emerald-400 "
              : "text-rose-800 dark:text-rose-400 "}
          >
            {analystReport?.avgPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.medianPriceChange > 0
              ? "before:content-['+'] text-emerald-800 dark:text-emerald-400 "
              : "text-rose-800 dark:text-rose-400 "}
          >
            {analystReport?.medianPriceChange ?? "0"}%
          </td>
          <td
            class={analystReport?.highPriceChange > 0
              ? "before:content-['+'] text-emerald-800 dark:text-emerald-400 "
              : "text-rose-800 dark:text-rose-400 "}
          >
            {analystReport?.highPriceChange ?? "0"}%
          </td>
        </tr>
      </tbody>
    </table>
  {:else}
    <Infobox text={dashboard_analyst_report_empty()} />
  {/if}
</section>
